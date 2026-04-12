<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
 public function up()
{
    Schema::table('generations', function (Blueprint $table) {
        // Ajouter seulement si la colonne n'existe pas déjà
        if (!Schema::hasColumn('generations', 'test_cases_selenium')) {
            $table->json('test_cases_selenium')->nullable()->after('test_cases');
        }
        if (!Schema::hasColumn('generations', 'test_cases_cypress')) {
            $table->json('test_cases_cypress')->nullable()->after('test_cases_selenium');
        }
        if (!Schema::hasColumn('generations', 'script_selenium')) {
            $table->text('script_selenium')->nullable()->after('script');
        }
        if (!Schema::hasColumn('generations', 'script_cypress')) {
            $table->text('script_cypress')->nullable()->after('script_selenium');
        }
        if (!Schema::hasColumn('generations', 'pass_count')) {
            $table->integer('pass_count')->default(0)->after('is_spa');
        }
        if (!Schema::hasColumn('generations', 'fail_count')) {
            $table->integer('fail_count')->default(0)->after('pass_count');
        }
        if (!Schema::hasColumn('generations', 'skip_count')) {
            $table->integer('skip_count')->default(0)->after('fail_count');
        }
        if (!Schema::hasColumn('generations', 'pass_rate')) {
            $table->integer('pass_rate')->default(0)->after('skip_count');
        }
    });
}

    public function down(): void {
        Schema::dropIfExists('generations');
    }
};