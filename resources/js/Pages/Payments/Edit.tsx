import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

interface Event {
    id: number;
    name: string;
    date: string;
    total_amount: number;
}

interface Payment {
    id: number;
    event_id: number;
    is_expense: number;
    type: number | null;
    payment_at: string | null;
    payment_type: number;
    amount: number;
    operational_cut: number;
    description: string | null;
    status: number;
    receipt_image: string | null;
}

interface AuthUser {
    id: number;
    role: number;
    is_admin: boolean;
}

interface PageProps {
    payment: Payment;
    events: Event[];
    authUser: AuthUser;
}

export default function Edit({ payment, events, authUser }: PageProps) {
    const { data, setData, post, processing, errors } = useForm({
        event_id: String(payment.event_id),
        is_expense: String(payment.is_expense),
        type: payment.type ? String(payment.type) : '',
        payment_at: payment.payment_at ? payment.payment_at.split(' ')[0] : '',
        payment_type: String(payment.payment_type),
        amount: String(payment.amount),
        operational_cut: String(payment.operational_cut),
        description: payment.description || '',
        status: String(authUser.is_admin ? payment.status : 0),
        receipt_image: null as File | null,
        _method: 'PUT',
    });

    const [previewUrl, setPreviewUrl] = useState<string | null>(
        payment.receipt_image ? `/storage/${payment.receipt_image}` : null
    );
    const [receiptChanged, setReceiptChanged] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('payments.update', payment.id), { forceFormData: true });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setData('receipt_image', file);
        setReceiptChanged(true);
        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const formatRupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
    const onlyDigits = (value: string) => value.replace(/\D/g, '');
    const formatNumberInput = (value: string) => onlyDigits(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    const netAmount = parseFloat(data.amount || '0') - (parseFloat(data.operational_cut || '0') || 0);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="page-title">Edit Transaksi</h2>
            }
        >
            <Head title="Edit Transaksi" />

            <div className="py-4">
                <div className="mx-auto max-w-3xl">
                    <div className="card-elevated p-5 sm:p-6">
                        <form onSubmit={submit} className="space-y-4" encType="multipart/form-data">
                            <div>
                                <label className="block text-sm font-medium text-stone-600">Client</label>
                                <select
                                    value={data.event_id}
                                    onChange={(e) => setData('event_id', e.target.value)}
                                    className="input-field"
                                    required
                                >
                                    {events.map((e) => (
                                        <option key={e.id} value={e.id}>
                                            {e.name} ({e.date}) — {formatRupiah(e.total_amount)}
                                        </option>
                                    ))}
                                </select>
                                {errors.event_id && <p className="mt-1 text-sm text-red-500">{errors.event_id}</p>}
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-stone-600">Jenis Transaksi</label>
                                    <select
                                        value={data.is_expense}
                                        onChange={(e) => setData('is_expense', e.target.value)}
                                        className="input-field"
                                    >
                                        <option value="0">💰 Pemasukan</option>
                                        <option value="1">💸 Pengeluaran</option>
                                        <option value="2">📌 Biaya Tambahan</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-600">Metode Pembayaran</label>
                                    <select
                                        value={data.payment_type}
                                        onChange={(e) => setData('payment_type', e.target.value)}
                                        className="input-field"
                                    >
                                        <option value="1">💵 Cash</option>
                                        <option value="2">🏦 BCA</option>
                                        <option value="3">🏦 Mandiri</option>
                                        <option value="4">🏦 BRI</option>
                                        <option value="0">📝 Lainnya</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-stone-600">Tanggal Transaksi</label>
                                    <input
                                        type="date"
                                        value={data.payment_at}
                                        onChange={(e) => setData('payment_at', e.target.value)}
                                        className="input-field"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-600">Jumlah (Rp)</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={formatNumberInput(data.amount)}
                                        onChange={(e) => setData('amount', onlyDigits(e.target.value))}
                                        className="input-field"
                                        required
                                    />
                                    {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-600">
                                    Potongan Operasional (Rp)
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={formatNumberInput(data.operational_cut)}
                                    onChange={(e) => setData('operational_cut', onlyDigits(e.target.value))}
                                    className="input-field"
                                    placeholder="0"
                                />
                                {parseFloat(data.operational_cut || '0') > 0 && (
                                    <div className="mt-2 rounded-lg bg-amber-50 p-3">
                                        <p className="text-sm text-amber-700">
                                            Client bayar: <strong>{formatRupiah(parseFloat(data.amount || '0'))}</strong>
                                        </p>
                                        <p className="text-sm text-amber-700">
                                            Potongan: <strong>{formatRupiah(parseFloat(data.operational_cut || '0'))}</strong>
                                        </p>
                                        <p className="text-sm text-amber-700">
                                            Nett: <strong>{formatRupiah(netAmount)}</strong>
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-600">Keterangan</label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="input-field"
                                    rows={2}
                                />
                            </div>

                            {authUser.is_admin && (
                            <div>
                                <label className="block text-sm font-medium text-stone-600">Status</label>
	                                <select
	                                    value={data.status}
	                                    onChange={(e) => setData('status', e.target.value)}
	                                    className="input-field w-full pr-10"
	                                >
	                                    <option value="0">⏳ Pending</option>
	                                    <option value="1">✅ Dikonfirmasi</option>
	                                    <option value="2">❌ Ditolak</option>
	                                </select>
                            </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-stone-600">Bukti Pembayaran</label>
                                <div className="mt-2">
                                    {previewUrl ? (
                                        <div className="relative inline-block">
                                            <img src={previewUrl} alt="Receipt" className="h-40 rounded-lg object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => { setPreviewUrl(null); setData('receipt_image', null); setReceiptChanged(true); }}
                                                className="absolute -right-2 -top-2 rounded-full bg-red-500 px-2 py-1 text-xs text-white"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 p-6 transition hover:bg-stone-100">
                                            <span className="text-3xl">📷</span>
                                            <span className="mt-2 text-sm text-stone-500">Tap untuk upload foto</span>
                                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                        </label>
                                    )}
                                </div>
                                {errors.receipt_image && <p className="mt-1 text-sm text-red-500">{errors.receipt_image}</p>}
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <button type="submit" disabled={processing} className="btn-primary flex-1">
                                    {processing ? 'Menyimpan...' : 'Update Transaksi'}
                                </button>
                                <Link href={route('payments.index')} className="btn-secondary">Batal</Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
