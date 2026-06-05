# 07 - RBAC

Status: DRAFT
Version: 0.3
Last Updated: 2026-06-03

## Objetivo

Estabelecer o modelo de controle de acesso baseado em roles e permissões para o FINQZ PRO. O foco é suportar operações SaaS financeiras e CRM enterprise com granularidade e escalabilidade.

## Princípios de RBAC

- **Backend-first**: checks de autorização são obrigatórios no backend.
- **Permission-based**: roles são coleções de permissões, não regras de negócio.
- **Tenant-scoped**: permissões existem dentro do contexto do tenant.
- **Partner-aware**: escopo de dados deve respeitar a hierarquia de parceiros.
- **Least privilege**: usuários recebem apenas o mínimo necessário.

## Hierarquia oficial de autorização

A autorização deve ser avaliada seguindo a hierarquia oficial de domínio do FINQZ PRO:

- `Tenant`
- `FINQZ / Matriz`
- `Partner Master`
- `Franquia`
- `Franqueado`
- `Usuário`

### Tenant

- Responsável pelo isolamento de tenants e pela segurança global do sistema.
- Valida `tenantId` em todas as operações.
- Garante que roles, permissões e dados não vazem entre tenants.

### FINQZ / Matriz

- Visão global do tenant.
- Supervisão dos parceiros e da estratégia comercial do FINQZ.
- Permissão institucional sobre políticas, monitoramento e governança.

### Partner Master

- Visão do parceiro e de seus descendentes.
- Controle de franquias, escopo comercial e visibilidade de dados hierárquicos.
- Deve acessar clientes, oportunidades e operações dentro do seu universo.

### Franquia

- Visão da franquia e dos seus descendentes.
- Gestão operacional local de oportunidades, pipeline e execução.
- Acesso restrito ao escopo da unidade e seus filhos.

### Franqueado

- Visão da própria operação.
- Criação e gestão de oportunidades, clientes e simulações dentro do seu escopo.
- Não tem acesso global a outros parceiros ou franquias.

### Usuário

- Permissões aplicadas conforme ownership e RBAC.
- O usuário herda o escopo do seu partner e o conjunto de roles atribuídas.

## Authorization Evaluation Order

A autorização deve ser avaliada em ordem formal:

1. `Tenant Scope`
2. `Partner Scope`
3. `Ownership Scope`
4. `Permission Check`

Possuir permissão não garante visibilidade. A ordem formal garante que a permissão só seja considerada se o escopo estiver válido.

Exemplo:

- Permissão válida
- Escopo inválido
- = Acesso negado

## Partner Scope

O Partner Scope deve ser formalizado pela hierarquia de visibilidade:

- `FINQZ / Matriz` → visão global do tenant
- `Partner Master` → visão dos descendentes do parceiro
- `Franquia` → visão dos descendentes da franquia
- `Franqueado` → visão da própria operação
- `Usuário` → acesso conforme ownership e RBAC

Esta definição reforça que cada nível tem escopo diferente, mesmo quando a permissão em si está presente.

## Ownership Scope

Ownership Scope deve explicar claramente os atributos de propriedade e visibilidade:

- `createdById`: quem criou o recurso.
- `ownerId`: quem é responsável pelo recurso.
- `partnerId`: a unidade de parceiro à qual o recurso pertence.
- `tenantId`: o tenant que agrupa o recurso.

O modelo deve explicar:

- quem criou
- quem é responsável
- quem pode visualizar
- quem pode assumir

Por exemplo, um recurso pode ser criado por um usuário de franquia (`createdById`), pertencer a essa franquia (`partnerId`) e ser visível para o `Partner Master` desse ramo, mas não para outras franquias.

## Elementos do Modelo

### Role
- Identificador de perfil funcional.
- Pode ser customizado por tenant.

### Permission
- Unidade atômica de acesso.
- Associada a ações ou módulos.
- Deve ser nomeada de forma consistente: `{module}_{action}`.

### Role Assignment
- Um usuário pode ter múltiplas roles.
- A união de permissões de todas as roles define o acesso final.

## Módulos Principais e Permissões Exemplo

### Clientes
- `customer_read`
- `customer_write`
- `customer_contact_manage`
- `customer_kyc_view`
- `customer_kyc_update`

### Estrutura Comercial
- `commercial_catalog_read`
- `commercial_catalog_manage`
- `commercial_product_read`
- `commercial_product_manage`
- `commercial_modality_read`
- `commercial_modality_manage`

### Tabelas Comerciais
- `commercial_table_read`
- `commercial_table_manage`
- `commercial_condition_read`
- `commercial_condition_manage`

### Providers
- `provider_read`
- `provider_manage`
- `provider_integration_read`
- `provider_integration_manage`

### Oportunidades
- `opportunity_read`
- `opportunity_write`
- `opportunity_stage_change`
- `opportunity_pipeline_read`

### Pipeline
- `pipeline_read`
- `pipeline_manage`
- `stage_read`
- `stage_manage`

### Simulação
- `simulation_read`
- `simulation_run`
- `simulation_manage`

### Operações
- `operation_read`
- `operation_manage`
- `operation_execute`

### Comissões
- `commission_read`
- `commission_manage`
- `commission_payment_view`

### Governança
- `tenant_manage`
- `user_manage`
- `role_manage`
- `permission_manage`
- `audit_read`
- `audit_manage`

## Papéis Recomendados

### Tenant Admin
- Acesso completo dentro do tenant.
- Pode gerenciar usuários, roles, permissões, configuração e relatórios.
- Permissões: administração completa + leitura/escrita de todos os domínios.

### FINQZ Matriz
- Visão global do tenant.
- Supervisão e governança institucional.
- Permissões de monitoramento e auditoria.

### Partner Master
- Gestão da hierarquia de parceiro mestre e franquias.
- Controla visibilidade de clientes, oportunidades e operações no escopo de parceiro.
- Permissões: `partner_*`, `customer_read`, `opportunity_read`, `pipeline_read`, `audit_read`.

### Franquia
- Gestão operacional de uma unidade de parceiro.
- Monitora oportunidades e execuções de negócio dentro da franquia.
- Permissões: `customer_read`, `opportunity_read`, `opportunity_write`, `pipeline_read`, `commission_read`.

### Franqueado
- Acesso comercial limitado ao escopo da unidade.
- Pode criar e gerenciar oportunidades e interagir com clientes.
- Permissões: `customer_read`, `opportunity_read`, `opportunity_write`, `simulation_run`.

### Comercial
- Foco em gestão de oportunidades e condições comerciais.
- Trabalha com Estrutura Comercial, Tabelas Comerciais e Providers.
- Permissões: `commercial_catalog_read`, `commercial_table_read`, `provider_read`, `opportunity_read`, `opportunity_write`.

### Operador
- Execução das operações e follow-up de ciclo.
- Trabalha com Pipeline, Stage, Operation e Simulation.
- Permissões: `opportunity_read`, `pipeline_read`, `operation_execute`, `simulation_read`.

### BKO
- Backoffice operacional e suporte de execução.
- Analisa oportunidades e operações, mas não gerencia estrutura comercial.
- Permissões: `opportunity_read`, `operation_manage`, `commission_read`, `audit_read`.

### Compliance
- Verificação de conformidade e auditoria de governança.
- Acesso a logs, permissões e relatórios de risco.
- Permissões: `audit_read`, `audit_manage`, `permission_manage`, `customer_kyc_view`, `operation_read`.

### Financeiro
- Gestão de comissões, propostas e fluxo financeiro.
- Trabalha com operações concluídas e relatórios financeiros.
- Permissões: `commission_manage`, `commission_read`, `operation_read`, `provider_read`.

## Escopo de Permissão

- As permissões devem ser avaliadas no contexto do tenant e do partner.
- Permissão global de tenant não deve conceder acesso a dados de outro partner dentro do mesmo tenant.
- Permissões de partner podem ser limitadas a sub-hierarquias.

## Tenant Scope

- Todas as permissões são definidas dentro do contexto do tenant.
- `tenantId` deve ser verificado em cada operação para evitar vazamento de dados entre tenants.
- Roles e permissões não devem delegar acesso fora do tenant.

## Partner Scope

- O partner define o escopo de visibilidade para `Customer`, `Opportunity`, `Operation` e `Commission`.
- A hierarquia de parceiros (`parentPartnerId`) deve ser considerada ao avaliar acesso.
- Permissões de partner devem permitir apenas dados do parceiro e seus descendentes.

## Ownership Scope

- `createdById`: quem criou o recurso.
- `ownerId`: quem é responsável pelo recurso.
- `partnerId`: a unidade de parceiro à qual o recurso pertence.
- `tenantId`: o tenant que agrupa o recurso.

## Serviços e Domínios

- `Customer` pertence ao domínio Clientes e é a fonte oficial de verdade para pessoas atendidas.
- `Estrutura Comercial` é a fonte oficial para catálogo mestre.
- `CommercialTable` pertence ao domínio de condições comerciais e depende de `Estrutura Comercial` e `Provider`.
- `Opportunity` é a entidade central de negócio; suas permissões definem acesso operacional.
- `Pipeline`, `Simulation`, `Operation` e `Commission` pertencem ao fluxo operacional e financeiro.

## Providers

- Provider não é Produto.
- Provider não é Catálogo Mestre.
- Provider não é Source of Truth comercial.

## Domínios Congelados

- Conversas
- Campanhas
- Audiências
- Eventos
- SDR IA

Nenhuma role ou permission nova deve ser criada para estes domínios sem ADR explícita.

## Regras de Implementação

1. **Sempre valide permissions no backend**.
2. **Nunca use UI como fonte de verdade**.
3. **Audite mudanças de roles e permissions**.
4. **Use roles padrões para onboarding rápido**.
5. **Permissões devem ser definidas por módulo e não por entidade isolada**.

## Matriz de Permissões - Exemplo

| Role | Customers | Commercial | Tables | Providers | Opportunities | Pipeline | Operations | Commissions | Governance |
|------|-----------|------------|--------|-----------|---------------|----------|------------|-------------|------------|
| Tenant Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| FINQZ Matriz | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Partner Master | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Franquia | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Franqueado | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Comercial | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Operador | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| BKO | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Compliance | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Financeiro | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |

## Observações

- RBAC deve ser tratado como parte da arquitetura oficial, não como feature adicional.
- A governança de roles e permissions é crítica para manter segurança e conformidade em ambientes multi-tenant.
- A modelagem deve permitir extensões sem exigir mudanças na base de roles.
