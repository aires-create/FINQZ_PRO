# Mapa Tecnico da Workspace da Oportunidade

| Componente | Hook/Estado | Service frontend | Endpoint | Controller backend | Service backend | Repository | Tabela | Evento | Permissao |
|---|---|---|---|---|---|---|---|---|---|
| `src/pages/Oportunidades.tsx` card click | `handleOpenLead` | N/A | N/A | N/A | N/A | N/A | N/A | Nao emite evento oficial | `oportunidades:view` |
| `src/pages/Oportunidades.tsx` modal fullscreen | `selectedLead`, `showFullscreenModal` | N/A | N/A | N/A | N/A | N/A | N/A | Nao | `oportunidades:view` |
| Drag and drop do Kanban | `handleDrop`, `moveOportunidade` | `src/store/index.ts` | Nao oficial | N/A | N/A | N/A | Store persistido | Nao | `oportunidades:move_opportunity` |
| Edicao de oportunidade | `handleEditClick`, `handleSubmitEdit` | `src/store/index.ts`, `src/api/client.ts` | `/api/oportunidades/:id` (legado) | Nao ha controller oficial de oportunidade | Nao ha service oficial | N/A | N/A | Nao | `oportunidades:edit` |
| Simulador na workspace | `tipoSimulacao`, `simuladorCampos`, `simuladorResultado` | `src/data/catalogRepository.ts` e logica local | Nao oficial no fluxo da workspace | Nao ha controller oficial | Nao ha service oficial | N/A | N/A | Nao | `simulador:view` |
| Tags | `listarTags()`, `selectedLead.tags` | `src/config/tags.ts` | Nao | Nao | Nao | N/A | N/A | Nao | `oportunidades:edit` |
| Anexos | `anexos`, `handleUploadAnexo` | Local apenas | Nao | Nao | Nao | N/A | N/A | Nao | `oportunidades:edit` |
| Historico | Render derivado de `selectedLead` | Local apenas | Nao | Nao | Nao | N/A | N/A | Nao | `audit_read` ou `oportunidades:view` |
| Acoes rapidas | anchors `wa.me`, `tel:`, `mailto:` | Browser only | Nao | Nao | Nao | N/A | N/A | Nao | `oportunidades:view` |
| CRM de origem | `crmRoutes` | `src/api/client.ts` para leads/customers | `/api/v1/crm/leads`, `/api/v1/crm/clientes`, `/api/v1/crm/leads/:id/timeline` | `backend/src/modules/crm/routes.ts` | `leads.service`, `customers.service`, `lead-timeline.service` | Prisma CRM | Leads, Customers, Activities | `LeadCreated`, `LeadQualified`, `ActivityLogged` | RBAC + tenant middleware |
| Auditoria | N/A | `src/api/client.ts` | `/api/v1/audit/logs`, `/api/v1/audit/stats` | `backend/src/modules/audit/routes.ts` | `audit.service` | `audit.repository` | Audit logs | `AuditLogCreated` | `audit_read` |
| Propostas | N/A | `src/api/modules/oportunidades.api.ts` / `src/pages/Simulador.tsx` | `/api/v1/proposals` (legado placeholder) e integracoes | `backend/src/modules/proposals/routes.ts` | Nao consolidado no runtime oficial | N/A | N/A | `BankProposalSubmitted` (conceitual) | `finance_proposal_write` |
| Pipeline config | `currentPipelineConfig`, `etapasAtivas` | `src/data/catalogRepository.ts`, `src/config/pipelines.ts` | Nao | Nao | Nao | N/A | N/A | Nao | `oportunidades:view` |
