<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pdf_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('pdf_templates')->cascadeOnDelete();
            $table->string('field_name');
            $table->enum('type', ['text', 'signature']);
            $table->unsignedSmallInteger('page')->default(1);
            $table->decimal('x', 8, 6);
            $table->decimal('y', 8, 6);
            $table->decimal('width', 8, 6);
            $table->decimal('height', 8, 6);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pdf_fields');
    }
};
