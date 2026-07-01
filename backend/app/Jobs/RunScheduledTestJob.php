<?php

namespace App\Jobs;

use App\Models\ScheduledTask;
use App\Models\Project;
use App\Http\Controllers\ScheduledTaskController;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class RunScheduledTestJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 1000;

    public function __construct(public ScheduledTask $task) {}

    public function handle(ScheduledTaskController $controller)
    {
        Log::info('[Scheduler] Running scheduled task', ['task_id' => $this->task->id, 'name' => $this->task->name]);

        try {
            $rate = $controller->executeScheduledTask($this->task);

            $this->task->update([
                'last_run'    => now(),
                'last_status' => $rate >= 80 ? 'pass' : 'fail',
                'next_run'    => $controller->nextRunFor($this->task->cron),
            ]);
        } catch (\Exception $e) {
            Log::error('[Scheduler] Job failed', ['task_id' => $this->task->id, 'error' => $e->getMessage()]);

            $this->task->update([
                'last_run'    => now(),
                'last_status' => 'fail',
                'next_run'    => $controller->nextRunFor($this->task->cron),
            ]);
        }
    }
}