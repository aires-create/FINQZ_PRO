# ARCH-026 - Operation Module Blueprint

Status: Proposed
Date: 2026-06-12
Owner: Architecture
Type: Architectural Contract
Project: FINQZ PRO

---

## 1. Objetivo

Definir o blueprint arquitetural do módulo `Operation` no backend do FINQZ PRO, estabelecendo a estrutura física recomendada, as fronteiras de responsabilidade e os fluxos conceituais de aplicação, consulta, auditoria, correlação, tenant e RBAC.

Este documento é uma proposta de organização de módulo, não uma implementação. Ele existe para evitar duplicidade estrutural, mistura de responsabilidades e criação prematura de contratos paralelos.

Base obrigatória:

- `ADR-009` - Operation Persistence and Financial Execution Aggregate
- `ARCH-020` - Operation Materialization Blueprint
- `ARCH-021` - Operation Persistence Contract
- `ARCH-023` - Operation Application Layer
- `ARCH-024` - Operation Orchestration Layer
- `ARCH-025` - Operation API Contract
- Auditoria `IMPL-04D`

---

## 2. Escopo

O módulo `Operation` deve ser estruturado como uma unidade de backend independente, com responsabilidade exclusiva sobre a execução financeira oficial do ciclo operacional.

Escopo permitido:

- organização física do módulo;
- separação entre domínio, aplicação, orquestração, persistência e apresentação HTTP;
- contratos conceituais de commands, queries, DTOs e read models;
- integração com Prisma por meio de repository;
- uso dos mecanismos existentes de tenant, RBAC, auditoria, correlação e tratamento de erro;
- estratégia de testes;
- definição de dependências permitidas e proibidas.

Escopo proibido:

- implementação funcional;
- endpoints reais;
- CRUD genérico;
- alteração de schema Prisma;
- migration;
- `Settlement`;
- `Provider` persistido;
- `Commission V2`;
- alteração de documentos anteriores;
- reutilização indevida de módulos de `Opportunity`, `Proposal` ou `Commercial Governance` como runtime de `Operation`.

---

## 3. Estrutura Física do Módulo Operation

Estrutura física recomendada:

```txt
backend/src/modules/operation/
  domain/
  application/
  orchestration/
  repositories/
  services/
  presentation/
    http/
  dto/
  contracts/
  validators/
  tests/
```

### Observação

A estrutura acima é propositalmente modular para permitir evolução controlada sem acoplar o módulo a `opportunities`, `commercial-governance` ou `proposals`.

---

## 4. Responsabilidade de Cada Pasta

### 4.1 `domain/`

Responsável por:

- enumeração e regras conceituais de lifecycle;
- validação de transições de estado;
- erros de domínio;
- invariantes da operação.

Não deve conter:

- Prisma;
- HTTP;
- RBAC;
- auditoria concreta;
- chamada a provider ou settlement.

### 4.2 `application/`

Responsável por:

- commands e queries conceituais;
- coordenação de casos de uso;
- contratos de entrada e saída;
- preparação de DTOs para orquestração.

Não deve conter:

- implementação de HTTP;
- transações concretas;
- SQL;
- integração externa;
- regra de persistência detalhada.

### 4.3 `orchestration/`

Responsável por:

- command handler strategy;
- query handler strategy;
- transaction boundaries;
- idempotency strategy;
- event publication strategy;
- audit strategy;
- correlation strategy.

Não deve conter:

- rotas;
- controllers;
- persistência direta fora do repository;
- lógica de domínio duplicada.

### 4.4 `repositories/`

Responsável por:

- contrato de acesso a dados;
- integração com Prisma;
- leitura e persistência da tabela `operations`;
- enforcement de filtros de tenant no acesso aos dados.

Não deve conter:

- regra de negócio;
- transporte HTTP;
- RBAC;
- publicação de eventos;
- orquestração de commands.

### 4.5 `services/`

Responsável por:

- coordenação de alto nível entre application, orchestration e repository;
- manutenção do contrato de aplicação;
- composição de respostas de caso de uso.

Não deve conter:

- controllers;
- routes;
- Zod schemas;
- SQL;
- dependência circular com outros módulos.

### 4.6 `presentation/http/`

Responsável por:

- rotas Fastify futuras;
- mapping de request/response;
- binding de RBAC e tenant middleware;
- consumo de schemas HTTP conceituais.

Não deve conter:

- regra de negócio;
- persistência;
- transação;
- cálculos financeiros.

### 4.7 `dto/`

Responsável por:

- contratos de entrada e saída da aplicação e da API;
- shapes conceituais de request e response;
- visões resumidas, detalhadas e financeiras.

Não deve conter:

- lógica de execução;
- regra de persistência;
- referência a framework.

### 4.8 `contracts/`

Responsável por:

- contratos formais entre command/query/application/orchestration/api;
- tipos conceituais sem implementar fluxo.

Não deve conter:

- comportamento;
- side effects;
- dependências de infraestrutura.

### 4.9 `validators/`

Responsável por:

- validação de shape;
- validação de entrada HTTP;
- coerência de payloads.

Não deve conter:

- regra de domínio;
- acesso a banco;
- side effects.

### 4.10 `tests/`

Responsável por:

- testes unitários de domínio e aplicação;
- testes de repository com mock Prisma;
- testes de route com `app.inject()`;
- testes de tenant, RBAC, auditoria e correlação.

---

## 5. Dependency Direction Rules

As dependências devem seguir direção única e previsível.

### Regra de direção

```txt
presentation/http
  -> application
  -> orchestration
  -> services
  -> repositories
  -> prisma
```

### Regras complementares

- `domain` pode ser consumido por `application`, `orchestration`, `services` e `tests`;
- `repositories` não podem depender de `presentation/http`;
- `application` não pode depender de `prisma` diretamente;
- `orchestration` não pode depender de controllers ou rotas;
- `presentation/http` não pode conter regra de negócio;
- `tests` podem simular dependências, mas não redefinir a direção de produção.

### Regra

Dependência sempre aponta para baixo na pilha, nunca para cima.

---

## 6. Command Flow

Fluxo conceitual de command:

```txt
HTTP Request
  -> Route
  -> Validation
  -> RBAC / Tenant / Correlation
  -> Command
  -> Command Handler Strategy
  -> Domain Validation
  -> Repository
  -> Audit
  -> Event Publication
  -> HTTP Response
```

### Regras

- command sempre representa intenção explícita;
- command deve ser tenant-scoped;
- command crítico deve ser idempotente quando aplicável;
- command não deve saltar o domínio para a persistência sem validação;
- command não deve gerar settlement ou provider persistido.

---

## 7. Query Flow

Fluxo conceitual de query:

```txt
HTTP Request
  -> Route
  -> Validation
  -> RBAC / Tenant / Correlation
  -> Query
  -> Query Handler Strategy
  -> Repository / Read Model
  -> Response DTO
  -> HTTP Response
```

### Regras

- query é read-only;
- query não altera status;
- query não publica evento mutável;
- query deve respeitar tenant e permissão;
- query pode compor read models sem se tornar truth source paralela.

---

## 8. Audit Flow

Fluxo conceitual de auditoria:

```txt
Action Validated
  -> Business Decision
  -> Audit Payload
  -> registerAuditLog
  -> audit repository
  -> persisted audit trail
```

### Regras

- toda mutação relevante deve ser auditável;
- auditoria deve carregar tenant e actor sempre que possível;
- falha e rejeição também devem ser auditadas;
- auditoria não pode derrubar o fluxo principal;
- auditoria do `Operation` deve usar o mecanismo oficial do backend.

---

## 9. Correlation Flow

Fluxo conceitual de correlação:

```txt
Inbound Request
  -> requestId / correlationId
  -> request context
  -> command/query
  -> audit/event payload
  -> response headers / logs
```

### Regras

- o correlation id deve ser preservado do boundary HTTP até o fluxo interno;
- requestId e correlationId devem ser correlacionáveis;
- logs, auditoria e eventos devem compartilhar o mesmo contexto sempre que possível;
- a correlação não substitui autorização nem tenant isolation.

---

## 10. Tenant Flow

Fluxo conceitual de tenant:

```txt
JWT / User Context
  -> tenantContextMiddleware
  -> request.currentTenant
  -> command/query
  -> repository filters
  -> audit
  -> response
```

### Regras

- nenhum fluxo de `Operation` deve existir sem tenant;
- tenant deve ser derivado do contexto autenticado;
- requests cross-tenant devem ser bloqueadas;
- repository deve aplicar tenant no acesso;
- read models também devem respeitar isolamento.

---

## 11. RBAC Flow

Fluxo conceitual de RBAC:

```txt
Authenticated Request
  -> requireRoles / requirePermissions
  -> route access gate
  -> command/query execution
```

### Regras

- leitura e mutação podem ter níveis distintos de permissão;
- transições de status críticas devem exigir permissão específica;
- RBAC deve ser aplicado no backend, nunca no frontend;
- compliance e financeiro podem ter visibilidade ampliada sem ganhar autoridade de mutação automática.

---

## 12. Prisma Integration Flow

Fluxo conceitual de integração com Prisma:

```txt
Repository
  -> Prisma Client
  -> operations table
  -> tenant-scoped queries
  -> soft delete filters
  -> relation includes
```

### Regras

- Prisma deve ficar restrito a repository;
- repository deve ser o único ponto de acesso a `operations`;
- filtros de tenant devem ser obrigatórios;
- `Operation` não deve depender de Prisma no application layer;
- `Operation` não deve acoplar a queries de `Opportunity` ou `BankProposal` fora do contrato definido.

---

## 13. Test Strategy

Estratégia de testes recomendada:

### 13.1 Unit

- lifecycle de domínio;
- validação de commands;
- regras de transição;
- idempotência conceitual;
- mapeamento de DTOs.

### 13.2 Repository

- isolamento por tenant;
- filtros por status;
- relações com `Opportunity` e `BankProposal`;
- persistência e leitura de `Operation`.

### 13.3 Service / Application

- orquestração de commands e queries;
- auditoria;
- correlação;
- RBAC;
- tenant enforcement.

### 13.4 Route

- `app.inject()` para validação de HTTP contract;
- autorização;
- resposta de erro padronizada;
- request/response shape;
- headers de correlação e idempotência.

### 13.5 Integration

- comportamento end-to-end dentro do backend real;
- integração com auth, tenant, audit e Prisma;
- sem expandir o escopo para settlement ou provider persistido.

---

## 14. Allowed Dependencies

Dependências permitidas:

- `ADR-009`
- `ARCH-020`
- `ARCH-021`
- `ARCH-023`
- `ARCH-024`
- `ARCH-025`
- `backend/src/core/http/*`
- `backend/src/core/prisma/*`
- `backend/src/shared/errors/*`
- `backend/src/modules/audit/*`
- `backend/src/modules/security-events/*`
- `backend/src/modules/rbac/*`
- `backend/src/modules/tenant/*`
- `backend/src/modules/opportunities/*`
- `backend/src/modules/crm/*`
- `backend/src/modules/commercial-governance/*` apenas para referência e não como runtime de `Operation`
- `@prisma/client`
- `zod`
- `fastify`

---

## 15. Forbidden Dependencies

Dependências proibidas:

- `Settlement` persistido;
- `Payment` como domínio separado nesta fase;
- `Provider` persistido;
- `Commission V2`;
- `Commission.operationId` como dependência ativa nesta fase;
- módulos Express legados como runtime principal de `Operation`;
- rotas de proposal stub;
- frontend;
- migrations;
- schema Prisma;
- cruzamento direto com `commercial-governance` como dono da execução financeira;
- repositório fora de `Operation` para `operations`;
- duplicação de audit, tenant ou RBAC engines.

---

## 16. Critérios de Aceite

A estrutura do módulo `Operation` será considerada pronta para implementação quando:

- a árvore física do módulo estiver aprovada;
- a direção de dependências estiver explícita;
- os fluxos de command, query, audit, correlation, tenant, RBAC e Prisma estiverem desenhados;
- as dependências permitidas e proibidas estiverem sem ambiguidade;
- a estratégia de testes estiver alinhada ao backend real;
- não existir duplicidade com outros módulos;
- `Operation` permanecer separada de `Opportunity`, `BankProposal` e `Commercial Governance`.

---

## 17. Próxima Fase Recomendada

Após aprovação deste blueprint, a próxima fase recomendada é:

`IMPL-04F - Operation Module Skeleton Approval`

### Objetivo da próxima fase

- revisar a proposta de estrutura de pastas final;
- validar nomes de contratos e responsabilidades;
- confirmar boundaries com o stack Fastify existente;
- aprovar a base para eventual criação de módulo runtime.

---

## 18. Conclusão

`Operation` deve nascer como módulo backend isolado, com direção de dependências clara e reaproveitando apenas as infraestruturas transversais já consolidadas do FINQZ PRO.

Essa escolha evita mistura entre execução financeira, proposta, governança comercial e integrações externas, reduzindo risco de duplicidade e facilitando a evolução incremental.

---

## Resumo da Auditoria

- O backend real já possui tenant, RBAC, auditoria, request correlation e tratamento de erro.
- O runtime oficial é Fastify-first; o legado Express ainda existe, mas não deve ser o caminho de `Operation`.
- `Opportunity` e `commercial-governance` são os melhores referenciais de estrutura, porém não devem ser copiados como módulos de execução financeira.
- Não existe módulo `Operation` hoje; portanto, não há duplicidade estrutural a preservar, apenas fronteiras a respeitar.

## Justificativa da Estrutura

- Separar `domain`, `application`, `orchestration`, `repositories`, `services` e `presentation/http` permite evoluir sem misturar responsabilidade de negócio, HTTP e persistência.
- A estrutura proposta se alinha ao que o backend já faz bem em módulos maduros, sem importar o legado Express como padrão.
- A divisão evita que `Operation` vire um "módulo monolítico" e reduz risco de repetir problemas de sobreposição com `Opportunity` e `BankProposal`.

## Diff de Alto Nível

- Adicionado novo documento arquitetural em `docs/02-architecture/ARCH-026-OPERATION-MODULE-BLUEPRINT.md`.
- Definida a estrutura física recomendada do módulo `Operation`.
- Formalizadas as regras de direção de dependências e os fluxos de command/query/audit/correlation/tenant/RBAC/Prisma.
- Documentada a estratégia de testes e as dependências permitidas e proibidas.
- Nenhum arquivo de runtime foi criado ou alterado.

