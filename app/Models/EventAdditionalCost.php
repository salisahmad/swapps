<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventAdditionalCost extends Model
{
    protected $fillable = [
        'event_id',
        'type',
        'total',
        'notes',
    ];

    protected $casts = [
        'total' => 'double',
    ];

    public const TYPE_TRANSPORT = 'Transport';
    public const TYPE_PHOTO_VIDEO = 'Foto/Video';
    public const TYPE_MELATI = 'Melati';
    public const TYPE_MC = 'MC';
    public const TYPE_HAIRDO = 'Hairdo';
    public const TYPE_HENA = 'Hena';
    public const TYPE_DECOR = 'Dekor';
    public const TYPE_OTHER = 'Tambahan';

    public const TYPES = [
        self::TYPE_TRANSPORT,
        self::TYPE_PHOTO_VIDEO,
        self::TYPE_MELATI,
        self::TYPE_MC,
        self::TYPE_HAIRDO,
        self::TYPE_HENA,
        self::TYPE_DECOR,
        self::TYPE_OTHER,
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}
