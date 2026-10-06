<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;

class Project extends Model
{
    protected $fillable = [
        'slug', 'title', 'summary', 'categories', 'tags', 'year', 'client', 'duration',
        'overview', 'objectives', 'challenge', 'solution', 'results',
        'cover', 'gallery', 'sort_order', 'is_active',
    ];

    protected $casts = [
        'categories' => 'array',
        'tags'       => 'array',
        'objectives' => 'array',
        'results'    => 'array',
        'gallery'    => 'array',
        'year'       => 'integer',
        'sort_order' => 'integer',
        'is_active'  => 'boolean',
    ];

    protected $appends = ['cover_url', 'gallery_urls'];

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

    public function getGalleryUrlsAttribute(): array
    {
        return collect($this->gallery ?? [])
            ->map(fn (string $path) => $this->disk()->url($path))
            ->all();
    }
}