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
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Events / Booking
                    </h2>
                    <Link
                        href={route('events.create')}
                        className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
                    >
                        + Booking Baru
                    </Link>
                </div>
            }
        >
            <Head title="Events" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Filter Bar */}
                    <div className="mb-4 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
                        <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                            <input
                                type="text"
                                placeholder="Cari nama / telepon..."
                                value={data.q}
                                onChange={(e) => setData('q', e.target.value)}
                                className="rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            />
                            <input
                                type="date"
                                placeholder="Dari tanggal"
                                value={data.date_from}
                                onChange={(e) => setData('date_from', e.target.value)}
                                className="rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            />
                            <input
                                type="date"
                                placeholder="Sampai tanggal"
                                value={data.date_to}
                                onChange={(e) => setData('date_to', e.target.value)}
                                className="rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            />
                            <select
                                value={data.paid}
                                onChange={(e) => setData('paid', e.target.value)}
                                className="rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            >
                                <option value="">Semua Status</option>
                                <option value="1">Lunas</option>
                                <option value="0">Belum Lunas</option>
                            </select>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
                                >
                                    Filter
                                </button>
                                <Link
                                    href={route('events.index')}
                                    className="rounded bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
                                >
                                    Reset
                                </Link>
                            </div>
                        </form>
                    </div>

                    {/* Table */}
                    <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800">
                        <div className="p-6">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead>
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Nama Client</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Tanggal</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Telepon</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Paket</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Total</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {events.data.map((event) => (
                                        <tr key={event.id}>
                                            <td className="px-3 py-3">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{event.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{event.order_type_name}</p>
                                            </td>
                                            <td className="px-3 py-3 text-sm text-gray-900 dark:text-gray-100">
                                                {event.date} {event.time ? `• ${event.time}` : ''}
                                            </td>
                                            <td className="px-3 py-3 text-sm text-gray-900 dark:text-gray-100">{event.mobile_phone}</td>
                                            <td className="px-3 py-3 text-sm text-gray-900 dark:text-gray-100">
                                                {event.location ? (
                                                    <a href={event.location} target="_blank" className="text-indigo-600 hover:underline dark:text-indigo-400">Lokasi</a>
                                                ) : '-'}
                                            </td>
                                            <td className="px-3 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                                                {formatRupiah(event.total_amount)}
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <span className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${
                                                    event.is_fully_paid
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                                }`}>
                                                    {event.is_fully_paid ? 'LUNAS' : 'BELUM LUNAS'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-right text-sm">
                                                <Link
                                                    href={route('events.show', event.id)}
                                                    className="mr-2 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400"
                                                >
                                                    Detail
                                                </Link>
                                                <Link
                                                    href={route('events.edit', event.id)}
                                                    className="mr-2 text-gray-600 hover:text-gray-900 dark:text-gray-400"
                                                >
                                                    Edit
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            <div className="mt-4 flex justify-end gap-1">
                                {events.links.map((link, i) =>
                                    link.url ? (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            className={`rounded px-3 py-1 text-sm ${
                                                link.active
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span
                                            key={i}
                                            className="rounded px-3 py-1 text-sm bg-gray-100 text-gray-400 dark:bg-gray-800"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ),
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
