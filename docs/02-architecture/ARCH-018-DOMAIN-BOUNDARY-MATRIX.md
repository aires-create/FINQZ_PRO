# ARCH-018 - Domain Boundary Matrix

Status: Proposed
Date: 2026-06-11
Owner: Architecture
Type: Architectural Contract
Project: FINQZ PRO

---

## 1. Objetivo

Formalizar as fronteiras oficiais dos domínios do FINQZ PRO, explicitando o que cada dominio pode controlar, o que nao pode controlar, quais eventos produz e consome, e quais dependencias sao permitidas.

Este documento existe para impedir sobreposicao de responsabilidades, duplicidade de fontes de verdade e expansao indevida de dominios.

Ele deve ser lido em conjunto com:

- `ADR-007` - Lead, Customer, Simulation and Opportunity Model
- `ADR-008` - Revenue Distribution Engine
- `ADR-009` - Operation Persistence and Financial Execution Aggregate
- `ARCH-004` - Entities Model
- `ARCH-005` - Relationships
- `ARCH-008` - Operational Events
- `ARCH-016` - Opportunity Workspace Blueprint
- `ARCH-017` - Workspace Ownership Matrix

---

## 2. Principios

### 2.1 Um dominio, uma responsabilidade principal

Cada dominio deve possuir uma responsabilidade primaria clara. Pode haver composicao, mas nao confusao de ownership.

### 2.2 A fonte de verdade e unica por assunto

Cada dominio deve apontar para uma unica fonte canonica para seu estado principal.

### 2.3 Eventos refletem estado

Eventos sao contratos de transicao e rastreabilidade, nao regras de negocio por si sós.

### 2.4 Dependencias sao dirigidas

Um dominio pode depender de outro apenas quando a dependencia nao quebra fronteiras e nao inverte ownership.

### 2.5 Anti-patterns sao parte do contrato

Este documento formaliza tambem o que nao pode acontecer, porque a violacao de fronteira e um risco estrutural.

---

## 3. Customer

### 3.1 Responsabilidade

Ser a identidade oficial de pessoa fisica ou juridica atendida pelo FINQZ PRO.

### 3.2 Pode Conter

- dados cadastrais;
- dados de contato;
- identificadores oficiais como CPF/CNPJ;
- historico de relacionamento;
- consentimentos e status de conformidade;
- relacoes com opportunities.

### 3.3 Nao Pode Conter

- funcoes de prospeccao;
- calculo de simulacao;
- lifecycle de operation;
- regras de comissao;
- regras de settlement;
- logica de provider;
- pipeline e stage como ownership primario.

### 3.4 Source of Truth

Customer e a fonte oficial de verdade para identidade cadastral e relacao com a pessoa ou empresa.

### 3.5 Eventos Produzidos

- `CustomerCreated`
- `CustomerUpdated`
- `CustomerKYCStatusChanged`
- `CustomerMerged` quando aplicavel

### 3.6 Eventos Consumidos

- `LeadConverted`
- `OpportunityCreated` quando derivada de customer existente
- eventos de compliance ou onboarding quando aplicavel

### 3.7 Dependencias Permitidas

- Lead;
- Opportunity;
- Audit;
- Multi-tenant e RBAC;
- Document para anexos de cadastro.

### 3.8 Anti-Patterns

- usar Customer como container de opportunity;
- usar Customer como proxy de lead;
- misturar identidade com negocio;
- duplicar estado de opportunity dentro de Customer.

### 3.9 Riscos de Violacao

- vazamento de identidade entre tenants;
- duplicidade de cadastro;
- quebra de LGPD e compliance;
- inconsistencias de ownership em jornadas comerciais.

---

## 4. Lead

### 4.1 Responsabilidade

Ser a entidade de aquisicao, prospeccao e qualificacao comercial.

### 4.2 Pode Conter

- origem do contato;
- canal de aquisicao;
- campanha;
- UTM;
- score de qualificacao;
- parceiro originador;
- status de prospeccao.

### 4.3 Nao Pode Conter

- identidade oficial;
- simulacao canonica;
- operation;
- commission;
- settlement;
- ownership de customer;
- estado operacional final.

### 4.4 Source of Truth

Lead e a fonte oficial de verdade para origem e prospeccao inicial, quando esse fluxo existir.

### 4.5 Eventos Produzidos

- `LeadCreated`
- `LeadQualified`
- `LeadRejected`
- `LeadConverted`

### 4.6 Eventos Consumidos

- eventos de marketing ou captura, quando existirem;
- `CustomerCreated` quando houver conversao;
- eventos de qualificacao externa, se integrados.

### 4.7 Dependencias Permitidas

- Customer;
- Opportunity;
- Partner;
- Audit;
- Document para evidencias de origem.

### 4.8 Anti-Patterns

- tratar Lead como identidade;
- tratar Lead como centro do sistema;
- usar Lead como substituto de Customer;
- exigir Lead para todo fluxo comercial.

### 4.9 Riscos de Violacao

- inflar pipeline com entidades improprias;
- perder rastreabilidade de origem;
- criar acoplamento desnecessario de aquisicao com execucao.

---

## 5. Opportunity

### 5.1 Responsabilidade

Ser a unidade operacional central do FINQZ PRO, concentrando o contexto comercial e operacional do negocio.

### 5.2 Pode Conter

- referencia a customer;
- referencia a lead de origem quando existir;
- contexto comercial;
- pipeline e stage;
- associacoes com simulation, proposal, operation e commission por rastreabilidade;
- ownership comercial;
- estado do negocio.

### 5.3 Nao Pode Conter

- regras de identidade oficial;
- calculo de simulacao como origem canonica;
- lifecycle financeiro final;
- regras de comissao como ownership primario;
- settlement como responsabilidade propria;
- logica de provider como dominio central.

### 5.4 Source of Truth

Opportunity e a fonte oficial de verdade da unidade de negocio operacional.

### 5.5 Eventos Produzidos

- `OpportunityCreated`
- `OpportunityUpdated`
- `OpportunityStageChanged`
- `OpportunityWon`
- `OpportunityLost`

### 5.6 Eventos Consumidos

- `CustomerCreated`
- `LeadConverted`
- `SimulationExecuted`
- eventos de provider e proposta quando necessários para o fluxo

### 5.7 Dependencias Permitidas

- Customer;
- Lead;
- Partner;
- Pipeline;
- Stage;
- Simulation;
- Proposal;
- Operation;
- Commission;
- Document;
- Audit;
- RBAC;
- multi-tenant.

### 5.8 Anti-Patterns

- transformar Opportunity em tela gigante sem fronteiras;
- usar Opportunity como storage de tudo;
- tratar Opportunity como raiz financeira final;
- duplicar estado de operation ou commission dentro de Opportunity.

### 5.9 Riscos de Violacao

- monolito de dominio;
- perda de clareza de ownership;
- sobreposicao com operation e proposal;
- degradação de auditoria e rastreabilidade.

---

## 6. Activity

### 6.1 Responsabilidade

Concentrar a cronologia operacional e interacoes relevantes relacionadas ao contexto do workspace.

### 6.2 Pode Conter

- tarefas;
- notas;
- follow-ups;
- mudanças relevantes de estado;
- referencias a eventos;
- interacoes humanas e assistidas.

### 6.3 Nao Pode Conter

- estado canonico de opportunity;
- registros auditaveis substitutivos;
- documentos proprietarios;
- lifecycle financeiro;
- regras de commission.

### 6.4 Source of Truth

Activity e uma visao cronologica derivada de eventos e interacoes registradas no contexto autorizado.

### 6.5 Eventos Produzidos

- `ActivityCreated`
- `ActivityUpdated`
- `ActivityCompleted`
- eventos derivados de interação humana ou automatizada quando formalizados

### 6.6 Eventos Consumidos

- `OpportunityCreated`
- `OpportunityUpdated`
- `SimulationExecuted`
- `OperationCreated`
- `OperationExecuted`
- `CommissionCalculated`
- `SettlementConfirmed`

### 6.7 Dependencias Permitidas

- Opportunity;
- Customer;
- Simulation;
- Proposal;
- Operation;
- Commission;
- Settlement;
- Document;
- Audit.

### 6.8 Anti-Patterns

- usar activity como auditoria oficial;
- misturar timeline, task e audit log sem distinção;
- escrever estado canonico a partir de activity.

### 6.9 Riscos de Violacao

- ruído operacional;
- falsa sensação de rastreabilidade;
- inconsistencias entre timeline e verdade de dominio.

---

## 7. Document

### 7.1 Responsabilidade

Concentrar arquivos, anexos e evidencias associadas aos dominios do FINQZ PRO.

### 7.2 Pode Conter

- anexos de cadastro;
- documentos de compliance;
- evidencias de simulacao;
- propostas e aceitacoes;
- comprovantes de operation e settlement;
- relatórios e exportacoes.

### 7.3 Nao Pode Conter

- regras canonicas de negocio;
- estado primario de opportunity ou operation;
- calculos financeiros como verdade principal;
- permissao de acesso fora de RBAC e tenant.

### 7.4 Source of Truth

Document e a fonte oficial de verdade documental, nao de negocio.

### 7.5 Eventos Produzidos

- `DocumentUploaded`
- `DocumentUpdated`
- `DocumentDeleted`
- `DocumentClassified`

### 7.6 Eventos Consumidos

- eventos de cadastro;
- eventos de simulacao;
- eventos de proposal;
- eventos de operation;
- eventos de settlement;
- eventos de compliance.

### 7.7 Dependencias Permitidas

- Customer;
- Opportunity;
- Simulation;
- Proposal;
- Operation;
- Commission;
- Settlement;
- Audit;
- RBAC;
- Multi-tenant.

### 7.8 Anti-Patterns

- repositório de arquivos sem owner;
- usar documentos como banco de estado;
- permitir arquivo sensivel sem escopo;
- confundir evidência com decisão.

### 7.9 Riscos de Violacao

- vazamento de dados sensiveis;
- perda de compliance documental;
- ausência de rastreio de evidencia.

---

## 8. Simulation

### 8.1 Responsabilidade

Executar calculo, elegibilidade e viabilidade comercial de forma independente.

### 8.2 Pode Conter

- parametros de entrada;
- regras de calculo;
- cenarios comparativos;
- resultados;
- recomendacoes;
- referencias opcionais a customer ou opportunity.

### 8.3 Nao Pode Conter

- identidade oficial;
- estado canonico de opportunity;
- lifecycle de operation;
- regras finais de commission;
- liquidacao;
- ownership de proposal.

### 8.4 Source of Truth

Simulation e a fonte oficial de verdade do resultado de calculo e viabilidade.

### 8.5 Eventos Produzidos

- `SimulationExecuted`
- `SimulationUpdated`
- `SimulationExpired`
- `SimulationConverted` quando houver conversao formal

### 8.6 Eventos Consumidos

- `CustomerCreated` quando a simulacao for associada a um cliente;
- `OpportunityCreated` quando houver conversao;
- eventos de tabela comercial ou provider quando usados no calculo.

### 8.7 Dependencias Permitidas

- Customer opcional;
- Opportunity opcional;
- Provider;
- CommercialTable;
- Document;
- Audit.

### 8.8 Anti-Patterns

- exigir customer ou opportunity como precondicao universal;
- tratar simulacao como proposta ou operation;
- persistir resultado final como verdade operacional.

### 8.9 Riscos de Violacao

- acoplamento indevido com cadastro;
- perda de flexibilidade comercial;
- confusão entre calculo e execução.

---

## 9. Proposal

### 9.1 Responsabilidade

Concentrar a proposta financeira e a negociacao com o provider.

### 9.2 Pode Conter

- snapshot de condicoes;
- valores;
- prazo;
- taxa;
- status de aprovacao;
- referencia a opportunity, simulation e provider;
- metadados de negociacao.

### 9.3 Nao Pode Conter

- estado final de operation;
- calculo canonico de simulacao;
- comissao como origem;
- liquidacao;
- identidade oficial;
- regras de catalogo mestre.

### 9.4 Source of Truth

Proposal e a fonte oficial de verdade da negociacao e da proposta enviada/recebida.

### 9.5 Eventos Produzidos

- `ProposalRequested`
- `ProposalReceived`
- `ProposalApproved`
- `ProposalRejected`
- `ProposalAmended`

### 9.6 Eventos Consumidos

- `SimulationExecuted`
- `OpportunityCreated`
- `OperationCreated`
- eventos do provider responsavel pela resposta da proposta.

### 9.7 Dependencias Permitidas

- Opportunity;
- Simulation;
- Provider;
- Document;
- Audit;
- RBAC;
- Multi-tenant.

### 9.8 Anti-Patterns

- transformar proposal em operation;
- duplicar lifecycle financeiro em proposal;
- ignorar dependencias com provider e opportunity.

### 9.9 Riscos de Violacao

- quebra de rastreabilidade da negociação;
- divergencia entre proposta e execução;
- acoplamento com pagamento indevido.

---

## 10. Operation

### 10.1 Responsabilidade

Ser o agregado financeiro e de execução oficial do ciclo operacional.

### 10.2 Pode Conter

- lifecycle de execução;
- referencia a opportunity;
- referencia a proposal;
- referencia a provider;
- status de execucao;
- eventos de falha ou conclusao;
- base para commission e settlement.

### 10.3 Nao Pode Conter

- identidade oficial;
- prospectacao;
- calculo puro de simulacao como origem;
- regras completas de distribuicao de receita;
- liquidacao como ownership primaria;
- dados de catalogo mestre.

### 10.4 Source of Truth

Operation e a fonte oficial de verdade da execução financeira e do resultado operacional do negocio.

### 10.5 Eventos Produzidos

- `OperationCreated`
- `OperationProposalRequested`
- `OperationProposalReceived`
- `OperationProposalApproved`
- `OperationProposalRejected`
- `OperationExecuted`
- `OperationFailed`

### 10.6 Eventos Consumidos

- `OpportunityCreated`
- `ProposalApproved`
- `ProviderResponseReceived` quando formalizado
- `CommissionCalculated`
- `SettlementRequested` quando aplicavel

### 10.7 Dependencias Permitidas

- Opportunity;
- Proposal;
- Provider;
- Customer como contexto;
- Commission;
- Settlement;
- Document;
- Audit;
- RBAC;
- Multi-tenant.

### 10.8 Anti-Patterns

- usar Opportunity como proxy de execution;
- fazer Commission depender de status informal;
- esconder o lifecycle financeiro em outra entidade.

### 10.9 Riscos de Violacao

- lacuna entre proposta e execução;
- perda de auditabilidade financeira;
- inconsistencia de payout e settlement.

---

## 11. Commission

### 11.1 Responsabilidade

Representar o resultado financeiro devido a partir de uma Operation executada.

### 11.2 Pode Conter

- base de cálculo;
- percentuais de distribuição;
- beneficiarios;
- status de liberacao;
- status de pagamento;
- referencias a operation e regras de distribuição.

### 11.3 Nao Pode Conter

- origem do negocio;
- identidade oficial;
- lifecycle de opportunity;
- proposal como verdade principal;
- settlement como substituto;
- logica de provider como dominio central.

### 11.4 Source of Truth

Commission e a fonte oficial de verdade da distribuicao financeira derivada da operation.

### 11.5 Eventos Produzidos

- `CommissionCalculated`
- `CommissionReleased`
- `CommissionPaid`
- `CommissionAdjusted`

### 11.6 Eventos Consumidos

- `OperationExecuted`
- `OperationFailed`
- `SettlementConfirmed`
- eventos de distribuicao financeira e regra de repasse.

### 11.7 Dependencias Permitidas

- Operation;
- Provider como contexto de origem;
- Settlement;
- Document;
- Audit;
- RBAC;
- Multi-tenant.

### 11.8 Anti-Patterns

- tratar commission como raiz do ciclo;
- calcular commission sem operation elegivel;
- usar commission para esconder falhas de execution.

### 11.9 Riscos de Violacao

- duplicidade de cálculo;
- divergencia financeira;
- quebra do motor de distribuição.

---

## 12. Settlement

### 12.1 Responsabilidade

Concentrar liquidacao, pagamento, conciliacao e repasse financeiro.

### 12.2 Pode Conter

- status de pagamento;
- status de conciliacao;
- comprovantes;
- referencias a commission e operation;
- informacoes de transacao e repasse.

### 12.3 Nao Pode Conter

- origem da comissão;
- identidade do customer;
- proposta como verdade final;
- calculo de simulacao;
- ownership da opportunity.

### 12.4 Source of Truth

Settlement e a fonte oficial de verdade do estado de liquidacao e pagamento.

### 12.5 Eventos Produzidos

- `SettlementRequested`
- `SettlementConfirmed`
- `SettlementFailed`
- `SettlementReversed`

### 12.6 Eventos Consumidos

- `CommissionReleased`
- `CommissionPaid`
- `OperationExecuted`
- eventos de integracao financeira externa.

### 12.7 Dependencias Permitidas

- Commission;
- Operation;
- Provider de pagamento;
- Document;
- Audit;
- RBAC;
- Multi-tenant.

### 12.8 Anti-Patterns

- usar settlement como substituto de commission;
- ocultar pendencias financeiras;
- consolidar pagamento sem rastreabilidade.

### 12.9 Riscos de Violacao

- falhas de conciliacao;
- pagamento incorreto;
- perda de rastreio de repasse.

---

## 13. Provider

### 13.1 Responsabilidade

Ser a origem de capacidades, condições, propostas e integrações operacionais ou financeiras.

### 13.2 Pode Conter

- metadados de integracao;
- condicoes e ofertas;
- capacidade de proposta;
- capacidade de operation;
- callbacks e status de sincronizacao;
- contexto de produto ou servico externo.

### 13.3 Nao Pode Conter

- ownership de customer;
- ownership de opportunity;
- identidade oficial;
- comissao como objeto central;
- regras de settlement como dominio principal;
- catalogo mestre.

### 13.4 Source of Truth

Provider e a fonte oficial de verdade da origem externa de condições, respostas e capacidades fornecidas.

### 13.5 Eventos Produzidos

- `ProviderIntegrated`
- `ProviderSynchronized`
- `ProviderStatusChanged`
- `ProviderConditionUpdated`

### 13.6 Eventos Consumidos

- `OpportunityCreated`
- `SimulationExecuted`
- `ProposalRequested`
- `OperationProposalRequested`
- `SettlementRequested` quando houver integracao externa

### 13.7 Dependencias Permitidas

- CommercialTable;
- Simulation;
- Proposal;
- Operation;
- Settlement;
- Document;
- Audit;
- Multi-tenant.

### 13.8 Anti-Patterns

- tratar provider como produto;
- transformar provider em dono do negocio;
- misturar provider com source of truth do customer ou opportunity.

### 13.9 Riscos de Violacao

- acoplamento excessivo com fluxos internos;
- quebra de integracao;
- perda de separacao entre capacidade externa e dominio interno.

---

## 14. Conclusao

As fronteiras oficiais do FINQZ PRO existem para preservar clareza de ownership, reduzir duplicidade de verdade e manter o Opportunity Workspace como superficie de orquestracao, nao como repositório de responsabilidades difusas.

Quando estas fronteiras sao respeitadas, o sistema se mantem evolutivo, auditavel e consistente com os ADRs oficiais.

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

