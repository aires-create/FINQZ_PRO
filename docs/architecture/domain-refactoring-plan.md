# FINQZ PRO — Domain Refactoring Plan

## Objetivo

Documento oficial de planejamento da adaptação do domínio enterprise genérico

para o domínio operacional/comercial real do FINQZ PRO.

---

## Estado atual identificado

A arquitetura atual já possui:

- multi-tenant

- organizations hierárquicas

- RBAC

- memberships

- permissions

- role hierarchy

- parentId organizacional

Porém o domínio atual ainda está genérico/corporativo.

---

## Estrutura atual

```txt

Tenant

└── Organizations corporativas

&#x20;   ├── EXEC

&#x20;   ├── IT

&#x20;   ├── DEV

&#x20;   ├── FE

&#x20;   ├── BE

&#x20;   ├── SALES

&#x20;   ├── BD

&#x20;   ├── CS

&#x20;   └── FINOPS

---

## Estrutura alvo oficial FINQZ

```txt

Tenant

└── FINQZ / Matriz

&#x20;   └── Companhia / Parceiro Master

&#x20;       └── Franquia

&#x20;           └── Franqueado

&#x20;               └── Usuários

```
## Estratégia aprovada

A estratégia oficial será:

- reutilizar a arquitetura enterprise existente

- evitar recriação estrutural

- evitar duplicidade de domínio

- adaptar organizations para o domínio FINQZ

- manter RBAC multi-tenant

- manter memberships

- manter hierarchy via parentId

---

## Status

Fase atual:

Planejamento arquitetural.

Nenhuma alteração estrutural ainda foi executada.

