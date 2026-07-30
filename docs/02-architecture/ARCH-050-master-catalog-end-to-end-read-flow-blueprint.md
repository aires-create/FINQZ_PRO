# ARCH-050 - Master Catalog End-to-End Read Flow Blueprint

## 1. Contexto

Este documento define o blueprint conceitual do fluxo completo de leitura do Master Catalog no FINQZ PRO.

Deriva de:

* ARCH-045 - Master Catalog Prisma Schema Proposal
* ARCH-046 - Master Catalog Persistence Blueprint
* ARCH-047 - Master Catalog Repository Contract Design
* ARCH-048 - Master Catalog API Read Contract Blueprint
* ARCH-049 - Master Catalog Application Service Blueprint

Este documento não autoriza implementação runtime.

---

## 2. Objetivo

Documentar o fluxo futuro de leitura ponta a ponta:

```txt
HTTP Request
  ↓
Route
  ↓
Controller
  ↓
Application Service
  ↓
Repository
  ↓
Persistence
  ↓
Read Model
  ↓
DTO
  ↓
HTTP Response
```

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
* altera CommercialTable;
* altera Pipeline;
* altera Opportunity.

---

## 4. End-to-End Flow

Fluxo conceitual:

```txt
Client
  ↓
GET /master-catalog/tree
  ↓
Auth Middleware
  ↓
Tenant Context
  ↓
RBAC Guard
  ↓
Controller
  ↓
Application Service
  ↓
Repository Interface
  ↓
Persistence Adapter
  ↓
Master Catalog Tables
  ↓
Read Model Mapper
  ↓
Response DTO
```

---

## 5. Route Boundary

A route futura será responsável apenas por:

* declarar path;
* registrar guards;
* receber request;
* delegar ao controller.

A route não deve conter:

* regra de negócio;
* query Prisma;
* fallback frontend;
* lógica de catálogo.

---

## 6. Controller Boundary

O controller futuro será responsável por:

* extrair parâmetros;
* extrair query params;
* receber contexto autenticado;
* chamar application service;
* retornar response envelope.

O controller não deve:

* consultar banco;
* conhecer Prisma;
* consultar CommercialTable;
* consultar Pipeline;
* montar árvore manualmente.

---

## 7. Application Service Boundary

O service será responsável por:

* validar input;
* garantir tenant scope;
* orquestrar repository;
* aplicar cache se autorizado futuramente;
* mapear read models para DTOs;
* traduzir erros de aplicação.

O service não deve:

* executar SQL;
* acessar Prisma diretamente;
* consumir frontend config;
* calcular comissão;
* decidir elegibilidade comercial.

---

## 8. Repository Boundary

O repository será responsável por:

* consultar persistência;
* aplicar filtros tenant-scoped;
* ignorar soft-deleted records;
* ordenar por displayOrder;
* retornar read models.

O repository não deve:

* retornar Prisma model cru;
* fazer RBAC;
* calcular comissão;
* conhecer Pipeline;
* conhecer Opportunity;
* conhecer CommercialTable.

---

## 9. Persistence Boundary

A persistência futura será baseada em:

* MasterCatalogSegment
* MasterCatalogProduct
* MasterCatalogSubproduct
* MasterCatalogModality

Nenhuma tabela operacional deve ser usada como fonte de verdade do catálogo.

---

## 10. Tenant Flow

O tenant deve ser resolvido antes do controller.

Fluxo:

```txt
JWT
  ↓
Tenant Context Middleware
  ↓
Auth Context
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
tenantId filter
```

O tenant nunca deve ser enviado pelo frontend como fonte confiável.

---

## 11. RBAC Flow

RBAC deve ocorrer antes da execução do caso de uso.

Fluxo:

```txt
Authenticated User
  ↓
Roles / Permissions
  ↓
RBAC Guard
  ↓
Allowed Use Case
```

O repository não substitui RBAC, mas mantém tenant scope como defesa estrutural.

---

## 12. Error Flow

Erros esperados:

```txt
ValidationError
  ↓
400

NotAuthenticated
  ↓
401

Forbidden
  ↓
403

NotFound
  ↓
404

ApplicationError
  ↓
500
```

Erros técnicos de banco não devem vazar para o consumidor.

---

## 13. Response Flow

Formato conceitual:

```ts
type ApiResponse<T> = {
  success: boolean;
  data: T;
  metadata?: Record<string, unknown>;
};
```

Para tree:

```ts
type CatalogTreeResponse = {
  products: ProductTreeNode[];
  segments: SegmentResponse[];
};
```

Segment permanece independente da hierarquia Product -> Subproduct -> Modality.

---

## 14. Cache Flow

Cache futuro, se autorizado:

```txt
Tenant ID
  ↓
Cache Key
  ↓
Catalog Read Response
```

Regras:

* cache sempre tenant-scoped;
* nunca cache cross-tenant;
* invalidação futura por alteração de catálogo;
* repository não conhece cache.

---

## 15. Explicit NO-REUSE

O fluxo end-to-end do Master Catalog não deve depender de:

* CommercialTable;
* CommercialCondition;
* Pipeline;
* Stage;
* Opportunity;
* creditPfCatalog;
* catalogRepository;
* commercialRepository;
* localStorage;
* frontend config.

---

## 16. Future Observability

Futuramente, o fluxo poderá registrar:

* requestId;
* tenantId;
* userId;
* endpoint;
* latency;
* cache hit/miss;
* error category.

Sem expor dados sensíveis.

---

## 17. Risks

* bypass de tenant context;
* bypass de RBAC;
* controller com regra de negócio;
* service acoplado ao Prisma;
* repository retornando entidade crua;
* cache cross-tenant;
* fallback frontend;
* reuso indevido de CommercialTable ou Pipeline.

---

## 18. Decision

GO para blueprint do fluxo completo de leitura do Master Catalog.

NO-GO para implementação runtime nesta fase.

---

## 19. Next Phase

PHASE H-07I — Master Catalog Runtime Readiness Checklist

Ainda sem implementação runtime.
