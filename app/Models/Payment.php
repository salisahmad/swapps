<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'event_id', 'is_expense', 'type', 'payment_at', 'payment_type', 'amount', 'operational_cut', 'receipt_image', 'description', 'status', 'created_by',
    ];

    protected $casts = [
        'is_expense' => 'integer',
        'type' => 'integer',
        'payment_at' => 'datetime:Y-m-d',
        'payment_type' => 'integer',
        'amount' => 'double',
        'operational_cut' => 'double',
        'status' => 'integer',
    ];

    protected $appends = [
        'type_name',
        'status_name',
        'payment_type_name',
        'net_amount',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    const EARNING = 0;
    const EXPENSE = 1;
    const ADDITIONAL_COST = 2;

    const TYPES = [
        self::EARNING => 'Pemasukan',
        self::EXPENSE => 'Pengeluaran',
        self::ADDITIONAL_COST => 'Biaya Tambahan',
    ];

    const STATUS_PENDING = 0;
    const STATUS_CONFIRMED = 1;
    const STATUS_REJECTED = 2;

    const STATUSES = [
        self::STATUS_PENDING => 'Pending',
        self::STATUS_CONFIRMED => 'Dikonfirmasi',
        self::STATUS_REJECTED => 'Ditolak',
    ];

    const PAYMENT_OTHER = 0;
    const PAYMENT_CASH = 1;
    const PAYMENT_BCA = 2;
    const PAYMENT_MANDIRI = 3;
    const PAYMENT_BRI = 4;
    const PAYMENT_QRIS = 5;

    const PAYMENT_TYPES = [
        self::PAYMENT_OTHER => 'Lainnya',
        self::PAYMENT_CASH => 'Cash',
        self::PAYMENT_BCA => 'BCA',
        self::PAYMENT_MANDIRI => 'Mandiri',
        self::PAYMENT_BRI => 'BRI',
        self::PAYMENT_QRIS => 'QRIS',
    ];

    public function getTypeNameAttribute(): string
    {
        return self::TYPES[$this->is_expense] ?? 'Unknown';
    }

    public function getStatusNameAttribute(): string
    {
        return self::STATUSES[$this->status] ?? 'Unknown';
    }

    public function getPaymentTypeNameAttribute(): string
    {
        return self::PAYMENT_TYPES[$this->payment_type] ?? 'Unknown';
    }

    public function getNetAmountAttribute(): float
    {
        return $this->amount - $this->operational_cut;
    }
}
