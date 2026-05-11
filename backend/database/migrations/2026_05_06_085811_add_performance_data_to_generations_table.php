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
        if (!Schema::hasColumn('generations', 'performance_data')) {
            $table->json('performance_data')->nullable()->after('scraped');
        }
    });
}

    /**
     * Reverse the migrations.
     */
    public function down()
{
    Schema::table('generations', function (Blueprint $table) {
        $table->dropColumn('performance_data');
    });
}
};
