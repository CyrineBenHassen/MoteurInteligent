<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('alerts', function (Blueprint $table) {
            $table->string('alert_state')->default('active')->after('status');
        });

        // Best-effort recovery: si 'status' contient déjà resolved/muted/active
        // (bug précédent), on migre la valeur vers alert_state et on remet
        // status à 'critical' par défaut faute de pouvoir retrouver l'original.
        DB::table('alerts')
            ->whereIn('status', ['resolved', 'muted', 'active'])
            ->get()
            ->each(function ($alert) {
                DB::table('alerts')->where('id', $alert->id)->update([
                    'alert_state' => $alert->status,
                    'status'      => 'critical', // fallback, valeur perdue
                ]);
            });
    }

    public function down(): void
    {
        Schema::table('alerts', function (Blueprint $table) {
            $table->dropColumn('alert_state');
        });
    }
};