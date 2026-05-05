<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Generation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GenerationController extends Controller
{
    // ── Valid test types ─────────────────────────────────────────────────────
    private const VALID_TEST_TYPES = ['smoke', 'functional', 'regression', 'performance'];

    public function generate(Request $request)
    {
        set_time_limit(300);

        $request->validate([
            'url'       => 'required|url',
            'framework' => 'required|in:Selenium,Cypress,Playwright,k6',
            'test_type' => 'nullable|in:smoke,functional,regression,performance',
        ]);

        $url       = $request->url;
        $framework = $request->framework ?? 'Selenium';
        $testType  = $request->test_type  ?? 'smoke';

        $frameworkMap = [
            'selenium'   => 'Selenium',
            'playwright' => 'Playwright',
            'cypress'    => 'Cypress',
            'both'       => 'Both',
            'all'        => 'All',
        ];
        $framework = $frameworkMap[strtolower($framework)] ?? $framework;
        $testType  = strtolower($testType);

        // Block localhost
        if (str_contains($url, 'localhost') || str_contains($url, '127.0.0.1')) {
            return response()->json([
                'error' => 'localhost URLs cannot be tested — please use a public URL.',
            ], 422);
        }

        Log::info('[NEXTEST] generate()', [
            'url'       => $url,
            'framework' => $framework,
            'test_type' => $testType,
        ]);

        try {
            // ── Call Python AI service ───────────────────────────────────────
            // Performance tests prennent plus de temps (mesure réelle + LLaMA)
            $timeout = $testType === 'performance' ? 180 : 120;

            $response = Http::timeout($timeout)->post('http://127.0.0.1:8001/generate', [
                'url'       => $url,
                'framework' => $framework,
                'test_type' => $testType,
            ]);

            if ($response->failed()) {
                return response()->json([
                    'error'  => 'AI service error',
                    'detail' => $response->body(),
                ], 500);
            }

            $data   = $response->json();
            $result = $data['result'] ?? [];

            // ── PERFORMANCE : traitement spécifique ──────────────────────────
            if ($testType === 'performance') {
                return $this->handlePerformanceResult($request, $data, $result, $url, $framework);
            }

            // ── SMOKE / FUNCTIONAL / REGRESSION ─────────────────────────────
            $wasDowngraded   = $result['downgraded']       ?? false;
            $downgradeReason = $result['downgrade_reason'] ?? null;
            $executionType   = $result['execution_type']   ?? $testType;

            $testCases         = $result['test_cases']          ?? [];
            $testCasesSelenium = $result['test_cases_selenium'] ?? [];
            $testCasesCypress  = $result['test_cases_cypress']  ?? [];
            $script            = $result['script']              ?? '';
            $scriptSelenium    = $result['script_selenium']     ?? '';
            $scriptPlaywright  = $result['script_playwright']   ?? '';
            $scriptCypress     = $result['script_cypress']      ?? '';
            $scraped           = $data['scraped']               ?? [];
            $pageType          = $result['page_type']
                              ?? ($testCases[0]['page_type'] ?? 'general');

            // PHP validation
            if ($wasDowngraded) {
                $validationResult = ['valid' => true, 'errors' => [], 'warnings' => [
                    "Test type downgraded from {$testType} to smoke: {$downgradeReason}",
                ]];
            } else {
                $validationResult = $this->validateTestCases($testCases, $testType);
            }

            if (!$validationResult['valid']) {
                return response()->json([
                    'error'             => 'Generated tests do not match test_type contract',
                    'validation_errors' => $validationResult['errors'],
                    'test_cases'        => $testCases,
                    'test_type'         => $testType,
                ], 422);
            }

            // Execute tests
            $pass = $fail = $skip = $rate = 0;
            $executionResults = [];
            $testCasesToRun = $framework === 'Both' ? $testCasesSelenium : $testCases;

            if (!empty($testCasesToRun)) {
                $runResponse = Http::timeout(150)->post('http://127.0.0.1:8001/run', [
                    'script'     => $framework === 'Both' ? $scriptSelenium : $script,
                    'framework'  => 'Selenium',
                    'test_cases' => $testCasesToRun,
                    'test_type'  => $testType,
                ]);

                if ($runResponse->successful()) {
                    $runData          = $runResponse->json();
                    $pass             = $runData['pass_count'] ?? 0;
                    $fail             = $runData['fail_count'] ?? 0;
                    $skip             = $runData['skip_count'] ?? 0;
                    $rate             = $runData['pass_rate']  ?? 0;
                    $executionResults = $runData['results']    ?? [];
                }
            }

            // Persist
            $generation = Generation::create([
                'user_id'             => auth()->id(),
                'project_id'          => $request->project_id ?? null,
                'url'                 => $url,
                'framework'           => $framework,
                'test_type'           => $testType,
                'status'              => 'completed',
                'test_cases'          => $testCases,
                'test_cases_selenium' => $testCasesSelenium,
                'test_cases_cypress'  => $testCasesCypress,
                'script'              => $script,
                'script_selenium'     => $scriptSelenium,
                'script_playwright'   => $scriptPlaywright,
                'script_cypress'      => $scriptCypress,
                'execution_results'   => $executionResults,
                'load_time_ms'        => $scraped['load_time_ms'] ?? 0,
                'is_spa'              => $scraped['is_spa']       ?? false,
                'pass_count'          => $pass,
                'fail_count'          => $fail,
                'skip_count'          => $skip,
                'pass_rate'           => $rate,
                'page_type'           => $pageType,
                'scraped'             => $scraped,
            ]);

            return response()->json([
                'message'             => 'Tests generated successfully',
                'generation'          => $generation,
                'result'              => array_merge($result, [
                    'execution_results' => $executionResults,
                    'page_type'         => $pageType,
                    'test_type'         => $testType,
                    'execution_type'    => $executionType,
                    'script_playwright' => $scriptPlaywright,
                ]),
                'scraped'             => $scraped,
                'test_type'           => $testType,
                'downgraded'          => $wasDowngraded,
                'downgrade_reason'    => $downgradeReason,
                'validation_warnings' => $validationResult['warnings'],
            ]);

        } catch (\Exception $e) {
            Log::error('[NEXTEST] generate() exception', ['error' => $e->getMessage()]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Handle performance test result specifically.
     */
    private function handlePerformanceResult(
        Request $request,
        array   $data,
        array   $result,
        string  $url,
        string  $framework
    ) {
        $scraped      = $data['scraped']    ?? [];
        $testCases    = $result['test_cases'] ?? [];
        $performance  = $result['performance'] ?? [];

        $pass = $performance['pass_count'] ?? 0;
        $fail = $performance['fail_count'] ?? 0;
        $skip = $performance['skip_count'] ?? 0;
        $rate = ($pass + $fail) > 0
            ? round($pass / ($pass + $fail) * 100)
            : 0;

        Log::info('[NEXTEST] Performance result', [
            'url'          => $url,
            'global_score' => $performance['global_score'] ?? 0,
            'pass'         => $pass, 'fail' => $fail, 'skip' => $skip,
        ]);

        // Persist — on stocke les métriques dans execution_results
        $generation = Generation::create([
            'user_id'             => auth()->id(),
            'project_id'          => $request->project_id ?? null,
            'url'                 => $url,
            'framework'           => $framework,
            'test_type'           => 'performance',
            'status'              => 'completed',
            'test_cases'          => $testCases,
            'test_cases_selenium' => $testCases,
            'test_cases_cypress'  => $testCases,
            'script'              => $result['script']            ?? '',
            'script_selenium'     => $result['script_selenium']   ?? '',
            'script_playwright'   => $result['script_playwright'] ?? '',
            'script_cypress'      => $result['script_cypress']    ?? '',
            'execution_results'   => $testCases,  // déjà avec status pass/fail
            'load_time_ms'        => $performance['metrics']['load_time_ms'] ?? ($scraped['load_time_ms'] ?? 0),
            'is_spa'              => $scraped['is_spa']   ?? false,
            'pass_count'          => $pass,
            'fail_count'          => $fail,
            'skip_count'          => $skip,
            'pass_rate'           => $rate,
            'page_type'           => 'general',
            'scraped'             => $scraped,
            // Colonne JSON pour stocker les données performance
            // Ajoute cette colonne dans ta migration si elle n'existe pas :
            // $table->json('performance_data')->nullable();
            // 'performance_data' => $performance,
        ]);

        return response()->json([
            'message'    => 'Performance tests completed',
            'generation' => $generation,
            'result'     => array_merge($result, [
                'execution_results' => $testCases,
                'test_type'         => 'performance',
            ]),
            'scraped'    => $scraped,
            'test_type'  => 'performance',
            'performance' => $performance,
        ]);
    }

    /**
     * PHP-side contract validation.
     */
    private function validateTestCases(array $testCases, string $testType): array
    {
        $errors   = [];
        $warnings = [];

        // Performance tests : pas de validation classique
        if ($testType === 'performance') {
            return ['valid' => true, 'errors' => [], 'warnings' => []];
        }

        $interactionActions = ['click', 'fill', 'submit'];
        $assertionTypes     = ['url_contains', 'element_visible', 'element_exists',
                               'text_contains', 'input_value'];

        if (empty($testCases)) {
            return ['valid' => false, 'errors' => ['No test cases generated'], 'warnings' => []];
        }

        $actions = array_column($testCases, 'action');

        if ($testType === 'smoke') {
            $forbidden = array_filter($actions, fn($a) => in_array($a, $interactionActions));
            if (!empty($forbidden)) {
                $errors[] = 'Smoke test contains forbidden actions: ' . implode(', ', $forbidden);
            }
        } elseif (in_array($testType, ['functional', 'regression'])) {
            $interactions = array_filter($actions, fn($a) => in_array($a, $interactionActions));
            if (empty($interactions)) {
                $errors[] = "{$testType} test has no interactions (click/fill).";
            }

            foreach ($testCases as $i => $step) {
                if (!in_array($step['action'] ?? '', $interactionActions)) continue;

                $assertion = $step['assertion'] ?? null;
                if (empty($assertion) || !is_array($assertion)) {
                    $errors[] = sprintf(
                        'Step %d (%s on %s) has no assertion',
                        $i + 1, $step['action'], $step['selector'] ?? '?'
                    );
                } elseif (!in_array($assertion['type'] ?? '', $assertionTypes)) {
                    $errors[] = sprintf(
                        'Step %d has invalid assertion type "%s"',
                        $i + 1, $assertion['type'] ?? 'null'
                    );
                }
            }
        }

        return [
            'valid'    => empty($errors),
            'errors'   => $errors,
            'warnings' => $warnings,
        ];
    }

    // ── Unchanged methods ────────────────────────────────────────────────────

    public function index()
    {
        $generations = Generation::where('user_id', auth()->id())
            ->with('project:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($generations);
    }

    public function show($id)
    {
        $generation = Generation::where('user_id', auth()->id())
            ->findOrFail($id);

        return response()->json($generation);
    }

    public function destroy($id)
    {
        $generation = Generation::where('user_id', auth()->id())
            ->findOrFail($id);

        $generation->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }

    public function analyze(Request $request)
    {
        $request->validate([
            'error'     => 'required|string',
            'script'    => 'required|string',
            'framework' => 'in:Selenium,Cypress',
        ]);

        try {
            $response = Http::timeout(60)->post('http://127.0.0.1:8001/analyze', [
                'error'     => $request->error,
                'script'    => $request->script,
                'framework' => $request->framework ?? 'Selenium',
            ]);

            return response()->json($response->json());

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function downloadPdf($id)
    {
        set_time_limit(60);

        $generation = Generation::where('user_id', auth()->id())
            ->findOrFail($id);

        try {
            $response = Http::timeout(60)->post('http://127.0.0.1:8001/generate-pdf', [
                'url'                 => $generation->url,
                'framework'           => $generation->framework,
                'test_cases'          => $generation->test_cases          ?? [],
                'test_cases_selenium' => $generation->test_cases_selenium ?? [],
                'test_cases_cypress'  => $generation->test_cases_cypress  ?? [],
                'script'              => $generation->script              ?? '',
                'script_selenium'     => $generation->script_selenium     ?? '',
                'script_playwright'   => $generation->script_playwright   ?? '',
                'script_cypress'      => $generation->script_cypress      ?? '',
                'execution_results'   => $generation->execution_results   ?? [],
                'load_time_ms'        => $generation->load_time_ms,
                'is_spa'              => $generation->is_spa,
                'created_at'          => $generation->created_at,
                'scraped'             => $generation->scraped   ?? [],
                'page_type'           => $generation->page_type ?? 'general',
            ]);

            return response($response->body(), 200, [
                'Content-Type'        => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="nextest_report.pdf"',
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}