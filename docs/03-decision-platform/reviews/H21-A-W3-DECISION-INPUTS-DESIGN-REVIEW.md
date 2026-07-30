# H21-A-W3 - Decision Inputs Design Review

## Status
GO WITH RESTRICTIONS

## 1. Objective of the Review

Validar a arquitetura dos Decision Inputs antes de qualquer implementacao, garantindo aderencia aos principios de H19, H20 e H21, sem introduzir regra de negocio, persistencia, provider logic ou qualquer forma de duplicacao de runtime.

Esta revisao considera o estado atual da plataforma como base consolidada:

- H20 encerrada com GO;
- H21 Architecture publicada;
- H21-A Design Review publicada;
- H21-A-W1 Decision Runtime Skeleton concluida;
- H21-A-W2 Decision Context Skeleton concluida;
- build aprovado;
- suite de testes estabilizada.

## 2. Role of the Decision Inputs in the Decision Runtime

Os Decision Inputs sao a camada canonica de entrada de dados brutos e normalizaveis do Decision Runtime. Eles representam o ponto onde a intencao de execucao e os dados operacionais entram no dominio decisorio antes de serem convertidos em contexto formal.

Os inputs nao decidem, nao avaliam policy, nao resolvem strategy e nao executam providers. Sua responsabilidade e transportar, validar estruturalmente e preparar os dados de entrada para a construcao do Decision Context.

Em termos arquiteturais, os Decision Inputs funcionam como a fronteira inicial entre contratos canonicos de entrada e o contexto decisorio normalizado.

## 3. Relationship Between Decision Inputs and Decision Context

A relacao entre Decision Inputs e Decision Context e sequencial e unilateral:

- os Decision Inputs sao a materia-prima de entrada;
- o Decision Context e a representacao normalizada, estruturada e pronta para uso do runtime;
- a factory de contexto consome inputs e produz contexto;
- o contexto nao deve depender do formato bruto dos inputs para operar.

Isso preserva a separacao entre transporte e execucao decisoria.

## 4. What Belongs to the Inputs and What Belongs to the Context

### Belongs to the Decision Inputs

- payloads canonicos de entrada;
- command envelope de entrada;
- identificadores de tenant e principal;
- correlation e causation brutos;
- idempotency key;
- metadata operacional de entrada;
- referencias de aggregate e command;
- campos auxiliares de transporte necessarios para normalizacao inicial.

### Belongs to the Decision Context

- tenant normalizado;
- principal normalizado;
- aggregate normalizado;
- command normalizado;
- correlation normalizada;
- causation normalizada;
- idempotency normalizada;
- audit context;
- metadata canonica de execucao;
- execution context efetivo do runtime.

### Does Not Belong to Either as Business Logic

- policy evaluation;
- strategy resolution;
- recommendation;
- simulation;
- provider execution;
- calculos;
- persistencia;
- emissao de eventos;
- qualquer decisao de negocio derivada.

## 5. Expected Interfaces

As interfaces esperadas para a W3 devem ser estritamente estruturais e publicas.

### DecisionInputs
Contrato canonico de entrada bruta ou semi-normalizada que alimenta o runtime de decisao.

### DecisionInputsFactory
Factory responsavel por construir ou agrupar inputs a partir de contratos canonicos ja existentes, sem executar regra de negocio.

### DecisionInputEnvelope
Envelope de entrada que carrega os dados tecnicos e canonicos necessarios para a montagem dos inputs.

### DecisionInputMetadata
Metadados de entrada associados ao envelope, incluindo correlacao, rastreabilidade e origem.

### DecisionInputPrincipal
Representacao do principal na forma de entrada, antes da normalizacao total para o contexto.

### DecisionInputTenantContext
Representacao do tenant na forma de entrada, incluindo escopo e referencia operacional.

### DecisionInputCommand
Representacao canonicamente estruturada do command de entrada.

### DecisionInputAggregate
Representacao canonicamente estruturada do aggregate de entrada.

## 6. Permitted Factories and Normalizers

Os Decision Inputs podem usar apenas factories e normalizers com responsabilidade de forma, nunca de decisao.

### Permitted

- factory de montagem de inputs;
- normalizadores de string e optional string;
- normalizadores de metadata para estruturas imutaveis ou read-only;
- adaptadores de shape para alinhar envelopes canonicos ao formato esperado;
- validadores estruturais de campos obrigatorios e formato basico.

### Forbidden

- policy evaluators;
- strategy selectors;
- recommendation builders;
- provider resolvers;
- repositories de persistencia;
- calculadoras de dominio;
- mappers que inferem regra de negocio;
- qualquer normalizador que altere significado de negocio.

## 7. How to Avoid Business Logic in the Inputs

Para evitar regra de negocio nos inputs, a implementacao deve respeitar os seguintes limites:

- inputs nao podem decidir se uma entrada e elegivel;
- inputs nao podem escolher policy, strategy ou provider;
- inputs nao podem enriquecer dados com heuristicas de dominio;
- inputs nao podem consultar persistencia para completar informacao;
- inputs nao podem emitir eventos;
- inputs nao podem materializar resultado decisorio.

A funcao do input e estrutural. Qualquer enrichment semantico deve acontecer depois, no runtime apropriado, e apenas se previsto em contrato.

## 8. How to Avoid Provider Coupling

Os Decision Inputs nao devem depender de provider logic direta ou indiretamente.

Para evitar acoplamento com providers:

- nao importar contratos de provider execution;
- nao consultar registries de providers;
- nao derivar fields operacionais de disponibilidade externa;
- nao usar provider metadata como source of truth do dominio;
- nao incluir fallback de negocio baseado em capacidade de provider;
- nao acoplar input shape a detalhes de integracao.

Provider behavior pertence a ondas posteriores e a fronteiras especificas, nao ao skeleton de entrada do Decision Runtime.

## 9. How to Keep Backend First, Contracts Before Runtime, and Single Source of Truth

### Backend First

Atendido quando os Decision Inputs nascem no backend a partir de contratos canonicos e nao de DTOs de frontend.

### Contracts Before Runtime

Atendido quando o formato dos inputs e definido por contratos e reviews formais antes de qualquer implementacao de comportamento.

### Single Source of Truth

Atendido quando:

- o contrato canonicamente publico e a fonte da forma de entrada;
- o Decision Context continua sendo a fonte do estado normalizado;
- o runtime EDP permanece a unica raiz operacional do dominio.

## 10. Files That May Be Created in W3

Os arquivos abaixo sao candidatos provaveis e aceitaveis para a H21-A-W3, sujeitos a implementacao incremental e revisao:

- `backend/src/modules/edp/composition/decision-inputs.ts`
- `backend/src/modules/edp/composition/decision-inputs.test.ts`
- `backend/src/modules/edp/composition/index.ts` apenas para exportacao publica do novo skeleton
- `backend/src/modules/edp/composition/decision-context.ts` somente se houver integracao minima e justificada entre inputs e contexto

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

A implementacao futura da W3 deve ser acompanhada de testes estruturais obrigatorios que comprovem:

- criacao dos Decision Inputs;
- preservacao de tenant/principal/correlation/causation/idempotency;
- normalizacao basica sem perda de informacao canonica;
- ausencia de regra de negocio;
- ausencia de dependencia de provider;
- ausencia de persistencia;
- ausencia de acoplamento com HTTP DTOs;
- exportacao publica funcionando pelo ponto adequado;
- compatibilidade estrutural com o Decision Context.

Os testes devem verificar forma e isolamento, nao comportamento de negocio.

## 13. Acceptance Criteria

A H21-A-W3 somente deve ser considerada aceita quando:

- os Decision Inputs estiverem definidos como camada canônica de entrada;
- a relacao com o Decision Context estiver clara, unidirecional e sem ambiguidade;
- nenhuma regra de negocio tiver sido introduzida;
- nenhuma persistencia tiver sido adicionada;
- nenhum provider tiver sido acoplado;
- o backend permanecer como fonte da definicao estrutural;
- o runtime EDP continuar sendo a unica raiz operacional;
- testes estruturais do skeleton estiverem verdes;
- build e suite total permanecerem sem regressao.

## 14. Architectural Risks

Os principais riscos arquiteturais identificados sao:

- transformar inputs em mini-runtime;
- misturar normalizacao estrutural com decisao de negocio;
- duplicar responsabilidades do Decision Context;
- acoplar inputs a provider execution;
- usar inputs para inferir estrategia ou policy;
- introduzir persistencia precoce;
- vazar DTOs de transporte para a fronteira canônica;
- criar uma segunda fonte de verdade para a entrada decisoria.

## 15. Final Architectural Opinion

Os Decision Inputs sao arquiteturalmente consistentes com H19, H20 e H21, desde que permaneçam estritamente como camada de entrada estrutural do Decision Runtime.

A W3 deve existir apenas para organizar, validar e preparar a entrada canonica antes da construcao do Decision Context, sem absorver responsabilidade de negocio, persistencia ou provider logic.

**Final verdict: GO WITH RESTRICTIONS**

## 16. Official Recommendation to Start H21-A-W3

Recomendacao oficial: iniciar a H21-A-W3 apenas como skeleton de Decision Inputs, com interfaces publicas, factory controlada, normalizadores estruturais e testes de contrato, preservando o Decision Context como a forma normalizada oficial e evitando qualquer expansao precoce de comportamento.
