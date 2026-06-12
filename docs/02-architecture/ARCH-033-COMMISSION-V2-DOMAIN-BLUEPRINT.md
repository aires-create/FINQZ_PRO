# ARCH-033 - Commission V2 Domain Blueprint

## 1. Objetivo

Formalizar o blueprint arquitetural do dominio `Commission V2` do FINQZ PRO como a evolucao futura oficial do motor de distribuicao financeira.

Este documento define o contrato conceitual de `Commission V2` sem implementar runtime, schema, migration ou integrações. O objetivo e garantir que a futura evolucao do dominio nasca alinhada a:

- `ADR-008 - Revenue Distribution Engine`;
- `ARCH-031 - Settlement Domain Blueprint`;
- `ARCH-032 - Commission Domain Audit`;
- `Operation` como origem elegivel da distribuicao;
- `Settlement` como camada posterior e distinta;
- `BluePay` como provider de payout, nao dominio.

## 2. Escopo

Este documento cobre apenas a definicao conceitual de `Commission V2`.

Inclui:

- relacao com `Operation`;
- relacao com `CommercialTable`;
- relacao com `Revenue Distribution Engine`;
- relacao com `Settlement`;
- relacao com `Payment`;
- relacao com `BluePay`;
- responsabilidades e nao responsabilidades;
- entidades conceituais;
- lifecycle conceitual;
- estados conceituais;
- regras de calculo conceituais;
- regras de auditoria;
- decisao arquitetural consolidada;
- proxima fase recomendada.

Nao inclui:

- qualquer implementacao de runtime;
- qualquer modelo Prisma;
- qualquer migration;
- qualquer endpoint;
- qualquer service;
- qualquer handler;
- qualquer repository;
- qualquer adaptacao do modulo legado;
- qualquer criacao de `Settlement` ou `Payment`;
- qualquer dependencia direta em `BluePay`.

## 3. Relacao com Operation

`Operation` continua sendo a origem elegivel da distribuicao financeira.

### Regras oficiais

- `Commission V2` nasce a partir de `Operation` elegivel;
- `Commission V2` nao substitui `Operation`;
- `Commission V2` nao executa `Settlement`;
- `Commission V2` nao executa `Payment`;
- `Commission V2` nao altera o lifecycle de `Operation`;
- `Commission V2` deve permanecer rastreavel ao contexto da `Operation`.

### Leitura arquitetural

`Operation` responde a execucao financeira. `Commission V2` responde a transformacao dessa execucao em distribuicao financeira governada.

## 4. Relacao com Commercial Table

`CommercialTable` continua sendo a referencia para regras comerciais e parametrizacao de base.

### Regras oficiais

- `Commission V2` deve suportar regras por tabela comercial;
- `CommercialTable` pode ser origem de parametricas, percentuais e condicoes de elegibilidade;
- `Commission V2` nao deve transformar a tabela comercial em fonte de verdade financeira final;
- `Commission V2` deve tratar a tabela comercial como insumo governado, nao como dominio principal da distribuicao.

### Leitura arquitetural

`CommercialTable` informa a base comercial. `Commission V2` converte essa base em distribuicao financeira derivada.

## 5. Relacao com Revenue Distribution Engine

`ADR-008` continua sendo a referencia conceitual do motor de distribuicao.

### Regras oficiais

- `Commission V2` deve ser coerente com o `Revenue Distribution Engine`;
- o dominio nao pode ser reduzido a um unico percentual simples;
- a arquitetura deve suportar distribuicao hierarquica e multipla;
- o motor deve continuar extensivel para campanhas, bonus, cashback, canais e colaboradores;
- `Commission V2` e um recorte evoluido desse motor, nao seu substituto.

### Leitura arquitetural

`ADR-008` define a direcao: distribuicao financeira derivada e extensivel. `Commission V2` e a materializacao futura desse contrato em um dominio formal.

## 6. Relacao com Settlement

`Settlement` continua sendo a camada posterior de liquidacao financeira.

### Regras oficiais

- `Commission V2` nao executa `Settlement`;
- `Commission V2` nao substitui `Settlement`;
- `Commission V2` fornece a base elegivel para a liquidacao futura;
- `Settlement` consome o resultado de `Commission V2`, mas permanece separado;
- o lifecycle de `Commission V2` nao deve ser confundido com o de liquidacao.

### Leitura arquitetural

`Commission V2` organiza a distribuicao. `Settlement` organiza a liquidacao posterior. Sao dominios complementares, nao concorrentes.

## 7. Relacao com Payment

`Payment` representa a fase futura de pagamento ou repasse efetivo.

### Regras oficiais

- `Commission V2` nao executa `Payment`;
- `Commission V2` nao deve assumir responsabilidade de payout;
- `Payment` depende de settlement ou liquidação validada;
- `Commission V2` pode servir como base analitica e financeira para a etapa futura de pagamento;
- a separacao entre comissao calculada e pagamento efetivo deve permanecer clara.

### Leitura arquitetural

`Commission V2` nao e o pagamento. Ele prepara a trilha financeira que torna o pagamento possivel e rastreavel.

## 8. Relacao com BluePay

`BluePay` e um provider de payout, nao um dominio de comissao.

### Regras oficiais

- `Commission V2` nao deve depender diretamente de `BluePay`;
- `BluePay` nao e source of truth de comissao;
- `BluePay` nao define regras de distribuicao;
- `BluePay` pode participar futuramente como integracao de payout;
- o contrato de `Commission V2` deve sobreviver a troca de provider.

### Leitura arquitetural

O provider e uma capacidade de infraestrutura futura. O dominio de comissao deve permanecer portavel e independente da escolha de payout.

## 9. Responsabilidades

`Commission V2` deve ser responsavel por:

- calcular ou representar a comissao bruta FINQZ;
- aplicar retenção FINQZ;
- consolidar pool distribuivel;
- distribuir valores por regras hierarquicas;
- suportar parceiros, colaboradores, canais, campanhas, bonus e cashback;
- respeitar regras por tabela comercial;
- manter rastreabilidade por tenant;
- expor auditabilidade de calculo e decisao;
- preservar a relacao com `Operation` e `Settlement`.

## 10. Nao responsabilidades

`Commission V2` nao deve:

- substituir `Operation`;
- executar `Settlement`;
- executar `Payment`;
- depender de `BluePay` como dominio;
- virar fonte primaria de cadastro;
- absorver regras de liquidacao;
- assumir papel de provider;
- misturar motor de distribuicao com camada de pagamento;
- ser implementado a partir do modulo legado/placeholder;
- depender do runtime Express atual;
- tratar settlement como responsabilidade interna.

## 11. Entidades conceituais

As entidades e conceitos abaixo compoem o blueprint futuro de `Commission V2`.

### 11.1 Commission V2

Agregado ou raiz conceitual da distribuicao financeira.

### 11.2 Gross Commission

Valor bruto originado pela operacao elegivel.

### 11.3 FINQZ Retention

Parcela retida pela FINQZ antes da distribuicao.

### 11.4 Distributable Pool

Montante efetivamente disponivel para distribuicao.

### 11.5 Distribution Rule

Regra que define como o pool sera fracionado entre beneficiarios.

### 11.6 Beneficiary

Destino da distribuicao, que pode incluir:

- Partner;
- Colaborador;
- Canal;
- Campanha;
- Bonus Program;
- Cashback Program.

### 11.7 Commission Allocation

Alocacao conceitual de parte do pool para um beneficiario.

### 11.8 Audit Trail Entry

Registro conceitual de calculo, ajuste, validacao ou reversao de comissao.

## 12. Lifecycle conceitual

O lifecycle conceitual de `Commission V2` deve refletir a progressao desde a elegibilidade ate a consolidacao financeira.

### Fluxo canonico

```text
pending
calculated
validated
released
```

### Leitura do fluxo

- `pending`: a comissao ainda nao foi consolidada;
- `calculated`: a base de comissao foi calculada;
- `validated`: a calculacao foi validada contra regras e origem;
- `released`: a comissao foi liberada para etapa posterior.

### Observacao

Os nomes acima sao conceituais. A convencao final de nomenclatura pode variar, mas a semantica precisa permanecer coerente com o motor de distribuicao.

O estado `paid` nao pertence ao dominio `Commission V2`; ele pertence a etapa futura de `Payment` ou `Settlement`, para evitar acoplamento entre distribuicao financeira e liquidacao/pagamento.

## 13. Estados conceituais

### 13.1 pending

Estado inicial em que a operação elegivel existe, mas a distribuicao ainda nao foi consolidada.

### 13.2 calculated

Estado em que a comissao bruta, retenção e pool distribuivel foram apurados.

### 13.3 validated

Estado em que a distribuicao foi validada contra as regras comerciais e de governanca.

### 13.4 released

Estado terminal conceitual minimo de `Commission V2`, em que a comissao esta apta a seguir para a camada posterior de settlement ou liquidacao.

### Regra de terminalidade minima

`released` e o estado terminal conceitual minimo de `Commission V2`.

`paid` nao deve ser usado como estado proprio de `Commission V2`, porque pertence ao dominio futuro de `Payment` ou `Settlement` e introduziria acoplamento indevido com liquidacao/pagamento.

## 14. Regras de calculo conceituais

`Commission V2` deve suportar regras de calculo flexiveis e extensiveis.

### Regras oficiais

- calcular comissao bruta FINQZ como base de entrada;
- aplicar retenção FINQZ antes da distribuicao;
- consolidar pool distribuivel;
- distribuir por regras hierarquicas de Partner;
- permitir participacoes para colaboradores;
- permitir canais comerciais como beneficiarios;
- permitir campanhas, bonus e cashback;
- respeitar parametros por tabela comercial;
- ser tenant-scoped;
- preservar rastreabilidade de origem e base utilizada.

### Regras de governanca

- nenhum valor deve ser distribuido sem origem elegivel;
- nenhuma regra pode apagar a origem financeira;
- nenhuma distribuicao deve ocorrer sem possibilidade de auditoria;
- regras não podem depender de provider como fonte soberana.

## 15. Regras de auditoria

`Commission V2` deve ser totalmente auditavel.

### O que deve ser auditado

- calculo da comissao bruta;
- aplicacao da retenção FINQZ;
- formacao do pool distribuivel;
- aplicacao de regras de distribuicao;
- criacao de alocacoes;
- liberacao;
- ajuste;
- estorno conceitual;
- conciliacao futura quando aplicavel;
- origem da `Operation`;
- tenant;
- ator;
- correlacao.

### Campos conceituais minimos

- `tenantId`;
- `operationId`;
- `commissionId` conceitual ou equivalente futuro;
- `operationNumber`;
- `ruleSetId` ou referencia equivalente;
- `grossAmount`;
- `retainedAmount`;
- `distributableAmount`;
- `beneficiaryId`;
- `status`;
- `actorId`;
- `requestId`;
- `correlationId`;
- `createdAt`;
- `updatedAt` conceitual apenas se houver estado mutavel futuro;
- justificativa quando houver ajuste ou reversao.

### Regra

Auditoria de comissao deve permitir reconstruir por que um valor foi gerado, por que foi retido e como foi distribuido.

## 16. Decisao arquitetural consolidada

### Decisao oficial

`Commission V2` sera o dominio futuro responsavel pelo motor de distribuicao financeira derivado de `Operation`, coerente com `ADR-008`, separado de `Settlement` e `Payment`, independente de `BluePay` e suportando distribuicao extensivel por parceiros, colaboradores, canais, campanhas, bonus e cashback.

### Implicacao pratica

- `Operation` permanece origem elegivel;
- `Commission V2` substitui o placeholder legado como destino futuro de desenho;
- `Settlement` permanece posterior e separado;
- `Payment` permanece ainda mais posterior;
- `BluePay` permanece provider de payout, nao dominio de comissao;
- a evolucao oficial precisa acontecer por blueprint proprio antes de runtime.

### Regra de ouro

Se houver conflito entre simplicidade tecnica e separacao de dominio, o contrato de dominio prevalece.

## 17. Proxima fase recomendada

### Fase sugerida

`Commission V2 Contracts`

### Objetivo da fase

Definir contratos puros de:

- entidade conceitual;
- eventos conceituais;
- calculo e alocacao;
- audit trail;
- estados e transicoes;
- relacionamento com Operation e Settlement.

### Regra

Nenhuma implementacao deve iniciar enquanto o blueprint de `Commission V2` nao estiver aceito como referencia oficial.
