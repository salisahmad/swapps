# Shofi Wedding App - AI Context

Dokumen ini berisi rangkuman fitur, aturan bisnis, keputusan desain, dan catatan teknis aplikasi Shofi Wedding / SW Apps. Tujuannya agar AI/developer berikutnya bisa cepat memahami konteks project tanpa membaca seluruh riwayat chat.

## Project

- Nama aplikasi: Shofi Wedding / SW Apps
- Repo: `https://github.com/salisahmad/swapps.git`
- Local path utama: `/Users/elvano/Sites/shofi-wedding`
- Branch utama: `main`
- Stack: Laravel, Inertia React TypeScript, Tailwind CSS
- Validasi umum:
  - `npm run build`
  - `php artisan test`
  - `php artisan migrate`
- Server lokal/jaringan:
  - `php artisan serve --host=0.0.0.0 --port=8000`
  - Lokal: `http://127.0.0.1:8000`

## Role Dan Akses

Role diarahkan menjadi:

- Owner: akses admin penuh.
- Manager: akses staff lama, bisa lihat/manajemen operasional tertentu.
- Staff Galeri.
- Staff Lokasi.

Owner punya akses penuh ke data finansial, kepegawaian, payroll, pinjaman, setting, dan konfigurasi. Staff tetap bisa akses data clients, tetapi beberapa bagian sensitif disembunyikan: ringkasan harga, tab bayar, dan kartu grand total/dibayar/sisa/biaya.

## Dashboard

- `Closing Hari Ini`: berdasarkan tanggal input client hari ini.
- `Closing Kemarin`: berdasarkan tanggal input client kemarin.
- `Client Hari Ini` dan `Client Tahun Depan` dihapus.
- `Jadwal Fitting Selanjutnya`: 5 jadwal fitting/konsultasi berikutnya.
- List fitting menampilkan nama, tanggal acara, tanggal fitting, dan jam tanpa label yang terlalu panjang.
- `Client Belum Lunas`: client dengan tanggal acara `<= hari ini + 2`, label cukup `Client Belum Lunas`.
- Perhitungan client MUA dan Sewa Gaun dipisah.
- Closing diberi tanda MUA/Sewa Gaun dengan warna jelas.
- Dark mode sudah diterapkan dan beberapa warna yang tabrakan sudah diperbaiki.

## Clients

UI diarahkan memakai istilah `Clients`, bukan `Events`.

- Setelah tambah/edit client, tetap berada pada detail client, tidak kembali ke tab awal.
- Jenis client:
  - MUA: tema pink/rose.
  - Sewa Gaun: tema purple/biru muda.
- Filter client: MUA, Sewa Gaun, atau semua.
- Tambah client baru:
  - Kalender mulai besok dan seterusnya.
  - Required: nama, nomor telepon, tanggal, total harga.
  - Ada DP default `1.000.000`, editable.
  - DP punya metode pembayaran.
- URL detail client memakai `uuid`, bukan id.
- Table client: kolom aksi dihapus, klik row masuk detail.
- Add/edit client:
  - Saat pilih tanggal, tampil info client lain di tanggal itu dan jamnya.
  - Ada diskon.
  - Ada biaya tambahan multiple: Transport, Foto/Video, Melati, MC, Hairdo, Hena, Dekor, Tambahan/Other.
  - Grand total = `Total Harga + Total Biaya Tambahan - Diskon`.
- Client bisa upload beberapa foto dan foto bisa dihapus.
- Pemilihan item katalog di client:
  - Ada pencarian kode/nama/deskripsi.
  - Area dibuat scroll agar form tidak panjang.
  - Bisa buka thumbnail.
  - Client MUA bisa pilih semua item katalog yang tersedia.
  - Client Sewa Gaun hanya bisa pilih item yang `disewakan` dan tersedia.

## Pembayaran

- Upload bukti bayar pernah error karena `ImageManager::read()`. Gunakan Intervention Image v3 style:
  - `Image::decodePath($file->getRealPath())`
  - `scaleDown(width: ...)`
  - `encodeUsingFileExtension('jpg', quality: ...)`
- Halaman konfirmasi bayar:
  - Menampilkan metode pembayaran berupa text.
  - Kolom `jenis` dihapus.
- Staff:
  - Hanya tampilkan pembayaran pending secara default.
  - Pemasukan, pengeluaran, profit hidden.
  - Tetap punya opsi filter seperti owner.
- Default filter pembayaran: pending dan ditolak.
- Filter status berupa checkbox multi-select.
- Urutan kolom tabel pembayaran:
  - Tanggal pembayaran, nama, tanggal acara, nominal, metode, status, bukti, aksi.
- Sorting:
  - Belum dikonfirmasi di atas.
  - Tanggal pembayaran terbaru dulu.
- Tambah transaksi:
  - Pencarian client hanya client belum lunas.
  - Sorting nama client.
  - Format tanggal contoh: `2026 Juli 04`.
- Input number memakai format ribuan titik.
- List pembayaran di detail client punya tombol edit.

## Jadwal Fitting Dan Konsultasi

- Bisa tambah jadwal untuk client booking.
- Bisa tambah jadwal untuk calon client belum booking, cukup nama dan nomor telepon.
- Status sumber client: MUA, Sewa Gaun, atau calon client belum booking.
- Calon client diberi warna pembeda.
- Tambah jadwal:
  - Pilih client memakai pencarian.
  - Kondisi client: tanggal acara > hari ini.
  - Jam selesai otomatis = jam mulai + 1 jam.
  - Saat pilih tanggal/jam, sistem cek jadwal bentrok.
- Table jadwal:
  - Jenis ditulis text: Fitting atau Konsultasi.
  - Diurutkan dari tanggal paling dekat.
  - Kolom aksi dihapus.
  - Klik row membuka edit.
  - Tombol delete berada di modal edit.
  - Link nama client dibiarkan sebagai shortcut ke client.
- Dashboard dan halaman jadwal membedakan fitting/konsultasi dengan icon dan warna.

## Katalog

- Level item berupa dropdown:
  - Premium
  - Standart
  - Spesial
- Kategori belum final, tapi sudah ada tambahan seperti Kebaya dan Basofi.
- Field:
  - Harga sewa
  - Harga sewa paket
  - Status disewakan/tidak disewakan
- Struktur stok:
  - Satu kode item bisa punya beberapa ukuran.
  - Satu ukuran punya stok.
  - Implementasi dengan `item_variants`.
- Foto katalog:
  - Awalnya satu foto `image_path`.
  - Sekarang multi foto dengan tabel/model `item_photos`.
  - `image_path` lama tetap fallback.
  - Bisa upload beberapa foto dan hapus per foto.
- Table katalog:
  - Kolom aksi hanya icon edit border besar.
  - Tombol hapus dipindah ke popup edit.
  - Klik row membuka popup detail.
  - Detail seperti kartu produk: foto utama besar, thumbnail, badge status, panel harga, chip ukuran/stok.
- Status di tabel:
  - Baris atas: Disewakan/Tidak disewakan dengan border dan background.
  - Baris bawah: Tersedia/Sold dengan border dan background.
  - Klik status tidak ikut membuka detail row.

## Dynamic Form / Berita Acara

- Dynamic form berita acara disetup sekali dan bisa dipakai semua client.
- Setup ditempatkan di setting/setup umum.
- Staff diberi akses setup dynamic form.
- Tombol setup dynamic form dipindah ke dropdown nama akun.
- Konsep penting: gunakan snapshot/versioning agar client lama tidak rusak saat form terbaru berubah.
- Ada fitur ambil berita acara/dynamic form terbaru.
- Saat mengambil form terbaru, data field lama dicoba disesuaikan ke form terbaru.
- Halaman isi berita acara:
  - Ada tombol kembali.
  - Penyimpanan diperbaiki.
  - Ringkasan hasil berita acara tampil di detail client, di atas ringkasan harga.
  - Hasil berita acara tampil sebagai text rapi, bukan form input.

## Notifikasi Dan Audit

- Notifikasi diarahkan seperti Facebook:
  - Icon notifikasi khusus notifikasi.
  - Badge nomor.
- Request hapus client masuk ke notifikasi.
- Notifikasi lain:
  - Admin mengubah total harga client.
  - Staff mendapat notifikasi kalau payment ditolak.
- Telegram setting sudah ada di halaman Telegram akun.
- Audit/log client diarahkan mencatat:
  - Tanggal input.
  - Perubahan total harga.
  - Perubahan tanggal.
  - Perubahan data bayar.
  - Dihapus.
- Staff hapus client butuh konfirmasi admin.

## WhatsApp

- Kirim WA otomatis memungkinkan.
- Fonnte dibahas rawan banned.
- Jalur resmi yang lebih aman: Meta WhatsApp Cloud API.
- Setting WhatsApp ada halaman tersendiri:
  - Provider
  - API URL
  - Token
  - Sender number
  - Test phone
  - Test message

## Google Calendar

Integrasi Google Calendar dibuat dengan halaman setting dan `GoogleCalendarService`.

Public URL sementara untuk link client pernah diset:

- `http://158.140.191.212:88/`

Aturan event:

- MUA:
  - Nama event = nama client.
  - Tanggal acara.
  - Jam sesuai data sampai jam + 2.
  - Location dari link lokasi.
  - Warna cherry blossom.
  - Deskripsi: link client, alamat, deskripsi paket.
- Sewa Gaun:
  - Sama seperti MUA, warna cobalt.
- Fitting/Konsultasi:
  - Prefix singkat: `[F]` atau `[K]`.
  - Kalau calon client tambahkan `[TW]`.
  - Tanggal fitting/konsul.
  - Jam mulai sampai selesai.
  - Warna fitting mango, konsultasi avocado.

Event Google Calendar berubah jika nama/data di sistem berubah.

## Kepegawaian

Rule:

- Cuti/libur tiap bulan dapat jatah 4 hari.
- Sisa cuti bisa disimpan bulan depan.
- Bisa ambil jatah bulan depan kalau kurang.
- Unpaid leave:
  - Tidak mengurangi jatah cuti.
  - Mengurangi gaji.
  - Rumus: gaji pokok / 30 x jumlah unpaid leave.
- Owner:
  - Akses penuh data kepegawaian.
  - Tidak perlu klaim bonus event, payroll, maupun cuti.
- Manager:
  - Bisa lihat manajemen cuti.
  - Tidak bisa mengajukan cuti pegawai lain.
- Pegawai:
  - Bisa lihat profil sendiri.
  - Bisa pengajuan cuti.
  - Bisa klaim bonus event.
  - Estimasi gaji tidak ditampilkan di masing-masing pegawai.
- Halaman pegawai:
  - Ada default bonus per event.
  - Kolom aksi dihapus.
  - Klik row edit.
  - Tombol hapus di popup edit.
- Cuti pegawai:
  - Owner bisa lihat/edit seperti tabel CRUD.
  - Ada sisa cuti dan unpaid bulan ini.
  - Manager hanya lihat.
  - Jatah bulan lalu yang belum diambil diakumulasi bulan ini.

## Bonus Event Dan Payroll

- Pegawai klaim event yang diikuti.
- List event tiap bulan tampil sebagai checklist.
- Tiap event:
  - Checkbox.
  - Keterangan pekerjaan di samping kanan.
  - Nominal bonus di samping kanan.
- Nominal default dari default bonus pegawai per event.
- Pegawai bisa input nominal bonus sendiri.
- Owner tidak perlu approve.
- Owner bisa menghapus/ubah nilai klaim.
- Tiap event hanya bisa diklaim sekali per pegawai.
- UX klaim:
  - Klaim tetap di list, tidak pindah ke list baru.
  - Perubahan diberi background kuning.
  - Untuk hapus klaim, untick list.
- Payroll:
  - Klik row pegawai membuka detail klaim bonus event.
  - Bagian atas ada input bonus owner dan catatan.
  - Ada detail gaji.
  - Bonus owner bisa edit/hapus.

## Pinjaman Pegawai / Vendor

- Pinjaman bisa untuk pegawai dan vendor rekanan.
- Pinjaman tidak dikaitkan dengan payroll.
- Pembayaran cicilan berlaku untuk total pinjaman peminjam, bukan per pinjaman.
- List pinjaman:
  - Tabel utama menampilkan nama peminjam dan total.
  - Klik row membuka popup detail pinjaman dan cicilan.
- Pengajuan pinjaman dan bayar cicilan memakai modal.
- Pembayaran cicilan:
  - List nama hanya yang masih punya pinjaman aktif.
  - Saat dipilih, tampil info sisa pinjaman.
  - Input cicilan dibatasi maksimal sisa pinjaman.
- Jika pinjaman lunas:
  - Nama hilang dari list aktif.
  - Toggle `Aktif / Semua` untuk melihat riwayat.
  - Mode semua menampilkan riwayat termasuk lunas.
  - Badge `Aktif` / `Lunas`.
- Kolom sisa menjadi `Sisa Aktif`.

## Dark Mode

- Dark mode sudah dicoba dan dipoles di banyak komponen.
- Komponen input/button/modal/nav disesuaikan.
- Warna dashboard yang tabrakan sudah diperbaiki sebagian.
- Masih mungkin ada halaman yang perlu polish lanjutan.

## Landing Page Client Side

Landing page public di `/` sudah dibuat.

Fitur:

- Hero public Shofi Wedding.
- Logo brand.
- Visual dari foto katalog jika ada.
- CTA:
  - Konsultasi via WhatsApp.
  - Lihat Katalog.
- Section layanan:
  - Makeup Wedding.
  - Sewa Gaun.
  - Fitting & Konsultasi.
- Katalog pilihan:
  - Otomatis ambil item yang `disewakan` dan belum `sold`.
- Alur booking.
- Footer:
  - Katalog.
  - WhatsApp.
  - Login.

Backend route `/` mengirim:

- `featuredItems`
- `whatsappNumber`

Ada fallback `Schema::hasTable()` agar test tidak gagal saat tabel belum ada.

## Logo / Branding

Logo Shofi Wedding diterapkan:

- Horizontal
- Vertical
- Mark/favicon

Lokasi:

- `public/brand`
- `resources/js/Components/ApplicationLogo.tsx`

Logo sudah dioptimasi agar ringan.

## Git Commit Penting

- `77a5666 Finalize client, catalog, schedule, and branding updates`
- `d1f70eb Add staff management and catalog gallery updates`
- `e8dac1c Add public client landing page`

## Catatan Lanjutan

Prioritas yang mungkin dilanjutkan:

- Poles landing page dengan foto asli profesional.
- Tambah form inquiry calon client di landing page.
- Tambah halaman katalog public detail.
- Integrasi WhatsApp Cloud API resmi.
- Finalisasi Google Calendar sync error handling.
- Audit seluruh dark mode.
- Rapikan mobile view untuk semua tabel besar.
- Tambah test khusus katalog, pinjaman, payroll, dynamic form, dan landing page.
