<?php

namespace App\Observers;

use App\Models\Schedule;
use App\Services\GoogleCalendarService;
use App\Services\TelegramNotification;

class ScheduleObserver
{
    public function created(Schedule $schedule): void
    {
        $telegram = new TelegramNotification();
        $telegram->notifySchedule($schedule);

        app(GoogleCalendarService::class)->syncSchedule($schedule);
    }

    public function updated(Schedule $schedule): void
    {
        app(GoogleCalendarService::class)->syncSchedule($schedule);
    }

    public function deleted(Schedule $schedule): void
    {
        app(GoogleCalendarService::class)->deleteSchedule($schedule);
    }
}
