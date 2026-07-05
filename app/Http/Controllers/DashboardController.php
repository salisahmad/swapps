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

        // ===== 1. Omset Tahun Lalu =====
        $lastYearEarnings = Payment::where('is_expense', Payment::EARNING)
            ->where('status', Payment::STATUS_CONFIRMED)
            ->whereBetween('created_at', $lastYearInputRange)
            ->sum('amount');

        // ===== 2. Total Client Tahun Lalu =====
        $lastYearTotalEvents = Event::whereBetween('created_at', $lastYearInputRange)->count();

        // ===== 3. Omset Tahun Ini =====
        $thisYearEarnings = Payment::where('is_expense', Payment::EARNING)
            ->where('status', Payment::STATUS_CONFIRMED)
            ->whereBetween('created_at', $thisYearInputRange)
            ->sum('amount');

        // ===== 4. Total Client Tahun Ini =====
        $thisYearTotalEvents = Event::whereBetween('created_at', $thisYearInputRange)->count();

        // ===== 5. Omset Bulan Ini =====
        $thisMonthEarnings = Payment::where('is_expense', Payment::EARNING)
            ->where('status', Payment::STATUS_CONFIRMED)
            ->whereBetween('created_at', $thisMonthInputRange)
            ->sum('amount');

        // ===== 6. Total Client Bulan Ini =====
        $thisMonthTotalEvents = Event::whereBetween('created_at', $thisMonthInputRange)->count();
        $thisMonthMuaEvents = Event::whereBetween('created_at', $thisMonthInputRange)
            ->where('order_type', Event::ORDER_TYPE_MUA)
            ->count();
        $thisMonthGownEvents = Event::whereBetween('created_at', $thisMonthInputRange)
            ->where('order_type', Event::ORDER_TYPE_GOWN)
            ->count();
        $thisYearMuaEvents = Event::whereBetween('created_at', $thisYearInputRange)
            ->where('order_type', Event::ORDER_TYPE_MUA)
            ->count();
        $thisYearGownEvents = Event::whereBetween('created_at', $thisYearInputRange)
            ->where('order_type', Event::ORDER_TYPE_GOWN)
            ->count();

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
