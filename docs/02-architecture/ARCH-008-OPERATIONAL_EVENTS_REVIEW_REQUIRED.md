# 06 - Eventos Operacionais

Status: DRAFT
Version: 0.2
Last Updated: 2026-06-03

## Propósito

Definir os principais eventos operacionais do FINQZ PRO para suportar rastreabilidade, integração e automações. Reorganizado por domínios oficiais conforme `ARCH-003`.

## Categorias de Eventos

### 1. Eventos de Clientes

- **CustomerCreated**: quando um customer é criado no sistema.
- **CustomerUpdated**: quando dados do customer são atualizados.
- **CustomerKYCStatusChanged**: quando o status KYC do customer é alterado.

### 2. Eventos de Parceiros

- **PartnerCreated**: quando um novo parceiro é registrado.
- **PartnerAssigned**: quando um partner é associado a uma oportunidade ou cliente.
- **PartnerScopeChanged**: quando a hierarquia ou escopo do partner é modificado.

### 3. Eventos de Estrutura Comercial

- **CommercialStructureCreated**: quando novo produto, subproduto ou modalidade é criado.
- **CommercialStructureUpdated**: quando a estrutura comercial é modificada.
- **CommercialStructureDeprecated**: quando um item é descontinuado.

### 4. Eventos de Tabelas Comerciais

- **CommercialTableCreated**: quando uma nova tabela comercial é definida.
- **CommercialTableActivated**: quando uma tabela comercial entra em vigor.
- **CommercialTableDeactivated**: quando uma tabela comercial é desativada.
- **CommercialConditionChanged**: quando condições comerciais são atualizadas.

### 5. Eventos de Providers

- **ProviderIntegrated**: quando um novo provider é integrado ao sistema.
- **ProviderSynchronized**: quando dados do provider são sincronizados.
- **ProviderStatusChanged**: quando o status de um provider é alterado.

### 6. Eventos de Oportunidades

- **OpportunityCreated**: quando uma oportunidade é aberta.
- **OpportunityUpdated**: quando dados da oportunidade são alterados.
- **OpportunityStageChanged**: quando uma opportunity avança ou retrocede de stage.
- **OpportunityWon**: quando uma opportunity é marcada como ganha.
- **OpportunityLost**: quando uma opportunity é marcada como perdida.

### 7. Eventos de Pipeline

- **PipelineCreated**: quando um novo pipeline é definido.
- **StageTransitioned**: quando uma oportunidade transiciona entre stages.
- **StageRulesUpdated**: quando regras de stage são alteradas.

### 8. Eventos de Simulação

- **SimulationExecuted**: quando uma simulação é executada.
- **SimulationResultsChanged**: quando resultados de simulação são atualizados.

### 9. Eventos de Operações

- **OperationCreated**: quando uma nova operação é criada.
- **OperationProposalRequested**: quando uma proposta é solicitada ao provider (BankProposal interno).
- **OperationProposalReceived**: quando resposta do provider é recebida.
- **OperationProposalApproved**: quando a proposta é aprovada internamente.
- **OperationProposalRejected**: quando a proposta é rejeitada.
- **OperationExecuted**: quando a operação é executada e finalizada.
- **OperationFailed**: quando a operação falha no ciclo.

### 10. Eventos de Comissões

- **CommissionCalculated**: quando a comissão é calculada para uma operação.
- **CommissionReleased**: quando a comissão é liberada para pagamento.
- **CommissionPaid**: quando a comissão é efetivamente paga.

### 11. Eventos de Governança e Segurança

- **UserAuthenticated**: quando um usuário faz login com sucesso.
- **UserRoleAssigned**: quando uma role é atribuída a um usuário.
- **PermissionChanged**: quando permissões são ajustadas.
- **TenantOnboarded**: quando um novo tenant é ativado.
- **AuditLogCreated**: quando uma entrada de auditoria é gerada.

### 12. Eventos Auxiliares (Lead)

- **LeadCreated**: quando um lead é registrado como ponto de entrada.
- **LeadQualified**: quando um lead muda para status qualificado.
- **LeadConverted**: quando um lead é convertido em customer.
- **LeadRejected**: quando um lead é descartado do funil.

Nota: Eventos de Lead são auxiliares e representam entrada de dados opcional. O centro do modelo é `Customer` e `Opportunity`.

## Regras de Emissão de Evento

- Eventos devem ser publicados sempre que o estado de uma entidade muda de forma relevante.
- Eventos não devem ser usados como mecanismo de validação do negócio; devem refletir o resultado de uma operação bem-sucedida.
- O sistema deve garantir entrega eventual para cenários assíncronos.
- Eventos de segurança devem ser auditados em camada separada.
- Eventos de domínio devem ser claramente associados a um dono de domínio.
- Lead não dispara fluxos críticos; Customer e Opportunity são os núcleos do modelo.

## Uso de Eventos

### Integração entre domínios
- Evento `CustomerCreated` pode disparar integração de onboarding ou verificação de risco.
- Evento `OpportunityCreated` conecta à Estrutura Comercial e ao Provider apropriado.
- Evento `OperationExecuted` dispara cálculo de comissão e fechamento financeiro.
- Evento `ProviderSynchronized` atualiza Tabelas Comerciais com novas condições.

### Automação e Orquestração
- Eventos permitem acionar workflows sem acoplamento direto entre módulos.
- Exemplo: `OpportunityStageChanged` pode disparar notificações e alertas de follow-up.
- Exemplo: `OperationProposalReceived` pode iniciar processo de validação de condições.

### Monitoramento e Observabilidade
- Eventos operacionais são fonte de métricas de pipeline e saúde comercial.
- Exemplo: medir tempo entre `OpportunityCreated` e `OpportunityWon`.
- Exemplo: rastrear taxa de sucesso de conversão entre `OperationProposalRequested` e `OperationExecuted`.

## Estrutura de Evento Recomendada

Cada evento deve conter pelo menos:
- `eventId`
- `tenantId`
- `entityId`
- `entityType`
- `eventType`
- `domainOwner` (identificação clara do domínio)
- `payload` (contexto relevante)
- `createdAt`

## Prioridade de Eventos

- **Crítica**: CustomerCreated, OpportunityCreated, OperationExecuted, CommissionCalculated, OperationProposalRequested.
- **Alta**: OpportunityStageChanged, OperationProposalReceived, CommissionReleased, CommercialTableActivated, ProviderSynchronized.
- **Média**: PartnerAssigned, SimulationExecuted, StageTransitioned, UserRoleAssigned.
- **Baixa**: LeadConverted, CommercialStructureUpdated, PermissionChanged, AuditLogCreated.

## Observação

Eventos bem definidos suportam escalabilidade incremental: novos consumidores podem ser adicionados sem alterar o fluxo de negócio central. Manter o catálogo de eventos atualizado é parte da governança oficial. Eventos de Lead são suportados mas não definem o modelo; Customer e Opportunity são as entidades centrais.
