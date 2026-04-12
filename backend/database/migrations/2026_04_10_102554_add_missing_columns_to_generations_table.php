<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::table('generations', function (Blueprint $table) {
        $table->json('test_cases_selenium')->nullable()->after('test_cases');
        $table->json('test_cases_cypress')->nullable()->after('test_cases_selenium');
        $table->text('script_selenium')->nullable()->after('script');
        $table->text('script_cypress')->nullable()->after('script_selenium');
        $table->integer('pass_count')->default(0)->after('is_spa');
        $table->integer('fail_count')->default(0)->after('pass_count');
        $table->integer('skip_count')->default(0)->after('fail_count');
        $table->integer('pass_rate')->default(0)->after('skip_count');
    });
}

public function down()
{
    Schema::table('generations', function (Blueprint $table) {
        $table->dropColumn([
            'test_cases_selenium',
            'test_cases_cypress',
            'script_selenium',
            'script_cypress',
            'pass_count',
            'fail_count',
            'skip_count',
            'pass_rate',
        ]);
    });
}
};
