<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TestExecution extends Model
{
    protected $fillable = [
        'generation_id', 'project_id', 'url', 'test_type',
        'framework', 'test_name', 'status', 'duration_ms', 'executed_at',
    ];

    protected $casts = [
        'executed_at' => 'datetime',
    ];

    public function generation()
    {
        return $this->belongsTo(Generation::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}