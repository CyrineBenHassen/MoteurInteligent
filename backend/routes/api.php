<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\GenerationController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\OnboardingController;
use App\Http\Controllers\TestFlagController;
use App\Http\Controllers\FlakyTestController;
use App\Http\Controllers\ScheduledTaskController;



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
    Route::delete('/generations/all', [GenerationController::class, 'destroyAll']);

   Route::get('/flaky-tests', [FlakyTestController::class, 'index']);
Route::post('/flaky-tests/rerun', [FlakyTestController::class, 'rerun']);
Route::get('/flaky-tests/details', [FlakyTestController::class, 'details']);

Route::post('/flaky-tests/record', [FlakyTestController::class, 'record']);
Route::post('/flaky-tests/flag', [TestFlagController::class, 'store']);
Route::delete('/flaky-tests/flag', [TestFlagController::class, 'destroy']);


    Route::post('/generations/generate-api', [GenerationController::class, 'generateApi']);
    Route::post('/generations/generate-security', [GenerationController::class, 'generateSecurity']);
    Route::post('/generations/generate-regression', [GenerationController::class, 'generateRegression']);
    Route::post('/generations/generate-functional', [GenerationController::class, 'generateFunctional']);
    Route::post('/generations/generate-performance', [GenerationController::class, 'generatePerformance']);
    Route::post('/generations/generate-seo', [GenerationController::class, 'generateSeo']);
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

   // Alerts
Route::get('/alerts/unread-count',   [\App\Http\Controllers\Api\AlertController::class, 'unreadCount']);
Route::patch('/alerts/read-all',     [\App\Http\Controllers\Api\AlertController::class, 'markAllRead']);
Route::get('/alerts',                [\App\Http\Controllers\Api\AlertController::class, 'index']);
Route::patch('/alerts/{id}/read',    [\App\Http\Controllers\Api\AlertController::class, 'markRead']);
Route::patch('/alerts/{id}/status', [\App\Http\Controllers\Api\AlertController::class, 'updateStatus']);
Route::delete('/alerts/{id}',       [\App\Http\Controllers\Api\AlertController::class, 'destroy']);


Route::get('/projects/{projectId}/tested-urls', [GenerationController::class, 'testedUrlsForProject']);


// routes/api.php — dans le groupe middleware('auth:sanctum') existant
Route::get('/scheduled-tasks',              [ScheduledTaskController::class, 'index']);
Route::post('/scheduled-tasks',             [ScheduledTaskController::class, 'store']);
Route::put('/scheduled-tasks/{scheduledTask}',     [ScheduledTaskController::class, 'update']);
Route::delete('/scheduled-tasks/{scheduledTask}',  [ScheduledTaskController::class, 'destroy']);
Route::post('/scheduled-tasks/{scheduledTask}/run',     [ScheduledTaskController::class, 'runNow']);
Route::patch('/scheduled-tasks/{scheduledTask}/status', [ScheduledTaskController::class, 'updateStatus']);
});

