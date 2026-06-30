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

        // Statistik bulan ini
        $totalEvents = Event::count();
        $newEventsThisMonth = Event::whereBetween('created_at', [$startOfMonth, $endOfMonth])->count();

        $earnings = Payment::where('is_expense', Payment::EARNING)
            ->where('status', Payment::STATUS_CONFIRMED)
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        $expenses = Payment::where('is_expense', Payment::EXPENSE)
            ->where('status', Payment::STATUS_CONFIRMED)
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        $profit = $earnings - $expenses;

        $unpaidEvents = Event::where('is_fully_paid', false)->count();
        $totalUnpaidAmount = Event::where('is_fully_paid', false)->sum('total_amount');

        // Events hari ini
        $todayEvents = Event::whereDate('date', $today)
            ->with(['payments' => function ($q) {
                $q->where('is_expense', Payment::EARNING)->where('status', Payment::STATUS_CONFIRMED);
            }])
            ->get();

        // Schedules hari ini (fitting & konsultasi)
        $todaySchedules = Schedule::whereDate('schedule_from', $today)
            ->with('event')
            ->orderBy('schedule_from')
            ->get();

        // Upcoming events (7 hari ke depan)
        $upcomingEvents = Event::whereBetween('date', [$today, $today->copy()->addDays(7)])
            ->orderBy('date')
            ->take(5)
            ->get();

        // Events yang belum lunas (limit 5)
        $unpaidEventsList = Event::where('is_fully_paid', false)
            ->with('payments')
            ->orderBy('date')
            ->take(5)
            ->get();

        return Inertia::render('Dashboard', [
            'stats' => [
                'total_events' => $totalEvents,
                'new_events_this_month' => $newEventsThisMonth,
                'earnings' => (float) $earnings,
                'expenses' => (float) $expenses,
                'profit' => (float) $profit,
                'unpaid_events' => $unpaidEvents,
                'total_unpaid_amount' => (float) $totalUnpaidAmount,
            ],
            'todayEvents' => $todayEvents,
            'todaySchedules' => $todaySchedules,
            'upcomingEvents' => $upcomingEvents,
            'unpaidEventsList' => $unpaidEventsList,
        ]);
    }
}
