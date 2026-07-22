<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Observer for Client model will be added later if needed
        \App\Models\Event::observe(\App\Observers\EventObserver::class);
        \App\Models\Payment::observe(\App\Observers\PaymentObserver::class);
        \App\Models\Schedule::observe(\App\Observers\ScheduleObserver::class);
    }
}
