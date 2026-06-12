# ADR-009 - Operation Persistence and Financial Execution Aggregate

Status: Proposed
Date: 2026-06-11
Owner: Architecture
Type: Domain Architecture
Project: FINQZ PRO

---

## 1. Contexto

O FINQZ PRO ja possui uma arquitetura documental consolidada para:

- `Customer` como raiz oficial de identidade;
- `Opportunity` como raiz operacional e comercial;
- `BankProposal` como artefato de proposta financeira;
- `Commission` como resultado financeiro derivado de execucao;
- `Provider` como origem de capacidades, condicoes e integracoes;
- `BluePay` como provider de integracao de payout/execucao financeira.

As revisoes arquiteturais em `ARCH-004`, `ARCH-005`, `ARCH-008`, `ADR-007` e `ADR-008` convergem para um ponto em comum:

- a operacao financeira nao deve continuar representada apenas por `Opportunity`, `BankProposal` ou `Commission`;
- o ciclo de execucao precisa de uma entidade propria, auditavel e extensivel;
- a comissao deve nascer de uma operacao executada, e nao de uma oportunidade genérica;
- a distribuicao financeira precisa suportar evolucao futura sem refatoracao estrutural.

Hoje o schema persistido ainda nao possui um agregado `Operation`. Isso cria uma lacuna entre o contrato arquitetural aprovado e a persistencia real do dominio financeiro.

---

## 2. Problema

O modelo atual concentra responsabilidades em entidades que nao foram desenhadas para absorver o ciclo completo de execucao financeira.

Problemas observados:

- `Opportunity` esta sendo usada como eixo comercial e, em alguns fluxos, como proxy operacional;
- `BankProposal` armazena snapshot de proposta, mas nao representa o agregado final de execucao;
- `Commission` esta ligada a oportunidade, embora deva depender da operacao concluida;
- integracoes de provider e payout ja existem em contrato, mas nao possuem um agregado financeiro central persistido;
- a ausencia de `Operation` dificulta rastreabilidade, lifecycle consistente, backfill historico e evolucao de payout/settlement.

Sem um agregado `Operation`, o sistema tende a misturar:

- intencao comercial;
- proposta financeira;
- execucao financeira;
- distribuicao de receita;
- pagamento/settlement.

Isso aumenta o risco de duplicidade, dependencia circular e quebra de homologacao quando novas capacidades forem ativadas.

---

## 3. Decisao

O FINQZ PRO adotara oficialmente `Operation` como o agregado financeiro e de execucao do ciclo operacional.

Decisao central:

- `Customer` = raiz de identidade;
- `Opportunity` = raiz operacional/comercial;
- `Operation` = raiz financeira/de execucao.

`Operation` deve ser persistida como entidade propria, com lifecycle, relacionamentos e eventos proprios, servindo de base para:

- comissao;
- payout;
- settlement;
- auditoria financeira;
- integracoes de provider.

---

## 4. Operation como agregado financeiro

`Operation` representa a realizacao efetiva de um negocio financeiro derivado de uma oportunidade.

Ela nao substitui:

- `Opportunity`, que continua sendo a unidade comercial central;
- `BankProposal`, que continua sendo a proposta/snapshot de negociacao;
- `Commission`, que continua sendo o resultado financeiro;
- `Payment/Settlement`, que continua sendo a camada de liquidacao ou pagamento.

`Operation` resolve a lacuna entre proposta e resultado, permitindo:

- rastrear o que foi solicitado ao provider;
- rastrear o que foi aprovado;
- rastrear o que foi executado;
- rastrear o que falhou;
- derivar comissao a partir de um evento real;
- integrar payout e settlement com BluePay ou outro provider.

---

## 5. Responsabilidades

### Opportunity

Responsabilidades:

- representar a oportunidade comercial central;
- organizar pipeline, stage, owner e contexto de negocio;
- conectar cliente, parceiro, estrutura comercial e provider;
- registrar a intencao comercial que pode originar uma operacao.

Nao responsavel por:

- executar pagamento;
- armazenar lifecycle financeiro final;
- concentrar a logica de comissao;
- substituir `Operation`.

### BankProposal

Responsabilidades:

- representar a proposta financeira;
- guardar snapshot de condicoes, valores, prazo, taxa e metadados de proposta;
- servir como artefato de aprovacao ou validacao;
- manter rastreabilidade da negociacao com provider.

Nao responsavel por:

- ser o agregado final de execucao;
- substituir `Operation`;
- ser a fonte final de comissao ou payout.

### Operation

Responsabilidades:

- representar a execucao financeira oficial;
- centralizar o lifecycle da operacao;
- servir de base para comissao, payout e settlement;
- manter rastreabilidade entre `Opportunity`, `BankProposal`, `Provider` e resultado final;
- suportar eventos operacionais e auditoria.

### Commission

Responsabilidades:

- representar o resultado financeiro devido a partir de uma operacao executada;
- calcular e registrar distribuicao de receita;
- manter referencia a `Operation` como origem canonica.

### Payment / Settlement

Responsabilidades:

- liquidar comissoes ou valores financeiros derivados da operacao;
- registrar pagamento, conciliacao ou repasse;
- integrar com providers como BluePay;
- viver depois da comissao liberada ou validada para payout.

---

## 6. Relacionamentos oficiais

Fluxo conceitual oficial:

```text
Lead opcional
→ Customer
→ Opportunity
→ Simulation opcional
→ BankProposal
→ Operation
→ Commission
→ Payment / Settlement
```

Relacionamentos principais:

- `Customer` pode ter muitas `Opportunity`;
- `Opportunity` pode originar muitas `Operation`;
- `Operation` referencia uma `Opportunity` como origem comercial;
- `Operation` pode referenciar uma `BankProposal` aprovada ou usada como base;
- `Operation` referencia o `Provider` responsavel pela execucao;
- `Commission` referencia `Operation` como origem canonica;
- `Payment/Settlement` referencia `Commission` e, quando necessario, `Operation`;
- `Provider` e `BluePay` funcionam como capacidades de integracao, nao como raiz de dominio.

Relacionamentos de compatibilidade:

- `Commission.opportunityId` pode existir temporariamente durante migracao;
- `BankProposal.opportunityId` pode continuar existindo enquanto o fluxo coexistir;
- referencias legadas nao devem competir com a origem canonica de `Operation`.

---

## 7. Lifecycle da Operation

Lifecycle oficial proposto:

```text
created
→ proposal_requested
→ proposal_received
→ proposal_approved
→ executed
→ commission_calculated
→ settlement_pending
→ settled
```

Estados terminais adicionais:

- `rejected`
- `failed`
- `canceled`

Observacoes:

- `created` marca a abertura formal da operacao;
- `proposal_requested` marca a solicitacao ao provider;
- `proposal_received` marca o retorno da proposta;
- `proposal_approved` marca aprovacao interna;
- `executed` marca a execucao efetiva;
- `commission_calculated` marca a geracao da base de comissao;
- `settlement_pending` marca aguardo de liquidacao;
- `settled` marca fechamento financeiro.

---

## 8. Eventos operacionais

Eventos oficiais associados ao ciclo de `Operation`:

- `OperationCreated`
- `OperationProposalRequested`
- `OperationProposalReceived`
- `OperationProposalApproved`
- `OperationProposalRejected`
- `OperationExecuted`
- `OperationFailed`
- `CommissionCalculated`
- `CommissionReleased`
- `CommissionPaid`
- `SettlementRequested`
- `SettlementConfirmed`
- `SettlementFailed`

Regras:

- eventos devem refletir transicoes reais de estado;
- eventos nao devem ser usados como validação de negocio;
- `OperationExecuted` deve ser o gatilho principal para comissao;
- `CommissionReleased` deve anteceder qualquer payout;
- `Payment/Settlement` deve depender de uma comissao validada e elegivel.

---

## 9. Estrategia de coexistencia

`Operation` deve coexistir com o modelo atual sem ruptura imediata.

Durante a coexistencia:

- `Opportunity` continua sendo usada como raiz comercial;
- `BankProposal` continua sendo usado como proposta/snapshot;
- `Commission` continua operando em modo compatibilidade;
- novos fluxos devem passar a gravar `Operation` de forma paralela e rastreavel.

Principio:

- leitura antiga continua funcionando;
- escrita nova passa a incluir `Operation`;
- nenhuma dependencia legada deve ser removida antes do backfill e da validacao de homologacao.

---

## 10. Estrategia de migracao sem ruptura

A migracao deve seguir uma abordagem incremental:

### Fase 1 - Introducao nao disruptiva

- documentar e aprovar o contrato de `Operation`;
- manter schema e APIs legadas intactas;
- definir campos canonicos e lifecycle.

### Fase 2 - Shadow write

- sempre que um fluxo financeiro ocorrer, persistir `Operation` em paralelo ao fluxo atual;
- manter `BankProposal` e `Commission` legados sem quebra.

### Fase 3 - Backfill

- preencher `Operation` a partir do historico de `BankProposal` e `Commission`;
- criar referencias consistentes para casos ja executados;
- preservar rastreabilidade de origem.

### Fase 4 - Leitura canonica

- migrar consumidores para ler `Operation` como fonte principal;
- manter campos legados apenas para compatibilidade.

### Fase 5 - Descontinuacao controlada

- retirar dependencia direta de `Commission.opportunityId` quando seguro;
- reduzir uso de `BankProposal` como proxy operacional;
- desativar apenas o que nao tiver consumo real.

---

## 11. Shadow write

Shadow write significa gravar `Operation` sem interromper o fluxo atual.

Objetivos:

- validar schema, integracoes e lifecycle sem risco de parada;
- comparar a nova persistencia com os dados legados;
- detectar divergencias antes de tornar `Operation` canonica.

Regras:

- shadow write nao substitui o fluxo atual;
- shadow write nao altera comportamento de usuario;
- shadow write deve ser auditavel;
- shadow write deve ser facilmente reversivel.

---

## 12. Backfill

Backfill e a reconstrucao historica da entidade `Operation`.

Fontes provaveis para backfill:

- `BankProposal`;
- `Commission`;
- logs de integracao;
- eventos operacionais;
- metadados de provider.

Objetivos do backfill:

- criar linha historica unica por operacao;
- preservar vinculo com oportunidade original;
- preservar vinculo com provider;
- permitir analytics e auditoria.

---

## 13. Critérios para tornar Operation canônica

`Operation` so pode virar fonte canônica quando:

- existir persistencia estavel em producao;
- `Opportunity`, `BankProposal` e `Commission` coexistirem sem regressao;
- os fluxos de escrita estiverem cobertos por testes e validacoes;
- o backfill historico estiver consistente;
- homologacao aprovada nao sofrer quebra;
- `Commission` puder ser derivada de `Operation` com rastreabilidade completa;
- providers e payout estiverem aderentes ao contrato.

---

## 14. Riscos

Principais riscos:

- duplicidade entre `Opportunity`, `BankProposal` e `Operation`;
- inconsistencias de migracao historica;
- quebra de homologacao por mudanca prematura de leitura;
- divergencia entre commission legado e commission baseada em operation;
- acoplamento indevido com BluePay ou outro provider;
- tentacao de tratar `Operation` como simples alias de `Opportunity`.

---

## 15. Beneficios

Beneficios esperados:

- lifecycle financeiro claro e rastreavel;
- maior separacao entre comercial e execucao;
- comissao derivada de evento real de operacao;
- melhor suporte a payout e settlement;
- base mais solida para integracoes de provider;
- arquitetura mais extensivel para novos produtos, canais e modelos de distribuicao.

---

## 16. Fora de escopo

Este ADR nao:

- altera `schema.prisma`;
- cria migration;
- modifica backend;
- modifica frontend;
- cria novos providers;
- redefine `Commission` como dominio principal;
- remove `Opportunity` ou `BankProposal`;
- implementa `Payment/Settlement` como model persistido;
- altera rotas ou contratos atuais.

---

## 17. Proximas fases

1. Formalizar o contrato persistido de `Operation` no schema.
2. Definir o shape canonico da entidade e seus enums de status.
3. Implementar shadow write para coexistencia com o fluxo atual.
4. Planejar backfill historico.
5. Migrar `Commission` para referencia canonica em `Operation`.
6. Consolidar `Payment/Settlement` como camada posterior de liquidacao.
7. Descontinuar gradualmente proxies legados quando a homologacao estiver segura.

---

## 18. Conclusao

`Operation` e a raiz financeira de execucao do FINQZ PRO.

`Opportunity` continua sendo a raiz operacional/comercial.
`BankProposal` continua sendo o artefato de proposta.
`Commission` continua sendo o resultado financeiro.
`Payment/Settlement` continua sendo a etapa de liquidacao.

A introducao de `Operation` formaliza a fronteira que hoje existe apenas no contrato arquitetural, reduzindo ambiguidade, duplicidade e risco de quebra na evolucao do produto.
