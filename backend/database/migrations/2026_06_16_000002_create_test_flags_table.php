<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('test_flags', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->nullable()->constrained('projects')->onDelete('cascade');
            $table->string('url');
            $table->string('test_type');
            $table->string('test_name');
            $table->enum('status', ['muted', 'stable']);
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->unique(['project_id', 'url', 'test_type', 'test_name'], 'uniq_test_flag');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('test_flags');
    }
};