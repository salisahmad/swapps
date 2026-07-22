<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeLeaveRequest extends Model
{
    protected $fillable = [
        'user_id',
        'leave_type',
        'start_date',
        'end_date',
        'days',
        'status',
        'reason',
        'review_notes',
        'reviewed_by',
        'reviewed_at',
        'created_by',
    ];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
        'reviewed_at' => 'datetime',
        'leave_type' => 'integer',
        'status' => 'integer',
        'days' => 'integer',
    ];

    protected $appends = [
        'leave_type_name',
        'status_name',
    ];

    public const TYPE_PAID = 1;
    public const TYPE_UNPAID = 2;

    public const STATUS_PENDING = 0;
    public const STATUS_APPROVED = 1;
    public const STATUS_REJECTED = 2;
    public const STATUS_CANCELLED = 3;

    public const TYPES = [
        self::TYPE_PAID => 'Cuti / Libur',
        self::TYPE_UNPAID => 'Unpaid Leave',
    ];

    public const STATUSES = [
        self::STATUS_PENDING => 'Pending',
        self::STATUS_APPROVED => 'Disetujui',
        self::STATUS_REJECTED => 'Ditolak',
        self::STATUS_CANCELLED => 'Dibatalkan',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getLeaveTypeNameAttribute(): string
    {
        return self::TYPES[$this->leave_type] ?? 'Cuti';
    }

    public function getStatusNameAttribute(): string
    {
        return self::STATUSES[$this->status] ?? 'Pending';
    }
}
