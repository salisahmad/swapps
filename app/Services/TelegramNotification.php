<?php

namespace App\Services;

use App\Models\TelegramSetting;
use Illuminate\Support\Facades\Http;
use App\Models\Event;
use App\Models\Payment;
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
}
