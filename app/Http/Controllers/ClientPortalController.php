<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Inertia\Inertia;
use Inertia\Response;

class ClientPortalController extends Controller
{
    public function show(Event $event): Response
    {
        $event->load([
            'additionalCosts',
            'dynamicForms',
            'items.type',
            'items.photos',
            'items.variants',
            'payments' => fn ($query) => $query
                ->orderBy('payment_at', 'desc')
                ->orderBy('created_at', 'desc'),
            'photos',
            'schedules' => fn ($query) => $query->orderBy('schedule_from'),
        ]);

        return Inertia::render('Public/ClientShow', [
            'event' => $event,
        ]);
    }
}
