<?php

namespace App\Http\Controllers;

use App\Models\NotificationRead;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function markRead(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'key' => 'required|string|max:255',
        ]);

        NotificationRead::firstOrCreate([
            'user_id' => auth()->id(),
            'notification_key' => $validated['key'],
        ], [
            'read_at' => now(),
        ]);

        return redirect()->back();
    }

    public function markAllRead(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'keys' => 'nullable|array',
            'keys.*' => 'string|max:255',
        ]);

        foreach ($validated['keys'] ?? [] as $key) {
            NotificationRead::firstOrCreate([
                'user_id' => auth()->id(),
                'notification_key' => $key,
            ], [
                'read_at' => now(),
            ]);
        }

        return redirect()->back();
    }
}
