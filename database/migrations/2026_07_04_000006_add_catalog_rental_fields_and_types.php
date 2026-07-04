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
            $table->decimal('rental_price', 14, 2)->default(0)->after('image_path');
            $table->decimal('package_rental_price', 14, 2)->default(0)->after('rental_price');
            $table->boolean('is_rentable')->default(true)->after('is_sold')->index();
        });

        foreach (['Kebaya', 'Basofi'] as $name) {
            DB::table('item_types')->updateOrInsert(
                ['name' => $name],
                ['created_at' => now(), 'updated_at' => now()],
            );
        }
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn(['rental_price', 'package_rental_price', 'is_rentable']);
        });
    }
};
