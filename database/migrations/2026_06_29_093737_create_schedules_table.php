<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->nullable()->constrained()->nullOnDelete();
            $table->tinyInteger('type')->default(1); // 1=Fitting, 2=Consultation
            $table->dateTime('schedule_from');
            $table->dateTime('schedule_to')->nullable();
            $table->string('prospect_name')->nullable();
            $table->string('prospect_mobile_phone', 30)->nullable();
            $table->text('description')->nullable();
            $table->string('google_event_id')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();

            $table->index('schedule_from');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
