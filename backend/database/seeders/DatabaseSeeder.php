<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Password is hashed automatically by the User model's "hashed" cast.
        // CHANGE THESE before going live.
        User::updateOrCreate(
            ['email' => 'admin@zuvex.com'],
            [
                'name'     => 'Admin User',
                'password' => '12345',
            ]
        );
    }
}