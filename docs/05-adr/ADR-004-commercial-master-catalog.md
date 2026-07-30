# ADR-004 — Commercial Master Catalog Source of Truth

## Status

Proposed

## Context

The FINQZ PRO frontend currently uses `creditPfCatalog` as the technical source for Product, Subproduct and Modality data.

Audits showed that:

- `creditPfCatalog` is local/static data.
- `catalogRepository` is a compatibility layer over `creditPfCatalog`.
- `commercialRepository` consumes catalog data but belongs to commercial tables, providers and conditions.
- `CommercialTable` persists product, subproduct and modality fields, but it represents commercial conditions, not the master catalog.
- The Prisma schema does not currently contain a persistent master catalog model.
- The frontend `EstruturaComercial` page is the closest functional representation of the intended commercial catalog hierarchy.

The intended commercial hierarchy is:

Vertical
→ Product
→ Subproduct
→ Modality

Pipeline is not part of the commercial catalog. Pipeline is an operational domain.

## Decision

The official conceptual owner of the Commercial Master Catalog is `Estrutura Comercial`.

`creditPfCatalog` must be treated only as a transitional compatibility source.

`CommercialTable` must not become the master catalog owner. It remains responsible for commercial tables, providers, conditions, rates, commissions and eligibility.

`Produtos` must not be treated as the official catalog owner because it represents a legacy/parallel product surface.

No new Product, ProductV2, Catalog, CatalogV2 or CommercialCatalog module should be created without a future ADR and full migration plan.

## Consequences

Future work must gradually move catalog consumers away from direct local/static sources.

Affected consumers include:

- `src/data/catalogRepository.ts`
- `src/data/commercialRepository.ts`
- `src/store/index.ts`
- `src/pages/EstruturaComercial.tsx`
- `src/pages/Oportunidades.tsx`
- `src/pages/Simulador.tsx`
- `src/pages/TabelasComerciais.tsx`

Before creating a persistent backend model, the team must define:

- canonical data shape
- tenant behavior
- migration strategy from `creditPfCatalog`
- compatibility strategy for current consumers
- deprecation strategy for legacy `Produtos`

## Non-goals

This ADR does not create database models.

This ADR does not create migrations.

This ADR does not change runtime behavior.

This ADR does not remove `creditPfCatalog`.

This ADR does not modify CommercialTable or CommercialCondition.

## Architectural Rule

One domain, one owner, one source of truth.

Commercial Catalog is not Pipeline.

Commercial Catalog is not Commercial Table.

Commercial Catalog is not Provider.

Commercial Catalog is not legacy Produtos.
