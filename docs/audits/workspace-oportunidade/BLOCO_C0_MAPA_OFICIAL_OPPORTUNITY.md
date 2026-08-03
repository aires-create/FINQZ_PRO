# BLOCO C0 — MAPA OFICIAL DA OPPORTUNITY

Data: 2026-08-03
Modo: leitura, rastreamento, inventário, comparação, classificação e consolidação SSOT
Escopo: documental, sem alteração funcional

## 1. Resumo executivo

O domínio Opportunity já possui contrato oficial no backend (`/api/v1/opportunities`), modelo persistido em Prisma (`Opportunity`) e camada frontend oficial (`src/api/modules/opportunities.api.ts`). O principal ponto de atrito não está no backend moderno, e sim na coexistência entre:

- contrato oficial UUID-based;
- view model do workspace;
- aliases legados da UI (`etapa_id`, `valor`, `cliente_nome`, `responsavel_nome`);
- store persistido do Zustand;
- estados locais e seções ainda não conectadas a persistência oficial.

Conclusão da auditoria C0:

- o campo persistido e canônico de etapa é `stageId`;
- o campo persistido e canônico de pipeline é `pipelineId`;
- o campo persistido e canônico de valor é `amount`;
- o campo persistido e canônico de cliente é `customerId`;
- o campo persistido e canônico de responsável é `ownerId`;
- o campo persistido e canônico de título é `title`;
- `stageLabel`, `pipelineLabel`, `formattedValue`, `displayId`, `cliente_nome`, `responsavel_nome` e parte do card são projeções/aliases/derivações de frontend;
- tags e observações possuem evidência parcial de persistência;
- tarefas, anexos e histórico do modal continuam híbridos ou não comprovados ponta a ponta na runtime da tela.

O primeiro subbloco recomendado permanece:

`BLOCO C1 — CONTRATO CANÔNICO E NORMALIZAÇÃO`

## 2. Documentos consultados

| Documento | Papel | Conformidade |
| --------- | ----- | ------------ |
| `docs/00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md` | macroarquitetura e precedência SSOT | conforme |
| `docs/audits/workspace-oportunidade/MATRIZ_EXECUTIVA_ACOES_PRIORITARIAS.md` | priorização executiva | conforme, mas já reconhece estado híbrido |
| `docs/audits/workspace-oportunidade/BLOCO_C_PLANO_EXECUCAO.md` | plano de execução do bloco C | conforme como plano, não como evidência de runtime |
| `docs/audits/workspace-oportunidade/BLOCO_C_AUDITORIA_TECNICA.md` | auditoria C e C6 | conforme, com ênfase em RBAC/tenant |
| `docs/audits/workspace-oportunidade/contracts-source-of-truth/MATRIZ_FONTE_VERDADE_WORKSPACE.md` | matriz SSOT anterior | parcialmente divergente do código atual |
| `docs/audits/workspace-oportunidade/phase-a/CONTRATO_CANONICO_WORKSPACE.md` | contrato do workspace | parcialmente alinhado; simplifica demais campos reais |
| `docs/audits/workspace-oportunidade/contracts-source-of-truth/RASTREAMENTO_PONTA_A_PONTA_WORKSPACE.md` | rastreamento histórico | parcialmente alinhado; descreve agregado híbrido corretamente |
| `docs/audits/workspace-oportunidade/BLOCO_B_REGRESSAO_FUNCIONAL_CARD.md` | regressão do card | conforme |

## 3. Arquitetura observada

Fluxo dominante confirmado:

1. Backend oficial expõe `Opportunity` via `/api/v1/opportunities`.
2. Frontend consome esse contrato em `src/api/modules/opportunities.api.ts`.
3. `src/pages/Oportunidades.tsx` adapta a resposta oficial para `OpportunityUiShape`.
4. `normalizeOpportunityWorkspace` consolida aliases e derivações para abrir o workspace fullscreen.
5. O modal usa `selectedLead` como agregado normalizado.
6. Escritas oficiais passam por `opportunitiesApi.create`, `update`, `moveStage` e `delete`.
7. `useAppStore` mantém `oportunidadesKanban`, mas sem persistência da lista no `partialize`; portanto o store global atual não é SSOT persistida de oportunidade.

## 4. Metodologia

- Leitura integral dos documentos obrigatórios disponíveis nos caminhos informados.
- Validação do worktree, branch e commit de origem.
- Varredura com `rg` dos campos e aliases exigidos.
- Leitura dos contratos centrais:
  - `src/api/modules/opportunities.api.ts`
  - `src/components/pipeline/workspaceOpportunity.ts`
  - `src/pages/Oportunidades.tsx`
  - `src/store/index.ts`
  - `backend/src/modules/opportunities/{routes,services,repositories}`
  - `backend/src/modules/opportunities/{dto,validators}`
  - `backend/prisma/schema.prisma`
- Leitura de testes relacionados ao normalizador e à interação do card.
- Classificação de cada campo em:
  - origem primária;
  - papel funcional;
  - persistência;
  - comportamento pós-refresh;
  - risco;
  - decisão futura.

## 5. Inventário completo

### 5.1 Quantidade de campos mapeados

- Total de campos/conceitos mapeados: 42
- Campos canônicos: 14
- Aliases de compatibilidade: 16
- Campos derivados: 7
- Campos legados: 3
- Campos não confirmados: 2

Observação de governança: Os 42 itens representam os campos e aliases efetivamente comprovados nas camadas auditadas. Novos campos deverão ser incorporados ao mapa somente quando confirmados por evidência em código, API, backend, Prisma ou documentação canônica.

### 5.2 Matriz principal

| ID | Domínio | Nome de negócio | UI | TypeScript | Normalizador | Zustand/estado | API | DTO/schema | Backend | Prisma | Tipo | Obrigatório | Fonte canônica | Alias | Derivado | Persistido | Refresh | Atualizado por | Consumido por | Compatibilidade | Risco | Decisão proposta |
| -- | ------- | --------------- | -- | ---------- | ------------ | -------------- | --- | ---------- | ------- | ------ | ---- | ----------: | -------------- | ----- | -------: | ---------: | ------- | -------------- | ------------- | --------------- | ----- | ---------------- |
| 1 | Identidade | ID da oportunidade | `id` | `Opportunity.id`, `OpportunityUiShape.id` | `id` | `oportunidadesKanban[].id` | `id` | `id` | `findById/update` | `Opportunity.id` | UUID string | sim | PRISMA/BANCO | `opportunityId` | não | sim | confirmado | backend | card, modal, update, move, delete | `displayId` não substitui `id` | P1 | manter `id` como identidade canônica |
| 2 | Identidade | ID visual | `displayId`, `#123` | `displayId` | `displayId` | local | não existe | não existe | não existe | não existe | string | não | DERIVADO | `id` não UUID, `displayId` | sim | não | parcial | frontend | card, header | compat visual | P3 | manter só como exibição |
| 3 | Identidade | ID do lead relacionado | não exibido como principal | `leadId` | `leadId` | pode estar no agregado | `leadId` | `leadId` | create/update | `Opportunity.leadId` | UUID nullable | não | PRISMA/BANCO | nenhum confirmado | não | sim | confirmado | backend | intake, vínculo CRM | aceito no normalizador | P2 | manter como relação opcional |
| 4 | Identidade | ID do cliente relacionado | `cliente_id` indireto | `customerId`, `cliente_id` | `customerId` | pode existir no agregado | `customerId` | `customerId` | create/update | `Opportunity.customerId` | UUID nullable | não | PRISMA/BANCO | `cliente_id` | não | sim | confirmado | backend | card, modal, create/update | alias legado numérico/string | P1 | canônico `customerId`; `cliente_id` temporário |
| 5 | Identidade | Tenant | não exibido | `tenantId` | não projetado | auth context | `tenantId` | implícito no request context | middleware/route | `Opportunity.tenantId` | UUID | sim | PRISMA/BANCO | nenhum | não | sim | confirmado | backend/JWT | todos endpoints | sem alias permitido do cliente | P0 | manter backend-only |
| 6 | Pipeline | Pipeline oficial | `pipelineId` indireto | `pipelineId` | `pipelineId` | `pipeline_id` legado no card | `pipelineId` | `pipelineId` | create/update/move | `Opportunity.pipelineId` | UUID | sim | PRISMA/BANCO | `pipeline_id`, `backendPipelineId` | não | sim | confirmado | backend | filtros, create, move, grouping | UI ainda usa semântico/alias | P1 | canônico `pipelineId` |
| 7 | Pipeline | Label do pipeline | texto do pipeline | `pipelineLabel` | `pipelineLabel` | local | relação `pipeline.name` | não dedicado | include relation | `Pipeline.name` | string | não | DERIVADO | `pipelineNome`, `pipelineName` | sim | não | parcial | normalizador/API include | header, card | label derivado | P3 | derivar sempre da relação oficial |
| 8 | Etapa | Etapa oficial persistida | indireta | `stageId` | `stageId` | `etapa_id` legado | `stageId` | `stageId` | create/move | `Opportunity.stageId` | UUID | sim | PRISMA/BANCO | `backendStageId`, `stage_id`, `etapa_id` | não | sim | confirmado | backend | kanban, move, modal | aliases amplos | P1 | canônico `stageId` |
| 9 | Etapa | Alias legado de etapa | `etapa_id` | `etapa_id` | `etapa_id` | `moveOportunidade({ etapa_id })` | não oficial | não oficial | não oficial | não oficial | string | não | COMPATIBILIDADE | `stageId` | não | não | parcial | frontend | filtros, agrupamento, forms | necessário temporariamente | P1 | manter só como alias temporário |
| 10 | Etapa | Label da etapa | `stageLabel`, `etapa` | `stageLabel` | `stageLabel` | local | via `stage.name` | não dedicado | include relation | `Stage.name` | string | não | DERIVADO | `etapa`, `backendStageName` | sim | não | parcial | normalizador | header, modal | derivado de catálogo/relação | P2 | canônico de exibição = `stageLabel` derivado |
| 11 | Status | Status da oportunidade | `status` | `status` | `status` | `status` | `status` | `status` | create/update | `Opportunity.status` | string | sim com default | BACKEND | nenhum | não | sim | confirmado | backend | filtros, update, card | UI traduz por etapa às vezes | P2 | manter `status` canônico separado de etapa |
| 12 | Dados principais | Título oficial | `nome`, `title` | `title`, `nome` | cai em `nome`/`cliente_nome` | local/edit form | `title` | `title` | create/update | `Opportunity.title` | string | sim | PRISMA/BANCO | `nome` | não | sim | confirmado | backend | create/edit/header | alias forte na UI | P1 | canônico `title`; mapear `nome` |
| 13 | Dados principais | Descrição/observações oficiais | `observacoes`, `description` | ambos | `observacoes` | local textarea | `description` | `description` | create/update | `Opportunity.description` | string nullable | não | PRISMA/BANCO | `observacoes` | não | sim | confirmado | backend | edit, notes base | mistura com anotações UI | P2 | distinguir descrição oficial de notas operacionais |
| 14 | Valores | Valor oficial | `valor`, `amount` | ambos | `valor` | `valor` | `amount` | `amount` | create/update | `Opportunity.amount` | number | sim | PRISMA/BANCO | `valor` | não | sim | confirmado | backend | card, modal, create/update, simulator apply | alias amplo | P1 | canônico `amount`; `valor` compat |
| 15 | Valores | Valor formatado | `R$ ...` | `formattedValue` | `formattedValue` | local | não | não | não | não | string | não | DERIVADO | nenhum | sim | não | parcial | normalizador/UI | card, modal | exibição בלבד | P3 | derivar sempre de `amount/valor` |
| 16 | Valores | Resultado aplicado do simulador | `simulationResult`, `valorLiberado` | local | não canônico | estado local | não dedicado | não dedicado | update só de `amount` | não dedicado | objeto | não | ESTADO LOCAL | nenhum | sim | não | não confirmado | frontend | simulador/modal | não persiste integralmente | P2 | C1/C3 definir contrato separado |
| 17 | Cliente | Nome do cliente exibido | `cliente_nome`, `nome` | ambos | `clienteNome`/`cliente_nome` | local/card | relação `customer` parcial | intake customer names | include relation | `Customer.firstName/lastName` | string | não | API | `customerName`, `nome` | sim | não | parcial | API refetch | card, modal | projeção híbrida | P2 | snapshot de exibição deve vir de customer projection |
| 18 | Cliente | E-mail do cliente | `email` | `email` | `email` | local | `customer.email` ou campo agregado | intake customer.email | createIntake | `Customer.email` | string | intake create sim | API | fallback do card | não | parcial | parcial | backend/UI | ações rápidas, CRM nav | fallback legado | P2 | preferir `customer.email` |
| 19 | Cliente | Telefone do cliente | `telefone` | `telefone`, `phone` | `telefone` | local | `customer.phone` ou agregado | intake customer.phone | createIntake | `Customer.phone` | string nullable | não | API | `celular`, `phone` | não | parcial | parcial | backend/UI | ações rápidas | muitos aliases | P2 | preferir `customer.phone` snapshot |
| 20 | Cliente | CPF/CNPJ | `cpf_cnpj` | `cpf_cnpj`, `cpfCnpj` | não canônico | local | intake customer.cpfCnpj | intake DTO | createIntake only | `Customer.cpf` | string | intake create sim | BACKEND | `document`, `cpf`, `cnpj` conceitualmente | não | parcial | parcial | backend | intake/create cliente | divergência de nome | P2 | separar `customer.cpf` de campo de formulário |
| 21 | Produto | Produto oficial | `produto`, `productId` | ambos | `produto` textual | local | `productId` + relation | `productId` | create/update | `Opportunity.productId` | UUID nullable | não | PRISMA/BANCO | `produto_id`, `product_id` | não | sim | confirmado | backend | card, edit, simulator context | alias amplo | P1 | canônico `productId`, label via relation |
| 22 | Produto | Subproduto oficial | `subproduto`, `subproductId` | ambos | não resolve rótulo extra | local | `subproductId` | `subproductId` | create/update | `Opportunity.subproductId` | UUID nullable | não | PRISMA/BANCO | `subproduto_id` | não | sim | confirmado | backend | forms | compat parcial | P2 | manter relação oficial |
| 23 | Produto | Modalidade oficial | `modality`, `modalityId` | ambos | textual | local | `modalityId` | `modalityId` | create/update | `Opportunity.modalityId` | UUID nullable | não | PRISMA/BANCO | `modality_id` | não | sim | confirmado | backend | forms/simulator | compat parcial | P2 | manter relação oficial |
| 24 | Responsabilidade | Responsável oficial | `ownerId`, `responsavel_id` | ambos | `responsavel_id` | local | `ownerId` | `ownerId` | create/update | `Opportunity.ownerId` | UUID nullable | não | PRISMA/BANCO | `responsavel_id` | não | sim | confirmado | backend | create/edit/filter | alias legado | P1 | canônico `ownerId` |
| 25 | Responsabilidade | Nome do responsável | `responsavel_nome` | `responsavel_nome` | `responsavelNome` | local | relação owner implícita/adapter | não dedicado | projection | `User.firstName/lastName` não exposto diretamente | string | não | API | `owner.name`, `ownerName` | sim | não | parcial | parcial | UI/adapters | card, modal | ainda não uniformizado | P2 | criar projection oficial única |
| 26 | Origem | Origem da oportunidade | `origem` | `origem` | `origem` | local | não presente no contrato oficial atual | não presente | não presente | não presente em `Opportunity` | string | não | NÃO CONFIRMADO | `source`, `origin` conceituais | não | não | não confirmado | não confirmado | UI/documentos | legado/local | P2 | não assumir sem contrato |
| 27 | Datas | Data de criação | `createdAt`, `created_at` | ambos | `createdAt` | local | `createdAt` | implícito | returned entity | `Opportunity.createdAt` | datetime | sim | PRISMA/BANCO | `created_at` | não | sim | confirmado | backend | card, histórico fake, SLA | alias snake_case | P2 | manter `createdAt` canônico |
| 28 | Datas | Data de atualização | `updatedAt`, `updated_at` | ambos | `updatedAt` | local | `updatedAt` | implícito | returned entity | `Opportunity.updatedAt` | datetime | sim | PRISMA/BANCO | `updated_at` | não | sim | confirmado | backend | card, SLA, notes fake | alias snake_case | P2 | manter `updatedAt` canônico |
| 29 | Datas | Data de exclusão lógica | não exibido | `deletedAt` | não usado | não | `deletedAt` | implícito | delete/archive | `Opportunity.deletedAt` | datetime nullable | não | PRISMA/BANCO | nenhum | não | sim | confirmado | backend | repository filters | invisível na UI | P3 | manter backend-only |
| 30 | Datas | Expected close date | não exposto na UI atual do workspace | `expectedCloseDate` | não projetado | não | `expectedCloseDate` | `expectedCloseDate` | create/update | `Opportunity.expectedCloseDate` | datetime nullable | não | PRISMA/BANCO | nenhum | não | sim | confirmado no contrato, não confirmado na UI | backend | API only | campo pouco consumido | P3 | manter, mapear depois |
| 31 | Controle | Probabilidade | não exposta no card/modal principal | `probability` | não projetado | não | `probability` | `probability` | create/update | `Opportunity.probability` | int | sim default | PRISMA/BANCO | nenhum | não | sim | confirmado no contrato, parcial na UI | backend | API only | baixo uso atual | P3 | manter no contrato |
| 32 | Controle | Moeda | não exposta | `currency` | não projetado | não | `currency` | `currency` | create/update | `Opportunity.currency` | string | sim default | PRISMA/BANCO | nenhum | não | sim | confirmado | backend | API only | baixo risco | P3 | manter backend-only |
| 33 | Workspace | Tags | `tags` | `tags` | `tags` | local/card | não no contrato oficial TS atual | não no DTO atual | não mapeado no service/update | `Lead.tags` e não `Opportunity.tags` | string[] | não | COMPATIBILIDADE | nenhum | não | não confirmado para Opportunity | não confirmado | UI | card, modal tags | hoje visual/local | P2 | não promover como persistido de Opportunity sem evidência |
| 34 | Workspace | Anotações operacionais | aba Anotações | `observacoes` textarea | usa `observacoes` | local | update usa `description` | `description` | update/create | `Opportunity.description` | string | não | COMPATIBILIDADE | `notes` conceitual | não | sim parcial | parcial | frontend/backend | modal | sem separação de conceito | P2 | decidir se `description` cobre notas ou se haverá `Activity` |
| 35 | Workspace | Tarefas | aba Tarefas | objetos locais inline | não | estado local | não | não | não | possível via `Activity`, não conectado | coleção | não | ESTADO LOCAL | nenhum | sim | não | não confirmado | frontend | modal | totalmente local/mock | P2 | classificar como temporário |
| 36 | Workspace | Anexos | aba Anexos | `anexos` state | não | estado local | não | não | não | `Activity.attachments` existe, sem ligação confirmada | coleção | não | ESTADO LOCAL | nenhum | sim | não | não confirmado | frontend | modal | local only | P2 | classificar como temporário |
| 37 | Workspace | Histórico | aba Histórico | array inline de eventos | não | local | não | não | não | `Activity` existe, sem consumo confirmado | coleção | não | DERIVADO | nenhum | sim | não | não confirmado | frontend | modal | timeline fake | P2 | substituir por Activity/timeline oficial em C5/C7 |
| 38 | Workspace | Activities | não expostas como entity oficial na tela | `activities` conceitual | não | não | não em `opportunities.api.ts` | não | backend possui modelo separado | `Activity` | relação | não | PRISMA/BANCO | `history`, `tarefas`, `anotacoes`, `attachments` | não | sim | parcial | backend futuro | futuro histórico/tarefas | base para convergência | P2 | usar `Activity` como trilha oficial futura |
| 39 | Controle | Persistência local do Kanban | cards em memória | `oportunidadesKanban` | insumo indireto | Zustand | não | não | não | não | array | não | ESTADO LOCAL | nenhum | não | não persiste no `partialize` atual | parcial | frontend | fallback da tela | não é SSOT | P2 | manter como cache não canônico |
| 40 | Compatibilidade | `client.ts` legado | wrappers `getOportunidade/updateOportunidade` | `updateOportunidade` etc | não | n/a | chama API oficial | n/a | frontend compat | n/a | wrapper | não | COMPATIBILIDADE | nomes PT-BR | não | n/a | confirmado | frontend | legado/compat callers | nomenclatura mista | P3 | manter, mas documentar legado |
| 41 | Compatibilidade | `pipeline_id` | filtros e forms | `pipeline_id` | normalizador repete | local | não oficial | não oficial | não oficial | não oficial | string | não | LEGADO | `pipelineId` | não | não | parcial | frontend | forms e agrupamento | legado histórico | P2 | deprecar após C1 |
| 42 | Compatibilidade | `nome` como título/cliente | card/modal/forms | `nome` | normalizador usa como fallback | local | não oficial para opportunity | não oficial | não oficial | não oficial | string | não | LEGADO | `title`, `cliente_nome` | sim | não | parcial | frontend | cards/forms | semântica ambígua | P2 | separar `title` de `customer display name` |

## 6. Principais conceitos

| Conceito | Campo canônico proposto | Aliases | Fonte | Decisão |
| -------- | ----------------------- | ------- | ----- | ------- |
| etapa | `stageId` | `etapa_id`, `stage_id`, `backendStageId`, `etapa` | Prisma/API | RECOMENDADA |
| valor | `amount` | `valor` | Prisma/API | RECOMENDADA |
| cliente | `customerId` | `cliente_id` | Prisma/API | RECOMENDADA |
| produto | `productId` | `produto_id`, `product_id`, `produto` | Prisma/API | RECOMENDADA |
| responsável | `ownerId` | `responsavel_id` | Prisma/API | RECOMENDADA |
| status | `status` | sem alias confiável | Prisma/API | RECOMENDADA |
| título | `title` | `nome` | Prisma/API | REQUER COMPATIBILIDADE TEMPORÁRIA |
| origem | não confirmado | `origem`, `source`, `origin` | não comprovado | REQUER DECISÃO DE ARQUITETURA |

## 7. Matriz de aliases

| Conceito | Campo canônico proposto | Alias 1 | Alias 2 | Alias 3 | Onde nasce | Onde é convertido | Onde é consumido | Risco | Estratégia futura |
| -------- | ----------------------- | ------- | ------- | ------- | ---------- | ----------------- | ---------------- | ----- | ----------------- |
| etapa | `stageId` | `etapa_id` | `stage_id` | `etapa` | API oficial e legado UI | `mapApiOpportunityToUiShape`, `normalizeOpportunityWorkspace` | card, modal, forms, moveStage | alto | manter aliases só até C1 |
| valor | `amount` | `valor` | `formattedValue` | `valorLiberado` aplicado | API e simulador | mapping da página e normalizador | card, modal, update, simulador | alto | separar valor persistido de valor simulado |
| cliente | `customerId` | `cliente_id` | `customerName` | `cliente_nome` | API/intake/legado | mapping da página e normalizador | card, modal, CRM nav | alto | canônico `customerId`, snapshot de nome via relation |
| título | `title` | `nome` | `displayName` | `cliente_nome` fallback | API e forms | mapping e normalizador | create/edit/header | médio | remover ambiguidade semântica |
| produto | `productId` | `produto_id` | `product_id` | `produto` | API e forms | mapping da página | card, edit, simulador | médio | relação oficial + label derivado |
| responsável | `ownerId` | `responsavel_id` | `ownerName` | `responsavel_nome` | API e forms | mapping e normalizador | card, modal, filtros | médio | projection única de owner |
| origem | não decidido | `origem` | `source` | `origin` | docs/legado | não consolidado | card/forms/docs | médio | decidir antes de implementar |
| status | `status` | sem alias sólido | `ativo` como default UI | status derivado da etapa | API e forms | mapping da página | filtros/update/card | médio | manter distinto de etapa |
| datas | `createdAt` / `updatedAt` | `created_at` | `updated_at` | `movedAt` visual | API/legado | normalizador | SLA, resumo, histórico fake | baixo | unificar camelCase |

## 8. Matriz de transformações

| Origem | Campo de entrada | Função/adaptador | Campo de saída | Regra | Perda de informação | Risco |
| ------ | ---------------- | ---------------- | -------------- | ----- | ------------------: | ----- |
| API oficial | `title` | `mapApiOpportunityToUiShape` | `title`, `nome` | duplica texto em alias UI | não | médio |
| API oficial | `amount` | `mapApiOpportunityToUiShape` | `amount`, `valor` | duplica número em alias UI | não | médio |
| API oficial | `customerId` | `mapApiOpportunityToUiShape` | `customerId`, `cliente_id` | replica identificador | não | médio |
| API oficial | `stageId` + `stage.name` | `mapApiOpportunityToUiShape` | `stageId`, `etapa_id`, `backendStageName` | usa UUID e também label/semântico | parcial | alto |
| API oficial | `pipelineId` + `pipeline.name` | `mapApiOpportunityToUiShape` | `pipelineId`, `pipeline_id`, `backendPipelineName` | duplica ID e semântico | parcial | alto |
| UI agregado | múltiplos aliases | `normalizeOpportunityWorkspace` | `OpportunityWorkspaceViewModel` | prioriza `stageId > stage_id > etapa_id > etapa` | não | alto |
| legado/local | `produto` | `resolvePipeline` no normalizador | `pipelineId` | mapeia produto para pipeline legado | sim | alto |
| modal edit | `formData.valor` | montagem manual de payload | `amount` | converte number | não | médio |
| modal edit | `formData.observacoes` | montagem manual de payload | `description` | reaproveita campo | sim semântica | médio |
| create form | `formData.etapa_id` | matching contra pipeline oficial | `stageId` backend | resolve UUID pelo nome/etapa | parcial | alto |
| drag-and-drop | `etapaId` visual | `resolveOfficialStageById` + `moveStage` | `stageId` backend | traduz stage semântico em UUID | não se mapear corretamente | alto |
| simulador | `valorLiberado` | `oportunidadesApi.update` | `amount` | aplica apenas valor persistido | sim, demais campos de simulação | médio |

## 9. Matriz de consumidores

| Campo | Pipeline card | Workspace header | Formulários | Simulador | PDF | Histórico | Backend | Testes | Outros consumidores |
| ----- | ------------: | ---------------: | ----------: | --------: | --: | --------: | ------: | -----: | ------------------- |
| `id` | sim | sim | sim | não | não confirmado | sim fake | sim | sim | delete/update/move |
| `stageId` | sim | indireto | sim | não | não confirmado | indireto | sim | sim | drag-and-drop |
| `stageLabel` | sim | sim | não | não | não | sim fake | não | sim | modal |
| `amount`/`valor` | sim | sim | sim | sim | não confirmado | sim fake | sim | sim | KPIs por etapa |
| `customerId` | não direto | não | sim | não | não | não | sim | parcial | intake/update |
| `cliente_nome` | sim | sim | sim | não | não | sim fake | não | sim | navegação CRM |
| `productId` | não direto | não | sim | sim | não confirmado | não | sim | parcial | catálogo mestre |
| `ownerId` | não direto | não | sim | não | não | não | sim | parcial | filtros/permissões |
| `responsavel_nome` | sim | sim | sim | não | não | sim fake | não | parcial | card |
| `description/observacoes` | não | pendência | sim | não | não | aba Anotações | sim parcial | parcial | update |
| `tags` | sim | sim | sim | não | não | aba Tags | não confirmado | parcial | config/tags |
| `createdAt`/`updatedAt` | sim | sim | não | não | não | sim fake | sim | parcial | SLA |

## 10. Matriz de escrita

| Campo | Criado por | Editado por | Endpoint | Handler frontend | Store | Persistência | RBAC | Tenant | Auditoria |
| ----- | ---------- | ----------- | -------- | ---------------- | ----- | ------------ | ---- | ------ | --------- |
| `title` | `POST /api/v1/opportunities` | `PUT /api/v1/opportunities/:id` | create/update | `handleSubmitNovaOportunidade`, `handleSubmitEdit` | local transitório | backend | `opportunity:create/update` | confirmado | `OPPORTUNITY_CREATED/UPDATED` |
| `amount` | create/intake | update/simulador aplicado | create/update | create form, edit form, `aceitarSimulacao` | local transitório | backend | `opportunity:create/update` | confirmado | audit log |
| `stageId` | create/intake | moveStage/update pipeline-stage | create/move | create flow, drag/drop, confirmar fase | local transitório | backend | `opportunity:create/move_stage/update` | confirmado | `OPPORTUNITY_MOVED` |
| `pipelineId` | create/intake | moveStage eventual | create/move | create flow, confirmar fase | local transitório | backend | idem | confirmado | audit log |
| `customerId` | create/intake | update/intake link | create/update/intake | create/edit/intake mapping | local transitório | backend | `opportunity:create/update` | confirmado | audit log |
| `ownerId` | create/intake | update | create/update | create/edit | local transitório | backend | `opportunity:create/update` | confirmado | audit log |
| `description` | create | update | create/update | create/edit | local transitório | backend | `opportunity:create/update` | confirmado | audit log |
| `tags` | UI local | UI local | não confirmado | form/modal tags | local | não confirmado | não confirmado | não confirmado | não confirmado |
| tarefas | UI local | UI local | nenhum | aba Tarefas | local | não | n/a | n/a | não |
| anexos | UI local | UI local | nenhum | `handleUploadAnexo` | local | não | n/a | n/a | não |

## 11. Persistência e refresh

| Campo | Após mutation | Estado local | Store persistida | Resposta backend | Após F5 | Risco de stale data |
| ----- | ------------- | ------------ | ---------------- | ---------------- | ------- | ------------------- |
| `stageId` | `moveStage` + refetch | otimista/temporário | não persistida oficialmente | confirmado | CONFIRMADO | médio |
| `stageLabel` | recalculado no normalizador | sim | não | depende de `stage.name` | PARCIALMENTE CONFIRMADO | médio |
| `amount` | `update` + refetch | sim | não | confirmado | CONFIRMADO | médio |
| `customerId` | `create/update/intake` | sim | não | confirmado | CONFIRMADO | baixo |
| `cliente_nome` | depende de projection/refetch | sim | não | parcial | PARCIALMENTE CONFIRMADO | médio |
| `ownerId` | `update` + refetch | sim | não | confirmado | CONFIRMADO | baixo |
| `responsavel_nome` | depende de projection | sim | não | parcial | PARCIALMENTE CONFIRMADO | médio |
| `title` | `update` + refetch | sim | não | confirmado | CONFIRMADO | baixo |
| `productId` | `create/update` | sim | não | confirmado | CONFIRMADO | baixo |
| `tags` | local only | sim | não | não confirmado | NÃO CONFIRMADO | alto |
| tarefas | local only | sim | não | não | NÃO CONFIRMADO | alto |
| anexos | local only | sim | não | não | NÃO CONFIRMADO | alto |
| histórico | render fake | sim | não | não | NÃO CONFIRMADO | alto |

## 12. Divergências documentais

| Conceito | Documento A | Documento B | Código atual | Prisma/API | Divergência | Recomendação |
| -------- | ----------- | ----------- | ------------ | ---------- | ----------- | ------------ |
| fonte da etapa | `MATRIZ_FONTE_VERDADE_WORKSPACE` sugere híbrido com `etapa_id` | contrato canônico fala `stageId` operacional | UI ainda usa ambos | Prisma/API usam `stageId` | docs e runtime híbrido divergem do modelo persistido | atualizar docs e classificar `etapa_id` como alias |
| valor | docs usam `valor` como campo natural | API oficial usa `amount` | UI duplica `amount` e `valor` | Prisma usa `amount` | nomenclatura divergente | definir `amount` canônico e `valor` compat |
| cliente | docs alternam `cliente_id`, `customerId`, `cliente_nome` | rastreamento histórico fala agregado | código separa ID oficial e snapshot | Prisma usa `customerId` | semântica do nome exibido não está fechada | separar relação oficial de snapshot UI |
| tags | docs anteriores insinuam persistência híbrida/possível | contrato canônico menciona tags persistidas | update/create oficial não envia tags | Prisma Opportunity não tem `tags` | documentação superestima persistência | marcar como não confirmado para Opportunity |
| anotações | docs confundem notas da workspace com campo persistido | contrato fala `observacoes` | UI salva em `description` | Prisma tem `description`, não `notes` | semântica conflita | decidir se `description` cobre nota oficial |
| tarefas/histórico/anexos | docs tratam como parte da workspace | auditorias antigas mencionam áreas híbridas | modal usa dados locais/mock | Prisma tem `Activity` | runtime atual não consome `Activity` | registrar como gap para C5/C7 |
| store persistido | docs antigas falam em Zustand persistido como risco central | store atual `partialize` persiste só `theme` | lista de oportunidades não é persistida no storage do Zustand | n/a | documento histórico ficou desatualizado | corrigir evidência documental |

## 13. Decisões propostas

### 13.1 Etapa

- Canônico persistido: `stageId`
- Canônico de exibição: `stageLabel` derivado de `Stage.name`
- Aliases temporários: `etapa_id`, `stage_id`, `etapa`, `backendStageId`
- Classificação: `RECOMENDADA`

### 13.2 Valor

- Campo persistido: `amount`
- Tipo de transporte: `number`
- Campo de exibição: `valor` compat + `formattedValue` derivado
- Campo aplicado pelo simulador: continua sendo `amount`
- Classificação: `RECOMENDADA`

### 13.3 Cliente

- ID oficial: `customerId`
- Snapshot de exibição: projeção derivada de `customer.firstName/lastName` ou `customerName`
- Alias temporário: `cliente_id`
- `cliente_nome` deve ser tratado como campo de exibição, não identificador
- Classificação: `RECOMENDADA`

### 13.4 Produto

- Vínculo oficial: `productId`, `subproductId`, `modalityId`
- Nome de exibição: relação `product/subproduct/modality`
- Fallback local `produto` permanece apenas como compatibilidade
- Classificação: `REQUER COMPATIBILIDADE TEMPORÁRIA`

### 13.5 Responsável

- ID oficial: `ownerId`
- Nome exibido: projection única de owner a ser formalizada
- Aliases temporários: `responsavel_id`, `responsavel_nome`
- Classificação: `REQUER COMPATIBILIDADE TEMPORÁRIA`

### 13.6 Origem

- Não foi possível comprovar um campo oficial de origem em `Opportunity`
- Não implementar nem consolidar nome sem decisão adicional
- Classificação: `REQUER DECISÃO DE ARQUITETURA`

## 14. Campos candidatos à remoção

| Campo | Motivo | Consumidores atuais | Persistido | Pode remover agora | Dependências | Estratégia |
| ----- | ------ | ------------------- | ---------: | -----------------: | ------------ | ---------- |
| `etapa_id` | alias legado de `stageId` | forms, filtros, grouping, modal | não | não | UI inteira do workspace | REMOVER APÓS MIGRAÇÃO |
| `pipeline_id` | alias legado de `pipelineId` | create/edit/grouping | não | não | create flow e grouping | REMOVER APÓS MIGRAÇÃO |
| `nome` | ambíguo entre título e cliente | forms, cards, modal | não | não | create/edit/header | CANDIDATO A DEPRECIAÇÃO |
| `cliente_id` | alias legado de `customerId` | forms e adapters | não | não | create/edit/intake | REMOVER APÓS MIGRAÇÃO |
| `responsavel_id` | alias legado de `ownerId` | forms e filtros | não | não | create/edit/filter | REMOVER APÓS MIGRAÇÃO |
| `responsavel_nome` | projection não oficial | card/modal | não | não | projection owner | CANDIDATO A DEPRECIAÇÃO |
| histórico inline | não usa backend | modal | não | não | trocar por Activity | REMOVER APÓS TESTES |
| tarefas inline | mock local | modal | não | não | contrato Activity | REMOVER APÓS MIGRAÇÃO |
| anexos locais | não usa backend | modal | não | não | contrato de upload/Activity | REMOVER APÓS MIGRAÇÃO |

## 15. Campos não confirmados

| Campo | Onde aparece | Hipótese | Evidência faltante | Risco |
| ----- | ------------ | -------- | ------------------ | ----- |
| `origem` | normalizador, docs e forms antigos | canal/origem comercial da oportunidade | campo correspondente no contrato oficial `Opportunity` ou DTO backend | médio |
| `tags` da Opportunity | card, modal, normalizador | tags de negócio persistidas por oportunidade | endpoint oficial de leitura/escrita e campo no modelo `Opportunity` | médio |

## 16. Testes relacionados a campos

| Campo/conceito | Teste existente | Arquivo | Tipo | O que protege | Gap |
| -------------- | --------------: | ------- | ---- | ------------- | --- |
| normalização de etapa | sim | `src/test/workspaceOpportunity.test.ts` | unitário | prioridade `stageId > etapa_id > etapa` | falta integração com payload real |
| IDs canônicos | sim | `src/test/workspaceOpportunity.test.ts` | unitário | evita usar `displayId`/IDs técnicos como ID remoto | ainda convivem IDs UUID e legados na UI |
| merge backend vs snapshot | sim | `src/test/workspaceOpportunity.test.ts` | unitário | backend vence snapshot | falta refresh cross-client |
| payload sem derivados | sim | `src/test/workspaceOpportunity.test.ts` | unitário | não envia `stageLabel`, `formattedValue` | payload final da página ainda é montado manualmente |
| abertura do card | sim | `src/test/oportunidades-card-interaction.test.tsx` | interação | abre modal e renderiza etapa canônica | não cobre escrita |
| ações rápidas | sim | `src/test/oportunidades-card-interaction.test.tsx` | interação | evita abrir modal indevidamente | não cobre anexos/tarefas |
| troca entre cards | sim | `src/test/oportunidades-card-interaction.test.tsx` | interação | evita estado residual | não cobre refresh |
| payload parcial | sim | `src/test/oportunidades-card-interaction.test.tsx` | interação | label canônico com payload parcial | não cobre update |
| hardening de import do normalizador | sim | `src/test/oportunidades-kanban-hardening.test.ts` | estrutural | protege integração do card com normalizador | não cobre contratos auxiliares |
| RBAC/tenant opportunities | sim | `backend/src/tests/unit/opportunities.*.test.ts` | unitário | filtros tenant e permissões | executar integração controlada depois |

## 17. Riscos

### P0

- Nenhum novo risco P0 identificado.

### P1

- Nomenclatura híbrida de etapa (`stageId` vs `etapa_id`) ainda espalhada na UI.
- Nomenclatura híbrida de valor (`amount` vs `valor`) ainda espalhada na UI.
- Criação/edição fazem montagem manual de payloads e aliases, aumentando risco de drift.

### P2

- `cliente_nome`, `responsavel_nome` e `nome` têm semântica sobreposta.
- Modal usa abas de tarefas, anexos e histórico sem contrato backend comprovado.
- Tags aparecem como recurso existente, mas não há evidência ponta a ponta para `Opportunity`.

### P3

- `displayId` e labels derivadas podem continuar confundindo leitura humana se não forem claramente classificadas.

## 18. Subblocos resultantes

| Bloco | Campos envolvidos | Dependências | Risco | Ordem | Critério de entrada |
| ----- | ----------------- | ------------ | ----- | ----: | ------------------- |
| C1 — Contrato canônico e normalização | `id`, `title`, `stageId`, `pipelineId`, `amount`, `customerId`, `ownerId` e aliases | este C0 | alto | 1 | mapa C0 aprovado |
| C2 — Sincronização de etapa | `stageId`, `stageLabel`, `pipelineId`, `etapa_id` | C1 | alto | 2 | aliases de etapa classificados |
| C3 — Sincronização de valor | `amount`, `valor`, `formattedValue`, simulador aplicado | C1 | alto | 3 | contrato de valor aprovado |
| C4 — Sincronização de cliente | `customerId`, `cliente_id`, `cliente_nome` | C1 | médio | 4 | contrato de cliente aprovado |
| C5 — Persistência e reconciliação | `description`, tags, tarefas, anexos, histórico, refresh | C1-C4 | alto | 5 | fluxos canônicos estabilizados |
| C6 — RBAC e tenant | todos campos com escrita | auditado | baixo | 0 | já auditado |
| C7 — Testes e observabilidade | todos campos críticos | C1-C5 | médio | 6 | contratos consolidados |

Registro C6:

- `NENHUM RISCO P0 IDENTIFICADO — RBAC E TENANT SUFICIENTEMENTE VALIDADOS PARA AVANÇO CONTROLADO`

## 19. Primeiro subbloco recomendado

### BLOCO C1 — CONTRATO CANÔNICO E NORMALIZAÇÃO

Objetivo:

- eliminar ambiguidade entre campos canônicos, aliases e derivados;
- centralizar a tradução `API oficial -> UI shape -> workspace view model`;
- preparar o terreno para C2, C3 e C4 sem quebrar compatibilidade.

Campos envolvidos:

- `id`
- `title`
- `stageId`
- `stageLabel`
- `pipelineId`
- `amount`
- `customerId`
- `cliente_nome`
- `ownerId`
- `responsavel_nome`
- `productId`

Arquivos prováveis:

- `src/components/pipeline/workspaceOpportunity.ts`
- `src/pages/Oportunidades.tsx`
- `src/api/modules/opportunities.api.ts`
- `src/types/index.ts`
- testes de `workspaceOpportunity` e interação do card

Riscos:

- quebrar fluxos que ainda dependem de `etapa_id`, `valor`, `nome`;
- esconder dependências de payload manual já em uso;
- remover compatibilidade antes de mapear todos os consumidores.

Critérios de aceite:

- um único mapa explícito de campo canônico, alias e derivado;
- criação, edição, moveStage e abertura do modal usando a mesma convenção;
- nenhum payload derivado enviado ao backend;
- testes de normalização e card preservados e ampliados.

Testes necessários:

- unitários de normalização e payload;
- interação de card;
- integração de create/update/move com contratos oficiais;
- cobertura de refresh pós-mutation.

Condições de interrupção:

- descoberta de segundo contrato canônico concorrente;
- necessidade de migration;
- decisão de produto obrigatória para origem/tags/anotações;
- qualquer necessidade de alterar backend/Prisma fora do escopo aprovado.

## 20. Critérios de aceite do C0

- worktree validado antes e depois;
- nenhum código alterado;
- mapeamento de campos com separação entre canônico, alias, derivado e não confirmado;
- divergências documentais registradas sem reescrever documentos canônicos;
- primeiro subbloco recomendado formalizado.

## 21. Conclusão

O mapa oficial consolidado indica que a Opportunity já tem backend oficial consistente, mas a experiência da Workspace continua apoiada em uma camada de normalização e compatibilidade que mistura contratos modernos com aliases históricos. O risco dominante não é ausência de backend, e sim drift semântico entre as camadas.

Parecer formal:

`MAPA OFICIAL DA OPPORTUNITY CONCLUÍDO — BLOCO C1 PRONTO PARA REVISÃO E AUTORIZAÇÃO`
