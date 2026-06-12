# RFC-001 - Proposal Canonicalization

Status: Draft
Date: 2026-06-11
Owner: Architecture
Project: FINQZ PRO

---

## 1. Contexto

O FINQZ PRO possui hoje uma entidade persistida chamada `BankProposal` no schema, enquanto os contratos de workspace e arquitetura passam a referenciar o dominio de forma mais ampla como `Proposal`.

Na pratica, o sistema ja opera com proposta como artefato de negociacao entre simulacao, oportunidade, operacao e liquidacao. O problema atual nao e a inexistencia conceitual de Proposal, mas a divergencia entre:

- o nome conceitual desejado pelo dominio;
- a implementacao persistida existente;
- a semantica operacional do workspace;
- a necessidade de evitar duplicidade de modelos.

---

## 2. Decisao

O FINQZ PRO adota a seguinte normalizacao oficial:

- `Proposal` = nome conceitual do dominio;
- `BankProposal` = implementacao persistida atual.

Essa decisao preserva compatibilidade com o estado atual do sistema e evita a criacao de um segundo modelo concorrente para a mesma responsabilidade.

---

## 3. Por que nao criar model Proposal separado

Nao deve ser criado um model `Proposal` separado neste momento porque isso introduziria duplicidade de fonte de verdade para o mesmo conceito de negocio.

Motivos:

- o schema ja possui uma entidade de proposta persistida;
- o backend ja expõe superficie de proposal;
- o frontend ja produz e consome proposta como artefato de negocio;
- um novo model criaria risco de divergencia entre UI, dominio e persistencia;
- a migracao de dados e contratos aumentaria sem ganho funcional proporcional;
- o dominio precisa de canonicalizacao sem ruptura, nao de bifurcacao.

---

## 4. Campos atuais de BankProposal que ja atendem Proposal

Os campos atuais de `BankProposal` que ja cobrem o contrato basico de `Proposal` sao:

- `id`
- `proposalNumber`
- `title`
- `status`
- `amount`
- `interestRate`
- `term`
- `monthlyPayment`
- `totalCost`
- `kycStatus`
- `kycVerifiedAt`
- `kycExpireAt`
- `documents`
- `fees`
- `tenantId`
- `partnerId`
- `leadId`
- `customerId`
- `opportunityId`
- `createdById`
- `createdAt`
- `updatedAt`

Esses campos ja cobrem identificacao, contexto comercial, valores, prazo, custo, compliance, rastreabilidade e ownership operacional minimo.

---

## 5. Campos faltantes

Para que `Proposal` tenha um contrato mais completo e enterprise-ready, faltam os seguintes elementos conceituais:

- `description`
- `validUntil`
- `metadata`
- `providerId`
- `simulationId`
- `revision` ou `version`
- `sentAt`
- `approvedAt`
- `rejectedAt`
- `expiredAt`
- `currency`

Nem todos esses campos precisam existir imediatamente na persistencia, mas eles representam lacunas do contrato canônico de dominio.

---

## 6. Relacoes obrigatorias futuras

O contrato canônico de `Proposal` deve considerar as seguintes relacoes como obrigatorias no dominio, mesmo que algumas sejam opcionais na persistencia atual:

- `tenantId`
- `customerId`
- `opportunityId`
- `providerId`
- `simulationId` opcional
- `createdById`

### Regras

- `tenantId` e sempre obrigatorio;
- `createdById` e sempre obrigatorio;
- `customerId` deve existir quando a proposta estiver associada a identidade consolidada;
- `opportunityId` deve existir quando a proposta fizer parte de um fluxo comercial operacional;
- `providerId` deve existir quando a proposta representar oferta ou negociacao de provider especifico;
- `simulationId` e opcional, mas deve existir quando a proposta derivar de simulacao formal.

---

## 7. Lifecycle de Proposal

O lifecycle canônico de `Proposal` deve ser tratado como contrato de negocio e nao como detalhe de interface.

Lifecycle proposto:

```text
draft -> sent -> approved -> executed -> settled
```

Estados terminais ou de interrupcao:

```text
rejected -> cancelled -> expired -> failed
```

### Significado

- `draft`: proposta em construcao;
- `sent`: proposta formalizada e enviada;
- `approved`: proposta aceita ou validada;
- `executed`: proposta converteu-se em operacao ou base formal de execucao;
- `settled`: resultado financeiro ou operacional liquidado.

### Regra

O lifecycle da Proposal nao substitui o lifecycle da Operation. Ele o antecede e o alimenta.

---

## 8. Relacao com Operation

`Proposal` e um artefato de negociacao e formalizacao que antecede `Operation`.

### Regra canônica

- uma `Proposal` aprovada pode originar uma `Operation`;
- uma `Operation` nao deve depender de uma proposal sem contexto de aprovacao formal;
- `Operation` continua sendo o agregado financeiro de execucao;
- `Proposal` nao substitui `Operation`.

### Consequencia

O sistema deve preservar a leitura:

```text
Simulation -> Proposal -> Operation -> Commission -> Settlement
```

---

## 9. Relacao com Simulation

`Simulation` e a origem natural de parte relevante das propostas, mas nao e obrigatoria para todas.

### Regras

- uma `Simulation` pode existir sem `Proposal`;
- uma `Proposal` pode existir sem `Simulation` quando for criada manualmente ou por fluxo externo;
- quando houver simulacao, a proposta deve preservar a rastreabilidade da origem;
- a simulacao permanece como entidade independente de calculo e viabilidade.

### Consequencia

A proposta deve poder carregar a origem da analise, mas nao deve incorporar a responsabilidade de calcular.

---

## 10. Relacao com Commission

`Commission` nao deve derivar de `Proposal` diretamente.

### Regra

- `Commission` nasce de `Operation` executada;
- `Proposal` pode influenciar a base economica, mas nao e a origem canonica da comissao;
- a comissao deve manter rastreabilidade ate a operacao, e nao apenas ate a proposta.

### Consequencia

Isso evita que a proposta se torne um atalho para fechamento financeiro sem execucao formal.

---

## 11. Estrategia de migracao sem ruptura

A canonicalizacao de `Proposal` deve ser feita sem ruptura de contratos existentes.

### Estrategia

1. Tratar `Proposal` como o nome conceitual oficial nos documentos de arquitetura.
2. Manter `BankProposal` como implementacao persistida atual.
3. Preservar compatibilidade com rotas, permissões e consumo existentes.
4. Quando houver evolucao futura, introduzir novos campos sem renomear estruturalmente a entidade de imediato.
5. Somente considerar renomeacao física ou model novo se houver decisao arquitetural e de migração formal aprovada.

### Regra

Enquanto nao existir uma migração formal, o sistema deve continuar operando com `BankProposal` como persistencia canônica.

---

## 12. Critérios para canonicidade

`BankProposal` pode ser tratado como `Proposal` canônica quando cumprir os seguintes critérios:

- representar a proposta oficial do domínio sem ambiguidades semânticas;
- manter contexto de tenant e ownership;
- preservar relacionamento com customer, opportunity e createdBy;
- suportar vínculo com provider e, quando aplicável, simulation;
- ser auditável em todo o seu lifecycle;
- não competir com Operation como raiz de execução;
- ser a única fonte persistida de proposta no sistema enquanto durar a coexistência.

---

## 13. Riscos e mitigacao

### Riscos

- divergencia entre nome de dominio e tabela persistida;
- confusao entre proposta e operacao;
- lacunas de rastreabilidade para provider e simulation;
- expansão indevida de escopo dentro da proposal;
- duplicidade de modelo caso `Proposal` e `BankProposal` coexistam como entidades distintas.

### Mitigacao

- manter nomenclatura conceitual `Proposal` e implementação persistida `BankProposal`;
- reforcar no contrato que `Operation` e o agregado de execucao;
- exigir tenant, createdBy e relacionamento com customer/opportunity;
- explicitar provider e simulation como dependencias canônicas futuras;
- evitar criação de novo model sem decision gate formal.

---

## 14. Fora de escopo

Esta RFC nao inclui:

- alteracao de schema;
- alteracao de backend;
- alteracao de frontend;
- criacao de migration;
- renomeacao fisica de tabela;
- implementacao de novos endpoints;
- refatoracao de services;
- definicao detalhada de payloads de API;
- alteracao de permissões ou RBAC;
- alteracao de `Operation`, `Commission` ou `Settlement`.

---

## Referencias Oficiais

- `ADR-007` - Lead, Customer, Simulation and Opportunity Model
- `ADR-008` - Revenue Distribution Engine
- `ADR-009` - Operation Persistence and Financial Execution Aggregate
- `ARCH-016` - Opportunity Workspace Blueprint
- `ARCH-017` - Workspace Ownership Matrix
- `ARCH-018` - Domain Boundary Matrix
- `ARCH-019` - Workspace State Machine

