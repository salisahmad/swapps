# Shofi Wedding - NAS Deployment Handoff

Dokumen ini berisi catatan deployment Synology NAS untuk Shofi Wedding / SW Apps. Tujuannya agar task AI khusus NAS bisa lanjut tanpa membaca seluruh riwayat chat.

## Scope

- Task saat ini difokuskan untuk lanjut deploy.
- Development fitur tetap disarankan di local Mac lebih dulu.
- NAS dipakai sebagai staging/preview internal untuk pegawai sampai fitur dan data lama siap.

## Environment

- Repo: `https://github.com/salisahmad/swapps.git`
- Local development path: `/Users/elvano/Sites/shofi-wedding`
- NAS project path: `/volume1/web/shofi-wedding`
- NAS IP lokal: `192.168.100.100`
- Mac IP pernah terbaca:
  - `192.168.100.241`
  - `192.168.100.242`
- HTTP port NAS: `88`
- HTTPS port NAS: `888`
- Public URL sementara pernah dipakai: `http://158.140.191.212:88/`

## Recommended Workflow

1. Kerjakan fitur di local Mac.
2. Test di local.
3. Commit dan push ke GitHub.
4. Di NAS jalankan `git pull`.
5. Jalankan install/build/migrate seperlunya.
6. Test dari URL NAS.

Contoh command deploy di NAS:

```bash
cd /volume1/web/shofi-wedding
git pull
composer install --no-dev --optimize-autoloader
npm ci
npm run build
php artisan migrate
php artisan optimize:clear
```

Untuk sementara, gunakan `php artisan optimize:clear` setelah perubahan environment/config.

## PHP On Synology

- Project membutuhkan PHP minimal `8.4.1`.
- PHP CLI default Synology sempat terbaca `8.1.32`, sehingga `php artisan` gagal.
- Binary PHP 8.4 tersedia di:

```bash
/usr/local/bin/php84
```

- User sudah membuat alias `php` ke PHP 8.4.
- Jika alias tidak aktif pada shell baru, jalankan artisan dengan:

```bash
/usr/local/bin/php84 artisan ...
```

## Web Station / Nginx

Synology Web Station pada setup ini memakai Nginx otomatis, bukan Apache. Karena itu file `.htaccess` Laravel tidak dipakai oleh Web Station.

Problem yang pernah terjadi:

- Landing page `/` bisa terbuka.
- Route seperti `/login` atau `/index.php/login` 404.
- Setelah dicek, `.htaccess` tidak dibaca karena service berjalan di Nginx.

Service config yang ditemukan:

```text
/usr/local/etc/nginx/conf.d-available/607cb290-a01a-47bd-a159-145b35523948.w3conf
```

Symlink aktif:

```text
/usr/local/etc/nginx/conf.d/.service.b6901e96-5841-4d91-ae70-54cedde93c9e.bf6d2437-55c2-4e65-92d2-6ade76204a22.conf
```

Config service menyertakan user config:

```nginx
include /usr/local/etc/nginx/conf.d/bf6d2437-55c2-4e65-92d2-6ade76204a22/user.conf*;
```

Fix Laravel rewrite yang sudah dipasang:

```nginx
location / {
    try_files $uri $uri/ /index.php?$query_string;
}
```

File user config:

```text
/usr/local/etc/nginx/conf.d/bf6d2437-55c2-4e65-92d2-6ade76204a22/user.conf
```

Setelah perubahan Nginx, restart Nginx/Web Station dari NAS.

## Document Root

Web root harus diarahkan ke folder Laravel `public`:

```text
/volume1/web/shofi-wedding/public
```

Asset build harus ada di:

```text
/volume1/web/shofi-wedding/public/build
```

File `.htaccess` boleh tetap ada di `public`, tetapi pada setup Nginx ini bukan komponen utama routing.

## Permissions

Pernah terjadi error login:

```text
Failed opening required bootstrap/cache/config.php
Permission denied storage/logs/laravel.log
```

PHP-FPM/Web Station berjalan sebagai user `http`, sedangkan file project dimiliki user NAS `xplay`.

Fix permission yang pernah berhasil:

```bash
cd /volume1/web/shofi-wedding
chmod -R a+rwX storage bootstrap/cache
php artisan optimize:clear
chmod -R a+rwX storage bootstrap/cache
```

Catatan:

- Jangan jalankan `config:cache` dulu jika permission deploy belum rapi.
- `config:cache` bisa dipakai nanti setelah ownership/permission stabil.
- Jika tetap ingin memakai cache, pastikan `bootstrap/cache/*.php` bisa dibaca oleh user Web Station/PHP-FPM.

## Database

Konfigurasi aplikasi di `.env` NAS pernah terbaca:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=shofi_wedding
DB_USERNAME=root
DB_PASSWORD="..."
```

MariaDB listen di:

```text
0.0.0.0:3306
```

Remote DB untuk Mac/LAN sudah dibuat:

```text
Host: 192.168.100.100
Port: 3306
Database: shofi_wedding
Username: shofi_remote
Password: SWremote2026_241
Allowed host: 192.168.100.%
```

Grant dibatasi ke database `shofi_wedding` saja.

Test dari Mac pernah berhasil:

```bash
MYSQL_PWD='SWremote2026_241' mysql -h 192.168.100.100 -P 3306 -u shofi_remote -D shofi_wedding -e 'SELECT DATABASE() AS db, COUNT(*) AS user_count FROM users;'
```

## Initial Users

Database NAS sempat kosong pada tabel `users`.

User awal sudah dibuat:

Owner:

```text
Email: shofi@wedding.com
Password: password
Role: Owner
```

Manager:

```text
Email: admin@wedding.com
Password: password
Role: Manager
```

Jika perlu reset password dari NAS:

```bash
cd /volume1/web/shofi-wedding
php artisan tinker
```

```php
App\Models\User::where('email', 'shofi@wedding.com')->update(['password' => bcrypt('password')]);
```

Jika command mengembalikan `0`, berarti email tersebut tidak ada di tabel `users`.

## SSH Access Notes

User NAS:

```text
xplay@192.168.100.100
```

Temporary SSH key pernah dibuat oleh Codex:

```text
/private/tmp/shofi_synology_codex_key
```

Public key label:

```text
codex-shofi-temp
```

Jika akses Codex ke NAS sudah tidak dibutuhkan, hapus key dari NAS:

```bash
sed -i '/codex-shofi-temp/d' ~/.ssh/authorized_keys
```

## Known Deploy Pitfalls

- Jangan mengandalkan `.htaccess` di Web Station jika service memakai Nginx.
- Jika route SPA/Laravel 404 tapi landing `/` bisa, cek rewrite Nginx `try_files`.
- Jika login blank/error setelah permission berubah, cek `storage` dan `bootstrap/cache`.
- Jika `php artisan` error versi PHP, pastikan alias `php` mengarah ke PHP 8.4.
- Jika remote DB ditolak dengan `Host ... is not allowed`, cek grant MariaDB `User` dan `Host`.
- Jika `users` kosong, login default tidak akan bekerja walaupun password benar.

