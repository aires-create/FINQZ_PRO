# 11 - Backend Modelagem de Dados

## Objetivo

Definir a fundação estrutural do backend do FINQZ PRO, com foco em uma modelagem PostgreSQL inicial, convenções claras e prontidão para multi-tenant e RBAC.

## Escopo

Esta modelagem cobre:
- Entidades oficiais do domínio
- Relacionamentos principais
- Estrutura Prisma inicial
- Convenções de IDs
- Estratégia de auditoria
- Soft delete
- Timestamps
- Multi-tenant readiness
- RBAC futuro

## Princípios de Modelagem

- **Pragmática**: estruturas simples e diretas, sem abstrações prematuras.
- **Incremental**: permitindo evolução por domínio, sem refatorações massivas.
- **Segura**: tenantId em todas as tabelas de dados operacionais.
- **Compatível com frontend atual**: nomes coerentes e estáveis.
- **SaaS financeiro enterprise**: registros financeiros e CRM são primeiramente auditáveis.

## Entidades Oficiais

### Core Multi-Tenant
- Tenant
- Organization
- User

### Autorização / RBAC
- Role
- Permission
- UserRole
- RolePermission
- Membership

### Parceiros e Estrutura Comercial
- Partner

### CRM
- Lead
- Customer
- Pipeline
- Stage
- Opportunity
- Activity

### Financeiro
- BankProposal
- Commission

### Operações e Segurança
- AuditLog
- RefreshToken

## Relacionamentos Chave

- `Tenant` é raiz e pertence a todas as tabelas operacionais.
- `Organization` agrupa usuários e define escopo interno.
- `User` pertence a `Tenant` e opcionalmente a `Organization`.
- `Partner` pertence a `Tenant` e tem hierarquia interna.
- `Lead` pode ser convertido em `Customer`.
- `Customer` pode ter `Opportunity` e `BankProposal`.
- `Opportunity` pertence a `Pipeline` e `Stage`.
- `Activity` está vinculada a `Lead`, `Customer` ou `Opportunity`.
- `BankProposal` e `Commission` mantêm o histórico financeiro.

## Convenções de IDs

- IDs são `UUID` gerados no banco: `gen_random_uuid()`.
- Campos de chave primária:
  - `id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid`
- Chaves estrangeiras usam `@db.Uuid` e indices explícitos.
- Nomes de colunas seguem padrão camelCase no Prisma e snake_case no banco via mapping quando desejado.

## Estratégia de Auditoria

- `AuditLog` é a tabela de trilha imutável.
- Registros contêm `tenantId`, `userId`, `organizationId`, `action`, `entity`, `entityId`, `changes`, `metadata`.
- Todos os eventos sensíveis devem gerar registros de auditoria no backend.

## Soft Delete

- Todas as entidades operacionais incluem `deletedAt DateTime?`.
- Query padrão deve excluir registros com `deletedAt != null`.
- `AuditLog` e `RefreshToken` não usam soft delete, pois têm semântica diferente.

## Timestamps

- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`
- `deletedAt DateTime?`
- `AuditLog` mantém apenas `createdAt`.

## Multi-Tenant Readiness

- `tenantId` presente em todas as entidades de negócio.
- Índices em `tenantId` para consultas rápidas.
- Campos relacionados a partner e organização devem coexistir com tenant.

## RBAC Futuro

- Modelo `Role` + `Permission` + `UserRole` + `RolePermission` fornece base para expansão.
- O backend deve aplicar permissão por recurso e ação.
- A camada de autorização pode evoluir sem alterar o esquema central.

## Observações Operacionais

- O modelo atual é adequado para uma primeira fase do backend.
- Não há microserviços ou CQRS.
- A prioridade é consistência de dados e governança de tenants.

## Próximo Passo

- Aplicar o schema Prisma no diretório `backend/prisma`.
- Validar o schema com Prisma Migrate.
- Manter o frontend existente sem mudanças na API ou no contrato de dados.
