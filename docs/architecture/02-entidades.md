# 02 - Entidades

## Introdução

Este documento descreve as entidades principais do FINQZ PRO e seus papéis na plataforma. A intenção é manter um modelo de domínio estável e transparente para toda equipe técnica.

## Entidades Centrais

### Tenant
- Representa o cliente corpóreo da plataforma.
- Controla isolamento de dados, configurações e limites.
- É a raiz de todas as operações SaaS.

Atributos relevantes:
- tenantId
- name
- status
- createdAt
- updatedAt

### Organization
- Representa unidades internas ou estruturas organizacionais dentro do tenant.
- Suporta hierarquia administrativa.

Atributos relevantes:
- organizationId
- tenantId
- parentOrganizationId
- name
- type
- active

### User
- Identifica usuários que acessam a plataforma.
- Está associado a um tenant e a uma organização.
- Pode atuar em múltiplos perfis dentro do mesmo tenant.

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
- Define um conjunto de permissões.
- Usado para RBAC em nível de tenant.

Atributos relevantes:
- roleId
- tenantId
- name
- description
- isSystemRole

### Permission
- Unidade mínima de controle de acesso.
- Aplicável a módulos e ações específicas.

Atributos relevantes:
- permissionId
- name
- description
- module

### Partner
- Modelo de franquia, distribuidor ou parceiro comercial.
- Concentra regras de visibilidade e alocação de vendas.

Atributos relevantes:
- partnerId
- tenantId
- parentPartnerId
- name
- type
- active

### Lead
- Representa um contato inicial ou prospect.
- É o ponto de entrada do CRM.
- Deve ser rastreável até sua origem e dono.

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

### Customer
- Representa um cliente ativo ou qualificado.
- Pode derivar de um Lead ou ser cadastrado diretamente.
- Central para operações financeiras e comerciais.

Atributos relevantes:
- customerId
- tenantId
- leadId?
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

### Pipeline
- Representa um funil de vendas configurável.
- Permite modelar estágios de negociação.

Atributos relevantes:
- pipelineId
- tenantId
- name
- description
- active

### Stage
- Representa etapas do pipeline.
- Ordenação e regras de transição são aplicáveis.

Atributos relevantes:
- stageId
- pipelineId
- name
- order
- probability
- isFinal

### Opportunity
- Representa uma chance de venda ou negócio em andamento.
- Está sempre associado a um cliente ou lead.

Atributos relevantes:
- opportunityId
- tenantId
- customerId?
- leadId?
- ownerId
- partnerId?
- pipelineId
- stageId
- title
- value
- status
- expectedCloseDate
- createdAt
- updatedAt

### Activity
- Registro de interações e tarefas.
- Suporta e-mails, reuniões, chamadas e notas.

Atributos relevantes:
- activityId
- tenantId
- userId
- relatedEntityId
- relatedEntityType
- type
- subject
- description
- status
- dueDate
- createdAt
- updatedAt

### BankProposal
- Representa uma proposta de financiamento ou crédito.
- Está vinculada a uma opportunity e/ou customer.

Atributos relevantes:
- bankProposalId
- tenantId
- opportunityId
- customerId
- productId
- amount
- term
- rate
- status
- submittedAt
- approvedAt

### Commission
- Representa comissões calculadas sobre vendas.
- Deve ser rastreável até a proposta e ao usuário parceiro.

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

### AuditLog
- Registro imutável de ações relevantes.
- Campo obrigatório para compliance e investigação.

Atributos relevantes:
- auditLogId
- tenantId
- userId?
- eventType
- entityId
- entityType
- payload
- createdAt

## Observações de Modelo

- Todos os modelos críticos devem carregar `tenantId`.
- `createdById` e `ownerId` devem ser usados para rastreio de responsabilidade.
- Registros financeiros devem ter vínculo explícito com oportunidade e cliente.
- O modelo de `Lead` pode ser a fonte primária e migrado para `Customer` por conversão.
