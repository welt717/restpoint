<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PdfTemplate;
use App\Models\SignedPdf;
use App\Services\PdfGenerationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PdfGenerationController extends Controller
{
    public function generate(Request $request, PdfGenerationService $service)
    {
        $validated = $request->validate([
            'template_id' => 'required|exists:pdf_templates,id',
            'data' => 'required|array',
            'signature' => 'nullable|string',
        ]);

        $template = PdfTemplate::findOrFail($validated['template_id']);

        $outputPath = $service->generate($template, $validated['data'], $validated['signature'] ?? null);
        $fileName = basename($outputPath);

        $downloadUrl = route('api.pdf.generated', ['filename' => $fileName]);

        SignedPdf::create([
            'template_id'     => $template->id,
            'signed_pdf_path' => 'pdfs/generated/' . $fileName,
            'download_url'    => $downloadUrl,
            'signer_data'     => $validated['data'],
        ]);

        return response()->json([
            'download_url' => $downloadUrl,
        ]);
    }

    public function download(string $filename)
    {
        $path = 'pdfs/generated/' . $filename;

        if (!Storage::disk('local')->exists($path)) {
            abort(404);
        }

        return response()->file(
            Storage::disk('local')->path($path),
            ['Content-Type' => 'application/pdf'],
        );
    }
}
