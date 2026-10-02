# Supermarket POS & Inventory System Backend

## 🗺️ Development Roadmap & Commit History

### Phase 1: Project Initialization & Setup

- **Initial Setup:** This is a Practices of My Backend Class from TS Academy. This was my first commit and I noticed I made some errors in my push (my node_modules and .env file were pushed). I will delete them on a later date, but for now, it's all okay.
- **User Architecture Started:** I created the User routes and Controller and had issues pushing to my GitHub so it looks like I did a second commit. Guess it would not be so easy, I have to fail to grow.
- **Documentation Added:** Added a README.md through a commit. That was fun to learn to do because I did not know what a README.md is, but I realize it's whatever I want it to be and a story of my code's journey. _(Note: I used AI today to write the below but I guess after today I wouldn't use it anymore, it requires a lot of supervision and people act like it doesn't, that is weird)._

### Phase 2: Core Data Models & Controllers

- **Schema Expansion:** I went back and rewrote both the `User` model and the `Product` model to be more complete and production-ready. Before, they were bare minimum. Now they are structured to actually support a real inventory management system for a store or supermarket — with proper fields, types, defaults, and validation in place.
- **Product Controller Rebuilt:** This was one of the biggest steps so far. I wrote the full `Product_Controller.js` which handles five core operations:
  - `CreateProduct`: Validates required fields, checks for duplicates, sanitizes input, and saves.
  - `GetProducts`: Returns paginated lists with support for search, category filtering, and low-stock filters.
  - `GetProductByBarcode`: Fast single-product lookup for POS scanner use.
  - `UpdateProduct`: Validates MongoDB ObjectId, normalizes fields, returns updated documents.
  - `DeleteProduct`: A soft delete (`isActive: false`) so historical sales data is never lost.
- **Product Routes Wired Up:** I wrote `Product_Routes.js` to wire up all the controller functions. Public routes are open, while creation/updates are protected behind `verifyToken` and `requireAdmin` middleware.

### Phase 3: Security, Architecture & Custom Features

- **Custom Architecture Rebuild:** Fully rewired the backend architecture. I created custom features and aliases (e.g., `const PM = require('mongoose')`) to personalize the code.
  - Added a `pre('save')` hook to `User.js` to hash passwords automatically.
  - Fixed Mongoose virtuals in `Product.js` using `toJSON: { virtuals: true }`.
  - Rewrote the User Controller to generate JWT tokens and handle duplicate key errors.
  - Built a clean `Database_Config.js` and wired everything in `app.js`.
- **Enterprise Backend Architecture Expanded:** Successfully architected and secured the core backend infrastructure. Key features implemented:
  - **Role-Based Access Control (RBAC):** Middleware managing permissions across User, Store_Keeper, Admin, and Super_Admin.
  - **ACID Database Transactions:** Engineered secure Sales and Restock controllers using MongoDB sessions.
  - **Automated Audit Trail:** Background logging tracking all mutations to an `AuditLog` collection.
  - **Analytics Engine:** Dashboard controller generating daily revenue and expiry alerts.
  - **Production-Grade Security:** Hardened with `helmet`, `express-rate-limit`, `cors`, and `express-mongo-sanitize`.
  - **Global Error Handling:** Unified error catcher to prevent server crashes.

### Phase 4: Bug Fixes, Codebase Cleanup & API Testing

- **Key Technical Issues Resolved:**
  - Fixed Path-to-RegExp / Express 404 Route Error.
  - Resolved `express-mongo-sanitize` Read-Only Property Crash.
  - Fixed Mongoose Modern Async Pre-Save Hook Crash (removed legacy `next` callbacks).
  - Integrated Multer Media Upload with disk storage, WebP conversion, and static serving.
- **Cleanup & File Security:** Cleaned up the codebase and re-enforced system security to ensure `.gitignore` is working perfectly. Added empty folders for future `Services` and `Utility` files.
- **Backend Finalization & Transactions Tested:** Configured a local MongoDB Replica Set (`rs0`) to successfully run ACID transactions. Ran full API tests via `Test_Client.rest` and confirmed POS checkouts accurately deduct stock in real-time. Added `Test_Client.rest` to `.gitignore` to protect live JWT tokens.
- **Frontend Initialization:** Officially completed the backend testing phase and scaffolded the Phase 4 Frontend using React, Vite, and Tailwind CSS!

### 🚀 Latest Milestone Achievements (Upgraded & Hardened Server)

I completed a massive system-wide architecture upgrade to convert this practices server into an enterprise-grade, highly secure, fully audited business engine.

1. Refactored ACID Transaction Layer (Services/Sales_Service.js)
   Moved checkout logic into a dedicated transactional Service layer. Standardizes POS sales by utilizing Mongoose Sessions. Ensures that product stock deductions and invoice entries happen as an "all-or-nothing" transaction. No ghost sales, no floating inventory.

2. Cyber Security & Hardened User Validations (Controllers/User_Controller.js)
   Added rigorous format regex checks for Email and Phone numbers (7-15 digits with optional +).
   Enforced minimum 8-character password strength.
   Neutralized potential privilege escalation by whitelisting client signup roles to only allow Store_Keeper or User, and forcing HasAdminAccess: false during creation.
   Standardized casing for string fields (lowercase emails, capitalized gender categories).
3. Secure System-wide Audit Logs (Models/AuditLogs.js & Services/Audit_Service.js)
   Built an immutable MongoDB ledger tracking crucial system activity (successful checkouts, product creation/updates/deactivations, and successful/failed logins).
   Hidden plain-text passwords from being printed or stored in the logs.
   Kept trace information like request IPs, route endpoints, HTTP verbs, and user roles.
4. Real-time Dashboard Aggregations (Controllers/Report_Controller.js)
   Engineered parallel high-speed aggregations to populate our React dashboard (Daily stats, overall invoice revenue, unique item counts).
   Compiled 30-day chronological line chart analytics for chart widgets.
   Created a low-stock alert engine verifying items against their custom thresholds, combined with perishable expiration warnings (expiring within 7 days).
   Set up a top-sellers leaderboard to identify fast-moving inventory.
5. Shift-Logic Admin PIN Bypass (Models/AccessCodes.js, Utils/Time_Shift.js, Controllers/Access_Controller.js)
   Created a secure, temporary 6-digit PIN bypass mechanism for Store_Keepers to view reports when given admin authorization.
   Designed custom Working Hours Shift Logic (9:00 AM to 5:00 PM, Monday-Friday) to automatically pause countdown timers overnight and on weekends. A 4-hour PIN generated at 4:30 PM on Friday remains active until 12:30 PM on Monday, preserving valuable operational hours.

### 🚀 Progress & Milestones

```
[x] Initialised Git repository and configured VS Code with Git Bash
[x] Configured .gitignore to exclude node_modules, .env, and other sensitive files
[x] Built and connected MongoDB with Mongoose
[x] Expanded User Model with full fields for authentication and role management
[x] Expanded Product Model with full fields for inventory tracking (barcode, SKU, cost, reorder level, expiry, etc.)
[x] Built User Controller with registration and login logic
[x] Built Product Controller with Create, Read, Update, and Soft Delete
[x] Built Product Routes with public and admin-protected endpoints
[x] Added pagination, search, category filter, and low-stock filter to GetProducts
[x] Added ObjectId validation and duplicate key (11000) error handling
[x] Update User Routes to match the current User Controller
[x] Add authentication token refresh logic
[x] Installed sharp and configured Multer with in-memory storage
[x] Built Upload.js middleware supporting iPhone HEIC/HEIF photos and automatic WebP conversion (85% quality)
[x] Integrated upload.single('image') and processImage into Product Create and Update routes
[x] Configure express.static in app.js to serve saved files statically
[x] Add automated input validation/sanitization (Email/Phone regex, password length, and role whitelisting in User_Controller-v2.js)
[x] Add file cleanup logic (fs.unlink) in Product_Controller.js to delete old images when products are updated or replaced
[x] Implement ACID transactions on checkouts and supplier deliveries via separate Service Layers
[x] Implement system-wide tamper-proof Audit Trails and Loggers
[x] Build dashboard analytics engine (Reports_Controller.js) using advanced MongoDB aggregations
[x] Implement shifting business-hours temporary PIN generation system for role-bypass authorization
[ ] Connect React / POS frontend interface to the API (CORS Vite ports 5173 whitelisted)
```

### System Architecture & File Structure

```
Practices/
│
├── Config/
│   └── Database_Config.js        # MongoDB Mongoose connection
│
├── Controllers/
│   ├── User_Controller.js        # Registration, authentication, avatar handling
│   ├── Product_Controller.js     # Inventory CRUD, barcode scanning, image upload (audit logged)
│   ├── Sales_Controller.js       # POS checkout controller (calls Sales_Service)
│   ├── Restock_Controller.js     # Supplier restocking transactions (ACID session & audit logged)
│   ├── Report_Controller.js      # Revenue, low stock, expiring goods, top-seller analytics
│   └── Access_Controller.js      # Admin PIN generator for temporary bypass
│
├── Middleware/
│   ├── auth.js                   # JWT verification & req.user attachment
│   ├── role.js                   # Role-Based Access Control (RBAC) bouncer
│   ├── upload.js                 # Multer disk storage, MIME filters (5MB cap)
│   ├── Loggers.js                # System console logging
│   └── Errors.js                 # Global centralized error handler
│
├── Models/
│   ├── Users.js                  # User schema, bcrypt hashing pre-save, roles
│   ├── Products.js               # Product catalog, barcodes, stock levels, images
│   ├── Supplier.js               # Vendor details
│   ├── Sales.js                  # Completed POS transaction ledger (ACID written)
│   ├── Restock.js                # Inventory receiving records
│   ├── AuditLogs.js              # Mutation audit logs (immutable schema)
│   └── AccessCodes.js            # Time-bound PIN bypass codes (self-deleting via TTL index)
│
├── Routes/
│   ├── User_Routes.js            # /api/users
│   ├── Product_Routes.js         # /api/products
│   ├── Sales_Routes.js           # /api/sales
│   ├── Restock_Routes.js         # /api/restock
│   ├── Report_Routes.js          # /api/reports
│   └── Access_Routes.js          # /api/access
│
├── Services/
│   ├── Sales_Service.js          # ACID checkout transactions
│   └── Audit_Service.js          # Secure, password-scrubbing audit logging utility
│
├── Utils/
│   └── Time_Shift.js             # Business working hours calendar utility for code bypasses
│
├── uploads/                      # Static storage directory for user avatars & product media
├── .env                          # Environment secrets (PORT, MONGO_URI, JWT_SECRET)
├── app.js                        # Express server entry point & security middlewares
└── package.json                  # Dependencies & start scripts
```

### 🛠️ Key Commands & Workflow Reference

```
Managing Files
# Create files
touch README.md .gitignore

# Check current directory
pwd
Git Workflow
# Stage and commit changes
git add .
git commit -m "your message here"
git push origin main

# Check what has changed before staging
git status
git diff
Running the Server
# Install dependencies
npm install

# Start the development server
npm run dev

### 📌 Notes to Self

Always check .gitignore before the first push — node_modules and .env should never be committed.
The /barcode/:barcode route must always be declared before /:id in any Express router.
Use === undefined not !value when validating numeric fields — zero is a valid quantity.
Soft deletes (isActive: false) are safer than hard deletes for inventory systems — past sales records depend on the product data still being there.
You can create custom features/aliases like const PM = require('mongoose') to personalize the code.
Never put password hashing in the controller if you use a pre('save') hook in the model (avoids the double-hash bug).
Mongoose hides virtual fields by default. Always add toJSON: { virtuals: true } to the schema to see them in API responses.
Using .lean() in queries strips away Mongoose virtuals, so remove it if you need calculations to show up.
Login routes should always be POST, never PUT.
If the database fails to connect in the config, use process.exit(1) to kill the server.
MongoDB requires a Replica Set to be configured and initialized (rs.initiate()) before it allows ACID transactions and sessions.
Never commit .rest testing files to GitHub if they contain live JWT authentication tokens. Always add them to .gitignore.
Audit trails are legally append-only records. Setting updatedAt: false on Mongoose timestamps enforces this constraint and saves storage.
Temporary access tokens should be self-deleting. Use Mongo's { expireAfterSeconds: 0 } index on a shifting target date for automatic database housekeeping.

```

### Implement the plan:

```
Automated Testing
Unit tests for controllers, middleware, and model helpers
Integration/API tests for every route (success + failure paths)
Transaction tests for checkout/restock rollback behavior
Minimum coverage target (e.g., 80%+ lines/branches)

Validation & Input Safety
Request-level validation for body/query/params on every endpoint
Centralized validation error format
Strict type coercion rules (numbers, booleans, dates)
Strong ObjectId validation everywhere relevant

Import/File Casing Consistency
One canonical naming style across files and imports
Zero case-mismatch across Linux-sensitive paths
Enforced by lint/check in CI

Security Hardening
Keep current stack (JWT, Helmet, rate-limit, sanitize, RBAC)
Add token refresh/rotation strategy (if auth requires long sessions)
Add stricter CORS per environment
Add dependency vulnerability scanning + regular updates
Add secure headers/cookie strategy if browser auth is used

Error Handling & API Consistency
Standard response schema for all endpoints
Consistent status codes/messages across controllers
Centralized operational vs programmer error handling
No stack traces in production responses

Database & Data Integrity
Index review for frequent query paths
Unique/index constraints aligned with business rules
Transaction boundaries audited for all multi-write flows
Safe soft-delete behavior verified across dependent queries

Performance & Scalability
Query optimization for lists/reports
Pagination everywhere list data can grow
Load/performance smoke tests for key flows
Optional caching for analytics/report endpoints

Observability & Auditability
Structured logging (request id, user id, endpoint, latency)
Reliable audit trail for all write operations
Health check endpoint
Basic monitoring/alerting readiness

CI/CD Quality Gates
CI runs lint + tests + coverage + security checks on every PR
Build fails on quality/security gate failures
Clear branch protection rules

Documentation & Developer Experience
Up-to-date API docs (OpenAPI/Postman)
Setup guide with env vars and local run steps
Testing guide and sample test data flow
Clear role matrix (who can call which endpoint)

Code Quality Standards
Linting + formatting enforced
Remove dead code/inconsistent naming
Keep controllers thin where possible (service separation if needed)
Maintain consistent project conventions
```
