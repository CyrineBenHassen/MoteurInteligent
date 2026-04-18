<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Generation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GenerationController extends Controller
{
    // Valid test types — single source of truth
    private const VALID_TEST_TYPES = ['smoke', 'functional', 'regression'];

    public function generate(Request $request)
    {
        set_time_limit(300);

        $request->validate([
            'url'       => 'required|url',
            'framework' => 'in:Selenium,Cypress,Both',
            // FIX 1: test_type was never validated or read — added here
            'test_type' => 'in:smoke,functional,regression',
        ]);

        $url      = $request->url;
        $framework = $request->framework ?? 'Selenium';
        // FIX 2: read test_type from request — was hardcoded/missing before
        $testType = $request->test_type ?? 'smoke';

        Log::info('[NEXTEST] generate()', [
            'url'       => $url,
            'framework' => $framework,
            'test_type' => $testType,   // now visible in logs for debugging
        ]);

        try {
            // ── Step 1: Generate tests via LLM ─────────────────────────────
            // FIX 3: test_type is now forwarded to the Python service
            $response = Http::timeout(120)->post('http://127.0.0.1:8001/generate', [
                'url'       => $url,
                'framework' => $framework,
                'test_type' => $testType,   // ← the missing piece
            ]);

            if ($response->failed()) {
                return response()->json([
                    'error' => 'AI service error',
                    'detail' => $response->body(),
                ], 500);
            }

            $data   = $response->json();
            $result = $data['result'] ?? [];

            // Surface validation errors from Python if generation partially failed
            if (!empty($result['validation_errors'])) {
                Log::warning('[NEXTEST] Generation validation errors', [
                    'test_type' => $testType,
                    'errors'    => $result['validation_errors'],
                ]);
            }

            // Detect and log downgrade (static page: functional → smoke)
            $wasDowngraded   = $result['downgraded']       ?? false;
            $downgradeReason = $result['downgrade_reason'] ?? null;
            $executionType   = $result['execution_type']   ?? $testType; // 'smoke' when downgraded

            if ($wasDowngraded) {
                Log::info('[NEXTEST] Test type downgraded', [
                    'requested'      => $testType,
                    'execution_type' => $executionType,
                    'reason'         => $downgradeReason,
                ]);
            }

            $testCases         = $result['test_cases']          ?? [];
            $testCasesSelenium = $result['test_cases_selenium'] ?? [];
            $testCasesCypress  = $result['test_cases_cypress']  ?? [];
            $script            = $result['script']              ?? '';
            $scriptSelenium    = $result['script_selenium']     ?? '';
            $scriptCypress     = $result['script_cypress']      ?? '';
            $scraped           = $data['scraped']               ?? [];
            $pageType          = $result['page_type']
                              ?? ($testCases[0]['page_type'] ?? 'general');

            // ── Step 2: PHP-side validation before execution ────────────────
            // Skip contract validation for downgraded tests — the Python layer
            // already handled the downgrade and the steps are correctly smoke-shaped.
            if ($wasDowngraded) {
                $validationResult = ['valid' => true, 'errors' => [], 'warnings' => [
                    "Test type downgraded from {$testType} to smoke: {$downgradeReason}",
                ]];
            } else {
                $validationResult = $this->validateTestCases($testCases, $testType);
            }

            if (!$validationResult['valid']) {
                Log::error('[NEXTEST] PHP validation failed — aborting run', [
                    'test_type' => $testType,
                    'errors'    => $validationResult['errors'],
                    'steps'     => array_column($testCases, 'action'),
                ]);

                // Return 422 with the bad test cases for frontend debugging
                return response()->json([
                    'error'             => 'Generated tests do not match test_type contract',
                    'validation_errors' => $validationResult['errors'],
                    'test_cases'        => $testCases,   // for debugging
                    'test_type'         => $testType,
                ], 422);
            }

            if (!empty($validationResult['warnings'])) {
                Log::warning('[NEXTEST] Validation warnings', $validationResult['warnings']);
            }

            // ── Step 3: Execute tests ───────────────────────────────────────
            $pass             = 0;
            $fail             = 0;
            $skip             = 0;
            $rate             = 0;
            $executionResults = [];

            $testCasesToRun = $framework === 'Both' ? $testCasesSelenium : $testCases;

            Log::info('[NEXTEST] Running tests', [
                'test_type' => $testType,
                'count'     => count($testCasesToRun),
                'actions'   => array_column($testCasesToRun, 'action'),
            ]);

            if (!empty($testCasesToRun)) {
                $runResponse = Http::timeout(150)->post('http://127.0.0.1:8001/run', [
                    'script'     => $framework === 'Both' ? $scriptSelenium : $script,
                    'framework'  => 'Selenium',
                    'test_cases' => $testCasesToRun,
                    'test_type'  => $testType,  // forward so runner can apply mode logic
                ]);

                Log::info('[NEXTEST] /run response', [
                    'status' => $runResponse->status(),
                ]);

                if ($runResponse->successful()) {
                    $runData          = $runResponse->json();
                    $pass             = $runData['pass_count'] ?? 0;
                    $fail             = $runData['fail_count'] ?? 0;
                    $skip             = $runData['skip_count'] ?? 0;
                    $rate             = $runData['pass_rate']  ?? 0;
                    $executionResults = $runData['results']    ?? [];
                } else {
                    Log::error('[NEXTEST] /run failed', ['body' => $runResponse->body()]);
                }
            } else {
                Log::warning('[NEXTEST] No test cases to run');
            }

            // ── Step 4: Persist ─────────────────────────────────────────────
            $generation = Generation::create([
                'user_id'             => auth()->id(),
                'url'                 => $url,
                'framework'           => $framework,
                'test_type'           => $testType,   // persist so history shows correct mode
                'status'              => 'completed',
                'test_cases'          => $testCases,
                'test_cases_selenium' => $testCasesSelenium,
                'test_cases_cypress'  => $testCasesCypress,
                'script'              => $script,
                'script_selenium'     => $scriptSelenium,
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
                'message'          => 'Tests generated successfully',
                'generation'       => $generation,
                'result'           => array_merge($result, [
                    'execution_results' => $executionResults,
                    'page_type'         => $pageType,
                    'test_type'         => $testType,       // always the requested type
                    'execution_type'    => $executionType,  // what actually ran
                ]),
                'scraped'          => $scraped,
                'page_type'        => $pageType,
                'test_type'        => $testType,            // requested — never mutated
                'execution_type'   => $executionType,       // 'smoke' when downgraded
                'downgraded'       => $wasDowngraded,
                'downgrade_reason' => $downgradeReason,
                'validation_warnings' => $validationResult['warnings'],
            ]);

        } catch (\Exception $e) {
            Log::error('[NEXTEST] generate() exception', ['error' => $e->getMessage()]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * PHP-side contract validation — mirrors Python's _validate_steps().
     * Runs after generation, before execution, so bad tests never reach the runner.
     */
    private function validateTestCases(array $testCases, string $testType): array
    {
        $errors   = [];
        $warnings = [];

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
            // Must have at least one interaction
            $interactions = array_filter($actions, fn($a) => in_array($a, $interactionActions));
            if (empty($interactions)) {
                $errors[] = "{$testType} test has no interactions (click/fill) — "
                          . "this is a smoke test in disguise. "
                          . "Actions found: " . implode(', ', array_unique($actions));
            }

            // Every interaction must have an assertion
            foreach ($testCases as $i => $step) {
                if (!in_array($step['action'] ?? '', $interactionActions)) continue;

                $assertion = $step['assertion'] ?? null;
                if (empty($assertion) || !is_array($assertion)) {
                    $errors[] = sprintf(
                        'Step %d (%s on %s) has no assertion — '
                        . 'every interaction must validate its outcome',
                        $i + 1, $step['action'], $step['selector'] ?? '?'
                    );
                } elseif (!in_array($assertion['type'] ?? '', $assertionTypes)) {
                    $errors[] = sprintf(
                        'Step %d has invalid assertion type "%s". Must be one of: %s',
                        $i + 1, $assertion['type'] ?? 'null', implode(', ', $assertionTypes)
                    );
                }
            }

            if ($testType === 'regression') {
                $assertSteps = array_filter($testCases, fn($s) => !empty($s['assertion']));
                if (count($assertSteps) < 3) {
                    $warnings[] = 'Regression test has ' . count($assertSteps)
                                . ' assertions (recommended minimum: 3)';
                }
                if (count($testCases) < 8) {
                    $warnings[] = 'Regression test has ' . count($testCases)
                                . ' steps (recommended minimum: 8)';
                }
            }
        }

        return [
            'valid'    => empty($errors),
            'errors'   => $errors,
            'warnings' => $warnings,
        ];
    }

    // ── Unchanged methods below ─────────────────────────────────────────────

    public function index()
    {
        $generations = Generation::where('user_id', auth()->id())
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