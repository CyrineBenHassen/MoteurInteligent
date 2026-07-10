<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use Illuminate\Http\Request;

class AlertController extends Controller
{
    // GET /api/alerts
    public function index(Request $request)
    {
        $query = Alert::with('project:id,name')->orderByDesc('created_at');

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->query('project_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('alert_state')) {
            $query->where('alert_state', $request->query('alert_state'));
        }
        if ($request->filled('read')) {
            $query->where('read', $request->query('read') === 'true');
        }

        $alerts = $query->paginate($request->query('per_page', 20));

        return response()->json($alerts);
    }

    // GET /api/alerts/unread-count
    public function unreadCount(Request $request)
    {
        $count = Alert::where('read', false)
            ->when($request->filled('project_id'), fn($q) =>
                $q->where('project_id', $request->query('project_id'))
            )
            ->count();

        return response()->json(['count' => $count]);
    }

    // PATCH /api/alerts/{id}/read
    public function markRead($id)
    {
        $alert = Alert::findOrFail($id);
        $alert->update(['read' => true]);
        return response()->json(['ok' => true]);
    }

    // PATCH /api/alerts/read-all
    public function markAllRead(Request $request)
{
    Alert::where('read', false)
        ->where('user_id', $request->user()->id)   // ← ajouté
        ->when($request->filled('project_id'), fn($q) =>
            $q->where('project_id', $request->query('project_id'))
        )
        ->update(['read' => true]);

    return response()->json(['ok' => true]);
}

public function updateStatus($id, Request $request)
{
    $request->validate(['alert_state' => 'required|in:resolved,muted,active']);
    $alert = Alert::findOrFail($id);
    $alert->update(['alert_state' => $request->alert_state]);
    return response()->json(['ok' => true]);
}

// DELETE /api/alerts/{id}
public function destroy($id)
{
    Alert::findOrFail($id)->delete();
    return response()->json(['ok' => true]);
}
}
