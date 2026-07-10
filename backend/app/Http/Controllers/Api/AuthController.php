<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    # Register
    public function register(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed', // confirmed = password_confirmation doit exister
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
        ]);

        # Créer un token Sanctum
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message'      => 'Compte créé avec succès',
            'user'         => $user,
            'access_token' => $token,
            'token_type'   => 'Bearer',
        ], 201);
    }

    # Login
    

    public function login(Request $request)
{
    $request->validate([
        'email'    => 'required|email',
        'password' => 'required',
    ]);

    $user = User::where('email', $request->email)->first();

    if (!$user || !Hash::check($request->password, $user->password)) {
        throw ValidationException::withMessages([
            'email' => ['Identifiants incorrects.'],
        ]);
    }

    
    if (!$user->is_active) {
        $user->update(['is_active' => true]);
    }

    $user->tokens()->delete();
    $token = $user->createToken('auth_token')->plainTextToken;

    // update D'ABORD
    $user->update([
        'last_login_ip' => $request->ip(),
        'last_login_at' => now(),
    ]);

    // toArray()
    $userData = $user->toArray();
    if (!empty($userData['avatar']) && !str_starts_with($userData['avatar'], 'http')) {
        $userData['avatar'] = asset('storage/' . $userData['avatar']);
    }

    return response()->json([
        'message'      => 'Connexion réussie',
        'user'         => $userData,
        'access_token' => $token,
        'token_type'   => 'Bearer',
    ]);
}
    # Logout
    public function logout(Request $request)
    {
        // Supprime le token actuel
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Déconnexion réussie',
        ]);
    }

    # PROFIL (route protégée)
public function me(Request $request)
{
    $user = $request->user();
    $data = $user->toArray();
    
    
    if (!empty($data['avatar']) && !str_starts_with($data['avatar'], 'http')) {
        $data['avatar'] = asset('storage/' . $data['avatar']);
    }

    $data['session_count'] = $user->tokens()->count(); 
    
    return response()->json($data);
}
}