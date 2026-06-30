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
                    <h2 className="page-title">{event.name}</h2>
                    <div className="flex items-center gap-2">
                        <Link href={route('dynamic-forms.edit', event.id)} className="btn-primary text-sm py-2 px-3">
                            📝 Berita Acara
                        </Link>
                        <Link href={route('events.edit', event.id)} className="btn-secondary text-sm py-2 px-3">
                            Edit
                        </Link>
                        <button onClick={handleDelete} disabled={deleteProcessing} className="btn-danger text-sm py-2 px-3">
                            Hapus
                        </button>
                    </div>
                </div>
            }
        >
            <Head title={`Event - ${event.name}`} />

            <div className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="stat-card border-l-4 border-rose-300">
                        <p className="text-xs text-stone-400">Total</p>
                        <p className="text-lg font-bold text-stone-800">{formatRupiah(event.total_amount)}</p>
                    </div>
                    <div className="stat-card border-l-4 border-emerald-300">
                        <p className="text-xs text-stone-400">Dibayar</p>
                        <p className="text-lg font-bold text-emerald-600">{formatRupiah(totalPaid)}</p>
                    </div>
                    <div className="stat-card border-l-4 border-amber-300">
                        <p className="text-xs text-stone-400">Sisa</p>
                        <p className="text-lg font-bold text-amber-600">{formatRupiah(remaining)}</p>
                    </div>
                    <div className="stat-card border-l-4 border-red-300">
                        <p className="text-xs text-stone-400">Biaya</p>
                        <p className="text-lg font-bold text-red-500">{formatRupiah(totalExpense)}</p>
                    </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2">
                    <span className={`badge ${event.is_fully_paid ? 'badge-green' : 'badge-yellow'}`}>
                        {event.is_fully_paid ? '✅ LUNAS' : '⏳ BELUM LUNAS'}
                    </span>
                    <span className="badge-pink">{event.order_type_name}</span>
                    <span className="badge-blue">{event.date}</span>
                </div>

                {/* Mobile Tabs */}
                <div className="flex gap-1 rounded-xl bg-white p-1 shadow-sm">
                    {(['info', 'payment', 'schedule'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition ${
                                activeTab === tab
                                    ? 'bg-rose-400 text-white shadow-sm'
                                    : 'text-stone-500 hover:bg-stone-50'
                            }`}
                        >
                            {tab === 'info' && 'ℹ️ Info'}
                            {tab === 'payment' && `💰 Bayar (${event.payments.length})`}
                            {tab === 'schedule' && `⏰ Jadwal (${event.schedules.length})`}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="card-elevated p-4">
                    {activeTab === 'info' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs text-stone-400">📱 Telepon</p>
                                    <a href={`https://wa.me/${event.mobile_phone}`} className="text-sm font-medium text-rose-500 hover:underline" target="_blank">
                                        {event.mobile_phone} ↗
                                    </a>
                                </div>
                                <div>
                                    <p className="text-xs text-stone-400">📅 Tanggal & Waktu</p>
                                    <p className="text-sm font-medium text-stone-800">{event.date} {event.time ? `· ${event.time}` : ''}</p>
                                </div>
                            </div>
                            {event.address && (
                                <div>
                                    <p className="text-xs text-stone-400">🏠 Alamat</p>
                                    <p className="text-sm text-stone-700">{event.address}</p>
                                </div>
                            )}
                            {event.location && (
                                <div>
                                    <p className="text-xs text-stone-400">📍 Lokasi</p>
                                    <a href={event.location} target="_blank" className="text-sm text-rose-500 hover:underline break-all">
                                        {event.location} ↗
                                    </a>
                                </div>
                            )}
                            {event.package_description && (
                                <div>
                                    <p className="text-xs text-stone-400">📦 Paket</p>
                                    <p className="text-sm text-stone-700">{event.package_description}</p>
                                </div>
                            )}
                            {event.items.length > 0 && (
                                <div>
                                    <p className="text-xs text-stone-400">👗 Item / Gaun</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {event.items.map((item) => (
                                            <span key={item.id} className="badge-pink">
                                                {item.name} ({item.code})
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
                                <h3 className="font-semibold text-stone-800">Riwayat Pembayaran</h3>
                                <Link href={route('payments.create', { event_id: event.id })} className="btn-primary text-sm py-2 px-3">
                                    + Bayar
                                </Link>
                            </div>
                            {event.payments.length === 0 ? (
                                <p className="py-8 text-center text-sm text-stone-400">Belum ada pembayaran</p>
                            ) : (
                                <div className="space-y-2">
                                    {event.payments.map((p) => (
                                        <div key={p.id} className={`mobile-card-row ${p.is_expense === 0 ? 'border-l-4 border-emerald-300' : 'border-l-4 border-red-300'}`}>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`badge ${p.is_expense === 0 ? 'badge-green' : 'badge-red'}`}>
                                                        {p.type_name}
                                                    </span>
                                                    <span className={`badge ${p.status === 1 ? 'badge-blue' : p.status === 2 ? 'badge-red' : 'badge-yellow'}`}>
                                                        {p.status_name}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-sm text-stone-700">{p.description || '-'}</p>
                                                <p className="text-xs text-stone-400">{p.payment_at} · {p.payment_type_name}</p>
                                            </div>
                                            <p className={`text-lg font-bold shrink-0 ${p.is_expense === 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {p.is_expense === 0 ? '+' : '-'}{formatRupiah(p.amount)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'schedule' && (
                        <div>
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="font-semibold text-stone-800">Jadwal Fitting & Konsultasi</h3>
                                <span className="text-xs text-stone-400">Coming soon</span>
                            </div>
                            {event.schedules.length === 0 ? (
                                <p className="py-8 text-center text-sm text-stone-400">Belum ada jadwal</p>
                            ) : (
                                <div className="space-y-2">
                                    {event.schedules.map((s) => (
                                        <div key={s.id} className="mobile-card-row border-l-4 border-violet-300">
                                            <div className="min-w-0">
                                                <span className="badge-purple">{s.type_name}</span>
                                                <p className="mt-1 text-sm font-medium text-stone-800">
                                                    {new Date(s.schedule_from).toLocaleString('id-ID')}
                                                </p>
                                                {s.description && <p className="text-xs text-stone-400">{s.description}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
