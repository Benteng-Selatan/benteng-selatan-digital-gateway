# Ringkasan Implementasi v0.5.0

Versi: `v0.5.0-kependudukan-secure-mvp`

## File/domain utama yang berubah

- `app/(site)/kependudukan/page.tsx`: halaman publik kependudukan.
- `components/admin/AdminDashboard.tsx`: editor CMS kependudukan dan revision.
- `lib/population-dashboard.ts`: perhitungan dan validasi silang.
- `lib/site-data-validation.ts`: validasi ketat struktur konten dan URL.
- `lib/cms.ts`: optimistic locking dan audit changed sections.
- `lib/citizen-uploads.ts`, `lib/image-security.ts`: upload privat, sanitasi, quota, promosi, dan kompensasi kegagalan.
- `lib/action-guard.ts`: rate limit atomik dan idempotency concurrent-safe.
- `lib/security.ts`: dedicated encryption key dan kompatibilitas legacy.
- `lib/db/environment.ts`: guard target database.
- `lib/portal.ts`: audit, minimisasi data role, dan publikasi kontribusi.
- `drizzle/0002_secure_population_mvp.sql`: baseline schema dan perubahan v0.5.0.

## Perubahan database

Additive: kolom `cms_documents.version`; tabel `action_rate_limits`, `idempotency_records`, dan `pending_uploads`; index, foreign key, serta check constraint. Tidak ada perintah penghapusan data lama.

## Matriks perubahan permission

| Role | Data pengajuan | Kontribusi | CMS |
|---|---|---|---|
| Super Admin | Lengkap | Lengkap | Edit |
| Operator | Lengkap sesuai izin sensitif | Tidak ada | Tidak ada |
| Content Editor | Tidak ada | Payload + identitas untuk moderasi | Edit |
| Reviewer | Tanpa identitas/kontak/pesan | Payload tanpa identitas | Tidak ada |
| Auditor | Metadata tanpa identitas/pesan | Metadata tanpa payload/identitas | Tidak ada |

Dokumentasi detail tersedia pada `docs/ROLE_PERMISSION_MATRIX_V050.md`, `docs/ACCEPTANCE_TEST_V050.md`, dan `VALIDATION_V050.md`.
