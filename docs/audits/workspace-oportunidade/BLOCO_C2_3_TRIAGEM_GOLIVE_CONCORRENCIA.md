# BLOCO C2.3 - TRIAGEM GOLIVE CONCORRENCIA

Data: 2026-08-10
Status: Triagem concluida
Decisao: GO-LIVE LIBERADO - C2.3 COMPLETO POS-GOLIVE

## Baseline

- Branch: `promotion/hml-g18-full`
- HEAD local: `94eded334e629ab1e244df406652ff814fb0e120`
- HEAD remoto rastreado: `94eded334e629ab1e244df406652ff814fb0e120`
- Worktree inicial: limpo

## Escopo de leitura

Frontend:

- `src/pages/Oportunidades.tsx`
- `src/components/pipeline/workspaceOpportunity.ts`
- `src/api/modules/opportunities.api.ts`
- `src/test/oportunidades-card-interaction.test.tsx`
- `src/test/oportunidades-kanban-hardening.test.ts`
- `src/test/workspaceOpportunity.test.ts`

Backend:

- `backend/src/modules/opportunities/routes.ts`
- `backend/src/modules/opportunities/services/opportunities.service.ts`
- `backend/src/modules/opportunities/repositories/opportunities.repository.ts`
- `backend/prisma/schema.prisma`

## Protecoes atuais

### Frontend

- o effect de leitura oficial depende apenas de `apiReadReloadKey`;
- cada execucao do effect usa `cancelled` local no cleanup;
- GET antigo nao deve aplicar `setState` depois que um reload mais novo substitui a execucao anterior;
- `confirmarMudancaFase` e `handleDrop` fazem reconcile por `id` da oportunidade;
- apenas a oportunidade com `id` correspondente e substituida;
- `selectedLead` so e reconciliado quando o `id` coincide;
- erro remoto de `moveStage` nao incrementa `apiReadReloadKey`.

### Backend

- `PATCH /:id/stage` escopa por tenant e id;
- `moveStage` valida acesso, pipeline e stage;
- a escrita e feita por `updateMany({ where: { id, tenantId, deletedAt: null } })`;
- nao existe compare-and-swap;
- nao existe `expectedUpdatedAt`;
- nao existe `requestId`;
- nao existe idempotencia especifica de `moveStage`;
- existe coluna `version` no schema de `Opportunity`, mas ela nao e usada por `moveStage`.

## Respostas objetivas da triagem

1. Dois `moveStage` simultaneos podem deixar estado persistido incorreto?
   - Nao foi confirmada corrupcao persistente.
   - O comportamento real e `last-write-wins`.

2. Resposta antiga pode sobrescrever estado mais novo na UI?
   - Parcialmente confirmado como estado transitorio em caso de respostas fora de ordem.
   - O refetch final tende a convergir para o backend.

3. Refetch antigo pode sobrescrever leitura mais nova?
   - Nao confirmado.
   - O effect usa `cancelled` por execucao.

4. Duplo clique/drop pode disparar duas mutations?
   - Sim, nao ha lock, pending flag por oportunidade ou disable de mutation em andamento.

5. Workspace e drag podem alterar a mesma Opportunity simultaneamente?
   - Em termos logicos, sim, porque nao ha coordenacao entre requests.
   - No mesmo overlay do Workspace isso nao parece fluxo comum de usuario unico, mas pode coexistir entre contextos/sessoes.

6. O risco e apenas `last-write-wins` aceitavel ou corrupcao funcional?
   - O risco comprovado e `last-write-wins` com possivel estado transitorio na UI.
   - Nao foi comprovada corrupcao funcional persistente.

7. Ha impacto real de Go-Live?
   - Sim, como risco UX e previsibilidade.
   - Nao como blocker P0/P1 comprovado.

8. E necessario corrigir antes da V1 ou pode ficar pos-Go-Live?
   - Pode ficar pos-Go-Live.

## Cenario A - dois moveStage seguidos

Caso analisado:

- Move A: stage 1 -> stage 2
- Move B: stage 2 -> stage 3
- Resposta B chega primeiro
- Resposta A chega depois

### Frontend

- cada resposta bem-sucedida e aplicada diretamente via `reconcileOpportunityWorkspace(...)`;
- nao existe comparacao contra stage atual;
- nao existe `sequence`;
- nao existe `requestId`;
- nao existe guard por `updatedAt`;
- nao existe guard por `version`.

### Backend

- cada request executa leitura atual, valida stage/pipeline, faz `updateMany`, depois releitura;
- a persistencia final depende da ultima escrita efetiva no banco;
- o comportamento real e `last-write-wins`.

### Classificacao

PARCIALMENTE CONFIRMADO

Justificativa:

- a UI pode aplicar uma resposta antiga depois de uma mais nova;
- porem o refetch de sucesso subsequente tende a convergir para o estado real do backend;
- nao foi comprovado estado incorreto duradouro em uso comum de usuario unico.

## Cenario B - refetch fora de ordem

Caso analisado:

- mutation A -> reload key
- mutation B -> reload key
- GET B termina primeiro
- GET A termina depois

### Evidencia

- o effect de leitura possui `let cancelled = false`;
- o cleanup da execucao anterior faz `cancelled = true`;
- `setApiOportunidadesReadOnly(...)` so executa se `!cancelled`.

### Classificacao

NAO CONFIRMADO

Justificativa:

- o GET antigo nao deveria sobrescrever a lista mais nova depois que um reload posterior reexecuta o effect.

## Cenario C - duplo drop

### Evidencia

- `handleDrop` nao possui pending flag por oportunidade;
- `draggedCard` e limpo apenas depois do `await`;
- nao ha disable estrutural por request em andamento;
- nova mutation pode ser iniciada se o usuario repetir a interacao.

### Impacto

- requests duplicados sao possiveis;
- o resultado esperado continua sendo `last-write-wins`;
- nao foi comprovada escrita da oportunidade errada;
- nao foi comprovada quebra de convergencia.

### Classificacao

NAO BLOCKER

Prioridade sugerida:

- P2 para controle de concorrencia minima
- P3 para UX/feedback de pending

## Cenario D - Workspace + drag

### Evidencia

- `confirmarMudancaFase` e `handleDrop` nao compartilham lock, request id ou versionamento;
- ambos reconciliam `list` e `selectedLead` diretamente a partir da resposta persistida;
- ambos disparam refetch de sucesso ao final.

### Impacto

- respostas fora de ordem podem produzir estado transitorio inconsistente na UI;
- o backend permanece em `last-write-wins`;
- o refetch final converge para o backend;
- nao foi comprovada corrupcao persistente nem erro de tenant/opportunity errada.

### Classificacao

NAO BLOCKER

## Comportamento backend de concorrencia

Confirmado:

- `moveStage` faz update por `id` e `tenantId`;
- nao ha optimistic concurrency;
- nao ha compare-and-swap;
- nao ha `expectedUpdatedAt`;
- nao ha idempotencia especifica para `moveStage`;
- apesar de existir coluna `version` no model `Opportunity`, ela nao participa do fluxo.

Conclusao:

- o comportamento real do backend e `last-write-wins`.

## Timelines

### Timeline 1 - request A / request B / response B / response A

| Passo | Backend | Lista | selectedLead | Resultado final |
|---|---|---|---|---|
| A enviado | stage 1 | stage 1 | stage 1 | sem mudanca |
| B enviado | stage 1 ou 2 | stage 1 | stage 1 | sem mudanca |
| B responde primeiro | pode estar em stage 3 | reconciliado para stage 3 | reconciliado para stage 3 | estado otimista via resposta persistida |
| A responde depois | pode ainda estar em stage 2 ou ja ter sido sobrescrito por B | pode voltar para stage 2 | pode voltar para stage 2 | estado transitorio possivel |
| refetch final | backend converge para ultima escrita efetiva | lista converge | selectedLead converge se mesmo id | sem corrupcao persistente comprovada |

### Timeline 2 - request A / reload A / request B / reload B

| Passo | Backend | Lista | selectedLead | Resultado final |
|---|---|---|---|---|
| A sucesso | stage atualizado | reconcile local aplica A | selectedLead aplica A | reload key incrementa |
| GET A inicia | backend em estado A | lista atual A | selectedLead atual A | aguardando GET |
| B sucesso | backend atualizado novamente | reconcile local aplica B | selectedLead aplica B | reload key incrementa de novo |
| GET B inicia | backend em estado B | lista atual B | selectedLead atual B | cleanup cancela GET anterior |
| GET A termina depois | backend B | nao aplica state | nao aplica state | stale GET bloqueado pelo `cancelled` |
| GET B termina | backend B | lista B | selectedLead coerente com B | converge |

### Timeline 3 - Workspace request / drag request

| Passo | Backend | Lista | selectedLead | Resultado final |
|---|---|---|---|---|
| Workspace envia A | stage atual | sem mudanca imediata | sem mudanca imediata | pendente |
| Drag envia B | stage atual ou intermediario | sem mudanca imediata | sem mudanca imediata | pendente |
| Uma resposta chega primeiro | backend pode refletir essa escrita | reconcile aplica resposta recebida | selectedLead pode mudar se mesmo id | estado parcial |
| Outra resposta chega depois | backend pode mudar novamente | segunda reconcile pode sobrescrever a primeira | selectedLead pode sobrescrever tambem | estado transitorio possivel |
| refetch final | ultima escrita efetiva prevalece | lista converge | selectedLead converge pelo reload | sem corrupcao persistente comprovada |

## Gaps encontrados

| ID | Risco | Evidencia | Probabilidade | Impacto | Prioridade | Go-Live |
|---|---|---|---|---|---|---|
| G1 | Reconcile de respostas fora de ordem pode gerar stage transitorio antigo | reconcile aplica qualquer resposta bem-sucedida sem sequence/requestId/version | Baixa a media | Medio | P2 | NAO BLOCKER |
| G2 | Dupla acao pode disparar duas mutations | nao ha disable/pending por oportunidade em Workspace ou drag | Media | Medio | P2 | NAO BLOCKER |
| G3 | Falta de feedback/controle visual de request em andamento | sem lock ou busy state por moveStage | Media | Baixo | P3 | NAO BLOCKER |
| G4 | Persistencia usa last-write-wins | backend sem optimistic concurrency para moveStage | Media | Medio | P2 | NAO BLOCKER |

## P0 encontrados

Nenhum confirmado.

## P1 encontrados

Nenhum confirmado.

## P2/P3 encontrados

### P2

- respostas de `moveStage` fora de ordem podem produzir estado transitorio antigo antes do refetch final;
- dupla interacao pode disparar duas mutations da mesma oportunidade;
- backend opera em `last-write-wins` sem controle de concorrencia especifico.

### P3

- ausencia de feedback/pending dedicado para impedir repeticao acidental de acao.

## Matriz Go-Live

- Corrupcao persistente: NAO CONFIRMADA
- Cross-tenant: NAO CONFIRMADA
- Oportunidade errada alterada: NAO CONFIRMADA
- Stale GET sobrescrevendo leitura nova: NAO CONFIRMADO
- Estado transitorio por respostas fora de ordem: CONFIRMADO
- Convergencia por refetch de sucesso: CONFIRMADA

## Decisao final

GO-LIVE LIBERADO - C2.3 COMPLETO POS-GOLIVE

## O que fica pos-Go-Live

- avaliar guard minimo contra resposta fora de ordem por oportunidade;
- avaliar busy state por oportunidade para evitar dupla acao;
- avaliar politicas explicitas para concorrencia multi-contexto no Workspace.
