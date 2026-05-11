# 07 - RBAC

## Objetivo

Estabelecer o modelo de controle de acesso baseado em roles e permissões para o FINQZ PRO. O foco é suportar operações SaaS financeiras e CRM enterprise com granularidade e escalabilidade.

## Princípios de RBAC

- **Backend-first**: checks de autorização são obrigatórios no backend.
- **Permission-based**: roles são coleções de permissões, não regras de negócio.
- **Tenant-scoped**: permissões existem dentro do contexto do tenant.
- **Partner-aware**: escopo de dados deve respeitar a hierarquia de parceiros.
- **Least privilege**: usuários recebem apenas o mínimo necessário.

## Elementos do Modelo

### Role
- Identificador de perfil funcional.
- Exemplo: `admin`, `sales_rep`, `partner_manager`, `finance_analyst`, `support`.
- Pode ser customizado por tenant.

### Permission
- Unidade atômica de acesso.
- Associada a ações ou módulos.
- Deve ser nomeada de forma consistente: `{module}_{action}`.

### Role Assignment
- Um usuário pode ter múltiplas roles.
- A união de permissões de todas as roles define o acesso final.

## Módulos Principais e Permissões Exemplo

### CRM
- `crm_lead_read`
- `crm_lead_write`
- `crm_customer_read`
- `crm_customer_write`
- `crm_opportunity_read`
- `crm_opportunity_write`
- `crm_activity_log`

### Financeiro
- `finance_proposal_read`
- `finance_proposal_write`
- `finance_commission_read`
- `finance_commission_manage`

### Parceiros
- `partner_read`
- `partner_write`
- `partner_scope_manage`

### Administração
- `tenant_manage`
- `user_manage`
- `role_manage`
- `permission_manage`
- `audit_read`

## Papéis Recomendados

### Tenant Admin
- Acesso completo dentro do tenant.
- Pode gerenciar usuários, roles, permissões, configuração e relatórios.
- Permissões: todas as permissões de administração + leitura/escrita de CRM e financeiro.

### Sales Representative
- Acesso a leads, opportunities, customers e activities.
- Permissão para criar e atualizar oportunidades.
- Sem acesso a configuração de tenant ou relatórios financeiros sensíveis.

### Partner Manager
- Acesso à gestão de parceiros e visibilidade do pipeline do partner.
- Pode aprovar atividades e acompanhar métricas do parceiro.
- Não gerencia usuários globais do tenant.

### Financial Analyst
- Visualização de propostas e comissões.
- Pode gerar relatórios financeiros.
- Não altera dados de leads ou configurações de partner.

### Support
- Acesso de leitura a registros operacionais para atendimento.
- Sem permissão de escrita em operações financeiras.

## Escopo de Permissão

- As permissões devem ser avaliadas no contexto do tenant e do partner.
- Permissão global de tenant não deve conceder acesso a dados de outro partner dentro do mesmo tenant.
- Permissões de partner podem ser limitadas a sub-hierarquias.

## Regras de Implementação

1. **Sempre valide permissions no backend**.
2. **Nunca use UI como fonte de verdade**.
3. **Audite mudanças de roles e permissions**.
4. **Use roles padrões para onboarding rápido**.
5. **Permissões devem ser definidas por módulo e não por entidade isolada**.

## Matriz de Permissões - Exemplo

| Role | CRM Read | CRM Write | Finance Read | Finance Manage | Partner Manage | Tenant Admin |
|------|----------|-----------|--------------|----------------|----------------|--------------|
| Tenant Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sales Rep | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Partner Manager | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Financial Analyst | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Support | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |

## Observações

- RBAC deve ser tratado como parte da arquitetura oficial, não como feature adicional.
- A governança de roles e permissions é crítica para manter segurança e conformidade em ambientes multi-tenant.
- A modelagem deve permitir extensões sem exigir mudanças na base de roles.
