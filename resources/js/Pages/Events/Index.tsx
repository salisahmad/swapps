import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

interface EventItem {
    id: number;
    name: string;
    date: string;
    time: string | null;
    mobile_phone: string;
    location: string | null;
    total_amount: number;
    is_fully_paid: boolean;
    order_type_name: string;
    created_at: string;
}

interface PageProps {
    events: {
        data: EventItem[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: {
        q?: string;
        date_from?: string;
        date_to?: string;
        paid?: string;
        order_type?: string;
    };
}

export default function Index({ events, filters }: PageProps) {
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

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="page-title">Events</h2>
                    <Link href={route('events.create')} className="btn-primary text-sm py-2.5 px-4">
                        + Booking
                    </Link>
                </div>
            }
        >
            <Head title="Events" />

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
                        <input
                            type="date"
                            value={data.date_from}
                            onChange={(e) => setData('date_from', e.target.value)}
                            className="input-field w-auto"
                        />
                        <select
                            value={data.paid}
                            onChange={(e) => setData('paid', e.target.value)}
                            className="input-field w-auto"
                        >
                            <option value="">Semua</option>
                            <option value="1">Lunas</option>
                            <option value="0">Belum</option>
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
                            href={route('events.show', event.id)}
                            className="card block p-4 transition active:scale-[0.98]"
                        >
                            <div className="flex items-start justify-between">
                                <div className="min-w-0">
                                    <p className="text-base font-semibold text-stone-800">{event.name}</p>
                                    <p className="mt-1 text-sm text-stone-400">
                                        📅 {event.date} {event.time ? `· ${event.time}` : ''}
                                    </p>
                                    <p className="mt-1 text-sm text-stone-400">📞 {event.mobile_phone}</p>
                                    {event.location && (
                                        <p className="mt-1 text-sm text-stone-400">📍 {event.location}</p>
                                    )}
                                </div>
                                <span className={`badge shrink-0 ${event.is_fully_paid ? 'badge-green' : 'badge-yellow'}`}>
                                    {event.is_fully_paid ? 'LUNAS' : 'BELUM'}
                                </span>
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                                <span className="badge-pink">{event.order_type_name}</span>
                                <p className="text-lg font-bold text-rose-500">{formatRupiah(event.total_amount)}</p>
                            </div>
                        </Link>
                    ))}
                    {events.data.length === 0 && (
                        <div className="card py-12 text-center">
                            <p className="text-4xl mb-2">📭</p>
                            <p className="text-stone-400">Tidak ada event</p>
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
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-stone-400">Total</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-stone-400">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-stone-400">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {events.data.map((event) => (
                                    <tr key={event.id} className="transition hover:bg-stone-50">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-stone-800">{event.name}</p>
                                            <p className="text-xs text-stone-400">{event.order_type_name}</p>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-stone-600">{event.date} {event.time ? `· ${event.time}` : ''}</td>
                                        <td className="px-4 py-3 text-sm text-stone-600">{event.mobile_phone}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-stone-800">{formatRupiah(event.total_amount)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`badge ${event.is_fully_paid ? 'badge-green' : 'badge-yellow'}`}>
                                                {event.is_fully_paid ? 'LUNAS' : 'BELUM'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm">
                                            <Link href={route('events.show', event.id)} className="text-rose-500 hover:text-rose-600 font-medium">Detail</Link>
                                        </td>
                                    </tr>
                                ))}
                                {events.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-stone-400">
                                            📭 Tidak ada event
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                <div className="flex justify-center gap-1 pt-2">
                    {events.links.map((link, i) =>
                        link.url ? (
                            <Link
                                key={i}
                                href={link.url}
                                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                                    link.active
                                        ? 'bg-rose-400 text-white font-semibold'
                                        : 'bg-white text-stone-600 border border-stone-100 hover:bg-stone-50'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ) : (
                            <span
                                key={i}
                                className="rounded-lg px-3 py-1.5 text-sm bg-stone-100 text-stone-500"
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ),
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
