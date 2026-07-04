import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

interface Settings {
    provider: string;
    api_url: string;
    sender_number: string | null;
    test_phone: string | null;
    test_message: string | null;
    has_api_token: boolean;
}

interface PageProps {
    settings: Settings;
    flash?: { success?: string; error?: string };
    errors?: Record<string, string>;
}

export default function Settings({ settings, flash, errors = {} }: PageProps) {
    const { data, setData, patch, post, processing } = useForm({
        provider: settings.provider || 'fonnte',
        api_url: settings.api_url || 'https://api.fonnte.com/send',
        api_token: '',
        sender_number: settings.sender_number || '',
        test_phone: settings.test_phone || '',
        test_message:
            settings.test_message ||
            'Halo, ini test konfirmasi dari Shofi Wedding.\nJika pesan ini masuk, koneksi WhatsApp CS sudah siap.',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('whatsapp.update'), { preserveScroll: true });
    };

    const test = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('whatsapp.test'), { preserveScroll: true });
    };

    const inputClass = 'mt-1 block w-full rounded-md border border-stone-200 bg-white text-stone-800 shadow-sm focus:border-rose-400 focus:ring-rose-400';
    const labelClass = 'block text-sm font-medium text-stone-700';
    const errorClass = 'mt-1 text-xs text-red-600';

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-stone-800">
                    WhatsApp Tester
                </h2>
            }
        >
            <Head title="WhatsApp Tester" />

            <div className="py-6">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="mb-4 rounded bg-green-50 p-4 text-green-800">
                            {flash.success}
                        </div>
                    )}
                    {flash?.error && (
                        <div className="mb-4 rounded bg-red-50 p-4 text-red-800">
                            {flash.error}
                        </div>
                    )}

                    <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
                        <h3 className="mb-2 text-lg font-semibold text-stone-900">Setup WhatsApp API</h3>
                        <p className="text-sm leading-6 text-stone-600">
                            Tester ini memakai Fonnte. Nomor pengirim mengikuti nomor WhatsApp bisnis CS yang
                            terhubung pada token provider, jadi isi token dari akun/device WA bisnis CS.
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-6 rounded-lg bg-white p-6 shadow-sm">
                        <div>
                            <label className={labelClass}>Provider</label>
                            <select
                                value={data.provider}
                                onChange={(e) => setData('provider', e.target.value)}
                                className={inputClass}
                            >
                                <option value="fonnte">Fonnte</option>
                            </select>
                            {errors.provider && <p className={errorClass}>{errors.provider}</p>}
                        </div>

                        <div>
                            <label className={labelClass}>API URL</label>
                            <input
                                type="url"
                                value={data.api_url}
                                onChange={(e) => setData('api_url', e.target.value)}
                                className={inputClass}
                                placeholder="https://api.fonnte.com/send"
                            />
                            {errors.api_url && <p className={errorClass}>{errors.api_url}</p>}
                        </div>

                        <div>
                            <label className={labelClass}>API Token</label>
                            <input
                                type="password"
                                value={data.api_token}
                                onChange={(e) => setData('api_token', e.target.value)}
                                className={inputClass}
                                placeholder={settings.has_api_token ? 'Token sudah tersimpan. Isi hanya jika ingin mengganti.' : 'Paste token Fonnte di sini'}
                                autoComplete="off"
                            />
                            <p className="mt-1 text-xs text-stone-500">
                                {settings.has_api_token ? 'Token sudah tersimpan.' : 'Token belum disimpan.'}
                            </p>
                            {errors.api_token && <p className={errorClass}>{errors.api_token}</p>}
                        </div>

                        <div>
                            <label className={labelClass}>Nomor WhatsApp Bisnis CS</label>
                            <input
                                type="text"
                                value={data.sender_number}
                                onChange={(e) => setData('sender_number', e.target.value)}
                                className={inputClass}
                                placeholder="62812xxxxxxx"
                            />
                            <p className="mt-1 text-xs text-stone-500">
                                Ini hanya catatan. Nomor pengirim asli tetap ditentukan oleh token/device provider.
                            </p>
                            {errors.sender_number && <p className={errorClass}>{errors.sender_number}</p>}
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded bg-rose-400 px-6 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                            >
                                Simpan Pengaturan
                            </button>
                        </div>
                    </form>

                    <form onSubmit={test} className="mt-6 space-y-6 rounded-lg bg-white p-6 shadow-sm">
                        <div>
                            <h3 className="text-lg font-semibold text-stone-900">Kirim Test Konfirmasi</h3>
                            <p className="mt-1 text-sm text-stone-600">
                                Isi nomor tujuan milik kamu, lalu tekan kirim test.
                            </p>
                        </div>

                        <div>
                            <label className={labelClass}>Nomor Tujuan Test</label>
                            <input
                                type="text"
                                value={data.test_phone}
                                onChange={(e) => setData('test_phone', e.target.value)}
                                className={inputClass}
                                placeholder="0812xxxxxxx atau 62812xxxxxxx"
                            />
                            {errors.test_phone && <p className={errorClass}>{errors.test_phone}</p>}
                        </div>

                        <div>
                            <label className={labelClass}>Isi Pesan</label>
                            <textarea
                                value={data.test_message}
                                onChange={(e) => setData('test_message', e.target.value)}
                                className={`${inputClass} min-h-32`}
                                rows={5}
                            />
                            {errors.test_message && <p className={errorClass}>{errors.test_message}</p>}
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                            >
                                Kirim Test WhatsApp
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
