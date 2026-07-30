# ADR-006 — Products Domain Decommission

## Status

Accepted

## Context

The FINQZ PRO project originated from a YouWare/YouBase generated codebase.

During multiple architecture audits, the following was identified:

- `Products.tsx` was not connected to active routes.
- `/app/produtos` redirected to the dashboard.
- The Products module was not part of the official backend runtime.
- Product APIs were not consumed by active frontend flows.
- Product store state was isolated legacy code.
- Reports were migrated to Commercial Structure.
- Opportunities were migrated to official catalog flows.
- The official backend runtime is `backend/src`.
- `backend/server` was classified separately in ADR-005 as legacy frozen code.

## Decision

The Products module is officially decommissioned.

The business concept of Product remains part of the FINQZ PRO domain model.

The following are now the official sources of truth:

- Commercial Structure
- CommercialTable
- Opportunity
- Pipeline

New features must not use:

- `state.produtos`
- `Produtos.tsx`
- `produtosApi`
- `dataService.produtos`
- Product client endpoints
- Legacy product mappings

## Implemented Removals

- Products menu removed
- Products RBAC removed
- Products page removed
- Products store removed
- Products API removed
- Products client removed
- Products service removed

## Remaining Compatibility Layers

The following remain temporarily for compatibility:

- `creditPfCatalog`
- `catalogRepository`
- `commercialRepository`
- pipeline compatibility mappings
- audit taxonomy compatibility

These items are outside the scope of this ADR and will be handled separately.

## Consequences

Product as a business concept remains valid.

Products as a standalone module is no longer part of the official architecture.

Future catalog evolution must follow ADR-004.

## Related ADRs

- ADR-004 Commercial Master Catalog
- ADR-005 Legacy YouWare Backend Classification

## Architectural Rule

Commercial Structure is the official functional source for:

- Product
- Subproduct
- Modality

No new functionality may reintroduce a standalone Products module.
