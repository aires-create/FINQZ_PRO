# ARCH-029 - Operation Audit Strategy

## 1. Objetivo

Documentar a estrategia arquitetural futura de auditoria para transicoes de `Operation`, separando com clareza:

- a validade da transicao, definida em `ARCH-028`;
- a evidencia da transicao, definida neste documento;
- a estrategia geral de auditoria e correlacao ja consolidada em `ARCH-023`, `ARCH-024` e `ARCH-026`.

Este documento nao cria runtime, nao cria schema e nao implementa persistencia. Ele apenas formaliza como a auditoria futura de `Operation` deve ser pensada para manter rastreabilidade, imutabilidade e consistencia de dominio.

## 2. Escopo

Este documento cobre apenas a auditoria conceitual das transicoes de `Operation`.

Inclui:

- responsabilidades do audit de `Operation`;
- relacao entre `RequestId`, `CorrelationId` e `Idempotency-Key`;
- conceito futuro de `OperationStatusHistory`;
- campos obrigatorios de auditoria;
- regra de imutabilidade append-only;
- validacoes necessarias antes de registrar auditoria;
- separacao entre validade e evidencia.

Nao inclui:

- implementacao de runtime;
- criacao de Prisma model;
- criacao de migration;
- criacao de endpoint, service, handler, repository ou event publisher;
- criacao de `Settlement`;
- criacao de `Commission V2`.

## 3. Relacao com documentos anteriores

### 3.1 Relacao com ARCH-028

`ARCH-028` define se uma transicao de status e permitida.

`ARCH-029` define como a transicao permitida deve ser evidenciada, registrada e posteriormente reconstruida.

Em termos simples:

- `ARCH-028` responde "pode mudar?";
- `ARCH-029` responde "como provar que mudou, quando mudou, por quem, e em que contexto?".

### 3.2 Relacao com a audit foundation

A fundacao de auditoria ja existente estabelece principios gerais de:

- rastreabilidade;
- correlacao;
- imutabilidade;
- leitura autorizada;
- separacao entre evento e auditoria.

Este documento nao redefine esses principios. Ele apenas os especializa para `Operation`.

### 3.3 Relacao com ARCH-023, ARCH-024 e ARCH-026

- `ARCH-023` formaliza a camada de aplicacao de `Operation`.
- `ARCH-024` formaliza orquestracao, correlacao e audit strategy.
- `ARCH-026` formaliza o modulo e o uso dos mecanismos oficiais de audit trail.

`ARCH-029` nao compete com esses documentos. Ele define a evidência de transicoes de estado como contrato conceitual futuro.

## 4. Responsabilidades do audit de Operation

O audit de `Operation` existe para registrar evidencias confiaveis de mutacoes relevantes do agregado.

### Responsabilidades oficiais

- registrar criacao, transicao, rejeicao, cancelamento e falha;
- registrar o estado anterior e o estado posterior;
- registrar autoria e contexto de execucao;
- preservar a linha temporal da operacao;
- permitir reconstruir a sequencia de decisoes sem depender de logs operacionais;
- suportar compliance, suporte, financeiro e investigacao futura;
- sustentar analise de conciliacao e governanca de fluxo.

### O que o audit de Operation nao faz

- nao decide se a transicao e valida;
- nao reexecuta a transicao;
- nao substitui o estado do agregado;
- nao e fonte primaria de negocio;
- nao substitui `ARCH-028`;
- nao corrige lacunas de modelagem por meio de log.

## 5. Relacao entre RequestId, CorrelationId e Idempotency-Key

Esses tres identificadores existem para finalidades diferentes e devem permanecer conceitualmente distintos.

### 5.1 RequestId

`RequestId` identifica a requisicao observavel em uma fronteira de entrada.

Uso recomendado:

- rastrear uma chamada especifica;
- correlacionar logs de entrada, aplicacao e resposta;
- organizar suporte operacional e observabilidade.

### 5.2 CorrelationId

`CorrelationId` identifica a linha de negocio ou processo que atravessa multiplos passos.

Uso recomendado:

- conectar comando, validacao, transicao, audit trail e eventos futuros;
- acompanhar uma jornada que pode atravessar varios handlers ou etapas;
- permitir agregacao de evidencia para uma mesma intenção de negocio.

### 5.3 Idempotency-Key

`Idempotency-Key` identifica a intenção de nao duplicar uma operacao de escrita quando a mesma solicitacao e reenviada.

Uso recomendado:

- evitar duplicidade de efeito em transicoes sensiveis;
- proteger chamadas repetidas por retry;
- distinguir "mesma intencao repetida" de "nova intencao de negocio".

### 5.4 Regra de relacionamento

Os tres devem ser correlacionaveis, mas nao equivalentes.

| Identificador | Papel principal | Pode se repetir? | Deve virar verdade de dominio? |
|---|---|---|---|
| `RequestId` | Observabilidade de requisicao | Pode variar a cada chamada | Nao |
| `CorrelationId` | Corrente de negocio / fluxo | Pode se repetir dentro do mesmo fluxo | Nao |
| `Idempotency-Key` | Protecao contra duplicidade | Deve ser reutilizado na repeticao da mesma intençao | Nao |

### 5.5 Regra de auditoria

Um registro de auditoria de `Operation` deve conseguir apontar para os tres quando eles existirem, mas nenhum deles substitui:

- a identidade da operacao;
- a identidade do ator;
- o par `previousStatus -> nextStatus`.

## 6. Conceito futuro de OperationStatusHistory

`OperationStatusHistory` e um conceito futuro para representar a trilha temporal das transicoes de status de uma `Operation`.

### 6.1 Intencao

O objetivo e registrar cada transicao relevante como uma evidência independente, append-only e consultavel.

### 6.2 Forma conceitual

O modelo futuro deve ser pensado como uma sequencia de eventos de estado ou registros historicos, contendo:

- identidade da operacao;
- status anterior;
- status novo;
- autor;
- timestamps;
- correlacao;
- origem da decisao;
- justificativa quando houver.

### 6.3 Nao confundir com estado atual

`OperationStatusHistory` nao substitui `Operation.status`.

- `Operation.status` e o estado atual.
- `OperationStatusHistory` e a evidencia historica.

### 6.4 Nao confundir com evento de dominio

`OperationStatusHistory` tambem nao e automaticamente um evento de dominio.

Ele pode ser:

- derivado de um comando aceito;
- derivado de um evento futuro;
- derivado de persistencia de auditoria.

Mas o historico nao deve ser usado como fonte primaria de mutacao.

## 7. Campos obrigatorios de auditoria

Os campos minimos conceituais para registrar auditoria de transicao de `Operation` sao:

- `tenantId`
- `operationId`
- `operationNumber`
- `previousStatus`
- `nextStatus`
- `actorId`
- `actorType` quando aplicavel
- `requestId`
- `correlationId`
- `idempotencyKey`
- `reason` quando houver
- `source`
- `occurredAt`
- `recordedAt`
- `decisionType`
- `changeKind`

### 7.1 Significado dos campos

- `tenantId`: isolamento multitenant.
- `operationId`: entidade auditada.
- `operationNumber`: identificador legivel de negocio.
- `previousStatus`: estado antes da transicao.
- `nextStatus`: estado depois da transicao.
- `actorId`: quem executou ou autorizou.
- `actorType`: humano, sistema, integracao ou automacao.
- `requestId`: rastreio de entrada.
- `correlationId`: rastreio de fluxo.
- `idempotencyKey`: defesa contra duplicidade.
- `reason`: justificativa ou motivo operacional.
- `source`: origem da decisao, como command, automation ou integration.
- `occurredAt`: momento de efetivacao do ato.
- `recordedAt`: momento de persistencia da evidencia.
- `decisionType`: approve, reject, cancel, fail ou settle, conforme aplicavel.
- `changeKind`: create, transition, reverse, cancel, fail, reconcile.

## 8. Regra de imutabilidade

Auditoria de `Operation` deve ser append-only.

### Regras oficiais

- nenhum registro anterior deve ser editado para parecer que a historia foi outra;
- nenhuma transicao auditada deve ser sobrescrita;
- correcao deve gerar nova evidência, nunca reescrever a antiga;
- remoção fisica de auditoria nao faz parte do contrato normal;
- reversao ou ajuste posterior deve ser registrado como novo fato, nao como reescrita.

### Consequencia

Se uma transicao foi audita, ela permanece como parte da historia do agregado mesmo que o estado atual mude depois.

## 9. Validacoes antes de registrar auditoria

Antes de uma evidencia futura ser registrada, a plataforma deve validar conceitualmente:

### 9.1 Validacao de transicao

- verificar se a transicao e valida segundo `ARCH-028`;
- verificar se o estado anterior confere com o estado observado;
- verificar se a transicao nao viola terminalidade.

### 9.2 Validacao de autoria

- verificar se existe ator identificavel;
- verificar se o ator tem permissao para a acao;
- verificar se o contexto de tenant e o correto.

### 9.3 Validacao de correlacao

- verificar se `requestId` e `correlationId` estao presentes quando exigidos pelo canal;
- verificar se a trilha de negocio esta coerente com a transicao;
- verificar se a idempotencia nao esta duplicando um fato ja registrado.

### 9.4 Validacao de consistencia

- verificar se a evidencia corresponde ao mesmo `operationId`;
- verificar se `operationNumber` e tenant batem com o agregado;
- verificar se o motivo informado faz sentido para o tipo de mudanca.

### 9.5 Validacao temporal

- verificar ordem cronologica;
- impedir que uma evidência posterior seja registrada como anterior;
- garantir que o historico nao contradiga o estado final do agregado.

## 10. Separacao entre validade e evidencia

Esta separacao e a regra arquitetural central do documento.

### 10.1 Validade da transicao

Definida por `ARCH-028`.

Pergunta respondida:

- a mudanca de status e permitida pelo lifecycle?

### 10.2 Evidencia da transicao

Definida por `ARCH-029`.

Perguntas respondidas:

- quem fez?
- quando fez?
- em qual contexto?
- com qual request?
- sob qual correlacao?
- foi uma acao repetida ou nova?

### 10.3 Implicacao pratica

Uma transicao pode ser:

- valida, mas ainda nao evidenciada;
- evidenciada, mas invalida se olhada fora do contrato;
- nem valida nem evidenciada.

O contrato correto exige que uma transicao so seja auditada quando for valida, mas a auditoria nao define a validade por si mesma.

## 11. Natureza da evidência

### 11.1 Evidencia nao e verdade concorrente

O audit trail nao deve competir com o estado persistido de `Operation`.

### 11.2 Evidencia nao e log tecnico

Logs operacionais podem existir em paralelo, mas nao substituem a evidencia formal de auditoria.

### 11.3 Evidencia nao e evento de dominio

Um evento de dominio pode existir no futuro, mas a evidencia de auditoria deve continuar sendo um registro separado e consultavel.

## 12. Uso esperado da history

`OperationStatusHistory` deve sustentar consultas como:

- quando a operacao entrou em um estado terminal;
- quem aprovou a transicao anterior;
- qual motivo levou ao cancelamento;
- qual fluxo de requests produziu a sequencia observada;
- se houve reenvio idempotente;
- se a transicao foi derivada de automacao ou de decisao humana.

## 13. Impacto em RBAC

O audit de `Operation` depende de permissao adequada para registro e leitura futura.

### Regras conceituais

- apenas atores autorizados devem produzir evidencias de mutacao;
- compliance e auditoria podem ter visao mais ampla;
- leitura de historia pode ser mais permissiva do que mutacao;
- permissao de mutar nao implica permissao de apagar ou reescrever evidencias.

## 14. Impacto em compliance e investicao

O objetivo do audit de `Operation` e permitir:

- verificacao de cadeia decisoria;
- analise de incidentes;
- rastreio de falhas;
- reconstrucao de historico em auditorias internas ou externas;
- validacao de acao humana versus automacao.

## 15. Relação com transicoes terminais

Transicoes para estados terminais exigem cuidado especial.

### Regras

- `REJECTED`, `FAILED`, `CANCELED` e `SETTLED` devem ser auditados com motivo e contexto;
- transicao terminal deve indicar claramente se encerra por negocio, falha ou conclusao financeira;
- reabertura nao e feita por reescrita do audit trail;
- qualquer correcao posterior deve ser novo fato, nao edicao do fato anterior.

## 16. Eventos futuros previstos

Os eventos futuros da superficie de `Operation` podem alimentar a auditoria, mas nao a substituem.

### Eventos relevantes

- `OperationCreated`
- `OperationProposalRequested`
- `OperationProposalReceived`
- `OperationProposalApproved`
- `OperationProposalRejected`
- `OperationExecuted`
- `OperationFailed`
- `OperationCanceled`
- eventos futuros de comissao e settlement, quando existirem em seus proprios dominios

### Regra

Se um evento existir, ele pode ser correlacionado com a auditoria. Mas a auditoria permanece um contrato proprio.

## 17. Critrios de aceite

Este documento cumpre seu papel quando:

- a distinção entre validade e evidencia estiver clara;
- `RequestId`, `CorrelationId` e `Idempotency-Key` estiverem conceitualmente separados;
- `OperationStatusHistory` estiver definido como conceito futuro;
- os campos obrigatorios de auditoria estiverem enumerados;
- a regra append-only estiver formalizada;
- as validacoes pre-auditoria estiverem descritas;
- nao houver duplicidade com `ARCH-028`, `ARCH-023`, `ARCH-024` ou `ARCH-026`.

## 18. Proxima fase recomendada

### Fase sugerida

`IMPL-08C - Operation Audit Evidence Contract`

### Objetivo

Formalizar, em contrato puro e sem runtime, a estrutura de evidencias futuras de `Operation`, quando houver autorizacao para materializacao de auditoria.

### Regra

Nenhuma implementacao deve criar persistencia ou escrita de auditoria antes de este documento e `ARCH-028` estarem aceitos como referencia de dominio.
