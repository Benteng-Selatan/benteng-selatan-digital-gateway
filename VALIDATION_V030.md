# Validasi v0.3.0 — Kabar dan Kesejahteraan

## Pemeriksaan yang lulus

- Seluruh file TypeScript/TSX berhasil diparsing dan ditranspilasi secara sintaksis.
- Pemeriksaan TypeScript ketat terarah pada file yang diubah lulus dengan dependensi eksternal dibuat sebagai stub validasi.
- Seluruh import internal `@/…` yang digunakan source berhasil diresolusi.
- Seluruh file JSON berhasil diparsing.
- Perhitungan dashboard kesejahteraan lulus:
  - PBI-JK: 1.634 dari 2.838 = 57,58%.
  - PKH: 473 + 147 = 620 dari 2.838 = 21,85%.
  - Sembako: 632 + 217 = 849 dari 2.838 = 29,92%.
  - Desil 1–5: 461 + 486 + 633 + 608 + 650 = 2.838.
- Nilai `socialDashboard` pada `site-data.json` dan `site-data.seed.json` sama dan berstatus `published`.
- Versi `package.json` dan root `package-lock.json` konsisten pada `0.3.0`.
- Tidak ada perubahan tabel PostgreSQL atau migrasi SQL baru.

## Batasan validasi lingkungan penyusunan

`npm ci`, ESLint, typecheck penuh proyek, dan `next build` belum dapat diselesaikan di lingkungan penyusunan karena registry paket internal berulang kali mengembalikan HTTP 503 ketika mengunduh dependency. Karena itu, sebelum merge dan deployment tetap jalankan:

```bash
npm ci
npm run lint
npm run typecheck
npm run build
```

Lanjutkan pengujian pada database Development, kemudian Preview, sebelum Production.
