<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TelegramSetting extends Model
{
    protected $fillable = [
        'bot_token',
        'chat_id',
        'notify_new_event',
        'notify_new_payment',
        'notify_event_date_changed',
        'notify_event_deleted',
        'notify_schedule',
        'notify_daily_summary',
        'notify_leave_request',
    ];

    protected $casts = [
        'notify_new_event' => 'boolean',
        'notify_new_payment' => 'boolean',
        'notify_event_date_changed' => 'boolean',
        'notify_event_deleted' => 'boolean',
        'notify_schedule' => 'boolean',
        'notify_daily_summary' => 'boolean',
        'notify_leave_request' => 'boolean',
    ];

    public static function getInstance(): ?self
    {
        return self::first();
    }

    public static function isConfigured(): bool
    {
        $settings = self::first();
        return $settings && !empty($settings->bot_token) && !empty($settings->chat_id);
    }
}
