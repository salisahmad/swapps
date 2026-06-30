import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

interface StaffItem {
    id: number;
    name: string;
    email: string;
    mobile_phone: string | null;
    role: number;
    role_detail: string;
    created_at: string;
}

interface PageProps {
    staff: {
        data: StaffItem[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: {
        q?: string;
        role?: string;
    };
}

export default function Index({ staff, filters }: PageProps) {
    const { data, setData, get, post, put, delete: destroy, processing, reset } = useForm({
        q: filters.q || '',
        role: filters.role || '',
        // form fields
        name: '',
        email: '',
        mobile_phone: '',
        password: '',
        role: '3',
        staff_id: '',
    });

    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const submitFilter = (e: React.FormEvent) => {
        e.preventDefault();
        get(route('staff.index'));
    };

    const openCreate = () => {
        reset();
        setEditMode(false);
        setShowModal(true);
    };

    const openEdit = (s: StaffItem) => {
        setData({
            ...data,
            name: s.name,
            email: s.email,
            mobile_phone: s.mobile_phone || '',
            password: '',
            role: String(s.role),
            staff_id: String(s.id),
        });
        setEditMode(true);
        setShowModal(true);
    };

    const submitForm = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            name: data.name,
            email: data.email,
            mobile_phone: data.mobile_phone,
            role: data.role,
            ...(editMode ? {} : { password: data.password }),
        };
        if (editMode && data.staff_id) {
            put(route('staff.update', data.staff_id), payload as any);
        } else {
            post(route('staff.store'), payload as any);
        }
        setShowModal(false);
    };

    const handleDelete = (id: number) => {
        if (confirm('Yakin hapus staff ini?')) {
            destroy(route('staff.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Manajemen Staff
                    </h2>
                    <button
                        onClick={openCreate}
                        className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
                    >
                        + Tambah Staff
                    </button>
                </div>
            }
        >
            <Head title="Staff" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Filter */}
                    <div className="mb-4 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
                        <form onSubmit={submitFilter} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                            <input type="text" placeholder="Cari nama / email / telepon..." value={data.q} onChange={(e) => setData('q', e.target.value)} className="rounded-md border-gray-300 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" />
                            <select value={data.role} onChange={(e) => setData('role', e.target.value)} className="rounded-md border-gray-300 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                                <option value="">Semua Role</option>
                                <option value="2">Admin</option>
                                <option value="3">Staff</option>
                            </select>
                            <div className="flex gap-2">
                                <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-sm text-white">Filter</button>
                                <Link href={route('staff.index')} className="rounded bg-gray-200 px-4 py-2 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-300">Reset</Link>
                            </div>
                        </form>
                    </div>

                    {/* Table */}
                    <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800">
                        <div className="p-6">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead>
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Nama</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Email</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Telepon</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Role</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {staff.data.map((s) => (
                                        <tr key={s.id}>
                                            <td className="px-3 py-3">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</p>
                                            </td>
                                            <td className="px-3 py-3 text-sm text-gray-900 dark:text-gray-100">{s.email}</td>
                                            <td className="px-3 py-3 text-sm text-gray-900 dark:text-gray-100">{s.mobile_phone || '-'}</td>
                                            <td className="px-3 py-3 text-center">
                                                <span className={`rounded px-2 py-1 text-xs font-semibold ${s.role === 2 ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                    {s.role_detail}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-right text-sm">
                                                <button onClick={() => openEdit(s)} className="mr-2 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400">Edit</button>
                                                <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:text-red-900 dark:text-red-400">Hapus</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {staff.data.length === 0 && (
                                        <tr><td colSpan={5} className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">Belum ada staff.</td></tr>
                                    )}
                                </tbody>
                            </table>
                            <div className="mt-4 flex justify-end gap-1">
                                {staff.links.map((link, i) => link.url ? (
                                    <Link key={i} href={link.url} className={`rounded px-3 py-1 text-sm ${link.active ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                                ) : (
                                    <span key={i} className="rounded px-3 py-1 text-sm bg-gray-100 text-gray-400 dark:bg-gray-800" dangerouslySetInnerHTML={{ __html: link.label }} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{editMode ? 'Edit Staff' : 'Tambah Staff'}</h3>
                        <form onSubmit={submitForm} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nama</label>
                                <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telepon</label>
                                <input type="text" value={data.mobile_phone} onChange={(e) => setData('mobile_phone', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                                <select value={data.role} onChange={(e) => setData('role', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                                    <option value="2">Admin</option>
                                    <option value="3">Staff</option>
                                </select>
                            </div>
                            {!editMode && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                    <input type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" required minLength={6} />
                                </div>
                            )}
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="rounded bg-gray-200 px-4 py-2 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-300">Batal</button>
                                <button type="submit" disabled={processing} className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50">{editMode ? 'Update' : 'Simpan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
