<?php

namespace App\Services;

use App\Models\TelegramSetting;
use Illuminate\Support\Facades\Http;
use App\Models\Event;

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

    public function sendMessage(string $message): bool
    {
        if (!$this->isConfigured()) {
            return false;
        }

        try {
            $response = Http::timeout(10)->post(
                "https://api.telegram.org/bot{$this->botToken}/sendMessage",
                [
                    'chat_id' => $this->chatId,
                    'text' => $message,
                    'parse_mode' => 'HTML',
                ]
            );

            return $response->successful() && $response->json('ok', false);
        } catch (\Exception $e) {
            \Log::error('Telegram notification failed: ' . $e->getMessage());
            return false;
        }
    }

    public function notifyNewEvent(Event $event): bool
    {
        $settings = TelegramSetting::getInstance();
        if (!$settings?->notify_new_event) return false;

        $message = "<b>🎉 Booking Baru!</b>\n\n" .
            "<b>Client:</b> {$event->name}\n" .
            "<b>Tanggal:</b> {$event->date}\n" .
            "<b>Telepon:</b> {$event->mobile_phone}\n" .
            "<b>Paket:</b> " . ($event->package_description ?: '-') . "\n" .
            "<b>Total:</b> Rp " . number_format($event->total_amount, 0, ',', '.') . "\n" .
            "<b>Status:</b> " . ($event->is_fully_paid ? 'Lunas' : 'Belum Lunas') . "\n\n" .
            "🔗 <a href=\"" . route('events.show', $event) . "\">Lihat Detail</a>";

        return $this->sendMessage($message);
    }

    public function notifyNewPayment(\App\Models\Payment $payment): bool
    {
        $settings = TelegramSetting::getInstance();
        if (!$settings?->notify_new_payment) return false;

        $event = $payment->event;
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
