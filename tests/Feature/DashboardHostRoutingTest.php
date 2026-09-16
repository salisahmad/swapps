<?php

namespace Tests\Feature;

use Tests\TestCase;

class DashboardHostRoutingTest extends TestCase
{
    public function test_dashboard_routes_redirect_to_the_app_subdomain(): void
    {
        config([
            'app.dashboard_url' => 'https://app.shofiwedding.com',
            'app.url' => 'https://app.shofiwedding.com',
        ]);

        $this->get('https://shofiwedding.com/sw-admin/login')
            ->assertRedirect('https://app.shofiwedding.com/sw-admin/login');
    }

    public function test_app_subdomain_root_redirects_to_login(): void
    {
        config([
            'app.dashboard_url' => 'https://app.shofiwedding.com',
            'app.url' => 'https://app.shofiwedding.com',
        ]);

        $this->get('https://app.shofiwedding.com/')
            ->assertRedirect('https://app.shofiwedding.com/sw-admin/login');
    }

    public function test_main_domain_root_remains_the_landing_page(): void
    {
        config([
            'app.dashboard_url' => 'https://app.shofiwedding.com',
            'app.url' => 'https://app.shofiwedding.com',
        ]);

        $this->get('https://shofiwedding.com/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Welcome'));
    }
}
