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

### AUD-026 — PERMISSIONS_COORDINATED_PATCH_DESIGN
Resultado: `REVIEW_REQUIRED`

Decisão:
- PATCH coordenado de permissões ainda não está liberado.

Motivo:
- backend action naming move / move_opportunity
- uso atual de can('oportunidades','move') em Oportunidades.tsx
- ausência de módulo pipelines explícito no modelo atual
- ausência de módulo tabelas_comerciais explícito no modelo atual
- necessidade de alias/compatibilidade move_stage -> move

Decisões propostas:
- move_card deve migrar para move_stage
- move deve convergir para move_stage
- edit_pipeline deve migrar para pipelines.manage
- pipelines deve virar módulo próprio com view/manage
- tabelas_comerciais deve virar módulo próprio com view/create/edit/delete/export

Classificação:
- `src/types/index.ts` = REVIEW_REQUIRED
- `src/pages/Configuracoes.tsx` = REVIEW_REQUIRED
- `src/store/index.ts` = REVIEW_REQUIRED
- `src/store/permissions.ts` = REVIEW_REQUIRED
- `Oportunidades.tsx/backend permission mapping` = dependências externas

Próxima ação:
- `AUD-027 — PERMISSIONS_ACTION_ALIAS_COMPATIBILITY_AUDIT`
  - Objetivo: Auditar compatibilidade entre move, move_card e move_stage antes de qualquer alteração no modelo de permissões.

### AUD-027 — PERMISSIONS_ACTION_ALIAS_COMPATIBILITY_AUDIT
Resultado: `BLOCKED`

Decisão:
- Não migrar move/move_card/move_stage/edit_pipeline ainda.
- Não alterar MODULE_PERMISSIONS.
- Não alterar PROFILE_PERMISSIONS.
- Não alterar Configuracoes.
- Não alterar Oportunidades.
- Não alterar backend RBAC.

Achados:
- move_stage não existe no repo.
- pipelines.manage não existe no repo.
- can('oportunidades','move') existe em Oportunidades.tsx.
- backend usa opportunity:move / oportunidades:move.
- requirePermissions faz match exato.
- move_card existe no modelo frontend de permissões.
- edit_pipeline existe no modelo frontend de permissões.
- permissions.ts possui move_opportunity em outro domínio de naming.

Bloqueios:
- mismatch frontend/backend entre opportunity/oportunidades
- mismatch entre move, move_card, move_opportunity e move_stage
- ausência de alias centralizado
- ausência de pipelines.manage real
- risco alto de quebrar drag/drop de Oportunidades

Próxima ação:
- `AUD-028 — PERMISSIONS_ALIAS_RFC`
  - Objetivo: Desenhar RFC de compatibilidade para aliases de permissão antes de qualquer patch.
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

### AUD-018 — PRODUCTS REMAINING SURFACE AUDIT
Status: `ISSUES FOUND`

Decisão:
- Não há novo patch seguro de `Products` fora de `Oportunidades.tsx` neste momento.
- `COMMIT-04B` adicional permanece bloqueado.

Achados principais:
- `src/auth/permissions.ts` já está limpo.
- `src/api/adapters.ts` mantém fallback de oportunidades mock/dev.
- `src/api/client.ts` mantém `produto_id` e `getOportunidadesPipeline` como compatibilidade.
- `src/api/dataService.ts` mantém wrapper `getPipeline(produtoId)`.
- `src/store/index.ts` `initialOportunidades` ainda depende de `produto` / `pipeline_id` legado.
- `src/types/index.ts` mantém `Pipeline.produto` e `OportunidadeKanban.produto`.
- `src/types/index.ts` mantém `module: 'produtos'` e `PROFILE_PERMISSIONS.produtos`.
- `src/pages/Configuracoes.tsx` ainda renderiza/edita permissões de `Products`.
- `src/pages/Relatorios.tsx` usa `produto` como dimensão de `Commercial Structure`, não como CRUD `Products` legado.
- `src/components/pipeline/pipelineUtils.ts` mantém fallback para itens sem `pipeline_id`.

Classificações:
- `BLOCKED_BY_OPORTUNIDADES_TSX`
- `store.initialOportunidades`
- `Pipeline.produto`
- `OportunidadeKanban.produto`
- `pipelineUtils` fallback
- `BLOCKED_BY_PERMISSIONS`
- `module: 'produtos'`
- `PROFILE_PERMISSIONS.produtos`
- `Configuracoes.tsx` `produtos: true`
- `BLOCKED_BY_COMPATIBILITY`
- `adapters` `defaultOportunidades`
- `client` `getOportunidades` / `getOportunidadesPipeline`
- `dataService` `getPipeline(produtoId)`
- `Oportunidade.produto_id` / `produto?: Produto`
- `KEEP_TEMPORARILY`
- `produto` / `subproduto` em `EstruturaComercial`
- `produto_nome` em financeiro / relatórios
- filtros de `Relatorios` derivados da estrutura comercial

Próxima ação:
- Não alterar código.
- Planejar `AUD-019 — PERMISSIONS_PRODUCTS_DECOMMISSION_PLAN` para tratar `Products` em `Configuracoes` / `types` / `store` / `permissions` como frente separada.

### AUD-019 — PERMISSIONS_PRODUCTS_DECOMMISSION_PLAN
Status: `ISSUES FOUND`

Decisão:
- `Products` ainda aparece na UI / modelo de permissões.
- `Permissions Products Cleanup` permanece `BLOCKED`.

Achados:
- `src/auth/permissions.ts` está limpo.
- `src/store/permissions.ts` não cita `Products` diretamente, mas consome `userPermissions`.
- `src/types/index.ts` mantém `module: 'produtos'`.
- `src/types/index.ts` mantém `PROFILE_PERMISSIONS.produtos`.
- `src/pages/Configuracoes.tsx` ainda renderiza / edita `Products`.
- `src/config/permissions.ts` ainda mantém `PRODUTOS_*`.

Bloqueios:
- `BLOCKED_BY_CONFIGURACOES`
- `Configuracoes.tsx` `produtos: true`
- renderização `MODULE_PERMISSIONS`
- `BLOCKED_BY_PERMISSIONS_MODEL`
- `module: 'produtos'`
- `PROFILE_PERMISSIONS.produtos`
- `PRODUTOS_*` em `config/permissions`
- store fallback `PROFILE_PERMISSIONS`

Decisão:
- Não remover `module: 'produtos'`.
- Não remover `PROFILE_PERMISSIONS.produtos`.
- Não remover `PRODUTOS_*`.
- Não alterar `Configuracoes.tsx` ainda.

Próxima ação:
- `AUD-020 — PERMISSIONS_MODEL_REPLACEMENT_PLAN`

Objetivo futuro:
- desenhar substituto seguro para o modelo de permissões sem `Products`, sem quebrar `Configuracoes`, `store` e hidratação de usuário.

### AUD-020 — PERMISSIONS_MODEL_REPLACEMENT_PLAN
Status: `SAFE PERMISSIONS REPLACEMENT PLAN`

Decisão:
- `Products` não deve permanecer como módulo standalone em permissões.
- O conceito de produto continua válido, mas deve ser absorvido pelos domínios oficiais.

Substitutos oficiais:
- `Estrutura Comercial`: catálogo mestre de `Product`, `Subproduct` e `Modality`
- `Tabelas Comerciais`: condições comerciais, taxas, comissões e elegibilidade
- `Pipeline`: domínio operacional separado do catálogo
- `Opportunity`: unidade operacional central

Decisão para `Configuracoes.tsx`:
- `NÃO` deve continuar exibindo `Products` como módulo administrável.

Matriz futura:
- `module: 'produtos'` -> `estrutura_comercial`, `tabelas_comerciais`, `oportunidades`, `pipelines`
- `PROFILE_PERMISSIONS.produtos` -> grants separados por domínio oficial
- `PRODUTOS_VIEW` -> `ESTRUTURA_COMERCIAL_VIEW`
- `PRODUTOS_CREATE` -> `ESTRUTURA_COMERCIAL_CREATE`
- `PRODUTOS_EDIT` -> `ESTRUTURA_COMERCIAL_EDIT`
- `PRODUTOS_DELETE` -> `ESTRUTURA_COMERCIAL_DELETE`
- `PRODUTOS_EXPORT` -> `ESTRUTURA_COMERCIAL_EXPORT`
- parte de condições comerciais -> `TABELAS_COMERCIAIS_*`
- parte operacional -> `OPORTUNIDADES_*` e `PIPELINE_*`

Risco:
- `ALTO` remover `Products` sem substituição coordenada, porque `Configuracoes.tsx`, `types/index.ts`, `config/permissions.ts` e `store/index.ts` estão acoplados.

Próxima ação:
- Planejar `AUD-021 — PERMISSIONS_REPLACEMENT_PATCH_READINESS` para validar um patch coordenado, não uma remoção picada.

### AUD-022 — PERMISSIONS_REPLACEMENT_IMPLEMENTATION_PLAN
Status: `ISSUES FOUND`

Decisão:
- Existe plano de implementação, mas o patch ainda está bloqueado até aprovação da matriz final.

Matriz atual:
- `module: 'produtos'`
- `PROFILE_PERMISSIONS.produtos`
- `PRODUTOS_VIEW`
- `PRODUTOS_CREATE`
- `PRODUTOS_EDIT`
- `PRODUTOS_DELETE`
- `PRODUTOS_EXPORT`

Matriz futura proposta:
- `estrutura_comercial`
  - `view`
  - `create`
  - `edit`
  - `delete`
  - `export`
- `tabelas_comerciais`
  - `view`
  - `create`
  - `edit`
  - `delete`
  - `export`
- `oportunidades`
  - manter domínio oficial
  - avaliar `move_card` vs `move_stage`
- `pipelines`
  - `view`
  - `manage`

Substituições:
- `PRODUTOS_*` -> `ESTRUTURA_COMERCIAL_*` como principal substituto
- parte de condições comerciais -> `TABELAS_COMERCIAIS_*`
- parte operacional -> `OPORTUNIDADES_*` e `PIPELINES_*`

Bloqueios:
- `MODULE_PERMISSIONS` precisa receber novos módulos antes de remover `produtos`
- `PROFILE_PERMISSIONS` precisa redistribuir grants por perfil
- `Configuracoes.tsx` depende do shape atual
- `store/index.ts` depende do fallback `PROFILE_PERMISSIONS`
- `TABELAS_COMERCIAIS_*` está incompleto
- `pipelines` ainda não tem módulo completo

Próxima ação:
- `AUD-023 — PERMISSIONS_MATRIX_APPROVAL_DECISION`

Objetivo:
- Aprovar oficialmente a matriz futura antes de qualquer patch.

### AUD-024 — PERMISSIONS_MIGRATION_PATCH_READINESS
Status: `REVIEW_REQUIRED`

Decisão:
- `Permissions Migration` completa ainda não está `PATCH_READY`.

Status:
- `PATCH-01` `src/types/index.ts` = `REVIEW_REQUIRED`
- `PATCH-02` `src/config/permissions.ts` = `PATCH_READY`
- `PATCH-03` `Configuracoes` / `store` = `BLOCKED`

Decisões aprovadas:
- Remover `PRODUTOS_*` no futuro patch coordenado.
- Completar `TABELAS_COMERCIAIS_*`.
- Criar `PIPELINES_MANAGE`.
- Manter `ESTRUTURA_COMERCIAL_*`.
- Migrar `move_card` / `move` para `move_stage`.
- Migrar `edit_pipeline` para `pipelines.manage`.

Bloqueios:
- `MODULE_PERMISSIONS` depende de redistribuição completa.
- `PROFILE_PERMISSIONS` depende de redistribuição completa.
- `Configuracoes.tsx` renderiza diretamente a matriz atual.
- `store/index.ts` hidrata permissões pelo `PROFILE_PERMISSIONS` atual.

Próxima ação:
- Executar apenas `PATCH-02` em `src/config/permissions.ts` como micro-patch, se aprovado, sem tocar `types` / `configuracoes` / `store`.

### AUD-025 — PERMISSIONS_MODEL_MIGRATION_EXECUTION_AUDIT
Status: `ISSUES FOUND`

Decisão:
- `PATCH-01` permanece `REVIEW_REQUIRED`.

Motivo:
- A migração do modelo de permissões exige alteração coordenada entre:
  - `src/types/index.ts`
  - `src/pages/Configuracoes.tsx`
  - `src/store/index.ts`
  - `src/store/permissions.ts`

Pontos impactados:
- `module: 'produtos'`
- `PROFILE_PERMISSIONS.produtos`
- `produtos: true`
- `oportunidades.move_card` -> `oportunidades.move_stage`
- `oportunidades.edit_pipeline` -> `pipelines.manage`
- `oportunidades.move` -> `oportunidades.move_stage`

Perfis afetados:
- `master`
- `financeiro`
- `comercial_diretoria`
- `regional`
- `gerente`
- `vendedor`
- `bko`
- `ADMIN_SISTEMA`
- `ADMIN_FRANQUIA`
- `FRANQUEADO`
- `SDR`
- `FINANCEIRO`
- `OPERACIONAL`

Risco:
- `ALTO` se a migração for parcial.

Decisão:
- Não alterar `src/types/index.ts` isoladamente.
- Não alterar `Configuracoes.tsx` isoladamente.
- Não alterar `store/index.ts` isoladamente.
- Não alterar `store/permissions.ts` isoladamente.

Próxima ação:
- `AUD-026 — PERMISSIONS_COORDINATED_PATCH_DESIGN`

Objetivo:
- desenhar o patch coordenado em etapas atômicas antes de execução.

### AUD-028 — PERMISSIONS_ALIAS_RFC
Status: `APPROVED`

Decisão:
- A ação canônica final para movimentação de oportunidades será `move_stage`.
- O namespace canônico backend é `opportunity`.
- O namespace frontend permanece `oportunidades` como compatibilidade temporária.
- A gestão de pipeline será `pipelines.manage`.
- `edit_pipeline` será alias temporário de `pipelines.manage`.

Aliases aprovados:
- `move_card` -> `move_stage`
- `move` -> `move_stage`
- `move_opportunity` -> `move_stage`
- `opportunity:move` -> `opportunity:move_stage`
- `oportunidades:move` -> `oportunidades:move_stage`
- `edit_pipeline` -> `pipelines.manage`

Estratégia:
- Canonicalização deve ocorrer no frontend e no backend.
- Backend é autoridade final.
- Frontend preserva compatibilidade e UX.
- Não remover nomes antigos no primeiro patch.

Riscos:
- drag/drop de `Oportunidades` depende de `can('oportunidades','move')`
- `Configuracoes` renderiza `MODULE_PERMISSIONS` diretamente
- `store` hidrata via `PROFILE_PERMISSIONS`
- backend `requirePermissions` faz match exato

Ordem segura:
1. Registrar RFC.
2. Criar camada de aliases sem remover nomes antigos.
3. Atualizar writers / configuração para nomes canônicos.
4. Atualizar backend RBAC para aceitar aliases.
5. Remover aliases legados somente em cleanup futuro.

### AUD-029 — PERMISSIONS_ALIAS_IMPLEMENTATION_READINESS
Status: `REVIEW_REQUIRED`

Decisão:
- Existe caminho técnico para `alias layer`, mas ainda não liberar patch.

Pontos `PATCH_READY`:
- `src/store/index.ts`: `hasPermission` e possivelmente `setAuth`
- `backend/src/modules/rbac/rbac.guard.ts`: `requirePermissions`
- `backend/server/src/middleware/auth.ts`: `hasPermission` / `requirePermission`

Pontos `REVIEW_REQUIRED`:
- `src/store/permissions.ts`
- `src/pages/Configuracoes.tsx`
- `src/types/index.ts`
- `backend/server/src/index.ts`

Decisão técnica:
- Frontend canonicalização em `hasPermission`
- Frontend normalização complementar em `setAuth`
- Backend novo canonicalização em `rbac.guard` `requirePermissions`
- Backend legado canonicalização em `auth middleware`
- Não alterar consumidores no primeiro patch
- Não alterar `Oportunidades.tsx`
- Não alterar `Configuracoes.tsx`
- Não alterar `MODULE_PERMISSIONS` / `PROFILE_PERMISSIONS` ainda

Riscos:
- drag/drop de oportunidades
- store hydration
- backend guards
- mismatch `opportunity` / `oportunidades`
- mismatch `move` / `move_card` / `move_stage` / `move_opportunity`

Próxima ação:
- `AUD-030 — PERMISSIONS_ALIAS_PATCH_BLUEPRINT`

Objetivo:
- Desenhar o patch mínimo coordenado para `alias layer` em frontend store + backend guard + backend legacy auth, sem alterar consumidores.

### AUD-030 — PERMISSIONS_ALIAS_PATCH_BLUEPRINT
Status: `REVIEW_REQUIRED`

Decisão:
- Blueprint mínimo definido, mas patch ainda não autorizado.

`PATCH_READY`:
- `src/store/index.ts`
- `backend/src/modules/rbac/rbac.guard.ts`
- `backend/server/src/middleware/auth.ts`

`REVIEW_REQUIRED`:
- `src/store/permissions.ts`

`BLOCKED` no primeiro patch:
- `src/pages/Oportunidades.tsx`
- `src/pages/Configuracoes.tsx`
- `src/types/index.ts`

Funções alvo:
- `src/store/index.ts` `setAuth`
- `src/store/index.ts` `hasPermission`
- `backend/src/modules/rbac/rbac.guard.ts` `requirePermissions`
- `backend/server/src/middleware/auth.ts` `hasPermission`
- `backend/server/src/middleware/auth.ts` `requirePermission`

Aliases aprovados:
- `move_card` -> `move_stage`
- `move` -> `move_stage`
- `move_opportunity` -> `move_stage`
- `opportunity:move` -> `opportunity:move_stage`
- `oportunidades:move` -> `oportunidades:move_stage`
- `opportunity:move_opportunity` -> `opportunity:move_stage`
- `oportunidades:move_card` -> `oportunidades:move_stage`
- `edit_pipeline` -> `pipelines.manage`
- `oportunidades:edit_pipeline` -> `pipelines:manage`

Estratégia:
- Não alterar consumidores no primeiro patch.
- Não alterar `Oportunidades.tsx`.
- Não alterar `Configuracoes.tsx`.
- Não alterar `MODULE_PERMISSIONS`.
- Não alterar `PROFILE_PERMISSIONS`.
- Canonicalizar no frontend store e nos guards backend.

Próxima ação:
- `AUD-031 — PERMISSIONS_ALIAS_PATCH_READINESS_FINAL`

Objetivo:
- Confirmar se o patch mínimo pode ser executado em um único commit coordenado com testes obrigatórios.

### AUD-031 — PERMISSIONS_ALIAS_PATCH_READINESS_FINAL
Status: `BLOCKED`

Decisão:
- `Permission Alias Layer` não está `PATCH_READY` como micro-patch isolado.

Achados:
- `src/store/index.ts` `setAuth` e `hasPermission` estão `PATCH_READY`.
- `backend/src/modules/rbac/rbac.guard.ts` `requirePermissions` está `PATCH_READY`.
- `backend/server/src/middleware/auth.ts` `hasPermission` / `requirePermission` está `PATCH_READY`.
- `src/pages/Oportunidades.tsx` ainda usa `can('oportunidades','move')`.
- `src/types/index.ts` ainda declara `move_card`, `edit_pipeline` e `move`.
- `backend/server/src/index.ts` ainda mantém `oportunidades:move` em mapa local.

Decisão:
- Não implementar `alias layer` agora.
- Não alterar `store`.
- Não alterar `backend guard`.
- Não alterar `backend auth middleware`.
- Não alterar `Oportunidades.tsx`.
- Não alterar `types/index.ts`.
- Não alterar `Configuracoes.tsx`.

Motivo:
- A camada de alias continua viável, mas depende de consumidores literais ainda espalhados. O patch precisa ser tratado como alteração coordenada, não como micro-patch isolado.

Próxima ação:
- `AUD-032 — PERMISSIONS_ALIAS_COORDINATED_IMPLEMENTATION_PLAN`

Objetivo:
- Desenhar um plano coordenado que inclua consumidores literais, camada de autorização e testes obrigatórios antes da implementação.

### AUD-032 — PERMISSIONS_ALIAS_COORDINATED_IMPLEMENTATION_PLAN
Status: `APPROVED`

Decisão:
- Plano coordenado de migração de aliases aprovado.

Sequência oficial:
1. `COMMIT-A — Backend Alias Compatibility`
2. `COMMIT-B — Frontend Authorization Compatibility`
3. `COMMIT-C — Consumer Migration`
4. `COMMIT-D — Cleanup Final`

`COMMIT-A`:
- `backend/src/modules/rbac/rbac.guard.ts`
- `backend/server/src/middleware/auth.ts`
- revisar `backend/server/src/index.ts` sem alterar consumidores inicialmente

`COMMIT-B`:
- `src/store/index.ts`
- validar `src/store/permissions.ts`

`COMMIT-C`:
- `src/pages/Oportunidades.tsx`
- `src/pages/Configuracoes.tsx`
- `src/types/index.ts`

`COMMIT-D`:
- remover aliases legados
- remover `move`, `move_card`, `edit_pipeline` quando seguro

Aliases coexistentes até fim do `COMMIT-C`:
- `move_card` -> `move_stage`
- `move` -> `move_stage`
- `move_opportunity` -> `move_stage`
- `opportunity:move` -> `opportunity:move_stage`
- `oportunidades:move` -> `oportunidades:move_stage`
- `edit_pipeline` -> `pipelines.manage`
- `oportunidades:edit_pipeline` -> `pipelines:manage`

Ponto de corte seguro:
- Só remover aliases após:
  - `Oportunidades.tsx` não usar mais `can('oportunidades','move')`
  - `src/types/index.ts` não declarar mais `move_card` / `move` / `edit_pipeline`
  - `Configuracoes` renderizar matriz canônica
  - frontend store hidratar e autorizar nomes canônicos
  - backend novo e legado aceitarem apenas nomes canônicos
  - testes de drag/drop, guards, perfis e integração passarem

Riscos residuais:
- drag/drop de `Oportunidades`
- divergência entre store e backend
- `Configuracoes` renderizando matriz antiga
- cleanup prematuro

### AUD-033 — COMMIT_A_BACKEND_ALIAS_COMPATIBILITY_EXECUTION_AUDIT
Status: `PATCH_READY`

Decisão:
- `COMMIT-A — Backend Alias Compatibility` está liberado como commit único.

Arquivos permitidos:
- `backend/src/modules/rbac/rbac.guard.ts`
- `backend/server/src/middleware/auth.ts`

Funções alvo:
- `requirePermissions`
- `hasPermission`
- `requirePermission`

Aliases permitidos:
- `opportunity:move` <-> `opportunity:move_stage`
- `oportunidades:move` <-> `oportunidades:move_stage`
- `move` -> `move_stage`
- `move_opportunity` -> `move_stage`
- `edit_pipeline` -> `pipelines:manage`
- `oportunidades:edit_pipeline` -> `pipelines:manage`

Fora do patch:
- `backend/src/modules/opportunities/routes.ts`
- `backend/src/modules/pipelines/routes.ts`
- `backend/server/src/index.ts`
- frontend `src/*`

Sem impacto:
- contratos HTTP
- JWT payload
- schema / banco
- RBAC persistido
- rotas

Testes obrigatórios após patch:
- `npm run test:unit`
- `npm run test:integration`
- `npm run build`
- testes focados de opportunities routes / guards
- testes focados de middleware auth legado

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

### AUD-034 — COMMIT_B_FRONTEND_AUTHORIZATION_COMPATIBILITY_AUDIT
Resultado: `REVIEW_REQUIRED`

Decisão:
`COMMIT-B` ainda não está `PATCH_READY`.

Achados:
- `src/store/index.ts` `setAuth` está `PATCH_READY`.
- `src/store/index.ts` `hasPermission` está `PATCH_READY`.
- `src/store/permissions.ts` delega para `hasPermission` e pode ficar sem mudança.
- `Oportunidades.tsx` pode permanecer inalterado se `hasPermission` suportar aliases.
- `Configuracoes.tsx` pode permanecer inalterado, mas exige smoke test.
- `MODULE_PERMISSIONS` pode permanecer inalterado nesta fase.
- `PROFILE_PERMISSIONS` pode permanecer inalterado nesta fase.
- Existe RBAC paralelo fora do store em:
  - `src/auth/permissions.ts`
  - `src/auth/guards.tsx`
  - `src/layouts/MainLayout.tsx`
  - `src/utils/rbac.ts`

Risco:
`ALTO`, porque o frontend possui mais de uma trilha de verificação de permissões.

Decisão:
- Não executar `COMMIT-B` ainda.
- Não alterar store isoladamente.
- Não alterar `Oportunidades.tsx`.
- Não alterar `Configuracoes.tsx`.
- Não alterar `MODULE_PERMISSIONS` / `PROFILE_PERMISSIONS`.

Próxima ação:
`AUD-035 — FRONTEND_RBAC_PARALLEL_PATHS_AUDIT`

Objetivo:
Mapear todas as trilhas paralelas de RBAC frontend antes de decidir se `COMMIT-B` deve incluir apenas store ou também `auth/guards/layout/utils`.

### AUD-035 — FRONTEND_RBAC_PARALLEL_PATHS_AUDIT
Resultado: `REVIEW_REQUIRED`

Decisão:
`COMMIT-B` não deve avançar como `store-only` sem decisão explícita de escopo.

Achados:
- Não existe uma única fonte de verdade de RBAC frontend.
- Existe RBAC duplicado.
- Store RBAC decide `module/action` para UI local.
- Auth RBAC decide acesso de rotas/componentes via `canAccess` / `hasPermissionMatch`.
- Layout RBAC decide menu/sidebar com `ROUTE_PERMISSIONS`.
- `utils/rbac.ts` é legado/deprecated, mas ainda representa caminho paralelo.
- `src/auth/permissions.ts` usa `move_opportunity`.
- `src/store/types` usam `move` / `move_card` / `edit_pipeline` em outros pontos.
- `src/layouts/MainLayout.tsx` faz bridge improvisada entre `store.userPermissions` e auth matcher.

Decisão técnica:
A camada oficial futura deveria ser `auth`:
- `src/auth/permissions.ts`
- `src/auth/guards.tsx`
- `src/auth/permissionMatcher.ts`

O store deveria ficar como:
- hidratação
- cache de permissões
- bridge para UI local

Bloqueio:
`COMMIT-B` precisa ser redefinido:
- ou como patch limitado ao drag/drop/store path
- ou como patch coordenado de consolidação RBAC frontend

Próxima ação:
`AUD-036 — FRONTEND_RBAC_SOURCE_OF_TRUTH_DECISION`

Objetivo:
Decidir oficialmente se a fonte de verdade frontend será `auth/*` ou `store/*` antes de qualquer patch.

### AUD-036 — FRONTEND_RBAC_SOURCE_OF_TRUTH_DECISION
Resultado: `AUTH`

Decisão:
A fonte oficial futura do RBAC frontend será `auth/*`.

Camada oficial:
- `src/auth/permissions.ts`
- `src/auth/guards.tsx`
- `src/auth/permissionMatcher.ts`

Papel do store:
- hidratação
- cache de permissões
- bridge para UI local
- adapter temporário

Decisões:
- `auth.canAccess` será a verificação oficial.
- `auth.hasPermissionMatch` será o núcleo de matching/compatibilidade.
- `ProtectedRoute` permanece como guard oficial de rotas.
- `PermissionGate` permanece como gate oficial de componentes.
- `store.hasPermission` deve virar adapter.
- `store.useCan/usePermission` devem virar adapters.
- `MainLayout` deve continuar, mas ancorado no matcher/auth oficial.
- `src/utils/rbac.ts` deve ser deprecated e removido em cleanup posterior.

Impactos:
- `Oportunidades.tsx`
- `Configuracoes.tsx`
- Rotas protegidas
- Menu/sidebar
- `useCan`

Próxima ação:
`AUD-037 — COMMIT_B_AUTH_SOURCE_ADAPTER_PLAN`

Objetivo:
Desenhar `COMMIT-B` com `AUTH` como fonte oficial e `STORE` como adapter, sem alterar consumidores sensíveis ainda.

### AUD-037 — COMMIT_B_AUTH_SOURCE_ADAPTER_PLAN
Resultado: `REVIEW_REQUIRED`

Decisão:
`COMMIT-B` deve usar `AUTH` como fonte oficial e `STORE` como adapter.

Fonte oficial:
- `auth.canAccess`

Matcher oficial:
- `auth.hasPermissionMatch`

Store:
- `setAuth` = hidratação / cache / normalização complementar
- `hasPermission` = adapter para `auth.canAccess`
- `useCan` / `usePermission` = manter API atual, consumindo `store.hasPermission`

Arquivos que entram no `COMMIT-B`:
- `src/auth/permissions.ts`
- `src/auth/permissionMatcher.ts`
- `src/store/index.ts`
- `src/store/permissions.ts`

Arquivos fora do `COMMIT-B`:
- `src/auth/guards.tsx`
- `src/layouts/MainLayout.tsx`
- `src/pages/Oportunidades.tsx`
- `src/pages/Configuracoes.tsx`
- `src/types/index.ts`

Decisões:
- Não alterar `Oportunidades.tsx`.
- Não alterar `Configuracoes.tsx`.
- Não alterar `MODULE_PERMISSIONS`.
- Não alterar `PROFILE_PERMISSIONS`.
- `MainLayout` continua usando `hasPermissionMatch` por enquanto.
- `utils/rbac.ts` permanece deprecated para cleanup futuro.

Bloqueio:
`auth/permissionMatcher.ts` ainda precisa suportar aliases:
- `move` -> `move_stage`
- `move_card` -> `move_stage`
- `move_opportunity` -> `move_stage`
- `edit_pipeline` -> `pipelines.manage`

Próxima ação:
`AUD-038 — COMMIT_B_FRONTEND_ALIAS_PATCH_READINESS`

Objetivo:
Validar se o patch coordenado em `auth/permissionMatcher` + `auth/permissions` + `store/index` + `store/permissions` está `PATCH_READY`.

### AUD-038 — COMMIT_B_FRONTEND_ALIAS_PATCH_READINESS
Resultado: `REVIEW_REQUIRED`

Decisão:
`COMMIT-B` ainda não está `PATCH_READY`.

Achados:
- `src/store/index.ts` está `PATCH_READY`.
- `src/store/permissions.ts` está `PATCH_READY`.
- `src/auth/permissions.ts` depende do matcher e permanece `REVIEW_REQUIRED`.
- `src/auth/permissionMatcher.ts` é o bloqueio principal.
- `hasPermissionMatch` hoje suporta `read` / `view`, `module:read` / `module:view`, `module:*` e legado `MODULE_ACTION`.
- `hasPermissionMatch` ainda não suporta:
  - `move` -> `move_stage`
  - `move_card` -> `move_stage`
  - `move_opportunity` -> `move_stage`
  - `edit_pipeline` -> `pipelines.manage`
  - `oportunidades:move` -> `oportunidades:move_stage`
  - `oportunidades:move_card` -> `oportunidades:move_stage`

Decisão:
- Não executar `COMMIT-B` ainda.
- Não alterar `Oportunidades.tsx`.
- Não alterar `Configuracoes.tsx`.
- Não alterar `MainLayout`.
- Não alterar `types/index.ts`.

Próxima ação:
`AUD-039 — PERMISSION_MATCHER_ALIAS_PATCH_READINESS`

Objetivo:
Validar se `src/auth/permissionMatcher.ts` pode receber sozinho a matriz de aliases aprovada no AUD-028, sem alterar store, guards, layouts ou consumidores.

### AUD-039 — PERMISSION_MATCHER_ALIAS_PATCH_READINESS
Resultado: `REVIEW_REQUIRED`

Decisão:
`src/auth/permissionMatcher.ts` é o ponto correto para absorver aliases, mas ainda não liberar patch isolado.

Achados:
- `ACTION_ALIAS_MAP` já existe.
- `MODULE_ALIAS_MAP` já existe.
- `buildPermissionVariants` já centraliza expansão.
- `hasPermissionMatch` é consumido por:
  - `src/auth/guards.tsx`
  - `src/auth/permissions.ts`
  - `src/layouts/MainLayout.tsx`
- O matcher já suporta `read` / `view`, `module:*`, `module:read` / `module:view` e `MODULE_ACTION` legado.
- Ainda não suporta:
  - `move` -> `move_stage`
  - `move_card` -> `move_stage`
  - `move_opportunity` -> `move_stage`
  - `edit_pipeline` -> `pipelines.manage`
  - `oportunidades:move` -> `oportunidades:move_stage`
  - `oportunidades:move_card` -> `oportunidades:move_stage`
  - `opportunity:move` -> `opportunity:move_stage`
  - `opportunity:move_opportunity` -> `opportunity:move_stage`

Risco:
`MÉDIO/ALTO`, porque `edit_pipeline` -> `pipelines.manage` cruza módulo e ação.

Decisão:
Não executar patch isolado apenas em `permissionMatcher` ainda.

Próxima ação:
`AUD-040 — FRONTEND_ALIAS_CROSS_MODULE_RISK_AUDIT`

Objetivo:
Auditar especificamente o risco de aliases que cruzam módulo + ação, principalmente `edit_pipeline` -> `pipelines.manage`, antes de implementar `COMMIT-B`.

### AUD-040 — FRONTEND_ALIAS_CROSS_MODULE_RISK_AUDIT
Resultado: `REVIEW_REQUIRED`

Decisão:
`edit_pipeline` -> `pipelines.manage` pode entrar no `COMMIT-B`, mas não como regra global no `permissionMatcher`.

Achados:
- `edit_pipeline` aparece em `src/types/index.ts`.
- `pipelines.manage` ainda não aparece como literal no frontend auditado.
- `PIPELINES_MANAGE` existe em `src/config/permissions.ts`.
- Não foi encontrada evidência forte de `oportunidades:*` literal no frontend.
- O risco principal é `oportunidades.edit_pipeline`, não `oportunidades:*`.

Decisão técnica:
- `permissionMatcher` deve absorver apenas aliases de mesma família:
  - `move` -> `move_stage`
  - `move_card` -> `move_stage`
  - `move_opportunity` -> `move_stage`
  - `oportunidades:move` -> `oportunidades:move_stage`
  - `oportunidades:move_card` -> `oportunidades:move_stage`
  - `opportunity:move` -> `opportunity:move_stage`
  - `opportunity:move_opportunity` -> `opportunity:move_stage`
- `auth.canAccess` deve tratar a ponte cross-module:
  - `edit_pipeline` <-> `pipelines.manage`
  - `oportunidades:edit_pipeline` <-> `pipelines.manage`

Bloqueio:
`COMMIT-B` ainda permanece `REVIEW_REQUIRED` até formalizar o desenho exato de implementação:
- matcher para aliases de mesma família
- `canAccess` para cross-module
- `store.hasPermission` como adapter

Próxima ação:
`AUD-041 — COMMIT_B_FINAL_PATCH_DESIGN`

Objetivo:
Desenhar o patch final do `COMMIT-B` com:
- `permissionMatcher` limitado a aliases de movimento
- `canAccess` tratando `edit_pipeline` / `pipelines.manage`
- `store.hasPermission` delegando para `canAccess`
- sem alterar `Oportunidades.tsx`, `Configuracoes.tsx`, `MainLayout` ou `types/index.ts`

### AUD-041 — COMMIT_B_FINAL_PATCH_DESIGN
Resultado: `PATCH_READY`

Decisão:
O desenho final do `COMMIT-B` está definido e o patch pode avançar no escopo coordenado aprovado.

Aliases exclusivamente em `src/auth/permissionMatcher.ts`:
- `move` -> `move_stage`
- `move_card` -> `move_stage`
- `move_opportunity` -> `move_stage`
- `oportunidades:move` -> `oportunidades:move_stage`
- `oportunidades:move_card` -> `oportunidades:move_stage`
- `opportunity:move` -> `opportunity:move_stage`
- `opportunity:move_opportunity` -> `opportunity:move_stage`

Aliases exclusivamente em `src/auth/permissions.ts` (`canAccess`):
- `edit_pipeline` <-> `pipelines.manage`
- `oportunidades:edit_pipeline` <-> `pipelines.manage`

Store:
- `hasPermission` deve virar adapter para `auth.canAccess`
- `setAuth` pode manter hidratação/cache e apenas normalização complementar sem mudar o shape público
- `useCan` / `usePermission` permanecem com a API atual, consumindo `store.hasPermission`

Confirmações:
- `src/pages/Oportunidades.tsx` permanece inalterado
- `src/pages/Configuracoes.tsx` permanece inalterado
- `src/layouts/MainLayout.tsx` permanece inalterado
- `src/auth/guards.tsx` permanece inalterado
- `src/types/index.ts` permanece inalterado

Tabela final:

| arquivo | função | alteração | risco | commit |
|---|---|---|---|---|
| `src/auth/permissionMatcher.ts` | `buildPermissionVariants` / `hasPermissionMatch` | absorver apenas aliases de movimento e coexistência same-family | `MÉDIO` | `COMMIT-B` |
| `src/auth/permissions.ts` | `canAccess` | tratar ponte cross-module `edit_pipeline` / `pipelines.manage` | `MÉDIO/ALTO` | `COMMIT-B` |
| `src/store/index.ts` | `hasPermission` | delegar para `auth.canAccess` como adapter | `MÉDIO` | `COMMIT-B` |
| `src/store/index.ts` | `setAuth` | normalização complementar sem alterar shape público | `BAIXO/MÉDIO` | `COMMIT-B` |
| `src/store/permissions.ts` | `useCan` / `usePermission` | manter API atual consumindo o adapter do store | `BAIXO` | `COMMIT-B` |

Arquivos que entram no `COMMIT-B`:
- `src/auth/permissionMatcher.ts`
- `src/auth/permissions.ts`
- `src/store/index.ts`
- `src/store/permissions.ts`

Arquivos fora do `COMMIT-B`:
- `src/auth/guards.tsx`
- `src/layouts/MainLayout.tsx`
- `src/pages/Oportunidades.tsx`
- `src/pages/Configuracoes.tsx`
- `src/types/index.ts`

Próxima ação:
Executar o `COMMIT-B — Frontend Authorization Compatibility` no escopo acima, com testes obrigatórios após aplicação.

### AUD-042 — COMMIT_C_CONSUMER_MIGRATION_SCOPE_AUDIT
Resultado: `REVIEW_REQUIRED`

Decisão:
`COMMIT-C` é viável, mas deve ser dividido.

Fatiamento aprovado:
- `C1 — types permission matrix`
- `C2 — Oportunidades consumer`
- `C3 — Configuracoes UI validation`

Ordem segura:
1. `src/types/index.ts`
2. `src/pages/Oportunidades.tsx`
3. `src/pages/Configuracoes.tsx`

Achados:
- `src/types/index.ts` ainda contém `move_card`, `edit_pipeline` e `move`.
- `src/pages/Oportunidades.tsx` ainda contém `can('oportunidades','move')`.
- `src/pages/Configuracoes.tsx` depende indiretamente de `MODULE_PERMISSIONS` e `PROFILE_PERMISSIONS`.

Decisão:
- Não migrar `Oportunidades` antes de `types`.
- Não mexer em `Configuracoes` antes de confirmar a nova matriz.
- Manter alias layer de `COMMIT-A` e `COMMIT-B` como proteção durante a transição.

Próxima ação:
`AUD-043 — COMMIT_C1_TYPES_PERMISSION_MATRIX_READINESS`

Objetivo:
Validar a matriz exata em `src/types/index.ts` antes de alterar:
- `move_card` -> `move_stage`
- `move` -> `move_stage`
- remover `edit_pipeline` de `oportunidades`
- introduzir `pipelines.manage` na matriz canônica

### AUD-043 — COMMIT_C1_TYPES_PERMISSION_MATRIX_READINESS
Resultado: `REVIEW_REQUIRED`

Decisão:
`C1 — Types Permission Matrix` é viável como commit isolado em `src/types/index.ts`, mas ainda exige validação funcional da UI de permissões.

Escopo C1:
- `src/types/index.ts`

Fora do C1:
- `ROLE_PERMISSIONS`
- `Products Decommission`
- `interface Produto`
- `Pipeline.produto`
- `OportunidadeKanban.produto`
- `module: 'produtos'`
- `PROFILE_PERMISSIONS.produtos`
- `Oportunidades.tsx`
- `Configuracoes.tsx`

Mudanças planejadas:
- `MODULE_PERMISSIONS.oportunidades`:
  - `move_card` -> `move_stage`
  - remover `edit_pipeline`
- adicionar módulo `pipelines`:
  - `view`
  - `manage`
- `PROFILE_PERMISSIONS`:
  - `move_card` -> `move_stage`
  - `move` -> `move_stage`
  - remover `edit_pipeline` de `oportunidades`
  - adicionar `pipelines: ['manage']` para perfis que tinham `edit_pipeline`:
    - `master`
    - `comercial_diretoria`
    - `gerente`

Perfis que recebem `move_stage`:
- `master`
- `comercial_diretoria`
- `regional`
- `gerente`
- `vendedor`
- `ADMIN_SISTEMA`
- `ADMIN_FRANQUIA`
- `FRANQUEADO`
- `SDR`

Perfis sem mudança:
- `financeiro`
- `bko`
- `FINANCEIRO`
- `OPERACIONAL`

Riscos:
- `Configuracoes.tsx` renderiza `MODULE_PERMISSIONS` e `PROFILE_PERMISSIONS` diretamente.
- Editor de permissões é o consumidor mais sensível.
- Alias layer de `COMMIT-A/B` protege `Oportunidades` durante transição.

Próxima ação:
`AUD-044 — COMMIT_C1_TYPES_PATCH_BLUEPRINT`

Objetivo:
Gerar o patch exato para `src/types/index.ts`, com matriz final e perfis, antes de implementar.
