<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeOwnerBonus extends Model
{
    protected $fillable = [
        'user_id',
        'bonus_month',
        'amount',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'bonus_month' => 'date:Y-m-d',
        'amount' => 'double',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
