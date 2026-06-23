# PIPELINE-ADMIN-WAVE-3A - Admin Read-Only Migration Plan

Status: PLANEJADO  
Type: Architecture Plan / Read-Only Migration  
Scope: Admin / Pipelines / Read Surface  
Date: 2026-06-23

---

## 1. Executive Verdict

`GO` para a migração **read-only** da tela `src/pages/admin/Pipelines.tsx`, desde que a tela passe a consumir o adapter oficial e abandone a leitura de `catalogRepository` como source of truth.

`NO-GO` para a migração de escrita nesta fase.

O objetivo desta onda e apenas a leitura:

- listar pipelines oficiais;
- listar stages oficiais;
- exibir estado ativo;
- exibir cores de stage como UI-only temporario;
- manter a edicao e a persistencia legadas fora do runtime.

---

## 2. Fluxo Atual

### 2.1 Leitura de catalogRepository

A tela le diretamente:

- `getPipelineOptions()`
- `loadPipelineSettings()`
- `getDefaultPipelineSettings()`
- `defaultPipelineStages`
- `createDefaultStageColors()`
- `isValidPipelineStageColor()`

Evidencia:

- [`src/pages/admin/Pipelines.tsx`](/C:/Projects/FINQZ_PRO/src/pages/admin/Pipelines.tsx#L7)
- [`src/data/catalogRepository.ts`](/C:/Projects/FINQZ_PRO/src/data/catalogRepository.ts#L300)

### 2.2 Leitura de PipelineSettings

A tela depende diretamente de `PipelineSettings` em:

- estado local `pipelineSettings`
- `editForm`
- `displayedPipelines`
- exportacao
- resumo

Evidencia:

- [`src/pages/admin/Pipelines.tsx`](/C:/Projects/FINQZ_PRO/src/pages/admin/Pipelines.tsx#L21)

### 2.3 Leitura indireta de localStorage

`localStorage` nao aparece na tela diretamente, mas entra por:

- `loadPipelineSettings()`
- `savePipelineSettings()`
- `getPipelineStages()`
- `getPipelineStageColor()`

Evidencia:

- [`src/data/catalogRepository.ts`](/C:/Projects/FINQZ_PRO/src/data/catalogRepository.ts#L354)
- [`src/data/catalogRepository.ts`](/C:/Projects/FINQZ_PRO/src/data/catalogRepository.ts#L377)
- [`src/data/catalogRepository.ts`](/C:/Projects/FINQZ_PRO/src/data/catalogRepository.ts#L425)
- [`src/data/catalogRepository.ts`](/C:/Projects/FINQZ_PRO/src/data/catalogRepository.ts#L442)

### 2.4 Consumo de stages

A tela consome stages em:

- visualizacao de lista
- modo edicao
- drag and drop
- resumo

Evidencia:

- [`src/pages/admin/Pipelines.tsx`](/C:/Projects/FINQZ_PRO/src/pages/admin/Pipelines.tsx#L281)
- [`src/pages/admin/Pipelines.tsx`](/C:/Projects/FINQZ_PRO/src/pages/admin/Pipelines.tsx#L407)
- [`src/pages/admin/Pipelines.tsx`](/C:/Projects/FINQZ_PRO/src/pages/admin/Pipelines.tsx#L151)

### 2.5 Consumo de stageColors

A tela usa `stageColors` em:

- render de chips/bolhas de cor
- editor de cor por etapa
- reorder de stages mantendo cores
- salvamento local

Evidencia:

- [`src/pages/admin/Pipelines.tsx`](/C:/Projects/FINQZ_PRO/src/pages/admin/Pipelines.tsx#L71)
- [`src/pages/admin/Pipelines.tsx`](/C:/Projects/FINQZ_PRO/src/pages/admin/Pipelines.tsx#L173)
- [`src/pages/admin/Pipelines.tsx`](/C:/Projects/FINQZ_PRO/src/pages/admin/Pipelines.tsx#L433)

### 2.6 Montagem de listas, tabelas e cards

A tela monta:

- `displayedPipelines`
- cards por pipeline
- chips de etapas
- resumo agregado

Evidencia:

- [`src/pages/admin/Pipelines.tsx`](/C:/Projects/FINQZ_PRO/src/pages/admin/Pipelines.tsx#L44)
- [`src/pages/admin/Pipelines.tsx`](/C:/Projects/FINQZ_PRO/src/pages/admin/Pipelines.tsx#L281)
- [`src/pages/admin/Pipelines.tsx`](/C:/Projects/FINQZ_PRO/src/pages/admin/Pipelines.tsx#L487)

### 2.7 Dependencia de pipelineCode

A tela usa `pipelineCode` como:

- campo exibido no header
- campo montado para pipelines customizados
- chave de display em settings legacy

Evidencia:

- [`src/pages/admin/Pipelines.tsx`](/C:/Projects/FINQZ_PRO/src/pages/admin/Pipelines.tsx#L50)
- [`src/pages/admin/Pipelines.tsx`](/C:/Projects/FINQZ_PRO/src/pages/admin/Pipelines.tsx#L213)
- [`src/pages/admin/Pipelines.tsx`](/C:/Projects/FINQZ_PRO/src/pages/admin/Pipelines.tsx#L300)

### 2.8 Dependencia de active

A tela usa `active` para:

- badge visual
- resumo
- toggle local

Evidencia:

- [`src/pages/admin/Pipelines.tsx`](/C:/Projects/FINQZ_PRO/src/pages/admin/Pipelines.tsx#L88)
- [`src/pages/admin/Pipelines.tsx`](/C:/Projects/FINQZ_PRO/src/pages/admin/Pipelines.tsx#L317)
- [`src/pages/admin/Pipelines.tsx`](/C:/Projects/FINQZ_PRO/src/pages/admin/Pipelines.tsx#L492)

---

## 3. Fluxo Futuro

O fluxo read-only futuro deve ser:

`src/pages/admin/Pipelines.tsx` -> `src/pages/admin/pipelines.adapter.ts` -> `src/api/modules/pipelines.api.ts` -> backend oficial

Isso significa:

- a tela nao conversa mais com `catalogRepository`;
- o adapter normaliza o contrato oficial para ViewModel da UI;
- `stageColors` permanece local e temporario;
- o backend oficial continua como fonte de verdade para `Pipeline/Stage`.

---

## 4. Matriz Legado -> Oficial

| Legado atual | Oficial futuro | Status |
|---|---|---|
| `getPipelineOptions()` | `pipelinesApi.getAll()` | `MIGRATE` |
| `loadPipelineSettings()` | `mapOfficialPipelinesToAdminViewModels()` | `MIGRATE` |
| `PipelineSettings` | `AdminPipelineViewModel` | `MIGRATE` |
| `defaultPipelineStages` | `Pipeline.stages` oficial | `MIGRATE` |
| `stageColors` em localStorage | `stageColors` UI-only temporario | `KEEP` |
| `pipelineCode` | derivado / removido da UI | `MIGRATE` |
| `active` legacy | `Pipeline.isActive` em leitura | `MIGRATE` |
| `savePipelineSettings()` | fora do read-only | `REMOVE LATER` |

Base oficial:

- [`src/pages/admin/pipelines.adapter.ts`](/C:/Projects/FINQZ_PRO/src/pages/admin/pipelines.adapter.ts#L1)
- [`src/api/modules/pipelines.api.ts`](/C:/Projects/FINQZ_PRO/src/api/modules/pipelines.api.ts#L7)
- [`backend/src/modules/pipelines/domain/pipeline.contract.ts`](/C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/domain/pipeline.contract.ts#L16)

---

## 5. Sequencia Segura de Migracao

### Wave 3A.1 - Introduzir leitura oficial via adapter

- conectar a tela ao adapter;
- manter apenas leitura;
- ainda nao remover toda a estrutura visual legada.

### Wave 3A.2 - Substituir listas e cards pelo ViewModel oficial

- renderizar `AdminPipelineViewModel`;
- renderizar `AdminPipelineStageViewModel`;
- derivar cores localmente.

### Wave 3A.3 - Remover dependencias diretas de catalogRepository

- eliminar leitura de `getPipelineOptions()`;
- eliminar `loadPipelineSettings()` como fonte da tela;
- eliminar `PipelineSettings` da tela.

### Wave 3A.4 - Fechar resquicios visuais

- remover uso de `pipelineCode` da UI se houver decisao de corte;
- manter `stageColors` apenas como UI state temporario.

---

## 6. Blockers

1. `pipelineCode` ainda aparece na UI atual.
2. `active` ainda é tratado como estado visual legado, nao como contrato de escrita oficial.
3. A tela ainda depende de `PipelineSettings`, que nasce de localStorage.
4. `stageColors` continua misturado com a persistencia legacy.

---

## 7. Riscos

- quebrar a apresentacao se `pipelineCode` for removido sem ajuste da UI;
- perder paridade visual se `stageColors` nao for mantido localmente na transicao;
- introduzir dependencia indireta de `catalogRepository` no adapter por engano;
- manter dois modelos concorrentes durante tempo demais e gerar drift.

---

## 8. GO / NO-GO

### Read-only migration

`GO`

### Write migration

`NO-GO`

Motivo:

- o contrato de escrita nao foi fechado nesta onda;
- a tela ainda depende de campos legados que precisam decisao de corte;
- a prioridade agora e ler oficial sem reintroduzir fonte paralela.

---

## 9. Decisao Final

A tela `src/pages/admin/Pipelines.tsx` pode migrar em modo **read-only** com risco controlado.

O caminho correto e:

- ler do backend oficial via adapter;
- manter `stageColors` como UI-only temporario;
- retirar `catalogRepository` da leitura da tela;
- deixar escrita para uma wave posterior, quando o contrato operacional estiver fechado.

