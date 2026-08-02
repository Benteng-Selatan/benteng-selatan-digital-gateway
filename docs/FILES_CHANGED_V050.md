# Ringkasan File yang Diubah v0.5.0

## Fitur kependudukan

- `app/(site)/kependudukan/page.tsx`
- `components/admin/AdminDashboard.tsx`
- `components/public/Header.tsx`
- `app/(site)/page.tsx`
- `app/globals.css`
- `data/site-data.seed.json`
- `lib/types.ts`
- `lib/population-dashboard.ts`
- `lib/site-data-normalizer.ts`

## Keamanan, privasi, dan integritas

- `lib/site-data-validation.ts`
- `lib/cms.ts`
- `lib/security.ts`
- `lib/action-guard.ts`
- `lib/image-security.ts`
- `lib/citizen-uploads.ts`
- `lib/portal.ts`
- `lib/admin-permissions.ts`
- `lib/audit.ts`
- `lib/db/environment.ts`
- `lib/db/index.ts`
- seluruh route API terkait CMS, upload, pengajuan, pesan, dan kontribusi
- komponen portal/admin yang mengirim `Idempotency-Key`

## Database dan operasi

- `lib/db/schema.ts`
- `drizzle/0002_secure_population_mvp.sql`
- `drizzle/meta/_journal.json`
- `scripts/apply-v050-migration.mjs`
- `scripts/check-v050-schema.ts`
- `scripts/cleanup-pending-uploads.ts`
- `.env.example`
- `package.json` dan `package-lock.json`

## Dokumentasi

- `CHANGELOG_V050.md`
- `IMPLEMENTATION_SUMMARY_V050.md`
- `VALIDATION_V050.md`
- dokumen `docs/*_V050.md`
- `README.md`, `docs/ENVIRONMENT_SETUP.md`, `docs/PORTAL_WARGA_MVP.md`, dan `docs/PROJECT_STATUS.md`
