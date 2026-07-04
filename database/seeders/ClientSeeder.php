<?php

namespace Database\Seeders;

use App\Models\Event;
use Faker\Factory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ClientSeeder extends Seeder
{
    /**
     * Seed the application's clients.
     */
    public function run(): void
    {
        $faker = Factory::create();
        $data = [];
        for ($i = 1; $i <= 20; $i++) {
            $data[] = [
                'name' => $faker->name(),
                'mobile_phone' => $faker->phoneNumber(),
                // Generate dates spanning a reasonable period (e.g., last year)
                'date' => $faker->dateTimeBetween('-1 year', 'tomorrow')->format('Y-m-d'),
                'time' => $faker->dateTimeBetween('-1 year', 'tomorrow')->format('H:i'),
                'address' => $faker->streetAddress(),
                'location' => $faker->city(),
                'package_description' => $faker->sentence(6),
                'total_amount' => $faker->randomFloat(2, 50000, 1500000), // Random amount between 50k and 1.5M
                'order_type' => $i % 2 === 0 ? 2 : 1, // Alternate order types (1 or 2)
                'is_fully_paid' => $i % 3 !== 0, // Make some unpaid
                'uuid' => (string) Str::uuid(),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        Event::insert($data);
    }
}
