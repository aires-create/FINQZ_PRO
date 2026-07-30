# EPC-W5-01 - Master Catalog Complete Inventory

## 1. Metadados
- status: `COMPLETE` for audit inventory, `GO WITH RESTRICTIONS` for adoption posture
- data: `2026-07-12`
- branch: `homologation/bootstrap-vps`
- commit: `54f8388138ce0ed3f87e691976a7efda7a434d22`
- escopo: inventario completo e auditavel do Master Catalog e seus consumidores
- executor: Codex
- natureza da auditoria: leitura, classificacao tecnica, evidencias e documentacao; sem alteracao de producao

## 2. Objetivo
Mapear a implementacao oficial atual do Master Catalog, suas fronteiras, contratos publicos, consumidores diretos e indiretos, fontes paralelas, shadow reads, flags, testes, observabilidade, riscos e gaps de evidencia, sem executar migracoes, sem remover legado e sem alterar comportamento funcional.

## 3. Documentos oficiais consultados
- [DCA-FINQZ-PRO-ENTERPRISE-v2.md](/C:/Projects/FINQZ_PRO/docs/00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md)
- [PCCD-FINQZ-PRO-ENTERPRISE.md](/C:/Projects/FINQZ_PRO/docs/00-master/PCCD-FINQZ-PRO-ENTERPRISE.md)
- [RUN-001-RUNTIME_GOVERNANCE.md](/C:/Projects/FINQZ_PRO/docs/03-runtime/RUN-001-RUNTIME_GOVERNANCE.md)
- [ADR-004-commercial-master-catalog.md](/C:/Projects/FINQZ_PRO/docs/05-adr/ADR-004-commercial-master-catalog.md)
- [ADR-010-loan-with-collateral-canonical-taxonomy.md](/C:/Projects/FINQZ_PRO/docs/05-adr/ADR-010-loan-with-collateral-canonical-taxonomy.md)
- [EPC-W4-01-CONSUMER-CANONICAL-INVENTORY.md](/C:/Projects/FINQZ_PRO/docs/01-architecture/EPC-W4-01-CONSUMER-CANONICAL-INVENTORY.md)
- [EPC-W4-02-MASTER-CATALOG-PROMOTION.md](/C:/Projects/FINQZ_PRO/docs/01-architecture/EPC-W4-02-MASTER-CATALOG-PROMOTION.md)
- [SDC-FASE-2.7-MASTER-CATALOG-CANONICALIZATION-BLUEPRINT.md](/C:/Projects/FINQZ_PRO/docs/01-architecture/SDC-FASE-2.7-MASTER-CATALOG-CANONICALIZATION-BLUEPRINT.md)
- [SDC-FASE-3.1-MASTER-CATALOG-RUNTIME.md](/C:/Projects/FINQZ_PRO/docs/01-architecture/SDC-FASE-3.1-MASTER-CATALOG-RUNTIME.md)
- [SDC-FASE-3.2A-SIMULATION-CONTRACT-ADOPTION-AUDIT.md](/C:/Projects/FINQZ_PRO/docs/01-architecture/SDC-FASE-3.2A-SIMULATION-CONTRACT-ADOPTION-AUDIT.md)
- [ARCH-041-MASTER-CATALOG-CONSUMER-MAPPING.md](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-041-MASTER-CATALOG-CONSUMER-MAPPING.md)
- [ARCH-042-MASTER-CATALOG-API-CONTRACT-DESIGN.md](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-042-MASTER-CATALOG-API-CONTRACT-DESIGN.md)
- [ARCH-043-MASTER-CATALOG-PERSISTENCE-STRATEGY.md](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-043-MASTER-CATALOG-PERSISTENCE-STRATEGY.md)
- [ARCH-044-MASTER-CATALOG-ROLLOUT-MIGRATION-STRATEGY.md](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-044-MASTER-CATALOG-ROLLOUT-MIGRATION-STRATEGY.md)
- [ARCH-046-master-catalog-persistence-blueprint.md](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-046-master-catalog-persistence-blueprint.md)
- [ARCH-047-master-catalog-repository-contract-design.md](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-047-master-catalog-repository-contract-design.md)
- [ARCH-048-master-catalog-api-read-contract-blueprint.md](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-048-master-catalog-api-read-contract-blueprint.md)
- [ARCH-049-master-catalog-application-service-blueprint.md](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-049-master-catalog-application-service-blueprint.md)
- [ARCH-050-master-catalog-end-to-end-read-flow-blueprint.md](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-050-master-catalog-end-to-end-read-flow-blueprint.md)
- [ARCH-051-master-catalog-runtime-readiness-checklist.md](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-051-master-catalog-runtime-readiness-checklist.md)
- [ARCH-052-master-catalog-architecture-consolidation-review.md](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-052-master-catalog-architecture-consolidation-review.md)
- [ARCH-053-master-catalog-runtime-gap-assessment.md](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-053-master-catalog-runtime-gap-assessment.md)
- [ARCH-054-master-catalog-runtime-entry-review.md](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-054-master-catalog-runtime-entry-review.md)
- [ARCH-055-catalog-consumption-architecture.md](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-055-catalog-consumption-architecture.md)

## 4. Restricoes e premissas
- Nenhuma migracao foi executada.
- Nenhum arquivo de producao foi alterado.
- Nenhum contrato HTTP publico foi modificado.
- Nenhum banco foi alterado.
- Nenhuma seed oficial foi executada ou modificada.
- Nenhum deploy, commit ou push foi realizado.
- As alteracoes locais preexistentes foram preservadas: `.env.example`, `docs/01-architecture/SDC-FASE-3.4H-F-LOCAL-ACTIVATION-READINESS.md`, `scripts/sdc-3.4h-f-local-readiness.mjs`.
- A ausencia de `docs/00-master/FINQZ-PRO-ENTERPRISE-CONTEXT-SSOT.md` foi tratada como gap documental, nao como inventacao de conteudo.

## 5. Baseline do repositorio

### 5.1 Estado Git
- branch atual: `homologation/bootstrap-vps`
- head: `54f8388138ce0ed3f87e691976a7efda7a434d22`
- upstream: `origin/homologation/bootstrap-vps`
- status local: modified `.env.example`; untracked `docs/01-architecture/SDC-FASE-3.4H-F-LOCAL-ACTIVATION-READINESS.md`; untracked `scripts/sdc-3.4h-f-local-readiness.mjs`

### 5.2 Estrutura principal
- frontend Vite + React no root
- backend Fastify + Prisma em `backend/`
- documentacao ampla em `docs/`
- scripts de apoio em `scripts/`
- testes no root e em `backend/src/tests`

### 5.3 Package managers
- root: npm
- backend: npm
- workspaces: nao ha declaracao de `workspaces` no root
- lockfiles: `package-lock.json` e `backend/package-lock.json`

### 5.4 Scripts principais
- root: `npm run dev`, `npm run build`, `npm run test`, `npm run arch:check`
- backend: `npm run dev`, `npm run build`, `npm run test`, `npm run test:unit`, `npm run test:integration`, `npm run db:seed`, `npm run db:generate`, `npm run db:migrate`

### 5.5 Documentos oficiais encontrados
- DCA, PCCD, RUN-001, ADR-004, ADR-010
- EPC-W4-01, EPC-W4-02
- SDC-FASE-2.7, SDC-FASE-3.1, SDC-FASE-3.2A
- ARCH-041..055 e correlatos de rollout/persistence/api/read-flow

## 6. Implementacao oficial do Master Catalog

### 6.1 Conclusao objetiva
A implementacao oficial atual do Master Catalog e o modulo backend em `backend/src/modules/master-catalog/**`, com runtime oficial de leitura, repository Prisma, seed oficial, contrato de dominio, DTOs, validator HTTP e rotas Fastify registradas em `backend/src/core/http/fastify.ts`.

### 6.2 Por que esta e a implementacao oficial
- O DCA e o PCCD tratam o backend como fonte oficial de continuidade e o Master Catalog como SSOT de taxonomia.
- O documento `SDC-FASE-3.1-MASTER-CATALOG-RUNTIME.md` declara explicitamente o backend Master Catalog como owner canonico de leitura.
- O Prisma schema possui tabelas dedicadas: `MasterCatalogSegment`, `MasterCatalogProduct`, `MasterCatalogSubproduct` e `MasterCatalogModality`.
- O seed oficial persiste a tree a partir de `MASTER_CATALOG_INITIAL_TREE`.
- O runtime exposto em `MasterCatalogRuntime` define metadata canonica `source: 'backend/master-catalog'` e versionamento `3.1.0`.
- A rota publica exige `master-catalog:read`, tenant context e validacao de query/params.
- Ha teste unitario cobrindo contrato, DTO, mapper, read-model, validator, routes, controller, service e runtime.

### 6.3 Fronteira de dominio
- `backend/src/modules/master-catalog/domain/master-catalog.contract.ts`
- `backend/src/modules/master-catalog/domain/master-catalog.read-model.ts`
- `backend/src/modules/master-catalog/domain/master-catalog.mapper.ts`
- `backend/src/modules/master-catalog/domain/master-catalog-repository.contract.ts`
- `backend/src/modules/master-catalog/services/master-catalog.service.contract.ts`
- `backend/src/modules/master-catalog/presentation/http/master-catalog.http.contract.ts`

### 6.4 Persistencia oficial
- `backend/prisma/schema.prisma` define os modelos `MasterCatalogSegment`, `MasterCatalogProduct`, `MasterCatalogSubproduct`, `MasterCatalogModality`
- `backend/prisma/seed.ts` faz upsert idempotente por tenant e codigo
- `backend/src/modules/master-catalog/repositories/master-catalog.prisma.repository.ts` aplica `tenantId`, `status`, `deletedAt = null`, ordenacao por `displayOrder` + `name`

### 6.5 Seed oficial
- `backend/src/modules/master-catalog/domain/master-catalog.seed.ts` e a fonte canonica de inicializacao
- tree observada:
  - 6 segments
  - 5 products
  - 5 subproducts
  - 10 modalities

### 6.6 Runtime oficial
- `backend/src/modules/master-catalog/application/master-catalog.runtime.ts`
- `backend/src/modules/master-catalog/services/master-catalog.service.ts`
- `backend/src/modules/master-catalog/presentation/http/master-catalog.controller.ts`
- `backend/src/modules/master-catalog/presentation/http/master-catalog.routes.ts`
- `backend/src/modules/master-catalog/validators/master-catalog.validator.ts`
- `backend/src/modules/master-catalog/validators/master-catalog.http.schema.ts`

### 6.7 Razao tecnica para ser o oficial
Esta stack e a unica que junta contrato, read-model, normalizacao, persistencia, seed, DTO, runtime, HTTP e testes em uma mesma fronteira de dominio. As fontes locais do frontend continuam existindo, mas sao explicitamente tratadas pelos docs e pelo proprio codigo como compatibilidade, fallback ou shadow.

## 7. Fronteiras arquiteturais
- Backend: owner canonico da taxonomia
- Frontend: consumidor de contrato publicado
- Tenant scoping: requerido em repository, service e controller
- RBAC: `master-catalog:read` na surface publica
- Fluxo sem escrita: a API publica do Master Catalog e read only
- Normalizacao: ordenacao por `displayOrder` e `name` antes da publicacao
- Downstream mapping: `commercial-structure` consome `MasterCatalogTreeReadModel` para derivacao de cobertura comercial
- Adapter de simulacao: `loan-with-collateral` usa o runtime para normalizar nomes e ids, mas ainda carrega compatibilidade por alias e fallback para request fields

## 8. Contratos publicos
- HTTP routes oficiais:
  - `GET /api/v1/master-catalog/tree`
  - `GET /api/v1/master-catalog/segments`
  - `GET /api/v1/master-catalog/products`
  - `GET /api/v1/master-catalog/products/:productId/subproducts`
  - `GET /api/v1/master-catalog/subproducts/:subproductId/modalities`
- Permission map: `master-catalog:read`
- DTOs:
  - `CatalogSegmentDto`
  - `CatalogProductDto`
  - `CatalogSubproductDto`
  - `CatalogModalityDto`
  - `MasterCatalogTreeDto`
  - `MasterCatalogRuntimeMetadataDto`
- Schema/validator:
  - `MasterCatalogListQuerySchema`
  - `MasterCatalogProductIdParamsSchema`
  - `MasterCatalogSubproductIdParamsSchema`
- Runtime metadata:
  - `version: 3.1.0`
  - `compatibilityMode: CANONICAL`
  - `source: 'backend/master-catalog'`

## 9. Inventario de consumers

| ID | Modulo | Arquivo | Papel | Dependencia | Status | Criticidade | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-01 | Oportunidades | `src/pages/Oportunidades.tsx` | HTTP consumer | `masterCatalogApi.getCatalogTree` | MIGRATED | P1 | importa `masterCatalogApi` e carrega `ACTIVE`; fallback apenas para tree vazia em erro |
| C-02 | Estrutura Comercial | `src/features/master-catalog/loadEstruturaComercialFromMasterCatalog.ts` + `src/pages/EstruturaComercial.tsx` | HTTP consumer / bootstrap consumer | `masterCatalogApi.getCatalogTree` + mapper | MIGRATED | P1 | bootstrap e sync usam apenas o backend Master Catalog |
| C-03 | Commercial Coverage | `src/features/commercial-structure/loadCommercialStructureCoverageTree.ts` + `src/pages/CommercialCoverage.tsx` | shadow read consumer | `masterCatalogApi.getCatalogTree` + `creditPfCatalog` como sombra | SHADOW_READ | P1 | compara tree canonica contra `creditPfCatalog` e loga divergencias |
| C-04 | Commercial Structure mapper backend | `backend/src/modules/commercial-structure/domain/commercial-structure.mapper.ts` | adapter consumer | `MasterCatalogTreeReadModel` | MIGRATED | P1 | consome a tree canonica e deriva coverage tree sem fonte local |
| C-05 | Loan with collateral adapter | `backend/src/modules/simulation/products/loan-with-collateral/loan-with-collateral.adapter.ts` | adapter consumer | `masterCatalogRuntime.findProductByCode` / `findSubproductByCode` | PARTIALLY_MIGRATED | P0 | normaliza id/nome via runtime, mas ainda usa alias e fallback para request fields |
| C-06 | Tabelas Comerciais | `src/pages/TabelasComerciais.tsx` | service consumer | `commercialApi.listTables` + `commercialRepository` helpers | PARTIALLY_MIGRATED | P1 | backend tables API existe, porem os seletores ainda dependem de fonte local para produto/subproduto/modalidade |
| C-07 | Simulador | `src/pages/Simulador.tsx` | parallel source consumer | `simulatorRepository` + `commercialRepository` | PARALLEL_SOURCE | P1 | pagina continua ancorada em estado local e repositorios de compatibilidade |
| C-08 | Catalog repository local | `src/data/catalogRepository.ts` | static data consumer / compatibility adapter | `creditPfCatalog` | LEGACY | P2 | header declara retorno local do `creditPfCatalog`; nenhuma leitura backend real |
| C-09 | Commercial repository local | `src/data/commercialRepository.ts` | static data consumer / compatibility support | `creditPfCatalog` + estado local em memoria | PARALLEL_SOURCE | P1 | ancora seletores e tabelas em catalogo local e estado local |
| C-10 | Store local | `src/store/index.ts` | static data consumer | `creditPfCatalog` | LEGACY | P2 | store gera `EstruturaComercial` a partir do catálogo local |

## 10. Catálogos paralelos e fontes locais
- `src/data/creditPfCatalog.ts`: fonte local mais rica de produtos PF; contem `EMPRESTIMO_COM_GARANTIA`, `AUTO_EQUITY`, `HOME_EQUITY`, `CONSIGNADO`, `ENERGIA`, `SEGURO`, `CONSORCIO`
- `src/data/catalogRepository.ts`: adapter local sobre `creditPfCatalog`
- `src/data/commercialRepository.ts`: apoio local para UI comercial e simulador
- `src/data/simulatorRepository.ts`: estado em memoria para simulacao
- `src/store/index.ts`: derivado de `creditPfCatalog`
- `src/features/commercial-structure/commercialCoverageShadowComparator.ts`: usa `creditPfCatalog` como shadow source
- `backend/src/modules/simulation/products/loan-with-collateral/loan-with-collateral.metadata.ts`: registry de aliases e feature flag do produto

## 11. Repositories

### 11.1 Oficiais
- `backend/src/modules/master-catalog/repositories/master-catalog.prisma.repository.ts`

### 11.2 Paralelos / compatibilidade
- `src/data/catalogRepository.ts`
- `src/data/commercialRepository.ts`
- `src/data/simulatorRepository.ts`

### 11.3 Observacao
Nao foi encontrado repository paralelo de Master Catalog no backend fora da fronteira oficial. O que existe fora dela sao repositories de compatibilidade, apoio ou simulacao.

## 12. Seeds e dados iniciais
- seed oficial do catalogo: `backend/src/modules/master-catalog/domain/master-catalog.seed.ts`
- runner oficial: `backend/prisma/seed.ts`
- evidencia:
  - o runner faz upsert por `tenantId` + `code`
  - o seed oficial nao importa `commercial`, `pipeline`, `opportunity` ou `creditPfCatalog`
  - os testes do seed verificam 6 segments, Consignado, modalidades esperadas e ausencia de dados comerciais
- seeds concorrentes do Master Catalog: nao encontrados

## 13. APIs, controllers e rotas
- API client frontend: `src/api/modules/master-catalog.api.ts`
- controller backend: `backend/src/modules/master-catalog/presentation/http/master-catalog.controller.ts`
- rotas backend: `backend/src/modules/master-catalog/presentation/http/master-catalog.routes.ts`
- registro no bootstrap: `backend/src/core/http/fastify.ts` registra `masterCatalogRoutes` em `/api/v1/master-catalog`
- contrato HTTP: `backend/src/modules/master-catalog/presentation/http/master-catalog.http.contract.ts`

## 14. Runtime e simulation
- runtime oficial do catalogo: `backend/src/modules/master-catalog/application/master-catalog.runtime.ts`
- runtime de simulacao com dependencia de catalogo:
  - `backend/src/modules/simulation/products/loan-with-collateral/loan-with-collateral.adapter.ts`
  - `backend/src/modules/simulation/application/simulation.application.context.ts`
  - `backend/src/modules/simulation/application/simulation.application.pipeline.ts`
- shadow runtime no frontend:
  - `src/features/simulation-runtime/hooks/useSimulationRuntimeShadow.ts`
  - `src/features/simulation-runtime/config/simulation-runtime.flags.ts`
  - `src/features/simulation-runtime/telemetry/simulation-runtime.telemetry.ts`
  - `src/features/simulation-runtime/evidence/*`

## 15. CRM, oportunidades e operacoes
- `src/pages/Oportunidades.tsx` consome a tree oficial do Master Catalog para selecao e normalizacao de produto/subproduto
- `src/pages/EstruturaComercial.tsx` bootstrapa a estrutura comercial a partir do Master Catalog
- `backend/src/modules/commercial-structure/domain/commercial-structure.mapper.ts` deriva cobertura comercial da tree canonica
- `src/store/index.ts`, `config/pipelines.ts` e helpers correlatos ainda carregam compatibilidade historica em outros dominios, mas nao sao SSOT do Master Catalog

## 16. Produtos e parceiros
- `src/data/creditPfCatalog.ts` continua sendo o catalogo local mais rico para PF
- `backend/src/modules/simulation/products/loan-with-collateral/loan-with-collateral.metadata.ts` define:
  - `EMPRESTIMO_COM_GARANTIA`
  - `HOME_EQUITY`
  - `AUTO_EQUITY`
  - aliases compatibilidade
  - `featureFlags: ['loan-with-collateral']`
- `backend/src/modules/commercial-structure/domain/commercial-structure.mapper.ts` faz a ponte para cobertura comercial
- parceiros e providers aparecem em `commercialRepository`, mas sem ownership canonico do Master Catalog

## 17. Integracoes e providers
- Nenhuma integracao externa foi encontrada como owner canonico do Master Catalog
- `commercialRepository.ts` carrega listas locais de providers para UI comercial e simulador
- `backend/src/modules/integrations/**` e `provider-catalog.ts` tratam outro eixo de dominio
- Conclusao: nao ha provider externo escrevendo o Master Catalog; o bypass e local, nao externo

## 18. Frontend
- Consumo canonico:
  - `src/pages/Oportunidades.tsx`
  - `src/pages/EstruturaComercial.tsx`
  - `src/features/master-catalog/loadEstruturaComercialFromMasterCatalog.ts`
  - `src/features/commercial-structure/loadCommercialStructureCoverageTree.ts`
- Consumidores de compatibilidade:
  - `src/pages/Simulador.tsx`
  - `src/pages/TabelasComerciais.tsx`
  - `src/data/catalogRepository.ts`
  - `src/data/commercialRepository.ts`
  - `src/store/index.ts`
- Shadow/observabilidade:
  - `src/features/commercial-structure/commercialCoverageShadowComparator.ts`
  - `src/features/simulation-runtime/hooks/useSimulationRuntimeShadow.ts`

## 19. Shadow Read
- Shadow read ativo e confirmado:
  - `src/features/commercial-structure/loadCommercialStructureCoverageTree.ts` carrega Master Catalog como primary source
  - `src/features/commercial-structure/commercialCoverageShadowComparator.ts` compara contra `creditPfCatalog`
  - logs de divergencia usam `console.info` / `console.warn`
- Shadow read adjacente:
  - `src/features/simulation-runtime/hooks/useSimulationRuntimeShadow.ts` executa runtime sombra da simulacao e coleta evidencia
- Nao foi encontrado shadow read especifico do Master Catalog no backend alem das derivacoes e testes; o shadow atual e principalmente frontend/commercial coverage

## 20. Feature Flags
- Flags de simulacao relevantes para migracao e shadow:
  - `VITE_SIMULATION_RUNTIME_SHADOW_ENABLED` -> default `false`
  - `VITE_SIMULATION_RUNTIME_PRIMARY_ENABLED` -> default `false`
  - `VITE_SIMULATION_RUNTIME_FALLBACK_ENABLED` -> default `true`
  - `VITE_SIMULATION_RUNTIME_EVIDENCE_ENABLED` -> default `false`
  - `VITE_REMOTE_EVIDENCE_ENABLED` -> default `false`
- Flag de produto no backend:
  - `loan-with-collateral`
- Gap:
  - nao foi encontrada feature flag especifica para rollout do Master Catalog

## 21. Testes existentes

### 21.1 Backend master catalog
- `backend/src/tests/unit/master-catalog/master-catalog.contract.test.ts`
- `backend/src/tests/unit/master-catalog/master-catalog.read-model.test.ts`
- `backend/src/tests/unit/master-catalog/master-catalog.mapper.test.ts`
- `backend/src/tests/unit/master-catalog/master-catalog.seed.test.ts`
- `backend/src/tests/unit/master-catalog/master-catalog.service.test.ts`
- `backend/src/tests/unit/master-catalog/master-catalog.runtime.test.ts`
- `backend/src/tests/unit/master-catalog/master-catalog.controller.test.ts`
- `backend/src/tests/unit/master-catalog/master-catalog.routes.test.ts`
- `backend/src/tests/unit/master-catalog/master-catalog.http.contract.test.ts`
- `backend/src/tests/unit/master-catalog/master-catalog.validator.test.ts`

### 21.2 Frontend mapping e shadow
- `src/features/master-catalog/masterCatalogToEstruturaComercial.mapper.test.ts`
- `src/features/commercial-structure/commercialStructureCoverage.mapper.test.ts`
- `src/features/commercial-structure/commercialCoverageShadowComparator.test.ts`
- `src/features/commercial-structure/loadCommercialStructureCoverageTree.test.ts`

### 21.3 Runtime shadow e evidencia
- `src/features/simulation-runtime/simulation-runtime.feature.test.ts`
- `src/features/simulation-runtime/evidence/simulation-runtime.evidence.test.ts`
- `src/features/simulation-runtime/evidence/remote/*.test.ts`

### 21.4 Cobertura funcional observada
- testes do backend cobrem contrato, seed, runtime, routes, controller, validator e DTO
- testes do frontend cobrem mapeamento e shadow comparison
- nenhum teste identificado provando eliminacao completa de `creditPfCatalog`, `catalogRepository` e `commercialRepository`

## 22. Observabilidade existente
- backend observability:
  - `backend/src/infra/observability/*`
  - `backend/src/core/http/request-correlation.ts`
  - `backend/src/modules/audit/*`
  - `backend/src/modules/simulation/evidence/*`
  - `backend/prisma/migrations/20260517000000_security_event_logging_foundation`
- frontend observability:
  - `src/features/simulation-runtime/telemetry/simulation-runtime.telemetry.ts`
  - `src/features/simulation-runtime/evidence/*`
- catalog-specific observability:
  - logs de divergencia no shadow comparator
  - nenhuma metrica dedicada do Master Catalog foi encontrada

## 23. Bypasses e violacoes de fronteira
- `src/data/creditPfCatalog.ts` continua sendo uma SSOT paralela de fato para parte do frontend
- `src/data/catalogRepository.ts` contorna o backend oficial e segue lendo do catalogo local
- `src/data/commercialRepository.ts` ancora seletores e tabelas em fonte local
- `src/store/index.ts` deriva estrutura comercial de catalogo local
- `backend/src/modules/simulation/products/loan-with-collateral/loan-with-collateral.adapter.ts` admite fallback para request fields quando o runtime nao resolve o item
- `src/pages/Oportunidades.tsx` usa fallback para tree vazia em erro de catalogo, o que evita quebra de UI, mas pode mascarar indisponibilidade

## 24. Matriz de adocao

| ID | Status | Justificativa objetiva |
| --- | --- | --- |
| C-01 | MIGRATED | usa apenas o backend Master Catalog como fonte de leitura |
| C-02 | MIGRATED | bootstrap e sync usam o backend Master Catalog |
| C-03 | SHADOW_READ | primary source canonica + shadow local `creditPfCatalog` |
| C-04 | MIGRATED | backend translator baseado na tree canonica |
| C-05 | PARTIALLY_MIGRATED | usa runtime canonico, mas preserva alias/fallback |
| C-06 | PARTIALLY_MIGRATED | backend table API + helpers locais ainda coexistem |
| C-07 | PARALLEL_SOURCE | simulador ainda depende de repositorios locais e estado proprio |
| C-08 | LEGACY | leitura local direta de `creditPfCatalog` |
| C-09 | PARALLEL_SOURCE | apoio local operacional ainda ativo |
| C-10 | LEGACY | store derivado de catalogo local |

### 24.1 Distribuicao de classificacao
- MIGRATED: 3
- PARTIALLY_MIGRATED: 2
- SHADOW_READ: 1
- LEGACY: 2
- PARALLEL_SOURCE: 2
- UNKNOWN: 0
- NOT_APPLICABLE: 0

### 24.2 Leitura executiva
- Backend oficial ja existe e e consistente.
- Frontend central para catalogo ja usa a API oficial em varios pontos.
- Ainda ha fontes paralelas vivas para produtos, simulador, tabelas comerciais e store local.

## 25. Riscos

| Severidade | Risco | Evidencia | Impacto |
| --- | --- | --- | --- |
| CRITICAL | `creditPfCatalog` permanece como SSOT paralelo de produtos PF | `src/data/creditPfCatalog.ts`, `src/store/index.ts`, `catalogRepository`, `commercialRepository` | divergencia de taxonomia entre frontend e backend |
| HIGH | `commercialRepository` segue como fonte paralela para Simulador e Tabelas Comerciais | `src/pages/Simulador.tsx`, `src/pages/TabelasComerciais.tsx` | manter dupla verdade para produto/subproduto/modalidade |
| HIGH | `loan-with-collateral` continua resolvendo alias e fallback local | `loan-with-collateral.adapter.ts`, metadata e subflows | mapeamento pode aceitar compatibilidade obsoleta |
| MEDIUM | `CommercialCoverage` depende de shadow comparison com fonte local | `loadCommercialStructureCoverageTree.ts` | o shadow e util, mas indica adocao incompleta |
| MEDIUM | `Oportunidades` degrada para tree vazia em erro | `src/pages/Oportunidades.tsx` | pode mascarar indisponibilidade do Master Catalog |
| MEDIUM | Nao existe flag especifica de rollout do Master Catalog | busca em repo sem flag dedicada | dificulta controle fino de migracao |

## 26. Gaps de evidencia
- Gap documental: nao existe `docs/00-master/FINQZ-PRO-ENTERPRISE-CONTEXT-SSOT.md`
- Nao foi encontrada metrica oficial de adocao do Master Catalog por consumer
- Nao foi encontrada prova de remocao completa de `creditPfCatalog`, `catalogRepository` e `commercialRepository`
- Nao foi encontrada prova de que `Simulador` e `TabelasComerciais` operem sem qualquer dependencia local de catalogo
- Nao foi encontrada metricas de divergencia historica do shadow read do catalogo
- Nao foi executado um corte de producao; entao a adocao total nao pode ser afirmada

## 27. Candidatos a migracao
- `src/data/creditPfCatalog.ts`
- `src/data/catalogRepository.ts`
- `src/data/commercialRepository.ts`
- `src/data/simulatorRepository.ts`
- `src/store/index.ts`
- `src/pages/Simulador.tsx`
- `src/pages/TabelasComerciais.tsx`
- `backend/src/modules/simulation/products/loan-with-collateral/loan-with-collateral.adapter.ts`
- `src/features/commercial-structure/commercialCoverageShadowComparator.ts`
- `src/pages/Oportunidades.tsx` for empty-tree fallback hardening

## 28. Recomendações

### Curto prazo
- Consolidar telemetria de adocao por consumer.
- Manter `creditPfCatalog` apenas como compatibilidade formal, sem novo consumo.
- Registrar explicitamente o gap documental do SSOT de entrada.

### Proxima fase
- Migrar `TabelasComerciais` e `Simulador` para os contratos canonicamente alinhados.
- Reduzir a dependencia de alias/fallback no adapter `loan-with-collateral`.
- Trocar shadow reads por validacao de consistencia monitorada quando o baseline estiver estavel.

### Decisao por ADR
- Formalizar o destino de `creditPfCatalog`, `catalogRepository` e `commercialRepository`.
- Aprovar ou rejeitar a eliminacao de aliases de `loan-with-collateral`.
- Definir a politica de fallback aceitavel para indisponibilidade do Master Catalog.

### Investigacao adicional
- Medir adocao real por pagina, por dominio e por contrato.
- Levantar se existe algum consumer externo ao workspace usando os mesmos identificadores locais.

## 29. Criterios sugeridos para W5-02
- Nenhum consumer catalogo critico deve depender de `creditPfCatalog` como fonte primaria.
- `catalogRepository` e `commercialRepository` devem estar formalmente classificados como compatibilidade ou removidos.
- `Simulador` e `TabelasComerciais` precisam de contrato de leitura canonica validado.
- Shadow read deve produzir evidencia mensuravel e reprodutivel.
- Fallback de UI deve ser explicitamente diferenciado de fonte de verdade.

## 30. Conclusao
O Master Catalog oficial existe, esta bem separado em contrato, runtime, persistencia, seed e HTTP, e ja e consumido por partes importantes do frontend e por um mapper backend. Entretanto, o workspace ainda apresenta fontes paralelas vivas e shims locais relevantes, entao a adocao nao e total.

## 31. Veredito
`GO WITH RESTRICTIONS`

## 32. Arquivos criados ou modificados pela auditoria
- `docs/09-audits/EPC-W5-01-MASTER-CATALOG-INVENTORY.md`
- `docs/09-audits/evidence/EPC-W5-01-MASTER-CATALOG-INVENTORY.json`

## 33. Comandos executados
- `git status --short --branch`
- `git rev-parse --abbrev-ref HEAD`
- `git rev-parse HEAD`
- `git rev-parse --abbrev-ref --symbolic-full-name '@{u}'`
- `Get-ChildItem -Force`
- `Get-Content` em DCA, PCCD, ADR-010, README, ARCHITECTURE_INDEX, DOMAIN_MODEL_ARCHITECTURE, package.json, backend/package.json, docs/01-architecture/SDC-FASE-3.1-MASTER-CATALOG-RUNTIME.md, backend/prisma/seed.ts, backend/src/modules/master-catalog/*, src/pages/*, src/data/*, src/features/*, backend/prisma/schema.prisma
- `rg` para localizar `masterCatalog`, `creditPfCatalog`, `catalogRepository`, `commercialRepository`, `shadow`, `fallback`, `featureFlags`, `loan-with-collateral`, `MasterCatalogTreeReadModel`
- `Test-Path` para o SSOT solicitado
- `Get-Date -Format o`

## 34. Evidencias de validacao
- `git diff --check`: executado apos a criacao dos artefatos
- `git status --short --branch`: executado apos a criacao dos artefatos
- validacao do JSON: parser local aplicado ao arquivo de evidencias
- validacao do Markdown: estrutura de headings conferida contra a ordem exigida
- nenhuma alteracao foi feita em codigo de producao
- nenhuma alteracao local preexistente foi sobrescrita
