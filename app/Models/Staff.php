<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Staff extends Model
{
    protected $fillable = [
        'name', 'role', 'phone', 'email', 'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}
