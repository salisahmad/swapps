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
    is_premium: boolean;
}

interface PageProps {
    items: {
        data: Item[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    itemTypes: ItemType[];
    filters: {
        q?: string;
        item_type_id?: string;
        is_sold?: string;
        is_premium?: string;
    };
}

export default function Index({ items, itemTypes, filters }: PageProps) {
    const { data, setData, get, post, put, delete: destroy, processing, reset } = useForm({
        q: filters.q || '',
        item_type_id: filters.item_type_id || '',
        is_sold: filters.is_sold || '',
        is_premium: filters.is_premium || '',
        // form
        code: '',
        name: '',
        description: '',
        item_type_id_form: '',
        is_premium: false,
        item_id: '',
    });

    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const submitFilter = (e: React.FormEvent) => {
        e.preventDefault();
        get(route('items.index'));
    };

    const openCreate = () => {
        reset();
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
            is_premium: item.is_premium,
            item_id: String(item.id),
        });
        setEditMode(true);
        setShowModal(true);
    };

    const submitForm = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            code: data.code,
            name: data.name,
            description: data.description,
            item_type_id: data.item_type_id_form || null,
            is_premium: data.is_premium,
        };
        if (editMode && data.item_id) {
            put(route('items.update', data.item_id), payload as any);
        } else {
            post(route('items.store'), payload as any);
        }
        setShowModal(false);
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
            is_premium: item.is_premium,
            is_sold: !item.is_sold,
        } as any);
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
                        <form onSubmit={submitFilter} className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                            <input type="text" placeholder="Cari nama / kode..." value={data.q} onChange={(e) => setData('q', e.target.value)} className="rounded-md border-stone-300 text-sm border-stone-200 bg-white text-stone-800" />
                            <select value={data.item_type_id} onChange={(e) => setData('item_type_id', e.target.value)} className="rounded-md border-stone-300 text-sm border-stone-200 bg-white text-stone-800">
                                <option value="">Semua Kategori</option>
                                {itemTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            <select value={data.is_sold} onChange={(e) => setData('is_sold', e.target.value)} className="rounded-md border-stone-300 text-sm border-stone-200 bg-white text-stone-800">
                                <option value="">Semua Status</option>
                                <option value="0">Tersedia</option>
                                <option value="1">Terjual</option>
                            </select>
                            <select value={data.is_premium} onChange={(e) => setData('is_premium', e.target.value)} className="rounded-md border-stone-300 text-sm border-stone-200 bg-white text-stone-800">
                                <option value="">Semua</option>
                                <option value="1">Premium</option>
                                <option value="0">Reguler</option>
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
                                        <th className="px-3 py-2 text-center text-xs font-medium uppercase text-stone-500">Premium</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium uppercase text-stone-500">Status</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium uppercase text-stone-500">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {items.data.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-3 py-3 text-sm font-mono text-stone-900 text-stone-100">{item.code}</td>
                                            <td className="px-3 py-3">
                                                <p className="text-sm font-medium text-stone-900 text-white">{item.name}</p>
                                                <p className="text-xs text-stone-500">{item.description || '-'}</p>
                                            </td>
                                            <td className="px-3 py-3 text-sm text-stone-900 text-stone-100">{item.type?.name || '-'}</td>
                                            <td className="px-3 py-3 text-center">
                                                {item.is_premium && (
                                                    <span className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800 bg-amber-900 text-amber-300">Premium</span>
                                                )}
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
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={data.is_premium} onChange={(e) => setData('is_premium', e.target.checked)} className="rounded border-stone-300 text-rose-400 focus:ring-rose-400" />
                                <label className="text-sm text-stone-700 text-stone-500">Item Premium</label>
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
