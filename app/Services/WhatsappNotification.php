<?php

namespace App\Services;

use App\Models\WhatsappSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsappNotification
{
    private ?WhatsappSetting $settings;

    public function __construct()
    {
        $this->settings = WhatsappSetting::getInstance();
    }

    public function isConfigured(): bool
    {
        return !empty($this->settings?->api_token);
    }

    public function sendMessage(string $phone, string $message): array
    {
        if (!$this->isConfigured()) {
            return [
                'success' => false,
                'message' => 'WhatsApp belum dikonfigurasi. Isi API token terlebih dahulu.',
            ];
        }

        $target = $this->normalizePhone($phone);
        $apiUrl = $this->settings->api_url ?: 'https://api.fonnte.com/send';

        try {
            $response = Http::timeout(20)
                ->withHeaders([
                    'Authorization' => $this->settings->api_token,
                ])
                ->asForm()
                ->post($apiUrl, [
                    'target' => $target,
                    'message' => $message,
                ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'message' => 'Pesan test berhasil dikirim ke WhatsApp.',
                ];
            }

            $body = trim($response->body());

            return [
                'success' => false,
                'message' => 'Gagal kirim WhatsApp. Response provider: ' . mb_substr($body ?: $response->status(), 0, 180),
            ];
        } catch (\Throwable $e) {
            Log::error('WhatsApp notification failed: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Gagal kirim WhatsApp. Cek token, koneksi, dan nomor tujuan.',
            ];
        }
    }

    public function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?: '';

        if (str_starts_with($digits, '0')) {
            return '62' . substr($digits, 1);
        }

        return $digits;
    }
}
