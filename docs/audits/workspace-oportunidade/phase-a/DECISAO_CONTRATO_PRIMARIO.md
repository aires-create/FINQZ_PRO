# Decisão do Contrato Primário - Fase A

## Opção escolhida

**Opção 3: DTO agregado oficial da Workspace, composto por referências explícitas a Lead, Customer, Opportunity, Pipeline e Stage.**

## Por que esta opção foi escolhida

- A tela `src/pages/Oportunidades.tsx` trabalha com um objeto agregado, não com uma entidade pura do backend.
- O backend enterprise possui `Opportunity` no Prisma e permissões `opportunity:*`, mas a Workspace atual ainda consome dados compatíveis/legados e estado local.
- O card e o modal precisam de identidade canônica, label amigável, dados persistidos e campos derivados separados.
- A separação de `displayId` e `id`, além de `stageId` e `stageLabel`, só fica clara com um DTO/view model agregado.

## Opções descartadas

- **Opção 1: Opportunity como contrato primário.**
  - Descarta-se porque a Workspace atual não lê/escreve somente por um contrato oficial único de Opportunity.
  - O fluxo ainda depende de compatibilidade com `Lead`/`Customer`, store local e runtime alternativo.

- **Opção 2: Lead projetado como contrato primário.**
  - Descarta-se porque o modal e as operações da Workspace representam um agregado de oportunidade, etapa, pipeline e dados comerciais.
  - Reduziria a clareza da separação entre identidade, persistência e apresentação.

## Evidências de arquivo e linha

- `src/pages/Oportunidades.tsx:3650`
- `src/pages/Oportunidades.tsx:4170-4176`
- `src/pages/Oportunidades.tsx:903-981`
- `src/pages/Oportunidades.tsx:2060-2082`
- `src/pages/Oportunidades.tsx:2351-2397`
- `src/components/pipeline/workspaceOpportunity.ts`
- `src/components/pipeline/pipelineUtils.ts`
- `backend/prisma/schema.prisma:474-521`
- `backend/prisma/seed.ts:380-413`
- `backend/src/middlewares/enterprise.ts:15-25`
- `backend/src/core/http/fastify.ts:541-547`

## Contrato de leitura

- A Workspace deve receber um objeto agregado normalizado.
- A leitura deve preservar `id` canônico, `displayId` seguro, `leadId`, `opportunityId`, `customerId`, `pipelineId` e `stageId`.
- `stageLabel` deve vir do resolvedor de stage, nunca de `etapa_id` cru no render.
- Dados persistidos e dados derivados devem ficar separados.

## Contrato de atualização

- A atualização deve enviar apenas campos editáveis.
- `displayId`, `stageLabel`, `pipelineLabel`, `formattedValue` e demais derivados não devem ir ao payload.
- O backend deve ter precedência; fallback local só é permitido de forma explícita e observável.

## Campos persistidos

- Identidade: `id`, `leadId`, `opportunityId`, `customerId`, `pipelineId`, `stageId`.
- Comerciais: `cliente_nome`, `produto`, `responsavel_nome`, `valor`, `origem`, `status`, `observacoes`, `tags`.
- Metadados de tempo: `createdAt`, `updatedAt`.

## Campos derivados

- `stageLabel`
- `pipelineLabel`
- `formattedValue`
- `displayName`
- `initials`

## Campos locais

- Estado de abertura do modal.
- Aba ativa.
- Estado de carregamento/salvamento.
- Erro de sincronização.
- Rascunhos ainda não persistidos.

## Riscos

- Divergência entre snapshot local e resposta do backend.
- Exibição de stage incorreto se o resolvedor não usar o catálogo do pipeline atual.
- Regressão no drag and drop se `stageId` for confundido com label.

## Impacto

- Impacto baixo no Pipeline, desde que `etapa_id` continue sendo o identificador operacional do Kanban.
- Impacto médio no modal da Workspace, porque a leitura passa a depender do view model canônico.

## Rollback

- Reverter o consumo do view model canônico.
- Manter os adapters e o store.
- Não exige migration, seed ou alteração de backend.
