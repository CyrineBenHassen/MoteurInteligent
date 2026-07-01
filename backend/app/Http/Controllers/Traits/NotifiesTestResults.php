<?php
namespace App\Http\Controllers\Traits;
use App\Models\Generation;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

trait NotifiesTestResults
{
    protected function notifyN8n(
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

            Http::timeout(30)->post('http://localhost:5678/webhook/test-results', [
                'status'    => $rate >= 80 ? 'success' : 'failure',
                'url'       => $url,
                'framework' => $framework,
                'test_type' => $testType,
                'timestamp' => now()->format('d/m/Y H:i'),
                'summary'   => [
                    'passed'    => $pass,
                    'failed'    => $fail,
                    'skipped'   => $skip,
                    'pass_rate' => $rate,
                ],
                'attachments' => [
                    'pdf' => [
                        'filename' => "nextest_report_{$generation->id}.pdf",
                        'content'  => base64_encode($pdfBytes),
                        'mimetype' => 'application/pdf',
                    ],
                ],
            ]);

            Log::info('[N8N] Webhook envoyé', ['generation_id' => $generation->id]);

        } catch (\Exception $e) {
            Log::warning('[N8N] Webhook échoué', ['error' => $e->getMessage()]);
        }
    }

    protected function generatePdfBytes(Generation $generation): string
    {
        $scraped = $generation->scraped ?? [];
        if (!is_array($scraped) || array_is_list($scraped)) {
            $scraped = [];
        }

        $response = Http::timeout(30)->post('http://127.0.0.1:8001/generate-pdf', [
            'url'               => $generation->url,
            'framework'         => $generation->framework,
            'test_type'         => $generation->test_type,
            'test_cases'        => $generation->test_cases        ?? [],
            'execution_results' => $generation->execution_results ?? [],
            'load_time_ms'      => $generation->load_time_ms      ?? 0,
            'scraped'           => $scraped,
            'page_type'         => $generation->page_type         ?? 'general',
            'pass_count'        => $generation->pass_count        ?? 0,
            'fail_count'        => $generation->fail_count        ?? 0,
            'skip_count'        => $generation->skip_count        ?? 0,
            'pass_rate'         => $generation->pass_rate         ?? 0,
        ]);
        return $response->body();
    }

    protected function recordFlakyAlerts(Generation $generation, array $testCases, string $testType, string $framework): void
    {
        try {
            $controller = new \App\Http\Controllers\FlakyTestController();

            foreach ($testCases as $tc) {
                $status = $tc['status'] ?? 'skip';
                if (!in_array($status, ['pass', 'fail'])) continue;

                $fakeRequest = new \Illuminate\Http\Request();
                $fakeRequest->merge([
                    'generation_id' => $generation->id,
                    'project_id'    => $generation->project_id,
                    'url'           => $tc['url'] ?? $generation->url,
                    'test_type'     => $testType,
                    'framework'     => $framework,
                    'test_name'     => $tc['name'] ?? '',
                    'status'        => $status,
                ]);

                $controller->record($fakeRequest);
            }

            Log::info('[FLAKY] recordFlakyAlerts done', [
                'generation_id' => $generation->id,
                'count'         => count($testCases),
            ]);

        } catch (\Exception $e) {
            Log::warning('[FLAKY] recordFlakyAlerts failed', ['error' => $e->getMessage()]);
        }
    }
}