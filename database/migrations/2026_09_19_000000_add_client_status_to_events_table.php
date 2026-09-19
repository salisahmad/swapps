<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->string('status', 20)->default('active')->after('order_type')->index();
        });

        Schema::table('events', function (Blueprint $table) {
            $table->date('date')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->date('date')->nullable(false)->change();
            $table->dropColumn('status');
        });
    }
};
