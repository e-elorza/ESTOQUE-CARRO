# Progress

Spec: `docs/SPEC.md` (approved). Branch: `site-v1`.

## Done

**Phase 1–3 (setup, shell, public pages)** and most of **phase 4 (lead forms)**, running on demo data:

- Next.js 16 + TypeScript + Tailwind v4, standalone output, Geist fonts self-hosted via the `geist` package.
- Grafite design tokens (light + dark), per-dealership accent with automatic readable text color (`src/lib/theme.ts`).
- Header, mobile menu, footer, floating WhatsApp button (hidden on vehicle pages).
- Home: hero with search (brand → model → price range), featured, categories, new arrivals, financing + trade-in panels, "Por que comprar aqui", locations.
- Stock (`/estoque`): sidebar filters on desktop (live), bottom-sheet filters on mobile with live count, sorting, removable filter chips, pagination, empty state, loading skeleton. Filter state lives in the URL.
- Vehicle page: mosaic gallery + lightbox (desktop), swipe carousel with counter (mobile), summary and actions, specs, grouped equipment, description, location card, similar cars, mobile action bar, JSON-LD `Car` + `Offer`, sold and reserved states.
- Forms with server-side validation (zod, pt-BR messages), consent checkbox, honeypot, in-memory rate limit: Financiamento, Venda seu carro / troca, Contato (dúvida, proposta, visita). In demo mode leads are only logged (type + vehicle code, no personal data).
- Sobre, Política de Privacidade (template, needs legal review), 404 and error pages, sitemap, robots.txt.
- Supabase schema with RLS and storage bucket: `supabase/migrations/20261001000000_init.sql` (not applied yet).
- Tests: 13 unit (`npm test`), 16 Playwright journeys on desktop + mobile (`npm run test:e2e`), all passing.

## Next

1. **Connect Supabase** (needs the three env vars and network access to `*.supabase.co`, see `.env.example`):
   - apply the migration; generate `supabase/seed.sql` from `src/lib/data/seed.ts`;
   - add `@supabase/supabase-js` + `@supabase/ssr`; implement the Supabase branch of `src/lib/data/index.ts` and `src/lib/data/leads.ts` (insert lead, Postgres rate limit with hashed key);
   - WhatsApp click counter (server action + `whatsapp_clicks`).
2. **Admin (phase 5):** login (Supabase Auth, `proxy.ts` guard), dashboard, vehicles CRUD with photo upload → `sharp` resize to 3 WebP sizes → Storage, drag-to-reorder, lead inbox with statuses and notes, locations, settings (with accent contrast warning). Revalidate pages with `updateTag`/`revalidatePath` after edits.
3. **Phase 6–7:** run `web-design-guidelines` review, Lighthouse, dark theme visual pass, final pre-flight from `design-taste-frontend`.
4. **Phase 8:** Vercel project + `docs/DEPLOY.md` (Vercel now, Hostinger Node.js plan or VPS later).

## Notes

- Demo photos are intentionally placeholders (user's choice); real photos come through the admin.
- `/estoque` list lives in the `(lista)` route group so its `loading.tsx` doesn't wrap vehicle pages (otherwise missing cars stream with HTTP 200 instead of 404).
