# ARCH-025 - Operation API Contract

Status: Proposed
Date: 2026-06-11
Owner: Architecture
Type: Architectural Contract
Project: FINQZ PRO

---

## 1. Objetivo

Documentar o contrato HTTP/API futuro do domínio `Operation` para a fase `IMPL-04C`, sem implementar endpoints, controllers, services ou qualquer artefato funcional.

Este documento define a superfície conceitual de comunicação da API de `Operation`, preservando aderência aos contratos já aprovados para persistência, aplicação, orquestração, lifecycle e canonicalização de proposta.

---

## 2. Escopo permitido

A API conceitual de `Operation` pode cobrir apenas a especificação de contrato.

Escopo permitido:

- design da superfície HTTP;
- inventário conceitual de rotas;
- métodos HTTP previstos;
- contratos de request e response;
- modelo de erro;
- regras de RBAC por rota;
- enforcement de tenant;
- headers de auditoria;
- headers de correlação;
- headers de idempotência;
- paginação e filtragem;
- regras de transição de status;
- compatibilidade com `Operation`, `Opportunity` e `BankProposal`;
- preparação para futuras leituras relacionadas a `Commission`, `Settlement` e `Provider Engine` sem materialização.

---

## 3. Escopo proibido

Nesta fase, não pode haver:

- implementação de código;
- criação de rotas reais;
- alteração de backend;
- alteração de frontend;
- alteração de schema Prisma;
- criação de migration;
- CRUD operacional completo;
- `Settlement`;
- `Provider` persistido;
- `Commission V2`;
- handlers reais;
- controllers;
- services;
- schemas Zod;
- testes;
- modificação dos documentos anteriores.

---

## 4. Relação com ADR-009, ARCH-020, ARCH-021, ARCH-023, ARCH-024, ARCH-019 e RFC-001

Este documento deve ser lido em conjunto com:

- `ADR-009` - Operation Persistence and Financial Execution Aggregate
- `ARCH-020` - Operation Materialization Blueprint
- `ARCH-021` - Operation Persistence Contract
- `ARCH-023` - Operation Application Layer
- `ARCH-024` - Operation Orchestration Layer
- `ARCH-019` - Workspace State Machine
- `RFC-001` - Proposal Canonicalization

### Papel de cada referência

- `ADR-009` define `Operation` como raiz financeira e de execução.
- `ARCH-020` define o blueprint conceitual da materialização.
- `ARCH-021` define campos, relações e índices persistidos.
- `ARCH-023` define commands, queries, DTOs, events e read models da aplicação.
- `ARCH-024` define estratégia de handlers, transações, idempotência, eventos, auditoria e correlação.
- `ARCH-019` separa estado global do workspace do lifecycle de `Operation`.
- `RFC-001` mantém `BankProposal` como proposta persistida canônica.

### Regra

`ARCH-025` descreve a borda HTTP da camada de operação, sem invadir persistência, domínio ou orquestração.

---

## 5. API Design Principles

### 5.1 Contract first

A API de `Operation` deve ser definida por contrato antes de qualquer implementação.

### 5.2 Modular scope

O contrato deve respeitar bounded context e não misturar operação financeira com domínio comercial, settlement ou provider persistido.

### 5.3 Tenant safe by default

Toda rota, request e response devem carregar contexto de tenant ou depender de contexto autenticado equivalente.

### 5.4 RBAC aware

O contrato deve refletir autorização por rota e por ação.

### 5.5 Idempotent where critical

Transições críticas e criação de operação devem prever idempotência.

### 5.6 Auditability

A API deve ser desenhada para permitir trilha de auditoria consistente e correlacionável.

### 5.7 Read consistency

Leituras devem expor visões coerentes com a verdade persistida e com os eventos oficiais, sem read models concorrentes.

---

## 6. Route Inventory conceitual

Inventário conceitual de rotas futuras:

- `POST /api/v1/operations`
- `GET /api/v1/operations`
- `GET /api/v1/operations/:id`
- `GET /api/v1/operations/number/:operationNumber`
- `GET /api/v1/operations/:id/timeline`
- `GET /api/v1/operations/:id/summary`
- `GET /api/v1/operations/:id/financial-summary`
- `POST /api/v1/operations/:id/status-transitions`
- `GET /api/v1/opportunities/:opportunityId/operations`
- `GET /api/v1/bank-proposals/:bankProposalId/operations`

### Regra

O inventário acima é apenas conceitual e não autoriza criação real de rotas nesta fase.

---

## 7. HTTP Methods previstos

- `POST` para criação e transições explícitas
- `GET` para leitura, timeline e summary
- `PATCH` apenas se futuramente houver atualização parcial não transicional e aprovada por contrato
- `PUT` não é necessário como padrão para esta fase
- `DELETE` não deve ser usado para mutação destrutiva; soft delete, se existisse no futuro, deve ser tratado por contrato específico

### Regra

A API de `Operation` deve privilegiar comandos explícitos e leituras especializadas em vez de CRUD genérico.

---

## 8. Operation Create Contract

### Intenção

Criar uma `Operation` com contexto mínimo de negócio, tenant, oportunidade e autoria.

### Campos conceituais de entrada

- `tenantId`
- `operationNumber` quando aplicável ao contrato de origem
- `opportunityId`
- `bankProposalId` opcional
- `createdById`
- `amount`
- `currency`
- `referenceDate` opcional
- `metadata` opcional
- `notes` opcional
- `correlationId` opcional

### Regras

- a criação deve ser tenant-scoped;
- `Opportunity` deve ser válida e autorizada;
- `BankProposal` deve ser opcional e coerente quando presente;
- `createdById` deve ser rastreável;
- o contrato não deve exigir settlement ou provider persistido;
- o contrato não deve criar comissão automaticamente como verdade paralela.

---

## 9. Operation Read Contract

### Intenção

Expor a leitura autorizada de `Operation` em diferentes níveis de detalhamento.

### Superfícies conceituais

- detalhe de operação;
- lista paginada;
- busca por número;
- busca por oportunidade;
- busca por proposta;
- resumo financeiro;
- timeline operacional.

### Regras

- toda leitura deve respeitar tenant;
- toda leitura sensível deve respeitar RBAC;
- read contract não altera estado;
- read contract não executa regras transacionais;
- read contract não substitui source of truth persistida.

---

## 10. Operation Status Transition Contract

### Intenção

Permitir transições explícitas de status da operação.

### Transições conceituais

- `CREATED`
- `PROPOSAL_REQUESTED`
- `PROPOSAL_RECEIVED`
- `PROPOSAL_APPROVED`
- `EXECUTED`
- `COMMISSION_CALCULATED`
- `SETTLEMENT_PENDING`
- `SETTLED`
- `REJECTED`
- `FAILED`
- `CANCELED`

### Regras

- transição só pode ocorrer dentro do lifecycle oficial;
- transição deve ser autorizada;
- transição deve ser auditável;
- transição deve ser correlacionável;
- transição não pode pular estados sem regra aprovada;
- transição não pode materializar settlement ou provider persistido.

### Regra

Transição de status é contrato explícito, não atualização genérica de campo.

---

## 11. Operation Timeline Contract

### Intenção

Expor marcos cronológicos e eventos relevantes da operação.

### Conteúdo conceitual

- criação;
- solicitação de proposta;
- recebimento de proposta;
- aprovação;
- execução;
- cálculo de comissão;
- pendência de liquidação;
- liquidação;
- falha;
- cancelamento;
- rejeição.

### Regras

- timeline deve ser derivada de eventos e estado persistido;
- timeline não deve virar verdade paralela;
- timeline deve ser tenant-scoped;
- timeline pode ser filtrada por permissão quando necessário.

---

## 12. Operation Financial Summary Contract

### Intenção

Expor um resumo financeiro consolidado da operação.

### Conteúdo conceitual

- amount;
- currency;
- status;
- executedAt;
- referenceDate;
- bankProposal reference;
- indicadores derivados de comissionamento e settlement quando disponíveis no futuro.

### Regras

- o resumo financeiro não deve inventar settlement;
- o resumo financeiro não deve derivar commission como nova entidade;
- o resumo financeiro deve ser reconstruível a partir do aggregate e dos eventos;
- o resumo financeiro deve respeitar o tenant e o RBAC.

---

## 13. Request DTOs conceituais

DTOs de request previstos:

- `CreateOperationRequestDTO`
- `ListOperationsRequestDTO`
- `GetOperationRequestDTO`
- `GetOperationByNumberRequestDTO`
- `GetOperationTimelineRequestDTO`
- `GetOperationFinancialSummaryRequestDTO`
- `TransitionOperationStatusRequestDTO`

### Regra

Request DTO é contrato de API, não implementação de validação nem schema executivo.

---

## 14. Response DTOs conceituais

DTOs de response previstos:

- `OperationResponseDTO`
- `OperationDetailResponseDTO`
- `OperationSummaryResponseDTO`
- `OperationTimelineResponseDTO`
- `OperationFinancialSummaryResponseDTO`
- `OperationListResponseDTO`
- `OperationTransitionResponseDTO`

### Regra

Response DTO deve refletir a superfície exposta, sem acoplar detalhes de persistência.

---

## 15. Error Model

O modelo de erro da API deve ser previsível e consistente.

### Classes conceituais

- `VALIDATION_ERROR`
- `AUTHORIZATION_ERROR`
- `TENANT_ERROR`
- `NOT_FOUND`
- `CONFLICT`
- `IDEMPOTENCY_CONFLICT`
- `TRANSITION_NOT_ALLOWED`
- `STATE_CONFLICT`
- `INTERNAL_ERROR`

### Regras

- erros devem ser padronizados;
- erros devem ser legíveis para integração e suporte;
- erros devem preservar correlation id quando disponível;
- erros críticos não devem vazar detalhes internos desnecessários;
- erro de tenant e erro de autorização devem ser distintos.

---

## 16. RBAC por rota

### Regras conceituais

- criação de operação exige permissão de escrita operacional;
- leitura de resumo pode ser mais ampla que leitura financeira detalhada;
- timeline e financial summary podem exigir permissão financeira;
- transição de status exige permissão mais restritiva do que leitura;
- falha, cancelamento e rejeição devem respeitar a mesma governança de status crítico.

### Regra

Cada rota deve declarar seu nível de acesso esperado por contrato.

---

## 17. Tenant Enforcement

### Regras

- toda request deve ter tenant explícito ou derivável de contexto autenticado;
- tenant não pode ser opcional para escrita;
- leitura multi-tenant deve ser isolada;
- resposta não pode misturar dados de tenants diferentes;
- auditoria e correlação devem carregar tenant de origem;
- request sem tenant válido deve falhar de forma previsível.

### Regra

Tenant enforcement é requisito estrutural, não middleware opcional.

---

## 18. Audit Headers

Headers conceituais de auditoria:

- `X-Audit-Actor-Id`
- `X-Audit-Actor-Type`
- `X-Audit-Tenant-Id`
- `X-Audit-Action`

### Regras

- headers de auditoria devem existir como contrato quando a superfície exigir rastreabilidade explícita;
- a API não deve depender exclusivamente de payload para autoria;
- headers não substituem autenticação;
- headers devem ser compatíveis com logs e audit trail.

---

## 19. Correlation Headers

Headers conceituais de correlação:

- `X-Correlation-Id`
- `X-Trace-Id`

### Regras

- correlation id deve atravessar request, aplicação, evento e auditoria;
- headers de correlação devem ser aceitos e preservados quando fornecidos;
- quando ausentes, a API deve poder gerar identificador interno;
- correlação não deve cruzar tenants indevidamente.

---

## 20. Idempotency Headers

Headers conceituais de idempotência:

- `Idempotency-Key`
- `X-Idempotency-Key`

### Regras

- operações críticas devem suportar deduplicação;
- criação de operação e transição sensível devem considerar idempotência;
- chaves repetidas devem retornar resultado consistente;
- idempotência não substitui autorização ou validação de estado.

---

## 21. Pagination and Filtering

### Paginação

- `page`
- `pageSize`
- `limit`
- `offset`

### Filtros

- `tenantId`
- `status`
- `opportunityId`
- `bankProposalId`
- `createdById`
- `deletedAt`
- intervalo de datas
- `operationNumber`

### Regras

- paginação deve ser estável;
- filtros devem ser tenant-scoped;
- a API não deve retornar coleção sem limite por padrão;
- filtros não devem expor dados fora do escopo autorizado.

---

## 22. Status Transition Rules

### Regras conceituais

- transições devem seguir lifecycle oficial de `Operation`;
- estados terminais devem ser respeitados;
- transições retroativas só devem existir quando explicitamente autorizadas por contrato futuro;
- transições não podem pular para settlement persistido;
- transições devem ser auditáveis e correlacionáveis;
- transições devem ser rejeitadas se violarem tenant, RBAC ou integridade do aggregate.

---

## 23. Proibições explícitas

Esta API não pode:

- criar CRUD completo por conveniência;
- expor settlement real nesta fase;
- expor provider persistido;
- acoplar commission v2;
- criar rotas paralelas fora do contrato oficial;
- esconder transição de status em endpoint genérico;
- transformar `Operation` em alias de `Opportunity`;
- transformar `BankProposal` em operação final;
- criar contrato concorrente com `ARCH-023` ou `ARCH-024`.

---

## 24. Critérios de aceite

A fase `IMPL-04C` só pode ser considerada validada quando:

- não houver documento equivalente já existente;
- a relação com `ADR-009`, `ARCH-020`, `ARCH-021`, `ARCH-023`, `ARCH-024`, `ARCH-019` e `RFC-001` estiver documentada;
- o inventário de rotas conceituais estiver claro;
- os contratos de request, response, erro e headers estiverem definidos;
- RBAC, tenant, audit e correlation estiverem explicitados;
- as proibições estiverem sem ambiguidade;
- não houver implementação funcional criada por engano.

---

## 25. Próxima fase recomendada

Após validação deste documento, a próxima fase recomendada é:

`IMPL-04D - Operation API Review and Endpoint Mapping`

### Objetivo da próxima fase

- mapear contrato para rotas reais sem implementar;
- validar consistência com backend modular;
- revisar naming, payload shape e semântica de respostas;
- manter separação entre contrato e implementação.

---

## 26. Conclusão

`Operation` já possui contrato de persistência, aplicação e orquestração. Este documento fecha apenas a borda HTTP conceitual, preservando segurança arquitetural, compatibilidade com o workspace e ausência total de implementação.

---

## Referencias Oficiais

- `ADR-009` - Operation Persistence and Financial Execution Aggregate
- `ARCH-020` - Operation Materialization Blueprint
- `ARCH-021` - Operation Persistence Contract
- `ARCH-023` - Operation Application Layer
- `ARCH-024` - Operation Orchestration Layer
- `ARCH-019` - Workspace State Machine
- `RFC-001` - Proposal Canonicalization

