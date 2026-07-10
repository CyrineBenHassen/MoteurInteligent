<?php

namespace App\Http\Controllers;

use App\Models\ChatbotMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ChatbotController extends Controller
{
    public function ask(Request $request)
    {
        $sessionId = $request->input('session_id');
        $message   = $request->input('message');
        $lang      = $request->input('lang', 'fr');

        $history = ChatbotMessage::where('session_id', $sessionId)
            ->orderBy('created_at')
            ->get(['role', 'content'])
            ->toArray();

        ChatbotMessage::create([
            'session_id' => $sessionId,
            'user_id'    => auth()->id(),
            'role'       => 'user',
            'content'    => $message,
        ]);

        $response = Http::post(env('AI_SERVICE_URL') . '/chat', [
            'message' => $message,
            'lang'    => $lang,
            'history' => $history,
        ]);

        $reply = $response->json('reply') ?? 'Erreur, réessayez.';

        ChatbotMessage::create([
            'session_id' => $sessionId,
            'user_id'    => auth()->id(),
            'role'       => 'assistant',
            'content'    => $reply,
        ]);

        return response()->json(['reply' => $reply]);
    }
}