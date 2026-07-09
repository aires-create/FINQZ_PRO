# H21-B-W1 - Decision Policy Design Review

## Status
GO WITH RESTRICTIONS

## 1. Objective of the Review

Validar a arquitetura da camada Decision Policy antes de qualquer implementacao, preservando a continuidade do FINQZ PRO Enterprise, a disciplina de contratos e a separacao de responsabilidades do Business Runtime.

Esta revisao e conduzida sob o baseline consolidado:

- H19 encerrada e homologada com GO;
- H20 Enterprise Decision Runtime encerrada com GO;
- H21-A Decision Runtime Foundation concluida ate a W4;
- Decision Runtime Skeleton concluido;
- Decision Context Skeleton concluido;
- Decision Inputs Skeleton concluido;
- Decision Model Skeleton concluido;
- build aprovado;
- suite de testes estabilizada;
- Runtime Foundation preservado.

## 2. Objective of the Decision Policy Layer

A Decision Policy existe para representar a camada canonica de definicao normativa que orienta o comportamento decisorio do runtime.

Seu objetivo e organizar, versionar e expor a politica estrutural que sera consumida por waves posteriores do Decision Runtime, sem executar avaliacao, sem inferir resultado e sem produzir comportamento operacional.

Em termos arquiteturais, a Decision Policy e uma camada de definicao e referencia, nao de execucao.

## 3. Role of Decision Policy Within the Business Runtime

Dentro do Business Runtime, a Decision Policy ocupa a fronteira entre o modelo decisorio estrutural e as ondas futuras de avaliacao de politica.

Ela:

- define a estrutura canônica da politica;
- preserva escopo, versao e metadata de governanca;
- permite que o runtime saiba qual politica existe e como ela se apresenta;
- prepara a base para Policy Evaluation em wave posterior.

Ela nao:

- avalia contexto;
- escolhe strategy;
- recomenda;
- executa provider;
- persiste estado;
- emite eventos;
- decide o resultado da operacao.

## 4. Relationship Between Decision Policy and Decision Model

A relacao entre Decision Policy e Decision Model e complementar e hierarquica:

- o Decision Model organiza o estado estrutural da decisao;
- a Decision Policy organiza a definicao normativa que podera orientar esse estado em wave futura;
- o Model pode referenciar a Policy como dependencia estrutural;
- a Policy nao deve invadir o comportamento do Model.

Em termos praticos:

- o Model consolida a forma da decisao;
- a Policy consolida a forma da regra canônica que ainda sera aplicada;
- nenhuma das duas camadas pode executar decisao nesta wave.

## 5. Responsibilities of Decision Policy

A Decision Policy pode e deve responsabilizar-se apenas por:

- descrever a identidade canonica da politica;
- carregar versao, escopo e metadata;
- representar estado estrutural da politica;
- organizar referencias de governanca;
- manter previsibilidade semantica para waves futuras;
- oferecer uma estrutura publicamente exportavel e testavel;
- servir como base para Policy Evaluation posterior.

## 6. Responsibilities That Do Not Belong to Policy

Nao pertencem a Decision Policy:

- avaliacao de contexto;
- aplicacao de regras;
- decisao de elegibilidade;
- strategy resolution;
- recommendation;
- proposal runtime;
- simulation runtime;
- provider runtime;
- calculos financeiros;
- persistencia;
- eventos;
- leitura de repositories;
- acesso a UnitOfWork;
- acesso a Repository Registry;
- uso de IA para inferencia;
- qualquer comportamento operacional de decisao.

## 7. Canonical Structure of DecisionPolicy

A estrutura canônica da DecisionPolicy deve permanecer pequena, previsivel e centrada em definicao.

Ela deve representar, no minimo:

- identidade da politica;
- escopo da politica;
- versao da politica;
- estado da politica;
- metadata canônica;
- referencias estruturais de governanca;
- snapshot de definicao sem comportamento.

Essa estrutura deve ser suficientemente expressiva para documentar e versionar a politica sem antecipar sua avaliacao.

## 8. DecisionPolicyFactory

Deve existir uma `DecisionPolicyFactory` controlada.

Responsabilidade da factory:

- montar a estrutura canônica da politica;
- normalizar apenas forma e metadata;
- preservar escopo e versao;
- consolidar estado estrutural;
- evitar qualquer leitura de persistencia;
- evitar qualquer dependencia de provider;
- evitar qualquer calculo ou inferencia decisoria.

A factory existe para construir forma, nao para interpretar conteudo.

## 9. DecisionPolicyMetadata

`DecisionPolicyMetadata` deve carregar apenas metadados estruturais e de governanca, como:

- identificador de request ou referencia de origem;
- correlationId;
- causationId quando aplicavel;
- tenantId quando aplicavel;
- source;
- timestamp ou reference de versionamento, se formalizado;
- atributos canonicos read-only.

A metadata deve ser suficiente para rastreabilidade, sem carregar regra de negocio.

## 10. DecisionPolicyScope

`DecisionPolicyScope` representa o dominio de aplicabilidade da politica.

Pode carregar informacoes como:

- tenant scope;
- domain scope;
- aggregate scope;
- command scope;
- applicability flags canônicas;
- identificadores de versao efetiva.

O scope e um contrato de delimitacao, nao um mecanismo de avaliacao.

## 11. DecisionPolicyResult

`DecisionPolicyResult` nao representa a avaliacao da politica nesta wave.

Nesta fase, o Result deve ser entendido apenas como uma estrutura canônica de saida potencial do lifecycle da policy, contendo:

- referencia da policy;
- status estrutural;
- metadata de rastreabilidade;
- snapshot de definicao consolidada;
- informacao suficiente para waves futuras.

Nao deve conter:

- decisao final;
- recomendacao;
- conclusao de elegibilidade;
- efeitos colaterais;
- persistencia;
- eventos.

## 12. Recommended Public Interfaces

As interfaces publicas recomendadas para a H21-B-W1 sao:

- `DecisionPolicy`;
- `DecisionPolicyFactory`;
- `DecisionPolicyMetadata`;
- `DecisionPolicyScope`;
- `DecisionPolicyResult`;
- `DecisionPolicyState`;
- `DecisionPolicyIdentity`;
- `DecisionPolicySnapshot`.

Essas interfaces devem permanecer estruturais, publicas e pequenas.

## 13. Permitted Dependencies

A camada Decision Policy pode depender apenas de:

- contratos canonicos do Decision Runtime;
- Decision Model como referencia estrutural;
- Decision Context como referencia de entrada normalizada, quando necessario;
- Decision Inputs como referencia de origem, quando necessario;
- metadata canonica do backend;
- composition do EDP apenas como fonte de dependencias ja homologadas, sem duplicar root;
- tipos puros e utilitarios sem comportamento de negocio.

## 14. Forbidden Dependencies

A camada Decision Policy nao pode depender de:

- Policy Evaluation;
- Strategy Resolution;
- Recommendation Engine;
- Proposal Runtime;
- Simulation Runtime;
- Provider Runtime;
- repositories de persistencia como fonte de negocio;
- UnitOfWork;
- Repository Registry;
- frontend;
- HTTP DTOs como source of truth;
- novas rotas;
- novo runtime root;
- qualquer segunda composition root;
- IA para inferencia.

## 15. Architectural Flow of the Layer

O fluxo arquitetural recomendado e:

1. Decision Inputs capturam a entrada canônica.
2. Decision Context normaliza o contexto de execucao.
3. Decision Model consolida a estrutura da decisao.
4. Decision Policy representa a estrutura normativa que podera ser referenciada.
5. Future Policy Evaluation consumira Policy, Model e Context em wave posterior.

Nesta wave, apenas as etapas de definicao e estrutura devem existir.

## 16. Extensibility Criteria

A camada sera considerada extensivel quando:

- permitir evolucao de versao sem quebra de contrato;
- suportar novos metadados sem redefinir o core;
- admitir novos scopes sem duplicar estrutura;
- preservar imutabilidade estrutural;
- manter compatibilidade com Decision Model e Decision Context;
- nao acoplar comportamento a forma.

## 17. Isolation Criteria

A camada sera considerada isolada quando:

- nao consultar banco;
- nao consultar providers;
- nao consultar UnitOfWork;
- nao consultar Repository Registry;
- nao emitir eventos;
- nao depender de HTTP;
- nao depender de frontend;
- nao importar handlers;
- nao executar regras de negocio.

## 18. Testability Criteria

A camada deve ser testavel por meio de testes estruturais que validem:

- criacao da Decision Policy;
- preservacao de scope e metadata;
- normalizacao estrutural;
- ausencia de comportamento;
- ausencia de dependencias de provider;
- ausencia de persistencia;
- ausencia de eventos;
- exportacao publica funcionando.

Os testes devem verificar contrato e forma, nao avaliacao.

## 19. Versioning Criteria

A Decision Policy deve ser versionada de forma canônica e previsivel.

Critérios:

- versionamento explicito no contrato;
- compatibilidade retroativa quando possivel;
- quebras de contrato somente via review formal;
- nenhuma inferencia de versao baseada em provider ou runtime;
- metadata de versao preservada como parte da estrutura.

## 20. Acceptance Criteria of the Wave

A H21-B-W1 somente deve ser considerada aceita quando:

- a Decision Policy estiver definida como camada estrutural canonica;
- suas responsabilidades estiverem limitadas a definicao e referencia;
- nenhuma regra de negocio tiver sido introduzida;
- nenhuma persistencia tiver sido adicionada;
- nenhuma dependencia de provider tiver sido acoplada;
- nenhuma Policy Evaluation tiver sido implementada;
- nenhuma Strategy Resolution, Recommendation ou Provider Runtime tiver sido antecipada;
- o runtime EDP continuar sendo a unica raiz operacional;
- testes estruturais da futura implementacao estiverem verdes;
- build e suite total permanecerem sem regressao.

## 21. Architectural Risks

Os principais riscos arquiteturais sao:

- transformar Policy em rule engine;
- antecipar Policy Evaluation nesta wave;
- misturar policy com strategy;
- acoplar policy a providers;
- introduzir persistencia precoce;
- duplicar fontes de verdade de governance;
- usar IA para inferencia da politica;
- criar comportamento de negocio dentro de uma camada estrutural.

## 22. Final Technical Opinion

A Decision Policy e arquiteturalmente consistente com a H21 desde que permaneça como camada estrutural, versionavel e livre de comportamento.

O caminho correto e introduzir primeiro a forma canônica da Policy, garantindo que ela possa ser referenciada por waves posteriores sem executar avaliacao, sem persistencia e sem acoplamento externo.

**Final verdict: GO WITH RESTRICTIONS**

## 23. Files That May Exist in the Future Implementation

Os arquivos abaixo sao candidatos provaveis para a futura implementacao:

- `backend/src/modules/edp/composition/decision-policy.ts`
- `backend/src/modules/edp/composition/decision-policy.test.ts`
- `backend/src/modules/edp/composition/index.ts` apenas para exportacao publica do novo skeleton
- `backend/src/modules/edp/composition/decision-model.ts` somente se houver integracao minima e justificada
- `backend/src/modules/edp/composition/decision-context.ts` somente se houver integracao minima e justificada

## 24. Blocked Files in This Wave

Permanecem bloqueados nesta wave:

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
- qualquer provider runtime
- qualquer segunda composition root
- qualquer persistencia nova

## 25. Mandatory Structural Tests

Os testes estruturais obrigatorios para a futura implementacao devem comprovar:

- criacao da Decision Policy;
- composicao correta com o Decision Model;
- preservacao de metadata, scope e versionamento;
- ausencia de comportamento de decisao;
- ausencia de persistencia;
- ausencia de dependencias de provider;
- ausencia de events;
- exportacoes publicas funcionando;
- compatibilidade estrutural com a arquitetura da H21-A.

## 26. What Is Allowed Only in H21-B-W2

Somente na H21-B-W2 sera permitido introduzir:

- Policy Evaluation;
- leitura estruturada de policy para avaliacao;
- resultado avaliativo canonico da policy;
- criterios formais de elegibilidade e restricao, se aprovados pela review posterior;
- integrações internas estritamente necessárias ao fluxo de avaliacao, ainda sem provider runtime, persistencia ou novos eventos.

## 27. Official Recommendation for H21-B-W2

A H21-B-W1 deve ser seguida por uma W2 focada exclusivamente em Policy Evaluation, desde que a base de Decision Policy permaneça estrutural e que qualquer extensao de comportamento seja precedida por review formal e revisao de contrato.

