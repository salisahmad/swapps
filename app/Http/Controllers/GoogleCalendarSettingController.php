<?php

namespace App\Http\Controllers;

use App\Jobs\GoogleCalendarSyncJob;
use App\Models\Event;
use App\Models\GoogleCalendarSetting;
use App\Models\Schedule;
use App\Services\GoogleCalendarService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GoogleCalendarSettingController extends Controller
{
    public function index(): Response
    {
        $this->authorizeOwner();

        $settings = GoogleCalendarSetting::getInstance();

        return Inertia::render('GoogleCalendar/Settings', [
            'settings' => [
                'enabled' => $settings->enabled,
                'client_id' => $settings->client_id,
                'calendar_id' => $settings->calendar_id ?: 'primary',
                'color_id' => $settings->color_id ?: '4',
                'connected_email' => $settings->connected_email,
                'has_client_secret' => filled($settings->client_secret),
                'is_connected' => filled($settings->refresh_token),
                'redirect_uri' => rtrim((string) config('app.url'), '/') . route('google-calendar.callback', [], false),
            ],
            'sync_summary' => $this->syncSummary(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $this->authorizeOwner();

        $validated = $request->validate([
            'enabled' => 'boolean',
            'client_id' => 'nullable|string|max:255',
            'client_secret' => 'nullable|string',
            'calendar_id' => 'nullable|string|max:255',
            'color_id' => 'nullable|string|max:10',
        ]);

        $settings = GoogleCalendarSetting::getInstance();
        $payload = collect($validated)->except('client_secret')->all();
        $payload['calendar_id'] = $payload['calendar_id'] ?: 'primary';
        $payload['color_id'] = $payload['color_id'] ?: '4';

        if ($request->filled('client_secret')) {
            $payload['client_secret'] = $validated['client_secret'];
        }

        $settings->update($payload);

        return redirect()->back()->with('success', 'Pengaturan Google Calendar disimpan.');
    }

    public function connect(GoogleCalendarService $calendar): RedirectResponse
    {
        $this->authorizeOwner();

        $settings = GoogleCalendarSetting::getInstance();

        if (!filled($settings->client_id) || !filled($settings->client_secret)) {
            return redirect()->back()->with('error', 'Isi Client ID dan Client Secret dulu.');
        }

        return redirect()->away($calendar->authUrl($settings));
    }

    public function callback(Request $request, GoogleCalendarService $calendar): RedirectResponse
    {
        $this->authorizeOwner();

        if ($request->input('state') !== session('google_calendar_oauth_state')) {
            return redirect()->route('google-calendar.settings')->with('error', 'State OAuth tidak valid. Coba connect ulang.');
        }

        if (!$request->filled('code')) {
            return redirect()->route('google-calendar.settings')->with('error', 'Google tidak mengirim authorization code.');
        }

        $result = $calendar->exchangeCode($request->string('code')->toString());

        return redirect()
            ->route('google-calendar.settings')
            ->with($result['success'] ? 'success' : 'error', $result['message']);
    }

    public function disconnect(): RedirectResponse
    {
        $this->authorizeOwner();

        GoogleCalendarSetting::getInstance()->update([
            'access_token' => null,
            'refresh_token' => null,
            'token_expires_at' => null,
            'connected_email' => null,
        ]);

        return redirect()->back()->with('success', 'Google Calendar diputus.');
    }

    public function sync(): RedirectResponse
    {
        $this->authorizeOwner();

        $settings = GoogleCalendarSetting::getInstance();
        if (! $settings->isConfigured()) {
            return redirect()->back()->with('error', 'Hubungkan Google Calendar dulu sebelum menjalankan sync.');
        }

        Event::whereIn('order_type', [Event::ORDER_TYPE_MUA, Event::ORDER_TYPE_GOWN])
            ->whereNull('deleted_at')
            ->update([
                'google_sync_status' => Event::GOOGLE_SYNC_PENDING,
                'google_sync_error' => null,
            ]);

        $eventCount = Event::whereIn('order_type', [Event::ORDER_TYPE_MUA, Event::ORDER_TYPE_GOWN])
            ->whereNull('deleted_at')
            ->count();

        Event::whereIn('order_type', [Event::ORDER_TYPE_MUA, Event::ORDER_TYPE_GOWN])
            ->whereNull('deleted_at')
            ->orderBy('id')
            ->chunkById(200, function ($events): void {
                foreach ($events as $event) {
                    GoogleCalendarSyncJob::dispatchAfterResponse(
                        GoogleCalendarSyncJob::TYPE_EVENT,
                        $event->id,
                        GoogleCalendarSyncJob::ACTION_SYNC,
                    );
                }
            });

        Schedule::whereNull('deleted_at')
            ->update([
                'google_sync_status' => Schedule::GOOGLE_SYNC_PENDING,
                'google_sync_error' => null,
            ]);

        $scheduleCount = Schedule::whereNull('deleted_at')->count();

        Schedule::whereNull('deleted_at')
            ->orderBy('id')
            ->chunkById(200, function ($schedules): void {
                foreach ($schedules as $schedule) {
                    GoogleCalendarSyncJob::dispatchAfterResponse(
                        GoogleCalendarSyncJob::TYPE_SCHEDULE,
                        $schedule->id,
                        GoogleCalendarSyncJob::ACTION_SYNC,
                    );
                }
            });

        return redirect()->back()->with('success', "Sync Google Calendar dimasukkan ke antrean untuk {$eventCount} client dan {$scheduleCount} jadwal.");
    }

    private function authorizeOwner(): void
    {
        abort_unless(request()->user()?->isOwner(), 403);
    }

    private function syncSummary(): array
    {
        $eventCounts = Event::query()
            ->selectRaw('google_sync_status, COUNT(*) as total')
            ->whereIn('order_type', [Event::ORDER_TYPE_MUA, Event::ORDER_TYPE_GOWN])
            ->whereNull('deleted_at')
            ->groupBy('google_sync_status')
            ->pluck('total', 'google_sync_status');

        $scheduleCounts = Schedule::query()
            ->selectRaw('google_sync_status, COUNT(*) as total')
            ->whereNull('deleted_at')
            ->groupBy('google_sync_status')
            ->pluck('total', 'google_sync_status');

        $failedEvents = Event::query()
            ->where('google_sync_status', Event::GOOGLE_SYNC_FAILED)
            ->whereNull('deleted_at')
            ->latest('updated_at')
            ->take(5)
            ->get(['id', 'uuid', 'name', 'google_sync_attempts', 'google_sync_error', 'updated_at']);

        $failedSchedules = Schedule::query()
            ->where('google_sync_status', Schedule::GOOGLE_SYNC_FAILED)
            ->whereNull('deleted_at')
            ->latest('updated_at')
            ->take(5)
            ->get(['id', 'prospect_name', 'event_id', 'google_sync_attempts', 'google_sync_error', 'updated_at'])
            ->load('event:id,uuid,name');

        return [
            'events' => $this->normalizeCounts($eventCounts),
            'schedules' => $this->normalizeCounts($scheduleCounts),
            'failed_events' => $failedEvents,
            'failed_schedules' => $failedSchedules,
        ];
    }

    private function normalizeCounts($counts): array
    {
        return [
            Event::GOOGLE_SYNC_PENDING => (int) ($counts[Event::GOOGLE_SYNC_PENDING] ?? 0),
            Event::GOOGLE_SYNC_SYNCED => (int) ($counts[Event::GOOGLE_SYNC_SYNCED] ?? 0),
            Event::GOOGLE_SYNC_FAILED => (int) ($counts[Event::GOOGLE_SYNC_FAILED] ?? 0),
            Event::GOOGLE_SYNC_SKIPPED => (int) ($counts[Event::GOOGLE_SYNC_SKIPPED] ?? 0),
            Event::GOOGLE_SYNC_DELETED => (int) ($counts[Event::GOOGLE_SYNC_DELETED] ?? 0),
        ];
    }
}
