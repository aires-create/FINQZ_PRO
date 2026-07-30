# Registro de Evidências - Contratos

## Comandos executados

- `git status --short --branch`
- `git worktree list`
- `Get-Location`
- `Get-Content` em documentos de auditoria anteriores e documentação complementar
- `rg -n` para mapear Opportunity, Oportunidade, Lead, Pipeline, Stage, Commercial, Proposal e variações
- `Get-Content` segmentado para contratos, schema, seed, store, frontend e runtimes

## Arquivos inspecionados

- `backend/src/core/http/fastify.ts`
- `backend/src/modules/crm/routes.ts`
- `backend/src/middlewares/enterprise.ts`
- `backend/src/index.ts`
- `backend/server/src/index.ts`
- `backend/prisma/schema.prisma`
- `backend/prisma/seed.ts`
- `src/pages/Oportunidades.tsx`
- `src/store/index.ts`
- `src/api/client.ts`
- `src/api/dataService.ts`
- `src/api/modules/oportunidades.api.ts`
- `src/data/simulatorRepository.ts`

## Evidências principais

- Bootstrap Fastify oficial com `/api/v1/crm`, `/api/v1/audit`, `/api/v1/commercial`, `/api/v1/integrations`, `/api/v1/organizations` e `/api/v1/users`.
- Entidade `Opportunity` em Prisma com relações para `Pipeline`, `Stage`, `Lead`, `Customer`, `Partner`, `Activity`, `BankProposal` e `Commission`.
- Seed com permissões `opportunity:create/read/update/delete/approve`.
- Middleware enterprise com `prisma.opportunity` como recurso tenant-scoped.
- Frontend `src/pages/Oportunidades.tsx` com modal fullscreen, simulador, anotações, tags, anexos, histórico e ações rápidas.
- Store persistida `finqz-pro-storage` com `oportunidadesKanban`.
- Simulador com `localStorage` e criação local de oportunidade.
- Wrappers de compatibilidade para `/api/oportunidades`.

## Limitações

- A leitura de runtime foi feita por inspeção de código, não por escrita em ambiente HML.
- Não foram executados deploys, migrations ou seeds.
- Não houve alteração funcional no código da aplicação.
- Algumas conclusões sobre tags e anexos permanecem parciais porque os arquivos de catálogo/integração não foram comprovados como fonte única nesta auditoria.
