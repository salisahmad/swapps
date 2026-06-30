import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

interface Client {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    event_date: string | null;
    event_type: string;
    event_location: string | null;
    created_at: string;
}

interface PageProps {
    clients: {
        data: Client[];
        links: { url: string | null; label: string; active: boolean }[];
    };
}

export default function Index({ clients }: PageProps) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-stone-800 text-stone-200">
                        Client Wedding
                    </h2>
                    <Link
                        href={route('clients.create')}
                        className="rounded bg-rose-400 px-4 py-2 text-sm text-white hover:bg-rose-500"
                    >
                        + Tambah Client
                    </Link>
                </div>
            }
        >
            <Head title="Clients" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm bg-stone-800 sm:rounded-lg">
                        <div className="p-6">
                            <table className="min-w-full divide-y divide-stone-200 divide-stone-700">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-stone-500 text-stone-400">Nama</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-stone-500 text-stone-400">Telepon</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-stone-500 text-stone-400">Tanggal Event</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-stone-500 text-stone-400">Jenis</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-stone-500 text-stone-400">Lokasi</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-stone-500 text-stone-400">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-200 divide-stone-700">
                                    {clients.data.map((client) => (
                                        <tr key={client.id}>
                                            <td className="px-4 py-2 text-sm text-stone-900 text-stone-100">{client.name}</td>
                                            <td className="px-4 py-2 text-sm text-stone-900 text-stone-100">{client.phone}</td>
                                            <td className="px-4 py-2 text-sm text-stone-900 text-stone-100">{client.event_date ?? '-'}</td>
                                            <td className="px-4 py-2 text-sm text-stone-900 text-stone-100 capitalize">{client.event_type}</td>
                                            <td className="px-4 py-2 text-sm text-stone-900 text-stone-100">{client.event_location ?? '-'}</td>
                                            <td className="px-4 py-2 text-sm">
                                                <Link
                                                    href={route('clients.edit', client.id)}
                                                    className="mr-2 text-rose-400 hover:text-rose-500 text-rose-400"
                                                >
                                                    Edit
                                                </Link>
                                                <Link
                                                    href={route('clients.show', client.id)}
                                                    className="text-stone-600 hover:text-stone-900 text-stone-400"
                                                >
                                                    Detail
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="mt-4 flex justify-end gap-1">
                                {clients.links.map((link, i) =>
                                    link.url ? (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            className={`rounded px-3 py-1 text-sm ${
                                                link.active
                                                    ? 'bg-rose-400 text-white'
                                                    : 'bg-stone-200 text-stone-700 bg-stone-700 text-stone-300'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span
                                            key={i}
                                            className="rounded px-3 py-1 text-sm bg-stone-100 text-stone-400 bg-stone-800"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ),
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
