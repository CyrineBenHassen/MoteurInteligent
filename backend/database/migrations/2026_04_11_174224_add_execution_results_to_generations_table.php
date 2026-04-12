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
        if (!Schema::hasColumn('generations', 'execution_results')) {
            $table->json('execution_results')->nullable()->after('script_cypress');
        }
    });
}

public function down()
{
    Schema::table('generations', function (Blueprint $table) {
        $table->dropColumn('execution_results');
    });
}
};