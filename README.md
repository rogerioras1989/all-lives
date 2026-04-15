# DRPS All Lives

Aplicação full-stack em Next.js para campanhas de diagnóstico de riscos psicossociais com coleta anônima, dashboard por tenant e backoffice multi-tenant da All Lives.

## Stack

- Next.js App Router
- React + TypeScript
- Prisma + PostgreSQL
- JWT + cookies HttpOnly
- Tailwind/PostCSS
- Recharts e React PDF

## Requisitos

- Node.js 22.x
- PostgreSQL acessível pela `DATABASE_URL`

## Setup

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Abra `http://localhost:3000`.

## Scripts úteis

- `npm run dev` — servidor Next em modo desenvolvimento
- `npm run build` — gera client Prisma e build de produção
- `npm run lint` — ESLint (com regras jsx-a11y)
- `npm run typecheck` — verificação de tipos sem emitir
- `npm test` — testes Vitest
- `npm run test:watch` — Vitest em modo watch
- `npm run db:seed` / `db:seed:demo` / `db:seed:demo-responses` — seeds do banco
- `npm run security:migrate-hr-keys` — migra chaves de integração legadas para hash

## Variáveis de ambiente

Copie `.env.example` (na raiz do projeto) para `.env` e preencha:

- `DATABASE_URL`: conexão do PostgreSQL
- `NEXTAUTH_URL`: URL pública da aplicação
- `JWT_SECRET`: segredo dos access/refresh tokens
- `AUTH_RATE_LIMIT_SECRET`: segredo do rate limiter persistido (opcional — cai pra `JWT_SECRET`)
- `CPF_HMAC_SECRET`: segredo para anonimização determinística de CPF
- `APP_ENCRYPTION_KEY`: chave AES-256-GCM em hex (32 bytes) usada por TOTP **e** pela criptografia em repouso de campos sensíveis (ex.: descrição de denúncia anônima)
- `ANTHROPIC_API_KEY`: chave da integração Anthropic
- `ENABLE_PUBLIC_RESULTS`: mantenha `false` por padrão
- `LOG_LEVEL`: opcional, default `info` em produção e `debug` em dev
- `NEXT_PUBLIC_ENABLE_DEV_BYPASS`: opcional. Quando `true` **e** o ambiente não é produção, exibe um botão de login rápido nas páginas `/acesso/*` e `/consultor/login` que entra com as credenciais demo seedadas. Útil para QA local — **nunca** habilitar em produção

## Rotas principais

- `/consultor/login`: login All Lives
- `/consultor`: dashboard global multi-tenant
- `/login`: login da empresa
- `/dashboard`: analytics do tenant
- `/portal`: portal do colaborador
- `/r/[slug]`: link externo anônimo da campanha

## Segurança operacional

- Nunca versionar `.env` com segredos reais.
- Rotacionar segredos ao criar novo ambiente.
- Manter `ENABLE_PUBLIC_RESULTS=false` salvo necessidade formal de compartilhamento público.
