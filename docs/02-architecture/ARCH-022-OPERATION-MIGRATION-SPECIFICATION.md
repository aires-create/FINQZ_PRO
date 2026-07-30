# ARCH-022 - Operation Migration Specification

Status: Proposed
Date: 2026-06-11
Owner: Architecture
Type: Architectural Specification
Project: FINQZ PRO

---

## 1. Objetivo

Formalizar a estrategia oficial de materializacao de `Operation` no banco de dados, com foco em adicao segura, compatibilidade retroativa e preparacao para a fase de migracao controlada do dominio financeiro.

Este documento define a especificacao arquitetural da migracao futura sem alterar schema, backend, frontend ou qualquer fluxo em producao.

Base obrigatoria:

- `ADR-008` - Revenue Distribution Engine
- `ADR-009` - Operation Persistence and Financial Execution Aggregate
- `ARCH-018` - Domain Boundary Matrix
- `ARCH-019` - Workspace State Machine
- `ARCH-020` - Operation Materialization Blueprint
- `ARCH-021` - Operation Persistence Contract

---

## 2. Escopo da Migration

A migration de `Operation` tem como escopo criar a nova representacao persistida do agregado financeiro e de execucao, preservando o estado atual do sistema e evitando ruptura com `Opportunity`, `BankProposal` e `Commission`.

O escopo inclui:

- introducao do enum `OperationStatus`;
- criacao da tabela `operations`;
- criacao de indices e unicidades requeridos;
- criacao das FKs para `Tenant`, `Opportunity`, `BankProposal` e `User`;
- preservacao integral das tabelas existentes;
- coexistencia com o modelo legado de `Commission`;
- aderencia ao contrato de fronteira definido em `ARCH-018`;
- aderencia ao lifecycle corporativo em `ARCH-019`.

O escopo nao inclui:

- alteracao de modelos legados;
- alteracao da semantica de proposta;
- alteracao do motor de comissao;
- alteracao de liquidacao;
- alteracao de provider;
- qualquer mecanismo de escrita paralela.

---

## 3. O que sera criado

### 3.1 Enum `OperationStatus`

O enum oficial a ser materializado e:

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

### 3.2 Tabela `operations`

A tabela `operations` sera criada como a representacao persistida do agregado `Operation`, contendo:

- identidade tecnica e de negocio;
- origem comercial;
- referencia de proposta canonica;
- autoria;
- lifecycle financeiro;
- referencias externas;
- auditoria basica;
- soft delete.

### 3.3 Indices

Os indices e unicidades previstos sao:

- `@@unique([tenantId, operationNumber])`
- `@@unique([tenantId, year, sequence])`
- `@@index([tenantId])`
- `@@index([tenantId, status])`
- `@@index([opportunityId])`
- `@@index([bankProposalId])`
- `@@index([createdById])`
- `@@index([deletedAt])`

### 3.4 FKs obrigatorias e opcionais

Relacoes a serem materializadas:

- FK `Tenant`
- FK `Opportunity`
- FK `BankProposal`
- FK `User`

---

## 4. O que nao sera criado

A migration nao deve criar, alterar ou inferir os seguintes elementos:

- `Commission.operationId`
- `Settlement`
- `Payment`
- `Provider`
- `Revenue Distribution Engine`
- shadow writes
- projections

### Regra

Qualquer expansao fora deste escopo deve ser tratada em documento proprio e submetida a gate arquitetural adicional.

---

## 5. Estrategia

A estrategia oficial de migracao de `Operation` deve ser:

- additive;
- backward compatible;
- zero downtime;
- sem alteracao de tabelas existentes;
- sem remocao de campos;
- sem alteracao de `Commission`.

### 5.1 Additive

`Operation` entra como adicao, sem substituir imediatamente as estruturas legadas.

### 5.2 Backward compatible

As leituras e escritas legadas continuam validas durante a coexistencia.

### 5.3 Zero downtime

A criacao da estrutura deve evitar indisponibilidade e nao pode exigir interrupcao do fluxo operacional.

### 5.4 Sem alteracao de tabelas existentes

Nenhuma tabela ja existente deve ter colunas removidas ou semantica quebrada nesta fase.

### 5.5 Sem remocao de campos

Campos atuais permanecem intactos ate fase posterior formalmente aprovada.

### 5.6 Sem alteracao de Commission

`Commission` continua como existe hoje, com migracao para `operationId` reservada para fase posterior.

---

## 6. Impact Analysis

### 6.1 Opportunity

Impacto esperado:

- baixo risco de quebra estrutural;
- reforco da separacao entre raiz comercial e raiz financeira;
- necessidade futura de atualizacao de consultas e read models que assumem `Opportunity` como centro financeiro.

### 6.2 BankProposal

Impacto esperado:

- coexistencia preservada;
- `BankProposal` continua como proposta persistida canônica enquanto durar a transicao;
- `Operation` passa a referenciar a proposta usada ou aprovada sem substituir seu papel atual.

### 6.3 Commission

Impacto esperado:

- sem alteracao nesta fase;
- risco arquitetural permanece na migracao futura de `Commission` para referencia canonica em `Operation`;
- nenhuma dependência nova deve ser assumida por escrita ou leitura.

### 6.4 Workspace

Impacto esperado:

- `ARCH-019` continua valido;
- `Operation` ganha materializacao sem conflitar com o lifecycle global do workspace;
- os estados globais do workspace nao sao substituidos pelo lifecycle interno de `Operation`.

### 6.5 Infraestrutura

Impacto esperado:

- adicao de nova tabela e enum;
- aumento moderado de superficie de indexacao;
- necessidade de validacao de performance de leitura e unicidade.

---

## 7. Rollback Strategy

A estrategia de rollback deve preservar a estabilidade do schema e permitir reversao controlada da migração sem comprometimento de dados existentes.

Diretrizes:

- remover somente os artefatos introduzidos por esta migracao;
- preservar tabelas legadas;
- manter `Commission`, `Opportunity` e `BankProposal` inalterados;
- garantir que a reversao nao exija transformacao de dados de dominios vizinhos;
- documentar qualquer impacto em leituras dependentes da nova tabela.

### Regra

Rollback nao pode implicar perda de dados de entidades existentes nem alterar o contrato atual de comissao.

---

## 8. Readiness Gate

Condicao obrigatoria para `IMPL-04`:

- migration revisada
- migration aprovada
- SQL revisado
- homologacao aprovada

### Regra

Sem este gate, a migracao nao deve ser executada nem promovida para etapa de aplicacao real.

---

## 9. Conclusao

`Operation` esta pronta para uma especificacao formal de migracao additive, desde que a implementacao respeite os limites de fronteira entre execucao financeira, proposta e comissao.

Este documento fixa a estrategia oficial para a fase de materializacao no banco de dados e serve como entrada para a revisao humana da migracao futura.
