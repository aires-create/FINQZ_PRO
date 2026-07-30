# Registro de Evidências - Fase A

## Comandos executados

- `git status --short --branch`
- `git log -3 --oneline`
- `git diff --stat`
- `git diff --name-only`
- `Get-Content` em documentação e arquivos de runtime
- `rg -n` para rastrear contractos, labels, rotas e update paths
- `npm run test -- --run src/test/workspaceOpportunity.test.ts src/test/pipeline.test.ts`
- `npm run build`
- `git diff --check`

## Evidências técnicas

- `src/components/pipeline/workspaceOpportunity.ts`
- `src/components/pipeline/index.ts`
- `src/pages/Oportunidades.tsx`
- `src/test/workspaceOpportunity.test.ts`
- `src/components/pipeline/pipelineUtils.ts`
- `src/config/pipelines.ts`
- `src/config/tags.ts`
- `src/store/index.ts`
- `backend/prisma/schema.prisma`
- `backend/prisma/seed.ts`
- `backend/src/middlewares/enterprise.ts`
- `backend/src/core/http/fastify.ts`
- `backend/src/modules/crm/routes.ts`

## Resultados

- Testes focados: aprovados.
- Build do frontend: aprovado.
- Pipeline: render e shape dos cards preservados.

## Limitações

- Lint não foi executado porque não há binário `eslint` instalado no workspace raiz.
- Nenhum deploy foi realizado.
- Nenhuma migration ou seed foi executada.

## Nota sobre precedência

- O backend tem precedência na confirmação da mutação.
- Em falha remota, não há commit local confirmado e o erro permanece visível.
