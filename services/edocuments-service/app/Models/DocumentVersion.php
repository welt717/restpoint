<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentVersion extends Model
{
    protected $fillable = [
        'document_id',
        'version_number',
        'changes',
        'canvas_snapshot',
        'changed_by',
        'change_reason'
    ];

    protected $casts = [
        'changes' => 'json',
        'canvas_snapshot' => 'json',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    public $timestamps = ['created_at', 'updated_at'];

    /**
     * Get the document this version belongs to
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'document_id');
    }

    /**
     * Get the user who made this change
     */
    public function changedByUser()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
