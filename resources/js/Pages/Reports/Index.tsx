import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

interface DailyData {
    date: string;
    earnings: number;
    expenses: number;
}

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

interface ChartData {
    month: string;
    earnings: number;
    expenses: number;
}

interface Summary {
    earnings: number;
    expenses: number;
    profit: number;
    pending: number;
    new_events: number;
    upcoming_events: number;
}

interface PageProps {
    filters: { year: number; month: number };
    summary: Summary;
    daily: DailyData[];
    payments: {
        data: PaymentItem[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    chartData: ChartData[];
}

export default function Index({ filters, summary, daily, payments, chartData }: PageProps) {
    const formatRupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
    const maxChart = Math.max(...chartData.map((d) => Math.max(d.earnings, d.expenses))) || 1;

    const years = [2024, 2025, 2026, 2027, 2028];
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Laporan Keuangan
                </h2>
            }
        >
            <Head title="Laporan" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Filter Month */}
                    <div className="mb-4 flex flex-wrap gap-2">
                        <form method="get" className="flex flex-wrap gap-2">
                            <select name="year" defaultValue={filters.year} className="rounded border-gray-300 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                                {years.map((y) => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <select name="month" defaultValue={filters.month} className="rounded border-gray-300 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                                {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                            </select>
                            <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">
                                Tampilkan
                            </button>
                        </form>
                    </div>

                    {/* Summary Cards */}
                    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Pemasukan</p>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatRupiah(summary.earnings)}</p>
                        </div>
                        <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Pengeluaran</p>
                            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatRupiah(summary.expenses)}</p>
                        </div>
                        <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Profit</p>
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatRupiah(summary.profit)}</p>
                        </div>
                        <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
                            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{formatRupiah(summary.pending)}</p>
                        </div>
                        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Booking Baru</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.new_events}</p>
                        </div>
                        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Event Mendatang</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.upcoming_events}</p>
                        </div>
                    </div>

                    {/* Chart: Last 12 Months */}
                    <div className="mb-6 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">📊 Grafik 12 Bulan Terakhir</h3>
                        <div className="flex items-end gap-2 overflow-x-auto pb-2">
                            {chartData.map((d, i) => {
                                const eHeight = (d.earnings / maxChart) * 200;
                                const xHeight = (d.expenses / maxChart) * 200;
                                return (
                                    <div key={i} className="flex flex-col items-center gap-1">
                                        <div className="flex items-end gap-1">
                                            <div style={{ height: Math.max(eHeight, 4) }} className="w-4 rounded bg-green-400 dark:bg-green-500" title={`Pemasukan: ${formatRupiah(d.earnings)}`} />
                                            <div style={{ height: Math.max(xHeight, 4) }} className="w-4 rounded bg-red-400 dark:bg-red-500" title={`Pengeluaran: ${formatRupiah(d.expenses)}`} />
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 rotate-0 whitespace-nowrap">{d.month}</p>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-2 flex gap-4 text-xs">
                            <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-green-400" /> Pemasukan</span>
                            <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-red-400" /> Pengeluaran</span>
                        </div>
                    </div>

                    {/* Daily Breakdown */}
                    <div className="mb-6 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">📅 Harian Bulan Ini</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead>
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Tanggal</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-green-600 dark:text-green-400">Pemasukan</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-red-600 dark:text-red-400">Pengeluaran</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-blue-600 dark:text-blue-400">Profit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {daily.map((d) => (
                                        <tr key={d.date}>
                                            <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{d.date}</td>
                                            <td className="px-3 py-2 text-right text-sm font-medium text-green-600 dark:text-green-400">{formatRupiah(d.earnings)}</td>
                                            <td className="px-3 py-2 text-right text-sm font-medium text-red-600 dark:text-red-400">{formatRupiah(d.expenses)}</td>
                                            <td className="px-3 py-2 text-right text-sm font-medium text-blue-600 dark:text-blue-400">{formatRupiah(d.earnings - d.expenses)}</td>
                                        </tr>
                                    ))}
                                    {daily.length === 0 && (
                                        <tr><td colSpan={4} className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">Tidak ada transaksi bulan ini.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Payment List */}
                    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">📋 Semua Transaksi</h3>
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead>
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Event</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Tanggal</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Jenis</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Jumlah</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {payments.data.map((p) => (
                                    <tr key={p.id}>
                                        <td className="px-3 py-2 text-sm">
                                            <Link href={route('events.show', p.event.id)} className="text-indigo-600 hover:underline dark:text-indigo-400">{p.event.name}</Link>
                                        </td>
                                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{p.payment_at || '-'}</td>
                                        <td className="px-3 py-2 text-sm">
                                            <span className={`rounded px-2 py-1 text-xs font-semibold ${p.is_expense === 0 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                                                {p.type_name}
                                            </span>
                                        </td>
                                        <td className={`px-3 py-2 text-right text-sm font-medium ${p.is_expense === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {p.is_expense === 0 ? '+' : '-'}{formatRupiah(p.amount)}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <span className={`rounded px-2 py-1 text-xs font-semibold ${p.status === 1 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}>
                                                {p.status_name}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {payments.data.length === 0 && (
                                    <tr><td colSpan={5} className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">Tidak ada transaksi.</td></tr>
                                )}
                            </tbody>
                        </table>
                        <div className="mt-4 flex justify-end gap-1">
                            {payments.links.map((link, i) => link.url ? (
                                <Link key={i} href={link.url} className={`rounded px-3 py-1 text-sm ${link.active ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                            ) : (
                                <span key={i} className="rounded px-3 py-1 text-sm bg-gray-100 text-gray-400 dark:bg-gray-800" dangerouslySetInnerHTML={{ __html: link.label }} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
