# BLOCO C1.1 — CONTRATO DE ENTRADA DO NORMALIZADOR

## Objetivo

Formalizar o contrato de entrada de `normalizeOpportunityWorkspace` para aceitar campos canônicos da API sem romper a compatibilidade com aliases legados ainda consumidos pela UI da Workspace.

## Estado anterior

- O normalizador aceitava `valor`, mas não tratava `amount` como entrada canônica.
- `stageId` já tinha precedência sobre aliases, mas `stage_id` não estava coberto explicitamente nos testes de conflito.
- `customerId` era lido apenas na forma canônica, sem fallback para `cliente_id`.
- `ownerId`, `productId` e `description` não eram consolidados a partir dos respectivos aliases.
- `nome` continuava exercendo dupla função histórica de compatibilidade, inclusive como fallback de exibição.

## Alteração aplicada

- Foi criado um tipo explícito de entrada (`OpportunityWorkspaceInput`) com os campos canônicos e aliases confirmados pelo Bloco C1.
- O normalizador passou a aceitar `amount` e a derivar `valor` e `formattedValue` prioritariamente desse campo.
- A precedência canônica foi formalizada para `pipelineId`, `stageId`, `amount`, `customerId`, `ownerId` e `description`.
- Foram expostos no view model os campos canônicos `title`, `amount`, `description`, `productId` e `ownerId`, sem alterar a semântica visual atual de `nome`.

## Regras de precedência

| Conceito | Precedência aplicada |
| --- | --- |
| Identidade | `id > opportunityId > leadId > customerId` |
| Pipeline | `pipelineId > pipeline_id > produto` |
| Etapa | `stageId > stage_id > etapa_id > etapa` |
| Valor | `amount > valor` |
| Cliente | `customerId > cliente_id` |
| Produto | `productId > product_id > produto_id` |
| Responsável | `ownerId > responsavel_id > assignedTo` |
| Título | `title > nome` |
| Descrição | `description > observacoes` |

## Aliases preservados

- `opportunityId`
- `leadId`
- `pipeline_id`
- `stage_id`
- `etapa_id`
- `etapa`
- `nome`
- `valor`
- `cliente_id`
- `cliente_nome`
- `product_id`
- `produto_id`
- `produto`
- `responsavel_id`
- `responsavel_nome`
- `observacoes`

## Testes criados

- Precedência de `amount` sobre `valor`
- Preservação de `amount = 0`
- Fallback legado de `valor`
- Precedência de `stageId` sobre `stage_id` e `etapa_id`
- Precedência explícita de `stage_id` quando `stageId` não existe
- Precedência de `customerId` sobre `cliente_id`
- Precedência de `ownerId` sobre `responsavel_id`
- Precedência de `pipelineId` sobre `pipeline_id`
- Precedência de `description` sobre `observacoes`
- Compatibilidade com objeto composto apenas por aliases
- Não mutação da entrada
- Fallback coerente para `undefined` e `null`

## Resultados

- Teste direcionado: `25/25` testes aprovados em `src/test/workspaceOpportunity.test.ts`
- Suíte completa: `156/156` testes aprovados
- Build: concluído com sucesso
- `arch:check`: aprovado
- `git diff --check`: sem erros de patch; apenas avisos de normalização `LF -> CRLF` no workspace local

## Arquivos alterados

- `src/components/pipeline/workspaceOpportunity.ts`
- `src/test/workspaceOpportunity.test.ts`
- `docs/audits/workspace-oportunidade/BLOCO_C1_1_CONTRATO_ENTRADA_NORMALIZADOR.md`

## Riscos remanescentes

- `nome` permanece com ambiguidade histórica entre título da oportunidade e nome exibido no card, porque a UI atual ainda consome esse campo diretamente.
- A identidade da oportunidade continua preservando o fallback legado `customerId` dentro da cadeia atual de compatibilidade, o que deve ser reavaliado antes de remover aliases.

## Fora do escopo

- Alteração de payloads enviados ao backend
- Mudança em `src/pages/Oportunidades.tsx`
- Mudança em API frontend
- Mudança em Zustand/store
- Mudança em backend, Prisma, banco ou endpoint
- Refatoração visual da Workspace

## Recomendação para o C1.2

Consolidar a semântica de nome/título na camada consumidora da Workspace para que `title` passe a representar explicitamente o nome da oportunidade, reduzindo a dependência do alias legado `nome` antes da migração dos payloads da UI.
