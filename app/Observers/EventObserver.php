<?php

namespace App\Observers;

use App\Models\Event;
use App\Services\GoogleCalendarSyncDispatcher;
use App\Services\TelegramNotification;

class EventObserver
{
    public function created(Event $event): void
    {
        $telegram = new TelegramNotification;
        $telegram->notifyNewEvent($event);

        app(GoogleCalendarSyncDispatcher::class)->syncEvent($event);
    }

    public function updated(Event $event): void
    {
        if ($event->wasChanged('date')) {
            $telegram = new TelegramNotification;
            $telegram->notifyEventDateChanged(
                $event,
                $event->getOriginal('date') ? (string) $event->getOriginal('date') : null,
                $event->date?->format('Y-m-d'),
            );
        }

        if ($event->wasChanged([
            'name',
            'date',
            'time',
            'location',
            'address',
            'package_description',
            'order_type',
        ])) {
            app(GoogleCalendarSyncDispatcher::class)->syncEvent($event);
        }
    }

    public function deleted(Event $event): void
    {
        $telegram = new TelegramNotification;
        $telegram->notifyEventDeleted($event);

        app(GoogleCalendarSyncDispatcher::class)->deleteEvent($event);
    }
}
