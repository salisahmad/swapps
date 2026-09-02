import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

interface ItemType {
    name: string;
}

interface Item {
    id: number;
    name: string;
    code: string;
    type?: ItemType;
}

interface Schedule {
    id: number;
    type_name: string;
    schedule_from: string;
    schedule_to: string | null;
    description: string | null;
}

interface PaymentItem {
    id: number;
    is_expense: number;
    type_name: string;
    payment_at: string | null;
    payment_type_name: string;
    amount: number;
    description: string | null;
    status: number;
    status_name: string;
}

interface EventPhoto {
    id: number;
    path: string;
    url: string;
    original_name: string | null;
}

interface EventAdditionalCost {
    id: number;
    type: string;
    total: number;
    notes: string | null;
}

interface ClientActivityLog {
    id: number;
    type: string;
    message: string;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
    created_at: string;
    user: { id: number; name: string } | null;
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

interface Event {
    id: number;
    uuid: string;
    name: string;
    mobile_phone: string;
    date: string;
    time: string | null;
    address: string | null;
    location: string | null;
    package_description: string | null;
    total_amount: number | null;
    discount_amount: number | null;
    additional_cost_total: number | null;
    grand_total: number | null;
    is_fully_paid: boolean | null;
    order_type_name: string;
    items: Item[];
    schedules: Schedule[];
    payments: PaymentItem[];
    photos: EventPhoto[];
    additional_costs: EventAdditionalCost[];
    dynamic_forms: DynamicFormItem[];
    activity_logs?: ClientActivityLog[];
}

interface PageProps {
    event: Event;
    authUser: {
        id: number;
        role: number;
        is_admin: boolean;
        is_limited_staff: boolean;
    };
}

type ClientTab = 'info' | 'payment' | 'schedule';

export default function Show({ event, authUser }: PageProps) {
    const initialTab = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'schedule'
        ? 'schedule'
        : 'info';
    const [activeTab, setActiveTab] = useState<ClientTab>(initialTab);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
    const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
    const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const formatRupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
    const formatDate = (date?: string | null) => formatIndonesianDate(date);
    const formatDateTime = (date?: string | null) => formatIndonesianDateTime(date);
    const canSeeFinancials = !authUser.is_limited_staff;

    const totalPaid = event.payments
        .filter((p) => p.is_expense === 0 && p.status === 1)
        .reduce((sum, p) => sum + p.amount, 0);
    const totalExpense = event.payments
        .filter((p) => p.is_expense === 1 && p.status === 1)
        .reduce((sum, p) => sum + p.amount, 0);
    const remaining = (event.grand_total || 0) - totalPaid;
    const visibleDynamicForms = (event.dynamic_forms || []).filter((field) => field.field_value !== null && field.field_value !== '');
    const dynamicFormSummary = (
        <div className="rounded-xl border border-stone-100 bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-stone-800">Ringkasan Berita Acara</p>
                    <p className="text-xs text-stone-500">Data berita acara yang sudah diisi.</p>
                </div>
                <Link href={route('dynamic-forms.show', event.uuid)} className="rounded bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200">
                    Edit
                </Link>
            </div>
            {visibleDynamicForms.length === 0 ? (
                <p className="rounded-lg bg-stone-50 px-3 py-4 text-center text-sm text-stone-400">
                    Belum ada data berita acara yang diisi.
                </p>
            ) : (
                <div className="divide-y divide-stone-100">
                    {visibleDynamicForms.map((field) => {
                        const value = field.field_value || '-';

                        return (
                            <div key={field.id} className="grid gap-1 py-2.5 sm:grid-cols-[180px_1fr] sm:gap-4">
                                <p className="text-xs font-medium uppercase text-stone-400">{field.field_label}</p>
                                <p className="whitespace-pre-wrap text-sm leading-6 text-stone-800">{value}</p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
    const orderTheme = event.order_type_name === 'MUA'
        ? {
            badge: 'bg-rose-100 text-rose-700 border border-rose-200',
            accent: 'border-rose-300',
            tab: 'bg-rose-400',
            link: 'text-rose-500 hover:underline',
        }
        : {
            badge: 'bg-violet-100 text-violet-700 border border-violet-200',
            accent: 'border-violet-300',
            tab: 'bg-violet-500',
            link: 'text-violet-600 hover:underline',
        };

    const { delete: destroy, post, processing: deleteProcessing } = useForm();
    const { post: syncDynamicForm, processing: syncProcessing } = useForm();
    const {
        data: scheduleData,
        setData: setScheduleData,
        post: createSchedule,
        put: updateSchedule,
        delete: deleteSchedule,
        processing: scheduleProcessing,
    } = useForm({
        client_source: 'booked',
        event_id: String(event.id),
        prospect_name: '',
        prospect_mobile_phone: '',
        schedule_type: '1',
        schedule_from: '',
        time_from: '',
        schedule_to: '',
        time_to: '',
        description: '',
        return_to_event: '1',
    });
    const {
        data: photoData,
        setData: setPhotoData,
        post: uploadPhotos,
        delete: deletePhoto,
        processing: photoProcessing,
        reset: resetPhotoForm,
        errors: photoErrors,
    } = useForm({
        photos: [] as File[],
    });

    const handleDelete = () => {
        const message = authUser.is_admin
            ? 'Yakin hapus client ini?'
            : 'Staff tidak bisa langsung menghapus client. Kirim permintaan hapus ke admin?';

        if (confirm(message)) {
            destroy(route('events.destroy', event.uuid));
        }
    };

    const handleApproveDelete = () => {
        if (confirm('Setujui request hapus dan hapus client ini?')) {
            post(route('events.approve-delete', event.uuid));
        }
    };

    const handleSyncDynamicForm = () => {
        if (confirm('Ambil template berita acara terbaru untuk client ini? Field yang sudah terisi akan dipertahankan kalau masih cocok.')) {
            syncDynamicForm(route('dynamic-forms.sync-latest', event.uuid), {
                preserveScroll: true,
                preserveState: false,
            });
        }
    };

    const openScheduleModal = (schedule: Schedule) => {
        const from = parseScheduleDateTime(schedule.schedule_from);
        const to = schedule.schedule_to ? parseScheduleDateTime(schedule.schedule_to) : null;

        setSelectedSchedule(schedule);
        setShowScheduleModal(true);
        setScheduleData({
            client_source: 'booked',
            event_id: String(event.id),
            prospect_name: '',
            prospect_mobile_phone: '',
            schedule_type: schedule.type_name === 'Konsultasi' ? '2' : '1',
            schedule_from: from.date,
            time_from: from.time,
            schedule_to: to?.date || '',
            time_to: to?.time || '',
            description: schedule.description || '',
            return_to_event: '1',
        });
    };

    const openCreateScheduleModal = () => {
        setSelectedSchedule(null);
        setShowScheduleModal(true);
        setScheduleData({
            client_source: 'booked',
            event_id: String(event.id),
            prospect_name: '',
            prospect_mobile_phone: '',
            schedule_type: '1',
            schedule_from: '',
            time_from: '14:00',
            schedule_to: '',
            time_to: '15:00',
            description: '',
            return_to_event: '1',
        });
    };

    const submitSchedule = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedSchedule) {
            createSchedule(route('schedules.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    setActiveTab('schedule');
                    setShowScheduleModal(false);
                },
            });
            return;
        }

        updateSchedule(route('schedules.update', selectedSchedule.id), {
            preserveScroll: true,
            onSuccess: () => {
                setActiveTab('schedule');
                setSelectedSchedule(null);
                setShowScheduleModal(false);
            },
        });
    };

    const handleDeleteSchedule = () => {
        if (!selectedSchedule || !confirm('Yakin hapus jadwal ini?')) {
            return;
        }

        deleteSchedule(route('schedules.destroy', {
            schedule: selectedSchedule.id,
            return_to_event: 1,
        }), {
            preserveScroll: true,
            onSuccess: () => {
                setActiveTab('schedule');
                setSelectedSchedule(null);
                setShowScheduleModal(false);
            },
        });
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setPhotoData('photos', files);
        setPhotoPreviews(files.map((file) => URL.createObjectURL(file)));
    };

    const submitPhotos = (e: React.FormEvent) => {
        e.preventDefault();

        if (photoData.photos.length === 0) {
            alert('Pilih foto dulu.');
            return;
        }

        uploadPhotos(route('events.photos.store', event.uuid), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                resetPhotoForm('photos');
                setPhotoPreviews([]);
            },
        });
    };

    const handleDeletePhoto = (photo: EventPhoto) => {
        if (confirm('Hapus foto ini?')) {
            deletePhoto(route('events.photos.destroy', [event.uuid, photo.id]), {
                preserveScroll: true,
            });
        }
    };

    const logTypeClass = (type: string) => {
        if (type === 'delete_requested' || type === 'delete_approved' || type === 'deleted') return 'bg-red-100 text-red-700';
        if (type === 'payment_changed') return 'bg-emerald-100 text-emerald-700';
        if (type === 'total_changed') return 'bg-amber-100 text-amber-700';
        if (type === 'date_changed') return 'bg-blue-100 text-blue-700';
        return 'bg-stone-100 text-stone-700';
    };

    const logTypeLabel = (type: string) => ({
        created: 'Input Client',
        total_changed: 'Total Harga',
        date_changed: 'Tanggal',
        payment_changed: 'Pembayaran',
        delete_requested: 'Minta Hapus',
        deleted: 'Dihapus',
        delete_approved: 'Hapus Disetujui',
    }[type] || type);

    const formatLogValue = (value: Record<string, unknown> | null) => {
        if (!value || Object.keys(value).length === 0) return '';

        return Object.entries(value)
            .map(([key, item]) => `${key}: ${String(item ?? '-')}`)
            .join(', ');
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <h2 className="page-title break-words">{event.name}</h2>
                        <p className="mt-1 text-sm font-medium text-stone-500 dark:text-stone-400">{formatDate(event.date)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {!authUser.is_limited_staff && (
                            <>
                                <button
                                    type="button"
                                    onClick={handleSyncDynamicForm}
                                    disabled={syncProcessing}
                                    className="btn-secondary text-sm py-2 px-3 disabled:opacity-50"
                                >
                                    {syncProcessing ? 'Mengambil...' : '↻ Ambil Form Terbaru'}
                                </button>
                                <Link href={route('dynamic-forms.show', event.uuid)} className="btn-primary text-sm py-2 px-3">
                                    📝 Berita Acara
                                </Link>
                                <Link href={route('events.edit', event.uuid)} className="btn-secondary text-sm py-2 px-3">
                                    Edit
                                </Link>
                                <button onClick={handleDelete} disabled={deleteProcessing} className="btn-danger hidden text-sm py-2 px-3 sm:inline-flex">
                                    Hapus
                                </button>
                            </>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`Client - ${event.name}`} />

            <div className="space-y-4">
                {/* Summary Cards */}
                {canSeeFinancials && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className={`stat-card border-l-4 ${orderTheme.accent}`}>
                        <p className="text-xs text-stone-400">Grand Total</p>
                        <p className="text-lg font-bold text-stone-800">{formatRupiah(event.grand_total || 0)}</p>
                        <p className="text-xs text-stone-400">Base {formatRupiah(event.total_amount || 0)}</p>
                    </div>
                    <div className="stat-card border-l-4 border-emerald-300">
                        <p className="text-xs text-stone-400">Dibayar</p>
                        <p className="text-lg font-bold text-emerald-600">{formatRupiah(totalPaid)}</p>
                    </div>
                    <div className="stat-card border-l-4 border-amber-300">
                        <p className="text-xs text-stone-400">Sisa</p>
                        <p className="text-lg font-bold text-amber-600">{formatRupiah(remaining)}</p>
                    </div>
                    <div className="stat-card border-l-4 border-red-300">
                        <p className="text-xs text-stone-400">Biaya</p>
                        <p className="text-lg font-bold text-red-500">{formatRupiah(totalExpense)}</p>
                    </div>
                </div>
                )}

                {/* Status Badge */}
                <div className="flex items-center gap-2">
                    {canSeeFinancials && (
                        <span className={`badge ${event.is_fully_paid ? 'badge-green' : 'badge-yellow'}`}>
                            {event.is_fully_paid ? '✅ LUNAS' : '⏳ BELUM LUNAS'}
                        </span>
                    )}
                    <span className={`badge ${orderTheme.badge}`}>
                        {event.order_type_name === 'MUA' ? '💄' : '👗'} {event.order_type_name}
                    </span>
                    <span className="badge-blue">{formatDate(event.date)}</span>
                </div>

                {/* Mobile Tabs */}
                <div className="flex gap-1 rounded-xl bg-white p-1 shadow-sm">
                    {(['info', ...(canSeeFinancials ? ['payment' as ClientTab] : []), 'schedule'] as ClientTab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition ${
                                activeTab === tab
                                    ? `${orderTheme.tab} text-white shadow-sm`
                                    : 'text-stone-500 hover:bg-stone-50'
                            }`}
                        >
                            {tab === 'info' && 'ℹ️ Info'}
                            {tab === 'payment' && `💰 Bayar (${event.payments.length})`}
                            {tab === 'schedule' && `⏰ Jadwal (${event.schedules.length})`}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="card-elevated p-4">
                    {activeTab === 'info' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs text-stone-400">📱 Telepon</p>
                                    <a href={`https://wa.me/${event.mobile_phone}`} className={`text-sm font-medium ${orderTheme.link}`} target="_blank">
                                        {event.mobile_phone} ↗
                                    </a>
                                </div>
                                <div>
                                    <p className="text-xs text-stone-400">📅 Tanggal & Waktu</p>
                                    <p className="text-sm font-medium text-stone-800">{formatDate(event.date)} {event.time ? `· ${event.time}` : ''}</p>
                                </div>
                            </div>
                            {event.address && (
                                <div>
                                    <p className="text-xs text-stone-400">🏠 Alamat</p>
                                    <p className="text-sm text-stone-700">{event.address}</p>
                                </div>
                            )}
                            {event.location && (
                                <div>
                                    <p className="text-xs text-stone-400">📍 Lokasi</p>
                                    <a href={event.location} target="_blank" className={`text-sm break-all ${orderTheme.link}`}>
                                        {event.location} ↗
                                    </a>
                                </div>
                            )}
                            {event.package_description && (
                                <div>
                                    <p className="text-xs text-stone-400">📦 Paket</p>
                                    <p className="text-sm text-stone-700">{event.package_description}</p>
                                </div>
                            )}
                            {dynamicFormSummary}
                            {canSeeFinancials && (
                            <div className="rounded-xl border border-stone-100 bg-stone-50 p-4">
                                <p className="mb-3 text-sm font-semibold text-stone-800">Ringkasan Harga</p>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between gap-4">
                                        <span className="text-stone-500">Total Harga</span>
                                        <span className="font-semibold text-stone-800">{formatRupiah(event.total_amount || 0)}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-stone-500">Biaya Tambahan</span>
                                        <span className="font-semibold text-stone-800">{formatRupiah(event.additional_cost_total || 0)}</span>
                                    </div>
                                    {event.additional_costs.length > 0 && (
                                        <div className="space-y-1 rounded-lg bg-white p-3">
                                            {event.additional_costs.map((cost) => (
                                                <div key={cost.id} className="flex justify-between gap-3 text-xs text-stone-600">
                                                    <span>{cost.type}{cost.notes ? ` - ${cost.notes}` : ''}</span>
                                                    <span className="font-semibold">{formatRupiah(cost.total)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex justify-between gap-4">
                                        <span className="text-stone-500">Diskon</span>
                                        <span className="font-semibold text-red-500">-{formatRupiah(event.discount_amount || 0)}</span>
                                    </div>
                                    <div className="border-t border-stone-200 pt-2 flex justify-between gap-4">
                                        <span className="font-semibold text-stone-800">Grand Total</span>
                                        <span className="font-bold text-rose-500">{formatRupiah(event.grand_total || 0)}</span>
                                    </div>
                                </div>
                            </div>
                            )}
                            {event.items.length > 0 && (
                                <div>
                                    <p className="text-xs text-stone-400">👗 Item / Gaun</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {event.items.map((item) => (
                                            <span key={item.id} className="badge-pink">
                                                {item.name} ({item.code})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs text-stone-400">📷 Foto Client</p>
                                        <p className="text-sm text-stone-600">Upload beberapa foto sekaligus, lalu hapus foto yang tidak diperlukan.</p>
                                    </div>
                                </div>

                                {!authUser.is_limited_staff && (
                                    <form onSubmit={submitPhotos} className="mb-4 rounded-xl border border-dashed border-stone-200 bg-stone-50 p-3">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <label className="flex cursor-pointer items-center justify-center rounded-lg bg-white px-4 py-3 text-sm font-medium text-stone-600 shadow-sm transition hover:bg-stone-100">
                                                Pilih Foto
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={handlePhotoChange}
                                                    className="hidden"
                                                />
                                            </label>
                                            <button
                                                type="submit"
                                                disabled={photoProcessing || photoData.photos.length === 0}
                                                className="btn-primary px-4 py-3 text-sm disabled:opacity-50"
                                            >
                                                Upload Foto
                                            </button>
                                        </div>
                                        {photoData.photos.length > 0 && (
                                            <p className="mt-2 text-xs text-stone-500">{photoData.photos.length} foto dipilih</p>
                                        )}
                                        {(photoErrors.photos || photoErrors['photos.0']) && (
                                            <p className="mt-2 text-sm text-red-500">{photoErrors.photos || photoErrors['photos.0']}</p>
                                        )}
                                        {photoPreviews.length > 0 && (
                                            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                                                {photoPreviews.map((src, index) => (
                                                    <img
                                                        key={`${src}-${index}`}
                                                        src={src}
                                                        alt={`Preview foto ${index + 1}`}
                                                        className="aspect-square rounded-lg object-cover"
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </form>
                                )}

                                {event.photos.length === 0 ? (
                                    <p className="rounded-xl bg-white px-4 py-6 text-center text-sm text-stone-400">
                                        Belum ada foto client.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                                        {event.photos.map((photo) => (
                                            <div key={photo.id} className="group relative overflow-hidden rounded-xl border border-stone-100 bg-white">
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewPhoto(photo.url)}
                                                    className="block w-full"
                                                >
                                                    <img
                                                        src={photo.url}
                                                        alt={photo.original_name || 'Foto client'}
                                                        className="aspect-square w-full object-cover transition group-hover:scale-105"
                                                    />
                                                </button>
                                                {!authUser.is_limited_staff && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeletePhoto(photo)}
                                                        disabled={photoProcessing}
                                                        className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white shadow disabled:opacity-50"
                                                    >
                                                        Hapus
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'payment' && (
                        <div>
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="font-semibold text-stone-800">Riwayat Pembayaran</h3>
                                <Link href={route('payments.create', { event_id: event.id })} className="btn-primary text-sm py-2 px-3">
                                    + Bayar
                                </Link>
                            </div>
                            {event.payments.length === 0 ? (
                                <p className="py-8 text-center text-sm text-stone-400">Belum ada pembayaran</p>
                            ) : (
                                <div className="space-y-2">
                                    {event.payments.map((p) => (
                                        <div key={p.id} className={`mobile-card-row ${p.is_expense === 0 ? 'border-l-4 border-emerald-300' : 'border-l-4 border-red-300'}`}>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`badge ${p.is_expense === 0 ? 'badge-green' : 'badge-red'}`}>
                                                        {p.type_name}
                                                    </span>
                                                    <span className={`badge ${p.status === 1 ? 'badge-blue' : p.status === 2 ? 'badge-red' : 'badge-yellow'}`}>
                                                        {p.status_name}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-sm text-stone-700">{p.description || '-'}</p>
                                                <p className="text-xs text-stone-400">{formatDate(p.payment_at)} · {p.payment_type_name}</p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className={`text-lg font-bold ${p.is_expense === 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {p.is_expense === 0 ? '+' : '-'}{formatRupiah(p.amount)}
                                                </p>
                                                <Link href={route('payments.edit', p.id)} className="text-xs font-semibold text-rose-500 hover:text-rose-600">
                                                    Edit
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

	                    {activeTab === 'schedule' && (
	                        <div>
	                            <div className="mb-4 flex items-center justify-between">
	                                <h3 className="font-semibold text-stone-800">Jadwal Fitting & Konsultasi</h3>
	                                <button type="button" onClick={openCreateScheduleModal} className="btn-primary text-sm py-2 px-3">
	                                    + Jadwal
	                                </button>
	                            </div>
                            {event.schedules.length === 0 ? (
                                <p className="py-8 text-center text-sm text-stone-400">Belum ada jadwal</p>
                            ) : (
                                <div className="space-y-2">
                                    {event.schedules.map((s) => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => openScheduleModal(s)}
                                            className="mobile-card-row block w-full border-l-4 border-violet-300 text-left transition hover:bg-stone-50 active:scale-[0.99]"
                                        >
                                            <div className="min-w-0">
                                                <span className="badge-purple">{s.type_name}</span>
                                                <p className="mt-1 text-sm font-medium text-stone-800">
                                                    {formatDateTime(s.schedule_from)}
                                                </p>
                                                {s.description && <p className="text-xs text-stone-400">{s.description}</p>}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {authUser.is_admin && (
                    <div className="card-elevated p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="font-semibold text-stone-800">Log Aktivitas Client</h3>
                            <span className="rounded bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-500">Admin Only</span>
                        </div>
                        {!event.activity_logs || event.activity_logs.length === 0 ? (
                            <p className="py-4 text-center text-sm text-stone-400">Belum ada log aktivitas.</p>
                        ) : (
                            <div className="space-y-2">
                                {event.activity_logs.map((log) => (
                                    <div key={log.id} className="rounded-lg border border-stone-100 bg-white p-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`rounded px-2 py-1 text-xs font-semibold ${logTypeClass(log.type)}`}>
                                                    {logTypeLabel(log.type)}
                                                </span>
                                                <p className="text-sm font-medium text-stone-800">{log.message}</p>
                                            </div>
                                            <p className="text-xs text-stone-400">{formatDateTime(log.created_at)}</p>
                                        </div>
                                        <p className="mt-1 text-xs text-stone-500">
                                            Oleh: {log.user?.name || 'System'}
                                        </p>
                                        {(log.before || log.after) && (
                                            <div className="mt-2 grid gap-2 text-xs text-stone-500 sm:grid-cols-2">
                                                {log.before && <p>Sebelum: {formatLogValue(log.before)}</p>}
                                                {log.after && <p>Sesudah: {formatLogValue(log.after)}</p>}
                                            </div>
                                        )}
                                        {log.type === 'delete_requested' && (
                                            <div className="mt-3 flex justify-end">
                                                <button
                                                    onClick={handleApproveDelete}
                                                    disabled={deleteProcessing}
                                                    className="btn-danger text-xs py-2 px-3 disabled:opacity-50"
                                                >
                                                    Konfirmasi Hapus
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {previewPhoto && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                        onClick={() => setPreviewPhoto(null)}
                    >
                        <button
                            type="button"
                            className="absolute right-4 top-4 rounded-full bg-white px-3 py-2 text-sm font-semibold text-stone-700"
                            onClick={() => setPreviewPhoto(null)}
                        >
                            Tutup
                        </button>
                        <img
                            src={previewPhoto}
                            alt="Preview foto client"
                            className="max-h-[85vh] max-w-full rounded-xl object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )}

                {!authUser.is_limited_staff && (
                    <div className="pb-2 sm:hidden">
                        <button
                            onClick={handleDelete}
                            disabled={deleteProcessing}
                            className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 disabled:opacity-50"
                        >
                            Hapus Client
                        </button>
                    </div>
                )}

                {showScheduleModal && (
                    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-3 sm:items-center sm:p-4">
                        <div className="max-h-[calc(100vh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl dark:bg-stone-900 sm:max-h-[calc(100vh-2rem)] sm:p-6">
                            <div className="mb-4">
                                <p className="text-xs font-semibold uppercase text-stone-400">{selectedSchedule ? 'Edit Jadwal' : 'Tambah Jadwal'}</p>
                                <h3 className="mt-1 text-lg font-semibold text-stone-900 dark:text-white">{event.name}</h3>
                            </div>

                            <form onSubmit={submitSchedule} className="space-y-4">
                                <div className="rounded-lg border border-rose-100 bg-rose-50 p-3">
                                    <p className="text-base font-semibold text-rose-700">{event.name}</p>
                                    <p className="text-xs text-rose-600">{event.mobile_phone || '-'} / {formatDate(event.date)}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">Jenis</label>
                                        <select
                                            value={scheduleData.schedule_type}
                                            onChange={(e) => setScheduleData('schedule_type', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-stone-300 bg-white text-stone-800 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
                                        >
                                            <option value="1">Fitting</option>
                                            <option value="2">Konsultasi</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">Tanggal</label>
                                        <input
                                            type="date"
                                            value={scheduleData.schedule_from}
                                            onChange={(e) => setScheduleData('schedule_from', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-stone-300 bg-white text-stone-800 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">Jam Mulai</label>
                                        <input
                                            type="time"
                                            value={scheduleData.time_from}
                                            onChange={(e) => setScheduleData('time_from', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-stone-300 bg-white text-stone-800 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">Jam Selesai</label>
                                        <input
                                            type="time"
                                            value={scheduleData.time_to}
                                            onChange={(e) => setScheduleData('time_to', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-stone-300 bg-white text-stone-800 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">Keterangan</label>
                                    <textarea
                                        value={scheduleData.description}
                                        onChange={(e) => setScheduleData('description', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-stone-300 bg-white text-stone-800 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
                                        rows={3}
                                    />
                                </div>

                                <div className="sticky bottom-0 -mx-5 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 bg-white px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 dark:border-stone-800 dark:bg-stone-900 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:pt-2 sm:dark:bg-transparent">
                                    <div>
                                        {selectedSchedule && (
                                            <button
                                                type="button"
                                                onClick={handleDeleteSchedule}
                                                disabled={scheduleProcessing}
                                                className="rounded bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                                            >
                                                Hapus Jadwal
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedSchedule(null);
                                                setShowScheduleModal(false);
                                            }}
                                            className="rounded bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-200"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={scheduleProcessing}
                                            className="rounded bg-rose-400 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                                        >
                                            {selectedSchedule ? 'Update' : 'Simpan'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

function parseScheduleDateTime(value: string): { date: string; time: string } {
    const [datePart, timePart = ''] = value.replace('T', ' ').split(' ');
    const [hour = '', minute = ''] = timePart.split(':');

    return {
        date: datePart,
        time: hour && minute ? `${hour}:${minute}` : '',
    };
}

function formatIndonesianDate(value?: string | null): string {
    if (!value) {
        return '-';
    }

    const dateOnly = value.slice(0, 10);
    const [year, month, day] = dateOnly.split('-').map(Number);

    if (!year || !month || !day) {
        return value;
    }

    return new Date(year, month - 1, day).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}

function formatIndonesianDateTime(value?: string | null): string {
    if (!value) {
        return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
