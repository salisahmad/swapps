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
        $businessNow = Carbon::now('Asia/Jakarta');
        $today = $businessNow->copy()->startOfDay();
        $startOfMonth = $businessNow->copy()->startOfMonth();
        $endOfMonth = $businessNow->copy()->endOfMonth();
        $startOfYear = $businessNow->copy()->startOfYear();
        $endOfYear = $businessNow->copy()->endOfYear();
        $startOfLastYear = $businessNow->copy()->subYear()->startOfYear();
        $endOfLastYear = $businessNow->copy()->subYear()->endOfYear();
        $todayDate = $today->toDateString();
        $yesterday = $today->copy()->subDay();
        $unpaidClientCutoffDate = $today->copy()->addDays(2)->toDateString();
        $appTimezone = config('app.timezone');
        $toAppTimezoneRange = fn (Carbon $start, Carbon $end) => [
            $start->copy()->setTimezone($appTimezone),
            $end->copy()->setTimezone($appTimezone),
        ];

        $lastYearInputRange = $toAppTimezoneRange($startOfLastYear, $endOfLastYear);
        $thisYearInputRange = $toAppTimezoneRange($startOfYear, $endOfYear);
        $thisMonthInputRange = $toAppTimezoneRange($startOfMonth, $endOfMonth);
        $todayInputRange = $toAppTimezoneRange($today, $today->copy()->endOfDay());
        $yesterdayInputRange = $toAppTimezoneRange($yesterday->copy()->startOfDay(), $yesterday->copy()->endOfDay());
        $lastYearDateRange = [$startOfLastYear->toDateString(), $endOfLastYear->toDateString()];
        $thisYearDateRange = [$startOfYear->toDateString(), $endOfYear->toDateString()];
        $thisMonthDateRange = [$startOfMonth->toDateString(), $endOfMonth->toDateString()];
        $revenueDisplayStatuses = [Payment::STATUS_PENDING, Payment::STATUS_CONFIRMED];

        // ===== 1. Omset Tahun Lalu =====
        $lastYearEarnings = Payment::where('is_expense', Payment::EARNING)
            ->whereIn('status', $revenueDisplayStatuses)
            ->whereHas('event', fn ($query) => $query->whereBetween('date', $lastYearDateRange))
            ->sum('amount');

        // ===== 2. Total Client Tahun Lalu =====
        $lastYearTotalEvents = Event::whereBetween('date', $lastYearDateRange)->count();

        // ===== 3. Omset Tahun Ini =====
        $thisYearEarnings = Payment::where('is_expense', Payment::EARNING)
            ->whereIn('status', $revenueDisplayStatuses)
            ->whereHas('event', fn ($query) => $query->whereBetween('date', $thisYearDateRange))
            ->sum('amount');
        $thisYearCashIn = Payment::where('is_expense', Payment::EARNING)
            ->where('status', Payment::STATUS_CONFIRMED)
            ->whereBetween('payment_at', $thisYearDateRange)
            ->sum('amount');

        // ===== 4. Total Client Tahun Ini =====
        $thisYearTotalEvents = Event::whereBetween('date', $thisYearDateRange)->count();

        // ===== 5. Omset Bulan Ini =====
        $thisMonthEarnings = Payment::where('is_expense', Payment::EARNING)
            ->whereIn('status', $revenueDisplayStatuses)
            ->whereHas('event', fn ($query) => $query->whereBetween('date', $thisMonthDateRange))
            ->sum('amount');

        // ===== 6. Total Client Bulan Ini =====
        $thisMonthTotalEvents = Event::whereBetween('date', $thisMonthDateRange)->count();
        $thisMonthMuaEvents = Event::whereBetween('date', $thisMonthDateRange)
            ->where('order_type', Event::ORDER_TYPE_MUA)
            ->count();
        $thisMonthGownEvents = Event::whereBetween('date', $thisMonthDateRange)
            ->where('order_type', Event::ORDER_TYPE_GOWN)
            ->count();
        $thisYearMuaEvents = Event::whereBetween('date', $thisYearDateRange)
            ->where('order_type', Event::ORDER_TYPE_MUA)
            ->count();
        $thisYearGownEvents = Event::whereBetween('date', $thisYearDateRange)
            ->where('order_type', Event::ORDER_TYPE_GOWN)
            ->count();
        $remainingThisYearEvents = Event::whereBetween('date', [$todayDate, $endOfYear->toDateString()])
            ->count();
        $remainingThisYearMuaEvents = Event::whereBetween('date', [$todayDate, $endOfYear->toDateString()])
            ->where('order_type', Event::ORDER_TYPE_MUA)
            ->count();
        $remainingThisYearGownEvents = Event::whereBetween('date', [$todayDate, $endOfYear->toDateString()])
            ->where('order_type', Event::ORDER_TYPE_GOWN)
            ->count();
        $futurePaidThisYearEvents = Event::whereBetween('date', [$todayDate, $endOfYear->toDateString()])
            ->whereHas('payments', fn ($query) => $query
                ->where('is_expense', Payment::EARNING)
                ->where('status', Payment::STATUS_CONFIRMED))
            ->count();
        $futurePaidThisYearTotal = Payment::where('is_expense', Payment::EARNING)
            ->where('status', Payment::STATUS_CONFIRMED)
            ->whereHas('event', fn ($query) => $query->whereBetween('date', [$todayDate, $endOfYear->toDateString()]))
            ->sum('amount');
        $futurePaidAllEvents = Event::whereDate('date', '>=', $todayDate)
            ->whereHas('payments', fn ($query) => $query
                ->where('is_expense', Payment::EARNING)
                ->where('status', Payment::STATUS_CONFIRMED))
            ->count();
        $futurePaidAllTotal = Payment::where('is_expense', Payment::EARNING)
            ->where('status', Payment::STATUS_CONFIRMED)
            ->whereHas('event', fn ($query) => $query->whereDate('date', '>=', $todayDate))
            ->sum('amount');

        // ===== 7. Client belum lunas sampai dua hari ke depan =====
        $overdueUnpaidEvents = Event::whereDate('date', '<=', $unpaidClientCutoffDate)
            ->where('is_fully_paid', false)
            ->with(['additionalCosts', 'payments' => function ($q) {
                $q->where('is_expense', Payment::EARNING)
                    ->where('status', Payment::STATUS_CONFIRMED);
            }])
            ->orderBy('date', 'desc')
            ->get();

        $overdueUnpaidTotal = $overdueUnpaidEvents->sum(function ($event) {
            return max(0, $event->grand_total - $event->payments->sum('amount'));
        });

        $overdueUnpaidCount = $overdueUnpaidEvents->count();

        $totalEvents = Event::count();

        $expenses = Payment::where('is_expense', Payment::EXPENSE)
            ->where('status', Payment::STATUS_CONFIRMED)
            ->whereBetween('created_at', $thisMonthInputRange)
            ->sum('amount');

        $profit = $thisMonthEarnings - $expenses;

        $todaySchedules = Schedule::whereDate('schedule_from', $todayDate)
            ->with('event:id,uuid,name,mobile_phone,date,time,order_type')
            ->orderBy('schedule_from')
            ->get();

        $nextSchedules = Schedule::whereDate('schedule_from', '>', $todayDate)
            ->with('event:id,uuid,name,mobile_phone,date,time,order_type')
            ->orderBy('schedule_from')
            ->take(5)
            ->get();

        $nextClients = Event::whereDate('date', '>=', $todayDate)
            ->with('additionalCosts')
            ->orderBy('date')
            ->take(5)
            ->get(['id', 'uuid', 'name', 'date', 'time', 'location', 'total_amount', 'discount_amount', 'is_fully_paid', 'order_type']);

        // Closing lists
        $closingTodayList = Event::whereBetween('created_at', $todayInputRange)
            ->with('additionalCosts')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get(['id', 'uuid', 'name', 'date', 'total_amount', 'discount_amount', 'is_fully_paid', 'order_type']);

        $closingYesterdayList = Event::whereBetween('created_at', $yesterdayInputRange)
            ->with('additionalCosts')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get(['id', 'uuid', 'name', 'date', 'total_amount', 'discount_amount', 'is_fully_paid', 'order_type']);

        return Inertia::render('Dashboard', [
            'stats' => [
                'total_events' => $totalEvents,
                'earnings' => (float) $thisMonthEarnings,
                'expenses' => (float) $expenses,
                'profit' => (float) $profit,
                'overdue_unpaid_count' => $overdueUnpaidCount,
                'overdue_unpaid_total' => (float) $overdueUnpaidTotal,
                'this_year_earnings' => (float) $thisYearEarnings,
                'this_year_cash_in' => (float) $thisYearCashIn,
                'this_year_total_events' => $thisYearTotalEvents,
                'this_month_earnings' => (float) $thisMonthEarnings,
                'this_month_total_events' => $thisMonthTotalEvents,
                // Combined last year card
                'last_year_summary' => [
                    'earnings' => (float) $lastYearEarnings,
                    'clients' => $lastYearTotalEvents,
                ],
                'this_month_summary' => [
                    'earnings' => (float) $thisMonthEarnings,
                    'clients' => $thisMonthTotalEvents,
                    'mua_clients' => $thisMonthMuaEvents,
                    'gown_clients' => $thisMonthGownEvents,
                ],
                'this_year_client_summary' => [
                    'total' => $thisYearTotalEvents,
                    'mua_clients' => $thisYearMuaEvents,
                    'gown_clients' => $thisYearGownEvents,
                ],
                'remaining_this_year_client_summary' => [
                    'total' => $remainingThisYearEvents,
                    'mua_clients' => $remainingThisYearMuaEvents,
                    'gown_clients' => $remainingThisYearGownEvents,
                ],
                'future_paid_summary' => [
                    'this_year_total' => (float) $futurePaidThisYearTotal,
                    'this_year_clients' => $futurePaidThisYearEvents,
                    'all_total' => (float) $futurePaidAllTotal,
                    'all_clients' => $futurePaidAllEvents,
                ],
            ],
            'todayFittingSchedules' => $todaySchedules,
            'nextFittingSchedules' => $nextSchedules,
            'nextClients' => $nextClients,
            'overdueUnpaidClients' => $overdueUnpaidEvents,
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
