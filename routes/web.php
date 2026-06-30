<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\DynamicFormController;
use App\Http\Controllers\TelegramSettingController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\StaffController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::resource('clients', ClientController::class);

    Route::resource('events', EventController::class);

    Route::resource('items', ItemController::class);

    Route::resource('schedules', ScheduleController::class);

    Route::resource('payments', PaymentController::class);
    Route::post('/payments/{payment}/confirm', [PaymentController::class, 'confirm'])->name('payments.confirm');
    Route::post('/payments/{payment}/reject', [PaymentController::class, 'reject'])->name('payments.reject');

    // Telegram Settings
    Route::get('/telegram-settings', [TelegramSettingController::class, 'index'])->name('telegram.settings');
    Route::patch('/telegram-settings', [TelegramSettingController::class, 'update'])->name('telegram.update');
    Route::post('/telegram-test', [TelegramSettingController::class, 'test'])->name('telegram.test');

    // Reports
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');

    // Staff Management
    Route::resource('staff', StaffController::class);

    // Dynamic Forms (Admin)
    Route::get('/events/{event}/dynamic-forms', [DynamicFormController::class, 'edit'])->name('dynamic-forms.edit');
    Route::post('/events/{event}/dynamic-forms', [DynamicFormController::class, 'update'])->name('dynamic-forms.update');
});

// Dynamic Forms (Public - Client facing, no auth required)
Route::get('/berita-acara/{uuid}', [DynamicFormController::class, 'show'])->name('dynamic-forms.show');
Route::post('/berita-acara/{uuid}', [DynamicFormController::class, 'submit'])->name('dynamic-forms.submit');

require __DIR__.'/auth.php';