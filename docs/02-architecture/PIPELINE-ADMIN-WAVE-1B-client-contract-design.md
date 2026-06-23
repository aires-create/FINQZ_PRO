# PIPELINE-ADMIN-WAVE-1B.A - Client Contract Design Review

Status: DRAFT  
Type: Architecture / Client Contract Design  
Scope: Frontend Pipeline API Surface / Future Implementation Contract  
Date: 2026-06-23

---

## 1. Executive Verdict

`GO WITH RESTRICTIONS` para desenhar o contrato do client oficial.

Motivos:

- o backend oficial de Pipeline ja cobre CRUD, Stage, reorder, RBAC e tenant scope;
- o client oficial atual ainda expõe somente leitura (`getAll`);
- a tela admin ainda nao deve ser migrada nesta etapa;
- `catalogRepository/localStorage` continuam em quarentena;
- o contrato do client precisa ser definido antes de qualquer implementacao runtime.

Conclusao:

- esta wave e de desenho de contrato;
- a implementacao futura pode avancar apenas se respeitar os payloads e responses definidos aqui;
- nenhuma mudanca runtime deve ocorrer nesta fase.

---

## 2. Metodos a Adicionar em `pipelines.api.ts`

Metodos futuros obrigatorios:

- `getAll()`
- `createPipeline(payload)`
- `updatePipeline(pipelineId, payload)`
- `deletePipeline(pipelineId)`
- `createStage(pipelineId, payload)`
- `updateStage(stageId, payload)`
- `deleteStage(stageId)`
- `reorderStages(pipelineId, payload)`

Classificacao:

- `KEEP` para `getAll()`
- `MIGRATE` para todos os metodos de escrita

---

## 3. Payload de `createPipeline`

Payload minimo futuro:

- `name: string`
- `description?: string | null`
- `isDefault?: boolean`

Regras:

- `name` obrigatorio e nao vazio;
- `description` pode ser `null` ou omitido;
- `isDefault` opcional;
- nao incluir `localStorage`, `stageColors` ou tipos legados de tela;
- nao incluir `stages` neste contrato de client sem decisao explicita backend/frontend.

Fonte contratual:

- `backend/src/modules/pipelines/validators/pipeline.http.schema.ts`

---

## 4. Payload de `updatePipeline`

Payload minimo futuro:

- `name?: string`
- `description?: string | null`
- `isDefault?: boolean`

Regras:

- payload parcial;
- nao enviar campos nao suportados pelo HTTP atual;
- manter semantica de update incremental;
- evitar expor `isActive` no client ate haver decisao contratual explicita para a UI admin.

Fonte contratual:

- `backend/src/modules/pipelines/validators/pipeline.http.schema.ts`

---

## 5. Payload de `delete/deactivatePipeline`

Payload:

- nenhum corpo

Path:

- `pipelineId: string`

Semantica:

- delete HTTP corresponde a desativacao/remocao logica no backend;
- o client deve tratar a operacao como `soft delete` sem inferir hard delete.

Fonte contratual:

- `backend/src/modules/pipelines/routes.ts`
- `backend/src/modules/pipelines/presentation/http/pipeline.http.contract.ts`

---

## 6. Payload de `createStage`

Payload minimo futuro:

- `name: string`
- `order: number`
- `isWon: boolean`
- `isLost: boolean`

Path:

- `pipelineId: string`

Regras:

- `name` obrigatorio;
- `order` deve ser inteiro >= 1;
- `isWon` e `isLost` nao podem ser `true` ao mesmo tempo;
- o client nao deve adicionar campos extras sem contrato formal.

Fonte contratual:

- `backend/src/modules/pipelines/validators/pipeline.http.schema.ts`

---

## 7. Payload de `updateStage`

Payload minimo futuro:

- `name?: string`
- `order?: number`
- `isWon?: boolean`
- `isLost?: boolean`

Path:

- `stageId: string`

Regras:

- payload parcial;
- `order` deve respeitar a validacao do backend;
- `isWon` e `isLost` permanecem mutuamente exclusivos;
- o client deve preservar a identidade do stage fora do payload.

Fonte contratual:

- `backend/src/modules/pipelines/validators/pipeline.http.schema.ts`

---

## 8. Payload de `delete/deactivateStage`

Payload:

- nenhum corpo

Path:

- `stageId: string`

Semantica:

- delete HTTP corresponde a desativacao/remocao logica;
- o client nao deve assumir exclusao fisica.

Fonte contratual:

- `backend/src/modules/pipelines/routes.ts`
- `backend/src/modules/pipelines/presentation/http/pipeline.http.contract.ts`

---

## 9. Payload de `reorderStages`

Payload minimo futuro:

- `stages: Array<{ stageId: string; order: number }>`

Path:

- `pipelineId: string`

Regras:

- a lista nao pode ser vazia;
- `stageId` deve ser UUID;
- `order` deve ser inteiro >= 1;
- o client deve mandar a ordem final desejada, nao delta parcial;
- o client nao deve depender de heuristica de UI para deduzir a ordem canonica.

Fonte contratual:

- `backend/src/modules/pipelines/validators/pipeline.http.schema.ts`

---

## 10. Response Esperada por Metodo

| Metodo | Response esperada | Observacao |
|---|---|---|
| `getAll()` | `ApiSuccess<Pipeline[]>` ou payload bruto equivalente | manter compatibilidade com telas legadas |
| `createPipeline()` | `ApiSuccess<Pipeline>` com `message` | status 201 |
| `updatePipeline()` | `ApiSuccess<Pipeline>` com `message` | status 200 |
| `deletePipeline()` | `ApiSuccess<{ id: string }>` com `message` | status 200 |
| `createStage()` | `ApiSuccess<Stage>` com `message` | status 201 |
| `updateStage()` | `ApiSuccess<Stage>` com `message` | status 200 |
| `deleteStage()` | `ApiSuccess<{ id: string }>` com `message` | status 200 |
| `reorderStages()` | `ApiSuccess<Stage[]>` com `message` | status 200 |

Regras:

- o client deve preservar o envelope padrão do backend;
- o client nao deve transformar silenciosamente o payload retornado;
- o client pode oferecer tipagens auxiliares, mas nao pode alterar o shape da resposta oficial.

---

## 11. Mapeamento Endpoint Backend -> Metodo Frontend

| Endpoint backend | Metodo frontend |
|---|---|
| `GET /api/v1/pipelines` | `getAll()` |
| `POST /api/v1/pipelines` | `createPipeline()` |
| `PUT /api/v1/pipelines/:pipelineId` | `updatePipeline()` |
| `DELETE /api/v1/pipelines/:pipelineId` | `deletePipeline()` |
| `POST /api/v1/pipelines/:pipelineId/stages` | `createStage()` |
| `PUT /api/v1/pipelines/stages/:stageId` | `updateStage()` |
| `DELETE /api/v1/pipelines/stages/:stageId` | `deleteStage()` |
| `PATCH /api/v1/pipelines/:pipelineId/stages/reorder` | `reorderStages()` |

Classificacao:

- `KEEP` para leitura
- `MIGRATE` para escrita e reorder

---

## 12. Tratamento de Erro

O client futuro deve tratar os erros sem mascarar o contrato backend.

Erros esperados:

- `400` validation error
- `401` unauthorized
- `403` forbidden
- `404` not found
- `500` internal server error

Regras:

- repassar o status e o payload de erro quando possivel;
- nao converter erros de dominio em mensagens genéricas de UI dentro do client;
- manter a responsabilidade de notificação na camada de consumo;
- nao engolir erro de tenant/RBAC.

Classificacao:

- `KEEP`

---

## 13. Tipagens Locais Permitidas

Permitido criar no client:

- tipos de payload para cada metodo;
- tipos de response por metodo;
- tipos auxiliares para `Stage` e `Pipeline` usados pelo client;
- tipos de envelope de erro padrao.

Permitido manter:

- payload bruto do backend em `getAll()`;
- tipagens de compatibilidade enquanto a migração nao conclui.

Proibido:

- tipagens que dependam de `PipelineSettings`;
- tipagens que tragam `localStorage` para dentro do client oficial;
- tipagens que assumam `stageColors` como contrato backend sem decisao formal.

---

## 14. Escopo Permitido da Implementacao Seguinte

Permitido:

- implementar os metodos listados neste documento em `src/api/modules/pipelines.api.ts`;
- tipar os payloads e responses;
- manter compatibilidade com o backend oficial;
- preservar `getAll()` e o payload bruto se necessario.

Proibido:

- migrar `src/pages/admin/Pipelines.tsx` nesta wave;
- alterar backend;
- alterar `catalogRepository`;
- alterar `store`;
- alterar schema/migrations;
- introduzir novos fallbacks legados.

---

## 15. Escopo Proibido

- runtime migration da tela admin antes do client ficar completo;
- hard delete sem contrato backend;
- expor `PipelineSettings` no client oficial;
- introduzir `stageColors` como dado oficial sem decisao;
- tratar a API oficial como se ja estivesse pronta para escrita sem implementar os metodos.

---

## 16. Critérios de GO / NO-GO

### GO

- contrato dos metodos e payloads definido;
- responses alinhadas ao backend;
- tratamento de erro definido;
- tipagens locais separadas do legado;
- nenhum runtime alterado.

### NO-GO

- qualquer tentativa de migrar a tela admin antes da expansao do client;
- qualquer payload que invente campos nao confirmados;
- qualquer acoplamento com `PipelineSettings` ou `localStorage` no client oficial.

Classificacao final:

- `KEEP` para `getAll()`
- `MIGRATE` para os novos metodos
- `BLOCKER` para a migracao runtime da tela admin sem este contrato implementado

