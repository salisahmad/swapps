import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface DynamicFormTemplateItem {
    id: number;
    field_name: string;
    field_label: string;
    field_type: string;
    field_options: string | null;
    is_required: boolean;
}

interface PageProps {
    fields: DynamicFormTemplateItem[];
}

export default function Template({ fields: initialFields }: PageProps) {
    const [fields, setFields] = useState<DynamicFormTemplateItem[]>(initialFields);
    const [newField, setNewField] = useState({
        field_label: '',
        field_type: 'text',
        field_options: '',
        is_required: false,
    });
    const [showAdd, setShowAdd] = useState(false);
    const [saving, setSaving] = useState(false);

    const makeFieldName = (label: string) => label
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');

    const addField = () => {
        if (!newField.field_label.trim()) return;

        setFields([...fields, {
            id: Date.now(),
            field_name: makeFieldName(newField.field_label),
            field_label: newField.field_label,
            field_type: newField.field_type,
            field_options: newField.field_options || null,
            is_required: newField.is_required,
        }]);
        setNewField({ field_label: '', field_type: 'text', field_options: '', is_required: false });
        setShowAdd(false);
    };

    const removeField = (index: number) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    const moveField = (index: number, direction: number) => {
        const nextFields = [...fields];
        const target = index + direction;

        if (target >= 0 && target < nextFields.length) {
            [nextFields[index], nextFields[target]] = [nextFields[target], nextFields[index]];
            setFields(nextFields);
        }
    };

    const saveForm = () => {
        setSaving(true);
        router.post(route('dynamic-form-templates.update'), { fields } as Record<string, any>, {
            preserveScroll: true,
            onSuccess: () => {
                alert('Template berita acara berhasil disimpan.');
            },
            onError: () => {
                alert('Gagal menyimpan template.');
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
                    <h2 className="page-title">Setup Berita Acara</h2>
                    <div className="flex gap-2">
                        <button onClick={() => setShowAdd(true)} className="btn-primary text-sm py-2 px-3">
                            + Field
                        </button>
                        <Link href={route('dashboard')} className="btn-secondary text-sm py-2 px-3">
                            Kembali
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Setup Berita Acara" />

            <div className="mx-auto max-w-4xl space-y-4">
                <div className="card p-4">
                    <p className="text-sm text-stone-500">
                        Template ini dipakai untuk client yang belum punya berita acara. Client yang sudah pernah memakai form lama tetap memakai snapshot lamanya.
                    </p>
                </div>

                <div className="card p-4">
                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-3 rounded-lg border border-stone-200 p-3">
                                <div className="flex flex-col gap-1">
                                    <button onClick={() => moveField(index, -1)} disabled={index === 0} className="text-stone-400 hover:text-stone-600 disabled:opacity-30">▲</button>
                                    <button onClick={() => moveField(index, 1)} disabled={index === fields.length - 1} className="text-stone-400 hover:text-stone-600 disabled:opacity-30">▼</button>
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-medium text-stone-900">
                                            {field.field_label} {field.is_required && <span className="text-red-500">*</span>}
                                        </p>
                                        <span className="rounded bg-stone-100 px-2 py-0.5 text-xs text-stone-600">{field.field_type}</span>
                                    </div>
                                    <p className="text-xs text-stone-500">{field.field_name}</p>
                                </div>
                                <button onClick={() => removeField(index)} className="text-red-500 hover:text-red-700">Hapus</button>
                            </div>
                        ))}
                    </div>

                    {fields.length === 0 && (
                        <p className="py-8 text-center text-stone-500">Belum ada field. Klik "+ Field" untuk mulai.</p>
                    )}

                    <div className="mt-6 flex justify-end">
                        <button onClick={saveForm} disabled={saving} className="btn-primary px-6 py-2 disabled:opacity-50">
                            {saving ? 'Menyimpan...' : 'Simpan Template'}
                        </button>
                    </div>
                </div>
            </div>

            {showAdd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <h3 className="mb-4 text-lg font-semibold text-stone-900">Tambah Field</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700">Label Field</label>
                                <input type="text" value={newField.field_label} onChange={(e) => setNewField({ ...newField, field_label: e.target.value })} className="input-field mt-1 w-full" placeholder="Contoh: Nama Pengantin" autoFocus />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700">Tipe Field</label>
                                <select value={newField.field_type} onChange={(e) => setNewField({ ...newField, field_type: e.target.value })} className="input-field mt-1 w-full">
                                    <option value="text">Text</option>
                                    <option value="textarea">Textarea</option>
                                    <option value="number">Number</option>
                                    <option value="date">Date</option>
                                    <option value="time">Time</option>
                                    <option value="select">Select</option>
                                </select>
                            </div>
                            {newField.field_type === 'select' && (
                                <div>
                                    <label className="block text-sm font-medium text-stone-700">Opsi, pisahkan dengan koma</label>
                                    <textarea value={newField.field_options} onChange={(e) => setNewField({ ...newField, field_options: e.target.value })} className="input-field mt-1 w-full" placeholder="Ya, Tidak" rows={2} />
                                </div>
                            )}
                            <label className="flex items-center gap-2 text-sm text-stone-700">
                                <input type="checkbox" checked={newField.is_required} onChange={(e) => setNewField({ ...newField, is_required: e.target.checked })} className="rounded border-stone-300 text-rose-400" />
                                Wajib diisi
                            </label>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setShowAdd(false)} className="btn-secondary py-2 px-4">Batal</button>
                                <button onClick={addField} className="btn-primary py-2 px-4">Tambah</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
