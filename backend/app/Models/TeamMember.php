<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;

class TeamMember extends Model
{
    protected $fillable = ['name', 'role', 'bio', 'photo', 'linkedin_url', 'sort_order', 'is_active'];

    protected $casts = [
        'is_active'  => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $appends = ['photo_url'];

    public function getPhotoUrlAttribute(): ?string
    {
        if (! $this->photo) {
            return null;
        }

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('public');

        return $disk->url($this->photo);
    }
}