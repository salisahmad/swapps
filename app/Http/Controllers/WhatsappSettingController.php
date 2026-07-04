<?php

namespace App\Http\Controllers;

use App\Models\WhatsappSetting;
use App\Services\WhatsappNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WhatsappSettingController extends Controller
{
    public function index(): Response
    {
        $settings = WhatsappSetting::firstOrCreate([], [
            'provider' => 'fonnte',
            'api_url' => 'https://api.fonnte.com/send',
            'test_message' => "Halo, ini test konfirmasi dari Shofi Wedding.\nJika pesan ini masuk, koneksi WhatsApp CS sudah siap.",
        ]);

        return Inertia::render('Whatsapp/Settings', [
            'settings' => [
                'provider' => $settings->provider,
                'api_url' => $settings->api_url ?: 'https://api.fonnte.com/send',
                'sender_number' => $settings->sender_number,
                'test_phone' => $settings->test_phone,
                'test_message' => $settings->test_message,
                'has_api_token' => !empty($settings->api_token),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'provider' => 'required|string|in:fonnte',
            'api_url' => 'nullable|url|max:255',
            'api_token' => 'nullable|string',
            'sender_number' => 'nullable|string|max:30',
            'test_phone' => 'nullable|string|max:30',
            'test_message' => 'nullable|string|max:1000',
        ]);

        $settings = WhatsappSetting::firstOrCreate([]);
        $payload = collect($validated)->except('api_token')->all();

        if ($request->filled('api_token')) {
            $payload['api_token'] = $validated['api_token'];
        }

        $settings->update($payload);

        return redirect()->back()->with('success', 'Pengaturan WhatsApp disimpan.');
    }

    public function test(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'test_phone' => 'required|string|max:30',
            'test_message' => 'required|string|max:1000',
        ]);

        $settings = WhatsappSetting::firstOrCreate([]);
        $settings->update([
            'test_phone' => $validated['test_phone'],
            'test_message' => $validated['test_message'],
        ]);

        $whatsapp = new WhatsappNotification();
        $result = $whatsapp->sendMessage($validated['test_phone'], $validated['test_message']);

        return redirect()
            ->back()
            ->with($result['success'] ? 'success' : 'error', $result['message']);
    }
}
