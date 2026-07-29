# Validation v0.4.1 — Content Polish

## Acceptance criteria

- Tidak ada narasi publik yang menyebut portal masih “awal”, “pilot”, “narasi final”, atau menampilkan catatan internal izin publikasi.
- Halaman Kesejahteraan hanya menampilkan Rekomendasi umum dan Rujukan layanan sosial pada bagian informasi lanjutan.
- Data kosong tidak ditampilkan sebagai placeholder teknis pada halaman publik.
- Deskripsi lama di CMS dinormalisasi tanpa menimpa teks kustom.
- Tampilan tetap responsif pada mobile, tablet, dan desktop.
- Tidak ada migrasi database.

## Pemeriksaan

```bash
npm ci
npm run lint
npm run typecheck
npm run build
```

Pemeriksaan tambahan:

```bash
grep -RIn -E "portal informasi awal|narasi final|layanan daring pilot|persyaratan awal|izin untuk dipublikasikan|lokasi rumah warga" app components/public
```

## Status validasi paket hasil

Validasi statis dan kompatibilitas telah lulus. Instalasi dependency pada lingkungan pengerjaan gagal karena registry internal mengembalikan HTTP 404 untuk `zod-validation-error-4.0.2.tgz`; kegagalan ini bukan error source. Jalankan rangkaian `npm ci`, lint, typecheck, dan build pada komputer integrasi sebelum deployment.
