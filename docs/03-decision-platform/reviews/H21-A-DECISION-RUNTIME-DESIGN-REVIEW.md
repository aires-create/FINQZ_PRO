# H21-A - Decision Runtime Design Review

## Status
GO WITH RESTRICTIONS

## Executive Summary
A arquitetura proposta para a H21-A esta consistente com a fundacao consolidada em H19 e H20. O Decision Runtime pode ser iniciado com seguranca desde que reutilize integralmente a Composition modular do EDP, o `PrismaEdpUnitOfWork`, o Repository Registry Prisma e o padrao transacional ja homologado para Event Store, Outbox, Audit Timeline, Correlation e Idempotency Safe Mode.

O veredito e favoravel, mas condicionado a restricoes claras: nao criar segunda Composition Root, nao duplicar Runtime, nao duplicar UnitOfWork, nao duplicar Repository Registry, nao mover ownership para providers e nao introduzir novos contratos ou eventos sem revisao formal.

## 1. Objective of the Review

Validar, antes de qualquer implementacao, se a arquitetura da H21-A - Decision Runtime e consistente com a fundacao construida em H19 e H20, e se o primeiro Business Runtime da plataforma pode iniciar sem ruptura arquitetural, sem drift de contrato e sem regressao operacional.

## 2. Validation of the H20 Inherited Architecture

A H20 encerrou com GO e estabeleceu a base operacional exigida para a H21:

- Runtime Composition modular do EDP.
- HTTP Adoption sem alteracao de contrato externo.
- Application Wiring conectado a `composition.useCases`.
- `PrismaEdpUnitOfWork` como boundary transacional oficial.
- Repository Registry Prisma exposto pela composition.
- Event Store, Outbox, Audit Timeline, Correlation e Idempotency Safe Mode operando na mesma transacao.
- Rollback transacional e isolamento de Query validados em E2E.

Conclusao: a H20 fornece exatamente a base necessaria para a H21-A, sem exigir nova raiz de aplicacao ou nova infraestrutura de persistencia.

## 3. Reuse Validation for the Decision Runtime

O Decision Runtime deve reutilizar corretamente os seguintes blocos ja homologados:

- Runtime Composition
- `PrismaEdpUnitOfWork`
- Repository Registry
- Event Store
- Outbox
- Audit Timeline
- Correlation
- Idempotency Safe Mode

Essa reutilizacao e obrigatoria. Qualquer tentativa de criar um segundo runtime, um segundo boundary transacional ou um segundo registry e considerada regressao arquitetural.

## 4. Explicit Non-Goals and Prohibitions

Esta review confirma que NAO deve haver:

- segunda Composition Root;
- duplicacao de Runtime;
- duplicacao de UnitOfWork;
- duplicacao de Repository Registry;
- multiplas fontes de verdade;
- logica de negocio no frontend;
- acoplamento direto com Providers.

Essas proibicoes sao coerentes com a H19-C3, com o Event Catalog e com o encerramento da H20.

## 5. Architectural Review of the Proposed H21-A Components

### 5.1 Decision Context

**Responsabilidade**  
Concentrar os dados canonicos de entrada da decisao: tenant, usuario, origem, correlacao, causalidade, policy/strategy references e metadados operacionais.

**Entradas**  
- command envelope canonico;
- contexto de tenant/RBAC;
- referencias de policy e strategy vigentes;
- metadados de audit e correlation.

**Saidas**  
- contexto decisorio normalizado;
- snapshot semantico para avaliacao;
- contrato interno para o motor de decisao.

**Dependencias**  
- composition EDP;
- `PrismaEdpUnitOfWork`;
- repository registry para leitura de policy/strategy quando necessario.

**Eventos esperados**  
- Nenhum evento proprio. O contexto e insumo, nao evento de negocio.

**Persistencias esperadas**  
- Nenhuma persistencia propria. O contexto alimenta a decisao e pode ser refletido em audit/event payloads.

**Riscos arquiteturais**  
- vazar detalhes de transporte para o dominio;
- acoplar o contexto a DTOs de frontend;
- incluir payloads excessivos e nao canonicos.

### 5.2 Policy Evaluation

**Responsabilidade**  
Avaliar a policy vigente contra o contexto decisorio e produzir a base normativa que autoriza, restringe ou rejeita a decisao.

**Entradas**  
- Decision Context;
- policy repository/read model;
- effective dating e approval state;
- tenant scope.

**Saidas**  
- resultado de avaliacao de policy;
- policy version efetiva;
- restricoes aplicaveis.

**Dependencias**  
- repository registry Prisma;
- policy contracts canonicos;
- `PrismaEdpUnitOfWork`.

**Eventos esperados**  
- Nao criar eventos novos nesta wave.
- Quando houver emissao canonica, a familia esperada e a de `decision.*`, com revisao de catalogo quando necessario.

**Persistencias esperadas**  
- leitura de policy;
- registro de audit e event store apenas no fluxo decisorio consolidado.

**Riscos arquiteturais**  
- misturar policy com strategy;
- introduzir regra de negocio fora do contrato;
- transformar policy em rule engine paralelo.

### 5.3 Strategy Resolution

**Responsabilidade**  
Selecionar a strategy aplicavel, respeitando policy, approval state, tenant scope e consistencia com o contexto de decisao.

**Entradas**  
- Decision Context;
- resultado da Policy Evaluation;
- strategy repository/read model.

**Saidas**  
- strategy version selecionada;
- justificativa de selecao;
- restricoes de execucao.

**Dependencias**  
- repository registry Prisma;
- strategy contracts canonicos;
- `PrismaEdpUnitOfWork`.

**Eventos esperados**  
- Nenhum evento proprio nesta etapa.
- Se o fluxo gerar decisao final, deve convergir para `decision.recommended` ou evento canonico equivalente revisado.

**Persistencias esperadas**  
- leitura de strategy;
- nenhuma escrita fora do fluxo decisorio transacional.

**Riscos arquiteturais**  
- duplicar ownership de strategy;
- misturar estrategia com provider execution;
- produzir resultados nao auditaveis.

### 5.4 Decision Engine

**Responsabilidade**  
Orquestrar a avaliacao de policy, a selecao de strategy e a producao do resultado decisorio canonico.

**Entradas**  
- Decision Context;
- resultados de Policy Evaluation e Strategy Resolution;
- tenant scope;
- security/audit context.

**Saidas**  
- decision result canonico;
- evento de decisao canonica;
- payload de resposta.

**Dependencias**  
- use cases do EDP;
- `PrismaEdpUnitOfWork`;
- repository registry;
- runtime composition.

**Eventos esperados**  
- `decision.recommended` como resultado canonico natural da H21-A quando o caso de uso for de recomendacao;
- `decision.overridden` apenas quando o fluxo de override for formalmente ativado em onda posterior ou em escopo especifico.

**Persistencias esperadas**  
- Event Store;
- Outbox;
- Audit Timeline;
- Correlation;
- Idempotency Safe Mode.

**Riscos arquiteturais**  
- virar God Service;
- absorver policy e strategy governance;
- começar a emitir eventos novos sem revisao de catalogo.

### 5.5 Decision Result

**Responsabilidade**  
Materializar o artefato final da decisao, com estado, justificativa, correlacao e dados suficientes para auditoria e rastreio.

**Entradas**  
- resultado do Decision Engine;
- contexto do tenant;
- metadados auditaveis.

**Saidas**  
- response envelope canonico;
- payload da decisao;
- referencia de resposta para idempotencia segura.

**Dependencias**  
- contratos canonicos H19-C3;
- runtime foundation existente;
- persistence pipeline H20.

**Eventos esperados**  
- decisao final canonica registrada via fluxo de negocio existente, sem inventar novas familias.

**Persistencias esperadas**  
- response metadata para Safe Mode;
- registros persistentes ja estabelecidos na H20.

**Riscos arquiteturais**  
- confundir resposta com replay completo;
- transformar o envelope em fonte primaria do dominio;
- expor dados sensiveis indevidos.

## 6. Single Entry Point of the Business Runtime

O unico ponto de entrada oficial do Business Runtime deve ser o runtime EDP ja existente, com Composition modular interna, exposto pela rota HTTP adotada e consumido por `edpRoutes`/controller sem introduzir uma nova raiz.

Em termos praticos:

- entrada externa continua sob `buildFastifyApp()` como Composition Root global;
- entrada do Business Runtime continua sendo a composition do EDP criada uma unica vez;
- a primeira capacidade de negocio da H21-A entra pelo fluxo canonico de command do EDP, com `RecommendDecision` como caso de uso central da onda.

Nao deve existir entrada paralela, factory concorrente ou runtime auxiliar para a mesma capacidade.

## 7. Single Official Output Contract of the Decision Runtime

O unico contrato oficial de saida do Decision Runtime deve continuar sendo o contrato canônico do EDP:

- `EdpResponseEnvelope<TData>` para sucesso;
- `EdpErrorEnvelope` para erro.

Para H21-A, o `TData` deve carregar o resultado decisorio canonico, sem criar um segundo envelope de negocio. Qualquer variacao de saida deve derivar de ADR/contrato formal, nunca de adapter local ou frontend.

## 8. Regression Risks

Os principais riscos de regressao sao:

- introduzir uma segunda Composition Root;
- duplicar `PrismaEdpUnitOfWork` em paralelo;
- recriar Repository Registry fora da composition oficial;
- acoplar Decision Runtime a providers reais antes da hora;
- vazar regra de negocio para o frontend;
- desalinhar command/query mantendo a mesma rota;
- quebrar Idempotency Safe Mode ao tentar um replay completo prematuro;
- introduzir novos eventos sem revisao do Event Catalog;
- usar o Decision Engine como God Service;
- romper rollback transacional ou isolamento de Query.

## 9. Coupling Risks

Os riscos de acoplamento mais relevantes sao:

- policy acoplada a strategy;
- decision engine acoplado a provider execution;
- runtime acoplado a DTO de transporte;
- event catalog acoplado a detalhe de implementacao;
- audit acoplado a regras de negocio;
- idempotencia acoplada a envelope de resposta completo antes de existir contrato formal.

## 10. Adherence to Architecture Principles

### Backend First
Atendido. A H21-A deve nascer no backend, sem dependencias de frontend para definir contrato.

### Contracts Before Runtime
Atendido como principio central. Novos contratos ou eventos exigem ADR/review antes de implementation.

### Provider Driven
Atendido com restricao. Providers nao podem governar o dominio interno.

### Event Driven
Atendido. A decisao deve continuar emitindo eventos canonicos e persistindo no Event Store.

### Audit First
Atendido. Audit Timeline permanece parte obrigatoria do fluxo.

### Single Source of Truth
Atendido. O runtime EDP permanece a fonte operacional do dominio, sem duplicacao.

### Tenant Scoped
Atendido. Toda decisao deve permanecer tenant scoped.

### RBAC Driven
Atendido. O fluxo decisorio continua subordinado a contexto de autorizacao e seguranca.

## 11. Files That May Be Changed in H21-A

Os arquivos abaixo sao os candidatos provaveis para a H21-A, sujeitos a ADR e revisao de contrato:

- `backend/src/modules/edp/application/use-cases.ts`
- `backend/src/modules/edp/application/runtime-foundation.ts` somente se houver necessidade formal e justificada
- `backend/src/modules/edp/composition/edp.composition.ts`
- `backend/src/modules/edp/presentation/http/edp.controller.ts` apenas se a onda exigir novo roteamento de comando/query
- `backend/src/modules/edp/presentation/http/edp.routes.ts` apenas se a exposição HTTP da nova capacidade exigir ajuste
- `backend/src/modules/edp/contracts/commands.ts`
- `backend/src/modules/edp/contracts/queries.ts`
- `backend/src/modules/edp/contracts/persistence.ts`
- `backend/src/modules/edp/contracts/envelopes.ts`
- `backend/src/modules/edp/infrastructure/prisma/repositories.ts` apenas se houver expansão formal do registry
- `backend/src/tests/unit/*`
- `backend/src/tests/integration/*`
- `docs/03-decision-platform/reviews/*`
- `docs/03-decision-platform/adrs/*`

## 12. Blocked Files

Os arquivos abaixo permanecem bloqueados nesta etapa e nao devem ser alterados sem aprovacao formal:

- `backend/src/core/http/fastify.ts`
- `backend/src/modules/edp/domain/event-publisher.ts`
- `backend/src/modules/edp/application/command-handlers.ts`
- `backend/src/modules/edp/application/query-handlers.ts`
- `docs/03-decision-platform/events/EVENT-CATALOG-v1.md`
- `docs/03-decision-platform/contracts/H19-C3-ENTERPRISE-DECISION-CANONICAL-CONTRACTS.md`
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/*`
- `frontend/*`
- qualquer segundo runtime root fora da composition EDP

## 13. Acceptance Criteria for Implementation

A implementacao da H21-A somente deve ser aceita quando:

- reutilizar a composition H20 sem duplicar root;
- executar dentro do `PrismaEdpUnitOfWork`;
- persistir Event Store, Outbox, Audit, Correlation e Idempotency Safe Mode no mesmo fluxo transacional;
- manter query isolada;
- manter rollback completo;
- manter contrato de saida canonico;
- evitar novo acoplamento com providers;
- nao alterar frontend;
- nao alterar Event Catalog;
- nao alterar contratos H19-C3 sem ADR;
- manter build e testes verdes.

## 14. Recommended Order of Upcoming Waves

A ordem recomendada permanece:

1. H21-A Decision Runtime
2. H21-B Recommendation Engine
3. H21-C Proposal Runtime
4. H21-D Simulation Runtime
5. H21-E Provider Execution Runtime

## 15. Final Architectural Opinion

A H21-A e arquiteturalmente consistente com a fundacao H19/H20 e pode ser iniciada com seguranca sob restricoes claras. O projeto esta pronto para evoluir de runtime operacional para Business Runtime, desde que a primeira onda preserve a disciplina de contratos, a composicao modular, o boundary transacional unico e o principio de nao duplicar fontes de verdade.

**Final verdict: GO WITH RESTRICTIONS**

## 16. Official Recommendation to Start H21-A

Recomendacao oficial: iniciar a H21-A de forma incremental, com foco no Decision Runtime e com gate obrigatorio para qualquer alteracao de contrato, evento ou integracao externa. A primeira implementacao deve ser pequena, testavel e completamente suportada pela composition existente da H20.

