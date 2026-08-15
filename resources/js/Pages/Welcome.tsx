import ApplicationLogo from '@/Components/ApplicationLogo';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';

interface FeaturedItem {
    id: number;
    code: string;
    name: string;
    type_name: string | null;
    premium_level_name: string;
    image_url: string | null;
    rental_price: number;
    package_rental_price: number;
    stock_summary: string;
}

interface WelcomeProps extends PageProps {
    featuredItems: FeaturedItem[];
    whatsappNumber: string | null;
}

export default function Welcome({
    featuredItems = [],
    whatsappNumber,
}: WelcomeProps) {
    const heroImage = featuredItems.find((item) => item.image_url)?.image_url;
    const waMessage = encodeURIComponent(
        'Halo Shofi Wedding, saya ingin konsultasi untuk acara saya.'
    );
    const whatsappHref = whatsappNumber
        ? `https://wa.me/${whatsappNumber}?text=${waMessage}`
        : '#konsultasi';

    const services = [
        {
            title: 'Makeup Wedding',
            body: 'Look pengantin yang rapi, elegan, dan disesuaikan dengan karakter acara.',
            tone: 'bg-rose-50 text-rose-700 border-rose-100',
        },
        {
            title: 'Sewa Gaun',
            body: 'Pilihan gaun, kebaya, dan kebutuhan busana dengan stok ukuran yang terdata.',
            tone: 'bg-violet-50 text-violet-700 border-violet-100',
        },
        {
            title: 'Fitting & Konsultasi',
            body: 'Jadwal fitting dan konsultasi dibuat lebih terarah sebelum hari acara.',
            tone: 'bg-sky-50 text-sky-700 border-sky-100',
        },
    ];

    const steps = [
        'Konsultasi kebutuhan acara',
        'Pilih paket, gaun, dan jadwal fitting',
        'Booking tanggal dengan DP',
        'Final check menjelang hari acara',
    ];

    return (
        <>
            <Head title="Shofi Wedding" />

            <main className="min-h-screen bg-white text-stone-950">
                <section className="relative min-h-[92vh] overflow-hidden bg-stone-950 text-white">
                    {heroImage ? (
                        <img
                            src={heroImage}
                            alt="Katalog Shofi Wedding"
                            className="absolute inset-0 h-full w-full object-cover opacity-55"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-stone-100">
                            <ApplicationLogo
                                variant="vertical"
                                className="h-[70vh] w-auto max-w-[80vw] object-contain opacity-70"
                            />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/45" />

                    <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-10">
                        <header className="flex items-center justify-between gap-4">
                            <ApplicationLogo
                                variant="horizontal"
                                className="h-auto w-44 max-w-[52vw] object-contain brightness-0 invert"
                            />
                        </header>

                        <div className="flex flex-1 items-end pb-10 pt-24 sm:pb-16">
                            <div className="max-w-3xl">
                                <p className="text-sm font-semibold uppercase text-rose-100">
                                    Makeup, gaun, fitting, dan konsultasi wedding
                                </p>
                                <h1 className="mt-4 text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl">
                                    Shofi Wedding
                                </h1>
                                <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-100 sm:text-xl">
                                    Temani persiapan hari istimewa dengan layanan makeup,
                                    sewa gaun, dan jadwal fitting yang lebih tenang dan rapi.
                                </p>
                                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                    <a
                                        href={whatsappHref}
                                        target={whatsappNumber ? '_blank' : undefined}
                                        rel={whatsappNumber ? 'noreferrer' : undefined}
                                        className="inline-flex items-center justify-center rounded-lg bg-rose-500 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-rose-600"
                                    >
                                        Konsultasi via WhatsApp
                                    </a>
                                    <a
                                        href="#katalog"
                                        className="inline-flex items-center justify-center rounded-lg border border-white/45 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white hover:text-stone-950"
                                    >
                                        Lihat Katalog
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-white px-6 py-16 sm:px-8 lg:px-10">
                    <div className="mx-auto max-w-7xl">
                        <div className="max-w-2xl">
                            <p className="text-sm font-bold uppercase text-rose-500">
                                Layanan
                            </p>
                            <h2 className="mt-3 text-3xl font-bold text-stone-950 sm:text-4xl">
                                Semua kebutuhan utama pengantin dalam satu tempat.
                            </h2>
                        </div>
                        <div className="mt-8 grid gap-4 md:grid-cols-3">
                            {services.map((service) => (
                                <article
                                    key={service.title}
                                    className={`rounded-lg border p-6 ${service.tone}`}
                                >
                                    <h3 className="text-lg font-bold">{service.title}</h3>
                                    <p className="mt-3 leading-7 text-stone-600">
                                        {service.body}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="katalog" className="bg-stone-50 px-6 py-16 sm:px-8 lg:px-10">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div className="max-w-2xl">
                                <p className="text-sm font-bold uppercase text-violet-500">
                                    Katalog Pilihan
                                </p>
                                <h2 className="mt-3 text-3xl font-bold text-stone-950 sm:text-4xl">
                                    Gaun dan item yang siap disewakan.
                                </h2>
                            </div>
                            <a
                                href={whatsappHref}
                                target={whatsappNumber ? '_blank' : undefined}
                                rel={whatsappNumber ? 'noreferrer' : undefined}
                                className="inline-flex items-center justify-center rounded-lg bg-stone-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-stone-800"
                            >
                                Tanya Ketersediaan
                            </a>
                        </div>

                        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {featuredItems.length > 0 ? featuredItems.map((item) => (
                                <article key={item.id} className="overflow-hidden rounded-lg bg-white shadow-sm">
                                    {item.image_url ? (
                                        <img
                                            src={item.image_url}
                                            alt={item.name}
                                            className="h-64 w-full object-cover"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="flex h-64 items-center justify-center bg-stone-100 text-sm text-stone-400">
                                            Belum ada foto
                                        </div>
                                    )}
                                    <div className="p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-mono text-xs font-bold text-rose-500">
                                                    {item.code}
                                                </p>
                                                <h3 className="mt-1 text-lg font-bold text-stone-950">
                                                    {item.name}
                                                </h3>
                                            </div>
                                            <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                                                {item.premium_level_name}
                                            </span>
                                        </div>
                                        <p className="mt-3 text-sm text-stone-500">
                                            {item.type_name || 'Katalog'} · {item.stock_summary}
                                        </p>
                                        <p className="mt-4 text-base font-bold text-stone-950">
                                            {formatRupiah(item.rental_price)}
                                            <span className="text-sm font-semibold text-stone-400">
                                                {' '}sewa
                                            </span>
                                        </p>
                                    </div>
                                </article>
                            )) : (
                                <div className="rounded-lg bg-white p-8 text-center text-stone-500 sm:col-span-2 lg:col-span-3">
                                    Katalog pilihan belum tersedia.
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section id="konsultasi" className="bg-white px-6 py-16 sm:px-8 lg:px-10">
                    <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                        <div>
                            <p className="text-sm font-bold uppercase text-rose-500">
                                Cara Booking
                            </p>
                            <h2 className="mt-3 text-3xl font-bold text-stone-950 sm:text-4xl">
                                Mulai dari konsultasi kecil dulu.
                            </h2>
                            <p className="mt-4 leading-8 text-stone-600">
                                Ceritakan tanggal acara, kebutuhan makeup, konsep busana,
                                dan perkiraan lokasi. Tim akan bantu cek jadwal dan opsi yang tersedia.
                            </p>
                            <a
                                href={whatsappHref}
                                target={whatsappNumber ? '_blank' : undefined}
                                rel={whatsappNumber ? 'noreferrer' : undefined}
                                className="mt-7 inline-flex items-center justify-center rounded-lg bg-rose-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-rose-600"
                            >
                                Mulai Konsultasi
                            </a>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {steps.map((step, index) => (
                                <div key={step} className="rounded-lg border border-stone-100 bg-stone-50 p-5">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-950 text-sm font-bold text-white">
                                        {index + 1}
                                    </span>
                                    <p className="mt-4 font-bold text-stone-900">{step}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <footer className="border-t border-stone-100 bg-white px-6 py-8 sm:px-8 lg:px-10">
                    <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <ApplicationLogo
                            variant="horizontal"
                            className="h-auto w-44 object-contain"
                        />
                        <div className="flex gap-4 text-sm font-semibold text-stone-500">
                            <a href="#katalog" className="hover:text-rose-500">Katalog</a>
                            <a href={whatsappHref} className="hover:text-rose-500">WhatsApp</a>
                        </div>
                    </div>
                </footer>
            </main>
        </>
    );
}

function formatRupiah(value: number) {
    return 'Rp ' + Number(value || 0).toLocaleString('id-ID');
}
