<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Generation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Project;

class GenerationController extends Controller
{
    // ── Valid test types ─────────────────────────────────────────────────────
    private const VALID_TEST_TYPES = ['smoke', 'functional', 'regression', 'performance'];

    public function generate(Request $request)
    {
        set_time_limit(600);

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

            // ── PERFORMANCE : traitement spécifique ──────────────────────────
            if ($testType === 'performance') {
                return $this->handlePerformanceResult($request, $data, $result, $url, $framework);
            }

            // ── SMOKE / FUNCTIONAL / REGRESSION ─────────────────────────────
            $wasDowngraded   = $result['downgraded']       ?? false;
            $downgradeReason = $result['downgrade_reason'] ?? null;
            $executionType   = $result['execution_type']   ?? $testType;

            $testCases = $result['test_cases'] ?? [];

// Fallback vers smoke si LLaMA n'a rien généré
if (empty($testCases) && $testType !== 'smoke') {
    Log::warning('[NEXTEST] No test cases generated, falling back to smoke', [
        'url' => $url, 'test_type' => $testType
    ]);
    $smokeResponse = Http::timeout(120)->post('http://127.0.0.1:8001/generate', [
        'url'       => $url,
        'framework' => $framework,
        'test_type' => 'smoke',
    ]);
    if ($smokeResponse->successful()) {
        $smokeData  = $smokeResponse->json();
        $result     = $smokeData['result'] ?? $result;
        $testCases  = $result['test_cases'] ?? [];
    }
}
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
                $runResponse = Http::timeout(600)->post('http://127.0.0.1:8001/run', [
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

                    
$executionResultsForDb = array_map(function($r) {
    $copy = $r;
    unset($copy['screenshot']); // trop lourd pour la DB
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
                'execution_results' => $executionResultsForDb,
                'load_time_ms'        => $scraped['load_time_ms'] ?? 0,
                'is_spa'              => $scraped['is_spa']       ?? false,
                'pass_count'          => $pass,
                'fail_count'          => $fail,
                'skip_count'          => $skip,
                'pass_rate'           => $rate,
                'page_type'           => $pageType,
                'scraped'             => $scraped,
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
            'performance_data' => $performance,
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
            'framework'   => $framework,              // ← AJOUTE ICI
             'url'         => $url,
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

    // ── Unchanged methods ────────────────────────────────────────────────────
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

    public function destroyAll(Request $request)
{
    Generation::where('user_id', auth()->id())->delete();
    return response()->json(['message' => 'All history deleted successfully']);
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


    // ── À ajouter AVANT le dernier } de la classe ──────────────────

private function notifyN8n(
    Generation $generation,
    int    $pass,
    int    $fail,
    int    $skip,
    int    $rate,
    string $url,
    string $framework,
    string $testType
): void {
    try {
        $pdfBytes = $this->generatePdfBytes($generation);

        \Illuminate\Support\Facades\Mail::send([], [], function($message) use ($generation, $pdfBytes, $pass, $fail, $skip, $rate) {
            $id     = $generation->id;
            $rc     = $rate >= 80 ? '#10b981' : ($rate >= 50 ? '#f59e0b' : '#ef4444');
            $si     = $fail === 0 ? '✅' : '❌';
            $status = $fail === 0 ? 'Tests Passed' : 'Tests Failed';
            $sbg    = $fail === 0 ? '#d1fae5' : '#fee2e2';
            $sc     = $fail === 0 ? '#059669' : '#dc2626';
            $sbd    = $fail === 0 ? '#10b981' : '#ef4444';
            $date   = now()->format('d/m/Y H:i');

            $html = "
            <!DOCTYPE html>
            <html>
            <head><meta charset='UTF-8'/></head>
            <body style='margin:0;padding:0;background:#f8fafc;font-family:Segoe UI,sans-serif'>
              <div style='max-width:600px;margin:0 auto;padding:32px'>
                <div style='background:#0a0f1e;border-radius:16px;padding:32px;text-align:center;margin-bottom:24px'>
                  <div style='height:3px;background:linear-gradient(90deg,transparent,#c9a227,transparent);margin-bottom:16px'></div>
                  <h1 style='color:#c9a227;margin:0;font-size:32px;letter-spacing:4px'>NEX<span style='color:#fff;font-weight:300'>TEST</span></h1>
                  <p style='color:#94a3b8;margin:8px 0 0;font-size:12px;letter-spacing:2px;text-transform:uppercase'>AI-Powered Test Automation</p>
                </div>
                <div style='text-align:center;margin-bottom:24px'>
                  <span style='display:inline-block;padding:10px 28px;border-radius:30px;font-size:18px;font-weight:700;background:{$sbg};color:{$sc};border:2px solid {$sbd}'>
                    {$si} {$status}
                  </span>
                </div>
                <div style='background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;margin-bottom:20px'>
                  <table style='width:100%;border-collapse:collapse'>
                    <tr style='border-bottom:1px solid #f1f5f9'>
                      <td style='padding:10px 0;color:#64748b;font-weight:700;font-size:13px;width:120px'>🔗 URL</td>
                      <td style='padding:10px 0;color:#1e293b;font-size:13px'>{$generation->url}</td>
                    </tr>
                    <tr style='border-bottom:1px solid #f1f5f9'>
                      <td style='padding:10px 0;color:#64748b;font-weight:700;font-size:13px'>⚙️ Framework</td>
                      <td style='padding:10px 0;color:#1e293b;font-size:13px'><b>{$generation->framework}</b></td>
                    </tr>
                    <tr style='border-bottom:1px solid #f1f5f9'>
                      <td style='padding:10px 0;color:#64748b;font-weight:700;font-size:13px'>🧪 Type</td>
                      <td style='padding:10px 0;color:#1e293b;font-size:13px'>{$generation->test_type}</td>
                    </tr>
                    <tr>
                      <td style='padding:10px 0;color:#64748b;font-weight:700;font-size:13px'>🕐 Date</td>
                      <td style='padding:10px 0;color:#1e293b;font-size:13px'>{$date}</td>
                    </tr>
                  </table>
                </div>
                <div style='display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px'>
                  <div style='background:#d1fae5;border:1px solid #a7f3d0;border-radius:12px;padding:16px;text-align:center'>
                    <div style='font-size:32px;font-weight:700;color:#059669'>{$pass}</div>
                    <div style='font-size:10px;color:#059669;font-weight:700;text-transform:uppercase;margin-top:4px'>Passés</div>
                  </div>
                  <div style='background:#fee2e2;border:1px solid #fca5a5;border-radius:12px;padding:16px;text-align:center'>
                    <div style='font-size:32px;font-weight:700;color:#dc2626'>{$fail}</div>
                    <div style='font-size:10px;color:#dc2626;font-weight:700;text-transform:uppercase;margin-top:4px'>Échoués</div>
                  </div>
                  <div style='background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:16px;text-align:center'>
                    <div style='font-size:32px;font-weight:700;color:#d97706'>{$skip}</div>
                    <div style='font-size:10px;color:#d97706;font-weight:700;text-transform:uppercase;margin-top:4px'>Ignorés</div>
                  </div>
                  <div style='background:#fff;border:2px solid {$rc};border-radius:12px;padding:16px;text-align:center'>
                    <div style='font-size:32px;font-weight:700;color:{$rc}'>{$rate}%</div>
                    <div style='font-size:10px;color:{$rc};font-weight:700;text-transform:uppercase;margin-top:4px'>Pass Rate</div>
                  </div>
                </div>
                <div style='background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:20px'>
                  <div style='display:flex;justify-content:space-between;margin-bottom:8px'>
                    <span style='font-size:13px;font-weight:700;color:#1e293b'>Taux de réussite global</span>
                    <span style='font-size:13px;font-weight:700;color:{$rc}'>{$rate}%</span>
                  </div>
                  <div style='height:10px;background:#f1f5f9;border-radius:10px;overflow:hidden'>
                    <div style='height:100%;width:{$rate}%;background:{$rc};border-radius:10px'></div>
                  </div>
                </div>
                <div style='background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin-bottom:20px;text-align:center'>
                  <p style='margin:0;color:#1d4ed8;font-size:13px;font-weight:600'>📎 Rapport PDF complet en pièce jointe</p>
                </div>
                <div style='text-align:center;padding:16px'>
  <p style='color:#94a3b8;font-size:11px;margin:0'>Généré automatiquement par <b style='color:#c9a227'>NexTest</b> — AI-Powered Test Automation</p>
  <p style='color:#cbd5e1;font-size:10px;margin:8px 0 0;font-style:italic'>
    This email was sent automatically with <a href='https://n8n.io' style='color:#ea4b71;text-decoration:none;font-weight:600'>n8n</a>
  </p>
</div>
              </div>
            </body>
            </html>";

            $subject = ($fail === 0 ? '✅ NexTest Passed' : '❌ NexTest Failed') . " — {$generation->url} — {$date}";

            $message->to('syrinebenhassen09@gmail.com')
                    ->subject($subject)
                    ->html($html)
                    ->attachData($pdfBytes, "nextest_report_{$id}.pdf", ['mime' => 'application/pdf']);
        });

        Log::info('[MAIL] Rapport envoyé', ['generation_id' => $generation->id]);

    } catch (\Exception $e) {
        Log::warning('[MAIL] Echec envoi', ['error' => $e->getMessage()]);
    }
}
private function generatePdfBytes(Generation $generation): string
{
    $response = Http::timeout(30)->post('http://127.0.0.1:8001/generate-pdf', [
        'url'               => $generation->url,
        'framework'         => $generation->framework,
        'test_cases'        => $generation->test_cases        ?? [],
        'execution_results' => $generation->execution_results ?? [],
        'load_time_ms'      => $generation->load_time_ms,
        'scraped'           => $generation->scraped           ?? [],
        'page_type'         => $generation->page_type         ?? 'general',
    ]);
    return $response->body();
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
}