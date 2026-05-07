# FINQZ PRO - Enterprise SaaS Backend

## 📋 Visão Geral

FINQZ PRO é uma plataforma SaaS fintech enterprise para correspondentes bancários, com arquitetura modular escalável construída com Node.js, Express, TypeScript e PostgreSQL.

## 🏗️ Arquitetura

### Estrutura de Diretórios

```
backend/
├── src/
│   ├── app.ts                 # Configuração Express
│   ├── server.ts              # Ponto de entrada do servidor
│   ├── config/                # Configurações da aplicação
│   ├── shared/                # Utilitários compartilhados
│   │   └── logger.ts          # Sistema de logging (Winston)
│   ├── infra/                 # Camada de infraestrutura
│   ├── database/              # Conexão e configurações do banco
│   │   └── prisma.ts          # Cliente Prisma
│   ├── middlewares/           # Middlewares Express
│   │   ├── auth.ts            # Autenticação JWT
│   │   ├── errorHandler.ts    # Tratamento global de erros
│   │   └── validation.ts      # Validação com Joi
│   ├── utils/                 # Utilitários diversos
│   ├── modules/               # Módulos de negócio
│   │   ├── auth/              # Autenticação e autorização
│   │   │   ├── controller.ts  # Lógica de controllers
│   │   │   ├── service.ts     # Regras de negócio
│   │   │   ├── routes.ts      # Definição de rotas
│   │   │   ├── types.ts       # Tipos específicos do módulo
│   │   │   └── index.ts       # Exportações do módulo
│   │   ├── users/             # Gestão de usuários
│   │   ├── crm/               # Gestão de leads/contatos
│   │   ├── partners/          # Gestão de parceiros
│   │   ├── proposals/         # Gestão de propostas
│   │   ├── commissions/       # Gestão de comissões
│   │   ├── financial/         # Módulo financeiro
│   │   ├── analytics/         # Analytics e relatórios
│   │   └── banking/           # Integrações bancárias
│   ├── routes/                # Rotas agregadas
│   └── types/                 # Tipos TypeScript globais
├── prisma/
│   └── schema.prisma          # Schema do banco de dados
├── logs/                      # Arquivos de log
├── uploads/                   # Arquivos enviados
├── .env                       # Variáveis de ambiente
├── .env.example               # Exemplo de configuração
├── package.json               # Dependências e scripts
├── tsconfig.json              # Configuração TypeScript
└── README.md                  # Esta documentação
```

## 🚀 Tecnologias

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Linguagem**: TypeScript
- **ORM**: Prisma
- **Banco**: PostgreSQL
- **Autenticação**: JWT
- **Validação**: Joi
- **Logging**: Winston
- **Segurança**: Helmet, CORS, Rate Limiting
- **Testes**: Jest

## 🔐 Recursos de Segurança

- Autenticação JWT com refresh tokens
- Controle de acesso baseado em roles (RBAC)
- Multi-tenant architecture
- Rate limiting
- Helmet para headers de segurança
- Validação rigorosa de entrada
- Logs de auditoria

## 🏢 Arquitetura Multi-tenant

A aplicação suporta múltiplas empresas (tenants) com isolamento completo de dados:

- Cada empresa tem seu próprio conjunto de dados
- Middleware `tenantGuard` garante isolamento
- Configuração flexível via variáveis de ambiente

## 📊 Modelos de Dados

### Modelos Principais

- **Company**: Empresas (tenants)
- **User**: Usuários do sistema
- **Role**: Roles e permissões
- **Lead**: Leads e prospects
- **Partner**: Parceiros/franquias
- **Proposal**: Propostas comerciais
- **Commission**: Comissões e pagamentos

## 🛠️ Instalação e Configuração

### Pré-requisitos

- Node.js 18+
- PostgreSQL 13+
- npm ou yarn

### Instalação

```bash
# Instalar dependências
npm install

# Configurar banco de dados
cp .env.example .env
# Editar .env com suas configurações

# Gerar cliente Prisma
npm run db:generate

# Executar migrações
npm run db:migrate

# (Opcional) Popular banco com dados de exemplo
npm run db:seed
```

### Desenvolvimento

```bash
# Iniciar servidor em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar em produção
npm start
```

### Testes

```bash
# Executar todos os testes
npm test

# Executar testes com cobertura
npm run test:coverage

# Executar testes em modo watch
npm run test:watch
```

## 📡 API Endpoints

### Autenticação
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/change-password` - Alterar senha
- `GET /api/v1/auth/profile` - Perfil do usuário

### Outros Módulos
- `GET /api/v1/users` - Gestão de usuários
- `GET /api/v1/crm/leads` - Gestão de leads
- `GET /api/v1/partners` - Gestão de parceiros
- `GET /api/v1/proposals` - Gestão de propostas
- `GET /api/v1/commissions` - Gestão de comissões
- `GET /api/v1/financial` - Dados financeiros
- `GET /api/v1/analytics` - Analytics
- `GET /api/v1/banking` - Integrações bancárias

## 🔧 Scripts Disponíveis

- `npm run build` - Compilar TypeScript
- `npm run start` - Executar em produção
- `npm run dev` - Executar em desenvolvimento
- `npm run typecheck` - Verificar tipos TypeScript
- `npm run lint` - Executar ESLint
- `npm run lint:fix` - Corrigir problemas de linting
- `npm run test` - Executar testes
- `npm run db:generate` - Gerar cliente Prisma
- `npm run db:migrate` - Executar migrações
- `npm run db:push` - Push schema para banco
- `npm run db:studio` - Abrir Prisma Studio

## 📈 Monitoramento e Logs

- Logs estruturados com Winston
- Health check endpoint: `GET /health`
- Métricas de performance
- Logs de auditoria para ações sensíveis

## � Docker Compose (Desenvolvimento)

A aplicação inclui um `docker-compose.yml` com PostgreSQL, Redis e pgAdmin.

### Iniciar Stack Docker

```bash
# Navegar para o diretório backend
cd backend

# Iniciar todos os serviços
docker-compose up -d

# Acompanhar logs
docker-compose logs -f

# Parar serviços
docker-compose down

# Parar e remover volumes
docker-compose down -v
```

### Serviços Disponíveis

- **PostgreSQL**: `localhost:5432`
  - User: `finqz_user` (configurável em `.docker.env`)
  - Password: `finqz_password`
  - Database: `finqz_pro`

- **Redis**: `localhost:6379`
  - Password: `redis_password`

- **pgAdmin**: `http://localhost:5050`
  - Email: `admin@finqz.com`
  - Password: `admin123`

### Configuração do Banco

Após iniciar o Docker Compose:

```bash
# 1. Criar migrations
npm run db:migrate

# OU sincronizar schema (desenvolvimento)
npm run db:push

# 2. Popular banco (opcional)
npm run db:seed

# 3. Abrir Prisma Studio para visualizar dados
npm run db:studio
```

### Troubleshooting

**PostgreSQL não inicia:**
```bash
# Remover volumes e reconstruir
docker-compose down -v
docker-compose up -d postgres
```

**Erro de porta em uso:**
```bash
# Encontrar processo usando a porta
lsof -i :5432

# Ou mudar a porta em docker-compose.yml
```

## 🔄 Próximos Passos para Migrations

### Fase 1: Core Infrastructure ✅
- [x] Estrutura de diretórios
- [x] Configuração Express
- [x] Sistema de logging
- [x] Conexão PostgreSQL
- [x] Schema Prisma inicial
- [x] Middlewares de segurança
- [x] Tratamento de erros

### Fase 2: Authentication & Authorization
- [x] JWT authentication
- [ ] Role-based permissions
- [ ] User registration
- [ ] Password reset flow

### Fase 3: Core Modules
- [ ] Users management
- [ ] CRM (Leads)
- [ ] Partners management
- [ ] Proposals
- [ ] Commissions

### Fase 4: Advanced Features
- [ ] File uploads
- [ ] Email notifications
- [ ] Real-time updates (WebSocket)
- [ ] API rate limiting avançado
- [ ] Audit trails

### Fase 5: Banking Integrations
- [ ] Credit check APIs
- [ ] Banking data synchronization
- [ ] Payment processing
- [ ] Compliance checks

### Fase 6: Analytics & Reporting
- [ ] Dashboard data
- [ ] Financial reports
- [ ] Performance metrics
- [ ] Export functionality

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença UNLICENSED - propriedade da FINQZ PRO.

## 📞 Suporte

Para suporte técnico, entre em contato com a equipe de desenvolvimento da FINQZ PRO.