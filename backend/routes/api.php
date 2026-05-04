<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\GenerationController;
use App\Http\Controllers\Api\ProjectController;   // ← ajoute ça

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

Route::post('/auth/forgot-password', [PasswordResetController::class, 'forgotPassword']);
Route::post('/auth/reset-password',  [PasswordResetController::class, 'resetPassword']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout',     [AuthController::class,    'logout']);
    Route::get('/me',               [AuthController::class,    'me']);

    Route::put('/profile/update',   [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);
    Route::post('/profile/avatar',  [ProfileController::class, 'updateAvatar']);

    Route::get('/settings',         [SettingsController::class, 'index']);
    Route::put('/settings/update',  [SettingsController::class, 'update']);

    Route::post('/generate',              [GenerationController::class, 'generate']);
    Route::get('/generations',            [GenerationController::class, 'index']);
    Route::get('/generations/{id}',       [GenerationController::class, 'show']);
    Route::delete('/generations/{id}',    [GenerationController::class, 'destroy']);
    Route::post('/analyze',               [GenerationController::class, 'analyze']);
    Route::get('/generations/{id}/pdf',   [GenerationController::class, 'downloadPdf']);
    Route::post('/crawl',                 [GenerationController::class, 'crawl']);

    // Projects                            // ← propre, dans le même groupe
    Route::get('/projects',               [ProjectController::class, 'index']);
    Route::post('/projects',              [ProjectController::class, 'store']);
    Route::delete('/projects/{id}',       [ProjectController::class, 'destroy']);
    Route::get('/projects/{id}/generations', [ProjectController::class, 'generations']);
});