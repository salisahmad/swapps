<?php

namespace App\Http\Middleware;

use App\Models\ClientActivityLog;
use App\Models\NotificationRead;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'notifications' => fn () => $this->notifications($request),
        ];
    }

    private function notifications(Request $request): array
    {
        $user = $request->user();

        if (!$user || !$user->isAdmin()) {
            if ($user?->isStaff()) {
                $items = Payment::with('event:id,uuid,name,date')
                    ->where('created_by', $user->id)
                    ->where('status', Payment::STATUS_REJECTED)
                    ->latest('updated_at')
                    ->take(10)
                    ->get()
                    ->filter(fn (Payment $payment) => $payment->event !== null)
                    ->map(function (Payment $payment) {
                        $key = 'payment-rejected-' . $payment->id;

                        return [
                            'id' => 'payment-' . $payment->id,
                            'key' => $key,
                            'type' => 'payment_rejected',
                            'label' => 'Payment Ditolak',
                            'message' => 'Pembayaran ditolak admin.',
                            'created_at' => $payment->updated_at?->format('Y-m-d H:i'),
                            'event' => [
                                'id' => $payment->event->id,
                                'uuid' => $payment->event->uuid,
                                'name' => $payment->event->name,
                                'date' => $payment->event->date?->format('Y-m-d'),
                            ],
                            'user' => null,
                        ];
                    })
                    ->values()
                    ->all();

                $items = $this->withReadState($user->id, $items);

                return [
                    'items' => $items,
                    'count' => collect($items)->where('read', false)->count(),
                ];
            }

            return [
                'items' => [],
                'count' => 0,
            ];
        }

        $items = ClientActivityLog::with(['event:id,uuid,name,date', 'user:id,name'])
            ->whereIn('type', [
                ClientActivityLog::TYPE_DELETE_REQUESTED,
                ClientActivityLog::TYPE_TOTAL_CHANGED,
            ])
            ->latest()
            ->take(15)
            ->get()
            ->filter(fn (ClientActivityLog $log) => $log->event !== null)
            ->map(function (ClientActivityLog $log) {
                $key = 'client-log-' . $log->id;

                return [
                    'id' => $log->id,
                    'key' => $key,
                    'type' => $log->type,
                    'label' => match ($log->type) {
                        ClientActivityLog::TYPE_DELETE_REQUESTED => 'Request Hapus',
                        ClientActivityLog::TYPE_TOTAL_CHANGED => 'Total Harga',
                        default => 'Notifikasi',
                    },
                    'message' => $log->message,
                    'created_at' => $log->created_at?->format('Y-m-d H:i'),
                    'event' => [
                        'id' => $log->event->id,
                        'uuid' => $log->event->uuid,
                        'name' => $log->event->name,
                        'date' => $log->event->date?->format('Y-m-d'),
                    ],
                    'user' => $log->user ? [
                        'id' => $log->user->id,
                        'name' => $log->user->name,
                    ] : null,
                ];
            })
            ->values()
            ->all();

        $items = $this->withReadState($user->id, $items);

        return [
            'items' => $items,
            'count' => collect($items)->where('read', false)->count(),
        ];
    }

    private function withReadState(int $userId, array $items): array
    {
        $readKeys = NotificationRead::where('user_id', $userId)
            ->whereIn('notification_key', collect($items)->pluck('key')->all())
            ->pluck('notification_key')
            ->flip();

        return collect($items)
            ->map(fn (array $item) => [
                ...$item,
                'read' => $readKeys->has($item['key']),
            ])
            ->values()
            ->all();
    }
}
