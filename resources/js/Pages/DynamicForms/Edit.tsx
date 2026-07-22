import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface EventItem {
    id: number;
    uuid: string;
    name: string;
    date: string;
    dynamic_forms: DynamicFormItem[];
}

interface DynamicFormItem {
    id: number;
    field_name: string;
    field_label: string;
    field_type: string;
    field_value: string | null;
    field_options: string | null;
    is_required: boolean;
}

interface PageProps {
    event: EventItem;
}

export default function Edit({ event }: PageProps) {
    const [fields, setFields] = useState<DynamicFormItem[]>(event.dynamic_forms);
    const [newField, setNewField] = useState({
        field_label: '',
        field_type: 'text',
        field_options: '',
        is_required: false,
    });
    const [showAdd, setShowAdd] = useState(false);
    const [saving, setSaving] = useState(false);

    const addField = () => {
        if (!newField.field_label.trim()) return;
        const fieldName = newField.field_label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        setFields([...fields, {
            id: Date.now(), // temp id
            field_name: fieldName,
            field_label: newField.field_label,
            field_type: newField.field_type,
            field_options: newField.field_options || null,
            field_value: null,
            is_required: newField.is_required,
        }]);
        setNewField({ field_label: '', field_type: 'text', field_options: '', is_required: false });
        setShowAdd(false);
    };

    const removeField = (index: number) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    const moveField = (index: number, direction: number) => {
        const newFields = [...fields];
        const target = index + direction;
        if (target >= 0 && target < newFields.length) {
            [newFields[index], newFields[target]] = [newFields[target], newFields[index]];
            setFields(newFields);
        }
    };

    const saveForm = () => {
        setSaving(true);
        router.post(route('dynamic-forms.update', event.uuid), { fields } as Record<string, any>, {
            preserveScroll: true,
            onSuccess: () => {
                alert('Form berhasil disimpan!');
            },
            onError: () => {
                alert('Gagal menyimpan form');
            },
            onFinish: () => {
                setSaving(false);
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-stone-800">
                        Berita Acara: {event.name}
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowAdd(true)}
                            className="rounded bg-rose-400 px-4 py-2 text-sm text-white hover:bg-rose-500"
                        >
                            + Tambah Field
                        </button>
                        <Link
                            href={route('events.show', event.uuid)}
                            className="rounded bg-stone-100 px-4 py-2 text-sm text-stone-700 bg-stone-100 text-stone-500"
                        >
                            Kembali
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Berita Acara - ${event.name}`} />

            <div className="py-6">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="bg-white p-6 shadow-sm dark:bg-stone-900 sm:rounded-lg">
                        <p className="mb-4 text-sm text-stone-500">
                            Susun form berita acara untuk client. Client akan mengisi form ini.
                        </p>

                        <div className="space-y-3">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex items-center gap-3 rounded-lg border border-stone-200 p-3 border-stone-200">
                                    <div className="flex flex-col gap-1">
                                        <button onClick={() => moveField(index, -1)} disabled={index === 0} className="text-stone-400 hover:text-stone-600 disabled:opacity-30">▲</button>
                                        <button onClick={() => moveField(index, 1)} disabled={index === fields.length - 1} className="text-stone-400 hover:text-stone-600 disabled:opacity-30">▼</button>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm font-medium text-stone-900 dark:text-white">
                                                {field.field_label} {field.is_required && <span className="text-red-500">*</span>}
                                            </label>
                                            <span className="rounded bg-stone-100 px-2 py-0.5 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-400">{field.field_type}</span>
                                        </div>
                                        <p className="text-xs text-stone-500">{field.field_name}</p>
                                    </div>
                                    <button onClick={() => removeField(index)} className="text-red-500 hover:text-red-700">✕</button>
                                </div>
                            ))}
                        </div>

                        {fields.length === 0 && (
                            <p className="text-center text-stone-500 py-8">Belum ada field. Klik "Tambah Field" untuk mulai.</p>
                        )}

                        {showAdd && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                                <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-stone-900">
                                    <h3 className="mb-4 text-lg font-semibold text-stone-900 dark:text-white">Tambah Field</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 text-stone-500">Label Field</label>
                                            <input type="text" value={newField.field_label} onChange={(e) => setNewField({ ...newField, field_label: e.target.value })} className="mt-1 block w-full rounded-md border-stone-300 bg-white text-stone-800" placeholder="Contoh: Nama Pengantin" autoFocus />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 text-stone-500">Tipe Field</label>
                                            <select value={newField.field_type} onChange={(e) => setNewField({ ...newField, field_type: e.target.value })} className="mt-1 block w-full rounded-md border-stone-300 bg-white text-stone-800">
                                                <option value="text">Text</option>
                                                <option value="textarea">Textarea</option>
                                                <option value="number">Number</option>
                                                <option value="date">Date</option>
                                                <option value="time">Time</option>
                                                <option value="select">Select (Dropdown)</option>
                                            </select>
                                        </div>
                                        {newField.field_type === 'select' && (
                                            <div>
                                                <label className="block text-sm font-medium text-stone-700 text-stone-500">Opsi (pisah dengan koma)</label>
                                                <textarea value={newField.field_options} onChange={(e) => setNewField({ ...newField, field_options: e.target.value })} className="mt-1 block w-full rounded-md border-stone-300 bg-white text-stone-800" placeholder="Ya, Tidak, Mungkin" rows={2} />
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={newField.is_required} onChange={(e) => setNewField({ ...newField, is_required: e.target.checked })} className="rounded border-stone-300 text-rose-400" />
                                            <label className="text-sm text-stone-700 text-stone-500">Wajib diisi</label>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setShowAdd(false)} className="rounded bg-stone-100 px-4 py-2 text-sm text-stone-700 bg-stone-100 text-stone-500">Batal</button>
                                            <button onClick={addField} className="rounded bg-rose-400 px-4 py-2 text-sm text-white hover:bg-rose-500">Tambah</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end">
                            <button onClick={saveForm} disabled={saving} className="rounded bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                                {saving ? 'Menyimpan...' : 'Simpan Form'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
