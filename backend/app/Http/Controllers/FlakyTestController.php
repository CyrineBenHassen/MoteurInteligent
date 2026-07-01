<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use App\Models\Generation;
use App\Models\TestExecution;
use App\Models\TestFlag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FlakyTestController extends Controller
{
    private const WINDOW_SIZE = 10;

    /* ------------------------------------------------------------------ */
    /*  Calcul du statut flaky pour un groupe d'exécutions                 */
    /* ------------------------------------------------------------------ */
   private function computeStatus(iterable $window, string $key, $flags): array
{
    $window = collect($window)->reverse()->values();
    $n      = $window->count();
    $passes = $window->where('status', 'pass')->count();
    $fails  = $window->where('status', 'fail')->count();

    $transitions = 0;
    for ($i = 1; $i < $n; $i++) {
        if ($window[$i]->status !== $window[$i - 1]->status) $transitions++;
    }
    $score = $n > 1 ? (int) round($transitions / ($n - 1) * 100) : 0;

    // ← AJOUTE : si beaucoup de fails même avec peu d'exécutions → warning
    if ($n >= 2 && $fails > 0 && $passes > 0) {
        $score = max($score, 30); // minimum 30% si déjà pass+fail
    }
    if ($n >= 1 && $fails > 0 && $passes === 0) {
        $score = 0; // tout fail = pas flaky, juste cassé
    }

    $statusLabel = 'stable';
    if ($score > 50)     $statusLabel = 'critical';
    elseif ($score > 20) $statusLabel = 'flaky';
    elseif ($score > 0)  $statusLabel = 'warning';

    if ($flag = $flags->get($key)) {
        $statusLabel = $flag->status;
    }

    return [
        'passes'          => $passes,
        'fails'           => $fails,
        'skips'           => $n - $passes - $fails,
        'total_runs'      => $n,
        'flakiness_score' => $score,
        'status'          => $statusLabel,
    ];
}

    /* ------------------------------------------------------------------ */
    /*  Créer une alerte en DB                                             */
    /* ------------------------------------------------------------------ */
    private function createAlert(array $data, string $newStatus, string $previousStatus): Alert
    {
        $messages = [
            'critical' => "🔴 Test critique : \"{$data['test_name']}\" a un score de flakiness de {$data['flakiness_score']}%.",
            'flaky'    => "🟠 Test instable : \"{$data['test_name']}\" montre des résultats incohérents ({$data['flakiness_score']}%).",
            'warning'  => "🟡 Avertissement : \"{$data['test_name']}\" commence à devenir instable ({$data['flakiness_score']}%).",
            'stable'   => "✅ Test résolu : \"{$data['test_name']}\" est revenu à la stabilité.",
        ];

        return Alert::create([
            'project_id'      => $data['project_id'] ?? null,
            'url'             => $data['url'],
            'test_type'       => $data['test_type'],
            'test_name'       => $data['test_name'],
            'framework'       => $data['framework'] ?? null,
            'status'          => $newStatus,
            'previous_status' => $previousStatus,
            'flakiness_score' => $data['flakiness_score'],
            'message'         => $messages[$newStatus] ?? "Changement de statut détecté.",
            'read'            => false,
            'notified_n8n'    => false,
        ]);
    }

    /* ------------------------------------------------------------------ */
    /*  Appel webhook n8n                                                  */
    /* ------------------------------------------------------------------ */
    private function notifyN8nWebhook(Alert $alert): void
    {
        $url = env('N8N_FLAKY_WEBHOOK_URL');
        if (!$url) return;

        try {
            Http::timeout(5)->post($url, [
                'alert_id'        => $alert->id,
                'status'          => $alert->status,
                'previous_status' => $alert->previous_status,
                'test_name'       => $alert->test_name,
                'url'             => $alert->url,
                'test_type'       => $alert->test_type,
                'framework'       => $alert->framework,
                'flakiness_score' => $alert->flakiness_score,
                'message'         => $alert->message,
                'project_id'      => $alert->project_id,
                'triggered_at'    => $alert->created_at->toIso8601String(),
            ]);

            $alert->update(['notified_n8n' => true]);
        } catch (\Throwable $e) {
            Log::warning('n8n webhook failed: ' . $e->getMessage());
        }
    }

    /* ------------------------------------------------------------------ */
    /*  INDEX — liste des flaky tests                                      */
    /* ------------------------------------------------------------------ */
public function index(Request $request)
{
    $query = TestExecution::query()->orderByDesc('executed_at');

    if ($request->filled('project_id')) $query->where('project_id', $request->query('project_id'));
    if ($request->filled('test_type'))  $query->where('test_type',  $request->query('test_type'));
    if ($request->filled('date_from'))  $query->where('executed_at', '>=', $request->query('date_from'));
    if ($request->filled('date_to'))    $query->where('executed_at', '<=', $request->query('date_to'));

    $executions = $query->get();

    $groups = $executions->groupBy(fn($e) =>
        ($e->project_id ?? '') . '|' . $e->url . '|' . $e->test_type
    );

    $flags = TestFlag::all()->keyBy(fn($f) =>
        ($f->project_id ?? '') . '|' . $f->url . '|' . $f->test_type . '|' . $f->test_name
    );

    $tests = [];

    foreach ($groups as $key => $group) {
        $window = $group->take(self::WINDOW_SIZE);
        $stats  = $this->computeStatus($window, $key, $flags);
        $last   = $window->first();

        $generationCount = $group->pluck('generation_id')->unique()->count();

        $tests[] = array_merge($stats, [
            'test_name'        => $last->url,
            'url'              => $last->url,
            'test_type'        => $last->test_type,
            'project_id'       => $last->project_id,
            'framework'        => $last->framework,
            'generation_id'    => $last->generation_id,
            'last_execution'   => $last->executed_at,
            'generation_count' => $generationCount,
        ]);
    }

    if ($request->filled('search')) {
        $s = mb_strtolower($request->query('search'));
        $tests = array_values(array_filter($tests, fn($t) =>
            str_contains(mb_strtolower($t['test_name']), $s) ||
            str_contains(mb_strtolower($t['url']), $s)
        ));
    }

    if ($request->filled('status')) {
        $st = $request->query('status');
        $tests = array_values(array_filter($tests, fn($t) => $t['status'] === $st));
    }

    usort($tests, fn($a, $b) => $b['flakiness_score'] <=> $a['flakiness_score']);

    $totalTracked    = count($tests);
    $flakyCount      = count(array_filter($tests, fn($t) => in_array($t['status'], ['flaky', 'critical'])));
    $flakinessRate   = $totalTracked > 0 ? round($flakyCount / $totalTracked * 100) : 0;
    $totalExecutions = array_sum(array_column($tests, 'total_runs'));
    $failedRuns      = array_sum(array_column($tests, 'fails'));

    return response()->json([
        'kpis' => [
            'total_flaky_tests' => $flakyCount,
            'flakiness_rate'    => $flakinessRate,
            'total_executions'  => $totalExecutions,
            'failed_runs'       => $failedRuns,
        ],
        'tests' => $tests,
    ]);
}

    /* ------------------------------------------------------------------ */
    /*  RECORD — enregistre une exécution + détecte changement de statut  */
    /* ------------------------------------------------------------------ */
    public function record(Request $request)
    {
        $data = $request->validate([
            'generation_id' => 'required|integer',
            'project_id'    => 'nullable|integer',
            'url'           => 'required|string',
            'test_type'     => 'required|string',
            'framework'     => 'nullable|string',
            'test_name'     => 'required|string',
            'status'        => 'required|in:pass,fail,skip',
        ]);

        $key = ($data['project_id'] ?? '') . '|' . $data['url'] . '|' . $data['test_type'] . '|' . $data['test_name'];

        $flags = TestFlag::all()->keyBy(fn($f) =>
            $f->project_id . '|' . $f->url . '|' . $f->test_type . '|' . $f->test_name
        );

        // ── Statut AVANT l'insertion ──
        $previousWindow = TestExecution::where('url', $data['url'])
            ->where('test_type', $data['test_type'])
            ->where('test_name', $data['test_name'])
            ->where('project_id', $data['project_id'] ?? null)
            ->orderByDesc('executed_at')
            ->take(self::WINDOW_SIZE)
            ->get();

        $previousStats  = $previousWindow->count() > 0
            ? $this->computeStatus($previousWindow, $key, $flags)
            : null;

        // ── Insertion ──
        TestExecution::create([
            'generation_id' => $data['generation_id'],
            'project_id'    => $data['project_id'] ?? null,
            'url'           => $data['url'],
            'test_type'     => $data['test_type'],
            'framework'     => $data['framework'] ?? null,
            'test_name'     => $data['test_name'],
            'status'        => $data['status'],
            'executed_at'   => now(),
        ]);

        // ── Statut APRÈS l'insertion ──
        $newWindow = TestExecution::where('url', $data['url'])
            ->where('test_type', $data['test_type'])
            ->where('test_name', $data['test_name'])
            ->where('project_id', $data['project_id'] ?? null)
            ->orderByDesc('executed_at')
            ->take(self::WINDOW_SIZE)
            ->get();

        $newStats      = $this->computeStatus($newWindow, $key, $flags);
        $newStatus     = $newStats['status'];
        $previousStatus = $previousStats['status'] ?? 'stable';

        // ── Détection du changement ──
        if ($newStatus !== $previousStatus || in_array($newStatus, ['flaky', 'critical', 'warning'])) {
            $alertData = [
                'project_id'      => $data['project_id'] ?? null,
                'url'             => $data['url'],
                'test_type'       => $data['test_type'],
                'test_name'       => $data['test_name'],
                'framework'       => $data['framework'] ?? null,
                'flakiness_score' => $newStats['flakiness_score'],
            ];

            $alert = $this->createAlert($alertData, $newStatus, $previousStatus);

            // Notifier n8n seulement si statut préoccupant (pas pour "stable")
            if (in_array($newStatus, ['warning', 'flaky', 'critical'])) {
                $this->notifyN8nWebhook($alert);
            }
        }

        return response()->json(['recorded' => true]);
    }

    /* ------------------------------------------------------------------ */
    /*  RERUN                                                              */
    /* ------------------------------------------------------------------ */
    public function rerun(Request $request)
    {
        $data = $request->validate([
            'generation_id' => 'required|integer',
            'test_name'     => 'required|string',
        ]);

        $generation = Generation::find($data['generation_id']);
        if (!$generation) return response()->json(['error' => 'Generation not found'], 404);

        if ($generation->test_type === 'performance' && $generation->framework === 'k6') {
            return response()->json([
                'mode'       => 'scenario',
                'test_type'  => $generation->test_type,
                'framework'  => $generation->framework,
                'project_id' => $generation->project_id,
                'url'        => $generation->url,
            ]);
        }

        $fwField = match ($generation->framework) {
            'Cypress'  => 'test_cases_cypress',
            'Selenium' => 'test_cases_selenium',
            default    => 'test_cases',
        };

        $cases = $generation->{$fwField} ?: ($generation->test_cases ?: []);
        $match = collect($cases)->firstWhere('name', $data['test_name']);

        if (!$match) return response()->json(['error' => 'Test case not found in this generation'], 404);

        return response()->json([
            'mode'       => 'isolated',
            'script'     => $generation->script,
            'framework'  => $generation->framework,
            'test_cases' => [$match],
        ]);
    }

    /* ------------------------------------------------------------------ */
    /*  FLAG / UNFLAG                                                      */
    /* ------------------------------------------------------------------ */
    public function flag(Request $request)
    {
        $data = $request->validate([
            'project_id' => 'nullable|integer',
            'url'        => 'required|string',
            'test_type'  => 'required|string',
            'test_name'  => 'required|string',
            'status'     => 'required|string',
        ]);

        TestFlag::updateOrCreate(
            ['project_id' => $data['project_id'] ?? null, 'url' => $data['url'], 'test_type' => $data['test_type'], 'test_name' => $data['test_name']],
            ['status' => $data['status']]
        );

        return response()->json(['flagged' => true]);
    }

    public function unflag(Request $request)
    {
        $data = $request->validate([
            'project_id' => 'nullable|integer',
            'url'        => 'required|string',
            'test_type'  => 'required|string',
            'test_name'  => 'required|string',
        ]);

        TestFlag::where([
            'project_id' => $data['project_id'] ?? null,
            'url'        => $data['url'],
            'test_type'  => $data['test_type'],
            'test_name'  => $data['test_name'],
        ])->delete();

        return response()->json(['unflagged' => true]);
    }


    public function detectAndAlert(Generation $generation, array $rows): void
{
    $flags = TestFlag::all()->keyBy(fn($f) =>
        ($f->project_id ?? '') . '|' . $f->url . '|' . $f->test_type . '|' . $f->test_name
    );

    // Grouper par url + test_type (notre nouvelle logique)
    $key = ($generation->project_id ?? '') . '|' . $generation->url . '|' . $generation->test_type;

    // Statut AVANT insertion (les rows qu'on vient d'insérer)
    $countInserted = count($rows);

    $allWindow = TestExecution::where('url', $generation->url)
        ->where('test_type', $generation->test_type)
        ->where('project_id', $generation->project_id)
        ->orderByDesc('executed_at')
        ->take(self::WINDOW_SIZE)
        ->get();

    // Statut AVANT = fenêtre sans les nouveaux
    $previousWindow = $allWindow->skip($countInserted > self::WINDOW_SIZE ? 0 : $countInserted);
    $previousStats  = $previousWindow->count() > 0
        ? $this->computeStatus($previousWindow, $key, $flags)
        : null;

    // Statut APRÈS = fenêtre complète
    $newStats       = $this->computeStatus($allWindow, $key, $flags);
    $newStatus      = $newStats['status'];
    $previousStatus = $previousStats['status'] ?? 'stable';

    // Créer alerte si changement ou statut préoccupant
    if ($newStatus !== $previousStatus || in_array($newStatus, ['flaky', 'critical', 'warning'])) {
        $alertData = [
            'project_id'      => $generation->project_id,
            'url'             => $generation->url,
            'test_type'       => $generation->test_type,
            'test_name'       => ucfirst($generation->test_type) . ' tests — ' . $generation->url,
            'framework'       => $generation->framework,
            'flakiness_score' => $newStats['flakiness_score'],
        ];

        $alert = $this->createAlert($alertData, $newStatus, $previousStatus);

        if (in_array($newStatus, ['warning', 'flaky', 'critical'])) {
            $this->notifyN8nWebhook($alert);
        }
    }
}

public function details(Request $request)
{
    $request->validate([
        'url'        => 'required|string',
        'test_type'  => 'required|string',
        'project_id' => 'nullable|integer',
    ]);

    $executions = TestExecution::where('url', $request->url)
        ->where('test_type', $request->test_type)
        ->where('project_id', $request->project_id)
        ->orderByDesc('executed_at')
        ->get();

    $groups = $executions->groupBy('test_name');

    $flags = TestFlag::all()->keyBy(fn($f) =>
        ($f->project_id ?? '') . '|' . $f->url . '|' . $f->test_type . '|' . $f->test_name
    );

    $cases = [];
    foreach ($groups as $testName => $group) {
        $window = $group->take(self::WINDOW_SIZE);
        $key    = ($request->project_id ?? '') . '|' . $request->url . '|' . $request->test_type . '|' . $testName;
        $stats  = $this->computeStatus($window, $key, $flags);
        $last   = $window->first();

        // Override status pour les cas individuels
        if ($stats['passes'] === 0 && $stats['fails'] > 0) {
            $stats['status'] = 'broken';
        } elseif ($stats['fails'] === 0 && $stats['passes'] > 0) {
            $stats['status'] = 'stable';
        }

        $cases[] = array_merge($stats, [
            'test_name'      => $testName,
            'generation_id'  => $last->generation_id,
            'last_status'    => $last->status,
            'last_execution' => $last->executed_at,
        ]);
    }

    usort($cases, fn($a, $b) => $b['flakiness_score'] <=> $a['flakiness_score']);

    return response()->json(['cases' => $cases]);
}
}
