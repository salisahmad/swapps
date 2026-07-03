<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Schedule extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'event_id', 'type', 'schedule_from', 'schedule_to', 'description', 'google_event_id', 'created_by',
    ];

    protected $casts = [
        'schedule_from' => 'datetime',
        'schedule_to' => 'datetime',
        'type' => 'integer',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(ClientEvent::class)->withTrashed();
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    const TYPE_FITTING = 1;
    const TYPE_CONSULT = 2;

    const TYPES = [
        self::TYPE_FITTING => 'Fitting',
        self::TYPE_CONSULT => 'Konsultasi',
    ];

    public function getTypeNameAttribute(): string
    {
        return self::TYPES[$this->type] ?? 'Unknown';
    }

    public function getDateAttribute(): string
    {
        return $this->schedule_from ? $this->schedule_from->format('Y-m-d') : '';
    }

    public function getTimeAttribute(): string
    {
        return $this->schedule_from ? $this->schedule_from->format('H:i') : '';
    }
}
