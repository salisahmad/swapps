<?php

namespace Database\Seeders;

use App\Models\Item;
use App\Models\ItemType;
use App\Models\User;
use Illuminate\Database\Seeder;

class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        $types = collect([
            'Gaun Pengantin',
            'Gaun Resepsi',
            'Kebaya',
            'Basofi',
            'Beskap',
            'Aksesoris',
        ])->mapWithKeys(fn (string $name) => [
            $name => ItemType::firstOrCreate(['name' => $name]),
        ]);

        $creatorId = User::query()->value('id');
        $levels = array_keys(Item::PREMIUM_LEVELS);
        $sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

        for ($i = 1; $i <= 50; $i++) {
            $typeName = $types->keys()[($i - 1) % $types->count()];
            $level = $levels[($i - 1) % count($levels)];
            $basePrice = 350000 + (($i % 10) * 150000);

            $item = Item::updateOrCreate(
                ['code' => 'KTG-' . str_pad((string) $i, 3, '0', STR_PAD_LEFT)],
                [
                    'name' => $this->itemName($typeName, $i),
                    'description' => $this->description($typeName, $level, $i),
                    'item_type_id' => $types[$typeName]->id,
                    'is_sold' => false,
                    'is_rentable' => $i % 13 !== 0,
                    'is_premium' => $level === Item::LEVEL_PREMIUM,
                    'premium_level' => $level,
                    'rental_price' => $basePrice,
                    'package_rental_price' => $basePrice + 500000,
                    'created_by' => $creatorId,
                ],
            );

            $item->variants()->delete();

            collect($sizes)
                ->slice($i % 3, 3)
                ->values()
                ->each(function (string $size, int $index) use ($item, $i) {
                    $item->variants()->create([
                        'size' => $size,
                        'stock' => (($i + $index) % 4) + 1,
                    ]);
                });
        }
    }

    private function itemName(string $typeName, int $number): string
    {
        $themes = ['Ayla', 'Nadira', 'Kaluna', 'Aruna', 'Saras', 'Mahira'];

        return $typeName . ' ' . $themes[$number % count($themes)] . ' ' . str_pad((string) $number, 2, '0', STR_PAD_LEFT);
    }

    private function description(string $typeName, string $level, int $number): string
    {
        $materials = ['lace premium', 'payet halus', 'satin bridal', 'tile bordir', 'brokat modern'];

        return sprintf(
            '%s level %s dengan bahan %s, cocok untuk katalog dummy dan simulasi pemilihan client.',
            $typeName,
            Item::PREMIUM_LEVELS[$level] ?? 'Standart',
            $materials[$number % count($materials)],
        );
    }
}
