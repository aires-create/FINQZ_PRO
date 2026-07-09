# H21-B-W3 - Decision Policy Evaluation Design Hardening

## Status
GO WITH RESTRICTIONS

## 1. Objective of the Review

Revisar e endurecer a arquitetura da camada Decision Policy Evaluation antes de qualquer evolucao adicional, garantindo estabilidade de contratos publicos, clareza semantica e separacao rigorosa entre definicao de policy, avaliacao de policy e comportamentos futuros de decisao.

Esta revisao parte do baseline consolidado:

- H19 Enterprise Decision Platform Foundation: GO;
- H20 Enterprise Decision Runtime: GO;
- H21-A Decision Runtime Foundation: GO;
- H21-B-W1 Decision Policy Design Review: GO WITH RESTRICTIONS;
- H21-B-W2 Decision Policy Evaluation Skeleton: GO;
- build aprovado;
- suite de testes estabilizada;
- Runtime Foundation preservado.

## 2. Logical Evolution Diagram of the Decision Platform

```text
Decision Inputs
   ↓
Decision Context
   ↓
Decision Model
   ↓
Decision Policy Definition
   ↓
Decision Policy Evaluation
   ↓
Future Strategy Resolution
   ↓
Future Recommendation Engine
   ↓
Future Provider / Proposal / Simulation Runtimes
```

Leitura arquitetural:

- Decision Inputs capturam a entrada canônica;
- Decision Context normaliza a execucao;
- Decision Model consolida a estrutura da decisao;
- Decision Policy Definition representa a definicao normativa;
- Decision Policy Evaluation produz apenas um envelope avaliativo estrutural;
- Strategy Resolution, Recommendation Engine e demais capacidades permanecem futuras.

## 3. Role of Decision Policy Evaluation in the Decision Runtime

Decision Policy Evaluation e a camada estrutural responsavel por encapsular a relacao entre o Decision Model e a Decision Policy, produzindo um resultado avaliativo canônico sem executar negocio real.

Ela existe para:

- formalizar a interface entre definicao de policy e futura decisao;
- carregar metadados de avaliacao;
- preservar rastreabilidade e versionamento;
- servir como base para evolucionar para Policy Evaluation real em ondas posteriores.

Ela nao existe para:

- decidir;
- inferir elegibilidade;
- escolher strategy;
- recomendar;
- persistir;
- emitir eventos;
- executar provider logic;
- realizar calculos;
- usar IA.

## 4. Separation Between Policy Definition, Policy Evaluation, Strategy Resolution and Recommendation

### 4.1 Decision Policy Definition

Camada de definicao canonica da politica.

Responsabilidade:

- descrever a politica;
- versionar a politica;
- expor scope, metadata e state;
- servir como entrada para avaliacao.

Nao responsabilidade:

- avaliar o contexto;
- decidir;
- inferir resultado.

### 4.2 Decision Policy Evaluation

Camada que relaciona `DecisionModel` e `DecisionPolicy`.

Responsabilidade:

- carregar a composicao avaliativa;
- consolidar metadados;
- devolver um resultado estrutural;
- manter previsibilidade de contrato.

Nao responsabilidade:

- strategy resolution;
- recommendation;
- provider execution;
- persistencia;
- eventos.

### 4.3 Strategy Resolution

Camada futura.

Responsabilidade futura:

- escolher strategy aplicavel;
- considerar policy evaluation e contexto;
- produzir justificativa de selecao.

Status nesta wave:

- nao implementada;
- nao contratada como comportamento;
- apenas citada como fronteira futura.

### 4.4 Recommendation Engine

Camada futura.

Responsabilidade futura:

- converter strategy e contexto em recomendacao;
- produzir artefato recomendatorio canônico.

Status nesta wave:

- nao implementada;
- nao contratada como comportamento.

## 5. Matrix of Responsibilities by Layer

| Layer | Canonical responsibility | Allowed outputs | Forbidden responsibilities |
|---|---|---|---|
| Decision Inputs | capturar entrada canônica | `DecisionInputs` | negocio, policy, strategy, persistence |
| Decision Context | normalizar execucao | `DecisionContext` | negocio, provider, eventos |
| Decision Model | consolidar estrutura da decisao | `DecisionModel` | decisao, rule engine, persistencia |
| Decision Policy Definition | definir a politica | `DecisionPolicy` | avaliar, decidir, recomendar |
| Decision Policy Evaluation | estruturar a avaliacao | `DecisionPolicyEvaluation`, `DecisionPolicyEvaluationResult` | strategy resolution, recommendation, provider runtime |
| Strategy Resolution | futura selecao de strategy | `StrategyResolutionResult` futuro | avaliacao de policy, recommendation |
| Recommendation Engine | futura recomendacao | `RecommendationResult` futuro | provider execution, persistencia |

## 6. Existing Public Contracts

Os contratos publicos ja existentes nesta area devem ser considerados canonicos e estaveis:

- `DecisionPolicy`;
- `DecisionPolicyFactory`;
- `DecisionPolicyMetadata`;
- `DecisionPolicyScope`;
- `DecisionPolicyState`;
- `DecisionPolicyResult`;
- `DecisionPolicyEvaluation`;
- `DecisionPolicyEvaluationFactory`;
- `DecisionPolicyEvaluationFactoryInput`;
- `DecisionPolicyEvaluationMetadata`;
- `DecisionPolicyEvaluator`;
- `DecisionPolicyEvaluationResult`;
- `DecisionPolicyEvaluationResultState`.

### Public naming note

Para evitar colisao com o `DecisionPolicyState` do dominio de lifecycle, a nomenclatura publica da camada de policy deve ser tratada como namespace semantico da policy, preferencialmente com exportacao explicita e, quando necessario, aliases mais especificos.

Exemplo de estrategia de nomenclatura canonica:

- `DecisionPolicyState` permanece valido no modulo de policy;
- `DecisionPolicyDefinitionState` ou alias equivalente pode ser usado em ponto publico agregado;
- o ponto de exportacao nao deve expor ambiguidades de nome entre dominios distintos.

## 7. Contracts Expected for Future Waves

Os contratos abaixo sao previstos, mas devem permanecer fora desta wave:

- `StrategyResolution`;
- `StrategyResolutionFactory`;
- `StrategyResolutionResult`;
- `RecommendationEngine`;
- `RecommendationFactory`;
- `RecommendationResult`;
- `DecisionPolicyEvaluationPolicy` ou contract auxiliar de avaliacao, apenas se formalizado em review posterior;
- contratos de extensao para selective evaluation, explainability e trace envelopes, se aprovados.

## 8. Public Versioning Criteria

A Decision Policy deve evoluir com versionamento explicito e previsivel.

Critérios formais:

- toda mudanca estrutural relevante deve manter identificador de versao canonico;
- mudancas breaking exigem review formal e, se necessario, nova versao do contrato;
- aliases publicos podem ser introduzidos para preservar compatibilidade;
- a semantica da policy nao deve depender de implementacao interna;
- o estado da policy e o estado da avaliacao devem ter versionamento independente quando necessario.

## 9. Backward Compatibility Rules

Para preservar compatibilidade retroativa:

- nao remover campos publicos sem estrategia de deprecacao;
- nao renomear contratos canonicos sem alias de transicao;
- nao alterar a forma do resultado avaliativo sem novo contrato ou nova versao;
- nao mudar significado de campos existentes;
- nao acoplar a compatibilidade a behavior de provider ou persistencia;
- nao depender de ordem de importacao para estabilidade de tipos.

## 10. Extension Points

Os pontos oficiais de extensao desta arquitetura sao:

- metadata canônica;
- scope da policy;
- state da policy;
- state da evaluacao;
- trace e audit metadata estruturais;
- contract aliases publicos;
- normalized evaluation envelope;
- future strategy resolution boundary;
- future recommendation boundary.

Esses pontos permitem evolucao sem romper o core estrutural.

## 11. Architectural Invariants

As seguintes invariantes devem permanecer obrigatorias:

- `DecisionPolicy` nao executa negocio;
- `DecisionPolicyEvaluation` nao executa strategy resolution;
- `DecisionPolicyEvaluationResult` nao produz recomendacao;
- `DecisionModel` permanece anterior a policy evaluation;
- `DecisionContext` permanece anterior ao model;
- `DecisionInputs` permanecem a entrada canônica;
- nenhum contrato da H19-C3 pode ser alterado;
- nenhum novo evento pode ser introduzido;
- nenhum provider runtime pode ser acoplado;
- nenhuma persistencia pode entrar na wave.

## 12. Boundaries Between Policy Evaluation and Business Behavior

Policy Evaluation deve ficar estritamente no plano estrutural.

Permanece permitido:

- receber `DecisionModel`;
- receber `DecisionPolicy`;
- consolidar metadata;
- retornar `DecisionPolicyEvaluationResult`;
- manter forma canônica do envelope.

Permanece proibido:

- determinar aprovacao de negocio;
- inferir elegibilidade real;
- selecionar strategy;
- recomendar;
- executar provider;
- escrever em banco;
- emitir evento;
- chamar IA;
- calcular valor financeiro.

## 13. Candidate Externally Visible Surfaces

### Already public and approved

- `backend/src/modules/edp/decision-policy/index.ts`
- `backend/src/modules/edp/index.ts`

### Potential future extension surfaces

- `backend/src/modules/edp/decision-policy/decision-policy-evaluation-*.ts`
- `backend/src/modules/edp/decision-policy/decision-policy-*.ts`
- `backend/src/modules/edp/composition/index.ts` apenas se houver necessidade formal de reexportacao adicional

## 14. Compatibility and Naming Strategy

Para endurecer a camada sem quebrar contratos:

- preferir exportacoes explicitas no ponto publico;
- evitar `export *` em areas com estados homonimos;
- usar aliases mais descritivos quando dois dominios compartilham o mesmo nome;
- manter a definicao canônica no modulo de origem;
- reservar o ponto publico agregado para reexports controlados.

Essa estrategia reduz colisao entre:

- `DecisionPolicyState` do dominio de lifecycle;
- `DecisionPolicyState` da definicao da policy;
- futuros estados de evaluation, strategy e recommendation.

## 15. Architectural Risks and Mitigations

### Risk: type collision across domains

Mitigacao:

- exportacoes explicitas;
- alias de tipos em ponto publico;
- nomes semanticos por dominio.

### Risk: evaluation becoming behavior

Mitigacao:

- manter evaluator como envelope estrutural;
- proibir heuristicas e branching decisorio;
- exigir review formal para qualquer regra.

### Risk: future waves contaminating the policy layer

Mitigacao:

- fronteiras explicitas entre definition, evaluation, strategy e recommendation;
- contratos separados por wave;
- bloqueio de provider, persistence and event concerns.

### Risk: backward incompatibility by contract drift

Mitigacao:

- versionamento canônico;
- deprecacao planejada;
- alias de transicao;
- testes de contrato e de export.

## 16. Mandatory Structural Tests

Os testes obrigatorios para sustentar esta hardening devem validar:

- criacao de `DecisionPolicy`;
- criacao de `DecisionPolicyEvaluation`;
- criacao de `DecisionPolicyEvaluationResult`;
- preservacao de `scope`, `metadata` e `state`;
- exportacoes publicas sem colisao;
- ausencia de comportamento de negocio;
- ausencia de persistencia;
- ausencia de provider runtime;
- ausencia de events;
- compatibilidade entre `DecisionModel` e `DecisionPolicy`;
- estabilidade de nomenclatura publica.

## 17. Acceptance Criteria

A H21-B-W3 somente deve ser considerada aceita quando:

- a arquitetura da Decision Policy Evaluation estiver claramente separada da Decision Policy Definition;
- os contratos publicos estiverem estaveis e sem colisao;
- a nomenclatura publica estiver consolidada;
- o versionamento e a compatibilidade retroativa estiverem definidos;
- os pontos de extensao estiverem claros;
- nenhuma regra de negocio, persistencia ou provider runtime tiver sido introduzida;
- Strategy Resolution e Recommendation Engine permanecerem apenas como fronteiras futuras;
- o runtime EDP continuar sendo a unica raiz operacional;
- o build e a suite permanecerem verdes.

## 18. Checklist of Compliance

- [x] Decision Policy Definition separada de Decision Policy Evaluation;
- [x] Nomenclatura publica consolidada;
- [x] Versionamento canônico definido;
- [x] Compatibilidade retroativa orientada por contrato;
- [x] Boundaries futuras explicitadas;
- [x] Extension points definidos;
- [x] Invariantes arquiteturais registradas;
- [x] Riscos e mitigacoes documentados;
- [x] Sem alteracao de Runtime Foundation;
- [x] Sem alteracao de Event Catalog;
- [x] Sem alteracao de H19-C3;
- [x] Sem persistencia, eventos ou IA.

## 19. Final Technical Opinion

A Decision Policy Evaluation esta arquiteturalmente apta a evoluir, mas somente se permanecer estritamente estrutural, com contracts-first, exportacao explicita e nomes publicos sem colisao.

A wave H21-B-W3 deve ser tratada como hardening de contrato e nomenclatura, nao como introducao de comportamento.

**Final verdict: GO WITH RESTRICTIONS**

## 20. Official Recommendation for H21-C

Recomendacao oficial: iniciar a H21-C apenas apos consolidacao formal dos contratos de Decision Policy Evaluation e da nomenclatura publica, mantendo Strategy Resolution e Recommendation Engine como ondas futuras separadas e preservando a integridade dos contratos canonicos ja homologados.

