<?php

namespace App\Console\Commands;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ImportLegacyDatabase extends Command
{
    protected $signature = 'legacy:import
        {--legacy-db=ayodekco_swo2 : Database name from the old app dump}
        {--replace : Replace current core operational data before importing}
        {--dry-run : Show counts and mapping without writing data}
        {--force : Skip confirmation prompt when used with --replace}';

    protected $description = 'Import old Shofi Wedding database data into the current schema.';

    private array $coreTables = [
        'notification_reads',
        'client_activity_logs',
        'failed_jobs',
        'jobs',
        'job_batches',
        'dynamic_forms',
        'dynamic_form_templates',
        'event_additional_costs',
        'event_photos',
        'item_photos',
        'item_variants',
        'event_item',
        'payments',
        'schedules',
        'items',
        'item_types',
        'events',
    ];

    public function handle(): int
    {
        $legacyDb = (string) $this->option('legacy-db');
        $dryRun = (bool) $this->option('dry-run');
        $replace = (bool) $this->option('replace');

        if (!$this->legacyDatabaseExists($legacyDb)) {
            $this->error("Legacy database [{$legacyDb}] tidak ditemukan.");
            return self::FAILURE;
        }

        $counts = $this->legacyCounts($legacyDb);
        $this->table(['Legacy table', 'Rows'], collect($counts)->map(fn ($count, $table) => [$table, $count])->all());

        $this->line('');
        $this->info('Mapping:');
        $this->line('- users/pegawai sekarang dipertahankan');
        $this->line('- events -> events, discount_amount default 0');
        $this->line('- payments -> payments, operational_cut default 0, bukti bayar dari files Payment pertama');
        $this->line('- schedules -> schedules, prospect fields default null');
        $this->line('- items -> items, rental fields default 0, is_rentable default true');
        $this->line('- files Item -> item_photos path catalog/{filename}');
        $this->line('- dynamic_form_inputs -> dynamic_form_templates');
        $this->line('- event_dynamic_form JSON -> dynamic_forms per client');

        if ($dryRun) {
            $this->warn('Dry run selesai. Tidak ada data yang diubah.');
            return self::SUCCESS;
        }

        if (!$replace) {
            $this->error('Import write membutuhkan opsi --replace agar tidak merge diam-diam dengan data dummy/current.');
            return self::FAILURE;
        }

        if (!$this->option('force') && !$this->confirm('Replace data core aplikasi dengan data legacy sekarang?', false)) {
            $this->warn('Dibatalkan.');
            return self::SUCCESS;
        }

        try {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
            foreach ($this->coreTables as $table) {
                DB::table($table)->truncate();
            }
            DB::statement('SET FOREIGN_KEY_CHECKS=1');

            $this->importItemTypes($legacyDb);
            $this->importItems($legacyDb);
            $this->importEvents($legacyDb);
            $this->importEventItems($legacyDb);
            $this->importPayments($legacyDb);
            $this->importSchedules($legacyDb);
            $this->importDynamicForms($legacyDb);
            $this->syncAutoIncrement($legacyDb);
        } finally {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }

        $this->info('Import legacy selesai.');

        return self::SUCCESS;
    }

    private function legacyDatabaseExists(string $legacyDb): bool
    {
        return DB::table('information_schema.schemata')
            ->where('schema_name', $legacyDb)
            ->exists();
    }

    private function legacyCounts(string $legacyDb): array
    {
        $tables = ['users', 'events', 'payments', 'schedules', 'items', 'item_types', 'event_item', 'files', 'dynamic_form_inputs', 'event_dynamic_form'];

        return collect($tables)
            ->mapWithKeys(fn ($table) => [$table => DB::table("{$legacyDb}.{$table}")->count()])
            ->all();
    }

    private function importItemTypes(string $legacyDb): void
    {
        $this->line('Import item types...');

        DB::table("{$legacyDb}.item_types")
            ->orderBy('id')
            ->chunk(500, function ($types) {
                DB::table('item_types')->insert($types->map(fn ($type) => [
                    'id' => $type->id,
                    'name' => $type->name,
                    'created_at' => $this->legacyTimestamp($type->created_at),
                    'updated_at' => $this->legacyTimestamp($type->updated_at),
                ])->all());
            });

        foreach (['Kebaya', 'Basofi'] as $name) {
            DB::table('item_types')->updateOrInsert(
                ['name' => $name],
                ['created_at' => now(), 'updated_at' => now()],
            );
        }
    }

    private function importItems(string $legacyDb): void
    {
        $this->line('Import items...');
        $validUserIds = $this->validUserIds();

        DB::table("{$legacyDb}.items")
            ->orderBy('id')
            ->chunk(500, function ($items) use ($validUserIds) {
                DB::table('items')->insert($items->map(fn ($item) => [
                    'id' => $item->id,
                    'code' => $item->code,
                    'name' => $item->name,
                    'description' => $item->description,
                    'item_type_id' => $item->item_type_id,
                    'is_sold' => $item->is_sold,
                    'is_rentable' => true,
                    'is_premium' => $item->is_premium,
                    'premium_level' => $item->is_premium ? 'premium' : 'standart',
                    'image_path' => null,
                    'rental_price' => 0,
                    'package_rental_price' => 0,
                    'created_by' => $this->validUserId($item->created_by, $validUserIds),
                    'deleted_at' => $this->legacyTimestamp($item->deleted_at),
                    'created_at' => $this->legacyTimestamp($item->created_at),
                    'updated_at' => $this->legacyTimestamp($item->updated_at),
                ])->all());

                DB::table('item_variants')->insert($items->map(fn ($item) => [
                    'item_id' => $item->id,
                    'size' => 'Default',
                    'stock' => $item->is_sold ? 0 : 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ])->all());
            });

        DB::table("{$legacyDb}.files")
            ->where('uploadable_type', 'App\\Models\\Item')
            ->orderBy('id')
            ->chunk(500, function ($files) {
                $validItemIds = DB::table('items')
                    ->whereIn('id', $files->pluck('uploadable_id')->unique())
                    ->pluck('id')
                    ->all();

                $rows = $files
                    ->whereIn('uploadable_id', $validItemIds)
                    ->map(fn ($file) => [
                        'item_id' => $file->uploadable_id,
                        'path' => 'catalog/'.$file->filename,
                        'original_name' => $file->filename,
                        'created_by' => null,
                        'created_at' => $this->legacyTimestamp($file->created_at),
                        'updated_at' => $this->legacyTimestamp($file->updated_at),
                    ])
                    ->values()
                    ->all();

                if ($rows) {
                    DB::table('item_photos')->insert($rows);
                }
            });
    }

    private function importEvents(string $legacyDb): void
    {
        $this->line('Import clients/events...');
        $validUserIds = $this->validUserIds();

        DB::table("{$legacyDb}.events")
            ->orderBy('id')
            ->chunk(500, function ($events) use ($validUserIds) {
                DB::table('events')->insert($events->map(fn ($event) => [
                    'id' => $event->id,
                    'name' => $event->name,
                    'mobile_phone' => $event->mobile_phone,
                    'date' => $event->date,
                    'time' => $event->time,
                    'address' => $event->address,
                    'location' => $event->location,
                    'package_description' => $event->package_description,
                    'total_amount' => $event->total_amount,
                    'discount_amount' => 0,
                    'order_type' => $event->order_type,
                    'is_fully_paid' => $event->is_fully_paid,
                    'uuid' => $event->uuid ?: (string) Str::uuid(),
                    'google_event_id' => $this->nullableGoogleEventId($event->google_event_id),
                    'google_sync_status' => $this->googleSyncStatus($event->google_event_id, $event->deleted_at),
                    'google_sync_attempts' => 0,
                    'google_synced_at' => $this->googleSyncedAt($event->google_event_id, $event->updated_at),
                    'google_sync_error' => null,
                    'created_by' => $this->validUserId($event->created_by, $validUserIds),
                    'deleted_at' => $this->legacyTimestamp($event->deleted_at),
                    'created_at' => $this->legacyTimestamp($event->created_at),
                    'updated_at' => $this->legacyTimestamp($event->updated_at),
                ])->all());
            });
    }

    private function importEventItems(string $legacyDb): void
    {
        $this->line('Import selected catalog items...');

        DB::table("{$legacyDb}.event_item")
            ->orderBy('event_id')
            ->chunk(500, function ($items) {
                DB::table('event_item')->insert($items->map(fn ($item) => [
                    'event_id' => $item->event_id,
                    'item_id' => $item->item_id,
                ])->all());
            });
    }

    private function importPayments(string $legacyDb): void
    {
        $this->line('Import payments...');
        $validUserIds = $this->validUserIds();

        $receiptFiles = DB::table("{$legacyDb}.files")
            ->where('uploadable_type', 'App\\Models\\Payment')
            ->orderBy('id')
            ->get()
            ->groupBy('uploadable_id')
            ->map(fn ($files) => 'receipts/'.$files->first()->filename);

        DB::table("{$legacyDb}.payments")
            ->orderBy('id')
            ->chunk(500, function ($payments) use ($receiptFiles, $validUserIds) {
                DB::table('payments')->insert($payments->map(fn ($payment) => [
                    'id' => $payment->id,
                    'event_id' => $payment->event_id,
                    'is_expense' => $payment->is_expense,
                    'type' => $payment->type,
                    'payment_at' => $payment->payment_at,
                    'payment_type' => $payment->payment_type,
                    'amount' => $payment->amount,
                    'operational_cut' => 0,
                    'receipt_image' => $receiptFiles->get($payment->id),
                    'description' => $payment->description,
                    'status' => $this->mapPaymentStatus((int) $payment->status),
                    'created_by' => $this->validUserId($payment->created_by, $validUserIds),
                    'deleted_at' => $this->legacyTimestamp($payment->deleted_at),
                    'created_at' => $this->legacyTimestamp($payment->created_at),
                    'updated_at' => $this->legacyTimestamp($payment->updated_at),
                ])->all());
            });
    }

    private function importSchedules(string $legacyDb): void
    {
        $this->line('Import schedules...');
        $validUserIds = $this->validUserIds();

        DB::table("{$legacyDb}.schedules")
            ->orderBy('id')
            ->chunk(500, function ($schedules) use ($validUserIds) {
                DB::table('schedules')->insert($schedules->map(fn ($schedule) => [
                    'id' => $schedule->id,
                    'event_id' => $schedule->event_id,
                    'type' => $schedule->type,
                    'schedule_from' => $schedule->schedule_from,
                    'schedule_to' => $schedule->schedule_to,
                    'prospect_name' => null,
                    'prospect_mobile_phone' => null,
                    'description' => $schedule->description,
                    'google_event_id' => $this->nullableGoogleEventId($schedule->google_event_id),
                    'google_sync_status' => $this->googleSyncStatus($schedule->google_event_id, $schedule->deleted_at),
                    'google_sync_attempts' => 0,
                    'google_synced_at' => $this->googleSyncedAt($schedule->google_event_id, $schedule->updated_at),
                    'google_sync_error' => null,
                    'created_by' => $this->validUserId($schedule->created_by, $validUserIds),
                    'deleted_at' => $this->legacyTimestamp($schedule->deleted_at),
                    'created_at' => $this->legacyTimestamp($schedule->created_at),
                    'updated_at' => $this->legacyTimestamp($schedule->updated_at),
                ])->all());
            });
    }

    private function importDynamicForms(string $legacyDb): void
    {
        $this->line('Import dynamic forms...');

        $allInputs = DB::table("{$legacyDb}.dynamic_form_inputs")
            ->orderBy('order')
            ->get()
            ->keyBy('id');

        $activeInputs = DB::table("{$legacyDb}.dynamic_form_inputs")
            ->whereNull('deleted_at')
            ->orderBy('order')
            ->get()
            ->keyBy('id');

        DB::table('dynamic_form_templates')->insert($activeInputs->map(fn ($input) => [
            'field_name' => $this->fieldName($input->id, $input->label),
            'field_label' => $input->label,
            'field_type' => $this->fieldType((int) $input->type, $input->options),
            'field_options' => $input->options,
            'is_required' => str_contains((string) $input->options, '"required":true'),
            'sort_order' => $input->order,
            'created_at' => $this->legacyTimestamp($input->created_at),
            'updated_at' => $this->legacyTimestamp($input->updated_at),
        ])->values()->all());

        DB::table("{$legacyDb}.event_dynamic_form")
            ->orderBy('event_id')
            ->chunk(200, function ($forms) use ($allInputs) {
                $rows = [];

                foreach ($forms as $form) {
                    $values = json_decode((string) $form->value, true);

                    if (!is_array($values)) {
                        continue;
                    }

                    foreach ($values as $value) {
                        $inputId = $value['id'] ?? null;

                        if (!$inputId || !$allInputs->has($inputId)) {
                            continue;
                        }

                        $input = $allInputs->get($inputId);

                        $rows[] = [
                            'event_id' => $form->event_id,
                            'field_name' => $this->fieldName($input->id, $input->label),
                            'field_label' => $input->label,
                            'field_type' => $this->fieldType((int) $input->type, $input->options),
                            'field_options' => $input->options,
                            'field_value' => is_array($value['value'] ?? null) ? json_encode($value['value']) : ($value['value'] ?? null),
                            'is_required' => str_contains((string) $input->options, '"required":true'),
                            'sort_order' => $input->order,
                            'created_at' => $this->legacyTimestamp($form->created_at),
                            'updated_at' => $this->legacyTimestamp($form->updated_at),
                        ];
                    }
                }

                foreach (array_chunk($rows, 500) as $chunk) {
                    DB::table('dynamic_forms')->insert($chunk);
                }
            });
    }

    private function syncAutoIncrement(string $legacyDb): void
    {
        foreach (['events', 'items', 'payments', 'schedules', 'item_types'] as $table) {
            $nextId = max(
                (int) DB::table($table)->max('id'),
                (int) DB::table("{$legacyDb}.{$table}")->max('id'),
            ) + 1;

            DB::statement("ALTER TABLE {$table} AUTO_INCREMENT = {$nextId}");
        }
    }

    private function validUserIds(): array
    {
        return DB::table('users')->pluck('id')->map(fn ($id) => (int) $id)->all();
    }

    private function validUserId(null|int|string $userId, array $validUserIds): ?int
    {
        $userId = $userId === null ? null : (int) $userId;

        return $userId && in_array($userId, $validUserIds, true) ? $userId : null;
    }

    private function mapPaymentStatus(int $status): int
    {
        return match ($status) {
            0 => 0, // Pending
            1 => 1, // Dikonfirmasi
            2 => 2, // Ditolak
            default => 0,
        };
    }

    private function fieldName(int $id, string $label): string
    {
        return 'legacy_'.$id.'_'.Str::slug($label, '_');
    }

    private function legacyTimestamp(mixed $value): ?string
    {
        if (!$value) {
            return null;
        }

        return Carbon::parse($value)->subHours(7)->format('Y-m-d H:i:s');
    }

    private function nullableGoogleEventId(mixed $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    private function googleSyncStatus(mixed $googleEventId, mixed $deletedAt): string
    {
        if ($deletedAt) {
            return 'deleted';
        }

        return $this->nullableGoogleEventId($googleEventId) ? 'synced' : 'pending';
    }

    private function googleSyncedAt(mixed $googleEventId, mixed $updatedAt): ?string
    {
        if (! $this->nullableGoogleEventId($googleEventId)) {
            return null;
        }

        return $this->legacyTimestamp($updatedAt) ?? now()->format('Y-m-d H:i:s');
    }

    private function fieldType(int $type, ?string $options): string
    {
        if ($type === 2) {
            return 'textarea';
        }

        if ($type === 3) {
            return 'select';
        }

        if ($type === 5 && str_contains((string) $options, '"format":"time"')) {
            return 'time';
        }

        if ($type === 5) {
            return 'date';
        }

        return 'text';
    }
}
