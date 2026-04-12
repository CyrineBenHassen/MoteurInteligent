<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Generation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class GenerationController extends Controller
{
    public function generate(Request $request)
    {
        set_time_limit(300);

        $request->validate([
            'url'       => 'required|url',
            'framework' => 'in:Selenium,Cypress,Both',
        ]);

        $url       = $request->url;
        $framework = $request->framework ?? 'Selenium';

        try {
            // ── Étape 1 : Générer les tests avec le LLM ──────────────────────
            $response = Http::timeout(120)->post('http://127.0.0.1:8001/generate', [
                'url'       => $url,
                'framework' => $framework,
            ]);

            if ($response->failed()) {
                return response()->json(['error' => 'AI service error'], 500);
            }

            $data   = $response->json();
            $result = $data['result'] ?? [];

            $testCases         = $result['test_cases']             ?? [];
            $testCasesSelenium = $result['test_cases_selenium']    ?? [];
            $testCasesCypress  = $result['test_cases_cypress']     ?? [];
            $script            = $result['script']                 ?? '';
            $scriptSelenium    = $result['script_selenium']        ?? '';
            $scriptCypress     = $result['script_cypress']         ?? '';

            // ── Étape 2 : Exécuter le script Selenium ────────────────────────
            $pass             = 0;
            $fail             = 0;
            $skip             = 0;
            $rate             = 0;
            $executionResults = [];

            // Choisir le bon script à exécuter
            $scriptToRun = '';
            if ($framework === 'Both') {
                $scriptToRun = $scriptSelenium;
            } elseif ($framework === 'Selenium') {
                $scriptToRun = $script;
            }

            if (!empty($scriptToRun)) {
                // Appeler /run pour exécuter vraiment le script
               $runResponse = Http::timeout(150)->post('http://127.0.0.1:8001/run', [
                'script'     => $scriptToRun,
                'framework'  => 'Selenium',
                'test_cases' => $framework === 'Both' ? $testCasesSelenium : $testCases, // ✅
                ]);

                if ($runResponse->successful()) {
                    $runData          = $runResponse->json();
                    $pass             = $runData['pass_count'] ?? 0;
                    $fail             = $runData['fail_count'] ?? 0;
                    $skip             = $runData['skip_count'] ?? 0;
                    $rate             = $runData['pass_rate']  ?? 0;
                    $executionResults = $runData['results']    ?? [];
                } else {
                    // /run a échoué → fallback sur les types
                    [$pass, $fail, $skip, $rate] = $this->statsFromTypes(
                        $framework === 'Both' ? $testCasesSelenium : $testCases
                    );
                }
            } else {
                // Cypress only → pas d'exécution serveur, stats depuis les types
                [$pass, $fail, $skip, $rate] = $this->statsFromTypes(
                    $framework === 'Both' ? $testCasesCypress : $testCases
                );
            }

            // ── Étape 3 : Sauvegarder en base ───────────────────────────────
            $generation = Generation::create([
                'user_id'             => auth()->id(),
                'url'                 => $url,
                'framework'           => $framework,
                'status'              => 'completed',
                'test_cases'          => $testCases,
                'test_cases_selenium' => $testCasesSelenium,
                'test_cases_cypress'  => $testCasesCypress,
                'script'              => $script,
                'script_selenium'     => $scriptSelenium,
                'script_cypress'      => $scriptCypress,
                'execution_results'   => $executionResults,
                'load_time_ms'        => $data['scraped']['load_time_ms'] ?? 0,
                'is_spa'              => $data['scraped']['is_spa']       ?? false,
                'pass_count'          => $pass,
                'fail_count'          => $fail,
                'skip_count'          => $skip,
                'pass_rate'           => $rate,
            ]);

            return response()->json([
                'message'    => 'Tests generated successfully',
                'generation' => $generation,
                'result'     => array_merge($result, [
                    'execution_results' => $executionResults,
                ]),
                'scraped'    => $data['scraped'],
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Calcule pass/fail/skip depuis les types des test cases.
     * Utilisé comme fallback quand /run échoue ou pour Cypress.
     */
    private function statsFromTypes(array $testCases): array
    {
        $pass = 0; $fail = 0; $skip = 0;
        foreach ($testCases as $tc) {
            $type = $tc['type'] ?? '';
            if ($type === 'positive') {
                $pass++;
            } elseif ($type === 'negative') {
                $fail++;
            } else {
                $skip++;
            }
        }
        $total = $pass + $fail + $skip;
        $rate  = $total > 0 ? round(($pass / $total) * 100) : 0;
        return [$pass, $fail, $skip, $rate];
    }

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