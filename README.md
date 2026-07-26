# Benteng Selatan Digital Gateway

Portal publik dan layanan warga Kelurahan Benteng Selatan berbasis **Next.js 16**, **PostgreSQL Neon**, **Drizzle ORM**, **Vercel Blob**, dan **Leaflet**.

## Modul utama

### Portal publik

- Beranda, profil, layanan, dashboard kesejahteraan, UMKM, peta, Kabar, dan kontak.
- CMS dengan status `draft` dan `published`.
- Upload media publik melalui Vercel Blob.
- Peta multi-marker berbasis Leaflet.

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
npm run db:push
npm run db:migrate-high-priority
npm run db:check-high-priority
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
CMS_USERNAME=
CMS_PASSWORD=
CMS_SESSION_SECRET=
CITIZEN_SESSION_SECRET=
CITIZEN_DATA_ENCRYPTION_KEY=
BLOB_READ_WRITE_TOKEN=
```

`DATABASE_URL` digunakan aplikasi saat runtime. `DATABASE_URL_UNPOOLED` digunakan Drizzle saat `db:push` atau `db:studio`.

`CITIZEN_DATA_ENCRYPTION_KEY` harus disimpan secara permanen. Menggantinya setelah data warga tersimpan akan membuat NIK/KK lama tidak dapat didekripsi.

Buat secret acak:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Deployment Vercel

1. Tambahkan seluruh environment variable ke scope **Production**.
2. Buat backup database, lalu jalankan migrasi schema:

```bash
npm run db:migrate-high-priority
npm run db:check-high-priority
```

3. Deploy:

```bash
npx vercel --prod
```

4. Lakukan smoke test sesuai `docs/PORTAL_WARGA_MVP.md`.

## Validasi

```bash
npm run lint
npm run typecheck
npm run build
```

## Batas MVP

- Belum ada Google Login, magic link, email notification, Google Docs, atau Google Sheets.
- Belum ada upload dokumen KTP/KK karena Blob yang aktif digunakan untuk media publik.
- Verifikasi dokumen dilakukan melalui instruksi petugas dan pemeriksaan langsung.
- Belum ada tanda tangan elektronik.
- CMS utama masih menggunakan satu dokumen JSONB, tetapi perubahan publikasi kontribusi dan status submission kini ditulis secara transaksional.

Integrasi eksternal ditunda sampai alur transaksi inti stabil dan teruji.


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
