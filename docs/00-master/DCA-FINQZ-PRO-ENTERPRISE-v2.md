# FINQZ PRO Enterprise
## Documento Mestre de Continuidade Arquitetural
### Versao 2.0

- **Data:** 2026-06-25
- **Status:** Draft estruturado
- **Branch oficial:** `homologation/bootstrap-vps`
- **Ambiente HML:** `hml.finqz.com.br`
- **Responsavel tecnico:** Engenharia / Arquitetura FINQZ PRO

---

## 1. Objetivo do Documento

Este Documento Mestre de Continuidade Arquitetural v2 e a fonte oficial de continuidade do FINQZ PRO Enterprise.

Seu papel e reduzir dependencia de memoria de chat, consolidar decisoes arquiteturais, registrar status atual das ondas e orientar o roadmap incremental do produto.

Este documento deve ser tratado como ponto de referencia para:

- alinhamento entre engenharia, arquitetura e operacao;
- retomada segura em novos chats;
- validacao de escopo antes de implementar runtime;
- protecao contra duplicidade de fontes e uso indevido de legado.

---

## 2. Principios Obrigatorios

- Backend First
- Tenant Scoped
- RBAC Driven
- Auditavel
- Provider Driven
- Event Ready
- Single Source of Truth
- No Legacy
- No Duplicate Sources
- No Parallel APIs
- Contracts Before Runtime
- Architecture Before Implementation
- No Frontend Ownership of Business Rules
- Analisar -> Mapear -> Documentar -> Validar -> Implementar -> Testar -> Consolidar

---

## 3. Visao Enterprise do Sistema

O FINQZ PRO Enterprise e uma plataforma SaaS multi-tenant para CRM, operacoes financeiras, parceiros, Corban, bancos, fintech, simulador, provider engine, comissionamento, settlement e marketplace.

### 3.1 Contexto macro

- Multi-tenant por concepcao.
- RBAC como camada central de controle de acesso.
- Backend como fonte principal de regras e contratos.
- Frontend como consumidor de contratos oficiais.
- Operacao orientada a auditoria, rastreabilidade e continuidade.

### 3.2 Objetivos de produto

- Consolidar dominos oficiais.
- Evitar acoplamentos historicos.
- Preservar evolucao incremental por ondas.
- Manter compatibilidade operacional onde necessario.

---

## 4. Mapa de Dominios Oficiais

> Preencher cada bloco de dominio com o mesmo template.

### Template de dominio

- **Responsabilidade:** [placeholder]
- **Owner:** [placeholder]
- **Status:** [placeholder]
- **APIs:** [placeholder]
- **Frontend:** [placeholder]
- **Dependencias:** [placeholder]
- **Consumers:** [placeholder]
- **Producers:** [placeholder]
- **Legados relacionados:** [placeholder]
- **Proximas fases:** [placeholder]

### 4.1 Tenant
- Responsabilidade: [placeholder]
- Owner: [placeholder]
- Status: [placeholder]
- APIs: [placeholder]
- Frontend: [placeholder]
- Dependencias: [placeholder]
- Consumers: [placeholder]
- Producers: [placeholder]
- Legados relacionados: [placeholder]
- Proximas fases: [placeholder]

### 4.2 Organization
- Responsabilidade: [placeholder]
- Owner: [placeholder]
- Status: [placeholder]
- APIs: [placeholder]
- Frontend: [placeholder]
- Dependencias: [placeholder]
- Consumers: [placeholder]
- Producers: [placeholder]
- Legados relacionados: [placeholder]
- Proximas fases: [placeholder]

### 4.3 Users
- Responsabilidade: [placeholder]
- Owner: [placeholder]
- Status: [placeholder]
- APIs: [placeholder]
- Frontend: [placeholder]
- Dependencias: [placeholder]
- Consumers: [placeholder]
- Producers: [placeholder]
- Legados relacionados: [placeholder]
- Proximas fases: [placeholder]

### 4.4 Permissions / RBAC
- Responsabilidade: [placeholder]
- Owner: [placeholder]
- Status: [placeholder]
- APIs: [placeholder]
- Frontend: [placeholder]
- Dependencias: [placeholder]
- Consumers: [placeholder]
- Producers: [placeholder]
- Legados relacionados: [placeholder]
- Proximas fases: [placeholder]

### 4.5 CRM Clientes
- Responsabilidade: runtime oficial de clientes CRM, com listagem, criacao, edicao, exclusao, busca e sincronizacao oficial
- Owner: Backend CRM / Clientes
- Status: Production Ready
- APIs: `/api/v1/clientes`
- Frontend: `src/pages/Clientes.tsx`
- Dependencias: Tenant Scoped, RBAC Driven, audit trail, persistencia oficial, refetch apos mutacoes
- Consumers: CRM, campanhas, operacoes comerciais
- Producers: backend oficial de Clientes e frontend consumidor
- Legados relacionados: `src/api/client.ts`, `src/api/dataService.ts` permanecem apenas como compatibilidade historica fora do runtime oficial
- Proximas fases: evolucao de cobertura funcional e consolidacao do ecossistema CRM

### 4.6 Pipeline
- Responsabilidade: fluxo oficial de pipeline e stages para o dominio comercial
- Owner: Backend oficial de Pipeline
- Status: Production Ready
- APIs: `/api/v1/pipelines`
- Frontend: `src/pages/Oportunidades.tsx`, `src/pages/Configuracoes.tsx`, `src/pages/admin/Pipelines.tsx`
- Dependencias: Opportunity, Tenant Scoped, RBAC Driven, reorder oficial, audit trail, soft delete
- Consumers: Opportunity, esteira/kanban, configuracoes administrativas
- Producers: backend oficial de pipelines e stages
- Legados relacionados: `config/pipelines.ts` e heuristicas historicas permanecem apenas como compatibilidade, sem governar runtime
- Proximas fases: cobertura de evolucao do dominio comercial remanescente e consolidacao documental

### 4.7 Opportunity
- Responsabilidade: runtime oficial de oportunidades, incluindo lifecycle, Kanban operacional e persistencia oficial via move/update/delete
- Owner: Backend oficial de Opportunity
- Status: Production Ready
- APIs: `/api/v1/opportunities`
- Frontend: `src/pages/Oportunidades.tsx`
- Dependencias: CRM Clientes, Pipeline, Tenant Scoped, RBAC Driven, audit trail, refetch pos-mudanca
- Consumers: esteira/kanban, simulador, pipeline, CRM operacional
- Producers: backend oficial de opportunities
- Legados relacionados: `useAppStore` permanece apenas como compatibilidade de UI/usuarios/permissoes; nao governa o runtime oficial
- Proximas fases: evolucao de cobertura de fluxo comercial e endurecimento residual de compatibilidade

### 4.8 Partner
- Responsabilidade: [placeholder]
- Owner: [placeholder]
- Status: [placeholder]
- APIs: [placeholder]
- Frontend: [placeholder]
- Dependencias: [placeholder]
- Consumers: [placeholder]
- Producers: [placeholder]
- Legados relacionados: [placeholder]
- Proximas fases: [placeholder]

### 4.9 Partner Acquisition
- Responsabilidade: [placeholder]
- Owner: [placeholder]
- Status: Production Ready with Restrictions
- APIs: [placeholder]
- Frontend: [placeholder]
- Dependencias: [placeholder]
- Consumers: [placeholder]
- Producers: [placeholder]
- Legados relacionados: [placeholder]
- Proximas fases: H19.1A harmonizacao documental DCA/ARCH concluida; H19.1B contract test hardening concluida; ajuste fino de UX/estado ENRICHED permanece como refinamento futuro

### 4.10 Master Catalog
- Responsabilidade: [placeholder]
- Owner: [placeholder]
- Status: [placeholder]
- APIs: [placeholder]
- Frontend: [placeholder]
- Dependencias: [placeholder]
- Consumers: [placeholder]
- Producers: [placeholder]
- Legados relacionados: [placeholder]
- Proximas fases: [placeholder]

## Registro de Continuidade — Bloco B — Regressão Funcional do Card

### Status

CONCLUÍDO

### Branch

promotion/hml-g18-full

### Commit oficial

3710a21b1d36bb916e5cf86b56945df4739cb9b6

### Mensagem do commit

fix(workspace): normalize stage label and add card interaction regression tests

### Resumo técnico

A função `normalizeOpportunityWorkspace` era utilizada no código, porém o `handleOpenLead` não fornecia o `stageCatalog` ativo, e o header do modal priorizava `etapa_id` em vez de `stageLabel`. Corrigiu-se o `handleOpenLead` para passar `stageCatalog: etapasAtivas` e o modal foi atualizado para priorizar `stageLabel`. Foram adicionados testes de interação de cartão e de hardening estrutural.

### Evidências

- 31 arquivos de teste aprovados / 146 testes aprovados
- Build concluído com sucesso
- Architecture governance check: passado
- git diff --check: sem erros
- Commit: 3710a21b1d36bb916e5cf86b56945df4739cb9b6 (branch `promotion/hml-g18-full`)

### Riscos remanescentes

- Seletores de modal baseados em classe CSS (não bloqueante)
- Cobertura adicional necessária para menus e exclusão
- Workspace ainda híbrido em funcionalidades adicionais

### Governança observada

- Nenhuma alteração em Prisma, migrations, endpoints, RBAC, tenant ou VPS
- Nenhum deploy, instalação de dependências ou force-push


### 4.11 Commercial Coverage
- Responsabilidade: [placeholder]
- Owner: [placeholder]
- Status: [placeholder]
- APIs: [placeholder]
- Frontend: [placeholder]
- Dependencias: [placeholder]
- Consumers: [placeholder]
- Producers: [placeholder]
- Legados relacionados: [placeholder]
- Proximas fases: [placeholder]

### 4.12 Commercial Tables
- Responsabilidade: [placeholder]
- Owner: [placeholder]
- Status: [placeholder]
- APIs: [placeholder]
- Frontend: [placeholder]
- Dependencias: [placeholder]
- Consumers: [placeholder]
- Producers: [placeholder]
- Legados relacionados: [placeholder]
- Proximas fases: [placeholder]

### 4.13 Simulator
- Responsabilidade: [placeholder]
- Owner: [placeholder]
- Status: [placeholder]
- APIs: [placeholder]
- Frontend: [placeholder]
- Dependencias: [placeholder]
- Consumers: [placeholder]
- Producers: [placeholder]
- Legados relacionados: [placeholder]
- Proximas fases: [placeholder]

### 4.14 Provider Engine
- Responsabilidade: [placeholder]
- Owner: [placeholder]
- Status: [placeholder]
- APIs: [placeholder]
- Frontend: [placeholder]
- Dependencias: [placeholder]
- Consumers: [placeholder]
- Producers: [placeholder]
- Legados relacionados: [placeholder]
- Proximas fases: [placeholder]

### 4.15 Commission
- Responsabilidade: [placeholder]
- Owner: [placeholder]
- Status: [placeholder]
- APIs: [placeholder]
- Frontend: [placeholder]
- Dependencias: [placeholder]
- Consumers: [placeholder]
- Producers: [placeholder]
- Legados relacionados: [placeholder]
- Proximas fases: [placeholder]

### 4.16 Settlement
- Responsabilidade: [placeholder]
- Owner: [placeholder]
- Status: [placeholder]
- APIs: [placeholder]
- Frontend: [placeholder]
- Dependencias: [placeholder]
- Consumers: [placeholder]
- Producers: [placeholder]
- Legados relacionados: [placeholder]
- Proximas fases: [placeholder]

### 4.17 Marketplace
- Responsabilidade: [placeholder]
- Owner: [placeholder]
- Status: [placeholder]
- APIs: [placeholder]
- Frontend: [placeholder]
- Dependencias: [placeholder]
- Consumers: [placeholder]
- Producers: [placeholder]
- Legados relacionados: [placeholder]
- Proximas fases: [placeholder]

### 4.18 FINQZ HUB
- Responsabilidade: [placeholder]
- Owner: [placeholder]
- Status: [placeholder]
- APIs: [placeholder]
- Frontend: [placeholder]
- Dependencias: [placeholder]
- Consumers: [placeholder]
- Producers: [placeholder]
- Legados relacionados: [placeholder]
- Proximas fases: [placeholder]

### 4.19 Audit / Event Log
- Responsabilidade: [placeholder]
- Owner: [placeholder]
- Status: [placeholder]
- APIs: [placeholder]
- Frontend: [placeholder]
- Dependencias: [placeholder]
- Consumers: [placeholder]
- Producers: [placeholder]
- Legados relacionados: [placeholder]
- Proximas fases: [placeholder]

---

## 5. Estado Oficial Atual

| Dominio | Status oficial |
|---|---|
| CRM Clientes | Production Ready |
| Pipeline | Production Ready |
| Opportunity | Production Ready |
| Kanban / Esteira | Production Ready |
| Master Catalog | GO |
| Commercial Coverage | GO |
| Partner Core | GO WITH RESTRICTIONS |
| Partner Form Audit | Pending |
| Partner Acquisition | Production Ready with Restrictions - Lead e Prospect runtime, listagem, detalhe e workflow oficial integrados; H19.1A e H19.1B concluídas |
| Commercial Tables | Architecture / Pending Runtime |
| Simulator | Pending Runtime |
| RBAC / Permissions | GO WITH RESTRICTIONS |
| FINQZ HUB / SDR IA | Future Strategic Domain |
| Legacy cleanup | Ongoing |

---

## 6. Historico de Fases

> Estrutura oficial para registrar ondas e consolidacoes futuras.

### Template de fase

- **Fase:** [placeholder]
- **Objetivo:** [placeholder]
- **Decisao:** [placeholder]
- **Arquivos:** [placeholder]
- **Commits:** [placeholder]
- **Validacoes:** [placeholder]
- **Resultado:** [placeholder]
- **Restricoes:** [placeholder]
- **Proxima fase:** [placeholder]

### 6.1 Fases recentes conhecidas

#### H15
- Objetivo: Audits e usage protection de Pipeline / Opportunity.
- Decisao: proteger uso indevido de dominio e manter fronteiras.
- Arquivos: [placeholder]
- Commits: [placeholder]
- Validacoes: [placeholder]
- Resultado: [placeholder]
- Restricoes: [placeholder]
- Proxima fase: H16 Partner Acquisition backend / source mapping.

#### H16
- Objetivo: Consolidar Partner Acquisition do contrato ate runtime.
- Decisao: separar esteira de aquisicao de parceiros de Opportunity e Partner oficial.
- Arquivos: [placeholder]
- Commits: [placeholder]
- Validacoes: [placeholder]
- Resultado: [placeholder]
- Restricoes: [placeholder]
- Proxima fase: H17 frontend Partner Acquisition.

#### H17B
- Objetivo: Partner Acquisition Lead List Runtime.
- Decisao: aprovado read-only em HML.
- Arquivos: [`src/pages/PartnerAcquisitionLeads.tsx`](../../src/pages/PartnerAcquisitionLeads.tsx) [placeholder]
- Commits: `e76a903`
- Validacoes: build e arch:check aprovados.
- Resultado: lista homologada.
- Restricoes: sem edicao, sem workflow.
- Proxima fase: H17C.

#### H17C
- Objetivo: Partner Acquisition Lead Details Read Only.
- Decisao: aprovado read-only em HML.
- Arquivos: [`src/pages/PartnerAcquisitionLeadDetails.tsx`](../../src/pages/PartnerAcquisitionLeadDetails.tsx) [placeholder]
- Commits: `af29675`
- Validacoes: build e arch:check aprovados.
- Resultado: detalhe homologado.
- Restricoes: sem metadata, sem references, sem workflow.
- Proxima fase: H17D.

#### H17D
- Objetivo: Partner Acquisition UX Polish & Navigation.
- Decisao: [placeholder]
- Arquivos: [placeholder]
- Commits: [placeholder]
- Validacoes: [placeholder]
- Resultado: [placeholder]
- Restricoes: manter somente refinamentos de UX.
- Proxima fase: [placeholder]

#### H18A
- Objetivo: Partner Prospect Frontend Read-Only Runtime Foundation.
- Decisao: aprovado runtime read-only para Prospects.
- Arquivos: [placeholder]
- Commits: [placeholder]
- Validacoes: build, arch:check e test aprovados.
- Resultado: listagem e detalhe de Prospect disponiveis.
- Restricoes: sem workflow, sem conversao, sem Partner.
- Proxima fase: H18B.

#### H18B
- Objetivo: Prospect Workflow Action Readiness Audit e resolucao de contrato RBAC.
- Decisao: arquitetura validada com restricoes; ARCH-073 consolidado como fonte canonica de RBAC para Prospect Runtime.
- Arquivos: [placeholder]
- Commits: [placeholder]
- Validacoes: auditoria tecnica em modo leitura.
- Resultado: prontidao confirmada para H18C.
- Restricoes: harmonizar divergencias documentais remanescentes.
- Proxima fase: H18C.

#### H18C
- Objetivo: Partner Prospect Workflow Runtime Integration.
- Decisao: workflow oficial integrado no detalhe do Prospect.
- Arquivos: [`src/pages/PartnerAcquisitionProspectDetails.tsx`](../../src/pages/PartnerAcquisitionProspectDetails.tsx) [placeholder]
- Commits: [placeholder]
- Validacoes: build, arch:check e test aprovados.
- Resultado: acoes oficiais com idempotencia, loading, erro, sucesso e refresh pos-sucesso.
- Restricoes: acoes apenas no detalhe; listagem permanece read-only.
- Proxima fase: H18D.

#### H18D
- Objetivo: Partner Acquisition Production Readiness Audit.
- Decisao: GO WITH RESTRICTIONS.
- Arquivos: [placeholder]
- Commits: [placeholder]
- Validacoes: build, arch:check e test aprovados.
- Resultado: modulo considerado pronto com restricoes operacionais.
- Restricoes: divergencia documental residual; cobertura adicional de contrato e validacao de estado ENRICHED.
- Proxima fase: harmonizacao documental e endurecimento de testes.

#### H20A
- Objetivo: CRM Domain Reality Audit.
- Decisao: diagnostico tecnico do dominio CRM, Pipeline, Opportunity e Kanban.
- Arquivos: [placeholder]
- Commits: [placeholder]
- Validacoes: auditoria em modo leitura.
- Resultado: fotografia real do dominio CRM registrada.
- Restricoes: runtime ainda misto no inicio da wave, com remanescentes de compatibilidade a enderecar.
- Proxima fase: H20B.1.

#### H20B.1
- Objetivo: CRM Clientes Homologation Audit.
- Decisao: clientes aptos a evoluir para produção com restricoes residuais.
- Arquivos: [`src/pages/Clientes.tsx`](../../src/pages/Clientes.tsx) [placeholder]
- Commits: [placeholder]
- Validacoes: homologacao funcional do dominio Clientes.
- Resultado: dominio Clientes preparado para hardening.
- Restricoes: remanescentes de store e surfaces legadas.
- Proxima fase: H20B.1A.

#### H20B.1A
- Objetivo: CRM Clientes Production Hardening.
- Decisao: endurecimento controlado da runtime de Clientes.
- Arquivos: [`src/pages/Clientes.tsx`](../../src/pages/Clientes.tsx), [`src/api/modules/clientes.api.ts`](../../src/api/modules/clientes.api.ts) [placeholder]
- Commits: `c85198a`
- Validacoes: build, testes e arch:check aprovados.
- Resultado: Clientes Production Ready.
- Restricoes: compatibilidade historica isolada fora do runtime oficial.
- Proxima fase: H20B.2.

#### H20B.2
- Objetivo: Pipeline + Opportunity + Kanban Production Homologation Audit.
- Decisao: runtime operacional validado para consolidacao final.
- Arquivos: [placeholder]
- Commits: [placeholder]
- Validacoes: auditoria tecnica em modo leitura.
- Resultado: gaps mapeados e prontos para consolidacao.
- Restricoes: resquicios de ownership hibrido identificados no frontend.
- Proxima fase: H20B.2A.

#### H20B.2A
- Objetivo: Pipeline Runtime Consolidation.
- Decisao: owner operacional consolidado no backend.
- Arquivos: [`src/pages/Oportunidades.tsx`](../../src/pages/Oportunidades.tsx), [`src/pages/Configuracoes.tsx`](../../src/pages/Configuracoes.tsx) [placeholder]
- Commits: `792288b`
- Validacoes: build, testes e arch:check aprovados.
- Resultado: Pipeline e Kanban passaram a refletir apenas o runtime oficial.
- Restricoes: consolidacao adicional de Opportunity e remanescentes operacionais.
- Proxima fase: H20B.2B.

#### H20B.2B
- Objetivo: Pipeline + Opportunity + Kanban Production Certification Audit.
- Decisao: certificacao tecnica do dominio operacional.
- Arquivos: [placeholder]
- Commits: [placeholder]
- Validacoes: auditoria tecnica em modo leitura.
- Resultado: runtime oficial e SSOT backend confirmados.
- Restricoes: resquicios de compatibilidade ainda mapeados antes da finalizacao.
- Proxima fase: H20B.2C.

#### H20B.2C
- Objetivo: Opportunity Runtime Finalization.
- Decisao: ownership operacional de Opportunity finalizado no backend.
- Arquivos: [`src/pages/Oportunidades.tsx`](../../src/pages/Oportunidades.tsx) [placeholder]
- Commits: `2a2a579`
- Validacoes: build, testes e arch:check aprovados.
- Resultado: Opportunity passou a persistir exclusivamente via APIs oficiais.
- Restricoes: apenas compatibilidade historica fora do runtime oficial.
- Proxima fase: H20B.2D.

#### H20B.2D
- Objetivo: Pipeline + Opportunity + Kanban Final Production Certification.
- Decisao: dominio operacional certificado como Production Ready.
- Arquivos: [placeholder]
- Commits: [placeholder]
- Validacoes: build, testes e arch:check mantidos verdes.
- Resultado: Pipeline + Opportunity + Kanban homologados em producao.
- Restricoes: nenhuma restricao bloqueante de HML.
- Proxima fase: encerramento documental da H20 e avancar para a proxima prioridade oficial.

#### H20
- Objetivo: consolidar CRM, Clientes, Pipeline, Opportunity e Kanban como runtime oficial.
- Decisao: wave encerrada e reconhecida como Production Ready.
- Arquivos: [placeholder]
- Commits: `c85198a`, `792288b`, `2a2a579`
- Validacoes: build, testes e arch:check aprovados nas waves de implementacao e certificacao.
- Resultado: CRM encerrado como dominio Production Ready.
- Restricoes: apenas compatibilidade historica fora do runtime oficial.
- Proxima fase: Coverage Comercial.

---

## 7. Ownership Matrix

| Dominio | O que define | O que consome | O que nao pode definir |
|---|---|---|---|
| Master Catalog | Product, Subproduct, Modality | Coverage, Tables, Opportunity | vendas, comissao, settlement |
| Commercial Coverage | "posso vender?" | Opportunity, Pipeline, front de venda | catalogo master |
| Commercial Tables | "em quais condicoes vendo?" | Opportunity, simulador, provider | catalogo master, coverage |
| Pipeline | fluxo comercial | Opportunity, CRM, operacao | produto, provider, partner |
| Opportunity | cliente + produto + pipeline + provider + condicao | CRM, pipeline, provider | partner oficial |
| Provider Engine | traduz/executa provider | Opportunity, settlement, simulador | ownership comercial |
| Partner | rede comercial oficial | campanhas, comissao, onboarding | prospeccao inicial de aquisicao |
| Partner Acquisition | esteira de aquisicao/prospeccao de parceiros | hub, campanhas, SDR IA, contratos | Opportunity, Partner oficial direto |

---

## 8. Legados e Quarentena

### KEEP / MIGRATE / QUARANTINE / REMOVE LATER

| Item | Classificacao | Observacao |
|---|---|---|
| useAppStore como fonte operacional | QUARANTINE | nao deve ser fonte de verdade de negocio |
| `src/types/index.ts` | QUARANTINE | evitar como contrato canônico novo |
| `dataService.ts` | QUARANTINE / REMOVE LATER | fonte historica |
| `src/api/client.ts` legado | QUARANTINE / REMOVE LATER | manter apenas se houver ponte controlada |
| `backend/server` legado | QUARANTINE / REMOVE LATER | evidência historica |
| `catalogRepository` | QUARANTINE / REMOVE LATER | legado historico |
| `commercialRepository` | QUARANTINE / REMOVE LATER | legado historico |
| `creditPfCatalog` | REMOVE LATER | legado sem prioridade |
| `Parceiros.tsx` / form legado | QUARANTINE | FORM-PARTNERS-AUDIT pendente |
| `SdrIaHub` / FINQZ HUB | FUTURE | dominio estrategico futuro |

---

## 9. Frontend Oficial

- Rotas oficiais: [placeholder]
- API modules oficiais: [placeholder]
- Padroes de `PageHeader`: [placeholder]
- Design System: [placeholder]
- Proibicao de store como fonte de verdade: [placeholder]

### Partner Acquisition rotas oficiais

- `/app/operacoes/partner-acquisition/leads`
- `/app/operacoes/partner-acquisition/leads/:leadId`
- `/app/operacoes/partner-acquisition/prospects`
- `/app/operacoes/partner-acquisition/prospects/:prospectId`

---

## 10. Backend Oficial

- Fastify: [placeholder]
- Prisma: [placeholder]
- PostgreSQL: [placeholder]
- Redis: [placeholder]
- Docker: [placeholder]
- tenant context: [placeholder]
- JWT: [placeholder]
- RBAC: [placeholder]
- controllers / services / repositories / contracts: [placeholder]
- tests: [placeholder]
- health checks: [placeholder]

---

## 11. Deploy e Operacao

- VPS Hostinger KVM Ubuntu 24.04
- Docker Compose localizado em `backend/docker-compose.yml`
- API container `finqz-pro-api`
- Nginx container `finqz-pro-nginx`
- Postgres
- Redis
- Frontend servido por `/opt/finqz/FINQZ_PRO/dist`
- Host VPS nao possui npm
- Build frontend e feito localmente e `dist` e enviado para VPS
- Nginx monta `../dist:/usr/share/nginx/html:ro`
- Health check `/health`
- HML em `https://hml.finqz.com.br`

---

## 12. Checklist Enterprise Obrigatorio

Antes de qualquer nova fase:

- [ ] `git status` limpo
- [ ] auditoria antes de runtime
- [ ] docs / ARCH / DCA consultados
- [ ] contratos definidos
- [ ] sem duplicidade
- [ ] sem legado como fonte de verdade
- [ ] backend first
- [ ] tenant scoped
- [ ] RBAC validado
- [ ] `npm run build`
- [ ] `npm run arch:check`
- [ ] backend typecheck / test quando aplicavel
- [ ] smoke HML
- [ ] commit
- [ ] push
- [ ] deploy
- [ ] DCA atualizado quando fase relevante

---

## 13. Roadmap Oficial

1. CRM
2. Pipeline / Opportunity
3. Coverage Comercial
4. Commercial Tables
5. Simulator
6. Permissions / RBAC

### Prioridade oficial atual

- CRM: concluido
- Pipeline / Opportunity / Kanban: concluido
- Proxima prioridade oficial: Coverage Comercial
7. Partner Form Audit
8. CSV Parceiros
9. Partner Acquisition incremental
10. Legacy cleanup gradual

### Proxima fase imediata

- CRM

---

## 14. Catalogo Oficial de Documentos

> Placeholder de organizacao documental para ondas futuras.

### 14.1 Architecture docs

- `docs/02-architecture/ARCH-001` ... `ARCH-066+`

### 14.2 RFCs

- `RFC-001` [placeholder]

### 14.3 ADRs

- [placeholder]

### 14.4 Auditorias

- [placeholder]

### 14.5 Matrizes de decisao

- [placeholder]

### 14.6 Contratos de dominio

- [placeholder]

### 14.7 Ownership matrices

- [placeholder]

### 14.8 Transition matrices

- [placeholder]

### 14.9 DCA v2

- Este documento.

---

## 15. Como Retomar o Projeto em um Novo Chat

1. Ler este DCA primeiro.
2. Confirmar a fase atual.
3. Confirmar a branch oficial.
4. Confirmar `git status`.
5. Confirmar o ambiente HML.
6. Nunca implementar sem auditoria quando a fase exigir.
7. Sempre orientar o usuario iniciante com:
   - Terminal Raiz
   - Backend
   - SSH VPS
8. Sempre indicar o caminho / diretorio dos comandos.

---

## 16. Placeholders para Ondas Futuras

> Preencher apenas quando a fase for oficial e validada.

### 16.1 Wave H17D
- Status: [placeholder]
- Objetivo: [placeholder]
- Escopo: [placeholder]
- Restrições: [placeholder]
- Validacoes: [placeholder]

### 16.2 Wave H18
- Status: em consolidacao
- Objetivo: fechar runtime de Prospect, preparar endurecimento de contrato e harmonizar docs.
- Escopo: Prospect list, detail, workflow, RBAC oficial, contratos e auditoria de prontidao.
- Restrições: manter backend intacto; evitar fontes paralelas; seguir ARCH-073 para RBAC de Prospect.
- Validacoes: build, arch:check, test e auditoria H18D.

### 16.3 Wave H19
- Status: concluida
- Objetivo: consolidar Partner runtime, materializar Partner via convertProspect, migrar Parceiros para o runtime oficial e homologar a prontidao de producao.
- Escopo: Partner materialization, runtime oficial `/api/v1/partners`, frontend Parceiros oficial, cleanup legado ativo e homologacao final da Wave.
- Restrições: manter backend, schema, migrations e seed intactos; evitar fontes paralelas; preservar tenant scope, RBAC, audit trail, idempotencia e replay.
- Validacoes: `npm run build`, `npm run arch:check`, `npm test` e homologacao H19-HOM aprovados.
- H19-HOM: homologacao aprovada e gate concluido, sem criar wave separada.

### 16.4 Wave H19.1A
- Status: concluida
- Objetivo: harmonizar DCA e ARCH com o estado real do runtime apos H19.
- Escopo: ajustes documentais, referencias canônicas, backlog arquitetural e clarificacao de legados.
- Restrições: documentacao apenas; sem impacto em contrato ou comportamento.
- Validacoes: report de harmonizacao aprovado.
- Referencia: [H19.1A-DCA-ARCH-HARMONIZATION-REPORT.md](C:/Projects/FINQZ_PRO/docs/02-architecture/H19.1A-DCA-ARCH-HARMONIZATION-REPORT.md)

### 16.5 Wave H19.1B
- Status: concluida
- Objetivo: Contract Test Hardening do runtime oficial de Partner.
- Escopo: endurecer testes de contrato e replay sem alterar o comportamento funcional.
- Restrições: sem runtime novo; sem alterar backend ou frontend.
- Validacoes: suite de testes de contrato e regressao.
- Referencia: [H19.1B-CONTRACT-TEST-HARDENING-REPORT.md](C:/Projects/FINQZ_PRO/docs/02-architecture/H19.1B-CONTRACT-TEST-HARDENING-REPORT.md)

---

## 17. Nota de Governanca

Este skeleton e intencionalmente estruturado para continuidade. O preenchimento completo de historico, decisoes, matrizes e waves futuras deve ser feito somente por fases aprovadas.
