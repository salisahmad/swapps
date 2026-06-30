<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Event;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $year = $request->get('year', Carbon::now()->year);
        $month = $request->get('month', Carbon::now()->month);

        $start = Carbon::create($year, $month, 1)->startOfMonth();
        $end = $start->copy()->endOfMonth();

        // Daily breakdown
        $daily = Payment::whereBetween('created_at', [$start, $end])
            ->selectRaw('DATE(created_at) as date, 
                SUM(CASE WHEN is_expense = 0 AND status = 1 THEN amount ELSE 0 END) as earnings,
                SUM(CASE WHEN is_expense = 1 AND status = 1 THEN amount ELSE 0 END) as expenses')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Monthly summary
        $totalEarnings = Payment::whereBetween('created_at', [$start, $end])
            ->where('is_expense', Payment::EARNING)
            ->where('status', Payment::STATUS_CONFIRMED)
            ->sum('amount');

        $totalExpenses = Payment::whereBetween('created_at', [$start, $end])
            ->where('is_expense', Payment::EXPENSE)
            ->where('status', Payment::STATUS_CONFIRMED)
            ->sum('amount');

        $totalPending = Payment::whereBetween('created_at', [$start, $end])
            ->where('status', Payment::STATUS_PENDING)
            ->sum('amount');

        // Payment list for the month
        $payments = Payment::with('event:id,name')
            ->whereBetween('created_at', [$start, $end])
            ->orderBy('created_at', 'desc')
            ->paginate(30);

        // Event stats
        $newEvents = Event::whereBetween('created_at', [$start, $end])->count();
        $upcomingEvents = Event::whereBetween('date', [Carbon::today(), $end])
            ->where('date', '>=', Carbon::today())
            ->count();

        // Monthly chart data (last 12 months)
        $chartData = [];
        for ($i = 11; $i >= 0; $i--) {
            $mStart = Carbon::now()->subMonths($i)->startOfMonth();
            $mEnd = Carbon::now()->subMonths($i)->endOfMonth();
            $chartData[] = [
                'month' => $mStart->format('M Y'),
                'earnings' => (float) Payment::whereBetween('created_at', [$mStart, $mEnd])
                    ->where('is_expense', Payment::EARNING)
                    ->where('status', Payment::STATUS_CONFIRMED)
                    ->sum('amount'),
                'expenses' => (float) Payment::whereBetween('created_at', [$mStart, $mEnd])
                    ->where('is_expense', Payment::EXPENSE)
                    ->where('status', Payment::STATUS_CONFIRMED)
                    ->sum('amount'),
            ];
        }

        return Inertia::render('Reports/Index', [
            'filters' => ['year' => (int) $year, 'month' => (int) $month],
            'summary' => [
                'earnings' => (float) $totalEarnings,
                'expenses' => (float) $totalExpenses,
                'profit' => (float) ($totalEarnings - $totalExpenses),
                'pending' => (float) $totalPending,
                'new_events' => $newEvents,
                'upcoming_events' => $upcomingEvents,
            ],
            'daily' => $daily,
            'payments' => $payments,
            'chartData' => $chartData,
        ]);
    }
}
