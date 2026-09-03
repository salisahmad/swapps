<?php

namespace App\Http\Controllers;

use App\Models\ClientActivityLog;
use App\Models\Event;
use App\Models\EventAdditionalCost;
use App\Models\Item;
use App\Models\Payment;
use App\Services\TelegramNotification;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Intervention\Image\Laravel\Facades\Image;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Event::with('additionalCosts');

        // Search
        if ($request->filled('q')) {
            $search = $request->q;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('mobile_phone', 'like', '%'.$search.'%');
            });
        }

        // Date range. Default list starts after today; past clients stay available via range filter.
        $query->whereDate('date', '>=', $request->filled('date_from') ? $request->date_from : now()->addDay()->toDateString());

        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        // Paid status
        if ($request->filled('paid')) {
            $query->where('is_fully_paid', $request->paid === '1');
        }

        // Filter by order type (MUA/Sewa Gaun)
        if ($request->filled('order_type')) {
            $query->where('order_type', $request->order_type);
        }

        $events = $query
            ->orderBy('date')
            ->orderBy('time')
            ->orderBy('name')
            ->paginate(25)
            ->withQueryString();
        if (auth()->user()->isLimitedStaff()) {
            $events->through(function (Event $event) {
                $data = $event->toArray();
                $data['total_amount'] = null;
                $data['grand_total'] = null;
                $data['is_fully_paid'] = null;
                $data['paid_status_name'] = null;
                $data['paid_status_tone'] = null;
                unset($data['additional_costs'], $data['additional_cost_total']);

                return $data;
            });
        }

        return Inertia::render('Events/Index', [
            'events' => $events,
            'filters' => $request->only(['q', 'date_from', 'date_to', 'paid', 'order_type']),
            'authUser' => [
                'id' => auth()->id(),
                'role' => auth()->user()->role,
                'is_limited_staff' => auth()->user()->isLimitedStaff(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Events/Create', [
            'items' => Item::with(['type', 'variants'])
                ->where('is_sold', false)
                ->orderBy('code')
                ->take(20)
                ->get(),
        ]);
    }

    public function byDate(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'exclude' => 'nullable|string',
        ]);

        $query = Event::whereDate('date', $request->date)
            ->orderBy('time')
            ->orderBy('name');

        if ($request->filled('exclude')) {
            $query->where('uuid', '!=', $request->exclude);
        }

        return response()->json(
            $query->get(['id', 'uuid', 'name', 'date', 'time'])
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'mobile_phone' => 'required|string|max:20',
            'date' => 'required|date|after_or_equal:tomorrow',
            'time' => 'nullable',
            'address' => 'nullable|string',
            'location' => 'nullable|string',
            'package_description' => 'nullable|string',
            'total_amount' => 'required|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'order_type' => 'required|integer|in:1,2,3',
            'item_ids' => 'nullable|array',
            'item_ids.*' => 'exists:items,id',
            'down_payment' => 'required|numeric|min:0',
            'down_payment_type' => 'required|integer|in:0,1,2,3,4,5',
            'down_payment_receipt_image' => 'nullable|image|max:5120',
            'additional_costs' => 'nullable|array',
            'additional_costs.*.type' => 'required_with:additional_costs|string|in:'.implode(',', EventAdditionalCost::TYPES),
            'additional_costs.*.total' => 'nullable|numeric|min:0',
            'additional_costs.*.notes' => 'nullable|string',
        ]);

        $lock = Cache::lock('client-create:'.$this->duplicateClientKey($validated), 10);

        try {
            $lock->block(5);
        } catch (LockTimeoutException) {
            throw ValidationException::withMessages([
                'name' => 'Client sedang diproses. Tunggu sebentar lalu cek daftar client sebelum menyimpan ulang.',
            ]);
        }

        try {
            $this->ensureNoDuplicateClient($validated);

            $itemIds = $this->itemIdsForOrder($validated);
            $eventData = collect($validated)->except(['item_ids', 'down_payment', 'down_payment_type', 'additional_costs'])->all();
            $eventData['discount_amount'] = $eventData['discount_amount'] ?? 0;

            $event = Event::create([
                ...$eventData,
                'uuid' => (string) Str::uuid(),
                'created_by' => auth()->id(),
            ]);

            if (! empty($itemIds)) {
                $event->items()->attach($itemIds);
            }

            $this->syncAdditionalCosts($event, $validated['additional_costs'] ?? []);

            if ($validated['down_payment'] > 0) {
                $receiptPath = null;
                if ($request->hasFile('down_payment_receipt_image')) {
                    $receiptPath = $this->compressAndStoreReceiptImage($request->file('down_payment_receipt_image'));
                }

                $payment = Payment::create([
                    'event_id' => $event->id,
                    'is_expense' => Payment::EARNING,
                    'payment_at' => now(),
                    'payment_type' => $validated['down_payment_type'],
                    'amount' => $validated['down_payment'],
                    'operational_cut' => 0,
                    'receipt_image' => $receiptPath,
                    'description' => 'DP awal client',
                    'status' => auth()->user()->isStaff() ? Payment::STATUS_PENDING : Payment::STATUS_CONFIRMED,
                    'created_by' => auth()->id(),
                ]);

                $event->update([
                    'is_fully_paid' => $validated['down_payment'] >= $event->fresh()->grand_total,
                ]);

                $this->logClientActivity(
                    $event,
                    ClientActivityLog::TYPE_PAYMENT_CHANGED,
                    'DP awal client dicatat.',
                    null,
                    [
                        'payment_id' => $payment->id,
                        'amount' => $payment->amount,
                        'status' => $payment->status_name,
                    ],
                );
            }

            $this->logClientActivity(
                $event,
                ClientActivityLog::TYPE_CREATED,
                'Client dibuat.',
                null,
                [
                    'name' => $event->name,
                    'date' => $event->date?->format('Y-m-d'),
                    'total_amount' => $event->total_amount,
                    'discount_amount' => $event->discount_amount,
                    'grand_total' => $event->fresh()->grand_total,
                ],
            );

            return redirect()->route('events.show', $event)->with('success', 'Client berhasil dibuat.');
        } finally {
            $lock->release();
        }
    }

    public function show(Event $event): Response
    {
        $relations = [
            'items.type',
            'dynamicForms',
            'items.variants',
            'schedules',
            'photos',
        ];

        if (! auth()->user()->isLimitedStaff()) {
            $relations[] = 'additionalCosts';
            $relations['payments'] = function ($q) {
                $q->orderBy('created_at', 'desc');
            };
        }

        if (auth()->user()->isAdmin()) {
            $relations['activityLogs'] = function ($q) {
                $q->with('user:id,name')->latest();
            };
        }

        $loadedEvent = $event->load($relations);
        if (auth()->user()->isLimitedStaff()) {
            $eventData = $loadedEvent->toArray();
            $eventData['total_amount'] = null;
            $eventData['discount_amount'] = null;
            $eventData['additional_cost_total'] = null;
            $eventData['grand_total'] = null;
            $eventData['is_fully_paid'] = null;
            $eventData['paid_status_name'] = null;
            $eventData['paid_status_tone'] = null;
            $eventData['payments'] = [];
            $eventData['additional_costs'] = [];
        } else {
            $eventData = $loadedEvent;
        }

        return Inertia::render('Events/Show', [
            'event' => $eventData,
            'authUser' => [
                'id' => auth()->id(),
                'role' => auth()->user()->role,
                'is_admin' => auth()->user()->isAdmin(),
                'is_limited_staff' => auth()->user()->isLimitedStaff(),
            ],
        ]);
    }

    public function edit(Event $event): Response
    {
        $selectedItemQuery = $event->items()->where('is_sold', false);
        if ($event->order_type === Event::ORDER_TYPE_GOWN) {
            $selectedItemQuery->where('is_rentable', true);
        }

        $selectedItemIds = $selectedItemQuery->pluck('items.id');

        return Inertia::render('Events/Edit', [
            'event' => $event->load([
                'additionalCosts',
                'items' => function ($q) use ($event) {
                    $q->where('is_sold', false)
                        ->with('variants');

                    if ($event->order_type === Event::ORDER_TYPE_GOWN) {
                        $q->where('is_rentable', true);
                    }
                },
            ]),
            'items' => Item::with(['type', 'variants'])
                ->where(function ($q) use ($selectedItemIds, $event) {
                    $q->whereIn('id', $selectedItemIds)
                        ->orWhere(function ($available) {
                            $available->where('is_sold', false);
                        });

                    if ($event->order_type === Event::ORDER_TYPE_GOWN) {
                        $q->where('is_rentable', true);
                    }
                })
                ->orderBy('code')
                ->take(30)
                ->get(),
        ]);
    }

    public function update(Request $request, Event $event)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'mobile_phone' => 'required|string|max:20',
            'date' => 'required|date',
            'time' => 'nullable',
            'address' => 'nullable|string',
            'location' => 'nullable|string',
            'package_description' => 'nullable|string',
            'total_amount' => 'required|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'order_type' => 'required|integer|in:1,2,3',
            'item_ids' => 'nullable|array',
            'item_ids.*' => 'exists:items,id',
            'additional_costs' => 'nullable|array',
            'additional_costs.*.type' => 'required_with:additional_costs|string|in:'.implode(',', EventAdditionalCost::TYPES),
            'additional_costs.*.total' => 'nullable|numeric|min:0',
            'additional_costs.*.notes' => 'nullable|string',
        ]);

        $this->ensureNoDuplicateClient($validated, $event);

        $oldTotal = $event->total_amount;
        $oldDiscount = $event->discount_amount;
        $oldAdditionalCostTotal = $event->additional_cost_total;
        $oldGrandTotal = $event->grand_total;
        $oldDate = $event->date?->format('Y-m-d');

        $itemIds = $this->itemIdsForOrder($validated);
        $eventData = collect($validated)->except(['item_ids', 'additional_costs'])->all();
        $eventData['discount_amount'] = $eventData['discount_amount'] ?? 0;

        $event->update($eventData);
        $this->syncAdditionalCosts($event, $validated['additional_costs'] ?? []);
        $event->refresh();

        $event->items()->sync($itemIds);

        $newGrandTotal = $event->grand_total;
        if (
            (float) $oldTotal !== (float) $event->total_amount
            || (float) $oldDiscount !== (float) $event->discount_amount
            || (float) $oldAdditionalCostTotal !== (float) $event->additional_cost_total
        ) {
            $this->logClientActivity(
                $event,
                ClientActivityLog::TYPE_TOTAL_CHANGED,
                'Total harga client diubah.',
                [
                    'total_amount' => (float) $oldTotal,
                    'additional_cost_total' => (float) $oldAdditionalCostTotal,
                    'discount_amount' => (float) $oldDiscount,
                    'grand_total' => (float) $oldGrandTotal,
                ],
                [
                    'total_amount' => (float) $event->total_amount,
                    'additional_cost_total' => (float) $event->additional_cost_total,
                    'discount_amount' => (float) $event->discount_amount,
                    'grand_total' => (float) $newGrandTotal,
                ],
            );
        }

        $this->updateEventPaidStatus($event);

        $newDate = $event->date?->format('Y-m-d');
        if ($oldDate !== $newDate) {
            $this->logClientActivity(
                $event,
                ClientActivityLog::TYPE_DATE_CHANGED,
                'Tanggal acara diubah.',
                ['date' => $oldDate],
                ['date' => $newDate],
            );
        }

        return redirect()->route('events.show', $event)->with('success', 'Client berhasil diupdate.');
    }

    public function destroy(Event $event)
    {
        if (auth()->user()->isStaff()) {
            if ($this->hasPendingDeleteRequest($event)) {
                return redirect()->route('events.show', $event)->with('success', 'Permintaan hapus client masih menunggu admin.');
            }

            $this->logClientActivity(
                $event,
                ClientActivityLog::TYPE_DELETE_REQUESTED,
                'Staff meminta konfirmasi admin untuk menghapus client.',
            );
            (new TelegramNotification())->notifyDeleteRequested($event);

            return redirect()->route('events.show', $event)->with('success', 'Permintaan hapus client dikirim ke admin.');
        }

        if (! auth()->user()->isAdmin()) {
            abort(403);
        }

        $this->logClientActivity(
            $event,
            ClientActivityLog::TYPE_DELETED,
            'Client dihapus.',
            [
                'name' => $event->name,
                'date' => $event->date?->format('Y-m-d'),
                'total_amount' => $event->grand_total,
            ],
        );

        $event->delete();

        return redirect()->route('events.index')->with('success', 'Client berhasil dihapus.');
    }

    public function approveDelete(Event $event)
    {
        if (! auth()->user()->isAdmin()) {
            abort(403);
        }

        if (! $this->hasPendingDeleteRequest($event)) {
            return redirect()->route('events.show', $event)->with('success', 'Tidak ada request hapus yang perlu dikonfirmasi.');
        }

        $this->logClientActivity(
            $event,
            ClientActivityLog::TYPE_DELETE_APPROVED,
            'Admin mengkonfirmasi request hapus client.',
        );

        $this->logClientActivity(
            $event,
            ClientActivityLog::TYPE_DELETED,
            'Client dihapus setelah request staff disetujui.',
            [
                'name' => $event->name,
                'date' => $event->date?->format('Y-m-d'),
                'total_amount' => $event->grand_total,
            ],
        );

        $event->delete();

        return redirect()->route('events.index')->with('success', 'Request hapus disetujui. Client berhasil dihapus.');
    }

    private function logClientActivity(Event $event, string $type, string $message, ?array $before = null, ?array $after = null): void
    {
        ClientActivityLog::create([
            'event_id' => $event->id,
            'user_id' => auth()->id(),
            'type' => $type,
            'message' => $message,
            'before' => $before,
            'after' => $after,
        ]);
    }

    private function hasPendingDeleteRequest(Event $event): bool
    {
        $lastDeleteLog = $event->activityLogs()
            ->whereIn('type', [
                ClientActivityLog::TYPE_DELETE_REQUESTED,
                ClientActivityLog::TYPE_DELETE_APPROVED,
                ClientActivityLog::TYPE_DELETE_REJECTED,
            ])
            ->latest()
            ->first();

        return $lastDeleteLog?->type === ClientActivityLog::TYPE_DELETE_REQUESTED;
    }

    private function syncAdditionalCosts(Event $event, array $additionalCosts): void
    {
        $cleanCosts = collect($additionalCosts)
            ->map(fn ($cost) => [
                'type' => $cost['type'] ?? '',
                'total' => max(0, (float) ($cost['total'] ?? 0)),
                'notes' => $cost['notes'] ?? null,
            ])
            ->filter(fn ($cost) => $cost['type'] !== '' && $cost['total'] > 0)
            ->values();

        $event->additionalCosts()->delete();

        $cleanCosts->each(function ($cost) use ($event) {
            $event->additionalCosts()->create($cost);
        });
    }

    private function itemIdsForOrder(array $validated): array
    {
        $orderType = (int) $validated['order_type'];

        if (! in_array($orderType, [Event::ORDER_TYPE_MUA, Event::ORDER_TYPE_GOWN], true)) {
            return [];
        }

        $itemIds = collect($validated['item_ids'] ?? [])
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        if ($itemIds->isEmpty()) {
            return [];
        }

        $validItemQuery = Item::whereIn('id', $itemIds)
            ->where('is_sold', false);

        if ($orderType === Event::ORDER_TYPE_GOWN) {
            $validItemQuery->where('is_rentable', true);
        }

        $validItemIds = $validItemQuery->pluck('id')->all();

        if (count($validItemIds) !== $itemIds->count()) {
            $message = $orderType === Event::ORDER_TYPE_GOWN
                ? 'Client Sewa Gaun hanya bisa memilih item katalog yang statusnya disewakan dan tersedia.'
                : 'Client MUA hanya bisa memilih item katalog yang tersedia.';

            throw ValidationException::withMessages([
                'item_ids' => $message,
            ]);
        }

        return $validItemIds;
    }

    private function ensureNoDuplicateClient(array $validated, ?Event $ignoreEvent = null): void
    {
        $duplicate = Event::query()
            ->whereNull('deleted_at')
            ->whereDate('date', $validated['date'])
            ->when($ignoreEvent, fn ($query) => $query->whereKeyNot($ignoreEvent->id))
            ->whereRaw('LOWER(TRIM(name)) = ?', [$this->normalizedName($validated['name'])])
            ->whereRaw(
                "REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(mobile_phone, ' ', ''), '-', ''), '+', ''), '.', ''), '(', ''), ')', ''), '/', '') in (?, ?, ?)",
                $this->phoneVariants($validated['mobile_phone']),
            )
            ->first(['id', 'uuid', 'name', 'date']);

        if (! $duplicate) {
            return;
        }

        throw ValidationException::withMessages([
            'name' => "Client dengan nama, nomor telepon, dan tanggal acara yang sama sudah ada: {$duplicate->name}. Buka data lama tersebut, jangan simpan ulang.",
        ]);
    }

    private function duplicateClientKey(array $validated): string
    {
        return sha1(implode('|', [
            $this->normalizedName($validated['name']),
            $this->normalizedPhone($validated['mobile_phone']),
            $validated['date'],
        ]));
    }

    private function normalizedName(string $name): string
    {
        return strtolower(trim(preg_replace('/\s+/', ' ', $name)));
    }

    private function normalizedPhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone);

        if (str_starts_with($digits, '62')) {
            return '0'.substr($digits, 2);
        }

        if (str_starts_with($digits, '8')) {
            return '0'.$digits;
        }

        return $digits;
    }

    private function phoneVariants(string $phone): array
    {
        $normalized = $this->normalizedPhone($phone);

        if (! str_starts_with($normalized, '0')) {
            return [$normalized, $normalized, $normalized];
        }

        return [
            $normalized,
            '62'.substr($normalized, 1),
            substr($normalized, 1),
        ];
    }

    private function updateEventPaidStatus(Event $event): void
    {
        $paid = $event->payments()
            ->where('is_expense', Payment::EARNING)
            ->where('status', Payment::STATUS_CONFIRMED)
            ->sum('amount');

        $event->update(['is_fully_paid' => $paid >= $event->fresh()->grand_total]);
    }

    private function compressAndStoreReceiptImage($file): string
    {
        $image = Image::decodePath($file->getRealPath());
        $image->scaleDown(width: 800);

        $filename = 'receipts/' . uniqid() . '.jpg';

        Storage::disk('public')->makeDirectory('receipts');
        $stored = Storage::disk('public')->put($filename, $image->encodeUsingFileExtension('jpg', quality: 80));

        if (!$stored || !Storage::disk('public')->exists($filename)) {
            throw ValidationException::withMessages([
                'down_payment_receipt_image' => 'Bukti transfer DP gagal disimpan. Silakan upload ulang.',
            ]);
        }

        return $filename;
    }
}
