<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureOperationalAccess
{
    public function handle(Request $request, Closure $next)
    {
        $allowedForLimitedStaff = [
            'events.index',
            'events.show',
        ];

        if ($request->user()?->isLimitedStaff() && !in_array($request->route()?->getName(), $allowedForLimitedStaff, true)) {
            abort(403);
        }

        return $next($request);
    }
}
