import ApplicationLogo from '@/Components/ApplicationLogo';
import { formatShortDate, formatShortDateTime } from '@/utils/date';
import { Head } from '@inertiajs/react';

interface ItemType {
    name: string;
}

interface ItemPhoto {
    id: number;
    url: string;
}

interface ItemVariant {
    id: number;
    size: string;
    stock: number;
}

interface Item {
    id: number;
    code: string;
    name: string;
    description: string | null;
    type?: ItemType | null;
    type_name?: string | null;
    premium_level_name?: string;
    image_url?: string | null;
    stock_summary?: string;
    photos?: ItemPhoto[];
    variants?: ItemVariant[];
}

interface Schedule {
    id: number;
    type_name: string;
    schedule_from: string;
    schedule_to: string | null;
    description: string | null;
}

interface Payment {
    id: number;
    is_expense: number;
    payment_at: string | null;
    payment_type_name: string;
    amount: number;
    description: string | null;
    status: number;
    status_name: string;
}

interface EventPhoto {
    id: number;
    url: string;
    original_name: string | null;
}

interface AdditionalCost {
    id: number;
    type: string;
    total: number;
    notes: string | null;
}

interface DynamicFormItem {
    id: number;
    field_label: string;
    field_value: string | null;
}

interface EventData {
    id: number;
    uuid: string;
    name: string;
    mobile_phone: string;
    date: string;
    time: string | null;
    address: string | null;
    location: string | null;
    package_description: string | null;
    total_amount: number;
    discount_amount: number;
    additional_cost_total: number;
    grand_total: number;
    paid_status_name: string;
    paid_status_tone: string;
    order_type_name: string;
    items: Item[];
    schedules: Schedule[];
    payments: Payment[];
    photos: EventPhoto[];
    additional_costs: AdditionalCost[];
    dynamic_forms: DynamicFormItem[];
}

interface PageProps {
    event: EventData;
}

export default function ClientShow({ event }: PageProps) {
    const formatRupiah = (value: number) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
    const confirmedPayments = event.payments.filter((payment) => payment.is_expense === 0 && payment.status === 1);
    const pendingPayments = event.payments.filter((payment) => payment.is_expense === 0 && payment.status === 0);
    const paidTotal = confirmedPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const remaining = Math.max(0, Number(event.grand_total || 0) - paidTotal);
    const filledForms = event.dynamic_forms.filter((field) => field.field_value !== null && field.field_value !== '');
    const whatsappUrl = event.mobile_phone ? `https://wa.me/${normalizeWhatsapp(event.mobile_phone)}` : null;
    const paidToneClass = event.paid_status_tone === 'paid'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : event.paid_status_tone === 'pending_paid'
            ? 'border-orange-200 bg-orange-50 text-orange-700'
            : 'border-amber-200 bg-amber-50 text-amber-700';

    return (
        <div className="min-h-screen bg-[#faf9f7] text-stone-800 print:bg-white">
            <Head title={`Detail Client - ${event.name}`} />

            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 print:max-w-none print:px-0 print:py-0">
                <div className="mb-5 flex items-center justify-between gap-4 print:hidden">
                    <ApplicationLogo variant="horizontal" className="h-10 w-auto max-w-[210px] object-contain" />
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800"
                    >
                        Print
                    </button>
                </div>

                <section className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
                    <div className="border-b border-stone-100 bg-gradient-to-r from-rose-50 to-violet-50 px-5 py-6 print:bg-white">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-wide text-rose-500">Shofi Wedding</p>
                                <h1 className="mt-2 text-3xl font-bold text-stone-900">{event.name}</h1>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Badge className="border-rose-200 bg-white/80 text-rose-700">{event.order_type_name}</Badge>
                                    <Badge className={paidToneClass}>{event.paid_status_name}</Badge>
                                    <Badge className="border-sky-200 bg-sky-50 text-sky-700">{formatShortDate(event.date)}</Badge>
                                </div>
                            </div>
                            <div className="rounded-xl border border-white/80 bg-white/80 p-4 text-sm shadow-sm print:border-stone-100 print:shadow-none">
                                <p className="font-semibold text-stone-900">Tanggal Acara</p>
                                <p className="mt-1 text-lg font-bold text-rose-500">
                                    {formatShortDate(event.date)}{event.time ? ` / ${event.time}` : ''}
                                </p>
                                {whatsappUrl && (
                                    <a href={whatsappUrl} target="_blank" className="mt-2 inline-block font-semibold text-emerald-600">
                                        {event.mobile_phone}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 p-5 lg:grid-cols-[1.25fr_0.75fr] print:block">
                        <div className="space-y-4">
                            <InfoSection title="Detail Client">
                                <InfoGrid>
                                    <InfoItem label="Nama" value={event.name} />
                                    <InfoItem label="Nomor WhatsApp" value={event.mobile_phone} />
                                    <InfoItem label="Jenis" value={event.order_type_name} />
                                    <InfoItem label="Tanggal Acara" value={`${formatShortDate(event.date)}${event.time ? ` / ${event.time}` : ''}`} />
                                </InfoGrid>
                                {event.address && <TextBlock label="Alamat" value={event.address} />}
                                {event.location && (
                                    <div className="mt-4">
                                        <p className="text-xs font-semibold uppercase text-stone-400">Link Lokasi</p>
                                        <a href={event.location} target="_blank" className="mt-1 block break-all text-sm font-semibold text-sky-600">
                                            {event.location}
                                        </a>
                                    </div>
                                )}
                                {event.package_description && <TextBlock label="Deskripsi Paket" value={event.package_description} />}
                            </InfoSection>

                            <InfoSection title="Berita Acara">
                                {filledForms.length === 0 ? (
                                    <p className="rounded-xl bg-stone-50 px-4 py-5 text-center text-sm text-stone-500">
                                        Belum ada data berita acara yang diisi.
                                    </p>
                                ) : (
                                    <div className="divide-y divide-stone-100">
                                        {filledForms.map((field) => (
                                            <div key={field.id} className="grid gap-1 py-3 sm:grid-cols-[180px_1fr]">
                                                <p className="text-xs font-semibold uppercase text-stone-400">{field.field_label}</p>
                                                <p className="whitespace-pre-wrap text-sm leading-6 text-stone-800">{field.field_value}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </InfoSection>

                            {event.items.length > 0 && (
                                <InfoSection title="Item / Gaun">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {event.items.map((item) => (
                                            <div key={item.id} className="flex gap-3 rounded-xl border border-stone-100 bg-stone-50 p-3">
                                                {item.image_url && (
                                                    <img src={item.image_url} alt={item.name} className="h-20 w-16 rounded-lg object-cover" />
                                                )}
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-stone-900">{item.code} - {item.name}</p>
                                                    <p className="text-xs text-stone-500">{item.type_name || item.type?.name || '-'} / {item.premium_level_name || '-'}</p>
                                                    {item.stock_summary && <p className="mt-1 text-xs text-stone-500">{item.stock_summary}</p>}
                                                    {item.description && <p className="mt-2 text-sm text-stone-600">{item.description}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </InfoSection>
                            )}

                            {event.schedules.length > 0 && (
                                <InfoSection title="Jadwal Fitting / Konsultasi">
                                    <div className="space-y-2">
                                        {event.schedules.map((schedule) => (
                                            <div key={schedule.id} className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <Badge className="border-violet-200 bg-violet-50 text-violet-700">{schedule.type_name}</Badge>
                                                    <p className="text-sm font-semibold text-stone-900">{formatShortDateTime(schedule.schedule_from)}</p>
                                                </div>
                                                {schedule.description && <p className="mt-2 text-sm text-stone-600">{schedule.description}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </InfoSection>
                            )}
                        </div>

                        <aside className="space-y-4 print:mt-4">
                            <InfoSection title="Ringkasan Harga">
                                <PriceRow label="Total Harga" value={formatRupiah(event.total_amount)} />
                                <PriceRow label="Biaya Tambahan" value={formatRupiah(event.additional_cost_total)} />
                                {event.additional_costs.length > 0 && (
                                    <div className="my-3 space-y-2 rounded-xl bg-stone-50 p-3">
                                        {event.additional_costs.map((cost) => (
                                            <PriceRow
                                                key={cost.id}
                                                label={`${cost.type}${cost.notes ? ` - ${cost.notes}` : ''}`}
                                                value={formatRupiah(cost.total)}
                                                small
                                            />
                                        ))}
                                    </div>
                                )}
                                <PriceRow label="Diskon" value={`-${formatRupiah(event.discount_amount)}`} valueClassName="text-red-500" />
                                <div className="my-3 border-t border-stone-100" />
                                <PriceRow label="Grand Total" value={formatRupiah(event.grand_total)} strong />
                                <PriceRow label="Sudah Dibayar" value={formatRupiah(paidTotal)} valueClassName="text-emerald-600" />
                                <PriceRow label="Sisa" value={formatRupiah(remaining)} valueClassName={remaining > 0 ? 'text-amber-600' : 'text-emerald-600'} strong />
                                {pendingPayments.length > 0 && (
                                    <p className="mt-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700">
                                        Ada {pendingPayments.length} pembayaran yang masih menunggu konfirmasi.
                                    </p>
                                )}
                            </InfoSection>

                            <InfoSection title="Riwayat Pembayaran">
                                {event.payments.filter((payment) => payment.is_expense === 0).length === 0 ? (
                                    <p className="text-sm text-stone-500">Belum ada pembayaran tercatat.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {event.payments.filter((payment) => payment.is_expense === 0).map((payment) => (
                                            <div key={payment.id} className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-stone-900">{formatShortDate(payment.payment_at)}</p>
                                                        <p className="text-xs text-stone-500">{payment.payment_type_name}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-emerald-600">{formatRupiah(payment.amount)}</p>
                                                        <p className="text-xs font-semibold text-stone-500">{payment.status_name}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </InfoSection>

                            {event.photos.length > 0 && (
                                <InfoSection title="Foto">
                                    <div className="grid grid-cols-2 gap-2">
                                        {event.photos.slice(0, 6).map((photo) => (
                                            <img key={photo.id} src={photo.url} alt={photo.original_name || event.name} className="aspect-[4/5] rounded-xl object-cover" />
                                        ))}
                                    </div>
                                </InfoSection>
                            )}
                        </aside>
                    </div>
                </section>
            </div>
        </div>
    );
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm print:break-inside-avoid print:rounded-none print:shadow-none">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-stone-500">{title}</h2>
            {children}
        </section>
    );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
    return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function InfoItem({ label, value }: { label: string; value: string | null }) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase text-stone-400">{label}</p>
            <p className="mt-1 text-sm font-semibold text-stone-800">{value || '-'}</p>
        </div>
    );
}

function TextBlock({ label, value }: { label: string; value: string }) {
    return (
        <div className="mt-4">
            <p className="text-xs font-semibold uppercase text-stone-400">{label}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-stone-700">{value}</p>
        </div>
    );
}

function PriceRow({
    label,
    value,
    strong = false,
    small = false,
    valueClassName = '',
}: {
    label: string;
    value: string;
    strong?: boolean;
    small?: boolean;
    valueClassName?: string;
}) {
    return (
        <div className={`flex justify-between gap-4 ${small ? 'text-xs' : 'text-sm'} ${strong ? 'font-bold' : ''}`}>
            <span className="text-stone-500">{label}</span>
            <span className={`text-right font-semibold text-stone-900 ${valueClassName}`}>{value}</span>
        </div>
    );
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
    return (
        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${className}`}>
            {children}
        </span>
    );
}

function normalizeWhatsapp(phone: string): string {
    const digits = phone.replace(/\D+/g, '');

    if (digits.startsWith('0')) {
        return `62${digits.slice(1)}`;
    }

    if (digits.startsWith('8')) {
        return `62${digits}`;
    }

    return digits;
}
