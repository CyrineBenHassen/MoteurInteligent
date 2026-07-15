<?php

namespace App\Http\Controllers;

use App\Models\TestFlag;
use Illuminate\Http\Request;

class TestFlagController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'project_id' => 'nullable|integer',
            'url'        => 'required|string',
            'test_type'  => 'required|string',
            'test_name'  => 'required|string',
            'status' => 'required|in:muted,stable,ignored',
        ]);

        $flag = TestFlag::updateOrCreate(
            [
                'project_id' => $data['project_id'] ?? null,
                'url'        => $data['url'],
                'test_type'  => $data['test_type'],
                'test_name'  => $data['test_name'],
            ],
            [
                'status'  => $data['status'],
                'user_id' => $request->user()->id ?? null,
            ]
        );

        return response()->json($flag);
    }

    public function destroy(Request $request)
    {
        $data = $request->validate([
            'project_id' => 'nullable|integer',
            'url'        => 'required|string',
            'test_type'  => 'required|string',
            'test_name'  => 'required|string',
        ]);

        TestFlag::where($data)->delete();

        return response()->json(['deleted' => true]);
    }
}