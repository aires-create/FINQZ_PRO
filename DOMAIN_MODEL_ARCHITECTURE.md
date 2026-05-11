# FINQZ PRO - Domain Model & Architecture

**Documento Estratégico para Consolidação de Domínio**  
**Status**: Foundation Design (Pre-Implementation)  
**Data**: 2026-05-11

---

## 📊 MAPEAMENTO DE ENTIDADES (CANONICAL MODEL)

### Estrutura em 4 Camadas

```
┌─────────────────────────────────────────────────────────────────┐
│ CAMADA 1: MULTI-TENANCY & GOVERNANCE (Isolamento)             │
│ ├─ Tenant (empresa matriz)                                     │
│ ├─ Organization (hierarquia interna do tenant)                 │
│ ├─ User (usuários do tenant)                                   │
│ ├─ Membership (vinculação de user → organization)              │
│ └─ Roles + Permissions (RBAC)                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ CAMADA 2: COMMERCIAL STRUCTURE (Parceiros)                     │
│ ├─ Partner (empresa/franquia/franqueado)                       │
│ ├─ Partner Hierarchy (parent_id, relações tree)                │
│ └─ Partner Management (gerência de usuários)                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ CAMADA 3: SALES DOMAIN (Vendas)                                │
│ ├─ Lead (prospect, prospect → customer) - ORIGEM               │
│ ├─ Customer (cliente ativo, KYC, risk)                         │
│ ├─ Pipeline + Stage (funil de vendas)                          │
│ ├─ Opportunity (oportunidade de venda)                         │
│ └─ Activity (interações, calls, emails, meetings)              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ CAMADA 4: FINANCIAL DOMAIN (Finanças)                          │
│ ├─ BankProposal (proposta de financiamento)                    │
│ ├─ Commission (comissões sobre vendas)                         │
│ ├─ Account (conta corrente - FUTURE)                           │
│ └─ Transaction (movimentações - FUTURE)                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔗 OWNERSHIP & DATA SOVEREIGNTY

### Quem "OWNEIA" cada Entidade

| Entidade | Dono | Escopo Visibilidade | Nota |
|----------|------|---|---|
| **Tenant** | System Admin | GLOBAL | Raiz de isolamento |
| **Organization** | Tenant | TENANT | Hierarquia interna |
| **User** | Tenant | TENANT | Vinculado a org |
| **Membership** | Organization | ORG | Controla acesso |
| **Role/Permission** | Tenant | TENANT | RBAC centralizado |
| **Partner** | Tenant | TENANT + HIERARCHY | Pode ter sub-partners |
| **Lead** | User (Creator) | TENANT + SCOPE | Criador é owner padrão |
| **Customer** | Tenant | TENANT + PARTNER | Pode estar vinculado a partner |
| **Pipeline** | Tenant | TENANT | Config de processo |
| **Stage** | Pipeline | TENANT | Parte do pipeline |
| **Opportunity** | User (Owner) | TENANT + SCOPE | Pode mover entre stages |
| **Activity** | User | TENANT + SCOPE | Registro de interação |
| **BankProposal** | User (Creator) | TENANT + SCOPE | Vinculada a opp/customer |
| **Commission** | User | TENANT + SCOPE | Calculada sobre vendas |
| **AuditLog** | System | TENANT | Immutable trail |

### Padrão de Isolamento

```typescript
// Padrão universal
interface TenantAware {
  tenantId: string;      // ← Sempre!
  organizationId?: string; // ← Se applicable
  ownerId?: string;       // ← Se applicable
  createdById: string;    // ← Sempre!
}
```

---

## 🔄 MAPA DE RELACIONAMENTOS

### Fluxo de Conversão (Happy Path)

```
Lead (prospect)
    ↓
  [qualify]
    ↓
Customer (KYC approved)
    ↓
  [create opportunity]
    ↓
Opportunity (in pipeline)
    ↓
  [advance through stages]
    ↓
Opportunity [WON]
    ↓
  [create proposal]
    ↓
BankProposal
    ↓
  [approve]
    ↓
Commission (calculated)
```

### Relacionamentos Críticos

| De → Para | Tipo | Cardinality | Problema Identificado |
|-----------|------|---|---|
| **Lead → Opportunity** | 1:N | Um lead pode ter múltiplas opportunities | ✅ OK |
| **Customer → Opportunity** | 1:N | Um customer pode ter múltiplas opportunities | ✅ OK |
| **Opportunity → BankProposal** | 1:N | Uma opp pode ter múltiplas propostas | ✅ OK |
| **Customer → Commission** | 1:N | Comissões associadas ao customer | ⚠️ PROBLEMA: Deve ser por User (quem vendeu) |
| **Opportunity → Activity** | 1:N | Atividades associadas à opp | ✅ OK |
| **Lead → Activity** | 1:N | Atividades associadas ao lead | ✅ OK |
| **User → Partner** | N:1 | Usuário vinculado a um partner | ✅ OK |
| **Partner → Customer** | 1:N | Parceiro pode ter clientes | ✅ OK (opcional) |
| **Organization → User** | N:M (via Membership) | Usuário em múltiplas orgs | ✅ OK |

---

## ⚠️ DUPLICIDADES IDENTIFICADAS

### 1. Lead vs Customer (CRÍTICO)
**Problema**: Dois objetos que representam "pessoa que pode ser cliente"

```
Lead: {
  firstName, lastName, email, phone, cpf, birthDate
  score, status (prospect→contact→qualified), notes
  createdAt, ownerId
}

Customer: {
  firstName, lastName, email, phone, cpf, birthDate
  monthlyIncome, annualIncome, riskLevel
  kycStatus, kycVerifiedAt
}
```

**Impacto**:
- Dados duplicados em dois lugares
- Difícil sincronizar
- Possível inconsistência
- Qual é a fonte de verdade?

**Solução Proposta**:
```typescript
// Lead é apenas PROSPECT - não converter, reusar
interface Lead {
  // Info básica (mesma do Customer)
  firstName, lastName, email, phone, cpf
  
  // Apenas campos de prospecção
  score: number;           // Lead scoring
  status: 'prospect' | 'contact' | 'qualified' | 'converted';
  source?: string;         // Como chegou
  
  // Quando convertido para customer
  convertedAt?: DateTime;
  convertedToCustomerId?: UUID; // ← Link para customer
}

// Customer é apenas QUALIFIED
interface Customer {
  leadId?: UUID; // ← Link para lead original (rastreabilidade)
  
  // Dados completos
  firstName, lastName, email, phone, cpf
  monthlyIncome, annualIncome
  kycStatus, kycVerifiedAt
  riskLevel
  
  // Hierarquia de clientes
  parentCustomerId?: UUID; // Para clientes corporativos/dependentes
}
```

**Benefício**: Uma pessoa é tracked do prospect até cliente final

### 2. Opportunity Owner vs User Assignment (DUPLICAÇÃO)
**Problema**: Opportunity tem `ownerId` (User), mas quem criou é quem deveria ser responsável?

```typescript
// Atual - ambíguo
Opportunity {
  ownerId: User;           // Quem "owneia"?
  createdById: User;       // Quem criou?
  stageId: Stage;          // Em qual estágio?
}

// Proposto - claro
Opportunity {
  createdById: User;       // Imutável, quem criou
  assignedToId: User;      // Pode mudar, quem está trabalhando
  stageManagedById?: User; // Se stage é bloqueada por aprovação
}
```

### 3. Bank Proposal Dados de Cliente (PROBLEMA)
**Problema**: BankProposal tem customer/lead duplo

```typescript
BankProposal {
  leadId?: UUID;       // Pode estar em lead ainda
  customerId?: UUID;   // Ou convertido em customer
  // PROBLEMA: ambos podem estar preenchidos - qual é a verdade?
}
```

**Solução**:
```typescript
BankProposal {
  customerId: UUID; // SEMPRE obrigatório - converter lead antes
  // Se estava em lead, cria customer.convertedFromLead
}
```

---

## 🧩 DEPENDÊNCIAS ENTRE MÓDULOS

### Mapa de Dependências (Direction of Data Flow)

```
                    ┌─────────────────┐
                    │ CORE GOVERNANCE │
                    │ (Auth, RBAC)    │
                    └────────┬────────┘
                             ↓
              ┌──────────────────────────────┐
              │ PARTNER & ORG MANAGEMENT     │
              │ (Tenant, Organization, User) │
              └────────┬─────────────────────┘
                       ↓
         ┌─────────────────────────────────────┐
         │ SALES DOMAIN (CRM)                 │
         │ Lead → Customer → Opportunity → Activity
         └────────┬────────────────────────────┘
                  ↓
      ┌────────────────────────────────────┐
      │ FINANCIAL DOMAIN                  │
      │ BankProposal → Commission         │
      └────────────────────────────────────┘
```

### Dependências Explícitas (Em Desenvolvimento)

```
✅ Auth → Everything (middleware de validação)
✅ Organizations → Users/Roles (hierarquia)
✅ Users → Activities (quem fez)
✅ Customers → Opportunities (alvo de venda)
✅ Opportunities → BankProposal (contexto)
✅ BankProposal → Commission (origem)

⚠️ FRACO: Lead → Customer (conversão manual, sem sync)
⚠️ FRACO: Pipeline → Stages (não há validação)
⚠️ FRACO: Partners → Customers (opcional, não enforced)
```

---

## 🔴 PROBLEMAS DE DESIGN IDENTIFICADOS

### P1: Multi-Tenant Filtering Não Automático
**Código**: Backend queries não filtram por tenantId automaticamente
```typescript
// ❌ INSEGURO
const leads = await prisma.lead.findMany();

// ✅ CORRETO
const leads = await prisma.lead.findMany({
  where: { tenantId: req.user.tenantId }
});
```

**Impacto**: Cada query precisa lembrar de filtrar → Risk de data leak  
**Solução**: Prisma middleware que injeta `tenantId` automaticamente

### P2: Lead/Customer Duplicação
**Descrição**: Dados redundantes em dois modelos  
**Impacto**: Inconsistência, duplicação de lógica  
**Solução**: Refatorar para Lead → Customer (conversion-based)

### P3: Ausência de Soft-Delete em Todos Modelos
**Código**: Alguns modelos tem `deletedAt`, outros não
**Impacto**: Difícil restaurar dados, auditoria incompleta  
**Solução**: Adicionar `deletedAt` em TODOS os modelos operacionais

### P4: Sem Versionamento de Dados
**Problema**: Quando muda um preço, comissão, etc, não há histórico  
**Impacto**: Auditoria comprometida, reconciliação impossível  
**Solução**: Implementar `RecordVersion` ou `AuditLog` em modelos críticos

### P5: Activity Desconexo de Contexto
**Problema**: Activity pode ter lead OU opportunity OU customer, mas qual é o contexto real?
```typescript
Activity {
  leadId?: UUID;
  opportunityId?: UUID;
  customerId?: UUID;
  // PROBLEMA: pode ter nenhum, um ou mais!
}
```

**Solução**: Activity sempre vinculada a Opportunity (não a Lead/Customer isoladamente)

---

## 📐 PROPOSTA DE ORGANIZAÇÃO - BACKEND ENTERPRISE

### Estrutura Recomendada

```
backend/src/
│
├── domains/                    # ← Lógica de negócio pura (sem dependências)
│   ├── auth/
│   │   ├── entities/
│   │   │   ├── user.entity.ts
│   │   │   └── role.entity.ts
│   │   ├── value-objects/
│   │   │   ├── permission.vo.ts
│   │   │   └── access-scope.vo.ts
│   │   └── services/
│   │       ├── password-hasher.service.ts
│   │       └── token-manager.service.ts
│   │
│   ├── sales/                  # ← Venda (Lead, Customer, Opportunity)
│   │   ├── entities/
│   │   │   ├── lead.entity.ts
│   │   │   ├── customer.entity.ts
│   │   │   ├── opportunity.entity.ts
│   │   │   └── activity.entity.ts
│   │   ├── value-objects/
│   │   │   ├── lead-score.vo.ts
│   │   │   ├── opportunity-stage.vo.ts
│   │   │   └── activity-type.vo.ts
│   │   ├── services/
│   │   │   ├── lead-converter.service.ts      # Lead → Customer
│   │   │   ├── opportunity-stager.service.ts  # Opp movement
│   │   │   └── activity-recorder.service.ts
│   │   └── rules/
│   │       ├── lead-qualification.rules.ts
│   │       └── opportunity-validation.rules.ts
│   │
│   ├── financial/             # ← Finanças (Proposals, Commissions)
│   │   ├── entities/
│   │   │   ├── bank-proposal.entity.ts
│   │   │   └── commission.entity.ts
│   │   ├── services/
│   │   │   ├── commission-calculator.service.ts
│   │   │   └── proposal-validator.service.ts
│   │   └── rules/
│   │       └── commission-rules.ts
│   │
│   ├── partnership/           # ← Parceria (Partner, Organization)
│   │   ├── entities/
│   │   │   ├── partner.entity.ts
│   │   │   └── organization.entity.ts
│   │   ├── value-objects/
│   │   │   └── partner-hierarchy.vo.ts
│   │   └── services/
│   │       ├── partner-tree.service.ts
│   │       └── org-hierarchy.service.ts
│   │
│   └── governance/            # ← Controle (Tenant, RBAC)
│       ├── entities/
│       │   ├── tenant.entity.ts
│       │   └── permission.entity.ts
│       └── services/
│           └── access-control.service.ts
│
├── application/               # ← Orquestração (Use Cases)
│   ├── auth/
│   │   ├── register.use-case.ts
│   │   ├── login.use-case.ts
│   │   └── refresh-token.use-case.ts
│   │
│   ├── sales/
│   │   ├── create-lead.use-case.ts
│   │   ├── convert-lead-to-customer.use-case.ts
│   │   ├── create-opportunity.use-case.ts
│   │   ├── advance-opportunity.use-case.ts
│   │   └── create-activity.use-case.ts
│   │
│   ├── financial/
│   │   ├── create-proposal.use-case.ts
│   │   ├── approve-proposal.use-case.ts
│   │   └── calculate-commission.use-case.ts
│   │
│   └── partnership/
│       ├── create-partner.use-case.ts
│       └── manage-org-hierarchy.use-case.ts
│
├── infrastructure/            # ← Detalhes técnicos
│   ├── persistence/
│   │   ├── repositories/
│   │   │   ├── lead.repository.ts
│   │   │   ├── customer.repository.ts
│   │   │   ├── opportunity.repository.ts
│   │   │   └── commission.repository.ts
│   │   ├── prisma/
│   │   │   ├── prisma.client.ts
│   │   │   └── extensions/
│   │   │       ├── tenant-isolation.ts    # ← Middleware de tenant
│   │   │       └── soft-delete.ts
│   │   └── migrations/
│   │
│   ├── cache/
│   │   ├── redis.client.ts
│   │   ├── catalog.cache.ts
│   │   └── roles-permissions.cache.ts
│   │
│   ├── queue/
│   │   ├── bull.client.ts
│   │   ├── jobs/
│   │   │   ├── send-notification.job.ts
│   │   │   ├── calculate-commissions.job.ts
│   │   │   └── sync-banking-data.job.ts
│   │   └── handlers/
│   │
│   ├── external/
│   │   ├── banking/
│   │   │   └── bank-api.adapter.ts
│   │   └── messaging/
│   │       ├── email.adapter.ts
│   │       └── sms.adapter.ts
│   │
│   └── logger/
│       ├── structured-logger.ts
│       └── request-correlation.ts
│
├── presentation/              # ← HTTP layer
│   ├── http/
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── leads.controller.ts
│   │   │   ├── customers.controller.ts
│   │   │   ├── opportunities.controller.ts
│   │   │   └── commissions.controller.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── sales.routes.ts
│   │   │   └── financial.routes.ts
│   │   ├── middleware/
│   │   │   ├── authentication.middleware.ts
│   │   │   ├── authorization.middleware.ts
│   │   │   ├── tenant-guard.middleware.ts
│   │   │   └── error-handler.middleware.ts
│   │   └── dto/
│   │       ├── requests/
│   │       │   ├── create-lead.request.ts
│   │       │   ├── create-opportunity.request.ts
│   │       │   └── advance-opportunity.request.ts
│   │       └── responses/
│   │           ├── lead.response.ts
│   │           ├── opportunity.response.ts
│   │           └── commission.response.ts
│   │
│   └── validation/
│       ├── joi-schemas/
│       │   ├── lead.schema.ts
│       │   ├── opportunity.schema.ts
│       │   └── commission.schema.ts
│       └── custom-validators/
│           └── business-rules.validator.ts
│
└── shared/                    # ← Utilitários compartilhados
    ├── errors/
    │   ├── app-error.ts
    │   ├── validation-error.ts
    │   └── authorization-error.ts
    ├── types/
    │   ├── pagination.types.ts
    │   ├── pagination.types.ts
    │   └── api-response.types.ts
    ├── utils/
    │   ├── date-utils.ts
    │   ├── number-utils.ts
    │   └── string-utils.ts
    └── constants/
        ├── error-codes.ts
        ├── status-codes.ts
        └── business-constants.ts
```

---

## 🎯 BOUNDARIES DE DOMÍNIO (Domain Boundaries)

### Sales Domain
**Responsável por**: Prospecção, qualificação, oportunidades

**Entidades**:
- Lead (prospect)
- Customer (cliente ativo)
- Opportunity (venda em progresso)
- Activity (interações)
- Pipeline + Stage (funil)

**Invariantes** (regras de negócio):
- Uma Lead só pode estar em status: prospect → contact → qualified → converted
- Uma Opportunity deve estar sempre em um Stage válido
- Uma Activity deve estar sempre vinculada a uma Opportunity
- Lead score aumenta com ações (vem de eventos)

**Eventos**:
- `LeadCreated`
- `LeadQualified`
- `LeadConvertedToCustomer`
- `OpportunityCreated`
- `OpportunityAdvanced`
- `OpportunityWon` / `OpportunityLost`
- `ActivityRecorded`

---

### Financial Domain
**Responsável por**: Propostas, comissões, movimentações financeiras

**Entidades**:
- BankProposal (proposta de financiamento)
- Commission (comissão calculada)
- Account (conta corrente) [FUTURE]
- Transaction (movimentação) [FUTURE]

**Invariantes**:
- BankProposal não pode ser criada sem Customer ativo
- Commission só pode ser criada se BankProposal foi aprovada
- Commission = Valor * Taxa (conforme config)

**Eventos**:
- `ProposalCreated`
- `ProposalApproved`
- `ProposalRejected`
- `CommissionCalculated`
- `CommissionApproved`
- `CommissionPaid`

---

### Partnership Domain
**Responsável por**: Parceiros, hierarquia, organizações

**Entidades**:
- Tenant (empresa)
- Organization (estrutura interna)
- Partner (franchia/franqueado)
- User (usuários)
- Membership (vinculação)

**Invariantes**:
- Partner pode ter hierarquia (company → franquia → franqueado)
- Organization é única por Tenant
- User deve estar em pelo menos uma Organization

**Eventos**:
- `TenantCreated`
- `PartnerCreated`
- `PartnerHierarchyChanged`
- `UserInvited`
- `MembershipAccepted`

---

### Governance Domain
**Responsável por**: Autenticação, autorização, auditoria

**Entidades**:
- Role (papel)
- Permission (permissão granular)
- AuditLog (registro immutable)
- RefreshToken (token rotation)

**Invariantes**:
- Todo User deve ter pelo menos uma Role
- Role pode ter múltiplas Permissions
- AuditLog é immutable

**Eventos**:
- `UserAuthenticated`
- `UserAuthorized`
- `PermissionDenied`
- `RoleAssigned`

---

## 📋 ESTRUTURA DE PASTAS DO FRONTEND

```
src/
├── domains/                   # ← Tipos de domínio
│   ├── sales/
│   │   ├── types.ts          # Lead, Customer, Opportunity, Activity types
│   │   ├── hooks/
│   │   │   ├── useLeads.ts
│   │   │   ├── useCustomers.ts
│   │   │   ├── useOpportunities.ts
│   │   │   └── useActivities.ts
│   │   └── utils/
│   │       ├── lead-qualification.ts
│   │       └── opportunity-pipeline.ts
│   │
│   ├── financial/
│   │   ├── types.ts          # Proposal, Commission types
│   │   ├── hooks/
│   │   │   ├── useProposals.ts
│   │   │   └── useCommissions.ts
│   │   └── utils/
│   │       └── commission-calculator.ts
│   │
│   └── partnership/
│       ├── types.ts          # Partner, Organization types
│       ├── hooks/
│       │   ├── usePartners.ts
│       │   └── useOrganizations.ts
│       └── utils/
│           └── partner-hierarchy.ts
│
├── components/
│   ├── sales/
│   │   ├── LeadForm.tsx
│   │   ├── LeadList.tsx
│   │   ├── OpportunityKanban.tsx
│   │   ├── ActivityTimeline.tsx
│   │   └── CustomerProfile.tsx
│   │
│   ├── financial/
│   │   ├── ProposalForm.tsx
│   │   ├── CommissionTable.tsx
│   │   └── FinancialReport.tsx
│   │
│   └── partnership/
│       ├── PartnerTree.tsx
│       ├── OrganizationChart.tsx
│       └── MembershipManagement.tsx
│
└── pages/
    ├── sales/
    │   ├── LeadsPage.tsx
    │   ├── CustomersPage.tsx
    │   ├── OpportunitiesPage.tsx
    │   └── ActivitiesPage.tsx
    │
    └── financial/
        ├── ProposalsPage.tsx
        └── CommissionsPage.tsx
```

---

## 🔐 PRINCÍPIOS DE DESIGN

### P1: Separação de Responsabilidades
- **Domain**: Lógica pura (sem HTTP, DB, cache)
- **Application**: Orquestração (coordena use cases)
- **Infrastructure**: Detalhes técnicos (DB, cache, APIs)
- **Presentation**: HTTP, DTOs, validação

### P2: Inversão de Dependência
- Use interfaces, não implementações
- Domain → Application ← Infrastructure
- Injeção de dependência em todos os serviços

### P3: Validação em Camadas
```
HTTP Request (Joi/Zod)
    ↓
DTO Mapping
    ↓
Use Case (Business Logic)
    ↓
Domain Rules (Invariantes)
    ↓
Database
```

### P4: Isolamento de Tenant
- Middleware automático: `tenantId` em TODA query
- Verificação dupla: middleware + domain
- Logs de data access por tenant

### P5: Auditoria Total
- Toda ação é logada
- Imutável: AuditLog nunca muda
- Incluir: who, what, when, where, why

---

## 🚀 PRÓXIMAS AÇÕES (Sequência)

### Semana 1: Foundation
1. [ ] Criar estrutura de pastas (domains/)
2. [ ] Implementar extensão Prisma para tenant isolation
3. [ ] Criar middleware de authorization (validar no backend)
4. [ ] Implementar AuditLog automático

### Semana 2: Entity Consolidation
1. [ ] Refatorar Lead ← → Customer (conversão)
2. [ ] Consolidar Activity (sempre em Opportunity)
3. [ ] Adicionar soft-delete em todos modelos

### Semana 3: Domain Services
1. [ ] LeadConverter service (prospect → customer)
2. [ ] OpportunityStager service (movement)
3. [ ] CommissionCalculator service (regras)

### Semana 4: Use Cases & API
1. [ ] Criar primeiro use case (CreateLead)
2. [ ] Controller + Routes
3. [ ] E2E tests

---

## 📚 Referências de Padrões

- **Clean Architecture**: Uncle Bob patterns
- **DDD**: Domain-Driven Design (Evans)
- **CQRS**: Command Query Responsibility Segregation (opcional, futuro)
- **Event Sourcing**: Rastreamento de eventos (futuro)

---

**Status**: Ready for Implementation  
**Aprovação**: ⏳ Aguardando feedback

