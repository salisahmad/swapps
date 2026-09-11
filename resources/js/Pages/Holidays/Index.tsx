import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatShortDate } from '@/utils/date';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

interface Holiday {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    description: string | null;
    creator?: { id: number; name: string } | null;
}

interface PageProps {
    holidays: Holiday[];
    canManage: boolean;
}

interface HolidayForm {
    name: string;
    start_date: string;
    end_date: string;
    description: string;
}

export default function Index({ holidays, canManage }: PageProps) {
    const user = usePage<{ auth: { user: { role: number } } }>().props.auth.user;
    const [editing, setEditing] = useState<Holiday | null>(null);
    const [showDateRange, setShowDateRange] = useState(false);
    const [dateRangeMonth, setDateRangeMonth] = useState(() => startOfMonth(new Date()));
    const form = useForm<HolidayForm>({
        name: '',
        start_date: '',
        end_date: '',
        description: '',
    });

    const resetForm = () => {
        setEditing(null);
        form.reset();
        form.clearErrors();
    };

    const editHoliday = (holiday: Holiday) => {
        setEditing(holiday);
        setDateRangeMonth(startOfMonth(parseLocalDate(holiday.start_date) || new Date()));
        form.setData({
            name: holiday.name,
            start_date: holiday.start_date,
            end_date: holiday.end_date,
            description: holiday.description || '',
        });
        form.clearErrors();
    };

    const dateRangeLabel = form.data.start_date || form.data.end_date
        ? `${form.data.start_date ? formatShortDate(form.data.start_date) : 'Awal'} - ${form.data.end_date ? formatShortDate(form.data.end_date) : 'Akhir'}`
        : 'Pilih periode libur';
    const selectedRange = {
        start: parseLocalDate(form.data.start_date),
        end: parseLocalDate(form.data.end_date),
    };
    const selectRangeDate = (dateKey: string) => {
        if (!form.data.start_date || form.data.end_date) {
            form.setData({ ...form.data, start_date: dateKey, end_date: '' });
            return;
        }

        if (dateKey < form.data.start_date) {
            form.setData({ ...form.data, start_date: dateKey, end_date: form.data.start_date });
            return;
        }

        form.setData('end_date', dateKey);
    };
    const clearDateRange = () => form.setData({ ...form.data, start_date: '', end_date: '' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (editing) {
            form.put(route('holidays.update', editing.id), { preserveScroll: true, onSuccess: resetForm });
            return;
        }

        form.post(route('holidays.store'), { preserveScroll: true, onSuccess: resetForm });
    };

    const deleteHoliday = (holiday: Holiday) => {
        if (!window.confirm(`Hapus hari libur "${holiday.name}"?`)) {
            return;
        }

        form.delete(route('holidays.destroy', holiday.id), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="page-title">Hari Libur Manten</h2>}
        >
            <Head title="Hari Libur Manten" />

            <div className="space-y-4">
                <div className="card p-5">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">Tanggal tidak bisa booking client</h3>
                            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Jadwal fitting dan konsultasi tetap dapat dibuat pada tanggal libur.</p>
                        </div>
                        <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200">
                            Semua pegawai dapat melihat
                        </span>
                    </div>

                    {canManage && user.role === 1 && (
                        <form onSubmit={submit} className="grid gap-3 rounded-xl border border-stone-100 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-900/60 md:grid-cols-2">
                            <div className="md:col-span-2 flex items-center justify-between">
                                <h4 className="font-bold text-stone-800 dark:text-stone-100">{editing ? 'Edit Hari Libur' : 'Tambah Hari Libur'}</h4>
                                {editing && <button type="button" onClick={resetForm} className="text-sm font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200">Batal edit</button>}
                            </div>
                            <Field label="Nama Libur" error={form.errors.name}>
                                <input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className="input" placeholder="Contoh: Libur Lebaran" required />
                            </Field>
                            <Field label="Periode Libur" error={form.errors.start_date || form.errors.end_date}>
                                <div className="relative">
                                    <button type="button" onClick={() => setShowDateRange((value) => !value)} className="input flex w-full items-center justify-between gap-3 text-left">
                                        <span className={form.data.start_date || form.data.end_date ? 'text-stone-800 dark:text-stone-100' : 'text-stone-400'}>{dateRangeLabel}</span>
                                        <span className="text-stone-400">▾</span>
                                    </button>
                                    {showDateRange && (
                                        <div className="absolute left-0 top-full z-30 mt-2 w-[calc(100vw-2rem)] max-w-[640px] rounded-xl border border-stone-100 bg-white p-3 shadow-lg dark:border-stone-700 dark:bg-stone-900">
                                            <div className="mb-3 flex items-center justify-between gap-3">
                                                <button type="button" onClick={() => setDateRangeMonth(addMonths(dateRangeMonth, -1))} className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-semibold text-stone-500 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800">‹</button>
                                                <div className="text-center text-xs font-semibold uppercase tracking-wide text-stone-400">Periode Libur</div>
                                                <button type="button" onClick={() => setDateRangeMonth(addMonths(dateRangeMonth, 1))} className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-semibold text-stone-500 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800">›</button>
                                            </div>
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                {[dateRangeMonth, addMonths(dateRangeMonth, 1)].map((month) => (
                                                    <MonthCalendar key={month.toISOString()} month={month} range={selectedRange} onSelect={selectRangeDate} />
                                                ))}
                                            </div>
                                            <div className="mt-3 flex justify-between gap-2">
                                                <button type="button" onClick={clearDateRange} className="rounded-lg bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-200">Clear</button>
                                                <button type="button" onClick={() => setShowDateRange(false)} className="rounded-lg bg-rose-400 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-500">Pilih</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Field>
                            <Field label="Keterangan" error={form.errors.description}>
                                <textarea value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} className="input min-h-[96px] resize-y" placeholder="Opsional" rows={3} />
                            </Field>
                            <div className="md:col-span-2 flex justify-end">
                                <button type="submit" disabled={form.processing} className="btn-primary px-5 py-2.5">
                                    {form.processing ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah Hari Libur'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-stone-50 text-xs uppercase text-stone-500 dark:bg-stone-900 dark:text-stone-400">
                                <tr>
                                    <th className="px-5 py-3">Nama Libur</th>
                                    <th className="px-5 py-3">Periode</th>
                                    <th className="px-5 py-3">Keterangan</th>
                                    {canManage && <th className="px-5 py-3 text-right">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                                {holidays.map((holiday) => (
                                    <tr key={holiday.id} className="transition hover:bg-stone-50 dark:hover:bg-stone-900/70">
                                        <td className="px-5 py-4 font-bold text-red-700 dark:text-red-300">{holiday.name}</td>
                                        <td className="whitespace-nowrap px-5 py-4 font-semibold text-stone-700 dark:text-stone-200">
                                            {formatShortDate(holiday.start_date)}{holiday.start_date !== holiday.end_date ? ` - ${formatShortDate(holiday.end_date)}` : ''}
                                        </td>
                                        <td className="max-w-md px-5 py-4 text-stone-500 dark:text-stone-400">{holiday.description || '-'}</td>
                                        {canManage && (
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button type="button" onClick={() => editHoliday(holiday)} className="btn-secondary px-3 py-1.5 text-xs">Edit</button>
                                                    <button type="button" onClick={() => deleteHoliday(holiday)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/70 dark:hover:bg-red-950/40">Hapus</button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {holidays.length === 0 && (
                                    <tr><td colSpan={canManage ? 4 : 3} className="px-5 py-12 text-center text-stone-500">Belum ada hari libur yang disimpan.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase text-stone-500 dark:text-stone-400">{label}</span>
            {children}
            {error && <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span>}
        </label>
    );
}

function MonthCalendar({ month, range, onSelect }: { month: Date; range: { start: Date | null; end: Date | null }; onSelect: (date: string) => void }) {
    return (
        <div>
            <p className="mb-3 text-center text-sm font-semibold text-stone-700 dark:text-stone-200">{month.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
            <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-semibold uppercase text-stone-400">
                {['S', 'S', 'R', 'K', 'J', 'S', 'M'].map((day, index) => <span key={`${day}-${index}`} className="py-1">{day}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
                {calendarMonthDays(month).map((date, index) => {
                    if (!date) return <span key={`empty-${index}`} className="h-9" />;
                    const dateKey = localDateKey(date);
                    const selectedStart = range.start ? sameDate(date, range.start) : false;
                    const selectedEnd = range.end ? sameDate(date, range.end) : false;
                    const inRange = isDateInRange(date, range.start, range.end);

                    return (
                        <button key={dateKey} type="button" onClick={() => onSelect(dateKey)} className={`mx-auto flex h-9 w-full max-w-10 items-center justify-center text-sm transition ${selectedStart || selectedEnd ? 'rounded-full bg-rose-500 font-bold text-white shadow-sm' : inRange ? 'rounded-full bg-rose-50 font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-200' : 'rounded-full text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800'}`}>
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
    const days: Array<Date | null> = Array.from({ length: (first.getDay() + 6) % 7 }, () => null);

    for (let day = 1; day <= totalDays; day += 1) {
        days.push(new Date(first.getFullYear(), first.getMonth(), day));
    }

    return days;
}

function parseLocalDate(value?: string | null): Date | null {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    return year && month && day ? new Date(year, month - 1, day) : null;
}

function startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number): Date {
    return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function localDateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function sameDate(first: Date, second: Date): boolean {
    return localDateKey(first) === localDateKey(second);
}

function isDateInRange(date: Date, start: Date | null, end: Date | null): boolean {
    if (!start || !end) return false;
    return date >= start && date <= end;
}
