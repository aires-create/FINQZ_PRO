# ADR-008 — Revenue Distribution Engine

## Status

Proposed

## Version

0.1

## Last Updated

2026-06-09

---

## Context

O FINQZ PRO opera como plataforma SaaS multi-tenant para CRM, gestão comercial, distribuição de produtos financeiros, operações e relacionamento com parceiros comerciais.

A arquitetura oficial já estabelece:

* Opportunity como entidade central do negócio;
* Estrutura Comercial como Catálogo Mestre;
* CommercialTable como responsável por condições comerciais;
* Provider como origem de condições, propostas e operações;
* Partner como estrutura de distribuição comercial.

As auditorias realizadas identificaram que o domínio de comissionamento atualmente documentado é insuficiente para suportar a visão estratégica do produto.

O FINQZ PRO deve suportar:

* múltiplas árvores comerciais por tenant;
* diferentes políticas de repasse;
* distribuição hierárquica de receita;
* colaboradores internos;
* canais comerciais;
* campanhas;
* bônus;
* cashback;
* novos modelos de distribuição que possam surgir no futuro.

O sistema necessita de um modelo único e extensível de distribuição financeira capaz de evoluir sem refatorações estruturais ou criação de domínios paralelos.

---

## Problem

O conceito tradicional de comissão não representa adequadamente o modelo operacional do FINQZ PRO.

Exemplos de cenários suportados pelo negócio:

* Provider paga 10% de comissão bruta.
* Master A recebe política de repasse de 85%.
* Master B recebe política de repasse de 80%.
* Master C recebe política de repasse de 50%.
* Colaboradores internos podem receber participação específica.
* Canais B2B e B2C podem possuir remuneração própria.
* Campanhas podem gerar pagamentos adicionais.
* Bônus podem ser aplicados por metas e performance.
* Cashback pode ser distribuído conforme regras comerciais.

Modelar apenas o conceito de Commission gera forte acoplamento e cria risco futuro de duplicidades, versões paralelas e regras distribuídas pelo sistema.

---

## Decision

O FINQZ PRO adotará oficialmente o conceito de:

**Revenue Distribution Engine**

como domínio responsável por toda distribuição financeira derivada de operações e receitas.

A comissão passa a ser apenas um dos componentes do motor de distribuição.

---

## Revenue Flow

Fluxo conceitual oficial:

```txt
Provider
    ↓
Commercial Table
    ↓
Gross Commission
    ↓
FINQZ Retention
    ↓
Distributable Pool
    ↓
Distribution Rules
    ↓
Beneficiaries
```

---

## Gross Commission

A comissão bruta representa o valor financeiro originado pela operação junto ao Provider.

Exemplo:

```txt
Provider paga 10%
```

A comissão bruta é a origem do processo de distribuição financeira.

---

## FINQZ Retention

Antes de qualquer distribuição, a FINQZ poderá reter parte da comissão bruta conforme regras comerciais.

Exemplo:

```txt
Comissão Bruta: 10%

Repasse autorizado: 85%

Pool distribuível: 8,5%
Retenção FINQZ: 1,5%
```

A arquitetura não deve assumir percentuais fixos.

---

## Distributable Pool

O Pool Distribuível representa o montante efetivamente disponível para distribuição.

Exemplos válidos:

```txt
85%
80%
50%
100%
```

A regra de cálculo deve ser configurável.

---

## Beneficiaries

O motor de distribuição não será limitado a parceiros.

Beneficiários podem incluir:

* Partners;
* Internal Collaborators;
* Sales Channels;
* Campaign Programs;
* Bonus Programs;
* Cashback Programs.

Novos tipos de beneficiários poderão ser adicionados futuramente sem alteração estrutural da arquitetura.

---

## Partner Hierarchy

O FINQZ PRO utiliza uma estrutura hierárquica comercial.

Modelo conceitual:

```txt
Partner
 └─ Partner
      └─ Partner
           └─ Partner
```

A arquitetura não será limitada a níveis fixos.

A operação inicial poderá limitar a profundidade utilizada, porém a estrutura deve permanecer preparada para expansão futura.

Níveis como:

```txt
Master
Franquia
Franqueado
```

representam apenas uma configuração operacional inicial e não uma limitação arquitetural.

---

## Multiple Commercial Trees

Um Tenant pode possuir múltiplas árvores comerciais independentes.

Exemplo:

```txt
Tenant

├─ Master A
│   ├─ Franquia A
│   └─ Franqueado A

├─ Master B
│   ├─ Franquia B
│   └─ Franqueado B

└─ Master C
```

Não existe limitação para existência de apenas um Master por Tenant.

---

## Distribution Rules

As regras de distribuição devem ser configuráveis.

Exemplos:

```txt
Master A → 85%
Master B → 80%
Master C → 50%
```

A arquitetura não deve assumir percentuais fixos nem estruturas rígidas.

---

## Split Distribution

O motor deve permitir distribuição hierárquica do Pool Distribuível.

Exemplo:

```txt
Pool Distribuível
    ↓
Master
    ↓
Franquia
    ↓
Franqueado
```

As regras de divisão devem ser configuráveis.

A arquitetura não deve assumir percentuais fixos para cada nível.

---

## Internal Collaborators

O motor deve suportar remuneração para colaboradores internos.

Exemplos:

```txt
Canal B2B
Canal B2C
Executivo Comercial
Gestor Regional
SDR
Closer
```

Colaboradores não devem ser tratados como Partners.

---

## Campaign Programs

O sistema deve suportar incentivos temporários.

Exemplos:

```txt
Campanha de Produto
Campanha Regional
Campanha de Provider
Campanha de Produção
```

Campanhas podem gerar remuneração adicional independente da comissão base.

---

## Bonus Programs

O sistema deve suportar pagamentos adicionais por desempenho.

Exemplos:

```txt
Meta atingida
Volume produzido
Conversão mínima
Qualidade operacional
```

Bônus podem ser fixos ou variáveis.

---

## Cashback Programs

O sistema deve suportar cashback como mecanismo independente.

O cashback poderá ser direcionado a:

```txt
Partner
Customer
Channel
```

conforme regras futuras.

---

## Visibility Rules

Toda visualização financeira deve respeitar:

* tenantId;
* escopo do Partner;
* Role;
* Permission.

Nenhum beneficiário poderá visualizar informações financeiras fora do seu escopo autorizado.

---

## Future Domains

Este ADR habilita futuras definições de:

* ADR-009 — Partner Hierarchy Model
* ADR-010 — Distribution Domain Model
* ADR-011 — Financial Visibility Rules
* ADR-012 — Compensation Persistence Strategy

---

## Related Documents

* ARCH-001-DOMAIN_HIERARCHY_REVIEW_REQUIRED
* ARCH-004-ENTITIES_MODEL_REVIEW_REQUIRED
* ARCH-005-RELATIONSHIPS_REVIEW_REQUIRED
* ARCH-006-OPERATIONAL_RULES_REVIEW_REQUIRED
* ADR-004-commercial-master-catalog
* ADR-006-products-domain-decommission

---

## Non Goals

Este ADR não:

* cria tabelas Prisma;
* cria migrations;
* cria endpoints;
* cria DTOs;
* cria cálculos financeiros;
* cria regras fiscais;
* cria wallets;
* cria integrações bancárias;
* altera comportamento atual do sistema.

---

## Architectural Rule

**One Revenue Engine.**

**One Distribution Model.**

**One Source of Truth.**

O FINQZ PRO não deve criar domínios paralelos para distribuição financeira.

Não devem existir modelos independentes como:

```txt
CommissionV2
PartnerCommission
CampaignCommission
CashbackV2
BonusV2
```

Toda distribuição financeira deve ser centralizada no Revenue Distribution Engine.
