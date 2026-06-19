# AUD-H15-E - Opportunity & Pipeline Dependency Graph Audit

## 1. Executive Verdict
**GO WITH RESTRICTIONS**

The frontend graph is still hybrid. `src/pages/Oportunidades.tsx` is wired to the modern `opportunities.api.ts`, but it also depends on `useAppStore`, `config/pipelines.ts`, `catalogRepository`, legacy pipeline heuristics, and local stage fallbacks. `src/pages/admin/Pipelines.tsx` still governs pipeline configuration locally through `localStorage`, so the frontend is not yet a pure consumer of the backend pipeline domain.

## 2. Scope Reviewed
Audited files:
- [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx)
- [src/pages/admin/Pipelines.tsx](C:/Projects/FINQZ_PRO/src/pages/admin/Pipelines.tsx)
- [src/config/pipelines.ts](C:/Projects/FINQZ_PRO/src/config/pipelines.ts)
- [src/store/index.ts](C:/Projects/FINQZ_PRO/src/store/index.ts)
- [src/data/catalogRepository.ts](C:/Projects/FINQZ_PRO/src/data/catalogRepository.ts)
- [src/data/commercialRepository.ts](C:/Projects/FINQZ_PRO/src/data/commercialRepository.ts)
- [src/api/modules/opportunities.api.ts](C:/Projects/FINQZ_PRO/src/api/modules/opportunities.api.ts)
- [src/api/modules/oportunidades.api.ts](C:/Projects/FINQZ_PRO/src/api/modules/oportunidades.api.ts)
- [src/api/modules/index.ts](C:/Projects/FINQZ_PRO/src/api/modules/index.ts)
- [src/routes/crm.routes.tsx](C:/Projects/FINQZ_PRO/src/routes/crm.routes.tsx)
- [src/types/index.ts](C:/Projects/FINQZ_PRO/src/types/index.ts)
- [src/types/api.ts](C:/Projects/FINQZ_PRO/src/types/api.ts)
- [backend/src/modules/pipelines/routes.ts](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts)
- [backend/src/modules/pipelines/service.ts](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/service.ts)
- [backend/src/modules/pipelines/repository.ts](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/repository.ts)
- [backend/src/modules/opportunities/routes.ts](C:/Projects/FINQZ_PRO/backend/src/modules/opportunities/routes.ts)
- [backend/src/modules/opportunities/services/opportunities.service.ts](C:/Projects/FINQZ_PRO/backend/src/modules/opportunities/services/opportunities.service.ts)
- [backend/src/modules/opportunities/repositories/opportunities.repository.ts](C:/Projects/FINQZ_PRO/backend/src/modules/opportunities/repositories/opportunities.repository.ts)
- [backend/prisma/schema.prisma](C:/Projects/FINQZ_PRO/backend/prisma/schema.prisma)

Related route consumers:
- [src/App.tsx](C:/Projects/FINQZ_PRO/src/App.tsx)
- [src/routes/admin.routes.tsx](C:/Projects/FINQZ_PRO/src/routes/admin.routes.tsx)
- [src/layouts/MainLayout.tsx](C:/Projects/FINQZ_PRO/src/layouts/MainLayout.tsx)

## 3. Dependency Graph Summary
### Frontend graph
- `src/App.tsx` mounts `crmRoutes` and `adminRoutes`.
- `src/routes/crm.routes.tsx` maps `/app/crm/pipeline` and `/app/crm/oportunidades` to `OportunidadesPage`, and redirects `/app/crm/pipelines` to `/app/admin/pipelines`.
- `src/routes/admin.routes.tsx` lazy-loads `src/pages/admin/Pipelines.tsx` for `/app/admin/pipelines`.
- `src/pages/Oportunidades.tsx` is the central hybrid consumer. It imports:
  - `useAppStore`
  - `../config/pipelines`
  - `../data/catalogRepository`
  - `../api/modules/opportunities.api`
  - `../api/modules/clientes.api`
  - pipeline component helpers
- `src/pages/admin/Pipelines.tsx` depends on `catalogRepository` and `localStorage` to load/save settings.
- `src/config/pipelines.ts` contains static pipeline definitions plus legacy product-to-pipeline mapping.
- `src/store/index.ts` still persists operational pipeline state and `oportunidadesKanban`.

### Backend graph
- `backend/src/modules/pipelines/routes.ts` exposes read-only pipeline list by tenant.
- `backend/src/modules/pipelines/service.ts` delegates to `pipelinesRepository.findActiveByTenant`.
- `backend/src/modules/pipelines/repository.ts` reads `Pipeline` and `Stage` via Prisma.
- `backend/src/modules/opportunities/routes.ts` exposes CRUD and stage movement for opportunities.
- `backend/src/modules/opportunities/services/opportunities.service.ts` validates `pipelineId` and `stageId` consistency against backend pipeline/stage records.
- `backend/src/modules/opportunities/repositories/opportunities.repository.ts` persists and reads `Opportunity` through Prisma.
- `backend/prisma/schema.prisma` defines the official `Pipeline`, `Stage`, and `Opportunity` models.

### Key conclusion
The graph is not single-source yet. There are three parallel control planes:
- backend modern opportunity/pipeline runtime.
- frontend config/repository/store legacy plane.
- legacy API surface in `src/api/modules/oportunidades.api.ts`.

## 4. Direct Dependency Matrix
| Source | Direct dependency | Evidence | Impact |
|---|---|---|---|
| `src/pages/Oportunidades.tsx` | `useAppStore` | import at [L4](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L4) and usage at [L590](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L590) | HIGH |
| `src/pages/Oportunidades.tsx` | `config/pipelines.ts` | import at [L13](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L13) | HIGH |
| `src/pages/Oportunidades.tsx` | `catalogRepository` | import at [L18](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L18) | HIGH |
| `src/pages/Oportunidades.tsx` | `opportunities.api.ts` modern | import at [L6](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L6) | HIGH |
| `src/pages/Oportunidades.tsx` | `clientes.api.ts` | import at [L7](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L7) | MEDIUM |
| `src/pages/admin/Pipelines.tsx` | `catalogRepository` | import at [L7-L15](C:/Projects/FINQZ_PRO/src/pages/admin/Pipelines.tsx#L7) | HIGH |
| `src/routes/crm.routes.tsx` | `OportunidadesPage` | import and route mapping at [L5-L6](C:/Projects/FINQZ_PRO/src/routes/crm.routes.tsx#L5) and [L11-L57](C:/Projects/FINQZ_PRO/src/routes/crm.routes.tsx#L11) | HIGH |
| `src/routes/admin.routes.tsx` | `PipelinesPage` | lazy import at [L11](C:/Projects/FINQZ_PRO/src/routes/admin.routes.tsx#L11) and route at [L93-L99](C:/Projects/FINQZ_PRO/src/routes/admin.routes.tsx#L93) | HIGH |
| `src/App.tsx` | `crmRoutes` / `adminRoutes` | route composition at [L14-L20](C:/Projects/FINQZ_PRO/src/App.tsx#L14) and [L370-L375](C:/Projects/FINQZ_PRO/src/App.tsx#L370) | HIGH |
| `backend/src/modules/opportunities/routes.ts` | `opportunitiesService` | import at [L17](C:/Projects/FINQZ_PRO/backend/src/modules/opportunities/routes.ts#L17) | HIGH |
| `backend/src/modules/pipelines/routes.ts` | `pipelinesService` | import at [L7](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L7) | HIGH |
| `backend/src/modules/pipelines/service.ts` | `pipelinesRepository` | [L1-L5](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/service.ts#L1) | HIGH |
| `backend/src/modules/pipelines/repository.ts` | Prisma `pipeline` / `stage` reads | [L25-L39](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/repository.ts#L25) | HIGH |
| `backend/src/modules/opportunities/services/opportunities.service.ts` | pipeline/stage consistency checks | [L311-L315](C:/Projects/FINQZ_PRO/backend/src/modules/opportunities/services/opportunities.service.ts#L311) and [L556-L590](C:/Projects/FINQZ_PRO/backend/src/modules/opportunities/services/opportunities.service.ts#L556) | CRITICAL |
| `backend/prisma/schema.prisma` | official `Pipeline`, `Stage`, `Opportunity` models | [L463-L555](C:/Projects/FINQZ_PRO/backend/prisma/schema.prisma#L463) | CRITICAL |

## 5. Indirect Dependency Matrix
| Source | Indirect dependency | Evidence | Impact |
|---|---|---|---|
| `src/pages/Oportunidades.tsx` | backend pipeline read model | `officialPipelines` is loaded from `/api/v1/pipelines` at [L641-L659](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L641) | HIGH |
| `src/pages/Oportunidades.tsx` | backend stage id resolution | `matchedOfficialStage` and UUID resolution at [L2824-L2863](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L2824) | CRITICAL |
| `src/pages/Oportunidades.tsx` | local fallback stages | `ETAPAS_PIPELINE` fallback at [L370](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L370) and [L2053-L2068](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L2053) | HIGH |
| `src/pages/Oportunidades.tsx` | legacy semantic mapping | `mapBackendPipelineNameToSemanticId` at [L111-L124](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L111) | HIGH |
| `src/pages/Oportunidades.tsx` | legacy product-to-pipeline compatibility | `LEGACY_PIPELINE_IDS_BY_CATALOG` at [L88-L102](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L88) | HIGH |
| `src/store/index.ts` | persisted `pipelines` and `currentPipelineId` | `partialize` keeps them at [L945-L949](C:/Projects/FINQZ_PRO/src/store/index.ts#L945) | HIGH |
| `src/store/index.ts` | persisted `oportunidadesKanban` | legacy block at [L867-L885](C:/Projects/FINQZ_PRO/src/store/index.ts#L867) | HIGH |
| `src/config/pipelines.ts` | legacy pipeline catalog used by UI helpers | `pipelines` and `getEtapasAtivas` at [L157-L257](C:/Projects/FINQZ_PRO/src/config/pipelines.ts#L157) | HIGH |
| `src/data/catalogRepository.ts` | default stage generation from pipeline options | `getDefaultPipelineSettings` and `getPipelineStages` at [L389-L437](C:/Projects/FINQZ_PRO/src/data/catalogRepository.ts#L389) | HIGH |
| `src/types/index.ts` | legacy opportunity/pipeline structure | `Pipeline`, `OportunidadeKanban`, `PipelineColumn`, `Etapa` at [L237-L309](C:/Projects/FINQZ_PRO/src/types/index.ts#L237) | HIGH |
| `src/types/api.ts` | legacy opportunity response schema | `OportunidadeResponse` at [L168-L187](C:/Projects/FINQZ_PRO/src/types/api.ts#L168) | HIGH |

## 6. API Dependency Matrix
| API | Status | Direct consumer(s) found | Notes |
|---|---|---|---|
| `src/api/modules/opportunities.api.ts` | KEEP | `src/pages/Oportunidades.tsx` | Modern client for `/api/v1/opportunities` |
| `src/api/modules/oportunidades.api.ts` | REMOVE LATER | **not found** | Legacy client for `/api/oportunidades`; no repo consumer found |
| `src/api/modules/index.ts` | QUARANTINE | Barrel export surface | Exports legacy modules, not the modern opportunities client |
| `src/api/modules/pipelines.api.ts` | not found | not found | No dedicated frontend pipeline API client exists |

## 7. Route Dependency Matrix
| Route | Consumer | Evidence | Impact |
|---|---|---|---|
| `/app/crm/pipeline` | `OportunidadesPage` via `crmRoutes` | [src/routes/crm.routes.tsx](C:/Projects/FINQZ_PRO/src/routes/crm.routes.tsx#L11) and [src/App.tsx](C:/Projects/FINQZ_PRO/src/App.tsx#L370) | HIGH |
| `/app/crm/oportunidades` | `OportunidadesPage` via `crmRoutes` | [src/routes/crm.routes.tsx](C:/Projects/FINQZ_PRO/src/routes/crm.routes.tsx#L43) | HIGH |
| `/app/crm/pipelines` | redirect to `/app/admin/pipelines` | [src/routes/crm.routes.tsx](C:/Projects/FINQZ_PRO/src/routes/crm.routes.tsx#L55) | MEDIUM |
| `/app/admin/pipelines` | `PipelinesPage` via `adminRoutes` | [src/routes/admin.routes.tsx](C:/Projects/FINQZ_PRO/src/routes/admin.routes.tsx#L93) and [src/App.tsx](C:/Projects/FINQZ_PRO/src/App.tsx#L371) | HIGH |
| `/app/admin/pipelines` menu path | `MainLayout` navigation and page config | [src/layouts/MainLayout.tsx](C:/Projects/FINQZ_PRO/src/layouts/MainLayout.tsx#L86) and [L253](C:/Projects/FINQZ_PRO/src/layouts/MainLayout.tsx#L253) | MEDIUM |

## 8. Store Dependency Matrix
| Store item | Who depends on it | Evidence | Impact |
|---|---|---|---|
| `pipelines` | `src/pages/Oportunidades.tsx`, admin/config surfaces | `useAppStore()` usage and legacy pipeline state in [src/store/index.ts](C:/Projects/FINQZ_PRO/src/store/index.ts#L833-L849) | HIGH |
| `currentPipelineId` | `src/pages/Oportunidades.tsx` | `setCurrentPipelineId` and persisted selection at [src/store/index.ts](C:/Projects/FINQZ_PRO/src/store/index.ts#L864-L865) | HIGH |
| `oportunidadesKanban` | `src/pages/Oportunidades.tsx`, reporting surfaces | legacy block at [src/store/index.ts](C:/Projects/FINQZ_PRO/src/store/index.ts#L867-L885) | CRITICAL |
| `setAuth` / auth state | App and partner flows | auth orchestration in [src/App.tsx](C:/Projects/FINQZ_PRO/src/App.tsx#L172-L201) | HIGH |

## 9. LocalStorage Dependency Matrix
| File | localStorage usage | Dependency type | Impact |
|---|---|---|---|
| `src/data/catalogRepository.ts` | `finqz_pipeline_settings` in `loadPipelineSettings` / `savePipelineSettings` | pipeline stage/settings persistence | HIGH |
| `src/store/index.ts` | `persist` middleware and `localStorage` helper functions | persisted store state | HIGH |
| `src/data/commercialRepository.ts` | provider/commercial tables/conditions storage | neighboring commercial legacy plane | MEDIUM |
| `src/pages/admin/Pipelines.tsx` | uses `loadPipelineSettings` / `savePipelineSettings` | local settings governance UI | HIGH |
| `src/pages/Oportunidades.tsx` | no direct `localStorage` call found | indirect via store/repository only | MEDIUM |

## 10. Heuristics & Fallback Matrix
| Function / block | Behavior | Evidence | Risk |
|---|---|---|---|
| `mapearProdutoLegadoParaPipeline` | Product -> Pipeline mapping | [src/config/pipelines.ts](C:/Projects/FINQZ_PRO/src/config/pipelines.ts#L103-L125) | HIGH |
| `mapBackendPipelineNameToSemanticId` | Pipeline Name -> Semantic ID | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L111-L124) | HIGH |
| `normalizeKey` / `toStageKey` | Stage Name -> Stage key/ID normalization | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L22-L40) | HIGH |
| `OFICIAL_ETAPAS` | Canonical local stage labels | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L44-L64) | MEDIUM |
| `ETAPAS_PIPELINE` | Fallback local stage list | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L370) | HIGH |
| `getPipelineStages` | localStorage first, default second | [src/data/catalogRepository.ts](C:/Projects/FINQZ_PRO/src/data/catalogRepository.ts#L425-L437) | HIGH |
| `getPipelineStageColor` | localStorage/name-based fallback color selection | [src/data/catalogRepository.ts](C:/Projects/FINQZ_PRO/src/data/catalogRepository.ts#L442-L473) | MEDIUM |
| `getEtapasAtivas` in `src/config/pipelines.ts` | returns local legacy stage list | [src/config/pipelines.ts](C:/Projects/FINQZ_PRO/src/config/pipelines.ts#L251-L257) | HIGH |

## 11. Breakage Impact Matrix
| Removal / change | Breaks first | Impact | Why |
|---|---|---|---|
| Remove `catalogRepository` | `src/pages/Oportunidades.tsx`, `src/pages/admin/Pipelines.tsx` | CRITICAL | stage options, colors, and pipeline settings disappear |
| Remove `config/pipelines.ts` | `src/pages/Oportunidades.tsx`, `src/pages/Configuracoes.tsx`, `src/pages/admin/Automacoes.tsx` | HIGH | legacy mapping and local pipeline catalog vanish |
| Stop `useAppStore` from carrying pipeline/currentPipelineId/oportunidadesKanban | `src/pages/Oportunidades.tsx`, reporting pages, auth/layout consumers | CRITICAL | current UI state and fallback opportunity data disappear |
| Remove `src/api/modules/oportunidades.api.ts` | **not found** consumers in repo; hidden external consumers possible | MEDIUM | repo search found no importers, but legacy endpoint surface still exists |
| Make `src/pages/admin/Pipelines.tsx` read-only | admin pipeline settings flow | HIGH | blocks local pipeline edits and exports; safe only after backend write path exists |
| Remove `src/api/modules/opportunities.api.ts` modern | `src/pages/Oportunidades.tsx` | CRITICAL | breaks the modern Opportunity client |
| Remove `/app/crm/pipeline` alias | router and navigation | MEDIUM | old URLs and menu paths break |
| Remove `/app/admin/pipelines` UI without backend replacement | admin routes and menus | HIGH | pipeline admin path breaks |

## 12. Safe Migration Order
1. Keep `backend/src/modules/opportunities/**` and `backend/src/modules/pipelines/**` as runtime owners.
2. Freeze `src/api/modules/opportunities.api.ts` as the only allowed Opportunity client in the frontend.
3. Move `src/pages/Oportunidades.tsx` to consume backend pipeline/stage data only, while preserving fallback guards.
4. Replace `src/pages/admin/Pipelines.tsx` local settings flow with backend read/write behavior.
5. Quarantine `src/config/pipelines.ts` and `src/data/catalogRepository.ts` to compatibility-only mode.
6. Remove `src/api/modules/oportunidades.api.ts` only after zero consumers and no hidden route usage remain.
7. Reduce `src/store/index.ts` to UI-only state after the frontend no longer needs operational pipeline state.

## 13. Unsafe Migration Order
1. Removing `catalogRepository` first.
2. Removing `useAppStore` pipeline/currentPipelineId/oportunidadesKanban before `Oportunidades.tsx` is detached.
3. Removing `src/config/pipelines.ts` before stage and product heuristics are replaced.
4. Removing the legacy `oportunidades.api.ts` before confirming no runtime or hidden import consumer exists.
5. Making `admin/Pipelines.tsx` read-only before backend write ownership is available.
6. Removing `/app/crm/pipeline` redirect aliases before route cleanup is completed.

## 14. Code Deadness Candidates
Potentially dead or near-dead:
- [src/api/modules/oportunidades.api.ts](C:/Projects/FINQZ_PRO/src/api/modules/oportunidades.api.ts) - no import consumers found in repo search.
- `src/api/modules/index.ts` export of legacy opportunity client - keeps the legacy API surface alive while omitting the modern one.
- `src/routes/crm.routes.tsx` alias `/app/crm/oportunidades` is a compatibility path, not a distinct page.

Not dead:
- `src/pages/Oportunidades.tsx` - active critical page.
- `src/pages/admin/Pipelines.tsx` - active admin page.
- `src/config/pipelines.ts` - still consumed by `Oportunidades.tsx`, `Configuracoes.tsx`, and `admin/Automacoes.tsx`.
- `src/data/catalogRepository.ts` - active dependency of the Opportunity and admin pipeline UIs.

## 15. Source of Truth Conflicts
- Pipeline source of truth is split between backend read model and frontend local settings.
- Stage source of truth is split between backend pipeline stage records and frontend fallback arrays.
- Opportunity source of truth is split between modern backend API and legacy `oportunidades.api.ts`.
- `src/api/modules/index.ts` favors legacy export surfaces instead of the modern opportunity client.
- `useAppStore` still carries operational state that should belong only to backend-backed domain data.

## 16. Risk Matrix
| Risk | Level | Reason |
|---|---|---|
| Duplicate API surface | CRITICAL | modern `opportunities.api.ts` and legacy `oportunidades.api.ts` coexist |
| Duplicate source of truth | CRITICAL | backend vs frontend config/store/localStorage |
| Route aliasing | MEDIUM | `/app/crm/pipeline`, `/app/crm/oportunidades`, and `/app/crm/pipelines` form compatibility aliases |
| Store-coupled operational state | CRITICAL | pipeline/currentPipelineId/oportunidadesKanban still persist in `useAppStore` |
| localStorage pipeline settings | HIGH | admin pipeline is not backend-owned yet |
| Product -> Pipeline heuristics | HIGH | can silently misclassify opportunity routing |
| Backend opportunity/pipeline runtime mismatch | HIGH | backend exists, but frontend still performs local resolution |
| Go-Live breakage | CRITICAL | premature removal of legacy surfaces would break current UI flows |

## 17. Required Follow-up Audits
- Audit the actual backend write path for pipeline creation/update if any is being planned.
- Audit hidden consumers of `src/api/modules/oportunidades.api.ts` outside the current repo grep surface.
- Audit all consumers of `src/store/index.ts` to separate UI-only state from domain state.
- Audit `src/pages/Configuracoes.tsx` and `src/pages/admin/Automacoes.tsx` for pipeline heuristic dependency.
- Audit `src/pages/Simulador.tsx` and `src/pages/TabelasComerciais.tsx` separately, because they consume `commercialRepository`.

## 18. Explicit NO-GO Actions
- Do not remove `catalogRepository` before `Oportunidades.tsx` and `admin/Pipelines.tsx` stop reading it.
- Do not remove `config/pipelines.ts` while `Oportunidades.tsx` still uses `mapearProdutoLegadoParaPipeline`, `OFICIAL_ETAPAS`, or `ETAPAS_PIPELINE`.
- Do not remove `useAppStore` pipeline/currentPipelineId/oportunidadesKanban state before Opportunity is fully backend-backed.
- Do not remove `src/api/modules/oportunidades.api.ts` until consumers are confirmed absent.
- Do not make `admin/Pipelines.tsx` read-only until backend write ownership exists.
- Do not treat `commercialRepository` as part of the Opportunity graph; direct consumers are elsewhere.

## 19. Final Classification Table
| Artifact | Classification | Impact | Rationale |
|---|---|---|---|
| `src/pages/Oportunidades.tsx` | MIGRATE | CRITICAL | hybrid page, still contains legacy fallbacks and backend adapters |
| `src/pages/admin/Pipelines.tsx` | QUARANTINE | HIGH | local settings admin, still backed by localStorage |
| `src/config/pipelines.ts` | QUARANTINE | HIGH | legacy pipeline catalog and heuristics remain active |
| `src/store/index.ts` | QUARANTINE | CRITICAL | persists operational pipeline and kanban state |
| `src/data/catalogRepository.ts` | QUARANTINE | CRITICAL | localStorage-backed pipeline settings and stage helpers |
| `src/data/commercialRepository.ts` | QUARANTINE | MEDIUM | legacy localStorage repo, but not direct to Opportunity graph |
| `src/api/modules/opportunities.api.ts` | KEEP | HIGH | modern Opportunity client in active use |
| `src/api/modules/oportunidades.api.ts` | REMOVE LATER | MEDIUM | legacy client with no repo consumer found |
| `src/api/modules/index.ts` | QUARANTINE | HIGH | keeps legacy API surface exported |
| `src/routes/crm.routes.tsx` | KEEP | MEDIUM | routing composition and compatibility redirects only |
| `src/types/index.ts` | QUARANTINE | HIGH | still carries legacy pipeline/opportunity types |
| `src/types/api.ts` | QUARANTINE | HIGH | still carries legacy opportunity API response schema |
| `backend/src/modules/pipelines/routes.ts` | KEEP | HIGH | official read-only pipeline runtime |
| `backend/src/modules/pipelines/service.ts` | KEEP | HIGH | thin service over official pipeline repository |
| `backend/src/modules/pipelines/repository.ts` | KEEP | HIGH | official pipeline read model |
| `backend/src/modules/opportunities/routes.ts` | KEEP | CRITICAL | official Opportunity runtime entrypoint |
| `backend/src/modules/opportunities/services/opportunities.service.ts` | KEEP | CRITICAL | ownership/consistency enforcement for Opportunity |
| `backend/src/modules/opportunities/repositories/opportunities.repository.ts` | KEEP | CRITICAL | official persistence layer for Opportunity |
| `backend/prisma/schema.prisma` | KEEP | CRITICAL | authoritative domain schema |

## 20. Final Verdict
**GO WITH RESTRICTIONS**

The backend runtime is real and authoritative, but the frontend still holds too many operational fallbacks, compatibility paths, and local sources of truth to be treated as fully migrated. The safest next step is to quarantine the legacy planes and migrate the frontend consumers in order, not to remove them in place.
