# PIPELINE-ADMIN-WAVE-5F - Stage RBAC HML Backfill Audit

## Executive Verdict
**GO WITH RESTRICTIONS**

O domínio Pipeline está correto no runtime e no contrato HTTP. A inconsistência está no estado materializado do banco HML, onde as permissões `stage:*` não existem, impedindo `Super Administrator` e demais roles de satisfazerem o `requirePermissions('stage:create')`.

## 1. Quais permissões stage são exigidas pelo domínio Pipeline?

### Evidência
- [backend/src/modules/pipelines/routes.ts](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts:336,411,488,543)
- [backend/src/modules/pipelines/presentation/http/pipeline.http.contract.ts](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/presentation/http/pipeline.http.contract.ts:15-18,99-126)

### Resposta
O domínio Pipeline exige:
- `stage:create`
- `stage:update`
- `stage:delete`

Além disso:
- `reorderStages` usa `stage:update`

## 2. Quais permissões stage estão declaradas no seed atual?

### Evidência
- [backend/prisma/seed.ts](C:/Projects/FINQZ_PRO/backend/prisma/seed.ts:754-775)

### Resposta
O seed declara todas as permissões stage:
- `stage:create`
- `stage:read`
- `stage:update`
- `stage:delete`

## 3. Há divergência entre seed e runtime?

### Resposta
**Sim, no HML materializado.**

O seed declara `stage:*`, mas o banco HML confirmado não possui essas permissões materializadas. Portanto:
- runtime exige `stage:create`
- seed declara `stage:create`
- HML não tem o registro efetivo

### Classificação
**QUARANTINE**

## 4. Há divergência entre contrato HTTP e seed?

### Resposta
**Não na definição. Sim na materialização HML.**

O contrato HTTP e o seed concordam sobre a existência de:
- `stage:create`
- `stage:update`
- `stage:delete`

A divergência é operacional, porque o banco HML não contém os registros correspondentes.

## 5. Há divergência entre rota e seed?

### Resposta
**Não na intenção. Sim no banco HML.**

A rota exige:
- `stage:create`
- `stage:update`
- `stage:delete`

O seed declara essas permissões.

Mas HML não as possui, então a divergência real é entre:
- contrato/seed esperado
- estado persistido em HML

## 6. Há evidência de migration perdida?

### Resposta
**Não há evidência de migration perdida.**

O problema observado é de conteúdo RBAC ausente, não de schema/estrutura.

### Classificação
**UNKNOWN / NEEDS DECISION**

## 7. Há evidência de seed parcial em HML?

### Resposta
**Sim.**

O contexto confirmado indica:
- HML possui `pipeline:create/update/delete`
- HML não possui `stage:create/read/update/delete`

Isso caracteriza um seed parcialmente materializado para o domínio Pipeline/Stage.

### Classificação
**BLOCKER**

## 8. Menor correção segura?

### Resposta
A menor correção segura é:
- backfill operacional idempotente em HML
- inserir as permissões `stage:*` ausentes
- vincular essas permissões às roles operacionais necessárias

Sem alterar:
- schema
- runtime
- frontend
- seed código-fonte

## 9. GO/NO-GO para backfill operacional

### Resposta
**GO**, com restrições:
- aplicar apenas em HML
- operar de forma idempotente
- validar antes e depois
- sem migration estrutural

## 10. Plano de validação pós-backfill

### Validação mínima
1. Confirmar que `permissions` agora contém `stage:create`, `stage:read`, `stage:update`, `stage:delete`.
2. Confirmar que `role_permissions` contém o vínculo para `super-admin`.
3. Confirmar que `admin` e `manager` também receberam os vínculos esperados, se esse for o escopo definido.
4. Reexecutar a chamada `POST /api/v1/pipelines/:pipelineId/stages` com usuário `super-admin`.
5. Confirmar resposta `201` em vez de `403`.

## Matriz de consistência

| Camada | Estado | Classificação |
|---|---|---|
| Rota `POST /:pipelineId/stages` | Exige `stage:create` | KEEP |
| Contrato HTTP | Declara `stage:create` | KEEP |
| Seed de permissões | Declara `stage:*` | KEEP |
| Banco HML | Sem `stage:*` | BLOCKER |

## Próxima ação recomendada

Executar backfill operacional idempotente em HML e validar o fluxo de criação de Stage com usuário real após relogin.
