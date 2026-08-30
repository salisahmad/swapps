<?php

namespace App\Http\Controllers;

use App\Models\ClientActivityLog;
use App\Models\Event;
use App\Models\Payment;
use App\Models\TelegramSetting;
use App\Services\TelegramNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TelegramWebhookController extends Controller
{
    public function handle(Request $request, string $secret): JsonResponse
    {
        $configuredSecret = (string) config('services.telegram.webhook_secret');
        if ($configuredSecret === '' || !hash_equals($configuredSecret, $secret)) {
            abort(404);
        }

        $callback = $request->input('callback_query');
        if (!$callback) {
            return response()->json(['ok' => true]);
        }

        $telegram = new TelegramNotification();
        $callbackId = (string) data_get($callback, 'id');
        $chatId = (string) data_get($callback, 'message.chat.id');
        $messageId = (int) data_get($callback, 'message.message_id');
        $data = (string) data_get($callback, 'data');

        $settings = TelegramSetting::getInstance();
        if (!$settings || (string) $settings->chat_id !== $chatId) {
            $telegram->answerCallbackQuery($callbackId, 'Chat ini tidak punya akses.');
            return response()->json(['ok' => true]);
        }

        [$entity, $action, $id] = array_pad(explode(':', $data), 3, null);
        if ($entity !== 'payment' || !in_array($action, ['confirm', 'reject'], true) || !$id) {
            $telegram->answerCallbackQuery($callbackId, 'Aksi tidak dikenali.');
            return response()->json(['ok' => true]);
        }

        $payment = Payment::with('event')->find($id);
        if (!$payment) {
            $telegram->answerCallbackQuery($callbackId, 'Data pembayaran tidak ditemukan.');
            return response()->json(['ok' => true]);
        }

        if ($payment->status !== Payment::STATUS_PENDING) {
            $telegram->answerCallbackQuery($callbackId, 'Pembayaran ini sudah diproses.');
            if ($messageId) {
                $telegram->editMessageReplyMarkup($chatId, $messageId);
            }
            return response()->json(['ok' => true]);
        }

        $before = $payment->only(['status']);
        $newStatus = $action === 'confirm' ? Payment::STATUS_CONFIRMED : Payment::STATUS_REJECTED;
        $payment->update(['status' => $newStatus]);
        $this->updateEventPaidStatus($payment->event_id);
        $this->logPaymentChange(
            $payment->fresh(),
            $action === 'confirm' ? 'Pembayaran dikonfirmasi dari Telegram.' : 'Pembayaran ditolak dari Telegram.',
            $before,
            ['status' => $newStatus],
        );

        if ($messageId) {
            $telegram->editMessageReplyMarkup($chatId, $messageId);
        }

        $statusText = $action === 'confirm' ? 'dikonfirmasi' : 'ditolak';
        $telegram->answerCallbackQuery($callbackId, "Pembayaran {$statusText}.");
        $telegram->sendMessage(
            "<b>Pembayaran {$statusText} dari Telegram</b>\n\n" .
            "<b>Client:</b> " . ($payment->event?->name ?: '-') . "\n" .
            "<b>Jumlah:</b> Rp " . number_format($payment->amount, 0, ',', '.') . "\n" .
            "<b>Status:</b> " . Payment::STATUSES[$newStatus],
        );

        return response()->json(['ok' => true]);
    }

    private function updateEventPaidStatus(int $eventId): void
    {
        $event = Event::find($eventId);
        if (!$event) {
            return;
        }

        $paid = $event->payments()
            ->where('is_expense', Payment::EARNING)
            ->where('status', Payment::STATUS_CONFIRMED)
            ->sum('amount');

        $event->update(['is_fully_paid' => $paid >= $event->grand_total]);
    }

    private function logPaymentChange(Payment $payment, string $message, ?array $before = null, ?array $after = null): void
    {
        $payment->loadMissing('event');

        if (!$payment->event) {
            return;
        }

        ClientActivityLog::create([
            'event_id' => $payment->event->id,
            'user_id' => null,
            'type' => ClientActivityLog::TYPE_PAYMENT_CHANGED,
            'message' => $message,
            'before' => $before,
            'after' => $after ?? [
                'payment_id' => $payment->id,
                'amount' => $payment->amount,
                'payment_at' => $payment->payment_at?->format('Y-m-d'),
                'payment_type' => $payment->payment_type_name,
                'status' => $payment->status_name,
            ],
        ]);
    }
}
