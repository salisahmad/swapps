import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { formatShortDateTime } from '@/utils/date';
import { Link, router, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useEffect, useState } from 'react';

interface AuthenticatedPageProps {
    [key: string]: unknown;
    auth: {
        user: {
            name: string;
            role: number;
            role_detail?: string;
        };
    };
    notifications: {
        count: number;
        items: {
            id: number | string;
            key: string;
            type: string;
            label: string;
            message: string;
            created_at: string | null;
            read: boolean;
            event: {
                id: number;
                uuid: string;
                name: string;
                date: string | null;
            };
            user: { id: number; name: string } | null;
        }[];
    };
    paymentBadges: {
        pending: number;
    };
}

const navItems = [
    { href: 'dashboard', label: 'Dashboard', icon: '📊', route: 'dashboard' },
    { href: 'events.index', label: 'Clients', icon: '👥', route: 'events.*' },
    { href: 'schedules.index', label: 'Jadwal', icon: '⏰', route: 'schedules.*' },
    { href: 'payments.index', label: 'Bayar', icon: '💰', route: 'payments.*' },
    { href: 'staff.index', label: 'Pegawai', icon: '🧑‍💼', route: 'staff.*' },
    { href: 'calendar.index', label: 'Kalender', icon: '📅', route: 'calendar.*' },
    { href: 'items.index', label: 'Katalog', icon: '👗', route: 'items.*' },
];

const adminNavItems = [
    { href: 'reports.index', label: 'Laporan', icon: '📈', route: 'reports.*' },
];

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const user = usePage<AuthenticatedPageProps>().props.auth.user;
    const notifications = usePage<AuthenticatedPageProps>().props.notifications;
    const paymentBadges = usePage<AuthenticatedPageProps>().props.paymentBadges;
    const isOwner = user.role === 1;
    const canManageEmployees = user.role === 1 || user.role === 2;
    const isLimitedStaff = user.role === 3 || user.role === 4;
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const pendingPaymentCount = paymentBadges?.pending ?? 0;
    const formatBadgeCount = (count: number) => count > 99 ? '99+' : String(count);
    const navBadgeCount = (href: string) => href === 'payments.index' ? pendingPaymentCount : 0;

    useEffect(() => {
        setIsDarkMode(document.documentElement.classList.contains('dark'));
    }, []);

    const allNavItems = isLimitedStaff
        ? [
            { href: 'dashboard', label: 'Dashboard', icon: '📊', route: 'dashboard' },
            { href: 'events.index', label: 'Clients', icon: '👥', route: 'events.*' },
            { href: 'schedules.index', label: 'Jadwal', icon: '⏰', route: 'schedules.*' },
            { href: 'staff.index', label: 'Profil', icon: '🧑‍💼', route: 'staff.*' },
            { href: 'calendar.index', label: 'Kalender', icon: '📅', route: 'calendar.*' },
        ]
        : (isOwner ? [...navItems, ...adminNavItems] : navItems);
    const notificationBadgeClass = (type: string) => {
        if (type === 'delete_requested') return 'bg-red-50 text-red-600';
        if (type === 'total_changed') return 'bg-amber-50 text-amber-700';
        if (type === 'payment_rejected') return 'bg-red-50 text-red-600';
        return 'bg-stone-100 text-stone-600';
    };
    const markNotificationRead = (key: string, href: string) => {
        router.post(route('notifications.read'), { key }, {
            preserveScroll: true,
            onFinish: () => router.visit(href),
        });
    };
    const markAllNotificationsRead = () => {
        router.post(route('notifications.read-all'), {
            keys: notifications.items.map((item) => item.key),
        }, {
            preserveScroll: true,
            preserveState: true,
            only: ['notifications'],
        });
    };
    const toggleTheme = () => {
        const nextIsDark = !isDarkMode;
        document.documentElement.classList.toggle('dark', nextIsDark);
        localStorage.setItem('theme', nextIsDark ? 'dark' : 'light');
        setIsDarkMode(nextIsDark);
    };

    return (
        <div className="min-h-screen bg-[#faf9f7] pb-20 text-stone-800 transition-colors dark:bg-stone-950 dark:text-stone-100 sm:pb-0">
            {/* Top Bar - Mobile optimized */}
            <nav className="sticky top-0 z-40 border-b border-stone-100 bg-white/80 backdrop-blur-lg safe-top transition-colors dark:border-stone-800 dark:bg-stone-950/85">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-14 items-center justify-between sm:h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <Link href="/" className="flex items-center">
                                <ApplicationLogo
                                    variant="horizontal"
                                    className="h-8 w-auto max-w-[150px] object-contain sm:h-9 sm:max-w-[190px]"
                                />
                            </Link>
                        </div>

                        {/* Desktop Nav */}
                        <div className="hidden items-center space-x-1 sm:flex">
                            {allNavItems.map((item) => (
                                <NavLink
                                    key={item.href}
                                    href={route(item.href)}
                                    active={route().current(item.route)}
                                    className="rounded-lg px-3 py-2 text-sm font-medium transition"
                                >
                                    <span className="inline-flex items-center gap-1.5">
                                        <span>{item.label}</span>
                                        {navBadgeCount(item.href) > 0 && (
                                            <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm shadow-rose-500/20">
                                                {formatBadgeCount(navBadgeCount(item.href))}
                                            </span>
                                        )}
                                    </span>
                                </NavLink>
                            ))}
                        </div>

                        {/* Desktop User Dropdown */}
                        <div className="hidden items-center gap-3 sm:flex">
                            <button
                                type="button"
                                onClick={toggleTheme}
                                className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-600 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                                title={isDarkMode ? 'Pakai mode terang' : 'Pakai mode gelap'}
                            >
                                {isDarkMode ? 'Light' : 'Dark'}
                            </button>
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button
                                        className="relative rounded-lg p-2 text-stone-400 transition hover:bg-stone-50 hover:text-stone-600 dark:text-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                                        title="Notifikasi"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/></svg>
                                        {notifications.count > 0 && (
                                            <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                                                {notifications.count}
                                            </span>
                                        )}
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content width="80" contentClasses="bg-white py-2 dark:bg-stone-900">
                                    <div className="border-b border-stone-100 px-4 pb-2 dark:border-stone-800">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">Notifikasi</p>
                                                <p className="text-xs text-stone-500 dark:text-stone-400">{notifications.count} belum dibaca</p>
                                            </div>
                                            {notifications.count > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={markAllNotificationsRead}
                                                    className="rounded px-2 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                                >
                                                    Tandai dibaca
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {notifications.items.length === 0 ? (
                                        <div className="px-4 py-5 text-center text-sm text-stone-500 dark:text-stone-400">
                                            Belum ada notifikasi.
                                        </div>
                                    ) : (
                                        <div className="max-h-96 overflow-y-auto py-1">
                                            {notifications.items.map((item) => (
                                                <Link
                                                    key={item.id}
                                                    href={route('events.show', item.event.uuid)}
                                                    onClick={(e) => {
                                                        if (!item.read) {
                                                            e.preventDefault();
                                                            markNotificationRead(item.key, route('events.show', item.event.uuid));
                                                        }
                                                    }}
                                                    className={`block border-b border-stone-50 px-4 py-3 transition hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-800 ${item.read ? 'bg-white dark:bg-stone-900' : 'bg-rose-50/60 dark:bg-rose-950/20'}`}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex min-w-0 gap-2">
                                                            {!item.read && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500" />}
                                                            <div className="min-w-0">
                                                            <p className={`truncate text-sm font-semibold ${item.read ? 'text-stone-700 dark:text-stone-200' : 'text-stone-900 dark:text-white'}`}>{item.event.name}</p>
                                                            <p className="text-xs text-stone-500 dark:text-stone-400">{item.message}</p>
                                                            <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
                                                                {item.user ? `Oleh: ${item.user.name} · ` : ''}{formatShortDateTime(item.created_at)}
                                                            </p>
                                                            </div>
                                                        </div>
                                                        <span className={`shrink-0 rounded px-2 py-1 text-[10px] font-semibold ${notificationBadgeClass(item.type)}`}>
                                                            {item.label}
                                                        </span>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </Dropdown.Content>
                            </Dropdown>
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700">
                                        <span className="h-6 w-6 rounded-full bg-rose-200 text-center text-xs leading-6 font-bold text-rose-700">
                                            {user.name.charAt(0).toUpperCase()}
                                        </span>
                                        <span className="hidden md:inline">{user.name}</span>
                                        <svg className="h-4 w-4 text-stone-400 dark:text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content>
                                    <Dropdown.Link href={route('profile.edit')}>👤 Profile</Dropdown.Link>
                                    {!isLimitedStaff && (
                                        <Dropdown.Link href={route('dynamic-form-templates.edit')}>📋 Setup Berita Acara</Dropdown.Link>
                                    )}
                                    {canManageEmployees && (
                                        <>
                                            <Dropdown.Link href={route('staff.index')}>👥 Pegawai</Dropdown.Link>
                                        </>
                                    )}
                                    {isOwner && (
                                        <>
                                            <Dropdown.Link href={route('events.index')}>📝 Clients</Dropdown.Link>
                                            <Dropdown.Link href={route('telegram.settings')}>⚙️ Telegram</Dropdown.Link>
                                            <Dropdown.Link href={route('whatsapp.settings')}>📱 WhatsApp</Dropdown.Link>
                                            <Dropdown.Link href={route('google-calendar.settings')}>📅 Google Calendar</Dropdown.Link>
                                            <Dropdown.Link href={route('google-calendar.sync.index')}>🔁 Google Sync</Dropdown.Link>
                                        </>
                                    )}
                                    <div className="border-t border-stone-100 my-1 dark:border-stone-700" />
                                    <Dropdown.Link href={route('logout')} method="post" as="button">🚪 Log Out</Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>

                        {/* Mobile Hamburger */}
                        <button
                            onClick={() => setShowingNavigationDropdown(!showingNavigationDropdown)}
                            className="rounded-lg p-2 text-stone-600 transition hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800 sm:hidden"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {showingNavigationDropdown ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Drawer */}
                {showingNavigationDropdown && (
                    <div className="border-t border-stone-100 bg-white dark:border-stone-800 dark:bg-stone-950 sm:hidden">
                        <div className="space-y-1 p-4">
                            <button
                                type="button"
                                onClick={toggleTheme}
                                className="mb-2 flex w-full items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 dark:border-stone-700 dark:text-stone-200"
                            >
                                <span>Mode tampilan</span>
                                <span>{isDarkMode ? 'Dark' : 'Light'}</span>
                            </button>
                            <ResponsiveNavLink href={route('dashboard')} active={route().current('dashboard')}>
                                📊 Dashboard
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('events.index')} active={route().current('events.*')}>
                                👥 Clients
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('schedules.index')} active={route().current('schedules.*')}>
                                ⏰ Jadwal
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('payments.index')} active={route().current('payments.*')}>
                                <span className="inline-flex items-center gap-2">
                                    <span>💰 Bayar</span>
                                    {pendingPaymentCount > 0 && (
                                        <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm shadow-rose-500/20">
                                            {formatBadgeCount(pendingPaymentCount)}
                                        </span>
                                    )}
                                </span>
                            </ResponsiveNavLink>
                            {canManageEmployees && (
                                <ResponsiveNavLink href={route('staff.index')} active={route().current('staff.*')}>
                                    👥 Pegawai
                                </ResponsiveNavLink>
                            )}
                            <ResponsiveNavLink href={route('calendar.index')} active={route().current('calendar.*')}>
                                📅 Kalender
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('items.index')} active={route().current('items.*')}>
                                👗 Katalog
                            </ResponsiveNavLink>
                            {isOwner && (
                                <>
                                    <ResponsiveNavLink href={route('reports.index')} active={route().current('reports.*')}>
                                        📈 Laporan
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink href={
                                        notifications.items[0]
                                            ? route('events.show', notifications.items[0].event.uuid)
                                            : route('events.index')
                                    }>
                                        🔔 Notifikasi
                                        {notifications.count > 0 && ` (${notifications.count})`}
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink href={route('telegram.settings')}>
                                        ⚙️ Telegram Settings
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink href={route('whatsapp.settings')}>
                                        📱 WhatsApp Tester
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink href={route('google-calendar.settings')}>
                                        📅 Google Calendar
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink href={route('google-calendar.sync.index')}>
                                        🔁 Google Sync
                                    </ResponsiveNavLink>
                                </>
                            )}
                            <div className="border-t border-stone-100 pt-2 dark:border-stone-800">
                                <ResponsiveNavLink href={route('profile.edit')}>
                                    👤 Profile
                                </ResponsiveNavLink>
                                {!isLimitedStaff && (
                                    <ResponsiveNavLink href={route('dynamic-form-templates.edit')} active={route().current('dynamic-form-templates.*')}>
                                        📋 Setup Berita Acara
                                    </ResponsiveNavLink>
                                )}
                                <ResponsiveNavLink href={route('logout')} method="post" as="button">
                                    🚪 Log Out
                                </ResponsiveNavLink>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Header */}
            {header && (
                <header className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:bg-stone-900 dark:shadow-none">
                    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-4 pb-24 pt-4 sm:px-6 sm:pb-4 lg:px-8 lg:py-6">
                {children}
            </main>

            {/* Bottom Navigation - iPhone Style */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-100 bg-white/95 backdrop-blur-lg safe-bottom dark:border-stone-800 dark:bg-stone-950/95 sm:hidden">
                <div className="flex items-center justify-around px-2 pb-2 pt-1">
                    {allNavItems.slice(0, 5).map((item) => {
                        const isActive = route().current(item.route);
                        return (
                            <Link
                                key={item.href}
                                href={route(item.href)}
                                className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition active:scale-95 ${
                                    isActive
                                        ? 'text-rose-500'
                                        : 'text-stone-400 dark:text-stone-500'
                                }`}
                            >
                                <span className="text-xl">{item.icon}</span>
                                <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                                {isActive && (
                                    <span className="absolute bottom-1 h-1 w-1 rounded-full bg-rose-400" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
