<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;

class Publication extends Model
{
    protected $fillable = [
        'title', 'authors', 'type', 'year', 'summary',
        'cover', 'file', 'downloads', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'year'      => 'integer',
        'downloads' => 'integer',
    ];

    // Added to every JSON response
    protected $appends = ['cover_url', 'file_url', 'download_url'];

    private function disk(): FilesystemAdapter
    {
        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('public');

        return $disk;
    }

    public function getCoverUrlAttribute(): ?string
    {
        return $this->cover ? $this->disk()->url($this->cover) : null;
    }

    /** Direct link to the stored PDF (used by the dashboard preview). */
    public function getFileUrlAttribute(): ?string
    {
        return $this->file ? $this->disk()->url($this->file) : null;
    }

    /** Link the website uses: forces a download and counts it. */
    public function getDownloadUrlAttribute(): ?string
    {
        return $this->file
            ? rtrim(config('app.url'), '/') . "/api/publications/{$this->id}/download"
            : null;
    }
}