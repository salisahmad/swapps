import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface Item {
    id: number;
    name: string;
    code: string;
    description?: string | null;
    type_name?: string;
    image_url?: string | null;
    premium_level_name?: string;
    stock_summary?: string;
    total_stock?: number;
    rental_price?: number;
    package_rental_price?: number;
}

interface PageProps {
    items: Item[];
}

interface DateClient {
    id: number;
    uuid: string;
    name: string;
    date: string;
    time: string | null;
}

interface AdditionalCost {
    type: string;
    total: string;
    notes: string;
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
        discount_amount: '',
        additional_costs: [] as AdditionalCost[],
        down_payment: '1000000',
        down_payment_type: '0',
        order_type: '1',
        item_ids: [] as number[],
    });
    const [dateClients, setDateClients] = useState<DateClient[]>([]);
    const [checkingDate, setCheckingDate] = useState(false);
    const [itemSearch, setItemSearch] = useState('');
    const [itemResults, setItemResults] = useState<Item[]>(items);
    const [selectedItems, setSelectedItems] = useState<Item[]>([]);
    const [searchingItems, setSearchingItems] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('events.store'));
    };

    const toggleItem = (item: Item) => {
        const selected = data.item_ids.includes(item.id);

        setData('item_ids', selected
            ? data.item_ids.filter((id) => id !== item.id)
            : [...data.item_ids, item.id]
        );

        setSelectedItems(selected
            ? selectedItems.filter((selectedItem) => selectedItem.id !== item.id)
            : [...selectedItems, item]
        );
    };

    const inputClass = 'mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-rose-400 focus:ring-rose-400 border-stone-200 bg-white text-stone-800';
    const labelClass = 'block text-sm font-medium text-stone-700 text-stone-500';
    const onlyDigits = (value: string) => value.replace(/\D/g, '');
    const formatNumberInput = (value: string) => onlyDigits(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toLocaleDateString('en-CA');
    const formatClientTime = (time: string | null) => time || 'Jam belum diisi';
    const formatRupiah = (n?: number) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
    const additionalCostTypes = ['Transport', 'Foto/Video', 'Melati', 'MC', 'Hairdo', 'Hena', 'Dekor', 'Tambahan'];
    const additionalCostTotal = data.additional_costs.reduce((sum, cost) => sum + Number(cost.total || 0), 0);
    const grandTotal = Math.max(0, Number(data.total_amount || 0) + additionalCostTotal - Number(data.discount_amount || 0));

    const addAdditionalCost = () => {
        setData('additional_costs', [...data.additional_costs, { type: 'Transport', total: '', notes: '' }]);
    };

    const updateAdditionalCost = (index: number, field: keyof AdditionalCost, value: string) => {
        setData('additional_costs', data.additional_costs.map((cost, costIndex) => (
            costIndex === index ? { ...cost, [field]: field === 'total' ? onlyDigits(value) : value } : cost
        )));
    };

    const removeAdditionalCost = (index: number) => {
        setData('additional_costs', data.additional_costs.filter((_, costIndex) => costIndex !== index));
    };

    useEffect(() => {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => {
            const params = new URLSearchParams();
            if (itemSearch.trim()) {
                params.set('q', itemSearch.trim());
            }

            setSearchingItems(true);

            fetch(`${route('items.search')}?${params.toString()}`, {
                signal: controller.signal,
                headers: { Accept: 'application/json' },
            })
                .then((response) => response.json())
                .then((result: Item[]) => setItemResults(result))
                .catch((error) => {
                    if (error.name !== 'AbortError') {
                        setItemResults(items);
                    }
                })
                .finally(() => setSearchingItems(false));
        }, 250);

        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [itemSearch]);

    useEffect(() => {
        if (!data.date) {
            setDateClients([]);
            return;
        }

        const controller = new AbortController();
        const params = new URLSearchParams({ date: data.date });

        setCheckingDate(true);

        fetch(`${route('events.by-date')}?${params.toString()}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        })
            .then((response) => response.json())
            .then((clients: DateClient[]) => setDateClients(clients))
            .catch((error) => {
                if (error.name !== 'AbortError') {
                    setDateClients([]);
                }
            })
            .finally(() => setCheckingDate(false));

        return () => controller.abort();
    }, [data.date]);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-stone-800">
                    Client Baru
                </h2>
            }
        >
            <Head title="Client Baru" />

            <div className="py-6">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="bg-white p-6 shadow-sm bg-white sm:rounded-lg">
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
                                    <label className={labelClass}>Tanggal</label>
                                    <input
                                        type="date"
                                        value={data.date}
                                        onChange={(e) => setData('date', e.target.value)}
                                        className={inputClass}
                                        min={minDate}
                                        required
                                    />
                                    {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
                                </div>
                                <div>
                                    <label className={labelClass}>Jam</label>
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
                                        <option value="2">Sewa Gaun</option>
                                    </select>
                                </div>
                            </div>

                            {data.date && (
                                <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                                    <p className="text-sm font-semibold text-amber-800">
                                        Client di tanggal ini
                                    </p>
                                    {checkingDate ? (
                                        <p className="mt-1 text-sm text-amber-700">Mengecek jadwal client...</p>
                                    ) : dateClients.length === 0 ? (
                                        <p className="mt-1 text-sm text-amber-700">Belum ada client lain di tanggal ini.</p>
                                    ) : (
                                        <div className="mt-2 space-y-1">
                                            {dateClients.map((client) => (
                                                <Link
                                                    key={client.id}
                                                    href={route('events.show', client.uuid)}
                                                    className="block rounded bg-white/70 px-3 py-2 text-sm text-amber-900 hover:bg-white"
                                                >
                                                    <span className="font-semibold">{client.name}</span>
                                                    <span className="ml-2 text-amber-700">{formatClientTime(client.time)}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

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

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className={labelClass}>Total Harga (Rp)</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={formatNumberInput(data.total_amount)}
                                        onChange={(e) => setData('total_amount', onlyDigits(e.target.value))}
                                        className={inputClass}
                                        required
                                    />
                                    {errors.total_amount && <p className="mt-1 text-sm text-red-600">{errors.total_amount}</p>}
                                </div>
                                <div>
                                    <label className={labelClass}>Diskon (Rp)</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={formatNumberInput(data.discount_amount)}
                                        onChange={(e) => setData('discount_amount', onlyDigits(e.target.value))}
                                        className={inputClass}
                                    />
                                    {errors.discount_amount && <p className="mt-1 text-sm text-red-600">{errors.discount_amount}</p>}
                                </div>
                            </div>

                            <div className="rounded-xl border border-stone-100 bg-stone-50 p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-stone-800">Biaya Tambahan</p>
                                        <p className="text-xs text-stone-500">Transport, Foto/Video, Melati, MC, dan lainnya.</p>
                                    </div>
                                    <button type="button" onClick={addAdditionalCost} className="rounded bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-100">
                                        + Biaya
                                    </button>
                                </div>
                                {data.additional_costs.length === 0 ? (
                                    <p className="text-sm text-stone-400">Belum ada biaya tambahan.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {data.additional_costs.map((cost, index) => (
                                            <div key={index} className="grid grid-cols-1 gap-2 rounded-lg bg-white p-3 sm:grid-cols-[150px_1fr_auto]">
                                                <select value={cost.type} onChange={(e) => updateAdditionalCost(index, 'type', e.target.value)} className="rounded-md border-stone-300 bg-white text-stone-800">
                                                    {additionalCostTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                                                </select>
                                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={formatNumberInput(cost.total)}
                                                        onChange={(e) => updateAdditionalCost(index, 'total', e.target.value)}
                                                        className="rounded-md border-stone-300 bg-white text-stone-800"
                                                        placeholder="Total"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={cost.notes}
                                                        onChange={(e) => updateAdditionalCost(index, 'notes', e.target.value)}
                                                        className="rounded-md border-stone-300 bg-white text-stone-800"
                                                        placeholder="Notes"
                                                    />
                                                </div>
                                                <button type="button" onClick={() => removeAdditionalCost(index)} className="rounded bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100">
                                                    Hapus
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-stone-700">
                                    Grand Total: <span className="font-bold text-rose-500">{formatRupiah(grandTotal)}</span>
                                    <span className="ml-2 text-xs text-stone-400">
                                        ({formatRupiah(Number(data.total_amount || 0))} + {formatRupiah(additionalCostTotal)} - {formatRupiah(Number(data.discount_amount || 0))})
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className={labelClass}>Pembayaran DP (Rp)</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={formatNumberInput(data.down_payment)}
                                        onChange={(e) => setData('down_payment', onlyDigits(e.target.value))}
                                        className={inputClass}
                                        required
                                    />
                                    {errors.down_payment && <p className="mt-1 text-sm text-red-600">{errors.down_payment}</p>}
                                </div>
                                <div>
                                    <label className={labelClass}>Metode DP</label>
                                    <select
                                        value={data.down_payment_type}
                                        onChange={(e) => setData('down_payment_type', e.target.value)}
                                        className={inputClass}
                                        required
                                    >
                                        <option value="0">Cash</option>
                                        <option value="1">BCA</option>
                                        <option value="2">QRIS</option>
                                        <option value="3">E-Wallet</option>
                                        <option value="4">Lainnya</option>
                                    </select>
                                    {errors.down_payment_type && <p className="mt-1 text-sm text-red-600">{errors.down_payment_type}</p>}
                                </div>
                            </div>

                            {/* Item selection */}
                            <div>
                                <label className={labelClass}>Pilih Item / Gaun (Opsional)</label>
                                <input
                                    type="text"
                                    value={itemSearch}
                                    onChange={(e) => setItemSearch(e.target.value)}
                                    className={inputClass}
                                    placeholder="Cari kode, nama, atau deskripsi item..."
                                />
                                {selectedItems.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {selectedItems.map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => toggleItem(item)}
                                                className="rounded bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                                            >
                                                {item.code} - {item.name} x
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {searchingItems && <p className="mt-2 text-xs text-stone-500">Mencari item...</p>}
                                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    {itemResults.map((item) => (
                                        <label
                                            key={item.id}
                                            className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 ${
                                                data.item_ids.includes(item.id)
                                                    ? 'border-rose-400 bg-rose-50 bg-rose-500/20'
                                                    : 'border-stone-200'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={data.item_ids.includes(item.id)}
                                                onChange={() => toggleItem(item)}
                                                className="rounded border-stone-300 text-rose-400 focus:ring-rose-400"
                                            />
                                            {item.image_url && (
                                                <img src={item.image_url} alt={item.name} className="h-12 w-12 rounded-lg object-cover" />
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-stone-900 text-white">{item.name}</p>
                                                <p className="text-xs text-stone-500">{item.code} {item.type_name ? `• ${item.type_name}` : ''}</p>
                                                {item.stock_summary && (
                                                    <p className="text-xs text-stone-400">Stok: {item.stock_summary}</p>
                                                )}
                                                <p className="text-xs text-stone-400">
                                                    {item.premium_level_name ? `${item.premium_level_name} • ` : ''}{formatRupiah(item.rental_price)}
                                                </p>
                                            </div>
                                        </label>
                                    ))}
                                    {itemResults.length === 0 && (
                                        <p className="rounded-lg border border-stone-200 p-4 text-sm text-stone-500 sm:col-span-2 lg:col-span-3">
                                            Item tidak ditemukan.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded bg-rose-400 px-6 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                                >
                                    Simpan Client
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
