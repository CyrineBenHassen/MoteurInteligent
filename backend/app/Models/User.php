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
        'phone',
        'company',
        'position', 
        'onboarding_completed',  // ← ajoute
        'onboarding_data',
        'last_login_ip',    // ← AJOUTE
        'last_login_at',    // ← AJOUTE 
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
        'last_login_at'        => 'datetime', 
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