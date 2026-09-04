import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

interface CalendarMeta {
    year: number;
    month: number;
    mode: CalendarMode;
    types: number[];
    month_start: string;
    visible_start: string;
    visible_end: string;
    prev: { year: number; month: number };
    next: { year: number; month: number };
}

interface EventItem {
    id: number;
    uuid: string;
    name: string;
    date: string;
    time: string | null;
    order_type: number;
    order_type_name: string;
}

interface PageProps {
    calendar: CalendarMeta;
    events: EventItem[];
}

type CalendarMode = 'masehi' | 'hijriah';
type CalendarDay = string | null;

const weekDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const orderFilters = [
    { id: 1, label: 'MUA', className: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200' },
    { id: 2, label: 'Sewa Gaun', className: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-200' },
];

export default function Index({ calendar, events }: PageProps) {
    const [mode, setMode] = useState<CalendarMode>(calendar.mode);
    const [enabledTypes, setEnabledTypes] = useState<number[]>(calendar.types);
    const selectedHijriMonthStart = useMemo(
        () => findHijriMonthStart(calendar.month_start),
        [calendar.month_start],
    );
    const selectedHijriMonthEnd = useMemo(
        () => findHijriMonthEnd(selectedHijriMonthStart),
        [selectedHijriMonthStart],
    );
    const days = useMemo(
        () => mode === 'masehi'
            ? calendarDays(calendar.visible_start, calendar.visible_end)
            : hijriCalendarDays(selectedHijriMonthStart, selectedHijriMonthEnd),
        [calendar.visible_start, calendar.visible_end, selectedHijriMonthStart, selectedHijriMonthEnd, mode],
    );
    const filteredEvents = useMemo(
        () => events.filter((event) => enabledTypes.includes(Number(event.order_type))),
        [events, enabledTypes],
    );
    const eventsByDate = useMemo(() => {
        return filteredEvents.reduce<Record<string, EventItem[]>>((carry, event) => {
            carry[event.date] = carry[event.date] || [];
            carry[event.date].push(event);

            return carry;
        }, {});
    }, [filteredEvents]);

    const currentMonth = calendar.month_start.slice(0, 7);
    const currentHijriMonth = hijriMonthKey(localDateKey(selectedHijriMonthStart));
    const today = localDateKey(new Date());
    const monthlyEventCount = useMemo(() => {
        return filteredEvents.filter((event) => (
            mode === 'masehi'
                ? event.date.startsWith(currentMonth)
                : hijriMonthKey(event.date) === currentHijriMonth
        )).length;
    }, [filteredEvents, mode, currentMonth, currentHijriMonth]);

    const goToMonth = (year: number, month: number, anchor?: string) => {
        visitCalendar({ year, month, anchor, nextMode: mode, nextTypes: enabledTypes });
    };

    const goToPreviousMonth = () => {
        if (mode === 'masehi') {
            goToMonth(calendar.prev.year, calendar.prev.month);
            return;
        }

        const previousMonthEnd = addDays(selectedHijriMonthStart, -1);
        const previousMonthStart = findHijriMonthStart(localDateKey(previousMonthEnd));
        goToMonth(previousMonthStart.getFullYear(), previousMonthStart.getMonth() + 1, localDateKey(previousMonthStart));
    };

    const goToNextMonth = () => {
        if (mode === 'masehi') {
            goToMonth(calendar.next.year, calendar.next.month);
            return;
        }

        const nextMonthStart = addDays(selectedHijriMonthEnd, 1);
        goToMonth(nextMonthStart.getFullYear(), nextMonthStart.getMonth() + 1, localDateKey(nextMonthStart));
    };

    const toggleType = (type: number) => {
        const nextTypes = enabledTypes.includes(type)
            ? enabledTypes.filter((item) => item !== type)
            : [...enabledTypes, type];

        setEnabledTypes(
            nextTypes.length > 0
                ? nextTypes
                : enabledTypes,
        );

        if (nextTypes.length > 0) {
            visitCalendar({ nextTypes });
        }
    };

    const changeMode = (nextMode: CalendarMode) => {
        setMode(nextMode);
        visitCalendar({
            nextMode,
            anchor: nextMode === 'hijriah' ? localDateKey(selectedHijriMonthStart) : undefined,
        });
    };

    const visitCalendar = ({
        year = calendar.year,
        month = calendar.month,
        anchor,
        nextMode = mode,
        nextTypes = enabledTypes,
    }: {
        year?: number;
        month?: number;
        anchor?: string;
        nextMode?: CalendarMode;
        nextTypes?: number[];
    }) => {
        const requestAnchor = anchor ?? (nextMode === 'hijriah' ? localDateKey(selectedHijriMonthStart) : undefined);

        router.get(route('calendar.index'), {
            year,
            month,
            mode: nextMode,
            types: nextTypes.join(','),
            ...(requestAnchor ? { anchor: requestAnchor } : {}),
        }, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const isTypeChecked = (type: number) => (
        enabledTypes.includes(type)
    );

    const canUncheckType = (type: number) => (
        enabledTypes.length > 1 || !enabledTypes.includes(type)
    );

    const typeCheckboxTitle = (type: number) => (
        canUncheckType(type)
            ? undefined
            : 'Minimal satu jenis client harus aktif'
    );

    const isTypeDisabled = (type: number) => (
        !canUncheckType(type)
    );

    const typeCheckboxClass = (type: number) => (
        `rounded border-current text-rose-500 focus:ring-rose-400 ${isTypeDisabled(type) ? 'cursor-not-allowed opacity-50' : ''}`
    );

    const typeLabelClass = (filter: typeof orderFilters[number]) => (
        `flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold ${filter.className} ${isTypeDisabled(filter.id) ? 'cursor-not-allowed opacity-70' : ''}`
    );

    const isModeActive = (item: CalendarMode) => (
        mode === item
    );

    const modeButtonClass = (item: CalendarMode) => (
        `rounded-md px-3 py-1.5 text-sm font-semibold capitalize transition ${
            isModeActive(item)
                ? 'bg-white text-rose-600 shadow-sm dark:bg-stone-800 dark:text-rose-200'
                : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
        }`
    );

    const monthTitle = mode === 'masehi'
        ? gregorianMonthTitle(calendar.month_start)
        : hijriMonthTitle(localDateKey(selectedHijriMonthStart));

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="page-title">Kalender</h2>
                    <Link href={route('events.create')} className="btn-primary text-sm py-2.5 px-4">
                        + Client
                    </Link>
                </div>
            }
        >
            <Head title="Kalender" />

            <div className="space-y-4">
                <div className="card p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={goToPreviousMonth}
                                className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-600 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
                            >
                                Prev
                            </button>
                            <div className="min-w-[220px] text-center">
                                <p className="text-lg font-bold text-stone-900 dark:text-stone-100">{monthTitle}</p>
                                <p className="text-xs text-stone-500 dark:text-stone-400">{monthlyEventCount} event bulan ini</p>
                            </div>
                            <button
                                type="button"
                                onClick={goToNextMonth}
                                className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-600 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
                            >
                                Next
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="inline-flex rounded-lg border border-stone-200 bg-stone-50 p-1 dark:border-stone-700 dark:bg-stone-900">
                                {(['masehi', 'hijriah'] as CalendarMode[]).map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => changeMode(item)}
                                        className={modeButtonClass(item)}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {orderFilters.map((filter) => (
                                    <label
                                        key={filter.id}
                                        className={typeLabelClass(filter)}
                                        title={typeCheckboxTitle(filter.id)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isTypeChecked(filter.id)}
                                            onChange={() => toggleType(filter.id)}
                                            disabled={isTypeDisabled(filter.id)}
                                            className={typeCheckboxClass(filter.id)}
                                        />
                                        {filter.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <div className="min-w-[880px]">
                            <div className="grid grid-cols-7 border-b border-stone-100 bg-stone-50 dark:border-stone-800 dark:bg-stone-900">
                                {weekDays.map((day) => (
                                    <div key={day} className="px-2 py-3 text-center text-xs font-bold uppercase text-stone-500 dark:text-stone-400">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7">
                                {days.map((day, index) => {
                                    if (!day) {
                                        return (
                                            <div
                                                key={`empty-${index}`}
                                                className="min-h-[132px] border-b border-r border-stone-100 bg-stone-50/70 p-2 dark:border-stone-800 dark:bg-stone-900/50"
                                            />
                                        );
                                    }

                                    const dayEvents = eventsByDate[day] || [];
                                    const isCurrentMonth = mode === 'masehi'
                                        ? day.startsWith(currentMonth)
                                        : hijriMonthKey(day) === currentHijriMonth;
                                    const isToday = day === today;

                                    return (
                                        <div
                                            key={day}
                                            className={`min-h-[132px] border-b border-r border-stone-100 p-2 transition dark:border-stone-800 ${
                                                isCurrentMonth ? 'bg-white dark:bg-stone-950' : 'bg-stone-50/70 dark:bg-stone-900/50'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-bold ${
                                                        isToday
                                                            ? 'bg-rose-500 text-white'
                                                            : isCurrentMonth
                                                                ? 'text-stone-800 dark:text-stone-100'
                                                                : 'text-stone-400 dark:text-stone-500'
                                                    }`}>
                                                        {mode === 'masehi' ? gregorianDay(day) : hijriDay(day)}
                                                    </p>
                                                    {mode === 'hijriah' && (
                                                        <p className="mt-1 text-[10px] font-semibold text-stone-400 dark:text-stone-500">
                                                            {gregorianShort(day)}
                                                        </p>
                                                    )}
                                                </div>
                                                {mode === 'masehi' && (
                                                    <span className="text-[10px] font-semibold text-stone-400 dark:text-stone-500">
                                                        {hijriCompact(day)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-2 space-y-1.5">
                                                {dayEvents.slice(0, 4).map((event) => (
                                                    <Link
                                                        key={event.id}
                                                        href={route('events.show', event.uuid)}
                                                        className={`block rounded-md border px-2 py-1.5 text-xs font-semibold leading-4 transition hover:shadow-sm ${
                                                            Number(event.order_type) === 1
                                                                ? 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-100'
                                                                : 'border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-100'
                                                        }`}
                                                    >
                                                        <span className="block truncate">{event.time ? `${event.time} ` : ''}{event.name}</span>
                                                        <span className="text-[10px] opacity-75">{event.order_type_name}</span>
                                                    </Link>
                                                ))}
                                                {dayEvents.length > 4 && (
                                                    <p className="text-xs font-semibold text-stone-400 dark:text-stone-500">
                                                        +{dayEvents.length - 4} event lagi
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function calendarDays(start: string, end: string): string[] {
    const days: string[] = [];
    const cursor = parseDate(start);
    const last = parseDate(end);

    while (cursor <= last) {
        days.push(localDateKey(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }

    return days;
}

function hijriCalendarDays(monthStart: Date, monthEnd: Date): CalendarDay[] {
    const days: CalendarDay[] = [];
    const leadingBlanks = (monthStart.getDay() + 6) % 7;

    for (let index = 0; index < leadingBlanks; index += 1) {
        days.push(null);
    }

    const cursor = new Date(monthStart);
    while (cursor <= monthEnd) {
        days.push(localDateKey(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }

    while (days.length % 7 !== 0) {
        days.push(null);
    }

    return days;
}

function findHijriMonthStart(anchor: string): Date {
    const cursor = parseDate(anchor);

    while (hijriParts(localDateKey(cursor)).day !== 1) {
        cursor.setDate(cursor.getDate() - 1);
    }

    return cursor;
}

function findHijriMonthEnd(monthStart: Date): Date {
    const cursor = new Date(monthStart);
    const targetMonth = hijriMonthKey(localDateKey(monthStart));

    while (true) {
        const next = new Date(cursor);
        next.setDate(next.getDate() + 1);

        if (hijriMonthKey(localDateKey(next)) !== targetMonth) {
            return cursor;
        }

        cursor.setDate(cursor.getDate() + 1);
    }
}

function startOfWeek(date: Date): Date {
    const result = new Date(date);
    const diff = (result.getDay() + 6) % 7;
    result.setDate(result.getDate() - diff);

    return result;
}

function endOfWeek(date: Date): Date {
    const result = startOfWeek(date);
    result.setDate(result.getDate() + 6);

    return result;
}

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);

    return result;
}

function parseDate(value: string): Date {
    return new Date(`${value}T00:00:00`);
}

function localDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function gregorianMonthTitle(date: string): string {
    return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(parseDate(date));
}

function gregorianDay(date: string): string {
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric' }).format(parseDate(date));
}

function gregorianShort(date: string): string {
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(parseDate(date));
}

function hijriDay(date: string): string {
    return new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', { day: 'numeric' }).format(parseDate(date));
}

function hijriCompact(date: string): string {
    return new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', { day: 'numeric', month: 'short' }).format(parseDate(date));
}

function hijriMonthTitle(date: string): string {
    return new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', { month: 'long', year: 'numeric' }).format(parseDate(date));
}

function hijriMonthKey(date: string): string {
    const parts = hijriParts(date);

    return `${parts.year}-${parts.month}`;
}

function hijriParts(date: string): { day: number; month: number; year: number } {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
    }).formatToParts(parseDate(date));

    return {
        day: Number(parts.find((part) => part.type === 'day')?.value || 1),
        month: Number(parts.find((part) => part.type === 'month')?.value || 1),
        year: Number(parts.find((part) => part.type === 'year')?.value || 1),
    };
}
