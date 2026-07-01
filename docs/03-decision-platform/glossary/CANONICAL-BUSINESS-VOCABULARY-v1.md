# Canonical Business Vocabulary v1

## Status
Canonical

## Purpose
Este vocabulario oficializa os termos do Enterprise Decision Platform.

## Rules

- Cada termo tem um unico significado canonico.
- Sinonimos aceitos e proibidos evitam ambiguidade.
- Nenhum termo pode ser redefinido por frontend, provider ou IA.

## Terms

### Decision
- Definition: escolha canonica produzida pelo EDP a partir de policy, strategy, simulation e ranking.
- Owning Domain: Decision Core
- Allowed Synonyms: recomendacao canonica, resultado decisorio
- Forbidden Synonyms: chute, sugestao livre, palpite
- Canonical State: recommended, accepted, overridden
- Examples: "A decision foi recomendada", "A decision foi sobrescrita"

### Decision Strategy
- Definition: intencao executiva do tenant sobre o que otimizar.
- Owning Domain: Decision Strategy
- Allowed Synonyms: estrategia executiva, objective profile
- Forbidden Synonyms: policy, regra, score
- Canonical State: drafted, approved, active, rolled back
- Examples: maximizar conversao, maximizar margem

### Decision Policy
- Definition: conjunto versionado de pesos, prioridades, campanhas e criterios de desempate.
- Owning Domain: Decision Policy
- Allowed Synonyms: policy comercial, policy decisoria
- Forbidden Synonyms: strategy, regra fixa, heuristic
- Canonical State: created, approved, active, rolled back
- Examples: policy por tenant com weights e tie-breakers

### Audit Center
- Definition: dominio de rastreabilidade, conformidade e defesa documental da decisao.
- Owning Domain: Audit Center
- Allowed Synonyms: centro de auditoria, audit domain
- Forbidden Synonyms: log solto, historico informal
- Canonical State: recording, indexed, retained, archived
- Examples: auditoria de decisao, defesa de proposta

### Audit Timeline
- Definition: trilha cronologica imutavel dos eventos de auditoria do EDP.
- Owning Domain: Audit Timeline Aggregate
- Allowed Synonyms: audit trail, linha do tempo de auditoria
- Forbidden Synonyms: log temporario, timeline mutavel
- Canonical State: recorded, indexed, retained, archived
- Examples: timeline de decisao e proposta

### Simulation
- Definition: execucao de cenarios sob premissas validas.
- Owning Domain: Simulation
- Allowed Synonyms: scenario run, simulado
- Forbidden Synonyms: teste manual, mock decisorio
- Canonical State: requested, calculated, failed
- Examples: simulacao de credito, simulacao de energia

### Proposal
- Definition: objeto de negocio versionado que comunica oferta e decisao.
- Owning Domain: Proposal Center
- Allowed Synonyms: proposta canonica, offer package
- Forbidden Synonyms: pdf, documento solto
- Canonical State: draft, generated, shared, accepted, rejected, revoked, expired
- Examples: proposta compartilhada com link seguro

### Offer
- Definition: alternativa comercial ou financeira concreta.
- Owning Domain: Ranking
- Allowed Synonyms: alternativa, opcao, quote
- Forbidden Synonyms: proposal, decision
- Canonical State: generated, selected, rejected
- Examples: melhor oferta por provider

### Ranking
- Definition: ordenacao explicavel de ofertas segundo policy, strategy e sinais de negocio.
- Owning Domain: Ranking
- Allowed Synonyms: scoreboard, ordering
- Forbidden Synonyms: precificacao, decisao final
- Canonical State: computed, reviewed
- Examples: ranking por valor liberado

### Recommendation
- Definition: orientacao canonica gerada pelo Decision Core.
- Owning Domain: Decision Core
- Allowed Synonyms: sugestao canonica
- Forbidden Synonyms: dica informal, palpite
- Canonical State: generated, overridden
- Examples: recomendacao de melhor oferta

### Opportunity
- Definition: entidade comercial oficial do funil.
- Owning Domain: CRM / Opportunity
- Allowed Synonyms: deal, negocio
- Forbidden Synonyms: proposal
- Canonical State: open, qualified, converted, lost
- Examples: oportunidade convertida apos aceite

### Operation
- Definition: materializacao operacional apos aceite.
- Owning Domain: Operations
- Allowed Synonyms: post-sale operation, operacionalizacao
- Forbidden Synonyms: task, case
- Canonical State: candidate, created, in_progress, completed
- Examples: operacao criada apos aceite

### Provider
- Definition: fonte ou servico que fornece capacidade externa ou de integracao.
- Owning Domain: Provider Hub / Provider Operations
- Allowed Synonyms: integrador, fonte externa
- Forbidden Synonyms: regra interna, motor de decisao
- Canonical State: registered, certified, healthy, deprecated
- Examples: provider com sandbox e producao

### Capability
- Definition: habilidade formal suportada por um provider.
- Owning Domain: Provider Operations
- Allowed Synonyms: feature, support scope
- Forbidden Synonyms: product, policy
- Canonical State: registered, certified, deprecated
- Examples: capability de retorno de taxa

### Materialization
- Definition: passagem da decisao para entidade operacional concreta.
- Owning Domain: Operations
- Allowed Synonyms: concretizacao, instanciacao operacional
- Forbidden Synonyms: exportacao
- Canonical State: candidate, created, activated
- Examples: materializacao de operacao

### Workflow
- Definition: sequencia orquestrada de passos e estados.
- Owning Domain: Workflow
- Allowed Synonyms: flow, orchestration
- Forbidden Synonyms: rule set
- Canonical State: started, running, completed, failed
- Examples: workflow de decisao

### Override
- Definition: substituicao humana formal de recomendacao canonica.
- Owning Domain: Decision Core / Governance
- Allowed Synonyms: manual override
- Forbidden Synonyms: hack, bypass
- Canonical State: pending, approved, applied
- Examples: override por gerente autorizado

### Acceptance
- Definition: aceite formal da proposta.
- Owning Domain: Proposal Center
- Allowed Synonyms: approval, accepted proposal
- Forbidden Synonyms: send, share
- Canonical State: accepted
- Examples: acceptance with identity binding

### Rejection
- Definition: recusa formal da proposta.
- Owning Domain: Proposal Center
- Allowed Synonyms: decline, refused proposal
- Forbidden Synonyms: cancelamento tecnico
- Canonical State: rejected
- Examples: rejection with reason

### Lifecycle
- Definition: conjunto de estados e transicoes de um objeto de negocio.
- Owning Domain: Governance / Domain Model
- Allowed Synonyms: state machine
- Forbidden Synonyms: status solto
- Canonical State: defined by aggregate
- Examples: proposal lifecycle, provider lifecycle

### Score
- Definition: valor numerico que reflete avaliacao de um eixo ou conjunto de eixos.
- Owning Domain: Ranking
- Allowed Synonyms: indice, nota
- Forbidden Synonyms: price, decision
- Canonical State: computed
- Examples: score por provider

### Decision Score
- Definition: score composto que orienta a recomendacao canonica.
- Owning Domain: Ranking
- Allowed Synonyms: overall score
- Forbidden Synonyms: approval score
- Canonical State: computed
- Examples: decision score explicavel

### Client Score
- Definition: componente de score ligado ao perfil e historico do cliente.
- Owning Domain: Ranking
- Allowed Synonyms: customer score
- Forbidden Synonyms: client value, credit score
- Canonical State: computed
- Examples: score de aderencia do cliente

### Business Score
- Definition: componente de score ligado ao valor estrategico do negocio.
- Owning Domain: Ranking
- Allowed Synonyms: business value score
- Forbidden Synonyms: profit score isolado
- Canonical State: computed
- Examples: score de alinhamento estrategico

### Commercial Score
- Definition: componente de score ligado a conversao e fechamento.
- Owning Domain: Ranking
- Allowed Synonyms: sales score
- Forbidden Synonyms: commission score
- Canonical State: computed
- Examples: score de probabilidade de aceite

### Operational Score
- Definition: componente de score ligado a complexidade operacional.
- Owning Domain: Ranking
- Allowed Synonyms: ops score
- Forbidden Synonyms: effort score generico
- Canonical State: computed
- Examples: score de complexidade de materializacao

### Compliance Score
- Definition: componente de score ligado a restricoes regulatórias e politicas.
- Owning Domain: Ranking
- Allowed Synonyms: governance score
- Forbidden Synonyms: legal score total
- Canonical State: computed
- Examples: score de aderencia regulatoria

### Risk Score
- Definition: componente de score ligado a risco financeiro, operacional e regulatorio.
- Owning Domain: Ranking
- Allowed Synonyms: exposure score
- Forbidden Synonyms: danger score
- Canonical State: computed
- Examples: score de risco agregado
