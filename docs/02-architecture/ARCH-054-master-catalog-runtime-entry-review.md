# ARCH-054 - Master Catalog Runtime Entry Review

## 1. Objetivo

Definir a estratégia oficial de entrada no runtime do Master Catalog.

## 2. Estado Atual

### Concluído

- ARCH-040
- ARCH-041
- ARCH-042
- ARCH-043
- ARCH-044
- ARCH-045
- ARCH-046
- ARCH-047
- ARCH-048
- ARCH-049
- ARCH-050
- ARCH-051
- ARCH-052
- ARCH-053

### Runtime

Ainda inexistente.

## 3. Princípios de Implementação

- Backend First
- Tenant Scoped
- RBAC Driven
- Auditável
- Single Source of Truth
- No Legacy
- No Duplicate Sources

## 4. Sequência Oficial

### Wave 1

Prisma Foundation

Escopo:

- Models
- Enums
- Relations
- Indexes
- Constraints
- Migration

Non-Goals:

- Repository
- Service
- Route
- Controller
- Frontend

Gate:

Persistência validada.

### Wave 2

Repository Read Only

Escopo:

- Repository Contracts Runtime
- Repository Implementation Read Only

Gate:

Tenant Isolation validada.

### Wave 3

Application Service Read Only

Escopo:

- Read Service
- DTO Mapping
- Read Models Runtime

Gate:

Contratos de leitura validados.

### Wave 4

HTTP Read API

Escopo:

- Routes
- Controllers
- RBAC Read
- API Contracts

Gate:

Consumo externo validado.

## 5. Critérios de Aprovação

## 6. Critérios de Rollback

## 7. Riscos

## 8. Go / No-Go

GO para Wave 1.

NO-GO para iniciar Waves 2, 3 ou 4 antes da aprovação da anterior.

## 5. Critérios de Aprovação

Wave 1 só poderá ser considerada aprovada se:

- os models Prisma forem adicionados sem alterar domínios existentes;
- a migration for exclusiva do Master Catalog;
- não houver alteração em CommercialTable, Pipeline ou Opportunity;
- os índices e constraints seguirem ARCH-045 e ARCH-046;
- `tenantId` estiver presente em todas as entidades;
- soft delete estiver previsto via `deletedAt`;
- `onDelete: Restrict` estiver preservado;
- `prisma validate` passar;
- os testes existentes continuarem passando;
- nenhuma Wave 2, 3 ou 4 for iniciada no mesmo passo.

## 6. Critérios de Rollback

Rollback obrigatório se:

- a migration afetar tabelas fora do Master Catalog;
- houver alteração indevida em domínios existentes;
- `tenantId` for omitido;
- constraints ou índices divergirem do blueprint aprovado;
- houver tentativa de criar repository, service, route, controller ou frontend junto com a Wave 1;
- `prisma validate` falhar;
- testes existentes falharem por impacto não esperado.

## 7. Nota de Escopo

GO para Wave 1 significa autorização futura apenas para avaliar e executar a fundação Prisma do Master Catalog.

Não significa autorização para IMPL-10A completo.

Não autoriza:

- repository runtime;
- service runtime;
- controller;
- route;
- endpoint HTTP;
- frontend;
- cache;
- RBAC runtime específico do catálogo.