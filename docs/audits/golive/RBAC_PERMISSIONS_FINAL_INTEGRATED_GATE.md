# RBAC / PERMISSIONS FINAL INTEGRATED GATE

Data: 2026-08-11
Repositorio: `C:\Projects\FINQZ_PRO_HML_PROMOTION`
Branch: `promotion/hml-g18-full`
HEAD auditado: `01a5899f6aa68f008f77ead1bd230e32a440ee24`
Escopo: gate read-only integrado de RBAC / Permissions para validacao final de backend e contratos oficiais

## 1. Baseline

- branch local: `promotion/hml-g18-full`
- HEAD local: `01a5899f6aa68f008f77ead1bd230e32a440ee24`
- HEAD remoto rastreado: `01a5899f6aa68f008f77ead1bd230e32a440ee24`
- worktree limpo no inicio da auditoria
- nenhuma alteracao de runtime foi realizada neste gate
- o RBAC de Commercial Tables ja estava corrigido no baseline `01a5899f6aa68f008f77ead1bd230e32a440ee24`
- este gate apenas auditou a integracao final de permissoes

## 2. SSOT utilizada

### 2.1 SSOT arquitetural / documental

Ordem de precedencia:

1. `docs/00-master/PCCD-FINQZ-PRO-ENTERPRISE.md`
2. `docs/00-master/FINQZ-EOS-RUNTIME-GOVERNANCE-ARCHITECTURE.md`
3. `docs/03-decision-platform/DCA-ENTERPRISE-DECISION-PLATFORM-v1.md`
4. `docs/02-architecture/ARCH-009-RBAC_REVIEW_REQUIRED.md`
5. `docs/02-architecture/ARCH-019-opportunity-product-ownership-decision.md`
6. `docs/02-architecture/ARCH-060-commercial-tables-architecture.md`
7. `docs/02-architecture/ARCH-061-commercial-tables-ux-navigation-architecture.md`
8. `docs/02-architecture/ARCH-066-coverage-transition-governance.md`
9. `docs/02-architecture/ARCH-067-stage-lifecycle-architecture.md`
10. `docs/02-architecture/ARCH-041-MASTER-CATALOG-CONSUMER-MAPPING.md`

Leitura objetiva:

- a documentacao oficial define ownership, fronteiras e postura de permissao
- runtime nao e precedencia superior a contratos e arquitetura

### 2.2 Evidencia de runtime

Fontes de runtime auditadas como evidencia operacional:

- `backend/src/modules/rbac/rbac.guard.ts`
- `backend/prisma/seed.ts`
- `backend/src/modules/commercial/commercial.routes.ts`
- `backend/src/modules/simulation/presentation/http/simulation-runtime.routes.ts`
- `backend/src/modules/simulation/evidence/presentation/http/simulation-runtime-evidence.routes.ts`
- `backend/src/modules/crm/routes.ts`
- `backend/src/modules/opportunities/routes.ts`
- `backend/src/modules/pipelines/routes.ts`
- `backend/src/modules/master-catalog/presentation/http/master-catalog.routes.ts`
- `src/auth/permissionMatcher.ts`
- `src/auth/guards.tsx`
- `src/config/permissions.ts`

Leitura objetiva:

- o runtime confirma a aplicacao pratica da SSOT
- o runtime nao substitui a base arquitetural/documental

## 3. Permissoes e RBAC

### 3.1 Registry oficial confirmado

Permissoes canônicas relevantes encontradas na seed / runtime:

- `sales:view`
- `simulation:execute`
- `simulation:evidence:write`
- `master-catalog:read`
- `customer:read`
- `customer:create`
- `customer:update`
- `customer:delete`
- `opportunity:read`
- `opportunity:create`
- `opportunity:update`
- `opportunity:move_stage`
- `opportunity:delete`
- `opportunity:approve`
- `pipeline:read`
- `pipeline:create`
- `pipeline:update`
- `pipeline:delete`
- `stage:read`
- `stage:create`
- `stage:update`
- `stage:delete`
- `SIMULADOR_VIEW`
- `SALES_VIEW`
- `CUSTOMER_VIEW`

### 3.2 Flow oficial de permissao

Fluxo verificado:

`Role -> Permission Registry/Seed -> User Permissions -> Permission Matcher/ProtectedRoute -> API -> authenticate -> tenantContextMiddleware -> requirePermissions(...) -> service/repository`

Leitura:

- a permissao nasce no registry/seed
- chega ao usuario como conjunto de permissoes
- o frontend filtra navegação com matcher/ProtectedRoute
- a API oficial reaplica autenticacao, tenant context e RBAC no backend

## 4. Roles verificadas

### 4.1 Roles efetivamente verificadas no seed e nos contratos

Roles com evidencia direta nesta auditoria:

- `ROLE_ADMIN_SISTEMA`
- `ROLE_CEO`
- `ROLE_DIRETOR_COMERCIAL_B2B`
- `ROLE_DIRETOR_COMERCIAL_B2C`
- `ROLE_GERENTE_COMERCIAL_B2B`
- `ROLE_GERENTE_COMERCIAL_B2C`
- `ROLE_CONSULTOR_COMERCIAL_B2B`
- `ROLE_CONSULTOR_COMERCIAL_B2C`
- `ROLE_DIRETOR_AUDITORIA`
- `ROLE_GERENTE_AUDITORIA`
- `ROLE_AUDITOR`
- `ROLE_DIRETOR_FINANCEIRO`
- `ROLE_GERENTE_FINANCEIRO`
- `ROLE_ANALISTA_FINANCEIRO`
- `ROLE_ASSISTENTE_FINANCEIRO`
- `ROLE_SUPERINTENDENTE`
- `ROLE_GERENTE_REGIONAL_B2B`
- `ROLE_GERENTE_REGIONAL_B2C`
- `ROLE_SUPERVISOR_BACKOFFICE`
- `ROLE_ASSISTENTE_BACKOFFICE`

### 4.2 Observacao de evidencia

- o seed mostra criacao e associacao de roles
- `ROLE_CEO` recebe permissao de superficie comercial e analitica, incluindo `SALES_VIEW`, `SIMULADOR_VIEW`, `CUSTOMER_VIEW` e `master-catalog:read`
- roles comerciais B2B/B2C aparecem com permissoes de `commercial-request:*`
- nao houve reexecucao completa e end-to-end de todas as roles V1 neste gate read-only

## 5. Matriz RBAC1-RBAC20

| ID | Item | Status | Severidade | Evidencia / gap |
|---|---|---|---|---|
| RBAC1 | autenticacao global | PASS | - | `authenticate` aplicado nos modulos oficiais auditados. |
| RBAC2 | tenant context | PASS | - | `tenantContextMiddleware` aplicado nos modulos oficiais auditados. |
| RBAC3 | permission registry/seed | PASS | - | `backend/prisma/seed.ts` registra `sales:view`, `simulation:execute`, `simulation:evidence:write`, `master-catalog:read` e demais permissoes. |
| RBAC4 | roles coerentes | PASS COM RESSALVA | P2 | roles comerciais e corporativas aparecem no seed; `ROLE_CEO` e roles comerciais tem associacoes coerentes, mas o mapeamento completo de todas as roles V1 nao foi reexecutado end-to-end neste gate. GAP DE EVIDENCIA. |
| RBAC5 | matcher frontend | PASS | - | `src/auth/permissionMatcher.ts` normaliza `read`/`view` e aliases de modulo. |
| RBAC6 | ProtectedRoute | PASS | - | `src/auth/guards.tsx` valida `requiredPermission` com fallback legado controlado e bloqueia sem autenticacao. |
| RBAC7 | CRM backend permissions | PASS COM RESSALVA | P2 | endpoints de clientes em `backend/src/modules/crm/routes.ts` usam permissoes explicitamente; a superficie de `leads` nao foi provada aqui como totalmente fechada no mesmo nivel. GAP DE EVIDENCIA. |
| RBAC8 | Pipeline backend permissions | PASS | - | `backend/src/modules/pipelines/routes.ts` aplica permissoes explicitas por operacao. |
| RBAC9 | Opportunity backend permissions | PASS | - | `backend/src/modules/opportunities/routes.ts` aplica permissoes explicitas por operacao. |
| RBAC10 | Workspace actions | PASS COM RESSALVA | P2 | rotas e menu de workspace seguem o guard de permissao, mas ainda existem aliases e compatibilidades de navegacao no frontend. |
| RBAC11 | Master Catalog/Coverage | PASS COM RESSALVA | P2 | master catalog e o read model oficial; Coverage consome esse contrato, mas ainda convive com comparacao shadow/compatibilidade. |
| RBAC12 | Commercial Tables | PASS | - | `backend/src/modules/commercial/commercial.routes.ts` aplica `requirePermissions('sales:view')` explicitamente no backend. |
| RBAC13 | Simulator runtime | PASS | - | `backend/src/modules/simulation/presentation/http/simulation-runtime.routes.ts` usa `simulation:execute`. |
| RBAC14 | Simulator evidence | PASS | - | `backend/src/modules/simulation/evidence/presentation/http/simulation-runtime-evidence.routes.ts` usa `simulation:evidence:write`. |
| RBAC15 | write actions | PASS COM RESSALVA | P2 | writes de CRM, Opportunity, Pipeline, Commercial Tables e Simulation estao protegidos, mas este gate nao executou todos os writes possiveis nesta auditoria. GAP DE EVIDENCIA. |
| RBAC16 | delete/archive/deactivate | PASS COM RESSALVA | P2 | deletes e soft-deletes existem em rotas oficiais, mas o ciclo archive/deactivate completo nao foi revalidado integralmente neste gate. GAP DE EVIDENCIA. |
| RBAC17 | endpoints paralelos/legado | PASS COM RESSALVA | P2 | surfaces paralelas foram identificadas e classificadas; sua presenca nao e ownership operacional. |
| RBAC18 | tenant isolation | PASS COM RESSALVA | P2 | tenant context e tenant-scoping foram confirmados nos dominios principais; nao houve evidencia de cross-tenant. |
| RBAC19 | testes RBAC | PASS COM RESSALVA | P2 | testes existem e foram inspecionados, mas nao foram executados neste gate read-only. Evidencia de 401/403/200/201 vem do gate anterior de Commercial Tables e dos testes inspecionados. |
| RBAC20 | fluxo V1 integrado por role | PASS COM RESSALVA | P2 | o fluxo role -> registry -> matcher -> API -> backend esta coerente; a matriz completa de roles V1 nao foi executada end-to-end neste gate. GAP DE EVIDENCIA. |

## 6. Roles / Permission Flow

Fluxo documentado e auditado:

1. `Role`
2. `Permission Registry/Seed`
3. `User Permissions`
4. `Permission Matcher/ProtectedRoute`
5. `API`
6. `authenticate`
7. `tenantContextMiddleware`
8. `requirePermissions(...)`
9. `service/repository`

### 6.1 Roles relevantes a V1 realmente verificadas

- `ROLE_ADMIN_SISTEMA`
- `ROLE_CEO`
- `ROLE_DIRETOR_COMERCIAL_B2B`
- `ROLE_DIRETOR_COMERCIAL_B2C`
- `ROLE_GERENTE_COMERCIAL_B2B`
- `ROLE_GERENTE_COMERCIAL_B2C`
- `ROLE_CONSULTOR_COMERCIAL_B2B`
- `ROLE_CONSULTOR_COMERCIAL_B2C`

### 6.2 Observacao de impacto

- se houver divergencia de role em V1, o impacto e classificado aqui como P2 ate existir evidencia de bloqueio real
- nao foi inventado mapping adicional

## 7. Tenant Isolation

### 7.1 Evidencia por dominio critico

#### CRM

- `authenticate` + `tenantContextMiddleware` presentes nas rotas oficiais
- tenant deve vir do contexto autenticado
- nao ha evidencia de aceite de `tenantId` arbitrario vindo do frontend como fonte de autorizacao

#### Pipeline

- rotas oficiais com `authenticate` + `tenantContextMiddleware`
- service/repository operam por tenant

#### Opportunity

- rotas oficiais com `authenticate` + `tenantContextMiddleware`
- fluxo de oportunidade usa tenant context nas operacoes oficiais

#### Master Catalog / Coverage

- read model oficial e tenant-aware
- Coverage consome o contrato oficial do Master Catalog
- nao foi encontrado cross-tenant efetivo no recorte auditado

#### Commercial Tables

- `authenticate` + `tenantContextMiddleware`
- `requirePermissions('sales:view')`
- service/repository operam por tenant

#### Simulator

- runtime oficial usa tenant context
- evidence route usa tenant context
- a superficie standalone nao e considerada fonte de autorizacao

### 7.2 Conclusao de isolamento

- tenant vindo do contexto autenticado: confirmado nos dominos principais
- `tenantContextMiddleware`: confirmado
- repository/service tenant-scoped: confirmado nos dominios principais
- ausencia de confianca em `tenantId` arbitrario do frontend: confirmado no recorte auditado
- cross-tenant comprovado: nao encontrado

## 8. APIs paralelas / legado

### 8.1 Classificacao de superfices encontradas

| Item | Classificacao | Observacao |
|---|---|---|
| `backend/src/server.ts` | KEEP | bootstrap oficial do backend, nao e owner legado paralelo. |
| `backend/src/index.ts` | QUARANTINE | contem superficies `/api/sdr/*` paralelas/legadas. |
| `backend/src/modules/auth/legacy.routes.ts` | QUARANTINE | rotas autenticas legadas ainda presentes. |
| `src/api/client.ts` | QUARANTINE | cliente de compatibilidade com agregacao de endpoints antigos e modernos. |
| `src/api/http.ts` | KEEP | transporte oficial compartilhado. |
| `src/config/environment.ts` | MIGRATE | concentra diversas rotas historicas sem `/api/v1`, incluindo consumidores antigos. |
| `src/pages/SdrIaHub.tsx` | QUARANTINE | consumidor antigo de `/api/sdr/*`. |
| `src/pages/Audiencias.tsx` | MIGRATE | usa superfices historicas `/api/audiences*`. |
| `src/pages/Campanhas.tsx` | MIGRATE | usa superfices historicas `/api/campanhas*`. |
| `src/pages/Conversas.tsx` | MIGRATE | usa superfices historicas `/api/conversations*`. |
| `src/pages/Eventos.tsx` | MIGRATE | usa superfices historicas `/api/eventos*`. |

### 8.2 Observacao de ownership

- a presenca de legado nao altera ownership operacional das APIs oficiais
- `KEEP` significa superficie oficial ou foundation
- `QUARANTINE` significa legado ainda isolado, mas presente
- `MIGRATE` significa consumidor antigo que deve sair do caminho principal
- `REMOVE LATER` nao foi aplicado a nenhum item com evidencia suficiente neste gate

## 9. Testes

### 9.1 Testes executados nesta auditoria

- nenhum teste foi executado nesta auditoria read-only

### 9.2 Testes existentes apenas inspecionados / encontrados

- `backend/src/tests/unit/commercial.routes.test.ts`
- `backend/src/tests/unit/simulation/simulation-runtime.routes.test.ts`
- `backend/src/tests/unit/simulation/simulation-runtime-evidence.routes.test.ts`
- `backend/src/tests/unit/opportunities.routes.test.ts`
- `backend/src/tests/unit/pipelines/pipeline.routes.test.ts`
- `backend/src/tests/unit/master-catalog/master-catalog.routes.test.ts`

### 9.3 Evidencias de rota permitidas nesta auditoria

Para evitar confusao temporal, as evidencias abaixo sao citadas como baseline anterior ou como arquivo de teste inspecionado, nao como execucao desta auditoria:

- `401` sem autenticacao em Commercial Tables
- `403` autenticado sem `sales:view` em Commercial Tables
- `200` `GET /tables` autorizado
- `403` `POST /tables` sem permissao
- `201` `POST /tables` autorizado

Fonte de baseline:

- gate anterior de Commercial Tables e teste de rota inspecionado

## 10. Residuals classificados

### P0

- nenhum P0 comprovado neste gate

### P1

- nenhum P1 restante comprovado neste gate

### P2

- divergencias de nomenclatura e compatibilidade no frontend
- aliases `read`/`view` preservados para compatibilidade
- superfices legadas e consumidores historicos ainda presentes
- cobertura shadow e conciliacao em alguns fluxos de transicao

### P3

- refinamentos de UX e narrativa entre rotas, labels e permissoes
- limpeza cosmetica de compatibilidades antigas sem efeito bloqueador

## 11. Decisao final

**RBAC / PERMISSIONS V1 - GO WITH RESTRICTIONS**

## 12. Fechamento temporal

- nenhuma correcao runtime foi realizada neste gate
- o baseline `01a5899f6aa68f008f77ead1bd230e32a440ee24` ja continha o RBAC corrigido de Commercial Tables
- este gate apenas consolidou a auditoria final de integracao de permissoes
- P0 = nenhum
- P1 = nenhum restante
- P2/P3 = nao bloqueadores
- a decisao final e sustentada pela matriz RBAC1-RBAC20 e pela SSOT documental/runtime auditada
