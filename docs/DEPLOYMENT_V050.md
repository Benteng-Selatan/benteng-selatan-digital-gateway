# Deployment v0.5.0

## Prasyarat

- database Development dan Preview terpisah dari Production;
- backup valid sebelum migration;
- `psql` tersedia untuk script migration;
- Blob store publik untuk `BLOB_READ_WRITE_TOKEN`;
- Blob store private terpisah untuk `CITIZEN_BLOB_READ_WRITE_TOKEN`;
- seluruh environment variable pada `.env.example` sudah diperiksa tanpa menampilkan nilainya.

## Urutan aman

1. Jalankan `npm ci`.
2. Jalankan `npm run lint`, `npm run typecheck`, dan `npm run build`.
3. Periksa hostname database dari `DATABASE_URL_UNPOOLED` dan cocokkan dengan `DATABASE_ALLOWED_HOSTS`.
4. Backup database target.
5. Jalankan `npm run db:migrate-v050` pada Development.
6. Jalankan `npm run db:check-v050`.
7. Jalankan smoke test dan acceptance test.
8. Ulangi pada Preview.
9. Production hanya setelah Preview lulus, backup Production valid, staged deployment tersedia, dan persetujuan eksplisit diberikan.

`db:push` tidak digunakan untuk Production. Migration source of truth adalah `drizzle/0002_secure_population_mvp.sql`.

## Catatan Blob private

Pastikan store warga dibuat dengan akses private. Token store private tidak boleh sama dengan store publik. Endpoint aplikasi tidak pernah mengirim URL Blob private ke browser; browser hanya menerima URL preview internal `/api/citizen/uploads/:id`.
