<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Generation extends Model
{
    protected $fillable = [
        'user_id',
        'url',
        'framework',
        'status',
        'test_cases',
        'script',
        'load_time_ms',
        'is_spa',
    ];

    protected $casts = [
        'test_cases' => 'array',
        'is_spa'     => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}