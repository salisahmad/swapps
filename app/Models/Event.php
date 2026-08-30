<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Event extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'mobile_phone',
        'date',
        'time',
        'address',
        'location',
        'package_description',
        'total_amount',
        'discount_amount',
        'order_type',
        'is_fully_paid',
        'uuid',
        'google_event_id',
        'google_sync_status',
        'google_sync_attempts',
        'google_synced_at',
        'google_sync_error',
        'created_by',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'time' => 'datetime:H:i',
        'total_amount' => 'double',
        'discount_amount' => 'double',
        'order_type' => 'integer',
        'is_fully_paid' => 'boolean',
        'google_sync_attempts' => 'integer',
        'google_synced_at' => 'datetime',
    ];

    protected $appends = [
        'order_type_name',
        'additional_cost_total',
        'grand_total',
    ];

    public const ORDER_TYPE_MUA = 1;
    public const ORDER_TYPE_GOWN = 2;
    public const ORDER_TYPE_TIME_PERIOD = 3;

    public const GOOGLE_SYNC_PENDING = 'pending';
    public const GOOGLE_SYNC_SYNCED = 'synced';
    public const GOOGLE_SYNC_FAILED = 'failed';
    public const GOOGLE_SYNC_SKIPPED = 'skipped';
    public const GOOGLE_SYNC_DELETED = 'deleted';

    public const ORDER_TYPES = [
        self::ORDER_TYPE_MUA => 'MUA',
        self::ORDER_TYPE_GOWN => 'Sewa Gaun',
        self::ORDER_TYPE_TIME_PERIOD => 'Time Period',
    ];

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function items(): BelongsToMany
    {
        return $this->belongsToMany(Item::class, 'event_item');
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function additionalCosts(): HasMany
    {
        return $this->hasMany(EventAdditionalCost::class);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(EventPhoto::class)->latest();
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ClientActivityLog::class);
    }

    public function dynamicForms(): HasMany
    {
        return $this->hasMany(DynamicForm::class)->orderBy('sort_order');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getOrderTypeNameAttribute(): string
    {
        return self::ORDER_TYPES[(int) $this->order_type] ?? 'Unknown';
    }

    public function getAdditionalCostTotalAttribute(): float
    {
        if ($this->relationLoaded('additionalCosts')) {
            return (float) $this->additionalCosts->sum('total');
        }

        return (float) $this->additionalCosts()->sum('total');
    }

    public function getGrandTotalAttribute(): float
    {
        return max(0, (float) $this->total_amount + $this->additional_cost_total - (float) $this->discount_amount);
    }
}
