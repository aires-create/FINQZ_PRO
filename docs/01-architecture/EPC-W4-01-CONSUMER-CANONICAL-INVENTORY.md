# FINQZ PRO Enterprise
## EPC-W4-01 - Consumer Canonical Inventory

**Title:** EPC-W4-01 - Consumer Canonical Inventory
**Document ID:** EPC-W4-01-CONSUMER-CANONICAL-INVENTORY
**Program:** EPC-W4 - SSOT Consolidation Program
**Wave:** EPC-W4-01A - Consumer Canonical Inventory
**Version:** 1.0
**Status:** ACTIVE
**Owner:** Enterprise Architect
**Classification:** Operational Architecture Inventory
**Approval Status:** PENDING
**Approved By:** PENDING
**Created Date:** 2026-07-11
**Last Updated Date:** 2026-07-11
**Supersedes:** None
**Authority Level:** Subordinate Operational Architecture Artifact
**Baseline Branch:** homologation/bootstrap-vps
**Baseline Commit:** bbd9646ac3402a4cc5ec38da52782d52632f4683

---

> This inventory is a subordinate operational artifact.
>
> It does not replace the DCA, the PCCD, ADRs, runtime governance, or document governance policies.
> In case of conflict, the higher authority prevails.
>
> `Approval Status: PENDING` means human validation is still pending.
> `ACTIVE` means the document is in current operational use only.
> The pending approval does not elevate this inventory to normative authority.

## 1. Purpose

Inventory and classify the canonical consumers, compatibility layers, and source boundaries involved in EPC-W4 consumer consolidation.

This document is the official tracking artifact for the current wave and is intended to remain subordinate to:

- [DCA-FINQZ-PRO-ENTERPRISE-v2.md](../00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md)
- [PCCD-FINQZ-PRO-ENTERPRISE.md](../00-master/PCCD-FINQZ-PRO-ENTERPRISE.md)
- [RUN-001-RUNTIME_GOVERNANCE.md](../03-runtime/RUN-001-RUNTIME_GOVERNANCE.md)
- [ADR-003](../05-adr/ADR-003-simulation-engine-source-of-truth.md)
- [ADR-004](../05-adr/ADR-004-commercial-master-catalog.md)
- [ADR-007](../05-adr/ADR-007-lead-customer-simulation-opportunity-model.md)
- [ADR-009](../05-adr/ADR-009-operation-persistence.md)
- [DOCUMENT-LIFECYCLE.md](../08-governance/DOCUMENT-LIFECYCLE.md)
- [DOCUMENT-OWNERSHIP.md](../08-governance/DOCUMENT-OWNERSHIP.md)
- [DOCUMENT-NAMING-STANDARD.md](../08-governance/DOCUMENT-NAMING-STANDARD.md)
- [DOCUMENT-CHANGE-POLICY.md](../08-governance/DOCUMENT-CHANGE-POLICY.md)

## 2. Baseline and Worktree

| Field | Value |
| --- | --- |
| Baseline date | 2026-07-11 |
| Branch | `homologation/bootstrap-vps` |
| Commit | `bbd9646ac3402a4cc5ec38da52782d52632f4683` |
| Worktree state | Dirty |
| Existing unrelated changes | `.env.example` modified; `docs/01-architecture/SDC-FASE-3.4H-F-LOCAL-ACTIVATION-READINESS.md` untracked; `scripts/sdc-3.4h-f-local-readiness.mjs` untracked |
| Validation note | Uncommitted changes are not an official source of truth |
| Diff check note | `git diff --check` reported an LF/CRLF normalization warning in `.env.example` |

## 3. Scope

### In scope

- frontend consumers
- backend canonical runtime
- Master Catalog
- Prisma schema and seed
- runtime bridges and ACL mappers
- Shadow Runtime compatibility surfaces
- Oportunidades
- Simulador
- Estrutura Comercial
- Tabelas Comerciais
- repositories
- stores
- mappers
- adapters
- aliases
- fallbacks
- APIs
- tests
- documentation

### Out of scope

- implementation
- refactor
- product promotion
- dual read activation
- switch
- legacy removal
- deploy
- VPS operations
- feature flags
- new catalog resolver creation

## 4. Definitions

| Term | Canonical meaning |
| --- | --- |
| Official Source | Artifact that owns canonical data or canonical contract for the current domain boundary. |
| Historical Source | Artifact kept for traceability or compatibility, but not treated as future owner of truth. |
| Active Compatibility | Surface still used by runtime while transition is pending. |
| Quarantine | Legacy surface retained, but not promoted as authoritative. |
| Adapter | Layer that translates between two contracts or lifecycles. |
| Mapper | Deterministic translation between models. |
| Fallback | Alternate path used only when the preferred canonical path is unavailable. |
| Direct Consumer | Artifact that reads or uses the source without an intermediate ownership layer. |
| Indirect Consumer | Artifact that depends on a consumer through another helper, mapper, or runtime wrapper. |
| Consumer Not Proven | Candidate where evidence is insufficient to claim direct runtime ownership. |
| Removal Candidate | Artifact that should be removed only after a formal replacement exists. |
| Canonical Code | Official code value used by the authoritative domain source. |
| Alias | Alternate label or token accepted for compatibility. |
| Local Taxonomy | Taxonomy defined in a compatibility layer or local UI surface. |
| Official Taxonomy | Taxonomy owned by the canonical source and validated by the authoritative docs. |

## 5. Sources and Boundaries Monitored

| Source | Path | Type | Current Status | Responsibility | Owner | Planned Freeze | Replacement |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Master Catalog runtime | `backend/src/modules/master-catalog/application/master-catalog.runtime.ts` | runtime facade | ACTIVE | Canonical catalog read facade | Enterprise Architect | W4-02 | Prisma-backed Master Catalog |
| Master Catalog service | `backend/src/modules/master-catalog/services/master-catalog.service.ts` | service | ACTIVE | Read orchestration and validation | Enterprise Architect | W4-02 | Same boundary, canonical only |
| Master Catalog repository | `backend/src/modules/master-catalog/repositories/master-catalog.prisma.repository.ts` | repository | ACTIVE | Prisma-backed catalog reads | Enterprise Architect | W4-02 | Same boundary, canonical only |
| Master Catalog routes | `backend/src/modules/master-catalog/presentation/http/master-catalog.routes.ts` | HTTP surface | ACTIVE | `/api/v1/master-catalog/*` read contract | Enterprise Architect | W4-02 | Same boundary, canonical only |
| Prisma schema | `backend/prisma/schema.prisma` | persistence contract | ACTIVE | Canonical tables and enums | Master / Backend Architecture | W4-02 | Same schema, hardened |
| Official seed runner | `backend/prisma/seed.ts` | seed runner | ACTIVE | Populate canonical tree | Master / Backend Architecture | W4-02 | Same runner, canonical seed |
| Official seed tree | `backend/src/modules/master-catalog/domain/master-catalog.seed.ts` | seed data | ACTIVE | Canonical initial tree | Master / Backend Architecture | W4-02 | Same tree, canonical only |
| Master Catalog frontend API | `src/api/modules/master-catalog.api.ts` | read client | ACTIVE | Frontend read-only API consumer | Architecture | W4-03 | Canonical backend API |
| creditPfCatalog | `src/data/creditPfCatalog.ts` | historical catalog | ACTIVE | Local compatibility taxonomy | Architecture / Compatibility | W4-07 | Master Catalog |
| catalogRepository | `src/data/catalogRepository.ts` | compatibility adapter | ACTIVE | Local adapter over creditPfCatalog | Architecture / Compatibility | W4-07 | Master Catalog API |
| commercialRepository | `src/data/commercialRepository.ts` | compatibility support | ACTIVE | Providers, tables, conditions helpers | Architecture / Commercial | W4-05 | Canonical commercial structure |
| simulatorRepository | `src/data/simulatorRepository.ts` | ephemeral support | ACTIVE | In-memory simulation support | Architecture / Simulation | W4-05 | Backend simulation runtime |
| store/index.ts | `src/store/index.ts` | derived store | ACTIVE | UI state derived from creditPfCatalog | Architecture | W4-03 | Canonical catalog loader |
| masterCatalogToEstruturaComercial mapper | `src/features/master-catalog/masterCatalogToEstruturaComercial.mapper.ts` | mapper | ACTIVE | Tree to EstruturaComercial | Architecture | W4-03 | `loadEstruturaComercialFromMasterCatalog` |
| commercialStructureCoverage mapper | `src/features/commercial-structure/commercialStructureCoverage.mapper.ts` | mapper | ACTIVE | Tree to coverage tree | Architecture | W4-03 | `loadCommercialStructureCoverageTree` |
| Loan-with-collateral runtime | `backend/src/modules/simulation/products/loan-with-collateral/*` | compatibility runtime | ACTIVE | Guarantee family bridge | Simulation Architecture | W4-05 | Canonical simulation runtime |
| Legacy simulation ACL mapper | `backend/src/modules/simulation/acl/legacy-simulation-input-to-simulation-request.mapper.ts` | ACL mapper | ACTIVE | Legacy request bridge | Simulation Architecture | W4-05 | Canonical simulation request |
| SimulateOperation use case | `backend/src/modules/simulation/application/simulate-operation.use-case.ts` | legacy engine use case | ACTIVE | Legacy execution core | Simulation Architecture | W4-05 | Canonical simulation engine |

## 6. Consumer Canonical Matrix

| ID | Consumer | Arquivo/Simbolo | Fonte Atual | Fonte Futura | Tipo de Uso | Criticidade | Status | Wave Alvo | Dependencias | Rollback | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C-01 | Oportunidades | `src/pages/Oportunidades.tsx` / `masterCatalogApi.getCatalogTree`, `SUBPRODUTOS_CONSIGNADO` | Master Catalog API + legacy local fallback | Canonical Master Catalog only | UI critical consumer | P1 | INVENTORIED | W4-03 | auth, tenant context, masterCatalogApi, legacy subproduct labels | Keep local fallback block and legacy field mapping | Import at line 7 and call at line 1068; legacy block at 1723 |
| C-02 | Simulador | `src/pages/Simulador.tsx` / `getProductsForSelect`, `getSubproductsForProduct`, `getModalitiesForSubproduct` | commercialRepository | Canonical commercial structure | Primary operational consumer | P1 | INVENTORIED | W4-03 | commercialRepository, product/subproduct selectors, simulator state | Restore local helper layer if canonical contract fails | Imports at line 37 and helper calls at 201/207/212 |
| C-03 | Tabelas Comerciais | `src/pages/TabelasComerciais.tsx` / `getProductsForSelect`, `getSubproductsForProduct`, `getModalitiesForSubproduct` | commercialRepository | Canonical commercial structure | Primary operational consumer | P1 | INVENTORIED | W4-03 | commercialRepository, product/subproduct selectors | Re-enable helper-backed UI paths | Imports at line 32 and calls at 344/371/377 |
| C-04 | Master Catalog API client | `src/api/modules/master-catalog.api.ts` / `masterCatalogApi.getCatalogTree` | backend `/api/v1/master-catalog/*` | same backend canonical API | Direct read consumer | P1 | INVENTORIED | W4-03 | apiFetch, query builder, auth headers | Keep same client, revert only if endpoint changes | `masterCatalogApi` at line 88 and tree call path |
| C-05 | Estrutura Comercial loader | `src/features/master-catalog/loadEstruturaComercialFromMasterCatalog.ts` | masterCatalogApi + mapper | Canonical Master Catalog only | Indirect consumer / translator | P2 | INVENTORIED | W4-03 | masterCatalogApi, masterCatalogToEstruturaComercial | Restore mapper-only path if API contract shifts | Imports mapper and calls `getCatalogTree({ status: "ACTIVE" })` |
| C-06 | Commercial Coverage loader | `src/features/commercial-structure/loadCommercialStructureCoverageTree.ts` | masterCatalogApi + coverage mapper | Canonical Master Catalog only | Indirect consumer / translator | P2 | INVENTORIED | W4-03 | masterCatalogApi, commercialStructureCoverage.mapper | Restore mapper-only path if API contract shifts | Imports mapper and calls `getCatalogTree({ status: "ACTIVE" })` |
| C-07 | UI derived store | `src/store/index.ts` / `buildEstruturaComercialFromCatalog` | creditPfCatalog | Canonical catalog loader | Derived UI support | P2 | INVENTORIED | W4-03 | creditPfCatalog, derived store state | Restore static derived tree builder | Build helper at line 32 and usage at 175 |
| C-08 | Catalog compatibility repository | `src/data/catalogRepository.ts` / `listCreditProducts`, `getProductByIdAsync`, `getSubproducts` | creditPfCatalog | Master Catalog API | Compatibility adapter | P2 | INVENTORIED | W4-07 | creditPfCatalog helpers, pipeline settings | Keep adapter and local helpers for rollback | Header comment says local adaptation layer over creditPfCatalog |
| C-09 | Commercial compatibility repository | `src/data/commercialRepository.ts` / `getProductsForSelect`, `getSubproductsForProduct`, `getModalitiesForSubproduct` | creditPfCatalog | Canonical commercial structure | Compatibility support | P2 | INVENTORIED | W4-05 | creditPfCatalog, provider/table/condition repos | Restore local compatibility helpers | Header says canonical support for UI commercial and simulator |
| C-10 | Simulator repository | `src/data/simulatorRepository.ts` / `commercialTableRepository`, `commercialConditionRepository`, `providerRepository` | commercialRepository | Backend simulation runtime | Ephemeral support | P2 | INVENTORIED | W4-05 | commercialRepository, pipelines, in-memory state | Keep in-memory repository as fallback | Header says state in memory, no persistence |
| C-11 | Master Catalog to EstruturaComercial mapper | `src/features/master-catalog/masterCatalogToEstruturaComercial.mapper.ts` / `masterCatalogToEstruturaComercial` | masterCatalogApi tree | Canonical commercial structure | Deterministic translator | P2 | INVENTORIED | W4-03 | MasterCatalogTreeDto, EstruturaComercial types | Restore old tree-to-UI adapter if needed | Export at line 124; load helper imports it |
| C-12 | Commercial Structure Coverage mapper | `src/features/commercial-structure/commercialStructureCoverage.mapper.ts` / `masterCatalogTreeToCoverageTree` | masterCatalogApi tree | Canonical coverage tree | Deterministic translator | P2 | INVENTORIED | W4-03 | coverage types, MasterCatalogTreeDto | Restore old coverage adapter if needed | Export used by loadCommercialStructureCoverageTree and tests |
| C-13 | Simulation product resolver | `backend/src/modules/simulation/products/base/simulation-product.resolver.ts` / `resolveFromContext` | simulation context ids and codes | Canonical simulation adapter registry | Engine routing helper | P1 | INVENTORIED | W4-05 | adapter registry, product and subproduct codes | Restore old registry resolution order if needed | Resolver maps product/subproduct id/code to adapter |
| C-14 | Loan-with-collateral adapter | `backend/src/modules/simulation/products/loan-with-collateral/loan-with-collateral.adapter.ts` | masterCatalogRuntime + SimulateOperationUseCase | Canonical simulation runtime | Compatibility bridge | P1 | INVENTORIED | W4-05 | masterCatalogRuntime, ACL mappers, legacy use case | Keep legacy execution path available | Imports runtime and legacy use case in same adapter |
| C-15 | Loan-with-collateral subflow registry | `backend/src/modules/simulation/products/loan-with-collateral/subflows/loan-with-collateral.subflow.ts` | alias-based subflow resolution | Canonical guarantee taxonomy | Compatibility bridge | P2 | INVENTORIED | W4-05 | product aliases, subproduct aliases, registry | Preserve alias registry until formal taxonomy exists | Normalizes product/subproduct id, code, name, slug, aliases |
| C-16 | Legacy simulation ACL mapper | `backend/src/modules/simulation/acl/legacy-simulation-input-to-simulation-request.mapper.ts` | legacy input payload | Canonical simulation request | Compatibility bridge | P2 | INVENTORIED | W4-05 | legacy input DTO, product/subproduct mapping | Keep bridge for rollback and historical payloads | Builds product/subproduct from legacy input fields |
| C-17 | SimulateOperation use case | `backend/src/modules/simulation/application/simulate-operation.use-case.ts` | legacy engine execution | Canonical simulation engine | Engine core use case | P0 | INVENTORIED | W4-02 | legacy engine, simulation payloads, adapter bridge | Keep old use case until canonical engine is approved | Class export at line 10; consumed by adapter |
| C-18 | Master Catalog runtime facade | `backend/src/modules/master-catalog/application/master-catalog.runtime.ts` / `masterCatalogRuntime` | Prisma-backed Master Catalog | Same canonical runtime | Canonical backend source | P0 | INVENTORIED | W4-02 | service, repository, Prisma schema | Keep runtime singleton and repository contract | Runtime singleton export at line 150 |
| C-19 | Master Catalog service | `backend/src/modules/master-catalog/services/master-catalog.service.ts` | repository + runtime rules | Same canonical runtime | Canonical backend source | P0 | INVENTORIED | W4-02 | repository, validation, tenant context | Restore service orchestration if contract changes | Service class export at line 32 |
| C-20 | Master Catalog repository | `backend/src/modules/master-catalog/repositories/master-catalog.prisma.repository.ts` | Prisma | Same canonical runtime | Canonical persistence read model | P0 | INVENTORIED | W4-02 | Prisma schema, normalized tree | Restore repository behind same interface | Repository class export at line 135 |
| C-21 | Master Catalog routes | `backend/src/modules/master-catalog/presentation/http/master-catalog.routes.ts` | backend HTTP surface | Same canonical runtime | Entry boundary, not business owner | P0 | INVENTORIED | W4-02 | auth, tenant middleware, RBAC guard | Keep route wiring and controller registration | `/api/v1/master-catalog/tree`, `/segments`, `/products`, `/subproducts`, `/modalities` |

### Consumer notes

- `Oportunidades.tsx` is hybrid today because it still reads the canonical API and retains a legacy subproduct block.
- `Simulador.tsx` and `TabelasComerciais.tsx` are still operationally dependent on `commercialRepository`.
- `catalogRepository.ts` remains a quarantine-compatible layer over `creditPfCatalog.ts`.
- `commercialRepository.ts` and `simulatorRepository.ts` are still support surfaces, not canonical owners.

## 7. Validation Evidence

| Artifact | Criticality | Evidence role | Current interpretation |
| --- | --- | --- | --- |
| `backend/src/tests/unit/master-catalog/master-catalog.seed.test.ts` | P3 | Verifies canonical seed content and excludes commercial/pipeline/opportunity imports | Validation evidence only |
| `src/features/master-catalog/masterCatalogToEstruturaComercial.mapper.test.ts` | P3 | Verifies stable tree-to-estrutura translation | Validation evidence only |
| `src/features/commercial-structure/commercialStructureCoverage.mapper.test.ts` | P3 | Verifies coverage-tree translation | Validation evidence only |

## 8. Taxonomy Matrix

| Conceito | Codigo Oficial | Codigo Historico | Alias | Label UI | Runtime Key | Prisma Key | Divergencia | Decisao Necessaria |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CONSIGNADO | `CONSIGNADO` | `EMPRESTIMO_CONSIGNADO` for the loan subproduct family | `Consignado`, `Payroll Loan` | Consignado | `CONSIGNADO` | `MasterCatalogProduct.code` | Product exists officially, subproduct family still mixed with local labels | PENDING |
| EMPRESTIMO_CONSIGNADO | `EMPRESTIMO_CONSIGNADO` | `CONSIGNADO` umbrella in local taxonomies | `emprestimo-consignado` | Empréstimo Consignado | `EMPRESTIMO_CONSIGNADO` | `MasterCatalogSubproduct.code` | Official subproduct exists, but UI labels may still vary | PENDING |
| CARTAO_RMC | `CARTAO_RMC` | Local card labels | `cartao-rmc` | Cartao RMC | `CARTAO_RMC` | `MasterCatalogSubproduct.code` | Official in seed, but downstream labels are still mixed | PENDING |
| CARTAO_CONSIGNADO_RMC | NOT PROVEN | Local naming candidate only | `cartao-consignado-rmc` | Cartao Consignado RMC | NOT PROVEN | NOT PROVEN | No canonical evidence in the current master seed or runtime | PENDING |
| CARTAO_BENEFICIO | `CARTAO_BENEFICIO` | Local card labels | `cartao-beneficio` | Cartao Beneficio | `CARTAO_BENEFICIO` | `MasterCatalogSubproduct.code` | Official in seed, but UI labels and legacy code still need normalization | PENDING |
| ENERGIA_POR_ASSINATURA | `ENERGIA_POR_ASSINATURA` | `ENERGIA` in local and UI shorthand | `Energia` | Energia por Assinatura | `ENERGIA_POR_ASSINATURA` | `MasterCatalogProduct.code` | Official product exists, legacy shorthand remains in support surfaces | PENDING |
| ENERGIA | NOT PROVEN | Local shorthand only | `energia` | Energia | NOT PROVEN | NOT PROVEN | Ambiguous shorthand, not canonical on its own | PENDING |
| GERACAO_DISTRIBUIDA | NOT PROVEN | Local energy taxonomy | `GD`, `geracao-distribuida` | Geracao Distribuida | NOT PROVEN | NOT PROVEN | Not an official master catalog product code | PENDING |
| EMPRESTIMO_COM_GARANTIA | NOT PROVEN in Master Catalog; proven in simulation runtime | `product-emprestimo-com-garantia` | `emprestimo-com-garantia` | Empréstimo com Garantia | `EMPRESTIMO_COM_GARANTIA` | NOT PROVEN | Runtime and adapter exist, but official seed does not own it yet | PENDING |
| AUTO_EQUITY | NOT PROVEN in Master Catalog; proven in runtime | `subproduct-auto-equity` | `auto-equity` | Auto Equity | `AUTO_EQUITY` | NOT PROVEN | Runtime, aliases, and tests exist; official promotion remains pending | PENDING |
| HOME_EQUITY | NOT PROVEN in Master Catalog; proven in runtime | `subproduct-home-equity` | `home-equity` | Home Equity | `HOME_EQUITY` | NOT PROVEN | Runtime, aliases, and tests exist; official promotion remains pending | PENDING |

## 9. Guarantee Family

### EMPRESTIMO_COM_GARANTIA

- Exists in runtime metadata, adapter logic, and alias resolution.
- Does not exist in the official master catalog seed tree yet.
- Must remain classified as compatibility until a formal promotion decision exists.

### AUTO_EQUITY

- Exists in loan-with-collateral runtime metadata and subflow aliases.
- Does not exist in the official master catalog seed tree yet.
- Depends on a formal catalog promotion decision before any authoritative indexing.

### HOME_EQUITY

- Exists in loan-with-collateral runtime metadata and subflow aliases.
- Does not exist in the official master catalog seed tree yet.
- Remains a runtime compatibility artifact, not a canonical master taxonomy.

## 10. Critical Flows

### Flow A - Oportunidades

UI
-> product selection
-> subproduct selection
-> normalization
-> payload
-> API
-> DTO
-> service
-> repository
-> database
-> return
-> card
-> edit

Observed taxonomic touchpoints:

- `productCode`
- `subproductCode`
- `subproductId`
- `subproduto`
- `subproduto_id`
- `SUBPRODUTOS_CONSIGNADO`
- local fallback labels
- Master Catalog read

### Flow B - Simulador

UI
-> commercialRepository
-> selection
-> simulatorRepository
-> payload
-> runtime/adapter
-> legacy engine
-> result
-> opportunity
-> card

Observed taxonomic transitions:

- product and subproduct id/code names move through compatibility layers
- commercialRepository still supplies selectors and labels
- loan-with-collateral adapter still bridges canonical and legacy execution

## 11. Freeze Criteria

Catalog Freeze can begin only when all of the following are true:

- 100% of P0 and P1 consumers in this inventory have a formal status decision.
- All direct and indirect consumers have evidence attached.
- Every `NOT PROVEN` taxonomy item has an explicit decision.
- Every historical source has an owner and a change rule.
- No new legacy product can be added without a formal exception.
- The taxonomy matrix is approved by the human reviewer.
- Rollback is defined for each critical consumer.
- Minimum tests are mapped and available.

## 12. Rule of Change

After formal approval of this inventory:

- every new consumer must be registered before merge;
- every source change must update this inventory;
- no removal may happen without `REMOVAL CANDIDATE`;
- no switch may happen without evidence of shadow or equivalent validation;
- no historical source may gain new taxonomy ownership by accident;
- any exception requires formal architectural approval.

## 13. Waves and Destination

| Consumer group | Wave initial | Wave de switch | Wave de removal | Prerequisite | Exit evidence |
| --- | --- | --- | --- | --- | --- |
| Master Catalog runtime, service, repository, routes | W4-02 Master Catalog Promotion | W4-06 Controlled Switch | W4-07 Legacy Removal | canonical seed and schema fully aligned | canonical read path only |
| Oportunidades | W4-03 Consumer Normalization | W4-06 Controlled Switch | W4-07 Legacy Removal | canonical API only, no local subproduct fallback | `SUBPRODUTOS_CONSIGNADO` removed from decision path |
| Simulador | W4-03 Consumer Normalization | W4-06 Controlled Switch | W4-07 Legacy Removal | commercial structure canonicalized | no direct dependency on compatibility repository |
| Tabelas Comerciais | W4-03 Consumer Normalization | W4-06 Controlled Switch | W4-07 Legacy Removal | commercial structure canonicalized | no direct dependency on compatibility repository |
| creditPfCatalog / catalogRepository | W4-01B Catalog Freeze | W4-06 Controlled Switch | W4-07 Legacy Removal | all consumers inventoried and frozen | no active consumer left behind |
| commercialRepository / simulatorRepository | W4-04 Dual Read | W4-06 Controlled Switch | W4-07 Legacy Removal | canonical commercial and simulation paths available | compatibility path no longer needed for UI |
| Guarantee runtime family | W4-05 Shadow Validation | W4-06 Controlled Switch | W4-07 Legacy Removal | formal taxonomy promotion decision | no alias-only runtime resolution |

## 14. Risks

| Risk | Class | Impact | Evidence |
| --- | --- | --- | --- |
| Divergent taxonomies still survive in Oportunidades and Simulador | P0 | High | Mixed use of canonical API and compatibility helpers |
| Premature removal of `commercialRepository` | P0 | High | Simulador and Tabelas Comerciais still import it |
| Hybrid subproduct payloads | P0 | High | Legacy `subproduto` fields still exist in Oportunidades flows |
| Guarantee family absent from Master Catalog seed | P1 | High | Runtime exists, official seed does not own it yet |
| Dependency on legacy simulation engine | P1 | High | Loan-with-collateral adapter still calls legacy use case |
| Aliases and fallbacks without central contract | P1 | Medium | Alias resolution still lives in runtime adapters |
| Historical documentation drift | P2 | Medium | Several docs still describe compatibility surfaces |
| Apparent dead consumers without proof | P2 | Medium | Removal cannot be asserted without evidence |
| Duplicated mocks, tests, and fixtures | P3 | Low | Validation artifacts need periodic cleanup |

## 15. Acceptance Criteria

This document can be considered complete for review only if:

- all known sources are registered;
- all known P0 and P1 consumers are listed;
- facts, inferences, and gaps are separated;
- all lacunas are explicit;
- no migration has been initiated;
- each critical consumer has a target wave;
- rollback is defined for each critical consumer;
- no non-document file outside the authorized scope was changed.

## 16. Review Status

- Formal authority remains subordinate to the DCA and PCCD.
- Approval remains pending human validation.
- This inventory is valid for operational tracking, not for normative override.
