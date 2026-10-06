<?php

namespace App\Http\Controllers;

use App\Models\TeamMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TeamMemberController extends Controller
{
    /** Public: only visible members, in order (used by the website). */
    public function publicIndex(): JsonResponse
    {
        return response()->json(
            TeamMember::where('is_active', true)->orderBy('sort_order')->orderBy('id')->get()
        );
    }

    public function index(): JsonResponse
    {
        return response()->json(TeamMember::orderBy('sort_order')->orderBy('id')->get());
    }

    public function show(TeamMember $team): JsonResponse
    {
        return response()->json($team);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);

        $data['photo'] = $request->hasFile('photo')
            ? $request->file('photo')->store('team', 'public')
            : null;
        $data['sort_order'] = (TeamMember::max('sort_order') ?? -1) + 1;

        return response()->json(TeamMember::create($data), 201);
    }

    public function update(Request $request, TeamMember $team): JsonResponse
    {
        $data = $this->validated($request);

        if ($request->hasFile('photo')) {
            if ($team->photo) {
                Storage::disk('public')->delete($team->photo);
            }
            $data['photo'] = $request->file('photo')->store('team', 'public');
        }

        $team->update($data);

        return response()->json($team->fresh());
    }

    public function destroy(TeamMember $team): JsonResponse
    {
        if ($team->photo) {
            Storage::disk('public')->delete($team->photo);
        }
        $team->delete();

        return response()->json(['message' => 'Team member deleted.']);
    }

    public function reorder(Request $request): JsonResponse
    {
        $ids = $request->validate([
            'ids'   => ['required', 'array'],
            'ids.*' => ['integer'],
        ])['ids'];

        foreach ($ids as $position => $id) {
            TeamMember::whereKey($id)->update(['sort_order' => $position]);
        }

        return response()->json(['message' => 'Order saved.']);
    }

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'name'         => ['required', 'string', 'max:255'],
            'role'         => ['required', 'string', 'max:255'],
            'bio'          => ['required', 'string', 'max:1000'],
            'linkedin_url' => ['nullable', 'url', 'max:255'],
            'photo'        => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:3072'],
            'is_active'    => ['sometimes', 'boolean'],
        ]);

        unset($data['photo']);

        return $data;
    }
}