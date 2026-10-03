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

Sem variáveis de ambiente, o site usa os dados de demonstração em `src/lib/data/seed.ts` e o painel fica desativado. Para usar o banco de dados, copie `.env.example` para `.env.local`, preencha `DATABASE_URL` e rode:

```bash
npm run db:migrate
npm run db:seed                 # opcional: loja de demonstração
npm run admin:create -- voce@loja.com.br "Seu Nome"
```

O painel fica em `/admin`.

## Verificações

```bash
npm run typecheck
npm run lint
npm test             # testes unitários (Vitest)
npm run build
npm run test:e2e     # jornadas no navegador (Playwright), desktop e mobile
```

## Onde mudar os dados da loja

Pelo painel em `/admin`: Configurações (nome, cores, WhatsApp, textos), Unidades, Veículos e Equipe.

## Hospedagem

Build `standalone` do Next.js: roda na Vercel e em qualquer servidor Node.js (plano Node.js da Hostinger ou VPS) sem mudar o código. Passo a passo em [`docs/DEPLOY.md`](docs/DEPLOY.md).
