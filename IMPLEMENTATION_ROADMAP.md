# FINQZ PRO - Executive Summary: Domain Consolidation Issues

**Nível**: CTO/Technical Leadership  
**Urgência**: 🔴 CRÍTICA  
**Data**: 2026-05-11

---

## ⚠️ PROBLEMAS CRÍTICOS (BLOQUEADORES)

### ISSUE #1: Lead/Customer Duplicação [CRÍTICO]

**Problema**:
- Lead e Customer são essencialmente a mesma coisa em estágios diferentes
- Dados duplicados: firstName, lastName, email, phone, cpf, birthDate
- Sem relação explícita entre eles

**Código Atual**:
```prisma
// Dois modelos separados, sem conexão clara
model Lead {
  id, firstName, lastName, email, cpf, score, status
  → criado por prospecção, não convertido, dados "quentes"
}

model Customer {
  id, firstName, lastName, email, cpf, kycStatus
  → criado após conversão, dados "frios", validados
}
```

**Por que isso é problema**:
1. **Sincronização**: Se Lead vira Customer, como sincronizar dados?
2. **Rastreabilidade**: Perder histórico de quando foi prospect
3. **Duplicidade**: Mesma pessoa em dois lugares
4. **Lógica espalhada**: Rules de conversão espalhadas no código
5. **Auditoria**: Difícil entender jornada completa

**Custo do Problema**:
- ❌ 2-3 queries redundantes por operação
- ❌ Risk de inconsistência
- ❌ Impossível reportar "Pipeline de Prospects"
- ❌ Difícil implementar automações (quando convert?)

**Solução (Proposta)**:
```prisma
// Modelo único com ciclo de vida claro
model Lead {
  id: UUID
  
  // Dados básicos (mutáveis na fase de prospect)
  firstName, lastName, email, phone, cpf, birthDate
  
  // Lead específico (apenas enquanto está em prospecção)
  score: Int
  status: 'prospect' | 'contact' | 'qualified' | 'negotiation' | 'converted' | 'lost'
  source?: string
  
  // Referência para customer (após conversão)
  convertedToCustomerId?: UUID
  convertedAt?: DateTime
  
  // Auditoria
  createdById: UUID
  ownerId?: UUID
  tenantId: UUID
  deletedAt?: DateTime
  createdAt, updatedAt
}

model Customer {
  id: UUID
  
  // Link para origem
  leadId?: UUID // Se veio de Lead
  
  // Dados completos
  firstName, lastName, email, phone, cpf, birthDate
  
  // Customer específico
  monthlyIncome, annualIncome
  kycStatus, kycVerifiedAt, kycExpireAt
  riskLevel
  
  // Relacionamentos
  partnerId?: UUID
  parentCustomerId?: UUID // Para corporativas/dependentes
  
  tenantId: UUID
  createdAt, updatedAt
  deletedAt?: DateTime
}
```

**Implementação** (3 passos):
1. Adicionar campo `convertedToCustomerId` em Lead
2. Adicionar campo `leadId` em Customer
3. Criar migration: popular dados históricos (onde possível)
4. Atualizar queries para usar Lead como origem
5. Remover lógica de duplicação

**Timeline**: 3-4 dias

---

### ISSUE #2: Multi-Tenant Filtering Não Automático [CRÍTICO]

**Problema**:
Cada query precisa lembrar de filtrar por `tenantId` manualmente

```typescript
// ❌ Desta forma (inseguro):
const leads = await prisma.lead.findMany(); // Retorna TODOS os leads de TODOS tenants!

// ✅ Precisa ser assim:
const leads = await prisma.lead.findMany({
  where: { tenantId: req.user.tenantId }
});
```

**Por que é crítico**:
- 🔴 **Data Leak**: Usuário consegue ver dados de outro tenant
- 🔴 **Compliance**: Violação de LGPD/GDPR
- 🔴 **Segurança**: Uma query esquecida = exposure
- 🔴 **Escalabilidade**: Risk aumenta com mais queries

**Como Resolver** (Prisma Middleware):

```typescript
// backend/src/infrastructure/persistence/prisma/extensions/tenant-isolation.ts

export const createTenantIsolationExtension = (tenantId: string) => {
  return prisma.$extends({
    query: {
      // Aplica a TODOS os modelos
      $allModels: {
        async findMany({ model, args, query }) {
          // Injeta tenantId automaticamente
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findUnique({ model, args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findFirst({ model, args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async update({ model, args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async delete({ model, args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
      },
    },
  });
};
```

**Como usar**:
```typescript
// middleware
app.use((req, res, next) => {
  // Criar instância do Prisma com tenant isolation
  req.prisma = createTenantIsolationExtension(req.user.tenantId);
  next();
});

// Em qualquer service/controller:
const leads = await req.prisma.lead.findMany(); // Automaticamente filtra por tenant!
```

**Benefício**:
- ✅ Uma garantia de segurança central
- ✅ Nenhuma query pode vazar dados
- ✅ Código mais limpo (sem repetir tenantId)
- ✅ Easy auditoria

**Timeline**: 1-2 dias

---

### ISSUE #3: Authorization Validação Apenas Frontend [CRÍTICO]

**Problema**:
Permissões são validadas APENAS no frontend

```typescript
// ❌ INSEGURO - Frontend:
if (can('clientes', 'edit')) {
  // Mostra botão
}

// Usuário malicioso faz:
// curl -X PATCH /api/clientes/123 -d '{...}'
// Backend: "OK, feito!" ← Sem validação!
```

**Por que é crítico**:
- 🔴 Usuário consegue contornar UI
- 🔴 ACESSO NÃO AUTORIZADO A DADOS
- 🔴 Violação de LGPD
- 🔴 Multas de compliance

**Como Resolver**:

```typescript
// backend/src/middlewares/authorization.ts

export const authorize = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user; // JWT payload
    const tenant = req.user.tenantId;
    
    // Valida NO BACKEND
    const hasPermission = await permissionsService.checkPermission(
      user.userId,
      tenant,
      requiredPermission
    );
    
    if (!hasPermission) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource'
      });
    }
    
    next();
  };
};

// Uso em rotas:
router.patch(
  '/clientes/:id',
  authenticate,        // Verificar JWT
  authorize('CLIENTES_EDIT'),  // ← Validação no backend!
  updateClienteController
);
```

**Timeline**: 2-3 dias

---

### ISSUE #4: Sem Isolamento de Dados por Partner [IMPORTANTE]

**Problema**:
Quando um usuário é vinculado a um Partner (Franquia/Franqueado), deveria ver APENAS dados daquele partner

```typescript
// Usuário é FRANQUEADO da Franquia ABC
// Atualmente: vê TODOS os clientes da empresa
// Deveria: ver APENAS clientes da Franquia ABC
```

**Solução**:
```typescript
// Middleware de scope de dados:

export const scopeByPartnerOrTenant = async (req, res, next) => {
  const user = req.user;
  
  let scope = {
    tenantId: user.tenantId,
    partnerId: null,
  };
  
  // Se usuário é vinculado a partner, filtrar por partner
  if (user.partnerId) {
    scope.partnerId = user.partnerId;
  }
  
  req.scope = scope;
  next();
};

// Uso:
const leads = await prisma.lead.findMany({
  where: {
    tenantId: req.scope.tenantId,
    ...(req.scope.partnerId && { 
      partner: { id: req.scope.partnerId }
    }),
  }
});
```

**Timeline**: 2-3 dias

---

## 🔴 DUPLICIDADES CRÍTICAS

### DUP-1: Dados de Cliente em Múltiplos Modelos

| Campo | Lead | Customer | BankProposal | Activity |
|-------|------|----------|---|---|
| firstName | ✓ | ✓ | ✗ | ✗ |
| lastName | ✓ | ✓ | ✗ | ✗ |
| email | ✓ | ✓ | ✗ | ✗ |
| phone | ✓ | ✓ | ✗ | ✗ |
| cpf | ✓ | ✓ | ✗ | ✗ |
| birthDate | ✓ | ✓ | ✗ | ✗ |

**Solução**: Usar referência única (Customer/Lead), não duplicar dados

### DUP-2: Responsabilidade em Opportunity

```prisma
model Opportunity {
  createdById: UUID  // Quem criou
  ownerId: UUID      // Quem é responsável (pode ser diferente!)
}
```

**Problema**: Ambiguidade de quem "owneia"  
**Solução**: Usar `assignedToId` (mais claro)

---

## 📊 IMPACTO DOS PROBLEMAS

| Problema | Segurança | Performance | Auditoria | Escalabilidade | Fix Priority |
|----------|-----------|---|---|---|---|
| Lead/Customer Duplicação | 🔴 | 🟡 | 🔴 | 🔴 | 1 |
| Multi-Tenant Filtering | 🔴 | 🟢 | 🔴 | 🔴 | 1 |
| Authorization Backend | 🔴 | 🟢 | 🔴 | 🟢 | 1 |
| Partner Scoping | 🟡 | 🟢 | 🟡 | 🟡 | 2 |
| Activity Duplicação | 🟡 | 🟡 | 🟡 | 🟡 | 2 |
| Soft-Delete Inconsistent | 🟡 | 🟡 | 🔴 | 🟡 | 2 |

Legend: 🔴 Critical | 🟡 Important | 🟢 Low

---

## 🎯 PLANO DE AÇÃO (Sequência)

### Sprint 1: Foundation (Semana 1-2) - BLOQUEADOR PARA PRODUÇÃO

**Objetivo**: Tornar sistema seguro o suficiente para staged rollout

```
┌─────────────────────────────────────────────────────┐
│ WEEK 1                                              │
├─────────────────────────────────────────────────────┤
│ Day 1-2: Setup Infraestrutura                      │
│ - Criar branch: foundation/tenant-isolation        │
│ - Prisma middleware de tenant                      │
│ - Testes de isolamento (2 tenants, verify)        │
│                                                     │
│ Day 3-4: Authorization Backend                     │
│ - Middleware de @authorize()                       │
│ - Testes: sem permissão → 403                      │
│ - Aplicar em 5 rotas críticas (test)              │
│                                                     │
│ Day 5: Auditoria Logs                             │
│ - Middleware que loga: who, what, when             │
│ - Integrar com AuditLog model                      │
│ - Dashboard de auditoria básico                    │
├─────────────────────────────────────────────────────┤
│ WEEK 2                                              │
├─────────────────────────────────────────────────────┤
│ Day 1-2: Lead→Customer Consolidação              │
│ - Migração: adicionar leadId a Customer           │
│ - Novo status em Lead: convertedAt                │
│ - Service de conversão: validateAndConvert()      │
│                                                     │
│ Day 3: Soft-Delete Universal                      │
│ - Adicionar deletedAt em: Partner, Activity, etc  │
│ - Middleware que filtra soft-deleted por default  │
│                                                     │
│ Day 4-5: E2E Tests & Validation                  │
│ - Testes: Lead→Customer conversion                │
│ - Testes: Data isolation entre tenants            │
│ - Testes: Authorization em rotas críticas         │
└─────────────────────────────────────────────────────┘
```

**Entregáveis**:
- [ ] Prisma middleware (tenant isolation)
- [ ] @authorize middleware (backend validation)
- [ ] AuditLog automático
- [ ] Conversion: Lead → Customer
- [ ] Soft-delete universal
- [ ] E2E test suite (10+ tests)
- [ ] PR review + deployment

---

### Sprint 2: Domain Consolidation (Semana 3-4)

**Objetivo**: Estruturar domínio base (não quebra UI)

```
Refatorar Business Logic:
├─ LeadConverter service
├─ OpportunityStager service
├─ CommissionCalculator service
├─ ActivityRecorder service
└─ PartnerHierarchy service

Criar Use Cases (Application Layer):
├─ CreateLead
├─ ConvertLeadToCustomer
├─ CreateOpportunity
├─ AdvanceOpportunity
└─ CalculateCommission

Implementar Repositories:
├─ LeadRepository
├─ CustomerRepository
├─ OpportunityRepository
└─ CommissionRepository
```

**Timeline**: 10-12 dias

---

### Sprint 3: Backend Architecture (Semana 5-6)

**Objetivo**: Estrutura enterprise pronta para scale

```
├─ Reorganizar em: domains/, application/, infrastructure/, presentation/
├─ Implementar injeção de dependência
├─ Criar cache layer (Redis)
├─ Implementar queue layer (Bull)
└─ API performance: <100ms p95
```

**Timeline**: 10 dias

---

## 📈 MÉTRICAS DE SUCESSO

Após Sprint 1 (Final de Semana 2):

| Métrica | Target | Atual | Gap |
|---------|--------|-------|-----|
| **Data Isolation** | 100% | 0% | 🔴 |
| **Backend Auth** | 100% of routes | 0% | 🔴 |
| **Audit Coverage** | 100% of writes | 0% | 🔴 |
| **Soft-delete** | All models | 50% | 🟡 |
| **Lead→Customer** | Automated | Manual | 🟡 |

---

## 🚀 GO/NO-GO CHECKLIST

**NÃO PODE IR PARA PRODUÇÃO SEM:**

- [ ] Tenant isolation middleware 100% operative (todos os models)
- [ ] Backend authorization em TODAS as routes críticas (CRM, Financial)
- [ ] AuditLog automático para todas ações
- [ ] Lead/Customer duplicação resolvida
- [ ] E2E testes de isolamento passando
- [ ] Data leak test realizado (simular usuário malicioso)
- [ ] Rate limiting ativado por endpoint
- [ ] Logging estruturado (request ID, user ID, tenant ID)

---

## 💰 ESTIMATIVA DE ESFORÇO

| Atividade | Dev Days | QA Days | Total |
|-----------|----------|---------|-------|
| Tenant Isolation Middleware | 2 | 2 | 4 |
| Backend Authorization | 2 | 1 | 3 |
| Audit Logging | 1 | 1 | 2 |
| Lead/Customer Consolidation | 3 | 2 | 5 |
| Soft-Delete Implementation | 2 | 1 | 3 |
| E2E Testing | 0 | 4 | 4 |
| **TOTAL SPRINT 1** | **11** | **11** | **22** |

**Assumindo**: 1 Senior Dev + 1 QA  
**Timeline**: ~2 semanas

---

## 🎓 LEARNING & DOCUMENTATION

**Deve ser documentado**:
1. Architecture Decision Records (ADRs)
   - ADR-001: Multi-Tenant Isolation Strategy
   - ADR-002: Lead/Customer Model Consolidation
   - ADR-003: Authorization Pattern

2. Domain Model Documentation
   - Entity relationships
   - Invariants
   - Bounded contexts

3. Runbooks
   - Data leak testing
   - Emergency procedures
   - Troubleshooting

---

## ✅ RECOMENDAÇÃO FINAL

**Status**: CRÍTICO para produção segura

**Recomendação**: 
> Implementar Sprint 1 ANTES de qualquer rollout de produção. O sistema não está seguro o suficiente para ter dados reais de clientes.

**Next Step**:
1. ✅ Validar este plano com team
2. ✅ Criar jira tickets baseado em Sprints
3. ✅ Designar Dev/QA lead
4. ✅ Iniciar Day 1 da Week 1

---

**Aprovado por**: CTO  
**Data**: 2026-05-11  
**Versão**: 1.0

