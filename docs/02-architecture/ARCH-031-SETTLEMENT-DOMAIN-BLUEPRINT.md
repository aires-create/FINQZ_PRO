# ARCH-031 - Settlement Domain Blueprint

## 1. Objetivo

Formalizar o dominio `Settlement` do FINQZ PRO como a camada conceitual responsavel pela liquidacao financeira que ocorre apos `Commission`.

Este documento estabelece o contrato arquitetural do dominio sem criar implementacao, schema, migration ou runtime. O objetivo e evitar ambiguidade entre:

- `Operation`, que representa execucao financeira;
- `Commission`, que representa o resultado financeiro derivado;
- `Settlement`, que representa a liquidacao financeira;
- `Payment`, que representa a fase futura de pagamento originada a partir da liquidacao;
- `BluePay`, que representa um provider de payout e nao um dominio.

## 2. Escopo

Este documento cobre apenas a definicao conceitual de `Settlement`.

Inclui:

- relacao com `Operation`;
- relacao com `Commission`;
- relacao com `Payment`;
- relacao com `BluePay`;
- lifecycle conceitual;
- estados conceituais;
- responsabilidades;
- nao responsabilidades;
- fluxo `Operation -> Commission -> Settlement -> Payment`;
- decisao arquitetural consolidada.

Nao inclui:

- qualquer implementacao de runtime;
- qualquer modelo Prisma;
- qualquer migration;
- qualquer endpoint;
- qualquer service;
- qualquer handler;
- qualquer repository;
- qualquer orquestracao de pagamento;
- qualquer criacao de `Commission V2`.

## 3. Relacao com Operation

`Operation` continua sendo o agregado financeiro e de execucao que antecede o settlement.

### Regras oficiais

- `Settlement` acontece depois de `Commission`;
- `Settlement` nao calcula comissao;
- `Settlement` nao substitui `Operation`;
- `Settlement` nao altera o lifecycle de `Operation`;
- `Settlement` consome o contexto produzido por `Operation` executada e rastreavel.

### Leitura arquitetural

`Operation` responde a execucao financeira. `Settlement` responde a liquidacao financeira posterior, sem reabrir a autoria do ciclo operacional.

## 4. Relacao com Commission

`Commission` continua sendo o resultado financeiro derivado de `Operation`.

### Regras oficiais

- `Settlement` acontece apos `Commission`;
- `Settlement` nao calcula comissao;
- `Settlement` nao substitui `Commission`;
- `Settlement` deve receber base financeira ja elegivel e validada;
- `Settlement` nao reinterpreta regras de distribuicao financeira.

### Leitura arquitetural

`Commission` define o valor ou elegibilidade financeira. `Settlement` define a liquidacao desse valor ou do pacote financeiro correspondente.

## 5. Relacao com Payment

`Payment` e a manifestacao futura da liquidacao em termos de repasse, baixa ou pagamento efetivo.

### Regras oficiais

- `Settlement` nao executa pagamento;
- `Settlement` representa liquidacao financeira;
- `Payment` depende da existencia de settlement validado;
- `Settlement` sera a origem futura dos pagamentos;
- `Payment` nao deve ser tratado como sinonimo de settlement.

### Leitura arquitetural

`Settlement` prepara e referencia a etapa futura de pagamento. O pagamento e posterior, e sua implementacao deve ser tratada como dominio separado ou capacidade posterior.

## 6. Relacao com BluePay

`BluePay` e um provider de payout, nao um dominio.

### Regras oficiais

- `BluePay` nao e source of truth de `Settlement`;
- `BluePay` nao define o lifecycle de `Settlement`;
- `BluePay` nao substitui `Payment`;
- `BluePay` participa como integracao externa de payout;
- o contrato de `Settlement` nao deve depender de BluePay como dominio soberano.

### Leitura arquitetural

O provider pode ser usado para executar ou apoiar a camada futura de payout, mas a verdade de negocio permanece no dominio `Settlement` e na camada posterior de pagamento.

## 7. Lifecycle conceitual

O lifecycle conceitual de `Settlement` deve refletir a progressao entre elegibilidade, preparacao, consolidacao e encerramento da liquidacao.

### Fluxo canônico

```text
pending
validated
ready_for_payment
settled
```

### Observacao

Os nomes acima sao conceituais e podem ser materializados futuramente em outra convencao de nomenclatura, mas a semantica deve permanecer:

- aguardo;
- validacao;
- pronto para pagamento;
- liquidado.

## 8. Estados conceituais

### 8.1 pending

Estado inicial conceitual em que existe uma base elegivel, mas a liquidacao ainda nao foi consolidada.

### 8.2 validated

Estado em que a liquidacao foi conferida, coerente e apta a prosseguir.

### 8.3 ready_for_payment

Estado em que o settlement foi preparado para a etapa futura de pagamento.

### 8.4 settled

Estado terminal conceitual em que a liquidacao foi concluida.

### Estado intermediario ausente

O dominio pode futuramente prever estados adicionais de conciliacao, falha ou reversao, mas este blueprint nao os implementa nem os torna obrigatorios.

## 9. Responsabilidades

`Settlement` deve ser responsavel por:

- representar liquidacao financeira;
- consolidar elegibilidade de liquidacao;
- manter rastreabilidade da origem financeira;
- preparar a origem futura dos pagamentos;
- preservar a relacao com `Commission` e `Operation`;
- expor um lifecycle proprio e audivel quando materializado;
- manter consistencia entre fato financeiro e fase de pagamento futura.

## 10. Nao responsabilidades

`Settlement` nao deve:

- calcular comissao;
- substituir `Commission`;
- executar pagamento;
- substituir `Payment`;
- agir como provider;
- assumir ownership cadastral;
- alterar `Operation`;
- reimplementar a regra de negocio de distribuicao;
- virar atalho para esconder pendencias financeiras;
- depender de BluePay como fonte de verdade do dominio.

## 11. Fluxo Operation -> Commission -> Settlement -> Payment

O fluxo conceitual oficial do FINQZ PRO para a linha financeira posterior e:

```text
Operation -> Commission -> Settlement -> Payment
```

### Leitura do fluxo

1. `Operation` registra a execucao financeira.
2. `Commission` deriva do resultado elegivel dessa operacao.
3. `Settlement` representa a liquidacao financeira apos a comissao.
4. `Payment` representa o repasse ou a etapa final de pagamento futura.

### Regra

A sequencia nao pode ser invertida por conveniencia de implementacao.

## 12. Decisao arquitetural consolidada

### Decisao oficial

`Settlement` e o dominio conceitual responsavel por representar a liquidacao financeira posterior a `Commission`, sem calcular comissao, sem substituir `Commission`, sem executar pagamento e sem assumir BluePay como dominio.

### Implicacao pratica

- `Operation` permanece a raiz de execucao;
- `Commission` permanece como resultado financeiro derivado;
- `Settlement` permanece como liquidacao financeira;
- `Payment` permanece como etapa posterior de repasse ou pagamento;
- `BluePay` permanece como provider de payout, nao como dominio.

### Regra de ouro

Se houver conflito entre simplicidade de implementacao e separacao de dominio, a separacao de dominio prevalece.
