<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('client_events', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('mobile_phone')->nullable();
            $table->date('date');
            $table->time('time')->nullable();
            $table->text('address')->nullable();
            $table->text('location')->nullable();
            $table->text('package_description')->nullable();
            $table->decimal('total_amount', 10, 2);
            $table->integer('order_type');
            $table->boolean('is_fully_paid');
            $table->uuid('uuid')->unique()->nullable();
            $table->string('google_event_id')->nullable();
            $table->foreignId('created_by')->constrained('users'); // Assuming 'users' table exists for created_by
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('client_events');
    }
};