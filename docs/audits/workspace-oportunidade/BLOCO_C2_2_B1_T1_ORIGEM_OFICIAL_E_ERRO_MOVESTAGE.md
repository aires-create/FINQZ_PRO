# BLOCO C2.2-B1/T1 — ORIGEM OFICIAL E ERRO REMOTO DE MOVESTAGE

Data: 2026-08-10
Status: Resolvido no frontend/testes
Classificacao Go-Live: P1 original corrigido; T1 validado sem bug de runtime

## Escopo

- Preservar a identidade de origem oficial no Workspace.
- Retomar o teste de erro remoto de `moveStage`.
- Rastrear o `opportunitiesApi.getAll()` adicional observado nos cenarios de erro.
- Nao alterar backend, Prisma, endpoint ou payload.

## P1 original

Problema:

- uma oportunidade oficial aberta no Workspace perdia `__officialApiSource` ao passar por
  `normalizeOpportunityWorkspace(...)`;
- `selectedLead` deixava de ser reconhecido por `isOfficialApiOpportunity(...)`;
- o fluxo critico podia ser bloqueado antes de `moveStage`.

## Causa raiz do B1

- `__officialApiSource` era metadata de frontend;
- o marcador nao estava formalizado no contrato de entrada/saida do Workspace;
- o normalizador descartava esse valor;
- a reconciliacao posterior nao conseguia preservar a identidade oficial do `selectedLead`.

## Correcao do B1

- `mapOpportunityApiToWorkspaceInput(...)` passou a marcar DTO oficial com `__officialApiSource: true`;
- `OpportunityWorkspaceInput` passou a aceitar o campo;
- `OpportunityWorkspaceViewModel` passou a expor o campo;
- `normalizeOpportunityWorkspace(...)` passou a preservar somente `input.__officialApiSource === true`;
- oportunidade legada sem marcador nao e promovida automaticamente.

Fluxo final:

`Opportunity API DTO`
-> `mapOpportunityApiToWorkspaceInput`
-> `normalizeOpportunityWorkspace`
-> `OpportunityWorkspaceViewModel`
-> `selectedLead`

## Protecao de legado

Confirmado em teste:

- DTO oficial mapeado permanece oficial;
- legado sem marcador continua nao oficial;
- `__officialApiSource=false` continua nao oficial;
- normalizacao/reconciliacao repetida preserva estabilidade;
- a entrada nao e mutada.

## Investigacao do getAll no T1

### Pergunta

Por que `opportunitiesApi.getAll()` aparecia nos cenarios de erro remoto de `moveStage`?

### Classificacao final

Categoria D — problema de teste

### Evidencia

1. O efeito de leitura oficial chama `opportunitiesApi.getAll()` somente no mount e quando `apiReadReloadKey` muda.
2. `confirmarMudancaFase` e `handleDrop` executam `setApiReadReloadKey(...)` apenas no caminho de sucesso.
3. Ambos possuem `catch` com `return`, sem `finally` de recarga.
4. Os testes configuravam `moveStageMock.mockResolvedValueOnce(...)` ou
   `moveStageMock.mockRejectedValueOnce(...)` antes de `setupWorkspace(...)`.
5. `setupWorkspace(...)` executa `moveStageMock.mockReset()`.
6. Isso apagava a configuracao do mock antes da acao testada.
7. Como resultado:
   - o caso de Workspace "com erro" na pratica nao rejeitava o `moveStage`;
   - o caso de drag "com erro" tambem nao rejeitava o `moveStage`;
   - o componente seguia pelo caminho de sucesso, incrementando `apiReadReloadKey` e disparando novo `getAll()`.

### Sequencia confirmada no Workspace

- render
- `getAll` inicial
- `aceitarSimulacao`
- `update` oficial bem-sucedido
- `setApiReadReloadKey` legitimo do aceite
- `getAll` legitimo do aceite
- clique em confirmar mudanca de fase
- `moveStage` rejeita de fato
- `catch` com preservacao de estado
- nenhum `getAll` adicional atribuivel ao erro remoto

### Sequencia confirmada no Drag

- render
- `getAll` inicial
- abertura do card
- drag start / drop
- `moveStage` rejeita de fato
- `catch` de drag registra erro
- cleanup visual de drag
- nenhum `getAll` adicional atribuivel ao erro remoto

## Ajuste final do teste

O teste foi fortalecido semanticamente:

- configuracao do `moveStageMock` passou a ocorrer depois de `setupWorkspace(...)`;
- o cenario de Workspace reconhece o `getAll` legitimo do aceite da simulacao antes do clique de `moveStage`;
- a assercao final verifica que a falha remota nao adiciona um novo refetch de sucesso;
- o cenario de drag verifica que:
  - `moveStage` e chamado;
  - a lista continua na etapa anterior;
  - `selectedLead` continua na etapa anterior;
  - `patchStatus` fica `error`;
  - `postGetStatus` fica `error`;
  - nao ha observacao `drag:patch:success`.

## Call sites relevantes de getAll / reload

Leitura oficial:

- `src/pages/Oportunidades.tsx`: efeito de leitura read-only dependente de `apiReadReloadKey`

Reloads legitimos de sucesso:

- aceite de simulacao com `update`
- confirmacao de mudanca de fase com `moveStage` bem-sucedido
- drag-and-drop com `moveStage` bem-sucedido
- criacao
- update
- delete
- importacao
- envio de assinatura

## Arquivos alterados no pacote

- `src/components/pipeline/workspaceOpportunity.ts`
- `src/pages/Oportunidades.tsx`
- `src/test/workspaceOpportunity.test.ts`
- `src/test/oportunidades-card-interaction.test.tsx`
- `docs/audits/workspace-oportunidade/BLOCO_C2_2_B1_T1_ORIGEM_OFICIAL_E_ERRO_MOVESTAGE.md`

## Validacoes

Direcionados:

- `workspaceOpportunity.test.ts`: 48/48
- `oportunidades-card-interaction.test.tsx`: 8/8
- `oportunidades-kanban-hardening.test.ts`: 12/12

Suite completa:

- execucao 1: 31 arquivos, 184 testes, 0 falhas, 0 worker errors
- execucao 2: 31 arquivos, 184 testes, 0 falhas, 0 worker errors

Outras verificacoes:

- `npm run build`: OK
- `npm run arch:check`: OK
- `git diff --check`: sem erro bloqueante

## Fora do escopo

- backend
- Prisma
- endpoint
- payload
- optimistic update
- rollback avancado
- lock
- stale guard
- C2.3
- C3

## Conclusao

- a origem oficial agora e preservada no Workspace;
- o bloqueador P1 original foi removido;
- o `getAll` adicional observado no T1 era causado por configuracao incorreta do mock no teste;
- nao foi confirmado bug de runtime;
- o pacote B1/T1 ficou apto para revisao final e commit.
