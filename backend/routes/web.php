<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\GoogleController;

Route::get('/', function () {
    return view('welcome');
});


Route::get('/auth/google', [GoogleController::class, 'redirect']);
Route::get('/auth/google/callback', [GoogleController::class, 'callback']);

// ✅ Route pour le lien de reset password dans l'email
Route::get('/reset-password/{token}', function ($token) {
    $email = request('email');
    $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
    return redirect("{$frontendUrl}/reset-password?token={$token}&email={$email}");
})->name('password.reset');