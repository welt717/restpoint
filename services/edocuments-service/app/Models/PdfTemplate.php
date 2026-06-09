<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PdfTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'file_path',
    ];

    public function fields()
    {
        return $this->hasMany(PdfField::class, 'template_id');
    }

    public function mappings()
    {
        return $this->hasMany(FieldMapping::class, 'template_id');
    }

    public function signedPdfs()
    {
        return $this->hasMany(SignedPdf::class, 'template_id');
    }
}
