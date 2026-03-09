<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserSetting extends Model
{
    protected $fillable = [
        'user_id',
        'email_notifications',
        'weekly_report',
        'default_framework',
    ];
}