# PIPELINE-ADMIN-WAVE-4A - Write Migration Decision Matrix

Status: PLANEJADO
Type: Architecture Decision / Write Migration Matrix
Scope: Admin / Pipelines / Write Enablement
Date: 2026-06-23

---

## 1. Executive Verdict

`NO-GO` para habilitar escrita completa agora.

A tela `src/pages/admin/Pipelines.tsx` ja esta em leitura oficial, mas a escrita ainda exige fechamento de contrato e integracao de UI para:

- criar pipeline;
- editar pipeline;
- inativar/ativar pipeline;
- excluir/soft delete pipeline;
- criar stage;
- editar stage;
- excluir/soft delete stage;
- reorder stages.

---

## 2. O que falta por operacao

### 2.1 Criar pipeline

Falta:

- conectar a UI aos payload builders do adapter;
- decidir como a tela vai tratar `pipelineCode`, que hoje e apenas visual;
- decidir se o form de criacao vai permitir ou nao `isDefault`;
- validar UX de erro/sucesso e refresh apos create.

Contratos ja existentes:

- [`src/api/modules/pipelines.api.ts`](/C:/Projects/FINQZ_PRO/src/api/modules/pipelines.api.ts#L64)
- [`src/pages/admin/pipelines.adapter.ts`](/C:/Projects/FINQZ_PRO/src/pages/admin/pipelines.adapter.ts#L170)

### 2.2 Atualizar pipeline

Falta:

- criar UI de edicao oficial;
- decidir o write path de `active/isActive`;
- decidir se `pipelineCode` sera removido da UI ou mantido apenas como derivado visual;
- fechar comportamento de refresh e invalidez do cache de leitura.

### 2.3 Delete / soft delete pipeline

Falta:

- definir confirmacao de acao destrutiva na UI;
- conectar o botao ao metodo oficial de delete;
- separar visualmente delete de toggle de ativo;
- definir se delete vai remover da lista imediatamente ou apos refresh.

### 2.4 Criar stage

Falta:

- abrir modal/form oficial para stage;
- capturar `name`, `order`, `isWon`, `isLost`;
- conectar ao payload builder do adapter;
- definir se o novo stage entra no fim, no inicio ou por ordem manual.

### 2.5 Atualizar stage

Falta:

- habilitar edicao por stage;
- permitir alterar nome, ordem, flags de ganho/perda;
- garantir que a UI continue ordenando por `order ASC` apos update.

### 2.6 Delete / soft delete stage

Falta:

- definir confirmacao por stage;
- conectar ao metodo oficial de delete;
- atualizar a lista e resumo apos soft delete.

### 2.7 Reorder stages

Falta:

- ativar drag and drop ou alternativa equivalente na UI read/write;
- conectar a chamada `reorderStages`;
- sincronizar o reorder com o estado local da tela e com refresh oficial.

---

## 3. Como tratar `pipelineCode`

**Decisao:** manter como `UI-only derivado` ate definicao de contrato oficial.

### Diretriz

- nao persistir `pipelineCode` como source of truth;
- nao enviar `pipelineCode` em payload oficial;
- se a UI precisar exibir um identificador, derivar visualmente do `pipelineId` ou de metadado futuro.

### Motivo

O contrato oficial atual nao possui `code` como campo de dominio/HTTP para pipeline.

---

## 4. Como tratar `stageColors`

**Decisao:** manter `UI-only temporario`.

### Diretriz

- `stageColors` nao entra em payload oficial;
- `stageColors` nao e fonte de verdade de stage;
- `stageColors` continua apenas como decoracao visual na UI;
- qualquer persistencia futura exige decisao separada.

---

## 5. Como tratar `active/isActive`

**Decisao:** o write path deve usar `updatePipeline`, nao `DELETE`.

### Diretriz

- `DELETE` continua reservado para soft delete / archive;
- `active/isActive` deve ser escrito explicitamente no contrato de update quando a UI de escrita for habilitada;
- nao criar endpoint novo para toggle ativo nesta fase;
- nao misturar toggle visual com exclusao logica.

---

## 6. Menor wave de escrita segura

A menor wave segura e:

1. habilitar apenas `create pipeline`;
2. manter read-only para `stage` e `pipeline` existente;
3. manter `stageColors` como UI-only;
4. manter `pipelineCode` como derivado visual;
5. deixar `update`, `delete`, `toggle active` e `reorder` para waves seguintes.

Isso reduz o risco de drift entre UI e backend oficial.

---

## 7. O que continua proibido

- voltar a ler `catalogRepository` ou `localStorage` como source of truth;
- reintroduzir `PipelineSettings` na tela;
- reintroduzir `getPipelineOptions()` no runtime da admin;
- enviar `stageColors` como parte do contrato oficial;
- tratar `pipelineCode` como campo canonico;
- usar `DELETE` como proxy de toggle ativo;
- habilitar escrita ampla antes de validar a primeira wave controlada.

---

## 8. Matriz de Decisao

| Item | Decisao | Status |
|---|---|---|
| create pipeline | depende de UI e payload wiring | `MIGRATE` |
| update pipeline | depende de UI e decisao de active | `BLOCKER` |
| delete pipeline | depende de confirmacao e refresh | `MIGRATE` |
| create stage | depende de form/UI e payload wiring | `MIGRATE` |
| update stage | depende de UI de edicao por stage | `MIGRATE` |
| delete stage | depende de confirmacao e refresh | `MIGRATE` |
| reorder stages | depende de interacao de arrastar/reordenar | `MIGRATE` |
| pipelineCode | UI-only derivado | `KEEP` |
| stageColors | UI-only temporario | `KEEP` |
| active/isActive | write path via `updatePipeline` | `BLOCKER` |

---

## 9. Decisao Final

A tela admin esta pronta para evoluir para escrita, mas ainda nao esta pronta para habilitar escrita completa.

O caminho seguro e liberar a escrita por ondas, com o seguinte principio:

- primeiro create;
- depois updates controlados;
- depois delete/soft delete;
- por ultimo reorder e toggle de ativo, com contrato fechado.
