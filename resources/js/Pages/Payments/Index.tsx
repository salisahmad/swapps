import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

interface PaymentItem {
    id: number;
    is_expense: number;
    type_name: string;
    payment_at: string | null;
    payment_type_name: string;
    amount: number;
    description: string | null;
    status: number;
    status_name: string;
    event: { id: number; name: string };
}

interface PageProps {
    payments: {
        data: PaymentItem[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: {
        status?: string;
        is_expense?: string;
        date_from?: string;
        date_to?: string;
    };
    stats: {
        total_earnings: number;
        total_expenses: number;
        total_pending: number;
        profit: number;
    };
}

export default function Index({ payments, filters, stats }: PageProps) {
    const { data, setData, get, post } = useForm({
        status: filters.status || '',
        is_expense: filters.is_expense || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        get(route('payments.index'));
    };

    const formatRupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

    const handleConfirm = (id: number) => {
        if (confirm('Konfirmasi pembayaran ini?')) {
            post(route('payments.confirm', id));
        }
    };

    const handleReject = (id: number) => {
        if (confirm('Tolak pembayaran ini?')) {
            post(route('payments.reject', id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Pembayaran & Keuangan
                    </h2>
                    <Link
                        href={route('payments.create')}
                        className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
                    >
                        + Catat Transaksi
                    </Link>
                </div>
            }
        >
            <Head title="Payments" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Stats */}
                    <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
                        <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Pemasukan</p>
                            <p className="text-xl font-bold text-green-700 dark:text-green-300">{formatRupiah(stats.total_earnings)}</p>
                        </div>
                        <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Pengeluaran</p>
                            <p className="text-xl font-bold text-red-700 dark:text-red-300">{formatRupiah(stats.total_expenses)}</p>
                        </div>
                        <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
                            <p className="text-xl font-bold text-yellow-700 dark:text-yellow-300">{formatRupiah(stats.total_pending)}</p>
                        </div>
                        <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Profit</p>
                            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{formatRupiah(stats.profit)}</p>
                        </div>
                    </div>

                    {/* Filter */}
                    <div className="mb-4 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
                        <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                            <select
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className="rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            >
                                <option value="">Semua Status</option>
                                <option value="0">Pending</option>
                                <option value="1">Terkonfirmasi</option>
                                <option value="2">Ditolak</option>
                            </select>
                            <select
                                value={data.is_expense}
                                onChange={(e) => setData('is_expense', e.target.value)}
                                className="rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            >
                                <option value="">Semua Jenis</option>
                                <option value="0">Pemasukan</option>
                                <option value="1">Pengeluaran</option>
                            </select>
                            <input
                                type="date"
                                value={data.date_from}
                                onChange={(e) => setData('date_from', e.target.value)}
                                className="rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            />
                            <input
                                type="date"
                                value={data.date_to}
                                onChange={(e) => setData('date_to', e.target.value)}
                                className="rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            />
                            <div className="flex gap-2">
                                <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">Filter</button>
                                <Link href={route('payments.index')} className="rounded bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300">Reset</Link>
                            </div>
                        </form>
                    </div>

                    {/* Table */}
                    <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800">
                        <div className="p-6">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead>
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Event</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Tanggal</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Jenis</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Jumlah</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {payments.data.map((p) => (
                                        <tr key={p.id}>
                                            <td className="px-3 py-3">
                                                <Link href={route('events.show', p.event.id)} className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                                                    {p.event.name}
                                                </Link>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{p.description || '-'}</p>
                                            </td>
                                            <td className="px-3 py-3 text-sm text-gray-900 dark:text-gray-100">{p.payment_at || '-'}</td>
                                            <td className="px-3 py-3">
                                                <span className={`rounded px-2 py-1 text-xs font-semibold ${
                                                    p.is_expense === 0
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                                }`}>
                                                    {p.type_name}
                                                </span>
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{p.payment_type_name}</p>
                                            </td>
                                            <td className={`px-3 py-3 text-right text-sm font-medium ${
                                                p.is_expense === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                            }`}>
                                                {p.is_expense === 0 ? '+' : '-'}{formatRupiah(p.amount)}
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <span className={`rounded px-2 py-1 text-xs font-semibold ${
                                                    p.status === 1
                                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                                        : p.status === 2
                                                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                                }`}>
                                                    {p.status_name}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-right text-sm">
                                                {p.status === 0 && (
                                                    <>
                                                        <button
                                                            onClick={() => handleConfirm(p.id)}
                                                            className="mr-2 text-green-600 hover:text-green-800 dark:text-green-400"
                                                        >
                                                            Konfirmasi
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(p.id)}
                                                            className="mr-2 text-red-600 hover:text-red-800 dark:text-red-400"
                                                        >
                                                            Tolak
                                                        </button>
                                                    </>
                                                )}
                                                <Link href={route('payments.edit', p.id)} className="text-gray-600 hover:text-gray-900 dark:text-gray-400">Edit</Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="mt-4 flex justify-end gap-1">
                                {payments.links.map((link, i) =>
                                    link.url ? (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            className={`rounded px-3 py-1 text-sm ${link.active ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span key={i} className="rounded px-3 py-1 text-sm bg-gray-100 text-gray-400 dark:bg-gray-800" dangerouslySetInnerHTML={{ __html: link.label }} />
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
