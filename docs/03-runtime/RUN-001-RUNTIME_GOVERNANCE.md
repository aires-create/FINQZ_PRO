Status: ACTIVE
Version: 1.0
Last Updated: 2026-06-03

## Runtime Architecture

### Runtime Enterprise Fastify

- Kernel HTTP oficial: `backend/src/core/http/fastify.ts`
- Bootstrap operacional atual: `backend/src/server.ts`
- Bootstrap enterprise recomendado: `backend/src/server.fastify.ts`
- Build/produção atual: `node dist/server.js`
- Base oficial de rotas: `/api/v1/*`

### Módulos Enterprise

- Auth
- CRM
- Users
- Commercial
- Integrations
- Organizations
- Audit

### Endpoints Infra

- /health
- /ready
- /metrics
- Swagger/OpenAPI

---

## Runtime Compatibility

`backend/src/server.ts` deve ser tratado como bootstrap operacional atual.

`backend/src/server.fastify.ts` deve ser tratado como bootstrap enterprise recomendado.

`backend/src/core/http/fastify.ts` deve ser tratado como kernel HTTP oficial.

---

## Runtime Classification

| Arquivo | Classificação | Observação |
|----------|----------|----------|
| backend/src/core/http/fastify.ts | OFFICIAL_KERNEL | Kernel HTTP oficial |
| backend/src/server.ts | OPERATIONAL_BOOTSTRAP | Bootstrap operacional atual |
| backend/src/server.fastify.ts | TARGET_BOOTSTRAP | Bootstrap enterprise recomendado |
| backend/src/app.ts | COMPAT_FACTORY | Factory/wrapper Fastify |
| backend/src/index.ts | PARALLEL_RUNTIME | Hono/EdgeSpark SDR IA |
| backend/src/modules/auth/legacy.routes.ts | LEGACY | Express legado |
| backend/src/modules/users/routes.ts | LEGACY | Placeholder legado |
| backend/src/modules/auth/routes/auth.routes.ts | ORPHAN | Arquivo vazio |

---

## Startup Flows

### Local Dev Atual

Comando:

npx tsx src/server.ts

Status:

OPERACIONAL

### Local Dev Enterprise Recomendado

Comando:

npx tsx src/server.fastify.ts

Status:

TARGET

### Build

Comando:

npm run build

Resultado:

dist/*

### Staging / Homologação / Produção

Comando:

node dist/server.js

Status:

BOOTSTRAP OPERACIONAL ATUAL

---

## Governance Rules

1. Não criar novo runtime sem documento de governança aprovado.
2. Novas APIs backend devem seguir `/api/v1/*`.
3. Não introduzir novos endpoints legados em `/api/*`.
4. Toda rota nova deve declarar runtime dono, contrato, observabilidade e segurança.
5. Runtime experimental deve permanecer isolado.
6. Nenhum endpoint paralelo deve ser promovido ao core sem ADR.
7. Bootstrap operacional atual e bootstrap alvo devem permanecer documentados até consolidação.