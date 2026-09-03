import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatShortDate } from '@/utils/date';
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
    paid_status_name?: string | null;
    paid_status_tone?: string | null;
    order_type_name: string;
}

interface Schedule {
    id: number;
    type?: number | string;
    type_name: string;
    schedule_from: string;
    schedule_to: string | null;
    description: string | null;
    client_name: string;
    client_status_name: string;
    client_phone: string | null;
    event: { id: number; uuid: string; name: string; date: string; time: string | null } | null;
}

interface ClientList {
    id: number;
    uuid: string;
    name: string;
    date: string;
    total_amount: number;
    grand_total: number;
    is_fully_paid: boolean;
    paid_status_name?: string | null;
    paid_status_tone?: string | null;
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
    this_year_cash_in: number;
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
        completed_clients: number;
        mua_clients: number;
        gown_clients: number;
    };
    this_year_client_summary: {
        total: number;
        mua_clients: number;
        gown_clients: number;
    };
    remaining_this_year_client_summary: {
        total: number;
        mua_clients: number;
        gown_clients: number;
    };
    next_year_client_summary: {
        total: number;
        mua_clients: number;
        gown_clients: number;
    };
    future_paid_summary: {
        this_year_total: number;
        this_year_clients: number;
        all_total: number;
        all_clients: number;
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
    const formatDate = (value: string | null) => formatShortDate(value);
    const formatTime = (value: string | null) => {
        if (!value) return '-';

        if (value.includes('T') || value.endsWith('Z')) {
            const date = new Date(value);

            if (!Number.isNaN(date.getTime())) {
                return new Intl.DateTimeFormat('id-ID', {
                    timeZone: 'Asia/Jakarta',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                }).format(date).replace('.', ':');
            }
        }

        const [, timePart = ''] = value.replace('T', ' ').split(' ');
        const [hour, minute] = timePart.split(':');

        return hour && minute ? `${hour}:${minute}` : '-';
    };

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
    const paidStatusClass = (tone?: string | null) => {
        if (tone === 'pending_paid') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-200';
        if (tone === 'paid') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200';
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200';
    };
    const paidStatusLabel = (client: { is_fully_paid?: boolean | null; paid_status_name?: string | null }) => {
        if (client.paid_status_name) {
            return client.paid_status_name === 'BELUM LUNAS' ? 'BELUM' : client.paid_status_name;
        }

        return client.is_fully_paid ? 'LUNAS' : 'BELUM';
    };

    const ClientRow = ({ client }: { client: ClientList }) => {
        const typeName = getClientTypeName(client);
        const typeStyle = getClientTypeStyle(client);

        return (
        <Link href={route('events.show', client.uuid)} className="flex items-center justify-between rounded-xl bg-white border border-stone-100 p-3 transition active:scale-[0.98] hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:hover:bg-stone-800">
            <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-sm font-semibold text-stone-800 dark:text-stone-100">{client.name}</p>
                    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${typeStyle.className}`}>
                        {typeStyle.icon} {typeName}
                    </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">{formatDate(client.date)}</p>
            </div>
            <div className="text-right shrink-0">
                <p className="text-sm font-bold text-rose-500">{formatRupiah(client.grand_total ?? client.total_amount)}</p>
                <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${paidStatusClass(client.paid_status_tone)}`}>
                    {paidStatusLabel(client)}
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
        const isProspect = !schedule.event;

        const content = (
        <div className={`flex items-center gap-3 rounded-xl p-3 transition active:scale-[0.98] hover:bg-stone-100 dark:hover:bg-stone-800 ${isProspect ? 'border border-orange-200 bg-orange-50 dark:border-orange-900/60 dark:bg-orange-950/20' : 'bg-stone-50 dark:bg-stone-900'}`}>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${style.iconClass}`}>{style.icon}</span>
            <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                    <p className={`truncate text-sm font-semibold ${isProspect ? 'text-orange-800 dark:text-orange-200' : 'text-stone-800 dark:text-stone-100'}`}>
                        {schedule.client_name} / {schedule.event ? formatDate(schedule.event.date) : 'Calon client'}
                    </p>
                    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${style.badgeClass}`}>
                        {typeName}
                    </span>
                    {isProspect && (
                        <span className="shrink-0 rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-800 dark:bg-orange-900/50 dark:text-orange-200">
                            Calon Client
                        </span>
                    )}
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                    {formatDate(schedule.schedule_from)} / {formatTime(schedule.schedule_from)}
                </p>
            </div>
        </div>
        );

        return schedule.event
            ? <Link href={route('events.show', schedule.event.uuid)}>{content}</Link>
            : content;
    };

    const NextClientRow = ({ client }: { client: Event }) => (
        <Link href={route('events.show', client.uuid)} className="flex items-center justify-between rounded-xl bg-stone-50 p-3 transition active:scale-[0.98] hover:bg-stone-100 dark:bg-stone-900 dark:hover:bg-stone-800">
            <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-stone-800 dark:text-stone-100">{client.name}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                    {formatDate(client.date)} {client.time ? `· ${client.time}` : ''} · {client.location || 'Lokasi belum diisi'}
                </p>
            </div>
            <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${paidStatusClass(client.paid_status_tone)}`}>
                {paidStatusLabel(client)}
            </span>
        </Link>
    );

    const UnpaidClientRow = ({ client }: { client: Event & { payments: { amount: string }[] } }) => {
        const paid = client.payments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) ?? 0;
        const remaining = Math.max(0, (client.grand_total ?? client.total_amount) - paid);

        return (
            <Link href={route('events.show', client.uuid)} className="flex items-center justify-between rounded-xl bg-stone-50 p-3 transition active:scale-[0.98] hover:bg-stone-100 dark:bg-stone-900 dark:hover:bg-stone-800">
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-stone-800 dark:text-stone-100">{client.name}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">{formatDate(client.date)}</p>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-xs text-stone-500 dark:text-stone-400">Sisa</p>
                    <p className="text-sm font-bold text-amber-600">{formatRupiah(remaining)}</p>
                </div>
            </Link>
        );
    };

    const SectionCard = ({ title, icon, count, children }: { title: string; icon: string; count?: number; children: React.ReactNode }) => (
        <div className="rounded-xl bg-white border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-stone-800 dark:bg-stone-900 dark:shadow-none">
            <div className="flex items-center justify-between border-b border-stone-50 px-4 py-3 dark:border-stone-800">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">{icon} {title}</h2>
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
                        <p className="text-sm text-stone-500 dark:text-stone-400">Dashboard</p>
                    </div>
                    {authUser.is_admin && (
                        <Link href={route('events.create')} className="btn-primary text-sm py-2.5 px-4">+ Client</Link>
                    )}
                </div>

                {authUser.is_admin && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        <div className="rounded-xl bg-white border border-stone-100 p-3 flex flex-col justify-center border-l-4 border-amber-300 dark:border-stone-800 dark:bg-stone-900">
                            <p className="text-xs text-stone-500 dark:text-stone-400">Th. Lalu</p>
                            <p className="text-sm font-bold text-stone-800 dark:text-stone-100">{formatRupiah(stats.last_year_summary.earnings)}</p>
                            <p className="text-xs text-stone-500 dark:text-stone-400">{stats.last_year_summary.clients} client</p>
                        </div>
                        <div className="rounded-xl bg-white border border-stone-100 p-3 flex flex-col justify-center border-l-4 border-stone-300 dark:border-stone-800 dark:bg-stone-900">
                            <p className="text-xs text-stone-500 dark:text-stone-400">Client Th. Ini</p>
                            <p className="text-lg font-bold text-stone-800 dark:text-stone-100">{stats.this_year_client_summary.total}</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                                <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">MUA {stats.this_year_client_summary.mua_clients}</span>
                                <span className="rounded bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">Gaun {stats.this_year_client_summary.gown_clients}</span>
                            </div>
                        </div>
                        <div className="rounded-xl bg-white border border-stone-100 p-3 flex flex-col justify-center border-l-4 border-sky-300 dark:border-stone-800 dark:bg-stone-900">
                            <p className="text-xs text-stone-500 dark:text-stone-400">Sisa Client Th. Ini</p>
                            <p className="text-lg font-bold text-stone-800 dark:text-stone-100">{stats.remaining_this_year_client_summary.total}</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                                <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">MUA {stats.remaining_this_year_client_summary.mua_clients}</span>
                                <span className="rounded bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">Gaun {stats.remaining_this_year_client_summary.gown_clients}</span>
                            </div>
                        </div>
                        <div className="rounded-xl bg-white border border-stone-100 p-3 flex flex-col justify-center border-l-4 border-purple-300 dark:border-stone-800 dark:bg-stone-900">
                            <p className="text-xs text-stone-500 dark:text-stone-400">Client Tahun Depan</p>
                            <p className="text-lg font-bold text-stone-800 dark:text-stone-100">{stats.next_year_client_summary.total}</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                                <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">MUA {stats.next_year_client_summary.mua_clients}</span>
                                <span className="rounded bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">Gaun {stats.next_year_client_summary.gown_clients}</span>
                            </div>
                        </div>
                        <div className="rounded-xl bg-white border border-stone-100 p-3 flex flex-col justify-center border-l-4 border-emerald-300 dark:border-stone-800 dark:bg-stone-900">
                            <p className="text-xs text-stone-500 dark:text-stone-400">Client Bln. Ini</p>
                            <p className="text-sm font-bold text-stone-800 dark:text-stone-100">{formatRupiah(stats.this_month_summary.earnings)}</p>
                            <p className="text-xs text-stone-500 dark:text-stone-400">{stats.this_month_summary.completed_clients} / {stats.this_month_summary.clients} Client</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                                <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">MUA {stats.this_month_summary.mua_clients}</span>
                                <span className="rounded bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">Gaun {stats.this_month_summary.gown_clients}</span>
                            </div>
                        </div>
                        <div className="rounded-xl bg-white border border-stone-100 p-3 flex flex-col justify-center border-l-4 border-rose-300 dark:border-stone-800 dark:bg-stone-900">
                            <p className="text-xs text-stone-500 dark:text-stone-400">Omset Event Th. Ini</p>
                            <p className="text-sm font-bold text-stone-800 dark:text-stone-100">{formatRupiah(stats.this_year_earnings)}</p>
                            <div className="mt-2 border-t border-stone-100 pt-2 dark:border-stone-800">
                                <p className="text-xs text-stone-500 dark:text-stone-400">Kas Masuk Th. Ini</p>
                                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-300">{formatRupiah(stats.this_year_cash_in)}</p>
                            </div>
                        </div>
                        <div className="rounded-xl bg-white border border-stone-100 p-3 flex flex-col justify-center border-l-4 border-indigo-300 dark:border-stone-800 dark:bg-stone-900">
                            <p className="text-xs text-stone-500 dark:text-stone-400">Total Hutang</p>
                            <p className="text-sm font-bold text-stone-800 dark:text-stone-100">{formatRupiah(stats.future_paid_summary.this_year_total)}</p>
                            <p className="text-xs text-stone-500 dark:text-stone-400">{stats.future_paid_summary.this_year_clients} client tahun ini</p>
                            <div className="mt-2 border-t border-stone-100 pt-2 dark:border-stone-800">
                                <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">{formatRupiah(stats.future_paid_summary.all_total)}</p>
                                <p className="text-[10px] text-stone-500 dark:text-stone-400">{stats.future_paid_summary.all_clients} semua client</p>
                            </div>
                        </div>
                        <div className="rounded-xl bg-white border border-stone-100 p-3 flex flex-col justify-center border-l-4 border-red-300 dark:border-stone-800 dark:bg-stone-900">
                            <p className="text-xs text-stone-500 dark:text-stone-400">Client Belum Lunas</p>
                            <p className="text-sm font-bold text-stone-800 dark:text-stone-100">{formatRupiah(stats.overdue_unpaid_total)}</p>
                            <p className="text-xs text-stone-500 dark:text-stone-400">{stats.overdue_unpaid_count} client</p>
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
