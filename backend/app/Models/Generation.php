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
        'script_selenium',      // 🆕
        'script_cypress',       // 🆕
         'execution_results', // 🆕
        'test_cases_selenium',  // 🆕
        'test_cases_cypress',   // 🆕
        'load_time_ms',
        'is_spa',
        'pass_count',           // 🆕
        'fail_count',           // 🆕
        'skip_count',           // 🆕
        'pass_rate',            // 🆕
    ];

    protected $casts = [
        'test_cases'          => 'array',
        'test_cases_selenium' => 'array', // 🆕
        'test_cases_cypress'  => 'array', // 🆕
        'execution_results'   => 'array',
        'is_spa'              => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}