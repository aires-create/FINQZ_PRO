# ARCH-035 - Commission V2 Conceptual Eventing and Audit Blueprint

## 1. Objetivo

Formalizar a estratégia conceitual de eventos e auditoria do dominio `Commission V2`, garantindo consistencia entre distribuicao financeira, rastreabilidade e governanca.

Este documento complementa `ARCH-033`, `ARCH-034`, `ARCH-031` e `ADR-008`, sem criar qualquer implementacao. Seu papel e definir como o dominio deve se comportar em termos de eventos, correlação, audit trail, ajuste, reversao e reprocessamento.

## 2. Escopo

Este documento cobre apenas o desenho conceitual do eventing e da auditoria de `Commission V2`.

Inclui:

- estrategia de eventos;
- categorias de eventos;
- eventos centrais do dominio;
- regras de ordenacao;
- regras de correlacao;
- estrategia de RequestId;
- estrategia de CorrelationId;
- estrategia de idempotencia;
- estrategia de audit trail;
- principios append-only;
- estrategia de ajuste;
- estrategia de reversao;
- estrategia de reprocessamento;
- relacao com `Operation`;
- relacao com `Settlement`;
- relacao com `Payment`;
- invariantes;
- decision record;
- proxima fase recomendada.

Nao inclui:

- TypeScript;
- Prisma;
- schema;
- migration;
- endpoint;
- service;
- handler;
- repository;
- runtime;
- tabelas;
- implementacao de BluePay;
- implementacao de Settlement ou Payment.

## 3. Eventing Strategy

O eventing de `Commission V2` deve existir como linguagem oficial de mudanca conceitual do dominio.

### Principios

- eventos representam fatos do dominio, nao instrucoes;
- eventos refletem mudanca real de estado ou de decisao de negocio;
- eventos devem ser coerentes com `Operation` e com o lifecycle de `Commission V2`;
- eventos nao substituem auditoria;
- eventos nao substituem a verdade de dominio;
- eventos nao devem depender de `BluePay`.

### Papel arquitetural

O eventing existe para:

- expressar calculo;
- expressar validacao;
- expressar liberacao;
- expressar ajuste;
- expressar reversao;
- habilitar reconstrução futura;
- suportar rastreabilidade e conciliacao.

## 4. Event Categories

Os eventos conceituais de `Commission V2` podem ser classificados em quatro categorias principais.

### 4.1 Core domain events

Eventos centrais de mudanca de estado do agregado.

### 4.2 Adjustment events

Eventos que representam ajustes, recortes ou recalculos formais.

### 4.3 Reversal events

Eventos que representam desfazimento formal, com justificativa.

### 4.4 Audit derived events

Eventos ou marcos derivados de auditoria, usados para analise e rastreio, sem substituir o estado de dominio.

## 5. Core Domain Events

Os eventos centrais do dominio sao:

- `CommissionCalculated`
- `CommissionValidated`
- `CommissionReleased`
- `CommissionAdjusted`
- `CommissionReversed`

### `CommissionCalculated`

Indica que a base de comissao foi calculada a partir de uma `Operation` elegivel.

### `CommissionValidated`

Indica que a comissao calculada foi conferida contra regras, origem e governanca.

### `CommissionReleased`

Indica que a comissao foi liberada para a etapa posterior de liquidacao ou pagamento.

### `CommissionAdjusted`

Indica que uma alteracao formal foi aplicada ao valor ou a distribuicao.

### `CommissionReversed`

Indica que a comissao foi revertida formalmente, com justificativa e rastreabilidade.

## 6. Event Ordering Rules

Eventos de `Commission V2` devem obedecer ordem conceitual rigorosa.

### Ordem minima

```text
CommissionCalculated -> CommissionValidated -> CommissionReleased
```

### Regras

- `CommissionCalculated` nao pode ocorrer sem `Operation` elegivel;
- `CommissionValidated` nao pode ocorrer antes de `CommissionCalculated`;
- `CommissionReleased` nao pode ocorrer antes de `CommissionValidated`;
- `CommissionAdjusted` deve respeitar o estado atual e a historia da comissao;
- `CommissionReversed` deve respeitar a ordem e a justificativa da alteracao.

### Regra de ordenacao

Se a ordem dos eventos nao puder ser explicada pelo lifecycle, o fluxo esta inconsistente.

## 7. Event Correlation Rules

Correlacao e o mecanismo que liga evento, auditoria, requisicao e origem de negocio.

### Regras

- cada evento deve ser correlacionavel com sua `Operation` de origem;
- cada evento deve carregar contexto de tenant;
- cada evento deve poder ser relacionado com a decisao de negocio que o originou;
- cada evento deve se manter associado ao mesmo fluxo quando representar o mesmo caso de negocio;
- eventos de ajuste e reversao devem preservar historico de correlacao.

## 8. RequestId Strategy

`RequestId` identifica a requisicao observavel que desencadeou ou acompanha o evento.

### Regras

- `RequestId` serve para observabilidade de requisicao;
- `RequestId` nao substitui a identidade do dominio;
- `RequestId` pode variar entre requests diferentes do mesmo fluxo;
- a ausencia de `RequestId` nao pode destruir a rastreabilidade do dominio, desde que haja outras chaves correlacionaveis.

## 9. CorrelationId Strategy

`CorrelationId` e a chave de fluxo do negocio.

### Regras

- o mesmo `CorrelationId` deve atravessar evento, auditoria e leitura observavel quando fizer sentido;
- `CorrelationId` deve permitir reconstruir uma jornada de comissao;
- `CorrelationId` nao deve ser confundido com identidade de entidade;
- `CorrelationId` deve permanecer estavel no mesmo fluxo de negocio, inclusive em reprocessamentos autorizados.

## 10. Idempotency Strategy

Idempotencia protege o dominio contra duplicidade de efeito.

### Regras

- uma mesma intencao nao deve produzir eventos duplicados sem motivo formal;
- chave de idempotencia deve representar a mesma intencao repetida;
- reenvio de requisicao nao deve gerar nova verdade se a intencao ja foi processada;
- ajuste ou reversao nao deve ser mascarado como simples repeticao;
- idempotencia deve respeitar tenant, origem e contexto do dominio.

### Leitura arquitetural

Idempotencia nao e filtro tecnico apenas. Ela e uma regra de governanca do fluxo de comissao.

## 11. Audit Trail Strategy

O audit trail de `Commission V2` e o registro formal da historia de negocio e da decisão.

### Regras

- toda acao relevante deve deixar trilha auditavel;
- cada evento central deve ter contrapartida auditavel;
- auditoria deve registrar origem, ator, tenant e correlacao;
- auditoria deve distinguir calculo, validacao, liberacao, ajuste e reversao;
- auditoria nao deve criar verdade concorrente;
- auditoria nao deve ser destrutiva.

### Objetivo

O objetivo da auditoria nao e duplicar o dominio, mas permitir reconstruir por que a comissao existe, como foi calculada e por que mudou.

## 12. Append-Only Principles

Auditoria e eventing devem seguir principios append-only em conceito.

### Regras

- fatos passados nao devem ser reescritos silenciosamente;
- ajuste gera novo fato, nao substituicao invisivel;
- reversao gera novo fato, nao apagamento;
- conciliacao futura gera novo fato, nao correcao opaca;
- reprocessamento gera nova evidência, nao reescrita do historico.

### Consequencia

O historico precisa preservar a verdade do que aconteceu, mesmo quando a situacao atual mude.

## 13. Adjustment Strategy

Ajuste representa alteracao formal em uma comissao ja calculada ou liberada.

### Regras

- nenhum ajuste pode ocorrer sem trilha auditavel;
- ajuste deve indicar o motivo e a origem;
- ajuste deve manter rastreabilidade da versao anterior;
- ajuste nao pode apagar a historia anterior;
- ajuste nao pode ser confundido com erro de calculo silencioso.

### Leitura arquitetural

Ajuste e um novo fato do dominio, nao uma reescrita invisivel da distribuicao.

## 14. Reversal Strategy

Reversao representa o desfazimento formal de uma decisao ou distribuicao.

### Regras

- nenhuma reversao sem justificativa;
- nenhuma reversao sem correlacao;
- nenhuma reversao sem origem elegivel e auditavel;
- reversao deve ser excecao governada, nao atalho operacional;
- reversao nao pode depender de `BluePay` como fonte soberana.

### Leitura arquitetural

Reversao precisa ser explicita, rastreavel e verificavel, especialmente quando a comissao ja tiver sido liberada.

## 15. Reprocessing Strategy

Reprocessamento e a reexecucao conceitual de um fluxo de comissao apos nova informacao, correção ou reconciliacao.

### Regras

- nenhum reprocessamento sem correlacao;
- nenhum reprocessamento sem justificativa;
- reprocessamento nao deve apagar o fluxo original;
- reprocessamento nao deve gerar ambiguidades entre fluxo original e novo fluxo;
- reprocessamento deve ser distinguivel de ajuste e reversao.

### Leitura arquitetural

Reprocessar e criar uma nova linha rastreavel de decisão, nao reescrever a linha antiga.

## 16. Relationship With Operation

`Operation` continua sendo a origem elegivel do dominio de comissao.

### Regras

- nenhuma Commission sem Operation elegivel;
- eventos de comissao devem apontar para a operacao de origem;
- o fluxo de evento deve respeitar o lifecycle de `Operation`;
- `Operation` nao e substituida por eventing de comissao;
- `Operation` permanece a raiz financeira anterior.

## 17. Relationship With Settlement

`Settlement` consome a saida financeira da comissao, mas nao define sua verdade.

### Regras

- eventos de comissao podem anteceder settlement;
- settlement nao e origem dos eventos de comissao;
- settlement nao deve reescrever a historia da comissao;
- eventos de comissao nao devem confundir liberacao com liquidacao.

## 18. Relationship With Payment

`Payment` pertence a uma etapa posterior ao dominio de comissao.

### Regras

- `Commission V2` nao deve depender de `Payment` como origem;
- eventos de comissao nao devem carregar pagamento como verdade propria;
- pagamento futuro pode ser correlacionado, mas nao deve redefinir a natureza da comissao;
- `paid` nao e estado proprio do dominio `Commission V2`.

## 19. Invariants

Os invariantes obrigatorios do blueprint sao:

- nenhum evento sem `Commission` valida;
- nenhuma `Commission` sem `Operation` elegivel;
- nenhuma reversao sem justificativa;
- nenhum ajuste sem trilha auditavel;
- nenhum reprocessamento sem correlacao;
- nenhuma auditoria destrutiva;
- nenhum evento dependente de `BluePay`.

## 20. Decision Record

### Decisao oficial

`Commission V2` adotara eventing e auditoria conceituais append-only, correlacionaveis e tenant-scoped, com eventos centrais para calculo, validacao, liberacao, ajuste e reversao, mantendo a separacao entre `Operation`, `Settlement` e `Payment`, e sem dependencia soberana de `BluePay`.

### Motivos

- `ARCH-033` definiu o dominio e seu lifecycle minimo;
- `ARCH-034` definiu os contratos conceituais do agregado;
- `ARCH-031` manteve settlement separado;
- `ADR-008` exige um motor de distribuicao extensivel e auditavel;
- a evolucao precisa suportar ajuste, reversao e reprocessamento sem quebrar rastreabilidade.

### Efeito arquitetural

- eventos passam a ser linguagem oficial do dominio;
- auditoria passa a ser a evidencia da historia;
- reprocessamentos nao apagam o historico;
- `BluePay` permanece fora da verdade de dominio;
- `Settlement` e `Payment` continuam posteriores.

## 21. Next Recommended Phase

### Fase sugerida

`Commission V2 Event and Audit Contracts`

### Objetivo da fase

Definir, em documento proprio, os contratos conceituais futuros de:

- evento;
- auditoria;
- correlacao;
- idempotencia;
- ajuste;
- reversao;
- reprocessamento.

### Regra

Nenhuma implementacao deve iniciar antes que este blueprint e os blueprints anteriores estejam aceitos como referencia oficial do dominio.
