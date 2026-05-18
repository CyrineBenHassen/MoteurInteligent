<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
public function update(Request $request)
{
    $user = $request->user();

    $request->validate([
        'name'  => 'required|string|max:255',
        'email' => 'required|email|unique:users,email,' . $user->id,
    ]);

    $user->update([
        'name'  => $request->name,
        'email' => $request->email,
    ]);

    if ($user->avatar) {
        $user->avatar = asset('storage/' . $user->avatar);
    }

    return response()->json([
        'message' => 'Profile updated successfully',
        'user'    => array_merge($user->toArray(), [
            'generations_count' => $user->generations()->count(),
            'projects_count'    => $user->projects()->count(),
        ])
    ]);
}

    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password'     => 'required|min:8|confirmed',
        ]);

        $user = auth()->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password is incorrect']
            ]);
        }

        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        return response()->json([
            'message' => 'Password updated successfully'
        ]);
    }


 public function updateAvatar(Request $request)
{
    $request->validate([
        'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
    ]);

    $user = $request->user();

    // Supprimer l'ancienne photo
    if ($user->avatar && file_exists(storage_path('app/public/' . $user->avatar))) {
        unlink(storage_path('app/public/' . $user->avatar));
    }

    $path = $request->file('avatar')->store('avatars', 'public');
    $user->update(['avatar' => $path]);

    return response()->json([
        'message' => 'Avatar updated successfully',
        'avatar'  => asset('storage/' . $path) // 👈 URL complète
    ]);
}

public function deleteAccount(Request $request)
{
    $user = $request->user();
    $user->tokens()->delete();
    $user->delete();
    return response()->json(['message' => 'Account deleted successfully']);
}

public function show(Request $request)
{
    $user = $request->user();
    $userData = $user->toArray();
    if ($user->avatar && !str_starts_with($user->avatar, 'http')) {
        $userData['avatar'] = asset('storage/' . $user->avatar);
    }
    $userData['generations_count'] = $user->generations()->count();
    $userData['projects_count']    = $user->projects()->count();

    return response()->json($userData);
}
}