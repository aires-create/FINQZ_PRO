# BLOCO C1.3 — Centralização dos Builders de Payload

## Escopo

Este microbloco concentrou a tradução `OpportunityWorkspaceViewModel -> DTO oficial da API` em uma única camada de builders puros, sem alterar contratos públicos, backend, Prisma ou endpoints.

## Arquitetura anterior

Antes do C1.3, os fluxos de escrita do workspace de oportunidades montavam payloads manualmente em pontos distintos de [`src/pages/Oportunidades.tsx`](/C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx). Havia repetição de seleção de campos, mistura entre aliases do workspace e campos canônicos, além de conversões distribuídas de `amount`, `stageId`, `pipelineId`, `customerId` e `ownerId`.

Os pontos auditados eram consumidos diretamente por `opportunitiesApi.createIntake`, `opportunitiesApi.update` e `opportunitiesApi.moveStage`, sem uma camada única e explícita de tradução.

## Matriz de auditoria

| Fluxo | Arquivo | Builder atual | Payload | Consumidor | Duplicidade |
| --- | --- | --- | --- | --- | --- |
| Atualização de valor após aceite de simulação | `src/pages/Oportunidades.tsx` | `buildUpdateOpportunityPayload` | `UpdateOpportunityPayload` com `amount` | `opportunitiesApi.update` | Antes havia montagem manual isolada |
| Confirmação de fase/etapa | `src/pages/Oportunidades.tsx` | `buildMoveStagePayload` | `MoveOpportunityStagePayload` | `opportunitiesApi.moveStage` | Repetia lógica de `moveStage` |
| Atualização de envelope de assinatura | `src/pages/Oportunidades.tsx` | `buildOpportunityEnvelopeUpdatePayload` | patch parcial compatível com `update` | `opportunitiesApi.update` | Antes havia montagem manual isolada |
| Drag and drop entre colunas | `src/pages/Oportunidades.tsx` | `buildMoveStagePayload` | `MoveOpportunityStagePayload` | `opportunitiesApi.moveStage` | Mesmo endpoint com montagem repetida |
| Importação para intake | `src/pages/Oportunidades.tsx` | `buildCreateOpportunityIntakePayload` | `CreateOpportunityIntakePayload` | `opportunitiesApi.createIntake` | Havia montagem manual extensa |
| Criação de nova oportunidade | `src/pages/Oportunidades.tsx` | `buildCreateOpportunityIntakePayload` | `CreateOpportunityIntakePayload` | `opportunitiesApi.createIntake` | Mesmo endpoint com payload montado em outro trecho |
| Edição de oportunidade existente | `src/pages/Oportunidades.tsx` | `buildUpdateOpportunityPayload` | `UpdateOpportunityPayload` | `opportunitiesApi.update` | Havia montagem manual com seleção própria de campos |

## Inventário dos campos enviados

### CREATE

Builder oficial: `buildCreateOpportunityPayload`

Campos obrigatórios:

- `title`
- `amount`
- `pipelineId`
- `stageId`

Campos opcionais:

- `productId`
- `subproductId`
- `modalityId`
- `customerId`
- `leadId`
- `ownerId`
- `description`
- `probability`
- `currency`
- `expectedCloseDate`

Campos derivados:

- `productId`, `subproductId`, `modalityId` são resolvidos a partir do ViewModel canônico e do catálogo fornecido
- `description` respeita `overrides` explícitos e normaliza `null`

Aliases:

- aliases do workspace são absorvidos previamente por `normalizeOpportunityWorkspace`
- o builder consome apenas a forma canônica do `OpportunityWorkspaceViewModel`

### UPDATE

Builder oficial: `buildUpdateOpportunityPayload`

Campos possíveis:

- `title`
- `description`
- `amount`
- `probability`
- `status`
- `expectedCloseDate`
- `ownerId`
- `customerId`
- `leadId`
- `productId`
- `subproductId`
- `modalityId`

Campos obrigatórios:

- nenhum; o builder devolve payload parcial

Campos derivados:

- `productId`, `subproductId`, `modalityId` podem vir do catálogo consolidado
- `description` preserva string vazia e não converte `undefined` em valor enviado
- `amount` preserva `0`

Aliases:

- aliases divergentes do workspace não seguem para a API
- a seleção final pode ser restringida com `include` para cada fluxo

### MOVE STAGE

Builder oficial: `buildMoveStagePayload`

Campos obrigatórios:

- `stageId`

Campos opcionais:

- `pipelineId`
- `status`
- `reason`

Campos derivados:

- `stageId` e `pipelineId` usam override explícito do fluxo quando necessário

Aliases:

- valores alternativos de etapa/pipeline são resolvidos antes, na normalização do ViewModel

## Duplicidades identificadas

Existe montagem manual repetida:

- Sim. `createIntake`, `update` e `moveStage` possuíam montagem distribuída em múltiplos handlers.

Existe lógica duplicada:

- Sim. Seleção de campos, fallback entre dados do formulário e dados canônicos, e construção de payload parcial estavam espalhados.

Existe transformação repetida:

- Sim. Conversões de strings opcionais, tratamento de `null`/`undefined` e composição de dados de catálogo apareciam em mais de um fluxo.

Existe conversão de `amount`/`valor` repetida:

- Sim. Havia atualização manual de `amount` em fluxo dedicado e reaproveitamento implícito em criação/edição.

Existe conversão de `stageId` repetida:

- Sim. Os dois fluxos de `moveStage` montavam o mesmo payload do endpoint.

Existe conversão de `customerId` repetida:

- Sim. Criação e edição montavam esse campo em pontos separados.

Existe montagem diferente para o mesmo endpoint:

- Sim. `createIntake`, `update` e `moveStage` eram alimentados por montagens distintas apesar de apontarem para contratos únicos.

## Arquitetura final

A camada central ficou concentrada em [`src/components/pipeline/workspaceOpportunity.ts`](/C:/Projects/FINQZ_PRO_HML_PROMOTION/src/components/pipeline/workspaceOpportunity.ts), com funções puras:

- `buildCreateOpportunityPayload`
- `buildUpdateOpportunityPayload`
- `buildMoveStagePayload`
- `buildCreateOpportunityIntakePayload`
- `buildOpportunityEnvelopeUpdatePayload`

Todos os fluxos auditados em [`src/pages/Oportunidades.tsx`](/C:/Projects/FINQZ_PRO_HML_PROMOTION/src/pages/Oportunidades.tsx) passaram a consumir esses builders, sem montagem manual de payload fora da camada central.

## Fluxos consolidados

- Criação via intake agora usa `normalizeOpportunityWorkspace` seguido de `buildCreateOpportunityIntakePayload`
- Importação via intake usa a mesma cadeia canônica de criação
- Edição usa `normalizeOpportunityWorkspace` seguido de `buildUpdateOpportunityPayload`
- Atualização pontual de valor usa `buildUpdateOpportunityPayload` com `include: ['amount']`
- Mudança de etapa por confirmação e por drag and drop usa `buildMoveStagePayload`
- Patch auxiliar de envelope usa `buildOpportunityEnvelopeUpdatePayload`

## Payload oficial consolidado

### `CreateOpportunityPayload`

- `title`
- `amount`
- `pipelineId`
- `stageId`
- `productId`
- `subproductId`
- `modalityId`
- `customerId`
- `leadId`
- `ownerId`
- `description`
- `probability`
- `currency`
- `expectedCloseDate`

### `UpdateOpportunityPayload`

- `title`
- `description`
- `amount`
- `probability`
- `status`
- `expectedCloseDate`
- `ownerId`
- `customerId`
- `leadId`
- `productId`
- `subproductId`
- `modalityId`

### `MoveOpportunityStagePayload`

- `stageId`
- `pipelineId`
- `status`
- `reason`

### `CreateOpportunityIntakePayload`

`customer`:

- `id`
- `firstName`
- `lastName`
- `email`
- `cpfCnpj`
- `phone`
- `birthDate`
- `documentType`
- `address`
- `bankData`
- `profession`
- `maritalStatus`
- `gender`

`opportunity`:

- `title`
- `amount`
- `pipelineId`
- `stageId`
- `productId`
- `subproductId`
- `modalityId`
- `ownerId`
- `description`

## Testes adicionados

Os testes de builders foram concentrados em [`src/test/workspaceOpportunity.test.ts`](/C:/Projects/FINQZ_PRO_HML_PROMOTION/src/test/workspaceOpportunity.test.ts) cobrindo:

- CREATE
- UPDATE
- MOVE STAGE
- campos enviados
- campos omitidos
- aliases ignorados
- `amount`
- `stageId`
- `customerId`
- `ownerId`
- `description`
- `null`
- `undefined`
- não mutação

## Riscos eliminados

- divergência entre fluxos que chamam o mesmo endpoint
- repetição de payload manual no workspace
- vazamento de aliases do ViewModel para a API
- inconsistência no tratamento de `0`, `null` e `undefined`
- duplicidade de composição para `moveStage`

## Riscos remanescentes

- ainda existe dependência explícita de `normalizeOpportunityWorkspace` antes da tradução final
- o patch auxiliar de envelope continua sendo um update parcial fora do trio principal `create/update/moveStage`, embora centralizado
- uma próxima etapa C1.4 pode unificar leitura e escrita em uma mapping layer única entre DTOs, ViewModel e payloads
