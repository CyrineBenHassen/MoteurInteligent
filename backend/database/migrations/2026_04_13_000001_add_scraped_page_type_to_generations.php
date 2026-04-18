<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('generations', function (Blueprint $table) {
            // Ajouter page_type si pas existant
            if (!Schema::hasColumn('generations', 'page_type')) {
                $table->string('page_type')->default('general')->after('is_spa');
            }
            // Ajouter scraped si pas existant
            if (!Schema::hasColumn('generations', 'scraped')) {
                $table->json('scraped')->nullable()->after('page_type');
            }
        });
    }

    public function down(): void
    {
        Schema::table('generations', function (Blueprint $table) {
            $table->dropColumn(['page_type', 'scraped']);
        });
    }
};