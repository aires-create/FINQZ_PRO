# BLOCO C — Auditoria Técnica: Consistência e Sincronização

Data: 2026-07-31
Auditor: Engenharia Sênior (atividade controlada: leitura, inspeção, documentação)

Resumo executivo
-----------------
Esta auditoria mapeia o fluxo ponta-a-ponta entre Pipeline, UI (card), Workspace, camada de compatibilidade/estado e backend (API + Prisma). O Bloco B (3710a21) foi validado e corrigiu a resolução de `stageLabel` no modal; a auditoria do Bloco C documenta onde os campos nascem, como são transformados e os gaps remanescentes. Nenhum risco P0 foi identificado durante a inspeção automatizada/manual do código; as prioridades e recomendações seguem abaixo.

1) Estado inicial verificado
- Diretório: C:\Projects\FINQZ_PRO_HML_PROMOTION
- Branch: promotion/hml-g18-full
- Commit UI/funcional (Bloco B): `3710a21b1d36bb916e5cf86b56945df4739cb9b6`
- Commit documental: `36bf480e4c57dd88f088033af84958e33575c83d`
- Remoto: origin (https://github.com/aires-create/FINQZ_PRO.git)
- Worktree: clean (apenas novo relatório não rastreado antes desta criação)

2) SSOT consultada
- docs/00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md — Documento Mestre de Continuidade (canônico)
- docs/audits/workspace-oportunidade/MATRIZ_EXECUTIVA_ACOES_PRIORITARIAS.md
- docs/audits/workspace-oportunidade/BLOCO_B_REGRESSAO_FUNCIONAL_CARD.md
- docs/audits/workspace-oportunidade/BLOCO_C_PLANO_EXECUCAO.md
- docs/audits/workspace-oportunidade/contracts-source-of-truth/MATRIZ_FONTE_VERDADE_WORKSPACE.md
- docs/audits/workspace-oportunidade/phase-a/CONTRATO_CANONICO_WORKSPACE.md
- backend/prisma/schema.prisma (modelo `Opportunity`)
- src/api/modules/opportunities.api.ts (contrato cliente)

3) Arquitetura observada (resumo)
Pipeline (cards) → frontend card handlers (`handleOpenLead`, drag/drop handlers) → normalizador (`normalizeOpportunityWorkspace`) → Zustand store (`useAppStore`, `oportunidadesKanban`, `moveOportunidade`) ↔ API client (`src/api/modules/opportunities.api.ts`) → Backend controllers → Prisma (`model Opportunity`) → response → UI reconciliação.

4) Inventário dos campos (principais)
Campo | Nome na UI | Nome na API | Nome no Backend/Prisma | Fonte canônica | Persistido?
- id | id | id | id | Backend/Prisma | Sim
- tenantId | tenantId / tenant_id | tenantId | tenantId | Backend/Prisma | Sim
- pipelineId | pipelineId | pipelineId | pipelineId | Backend/Prisma | Sim
- stageId / etapa_id | stageId / etapa_id | stageId | stageId | Backend/Prisma | Sim
- stageLabel | stageLabel / derived.stageLabel | (não persistido) | derivado via Stage.name | Derived (normalizer + catalog) | Não (derivado)
- title / name | title / nome | title | title | Backend/Prisma | Sim
- amount / valor | amount / valor | amount | amount (Float) | Backend/Prisma | Sim
- customerId / cliente | customerId | customerId | customerId | Backend/Prisma | Sim
- productId / produto | productId | productId | productId | Backend/Prisma | Sim
- ownerId / responsavel | ownerId | ownerId | ownerId | Backend/Prisma | Sim
- status | status | status | status | Backend/Prisma | Sim
- createdAt / updatedAt | createdAt / updatedAt | createdAt / updatedAt | createdAt / updatedAt | Backend/Prisma | Sim
- tags, notes, tasks, attachments, history | tags / notes | campos diversos (UI/local) | várias relações | Mistos (backend + local) | Depende (alguns persistidos)

Observação: `stageLabel` é resolvido pela camada de normalização (catalogo de etapas) e não é o campo canônico persistido; o canônico é `stageId` (Prisma `stageId`). O contrato do cliente (`src/api/modules/opportunities.api.ts`) expõe `stageId` e também objetos relacionados (`stage`, `pipeline`, `customer`) que contêm `name`/`title` usados para labels.

5) Matriz campo a campo (resumo selecionado)
- Campo: `stageId` / `etapa_id`
  - UI: manipulado por drag/drop e selects; usado diretamente em payloads de update/move
  - API: `moveStage` endpoint (PATCH /api/v1/opportunities/:id/stage) e `update` (PUT)
  - Backend/Prisma: `Opportunity.stageId` (modelo Prisma)
  - Fonte canônica: Backend/Prisma
  - Persistido: Sim
  - Derived: `stageLabel` (via Stage.name)
  - Risco: concorrência em updates simultâneos (ver seção concorrência)

- Campo: `amount` / `valor`
  - UI: edição no formulário da oportunidade
  - API: `update`/`create` payload (`amount: number` em opportunities.api.ts)
  - Backend/Prisma: `Opportunity.amount` (Float)
  - Fonte canônica: Backend/Prisma
  - Persistido: Sim
  - Risco: perda de precisão se conversões/formatação locais ocorrerem sem coordenação

- Campo: `customerId` / `cliente`
  - UI: vinculação por selecção, intake cria/associa cliente via `createIntake`
  - API: `createIntake`, `update` payloads com `customerId`
  - Backend/Prisma: `Opportunity.customerId` e relação `Customer`
  - Fonte canônica: Backend/Prisma

6) Matriz de fluxos (exemplos principais)
- Fluxo: abrir card (read)
  - Origem: card UI (click) → `handleOpenLead(lead)` in `src/pages/Oportunidades.tsx` → `setSelectedLead(normalizeOpportunityWorkspace(lead, { stageCatalog }))` → modal shows `selectedLead` (derived labels).
  - Persiste: leitura apenas.

- Fluxo: mudar etapa (drag/drop)
  - Handler UI: drag/drop handler → optimistic update in store (`moveOportunidade` / `moveOportunidade(id, { etapa_id })`) → call `opportunitiesApi.moveStage(id, { stageId, pipelineId })` → backend updates Prisma `stageId` → backend returns updated opportunity → store reconciles and UI refreshes card.

- Fluxo: atualizar valor / editar oportunidade
  - Handler UI: form submit → call `opportunitiesApi.update(id, payload)` (PUT) → backend validates and updates Prisma `amount` → returns updated resource → store updates → UI refresh.

7) Frontend (handlers, normalizadores, stores, gaps)
- Arquivos principais: `src/pages/Oportunidades.tsx` (handler `handleOpenLead`, normalizer usage, many references a `etapa_id`), `src/components/pipeline/*` (normalizer export), tests in `src/test/*`.
- Normalizador: `normalizeOpportunityWorkspace` (imported from `src/components/pipeline`) — resolve labels, derived fields and fallbacks.
- Store: `useAppStore` in `src/store/index.ts` — contains `oportunidadesKanban`, `moveOportunidade`, optimistic operations and persistence (uses `persist` middleware). Storage persists via `localStorage` (persist middleware) — classify as Cache/Derived depending on key.
- Gaps observed:
  - UI uses both `etapa_id` and `stageId` naming (legacy vs canonical). Bloco B fixed label rendering, but UI still contains many fallbacks to `etapa_id` which may mask canonical usage.
  - Selectors and formatting in UI may rely on CSS classes (fragile selectors in tests).

8) Backend (rotas, serviços, gaps)
- API client: `src/api/modules/opportunities.api.ts` documents canonical endpoints and payload shapes (getAll, getById, create, createIntake, update, moveStage, delete).
- Prisma model: `Opportunity` defined in `backend/prisma/schema.prisma` with `stageId`, `pipelineId`, `amount`, `customerId`, `tenantId`, timestamps.
- Gaps:
  - No explicit version field in Prisma `Opportunity` model (only `updatedAt` timestamp). No ETag/optimistic-lock field found in inspected artifacts.
  - Need to confirm backend controllers enforce tenant and RBAC for each endpoint (models exist; full verification to be recorded as task).

9) Prisma e persistência
- `backend/prisma/schema.prisma` contains `model Opportunity` with canonical fields (id, tenantId, pipelineId, stageId, amount, customerId, ownerId, status, createdAt/updatedAt). Persistência é centralizada no modelo `Opportunity`.

10) RBAC
- Schema: Role/Permission models exist.
- Frontend: permission helpers (`canAccess`) and `PROFILE_PERMISSIONS` usage exist; many UI elements gated by permissions.
- Backend: Role/Permission and middleware exist in schema; controllers need verification to confirm enforcement on every mutating endpoint.

11) Tenant
- Prisma: `tenantId` in `Opportunity` e `@@index([tenantId])` present.
- Risk: frontend must send or derive tenant context from auth token; code uses auth provider and `useTenantFilter` hook — confirm tokens/requests include tenant to avoid cross-tenant leaks. Any unfiltered query would be P0 risk.

12) Zustand e camada de compatibilidade
- `src/store/index.ts` persists state via `persist` (localStorage) — this provides cache/rehydration which can diverge from backend if not invalidated on updates.
- There are adapters/compatibility layers (`workspaceOpportunity` and normalizers in `src/components/pipeline`) to accept multiple shapes (legacy and official). These are necessary but risk perpetuating legacy fields if relied on as source-of-truth.

13) Sincronização de etapa (detalhes)
- Canonical write path: UI → API.moveStage → backend updates `stageId` → response → UI/store reconciliation.
- Observed behaviors to validate in follow-up tests:
  - concurrent drag + manual update race
  - modal open while stage changes in another client
  - duplicate requests handling

14) Sincronização de valor
- Canonical: `amount` persisted in Prisma `Opportunity.amount`.
- Validate formatting/conversion performed only on display layer; payloads must carry numeric values.

15) Sincronização de cliente
- Canonical: `customerId` relation in Prisma; UI may include embedded `customer` object returned by API. Intake endpoints support creating/associating customers atomically (`createIntake`).

16) Concorrência e reconciliação
- No explicit version/ETag observed; reconciliação relies on timestamps and returned payloads.
- Recommendation: evaluate adding optimistic concurrency (version integer or ETag) for P1 risk flows (stage change, amount change).

17) Tratamento de erro e rollback
- Frontend contains optimistic updates (store.moveOportunidade) — must ensure rollback paths handle failed API calls. Tests should simulate failures to validate rollback UX and store reconciliation.

18) Observabilidade
- Prisma + backend include audit models (`AuditLog`); correlation IDs exist in some runtime evidence models; verify that every mutating endpoint logs tenant, user and opportunity id for traceability.

19) Testes existentes (mapeamento rápido)
- `src/test/oportunidades-card-interaction.test.tsx` — functional interaction tests (added in Bloco B).
- `src/test/oportunidades-kanban-hardening.test.ts` — structural/hardening tests.
- Suite: 31 test files / 146 tests executed previously.

20) Gaps priorizados (resumo)
- G1 (P1): No explicit optimistic concurrency/versioning for critical mutating endpoints (stage/value). Evidence: Prisma model lacks version field. Impact: possible lost-update or inconsistent state after concurrent edits.
- G2 (P1): Reliance on persisted local state (Zustand persist) without guaranteed invalidation after remote changes. Impact: UI may show stale data after external update.
- G3 (P2): Mixed naming (`etapa_id` vs `stageId`) across UI and tests — legacy values remain and can mask canonical flow. Bloco B mitigated label rendering but structural naming divergence persists.
- G4 (P2): Need to confirm backend enforces tenant filter on every query; schema shows tenantId but controllers must be validated.

21) Recomendações (prioritizadas)
- R1 (P0/P1 check): Immediately verify tenant enforcement on all `opportunities` endpoints (high priority; if missing, pause implementation). If any endpoint allows cross-tenant reads/writes, treat as P0.
- R2 (P1): Add optimistic concurrency (version integer or ETag) to `Opportunity` updates that change `stageId` or `amount` to avoid lost updates.
- R3 (P1): Ensure store persistence invalidation on confirmed server updates (subscribe to push/refetch after mutation success).
- R4 (P2): Define and document canonical field naming (map `etapa_id` → `stageId`) in `MATRIZ_FONTE_VERDADE_WORKSPACE.md` and apply to tests.
- R5 (P2): Increase observability for mutating endpoints: correlation IDs, user/tenant in logs, audit entry for stage/value changes.

22) Proposta de subdivisão do Bloco C (sugestão)
- C1 — Inventário e contrato canônico dos campos
- C2 — Sincronização de etapa (concurrency + tests)
- C3 — Sincronização de valor (precision, conversion, tests)
- C4 — Sincronização de cliente (intake, association tests)
- C5 — Persistência e reconciliação (store invalidation)
- C6 — RBAC e tenant hardening
- C7 — Testes E2E e observabilidade

23) Ordem segura de implementação (sugerida)
1. C6 — confirmar tenant + RBAC (P0 guardrail)
2. C1 — contrato canônico dos campos (documental)
3. C2 — sincronização de etapa (implement concurrency protections)
4. C3 — sincronização de valor
5. C5 — persistência e reconciliação (store)
6. C4 — cliente/intake refinamentos
7. C7 — testes e observability

24) Critérios de aceite do Bloco C (resumo)
- Mapeamento completo dos campos e fontes (matriz entregue)
- Endpoints confirmados existentes e testados em mock/integration
- Tenant e RBAC verificados em backend e UI
- Concurrency strategy defined (version/ETag) for stage/value flows
- No regressions in Bloco B tests; new tests for concurrency and stale data added

25) Arquivo criado
- docs/audits/workspace-oportunidade/BLOCO_C_AUDITORIA_TECNICA.md (este documento)

26) Estado do Git ao concluir a auditoria
- Expected untracked created: `docs/audits/workspace-oportunidade/BLOCO_C_AUDITORIA_TECNICA.md`
- No commits/push performed by auditoria.

27) Resultado do `git diff --check`
- Nenhum erro detectado durante inspeção (warnings de LF/CRLF em arquivos Markdown observadas). No código modificado.

28) Conformidade de governança
- Nenhuma alteração de código, migrations, banco, endpoints, RBAC, tenant, VPS, ou deploy foi efetuada durante esta auditoria.

29) Parecer técnico
AUDITORIA DO BLOCO C CONCLUÍDA — PRONTO PARA REVISÃO E AUTORIZAÇÃO DE IMPLEMENTAÇÃO

30) Próximo passo recomendado
- Autorizar execução da fase C1 (Inventário e contrato canônico) e aprovar validação imediata de tenant/RBAC nas APIs. Após autorização, preparar tickets e testes de integração para C2/C3.

Evidências coletadas (exemplos)
- `src/pages/Oportunidades.tsx` — handler `handleOpenLead`, uso de `normalizeOpportunityWorkspace`, renderização de `selectedLead?.stageLabel` (linhas exibidas no repo).
- `src/api/modules/opportunities.api.ts` — contrato cliente com `moveStage`, `update`, `createIntake`.
- `backend/prisma/schema.prisma` — `model Opportunity` com `stageId`, `amount`, `customerId`, `tenantId`.

Observação final
Este relatório é documental e foi criado sem qualquer alteração funcional. Recomenda-se revisão por Arquitetura/Segurança antes de autorizar qualquer implementação do Bloco C.

Auditoria Dirigida C6 — RBAC e Isolamento por Tenant
---------------------------------------------------

Resumo objetivo
--------------
Esta seção documenta, endpoint a endpoint, as evidências observadas sobre autenticação, origem/propagação do tenant, enforcement de RBAC e validações relacionais no módulo `opportunities`. Todas as conclusões abaixo citam arquivos, funções e testes pesquisáveis.

1) Arquitetura de autenticação e resolução de tenant
- Middleware JWT e resolução de tenant: [backend/src/core/http/middleware.ts](backend/src/core/http/middleware.ts#L1-L250) — funções `authenticate`, `tenantContextMiddleware`, `buildTenantContext`, `resolveTenantContextFromDatabase`.
- Look-up do usuário/roles/tenant: [backend/src/modules/auth/repositories/auth.repository.ts](backend/src/modules/auth/repositories/auth.repository.ts#L1-L200) — função `findUserForTenantContext` usada por `resolveTenantContextFromDatabase`.

Conclusão: CONFIRMADO — o tenant é obtido do JWT, validado contra base e propagado em `request.currentTenant`.

2) Guardas RBAC
- Middleware de autorização: [backend/src/modules/rbac/rbac.guard.ts](backend/src/modules/rbac/rbac.guard.ts#L1-L200) — `requirePermissions` e `requireRoles`.
- Uso nas rotas de opportunities: [backend/src/modules/opportunities/routes.ts](backend/src/modules/opportunities/routes.ts#L1-L120) — cada rota declara `preHandler: [requirePermissions('opportunity:...')]`.

Conclusão: CONFIRMADO — as permissões são exigidas por rota e validadas no backend (não confiar no controle visual do frontend).

3) Origem do tenant e validação de tenant vindo do cliente
- A origem do tenant autorizada é o token/JWT. `tenantContextMiddleware` rejeita explicitamente `tenantId` vindos em params/body/query quando diferentes do token: veja `getRequestedTenantId` e a checagem final em [backend/src/core/http/middleware.ts](backend/src/core/http/middleware.ts#L1-L250).

Conclusão: CONFIRMADO — tenant do token é autoridade; tenant fornecido pelo cliente é bloqueado quando conflituoso.

4) Inventário de endpoints (evidência por endpoint)
Nota: todas as rotas abaixo estão implementadas em [backend/src/modules/opportunities/routes.ts](backend/src/modules/opportunities/routes.ts).

- GET /api/v1/opportunities — listar
  - Operação: list
  - Autenticação: `authenticate` + `tenantContextMiddleware` (middleware global para o módulo)
  - Permissão requerida: `opportunity:read` (via `requirePermissions`)
  - Origem do tenant: token → `request.currentTenant.tenantId`
  - Filtro de tenant: passado ao service (`tenantId`) e aplicado em repository `findMany` via `buildOpportunityWhere` (ver [backend/src/modules/opportunities/repositories/opportunities.repository.ts](backend/src/modules/opportunities/repositories/opportunities.repository.ts#L1-L80)) onde `tenantId` é obrigatório e relacionais `pipeline`/`stage` são validados no `where`.
  - Relações validadas: pipeline (tenant), stage (tenant) via sub-`is` clauses no `where`.
  - Conclusão: CONFIRMADO

- GET /api/v1/opportunities/:id — obter por ID
  - Permissão: `opportunity:read`
  - Origem tenant: token
  - Filtro/validação: `opportunitiesService.getById` chama `opportunitiesRepository.findById(id, tenantId)` que aplica `where: { id, tenantId, pipeline.is:{tenantId}, stage.is:{tenantId} }`.
  - Acesso adicional: `canAccessOpportunity` verifica owner/partner/tenant-admin scope.
  - Conclusão: CONFIRMADO

- POST /api/v1/opportunities/intake — intake (criar customer + opportunity)
  - Permissão: `opportunity:create`
  - Origem tenant: token
  - Transação serializável: `runOpportunitiesSerializableTransaction` (isolamento serializable) e validações: `assertPipelineAndStageConsistency`, `assertCustomerBelongsToTenant`, checks for lead/product/subproduct/modality tenant scope (serviço usa `findXById(tenantId, id)` helpers).
  - Conclusão: CONFIRMADO

- POST /api/v1/opportunities — criar
  - Permissão: `opportunity:create`
  - Origem tenant: token (route constrói `input.tenantId = request.currentTenant.tenantId`)
  - Validações: `assertPipelineAndStageConsistency`, `assertOpportunityProductHierarchyConsistency`, `assertCustomerBelongsToTenant`/`assertLeadBelongsToTenant`.
  - Repository: `create` recebe `tenantId` no payload.
  - Conclusão: CONFIRMADO

- PUT /api/v1/opportunities/:id — atualizar
  - Permissão: `opportunity:update`
  - Fluxo: `service.update` -> `findById(opportunityId, tenantId)` -> `canAccessOpportunity` -> `update(... where: { id, tenantId })` -> re-read via `findById`.
  - Conclusão: CONFIRMADO

- PATCH /api/v1/opportunities/:id/stage — mover etapa
  - Permissão: `opportunity:move_stage`
  - Fluxo: `service.moveStage` verifica `findById` com `tenantId`, `assertPipelineAndStageConsistency(tenantId, pipelineId, stageId)`, e atualiza via `updateMany` com `where: { id, tenantId }`.
  - Conclusão: CONFIRMADO

- DELETE /api/v1/opportunities/:id — arquivar (soft delete)
  - Permissão: `opportunity:delete`
  - Fluxo: `service.archive` valida `findById(..., tenantId)` e executa `softDelete` com `updateMany where: { id, tenantId }`.
  - Conclusão: CONFIRMADO

5) Verificação de consultas (`findUnique`/`findFirst`/`findMany`/`update`/`updateMany`/`delete`)
- Repositório central: [backend/src/modules/opportunities/repositories/opportunities.repository.ts](backend/src/modules/opportunities/repositories/opportunities.repository.ts).
- Observações:
  - `findById(id, tenantId)` sempre exige `tenantId` no `where` e aplica proteções relacionais para `pipeline` e `stage` (CONFIRMADO).
  - `findMany` constrói `where` com `tenantId` e adiciona `pipeline.is` e `stage.is` para garantir consistência relacional (CONFIRMADO).
  - `update` e `moveStage` usam `updateMany` com `where: { id, tenantId, deletedAt: null }` reduzindo risco de cross-tenant writes (CONFIRMADO).
  - Existem helpers que podem ler apenas tenantId (`findOpportunityTenantScope`) para checagens de identidade — uso controlado e visível no repositório/serviço (PARCIALMENTE CONFIRMADO; não usado para writes sem validação adicional).

6) RBAC — mapa de permissões observadas e enforcement
- Permissões identificadas: `opportunity:read`, `opportunity:create`, `opportunity:update`, `opportunity:move_stage`, `opportunity:delete`.
- Enforcement: rotas usam `requirePermissions` (backend). Testes unitários de rotas validam 401/403 flows: [backend/src/tests/unit/opportunities.routes.test.ts](backend/src/tests/unit/opportunities.routes.test.ts) (CONFIRMADO).
- Frontend: existem checks visuais/UX que escondem ações, mas backend é autoridade (CONFIRMADO). Divergência frontend/backend não detectada como problema funcional aqui.

7) Tenant — conclusões detalhadas
- Tenant vem do token JWT e é resolvido/normalizado por `tenantContextMiddleware` (CONFIRMADO).
- Tenant não é aceito do body/params quando conflita — `tenantContextMiddleware` rejeita (CONFIRMADO).
- Listagem: `list` sempre passa `tenantId` ao repositório e `findMany` filtra por tenant (CONFIRMADO).
- Detalhe por ID: `getById` usa `findById(id, tenantId)` que inclui `tenantId` no `where` (CONFIRMADO).
- Update/Delete: `update`/`softDelete` usam `updateMany` com `tenantId` no `where` e re-leitura via `findById` (CONFIRMADO).
- Mudança de etapa: `moveStage` valida `pipeline`/`stage` com helpers que usam tenant-scoped `findStageById` e então aplica `updateMany where: { id, tenantId }` (CONFIRMADO).
- Criação: `create` e `createOpportunityIntake` validam relations (pipeline, stage, customer, lead, product) através de tenant-scoped `findXById` antes de `create` (CONFIRMADO).

Classificações por item: todas as verificações essenciais de tenant para o módulo `opportunities` foram: CONFIRMADO.

8) Testes
- Unitários relevantes examinados:
  - [backend/src/tests/unit/opportunities.repository.test.ts](backend/src/tests/unit/opportunities.repository.test.ts) — valida chamadas Prisma com `tenantId`.
  - [backend/src/tests/unit/opportunities.service.test.ts](backend/src/tests/unit/opportunities.service.test.ts) — cobre create, update, moveStage, archive, intake e checagens cross-tenant (ex.: "create tenant inválido (cross-tenant)").
  - [backend/src/tests/unit/opportunities.routes.test.ts](backend/src/tests/unit/opportunities.routes.test.ts) — valida 401/403 e roteamento/contratos.
  - [backend/src/tests/integration/opportunities.test.ts](backend/src/tests/integration/opportunities.test.ts) — existe e deve ser executado em contexto de integração; evidencia disponível.

Conclusão sobre cobertura de testes: CONFIRMADO — boa cobertura unitária para validação de tenant e fluxos críticos; alguns cenários E2E/integration são referenciados e devem ser executados em ambiente controlado (gap de execução manual, não de implementação).

9) Proteção do Prisma / banco
- Esquema Prisma contém `tenantId` e índices em `Opportunity` (ver [backend/prisma/schema.prisma](backend/prisma/schema.prisma#L1-L200)).
- Queries de leitura/escrita no repositório usam `tenantId` no `where` e checks relacionais; `updateMany` usado para writes (CONFIRMADO).

10) Riscos confirmados e gaps de cobertura (C6-focused)
- Risco P0: Não identificado no módulo `opportunities` — não foram encontradas queries que escrevem ou retornam entidades sem validação de `tenantId` ou validação posterior que permita cross-tenant mutation.
- Gaps residuais:
  - Dependência em `updateMany` sem retorno de linhas afetadas tratadas em alguns fluxos — existe re-read em update flows, mitigando risco.
  - Código fora do módulo `opportunities` (ou queries ad-hoc noutros módulos) não foi integralmente escaneado aqui; recomendação: executar varredura equivalente para módulos que manipulam `Opportunity` (partners, campaigns, integrations).

11) Conclusão C6 (classificação final)
NENHUM RISCO P0 IDENTIFICADO — RBAC E TENANT SUFICIENTEMENTE VALIDADOS PARA AVANÇO CONTROLADO

12) Ações recomendadas imediatas (não bloqueantes)
- Executar scan idêntico em módulos vizinhos que possam tocar `Opportunity` (partners, pipelines, integrations).
- Agendar execução dos testes de integração mencionados em ambiente controlado para validação runtime.
- Documentar explicitamente a regra: "tenant vem do JWT; qualquer tenant em payload/params divergente é rejeitado" no contrato canônico.

Evidências citáveis (resumo)
- `backend/src/core/http/middleware.ts` — `authenticate`, `tenantContextMiddleware`, `resolveTenantContextFromDatabase`.
- `backend/src/modules/auth/repositories/auth.repository.ts` — `findUserForTenantContext`.
- `backend/src/modules/rbac/rbac.guard.ts` — `requirePermissions`.
- `backend/src/modules/opportunities/routes.ts` — rotas e `preHandler`.
- `backend/src/modules/opportunities/services/opportunities.service.ts` — validações de pipeline/stage/customer/lead e fluxos de autorização.
- `backend/src/modules/opportunities/repositories/opportunities.repository.ts` — `findById`, `findMany`, `updateMany`, `moveStage`, `softDelete` (tenant filters e relational `is` clauses).
- `backend/prisma/schema.prisma` — `model Opportunity` (tenantId index).
- Testes: `backend/src/tests/unit/opportunities.*.test.ts`, `backend/src/tests/integration/opportunities.test.ts`.

Fim da seção C6 — Auditoria Dirigida
