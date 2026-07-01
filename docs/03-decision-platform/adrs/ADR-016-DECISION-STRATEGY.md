# ADR-016 - Decision Strategy as Strategic Layer

## Status
Accepted

## Context
Decision Policy define pesos, prioridades, campanhas, objetivos operacionais, criterios de desempate e governanca de configuracao. Ainda assim, o EDP precisa de uma camada distinta para representar a intencao executiva do tenant.

Sem essa separacao, a plataforma corre o risco de misturar:

- estrategia executiva;
- policy taticas;
- regras comerciais;
- scoring;
- preferencias de canal;
- metas de negocio.

Decision Policy responde a pergunta:

- "Como a plataforma deve decidir?"

Decision Strategy responde a pergunta:

- "O que o tenant quer otimizar?"

## Decision

Decision Strategy passa a ser um dominio estrategico explicito, versionado e tenant scoped, responsavel por declarar o objetivo de negocio predominante de cada tenant, produto, canal ou campanha.

Ela orienta a forma como o Decision Core, o Ranking e as propostas devem priorizar resultados, sem substituir policy, regras oficiais ou calculo canonico.

## Responsibilities

Decision Strategy:

- define a intencao estrategica do tenant;
- seleciona metas prioritarias;
- orienta trade-offs entre conversao, margem, retenção, SLA e velocidade;
- informa o peso relativo de objetivos de negocio;
- direciona campanhas e prioridades executivas;
- serve como contexto para ranking e recomendacao.

Decision Strategy nao:

- executa calculo;
- substitui Decision Policy;
- substitui Rules Engine;
- substitui Ranking;
- altera estado canonico sozinha;
- define regras de compliance;
- governa provider.

## Difference Between Policy and Strategy

### Decision Policy

Trata de mecanismos de decisao:

- weights;
- priorities;
- campaigns;
- tie-breakers;
- effective dating;
- approval;
- rollback;
- audit trail.

### Decision Strategy

Trata de objetivos executivos:

- maximizar conversao;
- maximizar margem;
- maximizar retencao;
- maximizar velocidade operacional;
- maximizar satisfacao do cliente;
- maximizar SLA;
- direcionar expansao de mercado.

## How It Governs the Decision Core

Decision Strategy nao opera diretamente o backend. Ela influencia o Decision Core por meio de:

- StrategyId;
- StrategyVersion;
- StrategyScope;
- StrategyWeightProfile;
- StrategyPriorityProfile;
- StrategyEffectiveWindow;
- StrategyApprovalState.

O Decision Core usa a Strategy como contexto superior para compor a decisao, enquanto a Policy continua determinando pesos e prioridades taticas.

## How It Influences Ranking

O Ranking recebe Strategy como input para:

- reordenar alternativas por objetivo predominante;
- ajustar pesos entre margem e conversao;
- refletir prioridades regionais, comerciais ou de canal;
- justificar por que uma oferta venceu outra.

## How It Influences Proposal

A Proposal passa a registrar a Strategy vigente para:

- explicar a intencao de negocio;
- preservar rastreabilidade da decisao;
- permitir auditoria do racional executivo;
- suportar reexecucao sob mesma estrategia.

## How It Influences Campaigns

Campaigns passam a ser vistos como expressao tática de Strategy, e nao como substituto dela.

Uma campanha pode:

- ajustar prioridades;
- reforcar metas temporarias;
- mudar pesos de curto prazo;
- operar dentro de uma Strategy aprovada.

## Tenant Objectives Examples

### Tenant focado em conversao

- Strategy objective: maximizar aceite.
- Policy: maior peso para recomendacoes com maior probabilidade de fechamento.

### Tenant focado em margem

- Strategy objective: maximizar margem liquida.
- Policy: prioriza ofertas com melhor retorno economico.

### Tenant focado em retenção

- Strategy objective: reduzir churn e aumentar continuidade.
- Policy: privilegia solucao com menor risco de abandono.

### Tenant focado em expansao

- Strategy objective: conquistar novos mercados ou canais.
- Policy: prioriza ofertas estrategicas e novos segmentos.

### Tenant focado em SLA

- Strategy objective: reduzir tempo de decisao e materializacao.
- Policy: privilegia providers e fluxos com menor latencia operacional.

### Tenant focado em energia

- Strategy objective: acelerar ofertas de energia e suporte operacional.
- Policy: privilegia capacidade, prazo e simplicidade de materializacao.

### Tenant focado em consignado

- Strategy objective: maximizar conversao em consignado com compliance.
- Policy: favorece produtos e providers aderentes ao fluxo consignado.

## Versioning

- Cada Strategy possui StrategyId e StrategyVersion.
- Mudancas exigem nova versao.
- A versao antiga permanece preservada para auditabilidade.
- A versao ativa depende de approval e effective dating.

## Approval

- Nenhuma Strategy entra em vigor sem aprovacao explicita.
- A aprovacao precisa registrar autor, data, justificativa e escopo.

## Rollback

- Rollback retorna a Strategy ativa para uma versao anterior aprovada.
- Rollback precisa ser auditado e temporalmente rastreavel.

## Effective Dating

- Strategy possui janela de inicio e fim de vigencia.
- A Strategy vigente e determinada pela data/hora de referencia.
- Versoes futuras nao substituem as vigentes antes do tempo.

## Audit Trail

- Toda mudanca gera audit trail imutavel.
- O audit trail deve registrar quem aprovou, quem publicou e quem reverteu.

## Tenant Scope

- Strategy e sempre tenant scoped.
- Nao pode ser compartilhada entre tenants como default.
- Pode haver templates de Strategy, nunca Strategy canonica cruzando tenant.

## Governance

Decision Strategy e uma camada de governanca executiva.
Ela nao substitui a arquitetura de decisao operacional, mas a orienta.

## Consequences

### Positivas
- separa objetivo executivo de mecanismo tatico;
- evita mistura entre policy e strategy;
- melhora governanca de negocio;
- permite otimizacao por tenant;
- amplia explicabilidade.

### Negativas / Trade-offs
- adiciona mais uma camada de governanca;
- aumenta necessidade de aprovacao formal;
- exige disciplina documental maior;
- pode reduzir agilidade sem processos bem definidos.

## Alternatives Considered

- manter Strategy embutida na Policy;
- usar apenas campanhas;
- inferir Strategy por IA;
- deixar Strategy implícita em ranking.

## Impact on Next Steps

- H19-C3 deve tratar Strategy como input formal da decisao;
- Policy e Strategy precisam permanecer separadas nos contratos;
- Ranking e Proposal devem carregar StrategyVersion.

## Relation to H19-C3 / H19-C4 / Roadmap

- H19-C3: Strategy deve existir como conceito contratual;
- H19-C4: runtime deve ler Strategy sem reavaliar sua semantica;
- Roadmap futuro: Strategy templates, strategy ops e optimization profiles.
