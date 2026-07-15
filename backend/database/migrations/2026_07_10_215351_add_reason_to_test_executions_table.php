<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
{
    Schema::table('test_executions', function (Blueprint $table) {
        $table->text('reason')->nullable()->after('status');
    });
}
public function down()
{
    Schema::table('test_executions', function (Blueprint $table) {
        $table->dropColumn('reason');
    });
}
};
