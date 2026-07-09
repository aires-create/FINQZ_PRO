# H21-C-W3 - Decision Strategy Design Hardening

## Status
GO WITH RESTRICTIONS

## 1. Executive Objective

Consolidar definitivamente a arquitetura publica da Decision Strategy antes da futura Strategy Resolution, assegurando separacao rigorosa entre intencao estrategica, governanca normativa e comportamentos ainda futuros de resolucao, recomendacao, proposta, simulacao e provider runtime.

Esta review parte do baseline consolidado:

- H19 Enterprise Decision Platform Foundation: GO;
- H20 Enterprise Decision Runtime: GO;
- H21-A Decision Runtime Foundation: GO;
- H21-B Decision Policy Foundation: GO;
- H21-C-W1 Decision Strategy Design Review: GO WITH RESTRICTIONS;
- H21-C-W2 Decision Strategy Skeleton: GO;
- build aprovado;
- suite de testes estabilizada;
- Runtime Foundation preservado.

## 2. Definitive Role of Decision Strategy

Decision Strategy e a camada canonica que declara a intencao executiva predominante do tenant, produto, canal ou campanha. Ela representa o vetor de otimizacao de alto nivel que orienta a futura selecao de estrategia, sem se confundir com a governanca normativa da Decision Policy e sem se antecipar a Strategy Resolution.

A Strategy:

- expressa objetivos executivos;
- e tenant scoped;
- e versionada;
- e publicamente contratual;
- funciona como estrutura de referencia;
- nao executa decisao operacional.

Ela nao:

- decide;
- resolve;
- recomenda;
- materializa proposta;
- simula cenarios;
- aciona provider;
- persiste estado;
- emite eventos;
- executa IA;
- realiza calculos financeiros.

## 3. Official Responsibilities

Responsabilidades oficiais da Decision Strategy:

- declarar a intencao estrategica canonica;
- manter identidade, scope, metadata e state estruturais;
- preservar versionamento e historicidade;
- suportar multipla coexistencia futura de strategies;
- permitir extensibilidade sem quebrar contratos;
- servir como input estruturado para futuras camadas de resolucao e recomendacao;
- manter isolamento de policy, provider e runtime behavior.

## 4. Forbidden Responsibilities

Nao pertencem a Decision Strategy:

- Policy Evaluation;
- Strategy Resolution implementada;
- Recommendation Engine;
- Proposal Runtime;
- Simulation Runtime;
- Provider Runtime;
- calculos financeiros;
- persistencia;
- eventos;
- handlers;
- HTTP;
- frontend;
- repository access;
- UnitOfWork;
- Repository Registry;
- inferencia por IA;
- regras de negocio operacionais;
- decisao final sobre elegibilidade, score, alocacao ou aceite.

## 5. Public Contracts

Os contratos publicos que devem ser considerados canonicos para a Strategy sao:

- `DecisionStrategy`;
- `DecisionStrategyFactory`;
- `DecisionStrategyMetadata`;
- `DecisionStrategyScope`;
- `DecisionStrategyState`;
- `DecisionStrategyVersion`;
- `DecisionStrategyResult`;
- `DecisionStrategyIdentity`;
- `DecisionStrategySnapshot`.

### Public naming rules

- o ponto publico deve usar exportacoes explicitas;
- alias devem ser usados quando houver colisao semantica com outros dominios;
- contratos publicos nao devem depender de `export *` em areas onde nomes homonimos possam surgir;
- a definicao canônica deve permanecer no modulo de origem.

## 6. Internal Contracts

Contratos internos podem existir apenas como suporte estrutural, desde que permaneçam privados ao modulo e nao virem comportamento:

- normalizadores de metadata;
- normalizadores de scope;
- normalizadores de state;
- helpers de snapshot;
- tipos auxiliares de factory input;
- envelopes internos de composicao.

Esses contratos internos nao podem:

- acoplar provider;
- acessar banco;
- implementar estrategia;
- inferir decisao;
- efetivar recomendacao.

## 7. Canonical Objects

Os objetos canônicos da Strategy devem permanecer pequenos e previsiveis:

- identidade da strategy;
- scope da strategy;
- metadata da strategy;
- state da strategy;
- version da strategy;
- snapshot da strategy;
- result estrutural da strategy.

Esses objetos existem para expressar forma e governanca, nao comportamento.

## 8. Factories

A `DecisionStrategyFactory` e o unico mecanismo controlado para montagem da estrutura canonica.

Responsabilidades permitidas:

- montar a estrutura;
- normalizar strings e campos opcionais;
- preservar scope, metadata, state e version;
- garantir forma previsivel;
- manter imutabilidade estrutural.

Responsabilidades proibidas:

- resolver strategy;
- escolher provider;
- consultar repository;
- executar regras de negocio;
- inferir objetivo predominante;
- produzir recomendacao;
- disparar eventos;
- gravar persistencia.

## 9. Canonical States

O estado canonico da Strategy deve permanecer declarativo.

Estado esperado:

- `status`;
- `version`;
- `active`;
- `label`.

Regras:

- state nao deve embutir comportamento;
- state nao deve conter derivacoes ocultas;
- state nao deve carregar resolucao de strategy;
- state nao deve virar engine de lifecycle.

## 10. Scopes

O `DecisionStrategyScope` define o dominio de aplicabilidade da strategy.

Campos canônicos previstos:

- `tenantId`;
- `tenantScope`;
- `domain`;
- `channel`;
- `product`;
- `campaign`;
- `version`.

Regras:

- o scope e delimitacao, nao decisao;
- o scope e tenant aware;
- o scope nao realiza avaliacao;
- o scope nao executa routing;
- o scope nao define provider.

## 11. Metadata

`DecisionStrategyMetadata` registra rastreabilidade e governanca:

- `strategyId`;
- `tenantId`;
- `correlationId`;
- `requestId`;
- `source`;
- `version`;
- `attributes`.

Regras:

- metadata e estrutural;
- metadata nao contem regra de negocio;
- metadata nao deve inferir status;
- metadata nao substitui audit trail;
- metadata nao representa persistencia.

## 12. Versioning

O versionamento da Strategy deve ser formal, explicito e auditavel.

Critérios:

- cada strategy possui identidade e versao;
- alteracoes breaking exigem nova versao ou novo contrato;
- aliases de transicao sao permitidos;
- a semantica da versao deve ser previsivel;
- effective dating, se adotado, deve ser apenas estrutural nesta fase;
- a Strategy antiga permanece como referencia historica.

## 13. Backward Compatibility

Compatibilidade retroativa deve ser preservada por padrao.

Regras:

- nao remover campo publico sem deprecacao;
- nao renomear contrato publico sem alias;
- nao alterar shape de `DecisionStrategyResult` sem review formal;
- nao introduzir dependencia de ordem de importacao;
- nao tornar a compatibilidade dependente de provider ou persistencia.

## 14. Multi-Tenant Evolution

Strategy e sempre tenant scoped.

Evolucao multi-tenant deve respeitar:

- isolamento por tenant;
- possibilidade de overrides por canal, produto ou campanha;
- coexistencia de versoes ativas e historicas;
- ausencia de compartilhamento implicito entre tenants;
- contratos explicitamente destinados a templates, se aprovados em waves futuras.

## 15. Extension Points

Extension points oficiais:

- metadata canônica;
- scope tenant based;
- state estrutural;
- versionamento;
- snapshot;
- aliases publicos;
- future strategy selection boundary;
- future strategy resolution boundary.

Esses pontos permitem crescimento controlado sem transformar Strategy em runtime comportamental.

## 16. Mandatory Invariants

Invariantes obrigatorias:

- `DecisionStrategy` nao resolve strategy;
- `DecisionStrategy` nao recomenda;
- `DecisionStrategy` nao propaga provider logic;
- `DecisionStrategy` nao altera policy;
- `DecisionStrategy` nao cria eventos;
- `DecisionStrategy` nao executa persistencia;
- `DecisionStrategy` nao realiza calculos;
- `DecisionStrategy` permanece separada de `DecisionPolicy`;
- `DecisionStrategy` permanece anterior a qualquer comportamento futuro de Strategy Resolution;
- nenhum contrato H19-C3 pode ser alterado;
- nenhum novo evento pode ser criado;
- nenhum runtime externo pode ser acoplado.

## 17. Rules to Avoid Coupling

Para evitar acoplamento:

- exportacoes publicas devem ser explicitas;
- nomes homonimos devem ser evitados ou aliasados;
- factories devem ser puras;
- contratos devem permanecer pequenos;
- nenhum helper pode chamar provider, repo ou UnitOfWork;
- nenhuma inferencia pode ser codificada no skeleton;
- nenhuma resposta deve depender de estado fora do contract boundary.

## 18. Rules to Avoid Duplication

Para evitar duplicidade:

- uma unica fonte canonica para cada contrato;
- nenhum contrato publico deve ser duplicado em outro modulo com o mesmo significado;
- nenhum `DecisionStrategyState` adicional deve competir com o existente no dominio de aggregates sem alias explicito;
- os pontos de exportacao devem ser controlados;
- a semantica de Strategy nao deve ser reescrita em policy, model ou context.

## 19. Boundaries Between Layers

### Decision Policy

Responsavel por governanca normativa, limites e regras canônicas.

Nao responsavel por:

- estrategia executiva;
- resolucao;
- recomendacao;
- provider.

### Decision Strategy

Responsavel por intencao executiva, escopo, versao e estado canônico.

Nao responsavel por:

- policy evaluation;
- resolucao de strategy;
- recomendacao;
- proposta;
- simulacao;
- provider.

### Strategy Resolution

Futura camada que podera selecionar strategy aplicavel.

Nao deve ser antecipada nesta wave.

### Recommendation Engine

Futura camada que podera transformar estrategia e contexto em recomendacao.

Nao deve ser antecipada nesta wave.

### Proposal Runtime

Futuro runtime de materializacao de proposta.

Nao deve ser antecipado nesta wave.

### Simulation Runtime

Futuro runtime de simulacao.

Nao deve ser antecipado nesta wave.

### Provider Runtime

Futuro runtime de integracao e execucao externa.

Nao deve ser antecipado nesta wave.

## 20. Criteria for Future Strategy Resolution

A futura Strategy Resolution somente sera aceitavel quando:

- Strategy e Policy estiverem separadas por contrato;
- Strategy possuir versionamento e scope estaveis;
- existirem criterios formais de selecao sem heuristica opaca;
- a resolucao nao depender de provider runtime;
- a resolucao nao virar recommendation;
- o caminho de auditoria estiver definido;
- o comportamento puder ser testado estrutural e contractualmente.

## 21. Criteria for Future Recommendation

A futura Recommendation Engine somente sera aceitavel quando:

- Strategy Resolution estiver definida ou ao menos formalizada;
- o contrato de recomendacao estiver separado de provider e proposal;
- recomendacao nao misturar compliance com otimizacao executiva;
- os inputs canônicos estiverem estáveis;
- a recomendação puder ser reproduzida por contrato;
- nenhum estado operacional for inferido silenciosamente.

## 22. Incremental Evolution Criteria

Evolucao incremental aceitavel:

- uma camada por wave;
- um novo contrato por vez;
- factory pura antes de comportamento;
- testes estruturais antes de comportamentos futuros;
- exportacoes publicas controladas;
- nenhuma antecipacao de provider, recommendation ou resolution.

## 23. Architectural Diagram

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
Future Proposal Runtime
   ↓
Future Simulation Runtime
   ↓
Future Provider Runtime
```

Leitura:

- Strategy e a ultima camada canonica estrutural desta macrofase;
- as camadas abaixo dela sao futuras e estao bloqueadas nesta wave;
- a Decision Platform nao deve antecipar comportamento operacional.

## 24. Responsibility Matrix

| Layer | Canonical responsibility | Allowed outputs | Forbidden responsibilities |
|---|---|---|---|
| Decision Inputs | entrada canônica | `DecisionInputs` | negocio, strategy, provider, persistence |
| Decision Context | contexto normalizado | `DecisionContext` | policy, strategy resolution, events |
| Decision Model | composicao estrutural | `DecisionModel` | decisão, recomendação, provider |
| Decision Policy | governanca normativa | `DecisionPolicy` | estrategia executiva, recommendation |
| Decision Strategy | intencao executiva | `DecisionStrategy` | resolution, recommendation, provider |
| Strategy Resolution | futura selecao | `StrategyResolutionResult` futuro | recommendation, provider, persistence |
| Recommendation Engine | futura recomendacao | `RecommendationResult` futuro | provider runtime, proposal runtime |
| Proposal Runtime | futura materializacao | `ProposalResult` futuro | strategy resolution, provider governance |
| Simulation Runtime | futura simulacao | `SimulationResult` futuro | provider execution, policy mutation |
| Provider Runtime | futura execucao externa | provider execution artifacts | decision logic, strategy selection |

## 25. Roadmap for H21-C

### H21-C-W1

Definir a arquitetura da Decision Strategy.

### H21-C-W2

Criar o skeleton canonico da Strategy com contratos publicos, factory e testes estruturais.

### H21-C-W3

Endurecer a arquitetura publica da Strategy, consolidando fronteiras, versionamento e compatibilidade retroativa.

### H21-C-W4

Somente se aprovada por review futura, iniciar a formalizacao da Strategy Resolution como camada independente.

## 26. Files Expected in Future Waves

Arquivos provaveis para futuras waves:

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
- `backend/src/modules/edp/composition/decision-strategy.test.ts`;
- `backend/src/modules/edp/decision-strategy/decision-strategy-resolution/*` apenas se uma wave futura aprovar isso formalmente.

## 27. Files Forbidden in This Wave

Permanecem proibidos nesta wave:

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
- qualquer arquivo de Strategy Resolution;
- qualquer arquivo de Recommendation Engine;
- qualquer arquivo de Proposal Runtime;
- qualquer arquivo de Simulation Runtime;
- qualquer arquivo de Provider Runtime;
- `docs/03-decision-platform/contracts/H19-C3-ENTERPRISE-DECISION-CANONICAL-CONTRACTS.md`;
- `docs/03-decision-platform/events/EVENT-CATALOG-v1.md`;
- `backend/prisma/schema.prisma`;
- `backend/prisma/migrations/*`;
- `frontend/*`;
- qualquer nova composition root;
- qualquer novo Repository Registry;
- qualquer novo UnitOfWork.

## 28. Technical Risks

### Risk 1: Strategy becoming operational logic

Mitigacao:

- manter Strategy apenas como estrutura canonica;
- bloquear branching decisorio;
- proibir heuristica interna;
- exigir review formal para qualquer comportamento.

### Risk 2: semantic collision with other EDP domains

Mitigacao:

- exportacao explicita;
- alias semantico onde necessario;
- contratos pequenos e bem nomeados;
- fonte unica por dominio.

### Risk 3: premature strategy resolution

Mitigacao:

- manter resolucao como future boundary;
- nao criar resolutor;
- nao inferir selection criteria no skeleton.

### Risk 4: coupling to recommendation or provider runtimes

Mitigacao:

- bloquear integrações;
- trabalhar apenas com identifiers e metadata;
- nao incluir comportamento acoplado.

### Risk 5: version drift

Mitigacao:

- versionamento canonico;
- deprecacao planejada;
- compatibilidade por alias;
- tests de export e shape.

## 29. Mitigation Plan

Plano de mitigacao recomendado:

- consolidar nomenclatura publica;
- manter factories puras;
- reforcar testes de isolamento;
- validar exportacoes do ponto publico do EDP;
- bloquear qualquer design de resolution ate review formal;
- usar alias quando houver colisao com estados de aggregate;
- tratar Strategy como fronteira de intencao, nao de execucao.

## 30. Acceptance Criteria

A H21-C-W3 somente deve ser considerada aceita quando:

- a Strategy estiver formalmente consolidada como camada canonica;
- os contratos publicos estiverem estaveis;
- os contratos internos estiverem explicitamente limitados;
- os objetos canônicos e factories estiverem descritos sem comportamento;
- o versionamento e a compatibilidade retroativa estiverem definidos;
- a evolucao multi-tenant estiver mapeada;
- Strategy Resolution, Recommendation Engine, Proposal Runtime, Simulation Runtime e Provider Runtime permanecerem bloqueados;
- nenhuma regra de negocio, persistencia, evento ou IA tiver sido introduzida;
- o build e a suite permanecerem verdes.

## 31. Compliance Checklist

- [x] Papel definitivo da Strategy definido;
- [x] Responsabilidades oficiais definidas;
- [x] Responsabilidades proibidas definidas;
- [x] Contratos publicos mapeados;
- [x] Contratos internos delimitados;
- [x] Objetos canonicos descritos;
- [x] Factories definidas;
- [x] States, scopes, metadata e versionamento consolidados;
- [x] Compatibilidade retroativa definida;
- [x] Evolucao multi-tenant definida;
- [x] Extension points definidos;
- [x] Invariantes obrigatorias registradas;
- [x] Regras contra acoplamento e duplicidade definidas;
- [x] Limites entre Policy, Strategy e futuras camadas explicitados;
- [x] Critérios para future resolution e recommendation definidos;
- [x] Roadmap H21-C consolidado;
- [x] Sem alteracao de Runtime Foundation;
- [x] Sem alteracao de Event Catalog;
- [x] Sem alteracao de H19-C3;
- [x] Sem persistencia, eventos, IA ou provider runtime.

## 32. Final Technical Opinion

A Decision Strategy esta arquiteturalmente consistente e apta para evolucao incremental, desde que permaneça estritamente estrutural nesta fase e nao seja contaminada por Strategy Resolution, Recommendation Engine ou qualquer runtime operacional.

O endurecimento da Strategy deve servir para fixar contratos, nomenclatura e fronteiras, nao para expandir comportamento.

**Final verdict: GO WITH RESTRICTIONS**

## 33. Official Recommendation for H21-D

Recomendacao oficial: iniciar a H21-D somente apos consolidar formalmente a Strategy como contrato canonico estavel e confirmar, por review independente, o desenho da Strategy Resolution como fronteira separada, sem acoplar recommendation, provider, proposal ou simulation.

## 34. Documents to Update After Approval

Os documentos oficiais que deverao ser atualizados apos aprovacao desta review sao:

- `docs/00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md`;
- `docs/03-decision-platform/H21-ENTERPRISE-DECISION-BUSINESS-RUNTIME-ARCHITECTURE.md`;
- `docs/03-decision-platform/reviews/H21-C-W1-DECISION-STRATEGY-DESIGN-REVIEW.md`;
- `docs/03-decision-platform/reviews/H21-C-W2-DECISION-STRATEGY-SKELETON.md` se esse artefato vier a ser formalizado no repositório;
- `docs/03-decision-platform/reviews/H21-C-W3-DECISION-STRATEGY-DESIGN-HARDENING.md`;
- `docs/03-decision-platform/contracts/H19-C3-ENTERPRISE-DECISION-CANONICAL-CONTRACTS.md` apenas se uma wave futura formalizar novos contratos para Strategy Resolution;
- `docs/03-decision-platform/reviews/H21-C-W4-...` somente se a próxima wave for aprovada.
