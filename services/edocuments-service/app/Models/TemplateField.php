<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TemplateField extends Model
{
    protected $table = 'template_fields';

    protected $fillable = [
        'template_id',
        'field_key',
        'field_label',
        'field_type',
        'placeholder',
        'is_required',
        'default_value',
        'options',
        'position'
    ];

    protected $casts = [
        'options' => 'json',
        'is_required' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    public $timestamps = ['created_at', 'updated_at'];

    /**
     * Get the template this field belongs to
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(DocumentTemplate::class, 'template_id');
    }
}
