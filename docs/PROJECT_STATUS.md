# Status Pengembangan

## Selesai

- [x] Next.js App Router dan UI publik responsif.
- [x] PostgreSQL Neon sebagai sumber data CMS.
- [x] Vercel Blob untuk media publik.
- [x] CMS konten dan status draft/terbit.
- [x] Leaflet multi-marker dan filter peta.
- [x] Portal warga: daftar, login, logout, dan dashboard.
- [x] Pengajuan pilot Surat Keterangan Usaha.
- [x] Enkripsi NIK dan nomor KK.
- [x] Alur status, riwayat, pesan warga–petugas, serta catatan internal.
- [x] Pengajuan UMKM, Kabar/kegiatan, dan lokasi peta.
- [x] Moderasi petugas dan publikasi kontribusi ke CMS.
- [ ] Build, TypeScript, dan ESLint v0.5.0 wajib dijalankan ulang pada mesin integrasi.

## Wajib dilakukan sebelum aktivasi production

- [ ] Backup database Neon.
- [ ] Tambahkan `CITIZEN_SESSION_SECRET` pada Vercel Production.
- [ ] Tambahkan `CITIZEN_DATA_ENCRYPTION_KEY` pada Vercel Production.
- [ ] Jalankan `npm run db:migrate-v050` pada Development dan Preview; Production hanya setelah backup dan persetujuan eksplisit.
- [ ] Deploy ulang dan lakukan smoke test.
- [ ] Tetapkan SOP verifikasi identitas dan dokumen fisik.
- [ ] Tetapkan petugas penanggung jawab operasional.

## Ditunda sampai MVP stabil

- [ ] Google Login atau magic link.
- [ ] Email/WhatsApp notification.
- [x] Penyimpanan gambar kontribusi privat sebelum moderasi.
- [ ] Google Docs untuk template surat.
- [ ] Google Sheets untuk rekap laporan.
- [ ] Tanda tangan elektronik.
- [x] Multi-user petugas dan role-based access control.
- [x] Rate limiting persisten, idempotency, dan audit akses/tindakan penting.
