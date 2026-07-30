# Backend Folder Structure - Enterprise Architecture

**Purpose**: Implementação concreta da arquitetura Clean + DDD  
**Status**: Ready to Deploy  
**Last Updated**: 2026-05-11

---

## 📁 Full Directory Tree

```
backend/
│
├── src/
│   │
│   ├── domains/                          # ← LÓGICA DE NEGÓCIO PURA
│   │   │                                 #   (SEM dependências externas)
│   │   │
│   │   ├── auth/
│   │   │   ├── entities/
│   │   │   │   ├── user.entity.ts                # User pure object
│   │   │   │   ├── role.entity.ts                # Role pure object
│   │   │   │   └── permission.entity.ts          # Permission pure object
│   │   │   ├── value-objects/
│   │   │   │   ├── password.vo.ts                # Hashed password logic
│   │   │   │   ├── email.vo.ts                   # Email validation
│   │   │   │   ├── permission-set.vo.ts          # Permission collection
│   │   │   │   └── access-scope.vo.ts            # GLOBAL|COMPANY|FRANQUIA|FRANQUEADO
│   │   │   ├── services/
│   │   │   │   ├── password-hasher.service.ts    # Pure hashing logic
│   │   │   │   ├── permission-checker.service.ts # Permission validation
│   │   │   │   └── access-scope-resolver.service.ts
│   │   │   └── errors/
│   │   │       ├── invalid-password.error.ts
│   │   │       ├── user-not-found.error.ts
│   │   │       └── insufficient-permissions.error.ts
│   │   │
│   │   ├── sales/                        # ← Sales domain (Lead→Customer→Opportunity)
│   │   │   ├── entities/
│   │   │   │   ├── lead.entity.ts        # Lead (prospect stage)
│   │   │   │   ├── customer.entity.ts    # Customer (qualified stage)
│   │   │   │   ├── opportunity.entity.ts # Opportunity (deal)
│   │   │   │   ├── activity.entity.ts    # Activity (interaction)
│   │   │   │   ├── pipeline.entity.ts    # Pipeline definition
│   │   │   │   └── stage.entity.ts       # Pipeline stage
│   │   │   │
│   │   │   ├── value-objects/
│   │   │   │   ├── lead-score.vo.ts      # Score (0-100)
│   │   │   │   ├── lead-status.vo.ts     # prospect|contact|qualified|converted
│   │   │   │   ├── customer-kyc-status.vo.ts
│   │   │   │   ├── opportunity-stage.vo.ts
│   │   │   │   ├── activity-type.vo.ts   # call|email|meeting|task
│   │   │   │   └── money.vo.ts           # Amount + currency
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── lead-converter.service.ts      # Lead → Customer conversion logic
│   │   │   │   ├── lead-scorer.service.ts         # Calculate lead score
│   │   │   │   ├── opportunity-stager.service.ts  # Manage stage transitions
│   │   │   │   ├── activity-recorder.service.ts   # Record interactions
│   │   │   │   └── customer-kyc.service.ts        # KYC validation
│   │   │   │
│   │   │   ├── rules/
│   │   │   │   ├── lead-qualification.rules.ts
│   │   │   │   │   # Rules: when can convert lead?
│   │   │   │   │   # - Must have email OR phone
│   │   │   │   │   # - Must have score >= 10
│   │   │   │   │   # - Cannot be marked as lost
│   │   │   │   │
│   │   │   │   ├── opportunity-validation.rules.ts
│   │   │   │   │   # Rules: valid opportunity transitions
│   │   │   │   │   # - Must have customer
│   │   │   │   │   # - Must have stage
│   │   │   │   │   # - Amount must be > 0
│   │   │   │   │
│   │   │   │   ├── stage-transition.rules.ts
│   │   │   │   │   # Rules: which stages can follow which?
│   │   │   │   │
│   │   │   │   └── activity-constraints.rules.ts
│   │   │   │       # Rules: activity can only be with customer/opportunity
│   │   │   │
│   │   │   ├── events/
│   │   │   │   ├── lead-created.event.ts
│   │   │   │   ├── lead-qualified.event.ts
│   │   │   │   ├── lead-converted.event.ts
│   │   │   │   ├── customer-created.event.ts
│   │   │   │   ├── opportunity-created.event.ts
│   │   │   │   ├── opportunity-advanced.event.ts
│   │   │   │   ├── opportunity-won.event.ts
│   │   │   │   └── activity-recorded.event.ts
│   │   │   │
│   │   │   └── errors/
│   │   │       ├── lead-not-found.error.ts
│   │   │       ├── customer-not-qualified.error.ts
│   │   │       ├── invalid-stage-transition.error.ts
│   │   │       └── activity-missing-context.error.ts
│   │   │
│   │   ├── financial/                   # ← Financial domain
│   │   │   ├── entities/
│   │   │   │   ├── bank-proposal.entity.ts
│   │   │   │   ├── commission.entity.ts
│   │   │   │   └── account.entity.ts        # FUTURE
│   │   │   │
│   │   │   ├── value-objects/
│   │   │   │   ├── proposal-status.vo.ts  # draft|sent|approved|rejected
│   │   │   │   ├── commission-type.vo.ts  # sale|referral|bonus
│   │   │   │   ├── commission-rate.vo.ts  # Percentage 0-100
│   │   │   │   └── money.vo.ts
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── commission-calculator.service.ts
│   │   │   │   │   # Lógica pura: dado amount + rate = commission
│   │   │   │   │
│   │   │   │   ├── proposal-validator.service.ts
│   │   │   │   │   # Validar proposta (juros, prazo, valor)
│   │   │   │   │
│   │   │   │   └── commission-rules-engine.service.ts
│   │   │   │       # Business rules de comissão
│   │   │   │
│   │   │   ├── rules/
│   │   │   │   ├── commission-calculation.rules.ts
│   │   │   │   │   # Rule: Comissão = (Valor * 2%) + Bônus
│   │   │   │   │
│   │   │   │   ├── proposal-kyc.rules.ts
│   │   │   │   │   # Rule: Proposta precisa de KYC aprovado
│   │   │   │   │
│   │   │   │   └── commission-payment.rules.ts
│   │   │   │       # Rule: Só paga após 30 dias
│   │   │   │
│   │   │   ├── events/
│   │   │   │   ├── proposal-created.event.ts
│   │   │   │   ├── proposal-approved.event.ts
│   │   │   │   ├── commission-calculated.event.ts
│   │   │   │   ├── commission-approved.event.ts
│   │   │   │   └── commission-paid.event.ts
│   │   │   │
│   │   │   └── errors/
│   │   │       ├── invalid-commission-rate.error.ts
│   │   │       ├── proposal-amount-too-low.error.ts
│   │   │       └── commission-already-paid.error.ts
│   │   │
│   │   ├── partnership/                 # ← Partnership domain (Partners, Orgs)
│   │   │   ├── entities/
│   │   │   │   ├── tenant.entity.ts      # Company (multi-tenant root)
│   │   │   │   ├── organization.entity.ts
│   │   │   │   ├── partner.entity.ts     # Partner (franquia/franqueado)
│   │   │   │   └── user.entity.ts        # User in organization
│   │   │   │
│   │   │   ├── value-objects/
│   │   │   │   ├── partner-type.vo.ts    # COMPANY|FRANQUIA|FRANQUEADO
│   │   │   │   ├── organization-type.vo.ts
│   │   │   │   ├── partner-hierarchy.vo.ts
│   │   │   │   └── organization-hierarchy.vo.ts
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── partner-tree.service.ts
│   │   │   │   │   # Build partner hierarchy tree
│   │   │   │   │
│   │   │   │   ├── partner-validator.service.ts
│   │   │   │   │   # Validate parent/child relationships
│   │   │   │   │
│   │   │   │   ├── org-hierarchy.service.ts
│   │   │   │   │   # Organization hierarchy logic
│   │   │   │   │
│   │   │   │   └── membership.service.ts
│   │   │   │       # User membership logic
│   │   │   │
│   │   │   ├── rules/
│   │   │   │   ├── partner-hierarchy.rules.ts
│   │   │   │   │   # Rule: COMPANY → FRANQUIA → FRANQUEADO
│   │   │   │   │
│   │   │   │   ├── organization-hierarchy.rules.ts
│   │   │   │   │   # Rule: Org levels
│   │   │   │   │
│   │   │   │   └── membership-rules.ts
│   │   │   │       # Rule: User must be in at least 1 org
│   │   │   │
│   │   │   ├── events/
│   │   │   │   ├── tenant-created.event.ts
│   │   │   │   ├── partner-created.event.ts
│   │   │   │   ├── partner-hierarchy-changed.event.ts
│   │   │   │   ├── user-invited.event.ts
│   │   │   │   ├── membership-accepted.event.ts
│   │   │   │   └── organization-created.event.ts
│   │   │   │
│   │   │   └── errors/
│   │   │       ├── invalid-partner-hierarchy.error.ts
│   │   │       ├── partner-not-found.error.ts
│   │   │       ├── circular-hierarchy.error.ts
│   │   │       └── organization-not-found.error.ts
│   │   │
│   │   └── governance/                  # ← Governance domain (Audit, Compliance)
│   │       ├── entities/
│   │       │   ├── audit-log.entity.ts
│   │       │   ├── role.entity.ts
│   │       │   └── permission.entity.ts
│   │       │
│   │       ├── value-objects/
│   │       │   ├── audit-action.vo.ts    # CREATE|READ|UPDATE|DELETE
│   │       │   ├── audit-level.vo.ts     # low|medium|high|critical
│   │       │   └── compliance-tags.vo.ts # GDPR|SOX|LGPD
│   │       │
│   │       ├── services/
│   │       │   ├── access-control.service.ts
│   │       │   ├── audit-recorder.service.ts
│   │       │   └── compliance-checker.service.ts
│   │       │
│   │       └── events/
│   │           ├── audit-logged.event.ts
│   │           ├── permission-granted.event.ts
│   │           ├── permission-revoked.event.ts
│   │           └── compliance-violation.event.ts
│   │
│   ├── application/                     # ← ORQUESTRAÇÃO (Use Cases)
│   │   │                                #   (Coordena domínios, não contém lógica)
│   │   │
│   │   ├── auth/
│   │   │   ├── register.use-case.ts
│   │   │   │   # Use case: Register user
│   │   │   │   # 1. Validate email unique
│   │   │   │   # 2. Create User entity
│   │   │   │   # 3. Save to database
│   │   │   │   # 4. Emit UserCreated event
│   │   │   │
│   │   │   ├── login.use-case.ts
│   │   │   ├── refresh-token.use-case.ts
│   │   │   ├── change-password.use-case.ts
│   │   │   └── logout.use-case.ts
│   │   │
│   │   ├── sales/
│   │   │   ├── create-lead.use-case.ts
│   │   │   │   # 1. Validate input
│   │   │   │   # 2. Create Lead entity (via domain service)
│   │   │   │   # 3. Save via repository
│   │   │   │   # 4. Publish LeadCreated event
│   │   │   │
│   │   │   ├── update-lead.use-case.ts
│   │   │   ├── qualify-lead.use-case.ts   # Update score/status
│   │   │   ├── convert-lead-to-customer.use-case.ts
│   │   │   │   # 1. Validate lead can be converted (rules)
│   │   │   │   # 2. Create Customer entity
│   │   │   │   # 3. Link to Lead (leadId)
│   │   │   │   # 4. Update Lead.convertedAt
│   │   │   │   # 5. Publish LeadConverted event
│   │   │   │
│   │   │   ├── create-customer.use-case.ts
│   │   │   ├── update-customer.use-case.ts
│   │   │   ├── create-opportunity.use-case.ts
│   │   │   │   # 1. Validate customer exists
│   │   │   │   # 2. Create Opportunity entity
│   │   │   │   # 3. Link to customer/stage
│   │   │   │   # 4. Save via repository
│   │   │   │   # 5. Publish OpportunityCreated event
│   │   │   │
│   │   │   ├── advance-opportunity.use-case.ts
│   │   │   ├── win-opportunity.use-case.ts
│   │   │   ├── lose-opportunity.use-case.ts
│   │   │   ├── record-activity.use-case.ts
│   │   │   └── list-pipeline.use-case.ts
│   │   │
│   │   ├── financial/
│   │   │   ├── create-proposal.use-case.ts
│   │   │   ├── approve-proposal.use-case.ts
│   │   │   ├── calculate-commission.use-case.ts
│   │   │   ├── approve-commission.use-case.ts
│   │   │   └── pay-commission.use-case.ts
│   │   │
│   │   └── partnership/
│   │       ├── create-partner.use-case.ts
│   │       ├── create-organization.use-case.ts
│   │       ├── add-user-to-org.use-case.ts
│   │       └── create-tenant.use-case.ts
│   │
│   ├── infrastructure/                  # ← DETALHES TÉCNICOS
│   │   │                                #   (DB, Cache, APIs, Queue)
│   │   │
│   │   ├── persistence/
│   │   │   ├── repositories/           # Data access layer
│   │   │   │   ├── lead.repository.ts
│   │   │   │   │   # Implements: ILeadRepository
│   │   │   │   │   # Methods: save, findById, findByTenantId, update, delete
│   │   │   │   │
│   │   │   │   ├── customer.repository.ts
│   │   │   │   ├── opportunity.repository.ts
│   │   │   │   ├── proposal.repository.ts
│   │   │   │   ├── commission.repository.ts
│   │   │   │   ├── activity.repository.ts
│   │   │   │   ├── partner.repository.ts
│   │   │   │   ├── user.repository.ts
│   │   │   │   └── audit-log.repository.ts
│   │   │   │
│   │   │   ├── prisma/
│   │   │   │   ├── prisma.client.ts           # Prisma instance
│   │   │   │   ├── extensions/
│   │   │   │   │   ├── tenant-isolation.ext.ts  # ← Middleware de tenant
│   │   │   │   │   ├── soft-delete.ext.ts
│   │   │   │   │   └── audit-logging.ext.ts
│   │   │   │   ├── migrations/
│   │   │   │   │   ├── 001_initial_schema.sql
│   │   │   │   │   ├── 002_add_soft_delete.sql
│   │   │   │   │   └── 003_add_lead_customer_link.sql
│   │   │   │   └── seeds/
│   │   │   │       ├── seed.ts
│   │   │   │       ├── permissions.seed.ts
│   │   │   │       ├── roles.seed.ts
│   │   │   │       └── sample-data.seed.ts
│   │   │   │
│   │   │   └── interfaces/
│   │   │       ├── lead.repository.interface.ts
│   │   │       ├── customer.repository.interface.ts
│   │   │       └── [outros repositórios]
│   │   │
│   │   ├── cache/
│   │   │   ├── redis.client.ts
│   │   │   ├── catalog.cache.ts         # Cache de catálogos
│   │   │   ├── roles-permissions.cache.ts
│   │   │   ├── pipeline.cache.ts
│   │   │   └── cache-invalidation.ts    # Estratégia de invalidação
│   │   │
│   │   ├── queue/
│   │   │   ├── bull.client.ts           # Bull queue instance
│   │   │   ├── jobs/
│   │   │   │   ├── send-notification.job.ts
│   │   │   │   ├── calculate-commissions.job.ts
│   │   │   │   ├── sync-banking-data.job.ts
│   │   │   │   └── generate-reports.job.ts
│   │   │   ├── handlers/
│   │   │   │   ├── notification.handler.ts
│   │   │   │   ├── commission.handler.ts
│   │   │   │   └── banking.handler.ts
│   │   │   └── event-bus.ts            # Publisher/subscriber
│   │   │
│   │   ├── external/
│   │   │   ├── banking/
│   │   │   │   ├── bank-api.adapter.ts  # Adapter para API de banco
│   │   │   │   ├── bank-proposal.mapper.ts
│   │   │   │   └── interfaces/
│   │   │   │       └── banking-service.interface.ts
│   │   │   │
│   │   │   ├── messaging/
│   │   │   │   ├── email.adapter.ts
│   │   │   │   ├── sms.adapter.ts
│   │   │   │   ├── whatsapp.adapter.ts
│   │   │   │   └── interfaces/
│   │   │   │       └── messaging-service.interface.ts
│   │   │   │
│   │   │   └── integrations/
│   │   │       ├── zapier.adapter.ts
│   │   │       ├── make.adapter.ts
│   │   │       └── interfaces/
│   │   │           └── webhook-service.interface.ts
│   │   │
│   │   └── logger/
│   │       ├── structured-logger.ts     # Winston/Pino com contexto
│   │       ├── request-correlation.ts   # Request ID tracking
│   │       └── audit-logger.ts          # Logging específico para audit
│   │
│   ├── presentation/                    # ← HTTP LAYER (Controllers, Routes, DTOs)
│   │   │
│   │   ├── http/
│   │   │   ├── controllers/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   │   # Exports: AuthController class
│   │   │   │   │   # Methods: register(), login(), refreshToken()
│   │   │   │   │   # Não contém lógica de negócio
│   │   │   │   │
│   │   │   │   ├── leads.controller.ts
│   │   │   │   ├── customers.controller.ts
│   │   │   │   ├── opportunities.controller.ts
│   │   │   │   ├── proposals.controller.ts
│   │   │   │   ├── commissions.controller.ts
│   │   │   │   ├── activities.controller.ts
│   │   │   │   ├── partners.controller.ts
│   │   │   │   ├── organizations.controller.ts
│   │   │   │   └── users.controller.ts
│   │   │   │
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   │   # POST /register
│   │   │   │   │   # POST /login
│   │   │   │   │   # POST /refresh-token
│   │   │   │   │
│   │   │   │   ├── sales.routes.ts
│   │   │   │   │   # GET /leads
│   │   │   │   │   # POST /leads
│   │   │   │   │   # PATCH /leads/:id
│   │   │   │   │   # POST /leads/:id/convert-to-customer
│   │   │   │   │   # GET /opportunities
│   │   │   │   │   # POST /opportunities
│   │   │   │   │   # PATCH /opportunities/:id/advance
│   │   │   │   │   # GET /activities
│   │   │   │   │   # POST /activities
│   │   │   │   │
│   │   │   ├── financial.routes.ts
│   │   │   │   # GET /proposals
│   │   │   │   # POST /proposals
│   │   │   │   # PATCH /proposals/:id/approve
│   │   │   │   # GET /commissions
│   │   │   │   # POST /commissions/calculate
│   │   │   │
│   │   │   ├── middleware/
│   │   │   │   ├── authentication.middleware.ts
│   │   │   │   │   # Valida JWT
│   │   │   │   │   # Injetar em req.user
│   │   │   │   │
│   │   │   │   ├── authorization.middleware.ts
│   │   │   │   │   # @authorize('LEADS_CREATE')
│   │   │   │   │   # Valida permissão no backend ← CRÍTICO
│   │   │   │   │
│   │   │   │   ├── tenant-guard.middleware.ts
│   │   │   │   │   # Garante req.tenantId do JWT
│   │   │   │   │
│   │   │   │   ├── tenant-isolation.middleware.ts
│   │   │   │   │   # Injeta Prisma com tenant filtering
│   │   │   │   │
│   │   │   │   ├── error-handler.middleware.ts
│   │   │   │   │   # Captura todos os erros
│   │   │   │   │   # Formata respostas de erro
│   │   │   │   │
│   │   │   │   ├── request-logger.middleware.ts
│   │   │   │   │   # Loga entrada/saída de requisições
│   │   │   │   │
│   │   │   │   └── request-validation.middleware.ts
│   │   │   │       # Valida requests com schemas
│   │   │   │
│   │   │   ├── dto/
│   │   │   │   ├── requests/
│   │   │   │   │   ├── create-lead.request.ts
│   │   │   │   │   │   # Campos: firstName, lastName, email, phone, score
│   │   │   │   │   │
│   │   │   │   │   ├── create-opportunity.request.ts
│   │   │   │   │   ├── advance-opportunity.request.ts
│   │   │   │   │   ├── create-proposal.request.ts
│   │   │   │   │   ├── create-commission.request.ts
│   │   │   │   │   └── create-activity.request.ts
│   │   │   │   │
│   │   │   │   └── responses/
│   │   │   │       ├── lead.response.ts
│   │   │   │       │   # Campos: id, firstName, lastName, email, score, status
│   │   │   │       │
│   │   │   │       ├── opportunity.response.ts
│   │   │   │       ├── proposal.response.ts
│   │   │   │       ├── commission.response.ts
│   │   │   │       ├── activity.response.ts
│   │   │   │       ├── paginated.response.ts
│   │   │   │       └── error.response.ts
│   │   │   │
│   │   │   └── mappers/
│   │   │       ├── lead.mapper.ts        # Lead entity → LeadResponse DTO
│   │   │       ├── opportunity.mapper.ts
│   │   │       ├── proposal.mapper.ts
│   │   │       ├── commission.mapper.ts
│   │   │       └── activity.mapper.ts
│   │   │
│   │   └── validation/
│   │       ├── joi-schemas/
│   │       │   ├── lead.schema.ts
│   │       │   │   # object({
│   │       │   │   #   firstName: string().required(),
│   │       │   │   #   lastName: string().required(),
│   │       │   │   #   email: string().email(),
│   │       │   │   #   phone: string()
│   │       │   │   # })
│   │       │   │
│   │       │   ├── opportunity.schema.ts
│   │       │   ├── proposal.schema.ts
│   │       │   ├── commission.schema.ts
│   │       │   ├── activity.schema.ts
│   │       │   └── pagination.schema.ts
│   │       │
│   │       └── custom-validators/
│   │           ├── cpf.validator.ts     # Validar CPF (11 dígitos)
│   │           ├── cnpj.validator.ts    # Validar CNPJ (14 dígitos)
│   │           ├── business-rules.validator.ts
│   │           └── referential.validator.ts  # Validar referências (FK exists)
│   │
│   ├── shared/                          # ← UTILITÁRIOS GLOBAIS
│   │   │
│   │   ├── errors/
│   │   │   ├── app-error.ts             # Base error class
│   │   │   ├── domain-error.ts
│   │   │   ├── validation-error.ts
│   │   │   ├── authentication-error.ts
│   │   │   ├── authorization-error.ts
│   │   │   ├── not-found-error.ts
│   │   │   ├── conflict-error.ts
│   │   │   └── internal-error.ts
│   │   │
│   │   ├── types/
│   │   │   ├── index.ts                 # Central exports
│   │   │   ├── pagination.types.ts
│   │   │   │   # PaginationParams, PaginatedResponse, etc
│   │   │   │
│   │   │   ├── api-response.types.ts
│   │   │   │   # ApiResponse<T>, ApiError
│   │   │   │
│   │   │   ├── tenant-context.types.ts
│   │   │   │   # TenantContext (tenantId, userId, roleId)
│   │   │   │
│   │   │   └── express-extension.types.ts
│   │   │       # Extend Express Request/Response types
│   │   │
│   │   ├── utils/
│   │   │   ├── date-utils.ts
│   │   │   │   # formatDate(), parseDate(), addDays()
│   │   │   │
│   │   │   ├── number-utils.ts
│   │   │   │   # roundMoney(), formatCurrency()
│   │   │   │
│   │   │   ├── string-utils.ts
│   │   │   │   # slugify(), normalize(), capitalize()
│   │   │   │
│   │   │   ├── crypto-utils.ts
│   │   │   │   # generateRandomId(), hashData()
│   │   │   │
│   │   │   ├── array-utils.ts
│   │   │   │   # chunk(), flatten(), unique()
│   │   │   │
│   │   │   └── object-utils.ts
│   │   │       # pick(), omit(), merge()
│   │   │
│   │   ├── constants/
│   │   │   ├── error-codes.ts
│   │   │   │   # LEAD_NOT_FOUND = 'LEAD_001'
│   │   │   │   # CUSTOMER_EXISTS = 'CUSTOMER_001'
│   │   │   │
│   │   │   ├── status-codes.ts
│   │   │   │   # HTTP_OK = 200, HTTP_CREATED = 201, etc
│   │   │   │
│   │   │   ├── business-constants.ts
│   │   │   │   # LEAD_SCORE_MIN = 0, LEAD_SCORE_MAX = 100
│   │   │   │   # COMMISSION_PERCENTAGE = 0.02
│   │   │   │
│   │   │   ├── regex.ts
│   │   │   │   # EMAIL_REGEX, PHONE_REGEX, CPF_REGEX
│   │   │   │
│   │   │   └── messages.ts
│   │   │       # Success/error messages
│   │   │
│   │   └── decorators/
│   │       ├── validate.decorator.ts    # @Validate(schema)
│   │       ├── authorize.decorator.ts   # @Authorize('ROLE')
│   │       ├── logged.decorator.ts      # @Logged()
│   │       └── cache.decorator.ts       # @Cacheable()
│   │
│   ├── config/
│   │   ├── app.config.ts               # App configuration
│   │   │   # port, host, nodeEnv, corsOrigin
│   │   │
│   │   ├── database.config.ts          # Database configuration
│   │   ├── cache.config.ts             # Redis configuration
│   │   ├── queue.config.ts             # Bull configuration
│   │   ├── jwt.config.ts               # JWT secrets & expiry
│   │   ├── logger.config.ts            # Logger configuration
│   │   ├── external-apis.config.ts     # Third-party APIs
│   │   └── index.ts                    # Central config export
│   │
│   └── main.ts                         # ← Entry point
│       # Inicializa app, database, cache, queue
│       # Registra middlewares
│       # Inicia servidor
│
├── tests/
│   ├── unit/
│   │   ├── domains/
│   │   │   ├── sales/
│   │   │   │   ├── lead-converter.service.spec.ts
│   │   │   │   ├── opportunity-stager.service.spec.ts
│   │   │   │   └── lead-qualifier.service.spec.ts
│   │   │   │
│   │   │   ├── financial/
│   │   │   │   ├── commission-calculator.service.spec.ts
│   │   │   │   └── proposal-validator.service.spec.ts
│   │   │   │
│   │   │   └── auth/
│   │   │       ├── password-hasher.service.spec.ts
│   │   │       └── permission-checker.service.spec.ts
│   │   │
│   │   ├── application/
│   │   │   ├── sales/
│   │   │   │   ├── create-lead.use-case.spec.ts
│   │   │   │   ├── convert-lead-to-customer.use-case.spec.ts
│   │   │   │   └── advance-opportunity.use-case.spec.ts
│   │   │   │
│   │   │   └── financial/
│   │   │       └── calculate-commission.use-case.spec.ts
│   │   │
│   │   └── infrastructure/
│   │       ├── persistence/
│   │       │   ├── lead.repository.spec.ts
│   │       │   ├── customer.repository.spec.ts
│   │       │   └── opportunity.repository.spec.ts
│   │       │
│   │       ├── cache/
│   │       │   └── roles-permissions.cache.spec.ts
│   │       │
│   │       └── queue/
│   │           └── commission-job.handler.spec.ts
│   │
│   ├── integration/
│   │   ├── auth.integration.spec.ts
│   │   │   # Test: POST /api/v1/auth/register → success
│   │   │   # Test: POST /api/v1/auth/login → JWT returned
│   │   │   # Test: POST /api/v1/auth/login → invalid password → 401
│   │   │
│   │   ├── sales.integration.spec.ts
│   │   │   # Test: POST /api/v1/leads → created
│   │   │   # Test: POST /api/v1/leads/:id/convert → customer created
│   │   │   # Test: POST /api/v1/opportunities → created
│   │   │   # Test: PATCH /api/v1/opportunities/:id/advance → stage updated
│   │   │
│   │   ├── financial.integration.spec.ts
│   │   │   # Test: POST /api/v1/proposals → created
│   │   │   # Test: PATCH /api/v1/proposals/:id/approve → commission triggered
│   │   │
│   │   └── security.integration.spec.ts
│   │       # Test: Tenant isolation (2 tenants, verify no data leak)
│   │       # Test: Authorization (without permission → 403)
│   │       # Test: Audit logging (every action is logged)
│   │
│   └── e2e/
│       ├── lead-to-commission.e2e.spec.ts
│       │   # Fluxo completo:
│       │   # 1. Create Lead
│       │   # 2. Qualify Lead (score > 10)
│       │   # 3. Convert to Customer (approve KYC)
│       │   # 4. Create Opportunity
│       │   # 5. Advance through stages
│       │   # 6. Win Opportunity
│       │   # 7. Create Proposal
│       │   # 8. Approve Proposal
│       │   # 9. Commission calculated & approved
│       │   # 10. Commission paid
│       │
│       ├── multi-tenant-isolation.e2e.spec.ts
│       │   # Simular 2 tenants, verificar isolamento
│       │
│       └── authorization-enforcement.e2e.spec.ts
│           # Testes de segurança
│           # - User sem permissão → 403
│           # - Data leak attempt → blocked
│           # - Audit trail → verified
│
├── prisma/
│   ├── schema.prisma               # ← Database schema (atualizado)
│   ├── migrations/
│   ├── seed.ts                     # ← Seed data
│   └── [migrations]
│
├── scripts/
│   ├── dev.sh                      # npm run dev
│   ├── build.sh                    # npm run build
│   ├── start.sh                    # npm run start
│   ├── test.sh                     # npm run test
│   ├── migrate.sh                  # Prisma migrations
│   └── seed.sh                     # Seed database
│
├── docs/
│   ├── ARCHITECTURE.md             # Arquitetura geral
│   ├── API.md                      # API documentation
│   ├── DOMAIN_EVENTS.md            # Domain events
│   ├── ERROR_HANDLING.md           # Error handling
│   └── DEPLOYMENT.md               # Deployment guide
│
├── .env.example                    # Environment variables template
├── .env.development                # Development environment
├── .env.test                       # Test environment
├── .env.production                 # Production environment (NOT in repo!)
│
├── docker-compose.yml              # Local development (DB, Redis, etc)
├── Dockerfile                      # Docker image
├── docker-compose.prod.yml         # Production deployment
│
├── tsconfig.json                   # TypeScript configuration
├── jest.config.js                  # Jest testing configuration
├── eslint.config.js                # ESLint configuration
├── prettier.config.js              # Code formatting
│
├── package.json                    # Dependencies
├── pnpm-lock.yaml                  # Lock file
│
└── README.md                       # Project documentation
```

---

## 🎯 Key Principles Applied

### 1. **Layered Architecture**
- **Domains**: Pure business logic (no external dependencies)
- **Application**: Use cases (coordination)
- **Infrastructure**: Technical details (DB, Cache, APIs)
- **Presentation**: HTTP layer (Controllers, DTOs, Validation)

### 2. **Dependency Flow**
```
Presentation ← Application ← Infrastructure
    ↓             ↓              ↑
  HTTP         Use Cases    Repositories
              (Orchestration)  Interfaces
                   ↓
                Domains
            (Pure Logic)
```

### 3. **File Naming Conventions**

| Type | Pattern | Example |
|------|---------|---------|
| Entity | `*.entity.ts` | `lead.entity.ts` |
| DTO | `*.dto.ts` | `create-lead.dto.ts` |
| Service | `*.service.ts` | `lead-converter.service.ts` |
| Repository | `*.repository.ts` | `lead.repository.ts` |
| Use Case | `*.use-case.ts` | `create-lead.use-case.ts` |
| Test | `*.spec.ts` | `lead.service.spec.ts` |
| Interface | `*.interface.ts` | `lead.repository.interface.ts` |
| Value Object | `*.vo.ts` | `lead-score.vo.ts` |
| Event | `*.event.ts` | `lead-created.event.ts` |
| Rule | `*.rules.ts` | `lead-qualification.rules.ts` |

### 4. **Inversion of Control**

```typescript
// ❌ Bad
class LeadService {
  private db = new PrismaClient(); // Hard dependency
}

// ✅ Good
class LeadService {
  constructor(private repository: ILeadRepository) {} // Dependency injection
}

// Dependency Injection in main.ts
const leadRepository = new LeadRepository(prisma);
const leadService = new LeadService(leadRepository);
```

### 5. **Error Handling**

```
HTTP Error Response ← ErrorHandler Middleware ← Application Error ← Domain Error
    (JSON)               (Catch-all)              (Checked)         (Unchecked)
```

---

## 📝 Next Steps

1. **Week 1**: Create folder structure based on this template
2. **Week 2**: Implement Prisma extensions (tenant isolation, soft-delete)
3. **Week 3**: Implement authorization middleware
4. **Week 4**: Start migrating domain logic to new structure
5. **Week 5+**: Migrate remaining modules

---

**Document Version**: 1.0  
**Last Updated**: 2026-05-11  
**Status**: Ready for Implementation ✅

