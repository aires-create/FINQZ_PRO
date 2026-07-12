# EPC-W5-GR Architecture Review Go/No-Go

- auditId: `EPC-W5-GR`
- status: `COMPLETE`
- verdict: `GO WITH RESTRICTIONS`
- scope: architecture review, readiness revalidation, and go/no-go recommendation for the Master Catalog transition track
- baseline: `225c14d9137dd41477076f28d0be2c8f347559ba`
- reviewedSources: `EPC-W5-01`, `EPC-W5-02`, `EPC-W5-03`, runtime code, and existing evidence files
- nextAuthorizedStep: `W5-03A Observability Prerequisites`

## 1. Executive context

The Master Catalog is already the canonical owner for catalog reads and persistence, but the ecosystem is still hybrid. The review confirms the core is solid; the migration surface is not yet clean enough for an unrestricted go.

## 2. Review objective

Confirm whether the current architecture is ready for the next cutover phase and whether the existing W5 plan can be promoted, blocked, or narrowed.

## 3. Method

I revalidated the inventory, dependency graph, and migration cut plan against the current implementation and the evidence trail already present in the repository.

## 4. Canonical owner

`backend/src/modules/master-catalog/**` is the canonical implementation boundary, and the HTTP router is registered at `/api/v1/master-catalog`.

## 5. HTTP surface

The route layer is read-only, guarded by authentication, tenant context, and permission checks, which is the right posture for a canonical catalog service.

## 6. Controller posture

The controller resolves tenant context, validates input with schemas, and returns success envelopes. No write surface was found in the master-catalog HTTP module.

## 7. Service posture

The service requires tenant context before delegating to the repository, which is correct for isolation and safety.

## 8. Repository posture

The Prisma repository filters by `tenantId`, excludes soft-deleted rows, and orders by `displayOrder` and `name`. The query shape is aligned with the documented canonical tree.

## 9. Persistence posture

The schema contains dedicated tenant-scoped catalog tables for segments, products, subproducts, and modalities. The unique and index structure supports the intended read model.

## 10. Seed posture

The canonical tree is seeded idempotently from `MASTER_CATALOG_INITIAL_TREE`, which supports environment bootstrap without inventing a second source of truth.

## 11. Runtime contract

`masterCatalogRuntime` exposes the canonical read contract and is the clean bridge between the backend service and consumers that still need compatibility protection.

## 12. Frontend client

The frontend API wrapper only reads the catalog tree and related lists. It does not reintroduce a write path or a parallel authoritative source.

## 13. Oportunidades

`src/pages/Oportunidades.tsx` already consumes the canonical catalog tree. It is the cleanest leaf consumer and the strongest early migration candidate.

## 14. Estrutura Comercial

`loadEstruturaComercialFromMasterCatalog.ts` also reads from the canonical API, which confirms that the commercial structure bootstrap is already using the official surface.

## 15. Commercial Coverage

Commercial Coverage still runs a shadow comparison against `creditPfCatalog`, so it is not yet a pure canonical-only consumer.

## 16. Loan with collateral

The simulation adapter can resolve product and subproduct through the runtime, but it still retains aliases and fallback logic. That is compatibility, not final convergence.

## 17. Simulation runtime

The simulation runtime already has shadow, primary, fallback, and evidence flags, but the flags are configured as infrastructure controls rather than a catalog-specific release gate.

## 18. Legacy catalog surfaces

`creditPfCatalog`, `catalogRepository`, `commercialRepository`, `simulatorRepository`, and `store/index.ts` still exist as compatibility or legacy surfaces.

## 19. Inventory revalidation

The inventory document is directionally correct: canonical backend ownership is real, but the local sources remain live as compatibility layers.

## 20. Dependency graph revalidation

The dependency graph correctly identifies canonical-core, shadow-read, adapter, compatibility, and legacy edges. The graph still shows hybrid behavior, not a completed retirement.

## 21. Migration plan revalidation

The migration cut plan is strong, but it still assumes controlled shadowing, staged rollback, and delayed retirement of compatibility paths.

## 22. Enterprise context gap

`docs/00-master/FINQZ-PRO-ENTERPRISE-CONTEXT-SSOT.md` remains absent. That is a documentary and governance blocker, not a functional blocker.

## 23. Observability gap

The repository has observability machinery, but the audit trail does not prove catalog-specific parity metrics, divergence baselines, or measurable retirement gates. This is the blocker for the first functional cut.

## 24. Shadow read gap

Commercial Coverage still depends on shadow read. That is acceptable during migration, but it is not evidence of completion.

## 25. Compatibility gap

`loan-with-collateral` still accepts aliases and request-field fallback. That is intentionally transitional, but it is still transitional.

## 26. Data parity gap

The canonical tree is present, but the audit trail does not yet show a fully retired local parity source with zero-drift evidence across all consumers. That keeps consumer retirement in a no-go state.

## 27. Tenant safety

Tenant isolation is a strong point of the canonical backend implementation. I found no indication that the current query path leaks across tenants.

## 28. Read path safety

The read path is narrow, explicit, and defensive. This reduces risk and makes the canonical catalog a credible shared dependency.

## 29. Rollback posture

Rollback is still available through the existing compatibility layers. That is good for safety, but it also proves the migration is not yet irreversible.

## 30. Candidate ranking

`Oportunidades` should stay the first candidate, but it is deferred pending gates. `Estrutura Comercial` can follow only after the first cut proves stable. `Commercial Coverage` and `loan-with-collateral` need more evidence before they are promoted.

## 31. First candidate rationale

`Oportunidades` has the least architectural residue and the most direct canonical read path. It is the safest first cut.

## 32. Shadow comparator posture

The comparator is useful and should remain until parity is explicitly proven. Removing it early would remove the guardrail before the proof exists.

## 33. Cutover gating

Cutover must stay gated by smoke, parity, telemetry, and rollback readiness. The current evidence supports staged work, not a first functional cut.

## 34. Blocker assessment

Three blockers remain, separated by category:

- documentary/governance: missing enterprise SSOT
- functional: retirement paths still depend on shadow and fallback behavior
- first-cut: missing measurable observability and parity gates

## 35. Critical findings

Two critical findings remain: shadow read still active and compatibility fallback still active.

## 36. High findings

Three high findings remain: legacy repository persistence, lack of catalog-specific release telemetry, and consumer retirement still pending proof.

## 37. Confirmed findings

Confirmed:

- Master Catalog is the canonical backend owner.
- The read path is tenant-safe and read-only.
- `Oportunidades` is the best first migration candidate.
- Compatibility layers still exist and are not accidental.

## 38. Rejected findings

Rejected:

- The idea that the migration is already complete.
- The idea that shadow reads can be removed before parity proof.
- The idea that `loan-with-collateral` is ready for final compatibility removal.

## 39. Inconsistencies

The main inconsistency was between the maturity of the canonical backend and the earlier wording that implied a controlled first cut was already authorized. That is corrected here: the core is ready, but the first functional cut is still deferred pending gates.

## 40. Missing nodes

The missing enterprise-context SSOT is the most important missing documentation node, and it is classified as governance/documental only.

## 41. Missing edges

There is no documented automatic gate that cleanly connects parity proof to retirement of shadow and fallback paths. That is the first-cut blocker.

## 42. Readiness view

Readiness is mixed: the canonical core is ready, `Oportunidades` is the first candidate but deferred pending gates, observability prerequisites are the next authorized step, and platform-wide retirement posture is not ready.

## 43. Go / no-go view

This is not a blanket `GO`. It is `GO WITH RESTRICTIONS` for the wave, while the first functional cut remains `DEFERRED_PENDING_GATES`.

## 44. Restrictions

The restrictions are:

- keep the next authorization step on W5-03A observability prerequisites
- keep `Commercial Coverage` on shadow read until parity is formally demonstrated
- keep `loan-with-collateral` compatibility fallback until alias-hit and lookup-miss evidence is zeroed out
- keep rollback paths and telemetry active for the first cut
- do not retire the local compatibility sources until consumer-by-consumer proof exists

## 45. Next authorized step

Authorize `W5-03A Observability Prerequisites` only.

## 46. Validation posture

The evidence is sufficient to authorize observability prerequisites, but not sufficient to authorize a first functional cut or any retirement of legacy paths.

## 47. Audit integrity

This review did not modify production code. It only recorded a decision and its evidence chain.

## 48. Evidence chain

The decision is anchored in the W5 inventory, dependency graph, cut plan, runtime code, and the existing compatibility/shadow telemetry design.

## 49. Final recommendation

Proceed with `W5-03A Observability Prerequisites` first, then re-evaluate the first functional cut after the gates and telemetry are in place.

## 50. Closure

The architecture is good enough to move, but only into observability prerequisites. The correct wave decision is `GO WITH RESTRICTIONS`, and the first functional cut remains deferred pending gates.
