<?php

namespace App\Observers;

use App\Models\Holiday;
use App\Services\GoogleCalendarSyncDispatcher;

class HolidayObserver
{
    public function created(Holiday $holiday): void
    {
        app(GoogleCalendarSyncDispatcher::class)->syncHoliday($holiday);
    }

    public function updated(Holiday $holiday): void
    {
        app(GoogleCalendarSyncDispatcher::class)->syncHoliday($holiday);
    }

    public function deleted(Holiday $holiday): void
    {
        app(GoogleCalendarSyncDispatcher::class)->deleteHoliday($holiday);
    }
}
