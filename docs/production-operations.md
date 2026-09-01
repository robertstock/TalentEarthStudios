# Production Operations

## Data persistence

- Application records are stored in the Vercel-linked Neon PostgreSQL database through Prisma.
- Source code is stored in GitHub. Live customer, project, financial, and talent data must never be committed to GitHub.
- Production secrets belong in Vercel environment variables. Local `.env*` files are ignored by Git.

## Required production environment

- `DATABASE_URL` — pooled Neon production connection
- `NEXTAUTH_URL` — `https://talentearth.com`
- `NEXTAUTH_SECRET` — unique production-only secret
- `NEXT_PUBLIC_APP_URL` — `https://talentearth.com`
- `NEXT_PUBLIC_DEMO_MODE` — `false`
- `ALLOW_DEMO_CREDENTIALS` — `false`

## Database backup policy

Neon is the system of record. Use its Backup & Restore controls instead of placing database exports in GitHub.

1. Keep point-in-time restore enabled for the longest window supported by the selected Neon plan.
2. For production, use at least a 7-day restore window.
3. On a paid Neon plan, schedule daily snapshots and retain at least 14 daily recovery points.
4. Before a schema migration or bulk data change, create a manual snapshot.
5. Test a restore to a separate branch quarterly; a backup is only useful if it can be restored.

Backup settings are managed from the Neon integration attached to the Vercel project. Plan upgrades and restore-window changes may affect billing and must be approved by the account owner.

## Release checklist

1. Run the production build.
2. Deploy to Vercel production.
3. Verify `talentearth.com` points to a Ready deployment.
4. Confirm sign-in and the main admin read-only views.
5. Push the reviewed source changes to the GitHub `main` branch.
