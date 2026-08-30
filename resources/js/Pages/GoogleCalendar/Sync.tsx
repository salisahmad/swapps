import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';

interface Paginated<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
}

interface EventRow {
    id: number;
    uuid: string;
    name: string;
    date: string;
    time: string | null;
    order_type_name: string;
    google_event_id: string | null;
    google_sync_status: string;
    google_sync_attempts: number;
    google_synced_at: string | null;
    google_sync_error: string | null;
    updated_at: string;
}

interface ScheduleRow {
    id: number;
    type_name: string;
    client_name: string;
    schedule_from: string;
    schedule_to: string | null;
    prospect_name: string | null;
    google_event_id: string | null;
    google_sync_status: string;
    google_sync_attempts: number;
    google_synced_at: string | null;
    google_sync_error: string | null;
    updated_at: string;
    event?: {
        id: number;
        uuid: string;
        name: string;
    } | null;
}

interface PageProps {
    status: string;
    summary: {
        events: Record<string, number>;
        schedules: Record<string, number>;
    };
    events: Paginated<EventRow>;
    schedules: Paginated<ScheduleRow>;
    flash?: { success?: string; error?: string };
}

export default function Sync({ status, summary, events, schedules, flash }: PageProps) {
    const [processing, setProcessing] = useState(false);
    const statuses = ['failed', 'pending', 'skipped', 'synced', 'deleted'];
    const label: Record<string, string> = {
        failed: 'Failed',
        pending: 'Pending',
        skipped: 'Skipped',
        synced: 'Synced',
        deleted: 'Deleted',
    };
    const badge: Record<string, string> = {
        failed: 'border-red-200 bg-red-50 text-red-700',
        pending: 'border-amber-200 bg-amber-50 text-amber-700',
        skipped: 'border-stone-200 bg-stone-50 text-stone-600',
        synced: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        deleted: 'border-blue-200 bg-blue-50 text-blue-700',
    };

    const retry = (type: 'event' | 'schedule', id: number) => {
        router.post(route('google-calendar.sync.retry'), { type, id }, {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
        });
    };

    const retryAll = () => {
        router.post(route('google-calendar.sync.retry-all'), { status }, {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
        });
    };

    const showRetry = ['failed', 'pending', 'skipped'].includes(status);
    const formatDateTime = (value: string | null) => value ? new Date(value).toLocaleString('id-ID') : '-';

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-stone-800">Google Sync</h2>}>
            <Head title="Google Sync" />

            <div className="py-6">
                <div className="mx-auto max-w-6xl space-y-5 sm:px-6 lg:px-8">
                    {flash?.success && <div className="rounded bg-green-50 p-4 text-green-800">{flash.success}</div>}
                    {flash?.error && <div className="rounded bg-red-50 p-4 text-red-800">{flash.error}</div>}

                    <div className="rounded-lg bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-semibold text-stone-900">Data Sync Google Calendar</h3>
                                <p className="mt-1 text-sm text-stone-500">Pantau data yang gagal, pending, atau belum pernah disync.</p>
                            </div>
                            {showRetry && (
                                <button onClick={retryAll} disabled={processing} className="rounded bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-50">
                                    Sync Semua {label[status]}
                                </button>
                            )}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {statuses.map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => router.get(route('google-calendar.sync.index'), { status: item }, { preserveScroll: true })}
                                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${status === item ? badge[item] : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'}`}
                                >
                                    {label[item]}: {(summary.events[item] || 0) + (summary.schedules[item] || 0)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <SyncTable
                        title="Client"
                        rows={events.data}
                        links={events.links}
                        badge={badge}
                        label={label}
                        empty="Tidak ada client pada status ini."
                        renderName={(row) => (
                            <Link href={route('events.show', row.uuid)} className="font-semibold text-stone-900 hover:text-rose-600">
                                {row.name}
                            </Link>
                        )}
                        renderMeta={(row) => `${row.order_type_name} • ${row.date}${row.time ? ` ${row.time}` : ''}`}
                        renderError={(row) => row.google_sync_error}
                        renderAttempts={(row) => row.google_sync_attempts}
                        renderSyncedAt={(row) => formatDateTime(row.google_synced_at)}
                        renderStatus={(row) => row.google_sync_status}
                        onRetry={(row) => retry('event', row.id)}
                        showRetry={showRetry}
                        processing={processing}
                    />

                    <SyncTable
                        title="Jadwal"
                        rows={schedules.data}
                        links={schedules.links}
                        badge={badge}
                        label={label}
                        empty="Tidak ada jadwal pada status ini."
                        renderName={(row) => row.event ? (
                            <Link href={route('events.show', row.event.uuid)} className="font-semibold text-stone-900 hover:text-rose-600">
                                {row.event.name}
                            </Link>
                        ) : (
                            <span className="font-semibold text-stone-900">{row.prospect_name || row.client_name}</span>
                        )}
                        renderMeta={(row) => `${row.type_name} • ${formatDateTime(row.schedule_from)}`}
                        renderError={(row) => row.google_sync_error}
                        renderAttempts={(row) => row.google_sync_attempts}
                        renderSyncedAt={(row) => formatDateTime(row.google_synced_at)}
                        renderStatus={(row) => row.google_sync_status}
                        onRetry={(row) => retry('schedule', row.id)}
                        showRetry={showRetry}
                        processing={processing}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function SyncTable<T extends { id: number }>({
    title,
    rows,
    links,
    badge,
    label,
    empty,
    renderName,
    renderMeta,
    renderError,
    renderAttempts,
    renderSyncedAt,
    renderStatus,
    onRetry,
    showRetry,
    processing,
}: {
    title: string;
    rows: T[];
    links: { url: string | null; label: string; active: boolean }[];
    badge: Record<string, string>;
    label: Record<string, string>;
    empty: string;
    renderName: (row: T) => ReactNode;
    renderMeta: (row: T) => string;
    renderError: (row: T) => string | null;
    renderAttempts: (row: T) => number;
    renderSyncedAt: (row: T) => string;
    renderStatus: (row: T) => string;
    onRetry: (row: T) => void;
    showRetry: boolean;
    processing: boolean;
}) {
    return (
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
            <div className="border-b border-stone-100 px-5 py-4">
                <h3 className="font-semibold text-stone-900">{title}</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-stone-100">
                    <thead className="bg-stone-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-stone-500">Nama</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-stone-500">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-stone-500">Percobaan</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-stone-500">Terakhir Sync</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-stone-500">Error</th>
                            {showRetry && <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-stone-500">Aksi</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {rows.map((row) => {
                            const status = renderStatus(row);

                            return (
                                <tr key={row.id}>
                                    <td className="px-4 py-3">
                                        {renderName(row)}
                                        <p className="mt-1 text-xs text-stone-500">{renderMeta(row)}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${badge[status] || badge.skipped}`}>
                                            {label[status] || status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-stone-600">{renderAttempts(row)}x</td>
                                    <td className="px-4 py-3 text-sm text-stone-600">{renderSyncedAt(row)}</td>
                                    <td className="max-w-xl px-4 py-3 text-xs leading-5 text-red-700">{renderError(row) || '-'}</td>
                                    {showRetry && (
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => onRetry(row)} disabled={processing} className="rounded border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">
                                                Sync
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={showRetry ? 6 : 5} className="px-4 py-10 text-center text-sm text-stone-400">{empty}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="flex flex-wrap justify-center gap-1 border-t border-stone-100 p-3">
                {links.map((link, index) =>
                    link.url ? (
                        <Link key={index} href={link.url} className={`rounded px-3 py-1.5 text-sm ${link.active ? 'bg-rose-500 text-white' : 'border border-stone-100 text-stone-600 hover:bg-stone-50'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                    ) : (
                        <span key={index} className="rounded bg-stone-100 px-3 py-1.5 text-sm text-stone-400" dangerouslySetInnerHTML={{ __html: link.label }} />
                    ),
                )}
            </div>
        </div>
    );
}
