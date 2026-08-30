import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface Event {
    id: number;
    uuid: string;
    name: string;
    mobile_phone: string | null;
    date: string;
    time: string | null;
    order_type?: number | string;
    order_type_name?: string;
}

interface ScheduleItem {
    id: number;
    type?: number | string;
    type_name: string;
    schedule_from: string;
    schedule_to: string | null;
    description: string | null;
    prospect_name: string | null;
    prospect_mobile_phone: string | null;
    client_name: string;
    client_phone: string | null;
    client_status_name: string;
    event: Event | null;
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
    selected_event?: Event | null;
    open_modal?: boolean;
}

interface TakenTime {
    from: string;
    to: string | null;
}

export default function Index({ schedules, filters, events, selected_event, open_modal }: PageProps) {
    const { data, setData, get, post, put, delete: destroy, processing, reset } = useForm({
        type: filters.type || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        q: filters.q || '',
        // form fields
        client_source: 'booked',
        event_id: selected_event ? String(selected_event.id) : '',
        prospect_name: '',
        prospect_mobile_phone: '',
        schedule_type: '1',
        schedule_from: '',
        time_from: '14:00',
        time_to: '15:00',
        schedule_to: '',
        description: '',
        schedule_id: '',
        return_to_event: selected_event ? '1' : '',
    });

    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [clientSearch, setClientSearch] = useState('');
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const [takenTimes, setTakenTimes] = useState<TakenTime[]>([]);
    const [checkingSchedule, setCheckingSchedule] = useState(false);
    const [scheduleConflict, setScheduleConflict] = useState('');

    const selectedEvent = selected_event || events.find((event) => String(event.id) === data.event_id);
    const filteredEvents = clientSearch.length > 0
        ? events.filter((event) => (
            event.name.toLowerCase().includes(clientSearch.toLowerCase())
            || (event.mobile_phone || '').includes(clientSearch)
        ))
        : events.slice(0, 10);

    const submitFilter = (e: React.FormEvent) => {
        e.preventDefault();
        get(route('schedules.index'));
    };

    const openCreate = () => {
        reset();
        setData({
            ...data,
            client_source: 'booked',
            event_id: selected_event ? String(selected_event.id) : '',
            prospect_name: '',
            prospect_mobile_phone: '',
            schedule_type: '1',
            schedule_from: '',
            time_from: '14:00',
            time_to: '15:00',
            schedule_to: '',
            description: '',
            schedule_id: '',
            return_to_event: selected_event ? '1' : '',
        });
        setClientSearch(selected_event?.name || '');
        setShowClientDropdown(false);
        setEditMode(false);
        setShowModal(true);
    };

    const openEdit = (schedule: ScheduleItem) => {
        const fromDate = new Date(schedule.schedule_from);
        const selectedScheduleEvent = schedule.event
            ? events.find((event) => event.id === schedule.event?.id)
            : null;
        setData({
            ...data,
            client_source: schedule.event ? 'booked' : 'prospect',
            event_id: schedule.event ? String(schedule.event.id) : '',
            prospect_name: schedule.prospect_name || '',
            prospect_mobile_phone: schedule.prospect_mobile_phone || '',
            schedule_type: schedule.type_name === 'Fitting' ? '1' : '2',
            schedule_from: fromDate.toISOString().split('T')[0],
            time_from: fromDate.toTimeString().slice(0, 5),
            schedule_to: schedule.schedule_to ? new Date(schedule.schedule_to).toISOString().split('T')[0] : '',
            time_to: schedule.schedule_to ? new Date(schedule.schedule_to).toTimeString().slice(0, 5) : '16:00',
            description: schedule.description || '',
            schedule_id: String(schedule.id),
            return_to_event: '',
        });
        setClientSearch(selectedScheduleEvent?.name || schedule.event?.name || '');
        setShowClientDropdown(false);
        setEditMode(true);
        setShowModal(true);
    };

    const submitForm = (e: React.FormEvent) => {
        e.preventDefault();

        if (data.client_source === 'booked' && !data.event_id) {
            alert('Pilih client dari hasil pencarian dulu.');
            return;
        }

        if (data.client_source === 'prospect' && (!data.prospect_name || !data.prospect_mobile_phone)) {
            alert('Isi nama dan nomor telepon calon client.');
            return;
        }

        if (scheduleConflict) {
            alert(scheduleConflict);
            return;
        }

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
            setShowModal(false);
        }
    };

    const getScheduleTypeName = (schedule: ScheduleItem) => {
        if (schedule.type_name === 'Fitting' || schedule.type_name === 'Konsultasi') {
            return schedule.type_name;
        }

        return String(schedule.type) === '1' ? 'Fitting' : 'Konsultasi';
    };
    const getScheduleStyle = (schedule: ScheduleItem) => {
        const typeName = getScheduleTypeName(schedule);

        return typeName === 'Fitting'
            ? { icon: '👗', iconClass: 'bg-rose-100 text-rose-600', badgeClass: 'bg-rose-50 text-rose-700' }
            : { icon: '💬', iconClass: 'bg-sky-100 text-sky-600', badgeClass: 'bg-sky-50 text-sky-700' };
    };

    const parseDateTime = (value: string) => {
        const [datePart, timePart = ''] = value.replace('T', ' ').split(' ');
        const [year, month, day] = datePart.split('-');
        const [hour = '', minute = ''] = timePart.split(':');

        return { year, month, day, time: hour && minute ? `${hour}:${minute}` : '' };
    };
    const formatScheduleDateTime = (value: string) => {
        const { year, month, day, time } = parseDateTime(value);

        return `${year}-${month}-${day}${time ? ` ${time}` : ''}`;
    };
    const formatDisplayDate = (value: string) => {
        if (!value) return '-';

        const [year, month, day] = value.split('-');
        const monthNames = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
        ];

        return `${year} ${monthNames[Number(month) - 1] || month} ${day}`;
    };
    const addOneHour = (time: string) => {
        if (!time) return '';

        const [hour, minute] = time.split(':').map(Number);
        const nextHour = (hour + 1) % 24;

        return `${String(nextHour).padStart(2, '0')}:${String(minute || 0).padStart(2, '0')}`;
    };
    const handleStartTimeChange = (time: string) => {
        setData({
            ...data,
            time_from: time,
            time_to: addOneHour(time),
        });
    };
    const selectEvent = (event: Event) => {
        setData('event_id', String(event.id));
        setClientSearch(event.name);
        setShowClientDropdown(false);
    };

    useEffect(() => {
        if (!open_modal || !selected_event) {
            return;
        }

        setData({
            ...data,
            client_source: 'booked',
            event_id: String(selected_event.id),
            prospect_name: '',
            prospect_mobile_phone: '',
            schedule_type: '1',
            schedule_from: '',
            time_from: '14:00',
            time_to: '15:00',
            schedule_to: '',
            description: '',
            schedule_id: '',
            return_to_event: '1',
        });
        setClientSearch(selected_event.name);
        setShowClientDropdown(false);
        setEditMode(false);
        setShowModal(true);
    }, []);
    const getClientStatusStyle = (schedule: ScheduleItem) => {
        if (!schedule.event) {
            return 'bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/50 dark:text-orange-200 dark:border-orange-800/60';
        }

        return schedule.client_status_name === 'MUA'
            ? 'bg-rose-50 text-rose-700 border border-rose-100'
            : 'bg-violet-50 text-violet-700 border border-violet-100';
    };
    const getScheduleRowClass = (schedule: ScheduleItem) => (
        schedule.event ? '' : 'bg-orange-50/70'
    );
    const timeToMinutes = (time: string | null) => {
        if (!time) return null;

        const [hour, minute] = time.split(':').map(Number);
        return (hour * 60) + (minute || 0);
    };
    const isTimeConflict = (times: TakenTime[], startTime: string, endTime: string) => {
        const start = timeToMinutes(startTime);
        const end = timeToMinutes(endTime);

        if (start === null || end === null) return false;

        return times.some((time) => {
            const existingStart = timeToMinutes(time.from);
            const existingEnd = timeToMinutes(time.to) ?? ((existingStart ?? 0) + 60);

            if (existingStart === null) return false;

            return start < existingEnd && end > existingStart;
        });
    };

    useEffect(() => {
        if (!showModal || !data.schedule_from || !data.schedule_type) {
            setTakenTimes([]);
            setScheduleConflict('');
            return;
        }

        const controller = new AbortController();
        const params = new URLSearchParams({
            date: data.schedule_from,
            type: data.schedule_type,
        });

        if (editMode && data.schedule_id) {
            params.set('exclude_id', data.schedule_id);
        }

        setCheckingSchedule(true);

        fetch(`${route('schedules.taken-times')}?${params.toString()}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        })
            .then((response) => response.json())
            .then((times: TakenTime[]) => {
                setTakenTimes(times);
                setScheduleConflict(
                    isTimeConflict(times, data.time_from, data.time_to)
                        ? 'Jadwal bentrok dengan jadwal lain di tanggal dan jam tersebut.'
                        : '',
                );
            })
            .catch((error) => {
                if (error.name !== 'AbortError') {
                    setScheduleConflict('');
                }
            })
            .finally(() => {
                setCheckingSchedule(false);
            });

        return () => controller.abort();
    }, [showModal, data.schedule_from, data.schedule_type, data.time_from, data.time_to, data.schedule_id, editMode]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-stone-800">
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
                    <div className="mb-4 rounded-lg bg-white p-4 shadow-sm dark:bg-stone-900">
                        <form onSubmit={submitFilter} className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                            <select
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value)}
                                className="rounded-md border-stone-300 text-sm border-stone-200 bg-white text-stone-800"
                            >
                                <option value="">Semua Jenis</option>
                                <option value="1">Fitting</option>
                                <option value="2">Konsultasi</option>
                            </select>
                            <input type="date" value={data.date_from} onChange={(e) => setData('date_from', e.target.value)} className="rounded-md border-stone-300 text-sm border-stone-200 bg-white text-stone-800" />
                            <input type="date" value={data.date_to} onChange={(e) => setData('date_to', e.target.value)} className="rounded-md border-stone-300 text-sm border-stone-200 bg-white text-stone-800" />
                            <input type="text" placeholder="Cari client..." value={data.q} onChange={(e) => setData('q', e.target.value)} className="rounded-md border-stone-300 text-sm border-stone-200 bg-white text-stone-800" />
                            <div className="flex gap-2">
                                <button type="submit" className="rounded bg-rose-400 px-4 py-2 text-sm text-white">Filter</button>
                                <Link href={route('schedules.index')} className="rounded bg-stone-100 px-4 py-2 text-sm text-stone-700 bg-stone-100 text-stone-500">Reset</Link>
                            </div>
                        </form>
                    </div>

                    {/* Table */}
                    <div className="hidden card overflow-hidden sm:block">
                        <div className="p-6">
                            <table className="min-w-full divide-y divide-stone-100">
                                <thead>
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-stone-500">Client</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-stone-500">Jenis</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-stone-500">Tanggal & Waktu</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-stone-500">Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {schedules.data.map((s) => {
                                        const typeName = getScheduleTypeName(s);
                                        const style = getScheduleStyle(s);

                                        return (
                                        <tr
                                            key={s.id}
                                            onClick={() => openEdit(s)}
                                            className={`${getScheduleRowClass(s)} cursor-pointer transition hover:bg-stone-50 dark:hover:bg-stone-800`}
                                        >
                                            <td className="px-3 py-3">
                                                {s.event ? (
                                                    <Link
                                                        href={route('events.show', s.event.uuid)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-sm font-medium text-rose-500 hover:underline"
                                                    >
                                                        {s.client_name}
                                                    </Link>
                                                ) : (
                                                    <p className="text-sm font-bold text-orange-800">{s.client_name}</p>
                                                )}
                                                <p className="text-xs text-stone-500">{s.client_phone || '-'}</p>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className="flex items-center gap-2 text-sm font-medium text-stone-800">
                                                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base ${style.iconClass}`}>
                                                        {style.icon}
                                                    </span>
                                                    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${style.badgeClass}`}>
                                                        {typeName}
                                                    </span>
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-sm text-stone-900 dark:text-stone-100">
                                                {formatScheduleDateTime(s.schedule_from)}
                                                {s.schedule_to && ` - ${parseDateTime(s.schedule_to).time || formatScheduleDateTime(s.schedule_to)}`}
                                            </td>
                                            <td className="px-3 py-3 text-sm text-stone-900 dark:text-stone-100">
                                                <span className={`mb-1 inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${getClientStatusStyle(s)}`}>
                                                    {s.client_status_name}
                                                </span>
                                                <p>{s.description || '-'}</p>
                                            </td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            <div className="mt-4 flex justify-end gap-1">
                                {schedules.links.map((link, i) => link.url ? (
                                    <Link key={i} href={link.url} className={`rounded px-3 py-1 text-sm ${link.active ? 'bg-rose-400 text-white' : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                                ) : (
                                    <span key={i} className="rounded px-3 py-1 text-sm bg-stone-100 text-stone-400 dark:bg-stone-900" dangerouslySetInnerHTML={{ __html: link.label }} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-stone-900">
                        <h3 className="mb-4 text-lg font-semibold text-stone-900 dark:text-white">
                            {editMode ? 'Edit Jadwal' : 'Tambah Jadwal'}
                        </h3>
	                        <form onSubmit={submitForm} className="space-y-4">
	                            {!selected_event && (
	                                <div>
	                                    <label className="block text-sm font-medium text-stone-700 text-stone-500">Status Client</label>
	                                    <div className="mt-2 grid grid-cols-2 gap-2">
	                                        <button
	                                            type="button"
	                                            onClick={() => setData({
	                                                ...data,
	                                                client_source: 'booked',
	                                                prospect_name: '',
	                                                prospect_mobile_phone: '',
	                                            })}
	                                            className={`rounded-lg border px-3 py-2 text-sm font-semibold ${data.client_source === 'booked' ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-stone-200 bg-white text-stone-600'}`}
	                                        >
	                                            Client booking
	                                        </button>
	                                        <button
	                                            type="button"
	                                            onClick={() => setData({
	                                                ...data,
	                                                client_source: 'prospect',
	                                                event_id: '',
	                                            })}
	                                            className={`rounded-lg border px-3 py-2 text-sm font-semibold ${data.client_source === 'prospect' ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-stone-200 bg-white text-stone-600'}`}
	                                        >
	                                            Calon client
	                                        </button>
	                                    </div>
	                                </div>
	                            )}

	                            {data.client_source === 'booked' ? (
	                                <div className="relative">
	                                    <label className="block text-sm font-medium text-stone-700 text-stone-500">Client</label>
	                                    {selected_event ? (
	                                        <div className="mt-1 rounded-lg border border-rose-100 bg-rose-50 p-3">
	                                            <p className="text-base font-semibold text-rose-700">{selected_event.name}</p>
	                                            <p className="text-xs text-rose-600">{selected_event.mobile_phone || '-'} / {formatDisplayDate(selected_event.date)}</p>
	                                        </div>
	                                    ) : (
	                                        <input
	                                            type="text"
	                                            value={clientSearch}
	                                            onChange={(e) => {
	                                                setClientSearch(e.target.value);
	                                                setShowClientDropdown(true);
	                                                setData('event_id', '');
	                                            }}
	                                            onFocus={() => setShowClientDropdown(true)}
	                                            className="mt-1 block w-full rounded-md border-stone-300 bg-white text-stone-800"
	                                            placeholder="Cari nama / nomor client..."
	                                            required
	                                        />
	                                    )}
	                                    {!selected_event && showClientDropdown && (
	                                        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-lg">
	                                            {filteredEvents.length === 0 ? (
                                                <p className="px-4 py-3 text-sm text-stone-400">Tidak ditemukan</p>
                                            ) : (
                                                filteredEvents.map((event) => (
                                                    <button
                                                        key={event.id}
                                                        type="button"
                                                        onClick={() => selectEvent(event)}
                                                        className="w-full px-4 py-2 text-left text-sm hover:bg-stone-50"
                                                    >
                                                        <p className="font-medium text-stone-800">{event.name}</p>
                                                        <p className="text-xs text-stone-400">{event.mobile_phone || '-'} / {formatDisplayDate(event.date)}</p>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
	                                    {!selected_event && selectedEvent && (
	                                        <p className="mt-1 text-xs text-stone-500">Tanggal acara: {formatDisplayDate(selectedEvent.date)}</p>
	                                    )}
                                    <input type="hidden" value={data.event_id} name="event_id" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 text-stone-500">Nama Calon Client</label>
                                        <input
                                            type="text"
                                            value={data.prospect_name}
                                            onChange={(e) => setData('prospect_name', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-stone-300 bg-white text-stone-800"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 text-stone-500">Nomor Telepon</label>
                                        <input
                                            type="text"
                                            value={data.prospect_mobile_phone}
                                            onChange={(e) => setData('prospect_mobile_phone', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-stone-300 bg-white text-stone-800"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-600">
                                Keterangan status: MUA dan Sewa Gaun diambil dari data client booking. Calon client dipakai untuk jadwal yang belum booking.
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 text-stone-500">Jenis</label>
                                    <select value={data.schedule_type} onChange={(e) => setData('schedule_type', e.target.value)} className="mt-1 block w-full rounded-md border-stone-300 bg-white text-stone-800">
                                        <option value="1">Fitting</option>
                                        <option value="2">Konsultasi</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 text-stone-500">Tanggal</label>
                                    <input type="date" value={data.schedule_from} onChange={(e) => setData('schedule_from', e.target.value)} className="mt-1 block w-full rounded-md border-stone-300 bg-white text-stone-800" required />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 text-stone-500">Jam Mulai</label>
                                    <input type="time" value={data.time_from} onChange={(e) => handleStartTimeChange(e.target.value)} className="mt-1 block w-full rounded-md border-stone-300 bg-white text-stone-800" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 text-stone-500">Jam Selesai</label>
                                    <input type="time" value={data.time_to} onChange={(e) => setData('time_to', e.target.value)} className="mt-1 block w-full rounded-md border-stone-300 bg-white text-stone-800" />
                                </div>
                            </div>
                            {checkingSchedule ? (
                                <p className="rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-500">Mengecek jadwal...</p>
                            ) : scheduleConflict ? (
                                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{scheduleConflict}</p>
                            ) : data.schedule_from && data.time_from && (
                                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">Slot jadwal tersedia.</p>
                            )}
                            {takenTimes.length > 0 && (
                                <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                    <p className="font-semibold">Jadwal terisi di tanggal ini:</p>
                                    <p>{takenTimes.map((time) => `${time.from} - ${time.to || '-'}`).join(', ')}</p>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-stone-700 text-stone-500">Keterangan</label>
                                <textarea value={data.description} onChange={(e) => setData('description', e.target.value)} className="mt-1 block w-full rounded-md border-stone-300 bg-white text-stone-800" rows={2} />
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                                <div>
                                    {editMode && data.schedule_id && (
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(Number(data.schedule_id))}
                                            className="rounded bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                                        >
                                            Hapus Jadwal
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setShowModal(false)} className="rounded bg-stone-100 px-4 py-2 text-sm text-stone-700 bg-stone-100 text-stone-500">Batal</button>
                                    <button type="submit" disabled={processing || checkingSchedule || Boolean(scheduleConflict)} className="rounded bg-rose-400 px-4 py-2 text-sm text-white hover:bg-rose-500 disabled:opacity-50">{editMode ? 'Update' : 'Simpan'}</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
