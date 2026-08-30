<?php

namespace App\Jobs;

use App\Models\Event;
use App\Models\Schedule;
use App\Services\GoogleCalendarService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class GoogleCalendarSyncJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public const TYPE_EVENT = 'event';

    public const TYPE_SCHEDULE = 'schedule';

    public const ACTION_SYNC = 'sync';

    public const ACTION_DELETE = 'delete';

    public int $tries = 5;

    public function __construct(
        public string $type,
        public int $modelId,
        public string $action = self::ACTION_SYNC,
    ) {
        $this->onQueue('google-calendar');
    }

    public function backoff(): array
    {
        return [60, 300, 900, 3600];
    }

    public function handle(GoogleCalendarService $calendar): void
    {
        $model = $this->model();

        if (! $model) {
            return;
        }

        $model->forceFill([
            'google_sync_status' => Event::GOOGLE_SYNC_PENDING,
            'google_sync_attempts' => $this->attempts(),
        ])->saveQuietly();

        try {
            $status = $this->action === self::ACTION_DELETE
                ? $this->delete($calendar, $model)
                : $this->sync($calendar, $model);

            $model->forceFill([
                'google_sync_status' => $status,
                'google_sync_attempts' => $this->attempts(),
                'google_synced_at' => now(),
                'google_sync_error' => null,
            ])->saveQuietly();
        } catch (Throwable $exception) {
            $model->forceFill([
                'google_sync_status' => Event::GOOGLE_SYNC_PENDING,
                'google_sync_attempts' => $this->attempts(),
                'google_sync_error' => $this->shortError($exception),
            ])->saveQuietly();

            throw $exception;
        }
    }

    public function failed(?Throwable $exception): void
    {
        $model = $this->model();

        if (! $model) {
            return;
        }

        $model->forceFill([
            'google_sync_status' => Event::GOOGLE_SYNC_FAILED,
            'google_sync_attempts' => max($model->google_sync_attempts, $this->attempts()),
            'google_sync_error' => $exception ? $this->shortError($exception) : 'Google Calendar sync gagal.',
        ])->saveQuietly();
    }

    private function model(): Event|Schedule|null
    {
        return match ($this->type) {
            self::TYPE_EVENT => Event::withTrashed()->find($this->modelId),
            self::TYPE_SCHEDULE => Schedule::withTrashed()->find($this->modelId),
            default => null,
        };
    }

    private function sync(GoogleCalendarService $calendar, Event|Schedule $model): string
    {
        return $model instanceof Event
            ? $calendar->syncEvent($model)
            : $calendar->syncSchedule($model);
    }

    private function delete(GoogleCalendarService $calendar, Event|Schedule $model): string
    {
        return $model instanceof Event
            ? $calendar->deleteEvent($model)
            : $calendar->deleteSchedule($model);
    }

    private function shortError(Throwable $exception): string
    {
        return substr($exception->getMessage(), 0, 2000);
    }
}
