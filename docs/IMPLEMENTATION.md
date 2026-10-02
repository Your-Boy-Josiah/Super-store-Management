# Implementation and review checklist

## Completed in this change

- Public signup cannot assign staff roles and is disabled by default.
- Reports and PIN routes authenticate and enforce role/grant permissions on the server.
- Current database account status and role are checked on authenticated requests.
- PINs are cryptographically generated, stored as keyed hashes, bound to a Store Keeper, rate limited during verification, validated for duration, and redacted from logs.
- A verified PIN grants that Store Keeper access to reports and sales history until expiry. The grant is checked on every request, including issuer status. Duration uses server-local business hours, 09:00–17:00 Monday–Friday; production business timezone must be configured deliberately.
- Restock date generation, validation, retryable transactions and unconditional session cleanup are fixed.
- Checkout transactions retry write conflicts, prevent overselling, reject expired products and roll back the complete cart on failure.
- Product updates whitelist fields and restrict image cleanup to generated WebP files in the upload directory. Prior images are removed only after a successful update.
- Avatar processing and rejected-upload cleanup are wired in.
- Staff, supplier and profile endpoints support the frontend. Admin assignment is restricted to Super Admins; protected accounts cannot be deactivated through staff management.
- React frontend: login, overview, inventory, POS, receipts, suppliers, deliveries, sales reports, staff roles, PINs, profile, mobile navigation, form validation, and loading/error/empty states.
- CI installs locked dependencies, runs tests and builds the frontend.
- Seed data is opt-in, non-destructive, development-only and creates valid supplier references.
- Explicit legacy-user migration and initial-administrator bootstrap scripts are included.

## Validation

Automated integration tests use a disposable MongoDB replica set. They cover authorization, signup escalation, avatars and cleanup, restock success/rollback, checkout rollback/concurrency, inactive accounts, stale token roles, PIN ownership/expiry/log redaction, file-path injection and protected staff management. Utility tests cover working-time expiry and recursive credential redaction.

## Required before production

- Choose hosting and approve any costs.
- Rename the GitHub repository if desired; update remotes and documentation links afterward.
- Configure secrets, application origins, proxy configuration and persistent image storage.
- Back up and migrate an existing database; establish initial admin access for a new database.
- Set the business timezone to the store's operating timezone (for example TZ=Africa/Lagos on Linux).
- Review and merge this change; verify the hosted application with your actual store workflows.

## Practical limits

Supplier/staff lists are capped at 200 records; delivery selection loads the first 100 active products. POS searches are capped at 50 results and inventory lists are paginated. Expand picker search/pagination before using larger catalogues. Prices are represented as JavaScript numbers with receipt totals rounded to two decimal places; a future monetary-schema migration to integer minor units should be planned if additional currencies or accounting integrations are needed. Persistent local image storage assumes one service instance; use object storage before scaling across instances.
