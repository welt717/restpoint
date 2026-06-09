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
        // Documents table - main editable documents
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('template_id')->nullable();
            $table->string('title')->index();
            $table->text('description')->nullable();
            $table->longText('content')->nullable();
            $table->longText('canvas_state')->nullable()->comment('Fabric.js canvas JSON state');
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft')->index();
            $table->unsignedBigInteger('created_by');
            $table->timestamps();
            $table->softDeletes();
            
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->index(['tenant_id', 'status']);
        });

        // Document fields table - individual document fields
        Schema::create('document_fields', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('document_id');
            $table->string('field_key')->index();
            $table->string('field_label')->nullable();
            $table->longText('field_value')->nullable();
            $table->enum('field_type', ['text', 'number', 'date', 'select', 'checkbox', 'image', 'signature', 'textarea'])->default('text');
            $table->boolean('is_required')->default(false);
            $table->timestamps();
            
            $table->foreign('document_id')->references('id')->on('documents')->onDelete('cascade');
            $table->unique(['document_id', 'field_key']);
            $table->index('document_id');
        });

        // Document versions table - track changes and history
        Schema::create('document_versions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('document_id');
            $table->integer('version_number')->index();
            $table->longText('changes')->nullable()->comment('JSON object of changed fields');
            $table->longText('canvas_snapshot')->nullable()->comment('Fabric.js canvas state snapshot');
            $table->unsignedBigInteger('changed_by')->nullable();
            $table->string('change_reason')->nullable();
            $table->timestamps();
            
            $table->foreign('document_id')->references('id')->on('documents')->onDelete('cascade');
            $table->unique(['document_id', 'version_number']);
            $table->index('document_id');
        });

        // Extended document templates table
        Schema::create('document_templates', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable();
            $table->string('name')->index();
            $table->text('description')->nullable();
            $table->string('type')->nullable()->index();
            $table->string('template_file_path')->nullable();
            $table->longText('template_json')->nullable()->comment('Template structure and default fields');
            $table->json('default_fields')->nullable()->comment('Default field values');
            $table->boolean('is_default')->default(false)->index();
            $table->boolean('is_public')->default(false);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('set null');
            $table->index(['tenant_id', 'is_default']);
        });

        // Template fields definitions
        Schema::create('template_fields', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('template_id');
            $table->string('field_key')->index();
            $table->string('field_label')->nullable();
            $table->enum('field_type', ['text', 'number', 'date', 'select', 'checkbox', 'image', 'signature', 'textarea'])->default('text');
            $table->string('placeholder')->nullable();
            $table->boolean('is_required')->default(false);
            $table->text('default_value')->nullable();
            $table->json('options')->nullable()->comment('For select fields');
            $table->integer('position')->default(0);
            $table->timestamps();
            
            $table->foreign('template_id')->references('id')->on('document_templates')->onDelete('cascade');
            $table->unique(['template_id', 'field_key']);
            $table->index('template_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('template_fields');
        Schema::dropIfExists('document_versions');
        Schema::dropIfExists('document_fields');
        Schema::dropIfExists('document_templates');
        Schema::dropIfExists('documents');
    }
};
