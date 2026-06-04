<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\GenerationController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\OnboardingController;


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
    Route::delete('/profile/delete', [ProfileController::class, 'deleteAccount']);
    Route::get('/profile', [ProfileController::class, 'show']);


    Route::get('/settings',         [SettingsController::class, 'index']);
    Route::put('/settings/update',  [SettingsController::class, 'update']);

    Route::post('/generate',             [GenerationController::class, 'generate']);
    Route::post('/analyze',              [GenerationController::class, 'analyze']);
    Route::post('/crawl',                [GenerationController::class, 'crawl']);
    Route::post('/run',                  [GenerationController::class, 'run']);

    Route::get('/generations',           [GenerationController::class, 'index']);
    Route::delete('/generations/all',    [GenerationController::class, 'destroyAll']);
    Route::post('/generations/generate-api', [GenerationController::class, 'generateApi']);
    Route::post('/generations/generate-security', [GenerationController::class, 'generateSecurity']);
    Route::post('/generations/generate-regression', [GenerationController::class, 'generateRegression']);
    Route::post('/generations/generate-functional', [GenerationController::class, 'generateFunctional']);
    Route::post('/generations/generate-performance', [GenerationController::class, 'generatePerformance']);
    Route::get('/generations/{id}',      [GenerationController::class, 'show']);
    Route::delete('/generations/{id}',   [GenerationController::class, 'destroy']);
    Route::get('/generations/{id}/pdf',  [GenerationController::class, 'downloadPdf']);
    #internel test
    Route::post('/generate-internal', [GenerationController::class, 'generateInternal']);
    


    Route::get('/projects',                      [ProjectController::class, 'index']);
    Route::post('/projects',                     [ProjectController::class, 'store']);
    Route::put('/projects/{id}',                 [ProjectController::class, 'update']);
    Route::delete('/projects/{id}',              [ProjectController::class, 'destroy']);
    Route::get('/projects/{id}/generations',     [ProjectController::class, 'generations']);
    Route::post('/onboarding', [OnboardingController::class, 'store']);

});