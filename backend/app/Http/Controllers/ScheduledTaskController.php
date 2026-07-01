<?php

namespace App\Http\Controllers;

use App\Models\ScheduledTask;
use App\Models\Generation;
use App\Models\Project;
use App\Http\Controllers\Traits\NotifiesTestResults;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Cron\CronExpression;

class ScheduledTaskController extends Controller
{
    use NotifiesTestResults;

    public function index(Request $request)
    {
        return ScheduledTask::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'          => 'required|string|max:70',
            'description'   => 'nullable|string|max:200',
            'project_id'    => 'required|exists:projects,id',
            'url'           => 'required|url',
            'test_type'     => 'required|string',
            'schedule_type' => 'required|string',
            'cron'          => 'required|string',
            'notify_email'  => 'boolean',
            'status'        => 'required|in:active,paused',
            'username'      => 'nullable|string',
            'password'      => 'nullable|string',
        ]);

        $data['user_id'] = $request->user()->id;
        $data['next_run'] = $data['status'] === 'active'
            ? $this->computeNextRun($data['cron'])
            : null;

        $task = ScheduledTask::create($data);

        return response()->json($task, 201);
    }

    public function update(Request $request, ScheduledTask $scheduledTask)
    {
        $this->authorizeOwner($request, $scheduledTask);

        $data = $request->validate([
            'name'          => 'required|string|max:70',
            'description'   => 'nullable|string|max:200',
            'project_id'    => 'required|exists:projects,id',
            'url'           => 'required|url',
            'test_type'     => 'required|string',
            'schedule_type' => 'required|string',
            'cron'          => 'required|string',
            'notify_email'  => 'boolean',
            'status'        => 'required|in:active,paused',
            'username'      => 'nullable|string',
            'password'      => 'nullable|string',
        ]);

        $data['next_run'] = $data['status'] === 'active'
            ? $this->computeNextRun($data['cron'])
            : null;

        $scheduledTask->update($data);

        return response()->json($scheduledTask);
    }

    public function destroy(Request $request, ScheduledTask $scheduledTask)
    {
        $this->authorizeOwner($request, $scheduledTask);
        $scheduledTask->delete();
        return response()->json(['deleted' => true]);
    }

    public function updateStatus(Request $request, ScheduledTask $scheduledTask)
    {
        $this->authorizeOwner($request, $scheduledTask);

        $next = $scheduledTask->status === 'active' ? 'paused' : 'active';
        $scheduledTask->status = $next;
        $scheduledTask->next_run = $next === 'active'
            ? $this->computeNextRun($scheduledTask->cron)
            : null;
        $scheduledTask->save();

        return response()->json($scheduledTask);
    }

    public function runNow(Request $request, ScheduledTask $scheduledTask)
    {
        $this->authorizeOwner($request, $scheduledTask);

        if (!$scheduledTask->url) {
            return response()->json(['error' => 'This task has no URL configured'], 422);
        }

        $project = $scheduledTask->project ?? Project::find($scheduledTask->project_id);

        try {
            $rate = $this->executePipelineForTask($scheduledTask, $project);

            $scheduledTask->update([
                'last_run'    => now(),
                'last_status' => $rate >= 80 ? 'pass' : 'fail',
                'next_run'    => $this->computeNextRun($scheduledTask->cron),  

            ]);

            return response()->json($scheduledTask);

        } catch (\Exception $e) {
            Log::error('[ScheduledTask] runNow() exception', [
                'task_id' => $scheduledTask->id,
                'error'   => $e->getMessage(),
            ]);

            $scheduledTask->update([
                'last_run'    => now(),
                'last_status' => 'fail',
            ]);

            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

public function executeScheduledTask(ScheduledTask $task): int
    {
        $project = $task->project ?? Project::find($task->project_id);
        return $this->executePipelineForTask($task, $project);
    }

    public function nextRunFor(string $cron): string
    {
        return $this->computeNextRun($cron);
    }


    public function executePipelineForTask(ScheduledTask $task, ?Project $project): int
    {
        $isInternal = $project && $project->type === 'internal';
        $url        = $task->url;
        $testType   = $task->test_type;

        $endpoint = match($testType) {
            'functional' => '/generate-functional',
            'regression' => '/generate-regression',
            'performance'=> '/generate-performance',
            'api'        => '/generate-api',
            'security'   => '/generate-security',
            'seo'        => '/generate-seo',
            default      => $isInternal ? '/generate-internal' : '/generate',
        };

        $timeout = match($testType) {
            'performance' => 900,
            'functional', 'regression' => 300,
            'security', 'api' => 180,
            default => 120,
        };

        $framework = match($testType) {
            'api'         => 'Pytest',
            'performance' => 'k6',
            'security', 'seo' => 'Requests + BeautifulSoup',
            default       => 'Selenium',
        };

        $payload = ['url' => $url, 'project_id' => $task->project_id];
        if ($framework) $payload['framework'] = $framework;

        if ($isInternal || $endpoint === '/generate-internal' || $testType === 'functional') {
            $payload['username'] = $task->username;
            $payload['password'] = $task->password;
        }

        $response = Http::timeout($timeout)->post("http://127.0.0.1:8001{$endpoint}", $payload);

        if ($response->failed()) {
            throw new \Exception('AI service error: ' . $response->body());
        }

        $data      = $response->json();
        $result    = $data['result'] ?? $data ?? [];
        $testCases = $result['execution_results'] ?? $result['test_cases'] ?? [];

        // SEO/security-style responses nest counts under 'summary'
        $summary   = $result['summary'] ?? null;

        $pass      = $result['pass_count'] ?? $summary['passed'] ?? 0;
        $fail      = $result['fail_count'] ?? $summary['failed'] ?? 0;
        $skip      = $result['skip_count'] ?? $summary['skipped'] ?? 0;
        $rate      = (int) round($result['pass_rate']  ?? $summary['pass_rate'] ?? 0);


        // Fallback: compute from test_cases if still 0 but cases exist
        if ($rate === 0 && $pass === 0 && $fail === 0 && !empty($testCases)) {
            $pass = collect($testCases)->where('status', 'pass')->count();
            $fail = collect($testCases)->where('status', 'fail')->count();
            $skip = collect($testCases)->where('status', 'skip')->count();
            $total = count($testCases);
            $rate = $total > 0 ? (int) round(($pass / $total) * 100) : 0;
        }

        if (!empty($testCases) && $pass === 0 && $fail === 0
            && in_array($testType, ['smoke', 'functional', 'regression'])) {
            $runResponse = Http::timeout(300)->post('http://127.0.0.1:8001/run', [
                'script'     => $result['script'] ?? '',
                'framework'  => $framework ?? 'Selenium',
                'test_cases' => $testCases,
                'test_type'  => $testType,
            ]);
            if ($runResponse->successful()) {
                $runData   = $runResponse->json();
                $pass      = $runData['pass_count'] ?? 0;
                $fail      = $runData['fail_count'] ?? 0;
                $skip      = $runData['skip_count'] ?? 0;
                $rate      = $runData['pass_rate']  ?? 0;
                $testCases = $runData['results']    ?? $testCases;
            }
        }

        $generation = Generation::create([
            'user_id'           => $task->user_id,
            'project_id'        => $task->project_id,
            'url'               => $url,
            'framework'         => $framework ?? ($testType === 'seo' || $testType === 'security' ? 'Requests + BeautifulSoup' : 'N/A'),
            'test_type'         => $testType,
            'status'            => 'completed',
            'test_cases'        => $testCases,
            'execution_results' => $testCases,
            'pass_count'        => $pass,
            'fail_count'        => $fail,
            'skip_count'        => $skip,
            'pass_rate'         => $rate,
            'page_type'         => $testType,
            'scraped'           => $data['scraped'] ?? [],
            'result'            => $result,
        ]);

        $this->notifyN8n($generation, $pass, $fail, $skip, $rate, $url, $framework ?? '', $testType);
        $this->recordFlakyAlerts($generation, $testCases, $testType, $framework ?? '');

        return $rate;
    }

    private function authorizeOwner(Request $request, ScheduledTask $task)
    {
        if ($task->user_id !== $request->user()->id) {
            abort(403);
        }
    }

    private function computeNextRun(string $cron): string
    {
        try {
            return (new CronExpression($cron))->getNextRunDate()->format('Y-m-d H:i:s');
        } catch (\Exception $e) {
            return now()->addHour()->format('Y-m-d H:i:s');
        }
    }
}