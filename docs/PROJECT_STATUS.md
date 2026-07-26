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
- [x] Build, TypeScript, dan ESLint valid.

## Wajib dilakukan sebelum aktivasi production

- [ ] Backup database Neon.
- [ ] Tambahkan `CITIZEN_SESSION_SECRET` pada Vercel Production.
- [ ] Tambahkan `CITIZEN_DATA_ENCRYPTION_KEY` pada Vercel Production.
- [ ] Jalankan `npm run db:push` pada database yang sama dengan production.
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
- [ ] Rate limiting persisten dan audit akses sensitif.
