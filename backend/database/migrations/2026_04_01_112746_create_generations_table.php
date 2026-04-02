<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('generations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('url');
            $table->string('framework')->default('Selenium');
            $table->string('status')->default('completed');
            $table->json('test_cases')->nullable();
            $table->text('script')->nullable();
            $table->integer('load_time_ms')->nullable();
            $table->boolean('is_spa')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('generations');
    }
};