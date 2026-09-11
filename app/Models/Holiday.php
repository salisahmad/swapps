<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Holiday extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'start_date',
        'end_date',
        'description',
        'google_event_id',
        'google_sync_status',
        'google_sync_attempts',
        'google_synced_at',
        'google_sync_error',
        'created_by',
    ];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
        'google_sync_attempts' => 'integer',
        'google_synced_at' => 'datetime',
    ];

    public const GOOGLE_SYNC_PENDING = 'pending';
    public const GOOGLE_SYNC_SYNCED = 'synced';
    public const GOOGLE_SYNC_FAILED = 'failed';
    public const GOOGLE_SYNC_SKIPPED = 'skipped';
    public const GOOGLE_SYNC_DELETED = 'deleted';

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function containsDate(string $date): bool
    {
        return $this->start_date?->lte($date) && $this->end_date?->gte($date);
    }
}
