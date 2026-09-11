<?php

namespace App\Http\Controllers;

use App\Models\Holiday;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HolidayController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Holidays/Index', [
            'holidays' => Holiday::query()
                ->with('creator:id,name')
                ->orderByDesc('start_date')
                ->get(),
            'canManage' => auth()->user()->isOwner(),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeOwner();
        $validated = $this->validateHoliday($request);

        $holiday = Holiday::create([
            ...$validated,
            'created_by' => auth()->id(),
        ]);

        return back()->with('success', 'Hari libur berhasil ditambahkan.');
    }

    public function update(Request $request, Holiday $holiday)
    {
        $this->authorizeOwner();
        $holiday->update($this->validateHoliday($request));

        return back()->with('success', 'Hari libur berhasil diperbarui.');
    }

    public function destroy(Holiday $holiday)
    {
        $this->authorizeOwner();
        $holiday->delete();

        return back()->with('success', 'Hari libur berhasil dihapus.');
    }

    private function validateHoliday(Request $request): array
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'description' => 'nullable|string',
        ]);

        return $validated;
    }

    private function authorizeOwner(): void
    {
        abort_unless(auth()->user()?->isOwner(), 403);
    }
}
