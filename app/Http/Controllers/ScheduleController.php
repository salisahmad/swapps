<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Schedule;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Schedule::with('event:id,uuid,name')
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
            $query->whereHas('event', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->q . '%');
            });
        }

        $schedules = $query->paginate(15)->withQueryString();

        $events = Event::whereDate('date', '>', Carbon::today())
            ->orderBy('name')
            ->get(['id', 'name', 'date']);

        return Inertia::render('Schedules/Index', [
            'schedules' => $schedules,
            'filters' => $request->only(['type', 'date_from', 'date_to', 'q']),
            'events' => $events,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'event_id' => 'required|exists:events,id',
            'schedule_type' => 'required|integer|in:1,2',
            'schedule_from' => 'required|date',
            'schedule_to' => 'nullable|date|after_or_equal:schedule_from',
            'description' => 'nullable|string',
        ]);
        $validated['type'] = $validated['schedule_type'];
        unset($validated['schedule_type']);

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

        return redirect()->back()->with('success', 'Jadwal berhasil ditambahkan.');
    }

    public function update(Request $request, Schedule $schedule)
    {
        $validated = $request->validate([
            'event_id' => 'required|exists:events,id',
            'schedule_type' => 'required|integer|in:1,2',
            'schedule_from' => 'required|date',
            'schedule_to' => 'nullable|date|after_or_equal:schedule_from',
            'description' => 'nullable|string',
        ]);
        $validated['type'] = $validated['schedule_type'];
        unset($validated['schedule_type']);

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

        return redirect()->back()->with('success', 'Jadwal berhasil diupdate.');
    }

    public function destroy(Schedule $schedule)
    {
        $schedule->delete();
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
}
