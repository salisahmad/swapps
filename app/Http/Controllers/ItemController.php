<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\ItemType;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ItemController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Item::with('type')->orderBy('code');

        if ($request->filled('q')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->q . '%')
                  ->orWhere('code', 'like', '%' . $request->q . '%');
            });
        }

        if ($request->filled('item_type_id')) {
            $query->where('item_type_id', $request->item_type_id);
        }

        if ($request->filled('is_sold')) {
            $query->where('is_sold', $request->is_sold === '1');
        }

        if ($request->filled('is_premium')) {
            $query->where('is_premium', $request->is_premium === '1');
        }

        $items = $query->paginate(15)->withQueryString();
        $itemTypes = ItemType::all();

        return Inertia::render('Items/Index', [
            'items' => $items,
            'itemTypes' => $itemTypes,
            'filters' => $request->only(['q', 'item_type_id', 'is_sold', 'is_premium']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:items',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'item_type_id' => 'nullable|exists:item_types,id',
            'is_premium' => 'boolean',
        ]);

        $validated['created_by'] = auth()->id();

        Item::create($validated);

        return redirect()->back()->with('success', 'Item berhasil ditambahkan.');
    }

    public function update(Request $request, Item $item)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:items,code,' . $item->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'item_type_id' => 'nullable|exists:item_types,id',
            'is_premium' => 'boolean',
            'is_sold' => 'boolean',
        ]);

        $item->update($validated);

        return redirect()->back()->with('success', 'Item berhasil diupdate.');
    }

    public function destroy(Item $item)
    {
        $item->delete();
        return redirect()->back()->with('success', 'Item berhasil dihapus.');
    }
}
