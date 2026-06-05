# Document Inventory

## ACTIVE

### Governance

- PROJECT_CONTROL_CENTER.md

### Runtime

- RUN-001-RUNTIME_GOVERNANCE.md

### ADR

- ADR-001-commercial-api-source-of-truth.md
- ADR-002-provider-engine.md
- ADR-003-simulation-engine-source-of-truth.md
- ADR-004-commercial-master-catalog.md
- ADR-005-legacy-youware-backend-classification.md
- ADR-006-products-domain-decommission.md

### Standards

- CODING_STANDARDS.md
- ci-cd.md
- testing-strategy.md

---

## REVIEW_REQUIRED

### Runtime

- RUN-002-MIGRATION_MATRIX_REVIEW_REQUIRED.md

### Product

- EXECUTIVE_SUMMARY.md
- IMPLEMENTATION_ROADMAP.md
- README.md

### Architecture

- ARCHITECTURE_INDEX.md
- DOMAIN_MODEL_ARCHITECTURE.md
- BACKEND_FOLDER_STRUCTURE.md

- 01-dominios.md
- 02-entidades.md
- 03-relacionamentos.md
- 04-regras-operacionais.md
- 05-metricas-oficiais.md
- 06-eventos-operacionais.md
- 07-rbac.md
- 08-padroes-backend.md
- 09-padroes-frontend.md
- 10-roadmap-tecnico.md
- 11-backend-modelagem.md
- 12-integrations-domain.md

- api-migration-plan.md
- backend-modularization-plan.md
- domain-hierarchy.md
- domain-refactoring-plan.md
- domain-specialization-map.md
- frontend-domain-map.md
- runtime-decoupling-plan.md
- seed-specialization-plan.md

### Providers

- handmais-provider-audit.md
- sos-bolso-homologation-checklist.md

---

## DRAFT

### Governance Baseline

- PROJECT_CHARTER
- DOCUMENT_CLASSIFICATION
- SOURCE_OF_TRUTH_MATRIX
- EXECUTION_CHECKLIST
- DECISION_LOG
- ROADMAP_ENTERPRISE

---

## ARCHIVED

- current-state-audit.md

---

## WORKING TREE CLASSIFICATION

### COMMIT-01 — Governance Docs Base
Status: `APPROVED WITH EXCLUSIONS`

Approved files:
- `docs/00-governance/PROJECT_CONTROL_CENTER.md`
- `docs/00-governance/AUDIT_DOCUMENT_STANDARD.md`
- `docs/02-architecture/*` exceto exclusões abaixo
- `docs/03-runtime/RUN-001-RUNTIME_GOVERNANCE.md`
- `docs/05-adr/ADR-001-commercial-api-source-of-truth.md`
- `docs/05-adr/ADR-002-provider-engine.md`
- `docs/05-adr/ADR-003-simulation-engine-source-of-truth.md`
- `docs/05-adr/ADR-004-commercial-master-catalog.md`
- `docs/05-adr/ADR-005-legacy-youware-backend-classification.md`
- `docs/06-audits/AUD-002-SEED_SPECIALIZATION_PLAN_REVIEW_REQUIRED.md`
- `docs/06-audits/AUDIT_2026-06-03_PHASE_G25.txt`
- `docs/06-audits/AUDIT_2026-06-03_PHASE_G26_9.txt`
- `docs/06-audits/AUDIT_2026-06-03_STAGED_DOCS.txt`
- `docs/06-audits/AUDIT_2026-06-03_OPORTUNIDADES_DIFF.txt`
- `docs/08-standards/CODING_STANDARDS.md`
- `docs/08-standards/ci-cd.md`
- `docs/08-standards/testing-strategy.md`
- `docs/99-archive/*`
- `BACKEND_FOLDER_STRUCTURE.md`
- `CODING_STANDARDS.md`
- `EXECUTIVE_SUMMARY.md`
- `IMPLEMENTATION_ROADMAP.md`

Exclusions from COMMIT-01:
- `docs/02-architecture/ARCH-009-RBAC_REVIEW_REQUIRED.md`
- `docs/05-adr/ADR-006-products-domain-decommission.md`
- `docs/06-audits/AUDIT_2026-06-04_SEED_GOVERNANCE_AUDIT.md`
- `backend/src/tests/unit/integrations/provider-runtime-diagnostics.service.test.ts`

Notes:
- `docs/02-architecture/ARCH-009-RBAC_REVIEW_REQUIRED.md` remains `REVIEW_REQUIRED`.
- `backend/src/tests/unit/integrations/provider-runtime-diagnostics.service.test.ts` is classified separately as `REVIEW_REQUIRED` and must not be grouped with documentation.

### COMMIT-02 — Opportunity/Pipeline Foundation
Status: `APPROVED`

Files:
- `backend/src/core/http/fastify.ts`
- `backend/src/modules/pipelines/**`
- `backend/src/modules/opportunities/dto/opportunities.dto.ts`
- `backend/src/tests/integration/opportunities.test.ts`
- `backend/src/tests/unit/opportunities.repository.test.ts`
- `backend/src/tests/unit/opportunities.routes.test.ts`
- `backend/src/tests/unit/opportunities.service.test.ts`
- `backend/src/tests/unit/opportunities.validator.test.ts`

Dependency:
- `Opportunity/Pipeline`

### COMMIT-03 — Scope Compatibility Layer
Status: `APPROVED`

Files:
- `backend/src/core/http/middleware.ts`
- `backend/src/types/index.ts`
- `backend/src/utils/jwt.ts`
- `backend/src/modules/opportunities/routes.ts`
- `backend/src/modules/opportunities/services/opportunities.service.ts`
- `backend/src/modules/opportunities/repositories/opportunities.repository.ts`
- `backend/src/modules/opportunities/validators/opportunities.validator.ts`
- `backend/src/tests/unit/tenant-context.middleware.test.ts`

Dependency:
- `Scope Layer`

### COMMIT-04 — Products Decommission
Status: `BLOCKED`

Files:
- `docs/05-adr/ADR-006-products-domain-decommission.md`
- `src/api/adapters.ts`
- `src/api/client.ts`
- `src/api/dataService.ts`
- `src/api/modules/index.ts`
- `src/api/modules/produtos.api.ts`
- `src/auth/permissions.ts`
- `src/components/layout/PageHeader.tsx`
- `src/components/pipeline/pipelineUtils.ts`
- `src/config/environment.ts`
- `src/layouts/MainLayout.tsx`
- `src/pages/Configuracoes.tsx`
- `src/pages/Relatorios.tsx`
- `src/pages/Produtos.tsx`
- `src/store/index.ts`
- `src/types/index.ts`

Dependency:
- `Products Decommission`

Status notes:
- `src/pages/Oportunidades.tsx` is `MIXED`:
  - `Products Decommission`
  - `Frontend Review`

### COMMIT-05 — Seed Governance
Status: `BLOCKED`

Files:
- `backend/prisma/seed.ts`
- `docs/06-audits/AUDIT_2026-06-04_SEED_GOVERNANCE_AUDIT.md`

Dependency:
- `Seed Governance`

### COMMIT-06 — Frontend Review
Status: `REVIEW_REQUIRED`

Files:
- `src/api/modules/opportunities.api.ts`
- `src/pages/Clientes.tsx`
- `src/pages/Oportunidades.tsx`

Dependency:
- `Frontend Review`

Special note:
- `src/pages/Oportunidades.tsx` is `MIXED`:
  - `Products Decommission`
  - `Frontend Review`

### AUDIT_2026-06-04_OPORTUNIDADES_FRONTEND_SPLIT
Resultado: `ISSUES FOUND`

Decisão:
- `src/pages/Oportunidades.tsx` permanece `MIXED` / `BLOCKED`.

COMMIT-04A concluído:
- `backend/server/src/index.ts`
- `backend/server/src/middleware/auth.ts`

COMMIT-06A concluído:
- `src/api/modules/opportunities.api.ts`
- `src/pages/Clientes.tsx`

Pendentes:
- `src/pages/Oportunidades.tsx`
- `src/types/index.ts`
- `src/store/index.ts`
- `src/api/client.ts`
- `src/api/dataService.ts`
- `src/api/adapters.ts`
- `src/components/pipeline/pipelineUtils.ts`

Próxima ação:
- Planejar extraction/refactor pequeno e controlado para separar:
  1. Products/catalog/pipeline compatibility
  2. Opportunity CRUD/UI oficial
  3. Fallback legado temporário

### AUD-010 — OPPORTUNITIES_FRONTEND_EXTRACTION_PLAN
Status: `SAFE EXTRACTION PLAN`

Arquivo em foco:
- `src/pages/Oportunidades.tsx`

Classificação atual:
- `MIXED`

Operação planejada:

#### COMMIT-06B — Opportunity Frontend Official CRUD
Status: `PLANNED`

Escopo:
- `src/api/modules/opportunities.api.ts`
- blocos official `Opportunity` CRUD
- modal e ações CRUD oficiais
- `pipelineId`, `stageId`, `customerId`, `leadId` oficiais

Não incluir:
- `produto_id`
- `selectedProductId`
- `catalogProductOptions`
- `mapearProdutoLegadoParaPipeline`
- fallback de `dataService` / `adapters` / `client`

#### COMMIT-04B — Product/Catalog/Pipeline Compatibility
Status: `PLANNED`

Escopo:
- `selectedProductId`
- `selectedSubproductId`
- `selectedModality`
- `getProductOptions`
- `getPipelineOptions`
- `getPipelineByProductId`
- UI de `Produto` / `Subproduto` / `Modalidade`
- compatibilidade entre catálogo e pipeline

Não incluir:
- remoção do fallback legado ainda

#### COMMIT-04C — Legacy Fallback Cleanup
Status: `FUTURE / BLOCKED`

Escopo futuro:
- `mapearProdutoLegadoParaPipeline`
- fallback `produto_id` / `produtoId`
- `api/client` legado
- `dataService` / `adapters` fallback
- tipo `Produto` legado

Só liberar quando:
- todas as opportunities tiverem `pipelineId` / `stageId` canônicos
- o backend não depender de `produto` para resolver pipeline
- os testes provarem cards, filtros e detalhes sem fallback

Regras:
- Não alterar código.
- Não commitar.
- Apenas documentar o plano.
- `src/pages/Oportunidades.tsx` permanece `MIXED` até a execução de `COMMIT-06B` e `COMMIT-04B`.

### AUD-011 — OPPORTUNITY_OFFICIAL_CRUD_EXTRACTION_AUDIT
Status: `ISSUES FOUND`

Decisão:
- `COMMIT-06B` pode avançar somente com split cirúrgico.
- `src/pages/Oportunidades.tsx` permanece `MIXED` / `BLOCKED` até separação controlada.

Blocos `COMMIT-06B`:
- `opportunitiesApi` oficial
- loader via `opportunitiesApi.getAll`
- campos oficiais `title`, `pipelineId`, `stageId`, `ownerId`, `customerId`, `leadId`
- CRUD oficial `create` / `update` / `moveStage` apenas após separar fallback

Blocos excluídos do `COMMIT-06B`:
- `produto`
- `produto_id`
- `selectedProductId`
- `selectedSubproductId`
- `selectedModality`
- `catalogProductOptions`
- `getProductOptions`
- `getPipelineByProductId`
- `mapearProdutoLegadoParaPipeline`
- `api/client` legacy
- `dataService` / `adapters` fallback
- `deleteOportunidade` legacy

Risco:
- Alto risco de misturar `Product` / `Catalog` / `Pipeline` com `Opportunity CRUD` se `Oportunidades.tsx` for commitado inteiro.

Ordem segura futura:
1. Isolar loader oficial.
2. Separar modal / handlers oficiais.
3. Manter fallback legado temporariamente.
4. Mover `Product` / `Catalog` / `Pipeline` para `COMMIT-04B`.
5. Remover fallback apenas no `COMMIT-04C` futuro.

### AUD-012 — PRODUCTS_COMPATIBILITY_LAYER_ISOLATION
Status: `SAFE ISOLATION PLAN`

Decisão:
- `COMMIT-04B` pode avançar somente para a camada neutra `Product` / `Catalog` / `Pipeline Compatibility`.
- Não tocar em `src/pages/Oportunidades.tsx`.

Pode entrar no `COMMIT-04B`:
- `src/store/index.ts`: blocos `EstruturaComercial`
- `src/types/index.ts`: tipos `EstruturaComercial`

Remoções seguras em patch separado:
- `src/store/index.ts`: `delete nextState.produtos`
- `src/types/index.ts`: `export interface Produto`
- `src/types/index.ts`: `module` / grants `produtos`

Bloqueados por `Oportunidades.tsx`:
- `src/components/pipeline/pipelineUtils.ts`
- `src/store/index.ts`: `initialOportunidades` legado
- `src/types/index.ts`: campos `produto` em `OportunidadeKanban` / `Pipeline`
- `src/api/client.ts` legacy opportunity functions
- `src/api/dataService.ts` fallback
- `src/api/adapters.ts` `defaultOportunidades`

Próxima ordem:
1. Documentar `AUD-012`.
2. Planejar micro-patch `COMMIT-04B` apenas para `EstruturaComercial`.
3. Planejar patch separado de cleanup seguro de `types` / `store`.
4. Manter fallback legado até `COMMIT-04C` futuro.

### AUD-013 — COMMERCIAL_STRUCTURE_COMPATIBILITY_EXTRACTION
Status: `SAFE EXTRACTION PLAN`

Decisão:
- `COMMIT-04B` pode avançar somente com a camada neutra `Commercial Structure`.

Pode entrar no `COMMIT-04B`:
- `src/store/index.ts`
- `buildEstruturaComercialFromCatalog`
- `initialEstruturaComercial`
- bloco de operações de `Estrutura Comercial`
- `src/types/index.ts`
- `EstruturaComercial`
- `EstruturaComercialNivel`

Não pode entrar:
- `initialOportunidades`
- `Pipeline.produto`
- `OportunidadeKanban.produto`
- qualquer fallback ligado a `Oportunidades.tsx`
- `client.ts`
- `dataService.ts`
- `adapters.ts`
- `pipelineUtils.ts`

Remoções seguras em patch separado:
- `delete nextState.produtos`
- `export interface Produto`
- `module` / grants `produtos`

Riscos:
- `Oportunidades.tsx` e `pipelineUtils.ts` ainda dependem do fallback legado.

Testes futuros:
- `npm run build`
- `npm run test:unit`
- smoke da página `Oportunidades`
- validação de filtros / pipeline / cards históricos

### AUD-014 — COMMERCIAL_STRUCTURE_PATCH_READINESS
Status: `ISSUES FOUND`

Decisão:
- `COMMIT-04B` completo não aprovado.
- `COMMIT-04B.1` pode avançar apenas para `Commercial Structure Store Layer`.

`PATCH_READY`:
- `src/store/index.ts`
- `buildEstruturaComercialFromCatalog`
- `initialEstruturaComercial`
- operações de `EstruturaComercial`
- `delete nextState.produtos`

`BLOCKED` / `REVIEW_REQUIRED`:
- `src/types/index.ts` `EstruturaComercial` duplicado
- `src/types/index.ts` `interface Produto`
- `src/types/index.ts` `module: 'produtos'`
- `src/types/index.ts` grants `produtos`
- qualquer fallback ligado a `Oportunidades.tsx`
- `pipelineUtils.ts`

Riscos:
- `types/index.ts` possui duplicidade de `EstruturaComercial` e dependências em `Configuracoes` / `Oportunidades`.

Próxima ação:
- Planejar patch mínimo `COMMIT-04B.1` somente em `src/store/index.ts`.

### AUD-015 — TYPES_PRODUCTS_DECOMMISSION_READINESS
Status: `ISSUES FOUND`

Decisão:
- `src/types/index.ts` permanece `BLOCKED` / `REVIEW_REQUIRED`.

Achados:
- `EstruturaComercialNivel` duplicado
- `EstruturaComercial` duplicado
- definição canônica atual: linhas `362` e `381`
- definição duplicada simplificada: linhas `1769` e `1795`
- `interface Produto` ainda usada por `Oportunidade.produto`
- `module: 'produtos'` ainda sustenta `Configuracoes`
- `PROFILE_PERMISSIONS.produtos` ainda sustenta `store/permissions` e `Configuracoes`
- `Pipeline.produto` e `OportunidadeKanban.produto` ainda sustentam `Oportunidades` / `Dashboard`

Decisão:
- Não remover `Produto`.
- Não remover `module: 'produtos'`.
- Não remover grants `produtos`.
- Não remover `Pipeline.produto`.
- Não remover `OportunidadeKanban.produto`.
- Não mexer em `EstruturaComercial` até resolver duplicidade.

Próxima ação:
- `AUD-016 — TYPES_DUPLICATE_COMMERCIAL_STRUCTURE_RESOLUTION_PLAN`

### AUD-016 — TYPES_DUPLICATE_COMMERCIAL_STRUCTURE_RESOLUTION_PLAN
Status: `SAFE CLEANUP PLAN`

Decisão:
- A definição canônica de `EstruturaComercialNivel` e `EstruturaComercial` é a primeira:
- `EstruturaComercialNivel` linha `~362`
- `EstruturaComercial` linha `~381`

A definição duplicada simplificada é:
- `EstruturaComercialNivel` linha `~1769`
- `EstruturaComercial` linha `~1795`

Não remover ainda.

Antes de remover, revisar campos exclusivos da duplicata simplificada:
- `children`
- `cnpj`
- `contato`
- `telefone`
- `email`
- `site`
- `tabela_codigo_externo`
- `taxa_juros_anual`
- `parcela_minima`
- `parcela_maxima`
- `comissao_banco`
- `comissao_promotora`
- `observacao`
- `created_at`
- `updated_at`

Plano seguro:
1. Tratar primeiro bloco como fonte canônica.
2. Decidir se campos exclusivos da duplicata devem ser incorporados.
3. Validar consumidores:
- `EstruturaComercial.tsx`
- `Dashboard.tsx`
- `RoteirosOperacionais.tsx`
- `store/index.ts`
4. Só depois remover duplicata final.

### REVIEW_REQUIRED — Separate Test Artifact
Status: `REVIEW_REQUIRED`

File:
- `backend/src/tests/unit/integrations/provider-runtime-diagnostics.service.test.ts`

Category:
- `TEST`

Dependency:
- `Nenhuma`

Note:
- This file is not documentation and must stay out of COMMIT-01.

## ORDEM SEGURA DE COMMIT

1. `Governance Docs Base`
2. `Opportunity/Pipeline Foundation`
3. `Scope Compatibility Layer`
4. `Products Decommission — BLOCKED`
5. `Seed Governance — BLOCKED`
6. `Frontend Review — REVIEW_REQUIRED`

======================================================
PHASE G26.9 COMPLETED
======================================================

Architecture Consolidation Review completed.

Validated:
- ADR-001
- ADR-002
- ADR-003
- ADR-004
- ADR-005
- ADR-006
- ADR-007

Validated Architecture:
- ARCH-001
- ARCH-002
- ARCH-003
- ARCH-004
- ARCH-005
- ARCH-008
- ARCH-009
- ARCH-010
- ARCH-011
- ARCH-014
- ARCH-015

Next Official Phase:
G26.10 — Documentation Promotion Plan

Rule:
No code changes before documentation promotion review.
