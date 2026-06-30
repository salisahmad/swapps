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
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Client Wedding
                    </h2>
                    <Link
                        href={route('clients.create')}
                        className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
                    >
                        + Tambah Client
                    </Link>
                </div>
            }
        >
            <Head title="Clients" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                        <div className="p-6">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Nama</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Telepon</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Tanggal Event</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Jenis</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Lokasi</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {clients.data.map((client) => (
                                        <tr key={client.id}>
                                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{client.name}</td>
                                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{client.phone}</td>
                                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{client.event_date ?? '-'}</td>
                                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 capitalize">{client.event_type}</td>
                                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{client.event_location ?? '-'}</td>
                                            <td className="px-4 py-2 text-sm">
                                                <Link
                                                    href={route('clients.edit', client.id)}
                                                    className="mr-2 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400"
                                                >
                                                    Edit
                                                </Link>
                                                <Link
                                                    href={route('clients.show', client.id)}
                                                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400"
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
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span
                                            key={i}
                                            className="rounded px-3 py-1 text-sm bg-gray-100 text-gray-400 dark:bg-gray-800"
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
