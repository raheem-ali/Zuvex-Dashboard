<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProjectController extends Controller
{
    public const CATEGORIES = ['research', 'software', 'web', 'mobile', 'branding', 'aiml', 'graphic'];

    /* ---------- Public (website) ---------- */

    public function publicIndex(): JsonResponse
    {
        return response()->json(
            Project::where('is_active', true)->orderBy('sort_order')->orderByDesc('id')->get()
        );
    }

    public function publicShow(Project $project): JsonResponse
    {
        abort_unless($project->is_active, 404);

        return response()->json($project);
    }

    /* ---------- Admin (dashboard) ---------- */

    public function index(): JsonResponse
    {
        return response()->json(Project::orderBy('sort_order')->orderByDesc('id')->get());
    }

    public function show(Project $project): JsonResponse
    {
        return response()->json($project);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);

        $data['slug'] = $this->uniqueSlug($data['title']);
        $data['sort_order'] = (Project::max('sort_order') ?? -1) + 1;
        $data['cover'] = $request->hasFile('cover')
            ? $request->file('cover')->store('projects/covers', 'public')
            : null;

        $gallery = [];
        foreach ($request->file('gallery_files', []) as $file) {
            $gallery[] = $file->store('projects/gallery', 'public');
        }
        $data['gallery'] = $gallery;

        unset($data['remove_gallery'], $data['gallery_files']);

        return response()->json(Project::create($data), 201);
    }

    public function update(Request $request, Project $project): JsonResponse
    {
        $data = $this->validated($request);

        if ($request->hasFile('cover')) {
            $this->deleteFile($project->cover);
            $data['cover'] = $request->file('cover')->store('projects/covers', 'public');
        }

        $gallery = $project->gallery ?? [];
        $remove = $data['remove_gallery'] ?? [];
        foreach ($remove as $path) {
            if (in_array($path, $gallery, true)) {
                $this->deleteFile($path);
            }
        }
        $gallery = array_values(array_diff($gallery, $remove));
        foreach ($request->file('gallery_files', []) as $file) {
            $gallery[] = $file->store('projects/gallery', 'public');
        }
        $data['gallery'] = $gallery;

        unset($data['remove_gallery'], $data['gallery_files']);

        // Slug is not changed on purpose, so existing links keep working
        $project->update($data);

        return response()->json($project->fresh());
    }

    public function destroy(Project $project): JsonResponse
    {
        $this->deleteFile($project->cover);
        foreach ($project->gallery ?? [] as $path) {
            $this->deleteFile($path);
        }
        $project->delete();

        return response()->json(['message' => 'Project deleted.']);
    }

    public function reorder(Request $request): JsonResponse
    {
        $ids = $request->validate([
            'ids'   => ['required', 'array'],
            'ids.*' => ['integer'],
        ])['ids'];

        foreach ($ids as $position => $id) {
            Project::whereKey($id)->update(['sort_order' => $position]);
        }

        return response()->json(['message' => 'Order saved.']);
    }

    /* ---------- Helpers ---------- */

    private function deleteFile(?string $path): void
    {
        if ($path) {
            Storage::disk('public')->delete($path);
        }
    }

    private function uniqueSlug(string $title): string
    {
        $base = Str::slug($title) ?: 'project';
        $slug = $base;
        $i = 2;

        while (Project::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }

    private function validated(Request $request): array
    {
        foreach (['categories', 'tags', 'objectives', 'results', 'remove_gallery'] as $field) {
            if ($request->has($field) && is_string($request->input($field))) {
                $decoded = json_decode($request->input($field), true);
                $request->merge([$field => is_array($decoded) ? $decoded : []]);
            }
        }

        $data = $request->validate([
            'title'            => ['required', 'string', 'max:255'],
            'summary'          => ['required', 'string', 'max:500'],
            'categories'       => ['required', 'array', 'min:1'],
            'categories.*'     => ['string', Rule::in(self::CATEGORIES)],
            'tags'             => ['nullable', 'array'],
            'tags.*'           => ['string', 'max:40'],
            'year'             => ['required', 'integer', 'between:1900,2100'],
            'client'           => ['nullable', 'string', 'max:150'],
            'duration'         => ['nullable', 'string', 'max:100'],
            'overview'         => ['nullable', 'string', 'max:5000'],
            'objectives'       => ['nullable', 'array'],
            'objectives.*'     => ['string', 'max:255'],
            'challenge'        => ['nullable', 'string', 'max:5000'],
            'solution'         => ['nullable', 'string', 'max:5000'],
            'results'          => ['nullable', 'array'],
            'results.*.value'  => ['required', 'string', 'max:30'],
            'results.*.label'  => ['required', 'string', 'max:80'],
            'cover'            => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'gallery_files'    => ['nullable', 'array'],
            'gallery_files.*'  => ['file', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'remove_gallery'   => ['nullable', 'array'],
            'remove_gallery.*' => ['string'],
            'is_active'        => ['sometimes', 'boolean'],
        ]);

        unset($data['cover']);

        return $data;
    }
}