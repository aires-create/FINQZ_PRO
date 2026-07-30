# ARCH-020 - Operation Materialization Blueprint

Status: Proposed
Date: 2026-06-11
Owner: Architecture
Type: Architectural Blueprint
Project: FINQZ PRO

---

## 1. Objetivo

Transformar `ADR-009` em um blueprint executável de materializacao de `Operation`, definindo o contrato arquitetural minimo para que o agregado financeiro e de execucao possa ser implementado de forma consistente, auditavel e compatível com o Opportunity Workspace.

Este documento não altera schema, Prisma, backend ou frontend. Ele define o formato alvo da materialização.

Base oficial:

- `ADR-007` - Lead, Customer, Simulation and Opportunity Model
- `ADR-008` - Revenue Distribution Engine
- `ADR-009` - Operation Persistence and Financial Execution Aggregate
- `ARCH-016` - Opportunity Workspace Blueprint
- `ARCH-017` - Workspace Ownership Matrix
- `ARCH-018` - Domain Boundary Matrix
- `ARCH-019` - Workspace State Machine
- `RFC-001` - Proposal Canonicalization

---

## 2. Responsabilidade

`Operation` é o agregado financeiro e de execução oficial do FINQZ PRO.

Sua responsabilidade primaria e representar a realização efetiva de um negócio financeiro originado a partir de uma `Opportunity`, com rastreabilidade suficiente para suportar:

- execução financeira;
- aprovação de proposta;
- cálculo e liberação de comissão;
- settlement / pagamento;
- auditoria operacional e financeira;
- integração com providers.

### Nao responsavel por

- identidade oficial do cliente;
- prospeccao e aquisição;
- cálculo de simulação;
- composição de proposta;
- ownership da comissão;
- armazenamento de documentos como fonte de verdade;
- substituição da Opportunity.

---

## 3. Cardinalidade

### Relações principais

- `Customer` 1:N `Opportunity`
- `Opportunity` 1:N `Operation`
- `Proposal` 1:N `Operation` ou `Proposal` 1:1 `Operation`, conforme o fluxo de negócio adotado
- `Operation` 1:N `Commission` ou `Operation` 1:1 `Commission`, conforme regra de distribuição
- `Commission` 1:N `Settlement` ou `Commission` 1:1 `Settlement`, conforme modelo de pagamento

### Regra arquitetural

O contrato canônico mínimo deve assumir:

- uma `Operation` pertence a uma única `Opportunity`;
- uma `Operation` pode derivar de uma única `Proposal` canônica;
- uma `Operation` é a origem canônica do resultado financeiro;
- uma `Operation` pode produzir múltiplos eventos ao longo do lifecycle.

### Observação

A cardinalidade exata entre `Operation`, `Commission` e `Settlement` pode variar por regra de negócio, mas a semântica canônica não pode ser invertida.

---

## 4. Relacionamentos

### Relacionamentos obrigatórios

- `tenantId` para isolamento multi-tenant;
- `opportunityId` como origem comercial;
- `customerId` como contexto de identidade quando aplicável;
- `proposalId` ou referência equivalente para rastreio da proposta canônica;
- `providerId` como origem de integração ou capacidade operacional;
- `createdById` como rastreabilidade de autoria;
- `partnerId` quando houver escopo comercial ou financeiro por partner.

### Relacionamentos condicionais

- `simulationId` quando a operação derivar de cálculo formal;
- `commissionId` quando a comissão for modelada como entidade separada e vinculada;
- `settlementId` quando o modelo exigir referência direta ao pagamento final;
- `documents` ou anexos apenas como evidência, não como origem.

### Dependências permitidas

- `Opportunity`
- `Proposal`
- `Provider`
- `Commission`
- `Settlement`
- `Customer` como contexto
- `Audit`
- `RBAC`
- `Multi-tenant`

---

## 5. Campos obrigatórios

Os campos obrigatórios de `Operation` devem representar identidade, origem, estado e rastreabilidade.

### Núcleo mínimo

- `id`
- `tenantId`
- `operationNumber`
- `status`
- `opportunityId`
- `customerId`
- `proposalId`
- `providerId`
- `createdById`
- `createdAt`
- `updatedAt`

### Campos de execução

- `executedAt` quando já executada
- `referenceDate` ou data de referência operacional
- `amount` ou valor principal da operação
- `product` ou identificador do produto / linha de negócio

### Regra

Nenhuma operação deve ser considerada canonica sem:

- tenant válido;
- vínculo com opportunity;
- vínculo com proposal ou equivalente;
- autoria rastreável;
- status explícito.

---

## 6. Campos opcionais

Os campos opcionais são aqueles que aumentam expressividade operacional sem serem obrigatórios no núcleo mínimo.

- `leadId`
- `simulationId`
- `partnerId`
- `bankAccountId`
- `providerOperationId`
- `externalReference`
- `metadata`
- `notes`
- `executedAmount`
- `grossAmount`
- `netAmount`
- `expectedSettlementAt`
- `settledAt`
- `errorCode`
- `errorMessage`
- `correlationId`

### Regra

Campos opcionais não podem substituir os obrigatórios nem alterar a fonte de verdade do agregado.

---

## 7. Lifecycle

O lifecycle oficial de `Operation` deve preservar a lógica descrita em `ADR-009`, com granularidade suficiente para materialização.

### Lifecycle canônico

```text
created
proposal_requested
proposal_received
proposal_approved
executed
commission_calculated
settlement_pending
settled
```

### Estados terminais ou de falha

```text
rejected
failed
canceled
```

### Regras

- `created` marca a abertura da operação;
- `proposal_requested` representa solicitação formal ao provider ou fluxo relacionado;
- `proposal_received` representa retorno validado;
- `proposal_approved` representa aceite interno ou automação autorizada;
- `executed` marca o início da execução financeira real;
- `commission_calculated` indica base elegível para distribuição;
- `settlement_pending` indica aguardando liquidação;
- `settled` indica encerramento financeiro;
- `failed` representa falha material;
- `canceled` representa encerramento voluntário ou administrativo;
- `rejected` representa reprovação de proposta ou incapacidade de seguir.

---

## 8. Eventos

Os eventos de `Operation` devem ser a linguagem oficial de transição do agregado.

### Eventos produzidos

- `OperationCreated`
- `OperationProposalRequested`
- `OperationProposalReceived`
- `OperationProposalApproved`
- `OperationProposalRejected`
- `OperationExecuted`
- `OperationFailed`
- `CommissionCalculated`
- `CommissionReleased`
- `CommissionPaid`
- `SettlementRequested`
- `SettlementConfirmed`
- `SettlementFailed`

### Eventos consumidos

- `OpportunityCreated`
- `OpportunityUpdated`
- `ProposalApproved`
- `SimulationExecuted`
- `CommissionReleased`
- `SettlementRequested`
- eventos de provider

### Regras

- os eventos devem refletir mudança real de estado;
- os eventos não substituem validação de negócio;
- `OperationExecuted` é o gatilho central para comissionamento;
- `CommissionCalculated` não deve ocorrer sem operação elegível;
- `SettlementConfirmed` não deve ocorrer sem base financeira validada.

---

## 9. Auditoria

Toda operação deve ser totalmente auditável.

### Conteúdo mínimo de auditoria

- `tenantId`
- `actorId`
- `actorType`
- `operationId`
- `opportunityId`
- `proposalId`
- `providerId`
- `previousState`
- `nextState`
- `action`
- `timestamp`
- `correlationId` ou `traceId`
- `payloadSummary`

### Regras

- a auditoria deve ser imutável;
- transições críticas devem registrar origem e destino;
- falhas e reversões devem ser auditadas;
- eventos e audit log devem ser correlacionáveis, mas não equivalentes;
- o workspace não pode exibir estado operacional sem contexto auditável quando houver permissão para auditabilidade.

---

## 10. Multi-tenant

`Operation` é inerentemente multi-tenant.

### Regras

- toda operação deve carregar `tenantId`;
- toda leitura e escrita devem respeitar o tenant ativo;
- nenhum agregador pode misturar operações entre tenants;
- eventos devem propagar o tenant de origem;
- projections e read models devem ser segregados por tenant.

### Partner scope

Quando aplicável, `partnerId` deve limitar visibilidade, escrita e análise financeira.

---

## 11. RBAC

`Operation` deve obedecer RBAC em leitura e escrita.

### Regras

- usuários comerciais podem visualizar contexto e avanço de status autorizado;
- usuários operacionais podem aprovar ou executar fluxos permitidos;
- usuários financeiros podem consultar comissão e settlement;
- compliance pode consultar auditoria e bloquear fluxo;
- AI Copilot não pode alterar `Operation` sem confirmação humana em etapas críticas.

### Princípio

O controle de acesso deve ser aplicado tanto ao estado quanto à transição.

---

## 12. Read Models

`Operation` deve alimentar read models específicos para o Opportunity Workspace e para a camada operacional do backend.

### Read models recomendados

- `OperationSummary`
- `OperationTimeline`
- `OperationFinancialStatus`
- `OperationSettlementStatus`
- `OperationCommissionView`
- `OperationExecutionView`

### Regras

- read model não é source of truth;
- read model pode agregar dados de oportunidade, proposta, comissão e settlement;
- read model deve ser reconstruível a partir do agregado e eventos;
- view de workspace não pode se tornar verdade concorrente.

---

## 13. Compatibilidade com Opportunity

`Operation` deve coexistir com `Opportunity` sem competir com ela.

### Regra oficial

- `Opportunity` é a raiz operacional/comercial;
- `Operation` é a raiz financeira/executiva;
- uma `Opportunity` pode ter múltiplas `Operation`;
- a `Opportunity` preserva origem, contexto e pipeline;
- a `Operation` preserva execução, resultado e fechamento financeiro.

### Risco a evitar

Não transformar `Opportunity` em proxy de execução financeira.

---

## 14. Compatibilidade com Proposal

`Operation` deve consumir a `Proposal` canônica, descrita na RFC-001, sem alterar sua semântica.

### Regra oficial

- `Proposal` antecede `Operation`;
- `Proposal` é artefato de negociação e formalização;
- `Proposal` não substitui `Operation`;
- `Operation` pode referenciar uma única `Proposal` canônica;
- o contrato de `Operation` não deve exigir a existência de uma nova entidade `Proposal` distinta de `BankProposal` neste momento.

### Compatibilidade com RFC-001

Enquanto a persistência continuar em `BankProposal`, a materialização de `Operation` deve tratá-la como origem canônica de proposta.

---

## 15. Compatibilidade com Commission

`Operation` é a origem canônica da comissão.

### Regra oficial

- `Commission` nasce de `Operation` executada;
- `Commission` pode possuir lifecycle próprio;
- `Operation` não deve absorver regras de distribuição da comissão;
- `Commission` não deve ser calculada sem operação elegível;
- o vínculo `Operation -> Commission` deve permanecer rastreável.

### Consequência

A materialização de `Operation` deve preparar o terreno para que a comissão permaneça derivada, não originária.

---

## 16. Estratégia de Materialização

A materialização de `Operation` deve ocorrer de forma incremental e sem ruptura.

### Fase 1 - Contrato

- consolidar o agregado como fonte financeira canônica;
- fixar relações obrigatórias e lifecycle;
- manter compatibilidade conceitual com `Opportunity`, `Proposal`, `Commission` e `Settlement`.

### Fase 2 - Leitura

- criar ou consolidar read models de operação;
- expor timeline e status operacional no workspace;
- permitir leitura compatível com auditoria.

### Fase 3 - Escrita

- aplicar writes somente através da autoridade do agregado;
- vincular eventos canônicos;
- preservar integridade multi-tenant e RBAC.

### Fase 4 - Financeiro

- integrar comissão e settlement sobre a operação executada;
- garantir que payout e liquidação dependam da operação;
- manter o fluxo financeiro rastreável do início ao fim.

### Fase 5 - Evolução

- suportar novos providers;
- suportar novos fluxos de settlement;
- suportar novos read models sem alterar a fonte de verdade.

### Regra

Qualquer expansão deve preservar a posição de `Operation` como agregado financeiro central e não como simples derivação de `Opportunity`.

---

## Referencias Oficiais

- `ADR-007` - Lead, Customer, Simulation and Opportunity Model
- `ADR-008` - Revenue Distribution Engine
- `ADR-009` - Operation Persistence and Financial Execution Aggregate
- `ARCH-016` - Opportunity Workspace Blueprint
- `ARCH-017` - Workspace Ownership Matrix
- `ARCH-018` - Domain Boundary Matrix
- `ARCH-019` - Workspace State Machine
- `RFC-001` - Proposal Canonicalization
