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
- [x] Alur status, riwayat, pesan warga–petugas, serta pemisahan catatan publik dan internal.
- [x] Pengajuan UMKM, wisata/budaya, dan lokasi peta.
- [x] Moderasi petugas serta publish/update/unpublish kontribusi ke CMS secara atomik.
- [x] Baseline MVP pernah lulus build, TypeScript, dan ESLint.
- [x] Rate limiting persisten, same-origin protection, optimistic concurrency, dan validasi upload.

## Wajib dilakukan sebelum aktivasi production

- [ ] Backup database Neon.
- [ ] Tambahkan `CITIZEN_SESSION_SECRET` pada Vercel Production.
- [ ] Tambahkan `CITIZEN_DATA_ENCRYPTION_KEY` pada Vercel Production.
- [ ] Jalankan `npm run db:push` pada database yang sama dengan production.
- [ ] Jalankan `npm run check` setelah `npm ci` berhasil.
- [ ] Deploy ulang dan lakukan smoke test.
- [ ] Tetapkan SOP verifikasi identitas dan dokumen fisik.
- [ ] Tetapkan petugas penanggung jawab operasional.

## Ditunda sampai MVP stabil

- [ ] Google Login atau magic link.
- [ ] Email/WhatsApp notification.
- [ ] Penyimpanan dokumen privat.
- [ ] Google Docs untuk template surat.
- [ ] Google Sheets untuk rekap laporan.
- [ ] Tanda tangan elektronik.
- [ ] Multi-user petugas dan role-based access control.
- [ ] Audit log pembacaan data sensitif dan aktivitas petugas.
