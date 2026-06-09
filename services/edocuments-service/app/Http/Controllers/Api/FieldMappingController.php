<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FieldMapping;
use App\Models\PdfTemplate;
use Illuminate\Http\Request;

class FieldMappingController extends Controller
{
    public function save(Request $request)
    {
        $validated = $request->validate([
            'template_id' => 'required|exists:pdf_templates,id',
            'mappings' => 'required|array',
            'mappings.*' => 'nullable|string|max:150',
        ]);

        $template = PdfTemplate::findOrFail($validated['template_id']);
        FieldMapping::where('template_id', $template->id)->delete();

        $payload = collect($validated['mappings'])
            ->filter(fn ($column) => filled($column))
            ->map(function ($column, $fieldName) use ($template) {
                return [
                    'template_id' => $template->id,
                    'field_name' => $fieldName,
                    'db_column' => $column,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            })
            ->values()
            ->toArray();

        if (!empty($payload)) {
            FieldMapping::insert($payload);
        }

        return response()->json([
            'success' => true,
            'mappings' => $template->mappings()->get(),
        ]);
    }
}
