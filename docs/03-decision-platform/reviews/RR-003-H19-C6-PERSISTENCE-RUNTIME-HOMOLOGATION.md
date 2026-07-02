# RR-003 - H19-C6 - Persistence Runtime Homologation

## Status
HOMOLOGATED IN HML

## Executive Summary
A fase H19-C6 - Persistence Runtime foi homologada em HML com o pacote de persistencia do EDP validado de ponta a ponta, sem alteracao funcional no frontend e com preservacao integral dos contratos canonicos, DCA, ADRs e Event Catalog.

## 1. Identification of the Phase
- Phase: H19-C6
- Name: Persistence Runtime
- Environment: HML
- Repository branch: `homologation/bootstrap-vps`
- Decision: GO

## 2. Homologation Objective
Validar e formalizar o encerramento da H19-C6 como runtime persistente homologado em HML, cobrindo persistencia Prisma, Event Store, Outbox, Idempotency, Audit Timeline e versionamento de Policy/Strategy.

## 3. Homologated Technical Scope
- Persistencia relacional via Prisma e PostgreSQL real.
- Runtime de repositorios EDP com adapters Prisma.
- Event Store transacional.
- Outbox de emissao assíncrona.
- Idempotency store.
- Audit Timeline persistente.
- Persistencia de versoes de Decision Policy e Decision Strategy.
- Health check e operacao da API em HML.

## 4. Prisma Models Involved
Os modelos Prisma homologados para esta fase sao:
- `EdpDecision` -> `edp_decisions`
- `EdpDecisionPolicy` -> `edp_decision_policies`
- `EdpDecisionStrategy` -> `edp_decision_strategies`
- `EdpSimulation` -> `edp_simulations`
- `EdpRecommendation` -> `edp_recommendations`
- `EdpProposal` -> `edp_proposals`
- `EdpProviderCapability` -> `edp_provider_capabilities`
- `EdpProviderExecution` -> `edp_provider_executions`
- `EdpOperationCandidate` -> `edp_operation_candidates`
- `EdpAuditTimelineEvent` -> `edp_audit_timeline_events`
- `EdpEventStore` -> `edp_event_store`
- `EdpOutboxMessage` -> `edp_outbox_messages`
- `EdpIdempotencyRecord` -> `edp_idempotency_records`
- `EdpCorrelationRecord` -> `edp_correlation_records`

## 5. Applied Migration
- Migration applied: `backend/prisma/migrations/20260701000000_h19_c6_edp_persistence_runtime/migration.sql`
- Result: PostgreSQL schema updated with the EDP persistence tables, unique constraints, indexes and tenant foreign keys required by H19-C6.

## 6. Prisma Repository Adapters
The Prisma repository registry used by the runtime is:
- `DecisionRepository`
- `SimulationRepository`
- `DecisionPolicyRepository`
- `DecisionStrategyRepository`
- `ProposalRepository`
- `RecommendationRepository`
- `ProviderCapabilityRepository`
- `ProviderExecutionRepository`
- `OperationCandidateRepository`
- `AuditTimelineRepository`
- `EventStoreRepository`
- `OutboxRepository`
- `IdempotencyRepository`
- `CorrelationRepository`

These adapters are exposed through `createPrismaEdpRepositoryRegistry(...)` and map the domain contracts to Prisma persistence.

## 7. Event Store
- Persistence target: `EdpEventStore` / `edp_event_store`
- Responsibility: persist canonical EDP events with tenant, aggregate, correlation and causation context.
- Contract preserved: append and read-by-aggregate semantics.
- Homologation result: OK on PostgreSQL real during the H19-C6 validation pack.

## 8. Outbox
- Persistence target: `EdpOutboxMessage` / `edp_outbox_messages`
- Responsibility: queue side effects for reliable post-commit dispatch.
- Status lifecycle supported: `PENDING`, `PROCESSING`, `PROCESSED`, `FAILED`.
- Homologation result: OK in the persistence runtime pack.

## 9. Idempotency
- Persistence target: `EdpIdempotencyRecord` / `edp_idempotency_records`
- Responsibility: prevent duplicate command execution and preserve replay safety.
- Keyed by tenant plus idempotency key with persisted response snapshot support.
- Homologation result: OK in the persistence runtime pack.

## 10. Audit Timeline
- Persistence target: `EdpAuditTimelineEvent` / `edp_audit_timeline_events`
- Responsibility: maintain the canonical audit trail for auditable activity.
- Scope preserved: tenant, aggregate, correlation, actor, action, timestamp and payload.
- Homologation result: OK in the persistence runtime pack.

## 11. Policy/Strategy Version Persistence
- Persistence targets:
  - `EdpDecisionPolicy` / `edp_decision_policies`
  - `EdpDecisionStrategy` / `edp_decision_strategies`
- Supported lifecycle data:
  - version
  - status
  - effectiveFrom
  - effectiveTo
  - approvedBy
  - approvedAt
  - rollbackOf
  - configSnapshot
  - audit
- Homologation result: version persistence validated for both Policy and Strategy.

## 12. Tests Executed
Evidence package reported for H19-C6:
- Docker build executed.
- `Prisma validate` OK.
- `Prisma generate` OK.
- `Prisma migrate deploy` OK.
- Unit tests EDP OK.
- Persistence tests EDP OK.
- Real Prisma/PostgreSQL test OK with 5 tests approved.

## 13. Evidence of Real PostgreSQL
- Real PostgreSQL execution completed successfully.
- Result reported: 5 tests approved against the live Prisma/PostgreSQL stack.
- Conclusion: persistence runtime is not only structurally valid, but also operationally validated in HML.

## 14. Evidence of Health Check
- API restarted in HML.
- Health check OK at `http://localhost:4000/health`.

## 15. Frontend Confirmation
- No functional frontend change was introduced by this phase.
- The H19-C6 work remained backend/persistence only.

## 16. Preservation of DCA, ADRs, Event Catalog and Canonical Contracts
- DCA preserved.
- ADRs preserved.
- Event Catalog preserved.
- Canonical contracts preserved.
- No contract drift was introduced by the H19-C6 homologation pack.

## 17. Residual Risks
- Operational risk remains limited to normal production-like concerns such as PostgreSQL throughput, retention sizing and observability coverage over time.
- Future phase hardening may still require load and recovery validation at higher scale.
- No blocking architectural risk was identified in the homologated scope.

## 18. Recommended Next Phase
- Recommended next phase: H20
- Rationale: the roadmap already defines H20 as the consolidation of EDP operations, decision governance, variation coverage and compliance hardening.

## 19. Final Opinion
H19-C6 - Persistence Runtime completed the expected persistence baseline for the EDP in HML, with the Prisma/PostgreSQL runtime validated, the canonical contracts preserved and no frontend impact.

**Final decision: GO**

