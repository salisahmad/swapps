<?php

namespace App\Http\Controllers;

use App\Models\ClientActivityLog;
use App\Models\EmployeeLeaveRequest;
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
        if (!in_array($entity, ['payment', 'event_delete', 'leave'], true) || !in_array($action, ['confirm', 'reject'], true) || !$id) {
            $telegram->answerCallbackQuery($callbackId, 'Aksi tidak dikenali.');
            return response()->json(['ok' => true]);
        }

        if ($entity === 'event_delete') {
            return $this->handleEventDeleteCallback($telegram, $callbackId, $chatId, $messageId, $action, (int) $id);
        }

        if ($entity === 'leave') {
            return $this->handleLeaveCallback($telegram, $callbackId, $chatId, $messageId, $action, (int) $id);
        }

        return $this->handlePaymentCallback($telegram, $callbackId, $chatId, $messageId, $action, (int) $id);
    }

    private function handlePaymentCallback(
        TelegramNotification $telegram,
        string $callbackId,
        string $chatId,
        int $messageId,
        string $action,
        int $id,
    ): JsonResponse {
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

    private function handleEventDeleteCallback(
        TelegramNotification $telegram,
        string $callbackId,
        string $chatId,
        int $messageId,
        string $action,
        int $id,
    ): JsonResponse {
        $event = Event::find($id);
        if (!$event) {
            $telegram->answerCallbackQuery($callbackId, 'Data client tidak ditemukan.');
            return response()->json(['ok' => true]);
        }

        if (! $this->hasPendingDeleteRequest($event)) {
            $telegram->answerCallbackQuery($callbackId, 'Request hapus ini sudah diproses.');
            if ($messageId) {
                $telegram->editMessageReplyMarkup($chatId, $messageId);
            }

            return response()->json(['ok' => true]);
        }

        if ($action === 'confirm') {
            ClientActivityLog::create([
                'event_id' => $event->id,
                'user_id' => null,
                'type' => ClientActivityLog::TYPE_DELETE_APPROVED,
                'message' => 'Request hapus client dikonfirmasi dari Telegram.',
            ]);
            ClientActivityLog::create([
                'event_id' => $event->id,
                'user_id' => null,
                'type' => ClientActivityLog::TYPE_DELETED,
                'message' => 'Client dihapus setelah request Telegram disetujui.',
                'before' => [
                    'name' => $event->name,
                    'date' => $event->date?->format('Y-m-d'),
                    'total_amount' => $event->grand_total,
                ],
            ]);
            $event->delete();

            $telegram->answerCallbackQuery($callbackId, 'Client dihapus.');
        } else {
            ClientActivityLog::create([
                'event_id' => $event->id,
                'user_id' => null,
                'type' => ClientActivityLog::TYPE_DELETE_REJECTED,
                'message' => 'Request hapus client ditolak dari Telegram.',
            ]);

            $telegram->answerCallbackQuery($callbackId, 'Request hapus ditolak.');
            $telegram->sendMessage("<b>Request hapus client ditolak</b>\n\n<b>Client:</b> " . e($event->name));
        }

        if ($messageId) {
            $telegram->editMessageReplyMarkup($chatId, $messageId);
        }

        return response()->json(['ok' => true]);
    }

    private function handleLeaveCallback(
        TelegramNotification $telegram,
        string $callbackId,
        string $chatId,
        int $messageId,
        string $action,
        int $id,
    ): JsonResponse {
        $leave = EmployeeLeaveRequest::with('user')->find($id);
        if (!$leave) {
            $telegram->answerCallbackQuery($callbackId, 'Data pengajuan cuti tidak ditemukan.');
            return response()->json(['ok' => true]);
        }

        if ($leave->status !== EmployeeLeaveRequest::STATUS_PENDING) {
            $telegram->answerCallbackQuery($callbackId, 'Pengajuan cuti ini sudah diproses.');
            if ($messageId) {
                $telegram->editMessageReplyMarkup($chatId, $messageId);
            }

            return response()->json(['ok' => true]);
        }

        $newStatus = $action === 'confirm'
            ? EmployeeLeaveRequest::STATUS_APPROVED
            : EmployeeLeaveRequest::STATUS_REJECTED;

        $leave->update([
            'status' => $newStatus,
            'review_notes' => $action === 'confirm'
                ? 'Disetujui dari Telegram.'
                : 'Ditolak dari Telegram.',
            'reviewed_by' => null,
            'reviewed_at' => now(),
        ]);

        if ($messageId) {
            $telegram->editMessageReplyMarkup($chatId, $messageId);
        }

        $statusText = $action === 'confirm' ? 'disetujui' : 'ditolak';
        $telegram->answerCallbackQuery($callbackId, "Cuti {$statusText}.");
        $telegram->sendMessage(
            "<b>Pengajuan cuti {$statusText} dari Telegram</b>\n\n" .
            "<b>Pegawai:</b> " . e($leave->user?->name ?: '-') . "\n" .
            "<b>Tanggal:</b> " . $leave->start_date?->translatedFormat('d F Y') . " s/d " . $leave->end_date?->translatedFormat('d F Y') . "\n" .
            "<b>Total:</b> {$leave->days} hari",
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
}
