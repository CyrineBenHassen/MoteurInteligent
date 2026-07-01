<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScheduledTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'project_id', 'name', 'description', 'test_type', 'url',
        'schedule_type', 'cron', 'notify_email', 'status', 'next_run',
        'last_run', 'last_status', 'username', 'password',
    ];

    protected $casts = [
        'notify_email' => 'boolean',
        'next_run' => 'datetime',
        'last_run' => 'datetime',
        'password' => 'encrypted',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}