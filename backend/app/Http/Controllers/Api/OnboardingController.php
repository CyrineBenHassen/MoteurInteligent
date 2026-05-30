<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class OnboardingController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'role'       => 'nullable|string|in:developer,tester,lead,other',
            'interests'  => 'nullable|array',
            'interests.*'=> 'string',
            'experience' => 'nullable|string|in:beginner,intermediate,expert',
        ]);

        $user = $request->user();
        $user->update([
            'onboarding_completed' => true,
            'onboarding_data'      => $validated,
        ]);

        return response()->json([
            'message' => 'Onboarding saved.',
            'user'    => $user,
        ]);
    }
}