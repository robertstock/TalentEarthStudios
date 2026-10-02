# Numbered job workflow — source implementation, not activated

Production app: https://www.talentearth.com/admin/projects. Records and private supplier originals are stored in the existing Prisma/PostgreSQL application database (Neon); Vercel hosts the application. Local production parent was read-only verified as `/Users/stockfamily/Desktop/****WIP/****In_Production` (four literal asterisks in each component).

## Submission and owner approval

Finley chat, its form and the authenticated mobile submission route use one transactional service. An explicit client submission UUID and canonical request hash bind retries to the same project. A PostgreSQL upsert locks the submission row and a per-business-day sequence allocates `TE_YYYY_MM_DD_001`. Padding is a minimum of three digits; 1000 does not wrap. A failed transaction rolls everything back. A replay returns its original number even after midnight. Existing jobs retain null job numbers; a database trigger prohibits renumbering or deleting a numbered job. Cancel instead.

The Incoming list shows `Project Name | Job Number`, Awaiting Approval, the saved SOW revision, and separate Save / Approve Saved SOW actions. Only configured verified active administrator accounts may approve the currently saved revision. Approval freezes a snapshot. Later SOW edits increment the revision and require approval again; they do not overwrite the prior approved snapshot or the originally submitted email payload. In-flight local file operations must finish or be reconciled before editing an approved SOW.

The old unversioned `/api/projects` creation endpoint returns 410 and directs clients to Finley. The live test-project creation endpoint is disabled. Legacy SOW status routes cannot approve numbered jobs. Existing mobile confirmation polling excludes numbered jobs so it cannot send a second confirmation.

One durable confirmation task is inserted in the submission transaction, with the exact submitted SOW, subject `New Job: [Project Name] | [Job Number]`, and a direct Incoming link. Provider acceptance is stored. An uncertain response or expired email claim requires reconciliation against provider delivery history; there is no blind resend and no claim of exactly-once external email delivery. Missing provider configuration leaves a blocked task. Owner reconciliation can record a verified provider message ID; it cannot automatically resend an uncertain email.

## Local folders and vendor invoices

Owner approval creates one durable folder task. Its approved folder name is `Project Name — Job Number`; only `/`, `:` and NUL are replaced with underscores. Overlong names require review. The worker creates `Outside Costs` and `Artwork`, retains an immutable `.finley-job.json` association, and refuses unrelated existing folders or symlinks. File publication is atomic and never overwrites. Equal original bytes are reused; different bytes at the same filename require review. A crash before the initial association marker was written requires reconciliation of that unmarked folder. Later partial subfolder creation is safely resumed. Folder name/path are retained after approval even if the display name is subsequently edited.

An offline Mac leaves unclaimed tasks pending. Expired local-file claims can be reclaimed because operations verify job markers and content hashes on every retry. Old acknowledgment tokens cannot complete a newer claim. A failed operation records task/job/attention; uncertain conflicts remain for owner review.

All-vendor EML preparation reads supplied exported message bytes without operating Mail or altering read status. Full TE numbers are collected from subject, body, filename and extracted PDF text. Missing, conflicting or unknown numbers require review; client names and POs are never substitutes. A payment link without the original attachment requires review. The server stages originals and validates supplier, invoice number, date, currency and totals against the existing supplier schema. It does not infer currency. The current ledger supports USD only; other currencies remain review items, without conversion.

Pre-approval invoices wait for current SOW approval, then acknowledged production folder, then original-file acknowledgment. The import service uses the same supplier-cost validation as the existing manual review route and commits document, cost lines, task completion and receipt together. Exact document hashes and vendor-specific invoice keys dedupe repeated email copies. Revised documents, differing job evidence, or existing manual costs trigger review. A repeated ledger acknowledgment returns the previous result. No QuickBooks export is called by this workflow.

Invoice 48139 / $54 / Actors Gang has no full TE number and is explicitly **review-only**. Its existing saved PDF is preserved. The prior `tools/kl-intake` PO/name matching import is retired; its read-only parser and no-clobber file-helper fixtures remain available.

## Not activated / required before deployment

No production migration, deployment, credential grant, live financial import, email, real WIP folder or scheduler was performed during implementation. Historical data was not changed. Existing new-job pricing remains 2× all costs including freight; existing historical pricing policy remains unchanged. Robert's explicit price approval remains required before customer invoice creation. There is no automatic customer send.

Configuration fails closed until confirmed and configured through the owner-approved deployment process:

- `JOB_BUSINESS_TIMEZONE`: confirmed `America/Los_Angeles`; no workspace-timezone fallback.
- `JOB_NOTIFICATION_EMAIL`: confirmed `robertstock@me.com`.
- `PRICE_APPROVER_USER_IDS`: comma-separated verified immutable active administrator IDs. Both user-confirmed Robert accounts are approved; active ADMIN status is rechecked for approval and customer invoice creation. The singular legacy setting remains a fallback only when the plural setting is absent.
- Existing approved Resend configuration plus `PROJECT_REQUEST_FROM_EMAIL`.

The authored additive migration must first be tested against a reconciled copy of the real schema. The repository's existing production migration history is not assumed synchronized. The final source passed PostgreSQL 17 contention tests with 12 independent connections. Authenticated route checks and a reviewed live end-to-end run remain required before enabling recurring work.

The current endpoints require the existing approved ADMIN session; this is not durable headless authentication. The local worker takes an injected backend and reviewed PDF/field extraction adapter. Apple Mail acquisition, unattended network authentication, review-resolution UI, and persistent scheduling are not installed. Pending work and review reasons can be read through the authenticated workflow endpoint. Unknown/conflicting invoice resolution must remain a reviewed operation; this implementation deliberately provides no force-import override.

For unattended use, the smallest proposed capability is a separately approved, expiring/revocable worker credential scoped to explicitly approved jobs, original invoice upload/read, task claim/ack and validated supplier-cost import only. All-vendor scope must be explicitly approved under the latest request; it supersedes the earlier K&L-only proposal. Exclude arbitrary database access, other company/person access, customer invoices, QBO export and email delivery. Provision only via an owner-facing secure flow, store a hash server-side and let the owner store the local secret through OS-protected storage. This requires a new scoped credential model/migration and action-time owner approval; no token provisioning or secret access is included here.

## Validation

The task workspace contains schema/SQL fixtures, injected service fixtures, baseline/apply hashes and build logs. Python tests run entirely in temporary directories. Initial SQL fixtures used PGlite. Final additive migration and service tests passed on PostgreSQL 17 with 12 independent connections, including duplicate uploads/acknowledgments, approval races, and preservation of historical prices. The final release also passed 32 unit tests, 14 Python fixtures, scoped TypeScript validation, and the full Next build (62 static pages).

The broad TypeScript check exposes pre-existing AI SDK provider-version and simulator typing errors, reproduced against the preserved baseline. The workflow service/routes have a separate passing scoped check. Next's existing configuration skips type validation during build, so a production build passing must not be described as a clean whole-repository typecheck.
