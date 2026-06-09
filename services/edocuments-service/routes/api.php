<?php

use App\Http\Controllers\Api\FieldMappingController;
use App\Http\Controllers\Api\PdfFieldController;
use App\Http\Controllers\Api\PdfGenerationController;
use App\Http\Controllers\Api\PdfTemplateController;
use Illuminate\Support\Facades\Route;

Route::get('/templates', [PdfTemplateController::class, 'index']);
Route::get('/templates/{template}', [PdfTemplateController::class, 'show']);
Route::post('/upload-pdf', [PdfTemplateController::class, 'upload']);
Route::get('/templates/{template}/file', [PdfTemplateController::class, 'file'])->name('api.templates.file');
Route::post('/save-fields', [PdfFieldController::class, 'save']);
Route::post('/save-mapping', [FieldMappingController::class, 'save']);
Route::post('/generate-pdf', [PdfGenerationController::class, 'generate']);
Route::get('/generated-pdfs/{filename}', [PdfGenerationController::class, 'download'])->name('api.pdf.generated');
