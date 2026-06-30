<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Item;
use App\Models\Payment;
use App\Models\Schedule;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Event::query();

        // Search
        if ($request->filled('q')) {
            $query->where('name', 'like', '%' . $request->q . '%')
                ->orWhere('mobile_phone', 'like', '%' . $request->q . '%');
        }

        // Date range
        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        // Paid status
        if ($request->filled('paid')) {
            $query->where('is_fully_paid', $request->paid === '1');
        }

        // Order type
        if ($request->filled('order_type')) {
            $query->where('order_type', $request->order_type);
        }

        $events = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('Events/Index', [
            'events' => $events,
            'filters' => $request->only(['q', 'date_from', 'date_to', 'paid', 'order_type']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Events/Create', [
            'items' => Item::where('is_sold', false)->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'mobile_phone' => 'required|string|max:20',
            'date' => 'required|date',
            'time' => 'nullable',
            'address' => 'nullable|string',
            'location' => 'nullable|string',
            'package_description' => 'nullable|string',
            'total_amount' => 'required|numeric|min:0',
            'order_type' => 'required|integer|in:1,2,3',
            'item_ids' => 'nullable|array',
            'item_ids.*' => 'exists:items,id',
        ]);

        $event = Event::create([
            ...$validated,
            'uuid' => (string) Str::uuid(),
            'created_by' => auth()->id(),
        ]);

        if (!empty($validated['item_ids'])) {
            $event->items()->attach($validated['item_ids']);
        }

        return redirect()->route('events.index')->with('success', 'Event berhasil dibuat.');
    }

    public function show(Event $event): Response
    {
        return Inertia::render('Events/Show', [
            'event' => $event->load([
                'items.type',
                'schedules',
                'payments' => function ($q) {
                    $q->orderBy('created_at', 'desc');
                },
            ]),
        ]);
    }

    public function edit(Event $event): Response
    {
        return Inertia::render('Events/Edit', [
            'event' => $event->load('items'),
            'items' => Item::where('is_sold', false)->orWhereHas('events', function ($q) use ($event) {
                $q->where('event_id', $event->id);
            })->get(),
        ]);
    }

    public function update(Request $request, Event $event)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'mobile_phone' => 'required|string|max:20',
            'date' => 'required|date',
            'time' => 'nullable',
            'address' => 'nullable|string',
            'location' => 'nullable|string',
            'package_description' => 'nullable|string',
            'total_amount' => 'required|numeric|min:0',
            'order_type' => 'required|integer|in:1,2,3',
            'item_ids' => 'nullable|array',
            'item_ids.*' => 'exists:items,id',
        ]);

        $event->update($validated);

        if (isset($validated['item_ids'])) {
            $event->items()->sync($validated['item_ids']);
        }

        return redirect()->route('events.index')->with('success', 'Event berhasil diupdate.');
    }

    public function destroy(Event $event)
    {
        $event->delete();
        return redirect()->route('events.index')->with('success', 'Event berhasil dihapus.');
    }
}
