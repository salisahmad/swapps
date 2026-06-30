import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

interface Event {
    id: number;
    name: string;
    date: string;
    total_amount: number;
}

interface PageProps {
    events: Event[];
    event_id?: number | null;
}

export default function Create({ events, event_id }: PageProps) {
    const { data, setData, post, processing, errors } = useForm({
        event_id: event_id ? String(event_id) : '',
        is_expense: '0',
        type: '',
        payment_at: new Date().toISOString().split('T')[0],
        payment_type: '0',
        amount: '',
        operational_cut: '',
        description: '',
        status: '1',
        receipt_image: null as File | null,
    });

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('event_id', data.event_id);
        formData.append('is_expense', data.is_expense);
        formData.append('payment_type', data.payment_type);
        formData.append('payment_at', data.payment_at);
        formData.append('amount', data.amount);
        formData.append('operational_cut', data.operational_cut || '0');
        formData.append('description', data.description);
        formData.append('status', data.status);
        if (data.receipt_image) {
            formData.append('receipt_image', data.receipt_image);
        }

        post(route('payments.store'), {
            data: formData,
            forceFormData: true,
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setData('receipt_image', file);
        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const formatRupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

    const selectedEvent = events.find((e) => String(e.id) === data.event_id);
    const netAmount = data.amount ? parseFloat(data.amount) - (parseFloat(data.operational_cut || '0') || 0) : 0;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="page-title">Catat Transaksi</h2>
            }
        >
            <Head title="Catat Transaksi" />

            <div className="py-4">
                <div className="mx-auto max-w-3xl">
                    <div className="card-elevated p-5 sm:p-6">
                        <form onSubmit={submit} className="space-y-4" encType="multipart/form-data">
                            {/* Event */}
                            <div>
                                <label className="block text-sm font-medium text-stone-600">Event / Client</label>
                                <select
                                    value={data.event_id}
                                    onChange={(e) => setData('event_id', e.target.value)}
                                    className="input-field"
                                    required
                                >
                                    <option value="">Pilih Event...</option>
                                    {events.map((e) => (
                                        <option key={e.id} value={e.id}>
                                            {e.name} ({e.date}) — {formatRupiah(e.total_amount)}
                                        </option>
                                    ))}
                                </select>
                                {errors.event_id && <p className="mt-1 text-sm text-red-500">{errors.event_id}</p>}
                            </div>

                            {selectedEvent && (
                                <div className="rounded-lg bg-rose-50 p-3">
                                    <p className="text-sm text-rose-700">
                                        Total Harga Deal: <strong>{formatRupiah(selectedEvent.total_amount)}</strong>
                                    </p>
                                </div>
                            )}

                            {/* Jenis & Metode */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-stone-600">Jenis Transaksi</label>
                                    <select
                                        value={data.is_expense}
                                        onChange={(e) => setData('is_expense', e.target.value)}
                                        className="input-field"
                                    >
                                        <option value="0">💰 Pemasukan (Dari Client)</option>
                                        <option value="1">💸 Pengeluaran (Biaya Operasional)</option>
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
                                        <option value="0">💵 Cash</option>
                                        <option value="1">🏦 BCA</option>
                                        <option value="2">📱 QRIS</option>
                                        <option value="3">📲 E-Wallet</option>
                                        <option value="4">📝 Lainnya</option>
                                    </select>
                                </div>
                            </div>

                            {/* Tanggal & Jumlah */}
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
                                        type="number"
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        className="input-field"
                                        required
                                        min="0"
                                    />
                                    {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
                                </div>
                            </div>

                            {/* Potongan Operasional */}
                            <div>
                                <label className="block text-sm font-medium text-stone-600">
                                    Potongan Operasional (Rp)
                                    <span className="ml-1 text-xs text-stone-400">— uang admin sebelum setor ke owner</span>
                                </label>
                                <input
                                    type="number"
                                    value={data.operational_cut}
                                    onChange={(e) => setData('operational_cut', e.target.value)}
                                    className="input-field"
                                    min="0"
                                    placeholder="0"
                                />
                                {data.amount && parseFloat(data.operational_cut || '0') > 0 && (
                                    <div className="mt-2 rounded-lg bg-amber-50 p-3">
                                        <p className="text-sm text-amber-700">
                                            Client bayar: <strong>{formatRupiah(parseFloat(data.amount || '0'))}</strong>
                                        </p>
                                        <p className="text-sm text-amber-700">
                                            Potongan operasional: <strong>{formatRupiah(parseFloat(data.operational_cut || '0'))}</strong>
                                        </p>
                                        <p className="text-sm text-amber-700">
                                            Nett untuk owner: <strong>{formatRupiah(netAmount)}</strong>
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Keterangan */}
                            <div>
                                <label className="block text-sm font-medium text-stone-600">Keterangan</label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="input-field"
                                    rows={2}
                                    placeholder="Contoh: DP 50%, Pelunasan, Biaya transport..."
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-stone-600">Status</label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="input-field"
                                >
                                    <option value="1">✅ Terkonfirmasi</option>
                                    <option value="0">⏳ Pending</option>
                                    <option value="2">❌ Ditolak</option>
                                </select>
                            </div>

                            {/* Upload Bukti Bayar */}
                            <div>
                                <label className="block text-sm font-medium text-stone-600">Bukti Pembayaran</label>
                                <div className="mt-2">
                                    {previewUrl ? (
                                        <div className="relative inline-block">
                                            <img src={previewUrl} alt="Preview" className="h-40 rounded-lg object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => { setPreviewUrl(null); setData('receipt_image', null); }}
                                                className="absolute -right-2 -top-2 rounded-full bg-red-500 px-2 py-1 text-xs text-white"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 p-6 transition hover:bg-stone-100">
                                            <span className="text-3xl">📷</span>
                                            <span className="mt-2 text-sm text-stone-500">Tap untuk upload foto</span>
                                            <span className="text-xs text-stone-400">JPG, PNG (max 5MB)</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                                {errors.receipt_image && <p className="mt-1 text-sm text-red-500">{errors.receipt_image}</p>}
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="btn-primary flex-1"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Transaksi'}
                                </button>
                                <Link
                                    href={route('payments.index')}
                                    className="btn-secondary"
                                >
                                    Batal
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
