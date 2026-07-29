# Implementation Summary — Benteng Selatan Digital Gateway

## Baseline 0.1.1

- Portal publik, CMS, portal warga, dan dashboard operasional.
- Registrasi/login warga dengan password `scrypt`.
- Cookie sesi bertanda tangan.
- Enkripsi NIK/KK AES-256-GCM.
- Pengajuan Surat Keterangan Usaha, history, pesan, dan catatan internal.
- Kontribusi UMKM, Kabar, dan lokasi peta.
- Upload gambar publik dengan pemeriksaan file signature.
- Rate limiting login dan registrasi.
- Pemisahan database Local, Preview, dan Production.

## Paket 0.2.0 Prioritas Tinggi

- Multi-user petugas berbasis tabel `staff_users`.
- RBAC: Super Admin, Operator, Editor Konten, Reviewer, dan Auditor.
- Audit log untuk autentikasi dan tindakan petugas.
- Sesi lama otomatis tidak berlaku setelah perubahan role, status, atau password.
- NIK/KK diberikan lengkap hanya kepada role yang berizin.
- Publish, republish, dan unpublish kontribusi tersinkron dengan CMS.
- Penghapusan kontribusi melalui CMS otomatis menurunkan status submission.
- Operasi multi-tabel penting menggunakan transaksi database.
- Migrasi, schema checks, SOP, acceptance test, deployment, dan rollback guide.
- Pemeriksaan bantu untuk mendeteksi placeholder data resmi.

## Validasi Paket

Pemeriksaan syntax, import lokal, JSON metadata, dan tipe internal telah lulus. Instalasi dependency serta `npm run check` penuh wajib dijalankan kembali pada komputer pengembang atau CI sebelum deployment. Detail tersedia di `VALIDATION_HIGH_PRIORITY.md`.

## Urutan Awal

```bash
npm ci
cp .env.example .env.local
npm run db:migrate-high-priority
npm run db:check-portal
npm run db:check-high-priority
npm run check
npm run dev
```

## Pembaruan v0.3.0 — Kabar dan Kesejahteraan

- Menu `Wisata & Budaya` diubah menjadi `Kabar` tanpa memutus route `/wisata`.
- Kanal artikel mendukung kategori, jenis artikel/pengumuman/agenda, tanggal, artikel utama, dan filter publik.
- Kontribusi warga `tourism` dipertahankan secara internal untuk kompatibilitas, tetapi tampil sebagai `Kabar / kegiatan`.
- `/kesejahteraan` menggunakan dashboard PBI-JK, PKH, Sembako, dan Desil 1–5.
- Data awal dashboard diisi dari Sheet 2 `Benteng Selatan.xlsx`.
- Persentase dihitung otomatis dan validasi konsistensi tersedia di CMS serta API.
- Tidak ada migrasi tabel database baru.

## Pembaruan v0.4.0 — Layanan dan BESTI

- Halaman layanan difokuskan pada 10 layanan utama yang paling relevan bagi warga.
- Persyaratan, prosedur lengkap, dan pengajuan diarahkan ke BESTI melalui URL yang dapat dikelola pada CMS.
- Tombol Portal Warga pada navigasi publik diganti menjadi akses BESTI, sementara route dan data Portal Warga lama tetap dipertahankan.
- Halaman Kontak menampilkan lima kontak perangkat kelurahan dan mendukung tombol telepon responsif.
- CMS mendapat pengaturan URL BESTI, pilihan layanan utama, dan pengelolaan kontak perangkat.
- Normalisasi data bersifat additive: konten Production yang sudah ada tidak dihapus atau diganti.
- Tidak ada migration schema database pada rilis ini.
