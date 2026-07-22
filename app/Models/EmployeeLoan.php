<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmployeeLoan extends Model
{
    protected $fillable = [
        'borrower_type',
        'user_id',
        'vendor_name',
        'vendor_phone',
        'loan_date',
        'amount',
        'status',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'borrower_type' => 'integer',
        'loan_date' => 'date:Y-m-d',
        'amount' => 'double',
        'status' => 'integer',
    ];

    protected $appends = [
        'borrower_type_name',
        'status_name',
        'paid_amount',
        'remaining_amount',
        'borrower_name',
    ];

    public const BORROWER_EMPLOYEE = 1;
    public const BORROWER_VENDOR = 2;

    public const STATUS_ACTIVE = 1;
    public const STATUS_PAID = 2;
    public const STATUS_CANCELLED = 3;

    public const BORROWER_TYPES = [
        self::BORROWER_EMPLOYEE => 'Pegawai',
        self::BORROWER_VENDOR => 'Vendor Rekanan',
    ];

    public const STATUSES = [
        self::STATUS_ACTIVE => 'Aktif',
        self::STATUS_PAID => 'Lunas',
        self::STATUS_CANCELLED => 'Dibatalkan',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(EmployeeLoanPayment::class);
    }

    public function getBorrowerTypeNameAttribute(): string
    {
        return self::BORROWER_TYPES[$this->borrower_type] ?? 'Pegawai';
    }

    public function getStatusNameAttribute(): string
    {
        return self::STATUSES[$this->status] ?? 'Aktif';
    }

    public function getPaidAmountAttribute(): float
    {
        if ($this->relationLoaded('payments')) {
            return (float) $this->payments->sum('amount');
        }

        return (float) $this->payments()->sum('amount');
    }

    public function getRemainingAmountAttribute(): float
    {
        return max(0, (float) $this->amount - $this->paid_amount);
    }

    public function getBorrowerNameAttribute(): string
    {
        return $this->borrower_type === self::BORROWER_VENDOR
            ? (string) $this->vendor_name
            : (string) $this->user?->name;
    }
}
