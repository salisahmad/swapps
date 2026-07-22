import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        phone: '',
        email: '',
        address: '',
        event_date: '',
        event_type: 'wedding',
        event_location: '',
        notes: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('clients.store'));
    };

    const inputClass =
        'mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-rose-400 focus:ring-rose-400 border-stone-200 bg-white text-stone-800';
    const labelClass = 'block text-sm font-medium text-stone-700 text-stone-500';

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-stone-800">
                    Tambah Client Baru
                </h2>
            }
        >
            <Head title="Tambah Client" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <div className="bg-white p-6 shadow-sm dark:bg-stone-900 sm:rounded-lg">
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className={labelClass}>Nama Client</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className={inputClass}
                                    required
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className={labelClass}>Telepon / WhatsApp</label>
                                    <input
                                        type="text"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        className={inputClass}
                                        required
                                    />
                                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                                </div>
                                <div>
                                    <label className={labelClass}>Email</label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Alamat</label>
                                <textarea
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    className={inputClass}
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <label className={labelClass}>Tanggal Event</label>
                                    <input
                                        type="date"
                                        value={data.event_date}
                                        onChange={(e) => setData('event_date', e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Jenis Event</label>
                                    <select
                                        value={data.event_type}
                                        onChange={(e) => setData('event_type', e.target.value)}
                                        className={inputClass}
                                    >
                                        <option value="wedding">Wedding</option>
                                        <option value="engagement">Engagement</option>
                                        <option value="prewedding">Prewedding</option>
                                        <option value="party">Party</option>
                                        <option value="graduation">Graduation</option>
                                        <option value="photoshoot">Photoshoot</option>
                                        <option value="other">Lainnya</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Lokasi Event</label>
                                    <input
                                        type="text"
                                        value={data.event_location}
                                        onChange={(e) => setData('event_location', e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Catatan</label>
                                <textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    className={inputClass}
                                    rows={3}
                                />
                            </div>

                            <div className="flex items-center gap-4 pt-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded bg-rose-400 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                                >
                                    Simpan Client
                                </button>
                                <Link
                                    href={route('clients.index')}
                                    className="text-sm text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
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
