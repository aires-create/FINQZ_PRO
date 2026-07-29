# Auditoria de Contratos e Fonte de Verdade - Workspace da Oportunidade

## Resumo executivo

Esta auditoria confirma que o domínio de Opportunity existe no backend enterprise, mas a Workspace da Oportunidade não está consumindo exclusivamente o contrato Fastify oficial. O cenário atual é híbrido:

- o backend Prisma possui a entidade `Opportunity` e relações com `Pipeline`, `Stage`, `Activity`, `BankProposal` e `Commission`;
- as permissões de `opportunity:*` estão presentes no seed e no middleware enterprise;
- o bootstrap Fastify oficial registra `/api/v1/crm`, `/api/v1/audit`, `/api/v1/commercial`, `/api/v1/integrations`, `/api/v1/organizations` e `/api/v1/users`, mas não expôs um módulo Fastify dedicado a Opportunity;
- as rotas `GET/POST/PUT/DELETE /api/oportunidades` aparecem em runtimes alternativos/compatíveis;
- a Workspace frontend usa `src/pages/Oportunidades.tsx` com forte dependência de estado local, persistência Zustand e adaptadores de compatibilidade.

Conclusão operacional: há contrato oficial de Opportunity no modelo de dados e autorização, porém o fluxo atual da Workspace é sustentado por uma combinação de adaptadores, rotas paralelas e persistência local. A fonte de verdade funcional da tela, hoje, não está concentrada em um único contrato backend.

## Documentação lida

### Auditoria anterior

- `docs/audits/workspace-oportunidade/AUDITORIA_WORKSPACE_OPORTUNIDADE.md`
- `docs/audits/workspace-oportunidade/MATRIZ_FUNCIONAL_WORKSPACE_OPORTUNIDADE.md`
- `docs/audits/workspace-oportunidade/MAPA_TECNICO_WORKSPACE_OPORTUNIDADE.md`
- `docs/audits/workspace-oportunidade/PLANO_EXECUCAO_WORKSPACE_OPORTUNIDADE.md`
- `docs/audits/workspace-oportunidade/REGISTRO_EVIDENCIAS_WORKSPACE_OPORTUNIDADE.md`

### Documentação complementar

- `README.md`
- `ARCHITECTURE_INDEX.md`
- `EXECUTIVE_SUMMARY.md`
- `IMPLEMENTATION_ROADMAP.md`
- `DOMAIN_MODEL_ARCHITECTURE.md`
- `docs/runtime-governance-enterprise.md`
- `docs/architecture/current-state-audit.md`
- `docs/architecture/frontend-domain-map.md`
- `docs/architecture/01-dominios.md`
- `docs/architecture/02-entidades.md`
- `docs/architecture/03-relacionamentos.md`
- `docs/architecture/04-regras-operacionais.md`
- `docs/architecture/05-metricas-oficiais.md`
- `docs/architecture/06-eventos-operacionais.md`
- `docs/architecture/07-rbac.md`
- `docs/architecture/08-padroes-backend.md`
- `docs/architecture/09-padroes-frontend.md`
- `docs/architecture/10-roadmap-tecnico.md`
- `docs/architecture/11-backend-modelagem.md`
- `docs/architecture/12-integrations-domain.md`
- `docs/providers/handmais-provider-audit.md`
- `docs/architecture/adr/ADR-001-commercial-api-source-of-truth.md`
- `docs/architecture/adr/ADR-002-provider-engine.md`
- `docs/architecture/adr/ADR-003-simulation-engine-source-of-truth.md`

## Hipóteses auditadas

1. A Workspace é movida por um contrato Fastify oficial específico de Opportunity.
2. `/api/oportunidades` é a fonte de verdade principal.
3. `/api/v1/crm/*` substitui totalmente Opportunity.
4. Zustand/localStorage é apenas cache visual.
5. O simulador, tags, anexos e histórico já estão plenamente persistidos no backend enterprise.
6. O card do Kanban representa uma entidade única e homogênea em todo o stack.

## Conclusões confirmadas

- Existe entidade oficial `Opportunity` em `backend/prisma/schema.prisma:474`.
- Existe relação explícita entre `Opportunity` e `Pipeline`/`Stage` no Prisma.
- Existe permissão enterprise para `opportunity:create/read/update/delete/approve` em `backend/prisma/seed.ts:380-413`.
- O middleware enterprise inclui `prisma.opportunity` como recurso tenant-scoped em `backend/src/middlewares/enterprise.ts`.
- O bootstrap Fastify oficial registra `crmRoutes` em `/api/v1/crm`, mas não registra um módulo Fastify separado de Opportunity em `backend/src/core/http/fastify.ts:541-547`.
- A Workspace usa `src/pages/Oportunidades.tsx` como tela central, com modal fullscreen, simulador, anexos, histórico e ações rápidas.
- A Workspace usa `src/store/index.ts` com `finqz-pro-storage` e persistência de `oportunidadesKanban`.
- Há wrappers de compatibilidade para `/api/oportunidades` em `src/api/client.ts` e `src/api/modules/oportunidades.api.ts`.
- Há runtime alternativo/compatível com rotas diretas de oportunidades em `backend/server/src/index.ts`.
- Há endpoint SDR específico para criar oportunidade em `backend/src/index.ts:380-452` e `backend/server/src/index.ts:5597-5653`.

## Conclusões refutadas

- Afirmar que “Opportunity não existe no backend” é refutado pelo Prisma, seed e middleware enterprise.
- Afirmar que “a Workspace depende apenas do backend oficial Fastify” é refutado pelos adaptadores, APIs antigas e persistência local.
- Afirmar que “Zustand é apenas cache irrelevante” é refutado pela persistência `oportunidadesKanban`.

## Contratos encontrados

- Contrato oficial de domínio: `Opportunity` no Prisma.
- Contrato oficial de autorização: permissões `opportunity:*`.
- Contrato oficial adjacente para a Workspace: `/api/v1/crm/leads` e `/api/v1/crm/clientes`.
- Contrato compatível/alternativo: `/api/oportunidades`.
- Contrato alternativo adicional: `/api/sdr/opportunity`.
- Persistência local da Workspace: `finqz-pro-storage`, `finqz_opportunities`, `finqz_oportunities` e variações no simulador.

## Entidades encontradas

- Lead
- Customer
- Opportunity
- Pipeline
- Stage
- Activity
- BankProposal
- Commission
- Simulation
- Proposal
- AuditLog
- PartnerAcquisitionLead
- PartnerAcquisitionProspect

## Fonte de verdade por domínio

- `Opportunity`: banco/backend Prisma, com rota funcional ainda fragmentada por runtime.
- `Lead`: contrato oficial CRM Fastify em `/api/v1/crm/leads`.
- `Customer`: contrato oficial CRM Fastify em `/api/v1/crm/clientes`.
- `Pipeline` e `Stage`: modelo Prisma oficial, com uso também no estado local do workspace.
- `Simulator`: majoritariamente local, com persistência em localStorage.
- `Tags`: catálogo local no frontend, com persistência e possível seed parcial.
- `Anexos`: metadados locais e comportamento de UI, sem prova de persistência enterprise nesta auditoria.
- `Histórico`: híbrido entre timeline CRM e histórico local da tela.

## Riscos

- Divergência entre o estado do Kanban persistido localmente e os dados do backend.
- Ambiguidade de contrato entre runtimes oficiais e alternativos.
- Risco de a tela exibir uma agregação de campos que não corresponde a uma única entidade persistida.
- Risco de reconciliação incompleta entre `etapa_id`, `stageId`, `status` e rótulos amigáveis.

## Limitações

- Esta auditoria foi read-only.
- Nenhuma correção funcional foi aplicada.
- Não houve execução de deploy, seed ou migration.
- A validação de runtime foi feita por inspeção de código e contratos locais, não por escrita em HML.

## Conclusão

A fonte de verdade da Workspace da Oportunidade não é um único endpoint isolado. O contrato oficial de domínio existe no backend enterprise, mas a tela atual opera sobre uma composição de contrato CRM oficial, rotas compatíveis antigas, runtime alternativo e estado local persistido. Para a futura Fase A, o caminho seguro é preservar o contrato de domínio `Opportunity` e reduzir dependência de adaptadores locais apenas depois de confirmar o caminho operacional oficial para a tela.
