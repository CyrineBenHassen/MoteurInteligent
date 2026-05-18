<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Notifications\ResetPasswordNotification;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id',  
        'avatar',  
        'onboarding_completed',  // ← ajoute
        'onboarding_data',       // ← ajoute   
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'onboarding_completed' => 'boolean',  
        'onboarding_data'      => 'array', 
    ];

    public function sendPasswordResetNotification($token)
{
    $this->notify(new ResetPasswordNotification($token));
}

public function generations()
{
    return $this->hasMany(Generation::class);
}

public function projects()
{
    return $this->hasMany(\App\Models\Project::class);
}

}