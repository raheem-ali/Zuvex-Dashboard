<?php

namespace App\Http\Controllers;

use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ServiceController extends Controller
{
    /** Public: only visible services, in order (used by the website). */
    public function publicIndex(): JsonResponse
    {
        return response()->json(
            Service::where('is_active', true)->orderBy('sort_order')->orderBy('id')->get()
        );
    }

    public function index(): JsonResponse
    {
        return response()->json(Service::orderBy('sort_order')->orderBy('id')->get());
    }

    public function show(Service $service): JsonResponse
    {
        return response()->json($service);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);

        $data['icon'] = $request->hasFile('icon')
            ? $request->file('icon')->store('services', 'public')
            : null;
        $data['sort_order'] = (Service::max('sort_order') ?? -1) + 1;

        return response()->json(Service::create($data), 201);
    }

    public function update(Request $request, Service $service): JsonResponse
    {
        $data = $this->validated($request);

        if ($request->hasFile('icon')) {
            if ($service->icon) {
                Storage::disk('public')->delete($service->icon);
            }
            $data['icon'] = $request->file('icon')->store('services', 'public');
        }

        $service->update($data);

        return response()->json($service->fresh());
    }

    public function destroy(Service $service): JsonResponse
    {
        if ($service->icon) {
            Storage::disk('public')->delete($service->icon);
        }
        $service->delete();

        return response()->json(['message' => 'Service deleted.']);
    }

    public function reorder(Request $request): JsonResponse
    {
        $ids = $request->validate([
            'ids'   => ['required', 'array'],
            'ids.*' => ['integer'],
        ])['ids'];

        foreach ($ids as $position => $id) {
            Service::whereKey($id)->update(['sort_order' => $position]);
        }

        return response()->json(['message' => 'Order saved.']);
    }

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'title'       => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:2000'],
            'icon'        => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,svg', 'max:2048'],
            'is_active'   => ['sometimes', 'boolean'],
        ]);

        unset($data['icon']); // the file is handled separately

        return $data;
    }
}