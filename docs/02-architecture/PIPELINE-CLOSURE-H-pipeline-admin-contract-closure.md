# PIPELINE-CLOSURE-H - Pipeline Admin Contract Closure

Status: APPROVED WITH RESTRICTIONS
Type: Architecture Decision / Contract Closure
Scope: Pipeline Admin / Stage Admin / Frontend Contract / Backend Alignment
Date: 2026-06-23

---

## 1. Executive Verdict

`NO-GO` para migrar `src/pages/admin/Pipelines.tsx` diretamente para runtime oficial neste momento.

Motivos confirmados pela auditoria `PIPELINE-CLOSURE-G`:

- a tela admin ainda usa `PipelineSettings` como modelo local;
- `PipelineSettings` nao e isomorfico ao modelo oficial `Pipeline` / `Stage`;
- `src/data/catalogRepository.ts` persiste e carrega settings via `localStorage`;
- `src/api/modules/pipelines.api.ts` e `KEEP`, mas hoje expõe somente leitura;
- o backend oficial ja cobre o dominio de Pipeline e Stage, mas o client oficial ainda nao cobre a superficie de operacao que a tela admin precisa;
- `stageColors` nao possui destino oficial confirmado.

Conclusao arquitetural:

- a migração da tela admin exige fechamento de contrato antes de runtime;
- `catalogRepository` e `localStorage` seguem como fontes quarentenadas;
- a tela admin nao deve ser migrada antes de existir um adapter/mapper e a expansao do client oficial.

---

## 2. Modelo Local Atual: `PipelineSettings`

O modelo local atual esta definido em `src/data/catalogRepository.ts` e e consumido pela tela `src/pages/admin/Pipelines.tsx`.

Campos observados:

- `pipelineId`
- `pipelineCode`
- `pipelineName`
- `active`
- `stages`
- `stageColors`
- `updatedAt`

Caracteristicas:

- `pipelineId` e usado como chave de agrupamento do settings local;
- `pipelineCode` e um identificador sem equivalente oficial confirmado;
- `pipelineName` representa o nome exibido na UI;
- `active` representa o status visual/operacional da tela;
- `stages` e uma lista local de nomes de etapas;
- `stageColors` e uma lista local paralela de cores;
- `updatedAt` e metadata local de sincronizacao.

Fontes:

- [`src/data/catalogRepository.ts`](C:/Projects/FINQZ_PRO/src/data/catalogRepository.ts#L302)
- [`src/pages/admin/Pipelines.tsx`](C:/Projects/FINQZ_PRO/src/pages/admin/Pipelines.tsx#L21)

---

## 3. Modelo Oficial: `Pipeline`

O modelo oficial do backend esta em `backend/prisma/schema.prisma` e em `backend/src/modules/pipelines/**`.

Campos observados:

- `id`
- `name`
- `description`
- `isActive`
- `deletedAt`
- `tenantId`
- relacao com `Stage[]`

Propriedades arquiteturais:

- pipeline e tenant-scoped;
- pipeline e soft-delete aware;
- pipeline e governado por backend oficial;
- `isActive` representa a disponibilidade oficial;
- `description` existe no modelo oficial, mas nao esta refletida na tela atual.

Fontes:

- [`backend/prisma/schema.prisma`](C:/Projects/FINQZ_PRO/backend/prisma/schema.prisma#L463)
- [`backend/src/modules/pipelines/service.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/service.ts#L75)

---

## 4. Modelo Oficial: `Stage`

O modelo oficial de Stage tambem e backend-owned.

Campos observados:

- `id`
- `name`
- `order`
- `isWon`
- `isLost`
- `deletedAt`
- `pipelineId`
- `tenantId`
- relacao com `Pipeline`

Propriedades arquiteturais:

- stage pertence a um pipeline oficial;
- stage tem ordenacao canonica no backend;
- stage carrega flags de negocio `isWon` e `isLost`;
- stage e soft-delete aware;
- stage nao e entidade de UI isolada.

Fontes:

- [`backend/prisma/schema.prisma`](C:/Projects/FINQZ_PRO/backend/prisma/schema.prisma#L485)
- [`backend/src/modules/pipelines/validators/pipeline.http.schema.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/validators/pipeline.http.schema.ts#L49)

---

## 5. Matriz `PipelineSettings` -> `Pipeline` Oficial

| Campo local | Campo oficial | Status | Observacao |
|---|---|---|---|
| `pipelineId` | `Pipeline.id` | `PARCIAL` | hoje e chave local; precisa confirmar aderencia a UUID oficial |
| `pipelineCode` | nao evidenciado | `UNKNOWN / REMOVE LATER` | nao existe destino oficial confirmado |
| `pipelineName` | `Pipeline.name` | `MIGRATE` | mapeamento direto |
| `active` | `Pipeline.isActive` | `MIGRATE` | mapeamento direto |
| `stages` | `Pipeline.stages` / `Stage[]` | `MIGRATE` | exige adapter de estrutura |
| `stageColors` | nao evidenciado | `BLOCKER / NEEDS DECISION` | sem campo oficial confirmado |
| `updatedAt` | nao evidenciado | `UNKNOWN / NEEDS DECISION` | metadata local, nao contrato de dominio |

Leitura arquitetural:

- nome e status tem mapeamento claro;
- stages precisam de adapter porque a tela usa `string[]` e o backend usa entidades `Stage`;
- `pipelineCode` nao tem equivalencia oficial confirmada;
- `stageColors` nao pode ser assumido como dado oficial sem decisao especifica.

---

## 6. Matriz de `stages` Locais -> `Stage` Oficial

| Campo local | Campo oficial | Status | Observacao |
|---|---|---|---|
| nome da etapa (`string`) | `Stage.name` | `MIGRATE` | mapeamento semantico direto |
| posicao no array | `Stage.order` | `MIGRATE` | precisa preservar ordenacao canonica |
| cor paralela | nao evidenciada | `BLOCKER / NEEDS DECISION` | nao ha persistencia oficial confirmada |
| etapa ganhadora/perdedora | `Stage.isWon` / `Stage.isLost` | `MIGRATE` | existe no backend, mas nao na UI atual |

Leitura arquitetural:

- a tela atual trata etapas como nomes simples;
- o backend trata etapas como entidades com ordem e flags de negocio;
- o adapter futuro precisa traduzir a lista local para entidades oficiais.

---

## 7. Matriz `stageColors`

### Situacao atual

- `stageColors` existe como lista local paralela em `PipelineSettings`;
- a tela admin usa `stageColors` para renderizacao e edicao;
- o backend oficial nao evidenciou persistencia equivalente.

### Decisao temporaria

`stageColors` deve ser tratado como `UI-only temporario`, sem backend, ate decisao explicita.

### Implicacao

- nao migrar `stageColors` como contrato oficial sem definicao de produto/arquitetura;
- nao assumir que a cor e parte do dominio operacional;
- se a cor precisar persistir, isso exige extensao de contrato backend;
- se nao precisar persistir, deve permanecer apenas como apresentacao local.

Classificacao: `UNKNOWN / NEEDS DECISION`

---

## 8. Metodos que devem ser adicionados futuramente em `src/api/modules/pipelines.api.ts`

Hoje o client oficial expõe apenas leitura (`getAll()`).

Metodos faltantes para migrar a tela admin:

- `createPipeline`
- `updatePipeline`
- `deletePipeline` ou `deactivatePipeline`
- `createStage`
- `updateStage`
- `deleteStage` ou `deactivateStage`
- `reorderStages`

Esses metodos devem ser implementados antes da migracao runtime da tela admin.

Fonte atual do client:

- [`src/api/modules/pipelines.api.ts`](C:/Projects/FINQZ_PRO/src/api/modules/pipelines.api.ts#L8)

---

## 9. Endpoints Backend Correspondentes

| Operacao | Endpoint backend | Estado |
|---|---|---|
| listar pipelines | `GET /api/v1/pipelines` | existente |
| criar pipeline | `POST /api/v1/pipelines` | existente |
| atualizar pipeline | `PUT /api/v1/pipelines/:pipelineId` | existente |
| remover/inativar pipeline | `DELETE /api/v1/pipelines/:pipelineId` | existente |
| criar stage | `POST /api/v1/pipelines/:pipelineId/stages` | existente |
| atualizar stage | `PATCH /api/v1/pipelines/stages/:stageId` | existente |
| remover/inativar stage | `DELETE /api/v1/pipelines/stages/:stageId` | existente |
| reordenar stages | `PATCH /api/v1/pipelines/:pipelineId/stages/reorder` | existente |

Fontes:

- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L113)
- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L208)
- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L281)
- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L336)
- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L411)
- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L488)
- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L543)
- [`backend/src/modules/pipelines/presentation/http/pipeline.http.contract.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/presentation/http/pipeline.http.contract.ts#L24)

---

## 10. Gaps de Contrato

### Gaps confirmados

- `src/api/modules/pipelines.api.ts` nao cobre o CRUD da tela admin;
- `PipelineSettings` nao e isomorfico ao modelo oficial;
- `stageColors` nao tem destino oficial confirmado;
- a tela atual nao modela `Pipeline.description`;
- a tela atual nao modela `Stage.isWon` e `Stage.isLost`;
- a tela atual usa `stages` como nomes simples, nao como entidades oficiais;
- `catalogRepository` continua sendo persistencia local paralela.

### Gaps pendentes de decisao

- `stageColors` e contrato backend ou apenas tema/UI;
- `pipelineCode` deve existir no contrato oficial ou ser removido;
- `updatedAt` precisa existir na tela admin ou ser tratado apenas como metadata;
- `pipelineId` local e apenas alias visual ou chave operacional oficial.

---

## 11. Escopo Permitido da Proxima Wave

Permitido:

- expandir `src/api/modules/pipelines.api.ts` com metodos de escrita e reorder;
- criar adapter/helper para mapear `Pipeline` e `Stage` para a UI admin;
- separar `stageColors` como decisao de UI;
- preparar a tela admin para consumir contrato oficial sem alterar backend;
- documentar e isolar o legado de `catalogRepository`.

Proibido:

- migrar a tela admin diretamente sem adapter;
- tratar `localStorage` como source of truth;
- remover `stageColors` sem decisao oficial;
- alterar runtime antes do contrato estar fechado;
- alterar backend apenas para acomodar o modelo local sem analise contratual;
- criar nova fonte paralela.

---

## 12. Escopo Proibido

- usar `catalogRepository` como owner oficial de Pipeline;
- manter a tela admin dependente de `localStorage` como mecanismo operacional final;
- assumir que o client oficial esta pronto sem expandir a superficie de operacao;
- inventar persistencia para `stageColors` sem decisao formal;
- migrar runtime parcial que deixe a tela com duas fontes de verdade.

---

## 13. Critérios de GO / NO-GO

### GO

- `src/api/modules/pipelines.api.ts` expõe CRUD e reorder;
- existe adapter claro `Pipeline/Stage -> PipelineSettings view model`;
- `stageColors` tem decisao formal;
- a tela admin passa a ler/gravar apenas via contrato oficial;
- `catalogRepository/localStorage` deixa de ser fonte operacional.

### NO-GO

- client oficial ainda incompleto;
- adapter inexistente;
- `stageColors` sem decisao;
- tela admin ainda dependente de settings locais;
- duplicidade de ownership entre backend e browser.

---

## 14. Plano de Ondas

### Wave 1 - Fechar client oficial

Objetivo:

- ampliar `src/api/modules/pipelines.api.ts` com as operacoes faltantes.

Resultado esperado:

- a tela admin passa a ter superficie oficial de escrita/leitura.

### Wave 2 - Definir adapter

Objetivo:

- mapear `Pipeline` / `Stage` para o modelo da tela;
- definir como `stages`, `active`, `pipelineName` e `pipelineId` serao representados.

Resultado esperado:

- a UI deixa de depender de forma implicita de `PipelineSettings`.

### Wave 3 - Decidir `stageColors`

Objetivo:

- formalizar se `stageColors` e apenas UI ou dado persistido oficialmente.

Resultado esperado:

- a tela admin nao fica ambigua em relacao a cor de etapa.

### Wave 4 - Migrar tela admin

Objetivo:

- trocar `catalogRepository/localStorage` por backend oficial.

Resultado esperado:

- `src/pages/admin/Pipelines.tsx` vira cliente do backend oficial.

### Wave 5 - Quarentena final do legado

Objetivo:

- reduzir `catalogRepository` a compatibilidade temporaria;
- isolar definitivamente o fluxo legacy.

Resultado esperado:

- Pipeline admin fica backend-owned.

---

## 15. Decisão Explícita

Nao migrar `src/pages/admin/Pipelines.tsx` antes de:

- expandir `src/api/modules/pipelines.api.ts`;
- definir o adapter entre o modelo local e o modelo oficial;
- decidir formalmente `stageColors`.

Essa decisao e obrigatoria para evitar uma migracao parcial com dupla fonte de verdade.

---

## 16. Classificacao Final

### KEEP

- `backend/src/modules/pipelines/**`
- `backend/prisma/schema.prisma` para `Pipeline` e `Stage`
- `src/api/modules/pipelines.api.ts`

### MIGRATE

- `src/pages/admin/Pipelines.tsx`

### QUARANTINE

- `src/data/catalogRepository.ts`
- `src/config/pipelines.ts`
- `src/store/index.ts`
- `src/types/index.ts`

### REMOVE LATER

- `localStorage` como source of truth de Pipeline
- `PipelineSettings` como contrato operacional final
- persistencia de settings de pipeline no browser

### BLOCKER

- ausencia de client oficial completo para escrita
- ausencia de adapter oficial
- ausencia de decisao sobre `stageColors`

### UNKNOWN / NEEDS DECISION

- destino oficial de `pipelineCode`
- destino oficial de `updatedAt`
- persistencia oficial de `stageColors`
