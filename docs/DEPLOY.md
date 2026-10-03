# Deploy: Vercel now, Hostinger later

The app is a standard Next.js **standalone** Node.js server. It depends on two external services, both reachable from any host:

| Service | Used for | Production choice | Alternatives |
|---|---|---|---|
| PostgreSQL | Vehicles, leads, settings, staff, sessions | Supabase | Neon, Postgres on a VPS |
| S3-compatible storage | Vehicle photos | Supabase Storage | Cloudflare R2, AWS S3; local disk on a VPS |

No Vercel-specific services are used (no Blob, KV, Vercel Postgres, Edge Config or Vercel image optimization). Moving hosts means moving the Node.js server and the DNS. The database and the photos stay where they are.

## Environment variables

| Variable | Required | What it is |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string |
| `DATABASE_POOL_MAX` | No | Connections per server instance (default 5) |
| `S3_ENDPOINT` | Yes in production | S3 endpoint, e.g. `https://<ref>.supabase.co/storage/v1/s3` |
| `S3_REGION` | Yes in production | Bucket region, e.g. `sa-east-1` |
| `S3_BUCKET` | Yes in production | Bucket name, e.g. `vehicle-photos` |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | Yes in production | S3 access keys |
| `S3_PUBLIC_URL` | Yes in production | Public base URL for objects, e.g. `https://<ref>.supabase.co/storage/v1/object/public/vehicle-photos` |

Without the `S3_*` variables, photos are written to `./storage` on the server's disk. That is fine for development and for a VPS with backups, but **not on Vercel**, where the disk is temporary.

## 1. Supabase (database + photos)

Names of menus may change slightly; look for the equivalent option in the dashboard.

1. Create a project, region **South America (São Paulo)**. Save the database password.
2. **Database connection:** Connect (or Project Settings → Database) → connection string → **Transaction pooler** (port 6543). Replace `[YOUR-PASSWORD]`. This is `DATABASE_URL`.
3. **Create the tables and the first admin** from your computer (or a cloud session that can reach Supabase):
   ```bash
   export DATABASE_URL="postgresql://...pooler.supabase.com:6543/postgres"
   npm run db:migrate
   npm run db:seed          # optional: loads the demo dealership
   npm run admin:create -- voce@loja.com.br "Seu Nome"   # prints a temporary password
   ```
4. **Photos:** Storage → new bucket `vehicle-photos`, marked **public**. Then Storage settings → **S3 connection**: copy the endpoint and region, and create an access key pair. Fill the `S3_*` variables; `S3_PUBLIC_URL` is `https://<ref>.supabase.co/storage/v1/object/public/vehicle-photos`.
5. Plan: the free plan pauses projects after about a week without traffic. A paying client needs the Pro plan.

## 2. Vercel (now)

1. Import the GitHub repository in Vercel. Framework preset: Next.js. Build command: `npm run build` (default). Output: default.
2. Add all environment variables above for **Production** and **Preview**. `DATABASE_URL` must also be available at build time: vehicle pages are pre-rendered during the build.
3. Deploy. Then sign in at `/admin` with the account from step 1.3 and fill in **Configurações** (name, WhatsApp, colors, site address).
4. **Domain:** Project → Settings → Domains → add `www.loja.com.br` and follow the DNS records Vercel shows (CNAME for `www`, A record for the root domain). Update "Endereço do site" in Configurações to the final domain.
5. Plan: Hobby is for non-commercial use. A paying dealership needs **Pro**.

Notes:
- Photo uploads are resized in the browser and limited to 4 MB per request, below Vercel's 4.5 MB limit.
- Use the pooler connection string; direct connections (port 5432) can run out with serverless functions.

## 3. Hostinger (later)

Which Hostinger product, depending on what you have:

| Option | When | Notes |
|---|---|---|
| **Web hosting plan with Node.js apps** (Business/Cloud tiers, if your plan supports Next.js) | One dealership, managed hosting | Confirm on your account that it runs a Node.js 20+ app with `npm run build` and a start command. |
| **VPS** | Several dealerships on one server, full control | You manage Node, a process manager, Nginx and SSL (steps below). |
| Static hosting (basic plans) | Not suitable | The site needs a Node.js server for the admin, forms and page updates. |

### Build and run (any Node.js host)

```bash
npm ci
npm run build
# Assemble the standalone server
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
# Run (set the env vars first)
PORT=3000 HOSTNAME=0.0.0.0 node .next/standalone/server.js
```

### VPS (Ubuntu) outline

1. Install Node.js 20 LTS (or newer), Nginx and Certbot.
2. Clone the repo, create `/etc/concessionaria.env` with the variables above, build as shown.
3. Keep it running with PM2 or systemd (`node .next/standalone/server.js`, `PORT=3000`).
4. Nginx: reverse proxy `server_name www.loja.com.br` to `http://127.0.0.1:3000`; set `client_max_body_size 5m;` for photo uploads. Run Certbot for HTTPS.
5. Several dealerships: one checkout, env file and port per dealership, one Nginx server block per domain.

### Moving from Vercel to Hostinger, step by step

1. Deploy on Hostinger with the **same** environment variables. Test it on a temporary subdomain.
2. Lower the DNS TTL a day before. Point the domain's records to Hostinger (A record to the VPS IP, or the records Hostinger shows for the Node.js app).
3. Remove the domain from Vercel after traffic has moved.
4. Database and photos: nothing to do if they stay on Supabase. To leave Supabase too: `pg_dump` / `pg_restore` the database to the new Postgres and copy the bucket contents to the new storage (or to `./storage` on a VPS without `S3_*` variables), then change the variables.

What changes in the code: nothing. What changes in configuration: where the server runs, the DNS, and optionally `DATABASE_URL` and `S3_*`.

## Risks and checks

- **Free plans:** Supabase free projects pause; Vercel Hobby is non-commercial.
- **Backups:** turn on Supabase backups (Pro) or schedule `pg_dump`. Photos in a bucket are not backed up automatically.
- **Page cache on self-hosting:** Next.js keeps rendered pages on the server's disk. With several instances behind a load balancer, edits made in the admin may take up to 5 minutes to show on other instances. A single instance per dealership avoids this.
- **Privacy policy:** template text; have it reviewed by a lawyer before going live.
