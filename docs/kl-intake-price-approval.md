# K&L intake and price approval — source only

This change is not deployed, migrated, authenticated for unattended access, or scheduled. Daily timing requested by Robert is 09:00 America/Los_Angeles (Pacific with DST). No automation is enabled.

## Pricing and approval

New jobs default to 2x all costs, including delivery/freight. The additive migration first marks existing jobs LEGACY_DELIVERY_AT_COST, then changes the insert defaults to ALL_COSTS and multiplier 2. It does not update any existing multiplier or agreed price. Existing jobs retain their historical calculation.

Configure PRICE_APPROVER_USER_IDS to the explicitly approved immutable website user IDs through owner-approved deployment configuration. The two verified Robert accounts are authorized. This setting does not grant admin access: approval and subsequent invoice creation recheck active approved ADMIN status. Without a configured approver, new price approval and customer invoice creation fail closed. PRICE_APPROVER_USER_ID remains a legacy fallback only when the plural setting is absent. Laurie can continue other permitted admin work.

The existing customer-invoice endpoint supports POST action approve with pricingVersion from its GET preview. Robert must explicitly review/approve that version. Saving a draft is separate and does not approve it. Creation requires the current approved version; changes to costs or saved multiplier invalidate approval. A database trigger on VendorBill shares a Project row lock with approval and invoice freezing so concurrent cost writes cannot silently preserve approval. Frozen submissions retain their original approved payload for recovery; old pending submissions remain recoverable. Customer sending remains a manual QuickBooks action. No send endpoint was added.

Supplier approval no longer defaults the optional UI checkbox to sending a vendor Bill/Purchase to QuickBooks. The backend supplier approval route remains website-only; the separate supplier /quickbooks route is not used by this intake preparation.

## Local preparation

`tools/kl-intake/kl_intake.py` contains a bounded EML/PDF-text parser, exact approved job-reference mapping, duplicate/conflict checks, a no-clobber file saver, and an injectable website import adapter. It has no Mail reader, network credential loader, direct database access or scheduler. CLI operation is dry-run only. No persistent auth grant is created by this source change.

Inputs must come from separately authorized access: EML bytes from robertstock@me.com, text from an authorized PDF extractor bound to the PDF digest, and a fresh complete scoped job/document/ledger snapshot. The initial parser supports the verified K&L single-banner, zero-tax/no-freight invoice layout. Other invoice layouts, allocations, scans, dates or uncertain totals stop for review. This limited parser does not prevent the website from supporting freight; new jobs' pricing includes all freight costs when reviewed/imported through the existing supported form.

Job snapshots require an explicitly confirmed PO/reference mapping, website project ID, WIP-relative job path, client acceptance, K&L assignment, document inventory and manual ledger costs. No fuzzy match is imported automatically. Account alone or the shared QuickBooks sender is insufficient: vendor display name and PDF vendor/company must also match.

Duplicate checks cover Message-ID/invoice receipts, vendor+invoice identity, file SHA-256, previously approved linked costs, possible unlinked manual costs, existing WIP filenames and concurrent saves. Reuse invoice 48139's existing PDF. Do not overwrite a file or conflicting draft. The adapter rechecks the live job/documents before upload, after upload and after approval; an uncertain response is reconciled, not treated as a failure needing blind replay. Persist its receipt only after confirmed ledger success. Do not mark Mail read, move/delete messages, or pay invoices.

The injected backend interface is deliberately not an auth implementation: fresh_jobs(), upload(project_id, pdf), approve(project_id, document_id, details). Only an explicitly authorized, scoped application transport may supply it. It must route through application validation, never direct Prisma/SQL writes. Upload/extraction details that don't match the verified invoice stop for review.

## Headless access proposal — requires separate owner approval

Existing APIs only authenticate active NextAuth administrators. A durable importer needs a new narrow capability; do not reuse browser cookies or extract environment secrets.

Proposed minimal grant: one owner-generated high-entropy, expiring, revocable credential; store only its hash server-side, fixed canonical K&L vendor, explicit allowed project IDs, expiry/revocation and audit identity. Add a dedicated endpoint exposing only scoped duplicate lookup, private supplier upload and website-cost approval. Reuse the existing import validation/transaction service rather than bypassing it or issuing a general admin token. No other people/company data, pricing approval, QuickBooks/vendor export, customer invoice, sending, or arbitrary database capability. Verify live project mapping before each project is added to scope.

Provisioning UI, token creation, hash/grant table and protected local credential storage are NOT implemented here. They require an approved additive migration/deployment and a secure owner entry flow. Credentials belong in local OS-protected storage through the user flow, never checked-in files, process arguments or model-visible output. Approve that concrete capability and its project scope at setup time.

## Release and verification gates

Do not deploy this source before reviewing/applying the additive pricing migration and configuring the verified owner ID. Do not run all historical Prisma migrations against production: existing release notes state the baseline has not been reconciled. Preserve a recovery point before any separately authorized migration. No migration was run for this task.

Before enabling the 9am schedule: obtain approved app access, resolve the live Actors Gang project ID, inspect manual and supplier costs for invoice 48139, confirm source/deployment parity, validate migration/approval concurrency against an isolated database, then exercise a reviewed import end to end. Mail attachment acquisition and protected credential delivery still need integration. Laptop/Mail availability must be confirmed for each run. An incomplete or ambiguous run goes to review; it never sends a customer invoice.

Local checks:

```
python3 -m unittest discover -s tools/kl-intake -v
cd apps/web
node --test src/lib/invoice-workflow.test.ts src/lib/project-pricing.test.ts src/lib/project-costs.test.ts src/lib/project-client.test.ts src/lib/price-approval.test.ts
npm run check-types:invoices
```

Source-verified routes: https://www.talentearth.com/auth/signin?callbackUrl=%2Fadmin%2Fprojects and https://www.talentearth.com/admin/projects. Use the owner-approved backend route once available; no browser workaround is required or implemented.
