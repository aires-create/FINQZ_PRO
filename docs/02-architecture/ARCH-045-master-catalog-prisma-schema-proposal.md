# ARCH-045 - Master Catalog Prisma Schema Proposal

## 1. Contexto

Este documento propõe o desenho Prisma futuro para o Master Catalog do FINQZ PRO, alinhado ao contexto arquitetural já aprovado:

- Backend First
- Tenant Scoped
- RBAC Driven
- Auditável
- Sem gambiarras
- Sem duplicidades
- Single Source of Truth
- Pipeline ≠ Product
- CommercialTable ≠ Catálogo
- Opportunity ≠ Catálogo
- Segment ≠ Product

O objetivo é registrar o blueprint conceitual dos models Prisma que suportarão o catálogo mestre sem reutilizar fontes legadas ou estruturas operacionais que pertencem a outros domínios.

## 2. Decisões Arquiteturais Aprovadas

As decisões já aprovadas e consolidadas para o Master Catalog são:

### 2.1 Segmentos oficiais

- INSS
- SERVIDOR_PUBLICO
- FORCAS_ARMADAS
- CLT
- FGTS
- OUTROS_CONVENIOS

### 2.2 Products oficiais

- CONSIGNADO
- ANTECIPACAO_FGTS
- ENERGIA_POR_ASSINATURA
- SEGURO
- CONSORCIO

### 2.3 Consignado Subproducts

- NOVO
- REFINANCIAMENTO
- PORTABILIDADE
- PORT_REFIN
- CARTAO_RMC
- CARTAO_BENEFICIO

### 2.4 Modalities

- CARTAO
- CARTAO_SAQUE
- SAQUE_COMPLEMENTAR

### 2.5 Relacionamentos aprovados

Segment é independente de Product.

Estrutura válida:

```text
Product
└─ Subproduct

Subproduct
└─ Modality
```

Não existe relação Product -> Segment, nem Segment -> Product.

### 2.6 Tenant Rules

Todas as entidades do Master Catalog possuem `tenantId`.

Todas as consultas futuras devem ser tenant-scoped.

### 2.7 Status

`CatalogStatus` é composto por:

- DRAFT
- ACTIVE
- INACTIVE
- ARCHIVED

### 2.8 Soft Delete

Todas as entidades devem prever `deletedAt`.

### 2.9 Restrição de deleção

O comportamento arquitetural aprovado é `onDelete: Restrict`.

### 2.10 Seed oficial

O seed conceitual oficial é `MASTER_CATALOG_INITIAL_TREE`.

### 2.11 Fontes proibidas

O Master Catalog não reutiliza como source of truth:

- CommercialTable
- CommercialCondition
- Pipeline
- Stage
- Opportunity
- creditPfCatalog
- catalogRepository
- commercialRepository

## 3. Prisma Blueprint Aprovado

O blueprint Prisma futuro deve introduzir quatro models canônicos:

- `MasterCatalogSegment`
- `MasterCatalogProduct`
- `MasterCatalogSubproduct`
- `MasterCatalogModality`

Esses models não devem depender de `CommercialTable`, `CommercialCondition`, `Pipeline` ou `Opportunity`.

## 4. Model Proposals

### 4.1 MasterCatalogSegment

Finalidade:

- representar o segmento/convênio de forma independente;
- servir como agrupador conceitual do catálogo, sem ligação estrutural com Product.

Campos propostos:

- id
- tenantId
- code
- name
- status
- displayOrder
- createdAt
- updatedAt
- deletedAt

Restrições e índices:

- `@@unique([tenantId, code])`
- `@@index([tenantId, status])`
- `@@index([tenantId, displayOrder])`

### 4.2 MasterCatalogProduct

Finalidade:

- representar a oferta comercial de alto nível;
- ser a unidade superior da hierarquia do catálogo mestre.

Campos propostos:

- id
- tenantId
- code
- name
- status
- displayOrder
- createdAt
- updatedAt
- deletedAt

Restrições e índices:

- `@@unique([tenantId, code])`
- `@@index([tenantId, status])`
- `@@index([tenantId, displayOrder])`

Observação:

- não incluir `segmentId`;
- não incluir `agreementId`;
- não incluir vínculos com Pipeline.

### 4.3 MasterCatalogSubproduct

Finalidade:

- representar uma subdivisão de Product;
- manter a hierarquia oficial `Product -> Subproduct`.

Campos propostos:

- id
- tenantId
- productId
- code
- name
- status
- displayOrder
- createdAt
- updatedAt
- deletedAt

Restrições e índices:

- `@@unique([tenantId, productId, code])`
- `@@index([tenantId, productId])`
- `@@index([tenantId, status])`
- `@@index([tenantId, displayOrder])`

Restrição relacional:

- `productId` deve referenciar `MasterCatalogProduct` com `onDelete: Restrict`

### 4.4 MasterCatalogModality

Finalidade:

- representar a modalidade de contratação permitida dentro de um Subproduct.

Campos propostos:

- id
- tenantId
- subproductId
- code
- name
- status
- displayOrder
- createdAt
- updatedAt
- deletedAt

Restrições e índices:

- `@@unique([tenantId, subproductId, code])`
- `@@index([tenantId, subproductId])`
- `@@index([tenantId, status])`
- `@@index([tenantId, displayOrder])`

Restrição relacional:

- `subproductId` deve referenciar `MasterCatalogSubproduct` com `onDelete: Restrict`

## 5. Tenant Scope e Auditoria

O contrato Prisma proposto assume:

- isolamento por tenant em todas as tabelas do catálogo;
- leitura e escrita sempre filtradas por `tenantId`;
- rastreabilidade temporal com `createdAt`, `updatedAt` e `deletedAt`;
- preservação de histórico lógico por soft delete, sem apagar registros físicos.

## 6. Contrato de Hierarquia

### 6.1 Product

Product é a unidade superior do Master Catalog.

### 6.2 Subproduct

Subproduct pertence a Product.

### 6.3 Modality

Modality pertence a Subproduct.

### 6.4 Segment

Segment é independente de Product.

Não deve existir:

- `segmentId` em Product
- relação Product -> Segment
- relação Segment -> Product

## 7. Compatibilidade com o Ecossistema Atual

O novo schema não deve reutilizar:

- `CommercialTable`
- `CommercialCondition`
- `Pipeline`
- `Stage`
- `Opportunity`
- `creditPfCatalog`
- `catalogRepository`
- `commercialRepository`

Esses artefatos podem existir apenas como consumidores, integrações transitórias ou legado, mas não como fonte de verdade do Master Catalog.

## 8. Riscos Arquiteturais

- duplicidade de catálogo se houver coexistência prolongada com fontes legadas;
- conflito de ownership caso Pipeline ou CommercialTable sejam tratados como catálogo;
- risco de acoplamento indevido com Opportunity;
- risco de inconsistência se `tenantId` não for aplicado em todas as queries;
- risco de perda de auditabilidade se `deletedAt` for ignorado.

## 9. Decisão Arquitetural Final

O Master Catalog deve nascer como domínio próprio, tenant-scoped, auditável, com entidades separadas para Segment, Product, Subproduct e Modality.

O schema Prisma proposto é:

- canônico;
- independente;
- preparado para leitura e evolução futura;
- livre de dependência com fontes legadas ou domínios operacionais adjacentes.

## 10. Non-Goals

Este documento não:

- altera `schema.prisma`;
- cria migration;
- cria repository;
- cria service;
- cria controller;
- cria route;
- cria seed real;
- cria código runtime;
- reutiliza `CommercialTable` como catálogo;
- reutiliza `Opportunity` como catálogo;
- reutiliza `Pipeline` como produto;
- reutiliza `creditPfCatalog` como source of truth.
