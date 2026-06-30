<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StaffController extends Controller
{
    public function index(Request $request): Response
    {
        $query = User::whereIn('role', [User::ROLE_ADMIN, User::ROLE_STAFF]);

        if ($request->filled('q')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->q . '%')
                  ->orWhere('email', 'like', '%' . $request->q . '%')
                  ->orWhere('mobile_phone', 'like', '%' . $request->q . '%');
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        $staff = $query->orderBy('role')->orderBy('name')->paginate(15)->withQueryString();

        return Inertia::render('Staff/Index', [
            'staff' => $staff,
            'filters' => $request->only(['q', 'role']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'mobile_phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:6',
            'role' => 'required|integer|in:2,3',
        ]);

        $validated['password'] = bcrypt($validated['password']);

        User::create($validated);

        return redirect()->back()->with('success', 'Staff berhasil ditambahkan.');
    }

    public function update(Request $request, User $staff)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $staff->id,
            'mobile_phone' => 'nullable|string|max:20',
            'role' => 'required|integer|in:2,3',
        ]);

        if ($request->filled('password')) {
            $validated['password'] = bcrypt($request->password);
        }

        $staff->update($validated);

        return redirect()->back()->with('success', 'Staff berhasil diupdate.');
    }

    public function destroy(User $staff)
    {
        $staff->delete();
        return redirect()->back()->with('success', 'Staff berhasil dihapus.');
    }
}
