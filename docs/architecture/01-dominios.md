# 01 - Domínios

## Visão Geral

Esta documentação define os domínios do FINQZ PRO como uma plataforma SaaS financeira com foco em CRM enterprise. A proposta é garantir clareza de responsabilidade, escalabilidade incremental e governança de dados.

## Domínios Principais

### 1. Multi-Tenant e Governança
Responsabilidade:
- Isolar dados e configuração entre clientes (tenants).
- Garantir políticas de segurança, auditoria e compliance.
- Controlar usuários, organizações, roles e permissões.

Elementos chave:
- Tenant
- Organization
- User
- Role
- Permission
- AuditLog
- RefreshToken

### 2. Estrutura Comercial de Parceiros
Responsabilidade:
- Modelar a cadeia de franquias, parceiros e distribuidores.
- Aplicar regras de visibilidade e escopo para cada nível de partner.
- Consolidar dados de propriedade e autorização de parceiros.

Elementos chave:
- Partner
- PartnerHierarchy
- PartnerAssignment

### 3. CRM e Pipeline de Vendas
Responsabilidade:
- Gerenciar jornada de prospecção até a conversão.
- Registrar leads, oportunidades e atividades.
- Oferecer visibilidade do funil e métricas de conversão.

Elementos chave:
- Lead
- Customer
- Pipeline
- Stage
- Opportunity
- Activity

### 4. Domínio Financeiro
Responsabilidade:
- Registrar propostas financeiras e comissões.
- Integrar parâmetros de crédito e riscos.
- Manter trilha de cálculos e aprovações.

Elementos chave:
- BankProposal
- Commission
- FinancialProduct (futuro)
- Transaction (futuro)

### 5. Operações e Conformidade
Responsabilidade:
- Manter histórico de operações e logs.
- Garantir rastreabilidade de ações sensíveis.
- Suportar auditoria e governança de mudanças.

Elementos chave:
- AuditLog
- SystemEvent
- ComplianceRule

## Princípios de Segmentação de Domínio

- **Simplicidade operacional**: cada domínio representa um conjunto coeso de responsabilidades.
- **Escalabilidade incremental**: o sistema deve permitir crescer por domínio, não por monólitos.
- **Governança clara**: domínios financeiros e de CRM têm regras próprias, mas compartilham base de segurança e tenant.
- **Foco SaaS**: isolamento por tenant é obrigatório em todos os níveis.

## Critérios de Fronteira

- Não misturar regras de autorização com regras de negócio.
- Não misturar fluxo de vendas com cálculos financeiros diretos.
- A camada de parceiro define visibilidade, mas não altera o modelo de CRM fundamental.
- O domínio financeiro consome oportunidades e clientes, mas não controla o processo de venda.

## Comentário Operacional

A arquitetura deve ser tratada como um conjunto de domínios acoplados de forma previsível. O critério de consumo é a visibilidade incremental: cada domínio expõe APIs que outros domínios consomem sem replicar lógica.
