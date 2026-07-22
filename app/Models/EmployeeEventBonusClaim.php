<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeEventBonusClaim extends Model
{
    protected $fillable = [
        'user_id',
        'event_id',
        'work_month',
        'description',
        'status',
        'amount',
        'review_notes',
        'reviewed_by',
        'reviewed_at',
    ];

    protected $casts = [
        'work_month' => 'date:Y-m-d',
        'status' => 'integer',
        'amount' => 'double',
        'reviewed_at' => 'datetime',
    ];

    protected $appends = [
        'status_name',
    ];

    public const STATUS_PENDING = 0;
    public const STATUS_APPROVED = 1;
    public const STATUS_REJECTED = 2;

    public const STATUSES = [
        self::STATUS_PENDING => 'Pending',
        self::STATUS_APPROVED => 'Disetujui',
        self::STATUS_REJECTED => 'Ditolak',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function getStatusNameAttribute(): string
    {
        return self::STATUSES[$this->status] ?? 'Pending';
    }
}
