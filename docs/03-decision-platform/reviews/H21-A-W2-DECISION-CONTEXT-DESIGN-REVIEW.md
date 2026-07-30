# H21-A-W2 - Decision Context Design Review

## Status
GO WITH RESTRICTIONS

## 1. Objective of the Review

Validar a arquitetura do Decision Context antes de qualquer implementacao, garantindo aderencia integral aos principios estabelecidos em H19, H20 e H21, sem introduzir regra de negocio, persistencia, provider logic ou duplicacao de runtime.

## 2. Role of the Decision Context in the Business Runtime

O Decision Context e a camada de entrada formal do Business Runtime para a H21-A. Ele organiza e normaliza o contexto necessario para que o Decision Runtime opere de forma deterministica, tenant scoped, auditavel e correlacionavel.

O Decision Context nao decide. Ele prepara o terreno canonico para que o motor de decisao execute policy evaluation, strategy resolution e a producao do decision result.

## 3. Single Official Entry Point of the Decision Runtime

O Decision Context deve ser o unico ponto oficial de entrada do Decision Runtime.

Isso significa:

- nenhuma outra camada deve ingressar diretamente no motor decisorio sem passar pelo contexto;
- o Decision Runtime deve consumir apenas a forma normalizada do contexto;
- o ponto de entrada tecnico e conceitual deve permanecer unico, previsivel e rastreavel.

## 4. Validated Responsibilities of the Decision Context

O Decision Context deve concentrar apenas as responsabilidades de entrada e normalizacao:

- identidade do tenant;
- usuario/principal;
- contexto operacional;
- aggregate;
- command;
- correlation;
- causation;
- idempotency;
- auditoria;
- metadados;
- contexto de execucao.

Essas responsabilidades sao apropriadas para uma camada de contexto de negocio porque fornecem o envelope sem executar a decisao em si.

## 5. What Does Not Belong to the Decision Context

O Decision Context nao deve conter:

- regras de negocio;
- Policy Evaluation;
- Strategy Resolution;
- Recommendation;
- Simulation;
- Provider logic;
- calculos;
- persistencia.

Qualquer um desses itens dentro do Decision Context quebraria a separacao de fronteiras da H21 e aumentaria o risco de transformar o contexto em um orquestrador indevido.

## 6. Expected Interfaces

As interfaces esperadas para a W2 sao as seguintes:

### DecisionContext
Contrato canonico que representa o contexto de entrada normalizado do runtime decisorio.

### DecisionContextFactory
Factory responsavel por construir o DecisionContext a partir dos dados de entrada canonicos e do contexto operacional.

### DecisionExecutionContext
Representacao do contexto de execucao efetivo, contendo os elementos necessarios para iniciar o fluxo decisorio.

### DecisionMetadata
Metadados auditaveis e correlacionaveis associados ao contexto decisorio.

### DecisionPrincipal
Identidade canonica do principal que origina a execucao.

### DecisionTenantContext
Contexto canonico do tenant, incluindo escopo, isolamento e referencia de execucao.

## 7. Permitted Dependencies

O Decision Context pode depender de:

- contratos canonicos H19-C3;
- envelope canonico de command;
- envelope canonico de query quando aplicavel ao fluxo de entrada;
- contexto de tenant;
- contexto de usuario/principal;
- correlation e causation do request;
- metadados de auditoria;
- composition do EDP somente como fonte de dependencias ja homologadas;
- runtime foundation existente como referencia estrutural, sem duplicacao.

## 8. Forbidden Dependencies

O Decision Context nao pode depender de:

- Policy Evaluation;
- Strategy Resolution;
- Recommendation Engine;
- Simulation Runtime;
- Provider execution logic;
- repositores de persistencia como fonte de negocio;
- frontend;
- HTTP DTOs como source of truth;
- novas rotas ou novo runtime root;
- qualquer segunda composition root;
- qualquer segunda fonte de verdade.

## 9. Adherence to Architecture Principles

### Backend First
Atendido. O Decision Context pertence ao backend e nao deve ser derivado do frontend.

### Contracts Before Runtime
Atendido. O contexto deve nascer do contrato canonico, nao do adapter de transporte.

### Single Source of Truth
Atendido. O contexto e o runtime EDP continuam sendo fontes unicas de sua respectiva responsabilidade.

### Tenant Scoped
Atendido. O contexto deve carregar e preservar tenant scope em todas as execucoes.

### Event Driven
Atendido indiretamente. O contexto prepara a execucao que resultara em eventos, mas nao emite eventos.

### Audit First
Atendido. Audit context e metadata sao parte do proprio Decision Context.

### Provider Driven
Atendido com restricao. Providers nao participam da montagem do contexto nem definem seu conteudo canonico.

### Composition Root única
Atendido. Nao deve haver nova raiz de aplicacao nem composition concorrente.

## 10. Files That May Be Created in W2

Os arquivos abaixo sao os unicos candidatos aceitaveis para a H21-A-W2, sujeitos a revisao incremental:

- `backend/src/modules/edp/composition/decision-context.ts`
- `backend/src/modules/edp/composition/decision-context.test.ts`
- `backend/src/modules/edp/composition/index.ts` apenas para exportacao publica do novo contexto
- `docs/03-decision-platform/reviews/H21-A-W2-DECISION-CONTEXT-DESIGN-REVIEW.md`

## 11. Files That Must Remain Blocked

Os seguintes arquivos permanecem bloqueados nesta etapa:

- `backend/src/core/http/fastify.ts`
- `backend/src/modules/edp/application/runtime-foundation.ts`
- `backend/src/modules/edp/application/command-handlers.ts`
- `backend/src/modules/edp/application/query-handlers.ts`
- `backend/src/modules/edp/presentation/http/edp.controller.ts`
- `backend/src/modules/edp/presentation/http/edp.routes.ts`
- `docs/03-decision-platform/events/EVENT-CATALOG-v1.md`
- `docs/03-decision-platform/contracts/H19-C3-ENTERPRISE-DECISION-CANONICAL-CONTRACTS.md`
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/*`
- `frontend/*`

## 12. Architectural Risks

Os principais riscos arquiteturais identificados sao:

- transformar o Decision Context em um mini-runtime;
- misturar normalizacao com regra de negocio;
- vazar detalhes de transporte para o dominio;
- acoplar o contexto a provider logic;
- introduzir persistencia precoce;
- duplicar contexto fora da composition EDP;
- permitir que o contexto substitua o runtime decisorio.

## 13. Objective Acceptance Criteria

A H21-A-W2 somente deve ser considerada aceita quando:

- o Decision Context estiver definido como unico ponto oficial de entrada do Decision Runtime;
- a responsabilidade do contexto estiver limitada a normalizacao e preparacao;
- nenhuma regra de negocio tiver sido introduzida;
- nenhuma persistencia tiver sido adicionada;
- nenhuma dependencia proibida tiver sido introduzida;
- a composition existente da H20 continuar unica e preservada;
- testes estruturais do contexto estiverem verdes;
- build e suite total permanecerem sem regressao.

## 14. Recommended Implementation Order

Ordem recomendada:

1. definir os tipos publicos do Decision Context;
2. criar a factory de contexto;
3. expor o contexto pela composition local do EDP;
4. criar testes estruturais de contrato e forma;
5. validar que nenhum runtime adicional foi criado;
6. manter o HTTP e a Runtime Foundation intactos;
7. somente depois conectar o contexto ao fluxo de H21-A subsequente.

## 15. Final Architectural Opinion

O Decision Context e arquiteturalmente consistente com H19, H20 e H21, desde que permaneça estritamente como camada de entrada, sem absorver regra de negocio, persistencia ou responsabilidades de avaliacao decisoria.

O contexto deve servir como fronteira canonica entre os envelopes do dominio e o motor decisorio, preservando a composicao unica, o tenant scope e a disciplina de contratos.

**Final verdict: GO WITH RESTRICTIONS**

## 16. Official Recommendation to Start H21-A-W2

Recomendacao oficial: iniciar a H21-A-W2 apenas como skeleton do Decision Context, com interfaces publicas, factory controlada e testes estruturais, sem conectar regra de negocio, persistencia ou provider logic.
