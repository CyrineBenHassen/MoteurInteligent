<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('generations', function (Blueprint $table) {
            if (!Schema::hasColumn('generations', 'script_selenium')) {
                $table->text('script_selenium')->nullable();
            }
            if (!Schema::hasColumn('generations', 'script_cypress')) {
                $table->text('script_cypress')->nullable();
            }
            if (!Schema::hasColumn('generations', 'test_cases_selenium')) {
                $table->json('test_cases_selenium')->nullable();
            }
            if (!Schema::hasColumn('generations', 'test_cases_cypress')) {
                $table->json('test_cases_cypress')->nullable();
            }
            if (!Schema::hasColumn('generations', 'pass_count')) {
                $table->integer('pass_count')->default(0);
            }
            if (!Schema::hasColumn('generations', 'fail_count')) {
                $table->integer('fail_count')->default(0);
            }
            if (!Schema::hasColumn('generations', 'skip_count')) {
                $table->integer('skip_count')->default(0);
            }
            if (!Schema::hasColumn('generations', 'pass_rate')) {
                $table->integer('pass_rate')->default(0);
            }
        });
    }

    public function down(): void {
        Schema::table('generations', function (Blueprint $table) {
            $table->dropColumn([
                'script_selenium', 'script_cypress',
                'test_cases_selenium', 'test_cases_cypress',
                'pass_count', 'fail_count', 'skip_count', 'pass_rate'
            ]);
        });
    }
};