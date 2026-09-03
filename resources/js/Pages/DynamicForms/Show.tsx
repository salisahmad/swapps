import { Head, Link, router } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { formatShortDate } from '@/utils/date';
import { useState } from 'react';

interface DynamicFormItem {
    id: number;
    field_name: string;
    field_label: string;
    field_type: string;
    field_value: string | null;
    field_options: string | null;
    is_required: boolean;
}

interface EventData {
    id: number;
    uuid: string;
    name: string;
    date: string;
    time: string | null;
    location: string | null;
    package_description: string | null;
    total_amount: number;
    is_fully_paid: boolean;
    paid_status_name: string;
    paid_status_tone: string;
    order_type_name: string;
}

interface PageProps {
    event: EventData;
    dynamicForms: DynamicFormItem[];
}

export default function Show({ event, dynamicForms }: PageProps) {
    const [values, setValues] = useState<Record<number, string>>(() => {
        const initial: Record<number, string> = {};
        dynamicForms.forEach((f) => {
            if (f.field_value) initial[f.id] = f.field_value;
        });
        return initial;
    });
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (fieldId: number, value: string) => {
        setValues({ ...values, [fieldId]: value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrorMessage('');

        router.post(route('dynamic-forms.submit', event.uuid), { values }, {
            preserveScroll: true,
            onSuccess: () => {
                setSubmitted(true);
            },
            onError: () => {
                setErrorMessage('Gagal menyimpan. Coba lagi.');
            },
            onFinish: () => {
                setSaving(false);
            },
        });
    };

    const formatRupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
    const paidStatusClass = (tone?: string | null) => {
        if (tone === 'pending_paid') return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200';
        if (tone === 'paid') return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8 px-4 from-stone-900 to-stone-800">
            <Head title={`Berita Acara - ${event.name}`} />

            <div className="mx-auto max-w-2xl">
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="mb-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-stone-600 shadow-sm transition hover:bg-stone-50"
                >
                    Kembali
                </button>

                {/* Header */}
                <div className="mb-8 text-center">
                    <ApplicationLogo
                        variant="vertical"
                        className="mx-auto h-24 w-auto object-contain"
                    />
                    <p className="mt-2 text-lg text-stone-600 text-stone-500">Berita Acara</p>
                    <div className="mt-4 rounded-lg bg-white p-4 shadow-sm dark:bg-stone-900">
                        <p className="text-xl font-semibold text-stone-900 dark:text-white">{event.name}</p>
                        <p className="text-stone-600 dark:text-stone-400">{formatShortDate(event.date)} {event.time ? `• ${event.time}` : ''}</p>
                        <p className="mt-2 text-sm text-stone-500">{event.package_description || 'Paket Wedding'}</p>
                        <p className="mt-2 font-semibold text-rose-400 text-rose-400">{formatRupiah(event.total_amount)}</p>
                        <span className={`mt-2 inline-block rounded px-2 py-1 text-xs font-semibold ${paidStatusClass(event.paid_status_tone)}`}>
                            {event.paid_status_name}
                        </span>
                    </div>
                </div>

                {/* Form */}
                {submitted ? (
                    <div className="rounded-lg bg-green-50 p-6 text-center dark:bg-green-900/20">
                        <p className="text-xl font-semibold text-green-700 text-green-300">✅ Berita Acara Berhasil Disimpan!</p>
                        <p className="mt-2 text-green-600 dark:text-green-400">Terima kasih telah mengisi form ini.</p>
                        <p className="mt-4 text-sm text-stone-500">Anda dapat menutup halaman ini.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow-sm dark:bg-stone-900">
                        <h2 className="mb-6 text-lg font-semibold text-stone-900 dark:text-white">Isi Berita Acara</h2>
                        {errorMessage && (
                            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                                {errorMessage}
                            </p>
                        )}

                        <div className="space-y-4">
                            {dynamicForms.length === 0 && (
                                <p className="text-center text-stone-500">Belum ada form yang tersedia.</p>
                            )}
                            {dynamicForms.map((field) => (
                                <div key={field.id}>
                                    <label className="block text-sm font-medium text-stone-700 text-stone-500">
                                        {field.field_label} {field.is_required && <span className="text-red-500">*</span>}
                                    </label>
                                    {field.field_type === 'textarea' ? (
                                        <textarea
                                            value={values[field.id] || ''}
                                            onChange={(e) => handleChange(field.id, e.target.value)}
                                            className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-rose-400 focus:ring-rose-400 border-stone-200 bg-white text-stone-800"
                                            rows={3}
                                            required={field.is_required}
                                        />
                                    ) : field.field_type === 'select' && field.field_options ? (
                                        <select
                                            value={values[field.id] || ''}
                                            onChange={(e) => handleChange(field.id, e.target.value)}
                                            className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-rose-400 focus:ring-rose-400 border-stone-200 bg-white text-stone-800"
                                            required={field.is_required}
                                        >
                                            <option value="">Pilih...</option>
                                            {field.field_options.split(',').map((opt) => (
                                                <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type={field.field_type}
                                            value={values[field.id] || ''}
                                            onChange={(e) => handleChange(field.id, e.target.value)}
                                            className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-rose-400 focus:ring-rose-400 border-stone-200 bg-white text-stone-800"
                                            required={field.is_required}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-6">
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full rounded bg-rose-400 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                            >
                                {saving ? 'Menyimpan...' : 'Simpan Berita Acara'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
