<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pdf_fields', function (Blueprint $table) {
            // Widen the type column to accept all new field types
            $table->string('type', 30)->change();
            // Store options (for radio/dropdown) as JSON
            $table->json('options')->nullable()->after('type');
        });
    }

    public function down(): void
    {
        Schema::table('pdf_fields', function (Blueprint $table) {
            $table->dropColumn('options');
            $table->enum('type', ['text', 'signature'])->change();
        });
    }
};
