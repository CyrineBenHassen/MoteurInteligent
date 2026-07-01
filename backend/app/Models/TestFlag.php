<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TestFlag extends Model
{
    protected $fillable = ['project_id', 'url', 'test_type', 'test_name', 'status', 'user_id'];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}