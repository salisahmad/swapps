<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->tinyInteger('is_expense')->default(0)->index(); // 0=earning, 1=expense, 2=additional_cost
            $table->tinyInteger('type')->nullable(); // sub-type
            $table->dateTime('payment_at')->nullable();
            $table->tinyInteger('payment_type')->default(0); // 0=cash, 1=transfer, 2=qris, etc.
            $table->double('amount')->default(0);
            $table->text('description')->nullable();
            $table->tinyInteger('status')->default(0); // 0=pending, 1=confirmed, 2=rejected
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
