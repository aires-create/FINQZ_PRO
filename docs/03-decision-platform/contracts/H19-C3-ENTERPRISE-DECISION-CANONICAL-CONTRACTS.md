# H19-C3 - Enterprise Decision Canonical Contracts

## Status
Canonical Draft for H19-C3

## Scope
Este documento define o modelo canônico de contratos do Enterprise Decision Platform (EDP) para servir de base a HTTP APIs, eventos, mensageria, DTOs, integrações e runtime backend futuro, sem acoplar o modelo ao transporte.

## Source of Truth

- [DCA EDP](../DCA-ENTERPRISE-DECISION-PLATFORM-v1.md)
- [ADR Pack](../adrs/ADR-001-ENTERPRISE-DECISION-PLATFORM-DECISIONS.md)
- [ADR-016 Decision Strategy](../adrs/ADR-016-DECISION-STRATEGY.md)
- [Event Catalog](../events/EVENT-CATALOG-v1.md)
- [Canonical Vocabulary](../glossary/CANONICAL-BUSINESS-VOCABULARY-v1.md)
- [Governance Rules](../GOVERNANCE-RULES-v1.md)
- [Readiness Checklist](../IMPLEMENTATION-READINESS-CHECKLIST.md)
- [RR-002](../RR-002-ENTERPRISE-DECISION-PLATFORM-READINESS-REVIEW.md)

## Non-Goals

- nao implementar runtime;
- nao criar endpoint executavel;
- nao criar migration;
- nao criar Prisma schema;
- nao criar frontend adapter;
- nao usar HTTP DTO como fonte primária;
- nao misturar Policy com Strategy;
- nao permitir Decision Core como God Service;
- nao permitir provider governar dominio interno.

---

## 1. Canonical Contract Model

O EDP usa um modelo canônico por dominio, independente do transporte.

### Core Contract Objects

- Decision
- Decision Strategy
- Decision Policy
- Simulation
- Offer
- Ranking
- Recommendation
- Proposal
- Provider Execution
- Operation Candidate
- Workflow
- Audit Timeline
- Decision Explanation

### Canonical Contract Rules

- todo contrato tem owner de dominio;
- todo contrato tem versionamento;
- todo contrato carrega tenant scope;
- todo contrato deve ser auditavel;
- todo contrato deve ser explicavel quando impactar decisao;
- todo contrato que altera estado precisa ser idempotente;
- todo contrato nao pode depender de frontend para significar estado canonico.

---

## 2. Canonical Envelope

### Commands

Campos obrigatorios quando aplicaveis:

- commandId
- correlationId
- causationId
- tenantId
- userId
- actorType
- source
- aggregateId
- aggregateType
- aggregateVersion
- schemaVersion
- idempotencyKey
- timestamp
- metadata
- securityContext
- auditContext

### Queries

Campos obrigatorios quando aplicaveis:

- queryId
- correlationId
- tenantId
- userId
- actorType
- source
- schemaVersion
- timestamp
- metadata
- securityContext
- auditContext

### Events

Campos obrigatorios quando aplicaveis:

- eventId
- correlationId
- causationId
- tenantId
- aggregateId
- aggregateType
- aggregateVersion
- schemaVersion
- timestamp
- metadata
- securityContext
- auditContext
- idempotencyKey when supported by consumer

### Responses

Campos obrigatorios quando aplicaveis:

- responseId
- correlationId
- tenantId
- schemaVersion
- timestamp
- metadata
- securityContext
- auditContext

### Errors

Campos obrigatorios quando aplicaveis:

- errorId
- correlationId
- tenantId
- schemaVersion
- timestamp
- code
- category
- severity
- safeMessage
- internalMessage
- retryable
- userAction
- auditReference
- providerReference when applicable

---

## 3. Canonical Commands

### Command Contract Template

Cada command deve registrar:

- objetivo
- aggregate owner
- payload conceitual
- pre-condicoes
- pos-condicoes
- permissao RBAC
- tenant scope
- idempotencia
- eventos emitidos
- erros esperados
- observabilidade
- audit trail

### Command Inventory

| Command | Aggregate Owner | Objective | Idempotency | Key Events | Common Errors |
|---|---|---|---|---|---|
| CreateSimulation | Simulation Aggregate | Criar uma simulacao canonica | Required | simulation.created | validation, authorization, tenant mismatch |
| UpdateSimulationInput | Simulation Aggregate | Atualizar input de simulacao antes do calculo | Required | simulation.input.updated | validation, conflict, not editable |
| CalculateSimulation | Simulation Aggregate | Executar calculo canonico | Required | simulation.calculation.requested, simulation.calculated | provider unavailable, policy inactive, domain rule violation |
| SelectOffer | Ranking / Decision Aggregate | Selecionar oferta vencedora | Required | simulation.offer.selected, decision.recommended | no eligible offer, policy inactive |
| GenerateProposal | Proposal Aggregate | Gerar proposta versionada | Required | proposal.generated | consent missing, offer invalid, strategy inactive |
| SendProposal | Proposal Aggregate | Enviar proposta por canal seguro | Required | proposal.sent | invalid recipient, link generation failure |
| RevokeProposal | Proposal Aggregate | Revogar proposta | Required | proposal.revoked | already revoked, invalid authority |
| AcceptProposal | Proposal Aggregate | Registrar aceite formal | Required | proposal.accepted | expired, identity mismatch, consent missing |
| RejectProposal | Proposal Aggregate | Registrar recusa formal | Required | proposal.rejected | already finalized |
| ExpireProposal | Proposal Aggregate | Expirar proposta por validade | Required | proposal.expired | already expired |
| RecommendDecision | Decision Aggregate | Gerar recomendacao oficial | Required | decision.recommended | no ranking, no policy, no strategy |
| OverrideDecision | Decision Aggregate | Sobrescrever recomendacao sob autorizacao | Required | decision.overridden | unauthorized, missing approval |
| MaterializeOpportunity | Decision / Opportunity Bridge | Materializar oportunidade apos aceite | Required | operation_candidate.created | acceptance missing, opportunity locked |
| CreateOperationCandidate | Operation Candidate Aggregate | Criar candidato operacional | Required | operation_candidate.created | conflict, validation |
| CreateDecisionPolicy | Decision Policy Aggregate | Criar policy versionada | Required | policy.version.created | duplicate version, tenant mismatch |
| ApproveDecisionPolicy | Decision Policy Aggregate | Aprovar policy | Required | policy.version.approved | unauthorized, invalid version |
| ActivateDecisionPolicy | Decision Policy Aggregate | Ativar policy com vigencia | Required | policy.version.activated | inactive approval, effective date conflict |
| RollbackDecisionPolicy | Decision Policy Aggregate | Reverter policy para versao anterior | Required | policy.version.rollbacked | no rollback target, approval missing |
| CreateDecisionStrategy | Decision Strategy Aggregate | Criar estrategia versionada | Required | strategy.version.created | duplicate version, tenant mismatch |
| ApproveDecisionStrategy | Decision Strategy Aggregate | Aprovar estrategia | Required | strategy.version.approved | unauthorized, invalid version |
| ActivateDecisionStrategy | Decision Strategy Aggregate | Ativar estrategia | Required | strategy.version.activated | approval missing, effective date conflict |
| RollbackDecisionStrategy | Decision Strategy Aggregate | Reverter estrategia | Required | strategy.version.rollbacked | no rollback target, approval missing |
| RegisterProviderCapability | Provider Capability Aggregate | Registrar capability de provider | Required | provider.capability.registered | invalid certification, tenant mismatch |
| DeprecateProviderCapability | Provider Capability Aggregate | Deprecar capability | Required | provider.capability.deprecated | active consumers, invalid authority |

### Command Notes

- Commands que mudam estado canonico sempre devem ser idempotentes.
- Commands de policy e strategy exigem approval state e effective dating.
- Commands de proposta exigem consentimento quando aplicavel.
- Commands de provider exigem contract versioning e certification context.

---

## 4. Canonical Queries

### Query Contract Template

Cada query deve registrar:

- objetivo
- read model esperado
- filtros
- ordenacao
- paginacao
- seguranca
- tenant scope
- cache permitido ou proibido
- campos sensiveis
- observabilidade

### Query Inventory

| Query | Read Model | Purpose | Cache | Sensitive Fields |
|---|---|---|---|---|
| GetSimulation | Simulation Read Model | Recuperar simulacao unica | Allowed with tenant scope | inputs, scores, provider data |
| ListSimulations | Simulation List Read Model | Listar simulacoes | Allowed with short TTL | tenant, user, scores |
| GetOfferRanking | Ranking Read Model | Recuperar ranking de ofertas | Allowed with short TTL | policy, strategy, scores |
| GetRecommendation | Recommendation Read Model | Recuperar recomendacao | Allowed with short TTL | explanation, scores, traces |
| GetDecision | Decision Read Model | Recuperar decisao canonica | Allowed with short TTL | explanation, override data |
| GetDecisionExplanation | Explanation Read Model | Recuperar explicacao detalhada | Restricted | traces, scores, policy, strategy |
| GetProposal | Proposal Read Model | Recuperar proposta | Allowed with short TTL | consent, identity, link data |
| ListProposalsByOpportunity | Proposal List Read Model | Listar propostas por oportunidade | Allowed | tenant, opportunity, status |
| GetProposalTimeline | Timeline Read Model | Recuperar timeline da proposta | Restricted | timeline items, actors |
| GetDecisionTimeline | Timeline Read Model | Recuperar timeline da decisao | Restricted | timeline items, overrides |
| GetProviderCapabilities | Provider Capability Read Model | Listar capabilities | Allowed | provider metadata |
| GetDecisionPolicies | Decision Policy Read Model | Listar policies | Restricted | weights, priorities, approvals |
| GetDecisionStrategies | Decision Strategy Read Model | Listar strategies | Restricted | objectives, approvals |
| GetPolicyVersion | Policy Version Read Model | Recuperar versao de policy | Restricted | policy config |
| GetStrategyVersion | Strategy Version Read Model | Recuperar versao de strategy | Restricted | strategy config |
| GetOperationCandidate | Operation Candidate Read Model | Recuperar candidato operacional | Restricted | operational data |
| GetAuditTimeline | Audit Timeline Read Model | Recuperar trilha de auditoria | Restricted | audit entries, references |

### Query Rules

- cache pode ser proibido quando expor policy, strategy, audit ou consentimento;
- queries com explicacao detalhada devem respeitar mascaramento;
- queries devem carregar tenant scope;
- queries nao criam nem alteram estado.

---

## 5. Canonical Events

### Event Rules

- base obrigatoria no Event Catalog v1;
- nenhum evento novo sem justificativa e registro de divergencia;
- todo evento relevante deve incluir correlationId, tenantId e aggregate context;
- eventos de policy, strategy, proposal e decision precisam ser auditaveis;
- consumers devem tratar idempotencia e versionamento.

### H19-C3 Event Set

- simulation.created
- simulation.input.updated
- simulation.calculation.requested
- simulation.calculated
- simulation.offer.generated
- simulation.offer.selected
- decision.recommended
- decision.overridden
- proposal.generated
- proposal.sent
- proposal.revoked
- proposal.accepted
- proposal.rejected
- proposal.expired
- policy.version.created
- policy.version.approved
- policy.version.activated
- policy.version.rollbacked
- strategy.version.created
- strategy.version.approved
- strategy.version.activated
- strategy.version.rollbacked
- provider.capability.registered
- provider.capability.deprecated
- provider.attempted
- provider.succeeded
- provider.failed
- operation_candidate.created
- audit.event.recorded

### Event Contract Template

Cada evento deve registrar:

- nome
- versao
- aggregate owner
- trigger
- payload conceitual
- correlationId
- causationId
- tenantId
- idempotency
- consumidores previstos
- retencao
- observabilidade
- compatibilidade futura

---

## 6. Canonical Responses

### Response Inventory

- SuccessResponse
- ErrorResponse
- ValidationErrorResponse
- AuthorizationErrorResponse
- ConflictErrorResponse
- IdempotencyReplayResponse
- DomainRuleViolationResponse
- ProviderUnavailableResponse
- PolicyInactiveResponse
- StrategyInactiveResponse
- ProposalExpiredResponse

### Response Rules

- SuccessResponse carrega resultado e metadata de correlacao.
- ErrorResponse nunca expõe dado sensivel.
- ValidationErrorResponse reflete campo e regra violada.
- AuthorizationErrorResponse reflete RBAC e tenant scope.
- ConflictErrorResponse reflete versionamento ou estado.
- IdempotencyReplayResponse confirma replays seguros.
- DomainRuleViolationResponse reflete restricao de dominio.
- ProviderUnavailableResponse sanitiza erro de provider.
- PolicyInactiveResponse e StrategyInactiveResponse informam vigencia e approval state.
- ProposalExpiredResponse informa validade e audit reference.

---

## 7. Canonical Error Model

### Fields

- codigo
- categoria
- severidade
- mensagem segura
- mensagem tecnica interna
- retryable
- userAction
- correlationId
- auditReference
- providerReference when applicable
- politica de exposicao externa

### Error Categories

- validation
- authorization
- conflict
- domain_rule_violation
- policy_inactive
- strategy_inactive
- provider_unavailable
- transient
- unexpected

### Error Rules

- mensagem segura e sempre user-facing;
- mensagem tecnica interna nunca deve vazar crusamente para fora;
- providerReference deve ser sanitizada;
- errors devem ser observaveis e correlacionaveis.

---

## 8. Aggregate Contracts

### 8.1 Simulation Aggregate

- Responsibility: manter o lifecycle canonico de uma simulacao.
- Canonical Fields: simulationId, tenantId, source, input, scenarioSet, status, version, scores, timestamps.
- Invariants: tenant isolation, idempotent create/update/calculate, no calculation after terminal state.
- States: draft, input_updated, calculating, calculated, failed, archived.
- Accepted Commands: CreateSimulation, UpdateSimulationInput, CalculateSimulation.
- Emitted Events: simulation.created, simulation.input.updated, simulation.calculation.requested, simulation.calculated.
- Related Queries: GetSimulation, ListSimulations.
- Limits: nao pertence ranking final, proposta final ou policy.

### 8.2 Decision Aggregate

- Responsibility: registrar recomendacao oficial e override.
- Canonical Fields: decisionId, tenantId, strategyVersion, policyVersion, recommendation, selectedOffer, score, override, explanation.
- Invariants: recomputation must preserve version trace, recommendation cannot be final without policy/strategy, override requires authorization.
- States: drafted, recommended, overridden, finalized, archived.
- Accepted Commands: RecommendDecision, OverrideDecision.
- Emitted Events: decision.recommended, decision.overridden.
- Related Queries: GetDecision, GetDecisionExplanation, GetDecisionTimeline.
- Limits: nao contem policy rules completas nem ranking engine internals.

### 8.3 Decision Policy Aggregate

- Responsibility: versionar e governar policy.
- Canonical Fields: policyId, version, weights, priorities, campaigns, objectives, tieBreakers, effectiveWindow, approvalState, rollbackTarget, tenantId.
- Invariants: version uniqueness per tenant, approval before activation, effective dating respected.
- States: draft, created, approved, active, inactive, rolled_back, archived.
- Accepted Commands: CreateDecisionPolicy, ApproveDecisionPolicy, ActivateDecisionPolicy, RollbackDecisionPolicy.
- Emitted Events: policy.version.created, policy.version.approved, policy.version.activated, policy.version.rollbacked.
- Related Queries: GetDecisionPolicies, GetPolicyVersion.
- Limits: nao executa decisao nem calcula score isolado.

### 8.4 Decision Strategy Aggregate

- Responsibility: versionar e governar estrategia executiva.
- Canonical Fields: strategyId, version, objectives, goalWeights, scope, approvalState, effectiveWindow, tenantId.
- Invariants: version uniqueness per tenant, strategy approval before activation, policy/strategy boundary preserved.
- States: draft, created, approved, active, inactive, rolled_back, archived.
- Accepted Commands: CreateDecisionStrategy, ApproveDecisionStrategy, ActivateDecisionStrategy, RollbackDecisionStrategy.
- Emitted Events: strategy.version.created, strategy.version.approved, strategy.version.activated, strategy.version.rollbacked.
- Related Queries: GetDecisionStrategies, GetStrategyVersion.
- Limits: nao substitui policy nem ranking.

### 8.5 Recommendation Aggregate

- Responsibility: armazenar recomendacao, score e explicacao resumida.
- Canonical Fields: recommendationId, decisionId, globalDecisionScore, scoreBreakdown, selectedOffer, rejectedOffers, explanation.
- Invariants: recommendation references decision and versions.
- States: generated, overridden, accepted_by_proposal, archived.
- Accepted Commands: RecommendDecision.
- Emitted Events: decision.recommended.
- Related Queries: GetRecommendation.
- Limits: nao e aceite, nao e proposta.

### 8.6 Proposal Aggregate

- Responsibility: governar lifecycle de proposta.
- Canonical Fields: proposalId, version, snapshot, validity, revocation, resendCount, consent, identityBinding, secureLink, qrCode, status.
- Invariants: version immutable, snapshot integrity, no silent overwrite, acceptance bound to version.
- States: draft, generated, versioned, sent, viewed, accepted, rejected, revoked, expired, superseded, archived.
- Accepted Commands: GenerateProposal, SendProposal, RevokeProposal, AcceptProposal, RejectProposal, ExpireProposal.
- Emitted Events: proposal.generated, proposal.sent, proposal.revoked, proposal.accepted, proposal.rejected, proposal.expired.
- Related Queries: GetProposal, ListProposalsByOpportunity, GetProposalTimeline.
- Limits: nao e PDF como fonte de verdade.

### 8.7 Provider Capability Aggregate

- Responsibility: governar capability registry.
- Canonical Fields: providerId, capabilityId, version, sandboxStatus, productionStatus, certificationStatus, health, sla, limits, fallbackPolicy.
- Invariants: sandbox and production separated, capability versioned, deprecation controlled.
- States: registered, sandbox_certified, production_certified, healthy, degraded, unhealthy, deprecated, retired.
- Accepted Commands: RegisterProviderCapability, DeprecateProviderCapability.
- Emitted Events: provider.capability.registered, provider.capability.deprecated.
- Related Queries: GetProviderCapabilities.
- Limits: nao governa decisao interna.

### 8.8 Provider Execution Aggregate

- Responsibility: registrar execucao ou tentativa contra provider.
- Canonical Fields: executionId, providerId, capabilityId, requestTrace, responseTrace, status, latency, retryCount.
- Invariants: sanitized traces, no raw sensitive leakage, idempotent attempt tracking.
- States: attempted, succeeded, failed, fallback_used, archived.
- Accepted Commands: derived from simulation or decision execution flow.
- Emitted Events: provider.attempted, provider.succeeded, provider.failed.
- Related Queries: provider trace read models.
- Limits: nao substitui provider capability registry.

### 8.9 Operation Candidate Aggregate

- Responsibility: registrar candidato operacional apos aceite.
- Canonical Fields: candidateId, opportunityId, proposalId, tenantId, status, materializationContext.
- Invariants: no candidate without valid acceptance or authorized path.
- States: created, pending, validated, materialized, cancelled, archived.
- Accepted Commands: CreateOperationCandidate, MaterializeOpportunity.
- Emitted Events: operation_candidate.created.
- Related Queries: GetOperationCandidate.

### 8.10 Audit Timeline Aggregate

- Responsibility: manter trilha auditoria e timeline.
- Canonical Fields: auditId, correlationId, actor, action, target, versionRefs, timestamps, securityContext, retentionPolicy.
- Invariants: immutable log, sanitized content, no sensitive leakage.
- States: recorded, indexed, retained, archived, purged_by_policy.
- Accepted Commands: implicit from every audited action.
- Emitted Events: audit.event.recorded.
- Related Queries: GetAuditTimeline, GetDecisionTimeline, GetProposalTimeline.

---

## 9. Lifecycle Contracts

### 9.1 Simulation Lifecycle

- States: draft -> input_updated -> calculating -> calculated -> archived
- Prohibited: calculated -> draft, archived -> calculating without new simulation
- Idempotency: create, update and calculate must be replay-safe.
- RBAC: simulation author, reviewer, admin.
- Audit: every input change and calculation request recorded.

### 9.2 Decision Lifecycle

- States: drafted -> recommended -> overridden -> finalized -> archived
- Prohibited: finalized -> recommended without new version
- Idempotency: recommendation generation replay-safe.
- RBAC: decision reviewer, manager, admin.
- Audit: explanation and override reference required.

### 9.3 Recommendation Lifecycle

- States: generated -> overridden -> accepted_by_proposal -> archived
- Prohibited: archived -> generated without new decision.
- RBAC: reviewer, manager, admin.
- Audit: score breakdown and rationale required.

### 9.4 Proposal Lifecycle

- States: draft -> generated -> versioned -> sent -> viewed -> accepted/rejected/revoked/expired -> superseded -> archived
- Prohibited: accepted -> draft, revoked -> accepted without new version.
- RBAC: operator, manager, client portal actor, admin.
- Audit: consent, identity and secure link tracked.

### 9.5 Policy Lifecycle

- States: draft -> created -> approved -> active -> inactive -> rolled_back -> archived
- Prohibited: active -> created without rollback or new version.
- RBAC: policy author, approver, admin.
- Audit: approval, activation and rollback required.

### 9.6 Strategy Lifecycle

- States: draft -> created -> approved -> active -> inactive -> rolled_back -> archived
- Prohibited: active -> created without rollback or new version.
- RBAC: strategy author, executive approver, admin.
- Audit: strategy rationale and approval required.

### 9.7 Provider Capability Lifecycle

- States: registered -> sandbox_certified -> production_certified -> healthy -> degraded -> unhealthy -> deprecated -> retired
- Prohibited: production_certified without sandbox certification.
- RBAC: provider admin, platform admin.
- Audit: certification and deprecation events required.

### 9.8 Operation Candidate Lifecycle

- States: created -> validated -> materialized -> completed/cancelled -> archived
- Prohibited: materialized without valid acceptance or authorized path.
- RBAC: operations admin, system actor.
- Audit: materialization trace required.

---

## 10. Decision Explanation Contract

Decision Explanation e obrigatorio desde a primeira versao.

### Required Fields

- globalDecisionScore
- clientScore
- commercialScore
- businessScore
- operationalScore
- providerScore
- complianceScore
- riskScore
- appliedPolicyId
- appliedPolicyVersion
- appliedStrategyId
- appliedStrategyVersion
- evaluatedOffers
- selectedOffer
- rejectedOffers
- exclusionReasons
- scoreBreakdown
- ruleTrace
- providerTrace
- humanOverride, se houver
- summarizedExplanation
- technicalExplanation
- auditReference

### Rules

- toda recomendacao canonica deve ter explicacao;
- a explicacao deve ser dividida em resumo e tecnica;
- providerTrace deve ser sanitizado;
- humanOverride deve ser rastreavel e autorizado;
- explanation contract nao pode depender de UI para ser gerado.

---

## 11. Recommendation Contract Boundary

### Distinctions

- Recommendation: orientacao canonica para o melhor caminho.
- Decision: consolidacao oficial que pode ser recomendada ou sobrescrita.
- Override: substituicao formal e autorizada de recomendacao.
- Acceptance: aceite formal de proposta ou fluxo autorizado.
- Rejection: recusa formal.

### Boundary Rules

- Recommendation pode ser rejeitada.
- Decision pode ser sobrescrita.
- Acceptance pertence a Proposal ou canal autorizado.
- Rejection pertence ao lifecycle da Proposal.
- Override nunca pode ocorrer sem audit trail e permissao.

---

## 12. Policy vs Strategy Contract Boundary

### Belongs to Policy

- weights
- priorities
- campaigns in tactical scope
- tie-breakers
- effective dating
- approval
- rollback
- audit trail
- tenant scope
- configuration governance

### Belongs to Strategy

- business objectives
- conversion goals
- margin goals
- retention goals
- speed goals
- satisfaction goals
- executive campaigns
- optimization profile
- business intent

### Belongs to Ranking

- score decomposition
- ordering of offers
- tie resolution within policy
- explainable comparison
- ranking position analytics

### Belongs to Decision Core

- orchestration
- routing between policy, simulation, ranking and proposal
- state transition control
- event emission coordination

### Never in Frontend

- canonical policy logic
- canonical strategy logic
- final ranking authority
- final proposal acceptance authority

### Never in Provider

- business strategy
- policy governance
- canonical ranking
- final decision ownership

---

## 13. Provider Contract Boundary

- provider nao governa dominio interno;
- provider response precisa ser normalizado;
- provider errors nao vazam crus;
- provider capability precisa ser versionada;
- sandbox e producao permanecem separados;
- rate limit e retry sao governados;
- provider trace deve ser sanitizado;
- provider nao define score nem policy;
- provider nao altera Decision Core.

---

## 14. Security Contract Requirements

- tenant isolation
- RBAC por command/query
- LGPD
- consentimento
- retenção
- anonimização
- descarte seguro
- masking
- encryption when applicable
- logs sem dados sensiveis
- auditContext obrigatorio
- securityContext obrigatorio

### Security Rules

- todo command/query/event relevante carrega tenant scope;
- campos sensiveis sao mascarados ou omitidos conforme perfil;
- consentimento e identity binding sao obrigatorios quando o canal exigir;
- retenção e descarte seguem governanca documental;
- audit reference deve existir para decicoes e propostas.

---

## 15. Observability Contract Requirements

- correlationId obrigatorio
- metrics por command
- metrics por query
- metrics por event
- score drift
- policy performance
- strategy performance
- provider performance
- ranking position conversion
- explanation usage
- human override rate
- fallback by capability
- error rate by domain

### Observability Rules

- commands e queries devem ser correlacionaveis;
- eventos devem carregar contexto de correlacao e causacao;
- métricas devem diferenciar tenant, policy version, strategy version, product e provider;
- explanation usage deve ser medido como signal de compreensao do negocio.

---

## 16. HTTP Mapping Future

Mapeamento conceitual apenas:

- Command -> POST
- Query -> GET
- Event -> async / event bus
- Error -> future HTTP status mapping

Regras:

- HTTP nao e fonte primaria do modelo;
- transporte nao redefine dominio;
- DTOs futuros derivam deste contrato, nao o contrario.

---

## 17. H19-C4 Readiness Criteria

### Required

- contratos aprovados;
- events congelados;
- envelopes congelados;
- aggregates validados;
- lifecycles validados;
- policy/strategy boundary validado;
- proposal/provider boundary validado.

### Optional but Recommended

- sample payloads documentados;
- mapping table for transport adapters;
- security and observability checklist linked to each command and query.

---

## 18. Gaps Identified

### Gaps

- Strategy precisa aparecer de forma consistente em todos os contratos relevantes.
- Alguns contratos ainda precisam de exemplos payload conceptuais detalhados por transport adapter.
- HTTP mapping futuro ainda deve ser desdobrado em RFC ou ADR de transporte quando chegar a hora.
- Provider execution read models podem exigir refinamento adicional antes do runtime.

### Non-Gaps

- Policy vs Strategy boundary esta formalizado.
- Decision Core nao vira God Service.
- Proposal Center tem lifecycle canônico.
- Provider governance esta explicitada.
- Event catalog e vocabulary sustentam o contrato.

---

## 19. Recommendations for H19-C4

- criar adapters de transporte somente apos congelar este contrato;
- usar este documento como base de DTOs e schemas futuramente;
- manter policy e strategy separadas em qualquer runtime posterior;
- garantir que proposal e provider contracts sejam versionados desde o primeiro runtime;
- criar tests contractuais antes de qualquer service implementation;
- manter audit and observability fields obrigatorios em todas as surfaces.

---

## 20. Final Verdict

**GO WITH RESTRICTIONS**

### Justification

O modelo canônico de contratos esta suficientemente definido para iniciar a derivacao de APIs, DTOs, eventos e runtime futuro sem reabrir a arquitetura principal.

As restricoes permanecem:

- nao iniciar skeleton backend antes de contratos aprovados;
- nao acoplar o contrato ao HTTP;
- nao misturar Policy com Strategy;
- nao permitir provider governar dominio;
- nao permitir Decision Core virar God Service.

