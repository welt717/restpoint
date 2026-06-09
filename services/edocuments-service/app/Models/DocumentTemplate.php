<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentTemplate extends Model
{
    use SoftDeletes;

    protected $table = 'document_templates';

    protected $fillable = [
        'tenant_id',
        'name',
        'description',
        'type',
        'template_file_path',
        'template_json',
        'default_fields',
        'is_default',
        'is_public',
        'created_by'
    ];

    protected $casts = [
        'template_json' => 'json',
        'default_fields' => 'json',
        'is_default' => 'boolean',
        'is_public' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    /**
     * Get the fields for this template
     */
    public function fields(): HasMany
    {
        return $this->hasMany(TemplateField::class, 'template_id')
            ->orderBy('position', 'asc');
    }

    /**
     * Get documents created from this template
     */
    public function documents(): HasMany
    {
        return $this->hasMany(Document::class, 'template_id');
    }

    /**
     * Create a new document from this template
     */
    public function createDocument($title, $tenantId, $createdBy, $initialFields = [])
    {
        $document = Document::create([
            'tenant_id' => $tenantId,
            'template_id' => $this->id,
            'title' => $title,
            'canvas_state' => $this->template_json,
            'created_by' => $createdBy,
            'status' => 'draft'
        ]);

        // Add fields from template
        foreach ($this->fields as $templateField) {
            $value = $initialFields[$templateField->field_key] ?? $templateField->default_value;
            $document->fields()->create([
                'field_key' => $templateField->field_key,
                'field_label' => $templateField->field_label,
                'field_value' => $value,
                'field_type' => $templateField->field_type,
                'is_required' => $templateField->is_required
            ]);
        }

        return $document;
    }

    /**
     * Get templates for tenant (includes default templates)
     */
    public static function forTenant($tenantId)
    {
        return self::where('tenant_id', $tenantId)
            ->orWhere('is_default', true)
            ->where('is_public', true);
    }
}
