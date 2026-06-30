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
    unpaidEventsList: (Event & { bookings: { payments: { amount: string }[] }[] })[];
}

export default function Dashboard({ stats, todayEvents, todaySchedules, upcomingEvents, unpaidEventsList }: PageProps) {
    const formatRupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

    const StatCard = ({ title, value, color, icon }: { title: string; value: string; color: string; icon: string }) => (
        <div className={`stat-card flex items-center gap-3 ${color}`}>
            <span className="text-2xl">{icon}</span>
            <div className="min-w-0">
                <p className="text-xs text-stone-400">{title}</p>
                <p className="truncate text-lg font-bold text-stone-800">{value}</p>
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="space-y-5">
                {/* Welcome */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="page-title">Shofi Wedding</h1>
                        <p className="text-sm text-stone-400">Ringkasan hari ini</p>
                    </div>
                    <Link href={route('events.create')} className="btn-primary text-sm py-2.5 px-4">
                        + Booking
                    </Link>
                </div>

                {/* Stat Cards - Horizontal scroll on mobile */}
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory">
                    <div className="snap-start">
                        <StatCard title="Total Booking" value={String(stats.total_events)} color="border-l-4 border-rose-300" icon="💍" />
                    </div>
                    <div className="snap-start">
                        <StatCard title="Pemasukan" value={formatRupiah(stats.earnings)} color="border-l-4 border-emerald-300" icon="💰" />
                    </div>
                    <div className="snap-start">
                        <StatCard title="Pengeluaran" value={formatRupiah(stats.expenses)} color="border-l-4 border-red-300" icon="💸" />
                    </div>
                    <div className="snap-start">
                        <StatCard title="Profit" value={formatRupiah(stats.profit)} color="border-l-4 border-sky-300" icon="📈" />
                    </div>
                    <div className="snap-start">
                        <StatCard title="Belum Lunas" value={`${stats.unpaid_events}`} color="border-l-4 border-amber-300" icon="⏳" />
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {/* Event Hari Ini */}
                    <div className="card-elevated">
                        <div className="flex items-center justify-between border-b border-stone-50 px-4 py-3">
                            <h2 className="section-title">📅 Event Hari Ini</h2>
                            <span className="badge-pink">{todayEvents.length}</span>
                        </div>
                        <div className="p-3">
                            {todayEvents.length === 0 ? (
                                <p className="py-6 text-center text-sm text-stone-400">Tidak ada event hari ini</p>
                            ) : (
                                <div className="space-y-2">
                                    {todayEvents.map((e) => (
                                        <Link key={e.id} href={route('events.show', e.id)} className="flex items-center justify-between rounded-xl bg-stone-50 p-3 transition active:scale-[0.98] hover:bg-stone-100">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-stone-800">{e.name}</p>
                                                <p className="text-xs text-stone-400">{e.time || '--:--'} · {e.location || 'Lokasi belum diisi'}</p>
                                            </div>
                                            <span className={`badge ${e.is_fully_paid ? 'badge-green' : 'badge-yellow'}`}>
                                                {e.is_fully_paid ? 'LUNAS' : 'BELUM'}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Jadwal Hari Ini */}
                    <div className="card-elevated">
                        <div className="flex items-center justify-between border-b border-stone-50 px-4 py-3">
                            <h2 className="section-title">⏰ Jadwal Hari Ini</h2>
                            <span className="badge-pink">{todaySchedules.length}</span>
                        </div>
                        <div className="p-3">
                            {todaySchedules.length === 0 ? (
                                <p className="py-6 text-center text-sm text-stone-400">Tidak ada jadwal</p>
                            ) : (
                                <div className="space-y-2">
                                    {todaySchedules.map((s) => (
                                        <div key={s.id} className="flex items-center gap-3 rounded-xl bg-stone-50 p-3">
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-lg">👗</span>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-stone-800">{s.event.name}</p>
                                                <p className="text-xs text-stone-400">
                                                    {s.type_name} · {s.schedule_from ? new Date(s.schedule_from).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Event Mendatang */}
                <div className="card-elevated">
                    <div className="flex items-center justify-between border-b border-stone-50 px-4 py-3">
                        <h2 className="section-title">🔮 Event Mendatang</h2>
                        <span className="text-xs text-stone-400">7 hari ke depan</span>
                    </div>
                    <div className="p-3">
                        {upcomingEvents.length === 0 ? (
                            <p className="py-6 text-center text-sm text-stone-400">Tidak ada event mendatang</p>
                        ) : (
                            <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory">
                                {upcomingEvents.map((e) => (
                                    <Link key={e.id} href={route('events.show', e.id)} className="snap-start w-64 shrink-0 rounded-xl border border-stone-100 bg-stone-50 p-4 transition active:scale-95 hover:bg-stone-100">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold text-stone-800">{e.name}</p>
                                            <span className={`badge ${e.is_fully_paid ? 'badge-green' : 'badge-yellow'}`}>
                                                {e.is_fully_paid ? 'LUNAS' : 'BELUM'}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-stone-400">{e.date} · {e.order_type_name}</p>
                                        <p className="mt-2 text-sm font-bold text-rose-500">{formatRupiah(e.total_amount)}</p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Client Belum Lunas */}
                <div className="card-elevated">
                    <div className="flex items-center justify-between border-b border-stone-50 px-4 py-3">
                        <h2 className="section-title">⏳ Belum Lunas</h2>
                        <span className="text-xs text-stone-400">Total piutang: {formatRupiah(stats.total_unpaid_amount)}</span>
                    </div>
                    <div className="p-3">
                        {unpaidEventsList.length === 0 ? (
                            <p className="py-6 text-center text-sm text-stone-400">🎉 Semua client sudah lunas!</p>
                        ) : (
                            <div className="space-y-2">
                                {unpaidEventsList.map((e) => {
                                    const paid = e.bookings?.reduce((s, b) => s + b.payments.reduce((ps, p) => ps + parseFloat(p.amount), 0), 0) ?? 0;
                                    const remaining = e.total_amount - paid;
                                    return (
                                        <Link key={e.id} href={route('events.show', e.id)} className="flex items-center justify-between rounded-xl bg-stone-50 p-3 transition active:scale-[0.98] hover:bg-stone-100">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-stone-800">{e.name}</p>
                                                <p className="text-xs text-stone-400">{e.date}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-stone-400">Sisa</p>
                                                <p className="text-sm font-bold text-amber-600">{formatRupiah(remaining)}</p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
