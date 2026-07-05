<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Schedule extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'event_id',
        'type',
        'schedule_from',
        'schedule_to',
        'prospect_name',
        'prospect_mobile_phone',
        'description',
        'google_event_id',
        'created_by',
    ];

    protected $casts = [
        'schedule_from' => 'datetime',
        'schedule_to' => 'datetime',
        'type' => 'integer',
    ];

    protected $appends = [
        'type_name',
        'client_name',
        'client_phone',
        'client_status_name',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class)->withTrashed();
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

    public function getClientNameAttribute(): string
    {
        return $this->event?->name ?? $this->prospect_name ?? '-';
    }

    public function getClientPhoneAttribute(): ?string
    {
        return $this->event?->mobile_phone ?? $this->prospect_mobile_phone;
    }

    public function getClientStatusNameAttribute(): string
    {
        return $this->event?->order_type_name ?? 'Calon Client';
    }
}
