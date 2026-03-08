<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PasswordResetController;


Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});


Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/me',           [AuthController::class, 'me']);
});

Route::post('/auth/forgot-password', [PasswordResetController::class, 'forgotPassword']);
Route::post('/auth/reset-password',  [PasswordResetController::class, 'resetPassword']);