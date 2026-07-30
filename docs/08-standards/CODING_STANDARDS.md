# FINQZ PRO - Coding Standards & Architecture Patterns

**Purpose**: Estabelecer convenções e padrões  
**Audience**: Todos os developers  
**Last Updated**: 2026-05-11  

---

## 📐 PRINCIPLES

### 1. Single Responsibility
Cada classe/function tem UMA responsabilidade.

```typescript
// ❌ BAD: Múltiplas responsabilidades
class LeadService {
  async createAndQualify(data) {
    const lead = this.validate(data);     // Validation
    await this.save(lead);                // Persistence
    const score = this.calculateScore();  // Business logic
    return score;                         // All mixed!
  }
}

// ✅ GOOD: Separado
class LeadValidator {
  validate(data): Lead { /* ... */ }
}

class LeadRepository {
  save(lead): Promise<void> { /* ... */ }
}

class LeadScorer {
  calculate(lead): number { /* ... */ }
}

class CreateLeadUseCase {
  async execute(data) {
    const lead = this.validator.validate(data);
    await this.repository.save(lead);
    const score = this.scorer.calculate(lead);
    return score;
  }
}
```

### 2. Dependency Injection
Nunca criar instâncias direto. Injetar via constructor.

```typescript
// ❌ BAD: Hard dependency
class OpportunityService {
  private leadRepository = new LeadRepository();
  
  async createOpportunity(leadId) {
    const lead = await this.leadRepository.findById(leadId);
  }
}

// ✅ GOOD: Dependency injection
class OpportunityService {
  constructor(private leadRepository: ILeadRepository) {}
  
  async createOpportunity(leadId) {
    const lead = await this.leadRepository.findById(leadId);
  }
}
```

### 3. Interface-Driven
Use interfaces, não implementações.

```typescript
// ✅ GOOD
interface ILeadRepository {
  save(lead: Lead): Promise<void>;
  findById(id: UUID): Promise<Lead | null>;
  findByTenantId(tenantId: UUID): Promise<Lead[]>;
}

class PrismaLeadRepository implements ILeadRepository {
  // Implementation
}

class MockLeadRepository implements ILeadRepository {
  // For testing
}

class LeadService {
  constructor(private repository: ILeadRepository) {}
  // Can use ANY implementation!
}
```

### 4. Validation at Every Layer
Não confia em nada. Valida em todas camadas.

```
HTTP Request
    ↓ [Joi/Zod validation]
DTO + Mapper
    ↓ [Type validation]
Use Case
    ↓ [Business rule validation]
Domain Entity
    ↓ [Invariant validation]
Repository
    ↓ [Database constraints]
```

### 5. Immutability by Default
Objetos domain são imutáveis quando criados.

```typescript
// ✅ GOOD
class Lead {
  private readonly id: UUID;
  private readonly firstName: string;
  private status: 'prospect' | 'contact' | 'qualified' | 'converted' | 'lost';
  
  private constructor(id: UUID, firstName: string, status: string) {
    this.id = id;
    this.firstName = firstName;
    this.status = status;
  }
  
  // Factory method (não use `new` direto)
  static create(firstName: string): Lead {
    return new Lead(uuidv4(), firstName, 'prospect');
  }
  
  // Methods retornam novo objeto (não modificam this)
  qualify(): Lead {
    return new Lead(this.id, this.firstName, 'qualified');
  }
}

// Uso:
const lead = Lead.create('João');        // prospect
const qualified = lead.qualify();        // novo objeto, qualified
console.log(lead.status);                // ainda 'prospect' ✅
```

---

## 🏗️ ARCHITECTURE LAYERS

### Domain Layer (Lógica Pura)

**Responsabilidade**: Regras de negócio  
**Dependências**: Nenhuma externa  
**Acesso a DB**: NÃO  
**Acesso a APIs**: NÃO  

**O que vai aqui**:
- Entities (Lead, Customer, Opportunity, etc)
- Value Objects (LeadScore, Money, etc)
- Domain Services (LeadConverter, CommissionCalculator)
- Business Rules
- Domain Events

**Exemplo**:
```typescript
// domains/sales/entities/lead.entity.ts
export class Lead {
  static MAX_SCORE = 100;
  static MIN_SCORE = 0;
  
  private constructor(
    private readonly id: UUID,
    private readonly firstName: string,
    private score: number,
    private status: LeadStatus
  ) {}
  
  static create(firstName: string): Lead {
    return new Lead(uuidv4(), firstName, 0, 'prospect');
  }
  
  // Business logic: quando pode converter?
  canConvert(): boolean {
    return this.score >= 10 && this.status === 'qualified';
  }
  
  // Business logic: adicionar score
  addScore(points: number): void {
    this.score = Math.min(this.score + points, Lead.MAX_SCORE);
  }
}
```

### Application Layer (Orquestração)

**Responsabilidade**: Coordenar use cases  
**Dependências**: Domain, Repositories (via interfaces)  
**Acesso a DB**: Através de repositories  

**O que vai aqui**:
- Use Cases
- Application Services
- Data Transformers (Entity → DTO)
- DTOs (Request/Response)

**Exemplo**:
```typescript
// application/sales/create-lead.use-case.ts
export class CreateLeadUseCase {
  constructor(
    private leadRepository: ILeadRepository,
    private leadValidator: LeadValidator,
    private eventPublisher: IEventPublisher
  ) {}
  
  async execute(request: CreateLeadRequest): Promise<CreateLeadResponse> {
    // 1. Validar input
    const validatedData = this.leadValidator.validate(request);
    
    // 2. Criar entidade domain
    const lead = Lead.create(validatedData.firstName);
    
    // 3. Persistir
    await this.leadRepository.save(lead);
    
    // 4. Publicar evento
    this.eventPublisher.publish(new LeadCreatedEvent(lead.id));
    
    // 5. Retornar resultado
    return {
      id: lead.id,
      status: lead.status,
      createdAt: new Date()
    };
  }
}
```

### Infrastructure Layer (Detalhes Técnicos)

**Responsabilidade**: Implementações técnicas  
**Dependências**: Externas (DB, APIs, Cache)  
**Acesso a DB**: SIM (Prisma direto)  

**O que vai aqui**:
- Repository implementations
- Database migrations
- Cache implementations
- External API adapters
- Queue/Event bus implementations

**Exemplo**:
```typescript
// infrastructure/persistence/repositories/lead.repository.ts
@Injectable()
export class PrismaLeadRepository implements ILeadRepository {
  constructor(private prisma: PrismaClient) {}
  
  async save(lead: Lead): Promise<void> {
    await this.prisma.lead.create({
      data: {
        id: lead.id,
        firstName: lead.firstName,
        status: lead.status,
        score: lead.score,
        tenantId: lead.tenantId
      }
    });
  }
  
  async findById(id: UUID): Promise<Lead | null> {
    const data = await this.prisma.lead.findUnique({
      where: { id, tenantId: getCurrentTenantId() }
    });
    
    return data ? new Lead(data.id, data.firstName, data.score, data.status) : null;
  }
}
```

### Presentation Layer (HTTP)

**Responsabilidade**: HTTP requests/responses  
**Dependências**: Application layer  
**Acesso a DB**: NÃO (via use cases)  

**O que vai aqui**:
- Controllers
- Routes
- DTOs (request/response)
- HTTP Middleware
- Validation schemas

**Exemplo**:
```typescript
// presentation/http/controllers/leads.controller.ts
@Controller('/leads')
export class LeadsController {
  constructor(private createLeadUseCase: CreateLeadUseCase) {}
  
  @Post()
  async create(@Body() request: CreateLeadRequest): Promise<CreateLeadResponse> {
    return this.createLeadUseCase.execute(request);
  }
}
```

---

## 📝 NAMING CONVENTIONS

### Files

| Type | Pattern | Example |
|------|---------|---------|
| Entity | `{entity}.entity.ts` | `lead.entity.ts` |
| Value Object | `{vo-name}.vo.ts` | `lead-score.vo.ts` |
| Service (domain) | `{service-name}.service.ts` | `lead-converter.service.ts` |
| Use Case | `{action}.use-case.ts` | `create-lead.use-case.ts` |
| Repository | `{entity}.repository.ts` | `lead.repository.ts` |
| Interface | `i-{name}.interface.ts` | `i-lead-repository.interface.ts` |
| DTO | `{action}.dto.ts` | `create-lead.dto.ts` |
| Controller | `{entity}.controller.ts` | `leads.controller.ts` |
| Route | `{entity}.routes.ts` | `leads.routes.ts` |
| Test | `{file}.spec.ts` | `lead.service.spec.ts` |
| Event | `{event}.event.ts` | `lead-created.event.ts` |
| Rule | `{rule-name}.rules.ts` | `lead-qualification.rules.ts` |

### Classes

```typescript
// PascalCase, sempre singular
class Lead { }
class LeadConverter { }
class CreateLeadUseCase { }
class ILeadRepository { }  // Interfaces com I prefix
```

### Functions/Methods

```typescript
// camelCase, começar com verbo
function createLead() { }
function findLeadById() { }
function convertLeadToCustomer() { }
function isLeadQualified() { }  // boolean queries com "is"
```

### Variables

```typescript
// camelCase
const leadId = '';
const tenantId = '';
let currentLead: Lead | null = null;

// Constants: UPPER_SNAKE_CASE
const MAX_LEAD_SCORE = 100;
const MIN_LEAD_SCORE = 0;
const DEFAULT_LEAD_STATUS = 'prospect';
```

### Database Fields

```typescript
// snake_case em BD
// Mas camelCase em TypeScript

// TypeScript
interface Lead {
  leadId: UUID;
  firstName: string;
  createdAt: Date;
}

// Database (Prisma schema)
model Lead {
  leadId    String   @id
  firstName String
  createdAt DateTime @default(now())
  
  @@map("leads")  // lowercase, plural
}
```

---

## ✅ CODE REVIEW CHECKLIST

Antes de fazer merge, verifica:

### Architecture
- [ ] Código segue clean architecture (domains/application/infrastructure)?
- [ ] Não há dependencies de cima pra baixo (Infrastructure ← Application ← Domain)?
- [ ] Dependency injection usado em vez de hard dependencies?
- [ ] Interfaces usadas para abstrações?

### Security
- [ ] Tenant filtering em TODAS queries?
- [ ] Authorization check em rotas sensíveis?
- [ ] Inputs validados?
- [ ] Sensitive data não é loggado?
- [ ] SQL injection prevention (Prisma safe)?

### Testing
- [ ] Unit tests para domain logic (>80% coverage)?
- [ ] Integration tests para repositories?
- [ ] E2E tests para happy path?

### Code Quality
- [ ] Sem console.log (usar logger)?
- [ ] Sem hardcoded values (usar constants)?
- [ ] Sem try-catch genéricos (catch específico)?
- [ ] Sem duplicação (DRY principle)?
- [ ] Funções <20 linhas?
- [ ] Nomes descritivos?

### Documentation
- [ ] Complex logic tem comentários?
- [ ] Use cases documentados?
- [ ] APIs com Swagger/OpenAPI?

---

## 🐛 ERROR HANDLING

### Error Hierarchy

```typescript
// Base
class AppError extends Error {
  constructor(message: string, public code: string, public statusCode: number) {
    super(message);
  }
}

// Domain errors (lógica negócio)
class LeadNotQualifiedException extends AppError {
  constructor(leadId: UUID) {
    super(`Lead ${leadId} não está qualificado`, 'LEAD_NOT_QUALIFIED', 400);
  }
}

// Application errors
class TenantNotFound extends AppError {
  constructor(tenantId: UUID) {
    super(`Tenant ${tenantId} não encontrado`, 'TENANT_NOT_FOUND', 404);
  }
}

// Never throw generic Error
// ❌ throw new Error('Something went wrong');
// ✅ throw new LeadNotQualifiedException(leadId);
```

### Try-Catch Pattern

```typescript
// ✅ GOOD: Catch específico
try {
  await this.leadRepository.save(lead);
} catch (error) {
  if (error instanceof UniqueConstraintError) {
    throw new LeadAlreadyExists(lead.cpf);
  }
  throw error; // Re-throw se não sabe tratar
}

// ❌ BAD: Catch genérico
try {
  await this.leadRepository.save(lead);
} catch (error) {
  console.log('Error:', error);  // Esconde o problema!
  throw new Error('Database error');
}
```

---

## 📊 LOGGING STANDARDS

### Structured Logging

```typescript
// ✅ GOOD
logger.info('Lead created', {
  leadId: lead.id,
  tenantId: lead.tenantId,
  userId: currentUser.id,
  timestamp: new Date().toISOString()
});

// ❌ BAD
console.log(`Lead created: ${lead.id}`);
```

### Log Levels

```typescript
logger.debug('Variable value for debugging', { data });
logger.info('Important business event', { ...context });
logger.warn('Warning - recoverable error', { ...context });
logger.error('Critical error', { error, ...context });
```

### What NOT to Log

```typescript
// ❌ Never log:
logger.info('User password: ' + password);
logger.info('Credit card: ' + cc);
logger.info('Full request body:', req.body);  // Can contain sensitive data

// ✅ Log only:
logger.info('User authenticated successfully', { userId, email });
```

---

## 🧪 TESTING STANDARDS

### Unit Tests

```typescript
describe('LeadConverter', () => {
  let converter: LeadConverter;
  let customerRepository: MockCustomerRepository;
  
  beforeEach(() => {
    customerRepository = new MockCustomerRepository();
    converter = new LeadConverter(customerRepository);
  });
  
  describe('convert', () => {
    it('should convert qualified lead to customer', async () => {
      const lead = Lead.create('João');
      lead.addScore(15);  // Make it qualified
      
      const customer = await converter.convert(lead);
      
      expect(customer).toBeDefined();
      expect(customer.firstName).toBe('João');
      expect(customer.leadId).toBe(lead.id);
    });
    
    it('should throw if lead not qualified', async () => {
      const lead = Lead.create('João');
      
      await expect(converter.convert(lead))
        .rejects
        .toThrow(LeadNotQualifiedException);
    });
  });
});
```

### Integration Tests

```typescript
describe('CREATE /api/v1/leads', () => {
  it('should create lead successfully', async () => {
    const response = await request(app)
      .post('/api/v1/leads')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        firstName: 'João',
        lastName: 'Silva',
        email: 'joao@example.com'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.data.id).toBeDefined();
    expect(response.body.data.status).toBe('prospect');
  });
  
  it('should reject unauthorized request', async () => {
    const response = await request(app)
      .post('/api/v1/leads')
      .send({...});
    
    expect(response.status).toBe(401);
  });
});
```

---

## 🚀 DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] All tests passing (>80% coverage)
- [ ] No console.log or debug code
- [ ] No hardcoded secrets (.env used)
- [ ] Database migrations tested
- [ ] Backward compatibility checked
- [ ] Rollback plan documented
- [ ] Monitoring configured
- [ ] Error tracking configured (Sentry)
- [ ] Logging structured and tested
- [ ] Performance benchmarks met

---

## 📚 REFERENCES

- **Clean Architecture**: Uncle Bob - "Clean Architecture"
- **DDD**: Eric Evans - "Domain-Driven Design"
- **Node.js Best Practices**: https://github.com/goldbergyoni/nodebestpractices
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/

---

**Version**: 1.0  
**Last Updated**: 2026-05-11  
**Status**: ✅ Active

