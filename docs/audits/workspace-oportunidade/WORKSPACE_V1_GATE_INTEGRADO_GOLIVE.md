# WORKSPACE V1 - GATE INTEGRADO GOLIVE

Data: 2026-08-10
Repositorio: `C:\Projects\FINQZ_PRO_HML_PROMOTION`
Branch: `promotion/hml-g18-full`
HEAD auditado: `5976c6ba16dca25b1d833861f76e9245ee256b95`
Escopo: leitura, execucao de testes e validacoes, sem alteracao de runtime

## 1. Baseline

- `git status --short`: limpo no inicio do gate
- `git branch --show-current`: `promotion/hml-g18-full`
- `git rev-parse HEAD`: `5976c6ba16dca25b1d833861f76e9245ee256b95`
- `git rev-parse origin/promotion/hml-g18-full`: `5976c6ba16dca25b1d833861f76e9245ee256b95`
- local = remoto

## 2. Documentacao consultada

- `docs/00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md`
- `docs/audits/workspace-oportunidade/BLOCO_C0_MAPA_OFICIAL_OPPORTUNITY.md`
- `docs/audits/workspace-oportunidade/BLOCO_C2_AUDITORIA_SINCRONIZACAO_ETAPA.md`
- `docs/audits/workspace-oportunidade/BLOCO_C2_1_RECONCILIACAO_MUDANCA_ETAPA.md`
- `docs/audits/workspace-oportunidade/BLOCO_C2_2_AUDITORIA_ROLLBACK_TRATAMENTO_ERRO.md`
- `docs/audits/workspace-oportunidade/BLOCO_C2_2_B1_T1_ORIGEM_OFICIAL_E_ERRO_MOVESTAGE.md`
- `docs/audits/workspace-oportunidade/BLOCO_C2_3_TRIAGEM_GOLIVE_CONCORRENCIA.md`
- `docs/audits/workspace-oportunidade/MATRIZ_EXECUTIVA_ACOES_PRIORITARIAS.md`

Conclusao documental consolidada:

- `stageId` e o identificador persistido canonico;
- `stageLabel` e derivado;
- C2.1 concluiu a reconciliacao imediata da resposta persistida;
- C2.2 classificou ausencia de rollback avancado como nao bloqueante enquanto nao houver optimistic update;
- C2.3 classificou concorrencia/stale response como pos-Go-Live, sem P0/P1 confirmado.

## 3. Matriz W1-W16

| ID | Fluxo | Evidencia | Persistencia | Tenant | RBAC | Teste | Prioridade | V1 |
|---|---|---|---|---|---|---|---|---|
| W1 | abertura do card | `selectedLead` nasce de `normalizeOpportunityWorkspace(...)` ao abrir o card | n/a | n/a | UI respeita permissao de acoes de edicao | `oportunidades-card-interaction.test.tsx` | P1 | PASS |
| W2 | `selectedLead` oficial | `__officialApiSource` e preservado de DTO oficial ate o workspace | n/a | n/a | bloqueia card legado para mutation oficial | `workspaceOpportunity.test.ts`, `oportunidades-card-interaction.test.tsx` | P1 | PASS |
| W3 | `stageId` / `stageLabel` | `stageId` canonico, `stage_id` e `etapa_id` espelhos, `stageLabel` recalculado | sim | indireto | n/a | `workspaceOpportunity.test.ts`, `oportunidades-kanban-hardening.test.ts` | P1 | PASS |
| W4 | edicao essencial | `update` retorna entidade persistida e a lista e reconciliada por leitura oficial | sim | sim | `opportunity:update` no backend | evidencia de codigo + suite frontend | P1 | PASS COM RESSALVA |
| W5 | moveStage Workspace | `confirmarMudancaFase` usa resposta persistida -> mapping -> reconcile por `id` -> `selectedLead` | sim | sim | `opportunity:move_stage` | `oportunidades-card-interaction.test.tsx` | P1 | PASS |
| W6 | drag-and-drop | `handleDrop` usa mesma mutation oficial e mesma reconciliacao por `id` | sim | sim | `opportunity:move_stage` | `oportunidades-kanban-hardening.test.ts` | P1 | PASS |
| W7 | erro moveStage | em erro remoto nao ha optimistic update, lista e `selectedLead` permanecem intactos | nao altera negocio | sim | sim | coberto por leitura documental e testes do pacote B1/T1; sem teste backend local executavel neste ambiente | P2 | PASS COM RESSALVA |
| W8 | refresh | `getAll()` oficial depende de `apiReadReloadKey`; refetch de sucesso converge para backend | sim | sim | `opportunity:read` | suite frontend + evidencias C2 | P1 | PASS |
| W9 | lista ↔ modal | reconciliacao substitui somente a oportunidade de mesmo `id`; `selectedLead` so atualiza se o id coincide | sim | n/a | n/a | `workspaceOpportunity.test.ts`, `oportunidades-card-interaction.test.tsx` | P1 | PASS |
| W10 | tenant | backend escopa leitura/escrita por `tenantId`; repository reforca filtros | sim | sim | n/a | `opportunities.service.test.ts`, `opportunities.repository.test.ts` | P0 | PASS |
| W11 | RBAC | rotas exigem `opportunity:read/create/update/move_stage/delete` | n/a | n/a | sim | `opportunities.routes.test.ts`, `opportunities.test.ts` existem, mas nao executaram neste ambiente por `DATABASE_URL` ausente | P0 | PASS COM RESSALVA |
| W12 | resposta API / mapping | `moveStage` retorna `OpportunityEntityMutationResponse`; frontend mapeia DTO oficial para VM canonica | sim | sim | n/a | `workspaceOpportunity.test.ts` | P1 | PASS |
| W13 | legacy / compat | aliases legados permanecem apenas como compatibilidade no caminho critico; `productId` continua canonico | sim | n/a | n/a | `workspaceOpportunity.test.ts` | P2 | PASS COM RESSALVA |
| W14 | testes | frontend direcionado e suite completa passaram; backend parcial por ambiente | n/a | n/a | n/a | execucoes deste gate | P1 | PASS COM RESSALVA |
| W15 | build | `npm run build` aprovado | n/a | n/a | n/a | execucao deste gate | P1 | PASS |
| W16 | arch governance | `npm run arch:check` aprovado | n/a | n/a | n/a | execucao deste gate | P1 | PASS |

## 4. Frontend Workspace

Estado final confirmado do fluxo critico:

`moveStage response`
-> `mapOpportunityApiToWorkspaceInput`
-> `normalizeOpportunityWorkspace`
-> `OpportunityWorkspaceViewModel`
-> reconciliacao por `id`
-> lista da Pipeline
-> `selectedLead` aberto quando o `id` coincide

Confirmacoes:

- resposta persistida do `PATCH` e realmente usada;
- a lista e reconciliada por `id`;
- somente a oportunidade correta e substituida;
- `selectedLead` so e atualizado quando o `id` coincide;
- `selectedLead` de outra oportunidade permanece intacto;
- `stageId` e o canonico;
- `stage_id` e `etapa_id` espelham `stageId`;
- `stageLabel` e recalculado;
- `etapa` permanece visual;
- refetch nao e a unica forma de reconciliacao;
- nenhum optimistic update foi introduzido;
- nenhum rollback avancado foi introduzido;
- nenhum lock foi introduzido;
- nenhum stale guard foi introduzido.

## 5. Backend Opportunity

Comportamento confirmado:

- rota oficial: `PATCH /api/v1/opportunities/:id/stage`
- permissao: `opportunity:move_stage`
- validacao de body por Zod
- service busca oportunidade atual, valida tenant/acesso, valida pipeline + stage, persiste e rele a entidade atualizada
- repository escreve por `updateMany({ where: { id, tenantId, deletedAt: null } })`
- comportamento de concorrencia continua `last-write-wins`
- nao ha compare-and-swap
- nao ha `expectedUpdatedAt`
- nao ha `requestId` ou idempotencia especifica de `moveStage`

## 6. Persistencia

- `stageId` persiste no backend e no Prisma `Opportunity.stageId`
- `pipelineId` persiste no backend e no Prisma `Opportunity.pipelineId`
- a resposta de `moveStage` e a oportunidade reidratada apos persistencia
- refresh oficial reconverge para o backend
- nao foi comprovada corrupcao persistente

## 7. Tenant

Evidencias confirmadas:

- rotas extraem `tenantId` do contexto autenticado
- service rejeita `tenant` ausente
- repository filtra por `tenantId`
- `findById` tambem exige que `pipeline` e `stage` pertençam ao mesmo tenant
- testes unitarios de service/repository passaram neste gate

Conclusao:

- nenhum risco cross-tenant confirmado no fluxo critico do Workspace

## 8. RBAC

Evidencias confirmadas:

- `GET /` e `GET /:id`: `opportunity:read`
- `POST /`: `opportunity:create`
- `PUT /:id`: `opportunity:update`
- `PATCH /:id/stage`: `opportunity:move_stage`
- `DELETE /:id`: `opportunity:delete`

Ressalva:

- os testes de rota/integracao de backend nao executaram neste ambiente por falta de `DATABASE_URL`; o desenho de RBAC em codigo permanece consistente e os arquivos de teste existem.

## 9. Testes

### Frontend direcionados

- `src/test/workspaceOpportunity.test.ts`: 1 arquivo, 48 testes, 0 falhas, 0 worker errors
- `src/test/oportunidades-card-interaction.test.tsx`: 1 arquivo, 8 testes, 0 falhas, 0 worker errors
- `src/test/oportunidades-kanban-hardening.test.ts`: 1 arquivo, 12 testes, 0 falhas, 0 worker errors

### Backend direcionados

- `backend/src/tests/unit/opportunities.service.test.ts`: 1 arquivo, 26 testes, 0 falhas
- `backend/src/tests/unit/opportunities.repository.test.ts`: 1 arquivo, 15 testes, 0 falhas
- `backend/src/tests/unit/opportunities.routes.test.ts`: 0 testes executados, suite falhou em bootstrap por `DATABASE_URL is required`
- `backend/src/tests/integration/opportunities.test.ts`: 0 testes executados, suite falhou em bootstrap por `DATABASE_URL is required`

Classificacao:

- evidencia backend funcional parcial aprovada para service/repository
- evidencia local de rotas/integracao restrita por ambiente

### Suite frontend completa

Execucao 1:

- 31 arquivos aprovados
- 184 testes aprovados
- 0 falhas
- 0 worker errors

Execucao 2:

- 31 arquivos aprovados
- 184 testes aprovados
- 0 falhas
- 0 worker errors

## 10. Gaps

- testes locais de `routes` e integracao de backend dependem de `DATABASE_URL` no ambiente atual;
- concorrencia continua `last-write-wins`;
- dupla acao de `moveStage` continua possivel sem pending flag por oportunidade;
- erros remotos do `moveStage` seguem com UX generica baseada em `alert`.

## 11. P0

Nenhum confirmado.

## 12. P1

Nenhum confirmado no produto do Workspace V1.

Observacao:

- nao classificar como P1 a ausencia de `DATABASE_URL` neste ambiente local de teste; trata-se de restricao de evidencia local, nao de quebra funcional comprovada do Workspace.

## 13. P2/P3 pos-Go-Live

### P2

- respostas fora de ordem podem gerar estado transitorio antes do refetch final;
- dupla mutation da mesma oportunidade continua possivel;
- backend opera em `last-write-wins`;
- evidencia local de testes de rota/integracao backend ficou incompleta por ambiente;
- UX de erro remoto pode ser mais especifica por classe de falha.

### P3

- ausencia de busy state dedicado para evitar repeticao acidental;
- refinamentos de observabilidade e mensagens de erro.

## 14. Decisao V1

`WORKSPACE V1 - GO WITH RESTRICTIONS`

Justificativa:

- nenhum P0 confirmado;
- nenhum P1 funcional bloqueante confirmado;
- fluxos essenciais W1-W16 passaram ou passaram com ressalva nao bloqueante;
- as ressalvas remanescentes sao de pos-Go-Live, concorrencia controlada, UX ou restricao local de ambiente para parte dos testes backend.

## 15. Proximos gates do sistema

Ordem sugerida para o caminho critico da primeira publicacao:

1. habilitar ambiente minimo reproduzivel para testes backend de rota/integracao do modulo Opportunity;
2. triagem do proximo gate integrado do nucleo apos o Workspace V1;
3. tratar controles minimos de concorrencia/UX apenas no trilho pos-Go-Live.

Decisao de continuidade:

- Workspace considerado FECHADO PARA V1.
- C2.3 completo, C2.4 e refinamentos nao bloqueantes permanecem pos-Go-Live.
- A lacuna de execucao dos testes backend dependentes de `DATABASE_URL` sera tratada no Gate Nucleo/Production Readiness.
