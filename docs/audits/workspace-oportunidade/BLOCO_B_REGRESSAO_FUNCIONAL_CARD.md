# Bloco B - Regressao Funcional do Card da Pipeline

## Resumo executivo

Foi revisada a regressao de abertura dos cards da Pipeline em `src/pages/Oportunidades.tsx`, consolidando o uso do normalizador oficial do workspace com o `stageCatalog` ativo e estabilizando a renderizacao do modal fullscreen.

## Cenarios implementados

- Abertura do card principal da Pipeline sem ReferenceError em runtime.
- Renderizacao da etapa no header a partir do dado normalizado.
- Preservacao do comportamento dos acoes internas do card com `stopPropagation`.
- Transicao entre cards de fases diferentes sem estado residual.
- Abertura correta de cards com payload parcial ou legado.

## Evidencias

- `npm test` concluido com sucesso.
- `npm run build` concluido com sucesso.
- `git diff --check` sem erros.

## Falhas encontradas

- O handler `handleOpenLead` usava o normalizador oficial sem `stageCatalog`, o que podia degradar o estado exibido no fullscreen.
- O header do modal ainda priorizava `etapa_id`, exibindo identificadores tecnicos em vez do label canônico.
- O teste estrutural de hardening ainda refletia a versao anterior do contrato.

## Arquivos alterados

- `src/pages/Oportunidades.tsx`
- `src/test/oportunidades-card-interaction.test.tsx`
- `src/test/oportunidades-kanban-hardening.test.ts`

## Riscos remanescentes

- O worktree ainda contem alteracoes preexistentes fora deste bloco.
- O Browser/Document runtime pode emitir avisos nao bloqueantes durante os testes.

## Recomendacao para o proximo bloco

- Manter o contrato entre o normalizador oficial e o modal fullscreen como regressao observavel.
- Preservar os testes de interacao do card e o hardening estrutural como guarda de contrato.
