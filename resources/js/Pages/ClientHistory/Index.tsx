import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatShortDate, formatShortDateTime } from '@/utils/date';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
}

interface ActivityLog {
    id: number;
    message: string;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
    created_at: string;
    user: User | null;
}

interface Client {
    id: number;
    uuid: string;
    name: string;
    mobile_phone: string | null;
    date: string | null;
    time: string | null;
    deleted_at: string | null;
    order_type_name?: string;
    activity_logs?: ActivityLog[];
}

interface RescheduleLog extends ActivityLog {
    event: Client | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Paginated<T> {
    data: T[];
    links: PaginationLink[];
    total: number;
}

interface PageProps {
    cancelledClients: Paginated<Client>;
    rescheduledClients: Paginated<RescheduleLog>;
}

type Tab = 'cancelled' | 'rescheduled';

export default function Index({ cancelledClients, rescheduledClients }: PageProps) {
    const [activeTab, setActiveTab] = useState<Tab>('cancelled');

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="page-title">Riwayat Client</h2>
                        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Client batal dan perubahan tanggal acara.</p>
                    </div>
                    <Link href={route('events.index')} className="btn-secondary px-4 py-2 text-sm">
                        Clients
                    </Link>
                </div>
            }
        >
            <Head title="Riwayat Client" />

            <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                    <SummaryCard label="Client Batal" value={cancelledClients.total} tone="red" />
                    <SummaryCard label="Client Reschedule" value={rescheduledClients.total} tone="amber" />
                </div>

                <div className="card p-2">
                    <div className="grid grid-cols-2 gap-2">
                        <TabButton active={activeTab === 'cancelled'} onClick={() => setActiveTab('cancelled')}>
                            Batal ({cancelledClients.total})
                        </TabButton>
                        <TabButton active={activeTab === 'rescheduled'} onClick={() => setActiveTab('rescheduled')}>
                            Reschedule ({rescheduledClients.total})
                        </TabButton>
                    </div>
                </div>

                {activeTab === 'cancelled' ? (
                    <CancelledList clients={cancelledClients} />
                ) : (
                    <RescheduledList logs={rescheduledClients} />
                )}
            </div>
        </AuthenticatedLayout>
    );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: 'red' | 'amber' }) {
    const toneClass = tone === 'red'
        ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200'
        : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200';

    return (
        <div className={`rounded-xl border p-4 ${toneClass}`}>
            <p className="text-sm font-semibold">{label}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
    );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                active
                    ? 'bg-rose-400 text-white shadow-sm shadow-rose-200 dark:bg-rose-500 dark:shadow-none'
                    : 'text-stone-500 hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-stone-800'
            }`}
        >
            {children}
        </button>
    );
}

function CancelledList({ clients }: { clients: Paginated<Client> }) {
    return (
        <div className="card overflow-hidden">
            <div className="border-b border-stone-100 px-4 py-3 dark:border-stone-800">
                <h3 className="font-semibold text-stone-800 dark:text-stone-100">Client Batal</h3>
            </div>
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {clients.data.length === 0 ? (
                    <EmptyState text="Belum ada client batal." />
                ) : clients.data.map((client) => {
                    const deleteLog = client.activity_logs?.[0];

                    return (
                        <div key={client.id} className="p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="truncate text-base font-semibold text-stone-800 dark:text-stone-100">{client.name}</p>
                                        <span className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
                                            Batal
                                        </span>
                                        {client.order_type_name && (
                                            <span className="rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-xs font-semibold text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200">
                                                {client.order_type_name}
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                                        Acara: {formatShortDate(client.date)} {client.time ? `/ ${client.time}` : ''}
                                    </p>
                                    <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                                        Dihapus: {formatShortDateTime(client.deleted_at)}{deleteLog?.user ? ` oleh ${deleteLog.user.name}` : ''}
                                    </p>
                                </div>
                                {client.mobile_phone && (
                                    <p className="rounded-lg bg-stone-50 px-3 py-2 text-sm font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-200">
                                        {client.mobile_phone}
                                    </p>
                                )}
                            </div>
                            {deleteLog?.message && (
                                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-200">
                                    {deleteLog.message}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
            <Pagination links={clients.links} />
        </div>
    );
}

function RescheduledList({ logs }: { logs: Paginated<RescheduleLog> }) {
    return (
        <div className="card overflow-hidden">
            <div className="border-b border-stone-100 px-4 py-3 dark:border-stone-800">
                <h3 className="font-semibold text-stone-800 dark:text-stone-100">Client Reschedule</h3>
            </div>
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {logs.data.length === 0 ? (
                    <EmptyState text="Belum ada perubahan tanggal acara." />
                ) : logs.data.map((log) => {
                    const client = log.event;
                    const beforeDate = typeof log.before?.date === 'string' ? log.before.date : null;
                    const afterDate = typeof log.after?.date === 'string' ? log.after.date : null;

                    return (
                        <div key={log.id} className="p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {client && !client.deleted_at ? (
                                            <Link href={route('events.show', client.uuid)} className="truncate text-base font-semibold text-rose-500 hover:text-rose-600">
                                                {client.name}
                                            </Link>
                                        ) : (
                                            <p className="truncate text-base font-semibold text-stone-800 dark:text-stone-100">{client?.name ?? 'Client tidak ditemukan'}</p>
                                        )}
                                        <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                                            Reschedule
                                        </span>
                                        {client?.deleted_at && (
                                            <span className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
                                                Batal
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                                        Diubah: {formatShortDateTime(log.created_at)}{log.user ? ` oleh ${log.user.name}` : ''}
                                    </p>
                                    {client?.mobile_phone && (
                                        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{client.mobile_phone}</p>
                                    )}
                                </div>
                                <div className="rounded-xl border border-stone-100 bg-stone-50 p-3 text-sm dark:border-stone-800 dark:bg-stone-900">
                                    <p className="text-xs font-semibold uppercase text-stone-400">Perubahan Tanggal</p>
                                    <p className="mt-1 font-semibold text-stone-800 dark:text-stone-100">
                                        {formatShortDate(beforeDate)} → {formatShortDate(afterDate)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <Pagination links={logs.links} />
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="px-4 py-12 text-center text-sm text-stone-500 dark:text-stone-400">
            {text}
        </div>
    );
}

function Pagination({ links }: { links: PaginationLink[] }) {
    if (links.length <= 3) return null;

    return (
        <div className="flex flex-wrap justify-center gap-2 border-t border-stone-100 p-4 dark:border-stone-800">
            {links.map((link, index) => (
                link.url ? (
                    <Link
                        key={`${link.label}-${index}`}
                        href={link.url}
                        preserveScroll
                        className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                            link.active
                                ? 'bg-rose-400 text-white'
                                : 'border border-stone-100 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800'
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ) : (
                    <span
                        key={`${link.label}-${index}`}
                        className="rounded-lg border border-stone-100 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-300 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-600"
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                )
            ))}
        </div>
    );
}
