<?php

namespace App\Services;

use App\Models\EmployeeLeaveRequest;
use App\Models\TelegramSetting;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use App\Models\Event;
use App\Models\Payment;
use App\Models\Schedule;
use Illuminate\Support\Facades\Storage;

class TelegramNotification
{
    private ?string $botToken;
    private ?string $chatId;

    public function __construct()
    {
        $settings = TelegramSetting::getInstance();
        $this->botToken = $settings?->bot_token;
        $this->chatId = $settings?->chat_id;
    }

    public function isConfigured(): bool
    {
        return !empty($this->botToken) && !empty($this->chatId);
    }

    public function sendMessage(string $message, array $extraPayload = []): bool
    {
        if (!$this->isConfigured()) {
            return false;
        }

        try {
            $payload = array_merge([
                'chat_id' => $this->chatId,
                'text' => $message,
                'parse_mode' => 'HTML',
                'disable_web_page_preview' => true,
            ], $extraPayload);

            $response = Http::timeout(10)->post(
                "https://api.telegram.org/bot{$this->botToken}/sendMessage",
                $payload
            );

            return $response->successful() && $response->json('ok', false);
        } catch (\Exception $e) {
            \Log::error('Telegram notification failed: ' . $e->getMessage());
            return false;
        }
    }

    public function sendPhoto(string $photoPath, string $caption, array $extraPayload = []): bool
    {
        if (!$this->isConfigured()) {
            return false;
        }

        $absolutePath = Storage::disk('public')->path($photoPath);
        if (!is_file($absolutePath)) {
            return $this->sendMessage($caption, $extraPayload);
        }

        try {
            $payload = array_merge([
                'chat_id' => $this->chatId,
                'caption' => $caption,
                'parse_mode' => 'HTML',
            ], $extraPayload);

            if (isset($payload['reply_markup']) && is_array($payload['reply_markup'])) {
                $payload['reply_markup'] = json_encode($payload['reply_markup']);
            }

            $response = Http::timeout(20)
                ->attach('photo', file_get_contents($absolutePath), basename($absolutePath))
                ->post("https://api.telegram.org/bot{$this->botToken}/sendPhoto", $payload);

            return $response->successful() && $response->json('ok', false);
        } catch (\Exception $e) {
            \Log::error('Telegram photo notification failed: ' . $e->getMessage());
            return false;
        }
    }

    public function answerCallbackQuery(string $callbackQueryId, string $text): bool
    {
        if (!$this->isConfigured()) {
            return false;
        }

        try {
            $response = Http::timeout(10)->post(
                "https://api.telegram.org/bot{$this->botToken}/answerCallbackQuery",
                [
                    'callback_query_id' => $callbackQueryId,
                    'text' => $text,
                    'show_alert' => false,
                ]
            );

            return $response->successful() && $response->json('ok', false);
        } catch (\Exception $e) {
            \Log::error('Telegram callback answer failed: ' . $e->getMessage());
            return false;
        }
    }

    public function editMessageReplyMarkup(int|string $chatId, int $messageId): bool
    {
        if (!$this->isConfigured()) {
            return false;
        }

        try {
            $response = Http::timeout(10)->post(
                "https://api.telegram.org/bot{$this->botToken}/editMessageReplyMarkup",
                [
                    'chat_id' => $chatId,
                    'message_id' => $messageId,
                    'reply_markup' => ['inline_keyboard' => []],
                ]
            );

            return $response->successful() && $response->json('ok', false);
        } catch (\Exception $e) {
            \Log::error('Telegram edit reply markup failed: ' . $e->getMessage());
            return false;
        }
    }

    public function notifyNewEvent(Event $event): bool
    {
        $settings = TelegramSetting::getInstance();
        if (!$settings?->notify_new_event) return false;

        $message = "<b>🎉 Booking Baru!</b>\n\n" .
            "<b>Client:</b> {$event->name}\n" .
            "<b>Tanggal:</b> {$event->date?->format('Y-m-d')}\n" .
            "<b>Telepon:</b> {$event->mobile_phone}\n" .
            "<b>Jenis:</b> {$event->order_type_name}\n" .
            "<b>Paket:</b> " . ($event->package_description ?: '-') . "\n" .
            "<b>Total:</b> Rp " . number_format($event->grand_total, 0, ',', '.') . "\n" .
            "<b>Status:</b> " . ($event->is_fully_paid ? 'Lunas' : 'Belum Lunas') . "\n\n" .
            "🔗 <a href=\"" . route('events.show', $event) . "\">Lihat Detail</a>";

        return $this->sendMessage($message);
    }

    public function notifyNewPayment(Payment $payment): bool
    {
        $settings = TelegramSetting::getInstance();
        if (!$settings?->notify_new_payment) return false;

        $payment->loadMissing('event');
        $event = $payment->event;
        if (!$event) return false;

        $type = $payment->is_expense === 0 ? 'Pemasukan' : 'Pengeluaran';
        $emoji = $payment->is_expense === 0 ? '💰' : '💸';

        $message = "<b>{$emoji} {$type} Baru!</b>\n\n" .
            "<b>Client:</b> {$event->name}\n" .
            "<b>Jumlah:</b> Rp " . number_format($payment->amount, 0, ',', '.') . "\n" .
            "<b>Jenis:</b> {$payment->type_name}\n" .
            "<b>Metode:</b> {$payment->payment_type_name}\n" .
            "<b>Keterangan:</b> " . ($payment->description ?: '-') . "\n" .
            "<b>Status:</b> {$payment->status_name}\n\n" .
            "🔗 <a href=\"" . route('events.show', $event) . "\">Lihat Detail</a>";

        $payload = [];
        if ($payment->status === Payment::STATUS_PENDING) {
            $payload['reply_markup'] = [
                'inline_keyboard' => [
                    [
                        ['text' => 'Konfirmasi', 'callback_data' => "payment:confirm:{$payment->id}"],
                        ['text' => 'Tolak', 'callback_data' => "payment:reject:{$payment->id}"],
                    ],
                ],
            ];
        }

        if ($payment->receipt_image) {
            return $this->sendPhoto($payment->receipt_image, $message, $payload);
        }

        return $this->sendMessage($message, $payload);
    }

    public function notifyEventDateChanged(Event $event, ?string $oldDate, ?string $newDate): bool
    {
        $settings = TelegramSetting::getInstance();
        if (!$settings?->notify_event_date_changed) return false;

        $message = "<b>📌 Tanggal Acara Berubah</b>\n\n" .
            "<b>Client:</b> {$event->name}\n" .
            "<b>Jenis:</b> {$event->order_type_name}\n" .
            "<b>Dari:</b> " . ($oldDate ?: '-') . "\n" .
            "<b>Ke:</b> " . ($newDate ?: '-') . "\n\n" .
            "🔗 <a href=\"" . route('events.show', $event) . "\">Lihat Detail</a>";

        return $this->sendMessage($message);
    }

    public function notifyEventDeleted(Event $event): bool
    {
        $settings = TelegramSetting::getInstance();
        if (!$settings?->notify_event_deleted) return false;

        $message = "<b>🗑️ Client Cancel / Dihapus</b>\n\n" .
            "<b>Client:</b> {$event->name}\n" .
            "<b>Tanggal:</b> {$event->date?->format('Y-m-d')}\n" .
            "<b>Jenis:</b> {$event->order_type_name}\n" .
            "<b>Telepon:</b> " . ($event->mobile_phone ?: '-') . "\n" .
            "<b>Total:</b> Rp " . number_format($event->grand_total, 0, ',', '.');

        return $this->sendMessage($message);
    }

    public function notifyDeleteRequested(Event $event): bool
    {
        $settings = TelegramSetting::getInstance();
        if (!$settings?->notify_event_deleted) return false;

        $message = "<b>⚠️ Request Hapus / Cancel Client</b>\n\n" .
            "<b>Client:</b> {$this->escape($event->name)}\n" .
            "<b>Tanggal:</b> " . ($event->date?->format('Y-m-d') ?: '-') . "\n" .
            "<b>Jenis:</b> {$this->escape($event->order_type_name)}\n" .
            "<b>Telepon:</b> " . $this->escape($event->mobile_phone ?: '-') . "\n" .
            "<b>Total:</b> Rp " . number_format($event->grand_total, 0, ',', '.') . "\n\n" .
            "🔗 <a href=\"" . route('events.show', $event) . "\">Lihat Detail</a>";

        return $this->sendMessage($message, [
            'reply_markup' => [
                'inline_keyboard' => [
                    [
                        ['text' => 'Konfirmasi Hapus', 'callback_data' => "event_delete:confirm:{$event->id}"],
                        ['text' => 'Tolak', 'callback_data' => "event_delete:reject:{$event->id}"],
                    ],
                ],
            ],
        ]);
    }

    public function notifyDailySummary(): bool
    {
        $settings = TelegramSetting::getInstance();
        if (!$settings?->notify_daily_summary) return false;

        $today = Carbon::today();
        $yesterday = Carbon::yesterday();

        $newClients = Event::whereBetween('created_at', [
            $yesterday->copy()->startOfDay(),
            $yesterday->copy()->endOfDay(),
        ])->orderBy('created_at')->get();

        $leaves = EmployeeLeaveRequest::with('user')
            ->where('status', EmployeeLeaveRequest::STATUS_APPROVED)
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->orderBy('start_date')
            ->get();

        $fittings = Schedule::with('event')
            ->whereDate('schedule_from', $today)
            ->where('type', Schedule::TYPE_FITTING)
            ->orderBy('schedule_from')
            ->get();

        $events = Event::whereDate('date', $today)
            ->orderBy('time')
            ->orderBy('name')
            ->get();

        $message = "<b>☀️ Rekapan Pagi Shofi Wedding</b>\n" .
            "<b>Tanggal:</b> " . $today->translatedFormat('d F Y') . "\n\n" .
            "<b>Client Baru Kemarin:</b> {$newClients->count()}\n" .
            $this->formatList($newClients->map(
                fn (Event $event) => $this->escape($event->name) . ' - ' . $this->escape($event->order_type_name)
            )->all()) . "\n\n" .
            "<b>Cuti / Libur Hari Ini:</b>\n" .
            $this->formatList($leaves->map(
                fn (EmployeeLeaveRequest $leave) => $this->escape($leave->user?->name ?: '-') . ' - ' . $this->escape($leave->leave_type_name)
            )->all()) . "\n\n" .
            "<b>Fitting Hari Ini:</b>\n" .
            $this->formatList($fittings->map(
                fn (Schedule $schedule) => $schedule->schedule_from->format('H:i') . ' - ' . $this->escape($schedule->client_name)
            )->all()) . "\n\n" .
            "<b>Manten Hari Ini:</b>\n" .
            $this->formatList($events->map(
                fn (Event $event) => ($event->time?->format('H:i') ?: '-') . ' - ' . $this->escape($event->name) . ' - ' . $this->escape($event->order_type_name)
            )->all());

        return $this->sendMessage($message);
    }

    public function notifyLeaveRequest(EmployeeLeaveRequest $leave): bool
    {
        $settings = TelegramSetting::getInstance();
        if (!$settings?->notify_leave_request) return false;

        $leave->loadMissing('user');

        $message = "<b>📝 Pengajuan Cuti Baru</b>\n\n" .
            "<b>Pegawai:</b> " . $this->escape($leave->user?->name ?: '-') . "\n" .
            "<b>Jenis:</b> " . $this->escape($leave->leave_type_name) . "\n" .
            "<b>Tanggal:</b> " . $leave->start_date?->translatedFormat('d F Y') . " s/d " . $leave->end_date?->translatedFormat('d F Y') . "\n" .
            "<b>Total:</b> {$leave->days} hari\n" .
            "<b>Alasan:</b> " . $this->escape($leave->reason ?: '-') . "\n" .
            "<b>Status:</b> " . $this->escape($leave->status_name);

        return $this->sendMessage($message, [
            'reply_markup' => [
                'inline_keyboard' => [
                    [
                        ['text' => 'Setujui', 'callback_data' => "leave:confirm:{$leave->id}"],
                        ['text' => 'Tolak', 'callback_data' => "leave:reject:{$leave->id}"],
                    ],
                ],
            ],
        ]);
    }

    public function notifySchedule(\App\Models\Schedule $schedule): bool
    {
        $settings = TelegramSetting::getInstance();
        if (!$settings?->notify_schedule) return false;

        $date = \Carbon\Carbon::parse($schedule->schedule_from)->format('d M Y H:i');
        $detailLink = $schedule->event
            ? "\n\n🔗 <a href=\"" . route('events.show', $schedule->event) . "\">Lihat Detail</a>"
            : '';

        $message = "<b>📅 Jadwal {$schedule->type_name}!</b>\n\n" .
            "<b>Client:</b> {$schedule->client_name}\n" .
            "<b>Status:</b> {$schedule->client_status_name}\n" .
            "<b>Telepon:</b> " . ($schedule->client_phone ?: '-') . "\n" .
            "<b>Tanggal:</b> {$date}\n" .
            "<b>Keterangan:</b> " . ($schedule->description ?: '-') .
            $detailLink;

        return $this->sendMessage($message);
    }

    private function formatList(array $items): string
    {
        if ($items === []) {
            return '- Tidak ada';
        }

        return collect($items)
            ->map(fn (string $item) => '- ' . $item)
            ->implode("\n");
    }

    private function escape(?string $value): string
    {
        return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}
