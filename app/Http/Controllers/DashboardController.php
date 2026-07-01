<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Payment;
use App\Models\Schedule;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();
        $startOfYear = Carbon::now()->startOfYear();
        $endOfYear = Carbon::now()->endOfYear();
        $startOfLastYear = Carbon::now()->subYear()->startOfYear();
        $endOfLastYear = Carbon::now()->subYear()->endOfYear();
        $startOfNextYear = Carbon::now()->addYear()->startOfYear();
        $endOfNextYear = Carbon::now()->addYear()->endOfYear();

        // ===== 1. Omset Tahun Lalu =====
        $lastYearEarnings = Payment::where('is_expense', Payment::EARNING)
            ->where('status', Payment::STATUS_CONFIRMED)
            ->whereBetween('created_at', [$startOfLastYear, $endOfLastYear])
            ->sum('amount');

        // ===== 2. Total Client Tahun Lalu =====
        $lastYearTotalEvents = Event::whereBetween('created_at', [$startOfLastYear, $endOfLastYear])->count();

        // ===== 3. Omset Tahun Ini =====
        $thisYearEarnings = Payment::where('is_expense', Payment::EARNING)
            ->where('status', Payment::STATUS_CONFIRMED)
            ->whereBetween('created_at', [$startOfYear, $endOfYear])
            ->sum('amount');

        // ===== 4. Total Client Tahun Ini =====
        $thisYearTotalEvents = Event::whereBetween('created_at', [$startOfYear, $endOfYear])->count();

        // ===== 5. Omset Bulan Ini =====
        $thisMonthEarnings = Payment::where('is_expense', Payment::EARNING)
            ->where('status', Payment::STATUS_CONFIRMED)
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        // ===== 6. Total Client Bulan Ini =====
        $thisMonthTotalEvents = Event::whereBetween('created_at', [$startOfMonth, $endOfMonth])->count();

        // ===== 7. Total Client Tahun Depan =====
        $nextYearTotalEvents = Event::whereBetween('date', [$startOfNextYear, $endOfNextYear])->count();

        // ===== 8. Hutang (DP events yang belum terlaksana) =====
        // Events with date >= today (future or today) that are not fully paid
        $hutangEvents = Event::where('date', '>=', $today)
            ->where('is_fully_paid', false)
            ->get();
        $hutangAmount = 0;
        foreach ($hutangEvents as $event) {
            $paid = $event->payments()
                ->where('is_expense', Payment::EARNING)
                ->where('status', Payment::STATUS_CONFIRMED)
                ->sum('amount');
            $hutangAmount += ($event->total_amount - $paid);
        }
        $hutangCount = $hutangEvents->count();

        // ===== 9. Closing Event Hari Ini =====
        $closingToday = Event::whereDate('created_at', $today)->count();

        // ===== 10. Closing Event Kemarin =====
        $closingYesterday = Event::whereDate('created_at', $today->copy()->subDay())->count();

        // Existing stats (keep for reference)
        $totalEvents = Event::count();
        $unpaidEvents = Event::where('is_fully_paid', false)->count();
        $totalUnpaidAmount = Event::where('is_fully_paid', false)->sum('total_amount');

        $expenses = Payment::where('is_expense', Payment::EXPENSE)
            ->where('status', Payment::STATUS_CONFIRMED)
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        $profit = $thisMonthEarnings - $expenses;

        // Events hari ini
        $todayEvents = Event::whereDate('date', $today)
            ->with(['payments' => function ($q) {
                $q->where('is_expense', Payment::EARNING)->where('status', Payment::STATUS_CONFIRMED);
            }])
            ->get();

        // Schedules hari ini
        $todaySchedules = Schedule::whereDate('schedule_from', $today)
            ->with('event')
            ->orderBy('schedule_from')
            ->get();

        // Upcoming events (7 hari)
        $upcomingEvents = Event::whereBetween('date', [$today, $today->copy()->addDays(7)])
            ->orderBy('date')
            ->take(5)
            ->get();

        // Unpaid events list
        $unpaidEventsList = Event::where('is_fully_paid', false)
            ->with('payments')
            ->orderBy('date')
            ->take(5)
            ->get();

        // Closing lists
        $closingTodayList = Event::whereDate('created_at', $today)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get(['id', 'name', 'date', 'total_amount', 'is_fully_paid']);

        $closingYesterdayList = Event::whereDate('created_at', $today->copy()->subDay())
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get(['id', 'name', 'date', 'total_amount', 'is_fully_paid']);

        // Client lists for dashboard
        $todayClients = Event::whereDate('created_at', $today)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get(['id', 'name', 'date', 'total_amount', 'is_fully_paid']);

        $nextYearClients = Event::whereBetween('date', [$startOfNextYear, $endOfNextYear])
            ->orderBy('date')
            ->take(5)
            ->get(['id', 'name', 'date', 'total_amount', 'is_fully_paid']);

        return Inertia::render('Dashboard', [
            'stats' => [
                'total_events' => $totalEvents,
                'earnings' => (float) $thisMonthEarnings,
                'expenses' => (float) $expenses,
                'profit' => (float) $profit,
                'unpaid_events' => $unpaidEvents,
                'total_unpaid_amount' => (float) $totalUnpaidAmount,
                'this_year_earnings' => (float) $thisYearEarnings,
                'this_year_total_events' => $thisYearTotalEvents,
                'this_month_earnings' => (float) $thisMonthEarnings,
                'this_month_total_events' => $thisMonthTotalEvents,
                'next_year_total_events' => $nextYearTotalEvents,
                'hutang_amount' => (float) $hutangAmount,
                'hutang_count' => $hutangCount,
                // Combined last year card
                'last_year_summary' => [
                    'earnings' => (float) $lastYearEarnings,
                    'clients' => $lastYearTotalEvents,
                ],
            ],
            'todayEvents' => $todayEvents,
            'todaySchedules' => $todaySchedules,
            'upcomingEvents' => $upcomingEvents,
            'unpaidEventsList' => $unpaidEventsList,
            'todayClients' => $todayClients,
            'nextYearClients' => $nextYearClients,
            'closingTodayList' => $closingTodayList,
            'closingYesterdayList' => $closingYesterdayList,
            'authUser' => [
                'id' => auth()->id(),
                'role' => auth()->user()->role,
                'is_admin' => auth()->user()->isAdmin(),
            ],
        ]);
    }
}
