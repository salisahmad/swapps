<?php

namespace App\Console\Commands;

use App\Services\TelegramNotification;
use Illuminate\Console\Command;

class SendTelegramDailySummary extends Command
{
    protected $signature = 'telegram:daily-summary';

    protected $description = 'Send the daily owner summary to Telegram.';

    public function handle(TelegramNotification $telegram): int
    {
        if (! $telegram->isConfigured()) {
            $this->warn('Telegram is not configured.');

            return self::SUCCESS;
        }

        if (! $telegram->notifyDailySummary()) {
            $this->warn('Daily summary was skipped or failed.');

            return self::FAILURE;
        }

        $this->info('Daily summary sent.');

        return self::SUCCESS;
    }
}
