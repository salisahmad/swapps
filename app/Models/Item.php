<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Item extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code', 'name', 'description', 'item_type_id', 'is_sold', 'is_rentable', 'is_premium', 'premium_level', 'image_path', 'rental_price', 'package_rental_price', 'created_by',
    ];

    protected $casts = [
        'is_sold' => 'boolean',
        'is_rentable' => 'boolean',
        'is_premium' => 'boolean',
        'item_type_id' => 'integer',
        'rental_price' => 'double',
        'package_rental_price' => 'double',
    ];

    protected $appends = [
        'type_name',
        'premium_level_name',
        'image_url',
        'total_stock',
        'stock_summary',
    ];

    public const LEVEL_PREMIUM = 'premium';
    public const LEVEL_STANDARD = 'standart';
    public const LEVEL_SPECIAL = 'spesial';

    public const PREMIUM_LEVELS = [
        self::LEVEL_PREMIUM => 'Premium',
        self::LEVEL_STANDARD => 'Standart',
        self::LEVEL_SPECIAL => 'Spesial',
    ];

    public function type(): BelongsTo
    {
        return $this->belongsTo(ItemType::class, 'item_type_id');
    }

    public function events(): BelongsToMany
    {
        return $this->belongsToMany(Event::class, 'event_item');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ItemVariant::class)->orderBy('size');
    }

    public function photos(): HasMany
    {
        return $this->hasMany(ItemPhoto::class)->latest();
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getTypeNameAttribute(): ?string
    {
        return $this->type?->name;
    }

    public function getPremiumLevelNameAttribute(): string
    {
        return self::PREMIUM_LEVELS[$this->premium_level] ?? 'Standart';
    }

    public function getImageUrlAttribute(): ?string
    {
        if ($this->relationLoaded('photos') && $this->photos->isNotEmpty()) {
            return $this->photos->first()->url;
        }

        return $this->image_path ? Storage::url($this->image_path) : null;
    }

    public function getTotalStockAttribute(): int
    {
        if ($this->relationLoaded('variants')) {
            return (int) $this->variants->sum('stock');
        }

        return (int) $this->variants()->sum('stock');
    }

    public function getStockSummaryAttribute(): string
    {
        $variants = $this->relationLoaded('variants')
            ? $this->variants
            : $this->variants()->get(['size', 'stock']);

        if ($variants->isEmpty()) {
            return '-';
        }

        return $variants
            ->map(fn (ItemVariant $variant) => "{$variant->size}: {$variant->stock}")
            ->join(', ');
    }
}
