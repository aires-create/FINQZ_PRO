# H21-C-W1 - Decision Strategy Design Review

## Status
GO WITH RESTRICTIONS

## 1. Objective of the Review

Definir a arquitetura canonica da camada Decision Strategy para o FINQZ PRO Enterprise, preservando integralmente a arquitetura existente do Decision Runtime, o Runtime Foundation e a separacao entre definicao, avaliacao, estrategia e comportamentos futuros.

Esta revisao e conduzida sobre o baseline consolidado:

- H19 Enterprise Decision Platform Foundation: GO;
- H20 Enterprise Decision Runtime: GO;
- H21-A Decision Runtime Foundation: GO;
- H21-B Decision Policy Foundation: GO;
- build aprovado;
- suite de testes estabilizada;
- Runtime Foundation preservado;
- Decision Policy consolidada.

O objetivo desta wave e estabelecer a Strategy como camada estrutural canonica, versionada e tenant scoped, sem qualquer comportamento de resolucao, recomendacao, proposta, simulacao, provider runtime, IA ou persistencia.

## 2. Logical Evolution Diagram of the Decision Platform

```text
Decision Inputs
   ↓
Decision Context
   ↓
Decision Model
   ↓
Decision Policy
   ↓
Decision Strategy
   ↓
Future Strategy Resolution
   ↓
Future Recommendation Engine
   ↓
Future Proposal Runtime / Simulation Runtime / Provider Runtime
```

Leitura arquitetural:

- Decision Inputs capturam a entrada canonica;
- Decision Context normaliza o contexto de execucao;
- Decision Model consolida a estrutura da decisao;
- Decision Policy define a governanca normativa;
- Decision Strategy representa a intencao executiva do tenant, produto, canal ou campanha;
- Strategy Resolution, Recommendation Engine e demais runtimes permanecem futuros e bloqueados nesta wave.

## 3. Role of Decision Strategy in the Business Runtime

Decision Strategy e a camada estrutural que declara o objetivo executivo predominante do tenant e o seu perfil de orientacao para a decisao.

Ela existe para:

- expressar intencao estrategica;
- ser tenant scoped;
- ser versionada de forma canonica;
- carregar metadados de governanca;
- servir como fronteira para futuras ondas de priorizacao e selecao;
- manter separacao clara entre objetivo executivo e mecanismo tatico de policy.

Ela nao existe para:

- decidir;
- avaliar policy;
- resolver strategy;
- recomendar;
- produzir proposta;
- executar simulacao;
- chamar provider;
- persistir estado;
- emitir eventos;
- executar calculos financeiros;
- usar IA para inferencia.

## 4. Relationship Between Decision Strategy, Decision Policy, Decision Model, Decision Context and Decision Inputs

### 4.1 Decision Inputs

Entrada canonica normalizada de dados.

### 4.2 Decision Context

Normalizacao da execucao e do ambiente de decisao.

### 4.3 Decision Model

Composicao estrutural da decisao, agregando contexto e inputs.

### 4.4 Decision Policy

Governanca normativa da decisao.

### 4.5 Decision Strategy

Intencao executiva canonicamente declarada.

Relacao arquitetural:

- Inputs alimentam o Context;
- Context e Inputs compoem o Model;
- Policy define limites, prioridades e governanca;
- Strategy declara o objetivo predominante e o vetor executivo de otimizacao;
- Policy e Strategy permanecem separadas, sem fusao semantica.

Em termos de precedencia:

- Strategy nao substitui Policy;
- Policy nao substitui Strategy;
- Model nao decide;
- Context nao executa governanca;
- Inputs nao carregam inferencia.

## 5. What Belongs to Strategy

Pertence a Decision Strategy:

- identidade canonica da strategy;
- scope tenant based;
- versionamento explicito;
- metadata de governanca;
- estado estrutural da strategy;
- janela de vigencia, quando formalizada em contrato;
- objetivo executivo predominante;
- referencias canonicas para futura selecao e orquestracao.

## 6. What Does Not Belong to Strategy

Nao pertence a Decision Strategy:

- policy evaluation;
- strategy resolution implementada;
- recommendation engine;
- proposal runtime;
- simulation runtime;
- provider runtime;
- calculos financeiros;
- persistencia;
- eventos;
- repositorios;
- UnitOfWork;
- Repository Registry;
- controller HTTP;
- DTO de transporte;
- comportamento inferencial;
- regras de negocio operacionais;
- IA;
- qualquer decisao final sobre elegibilidade, score ou aceitagao.

## 7. How to Keep Policy and Strategy Decoupled

Decision Policy e Decision Strategy devem permanecer desacopladas por contrato e por responsabilidade.

Regras de separacao:

- Policy representa governanca normativa;
- Strategy representa objetivo executivo;
- Policy nao deve carregar semantica de otimizacao executiva;
- Strategy nao deve carregar mecanismo de compliance operacional;
- nenhuma das duas deve assumir papel da outra;
- a composicao entre ambas deve ocorrer apenas por contratos canonicos, sem branch decisorio ou inferencia;
- qualquer integracao futura deve ser orientada por factories e modelos estruturais, nunca por comportamento embutido.

Mitigacoes recomendadas:

- exportacoes publicas explicitamente nomeadas;
- namespaces semanticos separados;
- aliases quando houver colisao de nomes;
- contratos pequenos e imutaveis;
- testes estruturais focados em forma e nao em comportamento.

## 8. How to Support Multiple Strategies in the Future

A camada Strategy deve nascer preparada para multiplas strategies por:

- strategy por tenant;
- strategy por canal;
- strategy por produto;
- strategy por campanha;
- strategy por jornada;
- strategy por dominio de decisao.

Principios:

- uma strategy nao substitui a outra sem versao formal;
- o modelo deve permitir coexistencia de strategies ativas e historicas;
- a selecao futura de strategy deve ser feita por contract boundary, nao por regra embutida;
- o core estrutural deve suportar registro, referencia e snapshot sem escolher strategy.

## 9. How to Support Multi-Tenant

Decision Strategy deve ser sempre tenant scoped.

Critérios:

- tenantId ou referencia equivalente deve estar presente no contract boundary;
- uma strategy pertence a um tenant por definicao;
- templates podem existir como artefato abstrato, mas strategy canonica nao deve cruzar tenants por default;
- a factorizacao deve preservar isolamento sem acoplamento ao runtime de provider ou persistencia;
- qualquer heranca ou override multi-tenant deve ser formalizada em contrato, nao inferida.

## 10. How to Support Strategy Versioning

O versionamento da Decision Strategy deve ser explicito, previsivel e compativel com auditoria futura.

Regras:

- toda strategy deve possuir identidade e versao canonicas;
- versoes anteriores permanecem preservadas como referencia estrutural;
- mudancas breaking exigem nova versao ou novo contrato;
- o alias publico pode ser usado para preservar compatibilidade;
- o estado da strategy deve ser distinguido da sua versao;
- effective dating, se adotado, deve ser apenas estrutural nesta wave.

## 11. How to Avoid Provider Runtime Coupling

Strategy nao pode depender de provider runtime.

Proibicoes:

- leitura de provider repository;
- resolucao de provider por strategy;
- mapping de provider capability dentro do core da strategy;
- calculo de disponibilidade ou roteamento de provider.

Permitido:

- referencias estruturais futuras para compatibilidade;
- identificadores canônicos sem resolucao operacional;
- metadata que permita extension points futuros.

## 12. How to Avoid Recommendation Engine in This Phase

A Recommendation Engine deve permanecer fora desta wave.

Strategy nao pode:

- classificar ofertas;
- gerar ranking;
- produzir recomendacao;
- inferir melhor alternativa;
- chamar AI para recomendacao;
- acoplar pontuacao ou ranking ao contrato estrutural.

A estrategia pode, no futuro, ser um insumo da recomendacao, mas nunca a implementacao dela.

## 13. How to Avoid Proposal Runtime

Proposal Runtime e uma responsabilidade posterior e separada.

Strategy nao deve:

- materializar proposta;
- gerar payload de proposta;
- persistir proposta;
- alterar estado de proposta;
- chamar adaptadores de proposta.

Se a Strategy precisar referenciar proposta futuramente, isso deve ocorrer apenas por identificadores e contratos canonicos, nunca por execucao.

## 14. How to Avoid Simulation Runtime

Simulation Runtime permanece bloqueado.

Strategy nao deve:

- executar cenarios;
- comparar variantes;
- avaliar simulacoes;
- produzir resultados hipoteticos;
- misturar estado simulado com estado canonico.

## 15. How to Avoid IA in This Layer

IA nao pertence a camada Decision Strategy nesta fase.

Ficam proibidos:

- inferencia por LLM;
- sugestao automatica de strategy;
- classificacao probabilistica;
- enriquecimento sem contrato canonico;
- heuristicas opacas.

## 16. Public Contracts That Should Exist

Os contratos publicos recomendados para a futura implementacao da camada Decision Strategy sao:

- `DecisionStrategy`;
- `DecisionStrategyFactory`;
- `DecisionStrategyMetadata`;
- `DecisionStrategyScope`;
- `DecisionStrategyState`;
- `DecisionStrategyVersion`;
- `DecisionStrategyResult`;
- `DecisionStrategyIdentity`;
- `DecisionStrategySnapshot`.

Notas de nomenclatura:

- os contratos devem ser semanticamente claros e separados dos contratos de Policy;
- nomes muito genericos devem ser evitados em ponto publico agregado;
- se houver colisao com estados ou identidades de outros dominios, o ponto publico deve usar alias explicito.

## 17. Required Factories

A futura implementacao deve prever, no minimo:

- `DecisionStrategyFactory` para montar a estrutura canonica;
- factories auxiliares apenas se forem puramente estruturais e aprovadas por review posterior.

Responsabilidades permitidas da factory:

- montar a estrutura;
- normalizar metadata;
- consolidar scope e versionamento;
- preservar imutabilidade estrutural.

Responsabilidades proibidas da factory:

- consultar provider;
- consultar banco;
- executar regra de negocio;
- inferir strategy aplicavel;
- resolver strategy;
- produzir recomendacao.

## 18. Required Canonical Models

A camada Strategy deve ser representada por modelos canônicos pequenos e previsiveis:

- strategy identity;
- strategy scope;
- strategy metadata;
- strategy state;
- strategy version;
- strategy snapshot;
- strategy result estrutural.

Esses modelos devem existir apenas como forma canonica, nao como motor de decisao.

## 19. Public Interfaces Recommended

Interfaces publicas recomendadas:

- `DecisionStrategy` como contrato central;
- `DecisionStrategyFactory` como construtor controlado;
- `DecisionStrategyMetadata` como envelope de governanca;
- `DecisionStrategyScope` como delimitacao canonica;
- `DecisionStrategyVersion` como contrato de versao;
- `DecisionStrategyState` como estado estrutural;
- `DecisionStrategyResult` como saida estrutural;
- `DecisionStrategyIdentity` e `DecisionStrategySnapshot` como tipos de suporte.

## 20. Extension Points

Os extension points oficiais da Strategy devem ser:

- metadata canônica;
- scope tenant based;
- versionamento;
- effective window, se formalizado;
- state estruturado;
- snapshot de definicao;
- aliases publicos para compatibilidade;
- future strategy selection boundary;
- future strategy resolution boundary.

Esses pontos devem ser suficientes para evolucao sem quebrar o core estrutural.

## 21. Architectural Invariants

As seguintes invariantes sao obrigatorias:

- `DecisionStrategy` nao executa estrategia;
- `DecisionStrategy` nao resolve strategy;
- `DecisionStrategy` nao recomenda;
- `DecisionStrategy` nao produz proposta;
- `DecisionStrategy` nao executa simulacao;
- `DecisionStrategy` nao aciona provider;
- `DecisionStrategy` nao persiste estado;
- `DecisionStrategy` nao emite eventos;
- `DecisionStrategy` nao executa IA;
- `DecisionStrategy` permanece separada de `DecisionPolicy`;
- `DecisionStrategy` permanece posterior ao `DecisionModel` na cadeia conceitual;
- nenhum contrato H19-C3 pode ser alterado;
- nenhum novo evento pode ser introduzido;
- nenhum comportamento de negocio pode entrar nesta wave.

## 22. Acceptance Criteria for H21-C-W1

A H21-C-W1 somente deve ser considerada aceita quando:

- a Decision Strategy estiver definida como camada canonica, tenant scoped e versionada;
- a fronteira entre Policy e Strategy estiver explicitamente documentada;
- os contratos publicos recomendados estiverem mapeados;
- os extension points estiverem claros;
- nenhuma resolucao de strategy tiver sido implementada;
- nenhuma recomendacao, proposta, simulacao, provider runtime ou IA tiver sido introduzida;
- nenhuma persistencia, evento ou regra de negocio tiver sido adicionada;
- o build e a suite continuarem verdes;
- a arquitetura permanecer compatível com H19, H20, H21-A e H21-B.

## 23. Files That May Be Created in a Future Implementation

Arquivos provaveis para a futura implementacao:

- `backend/src/modules/edp/decision-strategy/decision-strategy.ts`;
- `backend/src/modules/edp/decision-strategy/decision-strategy-factory.ts`;
- `backend/src/modules/edp/decision-strategy/decision-strategy-metadata.ts`;
- `backend/src/modules/edp/decision-strategy/decision-strategy-scope.ts`;
- `backend/src/modules/edp/decision-strategy/decision-strategy-state.ts`;
- `backend/src/modules/edp/decision-strategy/decision-strategy-version.ts`;
- `backend/src/modules/edp/decision-strategy/decision-strategy-result.ts`;
- `backend/src/modules/edp/decision-strategy/decision-strategy-identity.ts`;
- `backend/src/modules/edp/decision-strategy/decision-strategy-snapshot.ts`;
- `backend/src/modules/edp/decision-strategy/index.ts`;
- `backend/src/modules/edp/composition/decision-strategy.ts`;
- `backend/src/modules/edp/composition/decision-strategy.test.ts`.

## 24. Blocked Files in This Wave

Permanecem bloqueados nesta wave:

- `backend/src/core/http/fastify.ts`;
- `backend/src/modules/edp/application/runtime-foundation.ts`;
- `backend/src/modules/edp/application/command-handlers.ts`;
- `backend/src/modules/edp/application/query-handlers.ts`;
- `backend/src/modules/edp/presentation/http/edp.controller.ts`;
- `backend/src/modules/edp/presentation/http/edp.routes.ts`;
- `backend/src/modules/edp/decision-policy/*`;
- `backend/src/modules/edp/decision-model/*`;
- `backend/src/modules/edp/decision-context/*`;
- `backend/src/modules/edp/decision-inputs/*`;
- `docs/03-decision-platform/contracts/H19-C3-ENTERPRISE-DECISION-CANONICAL-CONTRACTS.md`;
- `docs/03-decision-platform/events/EVENT-CATALOG-v1.md`;
- `backend/prisma/schema.prisma`;
- `backend/prisma/migrations/*`;
- `frontend/*`;
- qualquer provider runtime;
- qualquer nova composition root;
- qualquer Repository Registry novo;
- qualquer UnitOfWork novo.

## 25. Mandatory Structural Tests

Os testes estruturais obrigatorios para a futura implementacao devem comprovar:

- criacao de `DecisionStrategy`;
- preservacao de metadata, scope, state e version;
- composicao correta da estrutura canonica;
- ausencia de comportamento de estrategia;
- ausencia de resolucao;
- ausencia de recomendacao;
- ausencia de provider runtime;
- ausencia de persistencia;
- ausencia de eventos;
- exportacoes publicas funcionando;
- estabilidade de nomenclatura publica;
- isolamento arquitetural entre Policy e Strategy.

## 26. Architectural Risks

### Risk 1: Strategy becoming a decision engine

Mitigacao:

- manter Strategy apenas como estrutura canônica;
- proibir branching decisorio;
- exigir review formal antes de qualquer comportamento.

### Risk 2: policy and strategy collapsing into one concept

Mitigacao:

- contratos distintos;
- responsabilidades distintas;
- exportacoes publicas com nomes sem ambiguidades;
- testes de isolamento semantico.

### Risk 3: version drift and backward incompatibility

Mitigacao:

- versionamento explicito;
- aliases de transicao;
- contratos pequenos;
- review obrigatoria para breaking changes.

### Risk 4: premature coupling with provider, recommendation or proposal

Mitigacao:

- bloquear integrações;
- manter apenas identificadores e metadata;
- nao introduzir resolucao nem comportamento.

### Risk 5: multi-tenant semantics leaking into runtime behavior

Mitigacao:

- tenant scope formalizado em contrato;
- sem inferencia automatica;
- sem persistencia como fonte de verdade nesta wave.

## 27. Evolution Strategy for H21-C-W2

A H21-C-W2 deve ser reservada para a implementacao estrutural canonica da Decision Strategy, com foco em:

- modelagem da estrutura base;
- factory controlada;
- exports publicos;
- testes estruturais;
- preservacao da separacao Policy vs Strategy.

O que deve permanecer fora da W2:

- Strategy Resolution;
- Recommendation Engine;
- Proposal Runtime;
- Simulation Runtime;
- Provider Runtime;
- IA;
- persistencia;
- eventos;
- regras de negocio;
- calculos financeiros.

## 28. Compliance Checklist

- [x] Strategy definida como camada canonica e estruturada;
- [x] Separacao clara entre Policy e Strategy;
- [x] Multi-tenant previsto por contrato;
- [x] Versionamento canonico previsto;
- [x] Extension points definidos;
- [x] Contratos publicos recomendados;
- [x] Factories permitidas mapeadas;
- [x] Modelos canônicos mapeados;
- [x] Testes estruturais obrigatorios definidos;
- [x] Sem alteracao de Runtime Foundation;
- [x] Sem alteracao de Event Catalog;
- [x] Sem alteracao de H19-C3;
- [x] Sem persistencia, eventos, IA ou provider runtime.

## 29. Final Technical Opinion

A Decision Strategy deve nascer como camada explicita de intencao executiva, separada da Policy, versionada e tenant scoped, mas ainda totalmente estrutural nesta fase.

O principal risco da H21-C e permitir que a Strategy vire um motor de decisao disfarçado. Para evitar isso, a wave precisa manter contratos pequenos, exportacoes controladas e nenhuma antecipacao de resolucao, recomendacao ou provider logic.

**Final verdict: GO WITH RESTRICTIONS**

## 30. Official Recommendation for H21-C-W2

Recomendacao oficial: iniciar a H21-C-W2 apenas com o skeleton canonico de Decision Strategy, factories controladas, interfaces publicas e testes estruturais, mantendo Strategy Resolution, Recommendation Engine, Proposal Runtime, Simulation Runtime, Provider Runtime e IA como fronteiras futuras separadas.
