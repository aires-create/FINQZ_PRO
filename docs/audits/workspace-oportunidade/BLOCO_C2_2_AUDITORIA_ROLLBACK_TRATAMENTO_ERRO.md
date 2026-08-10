# BLOCO C2.2 - Auditoria Dirigida de Rollback e Tratamento de Erro

Data: 2026-08-10
Repositorio: `C:\Projects\FINQZ_PRO_HML_PROMOTION`
Branch auditada: `promotion/hml-g18-full`
HEAD auditado: `f9c5f906eab12ec11eac8bd80d7d346e72fb78e8`
Baseline remoto: `origin/promotion/hml-g18-full` em `f9c5f906eab12ec11eac8bd80d7d346e72fb78e8`

## Objetivo

Auditar exclusivamente o comportamento de erro do fluxo de mudanca de etapa da oportunidade, com foco em:

- ausencia de rollback avancado;
- ausencia de optimistic update;
- ausencia de lock ou stale guard;
- tratamento de erro do `PATCH /api/v1/opportunities/:id/stage`;
- relacao entre reconciliacao local imediata e refetch defensivo posterior.

Escopo desta auditoria:

- sem alteracoes de codigo de produto;
- sem execucao de testes, build ou comandos fora do escopo permitido;
- unica saida material do bloco: este documento.

## Baseline

Estado inicial validado antes da auditoria:

- `git status --short`: limpo
- `git branch --show-current`: `promotion/hml-g18-full`
- `git rev-parse HEAD`: `f9c5f906eab12ec11eac8bd80d7d346e72fb78e8`
- `git rev-parse origin/promotion/hml-g18-full`: `f9c5f906eab12ec11eac8bd80d7d346e72fb78e8`

## Fontes obrigatorias consultadas

- `docs/00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md`
- `docs/audits/workspace-oportunidade/BLOCO_C2_AUDITORIA_SINCRONIZACAO_ETAPA.md`
- `docs/audits/workspace-oportunidade/BLOCO_C2_1_RECONCILIACAO_MUDANCA_ETAPA.md`
- `docs/audits/workspace-oportunidade/BLOCO_C1_3_BUILDERS_PAYLOAD.md`
- `docs/audits/workspace-oportunidade/BLOCO_C1_4_IMPLEMENTACAO_MAPPING_LAYER.md`
- `docs/audits/workspace-oportunidade/BLOCO_C1_2_SAIDA_CANONICA_WORKSPACE.md`

## Arquivos auditados

Frontend:

- `src/pages/Oportunidades.tsx`
- `src/components/pipeline/workspaceOpportunity.ts`
- `src/api/modules/opportunities.api.ts`
- `src/api/modules/base.ts`
- `src/api/http.ts`
- `src/test/workspaceOpportunity.test.ts`
- `src/test/oportunidades-card-interaction.test.tsx`
- `src/test/oportunidades-kanban-hardening.test.ts`

Backend:

- `backend/src/modules/opportunities/routes.ts`
- `backend/src/modules/opportunities/services/opportunities.service.ts`
- `backend/src/modules/opportunities/validators/opportunities.validator.ts`
- `backend/src/tests/unit/opportunities.service.test.ts`
- `backend/src/tests/unit/opportunities.routes.test.ts`
- `backend/src/tests/integration/opportunities.test.ts`

## Arquitetura observada

Fluxo de sucesso confirmado no estado atual:

`moveStage response`
-> `mapOpportunityApiToWorkspaceInput`
-> `normalizeOpportunityWorkspace`
-> `OpportunityWorkspaceViewModel`
-> lista da Pipeline
-> `selectedLead` aberto

Evidencia:

- `src/pages/Oportunidades.tsx` usa `moveResponse?.data` tanto em `confirmarMudancaFase` quanto em `handleDrop`.
- `src/components/pipeline/workspaceOpportunity.ts` faz a traducao da entidade persistida para o shape canonico do workspace.
- `reconcileOpportunityWorkspace` substitui apenas a oportunidade reconciliada na lista e atualiza `selectedLead` apenas quando o id coincide.
- `setApiReadReloadKey` permanece como refetch defensivo de pos-confirmacao, nao como unica forma de sincronizacao.

## Fluxo 1: confirmacao de fase no workspace aberto

Funcao auditada: `confirmarMudancaFase`

Comportamento confirmado:

- bloqueia execucao para card legado sem id canonico;
- resolve `pipelineId` e `stageId` backend antes do `PATCH`;
- se o `stageId` backend nao puder ser resolvido, aborta antes da chamada remota;
- executa `opportunitiesApi.moveStage(...)` dentro de `try/catch`;
- em falha do `PATCH`, apenas registra `console.error`, exibe `alert` e retorna;
- em falha do `PATCH`, nao executa reconciliacao de lista;
- em falha do `PATCH`, nao atualiza `selectedLead`;
- em falha do `PATCH`, nao dispara `setApiReadReloadKey`;
- em falha do `PATCH`, nao fecha o seletor (`showFaseSelector` permanece aberto para retry manual);
- em sucesso, reconcilia a resposta persistida localmente e so depois agenda o refetch defensivo.

Conclusao:

- nao existe optimistic update;
- nao existe rollback, porque nenhum estado de negocio e alterado antes da confirmacao do backend;
- a tela preserva o estado anterior e informa erro de forma generica.

## Fluxo 2: drag and drop no kanban

Funcao auditada: `handleDrop`

Comportamento confirmado:

- bloqueia card legado sem id canonico;
- valida campos obrigatorios antes do `PATCH`;
- resolve `pipelineId` e `stageId` backend antes da chamada;
- grava `pendingMoveAuditRef` apenas para observabilidade;
- em falha do `PATCH`, registra `patchStatus: "error"` e `postGetStatus: "error"` no runtime audit;
- em falha do `PATCH`, registra `console.error`, exibe `alert`, limpa `draggedCard` e `dragOverColumn`, e retorna;
- em falha do `PATCH`, nao altera a lista;
- em falha do `PATCH`, nao altera `selectedLead`;
- em falha do `PATCH`, nao dispara refetch;
- em sucesso, reconcilia `moveResponse.data` localmente, registra observacao de sucesso e so entao agenda o refetch.

Conclusao:

- nao existe optimistic update;
- nao existe rollback de negocio;
- existe apenas limpeza explicita de estado transiente de drag;
- `pendingMoveAuditRef` nao atua como stale guard, lock ou corretor automatico de divergencia.

## Observabilidade de pos-GET

O efeito que observa `apiOportunidadesReadOnly` usa `pendingMoveAuditRef.current` apenas para:

- comparar `expectedStageId` vs `receivedStageId`;
- classificar `postGetStatus` como `success` ou `miss`;
- publicar observacoes no runtime report;
- limpar a referencia auditada.

Isso significa:

- nao reverte estado;
- nao bloqueia interacoes;
- nao reaplica PATCH;
- nao seleciona a versao "mais nova" entre respostas concorrentes;
- nao protege contra stale response.

Trata-se de telemetria passiva, nao de controle de fluxo.

## Contrato real de erro do backend

Rota auditada: `PATCH /api/v1/opportunities/:id/stage`

Contrato de entrada:

- `moveOpportunityStageBodySchema` aceita apenas:
- `stageId: uuid`
- `pipelineId?: uuid`

Validacoes e retornos confirmados:

- `400 VALIDATION_ERROR` para body invalido via Zod;
- `400 INVALID_REQUEST` para pipeline/stage invalido ou stage fora do pipeline;
- `403 FORBIDDEN` para violacao de escopo de tenant;
- `404 NOT_FOUND` para oportunidade nao encontrada;
- `500 INTERNAL_ERROR` para erro nao classificado.

Servico `moveStage` confirmado:

- busca a oportunidade atual antes da mutacao;
- valida escopo de acesso;
- valida consistencia entre pipeline e stage;
- persiste apenas `stageId` e `pipelineId` quando presente;
- faz `findById` apos o update;
- retorna a entidade persistida ja reidratada;
- registra audit log com `previousPipelineId`, `previousStageId`, `pipelineId`, `stageId`.

## Tratamento de erro no frontend

Camada HTTP:

- `apiCall` converte respostas nao-OK em `ApiException`;
- a mensagem e derivada de `error.message`, `message`, `error string` ou fallback por status;
- `src/api/http.ts` possui mensagens padrao para `400`, `401`, `403`, `404`, `422`, `429`, `500`, `502`, `503`.

Camada da pagina:

- `confirmarMudancaFase` e `handleDrop` tratam erro apenas de forma generica;
- ambas as funcoes exibem `alert` com `error.message`;
- nao ha branching por `status`;
- nao ha UX distinta para `400`, `403`, `404` ou `500`;
- nao ha retry automatico;
- nao ha refresh forcado no erro;
- nao ha restauracao de snapshot local.

Conclusao:

- o tratamento e simples, coerente com ausencia de optimistic update;
- o usuario recebe feedback textual, mas sem granularidade por classe de erro.

## Cobertura de testes encontrada

Cobertura positiva existente:

- `src/test/workspaceOpportunity.test.ts`
  - valida `buildMoveStagePayload`;
  - valida `reconcileOpportunityWorkspace`;
  - confirma substituicao por id;
  - confirma preservacao de aliases canonicos;
  - confirma nao mutacao da entrada.

- `src/test/oportunidades-card-interaction.test.tsx`
  - valida reconciliacao do card e do workspace aberto apos resposta persistida de `moveStage`.

- `src/test/oportunidades-kanban-hardening.test.ts`
  - valida reconciliacao da movimentacao persistida;
  - valida preservacao de `stageId` oficial.

- `backend/src/tests/unit/opportunities.service.test.ts`
  - valida `moveStage` feliz;
  - valida rejeicao de stage inativo;
  - valida rejeicao de stage fora do pipeline.

- `backend/src/tests/unit/opportunities.routes.test.ts`
  - valida `403` sem permissao `opportunity:move_stage`.

- `backend/src/tests/integration/opportunities.test.ts`
  - valida `403` sem permissao `opportunity:move_stage`.

Gap de cobertura confirmado:

- nao foi encontrado teste frontend exercitando falha de `moveStage` no `confirmarMudancaFase`;
- nao foi encontrado teste frontend exercitando falha de `moveStage` no `handleDrop`;
- nao foi encontrado teste frontend validando explicitamente que lista e `selectedLead` permanecem intactos em erro remoto;
- nao foi encontrado teste frontend validando limpeza de `draggedCard` e `dragOverColumn` apos erro remoto.

## Achados

### A1. Nao ha rollback avancado nem optimistic update no estado atual

Classificacao: conforme esperado

Evidencia:

- a UI so reconcilia estado de negocio apos `moveResponse.data`;
- em erro, a lista e o `selectedLead` permanecem como estavam;
- o refetch nao e a unica estrategia de reconciliacao no sucesso, mas tambem nao e usado para tentar "consertar" erro.

### A2. O frontend nao diferencia classes de erro do `moveStage`

Classificacao: risco moderado de UX, sem violacao arquitetural

Impacto:

- `400`, `403`, `404` e `500` acabam convergindo para `alert(...)` com mensagem textual;
- o usuario nao recebe orientacao especifica por tipo de falha;
- isso nao introduz inconsistencia de dados, mas reduz observabilidade de produto.

### A3. A cobertura automatizada do frontend para erro remoto e insuficiente

Classificacao: gap de teste

Impacto:

- o comportamento auditado foi confirmado por leitura de codigo, nao por teste direcionado existente;
- regressao futura no caminho de erro pode passar despercebida se alterar `selectedLead`, lista ou limpeza de drag.

## Matriz de decisao

### ROLLBACK

- nao existe rollback funcional de entidade a implementar no estado atual;
- a lista permanece intacta em falha;
- o `selectedLead` permanece intacto em falha;
- nao existe optimistic update previo que exija restauracao;
- persistencia incerta por falha de transporte deve ser tratada com leitura autoritativa futura, nao com restauracao cega.

### CLEANUP

- existe apenas cleanup de estado transitorio de drag, com limpeza explicita de `draggedCard` e `dragOverColumn`;
- esse cleanup nao altera entidade persistida nem reconstrui snapshot;
- eventual refinamento adicional de UX continua sendo tema separado de rollback funcional.

### RECONCILIACAO

- a reconciliacao acontece somente no sucesso, a partir da resposta persistida do backend;
- o refetch defensivo atual nao equivale a rollback;
- o refetch defensivo atua como verificacao posterior, nao como mecanismo de restauracao;
- a trilha atual continua sendo resposta persistida -> mapping -> normalize -> view model -> lista -> `selectedLead`.

### NENHUMA ACAO

- nao introduzir snapshot artificial;
- nao introduzir rollback avancado sem necessidade comprovada;
- nao introduzir lock;
- nao introduzir stale guard dentro deste bloco documental;
- nao alterar runtime neste fechamento do C2.2.

## Classificacao Go-Live

Classificacao para V1:

- implementacao de rollback avancado: NAO BLOQUEANTE / pos-Go-Live enquanto nao houver optimistic update;
- cobertura automatizada de erro do `moveStage`: realizar antes do fechamento do Workspace;
- concorrencia e stale responses: avaliar separadamente no C2.3 com foco exclusivo em blocker de Go-Live.

## Parecer tecnico

O estado atual respeita a arquitetura consolidada no C2.1:

- usa a resposta persistida do `PATCH` no caminho feliz;
- reconcilia por id;
- substitui apenas a oportunidade correta;
- atualiza `selectedLead` somente quando o mesmo id esta aberto;
- preserva `selectedLead` de outra oportunidade;
- mantem `stageId` como campo canonico;
- espelha `stage_id` e `etapa_id`;
- recalcula `stageLabel`;
- mantem `etapa` como alias visual;
- preserva o refetch apenas como camada defensiva;
- nao introduz optimistic update;
- nao introduz rollback avancado;
- nao introduz lock;
- nao introduz stale guard.

Do ponto de vista de integridade de estado, nao foi identificado mecanismo indevido de reversao nem mutacao prematura no erro.

Do ponto de vista de robustez, permanece um gap objetivo de cobertura automatizada no frontend para falhas do `moveStage`.

## Conclusao

Resultado da auditoria C2.2:

- sem bloqueador arquitetural novo;
- sem evidencia de rollback indevido;
- sem evidencia de optimistic update;
- sem evidencia de stale guard ou lock;
- com gap residual de testes no caminho de erro do frontend;
- com tratamento de erro funcional, porem generico, no nivel de UX.
