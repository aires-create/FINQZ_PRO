# FINQZ PRO — Backend Modularization Plan

## Objetivo

Documento oficial da estratégia de modularização enterprise do backend FINQZ PRO.

---

## Diagnóstico atual

O backend atual já possui fundações enterprise modernas:

- Fastify modular
- Prisma ORM
- PostgreSQL
- RBAC
- multi-tenant
- audit logs
- JWT auth
- security layers
- rate limit
- tenant context

Porém ainda existem partes híbridas e domínios parcialmente acoplados.

---

## Estrutura atual identificada

O backend atualmente mistura:

```txt
core
shared
legacy routes
hybrid modules
generic enterprise domain

```
---

## Estratégia oficial

A arquitetura futura será organizada por bounded contexts.

---

## Estrutura alvo oficial

```txt
src/modules
auth/
audit/
organization/
partner/
commercial/
crm/
financial/
pipeline/
users/
permissions/
integrations/
automation/
analytics/

```
---

## Regras obrigatórias

Cada módulo deverá possuir:

```txt
routes
controller
service
repository
schemas
dto
types
validators

```
---

## Regras arquiteturais

Nenhum módulo poderá:

- acessar domínio de outro módulo diretamente
- compartilhar lógica de negócio indevidamente
- acessar Prisma fora da camada apropriada
- quebrar tenant isolation
- quebrar RBAC
- duplicar entidades

---

## Estratégia de migração

A modularização será:

- incremental
- sem big-bang rewrite
- sem remover compatibilidade
- preservando APIs existentes
- baseada em domínio
- guiada por bounded contexts

---

## Ordem oficial recomendada

### Fase 1

- auth
- organization
- users
- permissions

### Fase 2

- partner
- commercial
- crm

### Fase 3

- financial
- commissions
- cashback

### Fase 4

- automation
- analytics
- SDR IA
- integrations

---

## Estratégia de isolamento

```txt
Route
    ↓
Controller
    ↓
Service
    ↓
Repository
    ↓
Prisma

```
---

## Status atual

Fase atual:
Planejamento oficial da modularização backend enterprise.

Nenhuma refatoração estrutural foi iniciada ainda.