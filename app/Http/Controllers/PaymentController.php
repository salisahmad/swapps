<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Payment::with('event:id,name');

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by type (earning/expense)
        if ($request->filled('is_expense')) {
            $query->where('is_expense', $request->is_expense);
        }

        // Date range
        if ($request->filled('date_from')) {
            $query->whereDate('payment_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('payment_at', '<=', $request->date_to);
        }

        $payments = $query->latest()->paginate(15)->withQueryString();

        // Summary stats
        $totalEarnings = Payment::where('is_expense', Payment::EARNING)
            ->where('status', Payment::STATUS_CONFIRMED)
            ->sum('amount');
        $totalExpenses = Payment::where('is_expense', Payment::EXPENSE)
            ->where('status', Payment::STATUS_CONFIRMED)
            ->sum('amount');
        $totalPending = Payment::where('status', Payment::STATUS_PENDING)
            ->sum('amount');

        return Inertia::render('Payments/Index', [
            'payments' => $payments,
            'filters' => $request->only(['status', 'is_expense', 'date_from', 'date_to']),
            'stats' => [
                'total_earnings' => (float) $totalEarnings,
                'total_expenses' => (float) $totalExpenses,
                'total_pending' => (float) $totalPending,
                'profit' => (float) ($totalEarnings - $totalExpenses),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Payments/Create', [
            'events' => Event::orderBy('date', 'desc')->get(['id', 'name', 'date', 'total_amount']),
            'event_id' => $request->event_id,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'event_id' => 'required|exists:events,id',
            'is_expense' => 'required|integer|in:0,1,2',
            'type' => 'nullable|integer',
            'payment_at' => 'required|date',
            'payment_type' => 'required|integer|in:0,1,2,3,4',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'status' => 'required|integer|in:0,1,2',
        ]);

        Payment::create([
            ...$validated,
            'created_by' => auth()->id(),
        ]);

        // Update event is_fully_paid if needed
        $event = Event::find($validated['event_id']);
        $paid = $event->payments()
            ->where('is_expense', Payment::EARNING)
            ->where('status', Payment::STATUS_CONFIRMED)
            ->sum('amount');
        if ($paid >= $event->total_amount) {
            $event->update(['is_fully_paid' => true]);
        }

        $redirect = $request->event_id ? route('events.show', $request->event_id) : route('payments.index');
        return redirect($redirect)->with('success', 'Pembayaran berhasil dicatat.');
    }

    public function edit(Payment $payment): Response
    {
        return Inertia::render('Payments/Edit', [
            'payment' => $payment,
            'events' => Event::orderBy('date', 'desc')->get(['id', 'name', 'date', 'total_amount']),
        ]);
    }

    public function update(Request $request, Payment $payment)
    {
        $validated = $request->validate([
            'event_id' => 'required|exists:events,id',
            'is_expense' => 'required|integer|in:0,1,2',
            'type' => 'nullable|integer',
            'payment_at' => 'required|date',
            'payment_type' => 'required|integer|in:0,1,2,3,4',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'status' => 'required|integer|in:0,1,2',
        ]);

        $payment->update($validated);

        // Recalculate event paid status
        $event = Event::find($validated['event_id']);
        $paid = $event->payments()
            ->where('is_expense', Payment::EARNING)
            ->where('status', Payment::STATUS_CONFIRMED)
            ->sum('amount');
        $event->update(['is_fully_paid' => $paid >= $event->total_amount]);

        return redirect()->route('payments.index')->with('success', 'Pembayaran berhasil diupdate.');
    }

    public function destroy(Payment $payment)
    {
        $eventId = $payment->event_id;
        $payment->delete();

        // Recalculate event paid status
        $event = Event::find($eventId);
        $paid = $event->payments()
            ->where('is_expense', Payment::EARNING)
            ->where('status', Payment::STATUS_CONFIRMED)
            ->sum('amount');
        $event->update(['is_fully_paid' => $paid >= $event->total_amount]);

        return redirect()->route('payments.index')->with('success', 'Pembayaran berhasil dihapus.');
    }

    public function confirm(Payment $payment)
    {
        $payment->update(['status' => Payment::STATUS_CONFIRMED]);

        $event = Event::find($payment->event_id);
        $paid = $event->payments()
            ->where('is_expense', Payment::EARNING)
            ->where('status', Payment::STATUS_CONFIRMED)
            ->sum('amount');
        $event->update(['is_fully_paid' => $paid >= $event->total_amount]);

        return redirect()->back()->with('success', 'Pembayaran dikonfirmasi.');
    }

    public function reject(Payment $payment)
    {
        $payment->update(['status' => Payment::STATUS_REJECTED]);

        $event = Event::find($payment->event_id);
        $paid = $event->payments()
            ->where('is_expense', Payment::EARNING)
            ->where('status', Payment::STATUS_CONFIRMED)
            ->sum('amount');
        $event->update(['is_fully_paid' => $paid >= $event->total_amount]);

        return redirect()->back()->with('success', 'Pembayaran ditolak.');
    }
}
