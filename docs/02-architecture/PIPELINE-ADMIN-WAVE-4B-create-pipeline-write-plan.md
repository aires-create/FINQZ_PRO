# PIPELINE-ADMIN-WAVE-4B - Create Pipeline Write Plan

Status: PLANEJADO  
Type: Architecture Plan / Write Path  
Scope: Admin / Pipelines / Create Only  
Date: 2026-06-23

---

## 1. Executive Verdict

`GO` apenas para a futura escrita de **Create Pipeline** como primeira onda controlada de write.

`NO-GO` para escrever qualquer outro fluxo nesta fase.

Base consolidada:

- [`PIPELINE-ADMIN-WAVE-1A`](/C:/Projects/FINQZ_PRO/docs/02-architecture/PIPELINE-ADMIN-WAVE-1A-official-api-surface-audit.md)
- [`PIPELINE-ADMIN-WAVE-1B`](/C:/Projects/FINQZ_PRO/docs/02-architecture/PIPELINE-ADMIN-WAVE-1B-client-contract-design.md)
- [`PIPELINE-ADMIN-WAVE-2D`](/C:/Projects/FINQZ_PRO/docs/02-architecture/PIPELINE-ADMIN-WAVE-2D-admin-contract-decision-matrix.md)
- [`PIPELINE-ADMIN-WAVE-3A`](/C:/Projects/FINQZ_PRO/docs/02-architecture/PIPELINE-ADMIN-WAVE-3A-read-only-migration-plan.md)
- [`PIPELINE-ADMIN-WAVE-4A`](/C:/Projects/FINQZ_PRO/docs/02-architecture/PIPELINE-ADMIN-WAVE-4A-write-migration-decision-matrix.md)

---

## 2. Fluxo Completo de Create Pipeline

### Fluxo funcional

1. O usuario aciona a criacao de pipeline na tela admin.
2. A UI coleta o minimo necessario para criacao:
   - `pipelineName`
   - `description` opcional
   - `isDefault` opcional
3. A tela usa o adapter para construir o payload oficial.
4. A tela chama o client oficial `pipelinesApi.createPipeline(...)`.
5. O backend valida permissao, tenant e schema HTTP.
6. O backend cria o pipeline.
7. A tela refaz a leitura oficial via `pipelinesApi.getAll()`.
8. O adapter remapeia o resultado para `AdminPipelineViewModel`.
9. A lista atualiza sem depender de `catalogRepository`, `localStorage` ou `PipelineSettings`.

### Fonte de verdade

- leitura: backend oficial de Pipeline;
- escrita: backend oficial de Pipeline;
- UI: apenas ViewModel derivado.

---

## 3. Payload Oficial Utilizado

O payload oficial da escrita de create deve ser:

- `name`
- `description?`
- `isDefault?`

Evidencias:

- [`src/api/modules/pipelines.api.ts`](/C:/Projects/FINQZ_PRO/src/api/modules/pipelines.api.ts#L29)
- [`backend/src/modules/pipelines/validators/pipeline.http.schema.ts`](/C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/validators/pipeline.http.schema.ts#L33)

### Classificacao

- `name`: `KEEP`
- `description`: `KEEP`
- `isDefault`: `KEEP`
- `pipelineCode`: `REMOVE LATER` / nao faz parte do payload
- `stageColors`: `REMOVE LATER` / nao faz parte do payload

---

## 4. Endpoint Oficial Utilizado

`POST /api/v1/pipelines`

Evidencias:

- [`src/api/modules/pipelines.api.ts`](/C:/Projects/FINQZ_PRO/src/api/modules/pipelines.api.ts#L64)
- [`backend/src/modules/pipelines/routes.ts`](/C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L113)
- [`backend/src/modules/pipelines/presentation/http/pipeline.http.contract.ts`](/C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/presentation/http/pipeline.http.contract.ts#L69)

### Classificacao

- endpoint oficial: `KEEP`
- endpoint legado: `REMOVE LATER`

---

## 5. Resposta Oficial Esperada

Resposta esperada da API:

- `success: true`
- `message`
- `data`

O `data` deve representar o pipeline criado, ou um envelope compatível com o contrato oficial do backend.

Evidencia:

- [`backend/src/modules/pipelines/routes.ts`](/C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L197)

### Classificacao

- `success`: `KEEP`
- `message`: `KEEP`
- `data`: `KEEP`
- envelope legado paralelo: `REMOVE LATER`

---

## 6. Atualizacao da Tela Apos Sucesso

Apos create bem-sucedido, a tela deve:

1. refazer a leitura oficial com `pipelinesApi.getAll()`;
2. remapear com `mapOfficialPipelinesToAdminViewModels()`;
3. atualizar a lista visivel;
4. manter `stageColors` apenas como UI-only temporario;
5. manter `pipelineCode` apenas como visual derivado, se ainda for exibido.

### Nao fazer

- nao atualizar via store;
- nao atualizar via `catalogRepository`;
- nao gravar em `localStorage`;
- nao inventar fallback legado.

---

## 7. Tratamento de Erros

### 7.1 Erro de validacao

- mostrar mensagem amigavel;
- destacar campos obrigatorios;
- nao fechar a tela;
- nao refazer leitura se o create falhar por validacao.

### 7.2 Erro de permissao

- mostrar mensagem de acesso negado;
- nao criar pipeline;
- nao alterar estado local de forma otimista.

### 7.3 Erro inesperado

- mostrar erro generico;
- manter o formulario aberto;
- permitir nova tentativa;
- nao sincronizar lista como se tivesse sucesso.

---

## 8. Estado Local Minimo Necessario

Para a primeira escrita, a tela precisa apenas de:

- estado do formulario de criacao;
- estado de loading da acao;
- estado de erro;
- refresh apos sucesso;
- ViewModel oficial da lista.

### Classificacao

- formulario local: `KEEP`
- loading/error local: `KEEP`
- cache legacy: `REMOVE LATER`
- state global legacy: `REMOVE LATER`

---

## 9. O que Nao Deve Ser Reutilizado do Legado

- `catalogRepository`
- `localStorage`
- `PipelineSettings`
- `getPipelineOptions()`
- `savePipelineSettings()`
- `loadPipelineSettings()`
- qualquer fluxo que dependa de `pipelineCode` como source of truth
- qualquer escrita em `store`

Classificacao:

- legado de leitura: `REMOVE LATER`
- legado de persistencia: `REMOVE LATER`
- legado visual temporario: `KEEP` apenas quando explicitamente UI-only

---

## 10. Criterios de Aceite da Futura Implementacao

A implementacao futura de create pipeline so sera aceita se:

- usar `pipelinesApi.createPipeline(...)`;
- usar o adapter oficial para recarregar a lista;
- nao depender de `catalogRepository`;
- nao depender de `localStorage`;
- nao reintroduzir `PipelineSettings`;
- nao escrever em `store`;
- nao usar `pipelineCode` como contrato;
- passar em `npx tsc --noEmit`;
- manter a tela funcional em leitura e criacao.

---

## 11. Criterios de Rollback

Rollback e necessario se:

- a criacao falhar e a tela ficar inconsistente;
- a lista nao recarregar apos sucesso;
- o contrato de payload for rejeitado pelo backend;
- surgir dependencia acidental de legado;
- `stageColors` ou `pipelineCode` vazarem para o payload.

### Acoes de rollback

- desabilitar a acao de create;
- voltar a exibir apenas leitura;
- manter o adapter e o client oficial intactos;
- nao reintroduzir fontes legadas.

---

## 12. Matriz de Classificacao

| Item | Classificacao | Observacao |
|---|---|---|
| create pipeline | `KEEP` | primeira escrita controlada |
| `pipelineApi.createPipeline` | `KEEP` | client oficial |
| `POST /api/v1/pipelines` | `KEEP` | endpoint oficial |
| resposta `success/message/data` | `KEEP` | contrato oficial |
| `pipelineCode` no payload | `REMOVE LATER` | nao pertence ao contrato |
| `stageColors` no payload | `REMOVE LATER` | UI-only |
| `catalogRepository` | `REMOVE LATER` | fora do fluxo oficial |
| `PipelineSettings` | `REMOVE LATER` | legado |
| `localStorage` | `REMOVE LATER` | legado |
| `store` | `REMOVE LATER` | legado |

---

## 13. Decisao Final

A primeira escrita oficial da tela admin deve ser **Create Pipeline בלבד** e nada mais.

O fluxo deve ser curto, previsivel e reversivel:

`UI -> adapter -> pipelinesApi.createPipeline -> backend oficial -> refresh via pipelinesApi.getAll -> adapter -> UI`

Sem escrever no legado, sem `localStorage`, sem `store`, sem `catalogRepository`.

