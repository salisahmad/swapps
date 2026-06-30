<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\DynamicForm;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DynamicFormController extends Controller
{
    public function edit(int $eventId): Response
    {
        $event = Event::findOrFail($eventId);
        $event->load('dynamicForms');

        return Inertia::render('DynamicForms/Edit', [
            'event' => $event,
        ]);
    }

    public function update(Request $request, int $eventId)
    {
        $event = Event::findOrFail($eventId);

        // Delete existing forms
        DynamicForm::where('event_id', $eventId)->delete();

        // Create new forms
        if ($request->has('fields')) {
            foreach ($request->fields as $index => $field) {
                DynamicForm::create([
                    'event_id' => $eventId,
                    'field_name' => $field['field_name'],
                    'field_label' => $field['field_label'],
                    'field_type' => $field['field_type'],
                    'field_options' => $field['field_options'] ?? null,
                    'field_value' => $field['field_value'] ?? null,
                    'is_required' => $field['is_required'] ?? false,
                    'sort_order' => $index,
                ]);
            }
        }

        return redirect()->back()->with('success', 'Form berita acara berhasil disimpan.');
    }

    public function show(string $uuid): Response
    {
        $event = Event::where('uuid', $uuid)->firstOrFail();
        $event->load(['dynamicForms' => function ($query) {
            $query->orderBy('sort_order');
        }]);

        return Inertia::render('DynamicForms/Show', [
            'event' => $event,
            'dynamicForms' => $event->dynamicForms,
        ]);
    }

    public function submit(Request $request, string $uuid)
    {
        $event = Event::where('uuid', $uuid)->firstOrFail();

        if ($request->has('values')) {
            foreach ($request->values as $fieldId => $value) {
                DynamicForm::where('event_id', $event->id)
                    ->where('id', $fieldId)
                    ->update(['field_value' => $value]);
            }
        }

        return redirect()->back()->with('success', 'Berita acara berhasil disimpan.');
    }
}
