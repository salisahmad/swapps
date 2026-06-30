<?php

namespace App\Observers;

use App\Models\Payment;
use App\Services\TelegramNotification;

class PaymentObserver
{
    public function created(Payment $payment): void
    {
        $telegram = new TelegramNotification();
        $telegram->notifyNewPayment($payment);
    }
}
