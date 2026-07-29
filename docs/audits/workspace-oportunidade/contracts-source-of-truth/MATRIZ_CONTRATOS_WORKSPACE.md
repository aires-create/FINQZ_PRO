# Matriz de Contratos da Workspace

| Contrato | Rota | Consumidor | Provedor | Runtime | Status | Evidência | Recomendação |
|---|---|---|---|---|---|---|---|
| `crmRoutes` | `/api/v1/crm/*` | Frontend CRM e partes da Workspace | `backend/src/modules/crm/routes.ts` | Fastify oficial | ativo | `backend/src/core/http/fastify.ts:541-547`, `backend/src/modules/crm/routes.ts` | preservar |
| `Opportunity` Prisma | tabela `opportunities` | backend enterprise, middlewares, RBAC | `backend/prisma/schema.prisma` | banco/backend | oficial | `backend/prisma/schema.prisma:474-521` | preservar |
| permissões `opportunity:*` | seed RBAC | runtime enterprise | `backend/prisma/seed.ts` | banco/seed | oficial | `backend/prisma/seed.ts:380-413`, `839-906` | preservar |
| `enterpriseTenantGuard` + `prisma.opportunity` | middleware enterprise | proteção tenant-scoped | `backend/src/middlewares/enterprise.ts` | Express middleware | ativo | `backend/src/middlewares/enterprise.ts:15-25` | preservar |
| `/api/oportunidades` | legacy/compat endpoint | `src/api/client.ts`, `src/api/dataService.ts`, `src/api/modules/oportunidades.api.ts` | `backend/server/src/index.ts` e `backend/src/index.ts` | runtime alternativo | compatibilidade ativa | `src/api/client.ts:134-156`, `src/api/modules/oportunidades.api.ts:33-85` | consolidar |
| `/api/oportunidades/pipeline` | pipeline compat | workspace e wrappers | runtime alternativo | runtime alternativo | compatibilidade ativa | `src/api/client.ts:141-142`, `backend/server/src/index.ts:2135-2171` | consolidar |
| `/api/oportunidades/:id` | detalhe compat | workspace e wrappers | runtime alternativo | runtime alternativo | compatibilidade ativa | `src/api/client.ts:143-156`, `backend/server/src/index.ts:2171-2206` | consolidar |
| `/api/opportunidades/:id/mover` | mover etapa | wrapper legado | não confirmado no bootstrap oficial | compat/alias | não comprovado no backend oficial | `src/api/modules/oportunidades.api.ts:74-84` | investigar |
| `/api/sdr/opportunity` | criação SDR | fluxo SDR e automação | `backend/src/index.ts` e `backend/server/src/index.ts` | runtime alternativo | ativo em runtime alternativo | `backend/src/index.ts:380-452`, `backend/server/src/index.ts:5597-5653` | preservar enquanto houver uso |
| `finqz-pro-storage` | estado da UI | Workspace | Zustand persist | frontend | ativo | `src/store/index.ts:928-948` | conter a UI |
| `finqz_opportunities` | cache local | simulator repository | localStorage | frontend | ativo | `src/data/simulatorRepository.ts:348-364` | tratar como fallback |
| `finqz_oportunities` | cache local | simulator repository | localStorage | frontend | ativo | `src/data/simulatorRepository.ts:348-364` | tratar como fallback |
| `simulatorRepository.createOpportunityFromAcceptedProposal` | oportunidade local | simulador standalone | localStorage | frontend | ativo | `src/data/simulatorRepository.ts:275-327` | preservar apenas para compatibilidade |
| `src/pages/Oportunidades.tsx` | workspace principal | usuário final | frontend React | frontend | ativo | `src/pages/Oportunidades.tsx:388-4995` | preservar fluxo atual até contrato oficial estar consolidado |

## Leitura da matriz

- `oficial` significa que a entidade/contrato está presente em modelo, autorização ou rota oficial do backend enterprise.
- `compatibilidade ativa` significa que existe consumo real no frontend e algum runtime responde, mas o contrato não é o bootstrap Fastify oficial.
- `fallback` significa comportamento local usado quando a API não entrega a experiência completa.
- `investigar` significa que há referência de uso, mas não foi possível provar o registro oficial nesta auditoria.
