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
- Veículos: list with search and status tabs; create/edit with full form (pt-BR validation); quick status (disponível, reservado, vendido); duplicate; delete with inline confirmation; photos with browser-side resize, server WebP in 3 sizes (metadata stripped), drag or arrow reordering, cover = first photo.
- Leads: inbox with status and type filters; detail with "Responder no WhatsApp", call, request details, consent record, status and internal notes, permanent deletion (LGPD requests).
- Unidades, Configurações (identity, accent color with contrast check, light/dark theme, contacts, "Por que comprar aqui", SEO), Equipe (create access with temporary password, reset, remove), Minha conta.

**Tests:** 13 unit tests; 23 Playwright tests (16 public journeys on desktop and mobile, 7 admin journeys, which need a database).

## Next

1. Connect the real Supabase project (see `docs/DEPLOY.md`), then deploy to Vercel.
2. Phase 6 and 7: `web-design-guidelines` review, Lighthouse, dark theme pass, final pre-flight from `design-taste-frontend`.
3. Phase 2 ideas from the spec: stock feed import, Google reviews, financing simulator, lead alerts, logo upload in Configurações.

## Running locally with a database

```bash
export DATABASE_URL=postgres://postgres@localhost:5433/concessionaria
npm run db:migrate && npm run db:seed
ADMIN_PASSWORD=senha-teste-123 npm run admin:create -- admin@valeautomoveis.com.br "Admin Demo"
npm run build && npm run test:e2e   # cloud sessions: CHROMIUM_PATH=/opt/pw-browsers/chromium
```
In cloud sessions a Postgres 16 server is available: initialize a data dir owned by `postgres` and start it on port 5433 with `runuser -u postgres -- pg_ctl ...`.
