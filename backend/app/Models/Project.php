<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model {
    protected $fillable = ['user_id', 'name', 'type', 'description', 'pages'];



    protected $casts = [
        'pages' => 'array',  // ← ajoute ça
    ];

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function generations() {
        return $this->hasMany(Generation::class);
    }
}

