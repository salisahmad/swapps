<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('address')->nullable()->after('mobile_phone');
            $table->date('join_date')->nullable()->after('address');
            $table->string('employment_status', 20)->default(User::STATUS_ACTIVE)->after('join_date');
            $table->decimal('base_salary', 14, 2)->default(0)->after('employment_status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'address',
                'join_date',
                'employment_status',
                'base_salary',
            ]);
        });
    }
};
