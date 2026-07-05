<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\EventPhotoController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\DynamicFormController;
use App\Http\Controllers\TelegramSettingController;
use App\Http\Controllers\WhatsappSettingController;
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

    Route::post('/notifications/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');

    Route::redirect('/events', '/clients')->name('clients.index');

    Route::get('/clients/by-date', [EventController::class, 'byDate'])->name('events.by-date');
    Route::post('/clients/{event}/photos', [EventPhotoController::class, 'store'])->name('events.photos.store');
    Route::delete('/clients/{event}/photos/{photo}', [EventPhotoController::class, 'destroy'])->name('events.photos.destroy');
    Route::resource('clients', EventController::class)
        ->names('events')
        ->parameters(['clients' => 'event']);
    Route::post('/clients/{event}/approve-delete', [EventController::class, 'approveDelete'])->name('events.approve-delete');

    Route::get('/items/search', [ItemController::class, 'search'])->name('items.search');
    Route::resource('items', ItemController::class);

    Route::get('/schedules/taken-times', [ScheduleController::class, 'takenTimes'])->name('schedules.taken-times');
    Route::resource('schedules', ScheduleController::class);

    Route::resource('payments', PaymentController::class);
    Route::post('/payments/{payment}/confirm', [PaymentController::class, 'confirm'])->name('payments.confirm');
    Route::post('/payments/{payment}/reject', [PaymentController::class, 'reject'])->name('payments.reject');

    // Telegram Settings
    Route::get('/telegram-settings', [TelegramSettingController::class, 'index'])->name('telegram.settings');
    Route::patch('/telegram-settings', [TelegramSettingController::class, 'update'])->name('telegram.update');
    Route::post('/telegram-test', [TelegramSettingController::class, 'test'])->name('telegram.test');

    // WhatsApp Settings
    Route::get('/whatsapp-settings', [WhatsappSettingController::class, 'index'])->name('whatsapp.settings');
    Route::patch('/whatsapp-settings', [WhatsappSettingController::class, 'update'])->name('whatsapp.update');
    Route::post('/whatsapp-test', [WhatsappSettingController::class, 'test'])->name('whatsapp.test');

    // Reports
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');

    // Staff Management
    Route::resource('staff', StaffController::class);

    // Dynamic Forms (Admin)
    Route::get('/settings/berita-acara', [DynamicFormController::class, 'templateEdit'])->name('dynamic-form-templates.edit');
    Route::post('/settings/berita-acara', [DynamicFormController::class, 'templateUpdate'])->name('dynamic-form-templates.update');
    Route::post('/clients/{event}/dynamic-forms/sync-latest', [DynamicFormController::class, 'syncLatestTemplate'])->name('dynamic-forms.sync-latest');
    Route::get('/clients/{event}/dynamic-forms', [DynamicFormController::class, 'edit'])->name('dynamic-forms.edit');
    Route::post('/clients/{event}/dynamic-forms', [DynamicFormController::class, 'update'])->name('dynamic-forms.update');
});

// Dynamic Forms (Public - Client facing, no auth required)
Route::get('/berita-acara/{uuid}', [DynamicFormController::class, 'show'])->name('dynamic-forms.show');
Route::post('/berita-acara/{uuid}', [DynamicFormController::class, 'submit'])->name('dynamic-forms.submit');

require __DIR__.'/auth.php';
