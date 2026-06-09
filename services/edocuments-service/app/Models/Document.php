<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Document extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'template_id',
        'title',
        'description',
        'content',
        'canvas_state',
        'status',
        'created_by'
    ];

    protected $casts = [
        'canvas_state' => 'json',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    /**
     * Get the fields for this document
     */
    public function fields(): HasMany
    {
        return $this->hasMany(DocumentField::class, 'document_id');
    }

    /**
     * Get the versions for this document
     */
    public function versions(): HasMany
    {
        return $this->hasMany(DocumentVersion::class, 'document_id')
            ->orderBy('version_number', 'desc');
    }

    /**
     * Get the template for this document
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(DocumentTemplate::class, 'template_id');
    }

    /**
     * Get document by tenant and id
     */
    public static function forTenant($tenantId, $id)
    {
        return self::where('tenant_id', $tenantId)->find($id);
    }

    /**
     * Get all documents for a tenant
     */
    public static function forTenantQuery($tenantId)
    {
        return self::where('tenant_id', $tenantId);
    }

    /**
     * Fill in document fields with values
     */
    public function fillFields(array $fieldData)
    {
        foreach ($fieldData as $fieldKey => $fieldValue) {
            $field = $this->fields()->where('field_key', $fieldKey)->first();
            if ($field) {
                $field->update(['field_value' => $fieldValue]);
            } else {
                $this->fields()->create([
                    'field_key' => $fieldKey,
                    'field_value' => $fieldValue
                ]);
            }
        }
        return $this;
    }

    /**
     * Get all field values as array
     */
    public function getFieldsArray()
    {
        return $this->fields()
            ->pluck('field_value', 'field_key')
            ->toArray();
    }

    /**
     * Create a new version snapshot
     */
    public function createVersion($changes, $changedBy = null, $reason = null)
    {
        $versionNumber = $this->versions()->max('version_number') ?? 0;
        $versionNumber++;

        return $this->versions()->create([
            'version_number' => $versionNumber,
            'changes' => json_encode($changes),
            'canvas_snapshot' => $this->canvas_state,
            'changed_by' => $changedBy,
            'change_reason' => $reason
        ]);
    }

    /**
     * Publish the document
     */
    public function publish()
    {
        $this->update(['status' => 'published']);
        return $this;
    }

    /**
     * Archive the document
     */
    public function archive()
    {
        $this->update(['status' => 'archived']);
        return $this;
    }
}
