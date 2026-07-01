import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

interface Service {
    name: string;
    category: string;
    price: string;
}

interface Staff {
    name: string;
    role: string;
}

interface Payment {
    amount: string;
    payment_type: string;
    payment_method: string;
    paid_at: string | null;
}

interface Booking {
    id: number;
    booking_date: string;
    location: string;
    status: string;
    total_price: string;
    service: Service;
    staff: Staff | null;
    payments: Payment[];
}

interface Client {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
    event_date: string | null;
    event_type: string;
    event_location: string | null;
    notes: string | null;
    created_at: string;
}

interface PageProps {
    client: Client & { bookings: Booking[] };
}

export default function Show({ client }: PageProps) {
    const paidTotal = client.bookings.reduce((sum, b) => {
        return sum + b.payments.reduce((s, p) => s + parseFloat(p.amount), 0);
    }, 0);

    const totalPrice = client.bookings.reduce((sum, b) => sum + parseFloat(b.total_price), 0);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-stone-800">
                        Detail Client: {client.name}
                    </h2>
                    <Link
                        href={route('clients.index')}
                        className="text-sm text-rose-400 hover:text-rose-500 text-rose-400"
                    >
                        Kembali
                    </Link>
                </div>
            }
        >
            <Head title={`Client - ${client.name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <div className="bg-white p-4 shadow-sm bg-white sm:rounded-lg">
                            <p className="text-sm text-stone-500">Total Booking</p>
                            <p className="text-2xl font-bold text-stone-900 text-white">{client.bookings.length}</p>
                        </div>
                        <div className="bg-white p-4 shadow-sm bg-white sm:rounded-lg">
                            <p className="text-sm text-stone-500">Total Harga</p>
                            <p className="text-2xl font-bold text-stone-900 text-white">
                                Rp {totalPrice.toLocaleString('id-ID')}
                            </p>
                        </div>
                        <div className="bg-white p-4 shadow-sm bg-white sm:rounded-lg">
                            <p className="text-sm text-stone-500">Total Dibayar</p>
                            <p className="text-2xl font-bold text-green-600 text-green-400">
                                Rp {paidTotal.toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>

                    <div className="mb-6 bg-white p-6 shadow-sm bg-white sm:rounded-lg">
                        <h3 className="mb-4 text-lg font-semibold text-stone-900 text-white">Data Pribadi</h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-sm text-stone-500">Telepon</p>
                                <p className="text-stone-900 text-stone-100">{client.phone}</p>
                            </div>
                            <div>
                                <p className="text-sm text-stone-500">Email</p>
                                <p className="text-stone-900 text-stone-100">{client.email ?? '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-stone-500">Tanggal Event</p>
                                <p className="text-stone-900 text-stone-100">{client.event_date ?? '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-stone-500">Lokasi</p>
                                <p className="text-stone-900 text-stone-100">{client.event_location ?? '-'}</p>
                            </div>
                        </div>
                        {client.address && (
                            <div className="mt-4">
                                <p className="text-sm text-stone-500">Alamat</p>
                                <p className="text-stone-900 text-stone-100">{client.address}</p>
                            </div>
                        )}
                        {client.notes && (
                            <div className="mt-4">
                                <p className="text-sm text-stone-500">Catatan</p>
                                <p className="text-stone-900 text-stone-100">{client.notes}</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 shadow-sm bg-white sm:rounded-lg">
                        <h3 className="mb-4 text-lg font-semibold text-stone-900 text-white">Riwayat Booking</h3>
                        {client.bookings.length === 0 ? (
                            <p className="text-stone-500">Belum ada booking.</p>
                        ) : (
                            <div className="space-y-4">
                                {client.bookings.map((booking) => {
                                    const paid = booking.payments.reduce((s, p) => s + parseFloat(p.amount), 0);
                                    return (
                                        <div key={booking.id} className="rounded-lg border border-stone-200 p-4 border-stone-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-stone-900 text-white">
                                                        {booking.service.name}
                                                    </p>
                                                    <p className="text-sm text-stone-500">
                                                        {booking.booking_date} — {booking.location}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`rounded px-2 py-1 text-xs font-semibold ${
                                                        booking.status === 'completed'
                                                            ? 'bg-green-100 text-green-800 bg-green-900 text-green-300'
                                                            : booking.status === 'confirmed'
                                                              ? 'bg-blue-100 text-blue-800 bg-blue-900 text-blue-300'
                                                              : 'bg-yellow-100 text-yellow-800 bg-yellow-900 text-yellow-300'
                                                    }`}
                                                >
                                                    {booking.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between text-sm">
                                                <p className="text-stone-600 text-stone-400">
                                                    MUA: {booking.staff?.name ?? 'Belum ditentukan'}
                                                </p>
                                                <p className="font-semibold text-stone-900 text-white">
                                                    Rp {parseFloat(booking.total_price).toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                            <div className="mt-1 text-sm">
                                                <p className="text-stone-600 text-stone-400">
                                                    Dibayar: Rp {paid.toLocaleString('id-ID')} ({booking.payments.length} payment)
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
