# 02 - Entidades

Status: DRAFT
Version: 0.2
Last Updated: 2026-06-03

## Introdução

Este documento revisa o modelo de entidades do FINQZ PRO para alinhar a arquitetura de domínio à visão oficial consolidada. O objetivo é reposicionar cada entidade conforme os domínios de `ARCH-003`, mantendo `Opportunity` como entidade central e `Estrutura Comercial` como Catálogo Mestre.

## Objetivo

Definir:
- entidades centrais oficiais,
- ownership por domínio,
- responsabilidades de fonte de verdade,
- escopo Tenant e Partner.

## Domínios Oficiais

### Governança e Segurança
- Tenant
- Organization
- User
- Role
- Permission
- AuditLog

### Clientes
- Customer

### Parceiros
- Partner

### Estrutura Comercial
- Catálogo Mestre: Vertical → Product → Subproduct → Modality

### Comercial e Operacional
- Opportunity
- CommercialTable (condições comerciais)
- Provider
- Pipeline
- Stage
- Simulation
- Operation
- BankProposal
- Commission

## Entidades de Governança

### Tenant
- Representa o cliente corpóreo da plataforma.
- Controla isolamento de dados, configurações e limites.
- É a raiz do modelo multi-tenant.

Atributos relevantes:
- tenantId
- name
- status
- createdAt
- updatedAt

### Organization
- Representa estruturas organizacionais dentro do tenant.
- Suporta delegação administrativa.

Atributos relevantes:
- organizationId
- tenantId
- parentOrganizationId
- name
- type
- active

### User
- Identifica usuários da plataforma.
- Está associado a um tenant e a uma organização.
- Pode ter múltiplas roles no mesmo tenant.

Atributos relevantes:
- userId
- tenantId
- organizationId
- email
- name
- status
- createdAt
- updatedAt

### Role
- Define um conjunto de permissões no contexto do tenant.
- O ownership de acesso é avaliado por permissão, não por função isolada.

Atributos relevantes:
- roleId
- tenantId
- name
- description
- isSystemRole

### Permission
- Unidade mínima de controle de acesso.
- Deve ser nomeada por módulo/ação.

Atributos relevantes:
- permissionId
- name
- description
- module

### AuditLog
- Registro imutável de ações relevantes.
- Suporta compliance, investigação e monitoramento.

Atributos relevantes:
- auditLogId
- tenantId
- userId?
- eventType
- entityId
- entityType
- payload
- createdAt

## Entidades de Domínio Operacional

### Customer
- Fonte oficial de verdade para a pessoa atendida.
- Pertence ao domínio Clientes.
- Pode derivar de um Lead, mas o Customer é a entidade de referência oficial.

Atributos relevantes:
- customerId
- tenantId
- partnerId?
- firstName
- lastName
- email
- phone
- cpf
- birthDate
- kycStatus
- riskLevel
- createdAt
- updatedAt

### Partner
- Representa parceiros comerciais e hierarquias de franquia.
- Define escopo de visibilidade e limite de dados.

Atributos relevantes:
- partnerId
- tenantId
- parentPartnerId
- name
- type
- active

### Opportunity
- Entidade central do FINQZ PRO.
- Conecta Customer, Partner, Estrutura Comercial, Tabela Comercial, Provider, Pipeline, Simulação e Operação.
- Deve ser tratada como a principal linha de negócio.

Atributos relevantes:
- opportunityId
- tenantId
- customerId
- partnerId?
- ownerId
- pipelineId
- stageId
- title
- value
- status
- expectedCloseDate
- createdAt
- updatedAt

### CommercialTable
- Representa condições comerciais.
- Depende da Estrutura Comercial e do Provider.
- Não é o Catálogo Mestre.

Atributos relevantes:
- tableId
- tenantId
- productId
- subproductId
- modalityId
- providerId
- rate
- term
- validity
- isActive

### Provider
- Responsável por fornecer condições, simulações, propostas, esteiras e pagamentos.
- Não é produto e não é catálogo.

Atributos relevantes:
- providerId
- tenantId
- name
- type
- active
- integrationMetadata

### Pipeline
- Organiza o fluxo operacional das oportunidades.
- Não substitui Opportunity.

Atributos relevantes:
- pipelineId
- tenantId
- name
- description
- active

### Stage
- Representa etapas de um pipeline.
- Controla ordem e lógica de transição.

Atributos relevantes:
- stageId
- pipelineId
- name
- order
- probability
- isFinal

### Simulation
- Representa cálculo de viabilidade.
- Não é o eixo da operação, mas um artefato de avaliação.

Atributos relevantes:
- simulationId
- tenantId
- opportunityId
- providerId
- parameters
- result
- createdAt

### Operation
- Representa a execução de um negócio.
- Serve de base para cálculo de comissão e fechamento financeiro.

Atributos relevantes:
- operationId
- tenantId
- opportunityId
- providerId
- status
- executedAt

### BankProposal
- Representa proposta de crédito ou financiamento.
- Está vinculada a Opportunity e Provider.
- Não é o centro do modelo; é um artefato de operação.

Atributos relevantes:
- bankProposalId
- tenantId
- opportunityId
- providerId
- amount
- term
- rate
- status
- submittedAt
- approvedAt

### Commission
- Representa comissões calculadas sobre operações.
- Depende de operação e oportunidade.

Atributos relevantes:
- commissionId
- tenantId
- opportunityId
- partnerId
- userId
- percentage
- amount
- status
- createdAt

## Entidade de Apoio

### Lead
- Representa contato inicial ou prospect.
- Faz parte de um fluxo de qualificação, mas não é a fonte oficial de verdade.
- Serve de entrada para conversão em Customer.

Atributos relevantes:
- leadId
- tenantId
- partnerId?
- createdById
- ownerId
- firstName
- lastName
- email
- phone
- cpf
- status
- score
- source
- createdAt
- updatedAt

## Observações de Modelo

- Todos os modelos críticos devem carregar `tenantId`.
- `Customer` é a fonte de verdade da pessoa atendida; `Lead` é um ponto de entrada opcional.
- `Opportunity` é a entidade central de negócio.
- `Estrutura Comercial` é o Catálogo Mestre oficial.
- `CommercialTable` representa condições comerciais, não catálogo.
- `Provider` fornece condições e serviços, mas não é produto.
- `Pipeline` organiza fluxo; `Simulation` calcula viabilidade.
- `Commission` depende de operação concluída.
- O legado `Products` ou `Produtos` não deve ser reintroduzido como domínio separado.
- A modelagem deve evitar arquiteturas centradas em Lead, BankProposal ou em produtos legados.
