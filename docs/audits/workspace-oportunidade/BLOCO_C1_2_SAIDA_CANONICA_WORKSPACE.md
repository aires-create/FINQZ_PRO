# BLOCO C1.2 — SAÍDA CANÔNICA DO WORKSPACE

## Objetivo

Formalizar uma saída única, canônica, estável e tipada de `normalizeOpportunityWorkspace` para consumo compartilhado entre Pipeline e Workspace, preservando aliases legados apenas como compatibilidade temporária.

## Estado anterior

- A saída já expunha campos canônicos, derivados e aliases no mesmo objeto plano.
- O tipo `OpportunityWorkspaceViewModel` listava todos os campos juntos, sem distinção explícita entre contrato canônico, derivados de exibição e compatibilidade.
- Alguns aliases equivalentes ao contrato canônico ainda não eram espelhados na saída, como `cliente_id`, `produto_id` e `responsavel_id`.
- Pipeline e Workspace continuavam consumindo partes diferentes da mesma shape, mas sem uma formalização clara da responsabilidade de cada grupo de campos.

## Estrutura canônica

### Campos canônicos

- `id`
- `pipelineId`
- `stageId`
- `title`
- `amount`
- `customerId`
- `productId`
- `ownerId`
- `status`
- `description`

### Campos derivados

- `displayId`
- `stageLabel`
- `pipelineLabel`
- `formattedValue`
- `displayName`
- `initials`

### Compatibilidade preservada

- `leadId`
- `opportunityId`
- `pipeline_id`
- `stage_id`
- `etapa_id`
- `etapa`
- `nome`
- `valor`
- `cliente_id`
- `cliente_nome`
- `produto_id`
- `produto`
- `responsavel_id`
- `responsavel_nome`
- `observacoes`

## Derivados

- `displayId` deriva da identidade canônica e mantém a distinção entre identificador técnico e identificador visual.
- `stageLabel` deriva do catálogo de etapas.
- `pipelineLabel` deriva do contexto ou do pipeline resolvido.
- `formattedValue` deriva de `amount`.
- `displayName` continua priorizando o nome projetado do cliente por compatibilidade visual.
- `initials` continuam derivadas de `displayName`.

## Aliases

- `pipeline_id` espelha `pipelineId`
- `stage_id` espelha `stageId`
- `valor` espelha `amount`
- `cliente_id` espelha `customerId`
- `produto_id` espelha `productId`
- `responsavel_id` espelha `ownerId`
- `observacoes` espelha `description`

Os aliases permanecem planos no objeto final para não forçar refatoração dos consumidores existentes.

## Equivalências

| Alias | Campo relacionado | Regra |
| --- | --- | --- |
| `pipeline_id` | `pipelineId` | equivalência direta |
| `stage_id` | `stageId` | equivalência direta |
| `valor` | `amount` | equivalência direta |
| `cliente_id` | `customerId` | equivalência direta |
| `produto_id` | `productId` | equivalência direta |
| `responsavel_id` | `ownerId` | equivalência direta |
| `observacoes` | `description` | equivalência direta |

## Ambiguidades mantidas

- `nome` continua como alias de compatibilidade e ainda não resolve definitivamente a ambiguidade entre título da oportunidade e nome do cliente.
- A cadeia de identidade `id > opportunityId > leadId > customerId` permanece preservada por compatibilidade histórica.
- `etapa` continua representando compatibilidade visual da etapa e não foi reclassificada como ID técnico.

## Testes

- Saída canônica completa com campos canônicos, derivados e aliases espelhados
- Equivalência entre canônico e alias para IDs e descrição
- Compatibilidade com entrada apenas legada
- Preservação do valor canônico em conflitos
- Consistência para `null` e `undefined`
- Não mutação da entrada
- Regressão total da suíte e compatibilidade indireta com card/hardening

## Resultados

- Teste direcionado: `28/28` testes aprovados em `src/test/workspaceOpportunity.test.ts`
- Suíte completa: `159/159` testes aprovados
- Build: concluído com sucesso
- `arch:check`: aprovado
- `git diff --check`: sem erros de patch; apenas avisos locais de normalização `LF -> CRLF`

## Arquivos

- `src/components/pipeline/workspaceOpportunity.ts`
- `src/test/workspaceOpportunity.test.ts`
- `docs/audits/workspace-oportunidade/BLOCO_C1_2_SAIDA_CANONICA_WORKSPACE.md`

## Riscos

- `nome` continua ambíguo e deve ser tratado em bloco posterior, sem decisão definitiva aqui.
- O fallback de identidade por `customerId` continua ativo e exige auditoria própria antes de depreciação.
- Os aliases seguem expostos por compatibilidade, então ainda existe convivência temporária entre contrato canônico e legado.

## Fora do escopo

- Alteração de páginas
- Alteração de payloads
- Alteração de API frontend
- Alteração de backend
- Alteração de Prisma ou banco
- Refatoração de consumidores reais
- Remoção de aliases
- Início do C1.3

## Recomendação para o C1.3

Planejar a redução gradual do consumo direto de aliases legados nos pontos de leitura da Workspace e da Pipeline, começando por campos semanticamente equivalentes ao contrato canônico já estabilizado no C1.2.
