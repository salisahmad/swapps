<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->string('google_sync_status', 20)->default('pending')->after('google_event_id');
            $table->unsignedSmallInteger('google_sync_attempts')->default(0)->after('google_sync_status');
            $table->timestamp('google_synced_at')->nullable()->after('google_sync_attempts');
            $table->text('google_sync_error')->nullable()->after('google_synced_at');

            $table->index('google_sync_status');
        });

        Schema::table('schedules', function (Blueprint $table) {
            $table->string('google_sync_status', 20)->default('pending')->after('google_event_id');
            $table->unsignedSmallInteger('google_sync_attempts')->default(0)->after('google_sync_status');
            $table->timestamp('google_synced_at')->nullable()->after('google_sync_attempts');
            $table->text('google_sync_error')->nullable()->after('google_synced_at');

            $table->index('google_sync_status');
        });

        DB::table('events')
            ->whereNotNull('google_event_id')
            ->update([
                'google_sync_status' => 'synced',
                'google_synced_at' => now(),
            ]);

        DB::table('events')
            ->whereNull('google_event_id')
            ->update(['google_sync_status' => 'skipped']);

        DB::table('schedules')
            ->whereNotNull('google_event_id')
            ->update([
                'google_sync_status' => 'synced',
                'google_synced_at' => now(),
            ]);

        DB::table('schedules')
            ->whereNull('google_event_id')
            ->update(['google_sync_status' => 'skipped']);
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropIndex(['google_sync_status']);
            $table->dropColumn([
                'google_sync_status',
                'google_sync_attempts',
                'google_synced_at',
                'google_sync_error',
            ]);
        });

        Schema::table('schedules', function (Blueprint $table) {
            $table->dropIndex(['google_sync_status']);
            $table->dropColumn([
                'google_sync_status',
                'google_sync_attempts',
                'google_synced_at',
                'google_sync_error',
            ]);
        });
    }
};
