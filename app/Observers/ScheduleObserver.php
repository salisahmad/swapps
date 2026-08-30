<?php

namespace App\Observers;

use App\Jobs\GoogleCalendarSyncJob;
use App\Models\Schedule;
use App\Services\TelegramNotification;

class ScheduleObserver
{
    public function created(Schedule $schedule): void
    {
        $telegram = new TelegramNotification;
        $telegram->notifySchedule($schedule);

        $this->queueGoogleSync($schedule);
    }

    public function updated(Schedule $schedule): void
    {
        $this->queueGoogleSync($schedule);
    }

    public function deleted(Schedule $schedule): void
    {
        $schedule->forceFill([
            'google_sync_status' => Schedule::GOOGLE_SYNC_PENDING,
            'google_sync_error' => null,
        ])->saveQuietly();

        GoogleCalendarSyncJob::dispatch(
            GoogleCalendarSyncJob::TYPE_SCHEDULE,
            $schedule->id,
            GoogleCalendarSyncJob::ACTION_DELETE,
        )->afterCommit();
    }

    private function queueGoogleSync(Schedule $schedule): void
    {
        $schedule->forceFill([
            'google_sync_status' => Schedule::GOOGLE_SYNC_PENDING,
            'google_sync_error' => null,
        ])->saveQuietly();

        GoogleCalendarSyncJob::dispatch(
            GoogleCalendarSyncJob::TYPE_SCHEDULE,
            $schedule->id,
            GoogleCalendarSyncJob::ACTION_SYNC,
        )->afterCommit();
    }
}
