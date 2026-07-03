<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Item;
use App\Models\Payment;
use App\Models\Schedule;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class EventController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Client::query();

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

        // Filter by order type (MUA/Sewa Gaun)
        if ($request->filled('order_type')) {
            $query->where('order_type', $request->order_type);
        }

        $clients = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('Clients/Index', [
            'clients' => $clients,
            'filters' => $request->only(['q', 'date_from', 'date_to', 'paid', 'order_type']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Clients/Create', [
            'items' => Item::where('is_sold', false)->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'mobile_phone' => 'required|string|max:20',
            'date' => 'required|date|after_or_equal:tomorrow', // Restrict date to tomorrow or later
            'time' => 'nullable',
            'address' => 'nullable|string',
            'location' => 'nullable|string',
            'package_description' => 'nullable|string',
            'total_amount' => 'required|numeric|min:0',
            'order_type' => 'required|integer|in:1,2',
            'item_ids' => 'nullable|array',
            'item_ids.*' => 'exists:items,id',
            'down_payment' => 'required|numeric|min:0', // New required field for DP
        ]);

        $client = Client::create([
            ...$validated,
            'uuid' => (string) Str::uuid(),
            'created_by' => auth()->id(),
        ]);

        if (!empty($validated['item_ids'])) {
            $client->items()->attach($validated['item_ids']);
        }

        return redirect()->route('clients.index')->with('success', 'Client berhasil dibuat.');
    }

    public function show(Client $client): Response
    {
        return Inertia::render('Clients/Show', [
            'client' => $client->load([
                'items.type',
                'schedules',
                'payments' => function ($q) {
                    $q->orderBy('created_at', 'desc');
                },
            ]),
        ]);
    }

    public function edit(Client $client): Response
    {
        return Inertia::render('Clients/Edit', [
            'client' => $client->load('items'),
            'items' => Item::where('is_sold', false)->orWhereHas('clients', function ($q) use ($client) {
                $q->where('client_id', $client->id);
            })->get(),
        ]);
    }

    public function update(Request $request, Client $client)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'mobile_phone' => 'required|string|max:20',
            'date' => 'required|date|after_or_equal:tomorrow', // Restrict date to tomorrow or later
            'time' => 'nullable',
            'address' => 'nullable|string',
            'location' => 'nullable|string',
            'package_description' => 'nullable|string',
            'total_amount' => 'required|numeric|min:0',
            'order_type' => 'required|integer|in:1,2',
            'item_ids' => 'nullable|array',
            'item_ids.*' => 'exists:items,id',
            'down_payment' => 'required|numeric|min:0', // New required field for DP
        ]);

        $client->update($validated);

        if (isset($validated['item_ids'])) {
            $client->items()->sync($validated['item_ids']);
        }

        return redirect()->route('clients.index')->with('success', 'Client berhasil diupdate.');
    }

    public function destroy(Client $client)
    {
        $client->delete();
        return redirect()->route('clients.index')->with('success', 'Client berhasil dihapus.');
    }
}