<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Generation extends Model
{
    protected $fillable = [
        'user_id',
        'url',
        'framework',
        'test_type',
        'status',
        'test_cases',
        'test_cases_selenium',
        'test_cases_cypress',
        'script',
        'script_selenium',
        'script_playwright',
        'script_cypress',
        'execution_results',
        'load_time_ms',
        'is_spa',
        'pass_count',
        'fail_count',
        'skip_count',
        'pass_rate',
        'page_type',
        'scraped',
    ];

    protected $casts = [
        'test_cases'          => 'array',
        'test_cases_selenium' => 'array',
        'test_cases_cypress'  => 'array',
        'execution_results'   => 'array',
        'scraped'             => 'array',
        'is_spa'              => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}