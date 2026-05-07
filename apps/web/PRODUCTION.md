# Production Setup

This app can now run in two modes:

- Demo mode: keeps demo-friendly behavior available for presentations.
- Production mode: disables demo credentials and expects real auth, database, and storage configuration.

## Recommended Vercel layout

- `demo.yourdomain.com`
  - `NEXT_PUBLIC_DEMO_MODE=true`
  - `ALLOW_DEMO_CREDENTIALS=true`
  - Demo database or seeded demo data
- `app.yourdomain.com`
  - `NEXT_PUBLIC_DEMO_MODE=false`
  - `ALLOW_DEMO_CREDENTIALS=false`
  - Production database and storage

## Required environment variables

Copy [.env.example](/Users/stockfamily/Documents/FinleyPro/Finley_App/apps/web/.env.example) into your Vercel project settings.

Minimum production values:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_DEMO_MODE=false`
- `ALLOW_DEMO_CREDENTIALS=false`

## What changed

- Demo logins are now controlled by environment flags.
- `/app/*` routes require an authenticated talent or admin session.
- `/admin/*` routes require an admin session.
- Notifications are scoped to the current user.
- Upload signing endpoints require authenticated sessions and validate payloads.

## Remaining production checklist

- Run Prisma migrations against a managed Postgres database.
- Configure a real email provider and sender domain.
- Add Vercel environment variables for all secrets.
- Verify upload buckets and CORS settings.
- Remove or complete any remaining demo-only pages and mock-data fallbacks before launch.
