import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

interface ItemType {
    id: number;
    name: string;
}

interface Item {
    id: number;
    code: string;
    name: string;
    description: string | null;
    type?: ItemType;
    is_sold: boolean;
    is_rentable: boolean;
    is_premium: boolean;
    premium_level: string;
    premium_level_name: string;
    image_url: string | null;
    rental_price: number;
    package_rental_price: number;
    total_stock: number;
    stock_summary: string;
    variants: ItemVariant[];
}

interface ItemVariant {
    id?: number;
    size: string;
    stock: number;
}

interface PageProps {
    items: {
        data: Item[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    itemTypes: ItemType[];
    premiumLevels: Record<string, string>;
    filters: {
        q?: string;
        item_type_id?: string;
        is_sold?: string;
        is_rentable?: string;
        premium_level?: string;
    };
}

export default function Index({ items, itemTypes, premiumLevels, filters }: PageProps) {
    const { data, setData, get, post, put, delete: destroy, processing, reset, transform, errors } = useForm({
        q: filters.q || '',
        item_type_id: filters.item_type_id || '',
        is_sold: filters.is_sold || '',
        is_rentable: filters.is_rentable || '',
        premium_level: filters.premium_level || '',
        // form
        code: '',
        name: '',
        description: '',
        item_type_id_form: '',
        form_premium_level: 'standart',
        rental_price: '',
        package_rental_price: '',
        is_rentable_form: true,
        image: null as File | null,
        remove_image: false,
        variants: [{ size: '', stock: 1 }] as ItemVariant[],
        item_id: '',
        _method: '',
    });

    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const submitFilter = (e: React.FormEvent) => {
        e.preventDefault();
        get(route('items.index'));
    };

    const openCreate = () => {
        reset();
        setData({
            ...data,
            code: '',
            name: '',
            description: '',
            item_type_id_form: '',
            form_premium_level: 'standart',
            rental_price: '',
            package_rental_price: '',
            is_rentable_form: true,
            image: null,
            remove_image: false,
            variants: [{ size: '', stock: 1 }],
            item_id: '',
            _method: '',
        });
        setImagePreview(null);
        setEditMode(false);
        setShowModal(true);
    };

    const openEdit = (item: Item) => {
        setData({
            ...data,
            code: item.code,
            name: item.name,
            description: item.description || '',
            item_type_id_form: item.type ? String(item.type.id) : '',
            form_premium_level: item.premium_level || (item.is_premium ? 'premium' : 'standart'),
            rental_price: String(item.rental_price || ''),
            package_rental_price: String(item.package_rental_price || ''),
            is_rentable_form: item.is_rentable,
            image: null,
            remove_image: false,
            variants: item.variants.length > 0 ? item.variants.map((variant) => ({
                id: variant.id,
                size: variant.size,
                stock: variant.stock,
            })) : [{ size: '', stock: 1 }],
            item_id: String(item.id),
            _method: '',
        });
        setImagePreview(item.image_url);
        setEditMode(true);
        setShowModal(true);
    };

    const submitForm = (e: React.FormEvent) => {
        e.preventDefault();

        transform((formData) => ({
            ...formData,
            item_type_id: formData.item_type_id_form || '',
            premium_level: formData.form_premium_level,
            rental_price: formData.rental_price || '0',
            package_rental_price: formData.package_rental_price || '0',
            is_rentable: formData.is_rentable_form,
            variants: formData.variants.filter((variant) => variant.size.trim() !== ''),
            _method: editMode ? 'put' : '',
        }));

        if (editMode && data.item_id) {
            post(route('items.update', data.item_id), {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => setShowModal(false),
            });
        } else {
            post(route('items.store'), {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => setShowModal(false),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Yakin hapus item ini?')) {
            destroy(route('items.destroy', id));
        }
    };

    const handleSoldToggle = (item: Item) => {
        put(route('items.update', item.id), {
            code: item.code,
            name: item.name,
            description: item.description || '',
            item_type_id: item.type?.id || null,
            premium_level: item.premium_level || (item.is_premium ? 'premium' : 'standart'),
            rental_price: item.rental_price,
            package_rental_price: item.package_rental_price,
            is_rentable: item.is_rentable,
            is_sold: !item.is_sold,
        } as any);
    };

    const formatRupiah = (n: number) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

    const handleImageChange = (file: File | null) => {
        setData('image', file);
        setData('remove_image', false);
        setImagePreview(file ? URL.createObjectURL(file) : null);
    };

    const removeImage = () => {
        setData('image', null);
        setData('remove_image', true);
        setImagePreview(null);
    };

    const updateVariant = (index: number, field: keyof ItemVariant, value: string) => {
        setData('variants', data.variants.map((variant, variantIndex) => (
            variantIndex === index
                ? { ...variant, [field]: field === 'stock' ? Number(value || 0) : value }
                : variant
        )));
    };

    const addVariant = () => {
        setData('variants', [...data.variants, { size: '', stock: 1 }]);
    };

    const removeVariant = (index: number) => {
        const nextVariants = data.variants.filter((_, variantIndex) => variantIndex !== index);
        setData('variants', nextVariants.length > 0 ? nextVariants : [{ size: '', stock: 1 }]);
    };

    const levelBadgeClass = (level: string) => {
        if (level === 'premium') return 'bg-amber-100 text-amber-800';
        if (level === 'spesial') return 'bg-violet-100 text-violet-800';
        return 'bg-stone-100 text-stone-700';
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-stone-800">
                        Katalog Item / Gaun
                    </h2>
                    <button
                        onClick={openCreate}
                        className="rounded bg-rose-400 px-4 py-2 text-sm text-white hover:bg-rose-500"
                    >
                        + Tambah Item
                    </button>
                </div>
            }
        >
            <Head title="Katalog" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Filter */}
                    <div className="mb-4 rounded-lg bg-white p-4 shadow-sm bg-white">
                        <form onSubmit={submitFilter} className="grid grid-cols-1 gap-3 sm:grid-cols-6">
                            <input type="text" placeholder="Cari kode / nama / deskripsi..." value={data.q} onChange={(e) => setData('q', e.target.value)} className="rounded-md border-stone-300 text-sm border-stone-200 bg-white text-stone-800" />
                            <select value={data.item_type_id} onChange={(e) => setData('item_type_id', e.target.value)} className="rounded-md border-stone-300 text-sm border-stone-200 bg-white text-stone-800">
                                <option value="">Semua Kategori</option>
                                {itemTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            <select value={data.is_sold} onChange={(e) => setData('is_sold', e.target.value)} className="rounded-md border-stone-300 text-sm border-stone-200 bg-white text-stone-800">
                                <option value="">Semua Status</option>
                                <option value="0">Tersedia</option>
                                <option value="1">Terjual</option>
                            </select>
                            <select value={data.is_rentable} onChange={(e) => setData('is_rentable', e.target.value)} className="rounded-md border-stone-300 text-sm border-stone-200 bg-white text-stone-800">
                                <option value="">Semua Sewa</option>
                                <option value="1">Disewakan</option>
                                <option value="0">Tidak Disewakan</option>
                            </select>
                            <select value={data.premium_level} onChange={(e) => setData('premium_level', e.target.value)} className="rounded-md border-stone-300 text-sm border-stone-200 bg-white text-stone-800">
                                <option value="">Semua Level</option>
                                {Object.entries(premiumLevels).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                            <div className="flex gap-2">
                                <button type="submit" className="rounded bg-rose-400 px-4 py-2 text-sm text-white">Filter</button>
                                <Link href={route('items.index')} className="rounded bg-stone-100 px-4 py-2 text-sm text-stone-700 bg-stone-100 text-stone-500">Reset</Link>
                            </div>
                        </form>
                    </div>

                    {/* Table */}
                    <div className="hidden card overflow-hidden sm:block">
                        <div className="p-6">
                            <table className="min-w-full divide-y divide-stone-100">
                                <thead>
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-stone-500">Kode</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-stone-500">Nama</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-stone-500">Kategori</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-stone-500">Level</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-stone-500">Harga</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-stone-500">Ukuran / Stok</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium uppercase text-stone-500">Status</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium uppercase text-stone-500">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {items.data.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-3 py-3">
                                                <div className="flex items-center gap-3">
                                                    {item.image_url ? (
                                                        <img src={item.image_url} alt={item.name} className="h-12 w-12 rounded-lg object-cover" />
                                                    ) : (
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-stone-100 text-xs text-stone-400">No Foto</div>
                                                    )}
                                                    <span className="text-sm font-mono text-stone-900 text-stone-100">{item.code}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <p className="text-sm font-medium text-stone-900 text-white">{item.name}</p>
                                                <p className="text-xs text-stone-500">{item.description || '-'}</p>
                                            </td>
                                            <td className="px-3 py-3 text-sm text-stone-900 text-stone-100">{item.type?.name || '-'}</td>
                                            <td className="px-3 py-3">
                                                <span className={`rounded px-2 py-1 text-xs font-semibold ${levelBadgeClass(item.premium_level)}`}>
                                                    {item.premium_level_name}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3">
                                                <p className="text-sm font-semibold text-stone-800">{formatRupiah(item.rental_price)}</p>
                                                <p className="text-xs text-stone-500">Paket {formatRupiah(item.package_rental_price)}</p>
                                            </td>
                                            <td className="px-3 py-3">
                                                <p className="text-sm font-semibold text-stone-800">Total {item.total_stock}</p>
                                                <p className="text-xs text-stone-500">{item.stock_summary}</p>
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <button
                                                    onClick={() => handleSoldToggle(item)}
                                                    className={`rounded px-2 py-1 text-xs font-semibold ${
                                                        item.is_sold
                                                            ? 'bg-red-100 text-red-800 bg-red-900 text-red-300'
                                                            : 'bg-green-100 text-green-800 bg-green-900 text-green-300'
                                                    }`}
                                                >
                                                    {item.is_sold ? 'Terjual' : 'Tersedia'}
                                                </button>
                                                <p className={`mt-1 text-xs font-semibold ${item.is_rentable ? 'text-emerald-600' : 'text-stone-400'}`}>
                                                    {item.is_rentable ? 'Disewakan' : 'Tidak disewakan'}
                                                </p>
                                            </td>
                                            <td className="px-3 py-3 text-right text-sm">
                                                <button onClick={() => openEdit(item)} className="mr-2 text-rose-400 hover:text-rose-500 text-rose-400">Edit</button>
                                                <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900 text-red-400">Hapus</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="mt-4 flex justify-end gap-1">
                                {items.links.map((link, i) => link.url ? (
                                    <Link key={i} href={link.url} className={`rounded px-3 py-1 text-sm ${link.active ? 'bg-rose-400 text-white' : 'bg-stone-100 text-stone-600 bg-stone-100 text-stone-500'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                                ) : (
                                    <span key={i} className="rounded px-3 py-1 text-sm bg-stone-100 text-stone-400 bg-white" dangerouslySetInnerHTML={{ __html: link.label }} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl bg-white">
                        <h3 className="mb-4 text-lg font-semibold text-stone-900 text-white">
                            {editMode ? 'Edit Item' : 'Tambah Item'}
                        </h3>
                        <form onSubmit={submitForm} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 text-stone-500">Kode</label>
                                    <input type="text" value={data.code} onChange={(e) => setData('code', e.target.value)} className="mt-1 block w-full rounded-md border-stone-300 bg-white text-stone-800" required />
                                    {processing && <p className="mt-1 text-xs text-stone-500">Checking...</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 text-stone-500">Kategori</label>
                                    <select value={data.item_type_id_form} onChange={(e) => setData('item_type_id_form', e.target.value)} className="mt-1 block w-full rounded-md border-stone-300 bg-white text-stone-800">
                                        <option value="">Pilih...</option>
                                        {itemTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 text-stone-500">Nama Item</label>
                                <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1 block w-full rounded-md border-stone-300 bg-white text-stone-800" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 text-stone-500">Deskripsi</label>
                                <textarea value={data.description} onChange={(e) => setData('description', e.target.value)} className="mt-1 block w-full rounded-md border-stone-300 bg-white text-stone-800" rows={2} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 text-stone-500">Level Item</label>
                                <select value={data.form_premium_level} onChange={(e) => setData('form_premium_level', e.target.value)} className="mt-1 block w-full rounded-md border-stone-300 bg-white text-stone-800">
                                    {Object.entries(premiumLevels).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                                {errors.premium_level && <p className="mt-1 text-sm text-red-500">{errors.premium_level}</p>}
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 text-stone-500">Harga Sewa</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.rental_price}
                                        onChange={(e) => setData('rental_price', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-stone-300 bg-white text-stone-800"
                                        placeholder="0"
                                    />
                                    {errors.rental_price && <p className="mt-1 text-sm text-red-500">{errors.rental_price}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 text-stone-500">Harga Sewa Paket</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.package_rental_price}
                                        onChange={(e) => setData('package_rental_price', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-stone-300 bg-white text-stone-800"
                                        placeholder="0"
                                    />
                                    {errors.package_rental_price && <p className="mt-1 text-sm text-red-500">{errors.package_rental_price}</p>}
                                </div>
                            </div>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={data.is_rentable_form}
                                    onChange={(e) => setData('is_rentable_form', e.target.checked)}
                                    className="rounded border-stone-300 text-rose-400 focus:ring-rose-400"
                                />
                                <span className="text-sm text-stone-700 text-stone-500">Item ini bisa disewakan</span>
                            </label>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 text-stone-500">Foto Katalog</label>
                                <div className="mt-2 flex items-center gap-4">
                                    {imagePreview ? (
                                        <div className="relative">
                                            <img src={imagePreview} alt="Preview katalog" className="h-24 w-24 rounded-xl object-cover" />
                                            <button type="button" onClick={removeImage} className="absolute -right-2 -top-2 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">x</button>
                                        </div>
                                    ) : (
                                        <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-stone-100 text-xs text-stone-400">Belum ada foto</div>
                                    )}
                                    <label className="cursor-pointer rounded bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-200">
                                        Pilih Foto
                                        <input type="file" accept="image/*" onChange={(e) => handleImageChange(e.target.files?.[0] || null)} className="hidden" />
                                    </label>
                                </div>
                                {errors.image && <p className="mt-1 text-sm text-red-500">{errors.image}</p>}
                            </div>
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <label className="block text-sm font-medium text-stone-700 text-stone-500">Ukuran & Stok</label>
                                    <button type="button" onClick={addVariant} className="rounded bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-200">+ Ukuran</button>
                                </div>
                                <div className="space-y-2">
                                    {data.variants.map((variant, index) => (
                                        <div key={index} className="grid grid-cols-[1fr_100px_auto] gap-2">
                                            <input
                                                type="text"
                                                value={variant.size}
                                                onChange={(e) => updateVariant(index, 'size', e.target.value)}
                                                className="rounded-md border-stone-300 bg-white text-stone-800"
                                                placeholder="Ukuran, contoh S / M / L"
                                            />
                                            <input
                                                type="number"
                                                min="0"
                                                value={variant.stock}
                                                onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                                                className="rounded-md border-stone-300 bg-white text-stone-800"
                                                placeholder="Stok"
                                            />
                                            <button type="button" onClick={() => removeVariant(index)} className="rounded bg-red-50 px-3 text-sm font-semibold text-red-600 hover:bg-red-100">Hapus</button>
                                        </div>
                                    ))}
                                </div>
                                {(errors.variants || errors['variants.0.size']) && (
                                    <p className="mt-1 text-sm text-red-500">{errors.variants || errors['variants.0.size']}</p>
                                )}
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="rounded bg-stone-100 px-4 py-2 text-sm text-stone-700 bg-stone-100 text-stone-500">Batal</button>
                                <button type="submit" disabled={processing} className="rounded bg-rose-400 px-4 py-2 text-sm text-white hover:bg-rose-500 disabled:opacity-50">{editMode ? 'Update' : 'Simpan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
