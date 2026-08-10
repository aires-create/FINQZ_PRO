# NUCLEO V1 - GATE CRM PIPELINE OPPORTUNITY WORKSPACE

Data: 2026-08-10
Repositorio: `C:\Projects\FINQZ_PRO_HML_PROMOTION`
Branch: `promotion/hml-g18-full`
HEAD auditado: `7a6d2723248cd4417119f76891a80619a28abeae`
Escopo: auditoria read-only do nucleo operacional da primeira publicacao

## 1. Baseline

- `git status --short`: limpo no inicio da Fase B
- `git branch --show-current`: `promotion/hml-g18-full`
- `git rev-parse HEAD`: `7a6d2723248cd4417119f76891a80619a28abeae`
- `git rev-parse origin/promotion/hml-g18-full`: `7a6d2723248cd4417119f76891a80619a28abeae`
- local = remoto

## 2. SSOT consultada

- `docs/00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md`
- `docs/audits/workspace-oportunidade/WORKSPACE_V1_GATE_INTEGRADO_GOLIVE.md`
- `docs/audits/workspace-oportunidade/BLOCO_C2_3_TRIAGEM_GOLIVE_CONCORRENCIA.md`
- `docs/03-audits/AUD-EPC-W2-CRM-CONSOLIDATION.md`

Leitura consolidada:

- CRM Clientes, Pipeline, Opportunity e Workspace formam o nucleo comercial operacional para V1;
- o backend oficial e tenant-scoped, RBAC-driven e Prisma-backed;
- o Workspace foi fechado para V1 com restricoes estritamente pos-Go-Live;
- o nucleo segue `GO WITH RESTRICTIONS` enquanto nao houver P0/P1 comprovado.

## 3. Fluxo operacional auditado

Fluxo rastreado:

`Cliente/Lead`
-> criacao ou associacao da Opportunity
-> Pipeline oficial
-> Stage inicial
-> Card
-> Workspace
-> edicao essencial
-> mudanca de etapa
-> persistencia
-> refresh
-> retorno ao Kanban

## 4. Matriz N1-N20

| ID | Fluxo | Frontend | Backend | Persistencia | Tenant | RBAC | Teste | Resultado | V1 |
|---|---|---|---|---|---|---|---|---|---|
| N1 | autenticacao no nucleo | frontend consome APIs autenticadas | hooks `authenticate` no CRM/Pipeline/Opportunity | n/a | sim | sim | leitura de codigo | PASS | PASS |
| N2 | selecao/contexto tenant | frontend usa contexto do usuario, nao decide autorizacao | `tenantContextMiddleware` e leitura de `tenantId` | sim | sim | n/a | `tenant-context.middleware.test.ts` existe, mas nao executou por `DATABASE_URL` | PASS COM RESSALVA | PASS |
| N3 | leitura de clientes | `Clientes.tsx` usa `clientesApi.getAll()` | `GET /api/v1/crm/clientes` | sim | sim | `customer:read` | evidencia de codigo; sem teste backend especifico encontrado | PASS COM RESSALVA | PASS |
| N4 | criacao/edicao cliente essencial | `Clientes.tsx` usa `clientesApi.create/update/delete` | rotas CRM + `customers.service` | sim | sim | `customer:create/update/delete` | evidencia de codigo; sem teste backend especifico encontrado | PASS COM RESSALVA | PASS |
| N5 | criacao/intake Opportunity | `Oportunidades.tsx` usa `opportunitiesApi.createIntake()` | `POST /api/v1/opportunities/intake` | sim | sim | `opportunity:create` | evidencia de codigo + testes unitarios Opportunity | PASS COM RESSALVA | PASS |
| N6 | associacao Customer ↔ Opportunity | `clientesApi.search/getById` alimenta intake/edit | backend valida `customerId` e tenant | sim | sim | sim | evidencia de codigo + `opportunities.service.test.ts` | PASS | PASS |
| N7 | Pipeline oficial | `pipelinesApi.getAll()` | modulo oficial `/api/v1/pipelines` | sim | sim | `pipeline:read` | `pipelines.api.test.ts`, backend pipeline tests | PASS | PASS |
| N8 | Stage oficial | leitura oficial de stages via pipeline payload | modulo oficial de Pipeline/Stage | sim | sim | `stage:create/update/delete` nas rotas | pipeline tests + workspace tests | PASS | PASS |
| N9 | card no Kanban | `Oportunidades.tsx` monta card sobre lista oficial | backend Opportunity + Pipeline | sim | sim | indireto | `pipeline.test.ts`, `oportunidades-kanban-hardening.test.ts` | PASS | PASS |
| N10 | abertura Workspace | card abre `selectedLead` normalizado | n/a | n/a | n/a | UI respeita permissoes de acao | `oportunidades-card-interaction.test.tsx` | PASS | PASS |
| N11 | edicao Opportunity | `opportunitiesApi.update()` | `PUT /api/v1/opportunities/:id` | sim | sim | `opportunity:update` | evidencia de codigo + tests Opportunity | PASS COM RESSALVA | PASS |
| N12 | moveStage Workspace | resposta persistida -> mapping -> reconcile | `PATCH /api/v1/opportunities/:id/stage` | sim | sim | `opportunity:move_stage` | `workspaceOpportunity.test.ts`, `oportunidades-card-interaction.test.tsx`, backend service/rbac | PASS | PASS |
| N13 | drag-and-drop | mesma mutation oficial de moveStage | mesma rota oficial | sim | sim | `opportunity:move_stage` | `oportunidades-kanban-hardening.test.ts` | PASS | PASS |
| N14 | erro moveStage | erro remoto nao altera entidade antes do sucesso | backend responde erro classificado; frontend mostra `alert` | preserva estado | sim | sim | pacote Workspace V1 + C2.2/C2.3 | PASS COM RESSALVA | PASS |
| N15 | refresh | `getAll()` e `apiReadReloadKey` convergem para backend | leitura oficial pós-mutation | sim | sim | `opportunity:read` | suite frontend + Workspace gate | PASS | PASS |
| N16 | persistencia | clientes, pipeline e opportunity persistem em backend oficial | Prisma + reread/updateMany | sim | sim | sim | pipeline/opportunity unit tests | PASS | PASS |
| N17 | RBAC | frontend nao e owner da autorizacao | rotas protegidas por `requirePermissions` | n/a | n/a | sim | `opportunity-move-stage-rbac.test.ts`; outros por codigo | PASS COM RESSALVA | PASS |
| N18 | tenant isolation | frontend nao escolhe tenant de negocio | services/repositories filtram por `tenantId` | sim | sim | sim | repository tests e codigo; alguns testes bloqueados por ambiente | PASS COM RESSALVA | PASS |
| N19 | ausencia de API paralela no fluxo critico | paginas principais importam APIs oficiais | compat layer existe, mas nao domina o runtime auditado | sim | sim | n/a | `rg` de runtime e imports | PASS COM RESSALVA | PASS |
| N20 | testes/build/governanca | suites frontend, build e arch passaram | backend parcial por ambiente | n/a | n/a | n/a | execucoes deste gate | PASS COM RESSALVA | PASS |

## 5. Frontend

### CRM

- `src/pages/Clientes.tsx` consome `clientesApi.getAll/create/update/delete/getAuditLogs`;
- a pagina recarrega clientes pela API oficial e nao pelo store como owner de negocio;
- existe enriquecimento de UX via CEP, mas ele nao substitui o backend como owner do cliente.

### Pipeline + Opportunity + Workspace

- `src/pages/Oportunidades.tsx` importa `opportunitiesApi`, `pipelinesApi` e `clientesApi` diretamente;
- a lista oficial de opportunities vem de `opportunitiesApi.getAll()`;
- a configuracao oficial de pipelines vem de `pipelinesApi.getAll()`;
- o Workspace usa `normalizeOpportunityWorkspace()` e a reconciliacao persistida ja fechada no gate do Workspace V1;
- criacao/intake, update, moveStage e delete usam `opportunitiesApi`.

### Store / compat

- o store ainda expoe `currentPipelineId` e outras estruturas de apoio;
- `src/api/client.ts` ainda existe como compat layer;
- isso nao muda o fato de que `Clientes.tsx` e `Oportunidades.tsx` consumirem o caminho oficial no fluxo critico;
- a dependencia de `currentPipelineId`, mapeamentos legados e suporte de Pipeline continua como ressalva P2, nao como P1 comprovado.

## 6. Backend

### Bootstrap

Modulos oficiais confirmados no Fastify:

- `crmRoutes` em `/api/v1/crm`
- `pipelinesRoutes` em `/api/v1/pipelines`
- `opportunitiesRoutes` em `/api/v1/opportunities`

### CRM

- rotas oficiais de clientes e leads em `backend/src/modules/crm/routes.ts`
- protecao por `authenticate`, `tenantContextMiddleware` e `requirePermissions` para clientes
- `customers.service.ts` e `customers.repository.ts` operam com `tenantId`

### Pipeline

- rotas oficiais em `backend/src/modules/pipelines/routes.ts`
- services e repository oficiais usam `tenantId`
- CRUD de pipeline e stage protegido por permissoes dedicadas

### Opportunity

- rotas oficiais em `backend/src/modules/opportunities/routes.ts`
- service valida tenant, pipeline, stage, customer e lead
- repository filtra por `tenantId`
- `moveStage` continua `last-write-wins`, ja classificado pos-Go-Live

## 7. APIs oficiais

APIs operacionais oficiais do nucleo:

- Clientes: `/api/v1/crm/clientes`
- Pipelines: `/api/v1/pipelines`
- Opportunities: `/api/v1/opportunities`

Chamadores reais do fluxo critico:

- `src/pages/Clientes.tsx`
- `src/pages/Oportunidades.tsx`

## 8. Legado

Achados:

- `src/api/client.ts` ainda existe como facade de compatibilidade;
- `src/config/environment.ts` ainda lista endpoints legados `/api/oportunidades`;
- `src/pages/Oportunidades.tsx` ainda depende de suporte legado de Pipeline, incluindo store e mappings auxiliares;
- nao encontrei evidência de leitura ou escrita operacional dominante do fluxo critico atual pelas rotas legadas `/api/oportunidades` ou `/api/clientes`.

Classificacao:

- legado/paralelo presente no repositorio: `SIM`
- legado/paralelo como owner confirmado do fluxo essencial V1: `NAO`

Resultado:

- `P2` / pos-Go-Live

## 9. Tenant

Confirmacoes:

- CRM, Pipeline e Opportunity extraem `tenantId` do contexto autenticado;
- repositories de clientes, leads, pipelines, stages e opportunities filtram por `tenantId`;
- `findById` de Opportunity ainda reforca coerencia relacional de `pipeline` e `stage` do mesmo tenant;
- o frontend nao e owner de tenant isolation.

## 10. RBAC

Confirmacoes:

- CRM clientes: `customer:read/create/update/delete`
- Pipeline: `pipeline:read/create/update/delete` e `stage:create/update/delete`
- Opportunity: `opportunity:read/create/update/move_stage/delete`

Ressalvas:

- parte da evidencia de testes de rota/tenant no backend nao executou localmente por falta de `DATABASE_URL`;
- ainda assim, o desenho de RBAC no codigo oficial esta consistente e um teste RBAC especifico de `moveStage` passou.

## 11. Persistencia

Confirmacoes:

- clientes persistem por `customers.service` + `customers.repository`
- pipelines e stages persistem por modulo oficial de Pipeline
- opportunities persistem por modulo oficial de Opportunity
- `createIntake` cria/associa customer e opportunity no backend oficial
- `moveStage` usa resposta persistida e reidratada no frontend
- refresh reconverge para o backend

## 12. Testes frontend

Direcionados executados:

- `src/test/workspaceOpportunity.test.ts`: 48/48
- `src/test/oportunidades-card-interaction.test.tsx`: 8/8
- `src/test/oportunidades-kanban-hardening.test.ts`: 12/12
- `src/test/pipelines.api.test.ts`: 2/2
- `src/test/pipelines.adapter.test.ts`: 2/2
- `src/test/pipeline.test.ts`: 27/27

Suite completa:

- execucao 1: 31 arquivos, 184 testes, 0 falhas, 0 worker errors
- execucao 2: 31 arquivos, 184 testes, 0 falhas, 0 worker errors

## 13. Testes backend

Executados com sucesso:

- `src/tests/unit/pipelines/pipeline.service.test.ts`: 39/39
- `src/tests/unit/pipelines/pipeline.repository.test.ts`: 19/19
- `src/tests/unit/pipelines/pipeline.http.contract.test.ts`: 18/18
- `src/tests/unit/pipelines/pipeline.contract.test.ts`: 6/6
- `src/tests/unit/opportunities.service.test.ts`: 26/26
- `src/tests/unit/opportunities.repository.test.ts`: 15/15
- `src/tests/unit/opportunities.validator.test.ts`: 8/8
- `src/tests/unit/rbac/opportunity-move-stage-rbac.test.ts`: 1/1

Nao foram encontrados testes backend especificos de CRM/Clientes no recorte localizado deste gate.

## 14. Gaps de ambiente

Bloqueados por `DATABASE_URL` ausente no ambiente atual:

- `src/tests/unit/pipelines/pipeline.routes.test.ts`
- `src/tests/unit/opportunities.routes.test.ts`
- `src/tests/unit/tenant-context.middleware.test.ts`
- `src/tests/unit/prp-fix-02/tenant-boundary.test.ts`
- `src/tests/integration/opportunities.test.ts`

Classificacao:

- `GAP DE EVIDENCIA DE AMBIENTE`
- nao ha defeito funcional comprovado por essa causa

## 15. P0

Nenhum confirmado.

## 16. P1

Nenhum confirmado.

Leitura estrita:

- nao foi comprovado bypass de auth/RBAC;
- nao foi comprovado cross-tenant;
- nao foi comprovada perda/corrupcao persistente;
- nao foi comprovado uso de backend legado incorreto como owner do fluxo essencial;
- nao foi comprovada divergencia permanente entre card e Workspace no estado fechado de V1.

## 17. P2/P3

### P2

- `Oportunidades.tsx` ainda depende de suporte legado de Pipeline (`currentPipelineId`, mappings e compatibilidade);
- compat layer `src/api/client.ts` continua presente;
- `src/config/environment.ts` ainda expõe endpoints legados `/api/oportunidades`;
- alguns testes backend de rota/tenant/integracao seguem bloqueados por `DATABASE_URL`;
- concorrencia de `moveStage` continua `last-write-wins`, ja classificada pos-Go-Live.

### P3

- busy state e refinamentos visuais do Workspace;
- limpeza editorial de aliases e compatibilidade residual.

## 18. Decisao V1

`NUCLEO V1 - GO WITH RESTRICTIONS`

Justificativa:

- nenhum P0 confirmado;
- nenhum P1 confirmado;
- CRM, Pipeline, Opportunity e Workspace essenciais usam modulos oficiais;
- tenant e RBAC estao aplicados no backend oficial;
- o fluxo critico nao demonstrou ownership por API legada;
- as restricoes remanescentes sao de compatibilidade controlada, ambiente de teste e itens ja classificados para pos-Go-Live.

## 19. Proximos gates

1. tratar a lacuna de ambiente para testes backend dependentes de `DATABASE_URL`, sem usar infraestrutura de producao;
2. seguir para o proximo gate integrado do nucleo da primeira publicacao;
3. manter a remocao de compatibilidade legada e o hardening de concorrencia no trilho pos-Go-Live.

Proximo gate obrigatorio:

- Backend Evidence Gate em PostgreSQL descartavel e isolado.
- Proibido utilizar banco de producao ou HML para completar essa evidencia.
