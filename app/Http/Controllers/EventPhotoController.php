<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventPhoto;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Laravel\Facades\Image;

class EventPhotoController extends Controller
{
    public function store(Request $request, Event $event): RedirectResponse
    {
        $validated = $request->validate([
            'photos' => 'required|array|min:1|max:20',
            'photos.*' => 'required|image|max:5120',
        ]);

        foreach ($request->file('photos', []) as $photo) {
            $event->photos()->create([
                'path' => $this->compressAndStoreImage($photo),
                'original_name' => $photo->getClientOriginalName(),
                'created_by' => auth()->id(),
            ]);
        }

        return redirect()->route('events.show', $event)->with('success', count($validated['photos']) . ' foto client berhasil diupload.');
    }

    public function destroy(Event $event, EventPhoto $photo): RedirectResponse
    {
        if ($photo->event_id !== $event->id) {
            abort(404);
        }

        Storage::disk('public')->delete($photo->path);
        $photo->delete();

        return redirect()->route('events.show', $event)->with('success', 'Foto client berhasil dihapus.');
    }

    private function compressAndStoreImage($file): string
    {
        $image = Image::decodePath($file->getRealPath());
        $image->scaleDown(width: 1400);

        $filename = 'client-photos/' . uniqid() . '.jpg';

        Storage::disk('public')->makeDirectory('client-photos');
        Storage::disk('public')->put($filename, $image->encodeUsingFileExtension('jpg', quality: 82));

        return $filename;
    }
}
