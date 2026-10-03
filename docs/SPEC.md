# Project specification: white-label dealership website

Status: **approved**. Decisions from the product interview (rounds 1 to 5), plus later changes listed in section 13.

## 1. Product

A white-label website plus admin panel for Brazilian used and semi-new car dealerships. One codebase; each dealership gets its own deployment, database and identity (name, logo, accent color, light or dark theme).

- First version: a demo with a fictional dealership, **Vale Automóveis**, that evolves into the product sold to a real client.
- Target profile: mixed to premium stock, roughly R$ 60 mil to R$ 300 mil+.
- Scale: 50 to 200 vehicles, one dealership with one or more physical locations.
- Vehicles belong to the dealership. A vehicle's location only says where it is parked so the customer knows where to see it.
- Main goals: find a car fast, make each car desirable, generate leads (WhatsApp first, then forms).

## 2. Language

The entire customer-facing site **and** the admin panel are written in **Brazilian Portuguese (pt-BR)** from the start: navigation, buttons, forms, validation, empty/error/success states, metadata, accessibility labels and legal pages. Currency `R$ 129.900`, mileage `42.000 km`, Brazilian phone format, `dd/mm/aaaa` dates. Code, identifiers and technical comments are in English.

## 3. Visual language: "Grafite"

Restrained European premium. Large photography, firm typography, generous whitespace, one action color.

| Token | Decision |
|---|---|
| Theme | Light by default; a dark token set exists and each client picks light or dark in settings. Visitors get no toggle. |
| Neutrals | Cool greys (off-white background, graphite text). No pure black or white. |
| Accent | One color, configurable per client (default cobalt). The admin warns when a chosen accent fails WCAG AA contrast with white text. |
| Type | Geist for headings and text, Geist Mono for numbers and specs. Self-hosted via `next/font`. |
| Shape | Near-square corners (4px) everywhere. Stock cards are borderless: photo, text, price. |
| Client customization | Logo, name and accent color only. |
| Motion | Subtle: hero entrance, photo reveal on scroll, filter and button feedback, gallery transitions. Transform/opacity only. Fully disabled under `prefers-reduced-motion`. |

Design guidance comes from the project skill `design-taste-frontend`, with the user's "do not overdesign" brief taking precedence.

## 4. Sitemap

Public:

| Route | Page |
|---|---|
| `/` | Home |
| `/estoque` | Stock list with filters (state in the URL, e.g. `?marca=volkswagen&preco_max=150000`) |
| `/estoque/[slug]` | Vehicle page, e.g. `/estoque/volkswagen-t-cross-highline-250-tsi-2024-va0142` |
| `/financiamento` | Financing request form |
| `/venda-seu-carro` | Trade-in / sell your car form |
| `/sobre` | About the dealership |
| `/contato` | Contact and locations (address, hours, phone, map link) |
| `/politica-de-privacidade` | Privacy policy (template, must be reviewed by a lawyer) |
| `sitemap.xml`, `robots.txt`, 404 | Generated / pt-BR |

Admin (`/admin`, login required):

| Route | Module |
|---|---|
| `/admin/login` | Staff login |
| `/admin` | Dashboard: vehicles by status, new leads, recent leads, WhatsApp clicks per vehicle |
| `/admin/veiculos` | Vehicle list, create, edit, duplicate, delete, mark reserved/sold, feature, promotional price, photo upload and drag-to-reorder |
| `/admin/leads` | Lead inbox with statuses: Novo, Em contato, Negociação, Fechado, Perdido; internal notes |
| `/admin/unidades` | Locations |
| `/admin/configuracoes` | Dealership name, logo, accent, theme, WhatsApp, phone, email, social links, SEO defaults, "Por que comprar aqui" facts |

## 5. Features

**Navigation:** Estoque · Financiamento · Venda seu carro · Sobre · Contato, plus a "Falar no WhatsApp" button.

**Home, in order:**
1. Split hero: headline, search (Marca → Modelo limited to stock → Faixa de preço → "Buscar veículos"), large photo.
2. Destaques (featured vehicles chosen in the admin).
3. Navegue por categoria: body type (SUV, Sedã, Hatch, Picape) and price ranges.
4. Recém-chegados.
5. Financiamento and Venda seu carro as two side-by-side panels.
6. Por que comprar aqui: only facts the client fills in; empty items are hidden. No invented statistics or testimonials.
7. Unidades.

**Stock list:** left sidebar filters on desktop; "Filtrar" bottom sheet on mobile with live count ("Ver 32 veículos"). Visible filters: Marca, Modelo, Preço mín/máx, Ano mín/máx, Quilometragem máx, Câmbio, Combustível, Carroceria, Unidade. "Mais filtros": Cor, Opcionais. Sorting: Mais recentes, Menor preço, Maior preço, Menor quilometragem, Maior ano, Destaques. One column with large photos on mobile. Minimal, fully clickable cards (no WhatsApp button on cards). Empty result state: "Nenhum veículo encontrado" with a way to clear filters.

**Vehicle page:** desktop mosaic gallery (1 large + 4 small + "Ver todas as N fotos" → full-screen lightbox); mobile swipe carousel with counter. Title, year/model year, mileage, transmission, fuel, price (promotional price when set), location ("Disponível na unidade Centro"). Primary button "Falar no WhatsApp", secondary "Simular financiamento" (opens the financing form prefilled with the vehicle), links "Enviar proposta", "Tenho carro na troca", "Agendar visita". Specifications, grouped equipment list, seller description, location card. Similar vehicles. Mobile bottom bar: WhatsApp, Ligar, Simular.

**Vehicle statuses:** Disponível; Reservado (badge, stays listed); Vendido (removed from the list; page stays live with a "Vendido" notice and similar cars); Rascunho (not public). Badges: Oferta, Destaque, Único dono, Baixa km, Novidade.

**WhatsApp:** one central number per dealership; `https://wa.me/55DDDNUMERO?text=...` with a prefilled message containing model, year, price, vehicle code and page URL. Floating button on all pages except the vehicle page (which has the bottom bar). Each click increments an anonymous per-vehicle counter shown in the admin as a metric, never as a lead.

**Forms (all create a lead in the inbox):** Financiamento (simple form, no simulator, no rates shown), Venda seu carro / troca (no photo upload; the success screen offers a prefilled WhatsApp message to send photos), Proposta, Agendar visita, Contato. No email notifications in v1: the dealer checks the admin inbox.

**LGPD-conscious practices:** each form states what is collected and why; consent checkbox linked to the privacy policy; consent timestamp and policy version stored with the lead. No analytics, so no cookie banner. We do not claim legal compliance; the policy text needs legal review.

## 6. Data architecture

PostgreSQL (Supabase in production) accessed directly from the server, S3-compatible photo storage, and staff login built into the app. See section 13.

| Table | Purpose |
|---|---|
| `dealership_settings` | Single row: identity, theme, contacts, SEO, "por que comprar" facts |
| `locations` | Name, address, CEP, city/UF, phone, hours, map link, order |
| `vehicles` | Code, slug, brand, model, version, manufacture/model year, km, transmission, fuel, body type, color, doors, engine, power, plate final digit, price, promo price, status, featured, badges, location, description, equipment, timestamps |
| `vehicle_photos` | Vehicle, position, storage paths for 3 sizes, dimensions, alt text |
| `leads` | Type, status, contact data, optional vehicle, type-specific fields (JSON), consent, source URL, notes, timestamps |
| `whatsapp_clicks` | Vehicle, timestamp (no personal data) |
| `staff`, `sessions` | Staff accounts (scrypt password hashes) and login sessions |
| `rate_limits` | Hashed keys for form and login rate limiting |

- The browser never talks to the database. All reads and writes go through the server with `DATABASE_URL`. Row Level Security is enabled with no policies, which blocks Supabase's auto-generated public API.
- Form protection: server-side validation (pt-BR messages), honeypot field and rate limiting stored in Postgres (no Vercel KV).
- Photos: resized in the browser to fit upload limits, then the server generates WebP in 3 sizes (thumbnail, card, full screen), strips metadata (including GPS) and stores them in S3-compatible storage. No dependency on Vercel image optimization.

## 7. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript, `output: "standalone"` | Server rendering with cache and on-demand page updates; standalone build runs on any Node host |
| Styling | Tailwind CSS v4 with CSS-variable design tokens | Tokens make per-client accent and light/dark theming a config change |
| Motion | Motion (`motion/react`) in small client components only | Subtle motion without shipping it on every page |
| Icons | Phosphor | One consistent icon family |
| Database | PostgreSQL via `postgres` (Supabase in production) | Any Postgres works: Supabase, Neon, or one on a VPS |
| Login | Built in: scrypt hashes + session cookie | No auth vendor; works on any host |
| Photos | S3-compatible storage via `aws4fetch`, `sharp` for resizing | Supabase Storage, R2 or S3; local disk in development |
| Validation | Zod | Shared between forms and server actions |
| Tests | Vitest (unit), Playwright (journeys, visual checks at 4 widths) | Chromium is already available in the dev environment |

## 8. Hosting

**Now: Vercel.** The user has an account. The free Hobby plan is fine for the demo; a paying dealership requires the Pro plan under Vercel's terms. Supabase's free plan pauses after a week without access; a paying client needs Supabase Pro.

**Later: Hostinger.** The target plan isn't decided yet. The standalone Node build works on either:
- a Hostinger plan that runs Node.js apps (to be confirmed on the user's account), or
- a Hostinger VPS (Node + process manager + reverse proxy + SSL), which can host several dealerships on one server.

What stays the same during migration: all application code, the database, photos and staff accounts, environment variable names. What changes: where the app runs, DNS records and the cache/revalidation behavior (handled by Next.js itself in standalone mode). Vercel-specific services (Blob, KV, Vercel Postgres, Edge Config) are not used. `docs/DEPLOY.md` covers Vercel deployment, both Hostinger options, environment variables, DNS and risks.

## 9. SEO

Semantic HTML, one H1 per page, per-page metadata and Open Graph (vehicle cover photo), canonical URLs, dynamic sitemap, robots.txt, readable vehicle URLs, alt text. JSON-LD: `AutoDealer` per location; `Car` with `Offer` on vehicle pages (only properties the data actually supports).

## 10. Responsive strategy

Mobile first, designed for visitors arriving from Instagram, WhatsApp and Google. Breakpoints 640 / 768 / 1024 / 1280. Mobile: one-column cards, filter sheet, swipe gallery, bottom action bar, 44px minimum tap targets. Desktop: sidebar filters, mosaic gallery, sticky action panel on the vehicle page.

## 11. Implementation phases

1. **Setup:** Next.js project, tooling (lint, format, tests), Postgres schema and seed data, design tokens.
2. **Shell:** layout, navigation, footer, WhatsApp button, theme from settings.
3. **Public pages:** home, stock list and filters, vehicle page, about, contact.
4. **Leads:** all forms, validation, LGPD texts, privacy policy template.
5. **Admin:** login, dashboard, vehicles and photos, lead inbox, locations, settings.
6. **Quality:** SEO, accessibility, performance, motion polish.
7. **QA:** visual review at mobile/tablet/laptop/desktop, Playwright journeys (search → filter → vehicle → WhatsApp; financing; trade-in; empty search; invalid form), audit for stray English strings, `web-design-guidelines` review, code and security review.
8. **Deploy:** Vercel production setup, `docs/DEPLOY.md` including the Hostinger migration path.

## 12. Phase 2 candidates

Stock import from dealer management systems (XML/API feeds), Google reviews, financing simulator, trade-in photo upload, email or WhatsApp lead alerts, salesperson rotation, analytics with consent handling, video/360° photos.

## 13. Changes after approval

**2026-10-03, backend access (approved by the user):** the app uses Supabase as a standard PostgreSQL database plus S3-compatible storage, and staff login is built into the app instead of Supabase Auth. Reasons: the admin could be built and tested against a local Postgres in the development environment, and the app no longer depends on Supabase-specific APIs, which makes moving hosts easier. Trade-off: password reset is done by another staff member in Equipe (or with `npm run admin:create`), not by e-mail.
