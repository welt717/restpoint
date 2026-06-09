<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('signed_pdfs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('pdf_templates')->cascadeOnDelete();
            $table->string('signed_pdf_path');
            $table->string('download_url');
            $table->json('signer_data')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('signed_pdfs');
    }
};
