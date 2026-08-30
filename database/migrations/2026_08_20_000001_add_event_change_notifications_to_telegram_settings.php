<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('telegram_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('telegram_settings', 'notify_event_date_changed')) {
                $table->boolean('notify_event_date_changed')->default(true)->after('notify_new_payment');
            }
            if (!Schema::hasColumn('telegram_settings', 'notify_event_deleted')) {
                $table->boolean('notify_event_deleted')->default(true)->after('notify_event_date_changed');
            }
        });
    }

    public function down(): void
    {
        Schema::table('telegram_settings', function (Blueprint $table) {
            if (Schema::hasColumn('telegram_settings', 'notify_event_deleted')) {
                $table->dropColumn('notify_event_deleted');
            }
            if (Schema::hasColumn('telegram_settings', 'notify_event_date_changed')) {
                $table->dropColumn('notify_event_date_changed');
            }
        });
    }
};
