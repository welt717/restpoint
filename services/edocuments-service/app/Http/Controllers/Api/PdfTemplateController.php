<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PdfTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PdfTemplateController extends Controller
{
    public function index()
    {
        $templates = PdfTemplate::withCount('fields')
            ->orderByDesc('id')
            ->get()
            ->map(fn($t) => [
                'id'           => $t->id,
                'name'         => $t->name,
                'fields_count' => $t->fields_count,
                'file_url'     => route('api.templates.file', ['template' => $t->id]),
                'created_at'   => $t->created_at,
            ]);

        return response()->json(['data' => $templates]);
    }

    public function show(PdfTemplate $template)
    {
        $fields = $template->fields()
            ->orderBy('page')
            ->get(['id', 'field_name', 'type', 'options', 'page', 'x', 'y', 'width', 'height']);

        return response()->json([
            'data' => [
                'id'       => $template->id,
                'name'     => $template->name,
                'file_url' => route('api.templates.file', ['template' => $template->id]),
                'fields'   => $fields,
            ],
        ]);
    }

    public function upload(Request $request)
    {
        $validated = $request->validate([
            'template_name' => 'required|string|max:255',
            'file' => 'required|file|mimes:pdf',
        ]);

        $path = $request->file('file')->store('pdfs', 'local');

        $template = PdfTemplate::create([
            'name' => $validated['template_name'],
            'file_path' => $path,
        ]);

        return response()->json([
            'template_id' => $template->id,
            'name' => $template->name,
            'file_url' => route('api.templates.file', ['template' => $template->id]),
        ]);
    }

    public function file(PdfTemplate $template)
    {
        if (!Storage::disk('local')->exists($template->file_path)) {
            abort(404);
        }

        return response()->file(
            Storage::disk('local')->path($template->file_path),
            ['Content-Type' => 'application/pdf'],
        );
    }
}
