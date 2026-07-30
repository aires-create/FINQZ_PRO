# PIPELINE-ADMIN-WAVE-5A - Stage Creation Readiness Audit

## Executive Verdict
**BLOCKER**

O backend oficial já expõe contrato completo para Stage, o client oficial já cobre `createStage()`, e o adapter já possui `buildCreateStagePayload()`. O bloqueio restante é de produto/UI: a tela `Admin/Pipelines` ainda não possui fluxo de criação de Stage, nem estado/modal/form para essa escrita.

## 1. Existe endpoint oficial para create stage?

### Evidência
- `backend/src/modules/pipelines/routes.ts:336-391`
- `backend/src/modules/pipelines/presentation/http/pipeline.http.contract.ts:43-45`

### Resposta
Sim.

Endpoint oficial:
- `POST /api/v1/pipelines/:pipelineId/stages`

## 2. Qual método HTTP e path oficial?

### Evidência
- `backend/src/modules/pipelines/presentation/http/pipeline.http.contract.ts:43-45, 96-102`
- `backend/src/modules/pipelines/routes.ts:336-391`

### Resposta
- Método: `POST`
- Path: `/api/v1/pipelines/:pipelineId/stages`

## 3. Qual payload oficial esperado?

### Evidência
- `backend/src/modules/pipelines/validators/pipeline.http.schema.ts:49-63`
- `backend/src/modules/pipelines/routes.ts:358-370, 390-391`

### Resposta
Payload de criação:

```ts
{
  name: string;
  order: number;
  isWon: boolean;
  isLost: boolean;
}
```

## 4. Quais campos são obrigatórios?

### Evidência
- `backend/src/modules/pipelines/validators/pipeline.http.schema.ts:49-63`

### Resposta
Obrigatórios:
- `name`
- `order`
- `isWon`
- `isLost`

Regras adicionais:
- `name` precisa ter pelo menos 1 caractere após `trim`
- `order` precisa ser inteiro `>= 1`
- `isWon` e `isLost` não podem ser `true` ao mesmo tempo

## 5. Quais campos são opcionais?

### Resposta
Nenhum no `createStage`.

Para `updateStage`, os campos tornam-se opcionais:
- `name`
- `order`
- `isWon`
- `isLost`

### Evidência
- `backend/src/modules/pipelines/validators/pipeline.http.schema.ts:67-80`

## 6. Existe suporte a `order`?

### Resposta
Sim.

### Evidência
- `backend/src/modules/pipelines/validators/pipeline.http.schema.ts:49-63`
- `backend/src/modules/pipelines/service.ts:130-149`
- `backend/src/modules/pipelines/repository.ts:193-208`

## 7. Existe suporte a `isWon`?

### Resposta
Sim.

### Evidência
- `backend/src/modules/pipelines/validators/pipeline.http.schema.ts:49-63`
- `backend/src/modules/pipelines/domain/pipeline.contract.ts:7-18`
- `backend/src/modules/pipelines/repository.ts:199-205`

## 8. Existe suporte a `isLost`?

### Resposta
Sim.

### Evidência
- `backend/src/modules/pipelines/validators/pipeline.http.schema.ts:49-63`
- `backend/src/modules/pipelines/domain/pipeline.contract.ts:7-18`
- `backend/src/modules/pipelines/repository.ts:199-205`

## 9. Existe soft delete de stage?

### Resposta
Sim.

### Evidência
- `backend/src/modules/pipelines/routes.ts:487-539`
- `backend/src/modules/pipelines/service.ts:182-188`
- `backend/src/modules/pipelines/repository.ts:229-241`

### Leitura
`DELETE /api/v1/pipelines/stages/:stageId` marca `deletedAt` e não remove fisicamente o registro.

## 10. Existe update stage?

### Resposta
Sim.

### Evidência
- `backend/src/modules/pipelines/routes.ts:411-481`
- `backend/src/modules/pipelines/presentation/http/pipeline.http.contract.ts:50-52, 105-111`
- `src/api/modules/pipelines.api.ts:103-108`
- `src/pages/admin/pipelines.adapter.ts:224-247`

## 11. Existe reorder stages?

### Resposta
Sim.

### Evidência
- `backend/src/modules/pipelines/routes.ts:543-618`
- `backend/src/modules/pipelines/presentation/http/pipeline.http.contract.ts:63-65, 123-129`
- `src/api/modules/pipelines.api.ts:116-121`
- `src/pages/admin/pipelines.adapter.ts:249-257`

## 12. Existe RBAC específico para stage?

### Resposta
Sim.

Permissões:
- `stage:create`
- `stage:update`
- `stage:delete`

### Evidência
- `backend/src/modules/pipelines/routes.ts:336-543`
- `backend/src/modules/pipelines/presentation/http/pipeline.http.contract.ts:15-18, 43-64`

## 13. Existe tenantContextMiddleware nas rotas de stage?

### Resposta
Sim.

### Evidência
- `backend/src/modules/pipelines/routes.ts:90-91`
- `backend/src/modules/pipelines/routes.ts:336-618`

## 14. Existe audit log para create/update/delete/reorder stage?

### Resposta
**UNKNOWN / NEEDS DECISION**

### Evidência
- não há referência explícita a `registerAuditLog` ou `auditLog` nos arquivos auditados do módulo `pipelines`

### Leitura
O módulo cobre o contrato e o fluxo funcional, mas nesta auditoria não foi localizada prova de auditoria explícita no caminho de Stage.

## 15. O client frontend `pipelines.api.ts` já cobre `createStage`?

### Resposta
Sim.

### Evidência
- `src/api/modules/pipelines.api.ts:96-121`

### Leitura
O client já expõe:
- `createStage(pipelineId, payload)`
- `updateStage(stageId, payload)`
- `deleteStage(stageId)`
- `reorderStages(pipelineId, payload)`

## 16. O adapter `pipelines.adapter.ts` já possui `buildCreateStagePayload`?

### Resposta
Sim.

### Evidência
- `src/pages/admin/pipelines.adapter.ts:211-223`

### Leitura
O adapter já gera o payload oficial para criação de Stage e também possui:
- `buildUpdateStagePayload`
- `buildReorderStagesPayload`

## 17. A tela `Admin/Pipelines.tsx` tem UI/estado/modal para create stage?

### Resposta
Não.

### Evidência
- `src/pages/admin/Pipelines.tsx:2`
- `src/pages/admin/Pipelines.tsx:163`
- `src/pages/admin/Pipelines.tsx:246`
- `src/pages/admin/Pipelines.tsx:315-374`

### Leitura
A tela atualmente tem:
- leitura oficial de pipelines
- modal de criação de pipeline
- renderização das etapas existentes

Mas não há:
- botão de criar stage
- modal de criar stage
- estado local de stage create
- submit de `createStage()`

## 18. O CRM/Pipeline consome stages oficiais corretamente após criação?

### Resposta
Parcialmente sim.

### Evidência
- `src/pages/Oportunidades.tsx:661-718`
- `src/pages/Oportunidades.tsx:2050-2149`
- `src/pages/Oportunidades.tsx:2276`

### Leitura
O CRM/Pipeline já consome stages oficiais vindos de `pipelinesApi.getAll()`, mas a tela operacional continua dependendo da validade de `etapasAtivas`.

Consequência:
- pipeline com stages criados deve aparecer corretamente
- pipeline sem stages continua com UX separada após o ajuste anterior

## 19. Quais blockers existem antes de implementar create stage?

### Blockers
- ausência de UI/estado/modal em `src/pages/admin/Pipelines.tsx`
- ausência de fluxo de submissão para Stage na tela admin
- necessidade de decidir a UX mínima do formulário de Stage:
  - nome
  - order
  - `isWon`
  - `isLost`
- necessidade de decidir a estratégia pós-sucesso:
  - recarregar `getAll()` + adapter
  - ou atualizar localmente

### Classificação
- backend Stage contract: **KEEP**
- client `createStage`: **KEEP**
- adapter `buildCreateStagePayload`: **KEEP**
- admin UI atual: **BLOCKER**

## 20. Qual menor wave segura para habilitar create stage?

### Resposta
A menor wave segura é:
- adicionar somente a UI de create stage em `src/pages/admin/Pipelines.tsx`
- consumir `buildCreateStagePayload()`
- chamar `pipelinesApi.createStage(pipelineId, payload)`
- recarregar `pipelinesApi.getAll()` + adapter após sucesso

Sem expandir para:
- update stage
- delete stage
- reorder stage
- edição de pipeline

## Frontend Client Matrix

| Item | Estado | Classificação |
|---|---|---|
| `createStage()` | Existe | KEEP |
| `updateStage()` | Existe | KEEP |
| `deleteStage()` | Existe | KEEP |
| `reorderStages()` | Existe | KEEP |

### Evidência
- `src/api/modules/pipelines.api.ts:96-121`

## Adapter Matrix

| Item | Estado | Classificação |
|---|---|---|
| `buildCreateStagePayload()` | Existe | KEEP |
| `buildUpdateStagePayload()` | Existe | KEEP |
| `buildReorderStagesPayload()` | Existe | KEEP |

### Evidência
- `src/pages/admin/pipelines.adapter.ts:211-257`

## Backend Stage Contract Matrix

| Operação | Método | Path | Permissão | Estado |
|---|---|---|---|---|
| Create | POST | `/api/v1/pipelines/:pipelineId/stages` | `stage:create` | KEEP |
| Update | PUT | `/api/v1/pipelines/stages/:stageId` | `stage:update` | KEEP |
| Delete | DELETE | `/api/v1/pipelines/stages/:stageId` | `stage:delete` | KEEP |
| Reorder | PATCH | `/api/v1/pipelines/:pipelineId/stages/reorder` | `stage:update` | KEEP |

### Evidência
- `backend/src/modules/pipelines/presentation/http/pipeline.http.contract.ts:43-64, 96-129`
- `backend/src/modules/pipelines/routes.ts:336-618`

## Admin UI Readiness Matrix

| Item | Estado atual | Classificação |
|---|---|---|
| Modal de create stage | Não existe | BLOCKER |
| Estado local de stage create | Não existe | BLOCKER |
| Botão de create stage | Não existe | BLOCKER |
| Consumo de `createStage()` | Não existe | BLOCKER |
| Consumo de `buildCreateStagePayload()` | Não existe | BLOCKER |
| Visualização de stages existentes | Existe | KEEP |

### Evidência
- `src/pages/admin/Pipelines.tsx:246-374`

## CRM/Pipeline Consumer Impact

Impacto esperado após create stage:
- `src/pages/Oportunidades.tsx` passa a receber `stages` oficiais mais completos
- o seletor e o mapeamento de etapas ficam alinhados ao backend oficial
- o estado vazio de pipeline sem etapas deixa de aparecer para pipelines já configurados

### Evidência
- `src/pages/Oportunidades.tsx:707-718`
- `src/pages/Oportunidades.tsx:2050-2151`

## RBAC/Tenant Matrix

| Item | Estado | Classificação |
|---|---|---|
| `authenticate` global | Existe | KEEP |
| `tenantContextMiddleware` global | Existe | KEEP |
| `stage:create` | Existe | KEEP |
| `stage:update` | Existe | KEEP |
| `stage:delete` | Existe | KEEP |

### Evidência
- `backend/src/modules/pipelines/routes.ts:90-91, 336-618`

## Audit Matrix

| Operação | Evidência de audit log | Estado |
|---|---|---|
| Create stage | Não localizada | UNKNOWN / NEEDS DECISION |
| Update stage | Não localizada | UNKNOWN / NEEDS DECISION |
| Delete stage | Não localizada | UNKNOWN / NEEDS DECISION |
| Reorder stages | Não localizada | UNKNOWN / NEEDS DECISION |

## Blockers

- ausência de UI de stage creation na tela admin
- ausência de estado local e modal de stage creation
- ausência de decisão operacional sobre UX de criação inicial de stage
- auditoria de log não evidenciada neste recorte

## Riscos

- criar stage sem recarregar a lista pode deixar a UI inconsistente
- adicionar stage em pipeline recém-criado sem validar seleção correta pode enviar o payload para o pipeline errado
- reusar a abstração de pipeline create para stage pode misturar estados de UI

## GO/NO-GO

**NO-GO** para implementar create stage imediatamente sem antes desenhar a UI mínima e o pós-sucesso.

**GO** para a próxima wave apenas se ela ficar restrita a:
- modal de create stage
- payload builder já existente
- `pipelinesApi.createStage()`
- reload de `getAll()` + adapter após sucesso

## Próxima wave recomendada

**PIPELINE-ADMIN-WAVE-5B - Create Stage UI Contract**

Objetivo:
- definir a UI mínima para criação de Stage na tela Administração → Pipelines, sem tocar em update/delete/reorder.
