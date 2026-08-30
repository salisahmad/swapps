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
    event: { id: number; uuid: string; name: string; deleted_at?: string | null } | null;
}

interface ChartData {
    month: string;
    earnings: number;
    expenses: number;
}

interface MonthlyClientData {
    month: string;
    clients: number;
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
    filters: { year: number; month: number; client_chart_year: number };
    summary: Summary;
    daily: DailyData[];
    payments: {
        data: PaymentItem[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    chartData: ChartData[];
    monthlyClientData: MonthlyClientData[];
    monthlyEventClientData: MonthlyClientData[];
}

export default function Index({ filters, summary, daily, payments, chartData, monthlyClientData, monthlyEventClientData }: PageProps) {
    const formatRupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
    const maxChart = Math.max(...chartData.map((d) => Math.max(d.earnings, d.expenses))) || 1;
    const clientChartWidth = 720;
    const clientChartHeight = 220;
    const clientChartPadding = 34;
    const clientChartInnerWidth = clientChartWidth - (clientChartPadding * 2);
    const clientChartInnerHeight = clientChartHeight - (clientChartPadding * 2);

    const years = [2024, 2025, 2026, 2027, 2028];
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    const LineChartCard = ({ title, subtitle, data, strokeClass, strokeColor, totalClass }: { title: string; subtitle: string; data: MonthlyClientData[]; strokeClass: string; strokeColor: string; totalClass: string }) => {
        const maxValue = Math.max(...data.map((d) => d.clients), 1);
        const points = data.map((row, index) => {
            const x = clientChartPadding + ((clientChartInnerWidth / Math.max(data.length - 1, 1)) * index);
            const y = clientChartPadding + (clientChartInnerHeight - ((row.clients / maxValue) * clientChartInnerHeight));

            return { ...row, x, y };
        });
        const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(' ');
        const total = data.reduce((sum, row) => sum + row.clients, 0);

        return (
            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-stone-900">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-semibold text-stone-900 dark:text-white">{title}</h3>
                        <p className="text-sm text-stone-500 dark:text-stone-400">{subtitle}</p>
                    </div>
                    <div className="rounded-lg bg-stone-50 px-3 py-2 text-right dark:bg-stone-950/50">
                        <p className="text-xs text-stone-500 dark:text-stone-400">Total</p>
                        <p className={`text-lg font-bold ${totalClass}`}>{total} client</p>
                    </div>
                </div>
                <div className="overflow-x-auto pb-2">
                    <svg viewBox={`0 0 ${clientChartWidth} ${clientChartHeight}`} className="h-64 min-w-[720px]">
                        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                            const y = clientChartPadding + (clientChartInnerHeight * tick);
                            const value = Math.round(maxValue * (1 - tick));

                            return (
                                <g key={tick}>
                                    <line x1={clientChartPadding} y1={y} x2={clientChartWidth - clientChartPadding} y2={y} className="stroke-stone-100 dark:stroke-stone-800" />
                                    <text x={8} y={y + 4} className="fill-stone-400 text-[10px]">{value}</text>
                                </g>
                            );
                        })}
                        <polyline points={polylinePoints} fill="none" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        {points.map((point) => (
                            <g key={point.month}>
                                <circle cx={point.x} cy={point.y} r="5" className={`fill-white ${strokeClass} dark:fill-stone-900`} strokeWidth="3">
                                    <title>{`${point.month}: ${point.clients} client`}</title>
                                </circle>
                                <text x={point.x} y={clientChartHeight - 10} textAnchor="middle" className="fill-stone-500 text-[10px] dark:fill-stone-400">{point.month}</text>
                                <text x={point.x} y={point.y - 10} textAnchor="middle" className="text-[10px] font-semibold" style={{ fill: strokeColor }}>{point.clients}</text>
                            </g>
                        ))}
                    </svg>
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-stone-800">
                    Laporan Keuangan
                </h2>
            }
        >
            <Head title="Laporan" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-6 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-4 shadow-sm dark:bg-stone-900">
                            <div>
                                <p className="text-sm font-semibold text-stone-900 dark:text-white">Grafik Client Tahunan</p>
                                <p className="text-xs text-stone-500 dark:text-stone-400">Pilih tahun untuk dua grafik client di bawah.</p>
                            </div>
                            <form method="get" className="flex items-center gap-2">
                                <input type="hidden" name="year" value={filters.year} />
                                <input type="hidden" name="month" value={filters.month} />
                                <select name="client_chart_year" defaultValue={filters.client_chart_year} className="w-28 rounded border border-stone-200 bg-white py-2 pl-3 pr-9 text-sm text-stone-800 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100">
                                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                                </select>
                                <button type="submit" className="rounded bg-stone-800 px-3 py-2 text-sm text-white hover:bg-stone-700 dark:bg-stone-700 dark:hover:bg-stone-600">
                                    Tampilkan
                                </button>
                            </form>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <LineChartCard
                                title="Grafik Client Baru per Bulan"
                                subtitle={`Berdasarkan tanggal input, tahun ${filters.client_chart_year}`}
                                data={monthlyClientData}
                                strokeClass="stroke-rose-500"
                                strokeColor="#f43f5e"
                                totalClass="text-rose-700 dark:text-rose-300"
                            />
                            <LineChartCard
                                title="Grafik Jumlah Client per Bulan"
                                subtitle={`Berdasarkan tanggal acara, tahun ${filters.client_chart_year}`}
                                data={monthlyEventClientData}
                                strokeClass="stroke-sky-500"
                                strokeColor="#0ea5e9"
                                totalClass="text-sky-700 dark:text-sky-300"
                            />
                        </div>
                    </div>

                    {/* Filter Month */}
                    <div className="mb-4 flex flex-wrap gap-2">
                        <form method="get" className="flex flex-wrap gap-2">
                            <input type="hidden" name="client_chart_year" value={filters.client_chart_year} />
                            <select name="year" defaultValue={filters.year} className="rounded border-stone-300 text-sm border-stone-200 bg-white text-stone-800">
                                {years.map((y) => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <select name="month" defaultValue={filters.month} className="rounded border-stone-300 text-sm border-stone-200 bg-white text-stone-800">
                                {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                            </select>
                            <button type="submit" className="rounded bg-rose-400 px-4 py-2 text-sm text-white hover:bg-rose-500">
                                Tampilkan
                            </button>
                        </form>
                    </div>

                    {/* Summary Cards */}
                    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                            <p className="text-xs text-stone-500">Pemasukan</p>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatRupiah(summary.earnings)}</p>
                        </div>
                        <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                            <p className="text-xs text-stone-500">Pengeluaran</p>
                            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatRupiah(summary.expenses)}</p>
                        </div>
                        <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                            <p className="text-xs text-stone-500">Profit</p>
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatRupiah(summary.profit)}</p>
                        </div>
                        <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                            <p className="text-xs text-stone-500">Pending</p>
                            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{formatRupiah(summary.pending)}</p>
                        </div>
                        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-stone-900">
                            <p className="text-xs text-stone-500">Client Baru</p>
                            <p className="text-2xl font-bold text-stone-900 dark:text-white">{summary.new_events}</p>
                        </div>
                        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-stone-900">
                            <p className="text-xs text-stone-500">Client Mendatang</p>
                            <p className="text-2xl font-bold text-stone-900 dark:text-white">{summary.upcoming_events}</p>
                        </div>
                    </div>

                    <div className="mb-6 rounded-lg bg-white p-6 shadow-sm dark:bg-stone-900">
                        <h3 className="mb-4 text-lg font-semibold text-stone-900 dark:text-white">📊 Grafik 12 Bulan Terakhir</h3>
                        <div className="flex items-end gap-2 overflow-x-auto pb-2">
                            {chartData.map((d, i) => {
                                const eHeight = (d.earnings / maxChart) * 200;
                                const xHeight = (d.expenses / maxChart) * 200;
                                return (
                                    <div key={i} className="flex flex-col items-center gap-1">
                                        <div className="flex items-end gap-1">
                                            <div style={{ height: Math.max(eHeight, 4) }} className="w-4 rounded bg-green-500" title={`Pemasukan: ${formatRupiah(d.earnings)}`} />
                                            <div style={{ height: Math.max(xHeight, 4) }} className="w-4 rounded bg-red-500" title={`Pengeluaran: ${formatRupiah(d.expenses)}`} />
                                        </div>
                                        <p className="text-xs text-stone-500 rotate-0 whitespace-nowrap">{d.month}</p>
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
                    <div className="mb-6 rounded-lg bg-white p-6 shadow-sm dark:bg-stone-900">
                        <h3 className="mb-4 text-lg font-semibold text-stone-900 dark:text-white">📅 Harian Bulan Ini</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-stone-100">
                                <thead>
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-stone-500">Tanggal</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-green-600 dark:text-green-400">Pemasukan</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-red-600 dark:text-red-400">Pengeluaran</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-blue-600 dark:text-blue-400">Profit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {daily.map((d) => (
                                        <tr key={d.date}>
                                            <td className="px-3 py-2 text-sm text-stone-900 dark:text-stone-100">{d.date}</td>
                                            <td className="px-3 py-2 text-right text-sm font-medium text-green-600 dark:text-green-400">{formatRupiah(d.earnings)}</td>
                                            <td className="px-3 py-2 text-right text-sm font-medium text-red-600 dark:text-red-400">{formatRupiah(d.expenses)}</td>
                                            <td className="px-3 py-2 text-right text-sm font-medium text-blue-600 dark:text-blue-400">{formatRupiah(d.earnings - d.expenses)}</td>
                                        </tr>
                                    ))}
                                    {daily.length === 0 && (
                                        <tr><td colSpan={4} className="px-3 py-4 text-center text-stone-500">Tidak ada transaksi bulan ini.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Payment List */}
                    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-stone-900">
                        <h3 className="mb-4 text-lg font-semibold text-stone-900 dark:text-white">📋 Semua Transaksi</h3>
                        <table className="min-w-full divide-y divide-stone-100">
                            <thead>
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-stone-500">Event</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-stone-500">Tanggal</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-stone-500">Jenis</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-stone-500">Jumlah</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-stone-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {payments.data.map((p) => (
                                    <tr key={p.id}>
                                        <td className="px-3 py-2 text-sm">
                                            {p.event ? (
                                                <Link href={route('events.show', p.event.uuid)} className="text-rose-400 hover:underline">
                                                    {p.event.name}
                                                    {p.event.deleted_at && <span className="ml-1 text-xs text-stone-400">(terhapus)</span>}
                                                </Link>
                                            ) : (
                                                <span className="text-stone-400">Client tidak ditemukan</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-stone-900 dark:text-stone-100">{p.payment_at || '-'}</td>
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
                                    <tr><td colSpan={5} className="px-3 py-4 text-center text-stone-500">Tidak ada transaksi.</td></tr>
                                )}
                            </tbody>
                        </table>
                        <div className="mt-4 flex justify-end gap-1">
                            {payments.links.map((link, i) => link.url ? (
                                <Link key={i} href={link.url} className={`rounded px-3 py-1 text-sm ${link.active ? 'bg-rose-400 text-white' : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                            ) : (
                                <span key={i} className="rounded px-3 py-1 text-sm bg-stone-100 text-stone-400 dark:bg-stone-900" dangerouslySetInnerHTML={{ __html: link.label }} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
