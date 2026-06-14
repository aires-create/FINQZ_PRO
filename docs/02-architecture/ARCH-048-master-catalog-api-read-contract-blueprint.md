# ARCH-048 - Master Catalog API Read Contract Blueprint

## 1. Contexto

Este documento define os contratos conceituais da futura API de leitura do Master Catalog do FINQZ PRO.

Deriva de:

* ARCH-045 - Master Catalog Prisma Schema Proposal
* ARCH-046 - Master Catalog Persistence Blueprint
* ARCH-047 - Master Catalog Repository Contract Design

Este documento não autoriza implementação runtime.

---

## 2. Objetivo

Documentar:

* endpoints de leitura;
* request contracts;
* response contracts;
* regras RBAC;
* regras tenant-scoped;
* comportamento de erro;
* cache strategy futura.

---

## 3. Non-Goals

Este documento não:

* cria route;
* cria controller;
* cria service;
* cria repository;
* altera schema.prisma;
* cria migration;
* cria frontend;
* altera Pipeline;
* altera CommercialTable;
* altera Opportunity.

---

## 4. API Ownership

O backend é o único owner da API do Master Catalog.

O frontend atua apenas como consumidor.

Não é permitido:

* catálogo local;
* catálogo hardcoded;
* catálogo derivado de Pipeline;
* catálogo derivado de CommercialTable.

---

## 5. Proposed Endpoints

### List Products

```http
GET /master-catalog/products
```

### Product By Code

```http
GET /master-catalog/products/{code}
```

### List Subproducts

```http
GET /master-catalog/subproducts
```

### List Modalities

```http
GET /master-catalog/modalities
```

### Catalog Tree

```http
GET /master-catalog/tree
```

### Segments

```http
GET /master-catalog/segments
```

---

## 6. Tenant Scope Rules

Toda requisição deve ser executada dentro do contexto do tenant autenticado.

Não deve existir:

```txt
cross-tenant catalog access
```

O tenant nunca deve ser informado pelo frontend como parâmetro livre.

O tenant deve ser resolvido pelo contexto autenticado.

---

## 7. RBAC Rules

A API deve respeitar RBAC.

Perfis futuros elegíveis:

* CEO
* Admin
* Gestor
* Operador
* Parceiro

As permissões específicas serão definidas em fase posterior.

---

## 8. Request Contract Principles

Todos os endpoints devem:

* ser tenant-scoped;
* ser read-only;
* suportar filtros de status quando aplicável;
* ignorar registros soft-deleted.

---

## 9. Response Envelope

Formato conceitual:

```ts
type ApiResponse<T> = {
  success: boolean;
  data: T;
  metadata?: Record<string, unknown>;
};
```

---

## 10. Product Response Contract

```ts
type ProductResponse = {
  id: string;
  code: string;
  name: string;
  status: CatalogStatus;
  displayOrder: number;
};
```

---

## 11. Subproduct Response Contract

```ts
type SubproductResponse = {
  id: string;
  productId: string;
  code: string;
  name: string;
  status: CatalogStatus;
  displayOrder: number;
};
```

---

## 12. Modality Response Contract

```ts
type ModalityResponse = {
  id: string;
  subproductId: string;
  code: string;
  name: string;
  status: CatalogStatus;
  displayOrder: number;
};
```

---

## 13. Segment Response Contract

```ts
type SegmentResponse = {
  id: string;
  code: string;
  name: string;
  status: CatalogStatus;
  displayOrder: number;
};
```

---

## 14. Catalog Tree Contract

```ts
type CatalogTreeResponse = {
  products: ProductTreeNode[];
};
```

Hierarquia:

```txt
Product
 └─ Subproduct
     └─ Modality
```

Segment permanece independente.

---

## 15. Error Behavior

Ausência de recurso:

```http
404
```

Request inválido:

```http
400
```

Não autenticado:

```http
401
```

Sem permissão:

```http
403
```

Erro interno:

```http
500
```

---

## 16. Cache Strategy

Leitura do catálogo é candidata a cache.

Estratégia futura:

* cache tenant-scoped;
* invalidação por atualização do catálogo;
* sem cache cross-tenant.

---

## 17. Explicit NO-REUSE

A API do Master Catalog não deve consumir:

* CommercialTable;
* CommercialCondition;
* Pipeline;
* Stage;
* Opportunity;
* creditPfCatalog;
* catalogRepository;
* commercialRepository.

---

## 18. Risks

* vazamento cross-tenant;
* RBAC inconsistente;
* resposta baseada em Pipeline;
* resposta baseada em CommercialTable;
* frontend mantendo catálogo paralelo;
* cache compartilhado entre tenants.

---

## 19. Decision

GO para blueprint dos contratos da API de leitura do Master Catalog.

NO-GO para implementação runtime nesta fase.

---

## 20. Next Phase

PHASE H-07G — Master Catalog Application Service Blueprint

Ainda sem implementação runtime.
