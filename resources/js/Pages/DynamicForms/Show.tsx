import { Head, Link } from '@inertiajs/react';
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
    name: string;
    date: string;
    time: string | null;
    location: string | null;
    package_description: string | null;
    total_amount: number;
    is_fully_paid: boolean;
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

    const handleChange = (fieldId: number, value: string) => {
        setValues({ ...values, [fieldId]: value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In real implementation, send to backend
        fetch(route('dynamic-forms.submit', event.id), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' },
            body: JSON.stringify({ values }),
        }).then(() => {
            setSubmitted(true);
        }).catch(() => {
            alert('Gagal menyimpan. Coba lagi.');
        });
    };

    const formatRupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8 px-4 dark:from-gray-900 dark:to-gray-800">
            <Head title={`Berita Acara - ${event.name}`} />

            <div className="mx-auto max-w-2xl">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Shofi Wedding</h1>
                    <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Berita Acara</p>
                    <div className="mt-4 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
                        <p className="text-xl font-semibold text-gray-900 dark:text-white">{event.name}</p>
                        <p className="text-gray-600 dark:text-gray-400">{event.date} {event.time ? `• ${event.time}` : ''}</p>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{event.package_description || 'Paket Wedding'}</p>
                        <p className="mt-2 font-semibold text-indigo-600 dark:text-indigo-400">{formatRupiah(event.total_amount)}</p>
                        <span className={`mt-2 inline-block rounded px-2 py-1 text-xs font-semibold ${event.is_fully_paid ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}>
                            {event.is_fully_paid ? 'LUNAS' : 'BELUM LUNAS'}
                        </span>
                    </div>
                </div>

                {/* Form */}
                {submitted ? (
                    <div className="rounded-lg bg-green-50 p-6 text-center dark:bg-green-900/20">
                        <p className="text-xl font-semibold text-green-700 dark:text-green-300">✅ Berita Acara Berhasil Disimpan!</p>
                        <p className="mt-2 text-green-600 dark:text-green-400">Terima kasih telah mengisi form ini.</p>
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Anda dapat menutup halaman ini.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                        <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">Isi Berita Acara</h2>

                        <div className="space-y-4">
                            {dynamicForms.length === 0 && (
                                <p className="text-center text-gray-500 dark:text-gray-400">Belum ada form yang tersedia.</p>
                            )}
                            {dynamicForms.map((field) => (
                                <div key={field.id}>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {field.field_label} {field.is_required && <span className="text-red-500">*</span>}
                                    </label>
                                    {field.field_type === 'textarea' ? (
                                        <textarea
                                            value={values[field.id] || ''}
                                            onChange={(e) => handleChange(field.id, e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                            rows={3}
                                            required={field.is_required}
                                        />
                                    ) : field.field_type === 'select' && field.field_options ? (
                                        <select
                                            value={values[field.id] || ''}
                                            onChange={(e) => handleChange(field.id, e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
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
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                            required={field.is_required}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-6">
                            <button
                                type="submit"
                                className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                            >
                                Simpan Berita Acara
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
