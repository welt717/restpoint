<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PdfField;
use App\Models\PdfTemplate;
use Illuminate\Http\Request;

class PdfFieldController extends Controller
{
    public function save(Request $request)
    {
        $validated = $request->validate([
            'template_id' => 'required|exists:pdf_templates,id',
            'fields' => 'required|array',
            'fields.*.name' => 'required|string|max:150',
            'fields.*.type' => 'required|in:text,signature,checkbox,radio,dropdown,date',
            'fields.*.options' => 'nullable|array',
            'fields.*.options.*' => 'string|max:200',
            'fields.*.page' => 'required|integer|min:1',
            'fields.*.x' => 'required|numeric|min:0|max:1',
            'fields.*.y' => 'required|numeric|min:0|max:1',
            'fields.*.width' => 'required|numeric|min:0|max:1',
            'fields.*.height' => 'required|numeric|min:0|max:1',
        ]);

        $template = PdfTemplate::findOrFail($validated['template_id']);
        PdfField::where('template_id', $template->id)->delete();

        $payload = collect($validated['fields'])->map(function ($field) use ($template) {
            return [
                'template_id' => $template->id,
                'field_name' => $field['name'],
                'type' => $field['type'],
                'options' => isset($field['options']) ? json_encode($field['options']) : null,
                'page' => $field['page'],
                'x' => $field['x'],
                'y' => $field['y'],
                'width' => $field['width'],
                'height' => $field['height'],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        })->toArray();

        if (!empty($payload)) {
            PdfField::insert($payload);
        }

        return response()->json([
            'success' => true,
            'fields' => $template->fields()->get(),
        ]);
    }
}
