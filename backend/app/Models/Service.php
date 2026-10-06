<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;

class Service extends Model
{
    protected $fillable = ['title', 'description', 'icon', 'sort_order', 'is_active'];

    protected $casts = [
        'is_active'  => 'boolean',
        'sort_order' => 'integer',
    ];

    // Adds "icon_url" to every JSON response
    protected $appends = ['icon_url'];

    public function getIconUrlAttribute(): ?string
    {
        if (! $this->icon) {
            return null;
        }

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('public');

        return $disk->url($this->icon);
    }
}