# H21-A-W4 - Decision Model Design Review

## Status
GO WITH RESTRICTIONS

## 1. Objective of the Review

Validar a arquitetura do Decision Model antes de qualquer implementacao, preservando a disciplina de contratos, a separacao de responsabilidades e a integridade do Decision Runtime dentro da H21-A.

Esta revisao parte do baseline consolidado:

- H20 encerrada com GO;
- H21 Architecture publicada;
- H21-A Design Review publicada;
- H21-A-W1 Decision Runtime Skeleton concluida;
- H21-A-W2 Decision Context Skeleton concluida;
- H21-A-W3 Decision Inputs Skeleton concluida;
- build aprovado;
- suite de testes estabilizada.

## 2. Role of the Decision Model in the Decision Runtime

O Decision Model e a representacao canonica e estrutural do artefato de decisao dentro do Decision Runtime.

Ele existe para consolidar a forma do estado decisorio, organizar os elementos ja preparados por Inputs e Context e servir como base estrutural para evolucoes futuras da onda decisoria.

O Decision Model nao decide, nao avalia policy, nao resolve strategy e nao recomenda. Sua funcao e modelar, nao orquestrar.

## 3. Relationship Between Decision Model, Decision Context, and Decision Inputs

A relacao entre as tres camadas e sequencial:

- Decision Inputs representam a entrada canonica inicial;
- Decision Context representa a entrada normalizada e pronta para execucao;
- Decision Model representa a forma estrutural consolidada do objeto decisorio que organiza o estado do dominio.

Em termos praticos:

- Inputs capturam a origem e a forma bruta ou semi-normalizada;
- Context estabiliza tenant, principal, correlation, causation, idempotency, audit e execution;
- Model consolida a estrutura canonica de decisao sem introduzir comportamento.

O Model nao substitui Inputs nem Context. Ele depende conceitualmente deles e permanece abaixo do runtime de decisao propriamente dito.

## 4. What Belongs to the Decision Model and What Does Not

### Belongs to the Decision Model

- identificador da decisao;
- tipo da decisao;
- tenant scope;
- principal scope;
- aggregate reference;
- command reference;
- estado estrutural da decisao;
- metadata canonica do model;
- snapshot semantico nao comportamental;
- referencias de correlacao e auditoria ja normalizadas.

### Does Not Belong to the Decision Model

- policy evaluation;
- strategy resolution;
- recommendation;
- provider logic;
- persistencia;
- eventos;
- calculos;
- adaptacao de transporte HTTP;
- qualquer regra de negocio executavel.

### Boundary Principle

Se um campo altera decisao de negocio, pertence a uma wave posterior de comportamento.
Se um campo apenas organiza a forma canônica do estado, pode pertencer ao Decision Model.

## 5. Expected Interfaces

As interfaces esperadas para a W4 devem permanecer publicas, pequenas e estruturais.

### DecisionModel
Contrato canonico do model decisorio.

### DecisionModelFactory
Factory responsavel por construir o Decision Model a partir de Decision Inputs e Decision Context, sem executar regra de negocio.

### DecisionModelSnapshot
Representacao imutavel ou read-only do estado estrutural do model.

### DecisionModelMetadata
Metadados canonicos associados ao model, incluindo rastreabilidade e origem.

### DecisionModelIdentity
Identidade estrutural da decisao, com referencias minimamente suficientes para rastreio.

### DecisionModelState
Estado canônico e descritivo do model, sem comportamento.

## 6. Required Factory

Deve existir uma factory controlada para montar o Decision Model.

### DecisionModelFactory

A factory deve:

- consumir Decision Inputs e Decision Context;
- normalizar apenas forma e estrutura;
- consolidar snapshots canonicos;
- preservar metadata e referencias;
- evitar qualquer leitura de persistencia;
- evitar qualquer dependencia de provider;
- evitar qualquer decisao de negocio.

A factory existe para garantir consistencia estrutural, nao para inferir significado de negocio.

## 7. How to Avoid Business Logic in the Model

Para evitar regra de negocio no Model, a implementacao deve seguir limites claros:

- o Model nao pode calcular resultado;
- o Model nao pode escolher policy ou strategy;
- o Model nao pode determinar elegibilidade;
- o Model nao pode materializar recommendation;
- o Model nao pode derivar comportamento de provider;
- o Model nao pode buscar dados externos para completar significado;
- o Model nao pode emitir eventos nem persistir estado.

O Model deve permanecer como estrutura de dominio, nao como motor de decisao.

## 8. How to Avoid Policy Evaluation, Strategy Resolution, and Recommendation in This Wave

Esta wave deve permanecer estritamente anterior a qualquer comportamento decisorio.

Para evitar introduzir Policy Evaluation, Strategy Resolution e Recommendation:

- nao criar services de avaliacao;
- nao criar resolvers de strategy;
- nao criar recommendation handlers;
- nao criar dependencias para catalogs de policy ou strategy com comportamento;
- nao expor methods que executem decisao;
- nao acoplar o model a use cases de negocio.

O Model pode carregar referencias para evolucoes futuras, mas nao pode executar nenhuma das capacidades da H21-A.

## 9. How to Avoid Provider Logic, Persistence, and Events

O Decision Model nao deve depender de provider logic, persistencia ou eventos.

Para manter essa restricao:

- nao consultar repositories;
- nao acessar UnitOfWork;
- nao acoplar repository registry;
- nao publicar eventos;
- nao construir payloads de outbox;
- nao registrar audit timeline;
- nao registrar correlation persistence;
- nao incorporar provider metadata como source of truth.

O Model deve ser puro do ponto de vista comportamental.

## 10. Files That May Be Created

Os arquivos abaixo sao candidatos aceitaveis para a H21-A-W4, sujeitos a implementacao incremental e revisao:

- `backend/src/modules/edp/composition/decision-model.ts`
- `backend/src/modules/edp/composition/decision-model.test.ts`
- `backend/src/modules/edp/composition/index.ts` apenas para exportacao publica do novo skeleton
- `backend/src/modules/edp/composition/decision-context.ts` somente se houver integracao minima e justificada com o model
- `backend/src/modules/edp/composition/decision-inputs.ts` somente se houver integracao minima e justificada com o model

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
- qualquer provider logic
- qualquer segundo runtime root fora da composition EDP

## 12. Mandatory Structural Tests

A implementacao futura da W4 deve ser acompanhada de testes estruturais obrigatorios que comprovem:

- criacao do Decision Model;
- normalizacao estrutural de Inputs e Context para o Model;
- preservacao de metadata e referencias;
- ausencia de regra de negocio;
- ausencia de dependencias de provider;
- ausencia de persistencia;
- ausencia de eventos;
- exportacao publica funcionando pelo ponto adequado;
- compatibilidade estrutural com Inputs e Context.

Os testes devem confirmar forma, isolamento e preservacao de contrato, nao comportamento decisorio.

## 13. Acceptance Criteria

A H21-A-W4 somente deve ser considerada aceita quando:

- o Decision Model estiver definido como artefato estrutural canonico;
- a relacao com Inputs e Context estiver clara e unidirecional;
- nenhuma regra de negocio tiver sido introduzida;
- nenhuma persistencia tiver sido adicionada;
- nenhum provider tiver sido acoplado;
- nenhuma avaliacao de policy, strategy ou recommendation tiver sido implementada;
- o runtime EDP continuar sendo a unica raiz operacional;
- testes estruturais do skeleton estiverem verdes;
- build e suite total permanecerem sem regressao.

## 14. Architectural Risks

Os principais riscos arquiteturais identificados sao:

- transformar o Model em motor de decisao;
- duplicar responsabilidades do Context;
- misturar estrutura com comportamento;
- acoplar o Model a providers;
- introduzir persistencia precoce;
- usar o Model para antecipar policy, strategy ou recommendation;
- vazar detalhes de transporte para o domínio;
- criar uma segunda fonte de verdade para o estado decisorio.

## 15. Final Architectural Opinion

O Decision Model e arquiteturalmente consistente com H19, H20 e H21 desde que permaneça como artefato estrutural, previsivel e livre de comportamento.

A W4 deve existir apenas para consolidar a forma canônica do decision state, sem absorver responsabilidades de avaliacao, recomendacao, provider execution ou persistencia.

**Final verdict: GO WITH RESTRICTIONS**

## 16. Official Recommendation to Start H21-A-W4

Recomendacao oficial: iniciar a H21-A-W4 apenas como skeleton de Decision Model, com interfaces publicas, factory controlada, normalizacao estrutural e testes de contrato, preservando Decision Inputs e Decision Context como camadas de entrada e evitando qualquer expansao precoce de comportamento.

