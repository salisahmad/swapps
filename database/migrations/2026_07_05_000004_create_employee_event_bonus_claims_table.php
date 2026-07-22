<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_event_bonus_claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->date('work_month');
            $table->text('description');
            $table->tinyInteger('status')->default(0);
            $table->decimal('amount', 14, 2)->default(0);
            $table->text('review_notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'work_month', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_event_bonus_claims');
    }
};
