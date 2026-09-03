<?php

namespace App\Http\Controllers;

use App\Models\ClientActivityLog;
use App\Models\Event;
use Inertia\Inertia;
use Inertia\Response;

class ClientHistoryController extends Controller
{
    public function index(): Response
    {
        $cancelledClients = Event::onlyTrashed()
            ->with([
                'activityLogs' => fn ($query) => $query
                    ->where('type', ClientActivityLog::TYPE_DELETED)
                    ->with('user:id,name')
                    ->latest(),
            ])
            ->latest('deleted_at')
            ->paginate(15, ['*'], 'cancelled_page')
            ->withQueryString();

        $rescheduledClients = ClientActivityLog::with([
                'event' => fn ($query) => $query
                    ->withTrashed()
                    ->select('id', 'uuid', 'name', 'date', 'time', 'mobile_phone', 'order_type', 'deleted_at'),
                'user:id,name',
            ])
            ->where('type', ClientActivityLog::TYPE_DATE_CHANGED)
            ->latest()
            ->paginate(15, ['*'], 'reschedule_page')
            ->withQueryString();

        return Inertia::render('ClientHistory/Index', [
            'cancelledClients' => $cancelledClients,
            'rescheduledClients' => $rescheduledClients,
        ]);
    }
}
