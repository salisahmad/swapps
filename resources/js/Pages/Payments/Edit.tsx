import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

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
    description: string | null;
    status: number;
}

interface PageProps {
    payment: Payment;
    events: Event[];
}

export default function Edit({ payment, events }: PageProps) {
    const { data, setData, put, processing, errors } = useForm({
        event_id: String(payment.event_id),
        is_expense: String(payment.is_expense),
        type: payment.type ? String(payment.type) : '',
        payment_at: payment.payment_at ? payment.payment_at.split(' ')[0] : '',
        payment_type: String(payment.payment_type),
        amount: String(payment.amount),
        description: payment.description || '',
        status: String(payment.status),
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('payments.update', payment.id));
    };

    const inputClass = 'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300';
    const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300';

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Edit Transaksi
                </h2>
            }
        >
            <Head title="Edit Transaksi" />

            <div className="py-6">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <div className="bg-white p-6 shadow-sm dark:bg-gray-800 sm:rounded-lg">
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className={labelClass}>Event / Client</label>
                                <select
                                    value={data.event_id}
                                    onChange={(e) => setData('event_id', e.target.value)}
                                    className={inputClass}
                                    required
                                >
                                    {events.map((e) => (
                                        <option key={e.id} value={e.id}>
                                            {e.name} ({e.date}) — Rp {e.total_amount.toLocaleString('id-ID')}
                                        </option>
                                    ))}
                                </select>
                                {errors.event_id && <p className="mt-1 text-sm text-red-600">{errors.event_id}</p>}
                            </div>

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
                                    className="rounded bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    Update Transaksi
                                </button>
                                <Link
                                    href={route('payments.index')}
                                    className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400"
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
