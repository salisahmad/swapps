<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tabel Events (Client + Booking utama di legacy)
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);              // Nama pengantin/client
            $table->string('mobile_phone', 20);       // WhatsApp
            $table->date('date');                     // Tanggal event
            $table->time('time')->nullable();         // Jam acara
            $table->text('address')->nullable();      // Alamat lengkap
            $table->string('location')->nullable();   // Link Google Maps / lokasi
            $table->text('package_description')->nullable(); // Deskripsi paket
            $table->double('total_amount')->default(0); // Total harga deal
            $table->tinyInteger('order_type')->default(1); // 1=MUA, 2=Gaun, 3=TIME_PERIOD
            $table->boolean('is_fully_paid')->default(false);
            $table->uuid('uuid')->unique();
            $table->string('google_event_id')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();

            $table->index('date');
            $table->index('is_fully_paid');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
