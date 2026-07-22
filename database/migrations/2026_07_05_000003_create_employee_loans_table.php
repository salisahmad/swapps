<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_loans', function (Blueprint $table) {
            $table->id();
            $table->tinyInteger('borrower_type')->default(1);
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('vendor_name')->nullable();
            $table->string('vendor_phone', 30)->nullable();
            $table->date('loan_date');
            $table->decimal('amount', 14, 2);
            $table->tinyInteger('status')->default(1);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['borrower_type', 'status', 'loan_date']);
        });

        Schema::create('employee_loan_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_loan_id')->constrained()->cascadeOnDelete();
            $table->date('payment_date');
            $table->decimal('amount', 14, 2);
            $table->string('payment_method', 50)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_loan_payments');
        Schema::dropIfExists('employee_loans');
    }
};
