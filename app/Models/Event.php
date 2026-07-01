<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Event extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name', 'mobile_phone', 'date', 'time', 'address', 'location',
        'package_description', 'total_amount', 'order_type', 'is_fully_paid',
        'uuid', 'google_event_id', 'created_by',
    ];

    protected $casts = [
        'date' => 'datetime:Y-m-d',
        'time' => 'datetime:H:i',
        'total_amount' => 'double',
        'order_type' => 'integer',
        'is_fully_paid' => 'boolean',
    ];

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class);
    }

    public function items(): BelongsToMany
    {
        return $this->belongsToMany(Item::class, 'event_item');
    }

    public function dynamicForms(): HasMany
    {
        return $this->hasMany(DynamicForm::class)->orderBy('sort_order');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getPaidAmountAttribute(): float
    {
        return $this->payments()
            ->where('is_expense', 0)
            ->where('status', 1)
            ->sum('amount');
    }

    public function getRemainingAmountAttribute(): float
    {
        return $this->total_amount - $this->paid_amount;
    }

    public function getEarningsAttribute(): float
    {
        return $this->paid_amount;
    }

    public function getExpensesAttribute(): float
    {
        return $this->payments()
            ->where('is_expense', 1)
            ->where('status', 1)
            ->sum('amount');
    }

    public function getProfitAttribute(): float
    {
        return $this->earnings - $this->expenses;
    }

    public function getMobilePhoneNumberAttribute(): ?string
    {
        $phone = $this->mobile_phone;
        if (!$phone) return null;
        if (str_starts_with($phone, '0')) {
            $phone = '62' . substr($phone, 1);
        }
        return $phone;
    }

    const TYPE_MUA = 1;
    const TYPE_GAUN = 2;

    const ORDER_TYPES = [
        self::TYPE_MUA => 'MUA',
        self::TYPE_GAUN => 'Sewa Gaun',
    ];

    public function getOrderTypeNameAttribute(): string
    {
        return self::ORDER_TYPES[$this->order_type] ?? 'Unknown';
    }

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($event) {
            if (empty($event->uuid)) {
                $event->uuid = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }
}
