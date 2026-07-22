<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->where('role', 2)
            ->update(['role' => User::ROLE_OWNER]);

        DB::table('users')
            ->where('role', 3)
            ->update(['role' => User::ROLE_MANAGER]);
    }

    public function down(): void
    {
        DB::table('users')
            ->where('role', User::ROLE_MANAGER)
            ->update(['role' => 3]);

        DB::table('users')
            ->where('role', User::ROLE_OWNER)
            ->update(['role' => 2]);
    }
};
