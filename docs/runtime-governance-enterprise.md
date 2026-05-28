# FINQZ PRO - Runtime Governance Enterprise

## Executive Summary
O FINQZ PRO possui um runtime oficial enterprise em Fastify e um runtime paralelo de experimentação em Hono/EdgeSpark.  
O runtime oficial serve a API principal em `/api/v1/*` com governança de autenticação, tenant context, RBAC, observabilidade e integrações.  
O runtime paralelo concentra SDR IA (`/api/sdr/*`) e não faz parte do build oficial do backend enterprise.  
Risco principal atual: ambiguidade operacional (bootstraps múltiplos), endpoints fantasma no frontend e coexistência de contratos legados `/api/*`.

## Runtime Architecture

### Runtime oficial enterprise
- Entrypoint principal operacional: `backend/src/server.fastify.ts`
- App factory oficial: `backend/src/core/http/fastify.ts`
- Base oficial de rotas: `/api/v1/*`
- Módulos registrados:
  - Auth
  - CRM
  - Users
  - Commercial
  - Integrations
  - Organizations
  - Audit
- Endpoints infra:
  - `/health`
  - `/ready`
  - `/metrics`
  - Swagger/OpenAPI (`config.swagger.path`)

### Wrappers de compatibilidade
- `backend/src/server.ts` usa `createApp()` de `backend/src/app.ts`, que delega para `buildFastifyApp()`.
- Funciona como bootstrap compatível do mesmo runtime Fastify.

### Runtime paralelo
- `backend/src/index.ts`
- Stack: Hono + EdgeSpark + Drizzle
- Escopo: SDR IA e experimentação edge
- Endpoints mapeados: `/api/sdr/*`
- Fora do build oficial Fastify enterprise.

## Runtime Classification

| Arquivo | Classificação | Observação |
|---|---|---|
| `backend/src/core/http/fastify.ts` | OFFICIAL | Kernel HTTP oficial |
| `backend/src/server.fastify.ts` | OFFICIAL | Bootstrap enterprise recomendado |
| `backend/src/app.ts` | COMPAT | Wrapper/factory para Fastify |
| `backend/src/server.ts` | COMPAT | Bootstrap compatível do Fastify |
| `backend/src/index.ts` | PARALLEL_RUNTIME | Hono/EdgeSpark SDR IA |
| `backend/src/modules/auth/legacy.routes.ts` | LEGACY | Express legado não oficial do runtime Fastify atual |
| `backend/src/modules/users/routes.ts` | LEGACY | Express legado/placeholder |
| `backend/src/modules/auth/routes/auth.routes.ts` | ORPHAN | Arquivo vazio, sem uso |

## Startup Flows

### Local dev (enterprise)
- Objetivo: subir backend enterprise oficial.
- Bootstrap recomendado: `server.fastify.ts`.
- Comando operacional recomendado:
  - `npx tsx src/server.fastify.ts` (executado em `backend/`).

### Local dev (compatibilidade)
- `npm run dev` atualmente aponta para `src/server.ts`.
- Este fluxo ainda sobe Fastify oficial via wrapper compat, mas aumenta ambiguidade operacional.

### Staging / Produção
- Runtime alvo: Fastify enterprise.
- Build: `npm run build` (backend) -> `tsc`.
- Start scripts atuais: `node dist/server.js` (compat bootstrap compilado).
- Dependências obrigatórias:
  - PostgreSQL disponível
  - Redis disponível (readiness exige ambos)

### O que NÃO usar para backend enterprise
- `backend/src/index.ts` (Hono/EdgeSpark) não deve ser tratado como API enterprise principal.

## Runtime Responsibilities

### Fastify enterprise (`/api/v1/*`)
- Auth/session
- CRM
- Users
- Commercial tables
- Integrations/provider governance
- Organizations
- RBAC e tenant context middleware
- Audit
- Swagger/OpenAPI
- Health/ready/metrics

### Hono/EdgeSpark paralelo
- SDR IA (`/api/sdr/*`)
- Experimentação de IA no edge
- Fluxos não consolidados no runtime enterprise principal

## Ghost Endpoints

### Endpoints paralelos
- `/api/sdr/*`
  - Existe no runtime Hono/EdgeSpark (`backend/src/index.ts`)
  - Não existe no Fastify oficial.

### Endpoints fantasma no contexto Fastify enterprise
- `/api/conversations*`
- `/api/audiences*`
- `/api/eventos*`
- `/api/campanhas*`
- `/api/oportunidades*`

Situação: não foram encontrados como rotas registradas no runtime Fastify oficial em `core/http/fastify.ts`.

## Frontend Dependencies

| Tela | Endpoint consumido | Runtime responsável atual | Existe no Fastify oficial? | Status |
|---|---|---|---|---|
| `SdrIaHub.tsx` | `/api/sdr/*` | Hono/EdgeSpark | Não | PARALLEL_DEPENDENCY |
| `Conversas.tsx` | `/api/conversations*` | Não definido no runtime oficial | Não | GHOST |
| `Audiencias.tsx` | `/api/audiences*` | Não definido no runtime oficial | Não | GHOST |
| `Eventos.tsx` | `/api/eventos*` | Não definido no runtime oficial | Não | GHOST |
| `Campanhas.tsx` | `/api/campanhas*` + `/crm/clientes` | Campanhas fantasma; CRM no Fastify | Parcial | HYBRID |
| `Oportunidades.tsx` | `/api/oportunidades*` | Não definido no runtime oficial | Não | LEGACY/GHOST |

## Governance Rules

1. Não criar novo runtime sem documento de governança aprovado.
2. Novas APIs backend devem seguir `/api/v1/*`.
3. Não introduzir novos endpoints legados em `/api/*` fora da estratégia formal.
4. Bootstrap oficial enterprise deve ser explícito e único em runbook operacional.
5. Runtime experimental deve ficar isolado e rotulado como não-oficial para operação core.
6. Toda rota nova deve declarar: runtime dono, contrato, observabilidade e segurança.
7. Não promover endpoint paralelo para produção enterprise sem passagem por checklist de consolidação.

## Consolidation Strategy (Future, no-code)

1. Congelar a definição operacional do runtime enterprise Fastify.
2. Mapear oficialmente contratos usados por telas que ainda dependem de endpoints fantasma.
3. Definir destino de SDR IA:
   - manter paralelo com boundary formal, ou
   - incorporar gradualmente no runtime Fastify com contrato governado.
4. Migrar frontend por ondas pequenas para endpoints oficiais existentes.
5. Encerrar legados apenas após observabilidade, testes e rollback plan.

## P0 / P1 / P2

### P0
- Eliminar ambiguidade operacional de bootstrap no runbook.
- Tratar dependências frontend em endpoints fantasma.

### P1
- Formalizar ownership de runtime paralelo SDR IA.
- Publicar matriz endpoint -> runtime -> SLA interno.

### P2
- Planejar unificação gradual de contratos legados `/api/*` para `/api/v1/*`.
- Reduzir superfície de rotas órfãs/legacy após estabilização.

## Safe Next Steps

1. Publicar este documento como referência oficial de runtime governance.
2. Validar com times de backend, frontend e operações o runtime enterprise único.
3. Abrir trilha de migração operacional por feature (sem refatoração ampla).
4. Só então priorizar consolidação técnica com mudanças pequenas e verificáveis.
