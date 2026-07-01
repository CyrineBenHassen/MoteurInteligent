<?php

namespace App\Observers;

use App\Models\Generation;
use App\Models\TestExecution;
use App\Http\Controllers\FlakyTestController;
use Illuminate\Http\Request;

class GenerationObserver
{
    public function created(Generation $generation): void
    {
        $cases = $generation->execution_results ?: ($generation->test_cases ?: []);
        if (empty($cases)) {
            return;
        }

        $rows = [];
        foreach ($cases as $case) {
            $name = $case['name'] ?? null;
            if (!$name) continue;

            $status = in_array($case['status'] ?? null, ['pass', 'fail', 'skip'])
                ? $case['status']
                : 'skip';

            $rows[] = [
                'generation_id' => $generation->id,
                'project_id'    => $generation->project_id,
                'url'           => $generation->url,
                'test_type'     => $generation->test_type,
                'framework'     => $generation->framework,
                'test_name'     => trim($name),
                'status'        => $status,
                'duration_ms'   => $this->parseDuration($case['duration'] ?? null),
                'executed_at'   => $generation->created_at ?? now(),
                'created_at'    => now(),
                'updated_at'    => now(),
            ];
        }

        if (!empty($rows)) {
            TestExecution::insert($rows);

            // ── Détection alerte après insertion ──
            $controller = new FlakyTestController();
            $controller->detectAndAlert($generation, $rows);
        }
    }

    private function parseDuration(?string $raw): ?int
    {
        if (!$raw) return null;
        if (preg_match('/([\d.]+)\s*ms/', $raw, $m)) return (int) round((float) $m[1]);
        if (preg_match('/([\d.]+)\s*s/',  $raw, $m)) return (int) round((float) $m[1] * 1000);
        return null;
    }
}