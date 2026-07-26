# Deployment Paket Prioritas Tinggi

## Perubahan Schema

Paket ini menambahkan:

- `staff_users` untuk akun dan role petugas;
- `audit_logs` untuk jejak aktivitas;
- tetap membutuhkan `login_rate_limits` dari hardening sebelumnya.

## Urutan Aman

1. Pastikan local, Preview, dan Production memakai database Neon yang berbeda.
2. Buat backup database target.
3. Terapkan migrasi pada development terlebih dahulu:

```bash
npm run db:migrate-high-priority
npm run db:check-portal
npm run db:check-high-priority
```

4. Jalankan `npm run check` dan `npm run content:check-official`.
5. Deploy ke Preview dan lakukan smoke test.
6. Buat backup Production terbaru.
7. Terapkan migrasi ke Production secara terkontrol. Script membutuhkan `ALLOW_PRODUCTION_MIGRATION=YES` bila endpoint Production lama terdeteksi.
8. Buat staged Production deployment, uji, lalu promote.

## Login Pertama

Setelah migrasi, login menggunakan `CMS_USERNAME` dan `CMS_PASSWORD` yang sudah ada. Bila `staff_users` masih kosong, sistem membuat akun Super Admin pertama secara otomatis.

Setelah login:

1. buka `/admin/petugas`;
2. ubah nama lengkap akun bootstrap bila diperlukan;
3. buat akun per petugas;
4. gunakan kata sandi berbeda untuk setiap orang;
5. nonaktifkan akun yang sudah tidak bertugas.

## Smoke Test

- Super Admin dapat membuka CMS, operasional, petugas, dan audit.
- Operator hanya dapat membuka operasional pengajuan.
- Editor Konten dapat membuka CMS dan moderasi kontribusi.
- Reviewer dapat melihat pengajuan serta memoderasi kontribusi tanpa mengubah status pengajuan.
- Auditor hanya melihat data yang diizinkan; NIK/KK dimasking.
- Perubahan dari `published` ke status lain menghapus item dari website publik.
- Penghapusan item kontribusi melalui CMS mengubah submission menjadi `approved`.
- Semua tindakan penting muncul di audit log.


## Rollback

Panduan rollback kode dan pemulihan darurat tersedia di `docs/ROLLBACK_GUIDE.md`. Untuk migrasi paket 0.2.0, tabel baru tidak perlu langsung dihapus ketika kode di-rollback.


## Catatan Migration Baseline

Folder `drizzle` saat ini menggunakan custom migration. Jangan menjalankan `drizzle-kit generate` biasa karena snapshot custom tidak menjadi baseline penuh seluruh schema dan dapat menghasilkan pembuatan ulang tabel yang sudah ada. Buat perubahan schema berikutnya sebagai custom migration yang kecil, idempotent, diuji pada branch Neon sementara, dan ditinjau sebelum Production.


Contoh eksekusi terkontrol ke target eksplisit:

```bash
MIGRATION_DATABASE_URL="<DIRECT_CONNECTION_STRING>" \
ALLOW_PRODUCTION_MIGRATION=YES \
npm run db:migrate-high-priority
```

Jangan menyimpan connection string tersebut di shell history atau repository pada lingkungan operasional.
