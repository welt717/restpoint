<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FieldMapping extends Model
{
    use HasFactory;

    protected $fillable = [
        'template_id',
        'field_name',
        'db_column',
    ];

    public function template()
    {
        return $this->belongsTo(PdfTemplate::class, 'template_id');
    }
}
