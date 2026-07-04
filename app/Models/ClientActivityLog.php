<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientActivityLog extends Model
{
    protected $fillable = [
        'event_id',
        'user_id',
        'type',
        'message',
        'before',
        'after',
    ];

    protected $casts = [
        'before' => 'array',
        'after' => 'array',
    ];

    public const TYPE_CREATED = 'created';
    public const TYPE_TOTAL_CHANGED = 'total_changed';
    public const TYPE_DATE_CHANGED = 'date_changed';
    public const TYPE_PAYMENT_CHANGED = 'payment_changed';
    public const TYPE_DELETE_REQUESTED = 'delete_requested';
    public const TYPE_DELETE_APPROVED = 'delete_approved';
    public const TYPE_DELETED = 'deleted';

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
