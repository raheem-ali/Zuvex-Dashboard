<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\PublicationController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\TeamMemberController;
use Illuminate\Support\Facades\Route;

// ---------- Public (website reads these) ----------
Route::get('/services', [ServiceController::class, 'publicIndex']);
Route::get('/team', [TeamMemberController::class, 'publicIndex']);
Route::get('/publications', [PublicationController::class, 'publicIndex']);
Route::get('/publications/{publication}/download', [PublicationController::class, 'download']);
Route::get('/projects', [ProjectController::class, 'publicIndex']);
Route::get('/projects/{project:slug}', [ProjectController::class, 'publicShow']);

// 5 login attempts per minute per IP
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

// ---------- Protected (dashboard) ----------
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::prefix('admin')->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index']);

        Route::get('profile', [ProfileController::class, 'show']);
        Route::put('profile', [ProfileController::class, 'update']);
        Route::put('profile/password', [ProfileController::class, 'updatePassword'])->middleware('throttle:5,1');

        Route::post('services/reorder', [ServiceController::class, 'reorder']);
        Route::apiResource('services', ServiceController::class);

        Route::post('team/reorder', [TeamMemberController::class, 'reorder']);
        Route::apiResource('team', TeamMemberController::class);

        Route::apiResource('publications', PublicationController::class);

        Route::post('projects/reorder', [ProjectController::class, 'reorder']);
        Route::apiResource('projects', ProjectController::class);
    });
});