# Codex Handoff - Shofi Wedding

Dokumen ini adalah titik masuk singkat jika project dibuka dari komputer atau task Codex lain.

## Repository

- GitHub: `https://github.com/salisahmad/swapps.git`
- Branch aktif: `main`
- Commit terakhir saat dokumen ini dibuat: `0c15f1b`
- Stack: Laravel + Inertia React + TypeScript + Tailwind CSS

## Baca Dulu

1. `docs/AI_CONTEXT.md` untuk fitur, aturan bisnis, dan keputusan aplikasi.
2. `docs/NAS_DEPLOYMENT.md` untuk deployment Synology, Nginx, PHP, database, dan troubleshooting.
3. `.env.example` untuk daftar konfigurasi tanpa kredensial.

## Alur Kerja Yang Dipakai

Kerjakan dan test di local Mac, lalu commit dan push ke GitHub. Setelah itu deploy build dan backend ke NAS. Jangan mengedit database production/NAS tanpa konfirmasi target dan backup.

Validasi minimum:

```bash
npm run build
php artisan route:list
php artisan migrate --pretend
git diff --check
```

Untuk fitur frontend, build `public/build` harus ikut diterapkan ke environment yang dijalankan.

## Fitur Terbaru

Fitur Hari Libur Manten sudah selesai:

- URL internal: `/holidays`
- Owner dapat tambah, edit, dan hapus.
- Semua pegawai dapat melihat.
- Tanggal input memakai date-range picker.
- Keterangan memakai textarea.
- Client tidak dapat booking pada periode libur.
- Fitting/Konsultasi tetap dapat dibuat.
- Tampil merah pada kalender internal dan tersinkron ke Google Calendar.

## Melanjutkan Dari Windows

GitHub menyimpan source code, migration, dan dokumen konteks; GitHub tidak menyimpan percakapan Codex secara otomatis.

Jika memakai akun Codex/OpenAI yang sama, buka daftar task/history dan pilih task Shofi Wedding ini. Riwayat chat akan ikut tersedia di aplikasi Codex.

Jika membuat task baru, clone repository lalu minta Codex membaca dokumen ini:

```bash
git clone https://github.com/salisahmad/swapps.git
cd swapps
git checkout main
```

Prompt pembuka yang disarankan:

> Ini project Shofi Wedding. Baca `docs/CODEX_HANDOFF.md`, `docs/AI_CONTEXT.md`, dan `docs/NAS_DEPLOYMENT.md` sebelum mengubah kode. Lanjutkan dari commit terbaru di branch `main`, pertahankan aturan bisnis yang sudah terdokumentasi, dan jangan menghapus perubahan user.

Untuk melanjutkan task yang sama, pastikan login memakai akun yang sama dan buka task dari history, bukan membuat task baru.

## Catatan Keamanan

Jangan menaruh password, private key, token Telegram, token Google, atau isi `.env` ke commit baru. Gunakan environment variable lokal/NAS dan simpan rahasia di password manager.
