# Registro de Evidencias da Workspace da Oportunidade

## Caminhos revisados
- `src/pages/Oportunidades.tsx`
- `src/routes/crm.routes.tsx`
- `src/store/index.ts`
- `src/api/client.ts`
- `src/api/dataService.ts`
- `src/api/adapters.ts`
- `src/api/modules/oportunidades.api.ts`
- `src/config/pipelines.ts`
- `src/config/tags.ts`
- `src/components/pipeline/pipelineUtils.ts`
- `src/pages/Simulador.tsx`
- `backend/src/core/http/fastify.ts`
- `backend/src/modules/crm/routes.ts`
- `backend/src/modules/audit/routes.ts`
- `backend/src/modules/proposals/routes.ts`
- `backend/prisma/schema.prisma`
- `docs/runtime-governance-enterprise.md`
- `docs/architecture/current-state-audit.md`
- `docs/architecture/frontend-domain-map.md`
- `docs/architecture/09-padroes-frontend.md`
- `docs/architecture/07-rbac.md`
- `docs/architecture/02-entidades.md`
- `docs/architecture/03-relacionamentos.md`
- `docs/architecture/04-regras-operacionais.md`
- `docs/architecture/06-eventos-operacionais.md`
- `docs/architecture/adr/ADR-001-commercial-api-source-of-truth.md`
- `docs/architecture/adr/ADR-002-provider-engine.md`
- `docs/architecture/adr/ADR-003-simulation-engine-source-of-truth.md`
- `docs/ci-cd.md`
- `docs/testing-strategy.md`

## Trechos relevantes
- `handleOpenLead(lead)` abre a workspace no mesmo componente.
- O header exibe `selectedLead?.etapa_id ?? selectedLead?.etapa`.
- As abas de tarefas, anotacoes, tags, anexos e historico usam estado local ou arrays literais.
- O simulador de oportunidade oferece tipos independentes do produto atual.
- As acoes rapidas usam links diretos para `wa.me`, `tel:` e `mailto:`.
- O store persiste `oportunidadesKanban` em `finqz-pro-storage`.
- O runtime Fastify oficial registra `crmRoutes` em `/api/v1/crm`, mas nao registra `/api/oportunidades`.

## Endpoints encontrados
- Oficiais:
  - `GET /api/v1/crm/leads`
  - `GET /api/v1/crm/clientes`
  - `GET /api/v1/crm/leads/:id`
  - `GET /api/v1/crm/leads/:id/timeline`
  - `GET /api/v1/audit/logs`
  - `GET /api/v1/audit/stats`
  - `GET /api/v1/proposals` (placeholder/legacy)
- Legados ou fantasma no contexto da workspace:
  - `GET /api/oportunidades`
  - `GET /api/oportunidades/pipeline`
  - `GET /api/oportunidades/:id`
  - `PUT /api/oportunidades/:id`
  - `DELETE /api/oportunidades/:id`
  - `POST /api/opportunidades/:id/mover` (ortografia divergente em `src/api/modules/oportunidades.api.ts`)

## Schemas e tabelas relevantes
- `Pipeline`
- `Stage`
- `Opportunity`
- `Activity`
- `BankProposal`
- `Commission`
- `AuditLog`
- `PartnerAcquisitionLead`
- `PartnerAcquisitionProspect`
- `PartnerAcquisitionEvent`
- `PartnerAcquisitionOutbox`
- `PartnerAcquisitionCommandInbox`
- `PartnerAcquisitionConversionDecision`

## Migrations revisadas
- `backend/prisma/migrations/20260507231154_enterprise_multitenant_architecture/migration.sql`
- `backend/prisma/migrations/20260508000000_audit_log_entity_id_text/migration.sql`
- `backend/prisma/migrations/20260625162104_h16k1_partner_acquisition/migration.sql`

## Componentes e estados usados
- `selectedLead`
- `showFullscreenModal`
- `showOpportunityForm`
- `editingOportunidade`
- `editDrawerData`
- `simuladorCampos`
- `simuladorResultado`
- `anexos`
- `activeTab`
- `columnSort`
- `filters`

## Testes existentes que ajudam na auditoria
- `src/test/pipeline.test.ts`
- `backend/src/tests/unit/partner-acquisition/*`
- `backend/src/tests/integration/partner-acquisition.integration.test.ts`
- `backend/src/tests/unit/integrations/*`
- `backend/src/tests/unit/rbac/partner-acquisition-rbac.test.ts`
- `backend/src/tests/integration/financial-proposals.test.ts`

## Comandos executados e resultado
1. `git status --short --branch`
   - Branch atual: `integration/g18-partner-acquisition-runtime`
   - Arquivos modificados ja existentes no checkout
   - Pastas/artefatos nao rastreados em `_worktrees/`, `backend/backups/`, `release/`, tarballs e zips
2. `rg --files ...`
   - Localizou a documentacao oficial e os arquivos da workspace
3. `rg -n ... src/pages/Oportunidades.tsx`
   - Confirmou o fluxo do clique, cabecalho cru, abas locais e dependencias legadas
4. `rg -n ... backend/src/core/http/fastify.ts`
   - Confirmou que o runtime oficial Fastify nao registra rota oficial de oportunidade

## Resultado consolidado
- Workspace conectada principalmente ao frontend local
- Backend oficial cobre CRM, audit e outros modulos, mas nao a workspace completa
- A tela precisa de contrato oficial antes de ser considerada aderente ao SSOT
