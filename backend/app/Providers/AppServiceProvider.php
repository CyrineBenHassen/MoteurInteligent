<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\Generation;
use App\Observers\GenerationObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Generation::observe(GenerationObserver::class);
    }
}
