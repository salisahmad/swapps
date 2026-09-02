<?php

namespace App\Http\Controllers;

use App\Models\TelegramSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TelegramSettingController extends Controller
{
    public function index(): Response
    {
        $settings = TelegramSetting::firstOrCreate([]);

        return Inertia::render('Telegram/Settings', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'bot_token' => 'nullable|string',
            'chat_id' => 'nullable|string',
            'notify_new_event' => 'boolean',
            'notify_new_payment' => 'boolean',
            'notify_event_date_changed' => 'boolean',
            'notify_event_deleted' => 'boolean',
            'notify_schedule' => 'boolean',
            'notify_daily_summary' => 'boolean',
        ]);

        $settings = TelegramSetting::firstOrCreate([]);
        $settings->update($validated);

        return redirect()->back()->with('success', 'Pengaturan Telegram disimpan.');
    }

    public function test()
    {
        $telegram = new \App\Services\TelegramNotification();

        if (!$telegram->isConfigured()) {
            return redirect()->back()->with('error', 'Telegram belum dikonfigurasi.');
        }

        $sent = $telegram->sendMessage('🧪 <b>Test Notifikasi</b>\n\nPengaturan Telegram berhasil!\n\nShofi Wedding App');

        if ($sent) {
            return redirect()->back()->with('success', 'Pesan test berhasil dikirim ke Telegram!');
        }

        return redirect()->back()->with('error', 'Gagal kirim pesan test. Cek token & chat ID.');
    }
}
