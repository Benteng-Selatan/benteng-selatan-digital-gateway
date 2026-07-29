# Validasi v0.4.0 — Layanan BESTI

## Hasil pemeriksaan source

- Versi `package.json` dan root `package-lock.json`: `0.4.0`.
- Seluruh 89 file TypeScript/TSX berhasil diparsing tanpa syntax error.
- Modul normalisasi data berhasil dikompilasi secara terpisah.
- Compatibility test normalisasi: **lulus**.
- Seed memuat tepat 10 layanan utama, 5 kontak perangkat, dan URL BESTI.
- ID layanan unik; tidak bertabrakan dengan ID layanan v0.3.0.
- Data simulasi lama berikut tetap dipertahankan setelah normalisasi:
  - identitas website;
  - profil;
  - kontak lama;
  - dashboard Kesejahteraan;
  - Kabar;
  - UMKM;
  - layanan lama.
- URL BESTI dengan protokol tidak aman ditolak dan dikembalikan ke URL default HTTPS.
- Tidak ada migration database baru.
- Tidak ditemukan perintah reset, truncate, atau penghapusan dokumen CMS pada perubahan v0.4.0.
- Secret scan tidak menemukan kredensial asli; hanya `.env.example` dengan placeholder.

## Validasi dependency

`npm ci` telah dicoba pada lingkungan penyusunan, tetapi registry package internal mengembalikan HTTP `503 Service Temporarily Unavailable` ketika mengambil dependency. Karena itu, lint, typecheck penuh, dan build belum boleh dinyatakan lulus dari lingkungan ini.

Jalankan pada komputer lokal saat integrasi:

```bash
npm ci
npm run lint
npm run typecheck
npm run build
npm run content:check-v040
```

## Smoke test utama

1. Beranda: panel Pusat Layanan tampil dan seluruh tombol benar.
2. `/layanan`: tepat 10 layanan utama, pencarian, dan tombol BESTI.
3. `/kontak`: kontak umum dan perangkat kelurahan responsif.
4. `/admin`: URL BESTI, layanan utama, dan kontak dapat diedit.
5. `/warga`: route lama tetap dapat dibuka.
6. `/kesejahteraan`, `/wisata`, `/umkm`, `/peta`: tetap normal.
7. Simpan CMS tidak menghapus Kabar, Kesejahteraan, UMKM, peta, atau data lama.
