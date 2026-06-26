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

### 4.6 Pipeline
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

### 4.7 Opportunity
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
- Status: [placeholder]
- APIs: [placeholder]
- Frontend: [placeholder]
- Dependencias: [placeholder]
- Consumers: [placeholder]
- Producers: [placeholder]
- Legados relacionados: [placeholder]
- Proximas fases: [placeholder]

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
| CRM Clientes | GO WITH RESTRICTIONS |
| Pipeline | GO WITH RESTRICTIONS / backend KEEP |
| Opportunity | GO WITH RESTRICTIONS |
| Master Catalog | GO |
| Commercial Coverage | GO |
| Partner Core | GO WITH RESTRICTIONS |
| Partner Form Audit | Pending |
| Partner Acquisition | GO, listagem e detalhe read-only aprovados ate H17C |
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
7. Partner Form Audit
8. CSV Parceiros
9. Partner Acquisition incremental
10. Legacy cleanup gradual

### Proxima fase imediata

- H17D - Partner Acquisition UX Polish & Navigation

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
- Status: [placeholder]
- Objetivo: [placeholder]
- Escopo: [placeholder]
- Restrições: [placeholder]
- Validacoes: [placeholder]

### 16.3 Wave H19
- Status: [placeholder]
- Objetivo: [placeholder]
- Escopo: [placeholder]
- Restrições: [placeholder]
- Validacoes: [placeholder]

---

## 17. Nota de Governanca

Este skeleton e intencionalmente estruturado para continuidade. O preenchimento completo de historico, decisoes, matrizes e waves futuras deve ser feito somente por fases aprovadas.

