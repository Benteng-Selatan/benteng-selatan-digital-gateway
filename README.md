# Benteng Selatan Digital Gateway

Portal publik dan layanan warga Kelurahan Benteng Selatan berbasis **Next.js 16**, **PostgreSQL Neon**, **Drizzle ORM**, **Vercel Blob**, dan **Leaflet**.

## Modul utama

### Portal publik

- Beranda, profil, 10 layanan utama, dashboard kesejahteraan, UMKM, peta, Kabar, dan kontak.
- CMS dengan status `draft` dan `published`.
- Upload media publik melalui Vercel Blob.
- Peta multi-marker berbasis Leaflet.


### Pusat layanan dan BESTI

- Website berfungsi sebagai pintu informasi layanan Kelurahan Benteng Selatan.
- Sepuluh layanan utama ditampilkan sebagai daftar ringkas dan responsif.
- Persyaratan, prosedur lengkap, serta pengajuan diarahkan ke `https://besti.is-best.net`.
- URL BESTI dan kontak perangkat kelurahan dapat diperbarui melalui CMS.
- Portal warga lama tidak dihapus agar data dan riwayat yang sudah tersimpan tetap aman.

### Portal warga MVP

- Pendaftaran dan login warga menggunakan email serta kata sandi yang di-hash dengan `scrypt`.
- Dashboard warga dan riwayat transaksi.
- Pengajuan pilot **Surat Keterangan Usaha**.
- Status pengajuan, riwayat status, pesan warga–petugas, dan catatan internal petugas.
- NIK dan nomor KK disimpan dalam bentuk terenkripsi AES-256-GCM.
- Kontribusi warga untuk UMKM, Kabar/kegiatan, dan lokasi peta.
- Moderasi petugas; kontribusi berstatus `published` otomatis masuk ke CMS publik.

### Portal petugas

- CMS konten: `/admin`
- Operasional layanan warga: `/admin/operasional`
- Manajemen akun petugas: `/admin/petugas`
- Audit aktivitas: `/admin/audit`
- Multi-user admin dengan role Super Admin, Operator, Editor Konten, Reviewer, dan Auditor.
- NIK/KK lengkap hanya tersedia bagi role berizin.
- Perubahan status, publikasi, upload, dan akses data sensitif dicatat ke audit log.
- Publish–unpublish kontribusi tersinkron dengan CMS publik.

## Menjalankan secara lokal

Persyaratan: Node.js 22 direkomendasikan.

```bash
npm ci
cp .env.example .env.local
npm run db:migrate-v050
npm run db:check-v050
npm run dev
```

Alamat lokal:

- Website: `http://localhost:3000`
- Portal warga: `http://localhost:3000/warga`
- CMS petugas: `http://localhost:3000/admin/login`
- Operasional petugas: `http://localhost:3000/admin/operasional`

## Environment variables

```env
DATABASE_URL=
DATABASE_URL_UNPOOLED=
DATABASE_TARGET_ENV=development
DATABASE_ALLOWED_HOSTS=
CMS_USERNAME=
CMS_PASSWORD=
CMS_SESSION_SECRET=
CITIZEN_SESSION_SECRET=
CITIZEN_DATA_ENCRYPTION_KEY=
BLOB_READ_WRITE_TOKEN=
CITIZEN_BLOB_READ_WRITE_TOKEN=
```

`DATABASE_URL` digunakan aplikasi saat runtime. `DATABASE_URL_UNPOOLED`/`MIGRATION_DATABASE_URL` digunakan untuk migration dan pemeriksaan schema. `db:push` hanya boleh untuk eksperimen Development yang dapat dibuang, bukan Preview atau Production.

`CITIZEN_DATA_ENCRYPTION_KEY` harus disimpan secara permanen. Menggantinya setelah data warga tersimpan akan membuat NIK/KK lama tidak dapat didekripsi.

Buat secret acak:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Deployment Vercel

Integrasi wajib dimulai pada Local/Development, dilanjutkan Preview, lalu Production setelah seluruh pemeriksaan lulus. Jangan memasukkan connection string atau secret ke repository.

Migration v0.5.0:

```bash
npm run db:migrate-v050
npm run db:check-v050
```

Production hanya boleh disentuh setelah backup valid, staged deployment, dan persetujuan eksplisit. Urutan lengkap tersedia pada `docs/DEPLOYMENT_V050.md`.

## Validasi

```bash
npm run lint
npm run typecheck
npm run build
```

## Batas MVP

- Belum ada Google Login, magic link, email notification, Google Docs, atau Google Sheets.
- Belum ada upload dokumen KTP/KK. Upload gambar kontribusi warga menggunakan Blob private terpisah sebelum moderasi.
- Verifikasi dokumen dilakukan melalui instruksi petugas dan pemeriksaan langsung.
- Belum ada tanda tangan elektronik.
- CMS utama masih menggunakan satu dokumen JSONB, tetapi perubahan publikasi kontribusi dan status submission kini ditulis secara transaksional.

Integrasi BESTI pada v0.4.0 menggunakan tautan eksternal yang stabil. Integrasi API, SSO, dan sinkronisasi status tetap ditunda sampai tersedia dokumentasi teknis resmi.


## Dokumentasi hardening lanjutan

- `docs/ADMIN_ROLES_AUDIT.md`
- `docs/HIGH_PRIORITY_DEPLOYMENT.md`
- `HIGH_PRIORITY_IMPLEMENTATION.md`


## Dokumentasi Operasional 0.2.0

- `HIGH_PRIORITY_IMPLEMENTATION.md` — ringkasan implementasi.
- `docs/ADMIN_ROLES_AUDIT.md` — matriks role dan audit.
- `docs/ADMIN_OPERATION_SOP.md` — SOP petugas.
- `docs/HIGH_PRIORITY_DEPLOYMENT.md` — migrasi dan deployment.
- `docs/HIGH_PRIORITY_TEST_PLAN.md` — acceptance test.
- `docs/ROLLBACK_GUIDE.md` — rollback.
- `docs/OFFICIAL_DATA_CHECKLIST.md` — verifikasi data resmi.
- `VALIDATION_HIGH_PRIORITY.md` — status validasi paket.


## Pembaruan v0.4.1 — Content Polish

Patch v0.4.1 menyempurnakan narasi publik pada beranda, profil, layanan, kesejahteraan, UMKM, peta, kontak, footer, dan Portal Warga. Normalisasi kompatibilitas hanya mengganti teks prototipe bawaan yang dikenal, sehingga konten kustom dan data Production tetap dipertahankan. Tidak ada migrasi database.

---

## Rilis v0.5.0 — Kependudukan & Security Hardening

Dokumen utama rilis:

- `IMPLEMENTATION_SUMMARY_V050.md`
- `CHANGELOG_V050.md`
- `docs/KEPENDUDUKAN_MVP.md`
- `docs/SECURITY_V050.md`
- `docs/DEPLOYMENT_V050.md`
- `docs/ROLLBACK_V050.md`
- `docs/ACCEPTANCE_TEST_V050.md`
- `docs/ROLE_PERMISSION_MATRIX_V050.md`
- `docs/KNOWN_LIMITATIONS_V050.md`
- `VALIDATION_V050.md`

Untuk database gunakan migration versioned:

```bash
npm run db:migrate-v050
npm run db:check-v050
```

Jangan gunakan `db:push` pada Production. Selalu cocokkan hostname dengan `DATABASE_ALLOWED_HOSTS`, lakukan backup, dan uji Development serta Preview terlebih dahulu.
