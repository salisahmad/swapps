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

interface ClientList {
    id: number;
    name: string;
    date: string;
    total_amount: number;
    is_fully_paid: boolean;
}

interface Stats {
    total_events: number;
    earnings: number;
    expenses: number;
    profit: number;
    unpaid_events: number;
    total_unpaid_amount: number;
    this_year_earnings: number;
    this_year_total_events: number;
    this_month_earnings: number;
    this_month_total_events: number;
    next_year_total_events: number;
    hutang_amount: number;
    hutang_count: number;
    last_year_summary: {
        earnings: number;
        clients: number;
    };
}

interface AuthUser {
    id: number;
    role: number;
    is_admin: boolean;
}

interface PageProps {
    stats: Stats;
    todayEvents: Event[];
    todaySchedules: Schedule[];
    upcomingEvents: Event[];
    unpaidEventsList: (Event & { payments: { amount: string }[] })[];
    todayClients: ClientList[];
    nextYearClients: ClientList[];
    closingTodayList: ClientList[];
    closingYesterdayList: ClientList[];
    authUser: AuthUser;
}

export default function Dashboard({ stats, todayEvents, todaySchedules, upcomingEvents, unpaidEventsList, todayClients, nextYearClients, closingTodayList, closingYesterdayList, authUser }: PageProps) {
    const formatRupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

    const StatCard = ({ title, value, sub, color, icon }: { title: string; value: string; sub?: string; color: string; icon: string }) => (
        <div className={`rounded-xl bg-white border border-stone-100 p-3 flex items-center gap-3 ${color}`}>
            <span className="text-2xl">{icon}</span>
            <div className="min-w-0">
                <p className="text-xs text-stone-500 truncate">{title}</p>
                <p className="text-lg font-bold text-stone-800 truncate">{value}</p>
                {sub && <p className="text-xs text-stone-500">{sub}</p>}
            </div>
        </div>
    );

    const ClientRow = ({ client }: { client: ClientList }) => (
        <Link href={route('events.show', client.id)} className="flex items-center justify-between rounded-xl bg-white border border-stone-100 p-3 transition active:scale-[0.98] hover:bg-stone-50">
            <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-stone-800">{client.name}</p>
                <p className="text-xs text-stone-500">{client.date}</p>
            </div>
            <div className="text-right shrink-0">
                <p className="text-sm font-bold text-rose-500">{formatRupiah(client.total_amount)}</p>
                <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${client.is_fully_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {client.is_fully_paid ? 'LUNAS' : 'BELUM'}
                </span>
            </div>
        </Link>
    );

    const SectionCard = ({ title, icon, count, children }: { title: string; icon: string; count?: number; children: React.ReactNode }) => (
        <div className="rounded-xl bg-white border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between border-b border-stone-50 px-4 py-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">{icon} {title}</h2>
                {count !== undefined && <span className="rounded-md bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">{count}</span>}
            </div>
            <div className="p-3 space-y-2">{children}</div>
        </div>
    );

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="space-y-5">
                {/* Welcome + Quick Action */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="page-title">Shofi Wedding</h1>
                        <p className="text-sm text-stone-500">Dashboard</p>
                    </div>
                    {authUser.is_admin && (
                        <Link href={route('events.create')} className="btn-primary text-sm py-2.5 px-4">+ Booking</Link>
                    )}
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    <StatCard title="Omset Th. Ini" value={formatRupiah(stats.this_year_earnings)} color="border-l-4 border-rose-300" icon="💍" />
                    <StatCard title="Client Th. Ini" value={String(stats.this_year_total_events)} color="border-l-4 border-stone-300" icon="👥" />
                    <StatCard title="Omset Bln. Ini" value={formatRupiah(stats.this_month_earnings)} color="border-l-4 border-emerald-300" icon="💰" />
                    <StatCard title="Client Bln. Ini" value={String(stats.this_month_total_events)} color="border-l-4 border-stone-300" icon="👥" />
                    <StatCard title="Hutang" value={formatRupiah(stats.hutang_amount)} sub={`${stats.hutang_count} event`} color="border-l-4 border-red-300" icon="💸" />
                    <StatCard title="Client Th. Depan" value={String(stats.next_year_total_events)} color="border-l-4 border-violet-300" icon="🔮" />
                    {/* Combined Last Year - smaller */}
                    <div className="rounded-xl bg-white border border-stone-100 p-3 flex flex-col justify-center border-l-4 border-amber-300">
                        <p className="text-xs text-stone-500">Th. Lalu</p>
                        <p className="text-sm font-bold text-stone-800">{formatRupiah(stats.last_year_summary.earnings)}</p>
                        <p className="text-xs text-stone-500">{stats.last_year_summary.clients} client</p>
                    </div>
                </div>

                {/* Admin View: Full Dashboard */}
                {authUser.is_admin ? (
                    <>
                        {/* Two Column: Closing Today & Yesterday */}
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <SectionCard title="Closing Hari Ini" icon="🎯" count={closingTodayList.length}>
                                {closingTodayList.length === 0 ? (
                                    <p className="py-4 text-center text-sm text-stone-500">Tidak ada closing hari ini</p>
                                ) : closingTodayList.map((c) => <ClientRow key={c.id} client={c} />)}
                            </SectionCard>
                            <SectionCard title="Closing Kemarin" icon="📊" count={closingYesterdayList.length}>
                                {closingYesterdayList.length === 0 ? (
                                    <p className="py-4 text-center text-sm text-stone-500">Tidak ada closing kemarin</p>
                                ) : closingYesterdayList.map((c) => <ClientRow key={c.id} client={c} />)}
                            </SectionCard>
                        </div>

                        {/* Two Column: Client Hari Ini & Th. Depan */}
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <SectionCard title="Client Baru Hari Ini" icon="🎯" count={todayClients.length}>
                                {todayClients.length === 0 ? (
                                    <p className="py-4 text-center text-sm text-stone-500">Tidak ada client baru hari ini</p>
                                ) : todayClients.map((c) => <ClientRow key={c.id} client={c} />)}
                            </SectionCard>
                            <SectionCard title="Client Th. Depan" icon="🔮" count={nextYearClients.length}>
                                {nextYearClients.length === 0 ? (
                                    <p className="py-4 text-center text-sm text-stone-500">Belum ada booking tahun depan</p>
                                ) : nextYearClients.map((c) => <ClientRow key={c.id} client={c} />)}
                            </SectionCard>
                        </div>

                        {/* Two Column: Event Hari Ini & Jadwal */}
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <SectionCard title="Event Hari Ini" icon="📅" count={todayEvents.length}>
                                {todayEvents.length === 0 ? (
                                    <p className="py-4 text-center text-sm text-stone-500">Tidak ada event hari ini</p>
                                ) : todayEvents.map((e) => (
                                    <Link key={e.id} href={route('events.show', e.id)} className="flex items-center justify-between rounded-xl bg-stone-50 p-3 transition active:scale-[0.98] hover:bg-stone-100">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-stone-800">{e.name}</p>
                                            <p className="text-xs text-stone-500">{e.time || '--:--'} · {e.location || 'Lokasi belum diisi'}</p>
                                        </div>
                                        <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${e.is_fully_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {e.is_fully_paid ? 'LUNAS' : 'BELUM'}
                                        </span>
                                    </Link>
                                ))}
                            </SectionCard>
                            <SectionCard title="Jadwal Hari Ini" icon="⏰" count={todaySchedules.length}>
                                {todaySchedules.length === 0 ? (
                                    <p className="py-4 text-center text-sm text-stone-500">Tidak ada jadwal</p>
                                ) : todaySchedules.map((s) => (
                                    <div key={s.id} className="flex items-center gap-3 rounded-xl bg-stone-50 p-3">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-lg">👗</span>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-stone-800">{s.event.name}</p>
                                            <p className="text-xs text-stone-500">{s.type_name} · {s.schedule_from ? new Date(s.schedule_from).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                                        </div>
                                    </div>
                                ))}
                            </SectionCard>
                        </div>

                        {/* Event Mendatang */}
                        <SectionCard title="Event Mendatang" icon="🔮" count={upcomingEvents.length}>
                            {upcomingEvents.length === 0 ? (
                                <p className="py-4 text-center text-sm text-stone-500">Tidak ada event mendatang</p>
                            ) : (
                                <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory">
                                    {upcomingEvents.map((e) => (
                                        <Link key={e.id} href={route('events.show', e.id)} className="snap-start w-60 shrink-0 rounded-xl border border-stone-100 bg-stone-50 p-4 transition active:scale-95 hover:bg-stone-100">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold text-stone-800">{e.name}</p>
                                                <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${e.is_fully_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {e.is_fully_paid ? 'LUNAS' : 'BELUM'}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs text-stone-500">{e.date} · {e.order_type_name}</p>
                                            <p className="mt-2 text-sm font-bold text-rose-500">{formatRupiah(e.total_amount)}</p>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </SectionCard>

                        {/* Client Belum Lunas */}
                        <SectionCard title="Belum Lunas" icon="⏳" count={stats.unpaid_events}>
                            {unpaidEventsList.length === 0 ? (
                                <p className="py-4 text-center text-sm text-stone-500">🎉 Semua client sudah lunas!</p>
                            ) : unpaidEventsList.map((e) => {
                                const paid = e.payments?.reduce((s, p) => s + parseFloat(p.amount), 0) ?? 0;
                                const remaining = e.total_amount - paid;
                                return (
                                    <Link key={e.id} href={route('events.show', e.id)} className="flex items-center justify-between rounded-xl bg-stone-50 p-3 transition active:scale-[0.98] hover:bg-stone-100">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-stone-800">{e.name}</p>
                                            <p className="text-xs text-stone-500">{e.date}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xs text-stone-500">Sisa</p>
                                            <p className="text-sm font-bold text-amber-600">{formatRupiah(remaining)}</p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </SectionCard>
                    </>
                ) : (
                    /* Staff View: Limited Dashboard */
                    <>
                        <SectionCard title="Client Belum Lunas" icon="⏳" count={unpaidEventsList.length}>
                            {unpaidEventsList.length === 0 ? (
                                <p className="py-4 text-center text-sm text-stone-500">🎉 Semua client sudah lunas!</p>
                            ) : unpaidEventsList.slice(0, 5).map((e) => {
                                const paid = e.payments?.reduce((s, p) => s + parseFloat(p.amount), 0) ?? 0;
                                const remaining = e.total_amount - paid;
                                return (
                                    <Link key={e.id} href={route('events.show', e.id)} className="flex items-center justify-between rounded-xl bg-stone-50 p-3 transition active:scale-[0.98] hover:bg-stone-100">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-stone-800">{e.name}</p>
                                            <p className="text-xs text-stone-500">{e.date}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xs text-stone-500">Sisa</p>
                                            <p className="text-sm font-bold text-amber-600">{formatRupiah(remaining)}</p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </SectionCard>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <SectionCard title="Event Hari Ini" icon="📅" count={todayEvents.length}>
                                {todayEvents.length === 0 ? (
                                    <p className="py-4 text-center text-sm text-stone-500">Tidak ada event hari ini</p>
                                ) : todayEvents.map((e) => (
                                    <Link key={e.id} href={route('events.show', e.id)} className="flex items-center justify-between rounded-xl bg-stone-50 p-3 transition active:scale-[0.98] hover:bg-stone-100">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-stone-800">{e.name}</p>
                                            <p className="text-xs text-stone-500">{e.time || '--:--'} · {e.location || 'Lokasi belum diisi'}</p>
                                        </div>
                                        <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${e.is_fully_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {e.is_fully_paid ? 'LUNAS' : 'BELUM'}
                                        </span>
                                    </Link>
                                ))}
                            </SectionCard>
                            <SectionCard title="Event Besok" icon="📅" count={upcomingEvents.filter((e) => e.date === new Date().toISOString().split('T')[0]).length}>
                                {upcomingEvents.filter((e) => {
                                    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); return e.date === tomorrow.toISOString().split('T')[0];
                                }).length === 0 ? (
                                    <p className="py-4 text-center text-sm text-stone-500">Tidak ada event besok</p>
                                ) : upcomingEvents.filter((e) => {
                                    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); return e.date === tomorrow.toISOString().split('T')[0];
                                }).map((e) => (
                                    <Link key={e.id} href={route('events.show', e.id)} className="flex items-center justify-between rounded-xl bg-stone-50 p-3 transition active:scale-[0.98] hover:bg-stone-100">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-stone-800">{e.name}</p>
                                            <p className="text-xs text-stone-500">{e.time || '--:--'} · {e.location || 'Lokasi belum diisi'}</p>
                                        </div>
                                        <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${e.is_fully_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {e.is_fully_paid ? 'LUNAS' : 'BELUM'}
                                        </span>
                                    </Link>
                                ))}
                            </SectionCard>
                        </div>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <SectionCard title="Kunjungan Gallery Hari Ini" icon="👗" count={todaySchedules.filter((s) => s.type_name === 'Fitting').length}>
                                {todaySchedules.filter((s) => s.type_name === 'Fitting').length === 0 ? (
                                    <p className="py-4 text-center text-sm text-stone-500">Tidak ada kunjungan hari ini</p>
                                ) : todaySchedules.filter((s) => s.type_name === 'Fitting').map((s) => (
                                    <div key={s.id} className="flex items-center gap-3 rounded-xl bg-stone-50 p-3">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-lg">👗</span>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-stone-800">{s.event.name}</p>
                                            <p className="text-xs text-stone-500">{s.type_name} · {s.schedule_from ? new Date(s.schedule_from).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                                        </div>
                                    </div>
                                ))}
                            </SectionCard>
                            <SectionCard title="Kunjungan Gallery Besok" icon="👗" count={todaySchedules.filter((s) => s.type_name === 'Fitting').length}>
                                {todaySchedules.filter((s) => s.type_name === 'Fitting').length === 0 ? (
                                    <p className="py-4 text-center text-sm text-stone-500">Tidak ada kunjungan besok</p>
                                ) : todaySchedules.filter((s) => s.type_name === 'Fitting').map((s) => (
                                    <div key={s.id} className="flex items-center gap-3 rounded-xl bg-stone-50 p-3">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-lg">👗</span>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-stone-800">{s.event.name}</p>
                                            <p className="text-xs text-stone-500">{s.type_name} · {s.schedule_from ? new Date(s.schedule_from).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                                        </div>
                                    </div>
                                ))}
                            </SectionCard>
                        </div>

                        <SectionCard title="Closing Hari Ini" icon="🎯" count={closingTodayList.length}>
                            {closingTodayList.length === 0 ? (
                                <p className="py-4 text-center text-sm text-stone-500">Tidak ada closing hari ini</p>
                            ) : closingTodayList.map((c) => <ClientRow key={c.id} client={c} />)}
                        </SectionCard>
                    </>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
