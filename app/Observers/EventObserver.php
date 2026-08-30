<?php

namespace App\Observers;

use App\Jobs\GoogleCalendarSyncJob;
use App\Models\Event;
use App\Services\TelegramNotification;

class EventObserver
{
    public function created(Event $event): void
    {
        $telegram = new TelegramNotification;
        $telegram->notifyNewEvent($event);

        $this->queueGoogleSync($event);
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
            $this->queueGoogleSync($event);
        }
    }

    public function deleted(Event $event): void
    {
        $telegram = new TelegramNotification;
        $telegram->notifyEventDeleted($event);

        $event->forceFill([
            'google_sync_status' => Event::GOOGLE_SYNC_PENDING,
            'google_sync_error' => null,
        ])->saveQuietly();

        GoogleCalendarSyncJob::dispatch(
            GoogleCalendarSyncJob::TYPE_EVENT,
            $event->id,
            GoogleCalendarSyncJob::ACTION_DELETE,
        )->afterCommit();
    }

    private function queueGoogleSync(Event $event): void
    {
        $event->forceFill([
            'google_sync_status' => Event::GOOGLE_SYNC_PENDING,
            'google_sync_error' => null,
        ])->saveQuietly();

        GoogleCalendarSyncJob::dispatch(
            GoogleCalendarSyncJob::TYPE_EVENT,
            $event->id,
            GoogleCalendarSyncJob::ACTION_SYNC,
        )->afterCommit();
    }
}
