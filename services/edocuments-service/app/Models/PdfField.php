<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PdfField extends Model
{
    use HasFactory;

    protected $fillable = [
        'template_id',
        'field_name',
        'type',
        'options',
        'page',
        'x',
        'y',
        'width',
        'height',
    ];

    protected $casts = [
        'options' => 'array',
    ];

    public function template()
    {
        return $this->belongsTo(PdfTemplate::class, 'template_id');
    }
}
