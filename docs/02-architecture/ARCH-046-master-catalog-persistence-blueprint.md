# ARCH-046 - Master Catalog Persistence Blueprint

## 1. Contexto

Este documento define o blueprint de persistência futura do Master Catalog no FINQZ PRO.

Ele deriva de:

- ARCH-045 - Master Catalog Prisma Schema Proposal
- H-07A - Master Catalog Reuse Audit
- H-07B - Create / Reuse / Discard Matrix
- H-07C - Master Catalog Contracts Foundation

Este documento não autoriza implementação runtime.

## 2. Objetivo

Documentar a futura estratégia de persistência do Master Catalog, incluindo:

- boundaries de repository;
- estratégia de tenant scope;
- query patterns;
- índices;
- unique constraints;
- seed strategy;
- soft delete;
- migration strategy futura;
- integração futura com read models.

## 3. Non-Goals

Este documento não:

- altera `schema.prisma`;
- cria migration;
- cria repository runtime;
- cria service;
- cria controller;
- cria route;
- cria seed real;
- cria frontend;
- altera CommercialTable;
- altera Pipeline;
- altera Opportunity.

## 4. Persistence Ownership

O backend será o único owner da persistência do Master Catalog.

O frontend não deve persistir catálogo, simular catálogo ou manter fonte paralela de verdade.

## 5. Proposed Persistence Tables

- MasterCatalogSegment
- MasterCatalogProduct
- MasterCatalogSubproduct
- MasterCatalogModality

## 6. Tenant Scope

Todas as tabelas devem possuir `tenantId`.

Todas as queries futuras devem filtrar obrigatoriamente por `tenantId`.

Nenhum método de repository deve permitir leitura cross-tenant.

## 7. Relationship Model

```txt
MasterCatalogProduct
 └─ MasterCatalogSubproduct
     └─ MasterCatalogModality

MasterCatalogSegment
 independent