import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState } from 'react';

const navItems = [
    { href: 'dashboard', label: 'Dashboard', icon: '📊', route: 'dashboard' },
    { href: 'events.index', label: 'Events', icon: '📅', route: 'events.*' },
    { href: 'items.index', label: 'Katalog', icon: '👗', route: 'items.*' },
    { href: 'schedules.index', label: 'Jadwal', icon: '⏰', route: 'schedules.*' },
    { href: 'payments.index', label: 'Bayar', icon: '💰', route: 'payments.*' },
];

const adminNavItems = [
    { href: 'reports.index', label: 'Laporan', icon: '📈', route: 'reports.*' },
];

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const user = usePage().props.auth.user;
    const isAdmin = user.role === 1 || user.role === 2; // Owner or Admin
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);

    const allNavItems = isAdmin ? [...navItems, ...adminNavItems] : navItems;

    return (
        <div className="min-h-screen bg-[#faf9f7] pb-20 sm:pb-0">
            {/* Top Bar - Mobile optimized */}
            <nav className="sticky top-0 z-40 border-b border-stone-100 bg-white/80 backdrop-blur-lg safe-top">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-14 items-center justify-between sm:h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <Link href="/" className="flex items-center gap-2">
                                <span className="text-2xl">💍</span>
                                <span className="hidden text-lg font-bold tracking-tight text-stone-800 sm:inline">
                                    Shofi Wedding
                                </span>
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
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>

                        {/* Desktop User Dropdown */}
                        <div className="hidden items-center gap-3 sm:flex">
                            <Link
                                href={route('telegram.settings')}
                                className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-50 hover:text-stone-600"
                                title="Telegram Settings"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            </Link>
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-200">
                                        <span className="h-6 w-6 rounded-full bg-rose-200 text-center text-xs leading-6 font-bold text-rose-700">
                                            {user.name.charAt(0).toUpperCase()}
                                        </span>
                                        <span className="hidden md:inline">{user.name}</span>
                                        <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content>
                                    <Dropdown.Link href={route('profile.edit')}>👤 Profile</Dropdown.Link>
                                    {isAdmin && (
                                        <>
                                            <Dropdown.Link href={route('staff.index')}>👥 Staff</Dropdown.Link>
                                            <Dropdown.Link href={route('clients.index')}>📝 Clients</Dropdown.Link>
                                            <Dropdown.Link href={route('telegram.settings')}>⚙️ Telegram</Dropdown.Link>
                                        </>
                                    )}
                                    <div className="border-t border-stone-100 my-1" />
                                    <Dropdown.Link href={route('logout')} method="post" as="button">🚪 Log Out</Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>

                        {/* Mobile Hamburger */}
                        <button
                            onClick={() => setShowingNavigationDropdown(!showingNavigationDropdown)}
                            className="rounded-lg p-2 text-stone-600 transition hover:bg-stone-100 sm:hidden"
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
                    <div className="border-t border-stone-100 bg-white sm:hidden">
                        <div className="space-y-1 p-4">
                            <ResponsiveNavLink href={route('dashboard')} active={route().current('dashboard')}>
                                📊 Dashboard
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('events.index')} active={route().current('events.*')}>
                                📅 Events
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('items.index')} active={route().current('items.*')}>
                                👗 Katalog
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('schedules.index')} active={route().current('schedules.*')}>
                                ⏰ Jadwal
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('payments.index')} active={route().current('payments.*')}>
                                💰 Bayar
                            </ResponsiveNavLink>
                            {isAdmin && (
                                <>
                                    <ResponsiveNavLink href={route('reports.index')} active={route().current('reports.*')}>
                                        📈 Laporan
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink href={route('staff.index')} active={route().current('staff.*')}>
                                        👥 Staff
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink href={route('clients.index')} active={route().current('clients.*')}>
                                        📝 Clients
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink href={route('telegram.settings')}>
                                        ⚙️ Telegram Settings
                                    </ResponsiveNavLink>
                                </>
                            )}
                            <div className="border-t border-stone-100 pt-2">
                                <ResponsiveNavLink href={route('profile.edit')}>
                                    👤 Profile
                                </ResponsiveNavLink>
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
                <header className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
                {children}
            </main>

            {/* Bottom Navigation - iPhone Style */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-100 bg-white/95 backdrop-blur-lg safe-bottom sm:hidden">
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
                                        : 'text-stone-400'
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
