# Implementation Summary — Portal Warga MVP

## Implemented

- Citizen registration/login/logout with hashed passwords.
- Signed citizen session cookie.
- Encrypted NIK/KK storage.
- Citizen dashboard.
- Pilot Surat Keterangan Usaha workflow.
- Status history and citizen–staff messaging.
- Internal staff notes.
- Citizen submissions for UMKM, tourism/culture, and map locations.
- Public-image upload for contribution media.
- Staff operations dashboard and moderation.
- Automatic publication of approved contributions into the existing CMS document.
- Production-safe CMS credential handling.
- Updated environment example and deployment documentation.
- Reduced Next.js build workers to match the two-core Vercel build machine.

## Validation

- ESLint: passed.
- TypeScript: passed.
- Next.js production build: passed.
- Password hashing/encryption unit smoke test: passed.
- Production dependency audit: 0 vulnerabilities.

## Required before deployment

```bash
npm ci
npm run db:push
npm run db:check-portal
npx vercel --prod
```

Add `CITIZEN_SESSION_SECRET` and `CITIZEN_DATA_ENCRYPTION_KEY` to Vercel Production first.
