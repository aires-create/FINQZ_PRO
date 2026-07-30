# ARCH-019 - Workspace State Machine

Status: Proposed
Date: 2026-06-11
Owner: Architecture
Type: Architectural Contract
Project: FINQZ PRO

---

## 1. Objetivo

Formalizar a maquina de estados oficial do FINQZ PRO para o Opportunity Workspace, definindo estados globais, eventos canonicos, transicoes permitidas e restricoes de governanca.

Este documento existe para unificar a leitura operacional do ciclo de negocio sem confundir identidade, oportunidade, execução financeira e liquidacao.

Ele deve ser lido em conjunto com:

- `ADR-007` - Lead, Customer, Simulation and Opportunity Model
- `ADR-008` - Revenue Distribution Engine
- `ADR-009` - Operation Persistence and Financial Execution Aggregate
- `ARCH-004` - Entities Model
- `ARCH-005` - Relationships
- `ARCH-008` - Operational Events
- `ARCH-016` - Opportunity Workspace Blueprint
- `ARCH-017` - Workspace Ownership Matrix
- `ARCH-018` - Domain Boundary Matrix

---

## 2. Principios

### 2.1 Um estado global, varias entidades subjacentes

A maquina de estados do workspace representa a progressao oficial da oportunidade como unidade operacional, sem substituir os estados internos de Customer, Simulation, Proposal, Operation, Commission ou Settlement.

### 2.2 Estados globais refletem marcos do negocio

Cada estado global precisa corresponder a um marco operacional claro e audivel.

### 2.3 Eventos dirigem transicoes

Transicoes canonicas devem ser disparadas por eventos de dominio e nao por mudanca arbitraria de interface.

### 2.4 Estados terminais sao encerramentos reais

Estados terminais representam conclusao, perda, cancelamento, expiracao ou falha do fluxo.

### 2.5 Nao existe atalho para verdade

O workspace nao pode pular etapas canonicas sem manter rastreabilidade e autorizacao apropriadas.

### 2.6 Multi-tenant, RBAC e auditoria sao invariantes

Nenhuma transicao e valida se violar escopo, permissao ou rastreabilidade.

---

## 3. Estados Globais

Os estados globais oficiais do FINQZ PRO sao:

```text
NEW
QUALIFIED
SIMULATED
PROPOSED
APPROVED
OPERATED
COMMISSIONED
SETTLED
```

### 3.1 NEW

Estado inicial da oportunidade ou do fluxo operacional quando o contexto foi criado, recebido ou importado.

Significado:

- existe contexto inicial;
- ainda nao houve consolidacao suficiente para decisao final;
- o fluxo pode ter origem em Lead, Customer, importacao ou criacao manual.

### 3.2 QUALIFIED

Estado em que o contexto foi validado comercialmente e esta apto a prosseguir.

Significado:

- existe leitura minimamente confiavel;
- ha criterio de elegibilidade comercial ou operacional;
- o fluxo pode seguir para simulacao ou proposta.

### 3.3 SIMULATED

Estado em que uma simulacao relevante foi executada e produziu resultado rastreavel.

Significado:

- a viabilidade foi calculada;
- o usuario tem base para comparacao e decisao;
- a oportunidade pode seguir para proposta ou ajuste.

### 3.4 PROPOSED

Estado em que existe proposta formal, snapshot de condicoes ou negociacao com provider.

Significado:

- ha materializacao da condicao comercial;
- o fluxo entrou em fase de aprovacao ou validacao;
- a operacao ainda nao foi executada.

### 3.5 APPROVED

Estado em que a proposta ou condicao foi aprovada para avancar.

Significado:

- a decisao comercial ou operacional foi aceita;
- o fluxo pode originar execucao;
- pendencias criticas foram resolvidas ou assumidas.

### 3.6 OPERATED

Estado em que a operacao foi executada e o negocio entrou em ciclo financeiro efetivo.

Significado:

- `Operation` existe como agregado oficial;
- o resultado operacional foi efetivado;
- a comissao pode ser calculada ou liberada conforme regras.

### 3.7 COMMISSIONED

Estado em que a comissao foi calculada e reconhecida como resultado financeiro devido.

Significado:

- a distribuicao financeira foi derivada de uma operation valida;
- existem valores elegiveis para liberacao ou pagamento;
- o fluxo entrou em governanca financeira.

### 3.8 SETTLED

Estado em que a liquidacao ou pagamento foi concluido.

Significado:

- o ciclo financeiro foi encerrado;
- a oportunidade atingiu fechamento operacional completo;
- o resultado final foi conciliado ou pago.

---

## 4. Estados Terminais

Os estados terminais oficiais sao:

```text
CANCELED
LOST
EXPIRED
FAILED
```

### 4.1 CANCELED

O fluxo foi interrompido por decisao consciente ou regra operacional.

### 4.2 LOST

O fluxo foi encerrado sem conversao ou sem prosseguimento comercial.

### 4.3 EXPIRED

O fluxo perdeu validade temporal, comercial ou operacional.

### 4.4 FAILED

O fluxo falhou em etapa critica e nao pode prosseguir no ciclo atual.

---

## 5. Eventos Canonicos

Os eventos canonicos que dirigem a maquina de estados sao:

- `OpportunityCreated`
- `OpportunityUpdated`
- `OpportunityQualified`
- `LeadQualified`
- `SimulationExecuted`
- `ProposalRequested`
- `ProposalReceived`
- `ProposalApproved`
- `ProposalRejected`
- `OperationCreated`
- `OperationProposalRequested`
- `OperationProposalReceived`
- `OperationProposalApproved`
- `OperationExecuted`
- `OperationFailed`
- `CommissionCalculated`
- `CommissionReleased`
- `CommissionPaid`
- `SettlementRequested`
- `SettlementConfirmed`
- `SettlementFailed`
- `OpportunityWon`
- `OpportunityLost`
- `OpportunityCanceled`
- `OpportunityExpired`
- `AuditLogCreated`

### Regra

Os eventos acima representam a linguagem canonica de transicao do workspace. Eventos auxiliares podem existir, mas nao devem redefinir o contrato oficial.

---

## 6. Transicoes Permitidas

### Fluxo principal progressivo

```text
NEW -> QUALIFIED -> SIMULATED -> PROPOSED -> APPROVED -> OPERATED -> COMMISSIONED -> SETTLED
```

### Transicoes laterais permitidas

- `NEW -> CANCELED`
- `NEW -> LOST`
- `NEW -> EXPIRED`
- `QUALIFIED -> CANCELED`
- `QUALIFIED -> LOST`
- `QUALIFIED -> EXPIRED`
- `SIMULATED -> CANCELED`
- `SIMULATED -> LOST`
- `SIMULATED -> EXPIRED`
- `PROPOSED -> CANCELED`
- `PROPOSED -> LOST`
- `PROPOSED -> EXPIRED`
- `PROPOSED -> FAILED`
- `APPROVED -> CANCELED`
- `APPROVED -> LOST`
- `APPROVED -> EXPIRED`
- `APPROVED -> FAILED`
- `OPERATED -> FAILED` apenas quando a execucao critica nao puder ser concluida
- `COMMISSIONED -> FAILED` apenas em erro grave de conciliacao ou reversao formal

### Transicoes de reconducao permitidas

Alguns dominios podem retroceder de maneira controlada quando a regra de negocio permitir, desde que a transicao seja auditavel e autorizada:

- `SIMULATED -> QUALIFIED`
- `PROPOSED -> SIMULATED`
- `APPROVED -> PROPOSED`
- `OPERATED -> APPROVED` somente em reversao formal ou invalidação controlada
- `COMMISSIONED -> OPERATED` somente em ajuste financeiro formal
- `SETTLED -> COMMISSIONED` somente em reversao ou conciliacao negativa formal

### Regra

Toda transicao de retrocesso exige justificativa, evento apropriado e rastreabilidade completa.

---

## 7. Transicoes Proibidas

As seguintes transicoes nao sao canonicas e devem ser consideradas proibidas salvo excecao explicitamente documentada por governanca superior:

- `NEW -> OPERATED`
- `NEW -> COMMISSIONED`
- `NEW -> SETTLED`
- `QUALIFIED -> OPERATED`
- `QUALIFIED -> COMMISSIONED`
- `QUALIFIED -> SETTLED`
- `SIMULATED -> OPERATED`
- `SIMULATED -> COMMISSIONED`
- `SIMULATED -> SETTLED`
- `PROPOSED -> SETTLED`
- `APPROVED -> SETTLED`
- `CANCELED -> QUALIFIED`
- `LOST -> APPROVED`
- `EXPIRED -> OPERATED`
- `FAILED -> SETTLED`

### Regra

Se uma transicao proibida ocorrer na pratica, isso indica:

- violacao de ownership;
- falha de validacao;
- evento fora de ordem;
- ou tentativa de contornar o lifecycle oficial.

---

## 8. Ownership das Transicoes

### 8.1 NEW

Owner primario:

- `Customer`
- `Lead`
- `Opportunity`

Transicoes de entrada podem ser originadas por cadastro, importacao ou conversao.

### 8.2 QUALIFIED

Owner primario:

- `Opportunity`

Dependencias:

- `Lead` quando existir;
- `Customer` quando houver identidade consolidada;
- `Activity` para registro operacional.

### 8.3 SIMULATED

Owner primario:

- `Simulation`

Dependencias:

- `Opportunity` como contexto quando a simulacao for vinculada;
- `Provider` e `CommercialTable` como origens de parametro.

### 8.4 PROPOSED

Owner primario:

- `Proposal`

Dependencias:

- `Opportunity`;
- `Simulation`;
- `Provider`.

### 8.5 APPROVED

Owner primario:

- `Opportunity`
- `Proposal`

Dependencias:

- validacao de negocio;
- aprovacoes formais;
- auditoria.

### 8.6 OPERATED

Owner primario:

- `Operation`

Dependencias:

- `Opportunity`;
- `Proposal`;
- `Provider`.

### 8.7 COMMISSIONED

Owner primario:

- `Commission`

Dependencias:

- `Operation`;
- `Revenue Distribution Engine`;
- regras de repasse e elegibilidade.

### 8.8 SETTLED

Owner primario:

- `Settlement`

Dependencias:

- `Commission`;
- `Operation`;
- integracao de pagamento ou conciliacao.

### 8.9 Estados terminais

Owner primario:

- `Opportunity`
- `Audit`

Dependencias:

- evento de encerramento correspondente;
- justificativa de negocio;
- rastreio completo.

---

## 9. Auditoria

### Regra

Toda transicao relevante da maquina de estados deve produzir auditoria e, quando aplicavel, evento de dominio.

### Conteudo minimo

- tenantId;
- actorId;
- actorType;
- previousState;
- nextState;
- entityType;
- entityId;
- eventType;
- timestamp;
- correlationId ou traceId;
- motivo da transicao quando necessario.

### Principios

- a auditoria deve ser imutavel;
- transicoes automatizadas devem ser identificaveis;
- retrocessos precisam de justificativa;
- transicoes proibidas devem ser detectaveis e alertadas.

---

## 10. Multi-tenant

### Regra

A maquina de estados e sempre tenant-scoped.

### Consequencias

- estados nao podem ser compartilhados entre tenants;
- eventos devem carregar tenantId;
- transicoes devem ser validadas no contexto do tenant ativo;
- reconciliacoes e reversoes devem respeitar isolamento de dados.

### Partner scope

Quando aplicavel, o partner scope deve limitar leitura, escrita e visibilidade das transicoes.

---

## 11. RBAC

### Regra

Nenhuma transicao pode ser executada sem permissao adequada.

### Diretrizes

- usuarios comerciais podem mover estados de entrada e qualificacao;
- usuarios operacionais podem avançar para proposal e operation;
- usuarios financeiros podem movimentar commission e settlement;
- compliance pode bloquear, revisar ou auditar transicoes;
- AI Copilot nao possui autoridade soberana para transicoes criticas.

### Princípio

RBAC deve validar tanto a acao quanto o contexto em que o estado esta sendo alterado.

---

## 12. Anti-Patterns

### Padroes proibidos

- pular `SIMULATED` e ir direto para `OPERATED`;
- pular `PROPOSED` e ir direto para `SETTLED`;
- usar `Opportunity` como estado final de liquidacao;
- tratar `Commissioned` como sinônimo de pago;
- permitir que `AI Copilot` altere estado critico sem confirmacao;
- usar a interface como fonte canonica do lifecycle;
- misturar estado de `Opportunity` com estado de `Operation`;
- reescrever estados terminais como se fossem intermediarios;
- permitir transicoes invisiveis sem evento;
- transformar excecao em regra permanente.

### Riscos associados

- perda de auditabilidade;
- quebra de conciliacao;
- inconsistencias entre centers;
- ambiguidade operacional;
- novo legado de estado fragmentado.

---

## 13. Roadmap Evolutivo

### Fase 1 - Consolidaçao

- estabilizar estados globais oficiais;
- formalizar eventos canonicos;
- alinhar leitura entre workspace e dominio.

### Fase 2 - Enforcement

- bloquear transicoes proibidas;
- reforcar auditoria obrigatoria;
- padronizar validaçao por RBAC e tenant.

### Fase 3 - Financial Hardening

- aumentar rigor sobre `OPERATED`, `COMMISSIONED` e `SETTLED`;
- explicitar reversoes formais;
- tratar conciliacao e falhas com eventos dedicados.

### Fase 4 - AI Assisted Operations

- permitir que o AI Copilot sugira proximos estados;
- manter confirmacao humana como requisito para mudancas criticas;
- registrar contexto assistido em auditoria.

### Fase 5 - Enterprise Expansion

- suportar novos estados auxiliares sem quebrar o contrato global;
- manter compatibilidade com coexistencia;
- preservar governanca mesmo com novos providers, canais e politicas financeiras.

---

## 14. Conclusao

A maquina de estados oficial do FINQZ PRO deve ser simples de entender, rigorosa de executar e totalmente auditavel.

Os estados globais existem para representar progresso real do negocio, nao para refletir detalhes internos de interface ou implementacao.

Se a transicao nao puder ser explicada por evento, ownership, permissao e auditoria, ela nao pertence ao contrato oficial.

---

## Referencias Oficiais

- `ADR-007` - Lead, Customer, Simulation and Opportunity Model
- `ADR-008` - Revenue Distribution Engine
- `ADR-009` - Operation Persistence and Financial Execution Aggregate
- `ARCH-004` - Entities Model
- `ARCH-005` - Relationships
- `ARCH-008` - Operational Events
- `ARCH-016` - Opportunity Workspace Blueprint
- `ARCH-017` - Workspace Ownership Matrix
- `ARCH-018` - Domain Boundary Matrix
