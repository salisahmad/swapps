<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_leave_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->tinyInteger('leave_type')->default(1);
            $table->date('start_date');
            $table->date('end_date');
            $table->unsignedSmallInteger('days');
            $table->tinyInteger('status')->default(0);
            $table->text('reason')->nullable();
            $table->text('review_notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['user_id', 'status', 'start_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_leave_requests');
    }
};
