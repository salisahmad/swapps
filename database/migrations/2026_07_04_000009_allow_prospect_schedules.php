<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            if (!Schema::hasColumn('schedules', 'prospect_name')) {
                $table->string('prospect_name')->nullable()->after('schedule_to');
            }

            if (!Schema::hasColumn('schedules', 'prospect_mobile_phone')) {
                $table->string('prospect_mobile_phone', 30)->nullable()->after('prospect_name');
            }
        });

        if (DB::getDriverName() === 'mysql') {
            try {
                DB::statement('ALTER TABLE schedules DROP FOREIGN KEY schedules_event_id_foreign');
            } catch (\Throwable) {
                // Constraint may already be absent or changed in another environment.
            }

            DB::statement('ALTER TABLE schedules MODIFY event_id BIGINT UNSIGNED NULL');
            DB::statement('ALTER TABLE schedules ADD CONSTRAINT schedules_event_id_foreign FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL');
        }
    }

    public function down(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            if (Schema::hasColumn('schedules', 'prospect_mobile_phone')) {
                $table->dropColumn('prospect_mobile_phone');
            }

            if (Schema::hasColumn('schedules', 'prospect_name')) {
                $table->dropColumn('prospect_name');
            }
        });
    }
};
