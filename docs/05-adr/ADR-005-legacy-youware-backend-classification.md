# ADR-005 — Legacy YouWare Backend Classification

## Status

Proposed

## Context

FINQZ PRO originated from a YouWare/YouBase generated project.

During the architecture audit, two backend structures were identified:

### Enterprise Backend

Location:

backend/src

Characteristics:

- Fastify
- Prisma
- PostgreSQL
- Redis
- Multi-tenant architecture
- RBAC
- Commercial Governance
- Opportunity domain

Deployment evidence:

- backend/docker-compose.yml
- backend/Dockerfile
- VPS runtime
- Container: finqz-pro-api

### Legacy Backend

Location:

backend/server

Characteristics:

- EdgeSpark
- Hono
- Drizzle
- Generated db_schema
- Generated db_relations

The VPS runtime does not execute backend/server.

Docker runtime only builds and executes backend/src.

## Decision

backend/src is the official backend runtime of FINQZ PRO.

backend/server is classified as a legacy inherited backend structure from the original YouWare/YouBase environment.

No new business functionality should be implemented in backend/server.

No new integrations should be implemented in backend/server.

No new APIs should be implemented in backend/server.

## Consequences

Future backend development must target backend/src only.

backend/server must be treated as legacy until a dedicated decommissioning plan is approved.

The existence of backend/server does not imply active production usage.

Removal is not authorized by this ADR.

## Non-Goals

This ADR does not remove backend/server.

This ADR does not modify runtime.

This ADR does not alter Docker configuration.

This ADR does not alter deployment pipelines.

## Architectural Rule

backend/src is the only official backend development target.

backend/server is frozen until future audit and decommissioning planning.
