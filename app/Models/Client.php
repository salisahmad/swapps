<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    protected $fillable = [
        'name', 'phone', 'email', 'address', 'event_date', 'event_type', 'event_location', 'notes'
    ];

    protected $casts = [
        'event_date' => 'date'
    ];

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}
