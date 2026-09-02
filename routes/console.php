<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('db:backup')
    ->dailyAt(env('BACKUP_DATABASE_TIME', '02:00'))
    ->when(fn () => !filter_var(env('BACKUP_DATABASE_EVERY_TWO_DAYS', false), FILTER_VALIDATE_BOOLEAN) || now()->day % 2 === 0)
    ->withoutOverlapping();

Schedule::command('telegram:daily-summary')
    ->dailyAt('06:00')
    ->withoutOverlapping();

Schedule::command('queue:work --queue=google-calendar --stop-when-empty --tries=5 --timeout=120')
    ->everyMinute()
    ->withoutOverlapping();
