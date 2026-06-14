# ARCH-047 - Master Catalog Repository Contract Design

## 1. Contexto

Este documento define o desenho conceitual do futuro contrato de repository do Master Catalog no FINQZ PRO.

Ele deriva de:

- ARCH-045 - Master Catalog Prisma Schema Proposal
- ARCH-046 - Master Catalog Persistence Blueprint
- H-07C - Master Catalog Contracts Foundation

Este documento não autoriza implementação runtime.

## 2. Objetivo

Documentar o contrato futuro de acesso à persistência do Master Catalog, mantendo:

- backend ownership;
- tenant scope obrigatório;
- read-only first;
- ausência de dependência com CommercialTable;
- ausência de dependência com Pipeline;
- ausência de dependência com Opportunity;
- compatibilidade futura com read models.

## 3. Non-Goals

Este documento não:

- cria repository runtime;
- altera `schema.prisma`;
- cria migration;
- cria service;
- cria controller;
- cria route;
- cria seed real;
- cria frontend;
- altera CommercialTable;
- altera Pipeline;
- altera Opportunity.

## 4. Repository Principles

O futuro repository deverá seguir estes princípios:

- todo método recebe `tenantId`;
- nenhum método permite leitura cross-tenant;
- leitura inicial será read-only;
- resultados devem ignorar registros com `deletedAt`;
- filtros devem respeitar `CatalogStatus`;
- ordenação padrão por `displayOrder`, depois `name`;
- repository não calcula comissão;
- repository não conhece pipeline;
- repository não conhece opportunity;
- repository não conhece commercial table.

## 5. Proposed Contract Boundary

O repository será responsável apenas por recuperar entidades persistidas do Master Catalog.

Ele não será responsável por:

- regra comercial;
- elegibilidade de produto por segmento;
- comissão;
- provider routing;
- pipeline stage;
- opportunity lifecycle;
- settlement;
- frontend fallback.

## 6. Proposed Read Methods

Métodos futuros propostos:

```ts
listSegments(input: ListCatalogSegmentsInput): Promise<MasterCatalogSegmentReadModel[]>;

listProducts(input: ListCatalogProductsInput): Promise<MasterCatalogProductReadModel[]>;

listSubproductsByProduct(input: ListCatalogSubproductsByProductInput): Promise<MasterCatalogSubproductReadModel[]>;

listModalitiesBySubproduct(input: ListCatalogModalitiesBySubproductInput): Promise<MasterCatalogModalityReadModel[]>;

getCatalogTree(input: GetMasterCatalogTreeInput): Promise<MasterCatalogTreeReadModel>;

findProductByCode(input: FindCatalogProductByCodeInput): Promise<MasterCatalogProductReadModel | null>;

findSubproductByCode(input: FindCatalogSubproductByCodeInput): Promise<MasterCatalogSubproductReadModel | null>;

findModalityByCode(input: FindCatalogModalityByCodeInput): Promise<MasterCatalogModalityReadModel | null>;