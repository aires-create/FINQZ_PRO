# Commercial Governance Technical Architecture Blueprint

## Objetivo
Definir a arquitetura tecnica conceitual do modulo `commercial-governance`, delimitando comandos, servicos, repositorios, eventos de dominio, RBAC, contratos entre modulos e criterios de liberacao de implementacao.

## Commands Candidatos
| Command | Deve Existir? | Motivo |
| ------- | ------------- | ------ |
| CreateCommercialRequest | Sim | Inicia o ciclo de governanca de solicitacao comercial especial |
| SubmitCommercialRequest | Sim | Formaliza envio para validacao e fila de aprovacao |
| ApproveCommercialRequest | Sim | Registra decisao positiva de alçada no workflow |
| RejectCommercialRequest | Sim | Registra decisao negativa com justificativa obrigatoria |
| EscalateCommercialRequest | Sim | Permite mover solicitacao para nivel superior de alçada |
| CreateBonusRequest | Sim | Inicia governanca de bonus sem invadir dominio financeiro de comissoes |
| ApproveBonusRequest | Sim | Controla aprovacao de bonus por politica e alçada |
| RejectBonusRequest | Sim | Controla reprovacao com trilha auditavel |
| CreateCampaign | Sim | Abre ciclo governado de campanha comercial |
| ActivateCampaign | Sim | Transiciona campanha aprovada para ativa |
| CloseCampaign | Sim | Finaliza campanha e encerra governanca |
| CreateCommercialAgreement | Sim | Cria fluxo de acordo comercial no dominio de governanca |
| ApproveCommercialAgreement | Sim | Conclui aprovacao formal de acordo |

## Services Candidatos
| Service | Deve Existir? | Responsabilidade |
| ------- | ------------- | ---------------- |
| CommercialRequestService | Sim | Orquestrar criacao, submissao, aprovacao, rejeicao e escalada de solicitacoes comerciais |
| ApprovalWorkflowService | Sim | Gerenciar fluxo de alçadas, etapas e decisoes de aprovacao |
| BonusGovernanceService | Sim | Orquestrar solicitacao e governanca de bonus com integracao aos dominios oficiais |
| CampaignGovernanceService | Sim | Orquestrar ciclo de vida de campanhas (criacao, ativacao, encerramento) |
| AgreementGovernanceService | Sim | Orquestrar ciclo de acordos comerciais e aprovacao formal |
| CommercialPolicyService | Sim | Validar politicas comerciais aplicadas aos workflows de governanca |

## Repositories Candidatos
| Repository | Deve Existir? | Ownership |
| ---------- | ------------- | --------- |
| CommercialRequestRepository | Sim | `commercial-governance` (apenas entidades proprias do dominio de governanca) |
| ApprovalWorkflowRepository | Sim | `commercial-governance` |
| CampaignRepository | Sim | `commercial-governance` |
| BonusRequestRepository | Sim | `commercial-governance` |
| AgreementRepository | Sim | `commercial-governance` |

Observacao:
- Repositorios acima sao conceituais e nao autorizam persistir entidades cujo owner seja `commercial`, `commissions`, `integrations`, `tenant` ou `users`.

## Domain Events
| Event | Quem Gera | Quem Consome |
| ----- | --------- | ------------ |
| CommercialRequestCreated | CommercialRequestService | ApprovalWorkflowService, Audit, Notification |
| CommercialRequestSubmitted | CommercialRequestService | ApprovalWorkflowService, Audit, Notification |
| ApprovalGranted | ApprovalWorkflowService | CommercialRequestService, BonusGovernanceService, AgreementGovernanceService, Audit, Notification |
| ApprovalRejected | ApprovalWorkflowService | CommercialRequestService, BonusGovernanceService, AgreementGovernanceService, Audit, Notification |
| ApprovalEscalated | ApprovalWorkflowService | ApprovalWorkflowService (proxima alçada), Audit, Notification |
| BonusRequestCreated | BonusGovernanceService | ApprovalWorkflowService, Audit, Notification |
| BonusApproved | BonusGovernanceService / ApprovalWorkflowService | Integracoes financeiras oficiais, Audit, Notification |
| CampaignActivated | CampaignGovernanceService | Audit, Notification |
| CampaignClosed | CampaignGovernanceService | Audit, Notification |
| AgreementApproved | AgreementGovernanceService / ApprovalWorkflowService | Integracoes de formalizacao oficiais, Audit, Notification |

## RBAC Matrix
| Capability | Partner | Commercial | Manager | Director | CEO | Admin | Compliance |
| ---------- | ------- | ---------- | ------- | -------- | --- | ----- | ---------- |
| Create Request | Sim | Sim | Sim | Sim | Sim | Sim | Nao |
| Submit Request | Sim | Sim | Sim | Sim | Sim | Sim | Nao |
| Approve Request | Nao | Nao | Sim | Sim | Sim | Sim | Nao |
| Reject Request | Nao | Nao | Sim | Sim | Sim | Sim | Nao |
| Escalate Request | Nao | Sim | Sim | Sim | Sim | Sim | Nao |
| Create Bonus | Nao | Sim | Sim | Sim | Sim | Sim | Nao |
| Approve Bonus | Nao | Nao | Sim | Sim | Sim | Sim | Nao |
| Create Campaign | Nao | Sim | Sim | Sim | Sim | Sim | Nao |
| Activate Campaign | Nao | Sim | Sim | Sim | Sim | Sim | Nao |
| Create Agreement | Nao | Sim | Sim | Sim | Sim | Sim | Nao |
| View Audit | Nao | Nao | Nao | Sim | Sim | Sim | Sim |

## Contratos entre Modulos
### commercial-governance -> commercial
- Responsabilidade: consultar/referenciar `CommercialTable`, `CommercialCondition` e regras comerciais oficiais.
- Restricao: proibido criar CRUD paralelo de tabelas/condicoes.

### commercial-governance -> commissions
- Responsabilidade: referenciar calculo, ledger e status de pagamento oficiais quando o workflow exigir contexto financeiro.
- Restricao: proibido recalcular comissao ou persistir ledger/pagamento local.

### commercial-governance -> integrations
- Responsabilidade: acionar capacidades externas somente via contratos e provider engine oficiais.
- Restricao: proibido criar provider engine, provider repository ou contrato paralelo.

### commercial-governance -> audit
- Responsabilidade: registrar trilha de auditoria oficial para eventos criticos de workflow/aprovacao.
- Restricao: proibido criar audit engine ou audit repository proprio paralelo.

## Regras Anti-Drift
- Nao criar service duplicado de `commercial`.
- Nao criar repository duplicado de `commissions`.
- Nao criar provider repository.
- Nao criar audit repository.
- Nao criar contrato paralelo entre modulos sem decisao arquitetural (ADR).

## Criterios de Implementacao
### Para liberar DTO
- Command e workflow oficial aprovados.
- Contrato entre modulos definido e sem sobreposicao.
- Regras de validacao vinculadas ao owner correto.

### Para liberar Service real
- Responsabilidade exclusiva do dominio `commercial-governance` comprovada.
- Dependencias externas mapeadas (commercial, commissions, integrations, audit).
- RBAC e tenant context definidos para os casos de uso.

### Para liberar Repository real
- Entidade validada no ownership local de `commercial-governance`.
- Ausencia de duplicidade com fontes oficiais externas.
- Estrategia de auditoria e isolamento multi-tenant definida.

### Para liberar Route
- Caso de uso formal aprovado.
- Middleware obrigatorio: `authenticate` + `tenantContextMiddleware`.
- Guarda RBAC obrigatoria (`requireRoles` e/ou `requirePermissions`).
- Contrato de request/response revisado.

### Para liberar Prisma Model
- ADR aprovado para modelagem.
- Ownership e source of truth sem ambiguidade.
- Avaliacao de impacto multi-tenant, RBAC, auditoria e integracoes.
- Planejamento de migration separado e aprovado (sem execucao automatica).

## Conclusao
Classificacao: **APROVADO COM AJUSTES**.

Justificativa:
- O blueprint tecnico preserva o papel orquestrador do modulo e evita duplicidades arquiteturais.
- A implementacao deve seguir rigorosamente fronteiras de ownership, contratos oficiais e regras anti-drift.
