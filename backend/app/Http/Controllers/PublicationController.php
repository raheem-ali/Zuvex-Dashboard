<?php

namespace App\Http\Controllers;

use App\Models\Publication;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PublicationController extends Controller
{
    public const TYPES = [
        'Journal Article',
        'Conference Paper',
        'Research Report',
        'Working Paper',
        'Book Chapter',
    ];

    /** Public: visible publications (used by the website). */
    public function publicIndex(): JsonResponse
    {
        return response()->json(
            Publication::where('is_active', true)->orderByDesc('year')->orderByDesc('id')->get()
        );
    }

    /** Public: sends the PDF as a download and counts it. */
    public function download(Publication $publication)
    {
        abort_unless($publication->is_active && $publication->file, 404);

        $publication->increment('downloads');

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('public');

        return $disk->download($publication->file, Str::slug($publication->title) . '.pdf');
    }

    public function index(): JsonResponse
    {
        return response()->json(Publication::orderByDesc('year')->orderByDesc('id')->get());
    }

    public function show(Publication $publication): JsonResponse
    {
        return response()->json($publication);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);

        $data['cover'] = $request->hasFile('cover')
            ? $request->file('cover')->store('publications/covers', 'public')
            : null;
        $data['file'] = $request->hasFile('file')
            ? $request->file('file')->store('publications/files', 'public')
            : null;

        return response()->json(Publication::create($data), 201);
    }

    public function update(Request $request, Publication $publication): JsonResponse
    {
        $data = $this->validated($request);

        if ($request->hasFile('cover')) {
            $this->deleteFile($publication->cover);
            $data['cover'] = $request->file('cover')->store('publications/covers', 'public');
        }
        if ($request->hasFile('file')) {
            $this->deleteFile($publication->file);
            $data['file'] = $request->file('file')->store('publications/files', 'public');
        }

        $publication->update($data);

        return response()->json($publication->fresh());
    }

    public function destroy(Publication $publication): JsonResponse
    {
        $this->deleteFile($publication->cover);
        $this->deleteFile($publication->file);
        $publication->delete();

        return response()->json(['message' => 'Publication deleted.']);
    }

    private function deleteFile(?string $path): void
    {
        if ($path) {
            Storage::disk('public')->delete($path);
        }
    }

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'title'     => ['required', 'string', 'max:255'],
            'authors'   => ['required', 'string', 'max:255'],
            'type'      => ['required', Rule::in(self::TYPES)],
            'year'      => ['required', 'integer', 'between:1900,2100'],
            'summary'   => ['required', 'string', 'max:2000'],
            'cover'     => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:3072'],
            'file'      => ['nullable', 'file', 'mimes:pdf', 'max:20480'], // 20 MB
            'is_active' => ['sometimes', 'boolean'],
        ]);

        unset($data['cover'], $data['file']); // files are handled separately

        return $data;
    }
}