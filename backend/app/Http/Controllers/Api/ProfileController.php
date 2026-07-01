<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'name'             => $user->name,
            'email'            => $user->email,
            'avatar'           => $user->avatar
                                    ? asset('storage/' . $user->avatar)
                                    : null,
            'onboarding_data'  => $user->onboarding_data,
            'created_at'       => $user->created_at,
            'phone'    => $user->phone,
            'company'  => $user->company,
            'position' => $user->position,

            'generations_count' => $user->generations()->count(),
            'projects_count'    => $user->projects()->count(),
            'avg_pass_rate'     => $this->getAvgPassRate($user),
            'alerts_count'      => $this->getAlertsCount($user),
            'last_login' => $user->last_login_at 
            ? \Carbon\Carbon::parse($user->last_login_at)->timezone('Africa/Tunis')->format('M d, H:i')
            : null,
        ]);
    }

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
            'phone'    => $request->phone,    // ← AJOUTE
            'company'  => $request->company,  // ← AJOUTE
            'position' => $request->position, // ← AJOUTE
        ]);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user'    => $this->formatUser($user),
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

        return response()->json(['message' => 'Password updated successfully']);
    }

    public function updateAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $user = $request->user();

        if ($user->avatar && file_exists(storage_path('app/public/' . $user->avatar))) {
            unlink(storage_path('app/public/' . $user->avatar));
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => $path]);

        return response()->json([
            'message' => 'Avatar updated successfully',
            'avatar'  => asset('storage/' . $path),
        ]);
    }

    public function deleteAccount(Request $request)
    {
        $user = $request->user();
        $user->tokens()->delete();
        $user->delete();
        return response()->json(['message' => 'Account deleted successfully']);
    }

    // ─── Private helpers

    private function formatUser($user): array
    {
        $data = $user->fresh()->toArray();
        if (!empty($data['avatar']) && !str_starts_with($data['avatar'], 'http')) {
            $data['avatar'] = asset('storage/' . $data['avatar']);
        }
        $data['generations_count'] = $user->generations()->count();
        $data['projects_count']    = $user->projects()->count();
        return $data;
    }

   private function getAvgPassRate($user): int
{
    $totals = $user->generations()
        ->selectRaw('SUM(pass_count) as total_pass, SUM(fail_count) as total_fail')
        ->whereNotNull('pass_count')
        ->first();

    $totalPass = $totals->total_pass ?? 0;
    $totalFail = $totals->total_fail ?? 0;
    $total     = $totalPass + $totalFail;

    return $total > 0 ? (int) round(($totalPass / $total) * 100) : 0;
}

   private function getAlertsCount($user): int
{
    $projectIds = $user->projects()->pluck('id');

    return \App\Models\Alert::whereIn('project_id', $projectIds)
        ->where('read', false)
        ->count();
}
}