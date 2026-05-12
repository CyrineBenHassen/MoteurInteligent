<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword as BaseResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends BaseResetPassword
{
    public function toMail($notifiable)
    {
        // ✅ URL pointe vers ton frontend React
        $url = config('app.frontend_url', 'http://localhost:5173')
             . '/reset-password'
             . '?token=' . $this->token
             . '&email=' . urlencode($notifiable->email);

        $count = config('auth.passwords.' . config('auth.defaults.passwords') . '.expire', 60);

        return (new MailMessage)
            ->subject('Reset Your NexTest Password')
            ->view('emails.reset-password', [
                'url'   => $url,
                'count' => $count,
                'user'  => $notifiable,
            ]);
    }
}