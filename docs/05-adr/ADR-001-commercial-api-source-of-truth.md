# ADR-001 — Commercial API as Source of Truth

## Status
Accepted

## Context
O módulo comercial utilizava localStorage como persistência principal.

Isso impedia:
- consistência multi-tenant
- auditoria operacional
- sincronização centralizada
- persistência enterprise
- integridade entre frontend e backend

## Decision
A API backend comercial passa a ser a única fonte oficial de persistência.

Frontend:
- consome API como fonte principal
- utiliza fallback local apenas temporariamente em leitura emergencial

Backend:
- PostgreSQL multi-tenant
- Prisma transacional
- isolamento por tenant

## Consequences

### Positivas
- consistência operacional
- persistência centralizada
- suporte enterprise
- futura auditoria/RBAC
- eliminação gradual do legado localStorage

### Negativas
- necessidade de hardening frontend
- fallback legado temporário
- migração gradual do simulador

## Related Phases
- FASE 2.19-B.1
- FASE 2.19-B.2
- FASE 2.19-B.3
- FASE 2.19-B.4