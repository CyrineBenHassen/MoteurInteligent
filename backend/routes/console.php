<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Jobs\RunScheduledTestJob;
use App\Models\ScheduledTask;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::call(function () {
    ScheduledTask::where('status', 'active')
        ->whereNotNull('next_run')
        ->where('next_run', '<=', now())
        ->each(function (ScheduledTask $task) {
            RunScheduledTestJob::dispatch($task);
        });
})->name('run-scheduled-tasks')->everyMinute()->withoutOverlapping();