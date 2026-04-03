<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('generations', function (Blueprint $table) {
            $table->text('script_selenium')->nullable();
            $table->text('script_cypress')->nullable();
            $table->json('test_cases_selenium')->nullable();
            $table->json('test_cases_cypress')->nullable();
            $table->integer('pass_count')->default(0);
            $table->integer('fail_count')->default(0);
            $table->integer('skip_count')->default(0);
            $table->integer('pass_rate')->default(0);
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