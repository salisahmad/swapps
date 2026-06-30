import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

interface Event {
    id: number;
    name: string;
    date: string;
}

interface ScheduleItem {
    id: number;
    type_name: string;
    schedule_from: string;
    schedule_to: string | null;
    description: string | null;
    event: { id: number; name: string };
}

interface PageProps {
    schedules: {
        data: ScheduleItem[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: {
        type?: string;
        date_from?: string;
        date_to?: string;
        q?: string;
    };
    events: Event[];
}

export default function Index({ schedules, filters, events }: PageProps) {
    const { data, setData, get, post, put, delete: destroy, processing, reset } = useForm({
        type: filters.type || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        q: filters.q || '',
        // form fields
        event_id: '',
        schedule_type: '1',
        schedule_from: '',
        time_from: '14:00',
        time_to: '16:00',
        schedule_to: '',
        description: '',
        schedule_id: '',
    });

    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const submitFilter = (e: React.FormEvent) => {
        e.preventDefault();
        get(route('schedules.index'));
    };

    const openCreate = () => {
        reset();
        setEditMode(false);
        setShowModal(true);
    };

    const openEdit = (schedule: ScheduleItem) => {
        const fromDate = new Date(schedule.schedule_from);
        setData({
            ...data,
            event_id: String(schedule.event.id),
            schedule_type: schedule.type_name === 'Fitting' ? '1' : '2',
            schedule_from: fromDate.toISOString().split('T')[0],
            time_from: fromDate.toTimeString().slice(0, 5),
            schedule_to: schedule.schedule_to ? new Date(schedule.schedule_to).toISOString().split('T')[0] : '',
            time_to: schedule.schedule_to ? new Date(schedule.schedule_to).toTimeString().slice(0, 5) : '16:00',
            description: schedule.description || '',
            schedule_id: String(schedule.id),
        });
        setEditMode(true);
        setShowModal(true);
    };

    const submitForm = (e: React.FormEvent) => {
        e.preventDefault();
        if (editMode && data.schedule_id) {
            put(route('schedules.update', data.schedule_id));
        } else {
            post(route('schedules.store'));
        }
        setShowModal(false);
    };

    const handleDelete = (id: number) => {
        if (confirm('Yakin hapus jadwal ini?')) {
            destroy(route('schedules.destroy', id));
        }
    };

    const formatDateTime = (date: string) => {
        const d = new Date(date);
        return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-stone-800 text-stone-200">
                        Jadwal Fitting & Konsultasi
                    </h2>
                    <button
                        onClick={openCreate}
                        className="rounded bg-rose-400 px-4 py-2 text-sm text-white hover:bg-rose-500"
                    >
                        + Tambah Jadwal
                    </button>
                </div>
            }
        >
            <Head title="Jadwal" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Filter */}
                    <div className="mb-4 rounded-lg bg-white p-4 shadow-sm bg-stone-800">
                        <form onSubmit={submitFilter} className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                            <select
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value)}
                                className="rounded-md border-stone-300 text-sm border-stone-700 bg-stone-900 text-stone-300"
                            >
                                <option value="">Semua Jenis</option>
                                <option value="1">Fitting</option>
                                <option value="2">Konsultasi</option>
                            </select>
                            <input type="date" value={data.date_from} onChange={(e) => setData('date_from', e.target.value)} className="rounded-md border-stone-300 text-sm border-stone-700 bg-stone-900 text-stone-300" />
                            <input type="date" value={data.date_to} onChange={(e) => setData('date_to', e.target.value)} className="rounded-md border-stone-300 text-sm border-stone-700 bg-stone-900 text-stone-300" />
                            <input type="text" placeholder="Cari client..." value={data.q} onChange={(e) => setData('q', e.target.value)} className="rounded-md border-stone-300 text-sm border-stone-700 bg-stone-900 text-stone-300" />
                            <div className="flex gap-2">
                                <button type="submit" className="rounded bg-rose-400 px-4 py-2 text-sm text-white">Filter</button>
                                <Link href={route('schedules.index')} className="rounded bg-stone-200 px-4 py-2 text-sm text-stone-700 bg-stone-700 text-stone-300">Reset</Link>
                            </div>
                        </form>
                    </div>

                    {/* Table */}
                    <div className="overflow-hidden rounded-lg bg-white shadow-sm bg-stone-800">
                        <div className="p-6">
                            <table className="min-w-full divide-y divide-stone-200 divide-stone-700">
                                <thead>
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-stone-500 text-stone-400">Client</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-stone-500 text-stone-400">Jenis</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-stone-500 text-stone-400">Tanggal & Waktu</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-stone-500 text-stone-400">Keterangan</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium uppercase text-stone-500 text-stone-400">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-200 divide-stone-700">
                                    {schedules.data.map((s) => (
                                        <tr key={s.id}>
                                            <td className="px-3 py-3">
                                                <Link href={route('events.show', s.event.id)} className="text-sm font-medium text-rose-400 hover:underline text-rose-400">
                                                    {s.event.name}
                                                </Link>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className={`rounded px-2 py-1 text-xs font-semibold ${
                                                    s.type_name === 'Fitting' ? 'bg-purple-100 text-purple-800 bg-purple-900 text-purple-300' : 'bg-blue-100 text-blue-800 bg-blue-900 text-blue-300'
                                                }`}>
                                                    {s.type_name}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-sm text-stone-900 text-stone-100">
                                                {formatDateTime(s.schedule_from)}
                                                {s.schedule_to && ` - ${formatDateTime(s.schedule_to)}`}
                                            </td>
                                            <td className="px-3 py-3 text-sm text-stone-900 text-stone-100">{s.description || '-'}</td>
                                            <td className="px-3 py-3 text-right text-sm">
                                                <button onClick={() => openEdit(s)} className="mr-2 text-rose-400 hover:text-rose-500 text-rose-400">Edit</button>
                                                <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:text-red-900 text-red-400">Hapus</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="mt-4 flex justify-end gap-1">
                                {schedules.links.map((link, i) => link.url ? (
                                    <Link key={i} href={link.url} className={`rounded px-3 py-1 text-sm ${link.active ? 'bg-rose-400 text-white' : 'bg-stone-200 text-stone-700 bg-stone-700 text-stone-300'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                                ) : (
                                    <span key={i} className="rounded px-3 py-1 text-sm bg-stone-100 text-stone-400 bg-stone-800" dangerouslySetInnerHTML={{ __html: link.label }} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl bg-stone-800">
                        <h3 className="mb-4 text-lg font-semibold text-stone-900 text-white">
                            {editMode ? 'Edit Jadwal' : 'Tambah Jadwal'}
                        </h3>
                        <form onSubmit={submitForm} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 text-stone-300">Event / Client</label>
                                <select
                                    value={data.event_id}
                                    onChange={(e) => setData('event_id', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-stone-300 border-stone-700 bg-stone-900 text-stone-300"
                                    required
                                >
                                    <option value="">Pilih Event...</option>
                                    {events.map((event) => (
                                        <option key={event.id} value={event.id}>
                                            {event.name} ({event.date})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 text-stone-300">Jenis</label>
                                    <select value={data.schedule_type} onChange={(e) => setData('schedule_type', e.target.value)} className="mt-1 block w-full rounded-md border-stone-300 border-stone-700 bg-stone-900 text-stone-300">
                                        <option value="1">Fitting</option>
                                        <option value="2">Konsultasi</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 text-stone-300">Tanggal</label>
                                    <input type="date" value={data.schedule_from} onChange={(e) => setData('schedule_from', e.target.value)} className="mt-1 block w-full rounded-md border-stone-300 border-stone-700 bg-stone-900 text-stone-300" required />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 text-stone-300">Jam Mulai</label>
                                    <input type="time" value={data.time_from} onChange={(e) => setData('time_from', e.target.value)} className="mt-1 block w-full rounded-md border-stone-300 border-stone-700 bg-stone-900 text-stone-300" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 text-stone-300">Jam Selesai</label>
                                    <input type="time" value={data.time_to} onChange={(e) => setData('time_to', e.target.value)} className="mt-1 block w-full rounded-md border-stone-300 border-stone-700 bg-stone-900 text-stone-300" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 text-stone-300">Keterangan</label>
                                <textarea value={data.description} onChange={(e) => setData('description', e.target.value)} className="mt-1 block w-full rounded-md border-stone-300 border-stone-700 bg-stone-900 text-stone-300" rows={2} />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="rounded bg-stone-200 px-4 py-2 text-sm text-stone-700 bg-stone-700 text-stone-300">Batal</button>
                                <button type="submit" disabled={processing} className="rounded bg-rose-400 px-4 py-2 text-sm text-white hover:bg-rose-500 disabled:opacity-50">{editMode ? 'Update' : 'Simpan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
