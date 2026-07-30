# ARCH-034 - Commission V2 Contracts Blueprint

## 1. Objetivo

Formalizar os contratos conceituais de `Commission V2` derivados do `ARCH-033`, mantendo a separacao correta entre dominio, calculo, auditoria e liquidacao posterior.

Este documento define o formato arquitetural futuro dos contratos de `Commission V2` sem criar schema, tabelas, migration, runtime ou qualquer implementacao tecnica. O objetivo e transformar o blueprint de dominio em um conjunto de contratos conceituais governados por:

- `ADR-008 - Revenue Distribution Engine`;
- `ARCH-033 - Commission V2 Domain Blueprint`;
- `ARCH-031 - Settlement Domain Blueprint`;
- `Operation` como origem elegivel;
- `Settlement` e `Payment` como fases posteriores e separadas.

## 2. Escopo

Este documento cobre apenas os contratos conceituais futuros de `Commission V2`.

Inclui:

- `Commission Aggregate Contract`;
- `Commission Rule Contract`;
- `Commission Beneficiary Contract`;
- `Commission Allocation Contract`;
- `Commission Audit Contract`;
- `Commission Event Contract`;
- `Commission Lifecycle Contract`;
- relationship matrix;
- invariants;
- auditability rules;
- decision record;
- next recommended phase.

Nao inclui:

- definicao de schema;
- definicao de campos Prisma;
- definicao de tabelas;
- definicao de migrations;
- definicao de codigo;
- definicao de TypeScript;
- definicao de runtime;
- definicao de endpoints, services, handlers ou repositories;
- definicao de implementacao de `Settlement` ou `Payment`.

## 3. Commission Aggregate Contract

O `Commission Aggregate Contract` representa o contrato conceitual do agregado de comissao futura.

### 3.1 Identidade

A identidade conceitual da comissao futura deve ser univoca, rastreavel e apropriada ao tenant.

Regras conceituais:

- cada comissao deve possuir identidade propria;
- a identidade deve ser distinguivel de `Operation`;
- a identidade deve suportar auditoria e correlacao;
- a identidade nao deve ser derivada apenas de `Settlement` ou `Payment`.

### 3.2 Tenant

`Commission V2` deve ser tenant-scoped.

Regras conceituais:

- toda comissao pertence a um tenant;
- isolamentos entre tenants devem ser mantidos;
- auditoria, calculo e leitura devem respeitar o tenant de origem;
- nenhum contrato deve pressupor visibilidade cross-tenant.

### 3.3 Origem Operation

`Operation` e a origem elegivel do agregado de comissao.

Regras conceituais:

- a comissao nasce de uma `Operation` elegivel;
- a origem precisa ser rastreavel;
- a comissao nao substitui a operacao;
- a comissao nao altera o lifecycle de `Operation`.

### 3.4 Lifecycle

O agregado conceitual deve seguir o lifecycle definido em `ARCH-033`.

Fluxo minimo:

```text
pending -> calculated -> validated -> released
```

`released` e o estado terminal conceitual minimo do agregado.

## 4. Commission Rule Contract

O `Commission Rule Contract` representa as regras conceituais que governam calculo e distribuicao.

### Regras de distribuicao

As regras devem suportar:

- comissao bruta FINQZ;
- retenção FINQZ;
- pool distribuivel;
- split hierarquico;
- bonus;
- cashback;
- campanhas;
- canais;
- colaboradores;
- compatibilidade com politicas comerciais.

### Vinculo com Commercial Table

`CommercialTable` continua sendo uma referencia de parametrizacao comercial.

Regras conceituais:

- a tabela comercial pode influenciar taxas, elegibilidade e condicoes;
- a tabela comercial nao e a fonte final da verdade da distribuicao;
- o contrato de comissao deve aceitar insumos vindos da tabela comercial sem confundir essa origem com o resultado financeiro final;
- o contrato deve permanecer extensivel a novas regras sem ruptura estrutural.

## 5. Commission Beneficiary Contract

O `Commission Beneficiary Contract` define os beneficiarios possiveis da distribuicao.

### Beneficiarios previstos

- `Partner`
- `Colaborador`
- `Canal`
- `Campanha`
- `Cashback`
- `Bônus`

### Regras conceituais

- um beneficiario precisa ser identificavel;
- um beneficiario pode receber parcelas distintas;
- um mesmo conjunto de regras pode contemplar mais de um tipo de beneficiario;
- o contrato deve suportar hierarquia de parceiros e distribuicao por regras compostas;
- o contrato deve ser neutro em relacao ao provedor de payout.

## 6. Commission Allocation Contract

O `Commission Allocation Contract` representa a parcela distribuida e seu vinculo com o beneficiario.

### Regras conceituais

- toda alocacao deve representar uma parcela da distribuicao;
- toda alocacao deve apontar para um beneficiario;
- toda alocacao deve ser rastreavel ao tenant e a operacao de origem;
- o contrato deve suportar leitura analitica, auditoria e conciliacao futura;
- uma mesma comissao pode resultar em multiplas alocacoes.

### Leitura arquitetural

Alocacao nao e pagamento. Alocacao e a divisao conceitual da distribuicao financeira.

## 7. Commission Audit Contract

O `Commission Audit Contract` define a trilha conceitual de auditoria do dominio.

### Regras oficiais

- toda decisao relevante de comissao deve ser auditavel;
- o contrato deve permitir reconstruir por que um valor foi calculado;
- o contrato deve permitir reconstruir por que um valor foi retido;
- o contrato deve permitir reconstruir por que um valor foi alocado;
- o contrato deve ser compatível com imutabilidade append-only conceitual;
- o contrato deve ser correlacionavel com `Operation`, tenant, ator e contexto.

### Conteudo conceitual esperado

- origem da operacao;
- base de calculo;
- retenção aplicada;
- pool distribuivel;
- beneficiario;
- regra aplicada;
- estado da comissao;
- autor ou agente;
- correlacao;
- motivo de ajuste ou reversao quando houver.

## 8. Commission Event Contract

O `Commission Event Contract` define a linguagem de eventos conceituais do dominio.

### Eventos previstos

- `CommissionCalculated`
- `CommissionValidated`
- `CommissionReleased`
- `CommissionAdjusted`
- `CommissionReversed`

### Regras conceituais

- eventos devem refletir mudanca real de estado ou decisao de negocio;
- eventos nao substituem o contrato de calculo;
- eventos nao substituem auditoria;
- eventos devem permanecer coerentes com `Operation` e com os dominios posteriores;
- eventos nao devem acoplar `Commission V2` a `Settlement` ou `Payment` como origem.

## 9. Commission Lifecycle Contract

O `Commission Lifecycle Contract` define a evolucao conceitual do dominio.

### Fluxo minimo

```text
pending -> calculated -> validated -> released
```

### Regras

- `pending`: a comissao ainda nao foi consolidada;
- `calculated`: a base de comissao foi apurada;
- `validated`: a calculacao foi conferida contra as regras;
- `released`: a comissao foi liberada para a etapa posterior.

### Terminalidade minima

`released` e o terminal conceitual minimo de `Commission V2`.

### Regra de acoplamento

`paid` nao pertence ao lifecycle de `Commission V2`. Pagamento pertence a `Payment` ou `Settlement`, conforme o contrato futuro adequado.

## 10. Relationship Matrix

### Operation

- `Operation` e a origem elegivel;
- `Operation` antecede `Commission`;
- `Operation` nao e substituida por `Commission`.

### Commission

- `Commission` deriva de `Operation` executada e valida;
- `Commission` organiza a distribuicao financeira;
- `Commission` nao executa liquidacao nem pagamento.

### Settlement

- `Settlement` consome a saida financeira da comissao;
- `Settlement` e posterior;
- `Settlement` nao faz parte do dominio de comissao.

### Payment

- `Payment` e posterior a `Settlement`;
- `Payment` nao deve ser confundido com liberação de comissao;
- `Payment` pertence a camada de repasse ou pagamento efetivo.

## 11. Invariants

Os invariantes conceituais de `Commission V2` sao:

- nao existe comissao sem `Operation` elegivel;
- nao existe distribuicao sem tenant;
- nao existe alocacao sem beneficiario;
- nao existe liberacao sem validacao da base calculada;
- nao existe pagamento como estado proprio da comissao;
- nao existe dependencia soberana em `BluePay`;
- nao existe settlement dentro do dominio de comissao;
- nao existe quebra da separacao entre calculo, liquidacao e pagamento;
- nao existe origem de verdade concorrente com `Operation`.

## 12. Auditability Rules

O dominio de `Commission V2` deve ser totalmente auditavel.

### Regras obrigatorias

- cada calculo deve ser reconstruivel;
- cada ajuste deve ser justificavel;
- cada reversao deve ser rastreavel;
- cada alocacao deve apontar para sua regra e beneficiario;
- cada decisao deve ser correlacionavel com `Operation`;
- cada trilha deve carregar tenant de origem;
- cada trilha deve ser append-only em conceito;
- auditoria nao deve ser usada como substituto do dominio.

## 13. Decision Record

### Decisao oficial

`Commission V2` tera contratos conceituais proprios para agregado, regra, beneficiario, alocacao, auditoria, evento e lifecycle, mantendo a separacao entre `Operation`, `Settlement` e `Payment`, e permanecendo independente de `BluePay`.

### Motivos

- o modulo atual de `commissions` foi classificado como legado/placeholder em `ARCH-032`;
- `ADR-008` exige um motor de distribuicao extensivel;
- `ARCH-033` definiu a forma conceitual do dominio;
- `ARCH-031` manteve `Settlement` como camada posterior;
- a evolucao precisa ser rastreavel, auditavel e tenant-scoped.

### Efeito arquitetural

- `Operation` permanece origem elegivel;
- `Commission V2` passa a ter contratos conceituais proprios;
- `Settlement` e `Payment` continuam separados;
- `BluePay` continua como provider de payout, nao dominio.

## 14. Next Recommended Phase

### Fase sugerida

`Commission V2 Conceptual Eventing and Audit Contracts`

### Objetivo da fase

Definir, em documento proprio, a relacao conceitual entre:

- eventos de comissao;
- audibilidade;
- reversoes;
- ajustes;
- conciliacao futura;
- e a fronteira com Settlement.

### Regra

Nenhuma implementacao deve comecar antes de os contratos conceituais serem aprovados como referencia oficial do dominio.
