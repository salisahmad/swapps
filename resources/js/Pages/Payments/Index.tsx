import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatShortDate } from '@/utils/date';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

interface PaymentItem {
    id: number;
    is_expense: number;
    type_name: string;
    payment_at: string | null;
    payment_type_name: string;
    amount: number;
    operational_cut: number;
    description: string | null;
    status: number;
    status_name: string;
    receipt_image: string | null;
    event: { id: number; uuid: string; name: string; date: string; deleted_at?: string | null } | null;
}

interface PageProps {
    payments: {
        data: PaymentItem[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: {
        status?: string[];
        is_expense?: string;
        payment_type?: string;
        date_from?: string;
        date_to?: string;
    };
    authUser: {
        id: number;
        role: number;
        is_admin: boolean;
    };
    stats: {
        total_earnings: number;
        total_expenses: number;
        total_pending: number;
        profit: number;
    };
}

export default function Index({ payments, filters, stats, authUser }: PageProps) {
    const { data, setData, get, post } = useForm({
        status: filters.status || ['0'],
        is_expense: filters.is_expense || '0',
        payment_type: filters.payment_type || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
    });

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        get(route('payments.index'));
    };

    const formatRupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
    const toggleStatus = (status: string) => {
        setData('status', data.status.includes(status)
            ? data.status.filter((item) => item !== status)
            : [...data.status, status]
        );
    };

    const handleConfirm = (payment: PaymentItem) => {
        const message = [
            'Konfirmasi pembayaran ini?',
            '',
            `Client: ${payment.event?.name || 'Client tidak ditemukan'}`,
            `Metode: ${payment.payment_type_name}`,
            `Tanggal: ${formatShortDate(payment.payment_at)}`,
            `Jumlah: ${formatRupiah(payment.amount)}`,
        ].join('\n');

        if (confirm(message)) {
            post(route('payments.confirm', payment.id));
        }
    };

    const handleReject = (id: number) => {
        if (confirm('Tolak pembayaran ini?')) {
            post(route('payments.reject', id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="page-title">Keuangan</h2>
                    <Link href={route('payments.create')} className="btn-primary text-sm py-2.5 px-4">
                        + Transaksi
                    </Link>
                </div>
            }
        >
            <Head title="Payments" />

            <div className="space-y-4">
                <div className={`grid grid-cols-1 gap-3 ${authUser.is_admin ? 'sm:grid-cols-4' : 'sm:grid-cols-2'}`}>
                    {authUser.is_admin && (
                        <>
                            <div className="stat-card border-l-4 border-emerald-300">
                                <p className="text-xs text-stone-400">Pemasukan</p>
                                <p className="text-lg font-bold text-emerald-600">{formatRupiah(stats.total_earnings)}</p>
                            </div>
                            <div className="stat-card border-l-4 border-red-300">
                                <p className="text-xs text-stone-400">Pengeluaran</p>
                                <p className="text-lg font-bold text-red-500">{formatRupiah(stats.total_expenses)}</p>
                            </div>
                        </>
                    )}
                    <div className="stat-card border-l-4 border-amber-300">
                        <p className="text-xs text-stone-400">Pending</p>
                        <p className="text-lg font-bold text-amber-600">{formatRupiah(stats.total_pending)}</p>
                    </div>
                    {authUser.is_admin && (
                        <div className="stat-card border-l-4 border-sky-300">
                            <p className="text-xs text-stone-400">Profit</p>
                            <p className="text-lg font-bold text-sky-600">{formatRupiah(stats.profit)}</p>
                        </div>
                    )}
                </div>

                {/* Filter */}
                <div className="card p-3">
                    <form onSubmit={submit} className="flex flex-wrap gap-2">
                        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2">
                            <span className="text-xs font-semibold uppercase text-stone-400">Status</span>
                            {[
                                ['0', 'Pending'],
                                ['1', 'Dikonfirmasi'],
                                ['2', 'Ditolak'],
                            ].map(([value, label]) => (
                                <label key={value} className="flex items-center gap-1.5 text-sm text-stone-600">
                                    <input
                                        type="checkbox"
                                        checked={data.status.includes(value)}
                                        onChange={() => toggleStatus(value)}
                                        className="rounded border-stone-300 text-rose-400 focus:ring-rose-400"
                                    />
                                    {label}
                                </label>
                            ))}
                        </div>
                        <select value={data.is_expense} onChange={(e) => setData('is_expense', e.target.value)} className="input-field w-40 pr-9">
                            <option value="">Semua Jenis</option>
                            <option value="0">Pemasukan</option>
                            <option value="1">Pengeluaran</option>
                        </select>
                        <select value={data.payment_type} onChange={(e) => setData('payment_type', e.target.value)} className="input-field w-44 pr-9">
                            <option value="">Semua Metode</option>
                            <option value="0">Lainnya</option>
                            <option value="1">Cash</option>
                            <option value="2">BCA</option>
                            <option value="3">Mandiri</option>
                            <option value="4">BRI</option>
                            <option value="5">QRIS</option>
                        </select>
                        <input type="date" value={data.date_from} onChange={(e) => setData('date_from', e.target.value)} className="input-field w-40" placeholder="Dari" />
                        <input type="date" value={data.date_to} onChange={(e) => setData('date_to', e.target.value)} className="input-field w-40" placeholder="Sampai" />
                        <button type="submit" className="btn-primary py-2 px-4">Filter</button>
                        <Link href={route('payments.index')} className="btn-secondary py-2 px-4">Reset</Link>
                    </form>
                </div>

                {/* Mobile Card List */}
                <div className="space-y-3 sm:hidden">
                    {payments.data.map((p) => (
                        <div key={p.id} className={`card p-4 ${p.is_expense === 0 ? 'border-l-4 border-emerald-300' : 'border-l-4 border-red-300'}`}>
                            <div className="flex items-start justify-between">
                                <div className="min-w-0">
                                    {p.event ? (
                                        <Link href={route('events.show', p.event.uuid)} className="text-sm font-semibold text-rose-500 hover:underline">
                                            {p.event.name}
                                        </Link>
                                    ) : (
                                        <p className="text-sm font-semibold text-stone-500">Client tidak ditemukan</p>
                                    )}
                                    <p className="text-xs text-stone-400">
                                        Acara: {formatShortDate(p.event?.date)} {p.event?.deleted_at ? '· Terhapus' : ''}
                                    </p>
                                    <p className="text-xs text-stone-400">{p.description || '-'}</p>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        <span className="text-xs font-medium text-stone-600">{p.payment_type_name}</span>
                                        <span className={`badge ${p.status === 1 ? 'badge-blue' : p.status === 2 ? 'badge-red' : 'badge-yellow'}`}>{p.status_name}</span>
                                    </div>
                                    <p className="mt-1 text-xs text-stone-400">{formatShortDate(p.payment_at)}</p>
                                    {p.operational_cut > 0 && (
                                        <p className="text-xs text-amber-600">Potongan: {formatRupiah(p.operational_cut)}</p>
                                    )}
                                </div>
                                <div className="text-right shrink-0">
                                    <p className={`text-lg font-bold ${p.is_expense === 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {p.is_expense === 0 ? '+' : '-'}{formatRupiah(p.amount)}
                                    </p>
                                    {p.receipt_image && (
                                        <button
                                            onClick={() => setPreviewImage(`/storage/${p.receipt_image}`)}
                                            className="mt-1 text-xs text-rose-500 underline"
                                        >
                                            📷 Lihat Bukti
                                        </button>
                                    )}
                                </div>
                            </div>
                            {p.status === 0 && authUser.is_admin && (
                                <div className="mt-3 flex gap-2">
                                    <button onClick={() => handleConfirm(p)} className="btn-primary text-xs py-2 px-3 flex-1">✅ Konfirmasi</button>
                                    <button onClick={() => handleReject(p.id)} className="btn-danger text-xs py-2 px-3 flex-1">❌ Tolak</button>
                                </div>
                            )}
                        </div>
                    ))}
                    {payments.data.length === 0 && (
                        <div className="card py-12 text-center">
                            <p className="text-4xl mb-2">📭</p>
                            <p className="text-stone-400">Tidak ada transaksi</p>
                        </div>
                    )}
                </div>

                {/* Desktop Table */}
                <div className="hidden card overflow-hidden sm:block">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-stone-100">
                            <thead>
                                <tr className="bg-stone-50">
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-stone-400">Tanggal Pembayaran</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-stone-400">Nama</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-stone-400">Tanggal Acara</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-stone-400">Nominal</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-stone-400">Metode</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-stone-400">Status</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-stone-400">Bukti</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-stone-400">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {payments.data.map((p) => (
                                    <tr key={p.id} className="transition hover:bg-stone-50">
                                        <td className="px-4 py-3 text-sm text-stone-600">
                                            {formatShortDate(p.payment_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {p.event ? (
                                                <Link href={route('events.show', p.event.uuid)} className="text-sm font-medium text-rose-500 hover:underline">
                                                    {p.event.name}
                                                </Link>
                                            ) : (
                                                <span className="text-sm font-medium text-stone-500">Client tidak ditemukan</span>
                                            )}
                                            <p className="text-xs text-stone-400">{p.description || '-'}</p>
                                            {p.event?.deleted_at && (
                                                <p className="text-xs font-semibold text-red-500">Client terhapus</p>
                                            )}
                                            {p.operational_cut > 0 && (
                                                <p className="text-xs text-amber-600">Potongan: {formatRupiah(p.operational_cut)}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-stone-600">
                                            {formatShortDate(p.event?.date)}
                                        </td>
                                        <td className={`px-4 py-3 text-right font-semibold ${p.is_expense === 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {p.is_expense === 0 ? '+' : '-'}{formatRupiah(p.amount)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm font-medium text-stone-700">{p.payment_type_name}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`badge ${p.status === 1 ? 'badge-blue' : p.status === 2 ? 'badge-red' : 'badge-yellow'}`}>{p.status_name}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {p.receipt_image ? (
                                                <button onClick={() => setPreviewImage(`/storage/${p.receipt_image}`)} className="text-rose-500 hover:text-rose-600">
                                                    📷
                                                </button>
                                            ) : (
                                                <span className="text-stone-500">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm">
                                            {p.status === 0 && authUser.is_admin && (
                                                <>
                                                    <button onClick={() => handleConfirm(p)} className="mr-2 text-emerald-600 hover:text-emerald-700 font-medium">Konfirmasi</button>
                                                    <button onClick={() => handleReject(p.id)} className="text-red-500 hover:text-red-600 font-medium">Tolak</button>
                                                </>
                                            )}
                                            <Link href={route('payments.edit', p.id)} className="text-stone-500 hover:text-stone-700 ml-2">Edit</Link>
                                        </td>
                                    </tr>
                                ))}
                                {payments.data.length === 0 && (
                                    <tr><td colSpan={8} className="px-4 py-12 text-center text-stone-400">📭 Tidak ada transaksi</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                <div className="flex justify-center gap-1 pt-2">
                    {payments.links.map((link, i) => link.url ? (
                        <Link key={i} href={link.url} className={`rounded-lg px-3 py-1.5 text-sm transition ${link.active ? 'bg-rose-400 text-white font-semibold' : 'bg-white text-stone-600 border border-stone-100 hover:bg-stone-50'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                    ) : (
                        <span key={i} className="rounded-lg px-3 py-1.5 text-sm bg-stone-100 text-stone-500" dangerouslySetInnerHTML={{ __html: link.label }} />
                    ))}
                </div>
            </div>

            {/* Image Preview Modal */}
            {previewImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewImage(null)}>
                    <div className="relative">
                        <img src={previewImage} alt="Bukti pembayaran" className="max-h-[80vh] max-w-full rounded-lg" />
                        <button onClick={() => setPreviewImage(null)} className="absolute -top-3 -right-3 rounded-full bg-white p-2 text-stone-800 shadow-lg">✕</button>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
