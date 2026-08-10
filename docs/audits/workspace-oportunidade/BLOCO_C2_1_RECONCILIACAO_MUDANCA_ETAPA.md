# BLOCO C2.1 - RECONCILIACAO DA MUDANCA DE ETAPA

Data: 2026-08-03
Escopo: reconciliacao imediata da resposta persistida de `moveStage` na lista do pipeline e no workspace aberto.

## Objetivo

Concluir o subbloco C2.1 definido em `BLOCO_C2_AUDITORIA_SINCRONIZACAO_ETAPA.md`:

`moveStage response -> Mapping Layer -> OpportunityWorkspaceViewModel -> lista do Pipeline -> selectedLead aberto`

Fora de escopo neste bloco:

- optimistic update;
- rollback avancado;
- lock por oportunidade;
- stale guard;
- versionamento;
- alteracoes de backend;
- alteracoes de Prisma;
- alteracoes de RBAC.

## Implementacao consolidada

- A resposta persistida de `PATCH /api/v1/opportunities/:id/stage` passou a ser consumida imediatamente no frontend.
- O retorno do backend e traduzido pela mesma camada canonica ja usada no read flow:
  - `mapOpportunityApiToWorkspaceInput()`
  - `normalizeOpportunityWorkspace()`
- A reconciliacao local ocorre por `id` e atualiza:
  - a lista em memoria do pipeline;
  - o `selectedLead` aberto, somente quando ele representa a mesma oportunidade.
- O refetch posterior via `setApiReadReloadKey()` foi mantido como rede de seguranca, nao como unica forma de convergencia.

## Arquivos alterados

- `src/api/modules/opportunities.api.ts`
- `src/components/pipeline/workspaceOpportunity.ts`
- `src/pages/Oportunidades.tsx`
- `src/test/workspaceOpportunity.test.ts`
- `src/test/oportunidades-card-interaction.test.tsx`
- `src/test/oportunidades-kanban-hardening.test.ts`

## Contrato aplicado

Fluxo final:

`moveStage response`
`-> mapOpportunityApiToWorkspaceInput`
`-> normalizeOpportunityWorkspace`
`-> OpportunityWorkspaceViewModel`
`-> reconcileOpportunityWorkspace`
`-> lista da Pipeline`
`-> selectedLead aberto`

Garantias deste bloco:

- `stageId` permanece a referencia tecnica canonica.
- `stage_id` e `etapa_id` espelham `stageId`.
- `stageLabel` e recalculado pelo normalizador.
- `etapa` permanece alias visual.
- somente a oportunidade com `id` correspondente recebe os campos persistidos.
- `selectedLead` de outra oportunidade permanece intacto.
- nenhum optimistic update foi introduzido.
- nenhum rollback avancado foi introduzido.
- nenhum lock por oportunidade foi introduzido.
- nenhum stale guard foi introduzido.

## Tipagem da mutation

Contrato anterior do frontend:

- `Opportunity | { id: string }`

Problema identificado na revisao final:

- a tentativa intermediaria `Partial<Opportunity> & { id: string }` ficou permissiva demais;
- ela tornava opcionais campos que o contrato real de `create`, `update` e `moveStage` entrega hoje;
- isso poderia mascarar regressao de endpoint no frontend em vez de explicitar quebra de contrato.

Contrato final adotado:

- `OpportunityEntityMutationResponse`
  - `success: boolean`
  - `message: string`
  - `data: Opportunity`
- `OpportunityArchiveResponse`
  - `success: boolean`
  - `message: string`
  - `data: { id: string }`

Decisao arquitetural:

- `create`, `update` e `moveStage` usam o contrato de entidade completa;
- `delete` usa contrato proprio de arquivamento minimo;
- nao foi mantido union generico frouxo;
- nao foi usado `Partial` para evitar modelagem explicita.

Evidencia backend que sustenta a decisao:

- `PATCH /api/v1/opportunities/:id/stage` responde `success`, `message` e `data` em [backend/src/modules/opportunities/routes.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/src/modules/opportunities/routes.ts:364).
- esse `data` vem de `opportunitiesService.moveStage()` em [backend/src/modules/opportunities/services/opportunities.service.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/src/modules/opportunities/services/opportunities.service.ts:550).
- o service persiste a mudanca e depois executa `findById()` pos-persistencia antes de retornar `updated` em [backend/src/modules/opportunities/services/opportunities.service.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/src/modules/opportunities/services/opportunities.service.ts:570) e [backend/src/modules/opportunities/services/opportunities.service.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/src/modules/opportunities/services/opportunities.service.ts:594).
- `findById()` aplica `include: opportunitiesReadInclude`, portanto o retorno de `moveStage` e uma oportunidade oficial lida apos persistencia em [backend/src/modules/opportunities/repositories/opportunities.repository.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/src/modules/opportunities/repositories/opportunities.repository.ts:429).
- `PUT /api/v1/opportunities/:id` segue o mesmo padrao e retorna `updated` pos-`findById()` em [backend/src/modules/opportunities/routes.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/src/modules/opportunities/routes.ts:336) e [backend/src/modules/opportunities/services/opportunities.service.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/src/modules/opportunities/services/opportunities.service.ts:524).
- `POST /api/v1/opportunities` retorna `created` em [backend/src/modules/opportunities/routes.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/src/modules/opportunities/routes.ts:297) e [backend/src/modules/opportunities/services/opportunities.service.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/src/modules/opportunities/services/opportunities.service.ts:396).
- `DELETE /api/v1/opportunities/:id` retorna apenas `{ id }` em [backend/src/modules/opportunities/routes.ts](C:/Projects/FINQZ_PRO_HML_PROMOTION/backend/src/modules/opportunities/routes.ts:392).

Confirmacoes:

- nenhum endpoint mudou;
- nenhum payload mudou;
- nenhum validator mudou;
- nenhum service mudou;
- nenhum repository mudou;
- apenas a tipagem frontend foi ajustada para refletir o contrato real.

## Compatibilidade de produto

`mapOpportunityApiToWorkspaceInput()` continua priorizando:

1. `opportunity.product?.name`
2. aliases legados de label (`produto`, `productName`, `product_name`)

Regras:

- `productId` continua canonico;
- o fallback legado serve apenas para label/snapshot de compatibilidade;
- o fallback nao inventa `productId`;
- o fallback nao determina `pipelineId`;
- o fallback nao determina `stageId`;
- a entrada original nao e mutada.

## Validacao

Validacao direcionada esperada para este bloco:

- `npm test -- src/test/workspaceOpportunity.test.ts`
- `npm test -- src/test/oportunidades-card-interaction.test.tsx`
- `npm test -- src/test/oportunidades-kanban-hardening.test.ts`
- `npm test`
- `npm run build`
- `npm run arch:check`

## Resultado

O C2.1 conclui a reconciliacao imediata do `moveStage` usando a Mapping Layer canonica, mantendo o refetch apenas como verificacao posterior e sem expandir o escopo para rollback, concorrencia ou stale-response handling.
