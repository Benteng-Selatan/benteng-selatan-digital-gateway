# Portal Warga MVP — Implementasi dan Operasional

## Sasaran

MVP ini membuktikan alur lengkap tanpa integrasi eksternal:

```text
Warga membuat akun
→ mengajukan Surat Keterangan Usaha
→ petugas memeriksa
→ petugas meminta perbaikan atau memberi persetujuan
→ warga dan petugas bertukar pesan
→ status diselesaikan
```

Alur kontribusi publik:

```text
Warga mengajukan UMKM/Kabar/lokasi
→ petugas memoderasi
→ petugas memilih status Diterbitkan
→ data otomatis masuk ke CMS publik
```

## Tabel baru

- `citizen_users`
- `service_requests`
- `service_request_messages`
- `service_request_history`
- `content_submissions`

Tabel `cms_documents` lama tetap dipertahankan.

## Status pengajuan surat

- `submitted`
- `under_review`
- `revision_required`
- `verified`
- `approved`
- `rejected`
- `completed`

## Status kontribusi

- `submitted`
- `under_review`
- `revision_required`
- `approved`
- `published`
- `rejected`

## Langkah upgrade database

Sebelum menjalankan perubahan schema, buat backup Neon. Kemudian:

```bash
npm run db:push
```

Pastikan tabel baru muncul melalui Neon SQL Editor:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

## Environment production

Tambahkan ke Vercel Production:

- `CITIZEN_SESSION_SECRET`
- `CITIZEN_DATA_ENCRYPTION_KEY`

Keduanya harus berupa nilai acak panjang dan berbeda. Jangan mengubah `CITIZEN_DATA_ENCRYPTION_KEY` setelah sistem digunakan tanpa prosedur migrasi data terenkripsi.

## Smoke test setelah deployment

1. Buka `/warga/daftar` dan buat akun uji.
2. Keluar lalu login kembali melalui `/warga/masuk`.
3. Ajukan Surat Keterangan Usaha.
4. Buka `/admin/operasional` menggunakan akun CMS.
5. Ubah status menjadi `Sedang diperiksa`.
6. Kirim pesan kepada warga.
7. Masuk kembali sebagai warga dan pastikan pesan terlihat.
8. Ajukan satu UMKM dengan gambar uji.
9. Dari operasional admin, ubah kontribusi menjadi `Diterbitkan`.
10. Pastikan UMKM muncul pada halaman publik `/umkm`.
11. Hapus atau arsipkan data uji secara manual bila tidak dibutuhkan.

## Keamanan MVP

- Kata sandi warga di-hash menggunakan `scrypt`.
- Sesi warga dan CMS menggunakan cookie `httpOnly`, `sameSite=lax`, dan `secure` di production.
- NIK/KK dienkripsi AES-256-GCM.
- Data pengajuan hanya dapat dibaca akun pemilik atau petugas CMS.
- Catatan internal petugas tidak ditampilkan kepada warga.
- Gambar kontribusi dianggap kandidat media publik dan disimpan pada Blob publik.
- KTP/KK tidak boleh diunggah ke route gambar publik.

## Pengembangan setelah stabil

1. Rate limiting dan proteksi brute force.
2. Verifikasi email atau Google Login.
3. Penyimpanan dokumen privat dan signed URL.
4. Email/WhatsApp notification.
5. Template surat dan ekspor PDF.
6. Audit log akses data sensitif.
7. Multi-user petugas dan role-based access control.
8. Google Sheets hanya untuk ekspor laporan.
9. Google Docs hanya sebagai template dokumen, bukan database.
