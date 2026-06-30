<?php

namespace App\Observers;

use App\Models\Schedule;
use App\Services\TelegramNotification;

class ScheduleObserver
{
    public function created(Schedule $schedule): void
    {
        $telegram = new TelegramNotification();
        $telegram->notifySchedule($schedule);
    }
}
