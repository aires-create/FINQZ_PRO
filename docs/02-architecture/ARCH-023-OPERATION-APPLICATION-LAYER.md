# ARCH-023 - Operation Application Layer

Status: Proposed
Date: 2026-06-11
Owner: Architecture
Type: Architectural Contract
Project: FINQZ PRO

---

## 1. Objetivo

Definir a camada de aplicação de `Operation` para a fase `IMPL-04A`, estabelecendo responsabilidades, fronteiras, contratos conceituais e regras de integração sem introduzir implementacao funcional.

Este documento existe para separar claramente:

- persistencia de `Operation`;
- orquestracao de casos de uso;
- leitura e consulta da camada de aplicacao;
- regras de seguranca, tenant e auditoria;
- compatibilidade com `Opportunity`, `BankProposal`, `Commission`, `Settlement` e `Provider Engine`.

`ARCH-023` nao altera schema, nao cria endpoints e nao substitui os contratos anteriores. Ele apenas formaliza a camada de aplicação que passa a orbitar `Operation` ja materializada no banco.

---

## 2. Escopo permitido

A camada de aplicacao de `Operation` pode conter apenas responsabilidades de orquestracao e coordenação.

Escopo permitido:

- coordenacao de comandos de `Operation`;
- consultas de leitura relacionadas a `Operation`;
- validacao de precondicoes de uso;
- aplicacao de regras de tenant e RBAC;
- registro de audit trail em nivel de aplicação;
- composicao de DTOs de entrada e saida;
- projeções de leitura conceituais;
- integração conceitual com `Opportunity` e `BankProposal`;
- preparação para evolucao futura com `Commission`, `Settlement` e `Provider Engine`.

---

## 3. Escopo proibido

O escopo proibido deve ser tratado como fronteira rígida desta fase.

Nao pode haver:

- endpoints;
- CRUD genérico;
- frontend;
- `Settlement`;
- `Provider` persistido;
- `Commission V2`;
- alteracao de schema Prisma;
- criacao de migration;
- escrita paralela;
- shadow writes;
- rotas paralelas;
- duplicacao de services, DTOs, repositories ou contratos existentes;
- alteracao de `Commission`;
- alteracao de `Opportunity` ou `BankProposal` fora da orquestracao da camada.

---

## 4. Relação com documentos anteriores

Este documento depende e deve ser lido em conjunto com os seguintes contratos:

- `ADR-008` - Revenue Distribution Engine
- `ADR-009` - Operation Persistence and Financial Execution Aggregate
- `ARCH-018` - Domain Boundary Matrix
- `ARCH-019` - Workspace State Machine
- `ARCH-020` - Operation Materialization Blueprint
- `ARCH-021` - Operation Persistence Contract
- `RFC-001` - Proposal Canonicalization

### Papel de cada referência

- `ADR-008` define que comissao e distribuicao financeira sao domínios posteriores e não devem ser misturados com a camada de aplicação de `Operation`.
- `ADR-009` posiciona `Operation` como raiz financeira e de execução.
- `ARCH-018` fixa as fronteiras entre `Opportunity`, `Proposal`, `Operation`, `Commission`, `Settlement` e `Provider`.
- `ARCH-019` separa estado global do workspace do lifecycle interno de `Operation`.
- `ARCH-020` define o blueprint de materialização, mas não a camada de aplicação.
- `ARCH-021` define contrato de persistência, campos, relações e índices.
- `RFC-001` mantém `BankProposal` como proposta persistida canônica enquanto durar a coexistência.

---

## 5. Responsabilidade da Application Layer

A `Application Layer` de `Operation` é responsável por orquestrar o uso da entidade materializada sem assumir a autoria das regras de domínio persistente ou da infraestrutura.

Responsabilidades centrais:

- coordenar comandos e consultas de `Operation`;
- garantir que a transição de estado esteja dentro do contrato oficial;
- validar tenant, autorização e contexto de execução;
- mapear entrada de caso de uso para intenção de negócio;
- mapear saidas para DTOs de resposta e read models;
- preservar rastreabilidade e auditabilidade;
- evitar que `Opportunity` continue sendo usada como proxy de execução financeira;
- evitar que `BankProposal` seja confundida com operação financeira final;
- preparar a integração futura com comissao, settlement e providers sem criar acoplamento prematuro.

### Regra

A camada de aplicação pode orquestrar, mas não pode inventar nova verdade de domínio.

---

## 6. OperationRepository conceitual

`OperationRepository` é o contrato conceitual da persistência e recuperação de `Operation`.

### Responsabilidades conceituais

- buscar `Operation` por identidade de negócio;
- buscar `Operation` por tenant;
- buscar `Operation` por `Opportunity`;
- buscar `Operation` por `BankProposal`;
- persistir mudanças válidas do aggregate;
- manter integridade da consulta com base em isolamento multi-tenant;
- suportar soft delete e filtros por status.

### O que não faz

- não executa regra de negócio financeira;
- não calcula comissão;
- não materializa settlement;
- não chama provider diretamente;
- não expõe contratos de UI;
- não substitui service de aplicação.

### Regra

O repository é um contrato de acesso, não um orquestrador de fluxo.

---

## 7. OperationService conceitual

`OperationService` representa a fachada de aplicação para casos de uso de `Operation`.

### Responsabilidades

- coordenar commands e queries;
- validar escopo de tenant;
- validar RBAC;
- validar consistência de entrada;
- invocar o repository conceitual;
- registrar eventos de aplicação quando aplicável;
- preparar payloads para audit trail;
- manter compatibilidade com `Opportunity` e `BankProposal`.

### O que não faz

- não cria endpoints;
- não faz CRUD genérico;
- não cria settlement;
- não cria provider persistido;
- não calcula comissao como verdade final;
- não altera schema;
- não duplica services existentes.

### Regra

`OperationService` é um ponto de coordenação de aplicação, não um segundo aggregate root.

---

## 8. OperationCommands

Os comandos representam intenções de aplicação sobre `Operation`.

### Lista conceitual

- `CreateOperation`
- `RequestOperationProposal`
- `ReceiveOperationProposal`
- `ApproveOperationProposal`
- `RejectOperationProposal`
- `MarkOperationExecuted`
- `MarkOperationFailed`
- `MarkOperationCanceled`
- `MarkOperationCommissionCalculated`
- `MarkOperationSettlementPending`
- `MarkOperationSettled`

### Finalidade

- `CreateOperation`: abrir a operação com identidade, contexto e autoria.
- `RequestOperationProposal`: registrar a solicitação de proposta.
- `ReceiveOperationProposal`: registrar o retorno da proposta.
- `ApproveOperationProposal`: registrar aprovação interna.
- `RejectOperationProposal`: registrar rejeição formal.
- `MarkOperationExecuted`: registrar execução financeira efetiva.
- `MarkOperationFailed`: registrar falha operacional.
- `MarkOperationCanceled`: registrar cancelamento.
- `MarkOperationCommissionCalculated`: registrar marco de cálculo de comissão.
- `MarkOperationSettlementPending`: registrar aguardando liquidacao.
- `MarkOperationSettled`: registrar encerramento financeiro.

### Regra

Comando não é endpoint e não é serviço. É apenas intenção de aplicação.

---

## 9. OperationQueries

As queries representam leitura e consulta da superfície de `Operation`.

### Lista conceitual

- `GetOperationById`
- `GetOperationByNumber`
- `ListOperationsByTenant`
- `ListOperationsByOpportunity`
- `ListOperationsByBankProposal`
- `ListOperationsByStatus`
- `ListOperationTimeline`
- `ListOperationSummary`
- `GetOperationFinancialView`

### Finalidade

- `GetOperationById`: recuperar uma operação específica.
- `GetOperationByNumber`: recuperar por identificador de negócio.
- `ListOperationsByTenant`: listar por isolamento do tenant.
- `ListOperationsByOpportunity`: listar operações vinculadas a uma oportunidade.
- `ListOperationsByBankProposal`: listar operações derivadas de uma proposta.
- `ListOperationsByStatus`: filtrar pelo lifecycle.
- `ListOperationTimeline`: expor eventos e marcos conceituais.
- `ListOperationSummary`: expor visão resumida.
- `GetOperationFinancialView`: expor visão financeira consolidada.

### Regra

Query não deve alterar estado nem carregar regra de mutação.

---

## 10. OperationDTOs

DTOs de `Operation` devem existir apenas como contrato conceitual de entrada e saída da camada de aplicação.

### Entrada

- `CreateOperationInputDTO`
- `RequestOperationProposalInputDTO`
- `ReceiveOperationProposalInputDTO`
- `ApproveOperationProposalInputDTO`
- `RejectOperationProposalInputDTO`
- `MarkOperationExecutedInputDTO`
- `MarkOperationFailedInputDTO`
- `MarkOperationCanceledInputDTO`
- `MarkOperationCommissionCalculatedInputDTO`
- `MarkOperationSettlementPendingInputDTO`
- `MarkOperationSettledInputDTO`

### Saída

- `OperationDTO`
- `OperationSummaryDTO`
- `OperationDetailDTO`
- `OperationTimelineDTO`
- `OperationFinancialViewDTO`
- `OperationStatusDTO`

### Regra

DTO é contrato de aplicação. Não é modelo de domínio e não é persistência.

---

## 11. OperationEvents

Os eventos de `Operation` representam transições oficiais esperadas pela camada de aplicação.

### Eventos previstos

- `OperationCreated`
- `OperationProposalRequested`
- `OperationProposalReceived`
- `OperationProposalApproved`
- `OperationProposalRejected`
- `OperationExecuted`
- `OperationFailed`
- `OperationCanceled`
- `CommissionCalculated`
- `SettlementRequested`
- `SettlementConfirmed`
- `SettlementFailed`

### Regra

Eventos devem refletir transições reais e auditáveis, não serem usados como validação substitutiva de negócio.

---

## 12. OperationReadModels

Read models são visões derivadas para consumo de aplicação e workspace.

### Modelos previstos

- `OperationSummary`
- `OperationDetail`
- `OperationTimeline`
- `OperationStatusView`
- `OperationFinancialView`
- `OperationWorkspaceView`

### Regra

Read model não é fonte de verdade. Ele apenas espelha a verdade persistida e os eventos autorizados.

---

## 13. Multi-Tenant Rules

`Operation` é uma superfície estritamente multi-tenant.

### Regras

- toda operação deve ser contextualizada por `tenantId`;
- nenhuma query pode cruzar tenants;
- nenhum command pode ser aceito sem contexto de tenant;
- read models devem respeitar segregação por tenant;
- logs e auditoria devem carregar tenant de origem;
- compatibilidade com multiempresa deve ser mantida em toda a camada.

### Regra

Tenant é invariável de segurança, não detalhe opcional.

---

## 14. RBAC Rules

`Operation` deve respeitar RBAC em leitura e mutação.

### Regras

- comandos críticos exigem autorização explícita;
- queries sensíveis podem ser segmentadas por papel e permissão;
- usuários financeiros podem consultar visão financeira autorizada;
- usuários operacionais podem acompanhar lifecycle autorizado;
- compliance pode consultar e bloquear fluxos;
- ações críticas não podem ser executadas por atalho de aplicação.

### Regra

RBAC deve controlar ação e contexto, não apenas tela ou rota.

---

## 15. Audit Trail Rules

`Operation` exige trilha de auditoria consistente na camada de aplicação.

### Regras

- toda mutação relevante deve ser auditável;
- toda transição de estado deve carregar autor e contexto;
- correlation id deve ser preservado quando disponível;
- eventos e audit trail devem ser correlacionáveis;
- falha, rejeição e cancelamento também devem ser auditáveis;
- auditoria não deve substituir o estado de domínio.

### Regra

Se a aplicação não consegue explicar a transição, ela não deve executá-la.

---

## 16. Dependências permitidas

Dependências permitidas para a camada de aplicação:

- `OperationRepository` conceitual;
- `Opportunity`;
- `BankProposal`;
- `Tenant`;
- `User`;
- `Audit`;
- `RBAC`;
- `Multi-tenant`;
- eventos operacionais já definidos;
- read models derivados;
- contratos de consulta e orquestração.

---

## 17. Dependências proibidas

Dependências proibidas para esta fase:

- `Settlement`;
- `Payment`;
- `Provider` persistido;
- `Commission V2`;
- `Commission.operationId`;
- frontend;
- endpoints novos;
- CRUD genérico;
- schema Prisma;
- migration;
- shadow writes;
- projections como verdade paralela;
- rotas paralelas;
- duplicação de serviços, DTOs, repositories ou contratos existentes.

---

## 18. Relação com Opportunity

`Opportunity` continua sendo a raiz operacional e comercial.

### Regras

- `Operation` não substitui `Opportunity`;
- `Opportunity` continua guardando contexto comercial, pipeline e ownership comercial;
- `Operation` representa a execução financeira derivada do contexto da oportunidade;
- a aplicação não deve copiar lifecycle de `Opportunity` para dentro de `Operation`;
- não deve haver acoplamento que transforme `Opportunity` em proxy de execução.

### Regra

`Opportunity` aponta a intenção comercial. `Operation` aponta a execução financeira.

---

## 19. Relação com BankProposal

`BankProposal` continua sendo a proposta persistida canônica enquanto durar a coexistência.

### Regras

- `Operation` pode referenciar `BankProposal`;
- a aplicação pode usar `BankProposal` como origem de proposta canônica;
- `Operation` não substitui a semântica de proposta;
- a camada de aplicação não deve criar um segundo modelo concorrente de proposal.

### Regra

`BankProposal` é a origem persistida de proposta. `Operation` consome essa referência.

---

## 20. Relação futura com Commission

`Commission` deve continuar fora da responsabilidade direta desta fase.

### Regras

- `Commission` não deve ser alterada;
- `Commission` não deve receber `operationId` nesta fase;
- a camada de aplicação pode prever dependência futura, mas não materializar integração definitiva;
- a origem canônica futura da comissão deve ser `Operation`, conforme ADRs e contratos anteriores.

### Regra

Nesta fase, `Commission` é dependência futura de contrato, não dependência ativa de implementação.

---

## 21. Relação futura com Settlement

`Settlement` permanece fora do escopo materializado.

### Regras

- não criar `Settlement`;
- não acoplar fluxo de pagamento à aplicação de `Operation` nesta fase;
- apenas documentar o ponto de extensão futuro;
- não antecipar estado persistido ou serviço real de liquidacao.

### Regra

`Operation` pode preparar o terreno para `Settlement`, mas não deve implementá-lo nem depender dele como requisito de fase.

---

## 22. Relação futura com Provider Engine

`Provider Engine` continua como camada de integração externa, não como entidade persistida de domínio.

### Regras

- `Operation` pode receber contexto de provider por contrato;
- a aplicação não deve persistir `Provider`;
- chamadas externas permanecem fora desta fase;
- o provider não define o domínio, apenas participa como integração futura.

### Regra

`Operation` orquestra a intenção de negócio; o provider continua sendo integração externa.

---

## 23. Critérios de aceite

A fase `IMPL-04A` só deve ser considerada validada quando:

- o escopo da camada de aplicação estiver explicitado;
- os limites com `Opportunity`, `BankProposal`, `Commission`, `Settlement` e `Provider` estiverem documentados;
- os comandos, queries, DTOs, events e read models tiverem contrato conceitual claro;
- as regras de multi-tenant, RBAC e audit trail estiverem formalizadas;
- não houver duplicidade com documentos anteriores;
- nenhuma implementação funcional tiver sido criada por engano;
- nenhuma alteração de schema ou endpoint tiver sido introduzida nesta fase.

---

## 24. Próxima fase recomendada

Após validação deste documento, a fase recomendada é:

`IMPL-04B - Operation Application Contracts and Handler Mapping`

### Objetivo da próxima fase

- detalhar o mapeamento entre commands, queries e handlers;
- definir o fluxo conceitual de entrada e saída;
- formalizar eventos consumidos e produzidos em nível de aplicação;
- manter a separação entre contrato e implementação.

### Regra

Nenhuma fase posterior deve avançar sem preservar a fronteira entre aplicação, persistência e integração externa.
