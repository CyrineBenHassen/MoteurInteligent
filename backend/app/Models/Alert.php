<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Alert extends Model
{
    protected $fillable = [
        'project_id',
        'url',
        'test_type',
        'test_name',
        'framework',
        'status',
        'previous_status',
        'flakiness_score',
        'message',
        'read',
        'notified_n8n',
    ];

    protected $casts = [
        'read'         => 'boolean',
        'notified_n8n' => 'boolean',
    ];
}
