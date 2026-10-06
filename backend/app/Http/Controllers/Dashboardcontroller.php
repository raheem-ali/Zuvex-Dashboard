<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Publication;
use App\Models\Service;
use App\Models\TeamMember;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /** key used by the dashboard => model */
    private const SECTIONS = [
        'services'     => Service::class,
        'team'         => TeamMember::class,
        'projects'     => Project::class,
        'publications' => Publication::class,
    ];

    public function index(): JsonResponse
    {
        // Buckets: last 12 months and last 7 days
        $monthStart = now()->subMonths(11)->startOfMonth();
        $monthAdded = $monthEdited = [];
        for ($i = 0; $i < 12; $i++) {
            $key = $monthStart->copy()->addMonths($i)->format('Y-m');
            $monthAdded[$key] = 0;
            $monthEdited[$key] = 0;
        }

        $dayStart = now()->subDays(6)->startOfDay();
        $dayAdded = $dayEdited = [];
        for ($i = 0; $i < 7; $i++) {
            $key = $dayStart->copy()->addDays($i)->format('Y-m-d');
            $dayAdded[$key] = 0;
            $dayEdited[$key] = 0;
        }

        $bump = function (array &$bucket, string $key): void {
            if (array_key_exists($key, $bucket)) {
                $bucket[$key]++;
            }
        };

        $stats = [];
        $recent = collect();
        $lastUpdated = null;

        foreach (self::SECTIONS as $section => $model) {
            $stats[$section] = [
                'total'  => $model::count(),
                'hidden' => $model::where('is_active', false)->count(),
            ];

            // Activity charts (only timestamps are loaded)
            foreach ($model::query()->get(['id', 'created_at', 'updated_at']) as $row) {
                $created = $row->created_at;
                $updated = $row->updated_at;
                if (! $created) {
                    continue;
                }

                $bump($monthAdded, $created->format('Y-m'));
                $bump($dayAdded, $created->format('Y-m-d'));

                if ($updated && $updated->gt($created)) {
                    $bump($monthEdited, $updated->format('Y-m'));
                    $bump($dayEdited, $updated->format('Y-m-d'));
                }

                if ($updated && (! $lastUpdated || $updated->gt($lastUpdated))) {
                    $lastUpdated = $updated;
                }
            }

            // Latest changes
            foreach ($model::query()->latest('updated_at')->limit(5)->get() as $row) {
                $recent->push([
                    'id'      => $row->id,
                    'item'    => $row->title ?? $row->name ?? "#{$row->id}",
                    'section' => $section,
                    'action'  => $row->created_at && $row->created_at->eq($row->updated_at) ? 'Added' : 'Edited',
                    'at'      => optional($row->updated_at)->toIso8601String(),
                ]);
            }
        }

        $stats['publications']['downloads'] = (int) Publication::sum('downloads');

        $months = [];
        foreach ($monthAdded as $key => $added) {
            $months[] = [
                'label'  => \Carbon\Carbon::createFromFormat('Y-m', $key)->format('M'),
                'added'  => $added,
                'edited' => $monthEdited[$key],
            ];
        }

        $week = [];
        foreach ($dayAdded as $key => $added) {
            $week[] = [
                'label'  => \Carbon\Carbon::createFromFormat('Y-m-d', $key)->format('D'),
                'added'  => $added,
                'edited' => $dayEdited[$key],
            ];
        }

        return response()->json([
            'stats'        => $stats,
            'last_updated' => optional($lastUpdated)->toIso8601String(),
            'months'       => $months,
            'week'         => $week,
            'recent'       => $recent->sortByDesc('at')->take(8)->values(),
        ]);
    }
}