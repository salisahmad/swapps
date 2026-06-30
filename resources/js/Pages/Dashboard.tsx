import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

interface Event {
    id: number;
    name: string;
    date: string;
    time: string | null;
    location: string | null;
    total_amount: number;
    is_fully_paid: boolean;
    order_type_name: string;
    payments?: { amount: string }[];
}

interface Schedule {
    id: number;
    type_name: string;
    schedule_from: string;
    schedule_to: string | null;
    description: string | null;
    event: { name: string };
}

interface Stats {
    total_events: number;
    new_events_this_month: number;
    earnings: number;
    expenses: number;
    profit: number;
    unpaid_events: number;
    total_unpaid_amount: number;
}

interface PageProps {
    stats: Stats;
    todayEvents: Event[];
    todaySchedules: Schedule[];
    upcomingEvents: Event[];
    unpaidEventsList: Event[];
}

export default function Dashboard({ stats, todayEvents, todaySchedules, upcomingEvents, unpaidEventsList }: PageProps) {
    const formatRupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

    const Card = ({ title, value, color }: { title: string; value: string | number; color: string }) => (
        <div className={`rounded-lg p-4 ${color}`}>
            <p className="text-sm opacity-80">{title}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
    );

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Dashboard Shofi Wedding
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Statistik Utama */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card title="Total Booking" value={stats.total_events} color="bg-white shadow dark:bg-gray-800" />
                        <Card title="Pemasukan Bulan Ini" value={formatRupiah(stats.earnings)} color="bg-green-100 dark:bg-green-900/30" />
                        <Card title="Pengeluaran Bulan Ini" value={formatRupiah(stats.expenses)} color="bg-red-100 dark:bg-red-900/30" />
                        <Card title="Profit Bulan Ini" value={formatRupiah(stats.profit)} color="bg-blue-100 dark:bg-blue-900/30" />
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Card title="Booking Baru (Bulan Ini)" value={stats.new_events_this_month} color="bg-white shadow dark:bg-gray-800" />
                        <Card title="Belum Lunas" value={`${stats.unpaid_events} client`} color="bg-yellow-100 dark:bg-yellow-900/30" />
                        <Card title="Total Piutang" value={formatRupiah(stats.total_unpaid_amount)} color="bg-orange-100 dark:bg-orange-900/30" />
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Event Hari Ini */}
                        <div className="bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                            <div className="border-b border-gray-200 p-4 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Event Hari Ini ({todayEvents.length})
                                </h3>
                            </div>
                            <div className="p-4">
                                {todayEvents.length === 0 ? (
                                    <p className="text-gray-500 dark:text-gray-400">Tidak ada event hari ini.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {todayEvents.map((e) => (
                                            <div key={e.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{e.name}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {e.time} — {e.location ?? 'Lokasi belum diisi'}
                                                    </p>
                                                </div>
                                                <span className={`rounded px-2 py-1 text-xs font-semibold ${e.is_fully_paid ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}>
                                                    {e.is_fully_paid ? 'LUNAS' : 'BELUM LUNAS'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Jadwal Fitting/Konsultasi Hari Ini */}
                        <div className="bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                            <div className="border-b border-gray-200 p-4 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Jadwal Hari Ini ({todaySchedules.length})
                                </h3>
                            </div>
                            <div className="p-4">
                                {todaySchedules.length === 0 ? (
                                    <p className="text-gray-500 dark:text-gray-400">Tidak ada jadwal hari ini.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {todaySchedules.map((s) => (
                                            <div key={s.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-medium text-gray-900 dark:text-white">{s.event.name}</p>
                                                    <span className="rounded bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                                                        {s.type_name}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {s.schedule_from ? new Date(s.schedule_from).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    {s.schedule_to ? ` - ${new Date(s.schedule_to).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : ''}
                                                </p>
                                                {s.description && <p className="text-sm text-gray-500 dark:text-gray-400">{s.description}</p>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Event Mendatang */}
                    <div className="mt-6 bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Event Mendatang (7 Hari)</h3>
                        </div>
                        <div className="p-4">
                            {upcomingEvents.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400">Tidak ada event mendatang.</p>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {upcomingEvents.map((e) => (
                                        <div key={e.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                            <p className="font-medium text-gray-900 dark:text-white">{e.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{e.date} {e.time ? `• ${e.time}` : ''}</p>
                                            <p className="mt-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                                {formatRupiah(e.total_amount)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Client Belum Lunas */}
                    <div className="mt-6 bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Client Belum Lunas</h3>
                        </div>
                        <div className="p-4">
                            {unpaidEventsList.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400">Semua client sudah lunas! 🎉</p>
                            ) : (
                                <div className="space-y-3">
                                    {unpaidEventsList.map((e) => {
                                        const paid = e.payments?.reduce((s, p) => s + parseFloat(p.amount), 0) ?? 0;
                                        const remaining = e.total_amount - paid;
                                        return (
                                            <div key={e.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{e.name}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{e.date}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        Dibayar: {formatRupiah(paid)}
                                                    </p>
                                                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                                                        Sisa: {formatRupiah(remaining)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
