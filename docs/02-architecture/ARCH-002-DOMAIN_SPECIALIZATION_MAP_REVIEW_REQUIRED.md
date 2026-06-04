# FINQZ PRO — Domain Specialization Map

## Objetivo

Documento oficial de especialização do domínio enterprise genérico

para o domínio operacional/comercial FINQZ PRO.

---

## Estruturas que serão mantidas

A arquitetura abaixo permanecerá oficialmente no projeto:

- multi-tenant

- organizations

- memberships

- RBAC

- permissions

- hierarchy

- parentId

- audit

- integrations

- commercial engine

---

## Estruturas genéricas identificadas

A estrutura atual ainda utiliza nomenclaturas corporativas genéricas:

```txt

EXEC

IT

DEV

DEVOPS

QA

SALES

AM

CS

FINOPS

FE

BE

MOBILE

```

---

## Especialização oficial FINQZ

A estrutura organizacional passará a representar:

```txt

Tenant

└── FINQZ / Matriz

&#x20;   └── Companhia / Parceiro Master

&#x20;       └── Franquia

&#x20;           └── Franqueado

&#x20;               └── Usuários

```

---

## Estratégia oficial

A estratégia aprovada é:

- NÃO recriar arquitetura

- NÃO duplicar módulos

- NÃO criar novo sistema de tenancy

- NÃO criar novo RBAC

- reutilizar estrutura enterprise existente

- especializar o domínio atual

- adaptar seeds progressivamente

- adaptar nomenclaturas progressivamente

---

## Status

Fase atual:

Mapeamento e planejamento arquitetural.

Nenhuma migração destrutiva foi iniciada.