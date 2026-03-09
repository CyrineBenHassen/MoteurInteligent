<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\SettingsController;

# Register and login
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

# Forgot-password and reset-password
Route::post('/auth/forgot-password', [PasswordResetController::class, 'forgotPassword']);
Route::post('/auth/reset-password',  [PasswordResetController::class, 'resetPassword']);

# Routes protégées
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout',     [AuthController::class,    'logout']);
    Route::get('/me',               [AuthController::class,    'me']);

    # Profile
    Route::put('/profile/update',   [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);

    # Settings
    Route::get('/settings',         [SettingsController::class, 'index']);
    Route::put('/settings/update',  [SettingsController::class, 'update']);
    
    #update avatar
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar']);
});