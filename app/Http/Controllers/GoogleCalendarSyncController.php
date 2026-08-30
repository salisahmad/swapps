<?php

namespace App\Http\Controllers;

use App\Jobs\GoogleCalendarSyncJob;
use App\Models\Event;
use App\Models\Schedule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GoogleCalendarSyncController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorizeOwner();

        $status = $request->string('status')->toString() ?: 'failed';
        $allowedStatuses = [
            Event::GOOGLE_SYNC_PENDING,
            Event::GOOGLE_SYNC_FAILED,
            Event::GOOGLE_SYNC_SKIPPED,
            Event::GOOGLE_SYNC_SYNCED,
            Event::GOOGLE_SYNC_DELETED,
        ];

        if (! in_array($status, $allowedStatuses, true)) {
            $status = Event::GOOGLE_SYNC_FAILED;
        }

        $events = Event::query()
            ->whereIn('order_type', [Event::ORDER_TYPE_MUA, Event::ORDER_TYPE_GOWN])
            ->where('google_sync_status', $status)
            ->whereNull('deleted_at')
            ->latest('updated_at')
            ->paginate(10, ['id', 'uuid', 'name', 'date', 'time', 'order_type', 'google_event_id', 'google_sync_status', 'google_sync_attempts', 'google_synced_at', 'google_sync_error', 'updated_at'], 'events_page')
            ->withQueryString();

        $schedules = Schedule::query()
            ->with('event:id,uuid,name,order_type')
            ->where('google_sync_status', $status)
            ->whereNull('deleted_at')
            ->latest('updated_at')
            ->paginate(10, ['id', 'event_id', 'type', 'schedule_from', 'schedule_to', 'prospect_name', 'google_event_id', 'google_sync_status', 'google_sync_attempts', 'google_synced_at', 'google_sync_error', 'updated_at'], 'schedules_page')
            ->withQueryString();

        return Inertia::render('GoogleCalendar/Sync', [
            'status' => $status,
            'summary' => [
                'events' => $this->counts(Event::query()->whereIn('order_type', [Event::ORDER_TYPE_MUA, Event::ORDER_TYPE_GOWN])->whereNull('deleted_at')),
                'schedules' => $this->counts(Schedule::query()->whereNull('deleted_at')),
            ],
            'events' => $events,
            'schedules' => $schedules,
        ]);
    }

    public function retry(Request $request): RedirectResponse
    {
        $this->authorizeOwner();

        $validated = $request->validate([
            'type' => 'required|string|in:event,schedule',
            'id' => 'required|integer',
        ]);

        $type = $validated['type'] === 'event'
            ? GoogleCalendarSyncJob::TYPE_EVENT
            : GoogleCalendarSyncJob::TYPE_SCHEDULE;

        $model = $validated['type'] === 'event'
            ? Event::findOrFail($validated['id'])
            : Schedule::findOrFail($validated['id']);

        $model->forceFill([
            'google_sync_status' => Event::GOOGLE_SYNC_PENDING,
            'google_sync_error' => null,
        ])->saveQuietly();

        GoogleCalendarSyncJob::dispatch($type, $model->id, GoogleCalendarSyncJob::ACTION_SYNC);

        return redirect()->back()->with('success', 'Sync manual dimasukkan ke antrean.');
    }

    public function retryAll(Request $request): RedirectResponse
    {
        $this->authorizeOwner();

        $validated = $request->validate([
            'status' => 'required|string|in:pending,failed,skipped',
        ]);

        $eventCount = Event::query()
            ->whereIn('order_type', [Event::ORDER_TYPE_MUA, Event::ORDER_TYPE_GOWN])
            ->where('google_sync_status', $validated['status'])
            ->whereNull('deleted_at')
            ->get()
            ->each(fn (Event $event) => $this->queue($event, GoogleCalendarSyncJob::TYPE_EVENT))
            ->count();

        $scheduleCount = Schedule::query()
            ->where('google_sync_status', $validated['status'])
            ->whereNull('deleted_at')
            ->get()
            ->each(fn (Schedule $schedule) => $this->queue($schedule, GoogleCalendarSyncJob::TYPE_SCHEDULE))
            ->count();

        return redirect()->back()->with('success', "Sync manual dimasukkan ke antrean untuk {$eventCount} client dan {$scheduleCount} jadwal.");
    }

    private function counts($query): array
    {
        $counts = $query
            ->selectRaw('google_sync_status, COUNT(*) as total')
            ->groupBy('google_sync_status')
            ->pluck('total', 'google_sync_status');

        return [
            Event::GOOGLE_SYNC_PENDING => (int) ($counts[Event::GOOGLE_SYNC_PENDING] ?? 0),
            Event::GOOGLE_SYNC_FAILED => (int) ($counts[Event::GOOGLE_SYNC_FAILED] ?? 0),
            Event::GOOGLE_SYNC_SKIPPED => (int) ($counts[Event::GOOGLE_SYNC_SKIPPED] ?? 0),
            Event::GOOGLE_SYNC_SYNCED => (int) ($counts[Event::GOOGLE_SYNC_SYNCED] ?? 0),
            Event::GOOGLE_SYNC_DELETED => (int) ($counts[Event::GOOGLE_SYNC_DELETED] ?? 0),
        ];
    }

    private function queue(Event|Schedule $model, string $type): void
    {
        $model->forceFill([
            'google_sync_status' => Event::GOOGLE_SYNC_PENDING,
            'google_sync_error' => null,
        ])->saveQuietly();

        GoogleCalendarSyncJob::dispatch($type, $model->id, GoogleCalendarSyncJob::ACTION_SYNC);
    }

    private function authorizeOwner(): void
    {
        abort_unless(request()->user()?->isOwner(), 403);
    }
}
