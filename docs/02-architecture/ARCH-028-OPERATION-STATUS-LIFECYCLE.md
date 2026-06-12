# ARCH-028 - Operation Status Lifecycle

## 1. Objetivo

Definir o lifecycle oficial de `Operation` antes de qualquer implementacao de transicao de status, mantendo a separacao correta entre:

- o lifecycle global do `Workspace`, ja definido em `ARCH-019`;
- o lifecycle interno e especifico do agregado `Operation`;
- os futuros dominios de `Commission` e `Settlement`.

Este documento existe para eliminar ambiguidade sobre:

- quais estados de `OperationStatus` sao oficiais;
- quais estados sao terminais;
- quais transicoes sao permitidas ou proibidas;
- qual e o impacto de cada transicao em RBAC, auditoria, Opportunity, Proposal, Commission e Settlement.

## 2. Escopo

Este documento cobre apenas o lifecycle conceitual de `Operation`.

Inclui:

- auditar todos os `OperationStatus` existentes no schema;
- definir estados terminais e transitorios;
- mapear transicoes validas e proibidas;
- definir regras de reversao, cancelamento e falha;
- explicitar relacao com `Workspace`, `Opportunity` e `Proposal`;
- antecipar impactos futuros em `Commission` e `Settlement`;
- formalizar requisitos de RBAC e audit trail.

Nao inclui:

- alteracao de schema Prisma;
- alteracao de runtime;
- criacao de migration;
- criacao de endpoint, service, handler, controller ou route;
- criacao de `Settlement`;
- criacao de `Commission V2`;
- implementacao de transicoes em codigo.

## 3. Estados existentes

O enum oficial existente em `backend/prisma/schema.prisma` e:

```text
CREATED
PROPOSAL_REQUESTED
PROPOSAL_RECEIVED
PROPOSAL_APPROVED
EXECUTED
COMMISSION_CALCULATED
SETTLEMENT_PENDING
SETTLED
REJECTED
FAILED
CANCELED
```

### Classificacao arquitetural

| Status | Tipo | Papel |
|---|---|---|
| `CREATED` | Transitorio | Abertura oficial da `Operation`. |
| `PROPOSAL_REQUESTED` | Transitorio | Solicitacao formal de proposta. |
| `PROPOSAL_RECEIVED` | Transitorio | Retorno de proposta recebido e validado. |
| `PROPOSAL_APPROVED` | Transitorio | Proposta aceita internamente e apta a avancar. |
| `EXECUTED` | Transitorio | Execucao financeira efetivada. |
| `COMMISSION_CALCULATED` | Transitorio | Base de comissao reconhecida para o futuro dominio financeiro. |
| `SETTLEMENT_PENDING` | Transitorio | Operacao aguardando liquidacao/confirmacao financeira. |
| `SETTLED` | Terminal | Encerramento financeiro concluido. |
| `REJECTED` | Terminal | Fluxo recusado por criterio de negocio ou governanca. |
| `FAILED` | Terminal | Fluxo interrompido por falha material ou tecnica irreversivel. |
| `CANCELED` | Terminal | Fluxo encerrado por decisao consciente ou administrativa. |

### Leitura oficial

`OperationStatus` deve ser lido como lifecycle interno da raiz `Operation`, e nao como espelho do estado global do workspace.

## 4. Estados terminais

Os estados terminais oficiais de `Operation` sao:

```text
SETTLED
REJECTED
FAILED
CANCELED
```

### Significado

- `SETTLED`: o ciclo financeiro terminou com confirmacao final.
- `REJECTED`: a operacao nao foi aceita para seguir adiante.
- `FAILED`: ocorreu falha material que impede continuidade segura.
- `CANCELED`: houve interrupcao intencional, administrativa ou operacional.

### Observacao importante

`SETTLEMENT_PENDING` nao e terminal. Ele representa espera ativa por confirmacao de liquidacao.

## 5. Estados transitorios

Os estados transitorios oficiais sao:

- `CREATED`
- `PROPOSAL_REQUESTED`
- `PROPOSAL_RECEIVED`
- `PROPOSAL_APPROVED`
- `EXECUTED`
- `COMMISSION_CALCULATED`
- `SETTLEMENT_PENDING`

### Leitura funcional

- `CREATED` inicia o agregado.
- `PROPOSAL_REQUESTED`, `PROPOSAL_RECEIVED` e `PROPOSAL_APPROVED` representam a fase comercial de entrada e validacao.
- `EXECUTED` marca a virada para execucao financeira.
- `COMMISSION_CALCULATED` prepara o terreno para o dominio futuro de comissao.
- `SETTLEMENT_PENDING` prepara o encerramento financeiro.

## 6. Diagrama textual de transicoes

### Fluxo principal

```text
CREATED
  -> PROPOSAL_REQUESTED
  -> PROPOSAL_RECEIVED
  -> PROPOSAL_APPROVED
  -> EXECUTED
  -> COMMISSION_CALCULATED
  -> SETTLEMENT_PENDING
  -> SETTLED
```

### Saidas terminais antecipadas

```text
CREATED
  -> REJECTED
  -> CANCELED
  -> FAILED

PROPOSAL_REQUESTED
  -> REJECTED
  -> CANCELED
  -> FAILED

PROPOSAL_RECEIVED
  -> REJECTED
  -> CANCELED
  -> FAILED

PROPOSAL_APPROVED
  -> REJECTED
  -> CANCELED
  -> FAILED

EXECUTED
  -> FAILED

COMMISSION_CALCULATED
  -> FAILED

SETTLEMENT_PENDING
  -> FAILED
```

### Regra de leitura

O diagrama acima representa o caminho recomendado e os encerramentos aceitos. Qualquer transicao fora dele deve ser tratada como proibida, salvo se um contrato futuro de governanca explicitar excecao formal.

## 7. Matriz de transicoes validas

| De | Para | Status | Regra |
|---|---|---|---|
| `CREATED` | `PROPOSAL_REQUESTED` | Validada | Inicio da etapa de proposta. |
| `CREATED` | `REJECTED` | Validada | Operacao recusada antes de seguir. |
| `CREATED` | `CANCELED` | Validada | Encerramento voluntario antes da continuidade. |
| `CREATED` | `FAILED` | Validada | Falha material na abertura ou validacao inicial. |
| `PROPOSAL_REQUESTED` | `PROPOSAL_RECEIVED` | Validada | Retorno da proposta recebido e validado. |
| `PROPOSAL_REQUESTED` | `REJECTED` | Validada | Proposta nao foi obtida ou foi negada. |
| `PROPOSAL_REQUESTED` | `CANCELED` | Validada | Interrupcao antes de consolidar a proposta. |
| `PROPOSAL_REQUESTED` | `FAILED` | Validada | Falha tecnica ou de negocio na solicitacao. |
| `PROPOSAL_RECEIVED` | `PROPOSAL_APPROVED` | Validada | Proposta aceita internamente. |
| `PROPOSAL_RECEIVED` | `REJECTED` | Validada | Proposta recusada apos avaliacao. |
| `PROPOSAL_RECEIVED` | `CANCELED` | Validada | Interrupcao antes de aprovacao. |
| `PROPOSAL_RECEIVED` | `FAILED` | Validada | Falha material na avaliacao ou integracao. |
| `PROPOSAL_APPROVED` | `EXECUTED` | Validada | Liberacao para execucao financeira. |
| `PROPOSAL_APPROVED` | `REJECTED` | Validada | Governanca posterior invalida o avanco antes da execucao. |
| `PROPOSAL_APPROVED` | `CANCELED` | Validada | Cancelamento antes da execucao efetiva. |
| `PROPOSAL_APPROVED` | `FAILED` | Validada | Bloqueio irreversivel antes da execucao. |
| `EXECUTED` | `COMMISSION_CALCULATED` | Validada | Execucao consolidada e base de comissao reconhecida. |
| `EXECUTED` | `FAILED` | Validada | Falha material posterior a execucao, antes do fechamento financeiro. |
| `COMMISSION_CALCULATED` | `SETTLEMENT_PENDING` | Validada | Comissao reconhecida e fluxo pronto para liquidacao. |
| `COMMISSION_CALCULATED` | `FAILED` | Validada | Falha material no encadeamento financeiro posterior. |
| `SETTLEMENT_PENDING` | `SETTLED` | Validada | Confirmacao final de liquidacao. |
| `SETTLEMENT_PENDING` | `FAILED` | Validada | Falha na conciliacao, liquidacao ou confirmacao. |

### Nota de governanca

As transicoes de `REJECTED`, `CANCELED` e `FAILED` sao sempre terminais neste desenho. Depois de entrar em um estado terminal, a `Operation` nao deve seguir adiante por simples mutacao de status.

## 8. Matriz de transicoes proibidas

As transicoes abaixo sao proibidas por desenho:

| De | Para | Motivo |
|---|---|---|
| `CREATED` | `EXECUTED` | Pula a etapa de proposta e aprovacao. |
| `CREATED` | `COMMISSION_CALCULATED` | Pula a execucao e a base de elegibilidade. |
| `CREATED` | `SETTLEMENT_PENDING` | Pula a execucao e o reconhecimento financeiro. |
| `CREATED` | `SETTLED` | Pula todo o ciclo operacional. |
| `PROPOSAL_REQUESTED` | `EXECUTED` | Nao ha proposta recebida/aprovada ainda. |
| `PROPOSAL_REQUESTED` | `COMMISSION_CALCULATED` | Pula etapas obrigatorias. |
| `PROPOSAL_REQUESTED` | `SETTLEMENT_PENDING` | Pula etapas obrigatorias. |
| `PROPOSAL_REQUESTED` | `SETTLED` | Pula etapas obrigatorias. |
| `PROPOSAL_RECEIVED` | `EXECUTED` | Nao ha aprovacao formal ainda. |
| `PROPOSAL_RECEIVED` | `COMMISSION_CALCULATED` | Pula aprovacao e execucao. |
| `PROPOSAL_RECEIVED` | `SETTLEMENT_PENDING` | Pula aprovacao e execucao. |
| `PROPOSAL_RECEIVED` | `SETTLED` | Pula aprovacao e execucao. |
| `PROPOSAL_APPROVED` | `COMMISSION_CALCULATED` | Pula a execucao. |
| `PROPOSAL_APPROVED` | `SETTLEMENT_PENDING` | Pula a execucao. |
| `PROPOSAL_APPROVED` | `SETTLED` | Pula a execucao. |
| `EXECUTED` | `PROPOSAL_REQUESTED` | Retrocesso comercial inadequado depois da execucao. |
| `EXECUTED` | `PROPOSAL_RECEIVED` | Retrocesso comercial inadequado depois da execucao. |
| `EXECUTED` | `PROPOSAL_APPROVED` | Retrocesso comercial inadequado depois da execucao. |
| `EXECUTED` | `SETTLED` | Liquida sem trilha financeira intermediaria. |
| `COMMISSION_CALCULATED` | `PROPOSAL_REQUESTED` | Pula para tras atraves da fase comercial. |
| `COMMISSION_CALCULATED` | `PROPOSAL_RECEIVED` | Pula para tras atraves da fase comercial. |
| `COMMISSION_CALCULATED` | `PROPOSAL_APPROVED` | Pula para tras atraves da fase comercial. |
| `COMMISSION_CALCULATED` | `EXECUTED` | Redundante e nao permitida como regressao comum. |
| `COMMISSION_CALCULATED` | `SETTLED` | Pula a etapa de settlement pendente. |
| `SETTLEMENT_PENDING` | `PROPOSAL_REQUESTED` | Retrocesso fora de faixa. |
| `SETTLEMENT_PENDING` | `PROPOSAL_RECEIVED` | Retrocesso fora de faixa. |
| `SETTLEMENT_PENDING` | `PROPOSAL_APPROVED` | Retrocesso fora de faixa. |
| `SETTLEMENT_PENDING` | `EXECUTED` | Rebaixamento sem regra formal de reversao. |
| `SETTLEMENT_PENDING` | `COMMISSION_CALCULATED` | Rebaixa sem regra formal de reversao. |
| `SETTLED` | qualquer estado anterior | Terminal financeiro nao reabre por simples status mutation. |
| `REJECTED` | qualquer estado nao terminal | Terminal de recusa nao reabre por simples status mutation. |
| `CANCELED` | qualquer estado nao terminal | Terminal de cancelamento nao reabre por simples status mutation. |
| `FAILED` | qualquer estado nao terminal | Terminal de falha nao reabre por simples status mutation. |

### Regra geral

Se um caminho nao estiver listado como valido, ele deve ser considerado proibido.

## 9. Regras de reversao

Reversao, neste contexto, significa regresso controlado para um estado anterior ainda nao terminal.

### Regras oficiais

- Nao existe reversao silenciosa.
- Nao existe reversao automatica sem auditoria.
- Reversao sempre exige justificativa, autoria e correlacao.
- Reversao nunca deve atravessar um estado terminal.
- Reversao depois de `EXECUTED` deve ser tratada como excecao estritamente governada, nao como mecanismo normal.

### Reversoes aceitaveis neste desenho

| De | Para | Condicao |
|---|---|---|
| `PROPOSAL_APPROVED` | `PROPOSAL_RECEIVED` | Proposta recebeu alteracao material e precisa ser reavaliada. |
| `PROPOSAL_RECEIVED` | `PROPOSAL_REQUESTED` | Nova solicitacao foi emitida porque a anterior ficou invalida ou obsoleta. |

### Regra de prudencia

Se houver duvida entre regressao e novo ciclo, o desenho recomendado e abrir novo marco auditavel em vez de reescrever o status de maneira opaca.

## 10. Regras de cancelamento

Cancelamento e um encerramento intencional, nao uma falha tecnica.

### Regras oficiais

- `CANCELED` e terminal.
- cancelamento exige decisao explicita e auditavel;
- cancelamento deve registrar motivo, ator e contexto;
- cancelamento e permitido apenas antes de `EXECUTED` neste desenho base;
- depois de `EXECUTED`, qualquer interrupcao deve ser tratada por contrato futuro de reversao financeira, nao por simples cancelamento de `Operation`.

### Interpretacao

- use `CANCELED` quando a operacao foi interrompida por escolha humana, regra administrativa ou estrategia de negocio;
- nao use `CANCELED` para mascarar erro tecnico;
- nao use `CANCELED` para representar proposta recusada.

## 11. Regras de falha

Falha e um encerramento terminal para casos em que a operacao nao pode continuar de forma segura, consistente ou recuperavel dentro do desenho atual.

### Regras oficiais

- `FAILED` e terminal;
- falha deve ser auditavel com causa raiz, etapa e contexto;
- falha nao substitui rejeicao nem cancelamento;
- falha deve ser usada quando a operacao nao pode progredir por erro material, tecnico ou de integracao;
- falha pode ocorrer em qualquer estado nao terminal, inclusive apos `EXECUTED`, quando a continuidade segura deixar de existir antes do encerramento financeiro.

### Leitura recomendada

- se a decisao foi de negocio, prefira `REJECTED` ou `CANCELED`;
- se o problema e material, prefira `FAILED`;
- se houve confirmacao final de liquidacao, o unico terminal valido e `SETTLED`.

## 12. Relacao com Workspace State Machine

`ARCH-019` continua sendo o lifecycle global do workspace. `OperationStatus` nao substitui nem fragmenta esse contrato.

### Regra central

- Workspace e o lifecycle global da oportunidade como unidade operacional.
- `Operation` e o lifecycle interno do agregado financeiro e de execucao.
- Um nao deve ser usado como proxy do outro.

### Relacao recomendada

| Workspace | Operation | Leitura arquitetural |
|---|---|---|
| `NEW` | `CREATED` | O contexto existe, mas a operacao ainda esta nascendo. |
| `QUALIFIED` | `CREATED` ou `PROPOSAL_REQUESTED` | O workspace esta apto, mas a operacao ainda consolida sua entrada. |
| `SIMULATED` | `PROPOSAL_REQUESTED` ou `PROPOSAL_RECEIVED` | A operacao pode estar consumindo resultado comercial. |
| `PROPOSED` | `PROPOSAL_RECEIVED` ou `PROPOSAL_APPROVED` | A proposta ja existe e pode estar em validacao interna. |
| `APPROVED` | `PROPOSAL_APPROVED` | A aprovacao comercial foi consolidada. |
| `OPERATED` | `EXECUTED` | A execucao financeira efetiva ocorreu. |
| `COMMISSIONED` | `COMMISSION_CALCULATED` | A base de comissao foi reconhecida. |
| `SETTLED` | `SETTLED` | O encerramento financeiro foi confirmado. |

### Implicacao

O workspace pode observar `Operation` para compor visoes globais, mas a verdade de `OperationStatus` permanece no dominio de `Operation`.

## 13. Relacao com Opportunity

`Opportunity` e a origem contextual de negocio. `Operation` e a raiz de execucao financeira derivada desse contexto.

### Regras oficiais

- `Operation` pertence a uma `Opportunity`.
- `Opportunity` nao deve ser substituida por `Operation`.
- `OperationStatus` nao deve ser usado como proxy de pipeline, stage ou ownership da `Opportunity`.
- mudanca em `OperationStatus` nao altera automaticamente o lifecycle comercial da `Opportunity`.

### Leitura pratica

`Opportunity` responde a "o negocio esta maduro?". `Operation` responde a "a execucao financeira esta andando e em que fase esta?".

## 14. Relacao com Proposal

`Proposal` e a referencia canonica de condicoes antes da execucao. No contrato atual, isso continua alinhado ao `BankProposal` persistido.

### Regras oficiais

- `PROPOSAL_REQUESTED` representa a abertura formal da solicitacao;
- `PROPOSAL_RECEIVED` representa o retorno valido da proposta;
- `PROPOSAL_APPROVED` representa aceite interno ou autorizacao para seguir;
- `REJECTED` pode registrar recusa da proposta ou impossibilidade de avancar;
- `Operation` nao deve saltar para `EXECUTED` sem passar por aprovacao valida.

### Observacao

Se a proposta for alterada antes da execucao, a reversao controlada deve manter rastreabilidade e nunca apagar a historia original.

## 15. Relacao futura com Commission

`Commission` continua sendo derivada de `Operation` executada, nao o contrario.

### Regras oficiais

- `EXECUTED` e o gatilho conceitual minimo para habilitar o dominio futuro de comissao.
- `COMMISSION_CALCULATED` indica elegibilidade de distribuicao, nao liquidacao de comissao.
- `Operation` nao deve carregar regra de rateio, repasse ou pagamento de comissao.
- `Commission` futura deve referenciar uma `Operation` executada e rastreavel.

### Impacto arquitetural

`OperationStatus` precisa permanecer suficientemente granular para que o futuro motor de comissao consiga distinguir:

- operacao ainda em proposta;
- operacao executada;
- operacao pronta para calculo;
- operacao ja encaminhada para settlement.

## 16. Relacao futura com Settlement

`Settlement` continua sendo um dominio futuro separado. `Operation` apenas antecipa a fase financeira.

### Regras oficiais

- `SETTLEMENT_PENDING` e o estado que indica espera por liquidacao ou confirmacao financeira;
- `SETTLED` e o encerramento oficial do ciclo;
- `Operation` nao deve executar settlement real;
- `Operation` nao deve substituir o contrato futuro de conciliacao, pagamento ou baixa financeira.

### Impacto arquitetural

O futuro `Settlement` deve conseguir operar sem reescrever o lifecycle de `Operation`. A operacao apenas fornece contexto, rastreabilidade e estado final esperado.

## 17. RBAC por transicao

RBAC deve validar tanto a acao quanto o contexto da transicao.

### Diretriz geral

- transicoes iniciais podem ser feitas por perfis operacionais e comerciais autorizados;
- aprovacao e rejeicao exigem autoridade formal;
- transicoes financeiras exigem permissao financeira ou automacao confiavel;
- encerramentos terminais exigem permissao apropriada e audicao completa.

### Matriz conceitual

| Transicao | Atores tipicos permitidos |
|---|---|
| `CREATED -> PROPOSAL_REQUESTED` | Operacoes, comercial autorizado, sistema de orquestracao. |
| `CREATED -> CANCELED` | Criador, gestor, admin, compliance quando permitido. |
| `CREATED -> REJECTED` | Regra automatica, compliance, gestor autorizado. |
| `PROPOSAL_REQUESTED -> PROPOSAL_RECEIVED` | Integracao autorizada, operacoes, sistema. |
| `PROPOSAL_RECEIVED -> PROPOSAL_APPROVED` | Gestor comercial, aprovador designado, compliance quando exigido. |
| `PROPOSAL_RECEIVED -> REJECTED` | Aprovador, compliance, automacao de governanca. |
| `PROPOSAL_APPROVED -> EXECUTED` | Operacoes, financeiro, orquestracao autorizada. |
| `EXECUTED -> COMMISSION_CALCULATED` | Financeiro, sistema de comissao futuro, orquestracao autorizada. |
| `COMMISSION_CALCULATED -> SETTLEMENT_PENDING` | Financeiro, sistema de settlement futuro, orquestracao autorizada. |
| `SETTLEMENT_PENDING -> SETTLED` | Financeiro, integracao de settlement, conciliacao autorizada. |
| `qualquer -> FAILED` | Integracao tecnica, sistema, operador autorizado em contexto de incidente. |

### Regra de seguranca

Usuarios sem permissao nao devem conseguir forcar transicao apenas por conhecer o status alvo.

## 18. Audit requirements

Toda transicao relevante de `Operation` deve ser auditavel.

### Campos minimos esperados

- `tenantId`
- `operationId`
- `previousStatus`
- `nextStatus`
- `actorId`
- `correlationId`
- `reason`
- `timestamp`
- `sourceCommand` ou `sourceEvent`
- `opportunityId`
- `bankProposalId` quando houver

### Requisitos adicionais

- a auditoria deve ser imutavel;
- cancelamento, rejeicao, falha e reversao devem ter justificativa explicita;
- a auditoria deve permitir reconstruir a sequencia de status sem depender de estado mutavel isolado;
- evento e auditoria devem ser correlacionaveis, mas nao equivalentes;
- o workspace nao deve perder contexto auditavel quando observar transicoes de `Operation`.

## 19. Eventos futuros previstos

Os eventos previstos para governar esse lifecycle sao os ja alinhados nos docs anteriores, com a seguinte leitura:

### Eventos de Operation

- `OperationCreated`
- `OperationProposalRequested`
- `OperationProposalReceived`
- `OperationProposalApproved`
- `OperationProposalRejected`
- `OperationExecuted`
- `OperationFailed`
- `OperationCanceled`

### Eventos financeiros e derivados

- `CommissionCalculated`
- `SettlementRequested`
- `SettlementConfirmed`
- `SettlementFailed`

### Regra de uso

- eventos de `Operation` devem refletir transicoes reais do agregado;
- eventos financeiros futuros nao devem substituir o estado de `Operation`;
- eventos derivados nao devem reescrever o contrato oficial do workspace.

## 20. Criterios de aceite

Este documento pode ser considerado aprovado quando:

- todos os `OperationStatus` existentes estiverem documentados;
- estados terminais e transitorios estiverem distinguidos;
- transicoes validas e proibidas estiverem explicitadas;
- regras de reversao, cancelamento e falha estiverem formalizadas;
- relacao com `Workspace`, `Opportunity`, `Proposal`, `Commission` e `Settlement` estiver clara;
- impacto em RBAC e auditoria estiver documentado;
- nao houver conflito com `ARCH-019`;
- nao houver tentativa de substituir o lifecycle global do workspace.

## 21. Proxima fase recomendada

### Fase sugerida

`IMPL-08B - Operation Status Transition Enforcement`

### Objetivo da fase

Formalizar a politica de validacao e o contrato de transicao para que, em uma implementacao futura, a mudanca de status seja:

- validada por regra de dominio;
- protegida por RBAC;
- auditavel de ponta a ponta;
- consistente com o workspace e com os dominios futuros.

### Regra

Nenhuma implementacao deve comecar antes que o lifecycle aqui definido seja aceito como contrato oficial.
