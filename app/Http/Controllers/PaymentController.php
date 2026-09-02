<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Payment;
use App\Models\ClientActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Intervention\Image\Laravel\Facades\Image;

class PaymentController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Payment::with(['event' => fn ($q) => $q->withTrashed()->select('id', 'uuid', 'name', 'date', 'deleted_at')]);
        $statusFilter = $request->input('status', [(string) Payment::STATUS_PENDING]);
        $statusFilter = is_array($statusFilter) ? $statusFilter : [$statusFilter];
        $statusFilter = array_values(array_intersect($statusFilter, [
            (string) Payment::STATUS_PENDING,
            (string) Payment::STATUS_CONFIRMED,
            (string) Payment::STATUS_REJECTED,
        ]));
        $isExpenseFilter = $request->input('is_expense', (string) Payment::EARNING);

        if (!empty($statusFilter)) {
            $query->whereIn('status', $statusFilter);
        }

        if ($isExpenseFilter !== '') {
            $query->where('is_expense', $isExpenseFilter);
        }

        if (
            $isExpenseFilter === (string) Payment::EARNING
            && $statusFilter === [(string) Payment::STATUS_PENDING]
        ) {
            $query->whereHas('event');
        }

        if ($request->filled('payment_type')) {
            $query->where('payment_type', $request->payment_type);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('payment_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('payment_at', '<=', $request->date_to);
        }

        $payments = $query
            ->orderByRaw('case when status = ? then 0 else 1 end', [Payment::STATUS_PENDING])
            ->orderByDesc('payment_at')
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        $totalEarnings = Payment::where('is_expense', Payment::EARNING)
            ->where('status', Payment::STATUS_CONFIRMED)
            ->sum('amount');
        $totalExpenses = Payment::where('is_expense', Payment::EXPENSE)
            ->where('status', Payment::STATUS_CONFIRMED)
            ->sum('amount');
        $totalPending = Payment::where('status', Payment::STATUS_PENDING)
            ->where('is_expense', Payment::EARNING)
            ->whereHas('event')
            ->sum('amount');

        return Inertia::render('Payments/Index', [
            'payments' => $payments,
            'filters' => [
                ...$request->only(['payment_type', 'date_from', 'date_to']),
                'status' => $statusFilter,
                'is_expense' => $isExpenseFilter,
            ],
            'stats' => [
                'total_earnings' => (float) $totalEarnings,
                'total_expenses' => (float) $totalExpenses,
                'total_pending' => (float) $totalPending,
                'profit' => (float) ($totalEarnings - $totalExpenses),
            ],
            'authUser' => [
                'id' => auth()->id(),
                'role' => auth()->user()->role,
                'is_admin' => auth()->user()->isAdmin(),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $selectedEvent = $request->filled('event_id')
            ? Event::find($request->event_id, ['id', 'name', 'date', 'total_amount'])
            : null;

        $events = Event::where('is_fully_paid', false)
            ->orderBy('name')
            ->get(['id', 'name', 'date', 'total_amount']);

        return Inertia::render('Payments/Create', [
            'events' => $events,
            'event_id' => $selectedEvent?->id,
            'selected_event' => $selectedEvent,
            'authUser' => [
                'id' => auth()->id(),
                'role' => auth()->user()->role,
                'is_admin' => auth()->user()->isAdmin(),
            ],
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
            'operational_cut' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'status' => 'required|integer|in:0,1,2',
            'receipt_image' => 'nullable|image|max:5120', // 5MB max
        ]);

        // Staff can only create pending payments
        if (auth()->user()->isStaff()) {
            $validated['status'] = Payment::STATUS_PENDING;
        }

        $receiptPath = null;
        if ($request->hasFile('receipt_image')) {
            $receiptPath = $this->compressAndStoreImage($request->file('receipt_image'));
        }

        $payment = Payment::create([
            ...$validated,
            'receipt_image' => $receiptPath,
            'operational_cut' => $validated['operational_cut'] ?? 0,
            'created_by' => auth()->id(),
        ]);

        $this->logPaymentChange($payment, 'Pembayaran ditambahkan.');

        // Update event paid status
        $this->updateEventPaidStatus($validated['event_id']);

        $redirect = $request->event_id
            ? route('events.show', Event::findOrFail($request->event_id))
            : route('payments.index');
        return redirect($redirect)->with('success', 'Pembayaran berhasil dicatat.');
    }

    public function edit(Payment $payment): Response
    {
        $events = Event::where(function ($q) {
            $q->where('is_fully_paid', false)
              ->orWhere('date', '>=', now()->toDateString());
        })
        ->orderBy('date', 'desc')
        ->get(['id', 'name', 'date', 'total_amount']);

        return Inertia::render('Payments/Edit', [
            'payment' => $payment,
            'events' => $events,
            'authUser' => [
                'id' => auth()->id(),
                'role' => auth()->user()->role,
                'is_admin' => auth()->user()->isAdmin(),
            ],
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
            'operational_cut' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'status' => 'required|integer|in:0,1,2',
            'receipt_image' => 'nullable|image|max:5120',
        ]);

        $receiptPath = $payment->receipt_image;
        if ($request->hasFile('receipt_image')) {
            // Delete old
            if ($receiptPath) {
                Storage::disk('public')->delete($receiptPath);
            }
            $receiptPath = $this->compressAndStoreImage($request->file('receipt_image'));
        }

        $before = $payment->only(['event_id', 'is_expense', 'payment_at', 'payment_type', 'amount', 'operational_cut', 'description', 'status']);

        $payment->update([
            ...$validated,
            'receipt_image' => $receiptPath,
            'operational_cut' => $validated['operational_cut'] ?? 0,
        ]);

        $this->updateEventPaidStatus($validated['event_id']);
        $this->logPaymentChange(
            $payment->fresh(),
            'Data pembayaran diubah.',
            $before,
            $payment->fresh()->only(['event_id', 'is_expense', 'payment_at', 'payment_type', 'amount', 'operational_cut', 'description', 'status']),
        );

        return redirect()->route('payments.index')->with('success', 'Pembayaran berhasil diupdate.');
    }

    public function destroy(Payment $payment)
    {
        $eventId = $payment->event_id;
        $before = $payment->only(['event_id', 'is_expense', 'payment_at', 'payment_type', 'amount', 'operational_cut', 'description', 'status']);
        
        if ($payment->receipt_image) {
            Storage::disk('public')->delete($payment->receipt_image);
        }
        
        $payment->delete();
        $this->updateEventPaidStatus($eventId);
        $event = Event::find($eventId);
        if ($event) {
            $this->logClientActivity($event, 'Data pembayaran dihapus.', $before);
        }

        return redirect()->route('payments.index')->with('success', 'Pembayaran berhasil dihapus.');
    }

    public function confirm(Payment $payment)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'Hanya admin yang dapat mengkonfirmasi pembayaran.');
        }
        $before = $payment->only(['status']);
        $payment->update(['status' => Payment::STATUS_CONFIRMED]);
        $this->updateEventPaidStatus($payment->event_id);
        $this->logPaymentChange($payment, 'Pembayaran dikonfirmasi.', $before, ['status' => Payment::STATUS_CONFIRMED]);
        return redirect()->back()->with('success', 'Pembayaran dikonfirmasi.');
    }

    public function reject(Payment $payment)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'Hanya admin yang dapat menolak pembayaran.');
        }
        $before = $payment->only(['status']);
        $payment->update(['status' => Payment::STATUS_REJECTED]);
        $this->updateEventPaidStatus($payment->event_id);
        $this->logPaymentChange($payment, 'Pembayaran ditolak.', $before, ['status' => Payment::STATUS_REJECTED]);
        return redirect()->back()->with('success', 'Pembayaran ditolak.');
    }

    private function compressAndStoreImage($file): string
    {
        $image = Image::decodePath($file->getRealPath());
        
        // Resize to max 800px width, keep aspect ratio
        $image->scaleDown(width: 800);
        
        // Compress to 80% quality
        $filename = 'receipts/' . uniqid() . '.jpg';
        
        Storage::disk('public')->makeDirectory('receipts');
        Storage::disk('public')->put($filename, $image->encodeUsingFileExtension('jpg', quality: 80));
        
        return $filename;
    }

    private function updateEventPaidStatus(int $eventId): void
    {
        $event = Event::find($eventId);
        $paid = $event->payments()
            ->where('is_expense', Payment::EARNING)
            ->where('status', Payment::STATUS_CONFIRMED)
            ->sum('amount');
        $event->update(['is_fully_paid' => $paid >= $event->grand_total]);
    }

    private function logPaymentChange(Payment $payment, string $message, ?array $before = null, ?array $after = null): void
    {
        $payment->loadMissing('event');

        if ($payment->event) {
            $this->logClientActivity($payment->event, $message, $before, $after ?? [
                'payment_id' => $payment->id,
                'amount' => $payment->amount,
                'payment_at' => $payment->payment_at?->format('Y-m-d'),
                'payment_type' => $payment->payment_type_name,
                'status' => $payment->status_name,
            ]);
        }
    }

    private function logClientActivity(Event $event, string $message, ?array $before = null, ?array $after = null): void
    {
        ClientActivityLog::create([
            'event_id' => $event->id,
            'user_id' => auth()->id(),
            'type' => ClientActivityLog::TYPE_PAYMENT_CHANGED,
            'message' => $message,
            'before' => $before,
            'after' => $after,
        ]);
    }
}
