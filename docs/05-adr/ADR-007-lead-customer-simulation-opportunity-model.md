# ADR-007 — Lead, Customer, Simulation and Opportunity Model

Status: APPROVED
Date: 2026-06-03
Owner: Architecture
Decision Type: Domain Architecture
Project: FINQZ PRO

---

## Context

O FINQZ PRO possui múltiplas portas de entrada comerciais e operacionais.

A plataforma não pode assumir que todo relacionamento comercial começa obrigatoriamente em um Lead, pois existirão cenários como:

* tráfego pago;
* landing pages;
* redes sociais;
* WhatsApp;
* parceiros comerciais;
* canal direto;
* canal indireto;
* importação de base fria;
* importação de carteira;
* cadastro manual;
* simulação independente.

Também não pode assumir que toda simulação exige um Cliente ou uma Opportunity previamente criada.

A arquitetura anterior baseada em CRM genérico, onde o fluxo principal era `Lead → Customer → Opportunity → BankProposal`, não representa mais integralmente o modelo oficial do FINQZ PRO.

---

## Decision

O FINQZ PRO adota oficialmente o seguinte modelo conceitual:

```text
Lead = aquisição e prospecção
Customer = identidade oficial
Simulation = cálculo e viabilidade
Opportunity = unidade operacional central
```

---

## Official Definitions

### Lead

Lead é uma entidade de aquisição, prospecção e qualificação comercial.

Responsabilidades:

* registrar origem do contato;
* registrar canal de aquisição;
* registrar campanha;
* registrar UTM e dados de marketing;
* registrar parceiro originador;
* apoiar pré-venda;
* apoiar score e qualificação.

Exemplos de origem:

* tráfego pago;
* landing page;
* redes sociais;
* WhatsApp;
* indicação;
* parceiro comercial;
* campanha.

Lead não é a entidade central do sistema.

Lead não é a fonte oficial de identidade.

Lead pode originar um Customer, mas nem todo Customer nasce de um Lead.

---

### Customer

Customer é a entidade oficial de identidade e cadastro.

Responsabilidades:

* CPF;
* CNPJ;
* dados cadastrais;
* dados de contato;
* histórico de relacionamento;
* consentimentos;
* conformidade LGPD.

Customer é a fonte oficial de verdade para pessoas e empresas atendidas pelo FINQZ PRO.

Customers podem ser criados por:

* conversão de Lead;
* importação de base fria;
* importação de carteira;
* integração externa;
* cadastro manual.

---

### Simulation

Simulation é uma entidade independente de cálculo, elegibilidade e viabilidade comercial.

Responsabilidades:

* executar cálculos financeiros;
* comparar condições comerciais;
* avaliar elegibilidade;
* apoiar pré-análise comercial;
* apoiar conversão em Customer ou Opportunity.

Simulation pode existir sem:

* Lead;
* Customer;
* Opportunity.

Simulation pode posteriormente originar:

* Lead;
* Customer;
* Opportunity.

Essa conversão deve ocorrer por ação explícita e rastreável.

---

### Opportunity

Opportunity é a unidade operacional central do FINQZ PRO.

Responsabilidades:

* representar um negócio específico;
* conectar Customer, Partner, Commercial Structure, Commercial Table, Provider, Pipeline, Simulation, Operation e Commission;
* organizar o fluxo comercial e operacional;
* preservar origem e rastreabilidade.

Um Customer pode possuir múltiplas Opportunities.

Cada Opportunity representa uma intenção comercial ou operação específica.

Exemplos:

* FGTS;
* Consignado;
* Cartão Benefício;
* Empréstimo com Garantia;
* Refinanciamento;
* Portabilidade;
* Saque Aniversário.

Uma Opportunity pode referenciar opcionalmente:

* `leadId`;
* `customerId`;
* `simulationId`.

Essas referências existem para rastreabilidade, e não para transformar Lead ou Simulation em entidades centrais.

---

## Official Rules

1. Lead é entidade de aquisição.
2. Customer é entidade oficial de identidade.
3. Simulation é entidade independente de cálculo.
4. Opportunity é entidade operacional central.
5. Nem todo Customer nasce de Lead.
6. Nem toda Simulation exige Customer.
7. Nem toda Simulation exige Opportunity.
8. Um Customer pode possuir múltiplas Opportunities.
9. Uma Opportunity pode manter referência ao Lead de origem.
10. Uma Opportunity pode manter referência à Simulation de origem.
11. A criação de Customer a partir de Lead deve ser explícita e auditável.
12. A criação de Opportunity a partir de Simulation deve ser explícita e auditável.
13. A rastreabilidade de origem deve ser preservada para métricas de aquisição, parceiros, campanhas, CAC, ROI e auditoria.
14. Lead não substitui Customer.
15. Simulation não substitui Opportunity.
16. Pipeline não substitui Opportunity.
17. Provider não substitui Commercial Structure.
18. Commercial Table não substitui Commercial Structure.

---

## Supported Flows

### Digital acquisition flow

```text
Traffic / Landing Page / Social / WhatsApp
→ Lead
→ Qualification
→ Customer
→ Opportunity
```

---

### Partner acquisition flow

```text
Partner / Franqueado / Comercial
→ Lead
→ Qualification
→ Customer
→ Opportunity
```

---

### Cold base import flow

```text
Imported base
→ Customer
→ Opportunity
```

---

### Manual customer creation flow

```text
Manual registration
→ Customer
→ Opportunity
```

---

### Independent simulation flow

```text
Simulation
→ Optional Customer
→ Optional Opportunity
```

---

### Multi-opportunity customer flow

```text
Customer CPF/CNPJ
├── Opportunity A: FGTS
├── Opportunity B: Consignado
├── Opportunity C: Empréstimo com Garantia
└── Opportunity D: Cartão Benefício
```

---

## Authorization and Ownership

All Lead, Customer, Simulation and Opportunity operations must preserve:

* `tenantId`;
* `partnerId` when applicable;
* `ownerId` when applicable;
* `createdById`;
* origin metadata when applicable.

Authorization must respect the official evaluation order:

```text
Tenant Scope
→ Partner Scope
→ Ownership Scope
→ Permission Check
```

A valid permission does not imply visibility if scope validation fails.

---

## Events

The following events should be supported by the domain model:

* `LeadCreated`
* `LeadQualified`
* `LeadConverted`
* `CustomerCreated`
* `CustomerImported`
* `SimulationCreated`
* `SimulationExecuted`
* `SimulationConvertedToCustomer`
* `SimulationConvertedToOpportunity`
* `OpportunityCreated`
* `OpportunityUpdated`
* `OpportunityMoved`
* `OpportunityArchived`

Simulation events may contain optional:

* `customerId`;
* `opportunityId`;
* `leadId`.

Customer events may contain optional:

* `convertedFromLeadId`;
* `originSimulationId`;
* `importBatchId`.

Opportunity events may contain optional:

* `leadId`;
* `customerId`;
* `simulationId`.

---

## Consequences

### Positive

* Supports digital acquisition.
* Supports partner acquisition.
* Supports imported cold bases.
* Supports manual customer registration.
* Supports independent simulation.
* Supports multiple opportunities per customer.
* Preserves acquisition traceability.
* Avoids forcing every operation to start from Lead.
* Avoids forcing every simulation to require Customer.
* Aligns with FINQZ PRO enterprise architecture.

### Trade-offs

* Requires clear conversion flows.
* Requires explicit event payloads.
* Requires frontend flows for independent simulation.
* Requires RBAC permissions for simulation independent from customer and opportunity.
* Requires careful API contracts for optional references.

---

## Required Documentation Updates

This ADR requires refinement of:

* `ARCH-003-DOMAINS_OVERVIEW_DRAFT.md`
* `ARCH-004-ENTITIES_MODEL_REVIEW_REQUIRED.md`
* `ARCH-005-RELATIONSHIPS_REVIEW_REQUIRED.md`
* `ARCH-008-OPERATIONAL_EVENTS_REVIEW_REQUIRED.md`
* `ARCH-009-RBAC_REVIEW_REQUIRED.md`
* `ARCH-015-FRONTEND_DOMAIN_MAP_REVIEW_REQUIRED.md`

---

## Non-Goals

This ADR does not authorize:

* schema changes;
* backend refactoring;
* frontend refactoring;
* seed changes;
* migration creation;
* API contract changes;
* deletion of Lead;
* deletion of Customer;
* deletion of Simulation;
* deletion of Opportunity.

Any implementation change must be planned separately and validated against this ADR.

---

## References

* ARCH-003 — Domains Overview
* ADR-004 — Commercial Master Catalog
* ADR-006 — Products Domain Decommission
* RUN-001 — Runtime Governance
* PROJECT_CONTROL_CENTER
