import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
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
    photos: ItemPhoto[];
    rental_price: number;
    package_rental_price: number;
    total_stock: number;
    stock_summary: string;
    variants: ItemVariant[];
}

interface ItemPhoto {
    id: number;
    url: string;
    original_name: string | null;
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
    const { data, setData, get, put, delete: destroy, processing, reset, transform, errors, clearErrors, setError } = useForm({
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
        photos: [] as File[],
        remove_image: false,
        variants: [{ size: '', stock: 1 }] as ItemVariant[],
        item_id: '',
        _method: '',
    });

    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [detailItem, setDetailItem] = useState<Item | null>(null);
    const [existingPhotoPreviews, setExistingPhotoPreviews] = useState<Array<{ id: number | null; url: string; isLegacy?: boolean }>>([]);
    const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);

    const submitFilter = (e: React.FormEvent) => {
        e.preventDefault();
        transform((formData) => formData);
        get(route('items.index'));
    };

    const openCreate = () => {
        reset();
        clearErrors();
        transform((formData) => formData);
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
            photos: [],
            remove_image: false,
            variants: [{ size: '', stock: 1 }],
            item_id: '',
            _method: '',
        });
        setExistingPhotoPreviews([]);
        setNewPhotoPreviews([]);
        setEditMode(false);
        setShowModal(true);
    };

    const openEdit = (item: Item) => {
        clearErrors();
        transform((formData) => formData);
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
            photos: [],
            remove_image: false,
            variants: item.variants.length > 0 ? item.variants.map((variant) => ({
                id: variant.id,
                size: variant.size,
                stock: variant.stock,
            })) : [{ size: '', stock: 1 }],
            item_id: String(item.id),
            _method: '',
        });
        setExistingPhotoPreviews(
            item.photos && item.photos.length > 0
                ? item.photos.map((photo) => ({ id: photo.id, url: photo.url }))
                : (item.image_url ? [{ id: null, url: item.image_url, isLegacy: true }] : [])
        );
        setNewPhotoPreviews([]);
        setEditMode(true);
        setShowModal(true);
    };

    const submitForm = (e: React.FormEvent) => {
        e.preventDefault();

        clearErrors();

        const payload: Record<string, any> = {
            code: data.code,
            name: data.name,
            description: data.description,
            item_type_id: data.item_type_id_form || '',
            premium_level: data.form_premium_level,
            rental_price: data.rental_price || '0',
            package_rental_price: data.package_rental_price || '0',
            is_rentable: data.is_rentable_form ? '1' : '0',
            photos: data.photos,
            remove_image: data.remove_image ? '1' : '0',
            variants: data.variants.filter((variant) => variant.size.trim() !== ''),
        };

        if (editMode && data.item_id) {
            router.post(route('items.update', data.item_id), {
                ...payload,
                _method: 'put',
            }, {
                forceFormData: true,
                preserveScroll: true,
                onError: (formErrors) => setError(formErrors),
                onSuccess: () => setShowModal(false),
            });
        } else {
            router.post(route('items.store'), payload, {
                forceFormData: true,
                preserveScroll: true,
                onError: (formErrors) => setError(formErrors),
                onSuccess: () => setShowModal(false),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Yakin hapus item ini?')) {
            destroy(route('items.destroy', id), {
                preserveScroll: true,
                onSuccess: () => setShowModal(false),
            });
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

    const onlyDigits = (value: string) => value.replace(/\D/g, '');
    const formatNumberInput = (value: string) => onlyDigits(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const formatRupiah = (n: number) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

    const handlePhotosChange = (files: FileList | null) => {
        const selectedFiles = Array.from(files || []);
        setData('photos', selectedFiles);
        setData('remove_image', false);
        setNewPhotoPreviews(selectedFiles.map((file) => URL.createObjectURL(file)));
    };

    const removeNewPhoto = (index: number) => {
        setData('photos', data.photos.filter((_, photoIndex) => photoIndex !== index));
        setNewPhotoPreviews(newPhotoPreviews.filter((_, photoIndex) => photoIndex !== index));
    };

    const removeExistingPhoto = (photo: { id: number | null; url: string; isLegacy?: boolean }) => {
        if (!confirm('Hapus foto katalog ini?')) {
            return;
        }

        if (photo.isLegacy) {
            setData('remove_image', true);
            setExistingPhotoPreviews(existingPhotoPreviews.filter((preview) => preview.url !== photo.url));
            return;
        }

        if (!data.item_id || !photo.id) {
            return;
        }

        router.delete(route('items.photos.destroy', [data.item_id, photo.id]), {
            preserveScroll: true,
            onSuccess: () => {
                setExistingPhotoPreviews(existingPhotoPreviews.filter((preview) => preview.id !== photo.id));
            },
        });
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
                    <div className="mb-4 rounded-lg bg-white p-4 shadow-sm dark:bg-stone-900">
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
                                        <tr key={item.id} onClick={() => setDetailItem(item)} className="cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/60">
                                            <td className="px-3 py-3">
                                                <div className="flex items-center gap-3">
                                                    {item.image_url ? (
                                                        <img src={item.image_url} alt={item.name} className="h-12 w-12 rounded-lg object-cover" />
                                                    ) : (
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-stone-100 text-xs text-stone-400">No Foto</div>
                                                    )}
                                                    <span className="text-sm font-mono text-stone-900 dark:text-stone-100">{item.code}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <p className="text-sm font-medium text-stone-900 dark:text-white">{item.name}</p>
                                                <p className="text-xs text-stone-500">{item.description || '-'}</p>
                                            </td>
                                            <td className="px-3 py-3 text-sm text-stone-900 dark:text-stone-100">{item.type?.name || '-'}</td>
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
                                                <p className={`mx-auto inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${
                                                    item.is_rentable
                                                        ? 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300'
                                                        : 'border-stone-200 bg-stone-50 text-stone-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300'
                                                }`}>
                                                    {item.is_rentable ? 'Disewakan' : 'Tidak disewakan'}
                                                </p>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSoldToggle(item);
                                                    }}
                                                    className={`mt-1 rounded-full border px-2.5 py-1 text-xs font-bold ${
                                                        item.is_sold
                                                            ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300'
                                                            : 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300'
                                                    }`}
                                                >
                                                    {item.is_sold ? 'Sold' : 'Tersedia'}
                                                </button>
                                            </td>
                                            <td className="px-3 py-3 text-right text-sm">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEdit(item);
                                                    }}
                                                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border-2 border-rose-300 text-rose-500 transition hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600"
                                                    title="Edit item"
                                                    aria-label={`Edit ${item.name}`}
                                                >
                                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                        <path d="M12 20h9" />
                                                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="mt-4 flex justify-end gap-1">
                                {items.links.map((link, i) => link.url ? (
                                    <Link key={i} href={link.url} className={`rounded px-3 py-1 text-sm ${link.active ? 'bg-rose-400 text-white' : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                                ) : (
                                    <span key={i} className="rounded px-3 py-1 text-sm bg-stone-100 text-stone-400 dark:bg-stone-900" dangerouslySetInnerHTML={{ __html: link.label }} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {detailItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-stone-900">
                        <div className="grid max-h-[92vh] overflow-y-auto lg:grid-cols-[1.05fr_0.95fr]">
                            <div className="bg-stone-100 p-4 dark:bg-stone-950">
                                {(() => {
                                    const photoUrls = detailItem.photos && detailItem.photos.length > 0
                                        ? detailItem.photos.map((photo) => photo.url)
                                        : (detailItem.image_url ? [detailItem.image_url] : []);

                                    return (
                                        <div className="space-y-3">
                                            {photoUrls[0] ? (
                                                <img src={photoUrls[0]} alt={detailItem.name} className="h-80 w-full rounded-lg object-cover sm:h-[460px]" />
                                            ) : (
                                                <div className="flex h-80 w-full items-center justify-center rounded-lg bg-white text-sm text-stone-400 dark:bg-stone-900 sm:h-[460px]">Belum ada foto</div>
                                            )}
                                            {photoUrls.length > 1 && (
                                                <div className="grid grid-cols-4 gap-2">
                                                    {photoUrls.slice(1, 5).map((url) => (
                                                        <img key={url} src={url} alt={detailItem.name} className="h-20 w-full rounded-md object-cover" />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="flex flex-col p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="font-mono text-sm font-semibold uppercase tracking-wide text-rose-500">{detailItem.code}</p>
                                        <h3 className="mt-1 text-2xl font-bold text-stone-950 dark:text-white">{detailItem.name}</h3>
                                        <p className="mt-2 leading-relaxed text-stone-500">{detailItem.description || 'Belum ada deskripsi item.'}</p>
                                    </div>
                                    <button type="button" onClick={() => setDetailItem(null)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-lg font-semibold text-stone-500 hover:bg-stone-200 dark:bg-stone-800">
                                        x
                                    </button>
                                </div>

                                <div className="mt-5 flex flex-wrap gap-2">
                                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${levelBadgeClass(detailItem.premium_level)}`}>{detailItem.premium_level_name}</span>
                                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${detailItem.is_sold ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                        {detailItem.is_sold ? 'Terjual' : 'Tersedia'}
                                    </span>
                                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${detailItem.is_rentable ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                                        {detailItem.is_rentable ? 'Disewakan' : 'Tidak disewakan'}
                                    </span>
                                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                                        {detailItem.type?.name || 'Tanpa kategori'}
                                    </span>
                                </div>

                                <div className="mt-6 grid grid-cols-2 gap-3">
                                    <div className="rounded-lg border border-rose-100 bg-rose-50 p-4">
                                        <p className="text-xs font-semibold uppercase text-rose-400">Harga Sewa</p>
                                        <p className="mt-1 text-lg font-bold text-rose-700">{formatRupiah(detailItem.rental_price)}</p>
                                    </div>
                                    <div className="rounded-lg border border-violet-100 bg-violet-50 p-4">
                                        <p className="text-xs font-semibold uppercase text-violet-400">Harga Paket</p>
                                        <p className="mt-1 text-lg font-bold text-violet-700">{formatRupiah(detailItem.package_rental_price)}</p>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-bold text-stone-800 dark:text-stone-100">Ukuran & Stok</p>
                                        <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-bold text-white">Total {detailItem.total_stock}</span>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {detailItem.variants.length > 0 ? detailItem.variants.map((variant) => (
                                            <span key={`${variant.id || variant.size}-${variant.stock}`} className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 shadow-sm dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100">
                                                {variant.size} <span className="text-stone-400">/</span> {variant.stock}
                                            </span>
                                        )) : (
                                            <span className="text-sm text-stone-400">Belum ada ukuran dan stok.</span>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-auto flex justify-end pt-8">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDetailItem(null);
                                            openEdit(detailItem);
                                        }}
                                        className="rounded bg-rose-400 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-500"
                                    >
                                        Edit Item
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-stone-900">
                        <h3 className="mb-4 text-lg font-semibold text-stone-900 dark:text-white">
                            {editMode ? 'Edit Item' : 'Tambah Item'}
                        </h3>
                        <form onSubmit={submitForm} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 text-stone-500">Kode</label>
                                    <input type="text" value={data.code} onChange={(e) => setData('code', e.target.value)} className="mt-1 block w-full rounded-md border-stone-300 bg-white text-stone-800" required />
                                    {errors.code && <p className="mt-1 text-sm text-red-500">{errors.code}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 text-stone-500">Kategori</label>
                                    <select value={data.item_type_id_form} onChange={(e) => setData('item_type_id_form', e.target.value)} className="mt-1 block w-full rounded-md border-stone-300 bg-white text-stone-800">
                                        <option value="">Pilih...</option>
                                        {itemTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                    {errors.item_type_id && <p className="mt-1 text-sm text-red-500">{errors.item_type_id}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 text-stone-500">Nama Item</label>
                                <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1 block w-full rounded-md border-stone-300 bg-white text-stone-800" required />
                                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 text-stone-500">Deskripsi</label>
                                <textarea value={data.description} onChange={(e) => setData('description', e.target.value)} className="mt-1 block w-full rounded-md border-stone-300 bg-white text-stone-800" rows={2} />
                                {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
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
                                        type="text"
                                        inputMode="numeric"
                                        value={formatNumberInput(data.rental_price)}
                                        onChange={(e) => setData('rental_price', onlyDigits(e.target.value))}
                                        className="mt-1 block w-full rounded-md border-stone-300 bg-white text-stone-800"
                                        placeholder="0"
                                    />
                                    {errors.rental_price && <p className="mt-1 text-sm text-red-500">{errors.rental_price}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 text-stone-500">Harga Sewa Paket</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={formatNumberInput(data.package_rental_price)}
                                        onChange={(e) => setData('package_rental_price', onlyDigits(e.target.value))}
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
                                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                                    {existingPhotoPreviews.map((photo) => (
                                        <div key={`${photo.id || 'legacy'}-${photo.url}`} className="relative">
                                            <img src={photo.url} alt="Foto katalog" className="h-24 w-full rounded-xl object-cover" />
                                            <button type="button" onClick={() => removeExistingPhoto(photo)} className="absolute -right-2 -top-2 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">x</button>
                                        </div>
                                    ))}
                                    {newPhotoPreviews.map((url, index) => (
                                        <div key={url} className="relative">
                                            <img src={url} alt="Preview foto katalog" className="h-24 w-full rounded-xl object-cover" />
                                            <button type="button" onClick={() => removeNewPhoto(index)} className="absolute -right-2 -top-2 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">x</button>
                                            <span className="absolute bottom-1 left-1 rounded bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">Baru</span>
                                        </div>
                                    ))}
                                    {existingPhotoPreviews.length === 0 && newPhotoPreviews.length === 0 && (
                                        <div className="flex h-24 items-center justify-center rounded-xl bg-stone-100 text-xs text-stone-400">Belum ada foto</div>
                                    )}
                                    <label className="cursor-pointer rounded bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-200">
                                        Pilih Foto
                                        <input type="file" accept="image/*" multiple onChange={(e) => handlePhotosChange(e.target.files)} className="hidden" />
                                    </label>
                                </div>
                                <p className="mt-1 text-xs text-stone-500">Bisa pilih beberapa foto sekaligus. Maksimal 20 foto per upload.</p>
                                {(errors.photos || (errors as Record<string, string>)['photos.0']) && (
                                    <p className="mt-1 text-sm text-red-500">{errors.photos || (errors as Record<string, string>)['photos.0']}</p>
                                )}
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
                                <div className="mr-auto">
                                    {editMode && data.item_id && (
                                        <button type="button" onClick={() => handleDelete(Number(data.item_id))} className="rounded bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100">
                                            Hapus Item
                                        </button>
                                    )}
                                </div>
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
