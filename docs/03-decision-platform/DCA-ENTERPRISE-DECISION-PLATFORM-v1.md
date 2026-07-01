# DCA - Enterprise Decision Platform v1

Status: OFFICIAL ARCHITECTURE PROPOSAL  
Domain: Enterprise Decision Platform (EDP)  
Scope: FINQZ PRO Enterprise  
Document Type: Executive + Technical Architecture  
Authority Level: First-Level Platform Domain  
Created At: 2026-07-01

---

## 1. Executive Summary

O Enterprise Decision Platform (EDP) passa a ser um novo dominio estrategico de primeiro nivel do FINQZ PRO Enterprise, com responsabilidade por transformar entrada comercial e operacional em decisao orientada a dados, regras, simulacao, ranking, proposta e materializacao controlada.

O EDP substitui definitivamente a nocao de "Simulador Enterprise" como funcionalidade isolada. A plataforma deixa de ser apenas um motor de calculo e passa a ser uma camada de decisao empresarial que conecta Lead, CRM, Oportunidades, Pipeline, Operacoes, Catalogo, Providers, Analytics e IA sob uma mesma linguagem arquitetural.

Decisao central:

- O EDP e o nucleo canonico de decisao comercial e financeira do FINQZ PRO.
- O CRM continua sendo o sistema oficial de relacionamento e identidade comercial.
- O Pipeline continua sendo o sistema oficial de estagio e progresso.
- A Operacao continua sendo o sistema oficial de execucao pos-conversao.
- O EDP decide, recomenda, explica, compara, registra e encaminha.
- O EDP nao substitui regras oficiais por IA.
- O EDP nao cria fontes paralelas de verdade.

Resultado esperado:

- Uma plataforma SaaS Enterprise preparada para ao menos 10 anos de expansao.
- Fluxo unico e rastreavel desde Lead ate Pos-venda.
- Ranking inteligente com explicabilidade.
- Propostas versionadas, auditaveis e compartilhaveis.
- Integracao nativa com multiempresa, providers, compliance e analytics.

Parecer arquitetural final:

**GO WITH RESTRICTIONS**

Motivo:

- A definicao do dominio e correta e necessaria.
- O escopo e amplo e deve ser materializado em ondas.
- O legacy ainda exige convivencia controlada em certas camadas.
- O EDP deve nascer com contratos, auditoria e limites claros antes de qualquer expansao funcional.

---

## 2. Problema de Negocio que o EDP Resolve

Hoje o FINQZ PRO precisa decidir melhor, mais rapido e com rastreabilidade sobre:

- qual oferta deve ser apresentada;
- qual provedor deve ser priorizado;
- qual produto e melhor para o perfil do cliente;
- qual estrategia comercial e mais adequada;
- qual risco operacional e regulatorio e aceitavel;
- qual impacto financeiro a decisao gera;
- qual caminho leva mais rapido e com maior conversao a operacao e pos-venda.

Sem o EDP, essas decisoes tendem a ficar fragmentadas entre telas, repositorios locais, heuristicas de interface, regras distribuidas e interpretacoes divergentes.

O EDP resolve quatro problemas de negocio simultaneamente:

1. **Decisao inconsistente**
   - a mesma entrada gera resultados diferentes em superficies diferentes.

2. **Baixa explicabilidade**
   - o usuario ve uma recomendacao, mas nao entende por que ela foi escolhida.

3. **Baixa escalabilidade comercial**
   - cada novo produto, provider ou mercado exige reconstruir logica.

4. **Baixa confianca operacional**
   - sem audit trail, versionamento e idempotencia, o negocio nao consegue defender a decisao.

Em termos executivos, o EDP existe para aumentar:

- conversao;
- velocidade de resposta;
- confianca do comercial;
- previsibilidade operacional;
- governanca de decisao;
- eficiencia de implementacao futura.

---

## 3. Visao Estrategica

O EDP e a camada de inteligencia aplicada do FINQZ PRO Enterprise.

Ele atua como um orquestrador de decisao que:

- recebe contexto de negocio;
- executa regras oficiais;
- consulta providers e catalogos;
- avalia risco, elegibilidade e ranking;
- produz propostas comparaveis;
- registra justificativas;
- dispara eventos para CRM, Pipeline e Operacoes;
- alimenta Analytics e IA com telemetria confiavel.

### Posicionamento estrategico

O EDP esta para o FINQZ PRO como um "decision brain" esta para uma plataforma enterprise:

- nao e apenas calculo;
- nao e apenas workflow;
- nao e apenas motor de proposta;
- nao e apenas integracao;
- nao e apenas IA.

Ele e a disciplina que transforma dados, regras, sinais e contexto em decisao operacionalizavel.

### Principios de direcao

- Backend First
- Single Source of Truth
- Tenant Scoped
- Contracts Before Runtime
- Audit First
- Explainability by Design
- Rules Over Guessing
- Event Driven by Default
- No Parallel Decision Logic

---

## 4. Bounded Context do EDP

### Definicao

O Bounded Context do EDP engloba todo o ciclo de decisao comercial-financeira entre a qualificacao da oportunidade e a materializacao da proposta, incluindo simulacao, ranking, proposta, justificativa, compartilhamento, aceite, rastreabilidade e eventos de orquestracao.

### O que pertence ao EDP

- simulacao de cenarios;
- avaliacao de regras;
- estrategia decisoria executiva tenant scoped;
- ranking inteligente;
- consolidacao de ofertas;
- geracao e versionamento de propostas;
- justificativa de decisao;
- fluxo guiado de decisao;
- monitoramento de provider;
- eventos de decisao;
- auditoria de calculo e alteracao;
- recomendacoes assistidas por IA;
- workflow de decisao.

### O que nao pertence ao EDP

- cadastro canonico de cliente;
- cadastro canonico de pipeline;
- lifecycle canonico de oportunidade;
- lifecycle canonico de operacao;
- catalogo mestre de produtos, modalidades e segmentos;
- identidade multiempresa;
- politica geral de acesso da plataforma;
- faturamento, settlement e contabilizacao final;
- analytics de BI como fonte oficial;
- IA como fonte de verdade.

### Fronteiras formais

O EDP consome referencia oficial de:

- CRM para cliente e relacionamento;
- Master Catalog para taxonomias;
- Providers para capacidades e respostas;
- Pipeline para contexto de etapa;
- Oportunidades para materializacao;
- Operacoes para execucao pos-aceite;
- Financeiro futuro para impacto economico;
- Analytics para observacao e tendencias;
- IA para assistencia e explicacao;
- Multiempresa para segregacao de contexto.

O EDP publica para:

- CRM;
- Pipeline;
- Oportunidades;
- Operacoes;
- Analytics;
- Auditoria;
- Notificacoes;
- Integracoes externas autorizadas.

---

## 5. Subdominios Oficiais do EDP

O EDP deve ser operado como dominio estrategico com contextos menores, cada um com responsabilidade propria e sem sobreposicao funcional.

### Mapa de subdominios

| Subdominio | Responsabilidade principal | Fora de escopo |
|---|---|---|
| Decision Core | Orquestrar a decisao canonica e compor o resultado final | Nao conter policy, scoring ou simulacao isolada |
| Decision Policy | Manter pesos, prioridades, campanhas, objetivos e desempates versionados | Nao executar decisao nem simular cenarios |
| Decision Strategy | Declarar a intencao executiva versionada do tenant | Nao definir pesos taticos nem substituir policy |
| Simulation Engine | Executar cenarios, premissas e resultados projetados | Nao substituir ranking nem regras oficiais |
| Rules Engine | Avaliar regras de elegibilidade, restricao e conformidade | Nao inferir estrategia nem preferencia comercial |
| Ranking | Classificar alternativas por score e prioridade | Nao gerar proposta completa sozinho |
| Proposal Center | Versionar, exibir, compartilhar e manter propostas | Nao substituir operacao nem CRM |
| Provider Hub | Registrar, normalizar e monitorar providers | Nao ser o catalogo mestre nem a regra de negocio final |
| Provider Operations | Governa lifecycle de capacidade, contrato e ambiente do provider | Nao decidir oferta nem score |
| Intelligence Engine | Assistencia, explicacao, deteccao de inconsistencias | Nao ser fonte de verdade nem decisor final |
| Workflow Engine | Orquestrar passos, tarefas, timeouts e estados | Nao armazenar regra de negocio canonica |
| Event Hub | Publicar e consumir eventos de decisao | Nao ser banco de consulta primaria |
| Audit Center | Garantir rastreabilidade, historico e conformidade | Nao alterar resultado oficial |

### 5.1 Decision Core

Responsavel por:

- montar o contexto de decisao;
- orquestrar policy, simulacao, regras, ranking e proposta;
- coordenar transicoes de estado;
- consolidar resultado final e justificativa;
- publicar eventos canonicos de decisao.

Nao responsavel por:

- policy de negocio;
- calculo matematico isolado;
- scoring isolado;
- UI;
- persistencia de catalogo;
- IA generativa sem controle;
- workflow manual de negocio fora do dominio.

### 5.1.1 Decision Policy

Responsavel por:

- definir pesos por tenant, produto, canal, campanha e mercado;
- manter prioridades e criterios de desempate;
- versionar politicas comerciais e objetivos;
- aplicar effective dating;
- suportar aprovacao formal;
- permitir rollback da versao ativa;
- registrar audit trail completo;
- manter escopo estritamente tenant scoped.

Conteudo canonico da policy:

- weights;
- priorities;
- campaigns;
- goals and objectives;
- tie-breakers;
- commercial rules;
- eligibility overrides autorizados;
- execution windows;
- effective start and end;
- approval state;
- version state.

Regras:

- policy nunca e inferida pelo runtime;
- policy nunca e alterada silenciosamente;
- policy precisa ser reproduzivel por versao;
- policy nao pode cruzar tenants;
- policy nao pode ser embutida em tela, provider ou IA.

### 5.1.2 Decision Strategy

Responsavel por:

- declarar a intencao executiva predominante do tenant;
- manter objetivos de negocio em nivel estrategico;
- orientar prioridades entre conversao, margem, retencao, SLA e velocidade;
- carregar contexto versionado de estrategia para decisao e ranking;
- permanecer tenant scoped e auditavel.

Nao responsavel por:

- definir pesos taticos de policy;
- executar calculo;
- substituir ranking;
- substituir regras oficiais;
- governar provider.

### 5.2 Simulation Engine

Responsavel por:

- simular cenarios baseados em premissas;
- testar variaveis de parcela, prazo, taxa, custo, risco e retorno;
- produzir saidas comparaveis;
- alimentar ranking e proposta.

Nao responsavel por:

- validar elegibilidade final;
- autorizar operacao;
- impor regras de negocio oficiais;
- escolher proposta vencedora por conta propria.

### 5.3 Rules Engine

Responsavel por:

- aplicar regras de negocio, compliance e restricoes;
- classificar bloqueios, alertas e excecoes;
- verificar aderencia a politicas por tenant, produto e provider.

Nao responsavel por:

- interfaces;
- heuristicas de apresentacao;
- decisao comercial subjetiva;
- sugestoes de IA sem amparo de regra.

### 5.4 Ranking

Responsavel por:

- calcular score multi-criterio;
- ordenar ofertas e cenarios;
- mostrar trade-offs;
- produzir ranking por cliente, comercial, empresa, provider, operacao, compliance e estrategia.

Nao responsavel por:

- executar contrato;
- aprovar excecao;
- alterar dados de origem;
- substituir regras obrigatorias.

### 5.5 Proposal Center

Responsavel por:

- gerar proposta canonica;
- controlar versoes, snapshot e validade;
- permitir compartilhamento seguro;
- manter historico e timeline;
- preparar PDF e link seguro;
- registrar aceite, recusa e revogacao;
- preservar consentimento e identidade;
- suportar QR Code como canal de acesso;
- emitir eventos derivados.

Nao responsavel por:

- ser a tela de CRM;
- ser o repositorio de cliente;
- ser a operacao final;
- substituir assinatura digital futura;
- operar como portal publico sem governanca;

### Futuro

- assinatura digital como evolucao;
- portal do cliente como evolucao;
- API publica como evolucao controlada.

### 5.6 Provider Hub

Responsavel por:

- registrar capacidades dos providers;
- normalizar payloads;
- medir health, SLA, timeout, retry e fallback;
- classificar diagnostico e confiabilidade;
- manter sandbox e producao como ambientes distintos;
- versionar contrato do provider;
- deprecar capacidades com controle;
- certificar readiness de provider;
- expor observabilidade por provider e por capability.

Nao responsavel por:

- decidir produto;
- alterar catalogo;
- expor detalhes tecnicos indevidos ao usuario final;
- criar contrato comercial fora do EDP;
- misturar sandbox com producao;
- aceitar payload bruto como canonico.

### 5.6.1 Provider Operations

Responsavel por:

- governar o lifecycle de capacidade do provider;
- certificar sandbox e producao;
- controlar deprecacao e retirada de contrato;
- gerir limites operacionais e readiness;
- manter diagnostico e observabilidade por capability.

Nao responsavel por:

- decidir oferta;
- calcular score;
- substituir catalogo;
- operar como motor de negocio;
- expor payload bruto ou contexto sensivel.

### 5.7 Intelligence Engine

Responsavel por:

- sugerir proximos passos;
- explicar a recomendacao;
- detectar inconsistencias;
- apoiar o usuario com insights;
- resumir contexto e anomalias.

Nao responsavel por:

- substituir regras oficiais;
- alterar score oficial sem trilha;
- inventar justificativas sem base em dados;
- decidir contra compliance.

### 5.8 Workflow Engine

Responsavel por:

- coordenar tarefas, passos e pendencias;
- suportar estados e transicoes;
- lidar com SLA de decisao;
- disparar alertas e recuperacao.

Nao responsavel por:

- armazenar regras oficiais;
- ser motor de calculo;
- atuar como banco de eventos.

### 5.9 Event Hub

Responsavel por:

- publicar eventos de dominio;
- distribuir eventos para consumidores;
- garantir rastreabilidade por correlacao;
- suportar integra, observacao e reprocessamento controlado.

Nao responsavel por:

- consulta primaria;
- regra de negocio;
- estado canonico de aggregate.

### 5.10 Audit Center

Responsavel por:

- armazenar trilha de auditoria;
- manter Audit Timeline consistente com os eventos canonicos;
- registrar quem decidiu, quando, com quais inputs e versoes;
- garantir conformidade, LGPD e defesa da decisao;
- preservar historico imutavel.

Nao responsavel por:

- alterar o resultado;
- recalcular proposta sem autorizacao;
- servir como motor de decisao.

---

## 6. Integracao com os Demais Dominios

### 6.1 CRM

O CRM e a fonte oficial de:

- identidade do cliente;
- relacionamentos;
- dados cadastrais;
- contexto comercial.

O EDP consome do CRM:

- cliente;
- contatos;
- segmento;
- origem comercial;
- historico relacional.

O EDP devolve ao CRM:

- recomendacao;
- status da simulacao;
- proposta;
- aceite;
- trilha de decisao.

### 6.2 Oportunidades

Oportunidade e o recipiente oficial da conversao comercial.

O EDP:

- nao substitui a oportunidade;
- alimenta a oportunidade com resultado validado;
- gera transicao a partir do aceite;
- mantém referencial de proposta e decisao.

### 6.3 Pipeline

Pipeline e o sistema oficial de fluxo e estagio.

O EDP:

- le o contexto do estagio;
- respeita o estado da oportunidade;
- nao cria estagios arbitrarios;
- nao governa o pipeline.

### 6.4 Operacoes

Operacoes e o sistema oficial de execucao pos-conversao.

O EDP:

- dispara a materializacao da operacao;
- entrega dados de aceite e proposta;
- envia eventos para abertura do ciclo operacional;
- nao administra o ciclo operacional completo.

### 6.5 Financeiro futuro

O futuro Financeiro consume do EDP:

- impacto estimado;
- margem projetada;
- custo;
- previsao de retorno;
- cenarios de fluxo.

O EDP nao substitui:

- contas a pagar;
- contas a receber;
- contabilizacao;
- settlement;
- faturamento.

### 6.6 Analytics

Analytics consome:

- eventos de decisao;
- tempo de resposta;
- funil de conversao;
- performance de provider;
- sucesso de recomendacao;
- retrabalho;
- rejeicao.

Analytics nao redefine a verdade operacional.

### 6.7 IA

IA atua como:

- assistente;
- resumidor;
- explicador;
- detector de inconsistencias;
- recomendador de proximo passo.

IA nao e fonte de verdade.

### 6.8 Master Catalog

Master Catalog e a fonte oficial de:

- produtos;
- modalidades;
- segmentos;
- atributos canonicos.

EDP consome o catalogo, nao o redefine.

### 6.9 Parceiros

Parceiros representam o ecossistema comercial e operacional de distribuicao, indicacao e relacao.

O EDP pode:

- registrar origem parceira;
- avaliar elegibilidade de parceiro;
- priorizar ofertas por canal.

### 6.10 Providers

Providers sao as fontes externas ou servicos que retornam cotacoes, respostas ou avaliacoes.

O EDP centraliza:

- normalizacao;
- health;
- fallback;
- ranking de confiabilidade.

### 6.11 Multiempresa

O EDP e tenant scoped por definicao e suporta multiempresa como contexto de segregacao obrigatoria.

Regras:

- nenhum contexto cruza tenants;
- nenhuma proposta e compartilhada fora do tenant sem politica explicita;
- logs, eventos e auditorias precisam carregar tenantId e companyId quando aplicavel.

---

## 7. Fluxo Completo Oficial

Fluxo canonico:

`Lead -> Simulacao -> Ranking -> Proposta -> Aceite -> Oportunidade -> Operacao -> Pos-venda`

### Fluxo textual

```text
Lead
  -> qualificacao comercial
  -> contexto de cliente e produto
  -> simulacao oficial
  -> avaliacao de regras
  -> ranking de alternativas
  -> proposta versionada
  -> compartilhamento seguro
  -> aceite registrado
  -> oportunidade atualizada
  -> operacao materializada
  -> acompanhamento pos-venda
```

### Leitura executiva do fluxo

1. O Lead entra com contexto comercial.
2. O EDP monta o caso de decisao.
3. O Simulation Engine gera cenarios.
4. O Rules Engine valida o que pode ou nao pode.
5. O Ranking ordena o melhor caminho.
6. O Proposal Center consolida e versiona a proposta.
7. O usuario compartilha e coleta aceite.
8. A Oportunidade recebe a conversao.
9. A Operacao inicia a execucao.
10. O pos-venda fecha o ciclo e retroalimenta o aprendizado.

---

## 8. Modelo Conceitual das Principais Entidades

### Entidades centrais

- Decision
- DecisionRequest
- SimulationScenario
- SimulationRun
- RuleSet
- RuleEvaluation
- RankingProfile
- RankedOffer
- Proposal
- ProposalVersion
- ProposalSnapshot
- Offer
- ProviderCapability
- ProviderHealth
- DecisionJustification
- DecisionOutcome
- WorkflowInstance
- WorkflowStep
- AuditEntry
- EventEnvelope
- Recommendation
- Acceptance
- PostSaleCase

### Descricao resumida

| Entidade | Papel |
|---|---|
| Decision | Agrupador canonico de uma decisao comercial-financeira |
| DecisionRequest | Pedido inicial de decisao com contexto minimo |
| SimulationScenario | Cenário hipotetico com premissas variaveis |
| SimulationRun | Execucao concreta de um scenario |
| RuleSet | Conjunto versionado de regras aplicaveis |
| RuleEvaluation | Resultado da aplicacao de regras |
| RankingProfile | Perfil de criterio usado para ranquear |
| RankedOffer | Oferta classificada com score e explicacao |
| Proposal | Objeto de proposta visivel ao negocio |
| ProposalVersion | Versao imutavel de uma proposta |
| ProposalSnapshot | Estado congelado de dados no momento da geracao |
| Offer | Alternativa comercial ou financeira candidata |
| ProviderCapability | Capacidade registrada de um provider |
| ProviderHealth | Status operacional do provider |
| DecisionJustification | Base explicativa da escolha final |
| DecisionOutcome | Resultado oficial da decisao |
| WorkflowInstance | Instancia de fluxo de trabalho |
| WorkflowStep | Passo individual do fluxo |
| AuditEntry | Registro de auditoria imutavel |
| EventEnvelope | Envelopamento padronizado de evento |
| Recommendation | Recomendacao gerada ao usuario |
| Acceptance | Registro de aceite |
| PostSaleCase | Registro de acompanhamento pos-venda |

---

## 9. Agregados, Eventos e Estados

### 9.1 Agregados principais

#### Decision Aggregate

Responsavel por:

- contexto da decisao;
- relacao com cliente, tenant, produto e canal;
- status principal do caso;
- links para simulacoes, ranking e proposta.

#### Decision Policy Aggregate

Responsavel por:

- pesos, prioridades, campanhas e desempates;
- versionamento e vigencia;
- aprovacao, ativacao e rollback.

#### Decision Strategy Aggregate

Responsavel por:

- intencao executiva versionada;
- objetivos predominantes;
- escopo tenant scoped;
- aprovacao, ativacao e rollback.

#### Proposal Aggregate

Responsavel por:

- versao ativa;
- historico;
- validade;
- snapshot;
- compartilhamento;
- aceite.

#### Provider Capability Aggregate

Responsavel por:

- capacidades;
- SLA;
- health;
- timeout;
- retry policy;
- diagnostico.

#### Provider Execution Aggregate

Responsavel por:

- registrar tentativas e execucoes contra providers;
- rastrear latencia, status, retry e fallback;
- manter traces sanitizados.

#### Workflow Aggregate

Responsavel por:

- estado de orquestracao;
- tarefas pendentes;
- expiracoes;
- transicoes.

#### Audit Timeline Aggregate

Responsavel por:

- trilha imutavel;
- correlacao de evento;
- versoes de regra e proposta.

### 9.2 Eventos de dominio

- DecisionRequested
- SimulationRequested
- SimulationCompleted
- RulesEvaluated
- RankingComputed
- RecommendationGenerated
- ProposalCreated
- ProposalVersioned
- ProposalShared
- ProposalViewed
- ProposalAccepted
- ProposalExpired
- DecisionApproved
- DecisionRejected
- OpportunityCreated
- OperationCreated
- PostSaleOpened
- ProviderHealthChanged
- ProviderTimeoutObserved
- ProviderFallbackTriggered
- RuleSetPublished
- AuditRecorded
- DecisionExplanationGenerated

### 9.3 Maquina de estados da decisao

Estados canonicos:

`Draft -> Qualifying -> Simulating -> Ranked -> Proposed -> Shared -> Accepted -> Converted -> Operationalized -> PostSale -> Closed`

Estados de excecao:

`Rejected`, `Expired`, `Cancelled`, `NeedsReview`, `FallbackUsed`, `ComplianceBlocked`

### 9.4 Maquina de estados da proposta

`Draft -> Generated -> Versioned -> Shared -> Viewed -> Accepted -> Expired -> Superseded -> Archived`

### 9.5 Maquina de estados do provider

`Unknown -> Healthy -> Degraded -> Unhealthy -> FallbackActive -> RecoveryPending -> Recovered`

---

## 10. Modelo de Ranking Inteligente

O ranking inteligente do EDP deve ser multi-eixo, transparente e auditavel.

### Eixos de ranking

1. Cliente
   - aderencia ao perfil;
   - historico;
   - preferencia;
   - elegibilidade.

2. Comercial
   - potencial de conversao;
   - facilidade de fechamento;
   - tempo estimado ate aceite.

3. Empresa
   - prioridade estrategica;
   - margem;
   - politica de canal;
   - capacidade de atendimento.

4. Provider
   - confiabilidade;
   - SLA;
   - latencia;
   - taxa de sucesso;
   - custo operacional.

5. Operacao
   - complexidade de materializacao;
   - risco de retrabalho;
   - tempo de execucao;
   - necessidade de interacao manual.

6. Compliance
   - aderencia regulatoria;
   - restricoes obrigatorias;
   - bloqueios e alertas;
   - LGPD e mascaramento.

7. Estrategia
   - prioridade de produto;
   - mercado alvo;
   - roadmap comercial;
   - expansao de canal.

### Formato do score

O score deve ser composto por:

- score principal;
- score por eixo;
- peso por tenant e por produto;
- justificativa textual;
- sinais de confianca;
- flags de bloqueio;
- comparacao com alternativas proximas.

### Regras do ranking

- O ranking nao pode ocultar o motivo da decisao.
- O ranking nao pode vencer sobre uma regra obrigatoria.
- O ranking deve ser recalculavel por versao.
- O ranking deve ser consistente entre front e back.
- O ranking deve ser explicavel em linguagem de negocio.

---

## 11. Como o Usuario Vera a Recomendacao

### Formatos de exibicao oficiais

- Score geral.
- Ranking comparativo entre ofertas.
- Justificativa resumida.
- Justificativa detalhada.
- Impacto financeiro.
- Impacto operacional.
- Alertas de compliance.
- Explicacao da IA.
- Motivo de fallback, se houver.

### Regras de experiencia

- O usuario deve ver primeiro o melhor caminho e por que ele existe.
- O usuario deve poder comparar cenarios lado a lado.
- O usuario deve enxergar bloqueios antes de insistir.
- O usuario deve conseguir rastrear cada versao da proposta.
- O usuario deve entender quando a IA apenas sugere.

### Transparencia obrigatoria

Toda recomendacao deve exibir:

- origem dos dados;
- versao das regras;
- versao do ranking;
- timestamp;
- provider envolvido;
- motivo de exclusao de alternativas rejeitadas.

---

## 12. Proposal Center

O Proposal Center e o subdominio responsavel por transformar a decisao em ativo comercial versionado.

### Responsabilidades

- criar proposta canonica;
- manter versionamento;
- armazenar historico;
- preservar snapshot;
- controlar validade;
- registrar timeline;
- compartilhar com link seguro;
- gerar PDF;
- preparar assinatura digital futura.

### Estrutura conceitual

- Proposal
- ProposalVersion
- ProposalSnapshot
- ProposalTimeline
- ProposalShare
- ProposalValidity
- ProposalAttachment
- ProposalAcceptance

### Regras

- Uma proposta precisa ser versionada, nunca sobrescrita silenciosamente.
- O snapshot da proposta precisa congelar entradas criticas.
- O link seguro precisa expirar por politica.
- O PDF precisa refletir a versao exata aceita.
- O aceite precisa referenciar a versao e o contexto da decisao.

### Assinatura digital

Status:

- nao obrigatoria nesta fase;
- prevista como evolucao de roadmap;
- deve entrar como integracao, nao como regra de negocio base.

---

## 13. Provider Hub

O Provider Hub e o dominio que organiza capacidade, confiabilidade e diagnostico dos provedores.

### Responsabilidades

- registro de capacidades;
- cadastro de contrato tecnico;
- health check;
- monitoramento de SLA;
- retry policy;
- timeout policy;
- normalizacao de resposta;
- fallback policy;
- diagnostico operacional;
- ranking de provider.

### Atributos oficiais

- ProviderId
- CapabilitySet
- SupportedProducts
- SupportedChannels
- HealthStatus
- SLAProfile
- RetryPolicy
- TimeoutPolicy
- FallbackPolicy
- DiagnosticTrace
- ReliabilityScore

### Regras

- Provider nao define regra oficial do negocio.
- Provider nao substitui catalogo mestre.
- Provider nao pode poluir o modelo canonico com payload bruto.
- Provider deve ser normalizado para contrato interno.
- Fallback precisa ser rastreavel e audivel.

---

## 14. Estrategia de IA

### Papel da IA

A IA deve atuar como camada de assistencia e interpretacao.

Ela pode:

- explicar porque uma recomendacao foi escolhida;
- sugerir melhor oferta dentro das restricoes vigentes;
- sugerir proximo passo;
- detectar inconsistencias no contexto;
- resumir o historico da decisao;
- apontar anomalias de provider ou de regra.

### Proibicoes

- IA nao pode substituir regras oficiais.
- IA nao pode aprovar excecao regulatoria sozinha.
- IA nao pode criar fonte paralela de verdade.
- IA nao pode alterar score oficial sem trilha.

### Uso recomendado

- resumir propostas longas;
- contextualizar comparativos;
- sugerir perguntas ao usuario;
- explicar trade-offs;
- apoiar onboarding operacional.

### Ponto de controle

Toda saida de IA deve ser classificada como:

- sugestao;
- explicacao;
- sumarizacao;
- alerta;
- nunca como decisao soberana.

---

## 15. Principios de UX

### Principios oficiais

- Interface limpa.
- Fluxos guiados.
- Explicabilidade.
- Transparencia.
- Performance.
- Mobile First no roadmap futuro.
- Acessibilidade.

### Diretrizes objetivas

- O fluxo principal deve ser linear e previsivel.
- A interface deve reduzir ambiguidade.
- O caminho de decisao precisa ser rastreavel.
- A proposta precisa ser consumivel em poucos passos.
- O usuario nao deve precisar entender a arquitetura para usar o sistema.
- Acesso mobile deve ser planejado, mas nao improvisado.

### Padrao de interacao

- primeiro mostrar o melhor caminho;
- depois as alternativas;
- depois as restricoes;
- depois os detalhes tecnicos;
- por fim o historico completo.

---

## 16. Principios de Seguranca

### Principios obrigatorios

- LGPD
- RBAC
- Tenant Isolation
- Audit Trail
- Versionamento
- Idempotencia
- Mascaramento de dados
- Criptografia quando aplicavel

### Regras de seguranca

- Todo acesso precisa respeitar tenant e permissao.
- Dados sensiveis devem ser mascarados por perfil.
- Dados devem respeitar classificacao e retencao por tipo.
- Consentimento precisa ser registrado quando aplicavel.
- Eventos e auditorias precisam carregar correlacao e assinatura.
- Decisoes devem ser reproduziveis por versao.
- Operacoes criticas devem ser idempotentes.
- Compartilhamento externo precisa usar links seguros e expiraveis.
- Snapshots precisam ter integridade verificavel.
- Logs nao podem expor dados sensiveis.

### Protecoes adicionais

- segregacao de ambiente;
- trilha de auditoria imutavel;
- controle de reexecucao;
- protecao contra replay indevido;
- verificacao de integridade da proposta.
- anonimização e descarte seguro quando aplicavel;

---

## 17. Observabilidade e Metricas

### Metricas oficiais

- Conversao
- Aceite
- Rejeicao
- Tempo de calculo
- Tempo de resposta
- Performance dos providers
- Performance comercial
- Eficiencia operacional

### Metricas complementares

- taxa de fallback;
- taxa de timeout;
- taxa de reprocessamento;
- divergencia entre recomendacao e aceite;
- taxa de reabertura de proposta;
- tempo entre Lead e aceite;
- tempo entre aceite e operacao;
- taxa de inconsistencia detectada pela IA;
- taxa de bloqueio de compliance.
- score drift;
- performance por policy version;
- performance por tenant;
- performance por produto;
- performance por provider;
- fallback por capability;
- uso da explicacao;
- taxa de override humano;
- taxa de recomendacao aceita;
- taxa de recomendacao rejeitada;
- conversao por ranking position.

### Observabilidade por camada

- Decision Core: latencia e consistencia;
- Decision Policy: aderencia e drift por versao;
- Simulation Engine: custo computacional;
- Rules Engine: taxa de bloqueio e versionamento;
- Ranking: estabilidade de score;
- Proposal Center: taxa de aceite, expiracao, revogacao e recusa;
- Provider Hub: health, SLA, retry, timeout e fallback;
- Workflow Engine: tempo de transicao;
- Audit Center: integridade e cobertura;
- Intelligence Support: taxa de uso da explicacao e qualidade percebida.

---

## 18. Escalabilidade para os Proximos 10 Anos

### Direcao de longo prazo

O EDP deve ser construido para evoluir sem reescrever o dominio.

### Eixos de expansao

1. Novos produtos
   - ampliar taxonomias e regras sem quebrar o core.

2. Novos providers
   - adicionar integracoes via normalizacao e contratos internos.

3. Novos mercados
   - suportar regimes regulatorio e comercial distintos.

4. Novos canais
   - web, mobile, parceiros, APIs, embedded, assistentes.

5. APIs publicas
   - exposicao controlada por escopo e contrato.

6. Marketplace
   - distribuicao e consumo de ofertas autorizadas.

7. Aplicativos moveis
   - decisao assistida e consulta operacional.

8. IA avancada
   - explicacao, busca semantica e assistencia contextual.

### Principios de escalabilidade

- separar decisao de apresentacao;
- separar regra de recomendacao;
- separar contrato de provider de regra interna;
- versionar tudo que impacta decisao;
- evitar acoplamento ao front;
- favorecer eventos e leitura materializada.

---

## 19. Roadmap Arquitetural

### Regra de sequenciamento

- H19-C2.2 conclui o correction pack antes de qualquer contratacao de runtime;
- H19-C3 so pode iniciar depois da separacao de Decision Policy;
- contratos devem nascer depois da separacao de Decision Policy;
- backend skeleton somente depois dos contratos;
- frontend migration somente depois do runtime backend.

### H19-C3

Objetivo:

- consolidar o desenho canonico do EDP;
- fechar o vocabulario oficial;
- definir contratos e boundaries;
- publicar o mapa de eventos e estados.

### H19-C4

Objetivo:

- estabilizar Proposal Center e Ranking;
- consolidar integracao com CRM, Pipeline e Oportunidades;
- preparar leituras comparativas e governanca de decisao.

### H19-C5

Objetivo:

- consolidar Provider Hub e Audit Center;
- formalizar fallback, SLA e versionamento;
- expandir observabilidade por provider e policy.

### H20

- consolidacao operacional do EDP;
- governance de decisao;
- cobertura de variacoes;
- hardening de compliance.

### H21

- ampliacao da Intelligence Support;
- explicacao contextual;
- sugestao de proximo passo;
- deteccao automatica de inconsistencias.

### H22

- expansao de canais e novos providers;
- APIs publicas controladas;
- marketplace readiness.

### H23

- multiempresa avancada;
- novos mercados;
- politicas regionais;
- compliance por jurisdicao.

### H24

- mobile first nativo;
- consulta assistida;
- proposta consultavel e explicavel em mobile.

### H25

- consolidacao do EDP como motor enterprise de decisao da plataforma;
- IA avancada assistida;
- ecossistema de ofertas;
- maturidade de observabilidade;
- extensibilidade validada para 10 anos.

---

## 20. Riscos Arquiteturais e Respostas

| Risco | Impacto | Resposta recomendada |
|---|---|---|
| Reintroducao de logica de decisao no frontend | Alto | Contracts before runtime e SSOT no backend |
| IA substituir regra oficial | Alto | Guardrails e classificacao obrigatoria de saidas |
| Providers divergirem do contrato interno | Alto | Provider Hub com normalizacao e fallback |
| Propostas sobrescritas sem versao | Alto | Proposal Center com snapshot e versionamento |
| Falta de audit trail | Alto | Audit Center first |
| Mistura de tenant e company | Alto | Tenant isolation obrigatoria |
| Regras sem versionamento | Alto | RuleSet versionado e reproduzivel |
| Cenario sem explicabilidade | Medio | Justificativa obrigatoria em toda saida |

---

## 21. Decisoes Explícitas

1. O EDP e um dominio de primeiro nivel.
2. O EDP substitui a ideia de simulador isolado.
3. O EDP e o centro canonico de decisao, ranking e proposta.
4. Decision Policy e um dominio explicito e versionado.
5. Decision Strategy e um dominio explicito e versionado.
6. Decision Core e um orquestrador, nao um motor de policy ou scoring.
7. Provider Operations governa sandbox, producao, certificacao e deprecacao.
8. O EDP nao substitui CRM, Pipeline, Operacoes ou Master Catalog.
9. O EDP consome Provider Hub, mas nao cede a ele a verdade do negocio.
10. A IA e assistente, nunca soberana.
11. Proposta precisa ser versionada e auditavel.
12. Toda decisao relevante precisa ter justificativa e trilha.
13. Multiempresa e tenant isolation sao obrigatorios.
14. O roadmap deve ser executado por ondas, com contratos antes de runtime.

---

## 22. Conclusao Executiva

O Enterprise Decision Platform e uma evolucao arquitetural necessaria para o FINQZ PRO Enterprise.

Ele resolve a lacuna entre dados operacionais, regras de negocio, simulacao, comparacao, recomendacao e materializacao comercial.

A decisao de criar o EDP como dominio de primeiro nivel e correta e estrategicamente alinhada com a ambicao de longo prazo da plataforma.

O unico ponto de cautela e a amplitude do escopo: o dominio deve nascer por contratos, auditoriavel desde o inicio e com limites firmes entre decisao, orquestracao, provider e IA.

### Parecer final

**GO WITH RESTRICTIONS**

Restricoes:

- executar por ondas;
- manter SSOT no backend;
- preservar auditabilidade total;
- nao delegar decisao oficial a IA;
- nao permitir que frontend ou provider assumam papel canonico;
- nao acelerar expansao sem contrato formal e rastreavel.
