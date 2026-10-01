@AGENTS.md

# Project notes

White-label website + admin for Brazilian used-car dealerships. Read `docs/SPEC.md` (approved spec) and `docs/PROGRESS.md` (what is done, what is next) before working.

- **Language:** every user-facing string (public site and admin) is Brazilian Portuguese (pt-BR). Code and comments in English.
- **Design:** "Grafite" tokens in `src/app/globals.css`; follow `.claude/skills/design-taste-frontend` with the spec's "do not overdesign" brief taking precedence. One accent color, 4px radius, no em-dashes in copy.
- **Data:** pages import only from `src/lib/data`. It reads the demo seed until Supabase env vars exist.
- **Portability:** `output: "standalone"`; no Vercel-only services (Blob, KV, Vercel Postgres, Edge Config). Must stay deployable to a Hostinger Node.js plan or VPS.
- **Checks before pushing:** `npm run typecheck && npm run lint && npm test && npm run build && npm run test:e2e`. In cloud sessions run e2e with `CHROMIUM_PATH=/opt/pw-browsers/chromium`.
