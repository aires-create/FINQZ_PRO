# BLOCO C2 - AUDITORIA DIRIGIDA DA SINCRONIZACAO DE ETAPA

Data: 2026-08-03
Branch: `promotion/hml-g18-full`
Commit-base auditado: `cac75daceda455041d3856b24e69f1b6075ffb45`
Escopo: somente leitura, rastreamento ponta a ponta, sem alteracao funcional

## Resumo executivo

Conclusao central: o campo canonico persistido de etapa ja e `stageId`, o builder canonico de mudanca de etapa existe e o backend valida `tenant`, `pipeline`, `stage` e permissao dedicada, mas a reconciliacao de UI ainda e parcial.

O caminho real de mudanca de etapa hoje e:

`card/workspace -> buildMoveStagePayload() -> opportunitiesApi.moveStage() -> PATCH /api/v1/opportunities/:id/stage -> opportunitiesService.moveStage() -> opportunitiesRepository.moveStage() -> Prisma Opportunity.stageId -> getAll() -> mapApiOpportunityToWorkspaceInput() -> normalizeOpportunityWorkspace() -> rebuild do kanban`

Principais achados:

- `stageId` e o identificador tecnico canonico persistido no frontend oficial, backend e Prisma.
- `stageLabel` e derivado no normalizador a partir de `stage.name` projetado ou do `stageCatalog`; nao e persistido.
- `stage_id` e `etapa_id` continuam expostos como compatibilidade em `normalizeOpportunityWorkspace()`; `etapa` segue semantica visual/legada.
- drag-and-drop e Workspace usam `buildMoveStagePayload()`, mas ambos ignoram a resposta da mutation e dependem de `setApiReadReloadKey()` para reconciliar a lista.
- nao existe update otimista definitivo do card no fluxo atual auditado; existe refetch posterior.
- nao existe snapshot de rollback para lista ou modal; em falha o fluxo apenas exibe `alert`/erro e interrompe.
- `selectedLead` nao e reconciliado automaticamente apos `moveStage`; o modal pode divergir da lista ate reabertura.
- o backend bloqueia stage de outro pipeline e de outro tenant no service, mas o banco nao materializa constraint cruzada `Opportunity.pipelineId` x `Opportunity.stageId`.
- nao foi identificado risco P0 confirmado.

## Documentos consultados

| Documento | Papel | Conformidade |
|---|---|---|
| `docs/00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md` | SSOT de continuidade arquitetural | Conforme; reforca backend como fonte principal de regras |
| `docs/audits/workspace-oportunidade/BLOCO_C0_MAPA_OFICIAL_OPPORTUNITY.md` | mapa oficial de campos e aliases | Conforme; consolida `stageId` como canonicamente persistido |
| `docs/audits/workspace-oportunidade/BLOCO_C_AUDITORIA_TECNICA.md` | baseline tecnico do workspace | Parcialmente conforme; descreve fluxo com store legado que hoje esta menos central |
| `docs/audits/workspace-oportunidade/BLOCO_C1_AUDITORIA_CONTRATO_NORMALIZACAO.md` | auditoria do contrato do normalizador | Conforme |
| `docs/audits/workspace-oportunidade/BLOCO_C1_1_CONTRATO_ENTRADA_NORMALIZADOR.md` | contrato de entrada | Conforme |
| `docs/audits/workspace-oportunidade/BLOCO_C1_2_SAIDA_CANONICA_WORKSPACE.md` | saida canonica do VM | Conforme |
| `docs/audits/workspace-oportunidade/BLOCO_C1_3_BUILDERS_PAYLOAD.md` | camada de builders | Conforme; `buildMoveStagePayload` e a via oficial |
| `docs/audits/workspace-oportunidade/BLOCO_C1_4_AUDITORIA_MAPPING_LAYER.md` | auditoria da mapping layer | Conforme |
| `docs/audits/workspace-oportunidade/BLOCO_C1_4_IMPLEMENTACAO_MAPPING_LAYER.md` | implementacao de leitura consolidada | Conforme; leitura oficial passa por mapping layer e normalizador |
| `docs/audits/workspace-oportunidade/MATRIZ_EXECUTIVA_ACOES_PRIORITARIAS.md` | backlog executivo | Conforme; aponta sincronizacao/estado como risco real |
| `docs/audits/workspace-oportunidade/phase-a/CONTRATO_CANONICO_WORKSPACE.md` | contrato canonico resumido | Conforme; `stageId` operacional e `stageLabel` visual |
| `docs/audits/workspace-oportunidade/contracts-source-of-truth/MATRIZ_FONTE_VERDADE_WORKSPACE.md` | matriz historica de fonte de verdade | Parcialmente conforme; ainda classifica `etapa_id` como fonte de UI |
| `docs/audits/workspace-oportunidade/contracts-source-of-truth/RASTREAMENTO_PONTA_A_PONTA_WORKSPACE.md` | rastreamento historico | Parcialmente conforme; referencia linhas antigas e um fluxo anterior ao C1.4 |

## Fonte canonica da etapa

### Tabela de campos

| Campo | Camada | Tipo | Persistido | Derivado | Alias | Consumidores |
|---|---|---|---|---|---|---|
| `stageId` | API frontend, service, repository, Prisma, ViewModel | UUID | sim | nao | nao | mutation oficial, getAll, workspace VM, backend |
| `stageLabel` | ViewModel e renderizacao | string | nao | sim | nao | header do workspace, resumo visual |
| `stage_id` | ViewModel de compatibilidade | string nullable | nao | espelho de `stageId` | sim | compatibilidade local |
| `etapa_id` | ViewModel, forms, filtros, grouping | string | nao | espelho de `stageId` ou fallback | sim | forms, filtros, rebuild kanban |
| `etapa` | ViewModel, render legado, pipelineUtils | string | nao | label ou id visual, depende do fluxo | sim | render visual e agrupamento legado |

### Classificacao formal

| Campo | Papel | Persistido | Derivado | Alias |
|---|---|---:|---:|---:|
| `stageId` | referencia tecnica canonica | sim | nao | nao |
| `stageLabel` | exibicao canonica | nao | sim | nao |
| `stage_id` | compatibilidade tecnica | nao | nao | sim |
| `etapa_id` | compatibilidade tecnica/visual | nao | nao | sim |
| `etapa` | alias visual legado | nao | sim/parcial | sim |

### Respostas obrigatorias com evidencia

| Pergunta | Resposta | Classificacao | Evidencia |
|---|---|---|---|
| `stageId` vem sempre do backend? | Nos payloads oficiais de leitura, sim; no create local nasce do form e depois persiste no backend | PARCIALMENTE CONFIRMADO | [src/api/modules/opportunities.api.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/api/modules/opportunities.api.ts:22), [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:1037), [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:2707) |
| `stageId` pode nascer localmente no create? | Sim, o form inicializa `formData.etapa_id` com a primeira etapa do pipeline e o builder traduz para payload oficial | CONFIRMADO | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:2707), [src/components/pipeline/workspaceOpportunity.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/components/pipeline/workspaceOpportunity.ts:1189) |
| `stageLabel` vem de `stage.name`, `stageCatalog` ou ambos? | De ambos; `mapOpportunityApiToWorkspaceInput()` projeta `stageName` e `resolveStage()` usa `stageCatalog` com fallback para `stageName`/`stageNome` | CONFIRMADO | [src/components/pipeline/workspaceOpportunity.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/components/pipeline/workspaceOpportunity.ts:653), [src/components/pipeline/workspaceOpportunity.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/components/pipeline/workspaceOpportunity.ts:744) |
| Qual fonte tem precedencia para `stageLabel`? | Catalogo da etapa resolvida; se nao casar, usa `stageName` projetado; depois fallback literal | CONFIRMADO | [src/components/pipeline/workspaceOpportunity.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/components/pipeline/workspaceOpportunity.ts:661), [src/components/pipeline/workspaceOpportunity.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/components/pipeline/workspaceOpportunity.ts:673), [src/components/pipeline/workspaceOpportunity.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/components/pipeline/workspaceOpportunity.ts:683) |
| `stage_id` espelha `stageId`? | Sim, na saida canonica | CONFIRMADO | [src/components/pipeline/workspaceOpportunity.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/components/pipeline/workspaceOpportunity.ts:868) |
| `etapa_id` espelha `stageId`? | Sim, mas pode receber fallback visual quando o canonicamente resolvido falta no rebuild do kanban | PARCIALMENTE CONFIRMADO | [src/components/pipeline/workspaceOpportunity.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/components/pipeline/workspaceOpportunity.ts:872), [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:364), [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:2798) |
| `etapa` representa ID, label ou ambos? | Ambos, dependendo do fluxo; no ViewModel canonico sai como label, no rebuild do kanban pode virar ID visual | CONFIRMADO | [src/components/pipeline/workspaceOpportunity.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/components/pipeline/workspaceOpportunity.ts:873), [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:372), [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:4302) |
| Algum consumidor ainda trata `etapa` como ID? | Sim, `pipelineUtils.groupOportunitiesByStage()` agrupa por `etapa_id === etapa.id || etapa === etapa.id` | CONFIRMADO | [src/components/pipeline/pipelineUtils.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/components/pipeline/pipelineUtils.ts:83) |
| Algum fluxo ainda envia `etapa_id` ao backend? | O update generico legado monta `OpportunityWorkspaceUpdatePayload` com `etapa_id`, mas o fluxo oficial de API de oportunidade nao o usa; `moveStage` usa `stageId` | PARCIALMENTE CONFIRMADO | [src/components/pipeline/workspaceOpportunity.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/components/pipeline/workspaceOpportunity.ts:1178), [src/components/pipeline/workspaceOpportunity.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/components/pipeline/workspaceOpportunity.ts:1078) |
| Algum fluxo altera somente alias sem atualizar o canonico? | O rebuild do kanban corrige `etapa_id`/`etapa` localmente em memoria, sem alterar `stageId` do backend; nao e persistencia oficial | CONFIRMADO | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:2798), [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:2958) |

## Arquitetura atual

Fluxo real ponta a ponta:

1. O frontend carrega a lista via `opportunitiesApi.getAll()` e mapeia cada DTO oficial com `mapApiOpportunityToKanbanShape()`; esse wrapper delega para `mapOpportunityApiToWorkspaceInput()` e `normalizeOpportunityWorkspace()` ([src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:1037), [src/components/pipeline/workspaceOpportunity.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/components/pipeline/workspaceOpportunity.ts:744)).
2. O kanban opera sobre `oportunidadesBase`, derivadas de `apiOportunidadesReadOnly`, com um passo extra `normalizeOpportunityForKanbanStage()` que reescreve `etapa_id` e `etapa` para agrupamento visual ([src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:2791)).
3. O drag-and-drop resolve `stageId` de destino pelo pipeline oficial em memoria, chama `buildMoveStagePayload()`, faz `PATCH /api/v1/opportunities/:id/stage`, ignora a resposta e aciona `setApiReadReloadKey()` ([src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:3061), [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:3150)).
4. O workspace fullscreen faz o mesmo no fluxo `confirmarMudancaFase`, tambem ignorando a resposta e acionando apenas reload da lista ([src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:2156)).
5. No backend, a rota `PATCH /:id/stage` exige `opportunity:move_stage`, extrai `tenantId`, valida payload e delega ao service ([backend/src/modules/opportunities/routes.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/src/modules/opportunities/routes.ts:347)).
6. O service verifica acesso a oportunidade, resolve `targetPipelineId`, valida que `stageId` pertence ao `tenant` e ao `pipeline` informado e persiste via repository ([backend/src/modules/opportunities/services/opportunities.service.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/src/modules/opportunities/services/opportunities.service.ts:550), [backend/src/modules/opportunities/services/opportunities.service.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/src/modules/opportunities/services/opportunities.service.ts:632)).
7. O repository grava com `updateMany(where: { id, tenantId, deletedAt: null })`, depois o service rele a oportunidade completa com include relacional e devolve a entidade atualizada ([backend/src/modules/opportunities/repositories/opportunities.repository.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/src/modules/opportunities/repositories/opportunities.repository.ts:487), [backend/src/modules/opportunities/repositories/opportunities.repository.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/src/modules/opportunities/repositories/opportunities.repository.ts:435)).
8. O frontend nao usa esse retorno na mutation; ele espera o `getAll()` seguinte, remapeia tudo e reconstrui a lista ([src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:1031)).

## Fluxos identificados

| Fluxo | Handler | Builder | Endpoint | Atualizacao local | Refetch | Rollback |
|---|---|---|---|---|---|---|
| Criacao oficial/intake | `handleSubmitNovaOportunidade` | `buildCreateOpportunityIntakePayload` | `POST /api/v1/opportunities/intake` | nenhuma reconciliacao local direta | sim, via `setApiReadReloadKey` | inexistente |
| Update generico | `handleSubmitEdit` | `buildUpdateOpportunityPayload` | `PUT /api/v1/opportunities/:id` | nenhuma reconciliacao local direta | sim | inexistente |
| Move stage via drag-and-drop | `handleDrop` | `buildMoveStagePayload` | `PATCH /api/v1/opportunities/:id/stage` | sem update definitivo, apenas observabilidade local | sim | inexistente |
| Move stage via workspace | `confirmarMudancaFase` | `buildMoveStagePayload` | `PATCH /api/v1/opportunities/:id/stage` | nenhuma | sim | inexistente |

## Inventario de fluxos de etapa

| Fluxo | Handler | Origem do `stageId` | Builder | Endpoint | Atualizacao local | Refetch | Rollback |
|---|---|---|---|---|---|---|---|
| Create opportunity | `handleSubmitNovaOportunidade` | `formData.etapa_id` inicializado pela primeira etapa oficial | `buildCreateOpportunityIntakePayload` | `POST /api/v1/opportunities/intake` | nao | sim | nao |
| Drag-and-drop | `handleDrop` | coluna destino -> `resolveOfficialStageById()` | `buildMoveStagePayload` | `PATCH /api/v1/opportunities/:id/stage` | observabilidade + limpeza de drag state | sim | nao |
| Workspace | `confirmarMudancaFase` | seletor `novaFaseAposAceite` -> `resolveOfficialStageById()` | `buildMoveStagePayload` | `PATCH /api/v1/opportunities/:id/stage` | fecha seletor no sucesso | sim | nao |
| Acao rapida | nao confirmado | nao confirmado | nao confirmado | nao confirmado | nao confirmado | nao confirmado | nao confirmado |
| Edicao geral | `handleSubmitEdit` | `formData.etapa_id`/lead legado, mas o builder oficial de update nao envia `stageId` | `buildUpdateOpportunityPayload` | `PUT /api/v1/opportunities/:id` | nao | sim | nao |
| Retorno de mutation | todos | resposta da API ignorada no frontend | n/a | create/update/move | nao ha merge direto com retorno | sim | nao |

## Drag-and-drop

### Fluxo real

1. O card so pode iniciar drag se `can('oportunidades', 'move_stage')` e se a oportunidade for oficial com ID canonico ([src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:3032)).
2. No drop, o handler resolve o card pelo array atual, valida obrigatorios da etapa, resolve o pipeline/stage oficiais de destino e rejeita se nao houver UUID oficial ([src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:3061)).
3. O handler registra observabilidade em `pendingMoveAuditRef`, envia `moveStage`, e em sucesso apenas incrementa `apiReadReloadKey` ([src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:3129), [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:3197)).
4. O `useEffect` de `getAll()` remapeia toda a lista e compara o stage esperado com o stage retornado no snapshot pos-refetch ([src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:1114)).

### Tabela de fluxo

| Etapa do fluxo | Arquivo | Funcao | Entrada | Saida | Risco |
|---|---|---|---|---|---|
| inicio do drag | `src/pages/Oportunidades.tsx` | `handleDragStart` | `cardId` | `draggedCard`, `dataTransfer` | sem lock global |
| hover/drop | `src/pages/Oportunidades.tsx` | `handleDrop` | `cardId`, `etapaId` | PATCH + reload key | resposta ignorada |
| traducao destino | `src/pages/Oportunidades.tsx` | `resolveOfficialStageById` | `pipelineId`, `etapaId` | stage oficial | falha se stage nao estiver no cache local |
| builder | `src/components/pipeline/workspaceOpportunity.ts` | `buildMoveStagePayload` | VM + overrides | `{ stageId, pipelineId?, status?, reason? }` | sem versionamento |
| request | `src/api/modules/opportunities.api.ts` | `moveStage` | id + payload | `OpportunityMutationResponse` | sem cancelamento especifico |
| reconciliacao | `src/pages/Oportunidades.tsx` | `loadOportunitiesReadOnly` | `apiReadReloadKey` | lista remapeada | modal nao acompanha automaticamente |

### Respostas obrigatorias

| Pergunta | Resposta | Evidencia |
|---|---|---|
| O card se move antes da resposta? | Nao ha evidencia de update otimista definitivo do card; o handler apenas aguarda o PATCH e depois refaz `getAll()` | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:3149), [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:3197) |
| A posicao anterior e salva? | So em observabilidade (`pendingMoveAuditRef`), nao como snapshot de rollback funcional | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:3129) |
| O estado anterior e restaurado na falha? | Nao; so limpa o estado de drag e exibe erro | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:3168) |
| Existe refetch depois do sucesso? | Sim | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:3197) |
| O retorno da API e aplicado diretamente? | Nao | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:3150) |
| Ha risco de atualizacao dupla? | Sim; dois drags seguidos podem disparar PATCHs sem lock global | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:3032), [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:3061) |
| Ha risco de o card permanecer em stage incorreto? | Parcial; o refetch corrige a lista, mas enquanto isso o modal pode divergir | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:1031), [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:5472) |
| O workspace aberto acompanha a mudanca? | Nao confirmado no drag; `selectedLead` nao e atualizado no sucesso do drop | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:1379), [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:3197) |
| O usuario pode iniciar novo drag enquanto o primeiro esta pendente? | Sim, nao existe flag de loading ou disable global | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:2549), [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:3032) |
| Existe request duplicado em drop repetido? | Risco parcial confirmado; nao ha deduplicacao nem idempotency key | [src/api/modules/opportunities.api.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/api/modules/opportunities.api.ts:228), [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:3150) |

## Workspace

### Fluxo real

1. O modal abre com `selectedLead` normalizado por `handleOpenLead()` usando `stageCatalog: etapasAtivas` ([src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:1379)).
2. A troca de fase do workspace usa `novaFaseAposAceite`, resolve `stageId` oficial de destino e chama `moveStage` com builder canonico ([src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:2156)).
3. No sucesso, apenas incrementa `apiReadReloadKey` e fecha o seletor auxiliar; o modal principal permanece aberto com o `selectedLead` atual ([src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:2218)).
4. O header do modal prioriza `selectedLead.stageLabel`, depois `derived.stageLabel`, depois `etapa`/`etapa_id` ([src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:5472)).

### Tabela

| Passo | Arquivo | Funcao | Estado anterior | Estado posterior | Persistido | Gap |
|---|---|---|---|---|---|---|
| abrir workspace | `src/pages/Oportunidades.tsx` | `handleOpenLead` | card raw/compat | `selectedLead` normalizado | nao | depende de snapshot local |
| selecionar etapa | `src/pages/Oportunidades.tsx` | seletor `novaFaseAposAceite` | etapa atual no modal | target stage local | nao | sem snapshot |
| confirmar | `src/pages/Oportunidades.tsx` | `confirmarMudancaFase` | `selectedLead` atual | PATCH + `apiReadReloadKey++` | sim no backend | modal nao e rehidratado |
| render header | `src/pages/Oportunidades.tsx` | JSX do modal | `selectedLead` existente | usa `stageLabel`/fallbacks | nao | pode mostrar etapa antiga |

### Confirmacoes

| Pergunta | Resposta | Evidencia |
|---|---|---|
| O workspace altera `stageId`? | Sim, via `buildMoveStagePayload` | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:2201) |
| O workspace altera `stageLabel`? | Nao diretamente; ele espera o refetch/remapeamento | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:2218) |
| O workspace altera `stage_id`? | Nao diretamente; depende do normalizador na releitura | [src/components/pipeline/workspaceOpportunity.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/components/pipeline/workspaceOpportunity.ts:870) |
| O workspace altera `etapa_id`? | Nao diretamente na mutation oficial; o valor de form continua legado em outros fluxos | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:2256) |
| O workspace altera `etapa`? | Nao diretamente; apenas o normalizador a recalcula | [src/components/pipeline/workspaceOpportunity.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/components/pipeline/workspaceOpportunity.ts:873) |
| O modal permanece aberto? | Sim, o seletor fecha, mas o fullscreen nao | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:2218), [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:5457) |
| A lista principal e atualizada? | Sim, por refetch | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:1031), [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:2218) |
| Existe refetch? | Sim | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:2218) |
| Card e modal recebem a mesma instancia normalizada? | Nao; a lista e remapeada em `apiOportunidadesReadOnly`, o modal segue com `selectedLead` local | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:1039), [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:1379) |

## Builder

### `buildMoveStagePayload`

Entrada: `OpportunityWorkspaceViewModel` + overrides opcionais de `stageId`, `pipelineId`, `status` e `reason`.

Saida: `MoveOpportunityStagePayload` com:

- `stageId` obrigatorio na pratica
- `pipelineId` opcional
- `status` opcional
- `reason` opcional

Ele:

- ignora aliases visuais (`etapa`, `etapa_id`, `stageLabel`)
- nao muta a ViewModel
- omite `undefined`
- nao inclui campos excedentes de UI

### Tabela do builder

| Campo de entrada | Campo de saida | Obrigatorio | Omitido quando | Risco |
|---|---|---:|---|---|
| `options.stageId` ou `viewModel.stageId` | `stageId` | sim | nunca, se houver valor resolvido | se VM vier sem `stageId`, payload fica invalido |
| `options.pipelineId` ou `viewModel.pipelineId` | `pipelineId` | nao | `null/undefined/''` | sem `pipelineId`, backend usa pipeline atual |
| `options.status` | `status` | nao | `undefined/''` | nao usado pela rota atual |
| `options.reason` | `reason` | nao | `undefined/''` | nao usado pela rota atual |

Uso real confirmado:

- `confirmarMudancaFase()` ([src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:2201))
- `handleDrop()` ([src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:3152))

Teste existente:

- [src/test/workspaceOpportunity.test.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/test/workspaceOpportunity.test.ts:825)

## API frontend

| Metodo | Rota | Payload | Resposta | Erro | Consumidor |
|---|---|---|---|---|---|
| `GET` | `/api/v1/opportunities` | query opcional (`pipelineId`, `stageId`, etc.) | `ListOpportunitiesResponse` com `Opportunity[]` | `ApiException` via `apiCall()` | reload da lista |
| `PUT` | `/api/v1/opportunities/:id` | `UpdateOpportunityPayload` | `OpportunityMutationResponse` | idem | edicao geral |
| `PATCH` | `/api/v1/opportunities/:id/stage` | `MoveOpportunityStagePayload` | `OpportunityMutationResponse` | idem | drag-and-drop, workspace |

Confirmacoes:

| Pergunta | Resposta | Evidencia |
|---|---|---|
| `moveStage` retorna `Opportunity` completa? | O tipo permite `Opportunity` completa ou `{ id }`; na pratica o backend retorna a entidade atualizada completa | [src/api/modules/opportunities.api.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/api/modules/opportunities.api.ts:191), [backend/src/modules/opportunities/routes.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/src/modules/opportunities/routes.ts:364) |
| Retorna apenas `stageId`? | Nao e o fluxo do backend atual | [backend/src/modules/opportunities/routes.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/src/modules/opportunities/routes.ts:366) |
| O resultado e enviado a Mapping Layer? | Nao diretamente; o caller ignora a resposta e refaz `getAll()` | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:2198), [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:3150) |
| Ha timeout/retry/cancelamento especifico? | Nao ha retry nem cancelamento especifico no modulo; `apiCall()` apenas usa `httpRequest()` e propaga erro | [src/api/modules/base.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/api/modules/base.ts:47) |

## Backend e Prisma

### Tabela resumida

| Camada | Arquivo | Simbolo | Validacao | Efeito |
|---|---|---|---|---|
| HTTP route | `backend/src/modules/opportunities/routes.ts` | `app.patch('/:id/stage')` | auth + `requirePermissions('opportunity:move_stage')` + Zod | delega ao service |
| Validator | `backend/src/modules/opportunities/validators/opportunities.validator.ts` | `moveOpportunityStageBodySchema` | `stageId` UUID obrigatorio, `pipelineId` UUID opcional | bloqueia payload invalido |
| Service | `backend/src/modules/opportunities/services/opportunities.service.ts` | `moveStage()` | tenant, access scope, pipeline/stage consistency | persiste e registra audit log |
| Repository | `backend/src/modules/opportunities/repositories/opportunities.repository.ts` | `moveStage()` | `where: { id, tenantId, deletedAt: null }` | `updateMany` em `stageId` e `pipelineId` |
| Prisma | `backend/prisma/schema.prisma` | `model Opportunity`, `model Stage`, `model Pipeline` | FKs individuais e indices | persiste `stageId`/`pipelineId`, nao cruza compatibilidade pipeline-stage |

### Confirmacoes obrigatorias

| Pergunta | Resposta | Classificacao | Evidencia |
|---|---|---|---|
| A rota exige autenticacao? | Sim, o modulo importa middleware de auth/tenant e roda no app autenticado | CONFIRMADO | [backend/src/modules/opportunities/routes.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/src/modules/opportunities/routes.ts:4) |
| A rota exige `opportunity:move_stage`? | Sim | CONFIRMADO | [backend/src/modules/opportunities/routes.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/src/modules/opportunities/routes.ts:347) |
| A oportunidade pertence ao tenant? | Sim, `findById()` filtra por `tenantId` e relacoes vivas | CONFIRMADO | [backend/src/modules/opportunities/repositories/opportunities.repository.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/src/modules/opportunities/repositories/opportunities.repository.ts:435) |
| A etapa de destino pertence ao tenant? | Sim | CONFIRMADO | [backend/src/modules/opportunities/repositories/opportunities.repository.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/src/modules/opportunities/repositories/opportunities.repository.ts:181) |
| A etapa pertence ao pipeline correto? | Sim, o service compara `stage.pipelineId !== input.pipelineId` | CONFIRMADO | [backend/src/modules/opportunities/services/opportunities.service.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/src/modules/opportunities/services/opportunities.service.ts:652) |
| O pipeline da oportunidade e considerado? | Sim, `targetPipelineId` usa `input.pipelineId ?? current.pipelineId` | CONFIRMADO | [backend/src/modules/opportunities/services/opportunities.service.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/src/modules/opportunities/services/opportunities.service.ts:563) |
| Nao e possivel mover para stage de outro pipeline? | Sim no service | CONFIRMADO | [backend/src/modules/opportunities/services/opportunities.service.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/src/modules/opportunities/services/opportunities.service.ts:652) |
| Nao e possivel mover para stage de outro tenant? | Sim no service/repository | CONFIRMADO | [backend/src/modules/opportunities/services/opportunities.service.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/src/modules/opportunities/services/opportunities.service.ts:640), [backend/src/modules/opportunities/repositories/opportunities.repository.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/src/modules/opportunities/repositories/opportunities.repository.ts:186) |
| `updatedAt` e alterado? | Sim, o model usa `@updatedAt` | CONFIRMADO | [backend/prisma/schema.prisma](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/prisma/schema.prisma:612) |
| Activity ou historico e registrado? | Audit log sim; `Activity` especifica de timeline nao foi confirmada nesta mutation | PARCIALMENTE CONFIRMADO | [backend/src/modules/opportunities/services/opportunities.service.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/src/modules/opportunities/services/opportunities.service.ts:580) |
| A resposta traz dados atualizados? | Sim, o service rele apos persistir | CONFIRMADO | [backend/src/modules/opportunities/services/opportunities.service.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/src/modules/opportunities/services/opportunities.service.ts:575) |
| Erros sao especificos e propagados? | Sim, validator/service/route diferenciam `INVALID_REQUEST`, `NOT_FOUND`, `FORBIDDEN` | CONFIRMADO | [backend/src/modules/opportunities/routes.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/src/modules/opportunities/routes.ts:71) |

## Prisma

| Modelo | Campo | Relacao | Constraint | Protecao estrutural | Risco |
|---|---|---|---|---|---|
| `Pipeline` | `tenantId` | FK para `Tenant` | FK | garante tenant do pipeline | baixo |
| `Stage` | `pipelineId` | FK para `Pipeline` | FK + `@@unique([pipelineId, order])` | garante stage ligado a um pipeline | baixo |
| `Stage` | `tenantId` | FK para `Tenant` | FK | garante tenant da stage | baixo |
| `Opportunity` | `pipelineId` | FK para `Pipeline` | FK | impede pipeline inexistente | medio |
| `Opportunity` | `stageId` | FK para `Stage` | FK | impede stage inexistente | medio |
| `Opportunity` | `tenantId` | FK para `Tenant` | FK | garante tenant da oportunidade | medio |

Confirmacoes estruturais:

| Pergunta | Resposta | Classificacao | Evidencia |
|---|---|---|---|
| Banco impede `Stage` de outro pipeline? | Sim para a tabela `Stage`; uma stage sempre pertence a um pipeline | CONFIRMADO | [backend/prisma/schema.prisma](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/prisma/schema.prisma:585) |
| Banco impede `Stage` de outro tenant? | A stage tem `tenantId` proprio, mas a coerencia com `Pipeline.tenantId` nao aparece como constraint composta | PARCIALMENTE CONFIRMADO | [backend/prisma/schema.prisma](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/prisma/schema.prisma:588) |
| Banco impede `Opportunity` sem `Pipeline`? | Sim | CONFIRMADO | [backend/prisma/schema.prisma](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/prisma/schema.prisma:635) |
| Banco impede `Opportunity` sem `Stage`? | Sim | CONFIRMADO | [backend/prisma/schema.prisma](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/prisma/schema.prisma:638) |
| Banco impede `Pipeline` e `Stage` incompatveis na oportunidade? | Nao por constraint composta; isso fica no service | CONFIRMADO | [backend/prisma/schema.prisma](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/prisma/schema.prisma:635), [backend/src/modules/opportunities/services/opportunities.service.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/src/modules/opportunities/services/opportunities.service.ts:652) |

## Estado local e reconciliacao

| Estado | Fonte | Atualizado quando | Otimista | Refetch | Risco de stale |
|---|---|---|---:|---:|---|
| `apiOportunidadesReadOnly` | `getAll()` oficial | mount e `apiReadReloadKey` | nao | sim | baixo, por cancelamento de efeito |
| `oportunidadesBase` | derivado da lista oficial | a cada render | nao | sim | medio, pois corrige alias localmente |
| `selectedLead` | snapshot local normalizado de um card clicado | `handleOpenLead` e alguns merges locais pontuais | nao | nao automaticamente | alto |
| `draggedCard` / `dragOverColumn` | estado local | drag handlers | n/a | n/a | medio |
| `pendingMoveAuditRef` | observabilidade local | antes/depois do drag | n/a | pos-get | baixo |
| `etapasAtivas` | pipeline oficial selecionado | a cada selecao/reload de pipelines | nao | indireto | medio |

Respostas obrigatorias:

| Pergunta | Resposta | Evidencia |
|---|---|---|
| Card e modal compartilham a mesma referencia? | Nao; o modal recebe uma copia normalizada em `selectedLead` | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:1379) |
| `selectedLead` e substituido apos mutation? | Nao no `moveStage`; so em outros updates auxiliares locais | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:2218) |
| `selectedLead` e mergeado? | Sim em alguns updates auxiliares como simulacao, mas nao no `moveStage` | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:2137) |
| Lista e modal podem divergir? | Sim | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:1039), [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:5472) |
| O retorno passa pela Mapping Layer? | Sim, mas apenas no refetch de `getAll()` | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:1037) |
| O refetch substitui a shape local? | Sim, para a lista | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:1042) |
| O card pode atualizar sem o modal? | Sim | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:1042), [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:5457) |
| O modal pode atualizar sem o card? | Apenas em merges locais auxiliares; nao no move stage | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:2137) |
| Aliases sao recalculados depois da resposta? | Sim, no remapeamento completo e no `normalizeOpportunityForKanbanStage()` | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:1039), [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:2798) |

## Reconciliacao

| Fluxo | Resposta usada | Mapping aplicado | Lista atualizada | Modal atualizado | Refetch | Classificacao |
|---|---|---|---:|---:|---:|---|
| Create | ignorada | sim, no `getAll()` | sim | nao automaticamente | sim | PARCIAL |
| Update | ignorada | sim, no `getAll()` | sim | nao automaticamente | sim | PARCIAL |
| Move stage drag-and-drop | ignorada | sim, no `getAll()` | sim | nao confirmado / tende a nao | sim | PARCIAL |
| Move stage workspace | ignorada | sim, no `getAll()` | sim | nao | sim | PARCIAL |

## Rollback

| Fluxo | Snapshot anterior | Otimista | Rollback | Mensagem | Refetch | Classificacao |
|---|---|---:|---:|---|---:|---|
| Create | nao | nao | nao | `alert`/console | sim no sucesso | INEXISTENTE |
| Update | nao | nao | nao | `alert`/console | sim no sucesso | INEXISTENTE |
| Move stage drag-and-drop | observabilidade apenas | nao definitivo | nao | `alert`/console | sim no sucesso | PARCIALMENTE CONFIRMADO |
| Move stage workspace | nao | nao | nao | `alert`/console | sim no sucesso | INEXISTENTE |

Observacao: um `getAll()` posterior corrige a lista, mas isso nao constitui rollback completo do estado anterior.

## Concorrencia

| Cenario | Protecao atual | Evidencia | Risco | Prioridade |
|---|---|---|---|---|
| dois drags rapidos do mesmo card | nenhuma protecao explicita | ausencia de flag de pending ou lock no `handleDrop` | lost update / dupla mutacao | P1 |
| drag em outro card enquanto request anterior pendente | nenhuma | o handler so controla `draggedCard` visual | concorrencia de requests | P1 |
| workspace altera etapa enquanto drag pendente | nenhuma coordenacao entre `selectedLead` e `pendingMoveAuditRef` | fluxos independentes | divergencia lista/modal | P1 |
| duas abas | backend sem versionamento por oportunidade | `Opportunity` nao tem campo de versao | last-write-wins | P1 |
| resposta antiga apos resposta nova de PATCH | resposta PATCH e ignorada, entao impacto direto reduz | frontend nao aplica retorno PATCH | baixo no PATCH, medio no persistido | P2 |
| refetch antigo apos refetch novo | efeito de `getAll()` usa `cancelled` na cleanup | `useEffect` de reload | mitigado localmente | P2 |
| duplo clique/duplo submit de moveStage | nenhuma idempotencia no frontend | sem requestId/AbortController dedicado no modulo | request duplicado | P1 |
| stage catalog muda durante mutation | sem snapshot do catalogo efetivo da mutation alem do estado atual | `resolveOfficialStageById` usa cache local | erro de traducao de destino | P2 |

## Respostas fora de ordem

Cenario auditado:

`Move A -> Stage 2`
`Move B -> Stage 3`
`Resposta B chega`
`Resposta A chega depois`

Analise:

- o caller nao aplica diretamente a resposta do PATCH; ele sempre aciona refetch posterior;
- por isso, nao ficou provado neste bloco que uma resposta antiga de PATCH sobrescreve diretamente o card em tela;
- o `useEffect` de `getAll()` protege contra setState de um refetch antigo quando um novo reload key dispara cleanup do efeito anterior;
- o risco real confirmado em parte esta na combinacao de mutacoes concorrentes, persistencia `last-write-wins`, refetches concorrentes sem sequenciamento por oportunidade e Workspace aberto mantendo snapshot anterior;
- nao existe versionamento por oportunidade, request sequencing por card nem lock de mutacao no cliente.

Categoria: `Concorrência / Reconciliação`

Prioridade: `P1`

Classificacao: `RISCO PARCIALMENTE CONFIRMADO`

Evidencia:

- PATCH ignorado no caller: [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:3150)
- refetch com cancelamento de efeito: [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:1031)
- ausencia de `version` em `Opportunity`: [backend/prisma/schema.prisma](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/prisma/schema.prisma:600)

## Refresh

| Fluxo | Antes do F5 | Depois do F5 | Fonte final | Divergencia |
|---|---|---|---|---|
| Lista do kanban | aliases locais + stage canonico | DTO oficial -> mapping layer -> normalizador -> rebuild por etapa | backend + mapping layer | baixa na lista |
| Workspace aberto | `selectedLead` local | nao ha reidratacao automatica do modal aberto neste arquivo | snapshot local | media/alta |

Confirmacoes:

- `stageId` vem do backend no reload: sim ([src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:1037))
- `stageLabel` e recalculado: sim ([src/components/pipeline/workspaceOpportunity.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/components/pipeline/workspaceOpportunity.ts:817))
- `stage_id` espelha o canonico: sim ([src/components/pipeline/workspaceOpportunity.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/components/pipeline/workspaceOpportunity.ts:870))
- `etapa_id` espelha o canonico: sim, com fallback visual possivel ([src/components/pipeline/workspaceOpportunity.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/components/pipeline/workspaceOpportunity.ts:872), [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx:2798))
- `etapa` mantem semantica visual: sim, mas ambigua ([src/components/pipeline/workspaceOpportunity.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/src/components/pipeline/workspaceOpportunity.ts:873))
- card e workspace convergem apos refresh completo: lista sim; modal aberto nao confirmado automaticamente.

## Testes existentes

| Cenario | Coberto | Arquivo | Tipo | Gap |
|---|---|---|---|---|
| builder de move | sim | `src/test/workspaceOpportunity.test.ts` | unitario | nao cobre consumers reais |
| aliases `stageId`/`etapa_id` | sim | `src/test/oportunidades-kanban-hardening.test.ts` | unitario/estrutural | nao cobre mutation real |
| rebuild do kanban apos drag/refetch | sim | `src/test/oportunidades-kanban-hardening.test.ts` | unitario | nao cobre backend real |
| abertura do modal | sim | `src/test/oportunidades-card-interaction.test.tsx` | interacao | nao cobre move stage |
| moveStage service valido | sim | `backend/src/tests/unit/opportunities.service.test.ts` | unitario | sem concorrencia |
| moveStage stage inativo | sim | `backend/src/tests/unit/opportunities.service.test.ts` | unitario | sem rollback cliente |
| moveStage stage fora do pipeline | sim | `backend/src/tests/unit/opportunities.service.test.ts` | unitario | sem multi-tenant concorrente |
| repository tenant isolation | sim | `backend/src/tests/unit/opportunities.repository.test.ts` | unitario | sem pipelineId simultaneo |
| RBAC da rota move stage | sim | `backend/src/tests/unit/opportunities.routes.test.ts`, `backend/src/tests/integration/opportunities.test.ts` | unitario/integracao | sem caso 200 feliz |
| rollback de UI | nao | n/a | n/a | gap |
| reconciliacao de `selectedLead` apos move | nao | n/a | n/a | gap |
| stale response / out-of-order | nao | n/a | n/a | gap |
| drag-and-drop funcional ponta a ponta | nao | n/a | n/a | gap |
| workspace aberto durante mutation | nao | n/a | n/a | gap |

## Gaps priorizados

| ID | Gap | Evidencia | Categoria | Impacto | Prioridade | Classificacao |
|---|---|---|---|---|---|---|
| C2-G1 | `selectedLead` nao e reconciliado apos `moveStage` | sucesso so faz `setApiReadReloadKey` | Reconciliação | card e modal podem divergir | P1 | CONFIRMADO |
| C2-G2 | tratamento de erro e reconciliacao incompletos | sem snapshot restauravel e sem reidratacao deterministica de estado visual transitorio ou Workspace aberto | Rollback / Reconciliação | estado visual transitorio ou Workspace antigo apos falha | P2 | CONFIRMADO |
| C2-G3 | ausencia de lock/flag de pending nas mutacoes de etapa | nao ha loading global no drag/workspace | Concorrência | dupla mutacao e lost update | P1 | CONFIRMADO |
| C2-G4 | protecao cross-pipeline depende da camada de aplicacao | o service valida coerencia entre `Opportunity.pipelineId` e `Stage.pipelineId`, mas o banco so tem FKs individuais | Prisma / Defesa em profundidade | dependencia da validacao da aplicacao | P2 | CONFIRMADO |
| C2-G5 | alias `etapa` ainda e tratado como ID em agrupamento legado | `pipelineUtils.groupOportunitiesByStage()` | Compatibilidade | ambiguidade semantica | P2 | CONFIRMADO |
| C2-G6 | retorno do PATCH nao e aproveitado | callers ignoram `data` do backend | Frontend | latencia extra e divergencia de modal | P2 | CONFIRMADO |
| C2-G7 | cobertura funcional nao testa move stage com workspace aberto | ausencia de testes | Testes | regressao pode escapar | P1 | CONFIRMADO |
| C2-G8 | nao ha stale response guard por oportunidade | sem version/request sequencing | Concorrência | resultado antigo pode vencer no servidor | P1 | PARCIALMENTE CONFIRMADO |
| C2-G9 | `buildOpportunityWorkspaceUpdatePayload` segue legadamente centrado em `etapa_id` | payload legado paralelo | Compatibilidade | mistura de contrato em update nao oficial | P2 | CONFIRMADO |
| C2-G10 | documentos historicos ainda descrevem fluxo com store/optimistic update que nao e mais o principal | divergencia entre docs antigos e codigo atual | Observabilidade | risco de diagnostico errado | P3 | CONFIRMADO |

## Arquitetura proposta

Fluxo futuro recomendado, sem implementar:

`UI action`
-> resolve `stageId` canonico
-> cria snapshot funcional `{ lista, selectedLead }`
-> `buildMoveStagePayload()`
-> `opportunitiesApi.moveStage()`
-> backend valida tenant, RBAC, pipeline e stage
-> backend retorna `Opportunity` persistida
-> `mapOpportunityApiToWorkspaceInput()`
-> `normalizeOpportunityWorkspace()`
-> produzir uma unica `OpportunityWorkspaceViewModel`
-> reconciliar lista por `id`
-> reconciliar `selectedLead` se aberto para a mesma oportunidade
-> opcionalmente disparar refetch de seguranca
-> em erro, restaurar snapshot e publicar mensagem consistente

Respostas de arquitetura:

- atualizacao otimista deve existir? `SIM`, mas somente com snapshot e rollback explicitos.
- qual snapshot manter? lista filtrada/kanban + `selectedLead` da mesma oportunidade.
- quem deve atualizar lista e modal? uma rotina unica de reconciliacao por `id`.
- a resposta deve substituir ou fazer merge? substituir pela ViewModel normalizada unica.
- quando fazer refetch? apos sucesso apenas como seguranca opcional, nao como unica reconciliacao.
- o refetch e necessario em sucesso? `PARCIALMENTE`; pode ser fallback ou auditoria, nao obrigatorio para UX correta.
- o refetch e necessario em erro? `SIM`, se houver duvida sobre estado local apos rollback parcial.
- aliases devem ser recalculados pelo normalizador? `SIM`.
- o modal deve receber a mesma ViewModel da lista? `SIM`.
- como impedir resposta antiga de sobrescrever nova? lock de mutacao por oportunidade + versao ou `updatedAt` comparado no reconcile.

## Implementacao minima recomendada

| Arquivo | Alteracao futura | Necessario | Risco |
|---|---|---:|---|
| `src/pages/Oportunidades.tsx` | unificar reconciliacao de move stage para lista + `selectedLead`, adicionar snapshot/rollback e lock por oportunidade | sim | medio |
| `src/components/pipeline/workspaceOpportunity.ts` | manter builder e talvez expor helper de reconcile sem ampliar contrato publico | talvez | baixo |
| `src/api/modules/opportunities.api.ts` | manter contrato; possivel documentacao do retorno efetivo | talvez | baixo |
| `src/test/workspaceOpportunity.test.ts` | ampliar testes de builder/reconcile | sim | baixo |
| `src/test/oportunidades-card-interaction.test.tsx` | cobrir workspace aberto apos move stage | sim | medio |
| `src/test/oportunidades-kanban-hardening.test.ts` | cobrir reconciliacao/refetch e alias apos mutation | sim | baixo |
| `backend/src/tests/unit/opportunities.service.test.ts` | ampliar cenarios de stage/pipeline e eventual pipelineId explicito | sim | baixo |
| `backend/src/tests/integration/opportunities.test.ts` | adicionar caso 200 de move stage e validacao de retorno | sim | baixo |
| `backend/prisma/schema.prisma` | nenhuma alteracao minima obrigatoria nesta fase documental; eventual versionamento seria decisao separada | nao necessariamente | alto se houver migration |

Separacao:

- alteracao funcional: principalmente `src/pages/Oportunidades.tsx`
- testes: frontend e backend listados acima
- documentacao: atualizacao do bloco C2 e eventual SSOT posterior
- sem alteracao prevista imediata: endpoints, Prisma, payload oficial, RBAC

## Subdivisao recomendada

| Bloco | Objetivo | Dependencias | Risco | Ordem recomendada |
|---|---|---|---|---|
| C2.1 | contrato e reconciliacao da mudanca de etapa | C1.4 concluido | alto | 1 |
| C2.2 | rollback e tratamento de erro | C2.1 | alto | 2 |
| C2.3 | concorrencia e stale responses | C2.1 | alto | 3 |
| C2.4 | testes e observabilidade | C2.1-C2.3 | medio | 4 |

Justificativa:

- a maior fragilidade hoje nao esta no backend nem no payload, e sim no reconcile da UI;
- rollback sem reconcile canonico agravaria divergencias;
- stale response e lock de mutacao fazem mais sentido depois que lista/modal passam a compartilhar a mesma VM normalizada;
- testes devem consolidar o contrato final, nao o estado intermediario.

Primeiro subbloco recomendado:

- `C2.1 - Contrato e Reconciliacao da Mudanca de Etapa`

Escopo:

- `resposta persistida -> Mapping Layer -> OpportunityWorkspaceViewModel -> atualizacao da lista -> atualizacao do selectedLead aberto`

Fora de escopo:

- optimistic update;
- snapshot funcional;
- rollback avancado;
- lock por oportunidade;
- stale guard;
- versionamento;
- alteracoes de endpoint;
- alteracoes de backend;
- alteracoes de Prisma;
- alteracoes de RBAC;
- alteracoes de tenant.

## Criterios de aceite futuros

- `stageId` e a unica referencia tecnica canonica.
- `stageLabel` e sempre derivado.
- `stage_id` e `etapa_id` ficam apenas como compatibilidade.
- `etapa` permanece visual e nao e usada como ID tecnico.
- todos os fluxos usam `buildMoveStagePayload`.
- todos os retornos passam pela Mapping Layer.
- card e workspace recebem a mesma `OpportunityWorkspaceViewModel`.
- refresh preserva a etapa persistida.
- falha gera tratamento deterministico de erro e reconciliacao; rollback funcional completo fica para fase dedicada.
- nao ha update local definitivo antes da confirmacao sem snapshot.
- resposta antiga nao sobrescreve estado novo.
- `stage` e `pipeline` sao validados no backend.
- RBAC e tenant permanecem preservados.
- testes funcionais cobrem drag-and-drop.
- testes cobrem workspace aberto.
- testes cobrem erro.
- testes cobrem rollback.
- testes cobrem stale response.
- `npm test` e `npm run build` passam na fase de implementacao futura.
- `npm run arch:check` passa.

## Riscos

### Nenhum risco P0 identificado.

Riscos principais remanescentes:

- P1: `selectedLead` nao e reconciliado automaticamente apos `moveStage`, entao card e modal podem divergir.
- P1: mutacoes simultaneas seguem sem lock por oportunidade.
- P1: falta teste funcional cobrindo move stage com Workspace aberto.
- P1: risco de concorrencia/reconciliacao segue apenas parcialmente confirmado por ausencia de stale guard por oportunidade.
- P2: aliases legados ainda participam do agrupamento visual.
- P2: retorno do PATCH segue ignorado no caller.
- P2: tratamento de erro e reconciliacao ainda nao restauram de forma deterministica estado visual transitorio ou Workspace aberto.
- P2: coerencia `pipelineId`/`stageId` depende da validacao da aplicacao, sem constraint composta no banco.

## Conclusao tecnica

O programa ja consolidou `stageId` como fonte canonica persistida e `buildMoveStagePayload()` como builder oficial. O backend esta mais maduro do que a UI para esse fluxo: valida permissao, tenant, pipeline e stage, persiste a oportunidade correta e retorna a entidade atualizada.

O ponto de maior risco do C2 esta na reconciliacao do frontend. Hoje o sucesso de `moveStage` depende quase inteiramente de um `getAll()` posterior. Essa estrategia reconstrui a lista, mas nao atualiza o `selectedLead` do workspace aberto, nao produz rollback funcional e nao impede mutacoes concorrentes na mesma oportunidade.

Em outras palavras: a persistencia de etapa esta tecnicamente correta, mas a sincronizacao de etapa entre Pipeline, Workspace e refresh ainda e parcial. A menor implementacao segura do C2 deve atacar primeiro a reconciliacao de lista + modal, depois rollback, depois concorrencia/stale responses, e so entao consolidar cobertura de testes.
