# Commercial Governance Data Model Blueprint

## Objetivo
Definir o modelo conceitual de dados do modulo `commercial-governance`, incluindo entidades candidatas, ownership, relacionamentos, source of truth e dependencias, sem criar schema, banco ou implementacao tecnica.

## Entidades Candidatas
| Entidade | Deve Existir? | Motivo |
| -------- | ------------- | ------ |
| CommercialRequest | Sim | Entidade central para iniciar e rastrear solicitacoes comerciais especiais no fluxo de governanca |
| ApprovalWorkflow | Sim | Necessaria para representar o processo de aprovacao por alçada |
| ApprovalStep | Sim | Permite decompor workflow em etapas de aprovacao/revisao |
| ApprovalDecision | Sim | Registra a decisao por etapa (aprovar/reprovar/escalar) com justificativa |
| CommercialPolicy | Sim | Necessaria para validar regras de governanca e conformidade comercial |
| Campaign | Sim | Representa ciclo de campanhas comerciais governadas |
| CampaignRule | Sim | Separa regras de campanha para evitar acoplamento direto com campanha |
| BonusRequest | Sim | Permite governar pedidos de bonus sem duplicar dominio financeiro de comissoes |
| CommercialAgreement | Sim | Representa acordos oriundos de fluxos aprovados |
| AuditReference | Sim | Referencia eventos auditaveis sem recriar audit engine |
| NotificationReference | Sim | Referencia eventos de notificacao no fluxo orquestrado |

## Entidades Proibidas (Nao pertencem ao modulo)
- `Commission` -> dono oficial: `commissions` (source of truth financeiro de calculo de comissao)
- `CommissionLedger` -> dono oficial: `commissions` (source of truth contabil/ledger)
- `CommissionPayment` -> dono oficial: `commissions` (source of truth de pagamentos)
- `CommercialTable` -> dono oficial: `commercial` (source of truth de tabelas comerciais)
- `CommercialCondition` -> dono oficial: `commercial` (source of truth de condicoes comerciais)
- `Provider` -> dono oficial: `integrations` (source of truth de provider engine e contratos de provider)
- `Tenant` -> dono oficial: `tenant`/`tenants` (source of truth de contexto multi-tenant)
- `User` -> dono oficial: `users`/`auth` (source of truth de identidade e acesso)

## Ownership Matrix
| Entidade | Owner Module | Source Of Truth |
| -------- | ------------ | --------------- |
| CommercialRequest | commercial-governance | commercial-governance |
| ApprovalWorkflow | commercial-governance | commercial-governance |
| ApprovalStep | commercial-governance | commercial-governance |
| ApprovalDecision | commercial-governance | commercial-governance |
| CommercialPolicy | commercial-governance | commercial-governance |
| Campaign | commercial-governance | commercial-governance |
| CampaignRule | commercial-governance | commercial-governance |
| BonusRequest | commercial-governance | commercial-governance |
| CommercialAgreement | commercial-governance | commercial-governance |
| AuditReference | audit + commercial-governance | audit (evento oficial) + referencia em commercial-governance |
| NotificationReference | commercial-governance | commercial-governance (referencia de disparo/estado) |
| CommercialTable | commercial | commercial |
| CommercialCondition | commercial | commercial |
| Commission | commissions | commissions |
| CommissionLedger | commissions | commissions |
| CommissionPayment | commissions | commissions |
| Provider | integrations | integrations |
| Tenant | tenant/tenants | tenant/tenants |
| User | users/auth | users/auth |

## Relacionamentos Conceituais
- CommercialRequest -> ApprovalWorkflow
- ApprovalWorkflow -> ApprovalStep
- ApprovalStep -> ApprovalDecision
- CommercialRequest -> CommercialPolicy
- Campaign -> CampaignRule
- Campaign -> BonusRequest
- BonusRequest -> ApprovalWorkflow
- CommercialRequest -> CommercialAgreement
- CommercialAgreement -> AuditReference
- CommercialRequest -> AuditReference
- ApprovalDecision -> AuditReference
- CommercialRequest -> NotificationReference
- BonusRequest -> NotificationReference

Observacao:
- Relacionamentos sao conceituais nesta etapa.
- Cardinalidades tecnicas nao sao definidas neste blueprint.

## Matriz de Acesso (Conceitual)
| Entidade | Read | Write | Approve |
| -------- | ---- | ----- | ------- |
| CommercialRequest | Partner, Commercial, Manager, Director, CEO, Admin, Compliance | Partner, Commercial, Admin | Manager, Director, CEO, Admin |
| ApprovalWorkflow | Commercial, Manager, Director, CEO, Admin, Compliance | Commercial, Admin | Manager, Director, CEO, Admin |
| ApprovalStep | Commercial, Manager, Director, CEO, Admin, Compliance | Commercial, Admin | Manager, Director, CEO, Admin |
| ApprovalDecision | Commercial, Manager, Director, CEO, Admin, Compliance | Manager, Director, CEO, Admin | Manager, Director, CEO, Admin |
| CommercialPolicy | Commercial, Manager, Director, CEO, Admin, Compliance | Commercial, Admin, Compliance | Manager, Director, CEO, Admin |
| Campaign | Commercial, Manager, Director, CEO, Admin, Compliance | Commercial, Admin | Manager, Director, CEO, Admin |
| CampaignRule | Commercial, Manager, Director, CEO, Admin, Compliance | Commercial, Admin | Manager, Director, CEO, Admin |
| BonusRequest | Commercial, Manager, Director, CEO, Admin, Compliance | Commercial, Manager, Admin | Director, CEO, Admin |
| CommercialAgreement | Commercial, Manager, Director, CEO, Admin, Compliance | Commercial, Admin | Manager, Director, CEO, Admin |
| AuditReference | Compliance, Admin, Director, CEO | Sistema (evento), Admin (consulta/retencao) | Nao aplicavel |
| NotificationReference | Commercial, Manager, Director, CEO, Admin, Compliance | Sistema, Admin | Nao aplicavel |

## Regras Anti-Drift
- Nao duplicar entidades de `commercial`.
- Nao duplicar entidades de `commissions`.
- Nao duplicar Provider Engine de `integrations`.
- Nao duplicar Audit Engine do modulo `audit`.
- Nao criar ownership ambiguo entre modulos.
- Nao criar source of truth duplicado para a mesma entidade de negocio.

## Criterios para Futura Implementacao
Uma entidade candidata so pode evoluir para artefatos tecnicos quando cumprir os criterios abaixo:

### Para virar DTO
- Workflow e caso de uso formalmente aprovados na arquitetura.
- Contrato de entrada/saida definido sem sobreposicao com outros modulos.
- Regras de validacao vinculadas ao owner oficial da entidade.

### Para virar Service
- Regra de negocio nao trivial comprovada e pertencente ao `commercial-governance`.
- Dependencias externas declaradas (commercial, commissions, integrations, audit).
- Garantia de nao duplicidade de logica de dominios oficiais.

### Para virar Repository
- Necessidade real de persistencia da entidade no dominio `commercial-governance`.
- Entidade validada como owner local na Ownership Matrix.
- Proibicao explicita de persistir entidades cujo owner e outro modulo.

### Para virar Prisma Model
- Decisao arquitetural formal (ADR) aprovada.
- Definicao de ownership e source of truth sem ambiguidade.
- Revisao de impacto multi-tenant, RBAC, auditoria e integracao.
- Planejamento de migracao separado e aprovado (sem execucao automatica).

## Conclusao
Classificacao: **APROVADO COM AJUSTES**.

Justificativa:
- O blueprint define fronteiras consistentes e ownership claro para o modulo orquestrador.
- A implementacao futura permanece condicionada ao cumprimento das regras anti-drift e a validacoes arquiteturais formais.
