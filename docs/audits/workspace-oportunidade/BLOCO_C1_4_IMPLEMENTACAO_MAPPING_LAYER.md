# BLOCO C1.4 - IMPLEMENTACAO MINIMA DA CAMADA DE MAPEAMENTO DE LEITURA

Data: 2026-08-03
Branch: `promotion/hml-g18-full`
Base documental: `24fd2dbb1f6a7ff8f4242bb4f6ec78daf6c0a267`

## Objetivo

Consolidar uma unica entrada de leitura para oportunidades vindas da API oficial:

`Opportunity API DTO -> mapOpportunityApiToWorkspaceInput() -> normalizeOpportunityWorkspace() -> OpportunityWorkspaceViewModel`

Sem alterar backend, Prisma, payloads de escrita, endpoints ou comportamento visual.

## Estado anterior

- `src/pages/Oportunidades.tsx` mantinha `mapApiOpportunityToKanbanShape()` como mapper principal de leitura.
- O mapper local resolvia identidade, aliases, nomes relacionais e shape de card diretamente na page.
- `normalizeOpportunityWorkspace()` ja era a saida canonica da Workspace, mas nao recebia o DTO oficial por uma camada explicita dedicada.
- A listagem read-only da API oficial era carregada por `opportunitiesApi.getAll()` e convertida diretamente para `OpportunityUiShape`.

## Arquitetura implementada

### Camada oficial criada

Arquivo: `src/components/pipeline/workspaceOpportunity.ts`

Funcao criada:

- `mapOpportunityApiToWorkspaceInput(opportunity: Opportunity): OpportunityWorkspaceInput`

Responsabilidades:

- aceitar o DTO oficial `Opportunity`;
- preservar IDs canonicos (`id`, `leadId`, `customerId`, `pipelineId`, `stageId`, `productId`, `ownerId`);
- projetar somente os campos de leitura necessarios ao contrato de entrada do normalizador;
- resolver nomes relacionais minimos de cliente, responsavel, pipeline, etapa e produto;
- manter a funcao pura e sem mutacao do DTO de entrada.

### Fluxo final

`Opportunity API DTO`
-> `mapOpportunityApiToWorkspaceInput()`
-> `normalizeOpportunityWorkspace()`
-> `OpportunityWorkspaceViewModel`
-> wrapper legado de compatibilidade
-> Pipeline / Workspace

## Wrappers preservados

Wrapper preservado:

- `mapApiOpportunityToKanbanShape()` em `src/pages/Oportunidades.tsx`

Motivo:

- a Pipeline ainda consome `OpportunityUiShape` em pontos especificos;
- a remocao imediata exigiria refatoracao transversal fora do escopo minimo deste microbloco.

Regra adotada:

- o wrapper deixou de concentrar a traducao principal;
- ele agora delega para `mapOpportunityApiToWorkspaceInput()` e `normalizeOpportunityWorkspace()`;
- os extras legados restantes foram mantidos apenas como adaptacao superficial de compatibilidade.

## Consumidores migrados

- Listagem inicial da API oficial via `opportunitiesApi.getAll()`
- Refresh por `setApiReadReloadKey()`
- Reabertura de card via `handleOpenLead()`
- Rebuild pos create/update/moveStage por recarga da listagem oficial

## Campos projetados pelo mapper oficial

### Canonicos

- `id`
- `tenantId`
- `leadId`
- `customerId`
- `pipelineId`
- `stageId`
- `title`
- `amount`
- `productId`
- `ownerId`
- `status`
- `description`
- `createdAt`
- `updatedAt`

### Projecoes minimas

- `pipelineName`
- `stageName`
- `cliente_nome`
- `responsavel_nome`
- `produto`
- `telefone`
- `email`

## Campos descartados intencionalmente

Sem consumidor confirmado no ViewModel canonico deste microbloco:

- `currency`
- `probability`
- `expectedCloseDate`
- `actualCloseDate`
- `partnerId`
- `deletedAt`
- `subproduct.code`
- `modality.code`

Mantidos apenas no wrapper legado quando necessario para compatibilidade local:

- `subproductId`
- `subproduct.name`
- `modalityId`
- `modality.name`

## Ajustes complementares

- `Opportunity` passou a expor tipagem relacional minima para `pipeline`, `stage`, `owner` e nomes de cliente.
- `normalizeOpportunityWorkspace()` passou a aceitar `stageName`/`stageNome` como projecao oficial de label quando o catalogo ainda nao foi resolvido.
- `cardData` na Pipeline foi reduzido a espelhamento superficial, sem reintroduzir precedencia propria de IDs.

## Testes

Arquivos ajustados:

- `src/test/workspaceOpportunity.test.ts`
- `src/test/oportunidades-kanban-hardening.test.ts`

Cenarios cobertos:

- DTO oficial completo
- preservacao de `amount = 0`
- ausencia de relacoes
- resolucao deterministica de nome do cliente
- encadeamento `DTO -> input -> ViewModel`
- wrapper legado ainda compativel com o kanban
- integracao do card mantida

## Resultados esperados da validacao

Comandos obrigatorios deste microbloco:

- `npm test -- src/test/workspaceOpportunity.test.ts`
- `npm test -- src/test/oportunidades-card-interaction.test.tsx`
- `npm test -- src/test/oportunidades-kanban-hardening.test.ts`
- `npm test`
- `npm run build`
- `npm run arch:check`
- `git diff --check`

## Riscos remanescentes

- `OpportunityUiShape` ainda existe como shape legado de compatibilidade.
- Aliases como `etapa_id`, `etapa`, `pipeline_id` e `valor` continuam ativos por dependencia da Pipeline atual.
- Agrupamento e filtros ainda dependem de aliases espelhados.
- A remocao completa do wrapper legado deve ocorrer apenas em microbloco proprio, apos a migracao total dos consumidores.

## Fora do escopo mantido

- nenhum payload de escrita foi alterado;
- nenhum endpoint foi alterado;
- nenhum backend foi alterado;
- nenhum Prisma foi alterado;
- nenhum store/Zustand foi refatorado;
- nenhuma mudanca visual foi introduzida;
- C2 nao foi iniciado.

## Proximo microbloco recomendado

Formalizar a remocao progressiva de `OpportunityUiShape` e migrar os consumidores restantes para `OpportunityWorkspaceViewModel`, incluindo grouping e filtros, em uma etapa propria e controlada.
