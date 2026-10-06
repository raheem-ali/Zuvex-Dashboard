<?php

namespace Database\Seeders;

use App\Models\Service;
use App\Models\TeamMember;
use Illuminate\Database\Seeder;

/**
 * Optional: pre-fills the current website text so nobody retypes it.
 * Icons and photos are NOT included - upload them from the dashboard.
 * Run once:  php artisan db:seed --class=ContentSeeder
 */
class ContentSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            ['Academic & Research Consultancy', 'Professional support for research proposals, thesis writing, data analysis, publications, and academic success.'],
            ['Graphic Design & Branding', 'Build a strong brand identity with creative logos, marketing materials, social media designs, and visual branding.'],
            ['Software & Web Development', 'Custom software, responsive websites, web applications, and business solutions built for performance and growth.'],
            ['IT Consultancy & Digital Solutions', 'Expert technology consulting, digital transformation, system optimization, and strategic IT support.'],
            ['Research Community', 'Join a collaborative network of students, researchers, and professionals for learning, publications, seminars, and networking.'],
            ['Training & Professional Development', 'Enhance your skills through practical workshops, mentorship, webinars, and industry-focused training programs.'],
        ];

        foreach ($services as $i => [$title, $description]) {
            Service::firstOrCreate(['title' => $title], [
                'description' => $description,
                'sort_order'  => $i,
            ]);
        }

        $team = [
            ['Ahmed Raza', 'Founder & CEO', "Leads strategy and partnerships, driving Zuvex Hub's vision for research and innovation."],
            ['Dr. Sana Malik', 'Head of Research', 'Oversees academic consultancy, guiding researchers through proposals, analysis, and publication.'],
            ['Bilal Sheikh', 'Lead Software Engineer', 'Builds custom software, websites, and applications that power client growth and innovation.'],
            ['Hina Aslam', 'Creative Director', 'Shapes brand identities through design, ensuring every project has a strong visual voice.'],
        ];

        foreach ($team as $i => [$name, $role, $bio]) {
            TeamMember::firstOrCreate(['name' => $name], [
                'role'       => $role,
                'bio'        => $bio,
                'sort_order' => $i,
            ]);
        }
    }
}