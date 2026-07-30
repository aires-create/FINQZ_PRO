# PRP-AUD-01 - Cross Architecture Runtime Audit

**Status:** Draft de auditoria
**Scope:** FINQZ_PRO repository cross-architecture audit before Production Readiness Program
**Method:** repository inspection, targeted pattern search, architecture document cross-check, build/test validation

## 1. Executive Summary

O repositório esta em um estado arquitetural melhor do que o legado original, mas ainda nao esta pronto para entrada no Production Readiness Program.

O baseline tecnico confirma:

- `npm run build` no backend: OK
- `npm test` no backend: 105 test files / 730 tests passed
- `npm run build` na raiz: OK
- `npm run arch:check`: OK

Apesar disso, a auditoria encontrou riscos relevantes de producao:

- persistencia e acesso a Prisma ainda aparecem fora de boundaries canonicos em varios servicos e rotas;
- o frontend ainda concentra logica de negocio, mocks, fallback local e estado persistido via `localStorage`;
- existem superficies paralelas de API e compatibilidade que ainda competem com a fonte oficial;
- a documentacao oficial EOS foi elevada, mas o codigo e parte da documentacao ainda carregam narrativas e contratos de transicao;
- ha fragmentacao da cobertura de testes na raiz versus o baseline canonical do backend.

**Veredito final: NO GO**

Nao e uma falha de compilacao. E uma falha de readiness arquitetural e operacional.

## 2. Scope Analyzed

### Architecture

- aderencia ao FINQZ EOS
- Runtime Domains
- divergencias entre docs e codigo

### Backend

- modules
- services
- repositories
- factories
- contracts
- Prisma usage
- tenant scope
- RBAC
- audit/correlation/idempotency

### Frontend

- telas
- client APIs
- state local
- storage local
- mocks e fallbacks
- legacy flows

### Integrations

- providers reais e simulados
- retry, timeout, idempotency
- payload sanitization

### Database / Prisma

- schema and repository ownership
- direct Prisma access outside repositories

### Tests

- unit, integration and contract suites
- mock strategy
- baseline validation

### Infra / Config

- package scripts
- env samples
- Docker / Compose
- CI / release workflows

### Documentation

- EOS master docs
- DCA
- runtime governance
- capability / cognitive architecture

## 3. Methodology

1. Read the official EOS master documents.
2. Mapped the repo tree and major module surfaces.
3. Searched for known anti-patterns:
   - `legacy`
   - `deprecated`
   - `mock`
   - `fake`
   - `stub`
   - `localStorage`
   - `console.log`
   - `TODO`
   - `FIXME`
   - `any`
   - `eslint-disable`
4. Inspected high-risk files:
   - frontend API client and data service
   - frontend store
   - EDP composition and infra
   - backend services and routes using Prisma directly
   - CI / release / Docker config
5. Ran:
   - backend build
   - backend tests
   - root build
   - root tests
   - architecture check

## 4. Real Repository Map

### Top-level

- `backend/`
- `src/`
- `docs/`
- `.github/`
- `scripts/`
- `public/`
- `dist/`
- `logs/`
- root archives and zip artifacts

### Backend module families observed

- `auth`
- `users`
- `organizations` / `organization`
- `memberships`
- `roles`
- `permissions`
- `crm`
- `commercial`
- `commercial-governance`
- `commercial-structure`
- `pipelines`
- `opportunities`
- `partners`
- `partner-acquisition`
- `master-catalog`
- `financial`
- `commissions`
- `integrations`
- `audit`
- `security-events`
- `simulation`
- `recommendation`
- `edp`

### Frontend surface observed

- pages under `src/pages`
- shared API layer under `src/api`
- local state and persistence under `src/store`
- helper/legacy utilities under `src/data`, `src/utils`, `src/features`

## 5. Real Runtime Domain Map

### EOS-aligned domains visible in code

- Identity / auth
- Tenant / organizations / memberships
- Security / RBAC / permissions
- Audit
- Observability
- CRM
- Commercial
- Pipeline
- Opportunity
- Partner
- Decision / EDP
- Business Orchestration
- Workflow
- Financial
- Provider / Integrations
- Notification
- Document
- Learning / Recommendation / Simulation

### Structural observation

The codebase still mixes:

- official EOS Runtime Domains
- legacy feature modules
- compatibility bridges
- mock / fallback surfaces

This is expected in a transition phase, but it is not yet Enterprise Ready.

## 6. Findings by Severity

### P0 - Blockers for Production

Nenhum P0 confirmado foi encontrado no quick audit run that would alone block the build or the backend test baseline.

### P1 - High Risk

1. **Direct Prisma access outside canonical repository boundaries**
   - Evidence:
     - `backend/src/modules/auth/service.ts`
     - `backend/src/modules/auth/controller.ts`
     - `backend/src/modules/auth/services/auth.service.ts`
     - `backend/src/modules/users/users.routes.ts`
     - `backend/src/modules/roles/service.ts`
     - `backend/src/modules/organizations/service.ts`
     - `backend/src/modules/memberships/service.ts`
     - `backend/src/modules/pipelines/service.ts`
     - `backend/src/modules/opportunities/services/opportunities.service.ts`
     - `backend/src/modules/commercial/services/commercial.service.ts`
     - `backend/src/modules/security-events/repository.ts`
   - Impact:
     - weakens repository ownership
     - bypasses canonical runtime boundaries
     - increases risk of tenant / RBAC / audit / idempotency drift

2. **Frontend still contains business logic, fallback state and client-side persistence**
   - Evidence:
     - `src/store/index.ts`
     - `src/pages/Oportunidades.tsx`
     - `src/pages/Simulador.tsx`
     - `src/pages/TabelasComerciais.tsx`
     - `src/data/catalogRepository.ts`
   - Impact:
     - operational state can diverge from backend source of truth
     - production data behavior can be masked by local persistence
     - significant domain logic remains in the UI layer

3. **Parallel API surfaces and legacy compatibility layers still compete with the official client**
   - Evidence:
     - `src/api/client.ts`
     - `src/api/dataService.ts`
     - `src/api/adapters.ts`
     - `src/api/modules/index.ts`
     - `src/api/finqzClient.ts`
   - Impact:
     - multiple sources of truth for HTTP access
     - legacy endpoints coexist with `/api/v1` style endpoints
     - hard to enforce canonical contracts everywhere

4. **Documentation and code still reflect a transition state rather than a fully closed EOS**
   - Evidence:
     - `README.md`
     - `docs/00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md`
     - older `docs/03-decision-platform/*` artifacts
   - Impact:
     - product narrative still mixes CRM-era framing with EOS framing
     - developers can follow different architectural stories

### P2 - Medium Risk

1. **Root test command is not the backend canonical baseline**
   - Evidence:
     - root `vitest.config.ts` only includes frontend tests plus `backend/src/tests/unit/decision-policy/**/*.test.ts`
     - backend suite is validated separately in `backend/vitest.config.ts`
   - Impact:
     - test surface is split across two commands/configs
     - local audit can misread the effective baseline if the wrong command is executed

2. **EDP runtime composition is still a skeleton for future steps**
   - Evidence:
     - `backend/src/modules/edp/composition/decision-runtime.composition.ts`
   - Impact:
     - `policyEvaluation`, `strategyResolution`, `decisionEngine`, `decisionResult` are placeholder steps that throw
     - acceptable for foundation waves, but not a production execution path

3. **Mock/fallback surfaces are still present in non-test runtime code**
   - Evidence:
     - `src/pages/SdrIaHub.tsx`
     - `src/pages/Eventos.tsx`
     - `src/config/environment.ts`
   - Impact:
     - false production behavior can be presented if feature flags are misconfigured
     - mock fallbacks must remain explicitly dev-only

### P3 - Improvements / Cleanup

1. Root workspace contains archived zips and logs.
2. Several docs remain transitional or placeholder-heavy.
3. Many files still use `any` in UI and integration code.
4. Barrel exports (`export *`) remain broad across multiple modules.

## 7. Findings by Area

### Backend

- good:
  - backend build passes
  - backend tests pass at 105 files / 730 tests
  - EDP has explicit canonical contracts and repository registry
- risk:
  - direct Prisma access appears in application and service layers
  - auth, membership, organization, role, and user flows are not fully repository-isolated
  - `database/prisma.js` and `core/prisma/client.js` are both active entrypoints

### Frontend

- good:
  - build passes
  - API client foundation exists
  - EOS-aligned modular API slices are being introduced
- risk:
  - business logic remains in screens
  - `localStorage` is used for operational-like state
  - data service and adapters provide mock/fallback execution paths
  - extensive `any` usage weakens contract safety

### Integrations

- good:
  - provider retry and timeout handling exist
  - provider runtime tests exist
- risk:
  - provider mock/fallback patterns still exist in UI/demo surfaces
  - integration surfaces are not yet fully collapsed into a single canonical integration layer

### Database / Prisma

- good:
  - Prisma schema and backend tests are present
  - repository layer exists in several domains
- risk:
  - direct Prisma reads/writes exist outside repositories
  - the repository boundary is not yet uniformly enforced

### Tests

- good:
  - backend baseline is green
  - arch:check passes
- risk:
  - root and backend test commands are split
  - root test command does not represent the full backend baseline
  - some tests rely heavily on mocks, which is fine for unit scope but not sufficient alone for PRP

### Infrastructure

- good:
  - CI workflow exists
  - release workflow exists
  - Docker compose has healthchecks, resource limits, restart policy
- risk:
  - production readiness depends on external environment discipline
  - secrets / env governance is not fully centralized in-repo

### Security

- good:
  - tenant and auth/security concepts exist
  - RBAC surfaces are present
- risk:
  - direct Prisma in services can bypass standardized security controls
  - legacy fallback auth and mock paths must be treated as dev-only

### Production

- good:
  - build and tests are green
  - container healthchecks exist
- risk:
  - operational truth is still split across backend, frontend storage, and legacy compatibility layers
  - readiness is blocked more by governance and boundary drift than by syntax or build failures

## 8. Duplicities Identified

### API / HTTP

- `src/api/client.ts`
- `src/api/dataService.ts`
- `src/api/adapters.ts`
- `src/api/finqzClient.ts`
- `src/api/modules/*`

### Prisma entrypoints

- `backend/src/core/prisma/client.js`
- `backend/src/database/prisma.js`

### Runtime / domain surface overlap

- `backend/src/modules/commercial`
- `backend/src/modules/commercial-governance`
- `backend/src/modules/commercial-structure`
- `backend/src/modules/opportunities`
- `backend/src/modules/pipelines`
- `backend/src/modules/partners`
- `backend/src/modules/partner-acquisition`

### Capability / legacy UI state overlap

- `src/store/index.ts`
- `src/data/catalogRepository.ts`
- `src/pages/TabelasComerciais.tsx`
- `src/pages/Simulador.tsx`
- `src/pages/Oportunidades.tsx`

### Decision naming / type overlap

- `DecisionPolicyState`
- `DecisionStrategyState`

The public exports already alias these in `backend/src/modules/edp/index.ts`, but the underlying naming collision still requires discipline.

## 9. Legacy Identified

- `src/api/client.ts` legacy compatibility wrapper
- `src/api/dataService.ts` fallback service
- `src/api/adapters.ts` localStorage-backed adapter
- `src/store/index.ts` mock seed data and persisted UI state
- `src/pages/TabelasComerciais.tsx` emergency localStorage fallback
- `src/pages/Simulador.tsx` localStorage proposal persistence
- `src/pages/SdrIaHub.tsx` mock templates and metrics
- `src/pages/Eventos.tsx` mock fallback warnings
- `docs/03-decision-platform/DCA-ENTERPRISE-DECISION-PLATFORM-v1.md` older decision-platform framing
- root `README.md` still frames the product as CRM/automation first, not EOS first

## 10. Mocks / Stubs / Fakes

### Legitimate mocks

- `vi.mock(...)` in unit and integration tests
- in-memory repositories under `backend/src/modules/edp/infrastructure/in-memory`
- skeleton runtime steps that throw contract violations in foundation waves

### Runtime-unsafe mock/fallback surfaces

- `src/api/adapters.ts`
- `src/data/catalogRepository.ts`
- `src/pages/SdrIaHub.tsx`
- `src/pages/Simulador.tsx`
- `src/pages/TabelasComerciais.tsx`
- `src/pages/Eventos.tsx`
- `src/store/index.ts`

These are not inherently invalid during a transition, but they are not Enterprise Ready if they can leak into production user journeys.

## 11. Parallel Sources of Truth

- HTTP surfaces:
  - legacy `api` wrapper
  - `finqzClient`
  - `dataService`
  - module API namespace
- persistence entrypoints:
  - `core/prisma/client.js`
  - `database/prisma.js`
- state sources:
  - backend runtime data
  - frontend `localStorage`
  - in-memory adapters
- documentation sources:
  - DCA
  - EOS architecture
  - runtime governance
  - capability architecture
  - cognitive architecture

## 12. Documentation vs Code Divergences

- EOS docs now define the platform as an Enterprise Operating System.
- The README still describes FINQZ primarily as a CRM/automation platform.
- DCA still contains placeholder-heavy domain sections and legacy product framing.
- The codebase still contains many legacy surfaces and transition helpers that predate the EOS framing.

## 13. Frontend Risks

- business logic in pages
- extensive `any`
- localStorage-backed operational state
- mock data in runtime-visible screens
- multiple API entrypoints
- legacy API endpoints still exposed to consumers

Key examples:

- `src/pages/Oportunidades.tsx`
- `src/pages/Simulador.tsx`
- `src/pages/TabelasComerciais.tsx`
- `src/store/index.ts`
- `src/api/client.ts`
- `src/api/modules/index.ts`

## 14. Backend Risks

- Prisma bypass outside repositories
- mixed entrypoints (`core/prisma/client.js` and `database/prisma.js`)
- direct service/controller data access
- legacy modules not fully aligned to EOS runtime ownership
- broad `export *` surfaces in the EDP and support layers

Key examples:

- `backend/src/modules/auth/service.ts`
- `backend/src/modules/users/users.routes.ts`
- `backend/src/modules/organizations/service.ts`
- `backend/src/modules/memberships/service.ts`
- `backend/src/modules/roles/service.ts`
- `backend/src/modules/pipelines/service.ts`
- `backend/src/modules/opportunities/services/opportunities.service.ts`

## 15. Database / Prisma Risks

- repository boundary not uniformly enforced
- direct Prisma queries in services and routes
- risk of tenant or RBAC drift if future changes bypass the canonical layer
- dual Prisma entrypoints increase mental overhead and accidental coupling risk

## 16. Test Risks

- backend test baseline is good and should remain the canonical PRP gate
- root test config is narrower and can mislead auditors if used as the only command
- heavy use of mocks is normal in unit tests, but PRP needs production-path verification beyond mocks

## 17. Infrastructure Risks

- CI and release workflows exist, which is positive
- Docker compose includes healthchecks and resource constraints, which is also positive
- nevertheless, the repo does not yet show a fully unified production-runbook story for deploy, backup, rollback, and observability ownership

## 18. Security Risks

- dev-only fallback behavior must never leak to production
- direct Prisma access bypasses standardized security boundaries
- any mock auth or legacy fallback must remain explicitly disabled outside development
- `.env` exists in the workspace; no obvious secret strings were found in the quick scan, but environment governance still needs discipline

## 19. Production Risks

- operational truth split across backend, frontend, and legacy compatibility layers
- business flows exposed with client-side state and fallback data
- incomplete collapse of old API surfaces into canonical EOS contracts
- documentation still transitional in places, which can cause implementation drift

## 20. Quick Wins

1. Standardize the canonical test commands for frontend and backend in one visible runbook.
2. Mark all dev-only mock and localStorage codepaths more aggressively and keep them out of production bundles when possible.
3. Collapse `src/api/client.ts` usage toward the canonical module API surface.
4. Audit and isolate direct Prisma usage in high-risk services.
5. Normalize the terminology in README and onboarding docs to EOS-first language.
6. Remove or quarantine broad `any` hot spots in critical UI screens.

## 21. Sanitation Plan

### Phase 1

- freeze PRP baseline commands
- confirm canonical CI gates
- inventory direct Prisma users
- inventory runtime localStorage usage

### Phase 2

- move high-risk business logic out of frontend screens
- consolidate API clients and module exports
- isolate legacy compatibility wrappers

### Phase 3

- enforce repository boundaries
- enforce tenant / RBAC / audit guards consistently
- add missing contract tests around canonical API paths

### Phase 4

- harmonize docs and delete ambiguity in product narrative
- remove stale compatibility where consumers are migrated

## 22. Recommended Correction Order

1. Direct Prisma outside canonical repository boundaries.
2. Frontend business logic and localStorage-backed operational state.
3. Parallel HTTP clients and duplicate API surfaces.
4. Documentation drift and conflicting product framing.
5. Broad `any` usage and legacy helper cleanup.
6. Test-command and readiness-runbook unification.

## 23. Criteria to Release the Production Readiness Program

A Runtime Domain or release candidate can be considered ready only when all of the following are true:

- backend build passes
- backend tests pass on the canonical backend baseline
- architecture governance check passes
- no direct Prisma access exists outside approved persistence boundaries
- no production business state depends on localStorage or demo data
- canonical API clients are the only supported runtime path
- tenant, RBAC, audit, correlation, and idempotency are enforced by design
- documentation and code tell the same architectural story
- CI and release workflows are aligned with the real production baseline

## 24. Final Verdict

**NO GO**

The repository is technically buildable and testable, but not yet clean enough for the Production Readiness Program.

The main blockers are architectural:

- persistence boundary drift
- frontend operational state drift
- parallel compatibility surfaces
- doc/code narrative drift

## 25. Final Notes

- backend baseline validated: `105` test files, `730` tests passed
- root build validated: OK
- root arch check validated: OK
- this audit did not change code, tests, config, or docs other than creating this report
