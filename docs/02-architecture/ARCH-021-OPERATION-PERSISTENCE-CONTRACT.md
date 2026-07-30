# ARCH-021 — Operation Persistence Contract

Status: Proposed
Date: 2026-06-11
Owner: Architecture
Type: Architectural Contract
Project: FINQZ PRO

---

## 1. Objetivo

Transformar `ARCH-020` e `ADR-009` em um contrato de persistência seguro para futura materialização Prisma de `Operation`, eliminando ambiguidades entre domínio, workspace, integração e persistência.

Este documento normaliza os conflitos identificados entre:

- `ARCH-020` - Operation Materialization Blueprint
- `ADR-009` - Operation Persistence and Financial Execution Aggregate
- `RFC-001` - Proposal Canonicalization
- `ARCH-019` - Workspace State Machine
- `ADR-002` - Provider Engine
- `ARCH-012` - Integrations Domain
- `backend/prisma/schema.prisma`

O foco é segurança arquitetural, compatibilidade enterprise e prevenção de FKs falsas, duplicidade de verdade e campos temporários inseguros.

---

## 2. Decisões Consolidadas

### 2.1 Operation

`Operation` é a raiz financeira e de execução do ciclo operacional.

### 2.2 Opportunity

`Opportunity` continua sendo a raiz operacional e comercial.

### 2.3 Proposal

`BankProposal` continua sendo a proposta persistida canônica enquanto durar a coexistência.

### 2.4 Commission

`Commission` deriva de `Operation` executada.

### 2.5 Settlement / Payment

`Settlement / Payment` vêm depois de `Commission`.

### 2.6 WorkspaceStatus

`WorkspaceStatus` não é `OperationStatus`.

### 2.7 Provider

Integração com provider existe como contrato arquitetural, mas `providerId` não pode ser FK canônica enquanto não existir `Provider` persistido e oficial no schema.

---

## 3. OperationStatus Oficial

O `OperationStatus` conceitual oficial é:

```text
CREATED
PROPOSAL_REQUESTED
PROPOSAL_RECEIVED
PROPOSAL_APPROVED
EXECUTED
COMMISSION_CALCULATED
SETTLEMENT_PENDING
SETTLED
REJECTED
FAILED
CANCELED
```

### Observação

Esse conjunto é exclusivo do agregado `Operation` e não deve ser confundido com o estado global do workspace definido em `ARCH-019`.

---

## 4. Campos que ENTRAM no contrato futuro

Os campos abaixo entram no contrato futuro de persistência de `Operation`:

- `id`
- `tenantId`
- `operationNumber`
- `opportunityId`
- `bankProposalId`
- `createdById`
- `amount`
- `currency`
- `status`
- `executedAt`
- `referenceDate`
- `providerOperationId`
- `externalReference`
- `metadata`
- `notes`
- `correlationId`
- `deletedAt`
- `createdAt`
- `updatedAt`

### Regra

Esses campos representam o núcleo persistível seguro e auditável da operação.

---

## 5. Campos que NÃO entram

Os seguintes campos não entram no contrato de persistência de `Operation`:

- `leadId`
- `proposalId`
- `bankAccountId`
- `commissionId`
- `settlementId`

### Motivo

Esses campos criariam sobreposição de responsabilidade, antecipariam agregados vizinhos ou introduziriam dependência de modelo ainda não consolidado.

---

## 6. Campos derivados ou bloqueados

### 6.1 `customerId`

`customerId` é derivado via `Opportunity`.
Não deve ser tratado como fonte de verdade primária de `Operation`.

### 6.2 `partnerId`

`partnerId` é derivado via `Opportunity` e não entra na primeira versão de `Operation`. Caso seja necessário futuramente por performance, RBAC financeiro ou relatórios, deverá entrar apenas como denormalização aprovada em ADR/RFC posterior.

### 6.3 `providerId`

`providerId` fica bloqueado até existir `Provider` persistido canônico.

### 6.4 `grossAmount`

Derivado.

### 6.5 `netAmount`

Derivado.

### 6.6 `executedAmount`

Derivado.

### 6.7 `settledAt`

Derivado de `Settlement`.

### Regra

Campos derivados não devem virar fonte de verdade paralela.

---

## 7. Regras de `operationNumber`

`operationNumber` é decisão proposta e obrigatória para o contrato futuro.

### Regras

- obrigatório;
- único por tenant;
- imutável;
- gerado somente pelo backend;
- não editável pelo frontend;
- formato sugerido: `OP-{YYYY}-{SEQUENCE}`;
- sequência por tenant e ano.

### Índice futuro

O contrato futuro deve prever unicidade por:

```text
tenantId + operationNumber
```

### Regra

`operationNumber` é identificador de negócio, não substituto do `id`.

---

## 8. Relações

### Relações oficiais

- `Operation` pertence a `Tenant`
- `Operation` pertence a uma `Opportunity`
- `Operation` referencia uma `BankProposal` canônica
- `Operation` é criada por `User`

### Relações explicitamente excluídas

- `Operation` não referencia `Lead` diretamente
- `Operation` não referencia `Customer` diretamente na primeira versão
- `Operation` não referencia `Provider` enquanto não existir `Provider` persistido

### Relações futuras

- `Commission` futura deve referenciar `Operation`
- `Settlement` futura deve referenciar `Commission` e/ou `Operation` conforme ADR posterior

### Conflito normalizado

`ARCH-020` tratava `customerId` e `providerId` como obrigatórios; este contrato reduz isso para segurança de materialização.

---

## 9. Índices futuros sugeridos

Os índices futuros sugeridos para `Operation` são:

- `@@unique([tenantId, operationNumber])`
- `@@index([tenantId])`
- `@@index([tenantId, status])`
- `@@index([opportunityId])`
- `@@index([bankProposalId])`
- `@@index([createdById])`
- `@@index([deletedAt])`

### Observação

`providerId` e `customerId` só entram em índice se se tornarem relações persistidas canônicas em fase posterior.

---

## 10. Anti-overlap Rules

As regras abaixo são obrigatórias para impedir sobreposição entre domínios:

- `Operation` não copia `pipeline`, `stage` ou `owner` de `Opportunity`.
- `Operation` não copia lifecycle de `Proposal`.
- `Operation` não calcula `Commission`.
- `Operation` não armazena dados bancários de `Settlement/Payment`.
- `Operation` não cria `Provider` improvisado.
- `Operation` não usa `customerId` como fonte de verdade.

### Regra

Se um campo pertencer a outro agregado, ele não deve entrar em `Operation` por conveniência de leitura.

---

## 11. Readiness Gate

Antes de `IMPL-02`, este contrato exige:

- `ARCH-021` revisado e aprovado;
- `operationNumber` validado;
- `providerId` tratado como bloqueado;
- `bankProposalId` normalizado;
- `customerId` definido como derivado;
- índices revisados;
- cardinalidade `Commission` / `Settlement` documentada para a próxima fase.

### Regra

Sem este gate, qualquer materialização Prisma de `Operation` corre risco de criar FK falsa, campo duplicado ou agregação incorreta.

---

## 12. Conclusão

`Operation` ainda **não deve ir para Prisma** até este contrato ser revisado e aprovado.

Este documento é o ponto de controle para evitar que a persistência futura seja construída com conflitos entre execução financeira, proposta, provider e workspace.

---

## Referências Oficiais

- `ADR-002` - Provider Engine
- `ADR-009` - Operation Persistence and Financial Execution Aggregate
- `ARCH-012` - Integrations Domain
- `ARCH-019` - Workspace State Machine
- `ARCH-020` - Operation Materialization Blueprint
- `RFC-001` - Proposal Canonicalization
- `backend/prisma/schema.prisma`
