<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dynamic_forms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->string('field_name'); // Nama field (e.g. "nama_pengantin", "alamat")
            $table->string('field_label'); // Label yang tampil (e.g. "Nama Pengantin")
            $table->string('field_type')->default('text'); // text, textarea, select, number, date, time
            $table->text('field_options')->nullable(); // JSON untuk options (select, radio)
            $table->text('field_value')->nullable(); // Nilai yang diisi client
            $table->boolean('is_required')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('event_id');
            $table->index('sort_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dynamic_forms');
    }
};