# ADR-010 - Loan With Collateral Canonical Taxonomy

Status: Proposed
Date: 2026-07-11
Decision Owners: Architecture Board
Approvers: PENDING HUMAN APPROVAL
Type: Domain Taxonomy
Project: FINQZ PRO

---

## 1. Title

Loan With Collateral Canonical Taxonomy

## 2. ADR ID

ADR-010

## 3. Status

Proposed

## 4. Date

2026-07-11

## 5. Decision Owners

- Architecture Board

## 6. Approvers

- PENDING HUMAN APPROVAL

## 7. Context

The EPC-W4 program already published:

- EPC-W4-00 - SSOT Consolidation Readiness Audit
- EPC-W4-01A - Consumer Canonical Inventory
- EPC-W4-01B - Catalog Freeze
- EPC-W4-02 - Master Catalog Promotion Plan
- EPC-W4-02A - Promotion Decision Audit
- EPC-W4-02B - Canonical Taxonomy Decision Audit

The latest taxonomy audit concluded:

- `EMPRESTIMO_COM_GARANTIA` exists in runtime as a product code;
- `AUTO_EQUITY` exists in runtime as a subproduct code;
- `HOME_EQUITY` exists in runtime as a subproduct code;
- the family does not exist in the official Master Catalog tree yet;
- no existing official segment was proven as the canonical parent;
- `OUTROS_CONVENIOS` was classified only as `WEAKLY SUPPORTED`;
- segmentation by eligibility / membership context is observed, but not formally normatized;
- slug, technical id and UI label must not be treated as canonical identity;
- no modality level was proven;
- the decision requires a formal ADR.

The official documents that constrain this decision are:

- DCA-FINQZ-PRO-ENTERPRISE-v2
- PCCD-FINQZ-PRO-ENTERPRISE
- SDC-FASE-2-SSOT-01-SINGLE-SOURCE-OF-TRUTH
- EPC-W4-01-CONSUMER-CANONICAL-INVENTORY
- EPC-W4-01B-CATALOG-FREEZE
- EPC-W4-02-MASTER-CATALOG-PROMOTION
- RUN-001-RUNTIME_GOVERNANCE
- ADR-004-commercial-master-catalog
- DOC-GOV-01-COMANDO-MESTRE-CONTINUIDADE-TECNICA

## 8. Problem Statement

The program needs a formal taxonomic decision for the loan-with-collateral family so that future canonicalization does not happen by silent inference.

The open questions are:

- which segment rule is officially used by the Master Catalog;
- which existing segment, if any, is semantically compatible with `EMPRESTIMO_COM_GARANTIA`;
- whether a new segment is required;
- whether `EMPRESTIMO_COM_GARANTIA` is a product, subproduct, modality, family, or another category;
- whether `AUTO_EQUITY` and `HOME_EQUITY` are subproducts or modalities;
- which codes and names remain canonical;
- which aliases remain compatibility-only;
- whether any modality should exist.

## 9. Forces and Constraints

- Evidence must drive the decision; naming alone is not enough.
- Runtime compatibility is not the same as normative authority.
- `creditPfCatalog` remains compatibility data, not a normative source.
- UI labels are not canonical identities.
- No modality can be created without business evidence.
- `OUTROS_CONVENIOS` cannot be selected only for convenience.
- A new segment cannot be created without a formal justification.
- The ADR must not authorize implementation, seed execution, migration, deployment, or backend/frontend changes.
- If evidence remains insufficient, the decision must stay explicit and visible as `NOT PROVEN` in the taxonomic record.

## 10. Current Taxonomy

### Official Master Catalog tree

| Level | Code | Name | Status |
| --- | --- | --- | --- |
| Segment | `INSS` | `INSS` | ACTIVE |
| Segment | `SERVIDOR_PUBLICO` | `Servidor Público` | ACTIVE |
| Segment | `FORCAS_ARMADAS` | `Forças Armadas` | ACTIVE |
| Segment | `CLT` | `CLT` | ACTIVE |
| Segment | `FGTS` | `FGTS` | ACTIVE |
| Segment | `OUTROS_CONVENIOS` | `Outros Convênios` | ACTIVE |
| Product | `CONSIGNADO` | `Consignado` | ACTIVE |
| Product | `ANTECIPACAO_FGTS` | `Antecipação FGTS` | ACTIVE |
| Product | `ENERGIA_POR_ASSINATURA` | `Energia por Assinatura` | ACTIVE |
| Product | `SEGURO` | `Seguro` | ACTIVE |
| Product | `CONSORCIO` | `Consórcio` | ACTIVE |

### Runtime family

| Concept | Runtime evidence | Taxonomic interpretation |
| --- | --- | --- |
| `EMPRESTIMO_COM_GARANTIA` | product metadata and adapter | Product candidate |
| `AUTO_EQUITY` | runtime metadata, subflow, tests | Subproduct candidate |
| `HOME_EQUITY` | runtime metadata, subflow, tests | Subproduct candidate |

## 11. Decision

This ADR proposes the following canonical classification:

- `EMPRESTIMO_COM_GARANTIA` is a `Product`.
- `AUTO_EQUITY` is a `Subproduct`.
- `HOME_EQUITY` is a `Subproduct`.
- No modality is introduced.
- The parent segment remains `NOT PROVEN` and must not be canonized silently.

The recommended fallback, if a temporary compatibility bucket is absolutely required, is `OUTROS_CONVENIOS`, but this document does not elevate that fallback to canonical truth.

The decision therefore remains a proposed taxonomy pending human approval, not an accepted canonicalization.

## 12. Canonical Hierarchy

| Level | Code | Name | Parent | Status |
| --- | --- | --- | --- | --- |
| Segment | `NOT PROVEN` | `NOT PROVEN` | n/a | Proposed, pending approval |
| Product | `EMPRESTIMO_COM_GARANTIA` | `Empréstimo com Garantia` | Pending segment decision | Proposed |
| Subproduct | `AUTO_EQUITY` | `Auto Equity` | `EMPRESTIMO_COM_GARANTIA` | Proposed |
| Subproduct | `HOME_EQUITY` | `Home Equity` | `EMPRESTIMO_COM_GARANTIA` | Proposed |

If a temporary bucket is required for compatibility operations, `OUTROS_CONVENIOS` may be used only as a weak fallback and not as a canonical verdict.

## 13. Canonical Codes

| Level | Canonical Code | Canonical Usage |
| --- | --- | --- |
| Product | `EMPRESTIMO_COM_GARANTIA` | Canonical candidate code for the family |
| Subproduct | `AUTO_EQUITY` | Canonical candidate code for the vehicle-based subproduct |
| Subproduct | `HOME_EQUITY` | Canonical candidate code for the property-based subproduct |
| Segment fallback | `OUTROS_CONVENIOS` | Weak compatibility bucket only |

## 14. Canonical Names

| Level | Canonical Name | Notes |
| --- | --- | --- |
| Product | `Empréstimo com Garantia` | Canonical label candidate |
| Subproduct | `Auto Equity` | Canonical label candidate |
| Subproduct | `Home Equity` | Canonical label candidate |
| Segment fallback | `Outros Convênios` | Compatibility bucket only |

## 15. Alias Policy

Aliases are compatibility artifacts only.

| Alias | Target | Type | New consumers? | Future state |
| --- | --- | --- | --- | --- |
| `product-emprestimo-com-garantia` | `EMPRESTIMO_COM_GARANTIA` | compatibility | no | legacy compatibility |
| `emprestimo-com-garantia` | `EMPRESTIMO_COM_GARANTIA` | compatibility slug | no | legacy compatibility |
| `subproduct-auto-equity` | `AUTO_EQUITY` | compatibility | no | legacy compatibility |
| `auto-equity` | `AUTO_EQUITY` | compatibility slug | no | legacy compatibility |
| `subproduct-home-equity` | `HOME_EQUITY` | compatibility | no | legacy compatibility |
| `home-equity` | `HOME_EQUITY` | compatibility slug | no | legacy compatibility |

Aliases:

- are not canonical identity;
- must not be used by new consumers as authoritative keys;
- remain available only for transitional compatibility;
- are candidates for removal only in a future wave.

## 16. Slug Policy

- Slugs remain compatibility-only.
- Slugs do not replace the canonical `code`.
- Slugs are not the Master Catalog key while no specific governance decision exists.
- A slug may exist in runtime or compatibility layers, but it does not elevate the taxonomy level.

## 17. Modality Policy

- No modality has been proven for this family.
- No modality should be created without business evidence and formal approval.
- The current decision does not introduce a modality layer for `EMPRESTIMO_COM_GARANTIA`.

## 18. Segment Decision

The segment decision is formally unresolved.

Observed candidates:

- `INSS` - rejected
- `SERVIDOR_PUBLICO` - rejected
- `FORCAS_ARMADAS` - rejected
- `CLT` - rejected
- `FGTS` - rejected
- `OUTROS_CONVENIOS` - weakly supported fallback only

Current posture:

- no official segment has been proven as canonical parent;
- no new segment is justified by evidence;
- the family must remain pending higher approval before canonization.

## 19. Alternatives Considered

| Alternative | Favorable arguments | Contradictory arguments | Risk | Status |
| --- | --- | --- | --- | --- |
| `OUTROS_CONVENIOS` as parent segment | It is the only existing generic segment bucket | It is only weakly supported and not formally proven | Misclassifies the family as generic | Not accepted as canonical |
| Create a new segment | Could improve semantic clarity if later proven | No evidence currently requires it | Taxonomy fragmentation | Not justified yet |
| Keep the family only in runtime | Avoids premature canonization | Leaves Master Catalog incomplete | Permanent divergence between runtime and catalog | Rejected as final state |
| Treat `EMPRESTIMO_COM_GARANTIA` as a modality | Would reuse the current runtime term in another level | Runtime metadata and inventory point to product-level behavior | Level inversion | Rejected |
| Treat `AUTO_EQUITY` and `HOME_EQUITY` as modalities | Keeps a smaller visible tree | Runtime, subflow and inventory evidence point to subproduct behavior | Loses the existing semantic structure | Rejected |
| Treat the family as independent products | Avoids segment debate | Would duplicate the family and break the shared parent semantics | Duplication | Rejected |
| Defer canonization entirely | Preserves honesty about missing evidence | Leaves the formal decision unresolved | Decision paralysis | Current approved posture for this ADR |

## 20. Alternatives Rejected

- `OUTROS_CONVENIOS` as a fully canonical answer;
- creating a new segment without formal proof;
- using the runtime family as if it were already normative Master Catalog truth;
- classifying `AUTO_EQUITY` and `HOME_EQUITY` as modalities;
- treating slugs or labels as canonical codes;
- accepting a modality layer without evidence.

## 21. Consequences

This ADR clarifies the family-level taxonomy without pretending that the parent segment is proven.

The result is a proposed canonical shape with explicit approval boundaries:

- product and subproduct levels are documented;
- compatibility aliases remain constrained;
- no modality is invented;
- the segment parent remains a human decision gate.

## 22. Positive Consequences

- taxonomy terms are no longer conflated with UI labels;
- the runtime family gets a stable proposed product/subproduct interpretation;
- future consumers can keep compatibility aliases separate from canonical codes;
- no modality inflation is introduced;
- the document preserves traceability between runtime evidence and taxonomy governance.

## 23. Negative Consequences

- the canonical parent segment remains unresolved;
- the family cannot be treated as fully accepted Master Catalog truth yet;
- compatibility layers will continue to coexist with the pending taxonomy;
- a human approval step is still required before canonization.

## 24. Risks

| Risk | Evidence | Impact | Likelihood | Mitigation | Gate |
| --- | --- | --- | --- | --- | --- |
| Wrong parent segment | no canonical segment proof exists | semantic mismatch in the Master Catalog | High | keep the parent unresolved until approved | Taxonomy gate |
| Product / subproduct inversion | runtime separates product and subproduct codes | consumers may route on the wrong level | Medium | preserve current runtime level interpretation | Level gate |
| Alias drift | multiple compatibility identifiers exist | new consumers may bind to the wrong key | High | keep aliases compatibility-only | Naming gate |
| False modality creation | no modality evidence exists | artificial hierarchy growth | Medium | prohibit modality creation without proof | Modality gate |
| Silent canonization | runtime support could be mistaken for authority | governance bypass | High | explicit ADR approval required | Approval gate |

## 25. Compatibility Impact

The proposed taxonomy is compatible with the current runtime shape:

- the adapter already passes `productCode` and `subproductCode`;
- the subflow registry already resolves by code, id, name, slug and aliases;
- the Master Catalog seed already uses the same kind of hierarchical separation for other families.

Compatibility does not change authority:

- runtime support is not a canonical promotion;
- compatibility aliases remain transitional;
- the official Master Catalog still needs human approval for the parent segment.

## 26. Consumer Impact

| Consumer | Current behavior | Expected impact | Risk |
| --- | --- | --- | --- |
| `Oportunidades.tsx` | hybrid, canonical API plus legacy fallback | preserve compatibility until a future wave | medium |
| `Simulador.tsx` | depends on compatibility repository | no immediate canonical promotion implied | medium |
| `TabelasComerciais.tsx` | depends on compatibility repository | continue as compatibility consumer | medium |
| `creditPfCatalog` | local compatibility source | remains non-normative | high |
| `commercialRepository` | compatibility bridge | remains transitional | high |
| `simulatorRepository` | operational support layer | remains transitional | high |
| runtime / tests | already know the family | continue to validate compatibility behavior | low |

## 27. Migration Impact

- No migration is authorized by this ADR.
- No seed execution is authorized by this ADR.
- No database change is authorized by this ADR.
- No deployment or infrastructure change is authorized by this ADR.
- Any future migration would need a separate implementation plan after human approval of the canonical segment decision.

## 28. Implementation Boundary

This ADR does not authorize implementation.

It only defines the proposed taxonomy boundary:

- keep the family visible in taxonomy governance;
- keep aliases compatibility-only;
- keep slugs compatibility-only;
- do not invent modalities;
- do not pretend the parent segment is already proven.

## 29. Rollback Boundary

Rollback, if later required, is limited to governance and compatibility surfaces.

It must not:

- remove historical traceability;
- break current runtime support;
- delete compatibility aliases without a future wave;
- silently change the product/subproduct interpretation.

## 30. Follow-up Decisions

- human approval of the pending segment decision;
- whether `OUTROS_CONVENIOS` should remain a weak fallback or be rejected entirely;
- whether a new segment ADR will be needed if the taxonomy is reopened;
- whether the future wave will canonize the family in the Master Catalog or keep it as compatibility only.

## 31. References

- [DCA-FINQZ-PRO-ENTERPRISE-v2](../00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md)
- [PCCD-FINQZ-PRO-ENTERPRISE](../00-master/PCCD-FINQZ-PRO-ENTERPRISE.md)
- [SDC-FASE-2-SSOT-01-SINGLE-SOURCE-OF-TRUTH](../01-architecture/SDC-FASE-2-SSOT-01-SINGLE-SOURCE-OF-TRUTH.md)
- [EPC-W4-01-CONSUMER-CANONICAL-INVENTORY](../01-architecture/EPC-W4-01-CONSUMER-CANONICAL-INVENTORY.md)
- [EPC-W4-01B-CATALOG-FREEZE](../01-architecture/EPC-W4-01B-CATALOG-FREEZE.md)
- [EPC-W4-02-MASTER-CATALOG-PROMOTION](../01-architecture/EPC-W4-02-MASTER-CATALOG-PROMOTION.md)
- [RUN-001-RUNTIME_GOVERNANCE](../03-runtime/RUN-001-RUNTIME_GOVERNANCE.md)
- [ADR-004-commercial-master-catalog](ADR-004-commercial-master-catalog.md)
- [DOC-GOV-01-COMANDO-MESTRE-CONTINUIDADE-TECNICA](../08-governance/DOC-GOV-01-COMANDO-MESTRE-CONTINUIDADE-TECNICA.md)
- [DOCUMENT-NAMING-STANDARD](../08-governance/DOCUMENT-NAMING-STANDARD.md)
- [DOCUMENT-LIFECYCLE](../08-governance/DOCUMENT-LIFECYCLE.md)
- [DOCUMENT-OWNERSHIP](../08-governance/DOCUMENT-OWNERSHIP.md)
- [DOCUMENT-CHANGE-POLICY](../08-governance/DOCUMENT-CHANGE-POLICY.md)

## 32. Approval Record

- Status: Proposed
- Approval Status: Pending
- Approved By: PENDING HUMAN APPROVAL
- Recorded decision: this ADR is a proposal awaiting formal human approval
