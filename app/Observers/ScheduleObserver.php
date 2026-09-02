<?php

namespace App\Observers;

use App\Models\Schedule;
use App\Services\GoogleCalendarSyncDispatcher;
use App\Services\TelegramNotification;

class ScheduleObserver
{
    public function created(Schedule $schedule): void
    {
        $telegram = new TelegramNotification;
        $telegram->notifySchedule($schedule);

        app(GoogleCalendarSyncDispatcher::class)->syncSchedule($schedule);
    }

    public function updated(Schedule $schedule): void
    {
        app(GoogleCalendarSyncDispatcher::class)->syncSchedule($schedule);
    }

    public function deleted(Schedule $schedule): void
    {
        app(GoogleCalendarSyncDispatcher::class)->deleteSchedule($schedule);
    }
}
