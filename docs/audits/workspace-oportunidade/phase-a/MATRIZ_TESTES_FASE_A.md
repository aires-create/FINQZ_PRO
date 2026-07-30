# Matriz de Testes - Fase A

| Teste | Objetivo | Resultado |
|---|---|---|
| `normalizeOpportunityWorkspace` preserva `id` canônico | Garantir que o id real não seja sobrescrito por display | Passou |
| `normalizeOpportunityWorkspace` separa `displayId` do `id` | Garantir que UUID-like não vaze para o label | Passou |
| `normalizeOpportunityWorkspace` com Lead projetado | Garantir compatibilidade com objeto de lead/opportunity agregado | Passou |
| Resolução de stage por `stageId` | Prioridade máxima do stage canônico | Passou |
| Resolução de stage por `etapa_id` | Compatibilidade com o shape legado | Passou |
| Resolução de stage por `etapa` | Compatibilidade com texto de etapa | Passou |
| Ausência de stage | Garantir fallback explícito `Etapa não identificada` | Passou |
| Prevenção de mutação | Garantir normalizador puro | Passou |
| `mergeOpportunityWorkspace` | Garantir precedência backend sobre snapshot local | Passou |
| `buildOpportunityWorkspaceUpdatePayload` | Garantir payload sem campos derivados | Passou |
| `resolveOpportunityWorkspaceMutationId` | Garantir id de mutação compatível com o runtime legado | Passou |
| `resolveOpportunityWorkspaceApiMutationId` | Garantir ID remoto numérico e rejeitar UUID/displayId | Passou |
| `persistOpportunityWorkspaceMutation` | Garantir que falha remota não chame commit local | Passou |
| `normalizeOpportunityWorkspace` com `etapa_id` UUID | Garantir que UUID não vire `stageLabel` | Passou |
| `src/test/pipeline.test.ts` | Garantir que o Pipeline congelado não sofreu regressão | Passou |

## Execuções realizadas

- `npm run test -- --run src/test/workspaceOpportunity.test.ts src/test/pipeline.test.ts`
- `npm run build`

## Observação

- Não foi criado teste de backend nesta fase.
- O foco foi o contrato da Workspace, a proteção do Pipeline e a confirmação remota antes de qualquer commit local.
