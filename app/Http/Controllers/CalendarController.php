<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CalendarController extends Controller
{
    public function index(Request $request): Response
    {
        $month = max(1, min(12, (int) $request->integer('month', now()->month)));
        $year = max(2000, min(2100, (int) $request->integer('year', now()->year)));
        $mode = $request->input('mode') === 'hijriah' ? 'hijriah' : 'masehi';
        $types = collect(explode(',', (string) $request->input('types', '1,2')))
            ->map(fn ($type) => (int) $type)
            ->filter(fn ($type) => in_array($type, [Event::ORDER_TYPE_MUA, Event::ORDER_TYPE_GOWN], true))
            ->unique()
            ->values()
            ->all();

        if (empty($types)) {
            $types = [Event::ORDER_TYPE_MUA, Event::ORDER_TYPE_GOWN];
        }

        $current = Carbon::create($year, $month, 1, 0, 0, 0, config('app.timezone'));
        if ($mode === 'hijriah' && $request->filled('anchor')) {
            try {
                $current = Carbon::parse($request->string('anchor')->toString(), config('app.timezone'))->startOfDay();
            } catch (\Throwable) {
                $current = Carbon::create($year, $month, 1, 0, 0, 0, config('app.timezone'));
            }
        }
        $visibleStart = $mode === 'hijriah'
            ? $current->copy()->subDays(45)->startOfWeek(Carbon::MONDAY)
            : $current->copy()->startOfMonth()->startOfWeek(Carbon::MONDAY);
        $visibleEnd = $mode === 'hijriah'
            ? $current->copy()->addDays(45)->endOfWeek(Carbon::SUNDAY)
            : $current->copy()->endOfMonth()->endOfWeek(Carbon::SUNDAY);

        $events = Event::query()
            ->whereIn('order_type', [Event::ORDER_TYPE_MUA, Event::ORDER_TYPE_GOWN])
            ->whereBetween('date', [$visibleStart->toDateString(), $visibleEnd->toDateString()])
            ->orderBy('date')
            ->orderBy('time')
            ->orderBy('name')
            ->get(['id', 'uuid', 'name', 'date', 'time', 'order_type']);

        return Inertia::render('Calendar/Index', [
            'calendar' => [
                'year' => $year,
                'month' => $month,
                'mode' => $mode,
                'types' => $types,
                'month_start' => $current->toDateString(),
                'visible_start' => $visibleStart->toDateString(),
                'visible_end' => $visibleEnd->toDateString(),
                'prev' => [
                    'year' => $current->copy()->subMonthNoOverflow()->year,
                    'month' => $current->copy()->subMonthNoOverflow()->month,
                ],
                'next' => [
                    'year' => $current->copy()->addMonthNoOverflow()->year,
                    'month' => $current->copy()->addMonthNoOverflow()->month,
                ],
            ],
            'events' => $events,
        ]);
    }
}
