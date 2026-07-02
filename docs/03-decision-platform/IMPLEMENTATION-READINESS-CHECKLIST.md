# Implementation Readiness Checklist

## Status
Canonical

## Purpose
Checklist obrigatorio antes da H19-C3.

## Checklist

### Documentation
- [ ] DCA EDP atualizado
- [ ] ADRs publicados
- [ ] Event catalog congelado
- [ ] Canonical vocabulary publicado
- [ ] Governance rules publicadas
- [ ] Roadmap sincronizado

### ADR
- [ ] ADR-001 Decision Core
- [ ] ADR-002 Decision Policy
- [ ] ADR-003 Simulation
- [ ] ADR-004 Proposal Center
- [ ] ADR-005 Provider Operations
- [ ] ADR-006 Frontend source of truth
- [ ] ADR-007 Explainable score
- [ ] ADR-008 Domain events
- [ ] ADR-009 Security and LGPD
- [ ] ADR-010 Observability
- [ ] ADR-011 EDP first-level domain
- [ ] ADR-012 Legacy simulator
- [ ] ADR-013 Contracts before runtime
- [ ] ADR-014 Policy/config management
- [ ] ADR-015 AI support only
- [ ] ADR-016 Decision Strategy

### Governance
- [ ] Precedencia documental definida
- [ ] RR-001 concluida
- [ ] RR-002 concluida
- [x] RR-003 homologada em HML
- [ ] Conflict rules publicadas
- [ ] Change control definido

### Events
- [ ] simulation.*
- [ ] proposal.*
- [ ] decision.*
- [ ] policy.*
- [ ] strategy.*
- [ ] provider.*
- [ ] operation.*
- [ ] workflow.*
- [ ] audit.*
- [ ] audit.event.recorded
- [ ] analytics.*

### Vocabulary
- [ ] Decision
- [ ] Decision Strategy
- [ ] Decision Policy
- [ ] Audit Center
- [ ] Audit Timeline
- [ ] Simulation
- [ ] Proposal
- [ ] Offer
- [ ] Ranking
- [ ] Recommendation
- [ ] Opportunity
- [ ] Operation
- [ ] Provider
- [ ] Capability
- [ ] Materialization
- [ ] Workflow
- [ ] Override
- [ ] Acceptance
- [ ] Rejection
- [ ] Lifecycle
- [ ] Score
- [ ] Decision Score
- [ ] Client Score
- [ ] Business Score
- [ ] Commercial Score
- [ ] Operational Score
- [ ] Compliance Score
- [ ] Risk Score

### Security
- [ ] LGPD
- [ ] RBAC
- [ ] Tenant isolation
- [ ] Consent
- [ ] Retention
- [ ] Anonymization
- [ ] Secure disposal
- [ ] Masking
- [ ] Encryption when applicable
- [ ] Snapshot integrity
- [ ] Event integrity
- [ ] Logs without sensitive data

### Observability
- [ ] Score drift
- [ ] Performance by policy version
- [ ] Performance by tenant
- [ ] Performance by product
- [ ] Performance by provider
- [ ] Fallback by capability
- [ ] Use of explanation
- [ ] Human override rate
- [ ] Acceptance rate
- [ ] Rejection rate
- [ ] Conversion by ranking position

### Policy
- [ ] Weights defined
- [ ] Priorities defined
- [ ] Campaigns defined
- [ ] Objectives defined
- [ ] Tie-breakers defined
- [ ] Effective dating defined
- [ ] Approval flow defined
- [ ] Rollback flow defined
- [ ] Tenant scope defined

### Strategy
- [ ] Strategy domain explicit
- [ ] Strategy versioning defined
- [ ] Strategy approval defined
- [ ] Strategy rollback defined
- [ ] Strategy and policy distinction clear

### Proposal
- [ ] Proposal lifecycle defined
- [ ] Versioning defined
- [ ] Snapshot defined
- [ ] Validity defined
- [ ] Revocation defined
- [ ] Resend defined
- [ ] Acceptance and rejection defined
- [ ] Consent and identity binding defined
- [ ] Secure link defined
- [ ] QR Code defined

### Provider
- [ ] Capability registry
- [ ] Sandbox
- [ ] Production
- [ ] Certification
- [ ] Rate limit
- [ ] Retry
- [ ] Timeout
- [ ] Fallback
- [ ] Deprecation
- [ ] Contract versioning
- [ ] Health
- [ ] SLA
- [ ] Observability

### Workflow
- [ ] States defined
- [ ] Transitions defined
- [ ] Timeouts defined
- [ ] Retries defined
- [ ] Recovery defined

### Analytics
- [ ] Decision KPIs defined
- [ ] Provider KPIs defined
- [ ] Policy KPIs defined
- [ ] Strategy KPIs defined
- [ ] Conversion KPIs defined

### IA
- [ ] Assistant mode
- [ ] Explanation mode
- [ ] Recommendation mode
- [ ] Inconsistency detection mode
- [ ] Guardrails defined
