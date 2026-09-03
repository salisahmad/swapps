<?php

use App\Http\Controllers\CalendarController;
use App\Http\Controllers\ClientHistoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DynamicFormController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\EventPhotoController;
use App\Http\Controllers\GoogleCalendarSettingController;
use App\Http\Controllers\GoogleCalendarSyncController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\TelegramSettingController;
use App\Http\Controllers\WhatsappSettingController;
use App\Models\Item;
use App\Models\WhatsappSetting;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

Route::get('/', function () {
    $featuredItems = collect();

    if (Schema::hasTable('items')) {
        $featuredItems = Item::with(['type', 'photos', 'variants'])
            ->where('is_rentable', true)
            ->where('is_sold', false)
            ->latest()
            ->take(6)
            ->get()
            ->map(fn (Item $item) => [
                'id' => $item->id,
                'code' => $item->code,
                'name' => $item->name,
                'type_name' => $item->type_name,
                'premium_level_name' => $item->premium_level_name,
                'image_url' => $item->image_url,
                'rental_price' => $item->rental_price,
                'package_rental_price' => $item->package_rental_price,
                'stock_summary' => $item->stock_summary,
            ]);
    }

    $whatsapp = Schema::hasTable('whatsapp_settings') ? WhatsappSetting::getInstance() : null;
    $whatsappNumber = preg_replace('/\D+/', '', $whatsapp?->sender_number ?: $whatsapp?->test_phone ?: '') ?: null;

    return Inertia::render('Welcome', [
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
        'featuredItems' => $featuredItems,
        'whatsappNumber' => $whatsappNumber,
    ]);
});

Route::get('/sw-admin/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::post('/notifications/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');

    Route::redirect('/events', '/clients')->name('clients.index');
    Route::get('/clients', [EventController::class, 'index'])->name('events.index');
    Route::get('/calendar', [CalendarController::class, 'index'])->name('calendar.index');

    Route::middleware('operational')->group(function () {
        Route::get('/clients/by-date', [EventController::class, 'byDate'])->name('events.by-date');
        Route::get('/client-history', [ClientHistoryController::class, 'index'])->name('client-history.index');
        Route::post('/clients/{event}/photos', [EventPhotoController::class, 'store'])->name('events.photos.store');
        Route::delete('/clients/{event}/photos/{photo}', [EventPhotoController::class, 'destroy'])->name('events.photos.destroy');
        Route::resource('clients', EventController::class)
            ->except(['index', 'show'])
            ->names('events')
            ->parameters(['clients' => 'event']);
        Route::post('/clients/{event}/approve-delete', [EventController::class, 'approveDelete'])->name('events.approve-delete');

        Route::get('/items/search', [ItemController::class, 'search'])->name('items.search');
        Route::delete('/items/{item}/photos/{photo}', [ItemController::class, 'destroyPhoto'])->name('items.photos.destroy');
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

        // Google Calendar Settings
        Route::get('/google-calendar-settings', [GoogleCalendarSettingController::class, 'index'])->name('google-calendar.settings');
        Route::patch('/google-calendar-settings', [GoogleCalendarSettingController::class, 'update'])->name('google-calendar.update');
        Route::post('/google-calendar-connect', [GoogleCalendarSettingController::class, 'connect'])->name('google-calendar.connect');
        Route::get('/google-calendar-callback', [GoogleCalendarSettingController::class, 'callback'])->name('google-calendar.callback');
        Route::post('/google-calendar-disconnect', [GoogleCalendarSettingController::class, 'disconnect'])->name('google-calendar.disconnect');
        Route::post('/google-calendar-sync', [GoogleCalendarSettingController::class, 'sync'])->name('google-calendar.sync');
        Route::get('/google-calendar-sync', [GoogleCalendarSyncController::class, 'index'])->name('google-calendar.sync.index');
        Route::post('/google-calendar-sync/retry', [GoogleCalendarSyncController::class, 'retry'])->name('google-calendar.sync.retry');
        Route::post('/google-calendar-sync/retry-all', [GoogleCalendarSyncController::class, 'retryAll'])->name('google-calendar.sync.retry-all');

        // Reports
        Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    });

    // Staff Management
    Route::post('/staff/leave-requests', [StaffController::class, 'storeLeave'])->name('staff.leave.store');
    Route::patch('/staff/leave-requests/{leave}', [StaffController::class, 'updateLeaveStatus'])->name('staff.leave.update-status');
    Route::post('/staff/loans', [StaffController::class, 'storeLoan'])->name('staff.loans.store');
    Route::post('/staff/loans/payments', [StaffController::class, 'storeBorrowerLoanPayment'])->name('staff.loans.borrower-payments.store');
    Route::post('/staff/loans/{loan}/payments', [StaffController::class, 'storeLoanPayment'])->name('staff.loans.payments.store');
    Route::post('/staff/event-bonus-claims', [StaffController::class, 'storeEventBonusClaim'])->name('staff.event-bonuses.store');
    Route::patch('/staff/event-bonus-claims/{claim}', [StaffController::class, 'updateEventBonusClaim'])->name('staff.event-bonuses.update');
    Route::delete('/staff/event-bonus-claims/{claim}', [StaffController::class, 'destroyEventBonusClaim'])->name('staff.event-bonuses.destroy');
    Route::post('/staff/owner-bonuses', [StaffController::class, 'storeOwnerBonus'])->name('staff.owner-bonuses.store');
    Route::patch('/staff/owner-bonuses/{bonus}', [StaffController::class, 'updateOwnerBonus'])->name('staff.owner-bonuses.update');
    Route::delete('/staff/owner-bonuses/{bonus}', [StaffController::class, 'destroyOwnerBonus'])->name('staff.owner-bonuses.destroy');
    Route::resource('staff', StaffController::class)->only(['index', 'store', 'update', 'destroy']);

    // Dynamic Forms (Admin)
    Route::middleware('operational')->group(function () {
        Route::get('/settings/berita-acara', [DynamicFormController::class, 'templateEdit'])->name('dynamic-form-templates.edit');
        Route::post('/settings/berita-acara', [DynamicFormController::class, 'templateUpdate'])->name('dynamic-form-templates.update');
        Route::post('/clients/{event}/dynamic-forms/sync-latest', [DynamicFormController::class, 'syncLatestTemplate'])->name('dynamic-forms.sync-latest');
        Route::get('/clients/{event}/dynamic-forms', [DynamicFormController::class, 'edit'])->name('dynamic-forms.edit');
        Route::post('/clients/{event}/dynamic-forms', [DynamicFormController::class, 'update'])->name('dynamic-forms.update');
    });

    Route::get('/clients/{event}', [EventController::class, 'show'])
        ->whereUuid('event')
        ->name('events.show');
});

// Dynamic Forms (Public - Client facing, no auth required)
Route::get('/berita-acara/{uuid}', [DynamicFormController::class, 'show'])->name('dynamic-forms.show');
Route::post('/berita-acara/{uuid}', [DynamicFormController::class, 'submit'])->name('dynamic-forms.submit');

require __DIR__.'/auth.php';
