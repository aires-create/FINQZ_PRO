# ADR-001 - Enterprise Decision Platform Architecture Decision Records

## Status
Accepted

## Scope
Este documento registra as decisoes arquiteturais oficiais do Enterprise Decision Platform (EDP) antes da H19-C3.

## Authority
Este conjunto de ADRs e complementar ao documento oficial:

- [DCA-ENTERPRISE-DECISION-PLATFORM-v1](../DCA-ENTERPRISE-DECISION-PLATFORM-v1.md)

## Governance Rules

- Estes ADRs sao a referencia oficial para o EDP.
- Decisoes conflitantes futuras ficam bloqueadas por este registro.
- Qualquer alteracao material neste conjunto exige nova Architecture Review.
- H19-C3 e H19-C4 devem consumir estas decisoes como base obrigatoria.
- Nenhum runtime, contract, endpoint, migration ou alteracao de frontend/back-end pode contrariar estes registros.

## ADR Inventory

| ADR | Title | Status | Primary Concern |
|---|---|---|---|
| ADR-001 | Decision Core as Orchestrator | Accepted | Remove God Service risk |
| ADR-002 | Decision Policy as Explicit Domain | Accepted | Formalize policies and versioning |
| ADR-003 | Simulation as Reusable Domain | Accepted | Multi-channel simulation entrypoints |
| ADR-004 | Proposal Center as Enterprise Aggregate | Accepted | Proposal lifecycle and traceability |
| ADR-005 | Provider Operations as Lifecycle Governance | Accepted | Provider contract and operational control |
| ADR-006 | Frontend Is Never Official Calculation Source | Accepted | Backend First and SSOT protection |
| ADR-007 | Decision Score Must Always Be Explainable | Accepted | Transparent ranking and score decomposition |
| ADR-008 | Every Relevant Decision Emits Domain Events | Accepted | Audit, analytics and future integration |
| ADR-009 | Security and LGPD by Design | Accepted | Retention, masking and data safety |
| ADR-010 | Observability as a Domain Requirement | Accepted | Score drift and business telemetry |
| ADR-011 | EDP as a First-Level Domain | Accepted | Platform-level strategic positioning |
| ADR-012 | Legacy Simulator as Transitional Layer | Accepted | Controlled coexistence and convergence |
| ADR-013 | Contracts Before Runtime | Accepted | H19-C3 before backend skeleton |
| ADR-014 | Policy and Configuration Management | Accepted | Governance for strategic parameters |
| ADR-015 | AI as Support, Never Sovereign | Accepted | Guardrails for assistance and explanation |

---

## ADR-001 - Decision Core as Orchestrator

## Status
Accepted

## Context
O EDP precisa centralizar decisao sem concentrar todas as responsabilidades em um unico servico. Existe risco de o Decision Core absorver policy, calculo, scoring, simulacao e composicao de proposta, criando um God Service.

## Decision
O Decision Core e apenas o orquestrador do caso de decisao. Ele coordena a policy, a simulacao, as regras, o ranking, a proposta e os eventos, mas nao executa calculo financeiro isolado, nao contem politica comercial, nao faz ranking sozinho e nao assume papel de fonte de verdade para regras.

## Consequences

### Positivas
- reduz acoplamento
- permite evolucao independente de policy, ranking e simulacao
- evita God Service
- facilita testes, auditoria e governanca
- melhora clareza de responsabilidades

### Negativas / Trade-offs
- mais componentes a coordenar
- maior custo de integracao interna
- exige contratos bem definidos entre os contextos

## Alternatives Considered
- Decision Core monolitico com todo o calculo
- separacao parcial apenas no frontend
- manter logica distribuida em telas e services

## Impact on Next Steps
- H19-C3 deve definir o contrato do Decision Core como orquestrador
- H19-C4 pode implementar skeleton backend apenas apos os contratos

## Relation to H19-C3 / H19-C4 / Roadmap
- H19-C3: definicao de orquestracao e boundaries
- H19-C4: materializacao backend baseada em contratos
- Roadmap futuro: extensao sem concentracao de regra no core

---

## ADR-002 - Decision Policy as Explicit Domain

## Status
Accepted

## Context
Pesos, prioridades, campanhas, objetivos, criterios de desempate e estrategias comerciais nao podem ficar dispersos em configuracoes locais, frontends ou heuristicas de runtime.

## Decision
Decision Policy e um dominio explicito, versionado e tenant scoped. Ele governa pesos, prioridades, campanhas, objetivos, tie-breakers, regras comerciais, effective dating, aprovacao, rollback e audit trail.

## Consequences

### Positivas
- evita policy dispersa
- permite governanca por tenant
- torna decisao reproduzivel por versao
- suporta rollback e janela de vigencia
- melhora auditabilidade e transparencia

### Negativas / Trade-offs
- aumenta disciplina de governanca
- exige processo de aprovacao
- pode reduzir agilidade taticas quando a policy mudar com frequencia

## Alternatives Considered
- policy embutida no Decision Core
- policy em configuracoes de frontend
- policy inferida por IA ou provider

## Impact on Next Steps
- H19-C3 deve separar policy de execution
- contratos canonicos precisam referenciar policy version

## Relation to H19-C3 / H19-C4 / Roadmap
- H19-C3: separacao de policy e definicao dos contratos
- H19-C4: consumacao da policy no backend skeleton
- Roadmap futuro: policy management, campaign governance e strategic tuning

---

## ADR-003 - Simulation as Reusable Domain

## Status
Accepted

## Context
A simulacao do EDP nao deve nascer acoplada a um unico menu ou superficie. Ela precisa servir Oportunidade, API, IA, Parceiro, Portal e canais futuros, sempre reutilizando o mesmo backend canonico.

## Decision
A Simulation e um dominio reutilizavel com backend unico e multiplos pontos de entrada. A origem do comando pode variar, mas a base de calculo, regras e versionamento permanece unica.

## Consequences

### Positivas
- reuso por canal
- SSOT de simulacao
- consistencia entre experiencias
- facilita APIs futuras e IA

### Negativas / Trade-offs
- exige orquestracao de entrada mais robusta
- aumenta necessidade de contrato de input
- requer controle de origem e correlacao

## Alternatives Considered
- simulacao exclusiva por menu
- simulacao separada por canal
- duplicar regras por surface

## Impact on Next Steps
- definir contrato unico de request de simulacao
- padronizar origem, contexto e tenant scope

## Relation to H19-C3 / H19-C4 / Roadmap
- H19-C3: contrato conceitual da simulacao
- H19-C4: skeleton backend com entradas multiplas
- Roadmap futuro: canalizacao por portal, mobile, parceiros e APIs

---

## ADR-004 - Proposal Center as Enterprise Aggregate

## Status
Accepted

## Context
Uma proposta nao e um PDF. Ela e um objeto de negocio versionado, auditavel e governado por ciclo de vida proprio, com validade, revogacao, reenvio, aceite, recusa, consentimento, identidade e compartilhamento seguro.

## Decision
Proposal Center sera o agregado enterprise responsavel por proposta, versao, snapshot, timeline, validade, revogacao, recusa, aceite, consentimento, identidade, link seguro e QR Code. PDF e apenas uma representacao.

## Consequences

### Positivas
- proposta rastreavel e versionada
- maior confianca operacional
- suporte a compartilhamento seguro
- base para assinatura digital e portal futuro

### Negativas / Trade-offs
- lifecycle mais complexo
- necessidade de controle de estados
- maior rigor em identidade e consentimento

## Alternatives Considered
- tratar proposta como arquivo PDF
- armazenar apenas a ultima versao
- permitir edicao silenciosa

## Impact on Next Steps
- definir estado e transicoes da proposta
- formalizar revogacao, recusa e reenvio

## Relation to H19-C3 / H19-C4 / Roadmap
- H19-C3: contrato conceitual da proposta
- H19-C4: materializacao do lifecycle
- Roadmap futuro: assinatura digital, portal do cliente e API publica

---

## ADR-005 - Provider Operations as Lifecycle Governance

## Status
Accepted

## Context
Providers nao podem acessar o Decision Core de forma direta nem operar sem governanca de capability, contrato, ambiente e observabilidade.

## Decision
Provider Operations governa lifecycle de provider com capability registry, sandbox, producao, certificacao, rate limit, retry, timeout, fallback, deprecacao, versionamento de contrato, health e SLA. O Provider Hub continua como registro e normalizacao, mas a governanca operacional vive em Provider Operations.

## Consequences

### Positivas
- evita acoplamento indevido entre provider e decisao
- suporta maturidade operacional enterprise
- facilita deprecacao controlada
- melhora confianca e observabilidade

### Negativas / Trade-offs
- aumenta o custo operacional de onboarding
- exige certificacao e maturidade de integracao
- adiciona uma camada adicional de governanca

## Alternatives Considered
- provider acessando o Decision Core diretamente
- governanca manual por integracao
- manter sandbox e producao pouco diferenciados

## Impact on Next Steps
- definir matriz de capability e certificacao
- formalizar contratos e limites por provider

## Relation to H19-C3 / H19-C4 / Roadmap
- H19-C3: definicao de governanca de provider
- H19-C4: contracts e runtime skeleton com limites
- Roadmap futuro: expansao para novos providers e mercados

---

## ADR-006 - Frontend Is Never Official Calculation Source

## Status
Accepted

## Context
O frontend pode coletar dados, apresentar resultados e exibir previews nao oficiais, mas nao pode ser a fonte oficial de calculo, ranking, proposta ou aceite.

## Decision
Todo calculo, ranking, proposta e aceite oficial pertencem ao backend. O frontend apenas coleta, apresenta e, quando necessario, mostra previsualizacoes nao canonicas claramente rotuladas.

## Consequences

### Positivas
- protege Single Source of Truth
- reduz divergencia entre telas
- aumenta auditabilidade
- simplifica governanca de negocios

### Negativas / Trade-offs
- diminui autonomia da interface
- requer roundtrips adicionais
- pode demandar cache ou UX de loading melhor

## Alternatives Considered
- manter calculo no frontend
- usar frontend como fallback oficial
- permitir aceite final calculado na tela

## Impact on Next Steps
- remover dependencia de calculo canonico em surface de UI
- alinhar previews com dados do backend

## Relation to H19-C3 / H19-C4 / Roadmap
- H19-C3: contratos oficiais de calculo e exibicao
- H19-C4: runtime backend como unica fonte canonica
- Roadmap futuro: frontend rico, porem nao soberano

---

## ADR-007 - Decision Score Must Always Be Explainable

## Status
Accepted

## Context
Sem explicabilidade, a recomendacao do EDP perde confianca, auditabilidade e capacidade de defesa comercial e regulatoria.

## Decision
Toda recomendacao deve ser explicavel e auditavel com decomposicao por Client Score, Business Score, Commercial Score, Provider Score, Operational Score, Compliance Score e Risk Score.

## Consequences

### Positivas
- melhora confianca do usuario
- facilita auditoria
- aumenta transparencia
- permite comparacao entre alternativas

### Negativas / Trade-offs
- exige modelos de explicacao mais ricos
- aumenta custo de observabilidade
- pode expor detalhes sensiveis se nao houver mascaramento

## Alternatives Considered
- score opaco
- score unico sem decomposicao
- explicacao apenas opcional

## Impact on Next Steps
- padronizar payload de explicacao
- vincular score a policy version e provider version

## Relation to H19-C3 / H19-C4 / Roadmap
- H19-C3: definicao do contrato de explicabilidade
- H19-C4: implementacao backend da decomposicao
- Roadmap futuro: IA explicativa e insight analytics

---

## ADR-008 - Every Relevant Decision Emits Domain Events

## Status
Accepted

## Context
O EDP precisa alimentar rastreabilidade, analytics, auditoria, integracao futura e IA. Sem eventos, a plataforma fica acoplada a leitura direta e reprocessamento manual.

## Decision
Toda decisao relevante deve emitir eventos de dominio com correlacao, assinatura e versionamento apropriado.

## Consequences

### Positivas
- suporta auditoria
- melhora observabilidade
- habilita analytics e IA
- facilita integracao futura

### Negativas / Trade-offs
- exige governanca de eventos
- aumenta complexidade de reprocessamento
- requer idempotencia e integridade rigorosas

## Alternatives Considered
- atualizacao apenas sincrona
- logs sem eventos de negocio
- eventos apenas para integracoes externas

## Impact on Next Steps
- definir catalogo de eventos canonicos
- padronizar envelope, assinatura e correlacao

## Relation to H19-C3 / H19-C4 / Roadmap
- H19-C3: mapa oficial de eventos
- H19-C4: materializacao no backend skeleton
- Roadmap futuro: telemetria, AI feedback loop e marketplace events

---

## ADR-009 - Security and LGPD by Design

## Status
Accepted

## Context
O EDP processa dados sensiveis, propostas, scores, consentimento e historico. A arquitetura precisa cumprir LGPD e proteger dados por design.

## Decision
Seguranca deve incluir retencao, classificacao, consentimento, mascaramento, criptografia quando aplicavel, anonimização, descarte seguro, integridade de snapshots e logs sem dados sensiveis.

## Consequences

### Positivas
- melhora compliance
- reduz risco juridico
- protege dados sensiveis
- fortalece confianca enterprise

### Negativas / Trade-offs
- aumenta rigor operacional
- pode exigir custo adicional de armazenamento e chaves
- adiciona controles de descarte e anonimização

## Alternatives Considered
- seguranca apenas por RBAC
- mascaramento somente na UI
- logs completos para debug

## Impact on Next Steps
- definir politicas de retencao e classificacao
- formalizar integridade de snapshot e assinatura de evento

## Relation to H19-C3 / H19-C4 / Roadmap
- H19-C3: contratos devem carregar politicas de seguranca
- H19-C4: runtime backend deve nascer com guardrails
- Roadmap futuro: portal, assinatura digital e APIs publicas seguras

---

## ADR-010 - Observability as a Domain Requirement

## Status
Accepted

## Context
Sem observabilidade profunda, o EDP nao consegue provar qualidade de ranking, policy, provider e conversion path.

## Decision
Observabilidade e requisito de dominio, incluindo score drift, performance por policy version, tenant, produto e provider, fallback por capability, uso da explicacao, override humano e conversao por ranking position.

## Consequences

### Positivas
- identifica regressao cedo
- permite governanca por tenant e produto
- mede efetividade da policy
- conecta negocio e operacao

### Negativas / Trade-offs
- aumenta volume de telemetria
- exige modelagem de metricas mais rica
- demanda observability pipeline robusto

## Alternatives Considered
- observabilidade apenas tecnica
- metrics genericas de latencia
- analytics desacoplado da decisao

## Impact on Next Steps
- definir dashboards e KPIs canonicos
- padronizar metricas por contexto

## Relation to H19-C3 / H19-C4 / Roadmap
- H19-C3: metricas e sinais de referencia
- H19-C4: observability skeleton
- Roadmap futuro: analytics e AI ops

---

## ADR-011 - EDP as a First-Level Domain

## Status
Accepted

## Context
O EDP nao deve ser tratado como submodulo do CRM nem como um simples simulador. Ele e uma capacidade estrategica equivalente a CRM, Operations, Analytics, Administration e Provider Hub.

## Decision
O EDP e um dominio de primeiro nivel da plataforma, com autonomia conceitual e governanca propria.

## Consequences

### Positivas
- posicionamento estrategico correto
- clareza de ownership
- facilita roadmap de 10 anos
- reforca importancia enterprise

### Negativas / Trade-offs
- aumenta expectativa de governanca
- exige disciplina documental e contratual maior

## Alternatives Considered
- manter como feature do CRM
- modelar como modulo do simulador
- dividir sem reconhecimento como dominio

## Impact on Next Steps
- proteger boundaries e contratos
- evitar rebaixamento do EDP em implementation detail

## Relation to H19-C3 / H19-C4 / Roadmap
- H19-C3: o EDP entra como dominio oficial
- H19-C4: contratos e runtime assumem essa hierarquia
- Roadmap futuro: expansao para novos produtos e mercados

---

## ADR-012 - Legacy Simulator as Transitional Layer

## Status
Accepted

## Context
Os simuladores legados ainda existem temporariamente, mas nao definem a arquitetura final do EDP.

## Decision
Simulador Menu e Simulador da Oportunidade permanecem como camada transitiva ate a convergencia planejada para o EDP, sem serem considerados fonte final da arquitetura.

## Consequences

### Positivas
- reduz risco de ruptura
- permite transicao gradual
- preserva operacao atual

### Negativas / Trade-offs
- convivencia com legado por mais tempo
- risco de duplicidade funcional se a convergencia atrasar

## Alternatives Considered
- desligar imediatamente o legado
- manter o legado como arquitetura final
- duplicar evolucoes no novo EDP e no legado

## Impact on Next Steps
- definir trilha de convergencia
- bloquear novas dependencias estruturais no legado

## Relation to H19-C3 / H19-C4 / Roadmap
- H19-C3: contratos devem ignorar heuristicas legadas
- H19-C4: runtime do EDP assume protagonismo
- Roadmap futuro: desativacao controlada do legado

---

## ADR-013 - Contracts Before Runtime

## Status
Accepted

## Context
O EDP nao pode criar runtime antes de contratos canonicos. O risco de cristalizar arquitetura errada e alto.

## Decision
H19-C3 define contratos canonicos antes de qualquer backend skeleton da H19-C4.

## Consequences

### Positivas
- reduz retrabalho
- diminui ambiguidade
- melhora alinhamento entre times
- protege governanca arquitetural

### Negativas / Trade-offs
- desloca o inicio de implementacao
- exige mais trabalho documental inicial

## Alternatives Considered
- implementar primeiro e contratar depois
- deixar contratos implicitos
- usar runtime para descobrir o dominio

## Impact on Next Steps
- H19-C3 passa a ser gate obrigatorio
- H19-C4 so inicia com contratos aprovados

## Relation to H19-C3 / H19-C4 / Roadmap
- H19-C3: fase formal de contratos
- H19-C4: skeleton backend baseado em contrato
- Roadmap futuro: evolucao contratual por wave

---

## ADR-014 - Policy and Configuration Management

## Status
Accepted

## Context
Configuracoes estrategicas, pesos, comissoes, campanhas, regras e parametros por tenant nao podem ficar espalhados em stores, telas ou arquivos nao governados.

## Decision
Policias e configuracoes estrategicas do EDP devem ser versionadas, governadas e tenant scoped, evitando configuracao dispersa e mutacoes silenciosas.

## Consequences

### Positivas
- governanca central
- auditabilidade
- reproducao por versao
- controle por tenant e campanha

### Negativas / Trade-offs
- mais formalidade operacional
- menor flexibilidade ad hoc

## Alternatives Considered
- configurar diretamente no frontend
- espalhar parametros em servicos diversos
- permitir mudancas sem aprovacao

## Impact on Next Steps
- consolidar policy management e configuration governance
- vincular cada decisao a versao de policy

## Relation to H19-C3 / H19-C4 / Roadmap
- H19-C3: contratos devem referenciar policy version
- H19-C4: runtime usa configuracao governada
- Roadmap futuro: policy ops e campaign governance

---

## ADR-015 - AI as Support, Never Sovereign

## Status
Accepted

## Context
A IA do EDP pode ajudar com assistencia, explicacao, resumo, recomendacao e deteccao de inconsistencias, mas nao pode substituir regras oficiais nem alterar estado canonico.

## Decision
A IA e suporte, nao soberana. Ela pode sugerir e explicar, mas nao muda estado canonico sem backend, nao aprova excecao e nao substitui regras oficiais.

## Consequences

### Positivas
- reduz risco de decisao opaca
- protege compliance
- preserva governanca humana e regulatoria
- permite assistencia rica

### Negativas / Trade-offs
- limita autonomia de automacao
- exige guardrails e classificacao de saida

## Alternatives Considered
- IA como decisora principal
- IA alterando ranking autonomamente
- IA substituindo regras oficiais

## Impact on Next Steps
- classificar saidas de IA como sugestao, explicacao, sumarizacao ou alerta
- criar limites formais para qualquer agente futuro

## Relation to H19-C3 / H19-C4 / Roadmap
- H19-C3: guardrails de IA entram no contrato
- H19-C4: assistencia contextual e explicabilidade
- Roadmap futuro: agentes especializados, sempre subordinados ao core

---

## Summary of Decisions

- O Decision Core e apenas orquestrador.
- Decision Policy e dominio explicito, versionado e tenant scoped.
- Simulation e reutilizavel por varios canais.
- Proposal Center e agregado enterprise, nao um PDF.
- Provider Operations governa lifecycle de provider.
- Frontend nao e fonte oficial de calculo.
- Todo score relevante precisa ser explicavel.
- Eventos de dominio sao obrigatorios.
- Seguranca e LGPD sao by design.
- Observabilidade e requisito de dominio.
- EDP e dominio de primeiro nivel.
- Legacy simulator e transitorio.
- Contracts before runtime e regra obrigatoria.
- Policy e configuration management devem ser governados.
- IA e suporte, nunca soberana.

## Blocking Rule
Qualquer decisao futura que contradiga estes ADRs deve ser tratada como inconsistente com a arquitetura oficial e requer nova Architecture Review antes de ser considerada.

## Next Steps for RR-001

- validar aderencia dos contratos de H19-C3 a estes ADRs;
- confirmar que nenhum runtime nasce antes dos contratos;
- verificar que Decision Policy possui separacao real de Decision Core;
- validar que Proposal Center e Provider Operations estao descritos como lifecycle domains e nao apenas telas ou helpers;
- checar que seguranca e observabilidade foram refletidas como requisitos de dominio;
- impedir qualquer cristalizacao precoce de God Service.

## Final Verdict
**GO WITH RESTRICTIONS**

O conjunto de ADRs e suficiente para servir como base obrigatoria da RR-001 e da H19-C3, desde que a separacao entre Decision Policy, Decision Core e Provider Operations seja preservada como fronteira arquitetural inviolavel.

