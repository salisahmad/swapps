import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

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
        description: '',
        status: '1',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('payments.store'));
    };

    const inputClass = 'mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-rose-400 focus:ring-rose-400 border-stone-700 bg-stone-900 text-stone-300';
    const labelClass = 'block text-sm font-medium text-stone-700 text-stone-300';

    const selectedEvent = events.find((e) => String(e.id) === data.event_id);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-stone-800 text-stone-200">
                    Catat Transaksi
                </h2>
            }
        >
            <Head title="Catat Transaksi" />

            <div className="py-6">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <div className="bg-white p-6 shadow-sm bg-stone-800 sm:rounded-lg">
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className={labelClass}>Event / Client</label>
                                <select
                                    value={data.event_id}
                                    onChange={(e) => setData('event_id', e.target.value)}
                                    className={inputClass}
                                    required
                                >
                                    <option value="">Pilih Event...</option>
                                    {events.map((e) => (
                                        <option key={e.id} value={e.id}>
                                            {e.name} ({e.date}) — Rp {e.total_amount.toLocaleString('id-ID')}
                                        </option>
                                    ))}
                                </select>
                                {errors.event_id && <p className="mt-1 text-sm text-red-600">{errors.event_id}</p>}
                            </div>

                            {selectedEvent && (
                                <div className="rounded bg-rose-50 p-3 bg-rose-500/20">
                                    <p className="text-sm text-rose-500 text-rose-200">
                                        Total Harga Deal: Rp {selectedEvent.total_amount.toLocaleString('id-ID')}
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className={labelClass}>Jenis Transaksi</label>
                                    <select
                                        value={data.is_expense}
                                        onChange={(e) => setData('is_expense', e.target.value)}
                                        className={inputClass}
                                    >
                                        <option value="0">Pemasukan (Dari Client)</option>
                                        <option value="1">Pengeluaran (Biaya Operasional)</option>
                                        <option value="2">Biaya Tambahan</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Metode Pembayaran</label>
                                    <select
                                        value={data.payment_type}
                                        onChange={(e) => setData('payment_type', e.target.value)}
                                        className={inputClass}
                                    >
                                        <option value="0">Cash</option>
                                        <option value="1">Transfer Bank</option>
                                        <option value="2">QRIS</option>
                                        <option value="3">E-Wallet</option>
                                        <option value="4">Lainnya</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className={labelClass}>Tanggal Transaksi</label>
                                    <input
                                        type="date"
                                        value={data.payment_at}
                                        onChange={(e) => setData('payment_at', e.target.value)}
                                        className={inputClass}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Jumlah (Rp)</label>
                                    <input
                                        type="number"
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        className={inputClass}
                                        required
                                        min="0"
                                    />
                                    {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Keterangan</label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className={inputClass}
                                    rows={2}
                                    placeholder="Contoh: DP 50%, Pelunasan, Biaya transport..."
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Status</label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="1">Terkonfirmasi</option>
                                    <option value="0">Pending</option>
                                    <option value="2">Ditolak</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded bg-rose-400 px-6 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                                >
                                    Simpan Transaksi
                                </button>
                                <Link
                                    href={route('payments.index')}
                                    className="text-sm text-stone-600 hover:text-stone-900 text-stone-400"
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
