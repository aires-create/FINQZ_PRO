# PIPELINE-ADMIN-WAVE-1A - Official Pipeline API Surface Audit

Status: APPROVED WITH RESTRICTIONS  
Type: Architecture Audit / Contract Surface Review  
Scope: Pipeline API Surface / Admin Migration Readiness / RBAC / Tenant Isolation  
Date: 2026-06-23

---

## 1. Executive Verdict

`NO-GO` para a Wave 1 de expansao da tela Admin de Pipeline neste instante.

Motivos confirmados pela auditoria:

- `src/api/modules/pipelines.api.ts` expõe apenas leitura (`getAll`);
- o backend oficial já expõe a superfície completa de CRUD, stage management e reorder;
- o contrato HTTP oficial ainda não foi espelhado no client frontend;
- a tela admin continua dependente de `catalogRepository/localStorage`;
- a surface de escrita precisa ser adicionada ao client antes de qualquer migração runtime.

Conclusão arquitetural:

- backend oficial está pronto como owner do domínio;
- o client oficial está incompleto;
- a próxima wave deve expandir `pipelines.api.ts` sem mexer na tela admin ainda;
- `catalogRepository` e `localStorage` seguem como quarentena, não como source of truth.

---

## 2. Frontend API Surface Atual

### `src/api/modules/pipelines.api.ts`

Métodos existentes hoje:

- `getAll()`

Características observadas:

- usa `apiCall()` com base em `/api/v1/pipelines`;
- mantém payload bruto do backend;
- não expõe métodos de escrita;
- não expõe reorder;
- não expõe wrappers explícitos para pipeline/stage create/update/delete.

Fonte:

- [`src/api/modules/pipelines.api.ts`](C:/Projects/FINQZ_PRO/src/api/modules/pipelines.api.ts#L8)

### Métodos faltantes para a tela admin

- `createPipeline`
- `updatePipeline`
- `deletePipeline` ou `deactivatePipeline`
- `createStage`
- `updateStage`
- `deleteStage` ou `deactivateStage`
- `reorderStages`

Classificação:

- `KEEP` para leitura atual
- `MIGRATE` para a tela admin
- `BLOCKER` para migração runtime sem escrita oficial no client

---

## 3. Backend Endpoint Matrix

| Operacao | Endpoint | Status |
|---|---|---|
| listar pipelines | `GET /api/v1/pipelines` | existente |
| criar pipeline | `POST /api/v1/pipelines` | existente |
| atualizar pipeline | `PUT /api/v1/pipelines/:pipelineId` | existente |
| remover/inativar pipeline | `DELETE /api/v1/pipelines/:pipelineId` | existente |
| criar stage | `POST /api/v1/pipelines/:pipelineId/stages` | existente |
| atualizar stage | `PUT /api/v1/pipelines/stages/:stageId` | existente |
| remover/inativar stage | `DELETE /api/v1/pipelines/stages/:stageId` | existente |
| reordenar stages | `PATCH /api/v1/pipelines/:pipelineId/stages/reorder` | existente |

Fontes:

- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L95)
- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L113)
- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L208)
- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L281)
- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L336)
- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L411)
- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L488)
- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L543)

Classificação:

- `KEEP`

---

## 4. DTO / Payload Matrix

### Create Pipeline

HTTP body esperado:

- `name: string`
- `description?: string | null`
- `isDefault?: boolean`

Observação:

- a camada de domain/service aceita mais campos internamente (`isActive`, `stages`), mas o contract HTTP atual não os expõe.

Fonte:

- [`backend/src/modules/pipelines/validators/pipeline.http.schema.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/validators/pipeline.http.schema.ts#L33)
- [`backend/src/modules/pipelines/domain/pipeline.contract.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/domain/pipeline.contract.ts#L1)

### Update Pipeline

HTTP body esperado:

- `name?: string`
- `description?: string | null`
- `isDefault?: boolean`

Observação:

- `isActive` existe no contract de domínio/service, mas não está exposto na rota HTTP atual.

Fonte:

- [`backend/src/modules/pipelines/validators/pipeline.http.schema.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/validators/pipeline.http.schema.ts#L41)
- [`backend/src/modules/pipelines/domain/pipeline.contract.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/domain/pipeline.contract.ts#L1)

### Delete / Deactivate Pipeline

HTTP payload:

- nenhum corpo

Path params:

- `pipelineId: uuid`

Fonte:

- [`backend/src/modules/pipelines/validators/pipeline.http.schema.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/validators/pipeline.http.schema.ts#L18)
- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L281)

### Create Stage

HTTP body esperado:

- `name: string`
- `order: number`
- `isWon: boolean`
- `isLost: boolean`

Path params:

- `pipelineId: uuid`

Fonte:

- [`backend/src/modules/pipelines/validators/pipeline.http.schema.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/validators/pipeline.http.schema.ts#L49)
- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L336)

### Update Stage

HTTP body esperado:

- `name?: string`
- `order?: number`
- `isWon?: boolean`
- `isLost?: boolean`

Path params:

- `stageId: uuid`

Fonte:

- [`backend/src/modules/pipelines/validators/pipeline.http.schema.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/validators/pipeline.http.schema.ts#L67)
- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L411)

### Delete / Deactivate Stage

HTTP payload:

- nenhum corpo

Path params:

- `stageId: uuid`

Fonte:

- [`backend/src/modules/pipelines/validators/pipeline.http.schema.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/validators/pipeline.http.schema.ts#L25)
- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L488)

### Reorder Stages

HTTP body esperado:

- `stages: Array<{ stageId: uuid; order: number }>`

Path params:

- `pipelineId: uuid`

Fonte:

- [`backend/src/modules/pipelines/validators/pipeline.http.schema.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/validators/pipeline.http.schema.ts#L85)
- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L543)

Classificação:

- `KEEP`

---

## 5. Response Matrix

| Operacao | Response backend | Observacao |
|---|---|---|
| `GET /api/v1/pipelines` | `{ success: true, data: PipelineContract[] }` | sem `message` |
| `POST /api/v1/pipelines` | `{ success: true, message, data: PipelineContract }` | status `201` |
| `PUT /api/v1/pipelines/:pipelineId` | `{ success: true, message, data: PipelineContract }` | status `200` |
| `DELETE /api/v1/pipelines/:pipelineId` | `{ success: true, message, data: { id } }` | status `200` |
| `POST /api/v1/pipelines/:pipelineId/stages` | `{ success: true, message, data: StageContract }` | status `201` |
| `PUT /api/v1/pipelines/stages/:stageId` | `{ success: true, message, data: StageContract }` | status `200` |
| `DELETE /api/v1/pipelines/stages/:stageId` | `{ success: true, message, data: { id } }` | status `200` |
| `PATCH /api/v1/pipelines/:pipelineId/stages/reorder` | `{ success: true, message, data: StageContract[] }` | status `200` |

Fonte:

- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L95)
- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L195)
- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L268)
- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L321)
- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L398)
- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L475)
- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L528)
- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L610)

Classificação:

- `KEEP`

---

## 6. RBAC / Permission Matrix

| Operacao | Permissao | Status |
|---|---|---|
| listar pipelines | `pipeline:read` | existente |
| criar pipeline | `pipeline:create` | existente |
| atualizar pipeline | `pipeline:update` | existente |
| remover/inativar pipeline | `pipeline:delete` | existente |
| criar stage | `stage:create` | existente |
| atualizar stage | `stage:update` | existente |
| remover/inativar stage | `stage:delete` | existente |
| reordenar stages | `stage:update` | existente |

Fontes:

- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L95)
- [`backend/src/modules/pipelines/presentation/http/pipeline.http.contract.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/presentation/http/pipeline.http.contract.ts#L12)

Classificação:

- `KEEP`

---

## 7. Tenant / Auth Matrix

### Auth e tenant middleware

Todas as rotas de Pipeline recebem:

- `authenticate`
- `tenantContextMiddleware`

Fontes:

- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L90)

### Escopo de tenant

O service e o repository sempre filtram por:

- `tenantId`
- `deletedAt: null`

Fontes:

- [`backend/src/modules/pipelines/service.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/service.ts#L65)
- [`backend/src/modules/pipelines/repository.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/repository.ts#L92)

Classificação:

- `KEEP`

---

## 8. Audit Matrix

### Existe audit log para create/update/delete/reorder?

Não há evidência de escrita explícita em audit log no módulo de Pipeline.

Observações:

- os testes e o código auditado não mostram `auditLog.create` nem integração dedicada de auditoria para Pipeline;
- a camada de rota registra erro via logger, mas isso não é audit log de negócio.

Classificação:

- `UNKNOWN / NEEDS DECISION`

Fontes:

- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L1)
- [`backend/src/tests/unit/pipelines/pipeline.routes.test.ts`](C:/Projects/FINQZ_PRO/backend/src/tests/unit/pipelines/pipeline.routes.test.ts#L1)

---

## 9. Test Coverage Matrix

### Testes encontrados

- `backend/src/tests/unit/pipelines/pipeline.routes.test.ts`
- `backend/src/tests/unit/pipelines/pipeline.service.test.ts`
- `backend/src/tests/unit/pipelines/pipeline.repository.test.ts`
- `backend/src/tests/unit/pipelines/pipeline.http.contract.test.ts`
- `backend/src/tests/unit/pipelines/pipeline.contract.test.ts`

### Cobertura observada

- rotas com permissões e validação de payload;
- service com validações de nome, order, won/lost, tenant scope e reorder;
- repository com tenant filtering e soft delete;
- contract com schemas e permissions;
- ausência de evidência de testes de audit log;
- ausência de evidência de testes de client frontend para a futura expansão de `pipelines.api.ts`.

Classificação:

- `KEEP` para o backend existente
- `BLOCKER` para migração runtime sem expansão do client

Fontes:

- [`backend/src/tests/unit/pipelines/pipeline.routes.test.ts`](C:/Projects/FINQZ_PRO/backend/src/tests/unit/pipelines/pipeline.routes.test.ts#L1)
- [`backend/src/tests/unit/pipelines/pipeline.service.test.ts`](C:/Projects/FINQZ_PRO/backend/src/tests/unit/pipelines/pipeline.service.test.ts#L1)
- [`backend/src/tests/unit/pipelines/pipeline.repository.test.ts`](C:/Projects/FINQZ_PRO/backend/src/tests/unit/pipelines/pipeline.repository.test.ts#L1)
- [`backend/src/tests/unit/pipelines/pipeline.http.contract.test.ts`](C:/Projects/FINQZ_PRO/backend/src/tests/unit/pipelines/pipeline.http.contract.test.ts#L1)

---

## 10. Gap Analysis

### Gaps confirmados

- `src/api/modules/pipelines.api.ts` não expõe escrita;
- não há wrapper para pipeline create/update/delete;
- não há wrapper para stage create/update/delete/reorder;
- o backend HTTP não expõe `isActive` no update pipeline body;
- o backend HTTP não expõe `isActive` no create pipeline body;
- o backend HTTP não expõe `stages` em create/update pipeline body;
- o client oficial não acompanha a surface completa do backend;
- a tela admin continua operando em `catalogRepository/localStorage`.

### Gaps de contrato entre service e HTTP

- o `domain/service` suporta `isActive` e `stages` no input de pipeline;
- o `HTTP contract` não expõe esses campos;
- essa diferença deve ser tratada como internals do backend, não como capacidade consumível do client.

### Endpoint backend que não deve ser exposto ainda?

Não há evidência de endpoint oficial que precise ser bloqueado do client por segurança de domínio.

O que existe é uma diferença entre:

- capacidade interna do service
- e payload oficialmente exposto via HTTP

Classificação:

- `UNKNOWN / NEEDS DECISION` para qualquer expansão futura de campos extras como `stages` no body de create/update pipeline.

---

## 11. Métodos mínimos para `pipelines.api.ts`

Para a próxima wave, o mínimo seguro é implementar no client oficial:

- `getAll()`
- `createPipeline(payload)`
- `updatePipeline(id, payload)`
- `deletePipeline(id)`
- `createStage(pipelineId, payload)`
- `updateStage(stageId, payload)`
- `deleteStage(stageId)`
- `reorderStages(pipelineId, payload)`

Recomendação adicional:

- manter o `payload bruto` retornado pelo backend para não quebrar a compatibilidade de telas legadas;
- expor tipos explícitos para cada payload;
- não incorporar mapeamentos de `localStorage` no client oficial.

Classificação:

- `KEEP` para leitura existente
- `MIGRATE` para a próxima wave

---

## 12. Escopo Permitido da Próxima Wave

Permitido:

- expandir apenas `src/api/modules/pipelines.api.ts`;
- criar tipos auxiliares do client;
- mapear HTTP params/body de acordo com o contrato backend;
- manter a tela admin inalterada até o client ficar completo;
- documentar adaptações necessárias para a tela admin.

Proibido:

- migrar `src/pages/admin/Pipelines.tsx` nesta fase;
- alterar `catalogRepository`;
- alterar `store`;
- alterar backend;
- alterar schema/migrations;
- criar novos mocks;
- introduzir fonte paralela.

---

## 13. Escopo Proibido

- runtime migration da tela admin antes do client oficial completo;
- inferir campos não evidenciados no contrato HTTP;
- tratar `stageColors` como dado oficial sem decisão;
- expor write APIs sem RBAC e tenant context;
- alterar backend para acomodar a tela antes do client.

---

## 14. GO / NO-GO

### GO

Só quando:

- `pipelines.api.ts` expuser toda a surface mínima de escrita;
- o contrato de payload estiver alinhado ao backend HTTP;
- o admin tiver caminho explícito de leitura e escrita sem `localStorage`.

### NO-GO

Hoje, porque:

- o client oficial ainda é somente leitura;
- a tela admin ainda depende de legado;
- a migração runtime ainda não tem superfície pronta no frontend.

Classificação final:

- `BLOCKER` para a migração runtime imediata;
- `KEEP` para o backend oficial existente;
- `MIGRATE` para o client e a tela admin em ondas futuras.

---

## 15. Próxima Ação Recomendada

Expandir `src/api/modules/pipelines.api.ts` com os métodos mínimos listados acima, mantendo o payload bruto e sem tocar na tela admin ainda.

Somente depois disso a Wave 1 da migração da administração de pipelines pode sair de `NO-GO` para `GO WITH RESTRICTIONS`.

