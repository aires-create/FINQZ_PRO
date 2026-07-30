# FINQZ PRO Enterprise
## EPC-W4-02 - Master Catalog Promotion

**Title:** EPC-W4-02 - Master Catalog Promotion
**Document ID:** EPC-W4-02-MASTER-CATALOG-PROMOTION
**Program:** EPC-W4 - SSOT Consolidation Program
**Wave:** EPC-W4-02 - Master Catalog Promotion
**Version:** 1.0
**Status:** ACTIVE
**Owner:** Enterprise Architect
**Classification:** Operational Architecture Promotion Plan
**Approval Status:** PENDING
**Approved By:** PENDING
**Created Date:** 2026-07-11
**Last Updated Date:** 2026-07-11
**Supersedes:** None
**Authority Level:** Subordinate Operational Architecture Artifact
**Baseline Branch:** homologation/bootstrap-vps
**Baseline Commit:** 48c6bd13ca6697b5a22db59d570b40c51ad4cf96

---

> This document is a subordinate operational architecture artifact.
>
> It does not replace the DCA, the PCCD, ADRs, the EPC-W4-01A inventory, the EPC-W4-01B freeze, runtime governance, or document governance policies.
> In case of conflict, the higher authority prevails.
>
> `ACTIVE` means the document is in current operational use to coordinate the promotion review.
> `Approval Status: PENDING` means formal human ratification is still pending.
> `Approval Status: PENDING` does not elevate this document to normative authority.

## 1. Purpose

Define the controlled promotion path for the Master Catalog during EPC-W4, using the consumer inventory and catalog freeze as the governing baseline.

This document does not execute promotion by itself.
It records the promotion boundary, the technical evidence required, and the conditions that must be satisfied before the Master Catalog becomes the authoritative owner of the guarantee family currently observed in runtime compatibility surfaces.

## 2. Authority and Subordination

This document remains subordinate to:

- [DCA-FINQZ-PRO-ENTERPRISE-v2.md](../00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md)
- [PCCD-FINQZ-PRO-ENTERPRISE.md](../00-master/PCCD-FINQZ-PRO-ENTERPRISE.md)
- [RUN-001-RUNTIME_GOVERNANCE.md](../03-runtime/RUN-001-RUNTIME_GOVERNANCE.md)
- [ADR-004-commercial-master-catalog.md](../05-adr/ADR-004-commercial-master-catalog.md)
- [ADR-003-simulation-engine-source-of-truth.md](../05-adr/ADR-003-simulation-engine-source-of-truth.md)
- [DOCUMENT-LIFECYCLE.md](../08-governance/DOCUMENT-LIFECYCLE.md)
- [DOCUMENT-OWNERSHIP.md](../08-governance/DOCUMENT-OWNERSHIP.md)
- [DOCUMENT-NAMING-STANDARD.md](../08-governance/DOCUMENT-NAMING-STANDARD.md)
- [DOCUMENT-CHANGE-POLICY.md](../08-governance/DOCUMENT-CHANGE-POLICY.md)
- [EPC-W4-01-CONSUMER-CANONICAL-INVENTORY.md](../01-architecture/EPC-W4-01-CONSUMER-CANONICAL-INVENTORY.md)
- [EPC-W4-01B-CATALOG-FREEZE.md](../01-architecture/EPC-W4-01B-CATALOG-FREEZE.md)

If any conflict appears, the documents above retain authority over this promotion plan.

## 3. Baseline Evidence

The current evidence shows three different states:

| Area | Evidence | Interpretation |
| --- | --- | --- |
| Official Master Catalog seed | The official seed tree does not yet own the guarantee family | Promotion is not complete |
| Runtime and compatibility surfaces | `EMPRESTIMO_COM_GARANTIA`, `AUTO_EQUITY`, and `HOME_EQUITY` exist in runtime/adapters/tests | Runtime readiness exists |
| Catalog governance | W4-01A inventory and W4-01B freeze are already published | Promotion must follow governed sequence |

Supporting technical facts observed in the repository:

- the master catalog runtime, service, repository, and HTTP routes already exist;
- the Prisma schema already models canonical catalog segments, products, subproducts, and modalities;
- the guarantee family is represented in runtime metadata, adapters, and tests;
- the official seed still does not own that family as canonical seed data;
- alias handling exists in compatibility layers, not as a new normative document rule.

## 4. Promotion Boundary

The promotion boundary is the point at which the guarantee family moves from compatibility evidence into canonical Master Catalog ownership.

For this program, that boundary is not a code shortcut.
It is a controlled documentation and data-alignment decision that must remain subordinate to the DCA, PCCD, ADRs, and the EPC-W4 governance chain.

This document does not authorize:

- parallel truth sources;
- new product taxonomies outside the official catalog;
- replacement of ADRs or governance policies;
- ungoverned runtime promotion;
- schema invention beyond the existing canonical catalog model.

## 5. Target Canonical Family

The current runtime evidence centers on the loan-with-collateral family:

- `EMPRESTIMO_COM_GARANTIA`
- `AUTO_EQUITY`
- `HOME_EQUITY`

These codes are currently supported by compatibility/runtime surfaces, but they remain pending official Master Catalog ownership until the governed promotion is completed.

### 5.1 Parent Segment Status

Decision Pending.

NOT PROVEN.

Pending Architecture Decision.

The parent segment for the promoted family will be defined only after validation of the official Master Catalog tree.

This document does not infer a parent segment where the official tree does not yet provide objective evidence.

## 6. Technical Position

### 6.1 Schema position

No new persistence concept is required to represent the canonical tree itself, because the current Prisma model already supports the catalog hierarchy.

### 6.2 Seed position

The official seed remains the canonical place where the promoted tree must be expressed.

### 6.3 Alias position

Aliases are currently compatibility artifacts.
They are not a substitute for canonical catalog ownership and do not create new normative authority.

### 6.4 Runtime position

Runtime support demonstrates readiness, but runtime support alone is not promotion.

## 7. Promotion Strategy for Existing Environments

This strategy is documented only as a decision gap, not as an approved execution rule.

The current architectural decision is **NOT PROVEN** between:

- seed-only;
- reconciler dedicated;
- operação manual controlada.

### 7.1 New Environment

In a new environment, the official catalog tree can be established from governed seed alignment once the promotion is formally approved.

### 7.2 HML Already Populated

In an already populated HML environment, the document does not yet prove that a simple seed execution is sufficient.
Idempotency, duplication risk, and reconciliation behavior remain decision pending.

### 7.3 Production Already Populated

In an already populated production environment, the promotion path requires formal architectural validation, additional proofs, and a future implementation decision.

No statement in this document authorizes "just run seed" as a sufficient strategy for existing environments.

## 8. Required Preconditions

Before the Master Catalog can be treated as the canonical owner for this family, the following must be true:

- W4-01A inventory remains approved and current;
- W4-01B freeze remains in force;
- the canonical family and its hierarchy are explicitly approved for promotion;
- the seed and runtime contracts are aligned;
- consumer-facing impacts are understood and documented;
- rollback boundaries are defined;
- any required ADR is approved when the decision crosses architectural policy scope.

## 9. Allowed Operations

While this plan is active, the following remain allowed:

- document review and evidence capture;
- canonical tree analysis;
- seed alignment planning;
- validation of consumer impacts;
- controlled reconciliation planning;
- documentation index updates;
- rollback definition;
- exception assessment through formal governance.

## 10. Prohibited Operations

The following are not authorized by this document:

- adding new product families outside governance;
- creating a parallel Master Catalog;
- bypassing DCA, PCCD, ADRs, or document policies;
- treating compatibility aliases as canonical ownership;
- promoting the family without inventory alignment;
- weakening the W4-01B freeze without formal decision;
- changing backend, frontend, database, Docker, Nginx, CI, or VPS behavior through this document.

## 11. Minimum Validation Matrix

This matrix is documentary only. It does not invent tests or imply execution.

| Component | Objective | Test Type | Success Criterion | Observations |
| --- | --- | --- | --- | --- |
| Master Catalog | Confirm canonical tree shape, codes, parent-child relations, status, and idempotent reads | UNIT / CONTRACT | Tree matches the approved canonical structure without ambiguity | Evidence must come from official tree and runtime contract |
| Runtime | Confirm read facade, versioning, and compatibility resolution behavior | UNIT / CONTRACT | Runtime resolves the canonical tree without breaking compatibility surfaces | Must remain subordinate to the approved catalog contract |
| Seed | Confirm canonical seed content and safe repeatability | UNIT / INTEGRATION | Seed data is reproducible and does not duplicate codes in a populated environment | Existing environments require extra proof |
| Prisma | Confirm supported models, uniqueness, and hierarchy persistence | UNIT / CONTRACT | Existing schema supports the intended promotion shape without collisions | Slug/aliases remain unproven as persisted canonical fields |
| Simulation | Confirm product/subproduct resolution, catalogVersion propagation, alias handling, and fallback behavior | UNIT / INTEGRATION | Simulation resolves the same family consistently across legacy and compatibility paths | Engine legacy remains active until later waves |
| Frontend | Confirm read-only display and no new fallback creation | E2E / SMOKE | UI reads the canonical path without introducing new fallback logic | Only observational validation is expected here |
| Consumers | Confirm Oportunidades, Simulador, Tabelas Comerciais, Estrutura Comercial, repositories, and mappers remain aligned | CONTRACT / E2E | Consumers continue to work without breaking the catalog freeze | Existing consumers may still rely on compatibility surfaces |
| Aliases | Confirm which aliases are compatibility-only, legacy, or not proven | UNIT / CONTRACT | Alias inventory matches documented runtime evidence | New aliases remain prohibited without governance |
| Catalog Version | Confirm catalogVersion is propagated through runtime and simulation bridges | UNIT / CONTRACT | Version is preserved across the document-defined path | Must not be treated as a promotion shortcut |
| Fallback | Confirm fallback behavior remains controlled and traceable | UNIT / INTEGRATION | Fallback is explicit, documented, and not expanded by this document | Fallback cannot become a new truth source |
| Evidence | Confirm that the promotion plan preserves traceability and source attribution | CONTRACT | Evidence references remain consistent and auditable | No secret or sensitive value may be revealed |
| Idempotência | Confirm repeated operations do not create duplicate catalog entries | UNIT / INTEGRATION | Repeated writes or reconciliation steps remain safe | Essential for populated environments |
| Ambientes já populados | Confirm safe handling of HML and production with existing data | INTEGRATION / SMOKE | The selected path avoids duplication and preserves rollback | Current decision remains NOT PROVEN |
| Rollback | Confirm the prior state can be restored without destructive loss | CONTRACT / SMOKE | Rollback restores previous catalog ownership boundaries | Destructive removal is not authorized |

## 12. Exception Process

Any exception requires all of the following:

- technical justification;
- an ADR when the change affects architecture decision scope;
- update to the W4-01A inventory when consumer or taxonomy scope changes;
- explicit architectural approval;
- traceable rollback plan.

No exception is valid without formal approval.

## 13. Gates A-H

| Gate | Objetivo | Dependências | Critério de aprovação | Bloqueia qual etapa |
| --- | --- | --- | --- | --- |
| Gate A | Taxonomia | Official tree evidence, runtime evidence, governance review | Parent and codes are documented without inference | Blocks promotion scope definition |
| Gate B | Prisma | Schema review, uniqueness review, hierarchy review | Existing schema supports the intended model without collisions | Blocks persistence decision |
| Gate C | Seed | Official seed alignment, idempotency evidence, populated-environment review | Seed path is proven safe for the target environment | Blocks seed decision |
| Gate D | Testes | Validation matrix, traceability, evidence coverage | Minimum validation matrix is defined and mapped | Blocks execution readiness |
| Gate E | Rollback | Prior-state preservation, recovery path, traceability | Rollback is documented and non-destructive | Blocks release safety sign-off |
| Gate F | Implementação | Prior gates A-E | No implementation starts before prior gates are approved | Blocks implementation start |
| Gate G | HML | Population state, reconciliation proof, evidence collection | HML path is proven safe and auditable | Blocks HML readiness |
| Gate H | Atualização do Inventário | Inventory sync, consumer impact, final traceability | W4-01A inventory is updated after approval | Blocks inventory closure |

No Gate may be ignored.
Wave 03 remains blocked until the promotion chain is formally completed.

## 14. Responsibilities

### Enterprise Architect

- validate the promotion boundary;
- confirm subordination to DCA and PCCD;
- decide whether architectural scope requires ADR coverage;
- maintain alignment between inventory, freeze, and promotion.

### Governance

- keep the document indexed correctly;
- preserve naming and lifecycle consistency;
- prevent duplicate authority paths.

### Runtime / Engineering

- maintain compatibility evidence;
- avoid unauthorized taxonomy expansion;
- support controlled reconciliation work when approved.

### Domain owners

- confirm the final canonical family shape;
- validate consumer impacts;
- provide rollback requirements for the wave transition.

## 15. Criteria to Start W4-02 Execution

W4-02 can move from promotion plan to execution only when all of the following are true:

- W4-01A is approved;
- W4-01B is approved and still active;
- the target family is approved for canonical ownership;
- the official seed path is confirmed;
- rollback is defined;
- consumer classification is complete;
- acceptance criteria for W4-01A are satisfied.

## 16. Criteria to Exit the Promotion State

This document can stop being only a promotion plan when the following are complete:

- the Master Catalog seed owns the promoted family;
- the runtime contract and the official catalog agree on the canonical shape;
- compatibility aliases are no longer the authoritative source for the promoted family;
- downstream consumers have been reconciled against the canonical path;
- governance has recorded the final decision.

## 17. Rollback Criteria

Rollback must preserve:

- the prior catalog state;
- the W4-01A inventory;
- the W4-01B freeze;
- the compatibility path needed for safe recovery;
- evidence of what changed and why.

Rollback is valid only when owner, evidence, and reversion path are all documented.

## 18. Relation to Future Waves

### W4-03 - Consumer Normalization

Can only begin after the promotion path is validated and the canonical catalog shape is stable.

### W4-04 - Dual Read

Cannot be used as a shortcut to avoid canonical ownership.

### W4-05 - Shadow Validation

Remains subordinate to the canonical catalog decision and does not replace promotion approval.

### W4-06 - Controlled Switch

Requires the canonical catalog to be the trusted owner of the promoted family.

### W4-07 - Legacy Removal

Cannot be anticipated by this document.
Removal requires a later decision with its own evidence and approvals.

## 19. Normative References

- [DCA-FINQZ-PRO-ENTERPRISE-v2.md](../00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md)
- [PCCD-FINQZ-PRO-ENTERPRISE.md](../00-master/PCCD-FINQZ-PRO-ENTERPRISE.md)
- [RUN-001-RUNTIME_GOVERNANCE.md](../03-runtime/RUN-001-RUNTIME_GOVERNANCE.md)
- [ADR-003-simulation-engine-source-of-truth.md](../05-adr/ADR-003-simulation-engine-source-of-truth.md)
- [ADR-004-commercial-master-catalog.md](../05-adr/ADR-004-commercial-master-catalog.md)
- [DOCUMENT-LIFECYCLE.md](../08-governance/DOCUMENT-LIFECYCLE.md)
- [DOCUMENT-CHANGE-POLICY.md](../08-governance/DOCUMENT-CHANGE-POLICY.md)
- [DOCUMENT-NAMING-STANDARD.md](../08-governance/DOCUMENT-NAMING-STANDARD.md)
- [DOCUMENT-OWNERSHIP.md](../08-governance/DOCUMENT-OWNERSHIP.md)
- [EPC-W4-01-CONSUMER-CANONICAL-INVENTORY.md](../01-architecture/EPC-W4-01-CONSUMER-CANONICAL-INVENTORY.md)
- [EPC-W4-01B-CATALOG-FREEZE.md](../01-architecture/EPC-W4-01B-CATALOG-FREEZE.md)
