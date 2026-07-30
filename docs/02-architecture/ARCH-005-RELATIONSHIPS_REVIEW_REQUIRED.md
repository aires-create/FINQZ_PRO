# 03 - Relacionamentos

Status: DRAFT
Version: 0.2
Last Updated: 2026-06-03

## Introdução

Revisão dos relacionamentos do FINQZ PRO para alinhar o modelo à arquitetura oficial consolidada. O foco é documentar as fronteiras de domínio, ownership de fonte de verdade e escopo Tenant/Partner.

## Objetivo

Substituir a visão centrada em `Lead → Customer → Opportunity → BankProposal → Commission` pelo modelo oficial:

`Customer → Opportunity → Estrutura Comercial → CommercialTable → Provider → Pipeline → Simulation → Operation → Commission`

## Fonte de Verdade e Ownership

- `Customer` é a fonte oficial de verdade para a pessoa atendida.
- `Opportunity` é a entidade central do negócio.
- `Estrutura Comercial` é o Catálogo Mestre.
- `CommercialTable` representa condições comerciais, não catálogo.
- `Provider` fornece condições, simulação, propostas, esteiras e pagamentos.
- `Pipeline` organiza o fluxo de oportunidades.
- `Simulation` calcula viabilidade e não substitui Opportunity.
- `Commission` depende de operação concluída.

## Relacionamentos Principais

### Tenant → Organization → User
- Um **Tenant** contém múltiplas **Organizations**.
- Cada **User** pertence a uma Organização no mesmo Tenant.
- Esse modelo garante isolamento multi-tenant.

### Tenant → Role / Permission
- Um **Tenant** define seus **Roles** e **Permissions**.
- Roles são atribuídos a Users.
- Permissions controlam o acesso a domínios e operações.

### Customer → Opportunity
- Um **Customer** pode ter múltiplas **Opportunities**.
- O Customer é o ponto de verdade para o atendido.
- Esse relacionamento é 1:N e é a base central do modelo.

### Opportunity → Estrutura Comercial
- Uma **Opportunity** referencia a **Estrutura Comercial** através da hierarquia oficial:
  - Vertical → Product → Subproduct → Modality
- A Estrutura Comercial é o Catálogo Mestre, não o `CommercialTable`.

### Opportunity → CommercialTable
- A **Opportunity** usa uma **CommercialTable** para condições específicas.
- A CommercialTable depende da Estrutura Comercial e do Provider.

### Opportunity → Provider
- Um **Opportunity** está associada a um **Provider** quando há oferta ou proposta.
- O Provider não é produto nem catálogo.

### Provider → CommercialTable / Simulation / BankProposal / Operation
- O **Provider** fornece condições comerciais (`CommercialTable`).
- O **Provider** produz ou suporta **Simulation**.
- O **Provider** é responsável por **BankProposal** e pelo ciclo de **Operation** em cenários financeiros.

### Opportunity → Pipeline / Stage
- A **Opportunity** pertence a um **Pipeline**.
- O **Pipeline** organiza o fluxo; não substitui a Opportunity.
- Cada **Stage** define posição, probabilidade e lógica de transição.

### Opportunity → Simulation
- A **Simulation** associa-se a uma Opportunity para avaliar viabilidade.
- A simulação é um artefato de apoio, não o objeto central.

### Opportunity → Operation → Commission
- Uma **Opportunity** pode originar uma **Operation**.
- A **Commission** depende de uma operação concluída e da oportunidade associada.
- Comissão é um resultado financeiro, não o objeto central.

### Partner Scope
- **Partner** define escopo de visibilidade para Customer, Opportunity e Operation.
- Usuários devem ver dados apenas do partner e seus descendentes.
- `partnerId` em entidades operacionais é o filtro principal de visibilidade.

### Lead como entidade de apoio
- **Lead** representa contato inicial ou prospect.
- Funciona como etapa de qualificação e entrada de dados.
- Não é a fonte de verdade central; o Customer assume esse papel.

## Escopo Tenant

- `tenantId` deve existir em todas as entidades operacionais e de segurança.
- Consultas e relacionamentos devem ser sempre filtrados por `tenantId`.
- O modelo não deve permitir vazamento de dados entre tenants.

## Escopo Partner

- O partner define limites comerciais dentro do tenant.
- Hierarquia de Partner (`parentPartnerId`) modela franquias, sub-distribuidores e unidades regionais.
- Visibilidade de dados financeiros e comerciais deve ser validada no backend.

## Ownership de Domínio

- Clientes: `Customer`
- Parceiros: `Partner`
- Catálogo Mestre: `Estrutura Comercial`
- Condições: `CommercialTable`
- Fornecedores: `Provider`
- Fluxo: `Pipeline`, `Stage`
- Central de negócio: `Opportunity`
- Viabilidade: `Simulation`
- Operação: `Operation`
- Resultado financeiro: `Commission`
- Apóio de qualificação: `Lead`

## Diagramas Conceituais

### Modelo oficial simplificado

```
Customer
  └─ Opportunity
       ├─ Estrutura Comercial (Vertical → Product → Subproduct → Modality)
       ├─ CommercialTable
       ├─ Provider
       ├─ Pipeline → Stage
       ├─ Simulation
       ├─ Operation
       └─ Commission
```

### Controle de escopo por Tenant e Partner

```
Tenant
 ├─ Organization
 │   └─ User
 ├─ Role
 ├─ Permission
 ├─ Partner
 │   └─ Partner (sub-hierarquia)
 ├─ Customer
 ├─ Opportunity
 ├─ CommercialTable
 ├─ Provider
 ├─ Pipeline
 └─ Commission
```

## Observações de Implementação

- Definir chaves estrangeiras explícitas para rastreio.
- Usar `tenantId` em todas as consultas e relacionamentos.
- Validar escopo de partner no backend.
- Não tratar Provider como produto, Pipeline como Opportunity, Simulation como Opportunity ou Commission como Opportunity.
- Manter o Catálogo Mestre em `Estrutura Comercial` e não em domínios legados de produtos.
