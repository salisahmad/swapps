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
        $query = Schedule::with('event:id,name')
            ->orderBy('schedule_from', 'desc');

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

        // Get upcoming events for dropdown
        $events = Event::whereDate('date', '>=', Carbon::today())
            ->orderBy('date')
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
            'type' => 'required|integer|in:1,2',
            'schedule_from' => 'required|date',
            'schedule_to' => 'nullable|date|after_or_equal:schedule_from',
            'description' => 'nullable|string',
        ]);

        $validated['created_by'] = auth()->id();

        // Combine date + time if needed
        if ($request->has('time_from')) {
            $validated['schedule_from'] = $request->schedule_from . ' ' . $request->time_from;
        }
        if ($request->has('time_to') && $request->time_to) {
            $validated['schedule_to'] = $request->schedule_to . ' ' . $request->time_to;
        }

        Schedule::create($validated);

        return redirect()->back()->with('success', 'Jadwal berhasil ditambahkan.');
    }

    public function update(Request $request, Schedule $schedule)
    {
        $validated = $request->validate([
            'event_id' => 'required|exists:events,id',
            'type' => 'required|integer|in:1,2',
            'schedule_from' => 'required|date',
            'schedule_to' => 'nullable|date|after_or_equal:schedule_from',
            'description' => 'nullable|string',
        ]);

        if ($request->has('time_from')) {
            $validated['schedule_from'] = $request->schedule_from . ' ' . $request->time_from;
        }
        if ($request->has('time_to') && $request->time_to) {
            $validated['schedule_to'] = $request->schedule_to . ' ' . $request->time_to;
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
}
