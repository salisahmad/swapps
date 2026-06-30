<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('item_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->char('code', 20)->index();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('item_type_id')->nullable()->constrained('item_types')->nullOnDelete();
            $table->boolean('is_sold')->default(false)->index();
            $table->boolean('is_premium')->default(false);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();
        });

        // Pivot: event_item
        Schema::create('event_item', function (Blueprint $table) {
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_id')->constrained()->cascadeOnDelete();
            $table->unique(['event_id', 'item_id']);
            $table->index('event_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_item');
        Schema::dropIfExists('items');
        Schema::dropIfExists('item_types');
    }
};
