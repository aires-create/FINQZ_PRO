# BLOCO C1 — AUDITORIA DIRIGIDA DO CONTRATO CANÔNICO E NORMALIZAÇÃO

Data: 2026-08-03
Modo: leitura, rastreamento ponta a ponta, validação contratual, classificação de aliases e documentação
Escopo: documental, sem alteração funcional

## 1. Resumo executivo

O domínio `Opportunity` já possui contrato backend e frontend oficial em camelCase/UUID via `backend/src/modules/opportunities/*` e `src/api/modules/opportunities.api.ts`. O problema do C1 não está no contrato oficial em si, e sim na coexistência de três superfícies diferentes:

1. contrato canônico persistido do backend;
2. `OpportunityUiShape` montado em `src/pages/Oportunidades.tsx`;
3. `OpportunityWorkspaceViewModel` retornado por `normalizeOpportunityWorkspace`.

Conclusão principal:

- o contrato oficial de leitura/escrita da API usa `title`, `amount`, `customerId`, `productId`, `ownerId`, `pipelineId`, `stageId`;
- a tela `Oportunidades.tsx` ainda replica aliases legados como `nome`, `valor`, `cliente_id`, `responsavel_id`, `pipeline_id`, `etapa_id`;
- o normalizador já define uma precedência explícita para etapa e pipeline, mas sua saída continua expondo aliases por compatibilidade;
- a menor implementação segura futura é formalizar `OpportunityWorkspaceViewModel` como saída única canônica de UI, preservar aliases apenas na entrada e impedir payload oficial com nomes legados;
- não há evidência de risco P0 novo neste recorte.

Classificação geral dos achados:

- Contrato backend/API: CONFIRMADO
- Saída canônica do normalizador: CONFIRMADO
- Dependências legadas da Pipeline/Workspace: PARCIALMENTE CONFIRMADO
- Persistência oficial de `origem` e `tags` em `Opportunity`: NÃO CONFIRMADO

## 2. SSOT consultada

| Documento | Papel | Conformidade |
| --------- | ----- | ------------ |
| `docs/00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md` | macroarquitetura e precedência enterprise | conforme |
| `docs/audits/workspace-oportunidade/BLOCO_C0_MAPA_OFICIAL_OPPORTUNITY.md` | SSOT principal do C1 | conforme |
| `docs/audits/workspace-oportunidade/BLOCO_C_AUDITORIA_TECNICA.md` | auditoria técnica C/C6 | conforme |
| `docs/audits/workspace-oportunidade/BLOCO_C_PLANO_EXECUCAO.md` | plano do bloco C | conforme como plano |
| `docs/audits/workspace-oportunidade/MATRIZ_EXECUTIVA_ACOES_PRIORITARIAS.md` | priorização executiva | conforme |
| `docs/audits/workspace-oportunidade/contracts-source-of-truth/MATRIZ_FONTE_VERDADE_WORKSPACE.md` | SSOT histórica do workspace | parcialmente divergente do código atual |
| `docs/audits/workspace-oportunidade/phase-a/CONTRATO_CANONICO_WORKSPACE.md` | contrato histórico da workspace | parcialmente alinhado |
| `docs/audits/workspace-oportunidade/contracts-source-of-truth/RASTREAMENTO_PONTA_A_PONTA_WORKSPACE.md` | rastreamento histórico | parcialmente alinhado |
| `docs/audits/workspace-oportunidade/BLOCO_B_REGRESSAO_FUNCIONAL_CARD.md` | regressão funcional do card | conforme |

Observação de caminho:

- as buscas obrigatórias que mencionavam `prisma` na raiz precisaram ser adaptadas para `backend/prisma`, pois não existe diretório `prisma/` em `C:\Projects\FINQZ_PRO_HML_PROMOTION`.

## 3. Arquitetura da transformação

Fluxo real confirmado:

`Prisma Opportunity`
→ `backend/src/modules/opportunities/repositories/opportunities.repository.ts`
→ `backend/src/modules/opportunities/services/opportunities.service.ts`
→ `backend/src/modules/opportunities/routes.ts`
→ `src/api/modules/opportunities.api.ts`
→ `mapApiOpportunityToKanbanShape` em `src/pages/Oportunidades.tsx`
→ `OpportunityUiShape`
→ `normalizeOpportunityWorkspace`
→ `OpportunityWorkspaceViewModel`
→ consumidores da Pipeline e da Workspace

Camadas observadas:

- Backend/Prisma: canônico persistido.
- API frontend `opportunities.api.ts`: canônico de transporte.
- `api/client.ts`: wrapper de compatibilidade com nomes PT-BR.
- `mapApiOpportunityToKanbanShape`: adaptação manual `API -> OpportunityUiShape`.
- `normalizeOpportunityWorkspace`: consolidação de aliases e derivados para leitura da Workspace.
- `Oportunidades.tsx`: ainda cria objetos manuais paralelos no card, no create, no edit, no open-edit e no drag-and-drop.

## 4. Contrato da API

| Operação | Entrada | Saída | Transformação | Gap |
| -------- | ------- | ----- | ------------- | --- |
| `getAll` | `page`, `limit`, `search`, `status`, `pipelineId`, `stageId`, `customerId`, `ownerId` | `Opportunity[]` | nenhuma no módulo API; transformação acontece depois em `mapApiOpportunityToKanbanShape` | UI ainda depende de mapper local |
| `getById` | `id` UUID string | `Opportunity` | nenhuma no módulo API | sem adapter dedicado de detalhe |
| `create` | `CreateOpportunityPayload` com `title`, `amount`, `pipelineId`, `stageId`, relações opcionais | `Opportunity` | nenhuma no módulo API | create real da tela usa `createIntake`, não `create` simples |
| `createIntake` | `customer` + `opportunity` canônicos | `customer.status` + IDs da `opportunity` | nenhuma no módulo API | tela monta payload manual extenso antes de chamar |
| `update` | `UpdateOpportunityPayload` com nomes canônicos | `Opportunity` | nenhuma no módulo API | tela traduz `valor -> amount`, `cliente_id -> customerId`, `responsavel_id -> ownerId` manualmente |
| `moveStage` | `stageId`, `pipelineId?` | `Opportunity` | nenhuma no módulo API | tela resolve UUID oficial a partir de etapa visual/manual |
| `delete` | `id` UUID string | `Opportunity` ou `{ id }` | nenhuma | sem impacto direto de normalização |

Campos oficialmente recebidos pela API:

- `Opportunity`: `id`, `title`, `description`, `amount`, `currency`, `probability`, `status`, `expectedCloseDate`, `actualCloseDate`, `tenantId`, `partnerId`, `leadId`, `customerId`, `productId`, `subproductId`, `modalityId`, `pipelineId`, `stageId`, `ownerId`, `deletedAt`, `createdAt`, `updatedAt`
- relações opcionais: `customer`, `product`, `subproduct`, `modality`

Classificação:

- contrato oficial da API: CONFIRMADO
- aliases aceitos no módulo API oficial: NÃO CONFIRMADO
- payload oficial com nomes legados: NÃO CONFIRMADO

## 5. Contrato backend

| Campo | DTO create | DTO update | Validator | Service | Repository | Prisma | Resposta API |
| ----- | ---------- | ---------- | --------- | ------- | ---------- | ------ | ------------ |
| `id` | n/a | n/a | param/route | `findById/update/move/archive` | `findById/updateMany` | `Opportunity.id` | sim |
| `tenantId` | não vem do body | não vem do body | body `.strict()` bloqueia campo extra | inserido pela route a partir do token | `where`/`create` | `Opportunity.tenantId` | sim |
| `pipelineId` | obrigatório | opcional | UUID | validado com stage | `findMany/findById/create/update/moveStage` | `Opportunity.pipelineId` | sim |
| `stageId` | obrigatório | opcional em update, obrigatório em move | UUID | validado com pipeline | `findMany/findById/create/update/moveStage` | `Opportunity.stageId` | sim |
| `title` | obrigatório | opcional | texto | trim | create/update | `Opportunity.title` | sim |
| `amount` | obrigatório | opcional | número | set direto | create/update | `Opportunity.amount` | sim |
| `customerId` | opcional | opcional | UUID nullable | tenant check | create/update | `Opportunity.customerId` | sim |
| `productId` | opcional | opcional | UUID nullable | hierarquia validada | create/update | `Opportunity.productId` | sim |
| `ownerId` | opcional | opcional | UUID nullable | scope/normalização | create/update | `Opportunity.ownerId` | sim |
| `status` | opcional | opcional | string trim | create default `open`, update trim | create/update | `Opportunity.status` | sim |
| `description` | opcional | opcional | texto nullable | trim/normalize | create/update | `Opportunity.description` | sim |
| `createdAt`/`updatedAt` | n/a | n/a | n/a | Prisma | include/read | `Opportunity.createdAt`/`updatedAt` | sim |
| `source`/`origem` | ausente | ausente | ausente | ausente | ausente | ausente em `Opportunity` | não |
| `tags` | ausente | ausente | ausente | ausente | ausente | ausente em `Opportunity` | não |

Observações backend:

- `routes.ts` injeta `tenantId` e `actorId`; o body não aceita `tenantId`.
- `validators/opportunities.validator.ts` usa `.strict()`, então campos legados extras são rejeitados.
- `repository` inclui `pipeline`, `stage`, `customer`, `product`, `subproduct`, `modality` na leitura.
- `Prisma Opportunity` não contém `source` nem `tags`.

Classificação:

- contrato backend persistido: CONFIRMADO
- projeções `pipeline`/`stage`/`customer`: CONFIRMADO
- existência de `origem` e `tags` no modelo `Opportunity`: NÃO CONFIRMADO

## 6. Entrada do normalizador

Arquivo auditado: `src/components/pipeline/workspaceOpportunity.ts`

| Conceito | Campos aceitos | Precedência | Default | Risco |
| -------- | -------------- | ----------- | ------- | ----- |
| identidade | `id`, `opportunityId`, `leadId`, `customerId` | `id > opportunityId > leadId > customerId` para `canonicalId` | `""` | P1 se `id` não for o ID remoto real |
| display ID | `displayId`, `id` | `displayId > id não UUID > missing` | `Sem código` | P3 |
| pipeline | `pipelineId`, `pipeline_id`, `produto` | `pipelineId > pipeline_id > produto` | `Pipeline não identificado` | P1 |
| etapa | `stageId`, `stage_id`, `etapa_id`, `etapa` | `stageId > stage_id > etapa_id > etapa` | `Etapa não identificada` | P1 |
| cliente nome | `cliente_nome`, `nome` | `cliente_nome > nome` | `Sem nome` | P1 por ambiguidade semântica |
| valor | `valor` | somente `valor` | `0` | P1 porque `amount` não entra diretamente no normalizador |
| responsável | `responsavel_nome` | direto | `""` | P2 |
| status | `status` | direto | `ativo` | P2 |
| observações | `observacoes` | direto | `""` | P2 |
| origem | `origem` | direto | `""` | P2, mas contrato não confirmado |
| tags | `tags` | array direto | `[]` | P2 |
| datas | `createdAt`, `created_at`, `updatedAt`, `updated_at` | camelCase > snake_case | `null` | P2 |

Achados da entrada:

- o normalizador trabalha com `Record<string, unknown>`, não com um tipo de entrada estrito;
- ele aceita aliases de leitura, mas não lê `amount` diretamente;
- ele não lê `customerId` como fonte de nome, apenas de identidade;
- `produto` ainda participa da resolução de pipeline via `mapearProdutoLegadoParaPipeline`;
- a entrada é tolerante, mas frouxa.

## 7. Saída do normalizador

Tipo real retornado: `OpportunityWorkspaceViewModel`

| Campo | Tipo | Fonte | Canônico | Derivado | Consumidores |
| ----- | ---- | ----- | -------- | -------- | ------------ |
| `id` | `string` | `canonicalId` | sim | não | modal, merge, mutation id |
| `displayId` | `string` | `displayId/id` | não | sim | header/card |
| `leadId` | `string \| null` | entrada | compat | não | mutation id fallback/contexto |
| `opportunityId` | `string \| null` | entrada | compat | não | mutation id fallback |
| `customerId` | `string \| null` | entrada | sim | não | forms/links |
| `pipelineId` | `string \| null` | resolução | sim | não | workspace/payloads |
| `pipeline_id` | `string \| null` | espelho de `pipelineId` | não | não | compat |
| `stageId` | `string \| null` | resolução | sim | não | workspace/payloads |
| `stage_id` | `string \| null` | espelho de `stageId` | não | não | compat |
| `etapa_id` | `string` | `stage.id` ou `""` | não | não | compat forte |
| `etapa` | `string` | `stageLabel` | não | sim | compat de exibição |
| `cliente_nome` | `string` | `cliente_nome/nome` | não | não | header/card |
| `nome` | `string` | espelho de `cliente_nome` | não | não | compat forte |
| `produto` | `string` | entrada | parcial | não | card/workspace |
| `responsavel_nome` | `string` | entrada | parcial | não | card/workspace |
| `valor` | `number` | entrada `valor` | não | não | card/workspace |
| `stageLabel` | `string` | catálogo de stage | não | sim | modal/header |
| `pipelineLabel` | `string` | contexto/catalog | não | sim | modal/header |
| `formattedValue` | `string` | `formatCurrency(valor)` | não | sim | modal/card |
| `displayName` | `string` | `clienteNome/produto/displayId` | não | sim | avatar/header |
| `initials` | `string` | `displayName` | não | sim | avatar |

Conclusão da saída:

- existe um único tipo de saída formalizado no normalizador;
- essa saída ainda replica aliases legados por compatibilidade (`pipeline_id`, `stage_id`, `etapa_id`, `etapa`, `nome`);
- `stageLabel` e `pipelineLabel` são derivados confirmados;
- `valor` continua sendo a superfície numérica do view model, não `amount`.

## 8. Precedência de aliases

| Conceito | 1ª prioridade | 2ª | 3ª | 4ª | Resultado | Risco |
| -------- | ------------- | --- | --- | --- | --------- | ----- |
| etapa | `stageId` | `stage_id` | `etapa_id` | `etapa` | `stage.id` + `stageLabel` | P1 |
| pipeline | `pipelineId` | `pipeline_id` | `produto` | n/a | `pipeline.id` + `pipelineLabel` | P1 |
| valor no normalizador | `valor` | n/a | n/a | n/a | `persisted.valor` | P1 |
| valor no mapper da página | `amount` para API -> `valor` duplicado | n/a | n/a | n/a | `OpportunityUiShape.valor/amount` | P1 |
| cliente ID no card | `customerId` | `cliente_id` | n/a | n/a | `customerId` e espelho `cliente_id` | P1 |
| cliente nome | `customer.name/fullName/customerName` no mapper | `cliente_nome` no normalizador | `nome` | n/a | `cliente_nome` | P2 |
| produto ID | `productId` | `product_id` | `produto_id` | n/a | múltiplos espelhos | P1 |
| responsável ID | `ownerId` | `responsavel_id` | n/a | n/a | múltiplos espelhos | P1 |

Conflito importante:

- o normalizador garante `stageId` sobre alias legado;
- a UI ainda possui trechos fora do normalizador que usam `etapa_id ?? etapa`;
- para valor, a normalização ainda depende de `valor`, enquanto a origem oficial da API é `amount`.

## 9. Aliases

| Alias | Canônico | Leitura | Escrita | Consumidores | Decisão |
| ----- | -------- | ------- | ------- | ------------ | ------- |
| `etapa_id` | `stageId` | sim | sim em UI local | Pipeline, filtros, form, drag-and-drop, modal | NECESSÁRIO TEMPORARIAMENTE |
| `stage_id` | `stageId` | sim | não confirmado na tela | normalizador | SOMENTE LEITURA |
| `etapa` | `stageLabel`/semântico de etapa | sim | sim em payload auxiliar do normalizador | header, fallback visual | SOMENTE LEITURA futura; hoje ainda aparece em escrita auxiliar |
| `pipeline_id` | `pipelineId` | sim | sim em UI local | create/edit/filtering/grouping | NECESSÁRIO TEMPORARIAMENTE |
| `nome` | `title` ou `cliente_nome` dependendo da camada | sim | sim | create/edit/header/card | CANDIDATO À DEPRECIAÇÃO |
| `cliente_id` | `customerId` | sim | sim | create/edit/card | NECESSÁRIO TEMPORARIAMENTE |
| `cliente_nome` | snapshot de cliente | sim | sim local | card, workspace | SOMENTE LEITURA futura |
| `responsavel_id` | `ownerId` | sim | sim | create/edit/filtering | NECESSÁRIO TEMPORARIAMENTE |
| `responsavel_nome` | owner projection | sim | sim local | card, workspace | SOMENTE LEITURA |
| `valor` | `amount` | sim | sim local | card, workspace, create/edit | NECESSÁRIO TEMPORARIAMENTE |
| `observacoes` | `description` | sim | sim | edit/workspace | NECESSÁRIO TEMPORARIAMENTE |

## 10. Conflitos

| Conceito | Canônico | Alias | Vencedor atual | Teste | Risco |
| -------- | -------- | ----- | -------------- | ----- | ----- |
| etapa | `stageId` | `etapa_id` | `stageId` no normalizador | sim, `workspaceOpportunity.test.ts` | P1 |
| etapa | `stageId` | `stage_id` | `stageId` no normalizador | não específico | P1 |
| etapa | `stageId` | `etapa` | `stageId`/catálogo no normalizador | parcial | P1 |
| valor | `amount` | `valor` | na API vence `amount`; no normalizador só entra `valor` | não há teste de conflito `amount vs valor` | P1 |
| cliente | `customerId` | `cliente_id` | na página costuma prevalecer `customerId ?? cliente_id` | sem teste explícito de conflito divergente | P1 |
| responsável | `ownerId` | `responsavel_id` | na página costuma prevalecer `ownerId ?? responsavel_id` | sem teste explícito de conflito divergente | P2 |
| título/nome | `title` | `nome` | mapper coloca `nome = title`, mas normalizador usa `cliente_nome ?? nome` | sem teste de conflito semântico | P1 |

Resultado:

- conflitos de etapa estão parcialmente cobertos;
- conflitos de valor/cliente/responsável ainda são silenciosos;
- não há warning explícito quando canônico e alias divergem.

## 11. Consumidores Pipeline

| Consumidor | Arquivo | Campo usado | Canônico ou alias | Risco de mudança |
| ---------- | ------- | ----------- | ----------------- | ---------------- |
| agrupamento Kanban | `src/pages/Oportunidades.tsx` / helpers | `getOpportunityVisualStageId`, `etapa_id`, `stageId` | misto | alto |
| card visual | `src/pages/Oportunidades.tsx` | `nome`, `valor`, `responsavel_nome`, `etapa` | alias | alto |
| drag-and-drop | `src/pages/Oportunidades.tsx` | `stageId`, `etapa_id`, `pipelineId`, `pipeline_id` | misto | alto |
| filtros | `src/pages/Oportunidades.tsx` | `etapa_id`, `responsavel_id` | alias | médio |
| create/edit modal | `src/pages/Oportunidades.tsx` | `formData.*`, `cliente_id`, `responsavel_id`, `valor`, `etapa_id` | alias | alto |

## 12. Consumidores Workspace

| Área da Workspace | Campo usado | Origem | Canônico | Alias | Derivado | Gap |
| ----------------- | ----------- | ------ | -------- | ----- | -------- | --- |
| header etapa | `stageLabel ?? derived.stageLabel ?? etapa ?? etapa_id` | normalizador + fallback local | `stageId` para operação | sim | sim | ainda depende de fallback legado |
| cliente | `cliente_nome ?? nome` | normalizador/UI | `customerId` para vínculo | sim | não | ambiguidade `nome` |
| produto | `produto` | UI/local/relação | `productId` | sim | parcial | sem projection oficial única |
| responsável | `responsavel_nome` | UI/projection | `ownerId` | sim | parcial | projection não formalizada |
| valor | `valor` | normalizador/UI | `amount` na persistência | sim | `formattedValue` adicional | drift semântico |
| anotações | `observacoes` | UI | `description` no backend | sim | não | semântica misturada |
| tags | `tags` | UI/local | não confirmado | sim | não | persistência não comprovada |
| tarefas/anexos/histórico | listas locais | UI | não confirmado | n/a | parcial | fora do contrato oficial |

## 13. Payloads manuais

| Handler | Operação | Campos | Risco | Recomendação |
| ------- | -------- | ------ | ----- | ------------ |
| `handleSubmit` | create via `createIntake` | monta `customer` e `opportunity` manualmente a partir de `formData` | P1 | extrair tradutor canônico único |
| `handleSubmitEdit` | update | traduz `nome -> title`, `valor -> amount`, `cliente_id -> customerId`, `responsavel_id -> ownerId`, `observacoes -> description` | P1 | centralizar builder oficial |
| `confirmarMudancaFase` | move stage pós-simulação | resolve `pipelineId`/`stageId` UUID e envia `moveStage` | P1 | reaproveitar helper único de move |
| drag-and-drop handler | move stage de card | resolve `stageId`/`pipelineId` backend a partir de valores visuais | P1 | centralizar resolução de stage |
| `aceitarSimulacao` | update amount | envia apenas `amount` oficial, mas atualiza `selectedLead` com campos locais | P2 | formalizar pós-mutation merge |
| `openEditOpportunity` | hydratação do form | remapeia oportunidade inteira para `formData` | P2 | reduzir transformação paralela |
| cardData inline | leitura do card | replica diversos aliases do card em objeto manual | P2 | normalizar antes de renderizar o card |

## 14. Transformações duplicadas

Arquivos confirmados:

- `src/pages/Oportunidades.tsx`
  - `mapApiOpportunityToKanbanShape`
  - `cardData` inline no render do Kanban
  - `openEditOpportunity`
  - `handleSubmitEdit`
  - `handleSubmit`
  - header da workspace com fallback manual de etapa
- `src/components/pipeline/workspaceOpportunity.ts`
  - normalização oficial
- `src/components/pipeline/pipelineUtils.ts`
  - agrupamento ainda baseado em `etapa_id` / `etapa`

Risco:

- P2 de drift entre mapper da página e normalizador oficial;
- P1 quando payload oficial depende de alias traduzido manualmente e não de builder central.

## 15. Campos derivados

| Campo derivado | Fonte | Função | Persistido indevidamente | Consumidores |
| -------------- | ----- | ------ | ------------------------ | ------------ |
| `stageLabel` | `stageId` + catálogo / `stage.name` | exibição de etapa | não | modal/header/testes |
| `pipelineLabel` | `pipelineId` + contexto | exibição | não | modal/header |
| `formattedValue` | `valor` | exibição monetária | não | modal/card |
| `displayId` | `displayId` explícito ou `id` não UUID | exibição segura | não | card/header |
| `displayName` | `clienteNome`/`produto`/`displayId` | avatar/header | não | workspace |
| `initials` | `displayName` | avatar | não | workspace |
| histórico visual inline | `selectedLead` + timestamps | timeline fake | sim, apenas local | modal |

## 16. Campos descartados

Somente confirmados:

| Campo recebido | Camada onde desaparece | Consumidor potencial | Impacto | Decisão |
| -------------- | ---------------------- | ------------------- | ------- | ------- |
| `amount` | normalizador não lê `amount`, apenas `valor` | Workspace pós-normalização | médio | mapear `amount -> valor` antes do normalizador ou aceitar `amount` na entrada oficial |
| `customer.firstName/lastName` | mapper consolida em `cliente_nome` | header/CRM link | baixo | aceitável, mas documentar como snapshot |
| `pipeline.name` | vira `backendPipelineName`/`pipelineLabel` | exibição | baixo | aceitável |
| `stage.name` | vira `backendStageName`/`stageLabel` | exibição | baixo | aceitável |

## 17. Testes existentes

| Cenário | Coberto | Arquivo | Tipo | Gap |
| ------- | ------- | ------- | ---- | --- |
| precedência `stageId > etapa_id > etapa` | sim | `src/test/workspaceOpportunity.test.ts` | unitário | falta `stage_id` explícito |
| stage técnico desconhecido não vira label | sim | `src/test/workspaceOpportunity.test.ts` | unitário | bom |
| não mutação da entrada | sim | `src/test/workspaceOpportunity.test.ts` | unitário | bom |
| payload sem derivados | sim | `src/test/workspaceOpportunity.test.ts` | unitário | não cobre payload oficial da página |
| mutation id seguro | sim | `src/test/workspaceOpportunity.test.ts` | unitário | modelo legado numérico ainda histórico |
| abertura do card e label canônico | sim | `src/test/oportunidades-card-interaction.test.tsx` | interação | não cobre escrita |
| ações internas do card não abrem modal | sim | `src/test/oportunidades-card-interaction.test.tsx` | interação | não cobre edit/create |
| mapper preserva `stageId` oficial | sim | `src/test/oportunidades-kanban-hardening.test.ts` | unitário/estrutural | bom |
| rebuild pós drag-and-drop | sim | `src/test/oportunidades-kanban-hardening.test.ts` | unitário | não cobre conflito de alias |
| validator backend bloqueia campos obsoletos | sim | `backend/src/tests/unit/opportunities.validator.test.ts` | unitário | bom |
| service move/create/intake/scope | sim | `backend/src/tests/unit/opportunities.service.test.ts` | unitário | forte em backend, fraco em compat UI |
| repository tenant isolation | sim | `backend/src/tests/unit/opportunities.repository.test.ts` | unitário | bom |
| RBAC/registro de rotas | sim | `backend/src/tests/unit/opportunities.routes.test.ts`, `backend/src/tests/integration/opportunities.test.ts` | unitário/integration | bom |

Faltam testes explícitos para:

- conflito `amount` vs `valor`;
- conflito `customerId` vs `cliente_id`;
- conflito `ownerId` vs `responsavel_id`;
- precedência `stageId` vs `stage_id`;
- `amount = 0` canônico vs alias não zero;
- strings vazias/null/undefined conflitantes entre canônico e alias;
- payload parcial de update quando campo canônico e alias coexistem.

## 18. Gaps priorizados

| ID | Gap | Evidência | Prioridade | Risco |
| -- | --- | --------- | ---------- | ----- |
| G1 | `OpportunityUiShape` e `OpportunityWorkspaceViewModel` coexistem com semânticas diferentes | `Oportunidades.tsx` + `workspaceOpportunity.ts` | P1 | drift entre card, modal e payload |
| G2 | normalizador não aceita `amount` diretamente como entrada canônica | `workspaceOpportunity.ts` lê `valor` | P1 | perda de canonicidade na entrada |
| G3 | payloads oficiais ainda são montados manualmente na página | `handleSubmit`, `handleSubmitEdit`, `confirmarMudancaFase` | P1 | alias enviado incorretamente ou omissão de campo |
| G4 | `nome` alterna entre título e nome do cliente | `mapApiOpportunityToKanbanShape`, `openEditOpportunity`, header | P1 | sobrescrita semântica errada |
| G5 | `etapa_id`, `pipeline_id`, `cliente_id`, `responsavel_id`, `valor` seguem espalhados como aliases ativos | busca obrigatória em `src/pages/Oportunidades.tsx` | P2 | dívida de compatibilidade alta |
| G6 | `origem` e `tags` não têm contrato oficial comprovado em `Opportunity` | API/Prisma/validator sem campos correspondentes | P2 | documentação ou UI induzindo persistência inexistente |
| G7 | transformação duplicada fora do normalizador | `cardData` inline, `openEditOpportunity`, mapeamentos manuais | P2 | manutenção difícil |

## 19. Contrato canônico proposto

| Conceito | Entrada canônica | Aliases | Saída | Derivado | Decisão |
| -------- | ---------------- | ------- | ----- | -------- | ------- |
| etapa | `stageId` | `stage_id`, `etapa_id`, `etapa` | `stageId` + `stageLabel` | `stageLabel` | RECOMENDADA |
| pipeline | `pipelineId` | `pipeline_id`, `produto` somente leitura | `pipelineId` + `pipelineLabel` | `pipelineLabel` | RECOMENDADA |
| título | `title` | `nome` somente compat | `title` ou `cliente_nome` separados | `displayName` | REQUER AJUSTE |
| valor | `amount` | `valor` | `amount` em input; `valor` pode continuar como espelho de UI temporário | `formattedValue` | RECOMENDADA |
| cliente | `customerId` | `cliente_id` | `customerId` + snapshot `cliente_nome` | `cliente_nome` | RECOMENDADA |
| produto | `productId` | `product_id`, `produto_id`, `produto` | `productId` + label derivado | nome do produto | REQUER COMPAT |
| responsável | `ownerId` | `responsavel_id` | `ownerId` + projection `responsavel_nome` | `responsavel_nome` | REQUER COMPAT |
| status | `status` | nenhum forte | `status` | não | RECOMENDADA |
| descrição | `description` | `observacoes` | `description` | não | RECOMENDADA |
| origem | NÃO CONFIRMADO | `origem`, `source`, `origin` | NÃO CONFIRMADO | n/a | MANTER NÃO CONFIRMADO |
| tags | NÃO CONFIRMADO para `Opportunity` | `tags` | NÃO CONFIRMADO | n/a | MANTER NÃO CONFIRMADO |

## 20. Implementação mínima recomendada

Arquivos prováveis:

- `src/components/pipeline/workspaceOpportunity.ts`
- `src/pages/Oportunidades.tsx`
- `src/api/modules/opportunities.api.ts`
- `src/types/index.ts`
- `src/test/workspaceOpportunity.test.ts`
- `src/test/oportunidades-card-interaction.test.tsx`
- `src/test/oportunidades-kanban-hardening.test.ts`

Alterações propostas:

1. formalizar um tipo de entrada do normalizador que aceite campos canônicos e aliases explicitamente;
2. aceitar `amount` como entrada oficial do normalizador, preservando `valor` apenas como compat;
3. garantir que a saída canônica usada por Pipeline e Workspace seja uma só;
4. centralizar builders de payload oficial para `createIntake`, `update` e `moveStage`;
5. fazer o campo canônico sempre prevalecer sobre alias em conflito;
6. adicionar testes de conflito antes de qualquer depreciação.

Fora do escopo:

- Prisma
- migrations
- backend, se o contrato permanecer consistente
- Zustand estrutural
- simulador completo
- tarefas
- anexos
- histórico

Dependências:

- nenhuma dependência nova
- apenas alinhamento de contrato e testes

## 21. Critérios de aceite

- Um único tipo canônico de saída para a Workspace.
- Campos oficiais sempre prevalecem sobre aliases.
- Aliases aceitos somente na entrada.
- Payloads oficiais usam nomes canônicos.
- Nenhum alias removido sem cobertura.
- Pipeline e Workspace consomem a mesma saída normalizada.
- Nenhuma alteração de Prisma.
- Nenhuma migration.
- Compatibilidade legada preservada.
- Testes de conflito aprovados.
- Testes existentes sem regressão.
- `npm run build` futuro aprovado.
- `npm run arch:check` aprovado.

## 22. Condições de interrupção futura

Interromper implementação se exigir:

- alteração do banco;
- migration;
- mudança de endpoint público;
- quebra de payload público;
- remoção imediata de alias;
- alteração transversal em vários módulos não mapeados;
- decisão de produto sobre `origem`;
- decisão de produto sobre `tags`;
- alteração do modelo de cliente;
- alteração do modelo de produto;
- alteração de RBAC ou tenant.

## 23. Riscos

### P0

Nenhum risco P0 identificado.

### P1

- canônico de valor ainda depende de tradução manual `valor -> amount`;
- `nome` permanece semanticamente ambíguo entre título e cliente;
- payloads oficiais ainda são montados fora de um builder único;
- consumidores ainda leem aliases diretamente em pontos do card e modal.

### P2

- transformações duplicadas fora do normalizador;
- tipo de entrada do normalizador é frouxo (`Record<string, unknown>`);
- excesso de aliases ativos;
- cobertura incompleta de conflitos.

### P3

- nomenclatura de compatibilidade em `api/client.ts`;
- manutenção mais difícil por replicação de campos.

## 24. Recomendação final

O C1 demonstrou que o backend e a API oficial já estão coerentes, e que o gargalo real está na camada de tradução da UI. A menor implementação segura não é reescrever o domínio, e sim:

1. explicitar o contrato de entrada do normalizador;
2. consolidar uma saída única de UI;
3. preservar aliases somente como compatibilidade de leitura;
4. impedir escrita oficial com nomes legados;
5. cobrir conflitos por teste antes de qualquer depreciação.

Parecer técnico:

`AUDITORIA DO BLOCO C1 CONCLUÍDA — CONTRATO CANÔNICO E IMPLEMENTAÇÃO MÍNIMA PRONTOS PARA REVISÃO`
