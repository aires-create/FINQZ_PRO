# Commercial Governance MVP Slice Definition

## 1. Escopo do MVP
Definir o recorte oficial do MVP 1 do modulo `commercial-governance` para habilitar um fluxo minimo de solicitacao e decisao de condicao comercial especial com trilha de auditoria.

Objetivo do MVP 1:
- Parceiro ou Comercial abre solicitacao de condicao especial.
- Gestor aprova ou reprova.
- Sistema registra auditoria.
- Sistema encerra o fluxo.

## 2. O que entra
### Entidades
- CommercialRequest
- ApprovalWorkflow
- ApprovalDecision

### Commands
- CreateCommercialRequest
- SubmitCommercialRequest
- ApproveCommercialRequest
- RejectCommercialRequest

### Services
- CommercialRequestService
- ApprovalWorkflowService

### Repositories
- CommercialRequestRepository
- ApprovalWorkflowRepository

### Events
- CommercialRequestCreated
- CommercialRequestSubmitted
- ApprovalGranted
- ApprovalRejected

### Fluxo de negocio coberto
- Parceiro/Comercial cria solicitacao.
- Solicitacao e submetida para aprovacao.
- Gestor decide: aprovar ou reprovar.
- Sistema audita eventos criticos.
- Fluxo e encerrado.

## 3. O que nao entra
- Campaign
- CampaignRule
- BonusRequest
- CommercialAgreement
- Escalada Multi-Nivel
- Integracoes Financeiras
- Provider Engine
- Policy Engine Avancado

Observacao:
- Qualquer item fora do recorte acima deve ser tratado como expansao futura e nao pode entrar no MVP 1.

## 4. Criterios de aceite
- O recorte funcional permite abrir, submeter e decidir uma solicitacao (aprovar/reprovar).
- O fluxo possui estados minimos rastreaveis (ex.: Draft, Submitted, Approved/Rejected, Closed).
- Eventos criticos sao auditaveis (criacao, submissao, decisao).
- Nao ha duplicidade com `commercial`, `commissions`, `integrations` ou `audit`.
- Nao ha dependencia de campanhas, bonus, acordos ou integracoes financeiras para concluir o MVP 1.

## 5. Criterios para iniciar implementacao
- Domain map, capability map, workflow architecture, data model blueprint e technical blueprint consolidados e aprovados para MVP 1.
- Ownership das entidades do MVP validado sem ambiguidade.
- Regras de RBAC e tenant context definidas para os comandos do MVP.
- Contratos de integracao minima com modulo de auditoria definidos.
- Plano de implementacao incremental aprovado (sem incluir escopo fora do MVP).

## 6. Criterios para expansao futura
- MVP 1 estabilizado com trilha de auditoria consistente.
- Necessidades de negocio comprovadas para cada novo bloco (campaign, bonus, agreement etc.).
- Avaliacao arquitetural previa para evitar duplicidade e drift.
- ADR aprovado para qualquer nova fronteira de ownership ou contrato entre modulos.
- Evolucao por fatias: primeiro escalada multi-nivel, depois campaign/bonus, depois agreement/integracoes financeiras, conforme prioridade de negocio.

## Classificacao Final
**APROVADO COM AJUSTES**

Justificativa:
- O recorte MVP 1 e viavel, objetivo e alinhado ao papel orquestrador do modulo.
- A implementacao deve manter rigor anti-drift e nao incorporar itens fora do escopo definido.
