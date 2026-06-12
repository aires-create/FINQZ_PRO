# ARCH-016 - Opportunity Workspace Blueprint

Status: Proposed
Date: 2026-06-11
Owner: Architecture
Type: Architectural Contract
Project: FINQZ PRO

---

## 1. Visao Geral

O **Opportunity Workspace** e a superficie operacional oficial do FINQZ PRO para conduzir o ciclo comercial e financeiro de ponta a ponta.

Ele consolida, em um unico contexto de trabalho, a navegacao, a execução operacional e a rastreabilidade de:

- `Customer` como identidade oficial;
- `Opportunity` como unidade operacional central;
- `Simulation` como calculo independente;
- `Operation` como agregado financeiro de execucao;
- `Commission` como resultado financeiro derivado;
- `Payment / Settlement` como etapa de liquidacao;
- `AI Copilot` como camada assistiva;
- `Audit` como trilha imutavel de responsabilidade;
- `Multi-tenant` e `RBAC` como guardrails obrigatorios.

Este documento formaliza o contrato arquitetural do workspace, sem definir implementacao de frontend, backend, schema ou codigo de produto.

### Posicionamento oficial

```text
Lead -> Customer -> Opportunity -> Simulation -> BankProposal -> Operation -> Commission -> Settlement
```

Neste fluxo, o Opportunity Workspace e o centro de comando para operar o negocio, e nao apenas uma tela de consulta.

---

## 2. Objetivos

1. Formalizar o Opportunity Workspace como centro operacional do FINQZ PRO.
2. Centralizar no mesmo ambiente a visao comercial, operacional, financeira e de auditoria.
3. Preservar rastreabilidade entre origem, decisao, execucao e liquidacao.
4. Garantir que o workspace respeite multi-tenant, partner scope e RBAC.
5. Evitar duplicidade de modelos entre tela, dominio e persistencia.
6. Servir como base para evolução incremental sem ruptura arquitetural.

---

## 3. Principios

### 3.1 Opportunity e a unidade central

`Opportunity` permanece como a unidade operacional central do produto. Tudo no workspace orbita a oportunidade.

### 3.2 Customer e a identidade oficial

`Customer` e a fonte oficial de verdade para pessoa fisica ou juridica. O workspace deve tratar Customer como identidade, nao como contexto secundario.

### 3.3 Simulation e independente

Simulacoes nao dependem obrigatoriamente de Opportunity, mas o workspace deve permitir converter simulacao em oportunidade de forma explicita e auditavel.

### 3.4 Operation e o agregado financeiro

`Operation` representa a execucao financeira oficial e deve ser vista como a base da trilha monetaria.

### 3.5 Commission como resultado, nao origem

Comissao nasce da operacao executada. O workspace nao deve sugerir que commission e raiz do processo.

### 3.6 Rastreabilidade acima de conveniencia

Toda acao relevante precisa ser explicavel por origem, autor, tenant, partner, contexto e evento.

### 3.7 Assistencia sem autonomia indevida

O AI Copilot ajuda a operar, mas nao substitui decisao humana em etapas criticas.

---

## 4. Executive Summary

O Opportunity Workspace e a camada de trabalho oficial para transformar oportunidade em resultado operacional e financeiro.

O contrato arquitetural assume que o usuario precisa enxergar e executar, no mesmo centro:

- contexto comercial da oportunidade;
- documentos e evidencias;
- simulacao e analise;
- proposta e aprovacao;
- operacao e status financeiro;
- comissao e settlement;
- historico auditavel;
- interacoes assistidas por IA.

O workspace deve reduzir troca de contexto e impedir que o usuario precise navegar entre superficies desconectadas para concluir uma operacao.

### Outcome esperado

- menos fragmentacao operacional;
- mais previsibilidade de ciclo;
- melhor auditoria de cada passo;
- menor chance de divergencia entre origem comercial e execucao financeira;
- maior clareza de ownership e status.

---

## 5. Timeline

O roadmap do Opportunity Workspace deve ser evolutivo e compativel com coexistencia.

### Fase 1 - Foundation

- consolidar a oportunidade como raiz visual e operacional;
- padronizar blocos de resumo, atividades, documentos e status;
- expor informacoes canonicas de identidade, escopo e ownership.

### Fase 2 - Operational Flow

- integrar simulation, proposal center e operation center no mesmo fluxo;
- permitir rastreio de transicao entre etapas;
- reforcar eventos operacionais e auditoria.

### Fase 3 - Financial Flow

- integrar commission center e settlement/payment center;
- explicitar dependencias entre operation, commission e settlement;
- fortalecer visibilidade de pendencias e liquidacao.

### Fase 4 - AI Assisted Workbench

- incorporar AI Copilot como assistente contextual;
- permitir sugestoes, resumos e apoio a navegacao;
- manter trilha de confianca e confirmacao humana.

### Fase 5 - Enterprise Optimization

- refinar multi-tenant, RBAC, rotas, visibilidade e filtros;
- suportar paines por perfil e por contexto operacional;
- preparar o workspace para extensoes sem reestruturacao.

---

## 6. Activities Domain

O Activities Domain concentra a cronologia operacional da oportunidade.

### Responsabilidades

- registrar eventos de negocio e interacoes humanas;
- consolidar tarefas, notas, follow-ups e alteracoes relevantes;
- exibir transicoes de estado em ordem temporal;
- servir como trilha operacional do workspace.

### Tipos de atividades esperadas

- criacao de oportunidade;
- atualizacao de dados relevantes;
- criacao ou atualizacao de simulacao;
- solicitacao de proposta;
- aprovacao ou rejeicao;
- criacao de operation;
- geracao de commission;
- atualizacao de settlement;
- interacoes do AI Copilot;
- eventos de auditoria relevantes.

### Regras

- atividades devem ser tenant-scoped;
- atividades devem carregar autor e timestamp;
- atividades devem ser filtradas por partner scope quando aplicavel;
- atividades automatizadas devem ser distinguiveis de acoes humanas.

---

## 7. Documents Domain

O Documents Domain centraliza arquivos, evidencias e artefatos ligados a oportunidade e sua execucao.

### Responsabilidades

- armazenar documentos de cadastro, analise e execucao;
- vincular anexos a customer, opportunity, simulation, proposal, operation e settlement;
- preservar versao, origem e status de cada artefato;
- suportar evidencias para auditoria e compliance.

### Categorias de documentos

- identificacao e KYC;
- comprovantes e declaracoes;
- anexos de simulacao;
- proposta e aceite;
- comprovantes de operacao;
- documentos de settlement;
- documentos de suporte comercial;
- logs exportaveis e relatorios.

### Regras

- documento deve ter owner claro;
- documento deve estar associado a tenant;
- visibilidade deve obedecer RBAC e escopo de partner;
- documentos sensiveis devem respeitar politicas de acesso e retenção.

---

## 8. Simulation Center

O Simulation Center e a area de calculo, viabilidade e comparacao de cenarios.

### Funcao

- executar simulacoes de forma independente;
- comparar condicoes comerciais;
- apoiar analise de elegibilidade;
- servir como origem rastreavel de uma opportunity quando houver conversao.

### Contrato arquitetural

- Simulation nao e substituta de Opportunity;
- Simulation pode existir sem Customer;
- Simulation pode existir sem Opportunity;
- qualquer conversao deve ser explicita e auditavel.

### Saidas esperadas

- condicoes calculadas;
- elegibilidade;
- recomendacao de proximo passo;
- referencia para proposal ou opportunity;
- historico de tentativas e revisoes.

---

## 9. Proposal Center

O Proposal Center organiza a proposta financeira e a negociacao com o provider.

### Responsabilidades

- registrar proposta solicitada;
- consolidar condicoes enviadas e recebidas;
- acompanhar aprovacao, rejeicao e revisao;
- manter snapshot da negociacao.

### Relacao com Operation

- proposal e um artefato de negociacao;
- operation e o agregado de execucao;
- uma proposta aprovada pode originar uma operation;
- a proposta nao substitui o resultado financeiro final.

### Regras

- proposal deve referenciar opportunity e provider quando aplicavel;
- proposal deve manter rastreabilidade de versao;
- proposal deve registrar origem de calculo, simulacao ou canal manual.

---

## 10. Operation Center

O Operation Center e a area de execucao oficial do negocio.

### Responsabilidades

- registrar abertura da operacao;
- acompanhar solicitacao, retorno e aprovacao da proposta;
- consolidar execucao, falhas e finalizacao;
- suportar base para commission e settlement;
- expor o lifecycle operacional de forma clara.

### Lifecycle conceitual

```text
created
proposal_requested
proposal_received
proposal_approved
executed
commission_calculated
settlement_pending
settled
```

### Regras

- operation deve ser auditavel por estado;
- operation deve ser derivada de contexto comercial real;
- operation nao deve absorver responsabilidades de customer ou opportunity;
- operation e a origem canonica para comissao.

---

## 11. Commission Center

O Commission Center organiza a visao de distribuicao e resultado financeiro.

### Responsabilidades

- exibir comissoes derivadas de operation;
- explicar a composicao do valor;
- mostrar status de liberacao, pagamento e pendencia;
- consolidar regras do revenue distribution model.

### Regras arquiteturais

- commission nao e raiz de negocio;
- commission depende de operation concluida;
- commission pode refletir distribuicao entre beneficiarios;
- commission deve ser compativel com o Revenue Distribution Engine definido em `ADR-008`.

### Informacoes esperadas

- origem da comissao;
- base de calculo;
- beneficiarios;
- percentual ou regra aplicada;
- status financeiro;
- eventos relacionados.

---

## 12. Settlement/Payment Center

O Settlement/Payment Center representa a etapa final de liquidacao e repasse.

### Responsabilidades

- acompanhar saldo a liquidar;
- registrar status de pagamento;
- consolidar conciliacao e repasse;
- ligar settlement a commission e, quando necessario, a operation.

### Regras

- settlement nao substitui commission;
- payment nao e ponto de origem do ciclo;
- liquidacao deve respeitar elegibilidade, aprovacao e regras financeiras;
- integracoes de pagamento devem ser rastreaveis por tenant e provider.

---

## 13. AI Copilot

O AI Copilot e uma camada assistiva contextual dentro do Opportunity Workspace.

### Papel

- resumir contexto da opportunity;
- sugerir proximos passos;
- apontar inconsistencias ou lacunas de informacao;
- acelerar leitura de documentos, status e cronologia;
- auxiliar em navegação entre centers.

### Limites

- nao pode alterar estado sozinho em etapas criticas sem confirmacao;
- nao pode ignorar RBAC, tenant scope ou partner scope;
- nao pode ser fonte de verdade de dominio;
- nao pode substituir auditoria.

### Uso esperado

- resumo executivo da oportunidade;
- analise de pendencias;
- explicacao de timeline;
- sugestao de documentos faltantes;
- apoio a operadores, gestores e compliance.

---

## 14. Navegacao

A navegacao deve reduzir friccao entre areas e manter a oportunidade como eixo.

### Estrutura sugerida do workspace

- Overview
- Activities
- Documents
- Simulation Center
- Proposal Center
- Operation Center
- Commission Center
- Settlement / Payment Center
- AI Copilot
- Audit

### Regras de navegacao

- todas as areas devem ser acessiveis a partir do contexto da opportunity;
- o usuario nao deve perder o tenant ou o partner scope ao navegar;
- a navegacao deve preservar breadcrumbs e estado do contexto;
- rotas ou abas nao devem expor dados fora do escopo autorizado.

### Principio de UX

O workspace deve responder a pergunta: "o que falta para concluir esta oportunidade?".

---

## 15. Auditoria

Auditoria e requisito estrutural, nao funcional opcional.

### O que deve ser auditado

- alteracoes de dados criticos;
- mudancas de estado;
- criacao de simulacoes e propostas;
- transicoes de operation;
- calculo e liberacao de commission;
- liquidacao e settlement;
- acesso a documentos sensiveis;
- acoes do AI Copilot quando relevantes.

### Conteudo minimo de auditoria

- tenantId;
- actorId;
- actorType;
- entityType;
- entityId;
- action;
- before/after quando aplicavel;
- timestamp;
- correlationId ou traceId.

### Regras

- auditoria deve ser imutavel;
- auditoria deve ser consultavel por contexto autorizado;
- auditoria nao deve depender apenas de logs operacionais;
- eventos de negocio e audit log nao sao a mesma coisa.

---

## 16. Multi-tenant

O Opportunity Workspace deve ser totalmente multi-tenant aware.

### Regras

- todo dado exibido deve estar filtrado por tenant;
- nenhum componente deve assumir tenant unico;
- dados agregados devem respeitar isolamento;
- imports, documentos e eventos devem manter tenant de origem.

### Implicacoes arquiteturais

- o workspace nao pode misturar oportunidades de tenants diferentes;
- caches, listas, filtros e estados derivados devem ser tenant-scoped;
- integrações devem propagar tenantId quando aplicavel.

---

## 17. RBAC

O workspace deve obedecer o modelo de autorizacao aprovado em `ARCH-009`.

### Regras

- acesso por role e permission;
- validacao por tenant e partner scope;
- exibicao condicional de abas e acoes;
- negacao padrao para operacoes sensiveis.

### Exemplos de controle

- usuarios comerciais veem visao de oportunidade e proposta;
- usuarios operacionais veem operation e settlement;
- usuarios financeiros veem commission e pagamento;
- compliance ve auditoria e documentos sensiveis;
- AI Copilot apenas dentro do escopo autorizado.

### Principio

RBAC nao e so bloqueio de acao. Tambem e criterio de composicao da interface.

---

## 18. Eventos

O Opportunity Workspace deve ser orientado por eventos de dominio e de auditoria.

### Eventos base

- `OpportunityCreated`
- `OpportunityUpdated`
- `OpportunityStageChanged`
- `SimulationExecuted`
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
- `AuditLogCreated`

### Regras

- eventos devem refletir transicoes reais;
- eventos nao devem validar negocio por si sós;
- eventos devem preservar correlacao entre centers;
- eventos devem suportar observabilidade e integrações.

### Finalidade no workspace

- alimentar timeline;
- atualizar counters e status;
- disparar automacoes;
- sustentar integrações externas;
- oferecer rastreabilidade para auditoria.

---

## 19. Integracoes

O workspace precisa ser preparado para integrar com dominios internos e externos sem acoplamento excessivo.

### Integracoes internas

- Customer
- Opportunity
- Simulation
- Proposal
- Operation
- Commission
- Settlement
- Audit
- RBAC

### Integracoes externas ou de plataforma

- providers financeiros;
- motores de pagamento;
- servicos de notificacao;
- mecanismos de documento/armazenamento;
- motores de IA;
- orquestracao de eventos.

### Regras de integracao

- toda integracao deve carregar contexto de tenant;
- toda integracao deve manter correlação rastreavel;
- nenhuma integracao deve ser tratada como fonte primaria de verdade sem contrato formal;
- falhas de integracao devem ser visiveis no workspace.

---

## 20. Roadmap Evolutivo

O roadmap do Opportunity Workspace deve crescer por camadas, sem quebrar o contrato oficial.

### Etapa A - Consolidacao do centro

- consolidar overview da opportunity;
- unificar atividades, documentos e timeline;
- padronizar status e ownership.

### Etapa B - Execucao operacional

- fortalecer simulation, proposal e operation;
- explicitar dependencias entre os centers;
- ligar eventos e auditoria ao fluxo.

### Etapa C - Financeiro

- amadurecer commission center;
- consolidar settlement/payment center;
- expor distribuicao financeira com clareza.

### Etapa D - Assistencia inteligente

- ativar AI Copilot contextual;
- permitir resumos, analises e sugestoes;
- manter validacao humana como regra.

### Etapa E - Escala enterprise

- otimizar multi-tenant e RBAC;
- suportar personalizacao por perfil;
- preparar o workspace para novos beneficiarios, providers e fluxos sem alterar o contrato central.

---

## Referencias Oficiais

- `ADR-007` - Lead, Customer, Simulation and Opportunity Model
- `ADR-008` - Revenue Distribution Engine
- `ADR-009` - Operation Persistence and Financial Execution Aggregate
- `ARCH-004` - Entities Model
- `ARCH-005` - Relationships
- `ARCH-008` - Operational Events
- `ARCH-009` - RBAC

