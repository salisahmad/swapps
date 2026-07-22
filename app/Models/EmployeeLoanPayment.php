<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeLoanPayment extends Model
{
    protected $fillable = [
        'employee_loan_id',
        'payment_date',
        'amount',
        'payment_method',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'payment_date' => 'date:Y-m-d',
        'amount' => 'double',
    ];

    public function loan(): BelongsTo
    {
        return $this->belongsTo(EmployeeLoan::class, 'employee_loan_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
