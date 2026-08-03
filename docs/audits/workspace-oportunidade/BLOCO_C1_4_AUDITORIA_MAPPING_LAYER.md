# BLOCO C1.4 — AUDITORIA DIRIGIDA DA CAMADA DE MAPEAMENTO

Data: 2026-08-03
Modo: leitura, rastreamento, comparação, classificação, planejamento mínimo e documentação
Escopo: sem alteração funcional

## 1. Resumo executivo

O contrato oficial de leitura já existe no backend e no módulo frontend `src/api/modules/opportunities.api.ts`, mas o fluxo real `DTO da API -> UI -> Workspace` continua distribuído em três camadas ativas:

1. `Opportunity` oficial em `src/api/modules/opportunities.api.ts`
2. `mapApiOpportunityToKanbanShape` em `src/pages/Oportunidades.tsx`
3. `normalizeOpportunityWorkspace` em `src/components/pipeline/workspaceOpportunity.ts`

Conclusões principais:

- existem 2 mappers de leitura ativos e explícitos, mais várias transformações inline derivadas;
- `mapApiOpportunityToKanbanShape` ainda é o mapper operacional da listagem e do card;
- `normalizeOpportunityWorkspace` já é a camada oficial de consolidação do Workspace;
- a tela `Oportunidades.tsx` continua criando shapes intermediárias paralelas como `cardData`, `lead`, `cleanFormData`, `createWorkspaceOpportunity`, `editedWorkspaceOpportunity` e hidratações de formulário;
- a menor implementação segura futura é concentrar a entrada de leitura da API em uma única função que produza `OpportunityWorkspaceInput` ou diretamente `OpportunityWorkspaceViewModel`, preservando `mapApiOpportunityToKanbanShape` apenas como compatibilidade temporária dos consumidores que ainda exigem aliases visuais;
- nenhum risco P0 novo foi identificado nesta auditoria.

Classificação geral:

- contrato oficial da API: `CONFIRMADO`
- mapper da página: `CONFIRMADO`
- normalizador oficial: `CONFIRMADO`
- consumers legados dependentes de aliases: `CONFIRMADO`
- necessidade de uma mapping layer única: `CONFIRMADO`

## 2. Documentos consultados

| Documento | Papel | Conformidade |
| --- | --- | --- |
| `docs/00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md` | SSOT macro e princípios de arquitetura | conforme |
| `docs/audits/workspace-oportunidade/BLOCO_C0_MAPA_OFICIAL_OPPORTUNITY.md` | mapa canônico do domínio Opportunity | conforme |
| `docs/audits/workspace-oportunidade/BLOCO_C_AUDITORIA_TECNICA.md` | fotografia técnica do domínio e validação RBAC/tenant | conforme |
| `docs/audits/workspace-oportunidade/BLOCO_C1_AUDITORIA_CONTRATO_NORMALIZACAO.md` | contrato canônico e aliases do workspace | conforme |
| `docs/audits/workspace-oportunidade/BLOCO_C1_1_CONTRATO_ENTRADA_NORMALIZADOR.md` | precedência da entrada do normalizador | conforme |
| `docs/audits/workspace-oportunidade/BLOCO_C1_2_SAIDA_CANONICA_WORKSPACE.md` | saída canônica do workspace | conforme |
| `docs/audits/workspace-oportunidade/BLOCO_C1_3_BUILDERS_PAYLOAD.md` | escrita centralizada via builders | conforme |

## 3. Arquitetura atual de leitura

Fluxo real confirmado:

`Prisma Opportunity`
-> `backend/src/modules/opportunities/repositories/opportunities.repository.ts`
-> `backend/src/modules/opportunities/services/opportunities.service.ts`
-> `backend/src/modules/opportunities/routes.ts`
-> `src/api/modules/opportunities.api.ts`
-> `opportunitiesApi.getAll/getById`
-> `mapApiOpportunityToKanbanShape`
-> `OpportunityUiShape`
-> `buildOpportunitiesByStage` / `cardData` / filtros / hidratação de edição
-> `normalizeOpportunityWorkspace`
-> `OpportunityWorkspaceViewModel`
-> Pipeline card e Workspace fullscreen

Ponto de fragmentação atual:

- a listagem e o card ainda nascem em `OpportunityUiShape`;
- o Workspace nasce em `OpportunityWorkspaceViewModel`;
- o formulário de edição nasce em `formData`, montado a partir de outro objeto intermediário;
- a store expõe `OportunidadeKanban`, ainda em shape legada.

## 4. Inventário dos mappers

| ID | Mapper/transformação | Arquivo | Função/linha | Entrada | Saída | Consumidores | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M1 | Mapper da listagem oficial | `src/pages/Oportunidades.tsx` | `mapApiOpportunityToKanbanShape` | `Opportunity` da API | `OpportunityUiShape` | listagem inicial, card, agrupamento, drag-and-drop, abertura do lead | `INTERMEDIÁRIO` |
| M2 | Normalizador oficial | `src/components/pipeline/workspaceOpportunity.ts` | `normalizeOpportunityWorkspace` | `OpportunityWorkspaceInput` tolerante a canônico + aliases | `OpportunityWorkspaceViewModel` | Workspace fullscreen, builders de payload, merge, mutation id | `OFICIAL` |
| M3 | Normalização visual de etapa | `src/pages/Oportunidades.tsx` | `normalizeOpportunityForKanbanStage` | `OpportunityUiShape` parcial | `OpportunityUiShape` corrigido para coluna | agrupamento Kanban pós-refresh | `COMPATIBILIDADE` |
| M4 | Agrupamento por etapa | `src/pages/Oportunidades.tsx` e `src/components/pipeline/pipelineUtils.ts` | `buildOpportunitiesByStage` / `groupOportunitiesByStage` | array de cards | cards agrupados por coluna | Kanban | `DERIVADO` |
| M5 | Hidratação do card | `src/pages/Oportunidades.tsx` | `cardData` inline no render | `OpportunityUiShape` | objeto de render do card | card, ações rápidas, open lead | `DUPLICADO` |
| M6 | Hidratação do formulário de edição | `src/pages/Oportunidades.tsx` | `openEditOpportunity` | `OpportunityUiShape` ou `selectedLead` | `formData` | modal de edição | `DUPLICADO` |
| M7 | Hidratação do create local | `src/pages/Oportunidades.tsx` | montagem de `newOportunidade` / `createWorkspaceOpportunity` | `formData` | `OpportunityWorkspaceInput` intermediário | createIntake | `COMPATIBILIDADE` |
| M8 | Hidratação do update local | `src/pages/Oportunidades.tsx` | montagem de `editedWorkspaceOpportunity` | `formData` + `lead` | `OpportunityWorkspaceInput` intermediário | update | `COMPATIBILIDADE` |
| M9 | Compat client legado | `src/api/client.ts` | `getOportunidades/getOportunidade/updateOportunidade` | nomes PT-BR e wrappers | chamadas ao módulo oficial | callers legados fora do módulo | `LEGADO` |
| M10 | Store shape legado | `src/types/index.ts` e `src/store/index.ts` | `OportunidadeKanban` | estado local | shape legada de Kanban | store, dashboard, helpers legados | `LEGADO` |

## 5. Fluxos ponta a ponta

| Fluxo | Mapper | Normalizador | Resultado | Gap |
| --- | --- | --- | --- | --- |
| Listagem inicial | `mapApiOpportunityToKanbanShape` em `rawData.map(...)` | não na listagem base | `OpportunityUiShape[]` | card e filtros não usam `OpportunityWorkspaceViewModel` |
| Abertura por card | `cardData` inline | `normalizeOpportunityWorkspace` em `handleOpenLead` | `selectedLead` canônico | o card ainda nasce de shape intermediária |
| Retorno após createIntake | `createIntake` seguido de `setApiReadReloadKey` e refetch | indireto no re-open | volta para `OpportunityUiShape` após refetch | não há caminho único de pós-mutation para VM |
| Retorno após update | refetch da API | indireto quando reabre | volta para `OpportunityUiShape` | seleção local pode conviver com shape pré-refetch |
| Retorno após moveStage | refetch e rebuild do Kanban | indireto quando reabre | coluna usa `OpportunityUiShape` normalizado para stage visual | mapping ainda duplicado entre refresh e open lead |
| Refresh | `mapApiOpportunityToKanbanShape` | só quando usuário abre lead | card continua em shape intermediária | Pipeline e Workspace não partem da mesma shape |
| Hidratação de seleção | `cardData` ou `lead` | `normalizeOpportunityWorkspace` | `selectedLead` | caminho separado do restante da leitura |
| Reabertura do modal | `selectedLead` reaproveitado ou `openEditOpportunity` | parcial | forma local ou VM existente | shape pode mudar conforme origem do clique |

## 6. Contrato oficial de entrada da leitura

Tipo auditado: `Opportunity` em `src/api/modules/opportunities.api.ts`

| Campo API | Tipo | Obrigatório | Relação | Usado pelo mapper | Usado pelo normalizador | Descartado |
| --- | --- | --- | --- | --- | --- | --- |
| `id` | `string` | sim | não | sim | sim | não |
| `title` | `string` | sim | não | sim | sim, quando convertido | não |
| `description` | `string \| null` | não | não | sim | sim, via alias `observacoes` ou canônico | não |
| `amount` | `number` | sim | não | sim | sim, mas só após entrar como `amount` ou já duplicado em `valor` | parcialmente |
| `currency` | `string` | sim | não | não | não | sim |
| `probability` | `number` | sim | não | não | não | sim |
| `status` | `string` | sim | não | sim | sim | não |
| `expectedCloseDate` | `string \| null` | não | não | não | não | sim |
| `actualCloseDate` | `string \| null` | não | não | não | não | sim |
| `tenantId` | `string` | sim | tenant | não | não | sim |
| `partnerId` | `string \| null` | não | partner | não | não | sim |
| `leadId` | `string \| null` | não | lead | não diretamente | sim | não |
| `customerId` | `string \| null` | não | customer | sim | sim | não |
| `productId` | `string \| null` | não | product | sim | sim | não |
| `subproductId` | `string \| null` | não | subproduct | sim | não no canônico final, só por compat se injetado | parcialmente |
| `modalityId` | `string \| null` | não | modality | sim | não no canônico final, só por compat se injetado | parcialmente |
| `pipelineId` | `string` | sim | pipeline | sim | sim | não |
| `stageId` | `string` | sim | stage | sim | sim | não |
| `ownerId` | `string \| null` | não | owner | sim | sim | não |
| `createdAt` | `string` | sim | não | sim | sim | não |
| `updatedAt` | `string` | sim | não | sim | sim | não |
| `customer` | objeto opcional | não | incorporada | sim | não diretamente; vira snapshot | parcialmente |
| `product` | objeto opcional | não | incorporada | sim | não diretamente; vira texto/ids | parcialmente |
| `subproduct` | objeto opcional | não | incorporada | sim | não diretamente | parcialmente |
| `modality` | objeto opcional | não | incorporada | sim | não diretamente | parcialmente |

Campos confirmadamente ausentes do contrato oficial:

- `tags`
- `origem`
- `cliente_nome`
- `responsavel_nome`
- `valor`
- `etapa_id`
- `pipeline_id`

## 7. Auditoria do `mapApiOpportunityToKanbanShape`

Tipo de entrada:

- `Opportunity` oficial com relações opcionais `pipeline`, `stage`, `customer`, `product`, `subproduct`, `modality`

Tipo de saída:

- `OpportunityUiShape`

Aliases criados:

- `nome`
- `valor`
- `cliente_id`
- `cliente_nome`
- `responsavel_id`
- `responsavel_nome`
- `pipeline_id`
- `etapa_id`
- `etapa`
- `observacoes`
- `produto_id`
- `produto`
- `subproduto_id`

Campos derivados:

- `displayId`
- `backendPipelineName`
- `backendStageName`
- `backendStageOrder`
- `backendStageIsWon`
- `backendStageIsLost`

Defaults e fallbacks confirmados:

- `status` defaulta para `"ativo"` na saída do mapper
- `amount` e `valor` defaultam para `0`
- `etapa_id` usa `stageId` oficial quando presente; sem ele, cai para slug semântico de `stage.name`
- `pipeline_id` usa `pipelineId` oficial quando presente; sem ele, cai para semântico derivado de `pipeline.name`
- `cliente_nome` depende de `customer.name`, `customer.fullName` ou `customerName`
- `responsavel_nome` depende de `owner.name` ou `ownerName`

Dependências externas:

- nome do pipeline para `mapBackendPipelineNameToSemanticId`
- `normalizeKey`
- shape das relações retornadas pela API

Mutação:

- não muta a entrada

Tabela de campo:

| Campo API | Campo produzido | Regra | Duplicado no normalizador | Risco |
| --- | --- | --- | --- | --- |
| `title` | `title`, `nome` | duplica texto | sim | `P1` |
| `amount` | `amount`, `valor` | duplica valor | sim | `P1` |
| `pipelineId` | `pipelineId`, `pipeline_id`, `backendPipelineId` | mistura canônico + alias + backend marker | sim | `P1` |
| `stageId` | `stageId`, `etapa_id`, `backendStageId` | mistura canônico + alias + backend marker | sim | `P1` |
| `stage.name` | `backendStageName`, `etapa` semântica fallback | cria label/slugs | sim | `P1` |
| `customerId` | `customerId`, `cliente_id` | duplica ID | sim | `P1` |
| `customer.*` | `cliente_nome`, `email`, `telefone` | cria snapshot local | parcial | `P2` |
| `ownerId` | `ownerId`, `responsavel_id` | duplica ID | sim | `P2` |
| `productId` | `productId`, `product_id`, `produto_id` | triplica ID | parcial | `P2` |
| `description` | `description`, `observacoes` | duplica texto | sim | `P2` |

Respostas objetivas:

- esse mapper ainda é necessário: `SIM`, porque a listagem, o card, os filtros e o agrupamento ainda dependem de `OpportunityUiShape`
- ele produz informação que o normalizador não produz sozinho: `SIM`, principalmente snapshots da listagem e aliases usados pelo card
- ele cria aliases apenas para consumidores antigos: `SIM`, majoritariamente
- ele deve ser absorvido pelo normalizador: `PARCIALMENTE CONFIRMADO`; o mais seguro é reduzir seu papel para compatibilidade temporária
- ele deve permanecer apenas como compatibilidade temporária: `RECOMENDADO`
- ele altera semântica de nome, valor ou cliente: `SIM`; `nome` e `cliente_nome` continuam ambíguos

## 8. Auditoria do normalizador oficial

Função auditada: `normalizeOpportunityWorkspace`

Resumo:

- aceita entrada frouxa `OpportunityWorkspaceInput`
- resolve precedência canônica para `pipelineId`, `stageId`, `amount`, `customerId`, `ownerId`, `description`
- devolve `OpportunityWorkspaceViewModel`
- expõe canônico, derivados e aliases no mesmo objeto

Comparação com o mapper da página:

| Conceito | Mapper da página | Normalizador | Divergência | Fonte correta |
| --- | --- | --- | --- | --- |
| ID | usa `id` direto | resolve `id > opportunityId > leadId > customerId` | normalizador ainda carrega fallback histórico | API/DTO |
| Pipeline | cria `pipelineId` e `pipeline_id` | prioriza `pipelineId > pipeline_id > produto` | fallback por `produto` só existe no normalizador | API/DTO |
| Etapa | cria `stageId`, `etapa_id`, `etapa` | prioriza `stageId > stage_id > etapa_id > etapa` | normalizador é mais explícito | API/DTO |
| Título | `title` e `nome = title` | `title` separado, mas `nome = cliente_nome` na saída final | semântica conflita | API/DTO |
| Cliente | cria `customerId`, `cliente_id`, `cliente_nome` | mantém `customerId`, `cliente_id`, `cliente_nome` | semântica visual ainda duplicada | API/DTO + snapshot |
| Produto | cria ids e texto | mantém `productId/produto_id/produto` | duplicidade permanece | API/DTO + relation |
| Responsável | cria ids e nome | mantém ids e nome | duplicidade permanece | API/DTO + projection |
| Valor | `amount` e `valor` | `amount` e `valor` | convergente após C1.1, mas card ainda lê `valor` | API/DTO |
| Descrição | `description` e `observacoes` | `description` e `observacoes` | convergente | API/DTO |
| Status | default `"ativo"` | default `"ativo"` | alinhado | API/DTO |
| Labels | cria backend name fields | cria `stageLabel` e `pipelineLabel` | normalizador é melhor camada para label | normalizador |
| Datas | mantém `createdAt/updatedAt` | mantém `createdAt/updatedAt` | alinhado | API/DTO |
| Origem | não vem da API | aceita `origem` se existir | não confirmada | não confirmado |
| Tags | não vem da API | aceita `tags` se existir | não confirmada | não confirmado |

Transformações duplicadas confirmadas:

- `title -> nome`
- `amount -> valor`
- `customerId -> cliente_id`
- `ownerId -> responsavel_id`
- `description -> observacoes`
- `stageId/pipelineId` com aliases visuais

Transformações conflitantes confirmadas:

- `nome` no mapper representa título; no normalizador final representa `cliente_nome`
- `etapa` no mapper tende a carregar semântico/slug; no normalizador representa label derivado

## 9. Objetos intermediários

| Objeto | Criado em | Origem | Campos próprios | Campos duplicados | Consumidores | Pode ser eliminado |
| --- | --- | --- | --- | --- | --- | --- |
| `OpportunityUiShape` | `Oportunidades.tsx` | `mapApiOpportunityToKanbanShape` | backend flags, aliases visuais | canônicos + aliases | Kanban, filtros, card, drag-and-drop | `PARCIALMENTE`, após migração dos consumidores |
| `cardData` | render do card em `Oportunidades.tsx` | `OpportunityUiShape` | render-only snapshots | quase todos | card e quick actions | `SIM`, no futuro |
| `selectedLead` | `handleOpenLead` | `normalizeOpportunityWorkspace` | VM consolidado | mantém aliases por compat | Workspace fullscreen, simulação, edição | `NÃO`, é o alvo oficial atual |
| `lead` | `openEditOpportunity` | `opportunity` ou `selectedLead` | ajustes para edição | muitos | modal de edição | `SIM`, se a entrada do form passar a vir de mapper único |
| `formData` | estado local | `lead` + hidratação | campos de formulário, bancos, PIX, compliance | muitos | create/edit modal | `NÃO`, mas pode ser melhor alimentado |
| `createWorkspaceOpportunity` | `handleSubmit` | `normalizeOpportunityWorkspace` | shape intermediária de create | poucos | builders de payload | `SIM`, se houver função oficial API DTO -> VM e form -> VM |
| `editedWorkspaceOpportunity` | `handleSubmitEdit` | `normalizeOpportunityWorkspace` | shape intermediária de update | poucos | builders de payload | `SIM` |
| `normalizedLead` | implícito em chamadas ao normalizador | card/lead | VM | canônico + aliases | selected state | absorvido no próprio normalizador |
| `workspaceOpportunity` | conceitual nas builders | VM | canônico | compat | payload builders | `NÃO` |

## 10. Consumidores da shape intermediária

| Consumidor | Arquivo | Tipo esperado | Campos usados | Dependência de alias | Risco |
| --- | --- | --- | --- | --- | --- |
| Agrupamento Kanban | `src/pages/Oportunidades.tsx` / `pipelineUtils.ts` | `OpportunityUiShape` | `etapa_id`, `etapa`, `valor` | alta | `P1` |
| Card | `src/pages/Oportunidades.tsx` | `cardData` | `nome`, `produto`, `valor`, `responsavel_nome`, `tags` | alta | `P1` |
| Filtros | `src/pages/Oportunidades.tsx` | `OpportunityUiShape` | `etapa_id`, `responsavel_id`, `nome`, `produto` | alta | `P2` |
| Busca | `src/pages/Oportunidades.tsx` | `OpportunityUiShape` | `nome`, `cliente_nome`, `telefone`, `cpf_cnpj` | alta | `P2` |
| Drag-and-drop | `src/pages/Oportunidades.tsx` | `OpportunityUiShape` | `stageId`, `etapa_id`, `pipelineId`, `pipeline_id` | alta | `P1` |
| Criação | `src/pages/Oportunidades.tsx` | `formData` | `nome`, `valor`, `etapa_id`, `cliente_id`, `responsavel_id` | alta | `P1` |
| Edição | `src/pages/Oportunidades.tsx` | `formData` | `nome`, `valor`, `etapa_id`, `cliente_id`, `responsavel_id`, `observacoes` | alta | `P1` |
| Workspace header | `src/pages/Oportunidades.tsx` | `OpportunityWorkspaceViewModel` | `cliente_nome`, `produto`, `stageLabel`, `responsavel_nome`, `valor` | média | `P2` |
| Simulador | `src/pages/Oportunidades.tsx` | `selectedLead` | `valor`, `stageLabel`, `pipeline_id` | média | `P2` |
| Dashboard | `src/pages/Dashboard.tsx` | `OportunidadeKanban` | shape legada | alta | `P2` |

## 11. Duplicidade de transformação

| Conceito | Transformação 1 | Transformação 2 | Transformação 3 | Divergência | Prioridade |
| --- | --- | --- | --- | --- | --- |
| `amount -> valor` | `mapApiOpportunityToKanbanShape` | `normalizeOpportunityWorkspace` | `cardData` inline | duplicada, mas coerente | `P1` |
| `title -> nome` | `mapApiOpportunityToKanbanShape` | `openEditOpportunity` | `cardData` inline | semântica muda entre título e cliente | `P1` |
| `stageId -> etapa_id` | `mapApiOpportunityToKanbanShape` | `normalizeOpportunityWorkspace` | `normalizeOpportunityForKanbanStage` | duplicada e com fallback diferente | `P1` |
| `pipelineId -> pipeline_id` | `mapApiOpportunityToKanbanShape` | `normalizeOpportunityWorkspace` | `openEditOpportunity` | duplicada | `P2` |
| `customerId -> cliente_id` | `mapApiOpportunityToKanbanShape` | `normalizeOpportunityWorkspace` | `cardData` inline | duplicada | `P2` |
| `ownerId -> responsavel_id` | `mapApiOpportunityToKanbanShape` | `normalizeOpportunityWorkspace` | `cardData` inline | duplicada | `P2` |
| `description -> observacoes` | `mapApiOpportunityToKanbanShape` | `normalizeOpportunityWorkspace` | `openEditOpportunity` | duplicada | `P2` |

## 12. Campos descartados

Somente os confirmados:

- `currency`
- `probability`
- `expectedCloseDate`
- `actualCloseDate`
- `tenantId`
- `partnerId`
- `deletedAt`
- `customer.firstName`
- `customer.lastName`
- `product.code`
- `subproduct.code`
- `modality.code`

Tabela:

| Campo | Retornado pela API | Última camada onde existe | Motivo aparente | Impacto | Deve preservar |
| --- | --- | --- | --- | --- | --- |
| `currency` | sim | DTO da API | não usado pela UI | baixo | `NÃO NECESSÁRIO` |
| `probability` | sim | DTO da API | não consumido | baixo | `NÃO NECESSÁRIO` |
| `expectedCloseDate` | sim | DTO da API | não consumido no workspace | baixo | `NÃO NECESSÁRIO` |
| `actualCloseDate` | sim | DTO da API | não consumido | baixo | `NÃO NECESSÁRIO` |
| `tenantId` | sim | DTO da API | backend/internal | baixo | `NÃO NECESSÁRIO` |
| `partnerId` | sim | DTO da API | não consumido na tela | baixo | `NÃO CONFIRMADO` |
| `customer.firstName/lastName` | sim | mapper da página | colapsado em `cliente_nome` | médio | `DERIVADO` |
| `product.code/subproduct.code/modality.code` | sim ou parcial | mapper da página | pouco usado no workspace | baixo | `NÃO CONFIRMADO` |

## 13. Campos criados localmente

| Campo local | Criado em | Fonte | Consumidores | Deve permanecer | Classificação |
| --- | --- | --- | --- | --- | --- |
| `valor` | mapper e normalizador | `amount` | card, workspace, filtros | temporariamente | `COMPATIBILIDADE` |
| `nome` | mapper, card, forms | `title` ou `cliente_nome` | card, edit, busca | temporariamente | `LEGADO` |
| `cliente_nome` | mapper/normalizador | `customer` relation snapshot | card, workspace | sim, como snapshot | `DERIVADO` |
| `responsavel_nome` | mapper/normalizador | owner projection | card, workspace | sim, como projection | `DERIVADO` |
| `pipeline_id` | mapper/normalizador | `pipelineId` | grouping, forms | temporariamente | `COMPATIBILIDADE` |
| `etapa_id` | mapper/normalizador | `stageId` | grouping, filters, forms | temporariamente | `COMPATIBILIDADE` |
| `etapa` | mapper/normalizador | stage slug/label | UI visual | temporariamente | `DERIVADO` |
| `displayId` | mapper/normalizador | `id` curto ou explicit display | card/header | sim | `DERIVADO` |
| `stageLabel` | normalizador | catálogo/relations | workspace | sim | `DERIVADO` |
| `pipelineLabel` | normalizador | contexto/relations | workspace | sim | `DERIVADO` |
| `formattedValue` | normalizador | `amount` | workspace | sim | `DERIVADO` |
| `displayName` | normalizador | cliente/produto/displayId | avatar/header | sim | `DERIVADO` |
| `initials` | normalizador | `displayName` | avatar | sim | `DERIVADO` |

## 14. Refresh e reconciliação

| Fluxo | Mapper aplicado | Normalizador aplicado | Estado final | Risco de shape parcial |
| --- | --- | --- | --- | --- |
| listagem inicial | `mapApiOpportunityToKanbanShape` | não | `OpportunityUiShape[]` | médio |
| refresh manual | `mapApiOpportunityToKanbanShape` | não | `OpportunityUiShape[]` | médio |
| abertura do lead | já mapeado antes | `normalizeOpportunityWorkspace` | `selectedLead` | baixo |
| update | refetch depois do sucesso | só quando reabre lead | listagem volta em `OpportunityUiShape` | médio |
| moveStage | refetch + rebuild | só quando reabre lead | Kanban continua em shape intermediária | médio |
| createIntake | refetch | só quando usuário abre | listagem em shape intermediária | médio |
| seleção mantida localmente | nenhuma nova | `selectedLead` existente | VM anterior convive com lista nova | médio |

Respostas objetivas:

- após refresh, o mesmo mapper é usado: `SIM`
- após update, o retorno passa pelo mesmo mapper: `SIM`, via refetch
- após moveStage, o retorno passa pelo mesmo mapper: `SIM`, via refetch
- após createIntake, a oportunidade passa pelo mesmo mapper: `SIM`, via refetch
- existem caminhos que atualizam o estado local sem remapear: `SIM`, especialmente `selectedLead` e hidratações de formulário
- existe risco de shape parcial após mutation: `SIM`, `P1`

## 15. Testes existentes

| Cenário | Coberto | Arquivo | Tipo | Gap |
| --- | --- | --- | --- | --- |
| API -> shape do mapper da página | sim | `src/test/oportunidades-kanban-hardening.test.ts` | unitário/estrutural | não cobre campos descartados |
| precedência de `stageId` | sim | `src/test/oportunidades-kanban-hardening.test.ts` e `src/test/workspaceOpportunity.test.ts` | unitário | bom |
| normalizador canônico | sim | `src/test/workspaceOpportunity.test.ts` | unitário | não cobre mapeamento direto do DTO oficial completo |
| aliases ignorados na escrita | sim | `src/test/workspaceOpportunity.test.ts` | unitário | cobre payload, não leitura |
| card e abertura do workspace | sim | `src/test/oportunidades-card-interaction.test.tsx` | interação | não cobre edit hydration |
| rebuild após drag-and-drop | sim | `src/test/oportunidades-kanban-hardening.test.ts` | unitário | não cobre seleção residual |
| wiring `handleOpenLead -> normalizeOpportunityWorkspace` | sim | `src/test/oportunidades-kanban-hardening.test.ts` | hardening | bom |
| backend service/tenant/relações | sim | `backend/src/tests/unit/opportunities.service.test.ts` | unitário | foco em contrato backend |
| retorno após mutation com mesma mapping layer | não | n/a | n/a | falta |
| conflito entre mapper e normalizador | parcialmente | `workspaceOpportunity.test.ts` | unitário | falta cruzar DTO -> mapper -> normalizador |
| campos desconhecidos | não confirmado | n/a | n/a | falta |
| não mutação do mapper da página | parcialmente | hardening do mapper | unitário | falta explicitar |

## 16. Gaps priorizados

| ID | Gap | Evidência | Prioridade | Risco |
| --- | --- | --- | --- | --- |
| G1 | Existem dois mappers ativos sem entrada única de leitura | `mapApiOpportunityToKanbanShape` + `normalizeOpportunityWorkspace` | `P1` | `CONFIRMADO` |
| G2 | `OpportunityUiShape` e `OpportunityWorkspaceViewModel` coexistem como contratos de UI | `Oportunidades.tsx` e `workspaceOpportunity.ts` | `P1` | `CONFIRMADO` |
| G3 | `cardData` replica transformação já feita no mapper e no normalizador | render do card em `Oportunidades.tsx` | `P2` | `CONFIRMADO` |
| G4 | `nome` continua semanticamente ambíguo entre título da oportunidade e nome do cliente | mapper da página, normalizador e forms | `P1` | `CONFIRMADO` |
| G5 | Kanban grouping ainda depende de `etapa_id` e `valor` | `pipelineUtils.ts` | `P1` | `CONFIRMADO` |
| G6 | A store e `OportunidadeKanban` continuam em shape legada paralela | `src/types/index.ts` e `src/store/index.ts` | `P2` | `CONFIRMADO` |
| G7 | O normalizador aceita DTO oficial, mas a listagem ainda o precede com mapper manual | `handleOpenLead` só normaliza na abertura | `P1` | `CONFIRMADO` |
| G8 | Não há teste ponta a ponta `Opportunity DTO -> mapping layer única -> Workspace VM` | ausência de teste dedicado | `P2` | `CONFIRMADO` |

## 17. Arquitetura proposta

Camada oficial sugerida:

`Opportunity API DTO`
-> `mapOpportunityApiToWorkspaceInput()`
-> `normalizeOpportunityWorkspace()`
-> `OpportunityWorkspaceViewModel`

Decisão baseada em evidência:

- o mapper dedicado ainda é necessário: `SIM`, mas apenas como ponte explícita e mínima entre o DTO oficial e o input do normalizador
- o normalizador deve aceitar diretamente o DTO oficial: `PARCIALMENTE CONFIRMADO`; tecnicamente já consegue aceitar vários campos oficiais, mas ainda não conhece relações como `customer.firstName/lastName`, `stage.name` e `pipeline.name` na forma mais explícita da API
- o mapper deve apenas resolver projeções: `SIM`
- função de entrada única sugerida: `mapOpportunityApiToWorkspaceInput(opportunity: Opportunity): OpportunityWorkspaceInput`
- tipo de saída final: `OpportunityWorkspaceViewModel`
- onde o mapper deverá morar: `src/components/pipeline/workspaceOpportunity.ts`
- imports sugeridos futuros: consumers passam a importar `mapOpportunityApiToWorkspaceInput` e `normalizeOpportunityWorkspace` do mesmo módulo

Resposta objetiva:

- `mapApiOpportunityToKanbanShape` não deve continuar como mapper oficial definitivo
- o normalizador deve permanecer como saída única
- `mapApiOpportunityToKanbanShape` pode virar compatibilidade temporária da listagem, enquanto os consumidores migram para VM única

## 18. Implementação mínima recomendada

| Arquivo | Alteração futura | Necessário | Risco |
| --- | --- | --- | --- |
| `src/components/pipeline/workspaceOpportunity.ts` | criar `mapOpportunityApiToWorkspaceInput()` e consolidar a entrada única oficial de leitura | sim | médio |
| `src/pages/Oportunidades.tsx` | substituir `mapApiOpportunityToKanbanShape` e `cardData` por consumo da nova camada oficial, sem mudar UX | sim | alto |
| `src/api/modules/opportunities.api.ts` | manter o tipo `Opportunity` como fonte oficial; só ajustar se faltarem relações tipadas usadas no mapper | parcialmente | baixo |
| `src/test/workspaceOpportunity.test.ts` | adicionar testes `DTO oficial -> input -> VM`, perdas de campo, não mutação e conflitos | sim | baixo |
| `src/test/oportunidades-card-interaction.test.tsx` | garantir que card e workspace continuam iguais após migração da leitura | sim | médio |
| `src/test/oportunidades-kanban-hardening.test.ts` | endurecer a nova entrada única e o agrupamento | sim | baixo |
| `src/types/index.ts` | só tocar se a migração exigir compat controlada com `OportunidadeKanban` | não necessariamente | médio |
| `src/store/index.ts` | não alterar estruturalmente no C1.4 | não | alto |

Fora do escopo da futura implementação:

- backend
- Prisma
- migrations
- endpoints
- builders de payload do C1.3
- remoção imediata de aliases
- sincronização de etapa, valor ou cliente
- alteração estrutural de Zustand
- UX
- simulador
- tarefas, tags, anexos e histórico

## 19. Critérios de aceite futuros

- existir uma única entrada de leitura da API
- a saída final ser `OpportunityWorkspaceViewModel`
- `mapApiOpportunityToKanbanShape` ser eliminado ou reduzido a compatibilidade explícita
- o normalizador receber campos oficiais de forma previsível
- nenhum campo crítico ser descartado
- nenhum alias vencer o canônico
- todos os fluxos de leitura usarem a mesma camada
- retornos de `create/update/moveStage` seguirem o mesmo mapeamento
- Pipeline e Workspace receberem a mesma shape
- nenhuma alteração visual
- nenhum payload alterado
- nenhum backend ou Prisma alterado
- testes direcionados aprovados
- `npm run arch:check` aprovado

## 20. Riscos

### P0

Nenhum risco P0 identificado.

### Riscos remanescentes confirmados

- aliases ainda existem na entrada e no ViewModel
- a camada de leitura ainda depende de mapeamentos locais
- `nome` continua ambíguo
- o fallback de identidade por `customerId` permanece
- o C1.4 ainda precisará consolidar a mapping layer sem quebrar consumidores legados

## 21. Recomendação final

A evidência atual mostra que o problema do C1.4 não está no backend nem no contrato oficial da API, mas na coexistência de uma shape intermediária da página com o view model canônico da Workspace.

A recomendação mais segura é:

1. formalizar uma única entrada oficial de leitura baseada no DTO `Opportunity`
2. manter `normalizeOpportunityWorkspace` como única saída final
3. reduzir `mapApiOpportunityToKanbanShape` a ponte temporária e explícita
4. migrar primeiro os consumers de card, grouping e open/edit hydration
5. só depois avaliar a redução dos aliases

Parecer técnico:

`AUDITORIA DO BLOCO C1.4 CONCLUÍDA — MAPPING LAYER PRONTO PARA REVISÃO E AUTORIZAÇÃO`
