# ARCH-067 — Stage Lifecycle Architecture

Status: DRAFT  
Type: Architecture Decision Document  
Scope: Pipeline / Stage / Opportunity  
Date: 2026-06-24

---

## 1. Contexto

Pipeline Enterprise já consolidou a semântica de lifecycle em:

- Active
- Inactive
- Archived

Stage, por outro lado, ainda opera com semântica parcial:

- create
- update
- reorder
- soft delete via `deletedAt`

Auditorias recentes confirmaram que:

- `Stage` possui `deletedAt`
- `Stage` não possui `isActive`
- `Stage` não possui `status`
- `Stage` não possui `archivedAt`
- o Admin hoje cria etapas, mas não governa o ciclo de vida completo
- o frontend já expõe métodos oficiais para create/update/delete/reorder

Este documento define a arquitetura alvo para Stage sem alterar runtime nesta fase.

---

## 2. Problema

O domínio Stage não tem lifecycle Enterprise formalizado.

Hoje existe apenas:

- Stage ativo por ausência de `deletedAt`
- Stage arquivado por `deletedAt != null`

Isso é insuficiente para separar corretamente:

- edição operacional
- inativação temporária
- arquivamento
- proteção de Opportunities/cards vinculados

O risco atual é esconder cards operacionais, apagar histórico de navegação e criar comportamento semântico diferente entre backend, Admin e CRM.

---

## 3. Decisao Arquitetural

Stage deve ter lifecycle formal:

- `ACTIVE = isActive=true + deletedAt=null`
- `INACTIVE = isActive=false + deletedAt=null`
- `ARCHIVED = deletedAt!=null`

Regras obrigatórias:

- Stage não deve ter delete físico.
- Stage archived só pode existir se não houver Opportunities/cards vinculados.
- Stage inactive pode existir mesmo com cards vinculados.
- Stage inactive não pode receber novas Opportunities.
- cards existentes nunca devem desaparecer do contexto operacional.
- Admin deve ver active + inactive.
- CRM e novas operações devem usar only active como default operacional.
- reorder não altera histórico, `stageId` ou `opportunity`.
- editar `name`, `order`, `isWon`, `isLost` não altera vínculo histórico.

Esta arquitetura é backend-first, tenant-scoped, RBAC-driven e auditável.

---

## 4. Diferenca Pipeline vs Stage

Pipeline:

- já possui lifecycle Enterprise mais avançado
- controla leitura operacional e visibilidade administrativa
- já distingue active, inactive e archived

Stage:

- representa posição e semântica do funil
- está diretamente ligado a Opportunity/card
- requer preservação forte de histórico
- não pode ser tratado como um item descartável

Diferença essencial:

- Pipeline pode ser inativado e arquivado com governança própria
- Stage precisa preservar o contexto operacional de cards existentes mesmo quando estiver inactive

---

## 5. Lifecycle Matrix

| State | Exists today? | Notes |
|---|---|---|
| ACTIVE | Existe parcialmente | Representado implicitamente por `deletedAt = null`; `isActive` ainda não existe no schema |
| INACTIVE | Não existe | Não há campo, contrato ou rota formal para inativar sem arquivar |
| ARCHIVED | Existe parcialmente | Representado por `deletedAt != null` via soft delete |

Rules by state:

- ACTIVE
  - pode receber novas Opportunities
  - aparece no contexto operacional
  - aparece no Admin
- INACTIVE
  - não pode receber novas Opportunities
  - deve permanecer visível no Admin
  - deve permanecer disponível para cards existentes quando necessário
- ARCHIVED
  - não deve aparecer no contexto operacional
  - não deve receber novas Opportunities
  - só deve existir sem vínculos ativos

---

## 6. Visibility Matrix

| Consumer | ACTIVE | INACTIVE | ARCHIVED |
|---|---|---|---|
| Admin | Yes | Yes | No |
| CRM | Yes | No by default | No |
| New Opportunities | Yes | No | No |
| Existing Opportunities/cards | Yes | Yes, if already linked | No |

Notes:

- Admin must show active + inactive because lifecycle governance is administrative.
- CRM must avoid inactive for new operational assignment.
- Existing cards must not disappear if a stage becomes inactive.
- Archived stages are excluded from normal runtime surfaces.

---

## 7. Operations Matrix

| Operation | ACTIVE | INACTIVE | ARCHIVED |
|---|---|---|---|
| Edit name | Yes | Yes | No |
| Edit order | Yes | Yes | No |
| Edit isWon/isLost | Yes | Yes | No |
| Reorder | Yes | Yes | No |
| Inactivate | Yes | No-op / already inactive | No |
| Reactivate | No-op / already active | Yes | No |
| Archive | Yes, if no linked Opportunities/cards | Yes, if no linked Opportunities/cards | No |
| Physical delete | Forbidden | Forbidden | Forbidden |

Additional rules:

- edit operations must not alter historical opportunity links
- reorder must not mutate opportunity history
- archive must be blocked when linked opportunities/cards exist
- inactivate must be allowed even with linked opportunities/cards

---

## 8. Opportunity Protection Matrix

| Scenario | Inactivate | Archive |
|---|---|---|
| With linked Opportunities/cards | Allowed | Blocked |
| Without linked Opportunities/cards | Allowed | Allowed |

Interpretation:

- inactivation is a governance state, not a data removal state
- archive is a removal-from-runtime state and must preserve integrity

---

## 9. Backend Impact

Required backend characteristics for the target architecture:

- schema must expose `isActive` for Stage
- repository must support tenant-scoped lifecycle queries
- service must own lifecycle rules
- routes must expose lifecycle-safe contracts
- permission checks must remain RBAC-driven
- soft delete must remain the archive mechanism

Non-negotiable backend principles:

- backend is source of truth
- tenant isolation must be preserved
- no physical delete
- no hidden lifecycle logic in frontend
- no duplicate governance source

---

## 10. Frontend Impact

Frontend must:

- consume the official lifecycle contract
- render active and inactive stages correctly in Admin
- avoid inventing lifecycle rules locally
- avoid localStorage or store as operational source
- keep error messages aligned with backend response

Frontend must not:

- decide whether a stage can be archived
- decide whether a stage can receive new opportunities
- infer lifecycle state from UI labels alone

---

## 11. Testing Impact

Minimum testing obligations for the target path:

- schema validation for Stage lifecycle fields
- service tests for inactivate/archive rules
- repository tests for lifecycle queries
- route tests for lifecycle payload propagation
- frontend tests for visibility and action wiring
- opportunity protection tests for linked cards/opportunities

Test coverage must prove:

- inactive does not remove operational cards
- archived cannot be used operationally
- linked opportunities block archive, not inactivate

---

## 12. Migration Strategy

Migration must be incremental and backend-first:

1. Introduce Stage lifecycle contract in backend
2. Update repository/service behavior
3. Update HTTP schema and routes
4. Update Admin visibility and actions
5. Validate CRM/new opportunity behavior
6. Harden tests and audit logs

Important:

- no data loss migration
- no physical delete migration
- no frontend-only lifecycle emulation

---

## 13. Explicit Non-Goals

- No implementation in this phase
- No schema change in this phase
- No migration in this phase
- No frontend runtime change in this phase
- No backend runtime change in this phase
- No physical delete
- No duplicate lifecycle source
- No legacy fallback
- No localStorage governance
- No store-owned lifecycle
- No UI-owned business rule

---

## 14. Next Phases

### H15-G.11C — Backend Stage Lifecycle Contract Adjustment

Goal:

- introduce the formal Stage lifecycle contract
- expose `isActive`
- preserve `deletedAt` as archive
- keep tenant-scoped and RBAC-safe behavior

### H15-G.11D — Admin Stage Management

Goal:

- add Admin support for edit, inactivate, reactivate and archive actions
- keep card visibility intact
- surface backend truth in UI

### H15-G.11E — Stage Reorder UX

Goal:

- add reorder interaction where it is actually needed
- preserve stage history and opportunity links
- validate order behavior with the backend contract

---

## 15. Veredito Final

Veredito:

GO WITH RESTRICTIONS

Reason:

- The architecture target is clear and safe only if lifecycle is introduced backend-first.
- Stage currently lacks the formal lifecycle fields and contracts required for Enterprise.
- This document authorizes the design direction, not implementation.

