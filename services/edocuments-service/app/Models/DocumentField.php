<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentField extends Model
{
    protected $fillable = [
        'document_id',
        'field_key',
        'field_label',
        'field_value',
        'field_type',
        'is_required'
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the document this field belongs to
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'document_id');
    }

    /**
     * Validate field value
     */
    public function isValid(): bool
    {
        if ($this->is_required && !$this->field_value) {
            return false;
        }

        switch ($this->field_type) {
            case 'email':
                return filter_var($this->field_value, FILTER_VALIDATE_EMAIL) !== false;
            case 'date':
                return strtotime($this->field_value) !== false;
            case 'number':
                return is_numeric($this->field_value);
            default:
                return true;
        }
    }
}
