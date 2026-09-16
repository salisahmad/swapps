<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureDashboardHost
{
    public function handle(Request $request, Closure $next): Response
    {
        $dashboardUrl = (string) config('app.dashboard_url');
        $dashboardHost = parse_url($dashboardUrl, PHP_URL_HOST);

        if (! $dashboardHost || strcasecmp($request->getHost(), $dashboardHost) === 0) {
            return $next($request);
        }

        $target = rtrim($dashboardUrl, '/').$request->getRequestUri();

        return redirect()->away($target);
    }
}
