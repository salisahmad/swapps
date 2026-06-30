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
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Detail Client: {client.name}
                    </h2>
                    <Link
                        href={route('clients.index')}
                        className="text-sm text-indigo-600 hover:text-indigo-900 dark:text-indigo-400"
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
                        <div className="bg-white p-4 shadow-sm dark:bg-gray-800 sm:rounded-lg">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Booking</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{client.bookings.length}</p>
                        </div>
                        <div className="bg-white p-4 shadow-sm dark:bg-gray-800 sm:rounded-lg">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Harga</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                Rp {totalPrice.toLocaleString('id-ID')}
                            </p>
                        </div>
                        <div className="bg-white p-4 shadow-sm dark:bg-gray-800 sm:rounded-lg">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Dibayar</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                Rp {paidTotal.toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>

                    <div className="mb-6 bg-white p-6 shadow-sm dark:bg-gray-800 sm:rounded-lg">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Data Pribadi</h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Telepon</p>
                                <p className="text-gray-900 dark:text-gray-100">{client.phone}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                                <p className="text-gray-900 dark:text-gray-100">{client.email ?? '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Tanggal Event</p>
                                <p className="text-gray-900 dark:text-gray-100">{client.event_date ?? '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Lokasi</p>
                                <p className="text-gray-900 dark:text-gray-100">{client.event_location ?? '-'}</p>
                            </div>
                        </div>
                        {client.address && (
                            <div className="mt-4">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Alamat</p>
                                <p className="text-gray-900 dark:text-gray-100">{client.address}</p>
                            </div>
                        )}
                        {client.notes && (
                            <div className="mt-4">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Catatan</p>
                                <p className="text-gray-900 dark:text-gray-100">{client.notes}</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 shadow-sm dark:bg-gray-800 sm:rounded-lg">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Riwayat Booking</h3>
                        {client.bookings.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400">Belum ada booking.</p>
                        ) : (
                            <div className="space-y-4">
                                {client.bookings.map((booking) => {
                                    const paid = booking.payments.reduce((s, p) => s + parseFloat(p.amount), 0);
                                    return (
                                        <div key={booking.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {booking.service.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {booking.booking_date} — {booking.location}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`rounded px-2 py-1 text-xs font-semibold ${
                                                        booking.status === 'completed'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                            : booking.status === 'confirmed'
                                                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                                    }`}
                                                >
                                                    {booking.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between text-sm">
                                                <p className="text-gray-600 dark:text-gray-400">
                                                    MUA: {booking.staff?.name ?? 'Belum ditentukan'}
                                                </p>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    Rp {parseFloat(booking.total_price).toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                            <div className="mt-1 text-sm">
                                                <p className="text-gray-600 dark:text-gray-400">
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
