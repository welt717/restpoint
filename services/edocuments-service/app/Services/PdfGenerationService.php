<?php

namespace App\Services;

use App\Models\PdfField;
use App\Models\PdfTemplate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use setasign\Fpdi\Tcpdf\Fpdi;

class PdfGenerationService
{
    public function generate(PdfTemplate $template, array $data, ?string $signature = null): string
    {
        $pdf = new Fpdi('P', 'mm', 'A4');
        $pdf->SetAutoPageBreak(false);
        $pdf->SetPrintHeader(false);
        $pdf->SetPrintFooter(false);
        $pdf->SetMargins(0, 0, 0);

        $fieldsByPage = $template->fields()->get()->groupBy('page');
        $mappingLookup = $template->mappings()->pluck('db_column', 'field_name')->toArray();

        $disk = Storage::disk('local');
        if (!$disk->exists($template->file_path)) {
            throw new \RuntimeException('Template file vanished');
        }

        $templatePath = $disk->path($template->file_path);
        $pageCount = $pdf->setSourceFile($templatePath);

        $signaturePath = $signature ? $this->storeSignature($signature) : null;

        for ($pageNumber = 1; $pageNumber <= $pageCount; $pageNumber++) {
            $templateId = $pdf->importPage($pageNumber);
            $size = $pdf->getTemplateSize($templateId);
            $orientation = $size['width'] > $size['height'] ? 'L' : 'P';

            $pdf->AddPage($orientation, [$size['width'], $size['height']]);
            $pdf->useTemplate($templateId);

            $fields = $fieldsByPage->get($pageNumber, collect());

            foreach ($fields as $field) {
                $value = $this->resolveFieldValue($field, $mappingLookup, $data);
                $this->addFieldToPage($pdf, $field, $size, $value, $signaturePath);
            }
        }

        $generatedDir = 'pdfs/generated';
        if (!$disk->exists($generatedDir)) {
            $disk->makeDirectory($generatedDir);
        }

        $fileName = 'generated_' . Str::random(16) . '.pdf';
        $outputPath = $disk->path($generatedDir . '/' . $fileName);
        $pdf->Output($outputPath, 'F');

        return $outputPath;
    }

    protected function storeSignature(string $payload): string
    {
        $parts = explode(',', $payload);
        $base64 = end($parts);
        $binary = base64_decode($base64);
        $directory = 'signatures';
        $disk = Storage::disk('local');
        if (!$disk->exists($directory)) {
            $disk->makeDirectory($directory);
        }

        $fileName = Str::random(20) . '.png';
        $path = $disk->path($directory . '/' . $fileName);
        file_put_contents($path, $binary);

        return $path;
    }

    private function resolveFieldValue(PdfField $field, array $mappingLookup, array $data): string
    {
        // Primary: resolve through the db-column mapping (builder flow).
        $column = $mappingLookup[$field->field_name] ?? null;
        if ($column && array_key_exists($column, $data)) {
            return (string) $data[$column];
        }

        // Fallback: the eSign direct-fill flow sends data keyed by field_name,
        // so try that key before giving up.
        return (string) ($data[$field->field_name] ?? '');
    }

    private function addFieldToPage(Fpdi $pdf, PdfField $field, array $size, string $value, ?string $signaturePath): void
    {
        $x = (float) $field->x * $size['width'];
        $y = (float) $field->y * $size['height'];
        $width = max(25, (float) $field->width * $size['width']);
        $height = max(10, (float) $field->height * $size['height']);

        switch ($field->type) {
            case 'signature':
                if ($signaturePath) {
                    $pdf->Image($signaturePath, $x, $y, $width, $height, 'PNG', '', '', true, 150, '', false, false, 0, false, false, false);
                } else {
                    $pdf->addEmptySignatureAppearance($x, $y, $width, $height, -1, $field->field_name);
                }
                break;

            case 'checkbox':
                $this->drawCheckbox($pdf, $value, $x, $y, $height);
                break;

            case 'radio':
                $this->drawRadioGroup($pdf, $field->options ?? [], $value, $x, $y, $width, $height);
                break;

            case 'dropdown':
                $this->drawDropdown($pdf, $field->options ?? [], $value, $x, $y, $width, $height);
                break;

            case 'date':
            case 'text':
            default:
                $this->drawTextField($pdf, $field->field_name, $width, $height, $value, $x, $y);
                break;
        }
    }

    private function drawTextField(Fpdi $pdf, string $name, float $width, float $height, string $value, float $x, float $y): void
    {
        // Draw a flat underline to mark the field area — no AcroForm widget,
        // so the generated PDF is fully flattened (no editable boxes).
        $pdf->SetLineWidth(0.3);
        $pdf->SetDrawColor(160, 160, 160);
        $pdf->Line($x, $y + $height, $x + $width, $y + $height);

        $pdf->SetFont('helvetica', '', 10);
        $pdf->SetTextColor(10, 10, 10);

        $vertPad = max(0, ($height - 5) / 2);
        $pdf->SetXY($x + 1, $y + $vertPad);

        if ($value !== '') {
            $pdf->Cell($width - 2, 5, $value, 0, 0, 'L');
        } else {
            // Show field name as a light placeholder so the area is still visible
            $pdf->SetTextColor(190, 190, 190);
            $pdf->SetFont('helvetica', 'I', 9);
            $pdf->Cell($width - 2, 5, $name, 0, 0, 'L');
        }

        $pdf->SetTextColor(0, 0, 0);
    }

    private function drawCheckbox(Fpdi $pdf, string $value, float $x, float $y, float $height): void
    {
        $size = min($height, 6);
        $cx = $x + 1;
        $cy = $y + ($height - $size) / 2;

        $pdf->SetLineWidth(0.4);
        $pdf->SetDrawColor(80, 80, 80);
        $pdf->SetFillColor(255, 255, 255);
        $pdf->Rect($cx, $cy, $size, $size, 'DF');

        $checked = in_array(strtolower($value), ['1', 'true', 'yes', 'on'], true);
        if ($checked) {
            $pdf->SetFont('zapfdingbats', '', $size * 1.4);
            $pdf->SetTextColor(30, 30, 30);
            $pdf->SetXY($cx, $cy - 1);
            $pdf->Cell($size, $size + 2, chr(52), 0, 0, 'C'); // ✔ in ZapfDingbats
        }

        $pdf->SetTextColor(0, 0, 0);
    }

    private function drawRadioGroup(Fpdi $pdf, array $options, string $value, float $x, float $y, float $width, float $height): void
    {
        if (empty($options)) {
            return;
        }

        $pdf->SetFont('helvetica', '', 8);
        $pdf->SetDrawColor(80, 80, 80);
        $pdf->SetFillColor(255, 255, 255);
        $pdf->SetTextColor(20, 20, 20);

        $rowH = $height / count($options);
        $radius = min($rowH * 0.3, 2.5);

        foreach ($options as $i => $option) {
            $oy = $y + $i * $rowH + ($rowH / 2);
            $cx = $x + $radius + 1;

            // Draw circle
            $pdf->SetLineWidth(0.3);
            $pdf->Circle($cx, $oy, $radius, 0, 360, 'D');

            // Fill if selected
            if (strtolower((string) $option) === strtolower($value)) {
                $pdf->SetFillColor(30, 30, 30);
                $pdf->Circle($cx, $oy, $radius * 0.5, 0, 360, 'F');
                $pdf->SetFillColor(255, 255, 255);
            }

            // Label
            $pdf->SetXY($cx + $radius + 1.5, $oy - 2.5);
            $pdf->Cell($width - $cx - $radius - 2, 5, (string) $option, 0, 0, 'L');
        }

        $pdf->SetTextColor(0, 0, 0);
    }

    private function drawDropdown(Fpdi $pdf, array $options, string $value, float $x, float $y, float $width, float $height): void
    {
        $pdf->SetLineWidth(0.3);
        $pdf->SetDrawColor(100, 100, 100);
        $pdf->SetFillColor(255, 255, 255);
        $pdf->Rect($x, $y, $width, $height, 'DF');

        // Draw arrow indicator on the right
        $arrowX = $x + $width - 5;
        $mid = $y + $height / 2;
        $pdf->SetDrawColor(80, 80, 80);
        $pdf->Line($arrowX, $mid - 1, $arrowX + 2.5, $mid + 1.5);
        $pdf->Line($arrowX + 2.5, $mid + 1.5, $arrowX + 5, $mid - 1);

        $display = $value ?: (!empty($options) ? $options[0] : '');
        $pdf->SetFont('helvetica', '', 9);
        $pdf->SetTextColor(10, 10, 10);
        $vertPad = max(0, ($height - 5) / 2);
        $pdf->SetXY($x + 2, $y + $vertPad);
        $pdf->Cell($width - 8, 5, $display, 0, 0, 'L');

        $pdf->SetTextColor(0, 0, 0);
    }
}
