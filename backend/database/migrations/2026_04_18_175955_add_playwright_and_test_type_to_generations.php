<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::table('generations', function (Blueprint $table) {
        if (!Schema::hasColumn('generations', 'script_playwright')) {
            $table->longText('script_playwright')->nullable()->after('script_cypress');
        }
        if (!Schema::hasColumn('generations', 'test_type')) {
            $table->string('test_type')->default('smoke')->after('framework');
        }
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
{
    Schema::table('generations', function (Blueprint $table) {
        $table->dropColumn(['script_playwright', 'test_type']);
    });
}
};
