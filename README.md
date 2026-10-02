# Super-store Management

A supermarket inventory and point-of-sale application: Express/MongoDB backend and responsive React frontend.

## Features

- Staff login with current account/role checks; public signup disabled by default.
- Product search, barcode lookup, images, pricing, stock and low-stock warnings.
- POS carts, transactional checkout, printable receipts and sales history.
- Supplier management, transactional restocking and delivery history.
- Dashboard, revenue trend, top sellers and expiry alerts.
- Team roles, account deactivation, profile/avatar updates and administrator-issued report-access PINs.

## Development

Use Node.js 24 and a MongoDB replica set or Atlas cluster. Standalone MongoDB cannot run the sales/restock transactions.

1. Install dependencies: `npm ci` and `npm ci --prefix frontend`.
2. Copy `.env.example` to `.env`; set MONGO_URI and a random JWT_SECRET of at least 32 characters. Do not commit secrets.
3. For development data only, set ALLOW_DEV_SEED=true and a 12+ character SEED_PASSWORD, then run `npm run seed`. It creates demo owner/keeper/cashier accounts without deleting existing data. Emails: owner@storeflow.test, keeper@storeflow.test and cashier@storeflow.test; passwords come from your SEED_PASSWORD.
4. Run `npm run dev` for the API on port 5000 and `npm --prefix frontend run dev` for the frontend on port 5173.
5. Open http://localhost:5173. The development frontend proxies /api and /uploads to the backend.

For a new production database, use `npm run create:admin` with ADMIN_EMAIL, ADMIN_NAME, ADMIN_PHONE and ADMIN_PASSWORD configured temporarily. Do not run the development seeder in production.

## Test and build

- `npm test`: integration tests start their own disposable MongoDB replica set. First run downloads a MongoDB binary from MongoDB's distribution site.
- `npm run build:frontend`: production build served by Express.
- `npm start`: await the database connection and start the combined application.
- `npm run migrate:users`: explicitly add isActive=true to legacy accounts missing the field. Back up and review the accounts before migrating a real database.

## Roles

| Role           | Permissions                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| User (cashier) | View active products, checkout, own profile                                                                                   |
| Store_Keeper   | Cashier permissions, manage products/suppliers, receive deliveries; reports and sales history require a verified assigned PIN |
| Admin          | Store operations and reports, create/manage non-admin staff, issue PINs                                                       |
| Super_Admin    | Admin permissions plus administrator role management                                                                          |

## Deployment and review

See [deployment instructions](docs/DEPLOYMENT.md), [implementation checklist](docs/IMPLEMENTATION.md) and [original learning notes](docs/ORIGINAL_BACKEND_NOTES.md). The original notes describe earlier code and are retained for reference only.

The Render blueprint provisions a paid service and image disk. Review hosting costs before using it. No production deployment or migration is performed by this PR.
