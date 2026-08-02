<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Generation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Project;
use App\Http\Controllers\Traits\NotifiesTestResults;



class GenerationController extends Controller
{

use NotifiesTestResults;
private const VALID_TEST_TYPES = ['smoke', 'functional', 'regression', 'performance', 'api', 'security', 'seo'];

    public function generate(Request $request)
    {
        set_time_limit(600);

        $request->validate([
            'url'       => 'required|url',
            'framework' => 'required|in:Selenium,Cypress,Playwright,k6',
            'test_type' => 'nullable|in:smoke,functional,regression,performance,api',
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
        if ($request->has('data')) {
    $request->merge(json_decode($request->input('data'), true) ?? []);
}
$docText = $this->extractDocText($request);

        
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
            
            $timeout = match($testType) {
    'performance' => 180,
    'functional'  => 300,
    'regression'  => 300,
    default       => 120,
};

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

            
            if ($testType === 'performance') {
                return $this->handlePerformanceResult($request, $data, $result, $url, $framework);
            }

            // SMOKE / FUNCTIONAL / REGRESSION
            $wasDowngraded   = $result['downgraded']       ?? false;
            $downgradeReason = $result['downgrade_reason'] ?? null;
            $executionType   = $result['execution_type']   ?? $testType;

            $testCases = $result['test_cases'] ?? [];



            $testCasesSelenium = $result['test_cases_selenium'] ?? [];
            $testCasesCypress  = $result['test_cases_cypress']  ?? [];
            $script            = $result['script']              ?? '';
            $scriptSelenium    = $result['script_selenium']     ?? '';
            $scriptPlaywright  = $result['script_playwright']   ?? '';
            $scriptCypress     = $result['script_cypress']      ?? '';
            $scraped           = $data['scraped']               ?? [];
            $pageType          = $result['page_type']
                              ?? ($testCases[0]['page_type'] ?? 'general');

            
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
            $aiSummary = null;   
            $testCasesToRun = $framework === 'Both' ? $testCasesSelenium : $testCases;
            $pageScreenshot = null;
            if (!empty($testCasesToRun)) {
                $runResponse = Http::timeout(600)->post('http://127.0.0.1:8001/run', [
                'script'     => $framework === 'Both' ? $scriptSelenium : $script,
                'framework'  => $framework === 'Both' ? 'Selenium' : $framework,   
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
                    $aiSummary        = $runData['ai']         ?? null; 
                    $pageScreenshot   = $runData['screenshot']  ?? null;  

                    
$executionResultsForDb = array_map(function($r) {
    $copy = $r;
    // Garder screenshot seulement si test failed
    if (isset($copy['screenshot']) && $copy['status'] !== 'fail') {
        unset($copy['screenshot']);
    }
    return $copy;
}, $executionResults);
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
                'execution_results'   => $executionResultsForDb,
                'load_time_ms'        => $scraped['load_time_ms'] ?? 0,
                'is_spa'              => $scraped['is_spa']       ?? false,
                'pass_count'          => $pass,
                'fail_count'          => $fail,
                'skip_count'          => $skip,
                'pass_rate'           => $rate,
                'page_type'           => $pageType,
                'scraped'             => $scraped,
                'result'              => ($aiSummary || $pageScreenshot) ? [
                    'ai'         => $aiSummary,
                    'screenshot' => $pageScreenshot,
                ] : null,
            ]);

            #n8n notification
            $this->notifyN8n($generation, $pass, $fail, $skip, $rate, $url, $framework, $testType);



            return response()->json([
                'message'             => 'Tests generated successfully',
                'generation'          => $generation,
                'result'              => array_merge($result, [
                    'execution_results' => $executionResults,
                    'page_type'         => $pageType,
                    'test_type'         => $testType,
                    'execution_type'    => $executionType,
                    'script_playwright' => $scriptPlaywright,
                    'ai'                => $aiSummary, 
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
            'performance_data'    => $performance,
            'result'              => ['ai' => $result['ai'] ?? null],
        ]);
        $this->notifyN8n($generation, $pass, $fail, $skip, $rate, $url, $framework, 'performance');

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
            'framework'   => $framework,              
             'url'         => $url,
        ]);
    }

    
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
    return ['valid' => true, 'errors' => [], 'warnings' => ['No test cases generated — skipping execution']];
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
        $warnings[] = "{$testType} test has no interactions (click/fill).";
    }
}

        return [
            'valid'    => empty($errors),
            'errors'   => $errors,
            'warnings' => $warnings,
        ];
    }

    //Unchanged methods
public function index()
{
    ini_set('memory_limit', '512M');
    $generations = Generation::where('user_id', auth()->id())
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(function ($g) {
            $arr = $g->toArray();
           if ($g->test_type === 'performance' && $g->framework === 'k6') {
    $parsed = [];
    if ($g->result) {
        $parsed = is_string($g->result) ? json_decode($g->result, true) : $g->result;
    }
    $arr['test_cases']        = $g->test_cases ?? $parsed['test_cases'] ?? $parsed['execution_results'] ?? [];
    $arr['execution_results'] = $arr['test_cases'];
    $arr['summary']           = $parsed['summary'] ?? [];
    $arr['scripts']           = $parsed['scripts'] ?? [];
}
            return $arr;
        });

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

    public function destroyAll(Request $request)
{
    Generation::where('user_id', auth()->id())->delete();
    return response()->json(['message' => 'All history deleted successfully']);
}
    public function projectVerdict(Request $request)
{
    $request->validate([
        'project_name' => 'required|string',
        'tests'        => 'required|integer',
        'pass_count'   => 'required|integer',
        'fail_count'   => 'required|integer',
        'pass_rate'    => 'required|integer',
    ]);

    try {
        $response = Http::timeout(60)->post('http://127.0.0.1:8001/project-verdict', $request->only([
            'project_name', 'tests', 'pass_count', 'fail_count', 'pass_rate',
        ]));

        if ($response->failed()) {
            return response()->json(['error' => 'AI service error', 'detail' => $response->body()], 500);
        }

        return response()->json($response->json());
    } catch (\Exception $e) {
        Log::error('[NEXTEST] projectVerdict() exception', ['error' => $e->getMessage()]);
        return response()->json(['error' => $e->getMessage()], 500);
    }
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
    $generation = Generation::where('user_id', auth()->id())->findOrFail($id);
    
    $testType = $generation->test_type ?? 'smoke';
    
    $scraped = $generation->scraped ?? [];
    if (empty($scraped)) {
        $scraped = [
            'inputs' => [], 'buttons' => [], 'nav_links' => [],
            'forms'  => [], 'images'  => [], 'alerts'   => [],
            'is_spa' => false, 'load_time_ms' => $generation->load_time_ms ?? 0,
        ];
    }

    $testCases        = $generation->test_cases        ?? [];
    $executionResults = $generation->execution_results ?? $testCases;

    // Récupérer result complet (SEO, performance, etc.)
    $fullResult = $generation->result ?? [];
    if (is_string($fullResult)) {
        $fullResult = json_decode($fullResult, true) ?? [];
    }

    try {
        $payload = [
            'url'               => $generation->url,
            'framework'         => $generation->framework,
            'test_type'         => $testType,
            'test_cases'        => $testCases,
            'execution_results' => $executionResults,
            'load_time_ms'      => $generation->load_time_ms ?? 0,
            'scraped'           => $scraped,
            'page_type'         => $generation->page_type ?? 'general',
            'pass_count'        => $generation->pass_count ?? 0,
            'fail_count'        => $generation->fail_count ?? 0,
            'skip_count'        => $generation->skip_count ?? 0,
            'pass_rate'         => $generation->pass_rate  ?? 0,
            'summary'           => $fullResult['summary'] ?? [],
        ];

        
        if ($testType === 'seo') {
            $payload['seo_score']      = $fullResult['seo_score']      ?? 0;
            $payload['analysis']       = $fullResult['analysis']       ?? [];
            $payload['ai']             = $fullResult['ai']             ?? [];
            $payload['screenshot']     = $fullResult['screenshot']     ?? null;
            $payload['execution_time'] = $fullResult['execution_time'] ?? null;
        }

        if ($testType === 'performance') {
            $performanceData = $generation->performance_data ?? [];
            if (is_string($performanceData)) {
                $performanceData = json_decode($performanceData, true) ?? [];
            }
            $payload['performance'] = $performanceData;
            $payload['framework']   = $generation->framework;
            $payload['ai']          = $fullResult['ai'] ?? [];
        }

  if ($testType === 'smoke' || $testType === 'internal_smoke') {
            $payload['ai'] = $fullResult['ai'] ?? [];
            $payload['screenshot'] = $fullResult['screenshot'] ?? null;
        }

        $response = Http::timeout(60)->post('http://127.0.0.1:8001/generate-pdf', $payload);

        if ($response->failed()) {
            return response()->json(['error' => 'PDF generation failed', 'detail' => $response->body()], 500);
        }

        $pdfBytes = $response->body();

        return response($pdfBytes, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$testType}_report_{$id}.pdf\"",
        ]);

    } catch (\Exception $e) {
        Log::error('[PDF] downloadPdf error', ['error' => $e->getMessage()]);
        return response()->json(['error' => $e->getMessage()], 500);
    }
}


public function downloadXlsx($id)
{
    $generation = Generation::where('user_id', auth()->id())->findOrFail($id);

    $isK6 = $generation->test_type === 'performance' && $generation->framework === 'k6';

    if (!in_array($generation->test_type, ['seo', 'performance', 'smoke'])) {
        return response()->json(['error' => 'XLSX export is only available for SEO, Performance, or Smoke reports'], 422);
    }

    $fullResult = $generation->result ?? [];
    if (is_string($fullResult)) {
        $fullResult = json_decode($fullResult, true) ?? [];
    }

    try {
        // ── K6 PERFORMANCE ──────────────────────────────────────────
        if ($isK6) {
            $testCases = $generation->execution_results
                ?? $generation->test_cases
                ?? $fullResult['execution_results']
                ?? $fullResult['test_cases']
                ?? [];

            $summary = $fullResult['summary'] ?? [];

            $payload = [
                'url'               => $generation->url,
                'framework'         => 'k6',
                'test_cases'        => $testCases,
                'execution_results' => $testCases,
                'summary'           => $summary,
            ];

            $response = Http::timeout(60)->post('http://127.0.0.1:8001/generate-k6-xlsx', $payload);
            $filename = "k6_performance_report_{$id}.xlsx";

        // ── PERFORMANCE PUBLIC (Playwright) ─────────────────────────
        } elseif ($generation->test_type === 'performance') {
            $performanceData = $generation->performance_data ?? [];
            if (is_string($performanceData)) {
                $performanceData = json_decode($performanceData, true) ?? [];
            }

            $payload = [
                'url'               => $generation->url,
                'framework'         => $generation->framework,
                'test_type'         => 'performance',
                'test_cases'        => $generation->test_cases ?? [],
                'execution_results' => $generation->execution_results ?? $generation->test_cases ?? [],
                'performance'       => $performanceData,
                'ai'                => $fullResult['ai'] ?? [],
            ];

            $response = Http::timeout(60)->post('http://127.0.0.1:8001/generate-performance-xlsx', $payload);
            $filename = "performance_report_{$id}.xlsx";

        // ── SMOKE ────────────────────────────────────────────────────────
        } elseif ($generation->test_type === 'smoke') {
            $payload = [
                'url'               => $generation->url,
                'framework'         => $generation->framework,
                'test_type'         => 'smoke',
                'test_cases'        => $generation->test_cases ?? [],
                'execution_results' => $generation->execution_results ?? $generation->test_cases ?? [],
                'ai'                => $fullResult['ai'] ?? [],
            ];

            $response = Http::timeout(60)->post('http://127.0.0.1:8001/generate-smoke-xlsx', $payload);
            $filename = "smoke_report_{$id}.xlsx";

        // ── SEO ──────────────────────────────────────────────────────────
        } else {
            $payload = [
                'url'               => $generation->url,
                'seo_score'         => $fullResult['seo_score']      ?? 0,
                'summary'           => $fullResult['summary']        ?? [
                    'passed'    => $generation->pass_count ?? 0,
                    'failed'    => $generation->fail_count ?? 0,
                    'total'     => ($generation->pass_count ?? 0) + ($generation->fail_count ?? 0),
                    'pass_rate' => $generation->pass_rate ?? 0,
                ],
                'test_cases'        => $generation->test_cases ?? [],
                'ai'                => $fullResult['ai']        ?? [],
                'execution_time'    => $fullResult['execution_time'] ?? null,
                'screenshot'        => $fullResult['screenshot'] ?? null,
            ];

            $response = Http::timeout(60)->post('http://127.0.0.1:8001/generate-seo-xlsx', $payload);
            $filename = "seo_report_{$id}.xlsx";
        }

        if ($response->failed()) {
            return response()->json(['error' => 'XLSX generation failed', 'detail' => $response->body()], 500);
        }

        return response($response->body(), 200, [
            'Content-Type'        => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);

    } catch (\Exception $e) {
        Log::error('[XLSX] downloadXlsx error', ['error' => $e->getMessage()]);
        return response()->json(['error' => $e->getMessage()], 500);
    }
}

private function generateHtmlBytes(Generation $generation): string
{
    $pass  = $generation->pass_count ?? 0;
    $fail  = $generation->fail_count ?? 0;
    $skip  = $generation->skip_count ?? 0;
    $total = $pass + $fail + $skip;
    $rate  = $total > 0 ? round($pass / $total * 100) : 0;
    $rc    = $rate >= 80 ? '#10b981' : ($rate >= 50 ? '#f59e0b' : '#ef4444');
    $date  = now()->format('d/m/Y H:i');

    return "<!DOCTYPE html>
<html lang='fr'>
<head>
  <meta charset='UTF-8'/>
  <title>NexTest Report #{$generation->id}</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; background:#f8fafc; color:#1e293b; padding:40px; }
    h1   { color:#0a0f1e; }
    .badge { display:inline-block; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700; }
    .card  { background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:24px; margin:16px 0; }
    .stat  { display:inline-block; text-align:center; margin:8px 16px; }
    .stat-val { font-size:36px; font-weight:700; }
    .stat-lbl { font-size:11px; color:#64748b; text-transform:uppercase; }
  </style>
</head>
<body>
  <h1>🧪 NexTest — Rapport #{$generation->id}</h1>
  <p>Généré le <b>{$date}</b></p>
  <div class='card'>
    <p><b>URL :</b> {$generation->url}</p>
    <p><b>Framework :</b> {$generation->framework} &nbsp;|&nbsp; <b>Type :</b> {$generation->test_type}</p>
  </div>
  <div class='card'>
    <div class='stat'><div class='stat-val' style='color:#10b981'>{$pass}</div><div class='stat-lbl'>Passés</div></div>
    <div class='stat'><div class='stat-val' style='color:#ef4444'>{$fail}</div><div class='stat-lbl'>Échoués</div></div>
    <div class='stat'><div class='stat-val' style='color:#f59e0b'>{$skip}</div><div class='stat-lbl'>Ignorés</div></div>
    <div class='stat'><div class='stat-val' style='color:{$rc}'>{$rate}%</div><div class='stat-lbl'>Pass Rate</div></div>
  </div>
  <p style='color:#64748b;font-size:12px'>Rapport généré par NexTest — AI-Powered Test Automation</p>
</body>
</html>";
}

private function generateCsvBytes(Generation $generation): string
{
    $rows   = [['ID','Test Name','Status','Category','Priority']];
    $tests  = $generation->execution_results ?? $generation->test_cases ?? [];

    foreach ($tests as $tc) {
        $rows[] = [
            $tc['id']       ?? '',
            '"' . str_replace('"', '""', $tc['name']     ?? '') . '"',
            $tc['status']   ?? 'skip',
            $tc['category'] ?? 'smoke',
            $tc['priority'] ?? 'medium',
        ];
    }
    return "\xEF\xBB\xBF" . implode("\n", array_map(
        fn($r) => implode(',', $r),
        $rows
    ));
}


#internel test
public function generateInternal(Request $request)
{
    set_time_limit(600);

    if ($request->has('data')) {              
        $request->merge(json_decode($request->input('data'), true) ?? []);
    }

    $request->validate([
        'url'          => 'required|url',
        'framework'    => 'required|in:Selenium,Playwright,Cypress',
        'test_type'    => 'nullable|string',
        'scrape_login' => 'nullable|boolean',
        'cookies'      => 'nullable|array',
        'username'     => 'nullable|string',
        'password'     => 'nullable|string',
        'login_url'    => 'nullable|url',
        'token'        => 'nullable|string',
        'project_id'   => 'nullable|integer',
    ]);

    $url         = $request->url;
    $framework   = $request->framework   ?? 'Playwright';
    $testType    = $request->test_type   ?? 'smoke';
    $scrapeLogin = $request->scrape_login ?? false;
    $cookies     = $request->cookies     ?? null;
    $username    = $request->username    ?? null;
    $password    = $request->password    ?? null;
    $loginUrl    = $request->login_url   ?? null;
 
$docText = $this->extractDocText($request);

    Log::info('[NEXTEST] generateInternal()', [
        'url'          => $url,
        'framework'    => $framework,
        'test_type'    => $testType,
        'scrape_login' => $scrapeLogin,
        'has_cookies'  => !empty($cookies),
        'has_username' => !empty($username),
    ]);

    try {
        $timeout = match($testType) {
            'security'    => 180,
            'e2e'         => 180,
            'performance' => 180,
            default       => 120,
        };

        $response = Http::timeout($timeout)->post('http://127.0.0.1:8001/generate-internal', [
            'url'          => $url,
            'framework'    => $framework,
            'test_type'    => $testType,
            'scrape_login' => $scrapeLogin,
            'cookies'      => $cookies,
            'username'     => $username,
            'password'     => $password,
            'login_url'    => $loginUrl,
        ]);

        if ($response->failed()) {
            return response()->json([
                'error'  => 'AI service error',
                'detail' => $response->body(),
            ], 500);
        }

        $data   = $response->json();
        $result = $data['result'] ?? [];

        $testType = $result['test_type'] ?? $testType;


        $testCases = $result['test_cases'] ?? [];
        $pass = $result['pass_count'] ?? 0;
        $fail = $result['fail_count'] ?? 0;
        $skip = 0;
        $rate = $result['pass_rate']  ?? 0;

        // Run tests with existing runner
        $executionResults = [];
        $aiSummary = null;
        $pageScreenshot = null;
        if (!empty($testCases)) {
            $runResponse = Http::timeout(300)->post('http://127.0.0.1:8001/run', [
                'script'     => $result['script'] ?? '',
                'framework'  => $framework,
                'test_cases' => $testCases,
                'test_type'  => $testType,
            ]);

            if ($runResponse->successful()) {
                $runData          = $runResponse->json();
                $pass             = $runData['pass_count'] ?? $pass;
                $fail             = $runData['fail_count'] ?? $fail;
                $skip             = $runData['skip_count'] ?? 0;
                $rate             = $runData['pass_rate']  ?? $rate;
                $executionResults = $runData['results']    ?? [];
                $aiSummary        = $runData['ai']         ?? null;
                $pageScreenshot   = $runData['screenshot']  ?? null;
            }
        }

        // Keep per-test failure screenshots only for failed checks (DB weight)
        $executionResultsForDb = array_map(function ($r) {
            $copy = $r;
            if (isset($copy['screenshot']) && ($copy['status'] ?? null) !== 'fail') {
                unset($copy['screenshot']);
            }
            return $copy;
        }, $executionResults);

        $scraped = $data['scraped'] ?? [];

        $generation = Generation::create([
            'user_id'             => auth()->id(),
            'project_id'          => $request->project_id ?? null,
            'url'                 => $url,
            'framework'           => $framework,
            'test_type'           => $testType,
            'status'              => 'completed',
            'test_cases'          => $testCases,
            'test_cases_selenium' => $testCases,
            'test_cases_cypress'  => $testCases,
            'script'              => $result['script']            ?? '',
            'script_selenium'     => $result['script_selenium']   ?? '',
            'script_playwright'   => $result['script_playwright'] ?? '',
            'script_cypress'      => $result['script_cypress']    ?? '',
            'execution_results'   => $executionResultsForDb,
            'load_time_ms'        => $scraped['load_time_ms']     ?? 0,
            'is_spa'              => $scraped['is_spa']           ?? false,
            'pass_count'          => $pass,
            'fail_count'          => $fail,
            'skip_count'          => $skip,
            'pass_rate'           => $rate,
            'page_type' => ($scraped['is_login_page'] ?? false) ? 'login' : 'dashboard',
            'scraped'             => $scraped,
            'result'              => ($aiSummary || $pageScreenshot) ? [
                'ai'         => $aiSummary,
                'screenshot' => $pageScreenshot,
            ] : null,
        ]);

        $this->notifyN8n($generation, $pass, $fail, $skip, $rate, $url, $framework, $testType);

        return response()->json([
            'message'    => 'Internal tests generated successfully',
            'generation' => $generation,
            'result'     => array_merge($result, [
                'execution_results' => $executionResults,
                'test_type'         => $testType,
                'ai'                => $aiSummary,
                'screenshot'        => $pageScreenshot, 
            ]),
            'scraped'    => $scraped,
            'test_type'  => $testType,
            'framework'  => $framework,
            'url'        => $url,
        ]);

    } catch (\Exception $e) {
        Log::error('[NEXTEST] generateInternal() exception', ['error' => $e->getMessage()]);
        return response()->json(['error' => $e->getMessage()], 500);
    }
}


public function generateApi(Request $request)
{
    set_time_limit(600);

    if ($request->has('data')) {
        $request->merge(json_decode($request->input('data'), true) ?? []);
    }

    $request->validate([
        'url'        => 'required|url',
        'framework'  => 'required|in:Pytest,Postman',
        'test_type'  => 'nullable|string',
        'username'   => 'nullable|string',
        'password'   => 'nullable|string',
        'anpe_token' => 'nullable|string',  
        'project_id' => 'nullable|integer',
    ]);
    
    \Log::info('[GENERATE-API] anpe_token received', [
        'anpe_token_preview' => substr($request->anpe_token ?? '', 0, 50),
        'anpe_token_length'  => strlen($request->anpe_token ?? ''),
    ]);

    $url       = $request->url;
    $framework = $request->framework ?? 'Pytest';

    try {
    $docText = $this->extractDocText($request);

    $response = Http::timeout(180)->post('http://127.0.0.1:8001/generate-api', [
        'url'       => $url,
        'framework' => $framework,
         'username'  => $request->username ?? null,
        'password'  => $request->password ?? null,
        'token'     => $request->anpe_token ?? '',
        'domains'   => $request->domains ?? ['auth'],
        'doc_text'  => $docText,
    ]);

        if ($response->failed()) {
            return response()->json(['error' => 'AI service error', 'detail' => $response->body()], 500);
        }

        $data   = $response->json();
        $result = $data['result'] ?? [];

        $generation = Generation::create([
            'user_id'           => auth()->id(),
            'project_id'        => $request->project_id ?? null,
            'url'               => $url,
            'framework'         => $framework,
            'test_type'         => 'api',
            'status'            => 'completed',
            'test_cases'        => $result['test_cases']        ?? [],
            'execution_results' => $result['execution_results'] ?? [],
            'pass_count'        => $result['pass_count']        ?? 0,
            'fail_count'        => $result['fail_count']        ?? 0,
            'skip_count'        => $result['skip_count']        ?? 0,
            'pass_rate'         => $result['pass_rate']         ?? 0,
            'page_type'         => 'api',
            'scraped'           => [],
            'result'            => ['ai' => $result['ai'] ?? null], 
        ]);
$this->notifyN8n($generation, $result['pass_count'] ?? 0, $result['fail_count'] ?? 0, $result['skip_count'] ?? 0, $result['pass_rate'] ?? 0, $url, $framework, 'api');

$this->recordFlakyAlerts($generation, $result['execution_results'] ?? [], 'api', $framework);
        
        return response()->json([
            'message'    => 'API tests generated successfully',
            'generation' => $generation,
            'result'     => $result,
            'test_type'  => 'api',
        ]);

    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
}

public function generateSecurity(Request $request)
{
    set_time_limit(600);

    if ($request->has('data')) {
        $request->merge(json_decode($request->input('data'), true) ?? []);
    }

    $request->validate([
    'url'        => 'required|url',
    'project_id' => 'nullable|integer',
    'categories' => 'nullable|array',
    'anpe_token' => 'nullable|string',
    'project_name' => 'nullable|string',   
    'project_type' => 'nullable|string',
    'username'     => 'nullable|string',
    'password'     => 'nullable|string',
]);

    if ($request->has('data')) {
    $request->merge(json_decode($request->input('data'), true) ?? []);
}
$docText = $this->extractDocText($request);

    $url = $request->url;

    Log::info('[NEXTEST] generateSecurity()', ['url' => $url]);

    try {
        $response = Http::timeout(300)->post('http://127.0.0.1:8001/generate-security', [
    'url'        => $url,
    'token'      => $request->anpe_token ?? '',
    'categories' => $request->categories ?? null,
    'doc_text'   => $docText,
    'username'   => $request->username ?? '',
    'password'   => $request->password ?? '',
]);

        if ($response->failed()) {
            return response()->json(['error' => 'AI service error', 'detail' => $response->body()], 500);
        }

        $data   = $response->json();
        $result = $data['result'] ?? [];

        $testCases = $result['test_cases'] ?? [];

        // Run security tests
        $runResponse = Http::timeout(300)->post('http://127.0.0.1:8001/run-security', [
    'test_cases' => $testCases,
    'token'      => $request->anpe_token ?? '',
    'username'   => $request->username ?? '',
    'password'   => $request->password ?? '',
]);

        $pass = 0; $fail = 0; $warn = 0;
        $executionResults = [];

        if ($runResponse->successful()) {
            $runData          = $runResponse->json();
            $pass             = $runData['pass_count'] ?? 0;
            $fail             = $runData['fail_count'] ?? 0;
            $warn             = $runData['warn_count'] ?? 0;
            $executionResults = $runData['results']    ?? [];
        }

        $rate = ($pass + $fail + $warn) > 0
            ? round($pass / ($pass + $fail + $warn) * 100)
            : 0;

        $generation = Generation::create([
            'user_id'           => auth()->id(),
            'project_id'        => $request->project_id ?? null,
            'url'               => $url,
            'framework'         => 'Pytest',
            'test_type'         => 'security',
            'status'            => 'completed',
            'test_cases'        => $testCases,
            'execution_results' => $executionResults,
            'pass_count'        => $pass,
            'fail_count'        => $fail,
            'skip_count'        => $warn,   
            'pass_rate'         => $rate,
            'page_type'         => 'api',
            'scraped'           => [],
            'result'            => ['ai' => $result['ai'] ?? null],
        ]);

        $this->notifyN8n($generation, $pass, $fail, $warn, $rate, $url, 'Pytest', 'security');
        $this->recordFlakyAlerts($generation, $executionResults, 'security', 'Pytest');

        return response()->json([
            'message'    => 'Security tests completed',
            'generation' => $generation,
            'result'     => array_merge($result, [
                'test_cases'        => $executionResults,
                'execution_results' => $executionResults,
                'pass_count'        => $pass,
                'fail_count'        => $fail,
                'warn_count'        => $warn,
                'pass_rate'         => $rate,
                'test_type'         => 'security',
            ]),
            'test_type'  => 'security',
            'url'        => $url,
        ]);

    } catch (\Exception $e) {
        Log::error('[NEXTEST] generateSecurity() exception', ['error' => $e->getMessage()]);
        return response()->json(['error' => $e->getMessage()], 500);
    }
}

public function generateRegression(Request $request)

{
    Log::info('[REGRESSION] request data', $request->all());
    Log::info('[REGRESSION] files', ['files' => $request->allFiles()]);
  
    if ($request->has('data')) {
    $request->merge(json_decode($request->input('data'), true) ?? []);
}

$validated = $request->validate([
    'url'        => 'required|string',
    'framework'  => 'nullable|string',
    'project_id' => 'nullable|integer',
    'doc_files'  => 'nullable|array',
    'doc_files.*'=> 'nullable|file|mimes:pdf,txt,json,yaml,yml,md,docx|max:10240',
    'data'       => 'nullable|string',
    'username'     => 'nullable|string',
    'password'     => 'nullable|string',]);

    $url       = $validated['url'];
    $framework = $validated['framework'] ?? 'Playwright';
    $projectId = $validated['project_id'] ?? null;

    if ($request->has('data')) {
    $request->merge(json_decode($request->input('data'), true) ?? []);
}
$docText = $this->extractDocText($request);

    try {
      $response = Http::timeout(300)->post('http://127.0.0.1:8001/generate-regression', [
    'url'        => $url,
    'framework'  => $framework,
    'project_id' => $projectId,
    'doc_text'   => $docText,
    'username'   => $validated['username'] ?? '',
    'password'   => $validated['password'] ?? '',
]);
        $data = $response->json();

        if (!$data || isset($data['error'])) {
            return response()->json(['error' => $data['error'] ?? 'Generation failed'], 500);
        }

        $result     = $data['result'] ?? [];

     $testCases  = $result['execution_results'] ?? $result['test_cases'] ?? [];
        $passCount  = $result['pass_count'] ?? 0;
        $failCount  = $result['fail_count'] ?? 0;
        $skipCount  = $result['skip_count'] ?? 0;
        $passRate   = $result['pass_rate'] ?? 0;

     $generation = Generation::create([
    'user_id'           => auth()->id(),
    'project_id'        => $projectId,
    'url'               => $url,
    'framework'         => $framework,
    'test_type'         => 'regression',
    'status'            => 'completed',
    'test_cases'        => $testCases,
    'execution_results' => $testCases,
    'pass_count'        => $passCount,
    'fail_count'        => $failCount,
    'skip_count'        => $skipCount,
    'pass_rate'         => $passRate,
    'load_time_ms'      => 0,
    'is_spa'            => false,
    'page_type'         => 'general',
    'scraped'           => [],
    'result'            => ['ai' => $result['ai'] ?? null],
]);
$this->notifyN8n($generation, $passCount, $failCount, $skipCount, $passRate, $url, $framework, 'regression');


$this->recordFlakyAlerts($generation, $testCases, 'regression', $framework);
        return response()->json([
            'id'         => $generation->id,
            'url'        => $url,
            'framework'  => $framework,
            'test_type'  => 'regression',
            'result'     => $result,
            'pass_count' => $passCount,
            'fail_count' => $failCount,
            'skip_count' => $skipCount,
            'pass_rate'  => $passRate,
            'test_cases' => $testCases,
        ]);

    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
}

public function generateFunctional(Request $request)
{
    // ← ICI EN PREMIER, avant tout
    if ($request->has('data')) {
        $request->merge(json_decode($request->input('data'), true) ?? []);
    }

    $validated = $request->validate([
        'url'        => 'required|string',
        'framework'  => 'nullable|string',
        'project_id' => 'nullable|integer',
    ]);

    $url       = $validated['url'];
    $framework = $validated['framework'] ?? 'Playwright';
    $projectId = $validated['project_id'] ?? null;

    $docText = $this->extractDocText($request);

    try {
        $response = Http::timeout(300)->post('http://127.0.0.1:8001/generate-functional', [
            'url'        => $url,
            'framework'  => $framework,
            'project_id' => $projectId,
            'username'   => $request->username ?? '',   
            'password'   => $request->password ?? '',   
        ]);

        $data = $response->json();

        if (!$data || isset($data['error'])) {
            return response()->json(['error' => $data['error'] ?? 'Generation failed'], 500);
        }

        $result    = $data['result'] ?? [];
        $testCases = $result['execution_results'] ?? $result['test_cases'] ?? [];
        $passCount = $result['pass_count'] ?? 0;
        $failCount = $result['fail_count'] ?? 0;
        $skipCount = $result['skip_count'] ?? 0;
        $passRate  = $result['pass_rate']  ?? 0;

        $generation = Generation::create([
            'user_id'           => auth()->id(),
            'project_id'        => $projectId,
            'url'               => $url,
            'framework'         => $framework,
            'test_type'         => 'functional',
            'status'            => 'completed',
            'test_cases'        => $testCases,
            'execution_results' => $testCases,
            'pass_count'        => $passCount,
            'fail_count'        => $failCount,
            'skip_count'        => $skipCount,
            'pass_rate'         => $passRate,
            'load_time_ms'      => 0,
            'is_spa'            => false,
            'page_type'         => 'general',
            'scraped'           => [],
            'result'            => ['ai' => $result['ai'] ?? null],
        ]);
        $this->notifyN8n($generation, $passCount, $failCount, $skipCount, $passRate, $url, $framework, 'functional');

        
        // ── Record flaky alerts
        $this->recordFlakyAlerts($generation, $testCases, 'functional', $framework);

        return response()->json([
            'id'         => $generation->id,
            'url'        => $url,
            'framework'  => $framework,
            'test_type'  => 'functional',
            'result'     => $result,
            'pass_count' => $passCount,
            'fail_count' => $failCount,
            'skip_count' => $skipCount,
            'pass_rate'  => $passRate,
            'test_cases' => $testCases,
        ]);

    } catch (\Exception $e) {
        Log::error('[NEXTEST] generateFunctional() exception', ['error' => $e->getMessage()]);
        return response()->json(['error' => $e->getMessage()], 500);
    }
}

public function generateSeo(Request $request)
{
    set_time_limit(300);
 
    $request->validate([
        'url'        => 'required|url',
        'project_id' => 'nullable|integer',
    ]);
 
    $url = $request->url;
 
    // Block localhost
    if (str_contains($url, 'localhost') || str_contains($url, '127.0.0.1')) {
        return response()->json([
            'error' => 'localhost URLs cannot be tested — please use a public URL.',
        ], 422);
    }
 
    Log::info('[NEXTEST] generateSeo()', ['url' => $url]);
 
    try {
        $response = Http::timeout(120)->post('http://127.0.0.1:8001/generate-seo', [
            'url' => $url,
        ]);
 
        if ($response->failed()) {
            return response()->json([
                'error'  => 'AI service error',
                'detail' => $response->body(),
            ], 500);
        }
 
        $data   = $response->json();
        $result = $data['result'] ?? $data ?? [];
 
        $testCases = $result['test_cases'] ?? [];
        $summary   = $result['summary']    ?? [];
        $passCount = collect($testCases)->where('status', 'pass')->count();
        $failCount = collect($testCases)->where('status', 'fail')->count();
        $total     = $passCount + $failCount;
        $passRate  = $total > 0 ? round($passCount / $total * 100) : 0;
        $seoScore  = $result['seo_score']  ?? 0;
 
        $generation = Generation::create([
            'user_id'           => auth()->id(),
            'project_id'        => $request->project_id ?? null,
            'url'               => $url,
            'framework'         => 'Requests',
            'test_type'         => 'seo',
            'status'            => 'completed',
            'test_cases'        => $testCases,
            'execution_results' => $testCases,
            'pass_count'        => $passCount,
            'fail_count'        => $failCount,
            'skip_count'        => 0,
            'pass_rate'         => (int) round($passRate),
            'load_time_ms'      => $result['analysis']['load_time_ms'] ?? 0,
            'is_spa'            => false,
            'page_type'         => 'seo',
            'scraped'           => [],
            'result'            => $result,   // stocke tout le résultat (seo_score, analysis, ai)
        ]);
 
        $this->notifyN8n(
            $generation,
            $passCount,
            $failCount,
            0,
            (int) round($passRate),
            $url,
            'SEO',
            'seo'
        );
 
        return response()->json([
            'message'    => 'SEO analysis completed',
            'generation' => $generation,
            'result'     => array_merge($result, [
            'test_type'  => 'seo',
            'url'        => $url,
            'seo_score'  => $seoScore,
            ]),
        ]);
 
    } catch (\Exception $e) {
        Log::error('[NEXTEST] generateSeo() exception', ['error' => $e->getMessage()]);
        return response()->json(['error' => $e->getMessage()], 500);
    }
}
 

public function generatePerformance(Request $request)
{
    set_time_limit(1000);

    if ($request->has('data')) {
        $request->merge(json_decode($request->input('data'), true) ?? []);
    }

    $validated = $request->validate([
        'url'        => 'required|string',
        'framework'  => 'nullable|string',
        'project_id' => 'nullable|integer',
        'test_types' => 'nullable|array',
    ]);
 
    $url        = $validated['url'];
    $framework  = $validated['framework'] ?? 'k6';
    $projectId  = $validated['project_id'] ?? null;
    $testTypes  = $validated['test_types'] ?? ['load', 'stress', 'spike', 'soak'];
    $docText    = $this->extractDocText($request);
 
    try {
        // Performance tests take longer — timeout 600s
       $response = Http::timeout(900)->post('http://127.0.0.1:8001/generate-performance', [
           'url'        => $url,
    'framework'  => $framework,
    'project_id' => $projectId,
    'test_types' => $testTypes,
    'doc_text'   => $docText,
    'username'   => $request->username ?? '',
    'password'   => $request->password ?? '',
]);
 
        $data = $response->json();
 
        if (!$data || isset($data['error'])) {
            return response()->json(['error' => $data['error'] ?? 'Generation failed'], 500);
        }
 
        $result = $data['result'] ?? $data ?? [];
        $testCases  = $result['execution_results'] ?? $result['test_cases'] ?? [];
        $passCount  = $result['pass_count'] ?? 0;
        $failCount  = $result['fail_count'] ?? 0;
        $skipCount  = $result['skip_count'] ?? 0;
        $passRate   = $result['pass_rate'] ?? 0;
 \Log::info('[K6 SAVE] result keys: ' . implode(', ', array_keys($result)));
\Log::info('[K6 SAVE] summary keys: ' . implode(', ', array_keys($result['summary'] ?? [])));
        $generation = Generation::create([
    'user_id'     => auth()->id(),
    'project_id'  => $projectId,
    'url'         => $url,
    'framework'   => $framework,
    'test_type'   => 'performance',
    'status'      => 'completed',
    'result'      => $result,
    'test_cases'        => $testCases,       
    'execution_results' => $testCases,
    'pass_count'  => $passCount,
    'fail_count'  => $failCount,
    'skip_count'  => $skipCount,
    'pass_rate'   => (int) round($passRate),
]);
$this->notifyN8n($generation, $passCount, $failCount, $skipCount, (int) round($passRate), $url, $framework, 'performance');
 
$this->recordFlakyAlerts($generation, $testCases, 'performance', $framework);
        return response()->json([
            'id'         => $generation->id,
            'url'        => $url,
            'framework'  => $framework,
            'test_type'  => 'performance',
            'result'     => $result,
            'pass_count' => $passCount,
            'fail_count' => $failCount,
            'skip_count' => $skipCount,
            'pass_rate'  => $passRate,
            'test_cases' => $testCases,
            'summary'    => $result['summary'] ?? [],
        ]);
 
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
}

private function extractDocText(Request $request): string
{
    if (!$request->hasFile('doc_files')) return '';

    $texts = [];
    foreach ($request->file('doc_files') as $file) {
        $ext  = strtolower($file->getClientOriginalExtension());
        $name = $file->getClientOriginalName();

        if ($ext === 'txt' || $ext === 'md') {
            $texts[] = "--- {$name} ---\n" . mb_substr(file_get_contents($file->getRealPath()), 0, 3000);
        } elseif ($ext === 'pdf') {
            $text = shell_exec("pdftotext " . escapeshellarg($file->getRealPath()) . " -");
            $texts[] = "--- {$name} ---\n" . mb_substr($text ?? '', 0, 3000);
        } elseif (in_array($ext, ['json', 'yaml', 'yml'])) {
            $texts[] = "--- {$name} ---\n" . mb_substr(file_get_contents($file->getRealPath()), 0, 3000);
        }
    }

    return implode("\n\n", $texts);
}
public function testedUrlsForProject(Request $request, $projectId)
{
    $testType = $request->query('test_type');

    $query = Generation::where('project_id', $projectId)
        ->where('user_id', auth()->id());

    if ($testType) {
        $query->where('test_type', $testType);
    }

    $urls = $query->orderByDesc('created_at')
        ->pluck('url')
        ->filter()
        ->unique()
        ->values();

    return response()->json(['urls' => $urls]);
}


}