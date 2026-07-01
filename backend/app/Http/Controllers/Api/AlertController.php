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
        $query = Alert::query()->orderByDesc('created_at');

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->query('project_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('read')) {
            $query->where('read', $request->query('read') === 'true');
        }

        $alerts = $query->paginate(20);

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
            ->when($request->filled('project_id'), fn($q) =>
                $q->where('project_id', $request->query('project_id'))
            )
            ->update(['read' => true]);

        return response()->json(['ok' => true]);
    }

    // PATCH /api/alerts/{id}/status
public function updateStatus($id, Request $request)
{
    $request->validate(['status' => 'required|in:resolved,muted,active']);
    $alert = Alert::findOrFail($id);
    $alert->update(['status' => $request->status]);
    return response()->json(['ok' => true]);
}

// DELETE /api/alerts/{id}
public function destroy($id)
{
    Alert::findOrFail($id)->delete();
    return response()->json(['ok' => true]);
}
}
