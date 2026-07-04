import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

interface Event {
    id: number;
    uuid: string;
    name: string;
    date: string;
    time: string | null;
    location: string | null;
    total_amount: number;
    grand_total: number;
    is_fully_paid: boolean;
    order_type_name: string;
}

interface Schedule {
    id: number;
    type?: number | string;
    type_name: string;
    schedule_from: string;
    schedule_to: string | null;
    description: string | null;
    event: { id: number; uuid: string; name: string; date: string; time: string | null };
}

interface ClientList {
    id: number;
    uuid: string;
    name: string;
    date: string;
    total_amount: number;
    grand_total: number;
    is_fully_paid: boolean;
    order_type?: number | string;
    order_type_name?: string;
}

interface Stats {
    total_events: number;
    earnings: number;
    expenses: number;
    profit: number;
    overdue_unpaid_count: number;
    overdue_unpaid_total: number;
    this_year_earnings: number;
    this_year_total_events: number;
    this_month_earnings: number;
    this_month_total_events: number;
    last_year_summary: {
        earnings: number;
        clients: number;
    };
    this_month_summary: {
        earnings: number;
        clients: number;
        mua_clients: number;
        gown_clients: number;
    };
    this_year_client_summary: {
        total: number;
        mua_clients: number;
        gown_clients: number;
    };
}

interface AuthUser {
    id: number;
    role: number;
    is_admin: boolean;
}

interface PageProps {
    stats: Stats;
    todayFittingSchedules: Schedule[];
    nextFittingSchedules: Schedule[];
    nextClients: Event[];
    overdueUnpaidClients: (Event & { payments: { amount: string }[] })[];
    closingTodayList: ClientList[];
    closingYesterdayList: ClientList[];
    authUser: AuthUser;
}

export default function Dashboard({ stats, todayFittingSchedules, nextFittingSchedules, nextClients, overdueUnpaidClients, closingTodayList, closingYesterdayList, authUser }: PageProps) {
    const formatRupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
    const formatDate = (value: string | null) => value
        ? new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
        : '-';

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

    const getClientTypeName = (client: { order_type?: number | string; order_type_name?: string }) => {
        if (client.order_type_name === 'MUA' || client.order_type_name === 'Sewa Gaun') {
            return client.order_type_name;
        }

        return String(client.order_type) === '2' ? 'Sewa Gaun' : 'MUA';
    };

    const getClientTypeStyle = (client: { order_type?: number | string; order_type_name?: string }) => {
        const typeName = getClientTypeName(client);

        return typeName === 'MUA'
            ? { icon: '💄', className: 'bg-rose-50 text-rose-700 border border-rose-100' }
            : { icon: '👗', className: 'bg-violet-50 text-violet-700 border border-violet-100' };
    };

    const ClientRow = ({ client }: { client: ClientList }) => {
        const typeName = getClientTypeName(client);
        const typeStyle = getClientTypeStyle(client);

        return (
        <Link href={route('events.show', client.uuid)} className="flex items-center justify-between rounded-xl bg-white border border-stone-100 p-3 transition active:scale-[0.98] hover:bg-stone-50">
            <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-sm font-semibold text-stone-800">{client.name}</p>
                    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${typeStyle.className}`}>
                        {typeStyle.icon} {typeName}
                    </span>
                </div>
                <p className="text-xs text-stone-500">{client.date}</p>
            </div>
            <div className="text-right shrink-0">
                <p className="text-sm font-bold text-rose-500">{formatRupiah(client.grand_total ?? client.total_amount)}</p>
                <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${client.is_fully_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {client.is_fully_paid ? 'LUNAS' : 'BELUM'}
                </span>
            </div>
        </Link>
        );
    };

    const getScheduleTypeName = (schedule: Schedule) => {
        if (schedule.type_name === 'Fitting' || schedule.type_name === 'Konsultasi') {
            return schedule.type_name;
        }

        return String(schedule.type) === '1' ? 'Fitting' : 'Konsultasi';
    };

    const getScheduleStyle = (schedule: Schedule) => {
        const typeName = getScheduleTypeName(schedule);

        return typeName === 'Fitting'
            ? { icon: '👗', iconClass: 'bg-rose-100 text-rose-600', badgeClass: 'bg-rose-50 text-rose-700' }
            : { icon: '💬', iconClass: 'bg-sky-100 text-sky-600', badgeClass: 'bg-sky-50 text-sky-700' };
    };

    const ScheduleRow = ({ schedule }: { schedule: Schedule }) => {
        const typeName = getScheduleTypeName(schedule);
        const style = getScheduleStyle(schedule);

        return (
        <Link href={route('events.show', schedule.event.uuid)} className="flex items-center gap-3 rounded-xl bg-stone-50 p-3 transition active:scale-[0.98] hover:bg-stone-100">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${style.iconClass}`}>{style.icon}</span>
            <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-sm font-semibold text-stone-800">
                        {schedule.event.name} / {formatDate(schedule.event.date)}
                    </p>
                    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${style.badgeClass}`}>
                        {typeName}
                    </span>
                </div>
                <p className="text-xs text-stone-500">
                    {formatDate(schedule.schedule_from)} / {schedule.event.time || '-'}
                </p>
            </div>
        </Link>
        );
    };

    const NextClientRow = ({ client }: { client: Event }) => (
        <Link href={route('events.show', client.uuid)} className="flex items-center justify-between rounded-xl bg-stone-50 p-3 transition active:scale-[0.98] hover:bg-stone-100">
            <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-stone-800">{client.name}</p>
                <p className="text-xs text-stone-500">
                    {client.date} {client.time ? `· ${client.time}` : ''} · {client.location || 'Lokasi belum diisi'}
                </p>
            </div>
            <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${client.is_fully_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {client.is_fully_paid ? 'LUNAS' : 'BELUM'}
            </span>
        </Link>
    );

    const UnpaidClientRow = ({ client }: { client: Event & { payments: { amount: string }[] } }) => {
        const paid = client.payments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) ?? 0;
        const remaining = Math.max(0, (client.grand_total ?? client.total_amount) - paid);

        return (
            <Link href={route('events.show', client.uuid)} className="flex items-center justify-between rounded-xl bg-stone-50 p-3 transition active:scale-[0.98] hover:bg-stone-100">
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-stone-800">{client.name}</p>
                    <p className="text-xs text-stone-500">{client.date}</p>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-xs text-stone-500">Sisa</p>
                    <p className="text-sm font-bold text-amber-600">{formatRupiah(remaining)}</p>
                </div>
            </Link>
        );
    };

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
                        <Link href={route('events.create')} className="btn-primary text-sm py-2.5 px-4">+ Client</Link>
                    )}
                </div>

                {authUser.is_admin && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        <StatCard title="Omset Th. Ini" value={formatRupiah(stats.this_year_earnings)} color="border-l-4 border-rose-300" icon="💍" />
                        <div className="rounded-xl bg-white border border-stone-100 p-3 flex flex-col justify-center border-l-4 border-stone-300">
                            <p className="text-xs text-stone-500">Client Th. Ini</p>
                            <p className="text-lg font-bold text-stone-800">{stats.this_year_client_summary.total}</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                                <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">MUA {stats.this_year_client_summary.mua_clients}</span>
                                <span className="rounded bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">Gaun {stats.this_year_client_summary.gown_clients}</span>
                            </div>
                        </div>
                        <div className="rounded-xl bg-white border border-stone-100 p-3 flex flex-col justify-center border-l-4 border-emerald-300">
                            <p className="text-xs text-stone-500">Bln. Ini</p>
                            <p className="text-sm font-bold text-stone-800">{formatRupiah(stats.this_month_summary.earnings)}</p>
                            <p className="text-xs text-stone-500">{stats.this_month_summary.clients} client</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                                <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">MUA {stats.this_month_summary.mua_clients}</span>
                                <span className="rounded bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">Gaun {stats.this_month_summary.gown_clients}</span>
                            </div>
                        </div>
                        <StatCard title="Client Belum Lunas" value={formatRupiah(stats.overdue_unpaid_total)} sub={`${stats.overdue_unpaid_count} client`} color="border-l-4 border-red-300" icon="💸" />
                        <div className="rounded-xl bg-white border border-stone-100 p-3 flex flex-col justify-center border-l-4 border-amber-300">
                            <p className="text-xs text-stone-500">Th. Lalu</p>
                            <p className="text-sm font-bold text-stone-800">{formatRupiah(stats.last_year_summary.earnings)}</p>
                            <p className="text-xs text-stone-500">{stats.last_year_summary.clients} client</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <SectionCard title="Closing Hari Ini" icon="🎯" count={closingTodayList.length}>
                        {closingTodayList.length === 0 ? (
                            <p className="py-4 text-center text-sm text-stone-500">Tidak ada closing hari ini</p>
                        ) : closingTodayList.map((client) => <ClientRow key={client.id} client={client} />)}
                    </SectionCard>
                    <SectionCard title="Closing Kemarin" icon="📊" count={closingYesterdayList.length}>
                        {closingYesterdayList.length === 0 ? (
                            <p className="py-4 text-center text-sm text-stone-500">Tidak ada closing kemarin</p>
                        ) : closingYesterdayList.map((client) => <ClientRow key={client.id} client={client} />)}
                    </SectionCard>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <SectionCard title="Jadwal Hari Ini" icon="📅" count={todayFittingSchedules.length}>
                        {todayFittingSchedules.length === 0 ? (
                            <p className="py-4 text-center text-sm text-stone-500">Tidak ada jadwal hari ini</p>
                        ) : todayFittingSchedules.map((schedule) => <ScheduleRow key={schedule.id} schedule={schedule} />)}
                    </SectionCard>
                    <SectionCard title="Jadwal Selanjutnya" icon="🗓️" count={nextFittingSchedules.length}>
                        {nextFittingSchedules.length === 0 ? (
                            <p className="py-4 text-center text-sm text-stone-500">Tidak ada jadwal selanjutnya</p>
                        ) : nextFittingSchedules.map((schedule) => <ScheduleRow key={schedule.id} schedule={schedule} />)}
                    </SectionCard>
                </div>

                <SectionCard title="Jadwal Client Selanjutnya" icon="🔮" count={nextClients.length}>
                    {nextClients.length === 0 ? (
                        <p className="py-4 text-center text-sm text-stone-500">Belum ada client selanjutnya</p>
                    ) : nextClients.map((client) => <NextClientRow key={client.id} client={client} />)}
                </SectionCard>

                <SectionCard title="Client Belum Lunas" icon="⏳" count={stats.overdue_unpaid_count}>
                    <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
                        Total sisa: {formatRupiah(stats.overdue_unpaid_total)}
                    </div>
                    {overdueUnpaidClients.length === 0 ? (
                        <p className="py-4 text-center text-sm text-stone-500">Tidak ada client belum lunas.</p>
                    ) : overdueUnpaidClients.map((client) => <UnpaidClientRow key={client.id} client={client} />)}
                </SectionCard>
            </div>
        </AuthenticatedLayout>
    );
}
