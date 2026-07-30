# AUD-CRM-NAVIGATION-BLUEPRINT-GOLIVE

## 1. Executive Summary

Esta auditoria cruza o DCA Mestre, o DCA vNext, ARCHs de dominio, AUDs anteriores, o `MainLayout`, rotas frontend, bootstrap backend, RBAC e ownership funcional para definir a estrutura oficial do Menu Enterprise rumo ao Go-Live.

Conclusao executiva:

- O menu atual e funcional, mas ainda nao e um reflexo limpo do modelo oficial de capacidades.
- O core do CRM Enterprise esta pronto ou quase pronto.
- Persistem zonas de legado em navegacao, fallback e compatibilidade que ainda influenciam a experiencia.
- Existem capacidades validas no backend que ainda nao estao expostas em uma arvore de menu totalmente coerente.
- O maior problema nao e falta de runtime no core, e sim a coexistencia de menu legado, aliases e superficies temporarias.

Leitura resumida por status:

- `READY`: CRM Clientes, Pipeline, Opportunity, Coverage Comercial, RBAC/tenant core, Users/Roles/Permissions/Audit, partner-acquisition backend.
- `PARTIAL`: Simulador, Tabelas Comerciais, Parceiros, Financeiro, Conta Corrente, Provider Operations, partes do HUB, partes do Admin.
- `LEGACY`: aliases antigos de rota/menu, `api/client.ts` como compat layer, `SdrIaHub` com backend legado, `catalogRepository` e `commercialRepository` como persistencia/transicao.
- `REMOVE`: duplicidades de menu/rota quando os consumidores migrarem.
- `FUTURE`: Disparos, Higienizacao, E-mail Marketing, expansoes de HUB e consolidacoes nao autorizadas pelo DCA Mestre.

Veredito final da navegacao:

**GO WITH RESTRICTIONS**

## 2. Documento Mestre Analisado

Fonte maxima considerada:

- [DCA-FINQZ-PRO-ENTERPRISE-v2.md](/C:/Projects/FINQZ_PRO/docs/00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md)

Pontos decisivos do DCA Mestre:

- Backend First, Tenant Scoped, RBAC Driven, Single Source of Truth, No Legacy, No Parallel APIs.
- CRM Clientes, Pipeline e Opportunity estao em estado Production Ready.
- Partner Acquisition esta em Production Ready with Restrictions.
- FINQZ HUB / SDR IA e Future Strategic Domain.
- Rotas oficiais de Partner Acquisition estao no espaco operacional.
- `src/api/client.ts`, `catalogRepository` e outros legados sao quarentena / remove later.

Docs cruzados que influenciam a decisao:

- [DCA vNext](/C:/Projects/FINQZ_PRO/docs/02-architecture/DCA-vNEXT-FINQZ-PRO-ENTERPRISE.md)
- [ARCH-068 Partner Acquisition Domain](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-068-partner-acquisition-domain-architecture.md)
- [ARCH-073 Partner Acquisition HTTP Surface](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-073-partner-acquisition-http-surface-architecture.md)
- [ARCH-059 Commercial Structure UX & Navigation](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-059-commercial-structure-ux-navigation-architecture.md)
- [ARCH-061 Commercial Tables UX & Navigation](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-061-commercial-tables-ux-navigation-architecture.md)
- [AUD-CRM-ENTERPRISE-GOLIVE-READINESS.md](/C:/Projects/FINQZ_PRO/docs/04-crm/AUD-CRM-ENTERPRISE-GOLIVE-READINESS.md)

## 3. Documentos Encontrados

Arquivos mais relevantes para menu, navigation, capability e ownership:

- [src/layouts/MainLayout.tsx](/C:/Projects/FINQZ_PRO/src/layouts/MainLayout.tsx)
- [src/routes/crm.routes.tsx](/C:/Projects/FINQZ_PRO/src/routes/crm.routes.tsx)
- [src/routes/operacoes.routes.tsx](/C:/Projects/FINQZ_PRO/src/routes/operacoes.routes.tsx)
- [src/routes/admin.routes.tsx](/C:/Projects/FINQZ_PRO/src/routes/admin.routes.tsx)
- [src/routes/hub.routes.tsx](/C:/Projects/FINQZ_PRO/src/routes/hub.routes.tsx)
- [src/api/client.ts](/C:/Projects/FINQZ_PRO/src/api/client.ts)
- [src/api/modules/index.ts](/C:/Projects/FINQZ_PRO/src/api/modules/index.ts)
- [src/data/catalogRepository.ts](/C:/Projects/FINQZ_PRO/src/data/catalogRepository.ts)
- [src/data/commercialRepository.ts](/C:/Projects/FINQZ_PRO/src/data/commercialRepository.ts)
- [src/pages/Simulador.tsx](/C:/Projects/FINQZ_PRO/src/pages/Simulador.tsx)
- [src/pages/TabelasComerciais.tsx](/C:/Projects/FINQZ_PRO/src/pages/TabelasComerciais.tsx)
- [src/pages/Parceiros.tsx](/C:/Projects/FINQZ_PRO/src/pages/Parceiros.tsx)
- [src/pages/CommercialCoverage.tsx](/C:/Projects/FINQZ_PRO/src/pages/CommercialCoverage.tsx)
- [src/pages/SdrIaHub.tsx](/C:/Projects/FINQZ_PRO/src/pages/SdrIaHub.tsx)
- [backend/src/core/http/fastify.ts](/C:/Projects/FINQZ_PRO/backend/src/core/http/fastify.ts)
- [backend/src/modules/partner-acquisition/http/partner-acquisition.routes.ts](/C:/Projects/FINQZ_PRO/backend/src/modules/partner-acquisition/http/partner-acquisition.routes.ts)
- [backend/src/modules/crm/routes.ts](/C:/Projects/FINQZ_PRO/backend/src/modules/crm/routes.ts)
- [backend/src/modules/opportunities/routes.ts](/C:/Projects/FINQZ_PRO/backend/src/modules/opportunities/routes.ts)
- [backend/src/modules/partners/presentation/http/partner.routes.ts](/C:/Projects/FINQZ_PRO/backend/src/modules/partners/presentation/http/partner.routes.ts)
- [backend/src/modules/financial/routes.ts](/C:/Projects/FINQZ_PRO/backend/src/modules/financial/routes.ts)
- [backend/src/index.ts](/C:/Projects/FINQZ_PRO/backend/src/index.ts)

## 4. Documentos Sobrepostos

Existe mais de uma narrativa para os mesmos dominios:

| Tema | Arquivos | Leitura |
|---|---|---|
| Menu / navegaçao de CRM | DCA Mestre, DCA vNext, ARCH-068, AUD-CRM-ENTERPRISE-GOLIVE | Ha divergencia entre a visao funcional atual e a visao alvo de reorganizacao |
| Partner Acquisition | DCA Mestre, ARCH-068, ARCH-073, AUDs de readiness | O dominio e canonico, mas a exposicao de menu ainda carrega heranca de Operacoes |
| Coverage / Estrutura Comercial | ARCH-059, ARCH-061, DCA Mestre | A cobertura operacional e oficial, mas a UX ainda mistura coberturas, tabelas e simulador |
| HUB / SDR IA | DCA Mestre, DCA vNext, backend `src/index.ts`, `SdrIaHub` | O HUB e estrategico, mas a runtime ainda depende de superficie legada |
| Catalog / simulator | `catalogRepository`, `commercialRepository`, `simulatorRepository` | Existe sobreposicao entre apoio de UI e ownership operacional |

## 5. Documentos Defasados

| Arquivo | Motivo | Status |
|---|---|---|
| `src/api/client.ts` compat layer | Mantem superficie HTTP de compatibilidade | LEGACY |
| `src/data/catalogRepository.ts` | Assume papel de adaptador e fallback historico | LEGACY |
| `src/data/commercialRepository.ts` | Ainda carrega estado e fallback transitorio | LEGACY |
| `backend/src/index.ts` | Rotas SDR/EdgeSpark fora do bootstrap oficial | LEGACY |
| Menus/aliases antigos em `MainLayout` | Mantem UX duplicada para rotas legadas | REMOVE quando consumidores zerarem |
| Placeholder pages do HUB | Ainda nao sao capacidades completas | FUTURE |

## 6. Lacunas Documentais

| Lacuna | Impacto | Status |
|---|---|---|
| Menu Enterprise oficial consolidado em um unico documento | Gera interpretacoes divergentes | P2 |
| Capability map unico para menu + backend + RBAC | Dificulta governanca de Go-Live | P2 |
| Ownership map do CRM vs HUB vs Operacoes | Gera sobreposicao de responsabilidade | P2 |
| Mapa formal de menus legados vs menus oficiais | Mantem aliases vivos sem fim claro | P3 |

## 7. Conflitos com o DCA

| Conflito | Evidencia | Severidade | Leitura |
|---|---|---|---|
| Menu ainda mistura dominio oficial e legado | `MainLayout` com `legacyMenuItems` e aliases | P2 | Nao quebra Go-Live sozinho, mas polui ownership |
| `SdrIaHub` ainda conversa com backend legada | `backend/src/index.ts` com `api/sdr/*` | P1 | Indica runtime paralelo influenciando navegacao |
| `catalogRepository` segue como fallback de negocio | `src/data/catalogRepository.ts` | P2 | Nao e fonte canonica |
| `commercialRepository` ainda suporta UI de simulador/tabelas | `src/data/commercialRepository.ts` e `Simulador.tsx` | P2 | Funciona, mas nao e pure backend ownership |
| `financial` existe em modulo, mas nao aparece no bootstrap Fastify | `backend/src/modules/financial/routes.ts` sem registro em `fastify.ts` | P2 | Menu aponta para area sem runtime canonico oficial |

## 8. Recomendacao: atualizar ou criar novo

Recomendacao objetiva:

- Atualizar a documentacao existente, mas **nao** criar uma nova fonte canonica.
- Consolidar a visao de menu, capability e ownership neste documento de auditoria.
- Usar o DCA Mestre como fonte oficial e este arquivo como blueprint de navegacao para Go-Live.

Arquivo fonte oficial recomendado para continuidade de menu:

- [docs/00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md](/C:/Projects/FINQZ_PRO/docs/00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md)

## 9. Arquivo Recomendado como Fonte Oficial

Fonte oficial continua sendo o DCA Mestre. Para navegacao, o melhor candidato a consolidacao futura e este proprio relatório, desde que fique explicitamente subordinado ao DCA.

## 10. Plano de Atualizacao

### Sprint 1 - Higienizacao editorial

- Consolidar labels de menu.
- Remover duplicidades visuais.
- Manter aliases apenas como redirecionamentos invisiveis.

### Sprint 2 - Consolidaçao de ownership

- Separar claramente CRM, Operacoes, HUB e Administracao.
- Fixar capability map por dominio.
- Marcar itens LEGACY e FUTURE na UX.

### Sprint 3 - Fechamento tecnico

- Aposentar `api/client.ts` onde nao houver consumidor.
- Aposentar `catalogRepository` e `commercialRepository` como ownership de negocio.
- Concluir migracao do `SdrIaHub` para superficie oficial ou isolar como legacy/future.

## 11. Impactos no Menu

### Estrutura oficial recomendada

```text
Dashboard
CRM
├── Clientes
├── Pipeline
├── Parceiros
├── Aquisição de Parceiros
└── Simulador
Operações
├── Coverage Comercial
├── Tabelas Comerciais
├── Roteiros Operacionais
├── Financeiro
├── Conta Corrente
└── Relatórios
FINQZ HUB
├── WhatsApp
├── Campanhas
├── Disparos
├── SDR IA
├── Higienização
└── E-mail Marketing
Administração
├── Usuários
├── Permissões/Funções
├── Auditoria
├── Eventos
├── Geral
├── Integrações
├── Provider Operations
├── Automações
├── Notificações
├── Segurança
└── Bancos & Providers
```

### Leitura de status

| Item | Status | Observacao |
|---|---|---|
| CRM Clientes | READY | Core de CRM validado |
| Pipeline | READY | Owner backend presente |
| Parceiros | PARTIAL | Capacidade valida, posicao de menu ainda desalinhada |
| Aquisição de Parceiros | PARTIAL | Runtime existe, mas navegaçao ainda carrega transicao |
| Simulador | PARTIAL | Depende de repositorios locais e logica de apoio |
| Coverage Comercial | READY | Cobertura operacional canônica |
| Tabelas Comerciais | PARTIAL | Tem backend e frontend, mas ainda carrega adaptadores locais |
| Roteiros Operacionais | LEGACY | Heranca de navegacao |
| Financeiro | PARTIAL | Capacidade existe, mas bootstrap canonico precisa confirmacao final |
| Conta Corrente | PARTIAL | Mesma leitura de transicao |
| Relatórios | PARTIAL | Possui heranca funcional e de menu |
| FINQZ HUB | PARTIAL/FUTURE | Estrategico, mas ainda com runtime legado em parte |
| Administração | READY/PARTIAL | Núcleo RBAC pronto; subareas variam |

## 12. Impactos no CRM Enterprise

### Quais capacidades pertencem ao CRM

- Clientes.
- Leads.
- Oportunidades.
- Pipeline.
- Timeline / historico.
- Documentos e contratos vinculados ao ciclo comercial.
- Parceiros como identidade comercial oficial.
- Aquisição de Parceiros como esteira de originacao e conversao.

### Maturidade do bloco CRM

| Bloco | Status | Leitura |
|---|---|---|
| Clientes | READY | Runtime e contratos presentes |
| Pipeline / Opportunity | READY | Central de conversao comercial |
| Parceiros | PARTIAL | Ainda distribuido entre CRM e Operacoes |
| Simulador | PARTIAL | Apoio comercial forte, mas ainda nao totalmente canonico |
| Documentos / Contratos | PARTIAL | Existem fluxos, mas nao um bloco de menu limpo |

## 13. Impactos no FINQZ HUB

### Quais capacidades pertencem ao FINQZ HUB

- WhatsApp.
- Campanhas.
- Disparos.
- SDR IA.
- Higienizacao.
- E-mail Marketing.

### Leitura de ownership

| Capacidade | Status | Observacao |
|---|---|---|
| WhatsApp | PARTIAL | Ha runtime de conversa, mas menu e backend ainda estao em transicao |
| Campanhas | LEGACY/PARTIAL | API direta e runtime nao canonico ainda influenciam |
| Disparos | FUTURE | Placeholder, sem maturidade canonica |
| SDR IA | LEGACY/FUTURE | Ainda depende de `backend/src/index.ts` e EdgeSpark |
| Higienizacao | FUTURE | Placeholder |
| E-mail Marketing | FUTURE | Placeholder |

## 14. Impactos na Administração

### Quais capacidades pertencem a Administracao

- Usuarios.
- Roles.
- Permissions.
- Memberships.
- Tenant / Organization.
- Auditoria.
- Configuracoes.
- Integracoes.
- Provider Operations.
- Automações.
- Notificacoes.
- Seguranca.
- Bancos & Providers.

### Leitura

| Item | Status | Observacao |
|---|---|---|
| Usuarios / Roles / Permissions | READY | RBAC runtime validado |
| Auditoria | READY | Protege rastreabilidade |
| Tenant / Organization / Memberships | READY | Scope e governanca presentes |
| Provider Operations | PARTIAL | Menu existe, mas e area de controle especializada |
| Integracoes / Automações / Notificacoes | PARTIAL | Capacidade boa, mas dependencia de consolidacao de backend e UX |
| Seguranca / Bancos | PARTIAL | Configuracao administrativa, ainda sob consolidacao |

## 15. Impactos no Core Platform

### Quais capacidades pertencem ao Core Platform

- Health.
- Ready.
- Live.
- Metrics.
- Auth bootstrap.
- RBAC runtime.
- Tenant context.
- Observability.
- Contracts before runtime.

### Leitura do bootstrap

| Area | Status | Evidencia |
|---|---|---|
| `/health` | READY | Exposto no bootstrap Fastify |
| `/ready` | READY | Usa `testDatabaseConnection()` e Redis ping |
| `/metrics` | READY | Exposto no bootstrap Fastify |
| Auth / tenant middleware | READY | Aplicado nas rotas protegidas |
| Prisma ownership | READY | Readiness usa caminho controlado no backend oficial |

## 16. Blueprint Definitivo do Menu Enterprise

### Arvore recomendada para Go-Live

```text
Dashboard
CRM
├── Clientes
├── Pipeline
├── Parceiros
├── Aquisição de Parceiros
└── Simulador
Operações
├── Coverage Comercial
├── Tabelas Comerciais
├── Financeiro
├── Conta Corrente
├── Relatórios
└── Roteiros Operacionais
FINQZ HUB
├── WhatsApp
├── Campanhas
├── SDR IA
├── Disparos
├── Higienização
└── E-mail Marketing
Administração
├── Usuários
├── Permissões/Funções
├── Tenant / Organizations / Memberships
├── Auditoria
├── Eventos
├── Geral
├── Integrações
├── Provider Operations
├── Automações
├── Notificações
├── Segurança
└── Bancos & Providers
```

### Observacao importante

Essa arvore representa a **leitura arquitetural oficial desejada**. A colocacao exata de alguns itens ainda exige ajuste de codigo para remover aliases e consolidar ownership visual.

## 17. Capability Map Consolidado

| Capability | Dominio | Backend | Frontend | RBAC | Status |
|---|---|---|---|---|---|
| Customer Management | CRM | `crmRoutes` | `Clientes.tsx` | `customer:read` | READY |
| Opportunity Management | CRM | `opportunitiesRoutes` | `Oportunidades.tsx` | `opportunity:read` | READY |
| Pipeline Management | CRM / Pipeline | `pipelinesRoutes` + `opportunitiesRoutes` | `Oportunidades.tsx` | `sales:view` | READY |
| Partner Identity | CRM / Partners | `partnersRoutes` | `Parceiros.tsx` | `partner:read` | PARTIAL |
| Partner Acquisition | CRM / Operations | `partnerAcquisitionRoutes` | `PartnerAcquisitionLeads.tsx`, `PartnerAcquisitionLeadDetails.tsx`, `PartnerAcquisitionProspects.tsx`, `PartnerAcquisitionProspectDetails.tsx` | `partner_acquisition:*`, `partner_prospect:*` | READY with restrictions |
| Commercial Coverage | Operacoes | `commercialRoutes` / `commercial-governance` | `CommercialCoverage.tsx` | `sales:view` | READY |
| Commercial Tables | Operacoes | `commercialRoutes` | `TabelasComerciais.tsx` | `sales:view` | PARTIAL |
| Simulator | CRM / Commercial | no backend canonico fechado no recorte | `Simulador.tsx` | `simulador:view` | PARTIAL |
| WHATSAPP / Conversas | HUB | legacy/transition surface | `Conversas.tsx` | `conversas:view` | PARTIAL |
| Campaigns | HUB | legacy/transition surface | `Campanhas.tsx` | `campanhas:view` | PARTIAL |
| SDR IA | HUB / AI | legacy `backend/src/index.ts` | `SdrIaHub.tsx` | `sdr_ia:view` | LEGACY |
| Users | Admin | `usersRoutes` | `Usuarios.tsx` | `system_users:manage` | READY |
| Roles / Permissions | Admin / RBAC | `rolesFastifyRoutes` / `permissionsFastifyRoutes` | `admin/Permissoes.tsx` | `system_roles:manage` | READY |
| Audit | Admin / Governance | `auditRoutes` | `Auditoria.tsx` | `audit:view` | READY |
| Tenant / Membership | Core Platform | `organizationRoutes` / `membershipsRoutes` | admin views | tenant scoped | READY |
| Core health / readiness | Core Platform | `fastify.ts` | none | infra only | READY |

## 18. Ownership Map

| Ownership | Dona oficial | Nao pode definir |
|---|---|---|
| CRM | Cliente, leads, oportunidade, relacao comercial | partner runtime, provider ownership, localStorage operacional |
| CRM / Partners | Identidade comercial oficial de parceiros | oportunidade, pipeline, SDR IA como owner |
| Partner Acquisition | Prospecting, qualificacao, conversao de parceiros | opportunity, partner oficial direto |
| Operacoes | Coverage, tables, rotinas operacionais, financeiro operacional | catalogo canonico, partner identity |
| FINQZ HUB | Signal, engagement, automacao de contato | business ownership do CRM |
| Administração | RBAC, tenant, usuarios, auditoria, configuracao | negocio comercial |
| Core Platform | Health, ready, live, metrics, bootstrap | regras de negocio de dominio |

## 19. Matriz Menu x Capability x Backend x Frontend x RBAC

| Menu | Capability | Backend | Frontend | RBAC | Status |
|---|---|---|---|---|---|
| Dashboard | Overview | bootstrap / metrics | dashboard UI | `dashboard:view` | READY |
| CRM > Clientes | Customer Management | `/api/v1/crm` | `Clientes.tsx` | `customer:read` | READY |
| CRM > Pipeline | Opportunity / Pipeline | `/api/v1/opportunities`, `/api/v1/pipelines` | `Oportunidades.tsx` | `opportunity:read`, `sales:view` | READY |
| CRM > Parceiros | Partner Identity | `/api/v1/partners` | `Parceiros.tsx` | `partner:read` | PARTIAL |
| CRM > Aquisição de Parceiros | Acquisition | `/api/v1/partner-acquisition` | `PartnerAcquisitionLeads.tsx`, `PartnerAcquisitionLeadDetails.tsx`, `PartnerAcquisitionProspects.tsx`, `PartnerAcquisitionProspectDetails.tsx` | `partner_acquisition:*`, `partner_prospect:*` | PARTIAL |
| CRM > Simulador | Simulation | sem backend canonico no recorte | `Simulador.tsx` | `simulador:view` | PARTIAL |
| Operações > Coverage Comercial | Coverage | `/api/v1/commercial`, `/api/v1/commercial-governance` | `CommercialCoverage.tsx` | `sales:view` | READY |
| Operações > Tabelas Comerciais | Commercial Tables | `/api/v1/commercial` | `TabelasComerciais.tsx` | `sales:view` | PARTIAL |
| Operações > Financeiro | Financial Ops | modulo existente, bootstrap canonico nao confirmado | `Financeiro.tsx` | `finance:view` | PARTIAL |
| Operações > Conta Corrente | Settlement / Corrente | superficie parcial | `ContaCorrente.tsx` | `finance:view` | PARTIAL |
| Operações > Relatórios | Reporting | superficie existente / transicao | `Relatorios.tsx` | `report:view` | PARTIAL |
| HUB > WhatsApp | Messaging | legacy/transition | `Conversas.tsx` | `whatsapp:read` | PARTIAL |
| HUB > Campanhas | Campaigns | legacy/transition | `Campanhas.tsx` | `campanhas:read` | PARTIAL |
| HUB > SDR IA | AI Assistant | `backend/src/index.ts` legacy | `SdrIaHub.tsx` | `sdr_ia:view` | LEGACY |
| Admin > Usuarios | User Admin | `/api/v1/users` | `Usuarios.tsx` | `system_users:manage` | READY |
| Admin > Permissoes/Funcoes | RBAC | `/api/v1/roles`, `/api/v1/permissions` | `admin/Permissoes.tsx` | `system_roles:manage` | READY |
| Admin > Auditoria | Audit | `/api/v1/audit` | `Auditoria.tsx` | `audit:view` | READY |
| Admin > Provider Operations | Provider console | `/api/v1/integrations` | `ProviderOperationsConsole.tsx` | `tenant:read` | PARTIAL |

## 20. Roadmap de Implementacao por Prioridade

### Prioridade P0

- Nao foi encontrado um novo bloqueador P0 de navegacao pura no recorte validado.

### Prioridade P1

- Isolar `SdrIaHub` do backend legado `backend/src/index.ts`.
- Remover ambiguidades entre `CRM` e `Operacoes` para `Parceiros` e `Aquisição de Parceiros`.
- Garantir que `Financeiro` e demais entradas visiveis estejam registradas no bootstrap oficial.

### Prioridade P2

- Remover aliases de rota que duplicam a mesma tela.
- Reduzir dependencia de `catalogRepository` e `commercialRepository`.
- Consolidar `Simulador` em contrato oficial backend-first.
- Reclassificar itens de HUB que ainda sao placeholders.

### Prioridade P3

- Limpar labels, titulos e breadcrumbs legados.
- Consolidar nomenclatura de `Pipeline`, `Oportunidades` e `Partner Acquisition`.
- Tornar o menu um espelho mais fiel do capability model.

## 21. Menus Redundantes

| Redundancia | Classificacao | Status |
|---|---|---|
| `/app/clientes` e `/app/crm/clientes` | Alias legado | REMOVE |
| `/app/oportunidades`, `/app/crm/oportunidades`, `/app/crm/pipeline` | Alias / mesmo workspace | REMOVE / CONSOLIDATE |
| `/app/parceiros` e `/app/operacoes/parceiros` | Alias legado | REMOVE |
| `/app/estrutura-comercial` e `/app/operacoes/estrutura-comercial` | Alias legado | REMOVE |
| `/app/roteiros-operacionais` e `/app/operacoes/roteiros` | Alias legado | REMOVE |
| `/app/financeiro` e `/app/operacoes/financeiro` | Alias legado | REMOVE |
| `/app/conta-corrente` e `/app/operacoes/conta-corrente` | Alias legado | REMOVE |
| `/app/relatorios` e `/app/operacoes/relatorios` | Alias legado | REMOVE |
| `/app/auditoria` e `/app/admin/auditoria` | Alias legado | REMOVE |
| `/app/usuarios` e `/app/admin/usuarios` | Alias legado | REMOVE |
| `/app/campanhas` e `/app/hub/campanhas` | Alias legado | REMOVE |
| `/app/conversas` e `/app/hub/whatsapp` | Alias legado | REMOVE |
| `/app/hub/conversas` e `/app/hub/whatsapp` | Alias legado | REMOVE |

## 22. Resposta objetiva as perguntas principais

### Qual e a estrutura oficial do Menu Enterprise?

Dashboard, CRM, Operacoes, FINQZ HUB e Administracao. A estrutura recomendada de Go-Live esta descrita na secao 16.

### Quais modulos ja estao completos?

Clientes, Pipeline, Opportunity, core de RBAC/tenant, audiencia de audit/usuario/roles/permissions, Coverage Comercial.

### Quais modulos estao parcialmente implementados?

Parceiros, Aquisição de Parceiros, Simulador, Tabelas Comerciais, Financeiro, Conta Corrente, partes do HUB, partes do Provider Operations e partes da Administracao.

### Quais menus sao redundantes?

Todos os aliases legados mapeados na secao 21.

### Quais menus deveriam ser agrupados?

CRM deve concentrar Clientes, Pipeline, Parceiros, Aquisição de Parceiros e Simulador.
Operacoes deve concentrar Coverage Comercial, Tabelas Comerciais, Financeiro, Conta Corrente, Relatorios e Roteiros.
HUB deve concentrar WhatsApp, Campanhas, SDR IA, Disparos, Higienizacao e E-mail Marketing.
Administracao deve concentrar RBAC, tenant, audit e configuracao.

### Quais capacidades pertencem ao CRM?

Clientes, leads, oportunidades, pipeline, timeline, documentos, contratos, parceiros e aquisicao de parceiros.

### Quais pertencem ao FINQZ HUB?

WhatsApp, campanhas, disparos, SDR IA, higienizacao e e-mail marketing.

### Quais pertencem as Operacoes?

Coverage Comercial, Tabelas Comerciais, Financeiro, Conta Corrente, Relatorios e Roteiros Operacionais.

### Quais pertencem a Administracao?

Usuarios, Roles, Permissions, Memberships, Tenant, Audit, Integracoes, Provider Operations, Automacoes, Notificacoes, Seguranca, Bancos & Providers.

### Quais pertencem ao Core Platform?

Health, Ready, Live, Metrics, auth bootstrap, tenant context, observability e RBAC runtime.

### Existem violacoes do Documento Mestre?

Sim. Principalmente por menus/aliases legados, pelo backend SDR legada e por superficies locais de apoio que ainda influenciam o runtime.

### Existem rotas orfas?

Sim, sobretudo no HUB/legado e em aliases de navegacao que nao representam mais um caminho canonico unico.

### Existem paginas sem capability definida?

Sim. As placeholders do HUB e algumas paginas de transicao ainda nao estao totalmente amarradas a capability canonica madura.

### Existem capabilities sem menu?

Sim. Parte da visao de documentos/contratos e algumas capacidades de governanca ainda nao aparecem como bloco de menu limpo.

### Existem menus sem backend?

Sim. Especialmente itens de HUB placeholders e algumas entradas cuja superficie canonica nao aparece no bootstrap oficial.

### Existem modulos sem ownership?

Sim. Simulador, parte de HUB e parte de Financeiro/Tabelas ainda estao em ownership transitorio.

### Existe codigo legado ainda influenciando a navegacao?

Sim. `MainLayout` com aliases, `src/api/client.ts`, `catalogRepository`, `commercialRepository`, `backend/src/index.ts` e algumas paginas com `fetch` direto.

## 23. Riscos residuais

- O HUB pode parecer completo no menu antes de estar completamente canonicalizado.
- O simulador ainda pode ser lido como produto pronto quando parte da logica e local.
- Alias de rota podem mascarar a real maturidade do dominio.
- `SdrIaHub` pode induzir dependencia de EdgeSpark/legacy fora do bootstrap oficial.

## 24. Parecer final

**GO WITH RESTRICTIONS**

Motivos:

- O core do CRM Enterprise e do runtime backend esta suficientemente maduro.
- A navegacao ainda precisa ser higienizada para remover redundancia e legado visivel.
- Parte do HUB e do simulador ainda precisa de fechamento arquitetural e/ou migracao para runtime canonico.
- O menu pode ir para Go-Live com restricoes, desde que os itens LEGACY e FUTURE nao sejam vendidos como capacidade concluida.
