<?php

namespace App\Services;

use App\Jobs\GoogleCalendarSyncJob;
use App\Models\Event;
use App\Models\Schedule;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class GoogleCalendarSyncDispatcher
{
    public function syncEvent(Event $event): void
    {
        $this->queueImmediateAttempt(GoogleCalendarSyncJob::TYPE_EVENT, $event->id, GoogleCalendarSyncJob::ACTION_SYNC);
    }

    public function deleteEvent(Event $event): void
    {
        $this->queueImmediateAttempt(GoogleCalendarSyncJob::TYPE_EVENT, $event->id, GoogleCalendarSyncJob::ACTION_DELETE);
    }

    public function syncSchedule(Schedule $schedule): void
    {
        $this->queueImmediateAttempt(GoogleCalendarSyncJob::TYPE_SCHEDULE, $schedule->id, GoogleCalendarSyncJob::ACTION_SYNC);
    }

    public function deleteSchedule(Schedule $schedule): void
    {
        $this->queueImmediateAttempt(GoogleCalendarSyncJob::TYPE_SCHEDULE, $schedule->id, GoogleCalendarSyncJob::ACTION_DELETE);
    }

    private function queueImmediateAttempt(string $type, int $modelId, string $action): void
    {
        $model = $this->model($type, $modelId);

        if (! $model) {
            return;
        }

        $model->forceFill([
            'google_sync_status' => Event::GOOGLE_SYNC_PENDING,
            'google_sync_error' => null,
        ])->saveQuietly();

        DB::afterCommit(function () use ($type, $modelId, $action) {
            app()->terminating(function () use ($type, $modelId, $action) {
                $this->attemptNowOrRetryLater($type, $modelId, $action);
            });
        });
    }

    private function attemptNowOrRetryLater(string $type, int $modelId, string $action): void
    {
        try {
            Cache::lock($this->lockKey($type, $modelId), 60)->block(10, function () use ($type, $modelId, $action) {
                $model = $this->model($type, $modelId);

                if (! $model) {
                    return;
                }

                $attempt = ((int) $model->google_sync_attempts) + 1;
                $model->forceFill([
                    'google_sync_status' => Event::GOOGLE_SYNC_PENDING,
                    'google_sync_attempts' => $attempt,
                ])->saveQuietly();

                $status = $action === GoogleCalendarSyncJob::ACTION_DELETE
                    ? $this->delete($model)
                    : $this->sync($model);

                $model->forceFill([
                    'google_sync_status' => $status,
                    'google_synced_at' => now(),
                    'google_sync_error' => null,
                ])->saveQuietly();
            });
        } catch (Throwable $exception) {
            $this->markPendingAndDispatchRetry($type, $modelId, $action, $exception);
        }
    }

    private function markPendingAndDispatchRetry(string $type, int $modelId, string $action, Throwable $exception): void
    {
        $model = $this->model($type, $modelId);

        if ($model) {
            $model->forceFill([
                'google_sync_status' => Event::GOOGLE_SYNC_PENDING,
                'google_sync_error' => $this->shortError($exception),
            ])->saveQuietly();
        }

        GoogleCalendarSyncJob::dispatch($type, $modelId, $action)
            ->delay(now()->addMinutes(3));

        Log::warning('Google Calendar immediate sync failed, queued retry', [
            'type' => $type,
            'model_id' => $modelId,
            'action' => $action,
            'error' => $exception->getMessage(),
        ]);
    }

    private function model(string $type, int $modelId): Event|Schedule|null
    {
        return match ($type) {
            GoogleCalendarSyncJob::TYPE_EVENT => Event::withTrashed()->find($modelId),
            GoogleCalendarSyncJob::TYPE_SCHEDULE => Schedule::withTrashed()->find($modelId),
            default => null,
        };
    }

    private function sync(Event|Schedule $model): string
    {
        $calendar = app(GoogleCalendarService::class);

        return $model instanceof Event
            ? $calendar->syncEvent($model)
            : $calendar->syncSchedule($model);
    }

    private function delete(Event|Schedule $model): string
    {
        $calendar = app(GoogleCalendarService::class);

        return $model instanceof Event
            ? $calendar->deleteEvent($model)
            : $calendar->deleteSchedule($model);
    }

    private function lockKey(string $type, int $modelId): string
    {
        return "google-calendar-sync:{$type}:{$modelId}";
    }

    private function shortError(Throwable $exception): string
    {
        if ($exception instanceof LockTimeoutException) {
            return 'Sync Google Calendar sedang diproses. Akan dicoba ulang otomatis.';
        }

        return substr($exception->getMessage(), 0, 2000);
    }
}
