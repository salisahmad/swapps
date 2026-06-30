<?php

namespace App\Observers;

use App\Models\Event;
use App\Services\TelegramNotification;

class EventObserver
{
    public function created(Event $event): void
    {
        $telegram = new TelegramNotification();
        $telegram->notifyNewEvent($event);
    }
}
