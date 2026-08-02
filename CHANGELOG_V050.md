# Changelog v0.5.0-kependudukan-secure-mvp

## Added

- Dashboard Data Kependudukan agregat dan editor CMS.
- Validasi konsistensi total penduduk, kelompok usia, dan data RW.
- Revision/optimistic locking dokumen CMS.
- Private pending upload workflow untuk kontribusi warga.
- Persistent rate limit atomik dan idempotency record untuk tindakan penting.
- Baseline migration lengkap `0002_secure_population_mvp.sql`.
- Pemeriksaan environment dan hostname database.
- Quota unggahan privat yang belum digunakan serta script housekeeping dry-run.

## Security

- Kunci enkripsi data warga dipisahkan dari session secret.
- URL CMS dibatasi ke HTTPS dan hostname allowlist.
- Reviewer/Auditor menerima proyeksi data minimum.
- Gambar diperiksa berdasarkan struktur, dimensi, dan metadata umum dibersihkan.
- Unggahan warga tetap privat sampai proses moderasi menerbitkan konten.
- Promosi Blob publik dibatalkan secara best-effort ketika transaksi publikasi gagal atau konflik.
- Data agregat dummy berstatus draft dan tidak dapat dipublikasikan selama masih ditandai simulasi.

## Fixed

- Ringkasan kesejahteraan tidak lagi tampil di beranda ketika status draft.
- Perubahan CMS tidak lagi dapat menimpa revision yang sudah berubah tanpa peringatan.
- Perubahan status moderasi non-publik tidak lagi mengubah revision CMS.
- Permintaan bersamaan dengan `Idempotency-Key` yang sama tidak lagi membuat tindakan ganda.

## Known limitations

- Belum ada sinkronisasi Google Sheets dan histori snapshot kependudukan.
- Sanitasi gambar berbasis parser format, bukan decode/re-encode piksel penuh.
- Housekeeping tersedia secara manual dan belum dijadwalkan otomatis.
- Blob publik hasil moderasi dipertahankan saat unpublish untuk mendukung rollback.
