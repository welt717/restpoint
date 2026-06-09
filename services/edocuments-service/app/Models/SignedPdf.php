<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SignedPdf extends Model
{
    protected $fillable = [
        'template_id',
        'signed_pdf_path',
        'download_url',
        'signer_data',
    ];

    protected $casts = [
        'signer_data' => 'array',
    ];

    public function template()
    {
        return $this->belongsTo(PdfTemplate::class);
    }
}
