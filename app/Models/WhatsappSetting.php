<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WhatsappSetting extends Model
{
    protected $fillable = [
        'provider',
        'api_url',
        'api_token',
        'sender_number',
        'test_phone',
        'test_message',
    ];

    public static function getInstance(): ?self
    {
        return self::first();
    }

    public static function isConfigured(): bool
    {
        $settings = self::first();

        return $settings && !empty($settings->api_token);
    }
}
