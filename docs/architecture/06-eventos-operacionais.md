# 06 - Eventos Operacionais

## Propósito

Definir os principais eventos operacionais do FINQZ PRO para suportar rastreabilidade, integração e automações.

## Categorias de Eventos

### 1. Eventos de CRM

- **LeadCreated**: quando um lead é registrado.
- **LeadQualified**: quando um lead muda para status qualificado.
- **LeadConverted**: quando um lead é convertido em customer.
- **CustomerCreated**: quando um customer é criado diretamente ou por conversão.
- **OpportunityCreated**: quando uma oportunidade é aberta.
- **OpportunityStageChanged**: quando uma opportunity avança ou retrocede de stage.
- **OpportunityWon**: quando uma opportunity é marcada como ganha.
- **OpportunityLost**: quando uma opportunity é marcada como perdida.
- **ActivityLogged**: quando uma atividade é registrada.

### 2. Eventos Financeiros

- **BankProposalSubmitted**: quando uma proposta de crédito é enviada.
- **BankProposalApproved**: quando uma proposta é aprovada.
- **BankProposalRejected**: quando uma proposta é rejeitada.
- **CommissionCalculated**: quando a comissão é calculada para um negócio.
- **CommissionPaid**: quando a comissão é paga ao parceiro ou usuário.

### 3. Eventos de Segurança e Governança

- **UserAuthenticated**: quando um usuário faz login com sucesso.
- **RoleAssigned**: quando uma role é atribuída a um usuário.
- **PermissionChanged**: quando permissões são ajustadas.
- **TenantOnboarded**: quando um novo tenant é ativado.
- **AuditLogCreated**: quando uma entrada de auditoria é gerada.

## Regras de Emissão de Evento

- Eventos devem ser publicados sempre que o estado de uma entidade muda de forma relevante.
- Eventos não devem ser usados como mecanismo de validação do negócio; devem refletir o resultado de uma operação bem-sucedida.
- O sistema deve garantir entrega eventual para cenários assíncronos.
- Eventos de segurança devem ser auditados em camada separada.

## Uso de Eventos

### Integração entre domínios
- Evento `LeadConverted` pode disparar criação de registro de faturamento ou plano de onboarding.
- Evento `OpportunityWon` pode disparar cálculo de comissão e envio de notificação a parceiros.
- Evento `BankProposalApproved` pode acionar atualizações de saldo e relatórios financeiros.

### Automação e Orquestração
- Eventos permitem acionar workflows sem acoplamento direto entre módulos.
- Exemplo: `ActivityLogged` pode disparar tarefa de follow-up automático se tipo for `call` e resultado for `n/a`.

### Monitoramento e Observabilidade
- Eventos operacionais são fonte de métricas de pipeline e saúde comercial.
- Exemplo: medir tempo entre `OpportunityCreated` e `OpportunityWon`.

## Estrutura de Evento Recomendada

Cada evento deve conter pelo menos:
- `eventId`
- `tenantId`
- `entityId`
- `entityType`
- `eventType`
- `payload` (contexto relevante)
- `createdAt`

## Prioridade de Eventos

- **Alta**: LeadConverted, OpportunityWon, BankProposalSubmitted, CommissionCalculated.
- **Média**: LeadQualified, ActivityLogged, RoleAssigned.
- **Baixa**: PermissionChanged, AuditLogCreated.

## Observação

Eventos bem definidos suportam escalabilidade incremental: novos consumidores podem ser adicionados sem alterar o fluxo de negócio central. Manter o catálogo de eventos atualizado é parte da governança oficial.
