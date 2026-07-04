<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DynamicFormTemplate extends Model
{
    protected $fillable = [
        'field_name',
        'field_label',
        'field_type',
        'field_options',
        'is_required',
        'sort_order',
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'sort_order' => 'integer',
    ];
}
