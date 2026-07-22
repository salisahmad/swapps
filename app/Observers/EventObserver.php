<?php

namespace App\Observers;

use App\Models\Event;
use App\Services\GoogleCalendarService;
use App\Services\TelegramNotification;

class EventObserver
{
    public function created(Event $event): void
    {
        $telegram = new TelegramNotification();
        $telegram->notifyNewEvent($event);

        app(GoogleCalendarService::class)->syncEvent($event);
    }

    public function updated(Event $event): void
    {
        app(GoogleCalendarService::class)->syncEvent($event);
    }

    public function deleted(Event $event): void
    {
        app(GoogleCalendarService::class)->deleteEvent($event);
    }
}
