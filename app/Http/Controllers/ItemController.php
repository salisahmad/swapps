<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\ItemType;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Intervention\Image\Laravel\Facades\Image;

class ItemController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Item::with(['type', 'variants'])->orderBy('code');

        if ($request->filled('q')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->q . '%')
                  ->orWhere('code', 'like', '%' . $request->q . '%')
                  ->orWhere('description', 'like', '%' . $request->q . '%');
            });
        }

        if ($request->filled('item_type_id')) {
            $query->where('item_type_id', $request->item_type_id);
        }

        if ($request->filled('is_sold')) {
            $query->where('is_sold', $request->is_sold === '1');
        }

        if ($request->filled('is_rentable')) {
            $query->where('is_rentable', $request->is_rentable === '1');
        }

        if ($request->filled('premium_level')) {
            $query->where('premium_level', $request->premium_level);
        }

        $items = $query->paginate(15)->withQueryString();
        $itemTypes = ItemType::all();

        return Inertia::render('Items/Index', [
            'items' => $items,
            'itemTypes' => $itemTypes,
            'premiumLevels' => Item::PREMIUM_LEVELS,
            'filters' => $request->only(['q', 'item_type_id', 'is_sold', 'is_rentable', 'premium_level']),
        ]);
    }

    public function search(Request $request)
    {
        $request->validate([
            'q' => 'nullable|string|max:100',
            'order_type' => 'nullable|integer|in:1,2',
        ]);

        $query = Item::with(['type', 'variants'])
            ->where('is_sold', false)
            ->orderBy('code');

        if ((int) $request->input('order_type') === Event::ORDER_TYPE_GOWN) {
            $query->where('is_rentable', true);
        }

        if ($request->filled('q')) {
            $query->where(function ($q) use ($request) {
                $q->where('code', 'like', '%' . $request->q . '%')
                    ->orWhere('name', 'like', '%' . $request->q . '%')
                    ->orWhere('description', 'like', '%' . $request->q . '%');
            });
        }

        return response()->json($query->take(30)->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:items',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'item_type_id' => 'nullable|exists:item_types,id',
            'premium_level' => 'required|string|in:premium,standart,spesial',
            'rental_price' => 'nullable|numeric|min:0',
            'package_rental_price' => 'nullable|numeric|min:0',
            'is_rentable' => 'nullable|boolean',
            'image' => 'nullable|image|max:5120',
            'variants' => 'nullable|array',
            'variants.*.size' => 'required_with:variants|string|max:50',
            'variants.*.stock' => 'nullable|integer|min:0',
        ]);

        $variantsProvided = $request->has('variants');
        $variants = $validated['variants'] ?? [];
        unset($validated['variants'], $validated['image'], $validated['remove_image']);

        $validated['is_premium'] = $validated['premium_level'] === Item::LEVEL_PREMIUM;
        $validated['rental_price'] = $validated['rental_price'] ?? 0;
        $validated['package_rental_price'] = $validated['package_rental_price'] ?? 0;
        $validated['is_rentable'] = $request->has('is_rentable')
            ? $request->boolean('is_rentable')
            : true;
        $validated['created_by'] = auth()->id();

        if ($request->hasFile('image')) {
            $validated['image_path'] = $this->compressAndStoreImage($request->file('image'));
        }

        $item = Item::create($validated);
        $this->syncVariants($item, $variants);

        return redirect()->back()->with('success', 'Item berhasil ditambahkan.');
    }

    public function update(Request $request, Item $item)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:items,code,' . $item->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'item_type_id' => 'nullable|exists:item_types,id',
            'premium_level' => 'required|string|in:premium,standart,spesial',
            'rental_price' => 'nullable|numeric|min:0',
            'package_rental_price' => 'nullable|numeric|min:0',
            'is_rentable' => 'nullable|boolean',
            'is_sold' => 'boolean',
            'image' => 'nullable|image|max:5120',
            'remove_image' => 'nullable|boolean',
            'variants' => 'nullable|array',
            'variants.*.size' => 'required_with:variants|string|max:50',
            'variants.*.stock' => 'nullable|integer|min:0',
        ]);

        $variantsProvided = $request->has('variants');
        $variants = $validated['variants'] ?? [];
        unset($validated['variants'], $validated['image'], $validated['remove_image']);

        $validated['is_premium'] = $validated['premium_level'] === Item::LEVEL_PREMIUM;
        $validated['rental_price'] = $validated['rental_price'] ?? 0;
        $validated['package_rental_price'] = $validated['package_rental_price'] ?? 0;
        $validated['is_rentable'] = $request->has('is_rentable')
            ? $request->boolean('is_rentable')
            : $item->is_rentable;

        if ($request->boolean('remove_image') && $item->image_path) {
            Storage::disk('public')->delete($item->image_path);
            $validated['image_path'] = null;
        }

        if ($request->hasFile('image')) {
            if ($item->image_path) {
                Storage::disk('public')->delete($item->image_path);
            }

            $validated['image_path'] = $this->compressAndStoreImage($request->file('image'));
        }

        $item->update($validated);

        if ($variantsProvided) {
            $this->syncVariants($item, $variants);
        }

        return redirect()->back()->with('success', 'Item berhasil diupdate.');
    }

    public function destroy(Item $item)
    {
        if ($item->image_path) {
            Storage::disk('public')->delete($item->image_path);
        }

        $item->delete();
        return redirect()->back()->with('success', 'Item berhasil dihapus.');
    }

    private function syncVariants(Item $item, array $variants): void
    {
        $cleanVariants = collect($variants)
            ->map(fn ($variant) => [
                'size' => trim($variant['size'] ?? ''),
                'stock' => max(0, (int) ($variant['stock'] ?? 0)),
            ])
            ->filter(fn ($variant) => $variant['size'] !== '')
            ->unique('size')
            ->values();

        $item->variants()->delete();

        $cleanVariants->each(function ($variant) use ($item) {
            $item->variants()->create($variant);
        });
    }

    private function compressAndStoreImage($file): string
    {
        $image = Image::decodePath($file->getRealPath());
        $image->scaleDown(width: 1200);

        $filename = 'catalog/' . uniqid() . '.jpg';

        Storage::disk('public')->makeDirectory('catalog');
        Storage::disk('public')->put($filename, $image->encodeUsingFileExtension('jpg', quality: 82));

        return $filename;
    }
}
