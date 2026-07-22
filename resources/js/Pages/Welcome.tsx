import { PageProps } from '@/types';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth }: PageProps) {
    const isLoggedIn = Boolean(auth.user);

    return (
        <>
            <Head title="Shofi Wedding" />

            <main className="min-h-screen bg-rose-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
                <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6 sm:px-8 lg:px-10">
                    <header className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <ApplicationLogo
                                variant="mark"
                                className="h-11 w-11 object-contain"
                            />
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-500">
                                    Shofi Wedding
                                </p>
                                <h1 className="mt-1 text-xl font-bold text-stone-950 dark:text-stone-100">
                                    Client Management
                                </h1>
                            </div>
                        </div>

                        <Link
                            href={isLoggedIn ? route('dashboard') : route('login')}
                            className="inline-flex items-center justify-center rounded-lg bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 focus:ring-offset-rose-50 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-white dark:focus:ring-offset-stone-950"
                        >
                            {isLoggedIn ? 'Dashboard' : 'Login'}
                        </Link>
                    </header>

                    <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="max-w-2xl">
                            <ApplicationLogo
                                variant="horizontal"
                                className="mb-8 h-auto w-64 max-w-full object-contain sm:w-80"
                            />
                            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-rose-500">
                                Sistem internal
                            </p>
                            <h2 className="mt-5 text-4xl font-bold leading-tight text-stone-950 dark:text-stone-100 sm:text-5xl">
                                Kelola client, jadwal, katalog, dan pembayaran
                                dalam satu tempat.
                            </h2>
                            <p className="mt-5 max-w-xl text-base leading-8 text-stone-600 dark:text-stone-400">
                                Dashboard operasional untuk tim Shofi Wedding
                                agar data client, fitting, transaksi, dan
                                laporan tetap rapi setiap hari.
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <Link
                                    href={
                                        isLoggedIn
                                            ? route('dashboard')
                                            : route('login')
                                    }
                                    className="inline-flex items-center justify-center rounded-lg bg-rose-500 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 focus:ring-offset-rose-50 dark:focus:ring-offset-stone-950"
                                >
                                    {isLoggedIn
                                        ? 'Masuk ke Dashboard'
                                        : 'Login ke Aplikasi'}
                                </Link>
                            </div>
                        </div>

                        <div className="rounded-lg border border-rose-100 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:shadow-none">
                            <div className="space-y-4">
                                <div className="rounded-lg bg-rose-50 p-4">
                                    <p className="text-sm font-semibold text-rose-700">
                                        Client & Jadwal
                                    </p>
                                    <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                                        Pantau closing, fitting, konsultasi, dan
                                        acara yang akan datang.
                                    </p>
                                </div>
                                <div className="rounded-lg bg-sky-50 p-4">
                                    <p className="text-sm font-semibold text-sky-700">
                                        Pembayaran
                                    </p>
                                    <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                                        Cek DP, pelunasan, bukti transfer, dan
                                        status konfirmasi.
                                    </p>
                                </div>
                                <div className="rounded-lg bg-violet-50 p-4">
                                    <p className="text-sm font-semibold text-violet-700">
                                        Katalog
                                    </p>
                                    <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                                        Kelola item, stok ukuran, harga sewa,
                                        dan foto katalog.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}
