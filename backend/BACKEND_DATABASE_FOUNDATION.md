# FINQZ PRO - Backend Database Foundation Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Models](#data-models)
4. [Multi-Tenant Design](#multi-tenant-design)
5. [RBAC (Role-Based Access Control)](#rbac-role-based-access-control)
6. [Soft Delete Strategy](#soft-delete-strategy)
7. [Database Setup](#database-setup)
8. [Default Seed Data](#default-seed-data)
9. [Environment Configuration](#environment-configuration)
10. [Common Operations](#common-operations)
11. [Troubleshooting](#troubleshooting)

---

## Overview

**FINQZ PRO Backend** is an enterprise-grade SaaS platform for fintech/banking operations. The database foundation is built with:

- **ORM**: Prisma 5.22.0 (type-safe database access)
- **Database**: PostgreSQL 13+ (UUID support, advanced features)
- **Architecture**: Multi-tenant SaaS with complete RBAC and soft delete capability
- **Models**: 13 core domain models for complete fintech operations

### Key Features
- ✅ Multi-tenant isolation with scoped data access
- ✅ 26 granular permissions with resource:action pattern
- ✅ 3 predefined roles (Admin, Sales Representative, Viewer)
- ✅ Soft delete capability for compliance and audit trails
- ✅ UUID primary keys across all entities
- ✅ Comprehensive audit logging for compliance
- ✅ Built-in activity tracking for customer interactions

---

## Architecture

### Technology Stack
```
Express.js 4.21.1
  ↓
Prisma 5.22.0 (ORM with Middleware)
  ↓
PostgreSQL 13+
  ↓
Redis 6+ (optional caching)
```

### Middleware Stack
```
express.json()
  ↓
helmet (security headers)
  ↓
cors (cross-origin requests)
  ↓
rate-limiting
  ↓
authentication (JWT)
  ↓
authorization (RBAC)
  ↓
tenant-isolation
```

### Build & Deployment
- **Language**: TypeScript 5.7.2
- **Build**: tsc (TypeScript compiler)
- **Runtime**: Node.js 18+
- **Package Manager**: npm/pnpm

---

## Data Models

The backend includes **13 core models** designed specifically for fintech/banking operations:

### 1. **Tenant** (Multi-Tenant Root)
The organization/company using the platform.

```typescript
{
  id: UUID                    // Primary key
  name: string               // e.g., "FINQZ PRO - Development"
  domain: string @unique     // e.g., "finqz-pro"
  plan: enum                 // basic | standard | premium | enterprise
  settings: JSON             // {timezone, currency, language, etc}
  isActive: boolean
  deletedAt?: DateTime       // Soft delete
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Key**: Each tenant has data isolation - users, leads, customers belong to one tenant only.

### 2. **User** (Team Members)
Users within a tenant organization.

```typescript
{
  id: UUID
  email: string @unique(per tenant)    // Normalized for uniqueness per tenant
  password: string (bcrypt hashed)
  firstName: string
  lastName: string
  department?: string
  jobTitle?: string
  isActive: boolean
  isEmailVerified: boolean
  lastLoginAt?: DateTime
  deletedAt?: DateTime                 // Soft delete
  tenantId: UUID (foreign key)
  roleId: UUID (foreign key)
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  role: Role
  ownedLeads: Lead[]
  ownedOpportunities: Opportunity[]
  ownedActivities: Activity[]
  createdProposals: BankProposal[]
  commissions: Commission[]
  auditLogs: AuditLog[]
}
```

### 3. **Role** (RBAC Roles)
Roles assigned to users within a tenant.

```typescript
{
  id: UUID
  name: string               // "Admin", "Sales Representative", "Viewer"
  slug: string @unique(per tenant)
  description?: string
  isSystem: boolean          // true for built-in roles
  deletedAt?: DateTime       // Soft delete
  tenantId: UUID (foreign key)
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  permissions: Permission[]  // Many-to-many
  users: User[]
}
```

### 4. **Permission** (Granular Permissions)
Global permissions following `resource:action` pattern.

```typescript
{
  id: UUID
  name: string @unique       // e.g., "users:read"
  slug: string @unique       // e.g., "users_read"
  description?: string
  resource: string           // e.g., "users"
  action: string             // e.g., "read"
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  roles: Role[]              // Many-to-many
}
```

**26 Default Permissions**:
```
Users: users:read, users:create, users:update, users:delete
Leads: leads:read, leads:create, leads:update, leads:delete
Customers: customers:read, customers:create, customers:update, customers:delete
Opportunities: opportunities:read, opportunities:create, opportunities:update, opportunities:delete
Proposals: proposals:read, proposals:create, proposals:update, proposals:delete
Commissions: commissions:read, commissions:create, commissions:update, commissions:delete
Reports: reports:read, reports:export
```

### 5. **Lead** (Sales Prospect)
Potential customer/prospect in the sales pipeline.

```typescript
{
  id: UUID
  firstName: string
  lastName: string
  email: string @unique(per tenant)
  emailNormalized: string    // Lowercase for search
  phone?: string
  cpf: string @unique(per tenant)        // Brazilian tax ID
  birthDate?: DateTime
  address: JSON              // {street, city, state, zip, country}
  income?: Float             // Annual income
  score: Int                 // 0-100 lead scoring
  status: enum               // prospect|contact|qualified|negotiation|converted|lost
  source?: string            // How lead was acquired
  notes?: string
  tags: string[]             // JSON array for classification
  deletedAt?: DateTime       // Soft delete
  tenantId: UUID
  createdById: UUID          // User who created
  ownerId?: UUID             // Assigned sales rep
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  opportunities: Opportunity[]
  activities: Activity[]
  bankProposals: BankProposal[]
  creator: User
  owner: User
}
```

### 6. **Customer** (Converted/Active Client)
Customers who have been converted or are actively using services.

```typescript
{
  id: UUID
  customerCode: string @unique          // Internal reference
  firstName: string
  lastName: string
  email: string
  phone?: string
  cpf: string @unique                   // Brazilian tax ID
  document?: string                     // Other document type
  birthDate?: DateTime
  monthlyIncome?: Float
  annualIncome?: Float
  kycStatus: enum            // pending|approved|rejected|review
  kycVerifiedAt?: DateTime   // When KYC was approved
  riskLevel: enum            // low|medium|high
  isActive: boolean
  deletedAt?: DateTime       // Soft delete
  tenantId: UUID
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  opportunities: Opportunity[]
  activities: Activity[]
  bankProposals: BankProposal[]
  commissions: Commission[]
}
```

### 7. **Opportunity** (Sales Deal)
Sales opportunity tied to a lead or customer.

```typescript
{
  id: UUID
  title: string
  description?: string
  amount: Float              // Deal amount
  currency: string           // default: "BRL"
  probability: Int           // 0-100 (chance of closing)
  status: enum               // open|won|lost|suspended
  expectedCloseDate?: DateTime
  actualCloseDate?: DateTime
  deletedAt?: DateTime       // Soft delete
  tenantId: UUID
  leadId?: UUID
  customerId?: UUID
  stageId: UUID              // Current pipeline stage
  ownerId?: UUID             // Sales rep owner
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  lead?: Lead
  customer?: Customer
  stage: Stage
  owner?: User
  activities: Activity[]
  bankProposals: BankProposal[]
}
```

### 8. **Pipeline** (Sales Pipeline)
Sales process definition with stages.

```typescript
{
  id: UUID
  name: string
  description?: string
  isDefault: boolean         // Default pipeline for new opportunities
  isActive: boolean
  deletedAt?: DateTime       // Soft delete
  tenantId: UUID
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  stages: Stage[]
}
```

### 9. **Stage** (Pipeline Stage)
Individual stages in a pipeline (e.g., Lead → Contact → Qualified → Won).

```typescript
{
  id: UUID
  name: string
  order: Int                 // Display order in pipeline
  isWon: boolean             // Terminal won stage?
  isLost: boolean            // Terminal lost stage?
  deletedAt?: DateTime       // Soft delete
  pipelineId: UUID
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  pipeline: Pipeline
  opportunities: Opportunity[]
}
```

**Default Pipeline**: "Sales Pipeline" with 7 stages:
1. Lead (order: 0)
2. Contact (order: 1)
3. Qualified (order: 2)
4. Proposal (order: 3)
5. Negotiation (order: 4)
6. Won (order: 5, isWon: true)
7. Lost (order: 6, isLost: true)

### 10. **Activity** (Interaction Log)
Record of all customer interactions (calls, emails, meetings, tasks).

```typescript
{
  id: UUID
  type: enum                 // call|email|meeting|task|note|custom
  title: string
  description?: string
  status: enum               // completed|pending|cancelled
  scheduledFor?: DateTime
  completedAt?: DateTime
  duration?: Int             // Minutes
  notes?: string
  attachments?: JSON         // File metadata
  deletedAt?: DateTime       // Soft delete
  tenantId: UUID
  userId: UUID               // Who performed activity
  leadId?: UUID
  opportunityId?: UUID
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  user: User
  lead?: Lead
  opportunity?: Opportunity
}
```

### 11. **BankProposal** (Financing Proposal)
Bank proposal/loan offer for a lead or customer.

```typescript
{
  id: UUID
  proposalNumber: string @unique
  productType: string        // e.g., "credit_line", "business_loan"
  title: string
  status: enum               // draft|sent|accepted|rejected|expired|cancelled
  amount: Float
  interestRate: Float        // e.g., 15.50
  term: Int                  // Months
  monthlyPayment: Float
  totalCost: Float
  
  // KYC Integration
  kycStatus: enum            // pending|approved|rejected
  kycVerifiedAt?: DateTime
  kycExpireAt?: DateTime
  
  // Documents
  documentsProvided: JSON    // {identity: yes, address: yes, income: yes}
  fees: JSON                 // {origination: 500, insurance: 100}
  
  deletedAt?: DateTime       // Soft delete
  tenantId: UUID
  leadId?: UUID
  customerId?: UUID
  opportunityId?: UUID
  createdById: UUID
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  lead?: Lead
  customer?: Customer
  opportunity?: Opportunity
  creator: User
}
```

### 12. **Commission** (Sales Commission Tracking)
Commission records for sales and referrals.

```typescript
{
  id: UUID
  commissionNumber: string @unique
  type: enum                 // sale|referral|bonus|adjustment
  amount: Float              // Fixed commission amount
  percentage: Float          // Percentage (e.g., 5.0)
  status: enum               // pending|approved|paid|cancelled
  referenceDate: DateTime    // Transaction date
  approvedAt?: DateTime
  paidAt?: DateTime
  dueDate: DateTime
  deletedAt?: DateTime       // Soft delete
  tenantId: UUID
  customerId?: UUID
  userId: UUID               // Commission recipient
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  customer?: Customer
  user: User
}
```

### 13. **AuditLog** (Compliance Audit Trail)
Complete audit trail of all significant actions.

```typescript
{
  id: UUID
  action: enum               // CREATE|READ|UPDATE|DELETE
  entity: string             // Model name: "User", "Lead", "BankProposal"
  entityId: UUID             // ID of affected entity
  changes: JSON              // {before: {}, after: {}}
  description?: string
  ipAddress?: string
  userAgent?: string
  metadata?: JSON            // Additional context
  tenantId: UUID
  userId?: UUID              // Who performed action
  createdAt: DateTime        // No updatedAt - immutable
  
  // Relations
  user?: User
}
```

---

## Multi-Tenant Design

### Tenant Isolation Strategy

Every entity is scoped to a `tenantId` foreign key:

```
Tenant (root)
├── User (tenantId)
├── Role (tenantId)
├── Lead (tenantId)
├── Customer (tenantId)
├── Opportunity (tenantId)
├── Pipeline (tenantId)
├── Stage (pipelineId → tenantId)
├── Activity (tenantId)
├── BankProposal (tenantId)
├── Commission (tenantId)
└── AuditLog (tenantId)
```

### Data Isolation
- **Query Level**: All queries automatically filtered by `tenantId`
- **Unique Constraints**: Email, CPF, and other unique fields include `tenantId`:
  - `User`: unique (tenantId, emailNormalized)
  - `Lead`: unique (tenantId, cpf)
  - `Role`: unique (tenantId, slug)
  - `BankProposal`: unique proposalNumber (global, but scoped via tenantId)

### Access Control
```typescript
// Middleware ensures user can only access their tenant
async function ensureTenantAccess(req, res, next) {
  const userTenantId = req.user.tenantId;
  const requestTenantId = req.params.tenantId || req.body.tenantId;
  
  if (userTenantId !== requestTenantId) {
    return res.status(403).json({error: 'Access denied'});
  }
  next();
}
```

---

## RBAC (Role-Based Access Control)

### Permission Structure

**26 Default Permissions** use `resource:action` pattern:

```javascript
const PERMISSIONS = {
  // Users Management
  'users:read': 'View users',
  'users:create': 'Create new users',
  'users:update': 'Update user information',
  'users:delete': 'Delete users',
  
  // Leads Management
  'leads:read': 'View leads',
  'leads:create': 'Create new leads',
  'leads:update': 'Update lead information',
  'leads:delete': 'Delete leads',
  
  // Customers Management
  'customers:read': 'View customers',
  'customers:create': 'Create new customers',
  'customers:update': 'Update customer information',
  'customers:delete': 'Delete customers',
  
  // Opportunities Management
  'opportunities:read': 'View opportunities',
  'opportunities:create': 'Create new opportunities',
  'opportunities:update': 'Update opportunity information',
  'opportunities:delete': 'Delete opportunities',
  
  // Proposals Management
  'proposals:read': 'View proposals',
  'proposals:create': 'Create new proposals',
  'proposals:update': 'Update proposal information',
  'proposals:delete': 'Delete proposals',
  
  // Commissions Management
  'commissions:read': 'View commissions',
  'commissions:create': 'Create new commissions',
  'commissions:update': 'Update commission information',
  'commissions:delete': 'Delete commissions',
  
  // Reports
  'reports:read': 'View reports',
  'reports:export': 'Export reports'
};
```

### Default Roles

#### 1. **Admin**
- **Permissions**: All 26 permissions
- **Description**: Full system access
- **Use Case**: Platform administrators, super users

#### 2. **Sales Representative**
- **Permissions**:
  - leads:read, leads:create, leads:update
  - customers:read
  - opportunities:read, opportunities:create, opportunities:update
  - proposals:read, proposals:create, proposals:update
  - commissions:read
  - reports:read, reports:export
- **Description**: Sales team member with limited access
- **Use Case**: Sales reps managing opportunities and proposals

#### 3. **Viewer**
- **Permissions**: 
  - leads:read
  - customers:read
  - opportunities:read
  - proposals:read
  - commissions:read
  - reports:read
- **Description**: Read-only access
- **Use Case**: Managers, analysts, reporting

### RBAC Middleware

```typescript
// Check if user has permission
async function authorize(requiredPermission: string) {
  return async (req, res, next) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        role: {
          include: {
            permissions: true
          }
        }
      }
    });
    
    const hasPermission = user.role.permissions.some(
      p => p.slug === requiredPermission
    );
    
    if (!hasPermission) {
      return res.status(403).json({error: 'Insufficient permissions'});
    }
    next();
  };
}

// Usage in route
app.post('/leads', 
  authenticate, 
  authorize('leads:create'),
  createLead
);
```

---

## Soft Delete Strategy

### Implementation

**Soft Delete Principle**: Never truly delete records, mark with `deletedAt` timestamp.

**Benefits**:
- ✅ Comply with data retention laws (LGPD, GDPR)
- ✅ Maintain audit trails and historical data
- ✅ Recover accidentally deleted records
- ✅ Preserve referential integrity

### Middleware Behavior

All models with `deletedAt` field have automatic middleware:

```typescript
// Prisma Middleware (in src/database/prisma.ts)
prisma.$use(async (params, next) => {
  // READ operations: Automatically exclude deleted records
  if (['findMany', 'findFirst', 'findUnique', 'count'].includes(params.action)) {
    if (SOFT_DELETE_MODELS.includes(params.model)) {
      params.args.where = {
        ...params.args.where,
        deletedAt: null  // Only active records
      };
    }
  }
  
  // DELETE operations: Convert to soft delete (update deletedAt)
  if (params.action === 'delete') {
    if (SOFT_DELETE_MODELS.includes(params.model)) {
      params.action = 'update';
      params.args.data = { deletedAt: new Date() };
    }
  }
  
  if (params.action === 'deleteMany') {
    if (SOFT_DELETE_MODELS.includes(params.model)) {
      params.action = 'updateMany';
      params.args.data = { deletedAt: new Date() };
    }
  }
  
  return next(params);
});
```

### Soft Delete Models
```
Tenant, User, Role, Lead, Customer, Opportunity, Pipeline, 
Stage, Activity, BankProposal, Commission, AuditLog
```

### Querying Deleted Records

```typescript
// Normal query: Only active records (deletedAt is null)
const leads = await prisma.lead.findMany({
  where: { tenantId }
});  // ✅ Only returns leads with deletedAt: null

// Query including deleted records (admin/audit only)
const allLeads = await prisma.lead.findMany({
  where: { tenantId },
  include: { _count: true }
});
// Note: Middleware still filters, so use raw query:
const allLeads = await prisma.$queryRaw`
  SELECT * FROM "Lead" 
  WHERE "tenantId" = ${tenantId}
`;  // Returns all records including deleted

// Restore a soft-deleted record
await prisma.lead.update({
  where: { id: leadId },
  data: { deletedAt: null }
});
```

---

## Database Setup

### Prerequisites
- Docker & Docker Compose installed
- PostgreSQL 13+
- Node.js 18+
- npm or pnpm

### Step 1: Initialize Database

```bash
cd backend

# Copy environment file
cp .docker.env .env

# Start PostgreSQL via Docker
docker-compose up -d

# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with default data
npm run db:seed
```

### Step 2: Verify Connection

```bash
npm run db:studio
```

Prisma Studio opens at `http://localhost:5555` - view all data!

### Step 3: Environment Configuration

Create `.env` file:

```bash
cp .env.example .env
```

Update with your values:
```
DATABASE_URL="postgresql://finqz_user:finqz_password@localhost:5432/finqz_pro?schema=public"
JWT_SECRET=generate-a-random-secret
JWT_REFRESH_SECRET=generate-another-random-secret
```

### Step 4: Start Backend

```bash
# Development with auto-reload
npm run dev

# Production build
npm run build
npm start
```

---

## Default Seed Data

### Initialized During `npm run db:seed`

#### 1. **Default Tenant**
```
Name: FINQZ PRO - Development
Domain: finqz-pro
Plan: enterprise
Settings: {
  timezone: "America/Sao_Paulo",
  currency: "BRL",
  language: "pt-BR"
}
```

#### 2. **26 Global Permissions**
All `resource:action` permissions (see RBAC section above).

#### 3. **3 Default Roles**
- Admin (26 permissions)
- Sales Representative (14 permissions)
- Viewer (7 permissions)

#### 4. **Admin User**
```
Email: admin@finqz.dev
Password: Admin@123456
Name: Administrador FINQZ
Department: Administration
Role: Admin
Is Email Verified: true
```

#### 5. **Demo Sales Users**
```
User 1:
  Email: sales1@finqz.dev
  Password: Demo@123456
  Name: João Sales
  Role: Sales Representative

User 2:
  Email: sales2@finqz.dev
  Password: Demo@123456
  Name: Maria Sales
  Role: Sales Representative
```

#### 6. **Default Pipeline**
```
Name: Sales Pipeline
Stages:
  1. Lead (order: 0)
  2. Contact (order: 1)
  3. Qualified (order: 2)
  4. Proposal (order: 3)
  5. Negotiation (order: 4)
  6. Won (order: 5, isWon: true)
  7. Lost (order: 6, isLost: true)
```

#### 7. **Demo Lead**
```
Name: João Silva
CPF: 12345678901
Email: joao.silva@email.com
Phone: +55 11 98765-4321
Score: 75
Status: prospect
Source: LinkedIn
Created By: Admin
Owner: Sales 1
```

#### 8. **Demo Customer**
```
Name: Maria Santos
Customer Code: CUST-001
CPF: 98765432100
Email: maria.santos@email.com
KYC Status: approved
KYC Verified At: Now
Risk Level: low
```

---

## Environment Configuration

### Required Variables

```env
# Server
NODE_ENV=development|production
PORT=3001
HOST=localhost

# Database
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

# Authentication
JWT_SECRET=min-32-characters-random-secret
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=another-random-secret
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=debug|info|warn|error
LOG_FILE=logs/app.log

# Security
BCRYPT_ROUNDS=12

# File Upload
UPLOAD_PATH=uploads/
MAX_FILE_SIZE=10485760
```

### Optional Variables

```env
# Redis (caching)
REDIS_URL=redis://localhost:6379

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=app-password

# External APIs
OPENAI_API_KEY=key
STRIPE_SECRET_KEY=key
CREDIT_CHECK_API_URL=https://api.credit.com
CREDIT_CHECK_API_KEY=key
```

---

## Common Operations

### User Management

```typescript
// Create new user
const user = await prisma.user.create({
  data: {
    email: 'newuser@finqz.dev',
    emailNormalized: 'newuser@finqz.dev'.toLowerCase(),
    password: await bcrypt.hash('SecurePass@123', 12),
    firstName: 'John',
    lastName: 'Doe',
    tenantId: tenantId,
    roleId: salesRoleId,
    isEmailVerified: false
  },
  include: { role: { include: { permissions: true } } }
});

// Assign role with permissions
await prisma.role.update({
  where: { id: roleId },
  data: {
    permissions: {
      connect: [
        { id: permissionId1 },
        { id: permissionId2 }
      ]
    }
  }
});
```

### Lead Management

```typescript
// Create lead
const lead = await prisma.lead.create({
  data: {
    firstName: 'João',
    lastName: 'Silva',
    email: 'joao@example.com',
    emailNormalized: 'joao@example.com'.toLowerCase(),
    cpf: '12345678901',
    tenantId: tenantId,
    createdById: userId,
    ownerId: salesRepId,
    score: 75,
    status: 'prospect'
  }
});

// Update lead status to qualified
await prisma.lead.update({
  where: { id: leadId },
  data: { status: 'qualified', score: 85 }
});

// List leads for a sales rep (auto-filtered by tenant)
const myLeads = await prisma.lead.findMany({
  where: {
    tenantId: userTenantId,
    ownerId: userId
  },
  include: { opportunities: true, activities: true }
});
```

### Opportunity Management

```typescript
// Create opportunity
const opportunity = await prisma.opportunity.create({
  data: {
    title: 'Product X - $50k Deal',
    description: 'Enterprise deal with ABC Corp',
    amount: 50000,
    currency: 'BRL',
    probability: 60,
    status: 'open',
    tenantId: tenantId,
    leadId: leadId,
    stageId: proposalStageId,
    ownerId: salesRepId,
    expectedCloseDate: new Date('2024-12-31')
  }
});

// Move opportunity to next stage
await prisma.opportunity.update({
  where: { id: opportunityId },
  data: {
    stageId: negotiationStageId,
    probability: 80,
    updatedAt: new Date()
  }
});
```

### Activity Tracking

```typescript
// Log activity (call, email, meeting)
const activity = await prisma.activity.create({
  data: {
    type: 'call',
    title: 'Initial Discovery Call',
    description: 'Discussed product features and pricing',
    status: 'completed',
    completedAt: new Date(),
    duration: 30,  // minutes
    notes: 'Customer interested in demo',
    tenantId: tenantId,
    userId: currentUserId,
    leadId: leadId,
    opportunityId: opportunityId
  }
});

// Get activity history for a lead
const history = await prisma.activity.findMany({
  where: {
    leadId: leadId,
    tenantId: tenantId
  },
  orderBy: { createdAt: 'desc' }
});
```

### Commission Tracking

```typescript
// Create commission record
const commission = await prisma.commission.create({
  data: {
    commissionNumber: 'COM-2024-001',
    type: 'sale',
    amount: 5000,
    percentage: 5.0,
    status: 'pending',
    referenceDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),  // 30 days
    tenantId: tenantId,
    userId: salesRepId,
    customerId: customerId
  }
});

// Approve commission
await prisma.commission.update({
  where: { id: commissionId },
  data: {
    status: 'approved',
    approvedAt: new Date()
  }
});
```

### Audit Logging

```typescript
// Log user action (handled by middleware in production)
const auditLog = await prisma.auditLog.create({
  data: {
    action: 'CREATE',
    entity: 'Lead',
    entityId: leadId,
    changes: {
      before: null,
      after: { firstName: 'João', email: 'joao@example.com' }
    },
    description: 'New lead created from import',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    tenantId: tenantId,
    userId: currentUserId
  }
});

// Query audit trail for compliance
const leadAudits = await prisma.auditLog.findMany({
  where: {
    entity: 'Lead',
    entityId: leadId,
    tenantId: tenantId
  },
  orderBy: { createdAt: 'desc' }
});
```

### Soft Delete Operations

```typescript
// Soft delete a lead (sets deletedAt)
await prisma.lead.delete({
  where: { id: leadId }
});
// ✅ Middleware converts to: update with { deletedAt: new Date() }

// Query doesn't return deleted leads (middleware filters)
const leads = await prisma.lead.findMany({
  where: { tenantId }
});
// ✅ Automatically filters: where { deletedAt: null }

// Restore a soft-deleted lead (admin only)
await prisma.lead.update({
  where: { id: leadId },
  data: { deletedAt: null }
});

// Query all leads including deleted (raw query, admin only)
const allLeads = await prisma.$queryRaw`
  SELECT * FROM "Lead" 
  WHERE "tenantId" = ${tenantId}
  ORDER BY "deletedAt" DESC
`;
```

---

## Troubleshooting

### Common Issues

#### 1. **Build Errors: TypeScript Compilation Fails**

**Error**: `error TS2614: Module has no exported member 'prisma'`

**Solution**:
```typescript
// ❌ Wrong (named import)
import { prisma } from '../../database/prisma';

// ✅ Correct (default import)
import prisma from '../../database/prisma';
```

#### 2. **Database Connection Error**

**Error**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution**:
```bash
# Check if PostgreSQL is running
docker-compose ps

# If not running, start it
docker-compose up -d

# Verify connection
npm run db:studio
```

#### 3. **Prisma Client Generation Failed**

**Error**: `Prisma Client generation failed`

**Solution**:
```bash
# Regenerate client
npm run db:generate

# If issue persists, clear cache
rm -rf node_modules/.prisma
npm run db:generate
```

#### 4. **Seed Data Failed**

**Error**: `Error during seed execution`

**Solution**:
```bash
# Check database exists and is connected
npm run db:push

# If schema issues, reset (WARNING: deletes all data)
npx prisma migrate reset

# Then seed
npm run db:seed
```

#### 5. **Multi-Tenant Data Leak**

**Symptom**: User sees data from other tenants

**Debug**:
```typescript
// Ensure all queries filter by tenantId
const leads = await prisma.lead.findMany({
  where: { 
    tenantId: req.user.tenantId  // ✅ Must include this
  }
});

// Verify middleware is active
console.log(prisma._extensions);
```

#### 6. **Deleted Records Still Appear**

**Symptom**: Soft-deleted records return in queries

**Debug**:
```typescript
// Check middleware is loading
const health = await getDatabaseHealth();
console.log(health);

// Raw query to check deletedAt values
const all = await prisma.$queryRaw`
  SELECT id, "deletedAt" FROM "Lead" 
  WHERE "tenantId" = ${tenantId}
`;
```

### Debug Commands

```bash
# Check database health
npm run dev
# Look for: "✅ Database connection successful"

# Open Prisma Studio (visual database browser)
npm run db:studio

# View Prisma logs
LOG_LEVEL=debug npm run dev

# Check migrations status
npx prisma migrate status

# Validate schema
npx prisma validate
```

### Performance Optimization

```typescript
// Always include indexes for filtering
// ✅ Optimized queries
const leads = await prisma.lead.findMany({
  where: {
    tenantId,  // Indexed
    status: 'qualified',  // Indexed
    score: { gte: 75 }
  },
  select: {  // Only needed fields
    id: true,
    firstName: true,
    email: true,
    score: true
  },
  take: 20  // Pagination
});

// ❌ Inefficient queries
const leads = await prisma.lead.findMany({
  where: { notes: { contains: 'text' } },  // Not indexed
  include: { activities: { include: { user: true } } }  // N+1
});
```

---

## Production Deployment Checklist

- [ ] Update `.env` with production database credentials
- [ ] Set `NODE_ENV=production`
- [ ] Generate and store `JWT_SECRET` and `JWT_REFRESH_SECRET` securely
- [ ] Enable SSL/TLS for database connections
- [ ] Set up database backups and recovery
- [ ] Configure rate limiting appropriately
- [ ] Enable audit logging
- [ ] Set up monitoring and alerting
- [ ] Test soft delete restoration procedures
- [ ] Create database user with minimal permissions (read/write only for app)
- [ ] Run security audit on permissions
- [ ] Document emergency procedures for data recovery

---

## Support & Documentation

For additional information:
- **Prisma Docs**: https://www.prisma.io/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs
- **Express.js Docs**: https://expressjs.com

Generated: 2024
Backend Version: 1.0.0
