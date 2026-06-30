import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

interface Item {
    id: number;
    name: string;
    code: string;
    type_name?: string;
}

interface PageProps {
    items: Item[];
}

export default function Create({ items }: PageProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        mobile_phone: '',
        date: '',
        time: '',
        address: '',
        location: '',
        package_description: '',
        total_amount: '',
        order_type: '1',
        item_ids: [] as number[],
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('events.store'));
    };

    const toggleItem = (id: number) => {
        setData('item_ids', data.item_ids.includes(id)
            ? data.item_ids.filter((i) => i !== id)
            : [...data.item_ids, id]
        );
    };

    const inputClass = 'mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-rose-400 focus:ring-rose-400 border-stone-700 bg-stone-900 text-stone-300';
    const labelClass = 'block text-sm font-medium text-stone-700 text-stone-300';

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-stone-800 text-stone-200">
                    Booking Baru
                </h2>
            }
        >
            <Head title="Booking Baru" />

            <div className="py-6">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="bg-white p-6 shadow-sm bg-stone-800 sm:rounded-lg">
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className={labelClass}>Nama Client / Pengantin</label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className={inputClass}
                                        required
                                    />
                                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                </div>
                                <div>
                                    <label className={labelClass}>Telepon / WhatsApp</label>
                                    <input
                                        type="text"
                                        value={data.mobile_phone}
                                        onChange={(e) => setData('mobile_phone', e.target.value)}
                                        className={inputClass}
                                        required
                                    />
                                    {errors.mobile_phone && <p className="mt-1 text-sm text-red-600">{errors.mobile_phone}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <label className={labelClass}>Tanggal Event</label>
                                    <input
                                        type="date"
                                        value={data.date}
                                        onChange={(e) => setData('date', e.target.value)}
                                        className={inputClass}
                                        required
                                    />
                                    {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
                                </div>
                                <div>
                                    <label className={labelClass}>Jam Event</label>
                                    <input
                                        type="time"
                                        value={data.time}
                                        onChange={(e) => setData('time', e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Jenis Order</label>
                                    <select
                                        value={data.order_type}
                                        onChange={(e) => setData('order_type', e.target.value)}
                                        className={inputClass}
                                    >
                                        <option value="1">MUA</option>
                                        <option value="2">Gaun</option>
                                        <option value="3">Time Period</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Alamat</label>
                                <textarea
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    className={inputClass}
                                    rows={2}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Link Lokasi (Google Maps)</label>
                                <input
                                    type="url"
                                    value={data.location}
                                    onChange={(e) => setData('location', e.target.value)}
                                    className={inputClass}
                                    placeholder="https://maps.google.com/?q=..."
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Deskripsi Paket</label>
                                <textarea
                                    value={data.package_description}
                                    onChange={(e) => setData('package_description', e.target.value)}
                                    className={inputClass}
                                    rows={3}
                                    placeholder="Contoh: Paket Wedding Full Day + 2 Makeup Artist..."
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Total Harga (Rp)</label>
                                <input
                                    type="number"
                                    value={data.total_amount}
                                    onChange={(e) => setData('total_amount', e.target.value)}
                                    className={inputClass}
                                    required
                                    min="0"
                                />
                                {errors.total_amount && <p className="mt-1 text-sm text-red-600">{errors.total_amount}</p>}
                            </div>

                            {/* Item selection */}
                            <div>
                                <label className={labelClass}>Pilih Item / Gaun (Opsional)</label>
                                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    {items.map((item) => (
                                        <label
                                            key={item.id}
                                            className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 ${
                                                data.item_ids.includes(item.id)
                                                    ? 'border-rose-400 bg-rose-50 bg-rose-500/20'
                                                    : 'border-stone-200 border-stone-700'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={data.item_ids.includes(item.id)}
                                                onChange={() => toggleItem(item.id)}
                                                className="rounded border-stone-300 text-rose-400 focus:ring-rose-400"
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-stone-900 text-white">{item.name}</p>
                                                <p className="text-xs text-stone-500 text-stone-400">{item.code} {item.type_name ? `• ${item.type_name}` : ''}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded bg-rose-400 px-6 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                                >
                                    Simpan Booking
                                </button>
                                <Link
                                    href={route('events.index')}
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
