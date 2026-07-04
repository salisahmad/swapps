<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\DynamicForm;
use App\Models\DynamicFormTemplate;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DynamicFormController extends Controller
{
    public function edit(string $eventId): Response
    {
        return $this->templateEdit();
    }

    public function update(Request $request, string $eventId)
    {
        return $this->templateUpdate($request);
    }

    public function templateEdit(): Response
    {
        $this->backfillTemplateFromExistingClientForm();

        return Inertia::render('DynamicForms/Template', [
            'fields' => DynamicFormTemplate::orderBy('sort_order')->get(),
        ]);
    }

    public function templateUpdate(Request $request)
    {
        $validated = $request->validate([
            'fields' => 'nullable|array',
            'fields.*.field_name' => 'required|string|max:255',
            'fields.*.field_label' => 'required|string|max:255',
            'fields.*.field_type' => 'required|string|in:text,textarea,number,date,time,select',
            'fields.*.field_options' => 'nullable|string',
            'fields.*.is_required' => 'boolean',
        ]);

        DynamicFormTemplate::query()->delete();

        foreach ($validated['fields'] ?? [] as $index => $field) {
            DynamicFormTemplate::create([
                'field_name' => $field['field_name'],
                'field_label' => $field['field_label'],
                'field_type' => $field['field_type'],
                'field_options' => $field['field_options'] ?? null,
                'is_required' => $field['is_required'] ?? false,
                'sort_order' => $index,
            ]);
        }

        return redirect()->back()->with('success', 'Template berita acara berhasil disimpan.');
    }

    private function ensureEventSnapshot(Event $event): void
    {
        if ($event->dynamicForms()->exists()) {
            return;
        }

        $templates = DynamicFormTemplate::orderBy('sort_order')->get();

        foreach ($templates as $template) {
            DynamicForm::create([
                'event_id' => $event->id,
                'field_name' => $template->field_name,
                'field_label' => $template->field_label,
                'field_type' => $template->field_type,
                'field_options' => $template->field_options,
                'field_value' => null,
                'is_required' => $template->is_required,
                'sort_order' => $template->sort_order,
            ]);
        }
    }

    private function backfillTemplateFromExistingClientForm(): void
    {
        if (DynamicFormTemplate::exists()) {
            return;
        }

        $eventId = DynamicForm::query()
            ->select('event_id')
            ->groupBy('event_id')
            ->orderByRaw('min(created_at)')
            ->value('event_id');

        if (!$eventId) {
            return;
        }

        DynamicForm::where('event_id', $eventId)
            ->orderBy('sort_order')
            ->get()
            ->each(function (DynamicForm $field, int $index) {
                DynamicFormTemplate::create([
                    'field_name' => $field['field_name'],
                    'field_label' => $field['field_label'],
                    'field_type' => $field['field_type'],
                    'field_options' => $field['field_options'] ?? null,
                    'is_required' => $field['is_required'] ?? false,
                    'sort_order' => $index,
                ]);
            });
    }

    public function show(string $uuid): Response
    {
        $event = Event::where('uuid', $uuid)->firstOrFail();
        $this->backfillTemplateFromExistingClientForm();
        $this->ensureEventSnapshot($event);

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
        $this->ensureEventSnapshot($event);

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
