# Site white-label para concessionárias

Site e painel administrativo para lojas de seminovos, em português do Brasil. Demonstração com a loja fictícia **Vale Automóveis**.

- Especificação aprovada: [`docs/SPEC.md`](docs/SPEC.md)
- Andamento e próximos passos: [`docs/PROGRESS.md`](docs/PROGRESS.md)

## Rodar localmente

Requisitos: Node.js 20.9 ou mais recente.

```bash
npm install
npm run dev          # http://localhost:3000
```

Sem variáveis de ambiente, o site usa os dados de demonstração em `src/lib/data/seed.ts`. Para conectar o Supabase, copie `.env.example` para `.env.local` e preencha.

## Verificações

```bash
npm run typecheck
npm run lint
npm test             # testes unitários (Vitest)
npm run build
npm run test:e2e     # jornadas no navegador (Playwright), desktop e mobile
```

## Onde mudar os dados da loja

Hoje: `src/lib/data/seed.ts` (nome, cores, WhatsApp, unidades, estoque). Depois da conexão com o Supabase: pelo painel em `/admin`.

## Hospedagem

Build `standalone` do Next.js: roda na Vercel e em qualquer servidor Node.js (plano Node.js da Hostinger ou VPS) sem mudar o código. Detalhes em `docs/DEPLOY.md` (fase final).
