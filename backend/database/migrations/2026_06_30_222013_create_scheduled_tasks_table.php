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
    Schema::create('scheduled_tasks', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        $table->foreignId('project_id')->constrained()->onDelete('cascade');
        $table->string('name');
        $table->text('description')->nullable();
        $table->string('test_type');
        $table->string('schedule_type'); // hourly, daily, weekly, monthly, custom
        $table->string('cron');
        $table->boolean('notify_email')->default(false);
        $table->enum('status', ['active', 'paused'])->default('active');
        $table->timestamp('next_run')->nullable();
        $table->timestamp('last_run')->nullable();
        $table->string('last_status')->nullable(); // pass, fail
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down()
{
    Schema::dropIfExists('scheduled_tasks');
}
};
