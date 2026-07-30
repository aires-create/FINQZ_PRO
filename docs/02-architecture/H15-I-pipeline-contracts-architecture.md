# H15-I — Pipeline Contracts Architecture

Status: DRAFT
Type: Contracts Architecture
Scope: Pipeline / Stage
Date: 2026-06-19

---

## 1. Executive Summary

This document defines the contract architecture required before any Pipeline or Stage write runtime implementation.

It does not authorize implementation.

Pipeline is currently backend-owned for read, but not yet backend-owned for write.

---

## 2. Source Context

This document follows:

- DCA vNext
- AUD-H15-A
- AUD-H15-B
- AUD-H15-C
- H15-D
- AUD-H15-E
- AUD-H15-F
- H15-G
- H15-H

---

## 3. Contract Principles

Future Pipeline and Stage contracts must be:

- backend-owned
- tenant-scoped
- RBAC-enforced
- soft-delete aware
- audit-ready
- event-ready
- deterministic
- compatible with Opportunity pipelineId and stageId
- independent from config/pipelines.ts
- independent from catalogRepository
- independent from localStorage

---

## 4. Pipeline Contract

Required conceptual fields:

- id
- tenantId
- code
- name
- description
- isDefault
- isActive
- stages
- createdAt
- updatedAt
- deletedAt

Rules:

- id must be UUID.
- tenantId is mandatory.
- code must be unique per tenant.
- deleted pipelines must not be returned in normal reads.
- inactive pipelines must not be used for new opportunities.
- Pipeline must not depend on Product, Subproduct, Modality or Coverage.

---

## 5. Stage Contract

Required conceptual fields:

- id
- tenantId
- pipelineId
- code
- name
- order
- isWon
- isLost
- isActive
- createdAt
- updatedAt
- deletedAt

Rules:

- id must be UUID.
- tenantId is mandatory.
- pipelineId must belong to the same tenant.
- code must be unique within a pipeline.
- order must be deterministic.
- isWon and isLost must not both be true.
- Stage must not be inferred from frontend labels.

---

## 6. Repository Contracts

Future repository contracts must support:

Pipeline:

- listActiveByTenant
- findById
- create
- update
- softDelete

Stage:

- listByPipeline
- findById
- create
- update
- softDelete
- reorder

Rules:

- every method must require tenantId.
- repository must not perform RBAC decisions.
- repository must enforce deletedAt filters.
- repository must be transaction-ready.
- repository must not access frontend config.

---

## 7. Service Contracts

Future service contracts must support:

Pipeline:

- listActive
- createPipeline
- updatePipeline
- deactivatePipeline

Stage:

- createStage
- updateStage
- deactivateStage
- reorderStages

Rules:

- service owns business validation.
- service validates tenant ownership.
- service validates default pipeline invariants.
- service validates stage ordering.
- service validates won/lost invariants.
- service must be audit-ready.
- service must be event-ready.
- service must not depend on frontend localStorage or config.

---

## 8. Write DTOs

Future DTOs required:

- CreatePipelineDTO
- UpdatePipelineDTO
- CreateStageDTO
- UpdateStageDTO
- ReorderStagesDTO

Required properties:

CreatePipelineDTO:

- code
- name
- description
- isDefault
- isActive

UpdatePipelineDTO:

- name
- description
- isDefault
- isActive

CreateStageDTO:

- pipelineId
- code
- name
- order
- isWon
- isLost
- isActive

UpdateStageDTO:

- name
- order
- isWon
- isLost
- isActive

ReorderStagesDTO:

- pipelineId
- stages with stageId and order

---

## 9. RBAC Matrix

| Action | Permission |
|---|---|
| List pipelines | pipeline:read |
| Create pipeline | pipeline:create |
| Update pipeline | pipeline:update |
| Deactivate pipeline | pipeline:delete |
| Create stage | stage:create |
| Update stage | stage:update |
| Deactivate stage | stage:delete |
| Reorder stages | stage:update |

Rules:

- read access must not imply write access.
- backend must enforce permissions regardless of frontend visibility.
- future frontend must hide write actions without permission.

---

## 10. Future API Surface

Conceptual future endpoints only:

- GET /api/v1/pipelines
- POST /api/v1/pipelines
- PUT /api/v1/pipelines/:pipelineId
- DELETE /api/v1/pipelines/:pipelineId
- GET /api/v1/pipelines/:pipelineId/stages
- POST /api/v1/pipelines/:pipelineId/stages
- PUT /api/v1/stages/:stageId
- DELETE /api/v1/stages/:stageId
- PATCH /api/v1/pipelines/:pipelineId/stages/reorder

This section does not authorize runtime implementation.

---

## 11. Audit and Event Readiness

Future runtime should be prepared to emit evidence for:

- pipeline created
- pipeline updated
- pipeline deactivated
- stage created
- stage updated
- stage deactivated
- stages reordered

Minimum metadata:

- tenantId
- actorUserId
- requestId
- reason
- before
- after

---

## 12. Migration Constraints

Do not start runtime implementation until:

- contracts are reviewed
- DTOs are reviewed
- RBAC matrix is approved
- write invariants are approved
- stage deletion behavior is approved
- Opportunity usage constraints are approved

---

## 13. Explicit NO-GO

Do not:

- create Pipeline write endpoints without contracts
- create Stage write endpoints without contracts
- migrate admin/Pipelines.tsx before backend write ownership
- remove catalogRepository before frontend read migration
- remove config/pipelines.ts before fallback removal
- remove Product to Pipeline heuristics before Opportunity read path is clean
- use frontend labels as canonical stage identifiers
- infer pipeline from product in backend

---

## 14. Final Verdict

H15-I defines the required contract layer for future Pipeline backend write ownership.

It authorizes architecture only.

It does not authorize implementation.

Final status:

APPROVED FOR REVIEW
