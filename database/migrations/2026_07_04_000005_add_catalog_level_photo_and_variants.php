<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->string('premium_level')->default('standart')->after('is_premium')->index();
            $table->string('image_path')->nullable()->after('premium_level');
        });

        DB::table('items')
            ->where('is_premium', true)
            ->update(['premium_level' => 'premium']);

        Schema::create('item_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('items')->cascadeOnDelete();
            $table->string('size', 50);
            $table->unsignedInteger('stock')->default(0);
            $table->timestamps();

            $table->unique(['item_id', 'size']);
            $table->index('item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_variants');

        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn(['premium_level', 'image_path']);
        });
    }
};
