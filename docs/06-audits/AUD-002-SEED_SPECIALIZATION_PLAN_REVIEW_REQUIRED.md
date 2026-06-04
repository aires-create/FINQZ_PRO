# FINQZ PRO — Seed Specialization Plan

## Objetivo

Documento oficial para planejar a especialização do seed enterprise genérico
para o domínio operacional FINQZ PRO.

---

## Diagnóstico atual

O seed atual possui uma estrutura corporativa genérica:

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

## Decisão arquitetural

A estrutura Prisma atual será mantida.

Não será criada nova modelagem para substituir:

- Tenant
- Organization
- Membership
- Role
- Permission
- Partner

---

## Separação oficial de responsabilidades

### Organization

Representa a estrutura interna/corporativa:

- diretoria
- tecnologia
- operações
- financeiro
- compliance
- auditoria
- suporte

### Partner

Representa a rede operacional/comercial:

- parceiro master
- companhia
- franquia
- franqueado
- correspondente
- canal comercial

---

## Estrutura alvo do seed FINQZ

```txt
Tenant
├── Organizations internas
│   ├── EXEC
│   ├── FINOPS
│   ├── TECH
│   ├── COMPLIANCE
│   └── SUPPORT
│
└── Partner hierarchy
    └── FINQZ MASTER
        └── Companhia / Parceiro Master
            └── Franquia
                └── Franqueado
```

---

## Estratégia aprovada

A especialização do seed será:

- gradual
- idempotente
- sem reset destrutivo
- sem recriação de schema
- sem nova migration inicial
- preservando RBAC
- preservando tenant context
- preservando auditabilidade

---

## Regras obrigatórias

Antes de alterar `backend/prisma/seed.ts`, deve haver:

1. mapa de Organizations internas
2. mapa de Partner hierarchy
3. mapa de roles e permissões
4. validação de impacto no frontend
5. validação de impacto no login/admin
6. validação de impacto no RBAC

---

## Status

Fase atual:
Planejamento arquitetural.

Nenhuma alteração no seed foi executada ainda.