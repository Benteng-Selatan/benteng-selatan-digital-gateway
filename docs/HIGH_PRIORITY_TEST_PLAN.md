# High-Priority Acceptance Test

## Persiapan

- Migrasi `0000` dan `0001` telah diterapkan.
- Environment Preview memakai database non-Production.
- `CMS_USERNAME`, `CMS_PASSWORD`, dan `CMS_SESSION_SECRET` tersedia untuk bootstrap.

## Autentikasi dan Role

- [ ] Login pertama membuat Super Admin saat `staff_users` kosong.
- [ ] Super Admin dapat membuka `/admin`, `/admin/operasional`, `/admin/petugas`, dan `/admin/audit`.
- [ ] Operator hanya dapat mengelola pengajuan dan pesan.
- [ ] Editor Konten dapat mengelola CMS dan kontribusi.
- [ ] Reviewer dapat melihat pengajuan, melihat NIK/KK, dan memoderasi kontribusi tanpa mengubah status surat.
- [ ] Auditor dapat melihat pengajuan dan audit log dengan NIK/KK dimasking.
- [ ] Akun nonaktif tidak dapat login.
- [ ] Perubahan password/role mengakhiri sesi lama.

## Pengajuan

- [ ] Daftar antrean tidak memuat NIK/KK atau ciphertext.
- [ ] Detail pengajuan menampilkan data sesuai izin role.
- [ ] Perubahan status dan history tersimpan bersama.
- [ ] Pesan/catatan internal dan timestamp tersimpan bersama.
- [ ] Aktivitas muncul di audit log.

## Kontribusi Publik

- [ ] Status `published` menambahkan atau memperbarui item publik.
- [ ] Perubahan dari `published` ke status lain menghapus item publik.
- [ ] Publikasi ulang memakai ID yang sama dan tidak membuat duplikasi.
- [ ] Penghapusan item kontribusi melalui CMS mengubah status submission menjadi `approved`.
- [ ] Perubahan CMS, submission, dan audit tersimpan secara konsisten.

## Petugas dan Audit

- [ ] Super Admin dapat membuat akun petugas.
- [ ] Username duplikat ditolak.
- [ ] Kata sandi di bawah 12 karakter ditolak.
- [ ] Super Admin terakhir tidak dapat dinonaktifkan atau diturunkan role-nya.
- [ ] Pengguna tidak dapat menonaktifkan akun sendiri.
- [ ] Audit mencatat login, logout, data sensitif, status, pesan, publikasi, CMS, upload, dan akun petugas.

## Deployment

- [ ] `npm run db:check-portal` berhasil.
- [ ] `npm run db:check-high-priority` berhasil.
- [ ] `npm run lint` berhasil.
- [ ] `npm run typecheck` berhasil.
- [ ] `npm run build` berhasil.
- [ ] Smoke test Preview berhasil sebelum Production.
