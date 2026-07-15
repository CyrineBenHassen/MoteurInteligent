<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE test_flags DROP CONSTRAINT test_flags_status_check');
        DB::statement("ALTER TABLE test_flags ADD CONSTRAINT test_flags_status_check CHECK (status IN ('muted', 'stable', 'ignored'))");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE test_flags DROP CONSTRAINT test_flags_status_check');
        DB::statement("ALTER TABLE test_flags ADD CONSTRAINT test_flags_status_check CHECK (status IN ('muted', 'stable'))");
    }
};
