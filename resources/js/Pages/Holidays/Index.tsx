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
        form.setData({
            name: holiday.name,
            start_date: holiday.start_date,
            end_date: holiday.end_date,
            description: holiday.description || '',
        });
        form.clearErrors();
    };

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
                            <Field label="Keterangan" error={form.errors.description}>
                                <input value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} className="input" placeholder="Opsional" />
                            </Field>
                            <Field label="Tanggal Awal" error={form.errors.start_date}>
                                <input type="date" value={form.data.start_date} onChange={(e) => form.setData('start_date', e.target.value)} className="input" required />
                            </Field>
                            <Field label="Tanggal Akhir" error={form.errors.end_date}>
                                <input type="date" value={form.data.end_date} onChange={(e) => form.setData('end_date', e.target.value)} className="input" required />
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
