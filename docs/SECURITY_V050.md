# Perbaikan Keamanan v0.5.0

## Kunci enkripsi data warga

`CITIZEN_DATA_ENCRYPTION_KEY` sekarang wajib terpisah dari session secret. Ciphertext baru memakai prefix `v2`. Ciphertext lama masih dapat dibaca melalui `CITIZEN_DATA_LEGACY_ENCRYPTION_KEY`.

Pada rilis pertama, jangan mengganti kunci secara mendadak. Jika versi lama memakai nilai `CMS_SESSION_SECRET` sebagai fallback, salin nilai lama itu secara lokal ke `CITIZEN_DATA_LEGACY_ENCRYPTION_KEY`, buat kunci baru untuk `CITIZEN_DATA_ENCRYPTION_KEY`, lalu uji pembacaan data pada Development. Jangan menampilkan nilai kunci di terminal bersama atau chat.

## Upload warga

Unggahan warga masuk ke Blob store private, dibaca melalui endpoint terautentikasi, dan baru disalin ke Blob store publik setelah petugas menerbitkan kontribusi. Parser memeriksa struktur, dimensi, ukuran, dan menghapus blok metadata umum JPG/PNG/WEBP.

Batas yang diterapkan:

- maksimal 4 MB;
- maksimal 7.000 piksel per sisi;
- maksimal 24 megapiksel;
- JPG, PNG, atau WEBP;
- rate limit dan `Idempotency-Key`.

## Privasi role

Reviewer dan Auditor tidak menerima identitas, email, telepon, alamat, NIK/KK, pesan, atau catatan warga pada API pengajuan. Auditor juga tidak menerima payload kontribusi. Pemeriksaan dilakukan di server, bukan hanya disembunyikan di UI.

## CMS

CMS memiliki revision number. Simpan dengan revision lama menghasilkan HTTP 409 sehingga perubahan petugas lain tidak tertimpa. URL eksternal divalidasi menggunakan HTTPS dan allowlist hostname.

## Database

Runtime memeriksa kesesuaian `APP_ENV`/`VERCEL_ENV`, `DATABASE_TARGET_ENV`, dan `DATABASE_ALLOWED_HOSTS`. Koneksi lokal ke target Production diblokir.

## Quota dan housekeeping

Setiap warga dibatasi maksimal 10 unggahan `pending` yang belum digunakan. `npm run uploads:cleanup-pending` berjalan sebagai dry-run secara default dan hanya menghapus kandidat setelah environment, hostname, Blob store, retention, serta confirmation phrase diperiksa. Jangan menjalankan mode hapus pada Production tanpa backup dan pemeriksaan target.

Ketika petugas menekan publish, sistem membuat salinan publik lalu menyelesaikan transaksi CMS. Jika transaksi normal gagal atau revision berkonflik, sistem mencoba menghapus salinan publik dan mengembalikan status unggahan ke `linked`.
