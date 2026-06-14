# ARCH-049 - Master Catalog Application Service Blueprint

## 1. Contexto

Este documento define o blueprint conceitual da futura camada Application Service do Master Catalog.

Deriva de:

* ARCH-045 - Master Catalog Prisma Schema Proposal
* ARCH-046 - Master Catalog Persistence Blueprint
* ARCH-047 - Master Catalog Repository Contract Design
* ARCH-048 - Master Catalog API Read Contract Blueprint

Este documento não autoriza implementação runtime.

---

## 2. Objetivo

Definir:

* responsabilidades da camada Application Service;
* orchestration flow;
* tenant boundary;
* RBAC boundary;
* validation boundary;
* cache boundary;
* mapping boundary;
* error handling boundary.

---

## 3. Non-Goals

Este documento não:

* cria service runtime;
* cria repository runtime;
* cria route;
* cria controller;
* altera schema.prisma;
* cria migration;
* cria frontend;
* altera CommercialTable;
* altera Pipeline;
* altera Opportunity.

---

## 4. Layer Position

```txt
HTTP Route
    ↓
Controller
    ↓
Application Service
    ↓
Repository
```

O Application Service atua como camada de orquestração.

---

## 5. Core Responsibilities

Responsabilidades futuras:

* coordenar acesso ao repository;
* aplicar validações de aplicação;
* garantir tenant scope;
* garantir RBAC prévio;
* coordenar cache;
* montar DTOs de resposta;
* traduzir erros internos.

Não deve:

* acessar banco diretamente;
* executar SQL;
* conhecer Prisma;
* conhecer frontend.

---

## 6. Tenant Boundary

Todo método deve operar dentro de um tenant válido.

Entradas obrigatórias:

```ts
type TenantContext = {
  tenantId: string;
};
```

Nenhum método deve permitir acesso cross-tenant.

---

## 7. RBAC Boundary

RBAC deve ser validado antes da execução do caso de uso.

O service pode receber contexto já autorizado:

```ts
type AuthContext = {
  userId: string;
  tenantId: string;
  roles: string[];
};
```

O service não deve substituir o mecanismo RBAC oficial.

---

## 8. Proposed Read Use Cases

Casos de uso futuros:

```ts
listCatalogProducts()
listCatalogSegments()
listCatalogSubproducts()
listCatalogModalities()
getCatalogTree()
findProductByCode()
findSubproductByCode()
findModalityByCode()
```

Todos read-only inicialmente.

---

## 9. Validation Boundary

Validações esperadas:

* tenantId obrigatório;
* code válido;
* filtros válidos;
* status permitido.

Validações de domínio permanecem nos contratos do domínio.

---

## 10. Repository Interaction

O service deve consumir apenas interfaces.

Não deve consumir:

* Prisma Client;
* SQL direto;
* CommercialTable;
* Pipeline;
* Opportunity.

---

## 11. Mapping Boundary

O service é responsável por transformar:

```txt
Repository Read Model
        ↓
API DTO
```

Sem expor entidades internas.

---

## 12. Cache Boundary

Futuro cache:

* tenant-scoped;
* invalidável;
* transparente ao consumidor.

O repository não deve conhecer cache.

---

## 13. Error Handling

Ausência de recurso:

```txt
NotFound
```

Entrada inválida:

```txt
ValidationError
```

Falha inesperada:

```txt
ApplicationError
```

O service não deve retornar erro técnico bruto do banco.

---

## 14. Explicit NO-REUSE

O Application Service não deve depender de:

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

## 15. Future Consumers

Consumidores futuros:

* Master Catalog API;
* Commercial Table workflows;
* Opportunity Intake;
* Provider Routing;
* Product Availability;
* Backoffice Tools.

Todos devem consumir o Master Catalog, nunca o contrário.

---

## 16. Risks

* vazamento cross-tenant;
* bypass de RBAC;
* acoplamento com Prisma;
* acoplamento com frontend;
* retorno de entidades internas;
* lógica comercial dentro do service.

---

## 17. Decision

GO para blueprint da camada Application Service do Master Catalog.

NO-GO para implementação runtime nesta fase.

---

## 18. Next Phase

PHASE H-07H — Master Catalog End-to-End Read Flow Blueprint

Ainda sem implementação runtime.
