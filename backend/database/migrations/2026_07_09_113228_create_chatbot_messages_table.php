<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
{
    Schema::create('chatbot_messages', function (Blueprint $table) {
        $table->id();
        $table->string('session_id')->index();
        $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
        $table->enum('role', ['user', 'assistant']);
        $table->text('content');
        $table->timestamps();
    });
}

    
    public function down(): void
    {
        Schema::dropIfExists('chatbot_messages');
    }
};
