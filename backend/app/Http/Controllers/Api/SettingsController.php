<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserSetting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index()
    {
        $settings = UserSetting::firstOrCreate(
            ['user_id' => auth()->id()],
            [
                'email_notifications' => true,
                'weekly_report'       => false,
                'default_framework'   => 'Selenium'
            ]
        );
        return response()->json($settings);
    }

    public function update(Request $request)
    {
        $request->validate([
            'email_notifications' => 'boolean',
            'weekly_report'       => 'boolean',
            'default_framework'   => 'in:Selenium,Cypress,Both',
            'theme'               => 'in:light,dark,system',  
            'language'            => 'in:en,fr,ar',            
        ]);

        $settings = UserSetting::updateOrCreate(
            ['user_id' => auth()->id()],
            $request->only([
                'email_notifications',
                'weekly_report',
                'default_framework'
            ])
        );

        return response()->json([
            'message'  => 'Settings saved',
            'settings' => $settings
        ]);
    }
}