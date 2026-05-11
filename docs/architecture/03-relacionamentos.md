# 03 - Relacionamentos

## Objetivo

Documentar os relacionamentos entre entidades para garantir consistência de modelo, propriedade de dados e limites de integração.

## Relacionamentos Principais

### Tenant → Organization → User
- Um **Tenant** contém múltiplas **Organizations**.
- Cada **User** pertence a uma única **Organization** dentro do tenant.
- Esse modelo permite isolação e delegação de administração.

### Tenant → Role / Permission
- Um **Tenant** define seus **Roles** e **Permissions**.
- Roles são atribuídos a usuários.
- Permissions são usadas por módulos de CRM, financeiro e administrativo.

### Partner Hierarchy
- Um **Partner** pode ter um **parentPartnerId**.
- Isso modela franquias, sub-distribuidores e unidades regionais.
- A visibilidade de dados de vendas deve respeitar essa hierarquia.

### Lead → Customer
- Um **Lead** pode ser convertido para **Customer**.
- A conversão deve manter histórico e associar o `leadId` ao `customerId`.
- O modelo deve evitar duplicidade de dados.

### Customer → Opportunity
- Um **Customer** pode ter múltiplas **Opportunities**.
- O relacionamento é 1:N.
- O cliente é o centro da negociação em CRM enterprise.

### Lead → Opportunity
- Um **Lead** pode iniciar múltiplas **Opportunities** antes de se tornar cliente.
- Permite capturar negócio em fase inicial.

### Opportunity → Pipeline / Stage
- A **Opportunity** pertence a um **Pipeline**.
- Cada pipeline define ordens e probabilidades por **Stage**.
- A movimentação de estágio deve registrar transição para auditoria.

### Opportunity → Activity
- Uma **Opportunity** pode ter muitas **Activities**.
- Activities capturam ações de follow-up, reuniões e tarefas.
- A ligação pode usar `relatedEntityId` para generalizar.

### Opportunity → BankProposal
- Uma **Opportunity** pode gerar múltiplas **BankProposals**.
- Esse relacionamento suporta cenários de múltiplas ofertas de crédito.

### BankProposal → Commission
- Uma **BankProposal** gera cálculo de **Commission**.
- A comissão está ligada a parceiro e usuário responsáveis.

## Relacionamentos de Escopo

### Partner → Lead / Customer / Opportunity
- Partners devem ter visibilidade controlada sobre Leads e Opportunities.
- Usuários de um partner devem ver somente o escopo do próprio partner e descendentes.
- Regra de escopo: `partnerId` em entidades operacionais deve ser usada como filtro principal.

### User Ownership
- `createdById`: usuário que criou o registro.
- `ownerId`: usuário responsável pelo seguimento do negócio.
- `partnerId`: define o escopo comercial.

## Diagramas Conceituais

### Fluxo de Vendas Simplificado

```
Lead -> Customer -> Opportunity -> BankProposal -> Commission
```

### Controle de Escopo por Tenant

```
Tenant
 ├─ Organization
 │   └─ User
 ├─ Role
 ├─ Permission
 ├─ Partner
 │   └─ Partner (sub-level)
 ├─ Lead
 ├─ Customer
 └─ Opportunity
```

## Observações de Implementação

- Sempre definir chaves estrangeiras explícitas para rastreio.
- Use `tenantId` em todas as consultas para evitar vazamento de dados.
- Relacionamentos de partner devem ser validados em backend, não apenas em frontend.
- Os fluxos de conversão devem manter histórico de origem para auditoria e custo de aquisição.
