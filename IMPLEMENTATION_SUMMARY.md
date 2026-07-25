# Implementation Summary — Portal Warga MVP

## Implemented

- Citizen registration/login/logout with hashed passwords.
- Signed citizen session cookie.
- Encrypted NIK/KK storage.
- Citizen dashboard.
- Pilot Surat Keterangan Usaha workflow.
- Status history and citizen–staff messaging.
- Separate public notes and internal staff notes.
- Citizen submissions for UMKM, tourism/culture, and map locations.
- Public-image upload for contribution media.
- Staff operations dashboard and moderation.
- Atomic publish, update, and unpublish synchronization for moderated contributions.
- Persistent rate limiting, same-origin checks, optimistic concurrency, and security headers.
- Production-safe session and encryption secret handling.
- Updated environment example and deployment documentation.
- Reduced Next.js build workers to match the two-core Vercel build machine.

## Validation

The hardening session passed syntax/transpile checks and runtime tests for status transitions, encryption, password hashing, image validation, CMS validation, and same-origin enforcement. Full ESLint, TypeScript, and production build checks must be rerun after dependencies are installed successfully; the npm registry was unavailable during the final verification session.

## Required before deployment

```bash
npm ci
npm run db:push
npm run db:check-portal
npx vercel --prod
```

Add `CITIZEN_SESSION_SECRET` and `CITIZEN_DATA_ENCRYPTION_KEY` to Vercel Production first.
