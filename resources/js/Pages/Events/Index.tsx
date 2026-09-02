import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatShortDate } from '@/utils/date';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

interface EventItem {
    id: number;
    uuid: string;
    name: string;
    date: string;
    time: string | null;
    mobile_phone: string;
    location: string | null;
    total_amount: number | null;
    grand_total: number | null;
    is_fully_paid: boolean | null;
    order_type_name: string;
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PageProps {
    events: {
        data: EventItem[];
        links: PaginationLink[];
    };
    filters: {
        q?: string;
        date_from?: string;
        date_to?: string;
        paid?: string;
        order_type?: string;
    };
    authUser: {
        id: number;
        role: number;
        is_limited_staff: boolean;
    };
}

export default function Index({ events, filters, authUser }: PageProps) {
    const [showDateRange, setShowDateRange] = useState(false);
    const [dateRangeMonth, setDateRangeMonth] = useState(() => startOfMonth(parseLocalDate(filters.date_from) ?? new Date()));
    const { data, setData, get } = useForm({
        q: filters.q || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        paid: filters.paid || '',
        order_type: filters.order_type || '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        get(route('events.index'));
    };

    const formatRupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
    const formatDate = (date?: string | null) => formatShortDate(date);
    const dateRangeLabel = data.date_from || data.date_to
        ? `${data.date_from ? formatDate(data.date_from) : 'Awal'} - ${data.date_to ? formatDate(data.date_to) : 'Akhir'}`
        : 'Tanggal Acara';
    const calendarMonths = [dateRangeMonth, addMonths(dateRangeMonth, 1)];
    const selectedRange = {
        start: parseLocalDate(data.date_from),
        end: parseLocalDate(data.date_to),
    };
    const selectRangeDate = (dateKey: string) => {
        if (!data.date_from || data.date_to) {
            setData({
                ...data,
                date_from: dateKey,
                date_to: '',
            });
            return;
        }

        if (dateKey < data.date_from) {
            setData({
                ...data,
                date_from: dateKey,
                date_to: data.date_from,
            });
            return;
        }

        setData('date_to', dateKey);
    };
    const clearDateRange = () => {
        setData({
            ...data,
            date_from: '',
            date_to: '',
        });
    };
    const orderTypeClass = (name: string) =>
        name === 'MUA'
            ? 'bg-rose-100 text-rose-700 border border-rose-200'
            : 'bg-violet-100 text-violet-700 border border-violet-200';
    const previousPage = events.links[0];
    const nextPage = events.links[events.links.length - 1];
    const paginatorPageLinks = events.links.slice(1, -1);
    const activePage = Number(paginatorPageLinks.find((link) => link.active)?.label || '1');
    const lastPage = Number([...paginatorPageLinks].reverse().find((link) => /^\d+$/.test(link.label))?.label || activePage);
    const pageLinks = Array.from({ length: lastPage }, (_, index) => {
        const page = index + 1;

        return {
            label: String(page),
            url: pageUrlFromPaginator(events.links, page),
        };
    });

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="page-title">Clients</h2>
                    {!authUser.is_limited_staff && (
                        <Link href={route('events.create')} className="btn-primary text-sm py-2.5 px-4">
                            + Client
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Clients" />

            <div className="space-y-4">
                {/* Filter Bar - Compact */}
                <div className="card p-3">
                    <form onSubmit={submit} className="flex flex-wrap gap-2">
                        <input
                            type="text"
                            placeholder="🔍 Cari nama / telepon..."
                            value={data.q}
                            onChange={(e) => setData('q', e.target.value)}
                            className="input-field flex-1 min-w-[140px]"
                        />
                        <div className="relative min-w-[240px] flex-1 sm:flex-none">
                            <button
                                type="button"
                                onClick={() => setShowDateRange((value) => !value)}
                                className="input-field flex w-full items-center justify-between gap-3 text-left"
                            >
                                <span className={data.date_from || data.date_to ? 'text-stone-800' : 'text-stone-400'}>
                                    {dateRangeLabel}
                                </span>
                                <span className="text-stone-400">▾</span>
                            </button>
                            {showDateRange && (
                                <div className="absolute left-0 top-full z-20 mt-2 w-[calc(100vw-2rem)] max-w-[640px] rounded-xl border border-stone-100 bg-white p-3 shadow-lg dark:border-stone-700 dark:bg-stone-900 sm:w-[640px]">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setDateRangeMonth(addMonths(dateRangeMonth, -1))}
                                            className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-semibold text-stone-500 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                                            aria-label="Bulan sebelumnya"
                                        >
                                            ‹
                                        </button>
                                        <div className="text-center text-xs font-semibold uppercase tracking-wide text-stone-400">
                                            Tanggal Acara
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setDateRangeMonth(addMonths(dateRangeMonth, 1))}
                                            className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-semibold text-stone-500 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                                            aria-label="Bulan berikutnya"
                                        >
                                            ›
                                        </button>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {calendarMonths.map((month) => (
                                            <MonthCalendar
                                                key={month.toISOString()}
                                                month={month}
                                                range={selectedRange}
                                                onSelect={selectRangeDate}
                                            />
                                        ))}
                                    </div>

                                    <div className="mt-3 flex justify-between gap-2">
                                        <button
                                            type="button"
                                            onClick={clearDateRange}
                                            className="rounded-lg bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-200"
                                        >
                                            Clear
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowDateRange(false)}
                                            className="rounded-lg bg-rose-400 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-500"
                                        >
                                            Pilih
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        {!authUser.is_limited_staff && (
                            <select
                                value={data.paid}
                                onChange={(e) => setData('paid', e.target.value)}
                                className="input-field min-w-[112px] pr-9"
                            >
                                <option value="">Semua</option>
                                <option value="1">Lunas</option>
                                <option value="0">Belum</option>
                            </select>
                        )}
                        <select
                            value={data.order_type}
                            onChange={(e) => setData('order_type', e.target.value)}
                            className="input-field min-w-[144px] pr-9"
                        >
                            <option value="">Semua Jenis</option>
                            <option value="1">MUA</option>
                            <option value="2">Sewa Gaun</option>
                        </select>
                        <button type="submit" className="btn-primary py-2 px-4">Filter</button>
                        <Link href={route('events.index')} className="btn-secondary py-2 px-4">Reset</Link>
                    </form>
                </div>

                {/* Mobile Card List */}
                <div className="space-y-3 sm:hidden">
                    {events.data.map((event) => (
                        <Link
                            key={event.id}
                            href={route('events.show', event.uuid)}
                            className="card block p-4 transition active:scale-[0.98]"
                        >
                            <div className="flex items-start justify-between">
                                <div className="min-w-0">
                                    <p className="text-base font-semibold text-stone-800">{event.name}</p>
                                    <p className="mt-1 text-sm text-stone-400">
                                        📅 {formatDate(event.date)} {event.time ? `· ${event.time}` : ''}
                                    </p>
                                    <p className="mt-1 text-sm text-stone-400">📞 {event.mobile_phone}</p>
                                    {event.location && (
                                        <p className="mt-1 text-sm text-stone-400">📍 {event.location}</p>
                                    )}
                                </div>
                                {!authUser.is_limited_staff && (
                                    <span className={`badge shrink-0 ${event.is_fully_paid ? 'badge-green' : 'badge-yellow'}`}>
                                        {event.is_fully_paid ? 'LUNAS' : 'BELUM'}
                                    </span>
                                )}
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                                <span className={`badge ${orderTypeClass(event.order_type_name)}`}>
                                    {event.order_type_name === 'MUA' ? '💄' : '👗'} {event.order_type_name}
                                </span>
                                {!authUser.is_limited_staff && (
                                    <p className="text-lg font-bold text-rose-500">{formatRupiah(event.grand_total ?? event.total_amount ?? 0)}</p>
                                )}
                            </div>
                        </Link>
                    ))}
                    {events.data.length === 0 && (
                        <div className="card py-12 text-center">
                            <p className="text-4xl mb-2">📭</p>
                            <p className="text-stone-400">Tidak ada client</p>
                        </div>
                    )}
                </div>

                {/* Desktop Table */}
                <div className="hidden card overflow-hidden sm:block">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-stone-100">
                            <thead>
                                <tr className="bg-stone-50">
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-stone-400">Client</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-stone-400">Tanggal</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-stone-400">Telepon</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-stone-400">Jenis</th>
                                    {!authUser.is_limited_staff && (
                                        <>
                                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-stone-400">Total</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-stone-400">Status</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {events.data.map((event) => (
                                    <tr
                                        key={event.id}
                                        onClick={() => { window.location.href = route('events.show', event.uuid); }}
                                        className="cursor-pointer transition hover:bg-stone-50"
                                    >
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-stone-800">{event.name}</p>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-stone-600">{formatDate(event.date)} {event.time ? `· ${event.time}` : ''}</td>
                                        <td className="px-4 py-3 text-sm text-stone-600">{event.mobile_phone}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`badge ${orderTypeClass(event.order_type_name)}`}>
                                                {event.order_type_name}
                                            </span>
                                        </td>
                                        {!authUser.is_limited_staff && (
                                            <>
                                                <td className="px-4 py-3 text-right font-semibold text-stone-800">{formatRupiah(event.grand_total ?? event.total_amount ?? 0)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`badge ${event.is_fully_paid ? 'badge-green' : 'badge-yellow'}`}>
                                                        {event.is_fully_paid ? 'LUNAS' : 'BELUM'}
                                                    </span>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                                {events.data.length === 0 && (
                                    <tr>
                                        <td colSpan={authUser.is_limited_staff ? 4 : 6} className="px-4 py-12 text-center text-stone-400">
                                            📭 Tidak ada client
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {pageLinks.length > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-2">
                        {previousPage.url ? (
                            <Link
                                href={previousPage.url}
                                className="rounded-lg border border-stone-100 bg-white px-3 py-2 text-sm font-semibold text-stone-600 transition hover:bg-stone-50"
                            >
                                Prev
                            </Link>
                        ) : (
                            <span className="rounded-lg border border-stone-100 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-300">
                                Prev
                            </span>
                        )}

                        <select
                            value={String(activePage)}
                            onChange={(e) => {
                                const selected = pageLinks.find((link) => link.label === e.target.value);
                                if (selected?.url) {
                                    router.visit(selected.url, { preserveScroll: true });
                                }
                            }}
                            className="min-w-[132px] rounded-lg border border-stone-200 bg-white px-3 py-2 pr-9 text-sm font-semibold text-stone-700"
                            aria-label="Pilih halaman client"
                        >
                            {pageLinks.map((link) => (
                                <option key={link.label} value={link.label}>
                                    Page {link.label}
                                </option>
                            ))}
                        </select>

                        {nextPage.url ? (
                            <Link
                                href={nextPage.url}
                                className="rounded-lg border border-stone-100 bg-white px-3 py-2 text-sm font-semibold text-stone-600 transition hover:bg-stone-50"
                            >
                                Next
                            </Link>
                        ) : (
                            <span className="rounded-lg border border-stone-100 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-300">
                                Next
                            </span>
                        )}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

function pageUrlFromPaginator(links: PaginationLink[], page: number): string | null {
    const matchingLink = links.find((link) => link.label === String(page));
    if (matchingLink?.url) {
        return matchingLink.url;
    }

    const url = links.find((link) => link.url)?.url;
    if (!url) {
        return null;
    }

    const parsedUrl = new URL(url, window.location.origin);
    parsedUrl.searchParams.set('page', String(page));

    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
}

function MonthCalendar({
    month,
    range,
    onSelect,
}: {
    month: Date;
    range: { start: Date | null; end: Date | null };
    onSelect: (date: string) => void;
}) {
    const days = calendarMonthDays(month);

    return (
        <div>
            <p className="mb-3 text-center text-sm font-semibold text-stone-700 dark:text-stone-200">
                {month.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </p>
            <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-semibold uppercase text-stone-400">
                {['S', 'M', 'S', 'R', 'K', 'J', 'S'].map((day, index) => (
                    <span key={`${day}-${index}`} className="py-1">{day}</span>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
                {days.map((date, index) => {
                    if (!date) {
                        return <span key={`empty-${index}`} className="h-9" />;
                    }

                    const dateKey = localDateKey(date);
                    const selectedStart = range.start ? sameDate(date, range.start) : false;
                    const selectedEnd = range.end ? sameDate(date, range.end) : false;
                    const inRange = isDateInRange(date, range.start, range.end);

                    return (
                        <button
                            key={dateKey}
                            type="button"
                            onClick={() => onSelect(dateKey)}
                            className={`mx-auto flex h-9 w-full max-w-10 items-center justify-center text-sm transition ${
                                selectedStart || selectedEnd
                                    ? 'rounded-full bg-rose-500 font-bold text-white shadow-sm'
                                    : inRange
                                        ? 'rounded-full bg-rose-50 font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-200'
                                        : 'rounded-full text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800'
                            }`}
                        >
                            {date.getDate()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function calendarMonthDays(month: Date): Array<Date | null> {
    const first = startOfMonth(month);
    const totalDays = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const days: Array<Date | null> = Array.from({ length: first.getDay() }, () => null);

    for (let day = 1; day <= totalDays; day += 1) {
        days.push(new Date(first.getFullYear(), first.getMonth(), day));
    }

    return days;
}

function parseLocalDate(value?: string | null): Date | null {
    if (!value) {
        return null;
    }

    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) {
        return null;
    }

    return new Date(year, month - 1, day);
}

function startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number): Date {
    return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function localDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function sameDate(a: Date, b: Date): boolean {
    return localDateKey(a) === localDateKey(b);
}

function isDateInRange(date: Date, start: Date | null, end: Date | null): boolean {
    if (!start || !end) {
        return false;
    }

    return date >= start && date <= end;
}
