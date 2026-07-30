# PIPELINE-ADMIN-WAVE-5E - Stage RBAC Backfill Plan

## Executive Verdict
**GO WITH RESTRICTIONS**

O runtime de Stage está correto. O problema de HML é exclusivamente de dados de RBAC: as permissões `stage:*` não existem no banco ou não estão materializadas para as roles operacionais. A correção segura agora é um backfill controlado, idempotente e restrito a HML.

## 1. Quais permissions stage estão ausentes?

### Resposta
As permissões ausentes no banco HML são:
- `stage:create`
- `stage:read`
- `stage:update`
- `stage:delete`

### Evidência
- contrato oficial: [backend/src/modules/pipelines/presentation/http/pipeline.http.contract.ts](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/presentation/http/pipeline.http.contract.ts:15-18, 99-126)
- seed de permissões: [backend/prisma/seed.ts](C:/Projects/FINQZ_PRO/backend/prisma/seed.ts:754-775)

## 2. Quais roles devem receber stage:* inicialmente?

### Resposta
Inicialmente, as roles que devem receber `stage:*` são:
- `super-admin`
- `admin`
- `manager`

### Justificativa
Essas roles já representam o escopo de gestão de Pipeline/Stage no seed oficial. O `super-admin` precisa receber por definição de acesso total. `admin` e `manager` devem receber porque o domínio de Pipeline é operacional e a própria seed já inclui essas permissões para gerenciamento.

### Classificação
**KEEP**

## 3. Por que super-admin deve receber?

### Resposta
Porque:
- é a role de maior privilégio do tenant
- o seed a define com todas as permissões
- a UI e o runtime já assumem esse perfil como administração máxima

Sem `stage:*`, o `super-admin` fica funcionalmente incoerente com o restante do sistema.

## 4. Isso deve ser feito via migration, seed idempotente ou script operacional?

### Resposta
A opção mais segura é:
- **seed idempotente** como fonte durável
- **script operacional de backfill** para HML agora, executado uma vez e validado

### Recomendação
Não depender de migration estrutural para isso, porque o problema é de conteúdo/dados de RBAC, não de schema.

## 5. Qual opção mais segura para HML agora?

### Resposta
**Script operacional idempotente**, limitado a HML, que:
- cria as permissões ausentes se não existirem
- garante associação `role_permissions` para `super-admin`, `admin` e `manager`
- não altera outras permissões

Essa é a menor intervenção com maior controle operacional.

## 6. Como validar antes?

### Validações prévias
1. Confirmar que as permissões realmente não existem no banco HML.
2. Confirmar quais roles têm `stage:*` hoje.
3. Confirmar quais usuários estão ligados a essas roles.
4. Confirmar que o runtime atual falha com `Insufficient permissions` ao criar Stage.

### Leitura recomendada
- consultar `permissions`
- consultar `roles`
- consultar `role_permissions`
- consultar `user_roles`

## 7. Como aplicar?

### Passos
1. Inserir `stage:create`, `stage:read`, `stage:update`, `stage:delete` se ausentes.
2. Vincular essas permissões às roles:
   - `super-admin`
   - `admin`
   - `manager`
3. Executar somente em HML.
4. Registrar evidência de execução e timestamp.

### Observação
O script deve ser idempotente:
- se a permissão já existir, não duplicar
- se o vínculo role-permission já existir, não duplicar

## 8. Como validar depois?

### Validações pós-backfill
1. Verificar que `permissions` contém os quatro slugs `stage:*`.
2. Verificar que `role_permissions` contém os vínculos corretos.
3. Testar `POST /api/v1/pipelines/:pipelineId/stages` com usuário `super-admin`.
4. Confirmar resposta `201` em vez de `403`.
5. Repetir teste com `admin` e `manager` se esses perfis estiverem em uso em HML.

## 9. Como fazer rollback se necessário?

### Estratégia de rollback
- remover apenas os vínculos adicionados em `role_permissions`
- se as permissões `stage:*` tiverem sido criadas exclusivamente para esse backfill e não houver outro uso, remover também os registros em `permissions`

### Regra de segurança
Rollback deve ser reversível sem tocar em:
- usuários
- tenants
- pipelines
- stages
- tokens emitidos

## 10. GO/NO-GO para backfill controlado

### Resposta
**GO**, com restrições:
- somente HML
- script idempotente
- sem alterações de runtime
- sem mudança de schema
- sem impacto em produção até validação manual

## Matriz de decisão

| Item | Decisão |
|---|---|
| Ausência de `stage:*` no banco HML | Corrigir |
| Super-admin receber `stage:*` | Obrigatório |
| Admin/Manager receber `stage:*` | Recomendado e consistente com o seed |
| Migration estrutural | Não necessária |
| Seed idempotente | Recomendado |
| Script operacional HML | **Opção mais segura agora** |

## Próxima ação recomendada

Executar backfill idempotente em HML, validar com login novo e tentativa de criação de Stage, e só depois considerar sincronização do mesmo ajuste em ambientes derivados.
