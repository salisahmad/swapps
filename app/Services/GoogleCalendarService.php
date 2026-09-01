<?php

namespace App\Services;

use App\Models\Event;
use App\Models\GoogleCalendarSetting;
use App\Models\Schedule;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;

class GoogleCalendarService
{
    private const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

    private const TOKEN_URL = 'https://oauth2.googleapis.com/token';

    private const CALENDAR_API_URL = 'https://www.googleapis.com/calendar/v3';

    private const USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

    private const SCOPE = 'https://www.googleapis.com/auth/calendar.events';

    private const COLOR_CHERRY_BLOSSOM = '4';

    private const COLOR_COBALT = '9';

    private const COLOR_MANGO = '5';

    private const COLOR_AVOCADO = '2';

    public function authUrl(GoogleCalendarSetting $settings): string
    {
        $state = Str::random(40);
        session(['google_calendar_oauth_state' => $state]);

        return self::AUTH_URL.'?'.http_build_query([
            'client_id' => $settings->client_id,
            'redirect_uri' => $this->publicRoute('google-calendar.callback'),
            'response_type' => 'code',
            'scope' => self::SCOPE,
            'access_type' => 'offline',
            'prompt' => 'consent',
            'state' => $state,
        ]);
    }

    public function exchangeCode(string $code): array
    {
        $settings = GoogleCalendarSetting::getInstance();

        $response = Http::asForm()->post(self::TOKEN_URL, [
            'client_id' => $settings->client_id,
            'client_secret' => $settings->client_secret,
            'code' => $code,
            'grant_type' => 'authorization_code',
            'redirect_uri' => $this->publicRoute('google-calendar.callback'),
        ]);

        if (! $response->successful()) {
            return [
                'success' => false,
                'message' => 'Gagal menghubungkan Google Calendar. Cek Client ID, Client Secret, dan Redirect URI.',
            ];
        }

        $token = $response->json();
        $settings->update([
            'enabled' => true,
            'access_token' => $token['access_token'] ?? null,
            'refresh_token' => $token['refresh_token'] ?? $settings->refresh_token,
            'token_expires_at' => now()->addSeconds((int) ($token['expires_in'] ?? 3600) - 60),
        ]);

        $this->refreshConnectedEmail($settings->fresh());

        return [
            'success' => true,
            'message' => 'Google Calendar berhasil terhubung.',
        ];
    }

    public function syncEvent(Event $event): string
    {
        $settings = GoogleCalendarSetting::getInstance();

        if (! $settings->isConfigured()) {
            return Event::GOOGLE_SYNC_SKIPPED;
        }

        if (! in_array((int) $event->order_type, [Event::ORDER_TYPE_MUA, Event::ORDER_TYPE_GOWN], true)) {
            return $this->deleteEvent($event);
        }

        $accessToken = $this->accessToken($settings);
        if (! $accessToken) {
            throw new RuntimeException('Google Calendar token tidak valid. Coba connect ulang.');
        }

        $googleEventId = $this->upsertGoogleEvent(
            $accessToken,
            $settings,
            $this->eventPayload($event, $settings),
            $event->google_event_id,
            'client',
            $event->id,
        );

        if ($googleEventId && $googleEventId !== $event->google_event_id) {
            $event->forceFill(['google_event_id' => $googleEventId])->saveQuietly();
        }

        return Event::GOOGLE_SYNC_SYNCED;
    }

    public function syncSchedule(Schedule $schedule): string
    {
        $settings = GoogleCalendarSetting::getInstance();

        if (! $settings->isConfigured()) {
            return Schedule::GOOGLE_SYNC_SKIPPED;
        }

        $accessToken = $this->accessToken($settings);
        if (! $accessToken) {
            throw new RuntimeException('Google Calendar token tidak valid. Coba connect ulang.');
        }

        $schedule->loadMissing('event');

        $googleEventId = $this->upsertGoogleEvent(
            $accessToken,
            $settings,
            $this->schedulePayload($schedule),
            $schedule->google_event_id,
            'schedule',
            $schedule->id,
        );

        if ($googleEventId && $googleEventId !== $schedule->google_event_id) {
            $schedule->forceFill(['google_event_id' => $googleEventId])->saveQuietly();
        }

        return Schedule::GOOGLE_SYNC_SYNCED;
    }

    public function deleteEvent(Event $event): string
    {
        return $this->deleteGoogleEvent($event, 'client');
    }

    public function deleteSchedule(Schedule $schedule): string
    {
        return $this->deleteGoogleEvent($schedule, 'schedule');
    }

    private function deleteGoogleEvent(Event|Schedule $model, string $type): string
    {
        $settings = GoogleCalendarSetting::getInstance();

        if (! $model->google_event_id) {
            return Event::GOOGLE_SYNC_DELETED;
        }

        if (! $settings->isConfigured()) {
            return Event::GOOGLE_SYNC_SKIPPED;
        }

        $accessToken = $this->accessToken($settings);
        if (! $accessToken) {
            throw new RuntimeException('Google Calendar token tidak valid. Coba connect ulang.');
        }

        try {
            $calendarId = rawurlencode($settings->calendar_id ?: 'primary');
            $response = Http::withToken($accessToken)
                ->timeout(15)
                ->delete(self::CALENDAR_API_URL."/calendars/{$calendarId}/events/{$model->google_event_id}");

            if (! $response->successful() && $response->status() !== 404) {
                throw new RuntimeException("Google Calendar delete gagal ({$response->status()}): {$response->body()}");
            }

            $model->forceFill(['google_event_id' => null])->saveQuietly();

            return Event::GOOGLE_SYNC_DELETED;
        } catch (\Throwable $exception) {
            Log::warning('Google Calendar delete failed', [
                'type' => $type,
                'model_id' => $model->id,
                'message' => $exception->getMessage(),
            ]);

            throw $exception;
        }
    }

    private function accessToken(GoogleCalendarSetting $settings): ?string
    {
        if ($settings->access_token && $settings->token_expires_at?->isFuture()) {
            return $settings->access_token;
        }

        if (! $settings->refresh_token) {
            return null;
        }

        $response = Http::asForm()->post(self::TOKEN_URL, [
            'client_id' => $settings->client_id,
            'client_secret' => $settings->client_secret,
            'refresh_token' => $settings->refresh_token,
            'grant_type' => 'refresh_token',
        ]);

        if (! $response->successful()) {
            return null;
        }

        $token = $response->json();
        $settings->update([
            'access_token' => $token['access_token'] ?? null,
            'token_expires_at' => now()->addSeconds((int) ($token['expires_in'] ?? 3600) - 60),
        ]);

        return $token['access_token'] ?? null;
    }

    private function refreshConnectedEmail(GoogleCalendarSetting $settings): void
    {
        $accessToken = $this->accessToken($settings);
        if (! $accessToken) {
            return;
        }

        $response = Http::withToken($accessToken)->get(self::USERINFO_URL);
        if ($response->successful()) {
            $settings->update(['connected_email' => $response->json('email')]);
        }
    }

    private function upsertGoogleEvent(
        string $accessToken,
        GoogleCalendarSetting $settings,
        array $payload,
        ?string $existingGoogleEventId,
        string $type,
        int $modelId,
    ): string {
        $calendarId = rawurlencode($settings->calendar_id ?: 'primary');

        try {
            if ($existingGoogleEventId) {
                $response = Http::withToken($accessToken)
                    ->timeout(15)
                    ->patch(self::CALENDAR_API_URL."/calendars/{$calendarId}/events/{$existingGoogleEventId}", $payload);

                if ($response->successful()) {
                    return $existingGoogleEventId;
                }

                if ($response->status() !== 404) {
                    Log::warning('Google Calendar update rejected', [
                        'type' => $type,
                        'model_id' => $modelId,
                        'status' => $response->status(),
                        'body' => $response->body(),
                    ]);

                    throw new RuntimeException("Google Calendar update gagal ({$response->status()}): {$response->body()}");
                }
            }

            $response = Http::withToken($accessToken)
                ->timeout(15)
                ->post(self::CALENDAR_API_URL."/calendars/{$calendarId}/events", $payload);

            if ($response->successful() && $response->json('id')) {
                return $response->json('id');
            }

            Log::warning('Google Calendar create rejected', [
                'type' => $type,
                'model_id' => $modelId,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new RuntimeException("Google Calendar create gagal ({$response->status()}): {$response->body()}");
        } catch (\Throwable $exception) {
            Log::warning('Google Calendar sync failed', [
                'type' => $type,
                'model_id' => $modelId,
                'message' => $exception->getMessage(),
            ]);

            throw $exception;
        }
    }

    private function eventPayload(Event $event, GoogleCalendarSetting $settings): array
    {
        $date = $event->date instanceof Carbon
            ? $event->date->format('Y-m-d')
            : Carbon::parse($event->date)->format('Y-m-d');
        $time = $event->time ? Carbon::parse($event->time)->format('H:i:s') : '00:00:00';
        $start = Carbon::parse("{$date} {$time}", config('app.timezone'));
        $end = $start->copy()->addHours(2);

        return [
            'summary' => $event->name,
            'location' => $event->location,
            'description' => $this->eventDescription($event, $date, $time),
            'colorId' => (int) $event->order_type === Event::ORDER_TYPE_GOWN
                ? self::COLOR_COBALT
                : ($settings->color_id ?: self::COLOR_CHERRY_BLOSSOM),
            'start' => [
                'dateTime' => $start->toRfc3339String(),
                'timeZone' => config('app.timezone'),
            ],
            'end' => [
                'dateTime' => $end->toRfc3339String(),
                'timeZone' => config('app.timezone'),
            ],
        ];
    }

    private function eventDescription(Event $event, string $date, string $time): string
    {
        return implode("\n", [
            'Client Detail:',
            $this->publicRoute('events.show', $event),
            '',
            '- Jenis: '.$event->order_type_name,
            '- Nomor WA: '.($event->mobile_phone ?: '-'),
            '- Tanggal Acara: '.$date,
            '- Jam Acara: '.($event->time ? Carbon::parse($time)->format('H:i') : '-'),
            '- Link Maps: '.($event->location ?: '-'),
            '- Alamat: '.($event->address ?: '-'),
            '- Deskripsi Paket: '.($event->package_description ?: '-'),
        ]);
    }

    private function schedulePayload(Schedule $schedule): array
    {
        $start = Carbon::parse($schedule->schedule_from, config('app.timezone'));
        $end = $schedule->schedule_to
            ? Carbon::parse($schedule->schedule_to, config('app.timezone'))
            : $start->copy()->addHour();
        $typeName = (int) $schedule->type === Schedule::TYPE_CONSULT ? '[K]' : '[F]';
        $prospectMarker = $schedule->event ? '' : ' [TW]';

        return [
            'summary' => "{$typeName}{$prospectMarker} {$schedule->client_name}",
            'description' => implode("\n", array_filter([
                $schedule->event ? 'Link Client: '.$this->publicRoute('events.show', $schedule->event) : null,
                'Status: '.$schedule->client_status_name,
                'Telepon: '.($schedule->client_phone ?: '-'),
                'Keterangan: '.($schedule->description ?: '-'),
            ])),
            'colorId' => (int) $schedule->type === Schedule::TYPE_CONSULT
                ? self::COLOR_AVOCADO
                : self::COLOR_MANGO,
            'start' => [
                'dateTime' => $start->toRfc3339String(),
                'timeZone' => config('app.timezone'),
            ],
            'end' => [
                'dateTime' => $end->toRfc3339String(),
                'timeZone' => config('app.timezone'),
            ],
        ];
    }

    private function publicRoute(string $name, mixed $parameters = []): string
    {
        return rtrim((string) config('app.url'), '/').route($name, $parameters, false);
    }
}
