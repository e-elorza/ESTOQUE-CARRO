# Progress

Spec: `docs/SPEC.md` (approved; see section 13 for the backend change). Deploy guide: `docs/DEPLOY.md`. Branch: `site-v1`.

## Done

**Public site** (phases 1 to 4): home, stock with filters, vehicle page, financing, trade-in, contact (question, proposal, visit), about, privacy policy, 404, sitemap, robots, JSON-LD. Lead forms validate on the server, require consent and are rate limited.

**Backend:**
- PostgreSQL via `DATABASE_URL` (`src/lib/db.ts`), schema in `db/migrations/0001_init.sql`, scripts: `npm run db:migrate`, `npm run db:seed`, `npm run admin:create`.
- Public data cached by tag and refreshed immediately after admin edits (`src/lib/data/index.ts`). Without `DATABASE_URL`, the public site falls back to the demo seed.
- Leads stored in Postgres; anonymous WhatsApp click counter (`/api/whatsapp-click`).
- Photo storage: S3-compatible (`S3_*` vars) or local disk served by `/media/...` (`src/lib/storage.ts`).

**Admin** (`/admin`, phase 5):
- Login with scrypt-hashed passwords and session cookies, login rate limit, forced password change for temporary passwords, logout.
- Painel: stock and lead numbers, cars without photos, recent leads, WhatsApp clicks (30 days).
- Destaques (2026-10-20): up to 5 staff picks for "Destaques da semana", ordered with arrows (1st = home hero), each valid for 7/14/30 days and renewable; free slots filled automatically by WhatsApp clicks in the last 7 days, then newest arrivals, preferring cars with photos (`src/lib/featured.ts`, `/admin/destaques`, migration `0002_featured_slots.sql`). The vehicle page shows the pick and has "Destacar por 7 dias". The old `featured` column is kept in sync for rollback; drop it later.
- Veículos: list with search and status tabs; create/edit with full form (pt-BR validation); quick status (disponível, reservado, vendido); duplicate; delete with inline confirmation; photos with browser-side resize, server WebP in 3 sizes (metadata stripped), drag or arrow reordering, cover = first photo.
- Leads: inbox with status and type filters; detail with "Responder no WhatsApp", call, request details, consent record, status and internal notes, permanent deletion (LGPD requests).
- Unidades, Configurações (identity, accent color with contrast check, light/dark theme, contacts, "Por que comprar aqui", SEO), Equipe (create access with temporary password, reset, remove), Minha conta.

**Tests:** 23 unit tests; 24 Playwright tests passing (16 public journeys on desktop and mobile, 8 admin journeys on desktop, which need a database). Run e2e without the `S3_*` vars (the photo test expects local storage) and clear `rate_limits` between repeated runs (lead forms allow 5 per window).

**Quality pass (phases 6 and 7, 2026-10-03):**
- `web-design-guidelines` review applied: image dimensions, `overscroll-behavior: contain` on dialogs and sheets, no spellcheck on e-mail and password fields, `touch-action: manipulation`, `translate="no"` on the brand name, confirmation before deleting a photo, unsaved-changes warning on the vehicle and settings forms, `content-visibility` on long admin lists. Skipped on purpose: "Title Case" (English convention; pt-BR uses sentence case).
- Lighthouse (mobile, production build): performance 94–97 in Lighthouse's simulated mode, 96–99 with real throttling; accessibility, best practices and SEO 100 on home, stock, vehicle and financing pages. Real-throttling LCP about 1.0 s on home and vehicle pages, CLS 0. Changes: inline CSS (`experimental.inlineCss`), hero entrance slides without fading so it counts as painted, darker warning color (5.0:1), visible-to-screen-readers sort label on mobile.
- Dark theme checked on public pages; the financing panel now stays dark in both themes (`--panel` token).
- `design-taste-frontend` pre-flight: no em-dashes, no eyebrows, no duplicate CTA wording per page, middle dots removed.

## Next

> 2026-10-19: **Live and verified** at https://estoque-carro-elorza.vercel.app (Vercel project `estoque-carro`, team `elorza`, production branch `site-v1`, functions in `gru1`). Supabase migrated and seeded; admin `enriconelorza@gmail.com` logs in; a photo uploaded through the admin shows on the public site (S3 bucket `vehicle-bucket`). DB: Supabase **Transaction pooler** (port 6543) with prepared statements and pipelining disabled in `src/lib/db.ts` (`max_pipeline: 0`); pipelining gave mixed-up/empty results and hung logins, and the Session pooler (5432) hit its 15-client limit on Vercel. Gotchas: the build pre-renders vehicle pages, so it fails if the database is paused or unmigrated, and needs the S3 keys; Supabase free plan pauses after ~1 week idle (use Pro for a client); Hobby keeps runtime logs for 1 hour.

2. Replace placeholder photos with real ones through the admin; re-run Lighthouse with photos.
3. Phase 2 ideas from the spec: stock feed import, Google reviews, financing simulator, lead alerts, logo upload in Configurações.

## Running locally with a database

```bash
export DATABASE_URL=postgres://postgres@localhost:5433/concessionaria
npm run db:migrate && npm run db:seed
ADMIN_PASSWORD=senha-teste-123 npm run admin:create -- admin@valeautomoveis.com.br "Admin Demo"
npm run build && npm run test:e2e   # cloud sessions: CHROMIUM_PATH=/opt/pw-browsers/chromium
```
In cloud sessions a Postgres 16 server is available: initialize a data dir owned by `postgres` and start it on port 5433 with `runuser -u postgres -- pg_ctl ...`.
