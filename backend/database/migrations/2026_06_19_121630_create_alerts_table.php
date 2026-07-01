<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alerts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id')->nullable();
            $table->string('url');
            $table->string('test_type');
            $table->string('test_name');
            $table->string('framework')->nullable();
            $table->string('status');
            $table->string('previous_status')->nullable();
            $table->unsignedTinyInteger('flakiness_score')->default(0);
            $table->string('message');
            $table->boolean('read')->default(false);
            $table->boolean('notified_n8n')->default(false);
            $table->timestamps();

            $table->index(['project_id', 'read']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alerts');
    }
};
