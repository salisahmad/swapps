<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoogleCalendarSetting extends Model
{
    protected $fillable = [
        'enabled',
        'client_id',
        'client_secret',
        'calendar_id',
        'color_id',
        'access_token',
        'refresh_token',
        'token_expires_at',
        'connected_email',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'token_expires_at' => 'datetime',
    ];

    public static function getInstance(): self
    {
        return self::firstOrCreate([], [
            'calendar_id' => 'primary',
            'color_id' => '4',
        ]);
    }

    public function isConfigured(): bool
    {
        return $this->enabled
            && filled($this->client_id)
            && filled($this->client_secret)
            && filled($this->refresh_token);
    }
}
