#!/bin/sh

set -eu

cd /volume1/web/shofi-wedding

/usr/local/bin/php84 artisan db:backup >> storage/logs/database-backup.log 2>&1
