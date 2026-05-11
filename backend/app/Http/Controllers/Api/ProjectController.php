<?php

namespace App\Http\Controllers\Api;  // ← Api ici

use App\Http\Controllers\Controller;
use App\Models\Project;              // ← ajoute l'import du model
use Illuminate\Http\Request;

class ProjectController extends Controller
{

public function index()
{
    $projects = Project::where('user_id', auth()->id())
        ->withCount('generations')  // ← c'est tout ce qu'il manque
        ->orderBy('created_at', 'desc')
        ->get();

    return response()->json($projects);
}

public function store(Request $request)
{
    $project = Project::create([
        'user_id'     => auth()->id(),
        'name'        => $request->name,
        'type'        => $request->type,
        'description' => $request->description,
    ]);

    $project->loadCount('generations');  // ← déjà présent chez toi, bien

    return response()->json($project, 201);
}

    public function destroy($id)
    {
        $project = Project::where('id', $id)
            ->where('user_id', auth()->id())
            ->firstOrFail();
        $project->delete();
        return response()->json(['deleted' => true]);
    }
    

 public function generations($id)
{
    $project = Project::where('id', $id)
        ->where('user_id', auth()->id())
        ->firstOrFail();

    $generations = \App\Models\Generation::where('project_id', $id)
        ->orderBy('created_at', 'desc')
        ->get();

    return response()->json($generations);
}
}