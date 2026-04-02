<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Generation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class GenerationController extends Controller
{
    public function generate(Request $request)
    {
         set_time_limit(120);
        $request->validate([
            'url'       => 'required|url',
            'framework' => 'in:Selenium,Cypress,Both',
        ]);

        $url       = $request->url;
        $framework = $request->framework ?? 'Selenium';

        try {
            $response = Http::timeout(120)->post('http://127.0.0.1:8001/generate', [
                'url'       => $url,
                'framework' => $framework,
            ]);

            if ($response->failed()) {
                return response()->json(['error' => 'AI service error'], 500);
            }

            $data = $response->json();

            $generation = Generation::create([
                'user_id'      => auth()->id(),
                'url'          => $url,
                'framework'    => $framework,
                'status'       => 'completed',
                'test_cases'   => $data['result']['test_cases'] ?? [],
                'script'       => $data['result']['script'] ?? '',
                'load_time_ms' => $data['scraped']['load_time_ms'] ?? 0,
                'is_spa'       => $data['scraped']['is_spa'] ?? false,
            ]);

            return response()->json([
                'message'    => 'Tests generated successfully',
                'generation' => $generation,
                'result'     => $data['result'],
                'scraped'    => $data['scraped'],
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function index()
    {
        $generations = Generation::where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($generations);
    }

    public function show($id)
    {
        $generation = Generation::where('user_id', auth()->id())
            ->findOrFail($id);

        return response()->json($generation);
    }

    public function destroy($id)
    {
        $generation = Generation::where('user_id', auth()->id())
            ->findOrFail($id);

        $generation->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }

    public function analyze(Request $request)
    {
        $request->validate([
            'error'     => 'required|string',
            'script'    => 'required|string',
            'framework' => 'in:Selenium,Cypress',
        ]);

        try {
            $response = Http::timeout(60)->post('http://127.0.0.1:8001/analyze', [
                'error'     => $request->error,
                'script'    => $request->script,
                'framework' => $request->framework ?? 'Selenium',
            ]);

            return response()->json($response->json());

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}