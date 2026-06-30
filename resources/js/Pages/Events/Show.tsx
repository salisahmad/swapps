import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

interface ItemType {
    name: string;
}

interface Item {
    id: number;
    name: string;
    code: string;
    type?: ItemType;
}

interface Schedule {
    id: number;
    type_name: string;
    schedule_from: string;
    schedule_to: string | null;
    description: string | null;
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
}

interface Event {
    id: number;
    name: string;
    mobile_phone: string;
    date: string;
    time: string | null;
    address: string | null;
    location: string | null;
    package_description: string | null;
    total_amount: number;
    is_fully_paid: boolean;
    order_type_name: string;
    items: Item[];
    schedules: Schedule[];
    payments: PaymentItem[];
}

interface PageProps {
    event: Event;
}

export default function Show({ event }: PageProps) {
    const [activeTab, setActiveTab] = useState<'info' | 'payment' | 'schedule'>('info');
    const formatRupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

    const totalPaid = event.payments
        .filter((p) => p.is_expense === 0 && p.status === 1)
        .reduce((sum, p) => sum + p.amount, 0);
    const totalExpense = event.payments
        .filter((p) => p.is_expense === 1 && p.status === 1)
        .reduce((sum, p) => sum + p.amount, 0);
    const remaining = event.total_amount - totalPaid;

    const { delete: destroy, processing: deleteProcessing } = useForm();

    const handleDelete = () => {
        if (confirm('Yakin hapus event ini?')) {
            destroy(route('events.destroy', event.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Detail Event: {event.name}
                    </h2>
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('dynamic-forms.edit', event.id)}
                            className="rounded bg-pink-600 px-3 py-1.5 text-sm text-white hover:bg-pink-700"
                        >
                            Berita Acara
                        </Link>
                        <Link
                            href={route('events.edit', event.id)}
                            className="rounded bg-gray-600 px-3 py-1.5 text-sm text-white hover:bg-gray-700"
                        >
                            Edit
                        </Link>
                        <button
                            onClick={handleDelete}
                            disabled={deleteProcessing}
                            className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                        >
                            Hapus
                        </button>
                        <Link
                            href={route('events.index')}
                            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400"
                        >
                            Kembali
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Event - ${event.name}`} />

            <div className="py-6">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
                    {/* Summary Cards */}
                    <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
                        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Harga</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{formatRupiah(event.total_amount)}</p>
                        </div>
                        <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Dibayar</p>
                            <p className="text-xl font-bold text-green-700 dark:text-green-300">{formatRupiah(totalPaid)}</p>
                        </div>
                        <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Sisa</p>
                            <p className="text-xl font-bold text-yellow-700 dark:text-yellow-300">{formatRupiah(remaining)}</p>
                        </div>
                        <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Pengeluaran</p>
                            <p className="text-xl font-bold text-red-700 dark:text-red-300">{formatRupiah(totalExpense)}</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="mb-4 flex gap-1 rounded-lg bg-white p-1 shadow-sm dark:bg-gray-800">
                        {(['info', 'payment', 'schedule'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium ${
                                    activeTab === tab
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                                }`}
                            >
                                {tab === 'info' && 'Info Event'}
                                {tab === 'payment' && `Pembayaran (${event.payments.length})`}
                                {tab === 'schedule' && `Jadwal (${event.schedules.length})`}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                        {activeTab === 'info' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Nama Client</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{event.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Telepon</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{event.mobile_phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal & Waktu</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{event.date} {event.time ? `• ${event.time}` : ''}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Jenis Order</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{event.order_type_name}</p>
                                    </div>
                                </div>
                                {event.address && (
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Alamat</p>
                                        <p className="text-sm text-gray-900 dark:text-white">{event.address}</p>
                                    </div>
                                )}
                                {event.location && (
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Lokasi</p>
                                        <a href={event.location} target="_blank" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
                                            {event.location}
                                        </a>
                                    </div>
                                )}
                                {event.package_description && (
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Deskripsi Paket</p>
                                        <p className="text-sm text-gray-900 dark:text-white">{event.package_description}</p>
                                    </div>
                                )}

                                {/* Items */}
                                {event.items.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Item / Gaun Dipinjam</p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {event.items.map((item) => (
                                                <span key={item.id} className="rounded bg-indigo-100 px-3 py-1 text-sm text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                                                    {item.name} ({item.code}) {item.type?.name ? `• ${item.type.name}` : ''}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'payment' && (
                            <div>
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Riwayat Pembayaran</h3>
                                    <Link
                                        href={route('payments.create', { event_id: event.id })}
                                        className="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
                                    >
                                        + Tambah Pembayaran
                                    </Link>
                                </div>
                                {event.payments.length === 0 ? (
                                    <p className="text-gray-500 dark:text-gray-400">Belum ada pembayaran.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {event.payments.map((p) => (
                                            <div key={p.id} className={`flex items-center justify-between rounded-lg border p-3 ${
                                                p.is_expense === 0 ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'
                                            }`}>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${
                                                            p.is_expense === 0
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                                        }`}>
                                                            {p.type_name}
                                                        </span>
                                                        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${
                                                            p.status === 1
                                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                                                : p.status === 2
                                                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                                        }`}>
                                                            {p.status_name}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{p.description || '-'}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {p.payment_at} • {p.payment_type_name}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-lg font-bold ${
                                                        p.is_expense === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                    }`}>
                                                        {p.is_expense === 0 ? '+' : '-'}{formatRupiah(p.amount)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'schedule' && (
                            <div>
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Jadwal Fitting & Konsultasi</h3>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">(Coming soon: Add Schedule)</span>
                                </div>
                                {event.schedules.length === 0 ? (
                                    <p className="text-gray-500 dark:text-gray-400">Belum ada jadwal.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {event.schedules.map((s) => (
                                            <div key={s.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                                <div className="flex items-center justify-between">
                                                    <span className="rounded bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                                                        {s.type_name}
                                                    </span>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {new Date(s.schedule_from).toLocaleString('id-ID')}
                                                    </p>
                                                </div>
                                                {s.description && <p className="mt-2 text-sm text-gray-900 dark:text-white">{s.description}</p>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
