<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('test_executions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('generation_id')->constrained('generations')->onDelete('cascade');
            $table->foreignId('project_id')->nullable()->constrained('projects')->onDelete('cascade');
            $table->string('url');
            $table->string('test_type');
            $table->string('framework')->nullable();
            $table->string('test_name');
            $table->enum('status', ['pass', 'fail', 'skip'])->default('skip');
            $table->unsignedInteger('duration_ms')->nullable();
            $table->timestamp('executed_at');
            $table->timestamps();

            $table->index(['project_id', 'url', 'test_type', 'test_name'], 'idx_test_identity');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('test_executions');
    }
};