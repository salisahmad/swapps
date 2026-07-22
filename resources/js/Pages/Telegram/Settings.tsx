import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

interface Settings {
    bot_token: string | null;
    chat_id: string | null;
    notify_new_event: boolean;
    notify_new_payment: boolean;
    notify_schedule: boolean;
}

interface PageProps {
    settings: Settings;
    flash?: { success?: string; error?: string };
}

export default function Settings({ settings, flash }: PageProps) {
    const { data, setData, patch, post, processing } = useForm({
        bot_token: settings.bot_token || '',
        chat_id: settings.chat_id || '',
        notify_new_event: settings.notify_new_event,
        notify_new_payment: settings.notify_new_payment,
        notify_schedule: settings.notify_schedule,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('telegram.update'));
    };

    const test = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('telegram.test'));
    };

    const inputClass = 'mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-rose-400 focus:ring-rose-400 border-stone-200 bg-white text-stone-800';
    const labelClass = 'block text-sm font-medium text-stone-700 text-stone-500';

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-stone-800">
                    Pengaturan Notifikasi Telegram
                </h2>
            }
        >
            <Head title="Telegram Settings" />

            <div className="py-6">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="mb-4 rounded bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                            ✅ {flash.success}
                        </div>
                    )}
                    {flash?.error && (
                        <div className="mb-4 rounded bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                            ❌ {flash.error}
                        </div>
                    )}

                    <div className="mb-6 rounded-lg bg-white p-6 shadow-sm dark:bg-stone-900">
                        <h3 className="mb-2 text-lg font-semibold text-stone-900 dark:text-white">🤖 Cara Setup Telegram Bot</h3>
                        <ol className="ml-5 list-decimal space-y-2 text-sm text-stone-600 dark:text-stone-400">
                            <li>Buka Telegram, cari <b>@BotFather</b> dan klik <b>/newbot</b></li>
                            <li>Isi nama bot, lalu copy <b>Bot Token</b> (mulai dengan <code>123456789:ABC...</code>)</li>
                            <li>Cari bot kamu di Telegram, klik <b>Start</b></li>
                            <li>Buka <b>https://api.telegram.org/botTOKEN/getUpdates</b> (ganti TOKEN) di browser</li>
                            <li>Cari <b>chat.id</b> — itu Chat ID kamu (biasanya angka, misal <code>123456789</code>)</li>
                            <li>Paste Bot Token & Chat ID di bawah, lalu klik <b>Simpan</b></li>
                        </ol>
                    </div>

                    <form onSubmit={submit} className="space-y-6 rounded-lg bg-white p-6 shadow-sm dark:bg-stone-900">
                        <div>
                            <label className={labelClass}>Bot Token</label>
                            <input
                                type="text"
                                value={data.bot_token}
                                onChange={(e) => setData('bot_token', e.target.value)}
                                className={inputClass}
                                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                            />
                            <p className="mt-1 text-xs text-stone-500">Dari @BotFather</p>
                        </div>

                        <div>
                            <label className={labelClass}>Chat ID</label>
                            <input
                                type="text"
                                value={data.chat_id}
                                onChange={(e) => setData('chat_id', e.target.value)}
                                className={inputClass}
                                placeholder="123456789 atau -1001234567890"
                            />
                            <p className="mt-1 text-xs text-stone-500">ID grup atau personal chat</p>
                        </div>

                        <div className="space-y-3">
                            <p className={labelClass}>Notifikasi Aktif:</p>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={data.notify_new_event}
                                    onChange={(e) => setData('notify_new_event', e.target.checked)}
                                    className="rounded border-stone-300 text-rose-400 focus:ring-rose-400"
                                />
                                <span className="text-sm text-stone-700 text-stone-500">Client Baru</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={data.notify_new_payment}
                                    onChange={(e) => setData('notify_new_payment', e.target.checked)}
                                    className="rounded border-stone-300 text-rose-400 focus:ring-rose-400"
                                />
                                <span className="text-sm text-stone-700 text-stone-500">Pembayaran Baru</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={data.notify_schedule}
                                    onChange={(e) => setData('notify_schedule', e.target.checked)}
                                    className="rounded border-stone-300 text-rose-400 focus:ring-rose-400"
                                />
                                <span className="text-sm text-stone-700 text-stone-500">Jadwal Fitting/Konsultasi</span>
                            </label>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded bg-rose-400 px-6 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                            >
                                Simpan Pengaturan
                            </button>
                            <button
                                type="button"
                                onClick={test}
                                disabled={processing}
                                className="rounded bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                            >
                                🧪 Test Kirim Pesan
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
