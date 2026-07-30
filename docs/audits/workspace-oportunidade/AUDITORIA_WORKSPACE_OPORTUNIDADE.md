# Auditoria da Workspace da Oportunidade

## Status da auditoria
Auditoria executada em modo read-only. O fluxo principal da Workspace foi mapeado, mas a conclusao tecnica e que a tela ainda opera majoritariamente como uma experiencia local-first, com partes mockadas ou desconectadas do backend oficial.

## Resumo executivo
A Workspace da Oportunidade vive no frontend raiz (`src/pages/Oportunidades.tsx`) e abre em modal fullscreen a partir do clique em um card do Kanban. O componente centraliza a maior parte da experiencia em uma unica pagina e usa estado local, Zustand persistido e algumas chamadas para rotas legadas.

Os principais desvios encontrados sao:

1. O cabeçalho da Workspace exibe `etapa_id` cru, em vez do nome amigavel da etapa.
2. A aba de simulador aceita tipos de simulacao que nao estao claramente vinculados ao produto da oportunidade.
3. Tags, anexos, historico e parte das acoes rapidas sao locais ou estaticos, sem persistencia oficial no backend enterprise.
4. O frontend referencia `/api/oportunidades` e `/api/oportunidades/pipeline`, mas o backend Fastify oficial registra CRM apenas em `/api/v1/crm/*`.
5. O fluxo de edicao e salvamento continua com forte dependencia do store local e de rotas legadas.

## Documentacao localizada
### Lida em detalhe
- `README.md`
- `ARCHITECTURE_INDEX.md`
- `EXECUTIVE_SUMMARY.md`
- `IMPLEMENTATION_ROADMAP.md`
- `DOMAIN_MODEL_ARCHITECTURE.md`
- `docs/runtime-governance-enterprise.md`
- `docs/architecture/current-state-audit.md`
- `docs/architecture/adr/ADR-001-commercial-api-source-of-truth.md`
- `docs/architecture/adr/ADR-002-provider-engine.md`
- `docs/architecture/adr/ADR-003-simulation-engine-source-of-truth.md`
- `docs/architecture/frontend-domain-map.md`
- `docs/architecture/09-padroes-frontend.md`
- `docs/architecture/07-rbac.md`
- `docs/architecture/02-entidades.md`
- `docs/architecture/03-relacionamentos.md`
- `docs/architecture/04-regras-operacionais.md`
- `docs/architecture/06-eventos-operacionais.md`
- `docs/ci-cd.md`
- `docs/testing-strategy.md`
- `backend/docs/staging-smoke-checklist.md`

### Localizada, mas nao lida em profundidade nesta rodada
- `docs/architecture/10-roadmap-tecnico.md`
- `docs/architecture/11-backend-modelagem.md`
- `docs/architecture/12-integrations-domain.md`
- `docs/providers/handmais-provider-audit.md`
- `docs/architecture/08-padroes-backend.md`
- `docs/architecture/05-metricas-oficiais.md`
- `docs/architecture/01-dominios.md`

## Hierarquia documental observada
1. Documento de visao e consolidacao: `README.md`, `EXECUTIVE_SUMMARY.md`, `IMPLEMENTATION_ROADMAP.md`, `DOMAIN_MODEL_ARCHITECTURE.md`
2. SSOT de runtime e governanca: `docs/runtime-governance-enterprise.md`
3. Arquitetura consolidada: `docs/architecture/current-state-audit.md` e ADRs
4. Normas de frontend e RBAC: `docs/architecture/09-padroes-frontend.md`, `docs/architecture/07-rbac.md`
5. Modelo de dominio e regras: `docs/architecture/02-entidades.md`, `03-relacionamentos.md`, `04-regras-operacionais.md`, `06-eventos-operacionais.md`
6. Operacao e entrega: `docs/ci-cd.md`, `docs/testing-strategy.md`, `backend/docs/staging-smoke-checklist.md`

## Arquitetura encontrada
### Frontend
- Raiz funcional em `src/`
- Tela principal da workspace em `src/pages/Oportunidades.tsx`
- Store global persistido em `src/store/index.ts`
- Camada de compatibilidade/legado em `src/api/client.ts`, `src/api/dataService.ts`, `src/api/adapters.ts`
- Configuracoes de pipeline e tags em `src/config/pipelines.ts` e `src/config/tags.ts`

### Backend
- Runtime oficial Fastify em `backend/src/core/http/fastify.ts` e `backend/src/server.fastify.ts`
- Modulos oficiais registrados: CRM, Audit, Commercial, Integrations, Organization, Users, Partner Acquisition
- Nao foi encontrado modulo oficial de oportunidades em `/api/v1/oportunidades`
- CRM oficial cobre leads, customers e timeline em `/api/v1/crm/*`
- Proposals existe como rota legado/placeholder em `backend/src/modules/proposals/routes.ts`

## Fluxo pos-clique mapeado
1. Clique no card do Kanban
2. `handleOpenLead(lead)` em `src/pages/Oportunidades.tsx`
3. `setSelectedLead(lead)`
4. `setShowFullscreenModal(true)`
5. Render do modal fullscreen com abas
6. Oportunidade fica dentro do mesmo componente, sem navegação real para nova rota

## Inventario frontend
- `src/pages/Oportunidades.tsx`: workspace principal
- `src/routes/crm.routes.tsx`: rota `crm/pipeline` e alias para `crm/oportunidades`
- `src/store/index.ts`: estado das oportunidades e pipelines, com persistencia local
- `src/components/pipeline/pipelineUtils.ts`: filtros e agrupamento de oportunidades
- `src/config/pipelines.ts`: pipelines oficiais e legados
- `src/config/tags.ts`: catalogo estatico de tags
- `src/pages/Simulador.tsx`: simulador standalone com gravacao local
- `src/api/client.ts`, `src/api/dataService.ts`, `src/api/adapters.ts`: compatibilidade e fallback local

## Inventario backend
- `backend/src/core/http/fastify.ts`: bootstrap oficial
- `backend/src/modules/crm/routes.ts`: leads, customers, timeline
- `backend/src/modules/audit/routes.ts`: logs e stats de auditoria
- `backend/src/modules/proposals/routes.ts`: express legacy para propostas
- `backend/prisma/schema.prisma`: models de pipeline, stage, opportunity, activity, bankProposal e commission

## Achados criticos
1. `etapa_id` aparece cru no header da Workspace.
2. A Workspace depende de rotas legadas de oportunidade que nao pertencem ao runtime oficial Fastify.
3. Simulador, tags, anexos e historico nao estao ligados a um fluxo persistido oficial ponta a ponta.
4. O store persistido pode mascarar a ausencia de backend real, criando falsa sensacao de completude.

## Achados altos
1. A tela concentra muitos estados e handlers em um unico arquivo.
2. A edicao reutiliza o mesmo formulario em mais de um lugar, mas continua fortemente acoplada ao estado local.
3. O layout mostra muito espaco vazio e hierarquia visual inconsistente para uma tela enterprise.
4. As acoes rapidas misturam links reais com botoes que so alteram estado local.

## Funcionalidades completas
- Abertura do modal fullscreen ao clicar no card
- Drag and drop entre colunas do Kanban
- Filtragem por pipeline e etapa no frontend
- Abertura de WhatsApp, telefone e e-mail a partir do card e do painel lateral

## Funcionalidades parciais
- Edicao de oportunidade
- Simulador
- Tags
- Anexos
- Historico
- Acoes rapidas de edicao

## Funcionalidades nao implementadas
- Persistencia oficial da Workspace no backend enterprise
- Fluxo oficial de anexos com storage e auditoria
- Fluxo oficial de PDF/proposta integrado ao backend
- Historico com event store ou audit log dedicado para a Workspace

## Divergencias do SSOT
- `etapa_id` exibida como UUID/codigo em vez de nome amigavel
- uso de `/api/oportunidades` em vez de `/api/v1/*`
- simulador permitindo tipos nao claramente vinculados ao produto da oportunidade
- tags fixas em array local
- anexos e historico em estado local

## Riscos de regressao no Pipeline
- Alto risco se a mesma base de dados/estado do Kanban for reutilizada sem isolamento
- Alto risco se a correcao do cabeçalho de etapa alterar o mapeamento compartilhado do Kanban
- Medio risco se a migracao para backend oficial nao preservar a compatibilidade com o fluxo atual do card

## Plano recomendado
1. Corrigir o mapeamento de etapa sem alterar o Kanban.
2. Separar claramente workspace local de contratos oficiais.
3. Consolidar simulador, tags, anexos e historico em contratos reais antes de qualquer redesenho.
4. Migrar a persistencia da oportunidade para o backend oficial, com rollback controlado.

## Confirmacoes
- Nenhum codigo funcional foi alterado.
- Nenhum deploy foi realizado.

## Evidencias principais
- `src/pages/Oportunidades.tsx`
- `src/routes/crm.routes.tsx`
- `src/store/index.ts`
- `src/api/client.ts`
- `src/api/dataService.ts`
- `src/api/adapters.ts`
- `backend/src/core/http/fastify.ts`
- `backend/src/modules/crm/routes.ts`
- `backend/src/modules/audit/routes.ts`
- `backend/src/modules/proposals/routes.ts`
- `backend/prisma/schema.prisma`
