<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;

class BackupDatabase extends Command
{
    protected $signature = 'db:backup
        {--path= : Folder tujuan backup}
        {--keep= : Maksimal jumlah file backup yang disimpan}
        {--dump-binary= : Path mysqldump/mariadb-dump}';

    protected $description = 'Backup database aplikasi ke file .sql.gz dan hapus backup lama.';

    public function handle(): int
    {
        $connection = config('database.default');
        $config = config("database.connections.{$connection}");

        if (($config['driver'] ?? null) !== 'mysql') {
            $this->error('Backup otomatis saat ini hanya mendukung koneksi mysql/mariadb.');

            return self::FAILURE;
        }

        $database = (string) ($config['database'] ?? '');
        $username = (string) ($config['username'] ?? '');
        $password = (string) ($config['password'] ?? '');

        if ($database === '' || $username === '') {
            $this->error('Konfigurasi database belum lengkap.');

            return self::FAILURE;
        }

        $binary = $this->dumpBinary();

        if (!$binary) {
            $this->error('mysqldump/mariadb-dump tidak ditemukan. Isi BACKUP_DATABASE_DUMP_BINARY di .env.');

            return self::FAILURE;
        }

        $targetDir = $this->targetDirectory();
        File::ensureDirectoryExists($targetDir, 0755, true);

        $filename = Str::slug($database).'_'.now()->format('Ymd_His').'.sql.gz';
        $targetPath = rtrim($targetDir, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.$filename;

        $process = new Process($this->dumpCommand($binary, $config, $database, $username));
        $process->setTimeout((int) env('BACKUP_DATABASE_TIMEOUT', 900));

        $handle = gzopen($targetPath, 'wb9');

        if (!$handle) {
            $this->error("Tidak bisa menulis file backup: {$targetPath}");

            return self::FAILURE;
        }

        $process->run(function (string $type, string $buffer) use ($handle): void {
            if ($type === Process::OUT) {
                gzwrite($handle, $buffer);

                return;
            }

            if (trim($buffer) !== '') {
                $this->line(trim($buffer));
            }
        }, $password !== '' ? ['MYSQL_PWD' => $password] : []);

        gzclose($handle);

        if (!$process->isSuccessful()) {
            File::delete($targetPath);
            $this->error('Backup database gagal.');

            return self::FAILURE;
        }

        $deleted = $this->pruneOldBackups($targetDir, $this->keepCount());

        $this->info("Backup berhasil: {$targetPath}");
        $this->line("Backup lama dihapus: {$deleted}");

        return self::SUCCESS;
    }

    private function targetDirectory(): string
    {
        return (string) ($this->option('path')
            ?: env('BACKUP_DATABASE_PATH')
            ?: storage_path('app/database-backups'));
    }

    private function keepCount(): int
    {
        return max(1, (int) ($this->option('keep') ?: env('BACKUP_DATABASE_KEEP', 30)));
    }

    private function dumpBinary(): ?string
    {
        $configured = $this->option('dump-binary') ?: env('BACKUP_DATABASE_DUMP_BINARY');

        if ($configured && is_executable((string) $configured)) {
            return (string) $configured;
        }

        foreach ([
            '/volume1/@appstore/MariaDB10/usr/local/mariadb10.11/bin/mariadb-dump',
            '/usr/local/mariadb10/bin/mariadb-dump',
            '/usr/local/mariadb10/bin/mysqldump',
            '/usr/bin/mariadb-dump',
            '/usr/bin/mysqldump',
        ] as $candidate) {
            if (is_executable($candidate)) {
                return $candidate;
            }
        }

        foreach (['mariadb-dump', 'mysqldump'] as $candidate) {
            $process = Process::fromShellCommandline('command -v '.escapeshellarg($candidate));
            $process->run();

            if ($process->isSuccessful()) {
                return trim($process->getOutput());
            }
        }

        return null;
    }

    private function dumpCommand(string $binary, array $config, string $database, string $username): array
    {
        $command = [
            $binary,
            '--single-transaction',
            '--quick',
            '--skip-lock-tables',
            '--default-character-set=utf8mb4',
            '--user='.$username,
        ];

        if (!empty($config['unix_socket'])) {
            $command[] = '--socket='.$config['unix_socket'];
        } else {
            $command[] = '--host='.($config['host'] ?? '127.0.0.1');
            $command[] = '--port='.($config['port'] ?? 3306);
        }

        $command[] = $database;

        return $command;
    }

    private function pruneOldBackups(string $targetDir, int $keep): int
    {
        $files = collect(File::glob(rtrim($targetDir, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.'*.sql.gz'))
            ->sortByDesc(fn (string $file) => File::lastModified($file))
            ->values();

        return $files
            ->slice($keep)
            ->filter(fn (string $file) => File::delete($file))
            ->count();
    }
}
