# High-Priority Hardening — 22 Juli 2026

Dokumen ini mencatat perbaikan prioritas tinggi yang diterapkan setelah audit MVP.

## Perbaikan yang diterapkan

1. Form operasional petugas diubah menjadi controlled state agar nilai pengajuan sebelumnya tidak terbawa ke pengajuan lain.
2. Daftar pengajuan petugas hanya mengirim data ringkas. NIK dan nomor KK baru didekripsi saat detail dibuka; ciphertext tidak dikirim ke frontend.
3. Catatan untuk warga dipisahkan dari catatan internal petugas. Portal warga hanya menerima `publicNote`, status publik, dan pesan non-internal.
4. Pembuatan pengajuan beserta riwayat, perubahan status beserta riwayat, dan pengiriman pesan beserta pembaruan timestamp menggunakan operasi SQL atomik.
5. Workflow pengajuan dan kontribusi memiliki matriks transisi. Revisi dan penolakan wajib disertai catatan publik.
6. Publikasi kontribusi kini melakukan upsert berdasarkan ID stabil dan menghapus item dari CMS ketika status keluar dari `published`.
7. Sinkronisasi publikasi dan status kontribusi dijalankan dalam satu transaksi Neon dengan optimistic locking dan retry konflik serializable.
8. Penyimpanan CMS memakai optimistic concurrency. Data lama menghasilkan HTTP 409, bukan menimpa perubahan terbaru.
9. Validasi CMS memeriksa tipe field, status, koordinat, tanggal versi, ID unik, dan slug unik.
10. Rate limiting berbasis PostgreSQL ditambahkan untuk login, registrasi, upload, pesan, pengajuan layanan, dan kontribusi.
11. Upload memvalidasi magic bytes, tipe sebenarnya, ukuran, dimensi, dan membuang metadata JPEG/PNG/WEBP sebelum dikirim ke Blob.
12. Secret sesi warga dan secret enkripsi tidak lagi menggunakan fallback secret CMS pada production.
13. Ciphertext baru memiliki prefix versi `v1`; ciphertext format lama tetap dapat dibaca.
14. `scrypt` password dijalankan secara asynchronous agar tidak memblokir event loop.
15. Header keamanan dasar ditambahkan melalui `next.config.ts`.
16. Seluruh endpoint mutasi memeriksa `Origin`/`Sec-Fetch-Site` dan menolak permintaan browser lintas situs dengan HTTP 403.

## Langkah database wajib

Schema baru menambahkan kolom `public_note` pada pengajuan dan riwayat, serta tabel `rate_limit_buckets`. Jalankan salah satu:

```bash
npm run db:push
```

atau jalankan SQL berikut pada database target:

```text
./drizzle/0001_high_priority_hardening.sql
```

Setelah itu verifikasi:

```bash
npm run db:check-portal
```

## Environment production wajib

Gunakan nilai berbeda dan minimal 32 karakter untuk:

- `CMS_SESSION_SECRET`
- `CITIZEN_SESSION_SECRET`
- `CITIZEN_DATA_ENCRYPTION_KEY`

Jangan mengganti `CITIZEN_DATA_ENCRYPTION_KEY` pada database yang sudah berisi data tanpa prosedur migrasi/re-enkripsi.

## Validasi yang telah dilakukan

- Pemeriksaan sintaks seluruh file TypeScript/TSX: lulus.
- Uji helper upload terhadap JPEG, PNG, WEBP: lulus.
- Uji file palsu HTML dengan MIME PNG: ditolak.
- Uji runtime matriks status, AES-GCM, password `scrypt`, dan pemeriksaan same-origin: lulus.
- Pemeriksaan data seed untuk ID dan slug duplikat: lulus.
- Pemeriksaan respons warga: catatan internal, nama petugas pengubah status, dan ciphertext tidak dikirim.

Pemeriksaan `npm run typecheck`, `npm run lint`, dan `npm run build` masih harus dijalankan pada lingkungan dengan dependensi lengkap dan akses registry npm yang stabil.
