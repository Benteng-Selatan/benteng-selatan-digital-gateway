# Rollback v0.5.0

## Rollback aplikasi

1. Jangan menghapus backup atau tabel baru.
2. Rollback deployment ke tag stabil sebelumnya.
3. Pertahankan `CITIZEN_DATA_LEGACY_ENCRYPTION_KEY` agar data lama tetap dapat dibaca.
4. Jangan menghapus kolom `cms_documents.version`; versi lama akan mengabaikannya.

## Rollback data

Migration v0.5.0 bersifat additive. Tabel `action_rate_limits`, `idempotency_records`, dan `pending_uploads` tidak perlu dihapus ketika aplikasi di-rollback. Penghapusan hanya boleh dilakukan melalui migration terpisah setelah backup dan audit retensi data.

Jika perubahan CMS perlu dibatalkan, pulihkan dokumen `cms_documents` dari backup/snapshot Development atau Preview terlebih dahulu. Jangan menjalankan restore ke Production tanpa persetujuan eksplisit.

## Berkas Blob

Berkas publik yang sudah dipromosikan tidak otomatis dihapus saat kontribusi ditarik agar rollback konten tetap memungkinkan. Lakukan housekeeping terjadwal setelah masa retensi ditetapkan.

## Housekeeping unggahan tertunda

Gunakan `npm run uploads:cleanup-pending` terlebih dahulu dalam mode dry-run. Mode penghapusan memerlukan `CONFIRM_DELETE_PENDING_UPLOADS=YES_DELETE_ABANDONED_UPLOADS`. Selalu periksa hostname database dan store Blob sebelum mengaktifkannya.
