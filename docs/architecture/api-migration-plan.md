# FINQZ PRO — API Migration Plan

## Objetivo

Documento oficial de planejamento da migração dos contratos legados `/api/*`

para a arquitetura oficial modular `/api/v1/*`.

---

## Status atual identificado

O frontend já possui:

- modularização da camada API

- clients especializados

- adapters

- auth abstraction

- services separados

Porém os contratos REST ainda estão híbridos.

---

## Backend moderno oficial

Atualmente os módulos oficialmente migrados para `/api/v1/*` são:

| Prefixo | Status |

|---|---|

| /api/v1/commercial | oficial |

| /api/v1/integrations | oficial |

| /api/v1/audit | oficial |

| /api/v1/organizations | em análise |

| /api/v1/auth | parcial/híbrido |

---

## Frontend legado ainda identificado

Ainda existem módulos utilizando:

```txt

/api/clientes

/api/parceiros

/api/oportunidades

/api/produtos

/api/usuarios

/api/dashboard

/api/financeiro

/api/automacoes

/api/auth

```
---

## Estratégia oficial aprovada

A migração será:

- gradual
- por bounded context
- sem recriação estrutural
- sem quebra operacional
- sem remover compatibilidade imediatamente

---

## Ordem inicial recomendada

### Prioridade 1

- auth
- clientes
- parceiros
- oportunidades

---

### Prioridade 2

- dashboard
- financeiro
- usuarios
- produtos

---

### Prioridade 3

- automacoes
- campanhas
- conversas
- SDR IA

---

## Regras obrigatórias

Nenhuma nova API deve ser criada:

- fora de `/api/v1/*`
- fora da estrutura modular Fastify
- fora do domínio oficial
- sem schema
- sem RBAC
- sem tenant context

---

## Status

Fase atual:
Planejamento oficial de migração de contratos REST.
