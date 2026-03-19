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

## Variáveis de ambiente

Use [`.env.example`](/home/rogerio/psico-all-lives/app/.env.example) como modelo.

- `DATABASE_URL`: conexão do PostgreSQL
- `NEXTAUTH_URL`: URL pública da aplicação
- `JWT_SECRET`: segredo dos access/refresh tokens
- `CPF_HMAC_SECRET`: segredo para anonimização determinística de CPF
- `APP_ENCRYPTION_KEY`: chave AES-256-GCM em hex para TOTP
- `ANTHROPIC_API_KEY`: chave da integração Anthropic
- `ENABLE_PUBLIC_RESULTS`: mantenha `false` por padrão

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
