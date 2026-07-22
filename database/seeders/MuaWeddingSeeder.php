<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Event;
use App\Models\Schedule;
use App\Models\Payment;
use App\Models\ItemType;
use App\Models\Item;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Carbon\Carbon;

class MuaWeddingSeeder extends Seeder
{
    public function run(): void
    {
        // Users
        $owner = User::create([
            'name' => 'Shofi Owner',
            'email' => 'shofi@wedding.com',
            'password' => bcrypt('password'),
            'role' => User::ROLE_OWNER,
            'mobile_phone' => '08123456789',
        ]);

        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@wedding.com',
            'password' => bcrypt('password'),
            'role' => User::ROLE_MANAGER,
            'mobile_phone' => '08234567890',
        ]);

        // Item Types
        $itemTypes = [
            'Gaun', 'Sepatu', 'Kopyah', 'Aksesoris'
        ];
        foreach ($itemTypes as $name) {
            ItemType::create(['name' => $name]);
        }

        // Items (Catalog)
        $items = [
            ['code' => 'GW001', 'name' => 'Gaun Putih Elegan', 'description' => 'Gaun pengantin putih full brokat', 'item_type_id' => 1, 'is_premium' => true],
            ['code' => 'GW002', 'name' => 'Gaun Merah Meriah', 'description' => 'Gaun tunangan merah kombinasi', 'item_type_id' => 1, 'is_premium' => false],
            ['code' => 'SP001', 'name' => 'Sepatu Hak 5cm', 'description' => 'Sepatu pengantin hak 5cm putih', 'item_type_id' => 2, 'is_premium' => false],
            ['code' => 'KP001', 'name' => 'Kopyah Premium', 'description' => 'Kopyah songket premium', 'item_type_id' => 3, 'is_premium' => true],
            ['code' => 'AK001', 'name' => 'Set Aksesoris Gold', 'description' => 'Kalung, gelang, anting gold', 'item_type_id' => 4, 'is_premium' => true],
        ];
        foreach ($items as $i) {
            Item::create(array_merge($i, ['created_by' => $owner->id]));
        }

        // Events (Clients)
        $events = [
            [
                'name' => 'Aisyah & Fadhil',
                'mobile_phone' => '08111111111',
                'date' => '2026-07-15',
                'time' => '08:00',
                'address' => 'Jl. Mawar No. 1, Jakarta',
                'location' => 'https://maps.google.com/?q=Jakarta',
                'package_description' => 'Paket Wedding Full Day + 2 Makeup Artist',
                'total_amount' => 8500000,
                'order_type' => Event::TYPE_MUA,
            ],
            [
                'name' => 'Siti & Andi',
                'mobile_phone' => '08222222222',
                'date' => '2026-08-20',
                'time' => '10:00',
                'address' => 'Jl. Melati No. 5, Bandung',
                'location' => 'https://maps.google.com/?q=Bandung',
                'package_description' => 'Paket Engagement Makeup',
                'total_amount' => 3500000,
                'order_type' => Event::TYPE_MUA,
            ],
            [
                'name' => 'Putri',
                'mobile_phone' => '08333333333',
                'date' => '2026-09-05',
                'time' => '07:00',
                'address' => 'Jl. Anggrek No. 10, Bali',
                'location' => 'https://maps.google.com/?q=Bali',
                'package_description' => 'Prewedding 3 Look',
                'total_amount' => 4500000,
                'order_type' => Event::TYPE_MUA,
            ],
            [
                'name' => 'Lina',
                'mobile_phone' => '08444444444',
                'date' => '2026-07-22',
                'time' => '18:00',
                'address' => 'Jl. Kenanga No. 3, Jakarta',
                'location' => 'https://maps.google.com/?q=Jakarta',
                'package_description' => 'Party Makeup Glam',
                'total_amount' => 2500000,
                'order_type' => Event::TYPE_MUA,
            ],
            [
                'name' => 'Rani',
                'mobile_phone' => '08555555555',
                'date' => '2026-10-10',
                'time' => '09:00',
                'address' => 'Jl. Cempaka No. 7, Surabaya',
                'location' => 'https://maps.google.com/?q=Surabaya',
                'package_description' => 'Graduation Makeup Soft',
                'total_amount' => 1800000,
                'order_type' => Event::TYPE_MUA,
            ],
        ];

        foreach ($events as $e) {
            $event = Event::create(array_merge($e, [
                'uuid' => (string) Str::uuid(),
                'created_by' => $owner->id,
            ]));

            // Assign random items
            $randomItems = Item::inRandomOrder()->limit(rand(1, 3))->get();
            $event->items()->attach($randomItems);

            // Schedule Fitting (3-5 hari sebelum event)
            Schedule::create([
                'event_id' => $event->id,
                'type' => Schedule::TYPE_FITTING,
                'schedule_from' => Carbon::parse($event->date)->subDays(rand(3, 5))->setTime(14, 0),
                'schedule_to' => Carbon::parse($event->date)->subDays(rand(3, 5))->setTime(16, 0),
                'description' => 'Fitting gaun dan accessories',
                'created_by' => $owner->id,
            ]);

            // Payment DP (30%)
            Payment::create([
                'event_id' => $event->id,
                'is_expense' => Payment::EARNING,
                'amount' => $event->total_amount * 0.3,
                'payment_at' => Carbon::now()->subDays(rand(20, 40)),
                'payment_type' => Payment::PAYMENT_TRANSFER,
                'description' => 'DP 30%',
                'status' => Payment::STATUS_CONFIRMED,
                'created_by' => $owner->id,
            ]);

            // Payment pelunasan (50% kemungkinan)
            if (rand(0, 1)) {
                Payment::create([
                    'event_id' => $event->id,
                    'is_expense' => Payment::EARNING,
                    'amount' => $event->total_amount * 0.7,
                    'payment_at' => Carbon::now()->subDays(rand(5, 15)),
                    'payment_type' => Payment::PAYMENT_CASH,
                    'description' => 'Pelunasan',
                    'status' => Payment::STATUS_CONFIRMED,
                    'created_by' => $owner->id,
                ]);
                $event->update(['is_fully_paid' => true]);
            }

            // Expense (biaya operasional) untuk beberapa event
            if (rand(0, 1)) {
                Payment::create([
                    'event_id' => $event->id,
                    'is_expense' => Payment::EXPENSE,
                    'amount' => rand(100000, 500000),
                    'payment_at' => Carbon::now()->subDays(rand(10, 30)),
                    'payment_type' => Payment::PAYMENT_CASH,
                    'description' => 'Biaya transport & logistik',
                    'status' => Payment::STATUS_CONFIRMED,
                    'created_by' => $owner->id,
                ]);
            }
        }
    }
}
