````markdown
# Smoke Test Baseline MVP

Tanggal pengujian: 26 Juli 2026  
Branch: `rebuild/mvp`  
Tag sumber: `v0.1.0-mvp`  
Status: Lulus pengujian dasar

## Hasil Build

Perintah yang dijalankan:

```bash
npm run build
````

Hasil:

* Kompilasi Next.js berhasil.
* Pemeriksaan TypeScript berhasil.
* Seluruh halaman dan API route berhasil diproses.
* Static page generation berhasil.
* Tidak ditemukan error build.

## Pengujian Website Publik

* [x] Beranda dapat dibuka.
* [x] Halaman profil dapat dibuka.
* [x] Halaman layanan dapat dibuka.
* [x] Halaman kesejahteraan dapat dibuka.
* [x] Halaman UMKM dapat dibuka.
* [x] Halaman peta dapat dibuka.
* [x] Halaman Kabar dapat dibuka.
* [x] Halaman kontak dapat dibuka.
* [x] Navigasi website berjalan normal.

## Pengujian CMS Admin

* [x] Halaman login admin dapat dibuka.
* [x] Admin dapat masuk ke CMS.
* [x] Data konten dapat ditampilkan.
* [x] Halaman pengelolaan konten dapat digunakan.
* [x] Logout admin berjalan normal.

## Pengujian Portal Warga

* [x] Halaman portal warga dapat dibuka.
* [x] Registrasi warga dapat dilakukan.
* [x] Login warga berjalan normal.
* [x] Dashboard warga dapat dibuka.
* [x] Pengajuan layanan dapat diakses.
* [x] Detail pengajuan dapat dibuka.
* [x] Logout warga berjalan normal.

## Pengujian Dashboard Operasional

* [x] Dashboard operasional dapat dibuka.
* [x] Daftar pengajuan dapat ditampilkan.
* [x] Detail pengajuan dapat dibuka.
* [x] Status pengajuan dapat diproses.
* [x] Pesan antara warga dan petugas dapat digunakan.
* [x] Riwayat perubahan status dapat ditampilkan.

## Pengujian Database

* [x] Local development menggunakan branch Neon `rebuild-mvp-development`.
* [x] Vercel Preview menggunakan branch Neon `preview/rebuild/mvp`.
* [x] Production menggunakan branch Neon `production`.
* [x] Pengujian penambahan akun hanya mengubah database development.
* [x] Database production tidak berubah selama pengujian.
* [x] Pengaman koneksi lokal ke database production telah ditambahkan.

## Kesimpulan

Versi MVP dinyatakan stabil sebagai baseline awal pembenahan. Pengembangan berikutnya dilakukan secara bertahap melalui branch terpisah agar fungsi yang telah berjalan tidak terganggu.

