# PIPELINE-ADMIN-WAVE-2D - Admin Contract Decision Matrix

Status: DECIDIDO COM RESTRICOES
Type: Architecture Decision / Contract Matrix
Scope: Admin / Pipelines / Official Contract Closure
Date: 2026-06-23

---

## 1. Executive Verdict

`GO` para `read-only migration` na proxima onda, desde que a tela passe a ler o modelo oficial via adapter e nao volte a depender de `catalogRepository` ou `localStorage`.

`NO-GO` para `write migration` completa ainda nesta fase.

A migracao de escrita continua bloqueada por dois pontos de contrato:

- `pipelineCode` nao existe no modelo oficial;
- `active/isActive` precisa de decisao clara de fluxo de escrita no contrato HTTP antes de a tela admin assumir responsabilidade operacional.

---

## 2. Decisoes Pendentes e Encerramento

### 2.1 `pipelineCode`

**Decisao:** nao virar contrato oficial agora.

### Diretriz

- A UI pode **derivar** um identificador visual a partir do `pipelineId` ou de metadados locais do adapter.
- A UI nao deve persistir `pipelineCode` como source of truth.
- O campo nao deve ser enviado em payload oficial.

### Razao

O modelo oficial atual de `Pipeline` nao possui `code` no contrato de dominio ou no contrato HTTP.

Evidencias:

- [`src/api/modules/pipelines.api.ts`](/C:/Projects/FINQZ_PRO/src/api/modules/pipelines.api.ts#L7)
- [`backend/src/modules/pipelines/domain/pipeline.contract.ts`](/C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/domain/pipeline.contract.ts#L16)
- [`backend/src/modules/pipelines/validators/pipeline.http.schema.ts`](/C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/validators/pipeline.http.schema.ts#L33)

### Consequencia pratica

- `pipelineCode` fica fora do contrato oficial.
- A tela admin futura deve parar de tratar `pipelineCode` como campo operacional.

---

### 2.2 `active / isActive`

**Decisao:** usar `updatePipeline` para alterar o estado ativo, com `isActive` como campo de escrita do contrato oficial em fase futura.

### Diretriz

- `DELETE` continua reservado para **soft delete / archive** do pipeline.
- `updatePipeline` deve ser o ponto de escrita para `isActive` quando o contrato HTTP for expandido.
- Nao criar endpoint novo para isso.

### Razao

O dominio oficial ja conhece `isActive`, mas o contrato HTTP ainda nao o expoe como write path claro.

Evidencias:

- [`backend/src/modules/pipelines/domain/pipeline.contract.ts`](/C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/domain/pipeline.contract.ts#L16)
- [`backend/src/modules/pipelines/routes.ts`](/C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L208)
- [`backend/src/modules/pipelines/validators/pipeline.http.schema.ts`](/C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/validators/pipeline.http.schema.ts#L41)

### Consequencia pratica

- O toggle de ativo nao deve ser mapeado para `DELETE`.
- O contract layer futuro deve habilitar `isActive` em `updatePipeline`.
- A acao de delete continua sendo soft delete, sem conflitar com status ativo.

---

### 2.3 `stageColors`

**Decisao:** continua `UI-only temporario`.

### Diretriz

- `stageColors` fica restrito ao ViewModel da tela admin.
- `stageColors` nao entra em payload oficial.
- `stageColors` nao vira campo de dominio agora.

### Razao

Nao ha contrato backend oficial para cores de stage.

Evidencias:

- [`src/pages/admin/pipelines.adapter.ts`](/C:/Projects/FINQZ_PRO/src/pages/admin/pipelines.adapter.ts#L23)
- [`src/pages/admin/pipelines.adapter.ts`](/C:/Projects/FINQZ_PRO/src/pages/admin/pipelines.adapter.ts#L42)
- [`backend/src/modules/pipelines/domain/pipeline.contract.ts`](/C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/domain/pipeline.contract.ts#L1)

---

## 3. Escopo Minimo Permitido para Wave 3

### Read-only migration permitida

- ler pipelines oficiais via adapter;
- renderizar lista de pipelines oficiais;
- renderizar stages oficiais ordenados por `order ASC`;
- exibir estado `active`/`isDefault` em modo leitura;
- exibir `stageColors` apenas como decoracao UI local;
- manter o comportamento da tela sem gravar nada no backend.

### Componentes envolvidos

- [`src/pages/admin/Pipelines.tsx`](/C:/Projects/FINQZ_PRO/src/pages/admin/Pipelines.tsx#L21)
- [`src/pages/admin/pipelines.adapter.ts`](/C:/Projects/FINQZ_PRO/src/pages/admin/pipelines.adapter.ts#L1)
- [`src/api/modules/pipelines.api.ts`](/C:/Projects/FINQZ_PRO/src/api/modules/pipelines.api.ts#L7)

---

## 4. Escopo Proibido

- criar, editar, inativar ou excluir pipeline ainda sem contrato de escrita estabilizado;
- alterar `catalogRepository` ou `localStorage` como source of truth;
- usar `pipelineCode` como persistencia ou contrato oficial;
- enviar `stageColors` para backend;
- conectar `DELETE` ao toggle de ativo;
- introduzir novo endpoint sem decisao arquitetural formal.

---

## 5. GO / NO-GO

### 5.1 Read-only migration

`GO`

Motivo:

- o adapter ja consegue mapear o modelo oficial;
- a UI pode ler sem depender de `catalogRepository`;
- `stageColors` pode permanecer como decoracao local.

### 5.2 Write migration

`NO-GO`

Motivo:

- `pipelineCode` nao tem destino oficial;
- `active/isActive` ainda precisa de contrato de escrita fechado;
- escrever na tela admin sem fechar esse contrato aumenta risco de duplicidade e drift.

---

## 6. Matriz de Decisao

| Assunto | Decisao | Status |
|---|---|---|
| `pipelineCode` | derivado / UI-only temporario | `MIGRATE` |
| `active/isActive` | escrever via `updatePipeline` quando o contrato permitir | `MIGRATE` |
| `DELETE` | soft delete / archive | `KEEP` |
| `stageColors` | UI-only temporario | `KEEP` |
| read-only migration | permitida | `KEEP` |
| write migration completa | bloqueada por contrato | `BLOCKER` |

---

## 7. Critérios para Liberar a Proxima Wave de Escrita

A wave de escrita so deve iniciar quando:

- o contrato HTTP oficial de `updatePipeline` aceitar claramente `isActive`;
- a tela nao depender mais de `pipelineCode` como dado operacional;
- o adapter estiver sendo consumido pela tela admin;
- nao houver leitura funcional de `catalogRepository` ou `localStorage` para admin pipelines;
- o fluxo de delete estiver formalmente separado do toggle de ativo.

---

## 8. Decisao Final

`pipelineCode` nao vira contrato oficial agora, e deve ser tratado como derivado/UI-only temporario enquanto a migracao da tela admin avanca.

`active/isActive` deve ser tratado por `updatePipeline` em fase futura, com soft delete mantido em `DELETE`.

`stageColors` permanece UI-only temporario.

A proxima onda pode ser **read-only**, mas nao pode ser **write migration** completa ainda.
