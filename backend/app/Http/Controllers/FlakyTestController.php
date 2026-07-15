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

   
    /*  Calcul du statut flaky pour un groupe d'exécutions                 */

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

    // ── Le score ne doit jamais être inférieur au taux d'échec réel de la fenêtre.
    // Contrairement à un plancher fixe (30%), ce plancher est directement
    // proportionnel aux données : 1 fail sur 10 runs → plancher 10%,
    // 5 fails sur 10 runs → plancher 50%. Plus de valeur magique déconnectée.
    if ($n >= 2 && $fails > 0 && $passes > 0) {
        $failRate = (int) round($fails / $n * 100);
        $score = max($score, $failRate);
    }

    if ($n >= 3 && $fails > 0 && $passes === 0) {
    // Broken confirmé : au moins 3 échecs consécutifs, aucun succès — pas un coup de malchance isolé.
    $statusLabel = 'broken';
} elseif ($n >= 1 && $n < 3 && $fails > 0 && $passes === 0) {
    // Pas assez de recul pour parler de "broken" : le test échoue, mais on lui laisse une marge.
    $statusLabel = 'critical';
} elseif ($n >= 1 && $passes > 0 && $fails === 0) {
    $statusLabel = 'stable';
} else {
    $statusLabel = 'stable';
    if ($score > 50)     $statusLabel = 'critical';
    elseif ($score > 20) $statusLabel = 'flaky';
    elseif ($score > 0)  $statusLabel = 'warning';
}

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

    
    /*  Créer une alerte en DB                                             */
    
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

    private function notifyN8nWebhookBatch(array $alerts): void
{
    $url = env('N8N_FLAKY_WEBHOOK_URL');
    if (!$url || empty($alerts)) return;

    try {
        Http::timeout(10)->post($url, [
            'batch'        => true,
            'alert_count'  => count($alerts),
            'triggered_at' => now()->toIso8601String(),
            'alerts'       => collect($alerts)->map(fn($a) => [
                'alert_id'        => $a->id,
                'status'          => $a->status,
                'previous_status' => $a->previous_status,
                'test_name'       => $a->test_name,
                'url'             => $a->url,
                'test_type'       => $a->test_type,
                'framework'       => $a->framework,
                'flakiness_score' => $a->flakiness_score,
                'message'         => $a->message,
                'project_id'      => $a->project_id,
            ])->all(),
        ]);

        foreach ($alerts as $a) {
            $a->update(['notified_n8n' => true]);
        }
    } catch (\Throwable $e) {
        Log::warning('n8n batch webhook failed: ' . $e->getMessage());
    }
}
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

    
    /*  INDEX — liste des flaky tests                                      */
    
public function index(Request $request)
{
    $query = TestExecution::query()->orderByDesc('executed_at');

    if ($request->filled('project_id')) $query->where('project_id', $request->query('project_id'));
if ($request->filled('test_type'))  $query->where('test_type',  $request->query('test_type'));
if ($request->filled('date_from'))  $query->where('executed_at', '>=', $request->query('date_from'));
if ($request->filled('date_to'))    $query->where('executed_at', '<=', $request->query('date_to'));

if ($request->filled('date_filter')) {
    $now = now();
    match ($request->query('date_filter')) {
        'today' => $query->whereDate('executed_at', $now->toDateString()),
        'week'  => $query->where('executed_at', '>=', $now->copy()->startOfWeek()),
        'month' => $query->where('executed_at', '>=', $now->copy()->startOfMonth()),
        default => null,
    };
}

    $executions = $query->get();

    // ── ÉTAPE 1 : calcul individuel par test_name (précision du score préservée)
    $testGroups = $executions->groupBy(fn($e) =>
        ($e->project_id ?? '') . '|' . $e->url . '|' . $e->test_type . '|' . $e->test_name
    );

    $flags = TestFlag::all()->keyBy(fn($f) =>
        ($f->project_id ?? '') . '|' . $f->url . '|' . $f->test_type . '|' . $f->test_name
    );

    $individual = [];
    foreach ($testGroups as $key => $group) {
        $window = $group->take(self::WINDOW_SIZE);
        $stats  = $this->computeStatus($window, $key, $flags);
        $last   = $window->first();

        $individual[] = array_merge($stats, [
            'test_name'      => $last->test_name,
            'url'            => $last->url,
            'test_type'      => $last->test_type,
            'project_id'     => $last->project_id,
            'framework'      => $last->framework,
            'generation_id'  => $last->generation_id,
            'last_execution' => $last->executed_at,
        ]);
    }

    // ── ÉTAPE 2 : agréger par URL+type = une ligne parent
$statusRank = [
    'ignored'  => -1, // en dessous de stable : un test ignoré ne doit jamais masquer un vrai problème
    'stable'   => 0,
    'warning'  => 1,
    'flaky'    => 2,
    'critical' => 3,
    'broken'   => 4,
];
$parentGroups = collect($individual)->groupBy(fn($t) =>
    ($t['project_id'] ?? '') . '|' . $t['url'] . '|' . $t['test_type']
);

$tests = [];
foreach ($parentGroups as $key => $cases) {
    $worst = $cases->sortByDesc(fn($c) => $statusRank[$c['status']] ?? 0)->first();

    $tests[] = [
        'url'              => $worst['url'],
        'test_type'        => $worst['test_type'],
        'test_name'        => $worst['test_name'],
        'project_id'       => $worst['project_id'],
        'framework'        => $worst['framework'],
        'status'           => $worst['status'],
        // ── on affiche le score du pire test, pas une moyenne qui contredit le badge
        'flakiness_score'  => $worst['flakiness_score'],
        'total_runs'       => $cases->sum('total_runs'),
        'passes'           => $cases->sum('passes'),
        'fails'            => $cases->sum('fails'),
        'skips'            => $cases->sum('skips'),
        'generation_id'    => $worst['generation_id'],
        'last_execution'   => $cases->max('last_execution'),
        'generation_count' => $cases->pluck('generation_id')->unique()->count(),
    ];
}

    if ($request->filled('search')) {
        $s = mb_strtolower($request->query('search'));
        $tests = array_values(array_filter($tests, fn($t) =>
            str_contains(mb_strtolower($t['url']), $s)
        ));
    }

    if ($request->filled('status')) {
    $st = $request->query('status');

    // Clés des groupes (project_id|url|test_type) qui contiennent AU MOINS UN test
    // avec ce statut — pas seulement le "pire" statut agrégé de la ligne.
    $matchingKeys = collect($individual)
        ->filter(fn($t) => $t['status'] === $st)
        ->map(fn($t) => ($t['project_id'] ?? '') . '|' . $t['url'] . '|' . $t['test_type'])
        ->unique()
        ->flip();

    $tests = array_values(array_filter($tests, function ($t) use ($matchingKeys) {
        $key = ($t['project_id'] ?? '') . '|' . $t['url'] . '|' . $t['test_type'];
        return isset($matchingKeys[$key]);
    }));
}

    usort($tests, fn($a, $b) => $b['flakiness_score'] <=> $a['flakiness_score']);

    // ── KPIs calculés sur les tests individuels ($individual), pas sur les lignes
    // agrégées par URL ($tests) — sinon 1 seul test broken sur 12 donnerait 100%
    // au lieu du vrai taux (~8%).
    $totalIndividual = count($individual);
    $flakyIndividual = count(array_filter($individual, fn($t) => in_array($t['status'], ['flaky', 'critical', 'broken'])));
    $flakinessRate   = $totalIndividual > 0 ? round($flakyIndividual / $totalIndividual * 100) : 0;
    $totalExecutions = array_sum(array_column($tests, 'total_runs'));
    $failedRuns      = array_sum(array_column($tests, 'fails'));

    return response()->json([
        'kpis' => [
            'total_flaky_tests' => $flakyIndividual,
            'flakiness_rate'    => $flakinessRate,
            'total_executions'  => $totalExecutions,
            'failed_runs'       => $failedRuns,
        ],
        'tests' => $tests,
    ]);
}

    
    /*  RECORD — enregistre une exécution + détecte changement de statut  */
    
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
            'reason'        => 'nullable|string',
            'duration_ms'   => 'nullable|integer',
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

        //Insertion
        TestExecution::create([
            'generation_id' => $data['generation_id'],
            'project_id'    => $data['project_id'] ?? null,
            'url'           => $data['url'],
            'test_type'     => $data['test_type'],
            'framework'     => $data['framework'] ?? null,
            'test_name'     => $data['test_name'],
            'status'        => $data['status'],
            'executed_at'   => now(),
            'reason'        => $data['reason'] ?? null,
            'duration_ms'   => $data['duration_ms'] ?? null,
        ]);

        //Statut APRÈS l'insertion
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

        //Détection du changement
        if ($newStatus !== $previousStatus) {
            $alertData = [
                'project_id'      => $data['project_id'] ?? null,
                'url'             => $data['url'],
                'test_type'       => $data['test_type'],
                'test_name'       => $data['test_name'],
                'framework'       => $data['framework'] ?? null,
                'flakiness_score' => $newStats['flakiness_score'],
            ];

            $alert = $this->createAlert($alertData, $newStatus, $previousStatus);

        // Notifier n8n pour tout changement de statut significatif, y compris le retour à la stabilité
if (in_array($newStatus, ['warning', 'flaky', 'critical', 'stable'])) {
    $this->notifyN8nWebhook($alert);
}
           
        }

        return response()->json(['recorded' => true]);
    }

    
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

    
    /*  FLAG / UNFLAG                                                      */
    
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

public function destroy(Request $request)
{
    $data = $request->validate([
        'project_id' => 'nullable|integer',
        'url'        => 'required|string',
        'test_type'  => 'required|string',
        'test_name'  => 'required|string',
    ]);

    TestExecution::where('url', $data['url'])
        ->where('test_type', $data['test_type'])
        ->where('test_name', $data['test_name'])
        ->where('project_id', $data['project_id'] ?? null)
        ->delete();

    TestFlag::where('url', $data['url'])
        ->where('test_type', $data['test_type'])
        ->where('test_name', $data['test_name'])
        ->where('project_id', $data['project_id'] ?? null)
        ->delete();

    Alert::where('url', $data['url'])
        ->where('test_type', $data['test_type'])
        ->where('test_name', $data['test_name'])
        ->where('project_id', $data['project_id'] ?? null)
        ->delete();

    return response()->json(['deleted' => true]);
}


/*  Capture l'état flaky de chaque test AVANT l'insertion des nouvelles */

public function capturePreviousStates(Generation $generation, array $rows): array
{
    $flags = TestFlag::all()->keyBy(fn($f) =>
        ($f->project_id ?? '') . '|' . $f->url . '|' . $f->test_type . '|' . $f->test_name
    );

    $states = [];
    $testNames = collect($rows)->pluck('test_name')->unique();

    foreach ($testNames as $testName) {
        $key = ($generation->project_id ?? '') . '|' . $generation->url . '|' . $generation->test_type . '|' . $testName;

        $window = TestExecution::where('url', $generation->url)
            ->where('test_type', $generation->test_type)
            ->where('test_name', $testName)
            ->where('project_id', $generation->project_id)
            ->orderByDesc('executed_at')
            ->take(self::WINDOW_SIZE)
            ->get();

        $states[$testName] = $window->count() > 0
            ? $this->computeStatus($window, $key, $flags)
            : null;
    }

    return $states;
}


/*  DETECT AND ALERT — utilise maintenant l'état capturé AVANT insert   */

public function detectAndAlert(Generation $generation, array $rows, array $previousStates = []): void
{
    $flags = TestFlag::all()->keyBy(fn($f) =>
        ($f->project_id ?? '') . '|' . $f->url . '|' . $f->test_type . '|' . $f->test_name
    );

    $alertsToNotify = [];
    $testNames = collect($rows)->pluck('test_name')->unique();

    foreach ($testNames as $testName) {
        $key = ($generation->project_id ?? '') . '|' . $generation->url . '|' . $generation->test_type . '|' . $testName;

        $newWindow = TestExecution::where('url', $generation->url)
            ->where('test_type', $generation->test_type)
            ->where('test_name', $testName)
            ->where('project_id', $generation->project_id)
            ->orderByDesc('executed_at')
            ->take(self::WINDOW_SIZE)
            ->get();

        $newStats       = $this->computeStatus($newWindow, $key, $flags);
        $newStatus      = $newStats['status'];
        $previousStatus = $previousStates[$testName]['status'] ?? 'stable';

        if ($newStatus !== $previousStatus) {
            $alertData = [
                'project_id'      => $generation->project_id,
                'url'             => $generation->url,
                'test_type'       => $generation->test_type,
                'test_name'       => $testName,
                'framework'       => $generation->framework,
                'flakiness_score' => $newStats['flakiness_score'],
            ];

            $alert = $this->createAlert($alertData, $newStatus, $previousStatus);

            if (in_array($newStatus, ['warning', 'flaky', 'critical', 'stable'])) {
                $alertsToNotify[] = $alert;
            }
        }
    }

    if (!empty($alertsToNotify)) {
        $this->notifyN8nWebhookBatch($alertsToNotify);
    }
}


public function destroyByUrl(Request $request)
{
    $data = $request->validate([
        'project_id' => 'nullable|integer',
        'url'        => 'required|string',
    ]);

    TestExecution::where('url', $data['url'])
        ->where('project_id', $data['project_id'] ?? null)
        ->delete();

    TestFlag::where('url', $data['url'])
        ->where('project_id', $data['project_id'] ?? null)
        ->delete();

    Alert::where('url', $data['url'])
        ->where('project_id', $data['project_id'] ?? null)
        ->delete();

    return response()->json(['deleted' => true]);
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

        

        // ── V1 / V2 comparison adaptative (coupe l'historique en 2 moitiés égales) ──
        $total = $group->count();
        $comparison = null;

        if ($total >= 4) {
            $half     = intdiv($total, 2);
            $v2Window = $group->take($half);          // moitié récente
            $v1Window = $group->slice($half, $half);  // moitié précédente

            $v2Stats = $this->computeRawStats($v2Window);
            $v1Stats = $this->computeRawStats($v1Window);

            $comparison = [
                'v1'     => $v1Stats,
                'v2'     => $v2Stats,
                'reason' => $this->buildComparisonReason($v1Stats, $v2Stats),
            ];
        }

        $cases[] = array_merge($stats, [
            'test_name'      => $testName,
            'generation_id'  => $last->generation_id,
            'last_status'    => $last->status,
            'last_execution' => $last->executed_at,
            'comparison'     => $comparison,
        ]);
    }

    usort($cases, fn($a, $b) => $b['flakiness_score'] <=> $a['flakiness_score']);

    return response()->json(['cases' => $cases]);
}

private function computeRawStats($window): array
{
    $n      = $window->count();
    $passes = $window->where('status', 'pass')->count();
    $fails  = $window->where('status', 'fail')->count();
    $skips  = $n - $passes - $fails;
    $rate   = $n > 0 ? round($passes / $n * 100) : 0;

    $avgDuration = $n > 0
        ? (int) round($window->avg('duration_ms'))
        : 0;

    // Raisons d'échec uniques et non vides sur cette fenêtre
    $failReasons = $window->where('status', 'fail')
        ->pluck('reason')
        ->filter(fn($r) => filled($r))
        ->unique()
        ->values()
        ->all();

    return [
        'total_runs'   => $n,
        'passes'       => $passes,
        'fails'        => $fails,
        'skips'        => $skips,
        'rate'         => $rate,
        'avg_duration' => $avgDuration,
        'fail_reasons' => $failReasons,
    ];
}

private function buildComparisonReason(array $v1, array $v2): string
{
    $rateDelta     = $v2['rate'] - $v1['rate'];
    $failDelta     = $v2['fails'] - $v1['fails'];
    $skipDelta     = $v2['skips'] - $v1['skips'];
    $durationDelta = $v2['avg_duration'] - $v1['avg_duration'];

    $newReasons       = array_values(array_diff($v2['fail_reasons'], $v1['fail_reasons']));
    $resolvedReasons  = array_values(array_diff($v1['fail_reasons'], $v2['fail_reasons']));

    $parts = [];

    if ($rateDelta < 0) {
        $failTxt = $failDelta > 0 ? "+{$failDelta} failure(s)" : "{$failDelta} failure(s)";
        $parts[] = "The success rate dropped from {$v1['rate']}% to {$v2['rate']}% ({$rateDelta}%), with {$failTxt} over the last {$v2['total_runs']} runs.";
    } elseif ($rateDelta > 0) {
        $parts[] = "The success rate improved from {$v1['rate']}% to {$v2['rate']}% (+{$rateDelta}%). This test is stabilizing.";
    } elseif ($skipDelta !== 0) {
        $parts[] = "Success rate stable ({$v2['rate']}%), but the number of skips changed ({$v1['skips']} → {$v2['skips']}).";
    } elseif ($v2['rate'] === 100) {
        $parts[] = "This test has been fully reliable across both periods — {$v2['total_runs']} consecutive runs, all passed. No instability detected.";
    } else {
        $parts[] = "This test remained consistent between the two periods, holding steady at {$v2['rate']}% success rate over " . ($v1['total_runs'] + $v2['total_runs']) . " runs.";
    }
    if (!empty($newReasons)) {
        $parts[] = "New failure cause(s) appeared: " . implode('; ', $newReasons) . ".";
    }
    if (!empty($resolvedReasons)) {
        $parts[] = "Previous failure cause(s) no longer occurring: " . implode('; ', $resolvedReasons) . ".";
    }
    if (abs($durationDelta) >= 500) { // seuil 500ms pour ignorer le bruit
        $sign = $durationDelta > 0 ? '+' : '';
        $parts[] = "Average execution time changed by {$sign}{$durationDelta}ms ({$v1['avg_duration']}ms → {$v2['avg_duration']}ms).";
    }

    return implode(' ', $parts);
}
}
