<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Schedule;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    public function index(Request $request): Response
    {
        $selectedEvent = $request->filled('event_id')
            ? Event::find($request->event_id, ['id', 'uuid', 'name', 'mobile_phone', 'date', 'time', 'order_type'])
            : null;
        $selectedSchedule = $request->filled('schedule_id')
            ? Schedule::with('event:id,uuid,name,mobile_phone,date,time,order_type')->find($request->schedule_id)
            : null;

        $query = Schedule::with('event:id,uuid,name,mobile_phone,date,time,order_type')
            ->orderBy('schedule_from');

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('schedule_from', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('schedule_from', '<=', $request->date_to);
        }

        if ($request->filled('q')) {
            $query->where(function ($query) use ($request) {
                $query->whereHas('event', function ($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->q . '%')
                        ->orWhere('mobile_phone', 'like', '%' . $request->q . '%');
                })
                    ->orWhere('prospect_name', 'like', '%' . $request->q . '%')
                    ->orWhere('prospect_mobile_phone', 'like', '%' . $request->q . '%');
            });
        }

        $schedules = $query->paginate(15)->withQueryString();

        $events = Event::whereDate('date', '>', Carbon::today())
            ->orderBy('name')
            ->get(['id', 'uuid', 'name', 'mobile_phone', 'date', 'time', 'order_type']);

        return Inertia::render('Schedules/Index', [
            'schedules' => $schedules,
            'filters' => $request->only(['type', 'date_from', 'date_to', 'q']),
            'events' => $events,
            'selected_event' => $selectedEvent,
            'selected_schedule' => $selectedSchedule,
            'open_modal' => $request->boolean('open'),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_source' => 'required|string|in:booked,prospect',
            'event_id' => 'nullable|exists:events,id',
            'prospect_name' => 'nullable|string|max:255',
            'prospect_mobile_phone' => 'nullable|string|max:30',
            'schedule_type' => 'required|integer|in:1,2',
            'schedule_from' => 'required|date',
            'schedule_to' => 'nullable|date|after_or_equal:schedule_from',
            'description' => 'nullable|string',
        ]);

        $this->validateClientData($request);
        $this->normalizeClientData($validated);

        $validated['type'] = $validated['schedule_type'];
        unset($validated['schedule_type'], $validated['client_source']);

        $validated['created_by'] = auth()->id();

        // Combine date + time if needed
        if ($request->has('time_from')) {
            $validated['schedule_from'] = $request->schedule_from . ' ' . $request->time_from;
        }
        if ($request->has('time_to') && $request->time_to) {
            $validated['schedule_to'] = ($request->schedule_to ?: $request->schedule_from) . ' ' . $request->time_to;
        }

        if ($this->hasConflict($validated['type'], $validated['schedule_from'], $validated['schedule_to'] ?? null)) {
            return redirect()->back()->withErrors([
                'schedule_from' => 'Jadwal bentrok dengan jadwal lain di tanggal dan jam tersebut.',
            ]);
        }

        Schedule::create($validated);

        if ($request->boolean('return_to_event') && $validated['event_id']) {
            $event = Event::find($validated['event_id']);
            if ($event) {
                return redirect()->route('events.show', ['event' => $event, 'tab' => 'schedule'])
                    ->with('success', 'Jadwal berhasil ditambahkan.');
            }
        }

        return redirect()->back()->with('success', 'Jadwal berhasil ditambahkan.');
    }

    public function update(Request $request, Schedule $schedule)
    {
        $validated = $request->validate([
            'client_source' => 'required|string|in:booked,prospect',
            'event_id' => 'nullable|exists:events,id',
            'prospect_name' => 'nullable|string|max:255',
            'prospect_mobile_phone' => 'nullable|string|max:30',
            'schedule_type' => 'required|integer|in:1,2',
            'schedule_from' => 'required|date',
            'schedule_to' => 'nullable|date|after_or_equal:schedule_from',
            'description' => 'nullable|string',
        ]);

        $this->validateClientData($request);
        $this->normalizeClientData($validated);

        $validated['type'] = $validated['schedule_type'];
        unset($validated['schedule_type'], $validated['client_source']);

        if ($request->has('time_from')) {
            $validated['schedule_from'] = $request->schedule_from . ' ' . $request->time_from;
        }
        if ($request->has('time_to') && $request->time_to) {
            $validated['schedule_to'] = ($request->schedule_to ?: $request->schedule_from) . ' ' . $request->time_to;
        }

        if ($this->hasConflict($validated['type'], $validated['schedule_from'], $validated['schedule_to'] ?? null, $schedule->id)) {
            return redirect()->back()->withErrors([
                'schedule_from' => 'Jadwal bentrok dengan jadwal lain di tanggal dan jam tersebut.',
            ]);
        }

        $schedule->update($validated);

        if ($request->boolean('return_to_event') && $schedule->event) {
            return redirect()->route('events.show', ['event' => $schedule->event, 'tab' => 'schedule'])
                ->with('success', 'Jadwal berhasil diupdate.');
        }

        return redirect()->back()->with('success', 'Jadwal berhasil diupdate.');
    }

    public function destroy(Request $request, Schedule $schedule)
    {
        $event = $schedule->event;
        $schedule->delete();

        if ($request->boolean('return_to_event') && $event) {
            return redirect()->route('events.show', ['event' => $event, 'tab' => 'schedule'])
                ->with('success', 'Jadwal berhasil dihapus.');
        }

        return redirect()->back()->with('success', 'Jadwal berhasil dihapus.');
    }

    public function takenTimes(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'type' => 'required|integer|in:1,2',
            'exclude_id' => 'nullable|integer',
        ]);

        $query = Schedule::whereDate('schedule_from', $request->date)
            ->where('type', $request->type);

        if ($request->exclude_id) {
            $query->where('id', '!=', $request->exclude_id);
        }

        $taken = $query->get(['schedule_from', 'schedule_to'])->map(function ($s) {
            return [
                'from' => Carbon::parse($s->schedule_from)->format('H:i'),
                'to' => $s->schedule_to ? Carbon::parse($s->schedule_to)->format('H:i') : null,
            ];
        });

        return response()->json($taken);
    }

    private function hasConflict(int $type, string $from, ?string $to = null, ?int $excludeId = null): bool
    {
        $start = Carbon::parse($from);
        $end = $to ? Carbon::parse($to) : $start->copy()->addHour();

        $query = Schedule::where('type', $type)
            ->whereDate('schedule_from', $start->toDateString());

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->get(['schedule_from', 'schedule_to'])->contains(function (Schedule $schedule) use ($start, $end) {
            $existingStart = Carbon::parse($schedule->schedule_from);
            $existingEnd = $schedule->schedule_to
                ? Carbon::parse($schedule->schedule_to)
                : $existingStart->copy()->addHour();

            return $start->lt($existingEnd) && $end->gt($existingStart);
        });
    }

    private function validateClientData(Request $request): void
    {
        if ($request->client_source === 'booked' && !$request->filled('event_id')) {
            throw ValidationException::withMessages([
                'event_id' => 'Pilih client dari hasil pencarian dulu.',
            ]);
        }

        if ($request->client_source === 'prospect' && (!$request->filled('prospect_name') || !$request->filled('prospect_mobile_phone'))) {
            throw ValidationException::withMessages([
                'prospect_name' => 'Nama dan nomor telepon calon client wajib diisi.',
            ]);
        }
    }

    private function normalizeClientData(array &$validated): void
    {
        if ($validated['client_source'] === 'booked') {
            $validated['prospect_name'] = null;
            $validated['prospect_mobile_phone'] = null;
            return;
        }

        $validated['event_id'] = null;
    }
}
