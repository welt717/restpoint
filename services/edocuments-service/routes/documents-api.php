<?php

use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\TemplateController;
use Illuminate\Support\Facades\Route;

Route::prefix('api')->group(function () {
    
    // Documents Routes
    Route::prefix('documents')->group(function () {
        Route::get('/', [DocumentController::class, 'index']);
        Route::post('/', [DocumentController::class, 'store']);
        Route::get('/{id}', [DocumentController::class, 'show']);
        Route::put('/{id}', [DocumentController::class, 'update']);
        Route::delete('/{id}', [DocumentController::class, 'destroy']);
        Route::post('/{id}/publish', [DocumentController::class, 'publish']);
        Route::get('/{id}/versions', [DocumentController::class, 'versions']);
        Route::post('/{id}/versions/{versionId}/restore', [DocumentController::class, 'restoreVersion']);
    });

    // Templates Routes
    Route::prefix('templates')->group(function () {
        Route::get('/', [TemplateController::class, 'index']);
        Route::post('/', [TemplateController::class, 'store']);
        Route::get('/{id}', [TemplateController::class, 'show']);
        Route::put('/{id}', [TemplateController::class, 'update']);
        Route::delete('/{id}', [TemplateController::class, 'destroy']);
        Route::post('/{id}/create-document', [TemplateController::class, 'createFromTemplate']);
    });

});
