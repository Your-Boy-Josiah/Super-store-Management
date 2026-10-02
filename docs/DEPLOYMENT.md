# Hosting and deployment

This application serves the built React frontend and Express API from one Node service. MongoDB must support transactions (Atlas or a replica set). Uploaded images require persistent storage.

## Options

| Option                               | Setup                               | Image persistence    | Notes                                                                            |
| ------------------------------------ | ----------------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| Render + MongoDB Atlas               | One web service; blueprint included | Paid persistent disk | Suggested first deployment; one app URL                                          |
| Railway + MongoDB Atlas              | One Node service                    | Railway volume       | Good alternative; configure UPLOAD_DIR to the volume mount                       |
| Vercel frontend + Render API + Atlas | Separate frontend and API           | Render disk          | More setup: adjust frontend API base URL and CORS; not the default configuration |

Provider pricing and plans should be checked before deploying. Creating the included Render blueprint provisions a paid Starter service and persistent disk; do not provision it until you have chosen and approved that hosting plan.

References: https://render.com/docs/service-types, https://render.com/docs/disks, https://docs.railway.com/volumes/reference.

## Render deployment

1. Review and merge the PR after CI passes.
2. Create an Atlas database user with access limited to the application database. Configure the cluster's network access for the hosting service. Copy its MongoDB connection string into MONGO_URI; never commit it.
3. Connect the GitHub repository to Render. Use render.yaml, or create a Node web service manually.
4. Build: `npm ci && npm ci --prefix frontend && npm run build:frontend`. Start: `npm start`. Node: 24.
5. Set NODE_ENV=production, JWT_SECRET to a random 32+ character secret, MONGO_URI, FRONTEND_ORIGINS to your HTTPS application URL, UPLOAD_DIR=/var/data/uploads, TRUST_PROXY_HOPS=1 and ALLOW_PUBLIC_SIGNUP=false. Attach the disk at /var/data/uploads.
6. Before using an existing database, back it up. Run `npm run migrate:users` once to populate the isActive field on legacy users. Review which legacy accounts should remain active. Existing plaintext PIN records no longer verify; issue new PINs.
7. For a new database, set ADMIN_EMAIL, ADMIN_NAME, ADMIN_PHONE and ADMIN_PASSWORD (12+ characters) in a one-off shell environment, then run `npm run create:admin`. This only creates an initial Super Admin; it does not overwrite existing accounts. Remove these temporary variables afterward. Create other staff through Team.
8. Verify /api/health, login, permissions, product uploads, restocking, checkout, and reports using a designated test product. Confirm uploaded images survive a restart.
9. Configure database backups and include the uploads disk in your backup procedure. Keep the previous deployment available for rollback; never roll back database data blindly after new sales.

## Railway deployment

Use the same build/start commands and environment variables. Mount a volume for images and set UPLOAD_DIR to its mount path. Set TRUST_PROXY_HOPS only to the documented proxy-hop count for your deployment. Run migration/bootstrap commands once, then the same smoke checks.

## Current status

Deployment configuration and local verification are prepared. No hosting account, paid service, production database or production administrator was created, and no production migration has been run.
