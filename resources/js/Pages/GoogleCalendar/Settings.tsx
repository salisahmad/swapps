import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

interface Settings {
    enabled: boolean;
    client_id: string | null;
    calendar_id: string;
    color_id: string;
    connected_email: string | null;
    has_client_secret: boolean;
    is_connected: boolean;
    redirect_uri: string;
}

interface PageProps {
    settings: Settings;
    sync_summary: {
        events: Record<string, number>;
        schedules: Record<string, number>;
        failed_events: {
            id: number;
            uuid: string;
            name: string;
            google_sync_attempts: number;
            google_sync_error: string | null;
            updated_at: string;
        }[];
        failed_schedules: {
            id: number;
            prospect_name: string | null;
            google_sync_attempts: number;
            google_sync_error: string | null;
            updated_at: string;
            event?: {
                id: number;
                uuid: string;
                name: string;
            } | null;
        }[];
    };
    flash?: { success?: string; error?: string };
    errors?: Record<string, string>;
}

export default function Settings({ settings, sync_summary, flash, errors = {} }: PageProps) {
    const { data, setData, patch, post, processing } = useForm({
        enabled: settings.enabled,
        client_id: settings.client_id || '',
        client_secret: '',
        calendar_id: settings.calendar_id || 'primary',
        color_id: settings.color_id || '4',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        patch(route('google-calendar.update'), { preserveScroll: true });
    };

    const connect = () => post(route('google-calendar.connect'), { preserveScroll: true });
    const disconnect = () => post(route('google-calendar.disconnect'), { preserveScroll: true });
    const sync = () => post(route('google-calendar.sync'), { preserveScroll: true });

    const inputClass = 'mt-1 block w-full rounded-md border border-stone-200 bg-white text-stone-800 shadow-sm focus:border-rose-400 focus:ring-rose-400';
    const labelClass = 'block text-sm font-medium text-stone-700';
    const errorClass = 'mt-1 text-xs text-red-600';
    const statusLabels: Record<string, string> = {
        pending: 'Pending',
        synced: 'Synced',
        failed: 'Failed',
        skipped: 'Skipped',
        deleted: 'Deleted',
    };
    const statusClass: Record<string, string> = {
        pending: 'border-amber-200 bg-amber-50 text-amber-700',
        synced: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        failed: 'border-red-200 bg-red-50 text-red-700',
        skipped: 'border-stone-200 bg-stone-50 text-stone-600',
        deleted: 'border-blue-200 bg-blue-50 text-blue-700',
    };
    const statuses = ['pending', 'synced', 'failed', 'skipped', 'deleted'];

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-stone-800">Google Calendar</h2>}
        >
            <Head title="Google Calendar" />

            <div className="py-6">
                <div className="mx-auto max-w-3xl space-y-6 sm:px-6 lg:px-8">
                    {flash?.success && <div className="rounded bg-green-50 p-4 text-green-800">{flash.success}</div>}
                    {flash?.error && <div className="rounded bg-red-50 p-4 text-red-800">{flash.error}</div>}

                    <div className="rounded-lg bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-stone-900">Sync Client dan Jadwal ke Google Calendar</h3>
                        <p className="mt-2 text-sm leading-6 text-stone-600">
                            Client MUA memakai warna cherry blossom, Sewa Gaun memakai cobalt. Jadwal Fitting memakai mango,
                            Konsultasi memakai avocado, dan calon client diberi tanda [TW] di nama event.
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-6 rounded-lg bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <input
                                id="enabled"
                                type="checkbox"
                                checked={data.enabled}
                                onChange={(e) => setData('enabled', e.target.checked)}
                                className="rounded border-stone-300 text-rose-400 focus:ring-rose-400"
                            />
                            <label htmlFor="enabled" className="text-sm font-semibold text-stone-700">
                                Aktifkan sinkronisasi Google Calendar
                            </label>
                        </div>

                        <div>
                            <label className={labelClass}>Redirect URI</label>
                            <input value={settings.redirect_uri} readOnly className={`${inputClass} bg-stone-50`} />
                            <p className="mt-1 text-xs text-stone-500">
                                Masukkan URL ini di Google Cloud OAuth Client sebagai Authorized redirect URI.
                            </p>
                        </div>

                        <div>
                            <label className={labelClass}>Client ID</label>
                            <input
                                value={data.client_id}
                                onChange={(e) => setData('client_id', e.target.value)}
                                className={inputClass}
                                placeholder="Google OAuth Client ID"
                            />
                            {errors.client_id && <p className={errorClass}>{errors.client_id}</p>}
                        </div>

                        <div>
                            <label className={labelClass}>Client Secret</label>
                            <input
                                type="password"
                                value={data.client_secret}
                                onChange={(e) => setData('client_secret', e.target.value)}
                                className={inputClass}
                                placeholder={settings.has_client_secret ? 'Secret sudah tersimpan. Isi hanya jika ingin mengganti.' : 'Google OAuth Client Secret'}
                                autoComplete="off"
                            />
                            <p className="mt-1 text-xs text-stone-500">
                                {settings.has_client_secret ? 'Client Secret sudah tersimpan.' : 'Client Secret belum disimpan.'}
                            </p>
                            {errors.client_secret && <p className={errorClass}>{errors.client_secret}</p>}
                        </div>

                        <div>
                            <label className={labelClass}>Calendar ID</label>
                            <input
                                value={data.calendar_id}
                                onChange={(e) => setData('calendar_id', e.target.value)}
                                className={inputClass}
                                placeholder="primary"
                            />
                            <p className="mt-1 text-xs text-stone-500">
                                Pakai <b>primary</b> untuk kalender utama, atau isi Calendar ID lain jika memakai kalender khusus.
                            </p>
                            {errors.calendar_id && <p className={errorClass}>{errors.calendar_id}</p>}
                        </div>

                        <div>
                            <label className={labelClass}>Warna Event</label>
                            <select value={data.color_id} onChange={(e) => setData('color_id', e.target.value)} className={inputClass}>
                                <option value="4">Cherry blossom / Flamingo</option>
                                <option value="1">Lavender</option>
                                <option value="2">Sage</option>
                                <option value="3">Grape</option>
                                <option value="5">Banana</option>
                                <option value="6">Tangerine</option>
                                <option value="7">Peacock</option>
                                <option value="9">Blueberry</option>
                                <option value="10">Basil</option>
                                <option value="11">Tomato</option>
                            </select>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button disabled={processing} className="rounded bg-rose-400 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50">
                                Simpan Pengaturan
                            </button>
                            <button type="button" onClick={connect} disabled={processing} className="rounded bg-stone-800 px-5 py-2 text-sm font-semibold text-white hover:bg-stone-900 disabled:opacity-50">
                                Connect Google
                            </button>
                        </div>
                    </form>

                    <div className="rounded-lg bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-stone-900">Status Koneksi</h3>
                        <p className="mt-2 text-sm text-stone-600">
                            {settings.is_connected
                                ? `Terhubung${settings.connected_email ? ` sebagai ${settings.connected_email}` : ''}.`
                                : 'Belum terhubung ke Google Calendar.'}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <button type="button" onClick={sync} disabled={processing || !settings.is_connected} className="rounded bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                                Sync Ulang Semua Data
                            </button>
                            <Link href={route('google-calendar.sync.index')} className="rounded bg-stone-800 px-5 py-2 text-sm font-semibold text-white hover:bg-stone-900">
                                Lihat Detail Sync
                            </Link>
                            <button type="button" onClick={disconnect} disabled={processing || !settings.is_connected} className="rounded bg-red-50 px-5 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50">
                                Disconnect
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
                        <div>
                            <h3 className="text-lg font-semibold text-stone-900">Status Sync</h3>
                            <p className="mt-1 text-sm text-stone-600">
                                Data pending/failed akan diproses oleh queue worker Google Calendar.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-lg border border-stone-100 p-4">
                                <p className="text-sm font-semibold text-stone-700">Client</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {statuses.map((status) => (
                                        <span key={status} className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass[status]}`}>
                                            {statusLabels[status]}: {sync_summary.events[status] || 0}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="rounded-lg border border-stone-100 p-4">
                                <p className="text-sm font-semibold text-stone-700">Jadwal</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {statuses.map((status) => (
                                        <span key={status} className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass[status]}`}>
                                            {statusLabels[status]}: {sync_summary.schedules[status] || 0}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {(sync_summary.failed_events.length > 0 || sync_summary.failed_schedules.length > 0) && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-stone-800">Error Terakhir</h4>
                                {sync_summary.failed_events.map((event) => (
                                    <div key={`event-${event.id}`} className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <Link href={route('events.show', event.uuid)} className="font-semibold text-red-800 hover:underline">
                                                {event.name}
                                            </Link>
                                            <span className="text-xs text-red-600">{event.google_sync_attempts}x percobaan</span>
                                        </div>
                                        <p className="mt-1 text-xs leading-5 text-red-700">{event.google_sync_error || 'Error tidak diketahui.'}</p>
                                    </div>
                                ))}
                                {sync_summary.failed_schedules.map((schedule) => (
                                    <div key={`schedule-${schedule.id}`} className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            {schedule.event ? (
                                                <Link href={route('events.show', schedule.event.uuid)} className="font-semibold text-red-800 hover:underline">
                                                    {schedule.event.name}
                                                </Link>
                                            ) : (
                                                <span className="font-semibold text-red-800">{schedule.prospect_name || 'Jadwal calon client'}</span>
                                            )}
                                            <span className="text-xs text-red-600">{schedule.google_sync_attempts}x percobaan</span>
                                        </div>
                                        <p className="mt-1 text-xs leading-5 text-red-700">{schedule.google_sync_error || 'Error tidak diketahui.'}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
