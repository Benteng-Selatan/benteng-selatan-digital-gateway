# Validation Report

## Baseline MVP — 18 Juli 2026

Laporan proyek sebelumnya mencatat bahwa instalasi, lint, build, audit dependency, login CMS, API CMS, dan upload PNG berhasil pada baseline sebelum hardening.

## High-priority hardening — 22 Juli 2026

Validasi yang berhasil dijalankan pada kode hasil hardening:

- Pemeriksaan sintaks/transpile terhadap seluruh 73 file TypeScript/TSX: lulus.
- Matriks transisi status pengajuan dan kontribusi: lulus.
- Enkripsi/dekripsi AES-256-GCM dan kompatibilitas ciphertext versi `v1`: lulus.
- Hash dan verifikasi password asynchronous `scrypt`: lulus.
- Validasi dan sanitasi JPEG, PNG, dan WEBP: lulus.
- File HTML yang menyamar sebagai PNG: ditolak.
- Validator CMS menerima seed dan menolak ID duplikat, koordinat invalid, serta status invalid.
- Pemeriksaan same-origin menerima request sah dan menolak request lintas situs.
- Audit statis memastikan respons warga tidak mengirim `staffNote`, catatan audit internal, nama petugas pengubah status, atau ciphertext NIK/KK.

`npm run typecheck`, `npm run lint`, dan `npm run build` belum dapat diulang pada sesi hardening karena registry npm tidak menyediakan dependency lengkap. Ketiga perintah tersebut wajib dijalankan setelah `npm ci` berhasil pada lingkungan deployment/CI.
