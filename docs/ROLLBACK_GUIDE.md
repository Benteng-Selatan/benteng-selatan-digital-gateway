# Panduan Rollback

## Prinsip

Rollback dilakukan bila deployment baru menimbulkan error kritis, login gagal, data tidak dapat dibaca, atau fungsi layanan utama terganggu. Jangan menghapus tabel atau memulihkan backup sebelum penyebab dipastikan.

## Rollback Kode Vercel

1. Identifikasi deployment Production terakhir yang stabil.
2. Periksa log deployment bermasalah.
3. Promosikan kembali deployment stabil melalui Vercel Dashboard atau CLI.
4. Uji website publik, login admin, login warga, dashboard operasional, dan CMS.
5. Catat waktu rollback dan penyebabnya.

Contoh pemeriksaan deployment:

```bash
npx vercel ls
npx vercel inspect <URL_DEPLOYMENT>
```

Contoh promosi deployment stabil:

```bash
npx vercel promote <URL_DEPLOYMENT_STABIL> --yes
```

## Rollback Paket 0.2.0

Migrasi `0001_staff_roles_audit.sql` hanya menambahkan tabel `staff_users` dan `audit_logs`. Kode versi sebelumnya dapat dipromosikan kembali tanpa langsung menghapus kedua tabel tersebut. Membiarkan tabel baru tetap ada lebih aman daripada melakukan `DROP TABLE` saat insiden.

Setelah rollback kode:

- login versi lama kembali memakai kredensial environment;
- tabel tambahan tidak digunakan oleh kode lama;
- data audit dan akun petugas tetap disimpan untuk investigasi;
- evaluasi dilakukan sebelum deployment ulang.

## Restore Database Darurat

Restore penuh hanya dilakukan bila data benar-benar rusak dan telah disetujui penanggung jawab.

1. Hentikan perubahan data bila memungkinkan.
2. Buat backup kondisi terkini sebagai bukti.
3. Restore backup ke branch Neon sementara.
4. Verifikasi jumlah tabel, jumlah data, dan fungsi aplikasi.
5. Baru tentukan strategi pemulihan Production.

Jangan menjalankan `pg_restore --clean` langsung ke Production tanpa pengujian pada branch sementara.

## Setelah Rollback

- periksa audit log dan log Vercel;
- ubah kredensial bila insiden terkait akses;
- dokumentasikan akar masalah;
- buat perbaikan melalui branch baru;
- ulangi migration test, Preview smoke test, dan staged Production test.
