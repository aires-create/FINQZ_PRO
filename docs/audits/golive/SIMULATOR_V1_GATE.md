# SIMULATOR V1 GATE

Data: 2026-08-11
Repositorio: `C:\Projects\FINQZ_PRO_HML_PROMOTION`
Branch: `promotion/hml-g18-full`
HEAD auditado: `8079a548134999a7abb1a2d7b3cba9b79adc7ab6`
Escopo: gate read-only do Simulator / Simulador

## 1. Baseline

- branch local: `promotion/hml-g18-full`
- HEAD local: `8079a548134999a7abb1a2d7b3cba9b79adc7ab6`
- HEAD remoto rastreado: `8079a548134999a7abb1a2d7b3cba9b79adc7ab6`
- worktree limpo no inicio da auditoria

## 2. SSOT utilizada

Ordem de precedencia aplicada:

1. `docs/03-decision-platform/DCA-ENTERPRISE-DECISION-PLATFORM-v1.md`
2. `docs/00-master/PCCD-FINQZ-PRO-ENTERPRISE.md`
3. `docs/05-adr/ADR-003-simulation-engine-source-of-truth.md`
4. `docs/05-adr/ADR-007-lead-customer-simulation-opportunity-model.md`
5. `docs/02-architecture/ARCH-037-COMMERCIAL-STRUCTURE-OWNERSHIP-BLUEPRINT.md`
6. `docs/02-architecture/ARCH-039-COMMERCIAL-CATALOG-CONTRACT.md`
7. `docs/02-architecture/ARCH-041-MASTER-CATALOG-CONSUMER-MAPPING.md`
8. `docs/02-architecture/ARCH-015-FRONTEND_DOMAIN_MAP_REVIEW_REQUIRED.md`
9. `docs/03-audits/AUD-W0-PRODUCTION-READINESS-PIPELINE-OPPORTUNITY-SIMULATOR.md`
10. `docs/03-audits/AUD-EPC-W2-CRM-CONSOLIDATION.md`

Leitura objetiva:

- ADR-003 define calculos internos, Commercial API como SSOT comercial e isolamento via Provider Engine.
- ADR-007 define Simulation como entidade independente e Opportunity como unidade operacional central.
- ARCH-037 e ARCH-039 deixam o Simulador como consumidor de estrutura comercial, nao owner.
- AUD-W0 e AUD-EPC-W2 tratam o Simulador como pronto com restricoes, ainda parcial em runtime local.

## 3. Ownership confirmado

- Master Catalog: `o que existe`
- Coverage: `posso vender?`
- Commercial Tables / Conditions: `em quais condicoes vendo?`
- Provider Engine: `quem executa?` e como traduz integracoes externas
- Simulator: `quanto libera?`, `qual oferta e aplicavel?`, `qual resultado da simulacao?`
- Opportunity: unidade operacional central, com rastreabilidade de Simulation

Conclusao de ownership:

- o Simulador atual e consumidor contextual e superficie operacional de apoio
- o backend oficial e owner do runtime canônico
- o fluxo local ainda existe como camada de compatibilidade e suporte

## 4. Arquitetura real encontrada

### Frontend oficial

- rota oficial: `src/routes/crm.routes.tsx` monta `SimuladorPage` em `/app/crm/simulador`
- protecao de rota: `ProtectedRoute requiredPermission="simulador:view"`
- menu lateral: `src/layouts/MainLayout.tsx` expoe a mesma pagina com `permission: "simulador:read"`
- o matcher de permissao aceita alias `read`/`view`, e a seed oficial contem `SIMULADOR_VIEW`

### Page / componente

- `src/pages/Simulador.tsx` e a tela standalone do Simulador
- a pagina importa `simulatorRepository`, `simulationEngine` e `sendLeadToSimulator`
- a pagina importa `getProductsForSelect`, `getSubproductsForProduct` e `getModalitiesForSubproduct` de `commercialRepository`
- a pagina calcula ofertas, rankings, aceitacao de proposta e criacao de oportunidade em memoria local
- a pagina nao chama o backend oficial `/api/v1/simulations/runtime`

### Backend oficial

- rota oficial: `backend/src/modules/simulation/presentation/http/simulation-runtime.routes.ts`
- controller: `simulation-runtime.controller.ts`
- service: `simulation.application.service.ts`
- runtime: `simulation.application.runtime.ts`
- pipeline: `simulation.application.pipeline.ts`
- adapter principal: `products/loan-with-collateral/loan-with-collateral.adapter.ts`
- runtime de catalogo: `masterCatalogRuntime` para resolver product/subproduct
- evidencia oficial: `backend/src/modules/simulation/evidence/presentation/http/simulation-runtime-evidence.routes.ts`

### Fluxo real

Fluxo standalone atual:

`/app/crm/simulador` -> `Simulador.tsx` -> `commercialRepository` / `simulatorRepository` -> calculo local -> estado em memoria -> proposta/oportunidade locais

Fluxo oficial em sombra:

`Oportunidades.tsx` -> `useSimulationRuntimeShadow` -> `executeSimulationRuntimeShadow` -> `/api/v1/simulations/runtime` -> backend runtime -> comparacao/evidence -> `/api/v1/simulations/runtime-evidence`

## 5. Matriz SIM1-SIM20

| ID | Status | Severidade | Evidencia resumida |
|---|---|---:|---|
| SIM1 | PASS COM RESSALVA | P2 | Rota oficial existe em `/app/crm/simulador`; permissão de rota e menu variam em `read`/`view`, mas o matcher e a seed normalizam isso. |
| SIM2 | PASS COM RESSALVA | P2 | A pagina principal ainda usa `simulatorRepository`/`commercialRepository`; o backend oficial existe e e consumido no fluxo shadow da Opportunity. |
| SIM3 | PASS COM RESSALVA | P2 | Existe backend owner do runtime canonico; a pagina standalone ainda carrega calculo local de compatibilidade. |
| SIM4 | PASS | - | Tenant e preservado no runtime backend, no evidence route e no hook shadow. |
| SIM5 | PASS | - | Backend aplica auth + tenant context + `requirePermissions('simulation:execute')`; evidence usa `simulation:evidence:write`. |
| SIM6 | PASS COM RESSALVA | P2 | Backend resolve product/subproduct via `masterCatalogRuntime`; a pagina ainda busca catalogo via `creditPfCatalog` por `commercialRepository`. |
| SIM7 | PASS COM RESSALVA | P2 | Coverage nao e redefinida pelo Simulador; no fluxo atual ela aparece como contexto upstream da estrutura comercial, nao como owner da pagina. |
| SIM8 | PASS COM RESSALVA | P2 | Commercial Tables/Conditions entram via `commercialRepository` na pagina; no backend oficial a estrutura comercial existe, mas o Simulador standalone ainda nao a consome diretamente. |
| SIM9 | PASS COM RESSALVA | P2 | Provider aparece como contexto no backend e como repository local de apoio; a taxonomia externa nao redefine o catalogo FINQZ. |
| SIM10 | PASS COM RESSALVA | P2 | Relation com Opportunity existe, mas a criacao local de oportunidade e transitoria e nao e o owner arquitetural. |
| SIM11 | PASS | - | Schema Zod do runtime valida o payload canônico; testes de schema cobrem a rota oficial. |
| SIM12 | PASS COM RESSALVA | P2 | O calculo essencial existe no backend oficial, mas a pagina standalone ainda executa calculo local de compatibilidade. |
| SIM13 | PASS COM RESSALVA | P2 | Simulacoes, propostas e oportunidade local ficam em memoria; backend oficial persiste evidence, nao o estado completo do Simulador standalone. |
| SIM14 | PASS COM RESSALVA | P2 | Refresh perde o estado local do Simulador; o caminho oficial de runtime/evidence permite reexecucao e auditabilidade do fluxo canonico. |
| SIM15 | PASS | P3 | Nao ha mock operacional owner; o que existe e camada de teste/compatibilidade. |
| SIM16 | PASS | - | `Simulador.tsx` nao usa `localStorage` nem `useAppStore`; `useAppStore` entra no shadow runtime da Opportunity, nao no page standalone. |
| SIM17 | PASS COM RESSALVA | P2 | Ha coexistencia de runtime oficial, evidence API e camada local legada; nao ha concorrencia backend dominante, mas ha compat layer. |
| SIM18 | PASS COM RESSALVA | P3 | Existem testes de runtime shadow/evidence, mas nao foi encontrado teste dedicado de `src/pages/Simulador.tsx`. |
| SIM19 | PASS | - | Existem testes backend unitarios e integracao para runtime/evidence com cobertura de auth, RBAC, tenant e respostas. |
| SIM20 | PASS COM RESSALVA | P2 | O fluxo minimo V1 e operacional, mas ainda em modo transitorio: pagina standalone local + backend oficial em sombra/apoio. |

## 6. Frontend

- pagina oficial: `src/pages/Simulador.tsx`
- rota: `/app/crm/simulador`
- protecao: `simulador:view` na rota e `simulador:read` no menu, com alias no matcher
- fonte principal da pagina: `simulatorRepository`
- fonte comercial auxiliar: `commercialRepository`
- fonte de apoio de geolocalizacao: `cityRepository` e `cepService`
- geracao de proposta: PDF local via `proposalPdf`

Leitura funcional:

- o Simulador atual continua sendo uma superficie util e navegavel
- o front ainda concentra regra de negocio de apoio e conciliacao de oferta
- o front nao e SSOT do runtime oficial, mas ainda e dono do fluxo standalone atual

## 7. Backend

- modulo oficial: `backend/src/modules/simulation`
- rota runtime: `POST /api/v1/simulations/runtime`
- rota evidence: `POST /api/v1/simulations/runtime-evidence`
- controller runtime: valida tenant antes de responder
- service/runtime/pipeline: validam request, resolvem produto, montam contexto e executam adapter
- adapter principal: usa `masterCatalogRuntime` e o engine legado encapsulado
- evidence route: autentica, aplica tenant context, exige `simulation:evidence:write` e persiste evidencia sanitizada

Leitura funcional:

- o backend oficial existe e e o owner canônico do runtime
- o runtime backend valida contrato, tenant e RBAC
- a evidencia oficial fecha a trilha de auditoria do fluxo sombra

## 8. Prisma / persistencia

- o Simulador standalone nao possui model Prisma proprio
- o estado da pagina e mantido em memoria via `Map`
- `simulationRuntimeEvidence` possui persistencia oficial em Prisma, com repo in-memory e repo Prisma
- a migracao oficial de evidence ja existe: `20260710120000_sdc_3_4h_b_simulation_runtime_evidence`
- accepted proposals e oportunidades criadas pela pagina permanecem transitorios no runtime local

## 9. Tenant

- `simulation-runtime.controller.ts` falha com 403 se `request.currentTenant?.tenantId` nao existir
- `simulation.application.pipeline.ts` exige `tenant.id`, `product.id` e `subproduct.id`
- o evidence route usa `authenticate`, `tenantContextMiddleware` e RBAC explicito
- a suite de evidencia prova isolamento de tenant e bloqueio cross-tenant com 403

## 10. RBAC

- permissao oficial do runtime: `simulation:execute`
- permissao oficial de evidencia: `simulation:evidence:write`
- permissao da rota frontend do Simulador: `simulador:view`
- permissao do menu lateral: `simulador:read`
- `src/auth/permissionMatcher.ts` trata `read` e `view` como alias equivalentes para esse caso
- a seed oficial contem `SIMULADOR_VIEW`, `simulation:execute` e `simulation:evidence:write`

Leitura:

- o RBAC backend do runtime esta fechado
- a permissao de UI e uma camada de navegacao, nao a permissao do runtime oficial

## 11. Master Catalog

- ADR-003 fixa os calculos internos e o isolamento via Provider Engine
- ARCH-037 e ARCH-039 mantem `creditPfCatalog` e `commercialRepository` como compatibilidade transitiva
- o backend adapter usa `masterCatalogRuntime.findProductByCode` e `findSubproductByCode`
- o Simulador standalone ainda extrai lists de `creditPfCatalog` via `commercialRepository`

Leitura:

- Master Catalog e a SSOT canonica para `Product`, `Subproduct` e `Modality`
- o Simulador nao deve redefinir taxonomia
- o path oficial backend ja aponta para o catalogo runtime

## 12. Coverage

- o Simulador nao e owner de Coverage
- a pagina standalone nao chama diretamente coverage backend
- a leitura de Coverage aparece como contexto upstream do fluxo comercial
- a arquitetura atual nao mostra o Simulador redefinindo Coverage, mas ainda existe acoplamento transitivo com a estrutura comercial legada

## 13. Commercial Tables / Conditions

- a pagina usa `commercialRepository` como bridge de selecao de produto/subproduto/modalidade e apoio comercial
- `commercialRepository` ainda suporta provider, commercial table e commercial condition em memoria
- o backend oficial de commercial tables existe e ja foi homologado em gate separado
- o Simulador atual consome condicao comercial de forma transitiva, nao como owner

Leitura:

- Commercial Tables e Conditions continuam sendo consumidas como suporte de compatibilidade
- a dependência ainda e local no standalone, mas nao ha sinal de fonte concorrente de negocio para o backend oficial

## 14. Provider

- provider aparece em `commercialRepository` como apoio local
- o backend runtime aceita provider, bank, commercializadora e corban no contrato oficial
- a taxonomia externa nao redefine o Master Catalog FINQZ

Leitura:

- Provider entra como boundary de integracao e recomendacao
- nao e owner da taxonomia FINQZ

## 15. Opportunity

- ADR-007 define Opportunity como unidade operacional central
- a pagina `Simulador.tsx` consegue criar opportunity localmente a partir de proposta aceita
- essa criacao e transitoria e nao substitui o ownership oficial da Opportunity
- o runtime shadow usado em `Oportunidades.tsx` respeita essa fronteira conceitual

Leitura:

- o Simulador e adjacente a Opportunity, nao substituto dela
- a rastreabilidade existe no contrato, mas a persistencia completa ainda nao foi consolidada no standalone

## 16. Mocks, localStorage e store

- nao encontrei `localStorage` no fluxo principal de `src/pages/Simulador.tsx`, `src/data/simulatorRepository.ts` ou `src/data/commercialRepository.ts`
- nao encontrei `useAppStore` no fluxo principal da pagina standalone
- `useAppStore` aparece no shadow runtime, em `Oportunidades.tsx` e no resto do app
- os repositories do Simulador sao em memoria, nao persistencia oficial

Leitura:

- o problema atual nao e localStorage como SSOT do Simulador
- o problema atual e a persistencia transitoria em memoria e o legado de compatibilidade

## 17. APIs paralelas

- nao existe API paralela concorrente ao backend oficial do runtime
- existe uma camada local paralela de compatibilidade no frontend (`simulationEngine`, `simulatorRepository`, `commercialRepository`)
- a API oficial de runtime e a de evidence coexistem como contrato canonico e auditavel

Leitura:

- a paralelizacao e legada/compat, nao um segundo backend owner

## 18. Legado classificado

| Item | Classificacao | Observacao |
|---|---|---|
| `creditPfCatalog` | QUARANTINE | fonte de compatibilidade, nao normativa |
| `catalogRepository` | QUARANTINE | adapter transitório e settings legados |
| `commercialRepository` | QUARANTINE | bridge de compatibilidade para Simulador e Tabelas |
| `simulatorRepository` | QUARANTINE | suporte local em memoria para a pagina standalone |
| `providerRepository` | QUARANTINE | apoio local de compatibilidade e catalogacao operacional |
| `useSimulationRuntimeShadow` | KEEP | ponte oficial de sombra/evidence para Opportunity |
| runtime backend oficial | KEEP | owner canônico do runtime |

## 19. Testes

### Testes executados nesta auditoria

Backend:

- `cd backend; npm run test -- src/tests/unit/simulation/simulation-runtime.routes.test.ts src/tests/unit/simulation/simulation-runtime.http.schema.test.ts src/tests/unit/simulation/simulation-runtime-evidence.routes.test.ts src/tests/unit/simulation/simulation.application.runtime.test.ts src/tests/unit/simulation/simulation-runtime.controller.test.ts`

Resultado:

- `5 passed`
- `16 tests passed`

Frontend:

- `npm run test -- src/features/simulation-runtime/simulation-runtime.feature.test.ts src/features/simulation-runtime/evidence/simulation-runtime.evidence.test.ts src/features/simulation-runtime/evidence/remote/simulation-runtime-remote-evidence.client.test.ts`

Resultado:

- `3 passed`
- `10 tests passed`

### Evidencias de rota provadas pelos testes

- `401` sem autenticação
- `403` autenticado sem `simulation:execute`
- `200` `POST /runtime` autorizado
- `403` `POST /runtime-evidence` sem `simulation:evidence:write`
- `201` `POST /runtime-evidence` autorizado

### Cobertura encontrada, mas sem teste dedicado da page standalone

- `src/features/simulation-runtime/simulation-runtime.feature.test.ts`
- `src/features/simulation-runtime/evidence/simulation-runtime.evidence.test.ts`
- `src/features/simulation-runtime/evidence/remote/simulation-runtime-remote-evidence.client.test.ts`
- `backend/src/tests/unit/simulation/simulation-runtime.routes.test.ts`
- `backend/src/tests/unit/simulation/simulation-runtime.http.schema.test.ts`
- `backend/src/tests/unit/simulation/simulation-runtime-evidence.routes.test.ts`
- `backend/src/tests/unit/simulation/simulation.application.runtime.test.ts`
- `backend/src/tests/unit/simulation/simulation-runtime.controller.test.ts`
- `backend/src/tests/integration/simulation-runtime-evidence.http.test.ts`

## 20. P0

- nenhum P0 comprovado neste gate

## 21. P1

- nenhum P1 restante comprovado neste gate

## 22. P2/P3

P2 nao bloqueadores:

- pagina standalone ainda opera com `simulationEngine` local e repositories de compatibilidade
- `commercialRepository`, `catalogRepository` e `creditPfCatalog` permanecem como bridge transitoria
- simulacao/proposta/oportunidade no standalone ainda sao transientes em memoria
- fluxo oficial de runtime continua aparecendo mais claramente na Opportunity do que na pagina standalone

P3 nao bloqueadores:

- ausencia de teste dedicado de `src/pages/Simulador.tsx`
- refinamento de UX, clareza de jornada e consolidacao de narrativa entre tela standalone e runtime oficial

## 23. Decisao final

**SIMULATOR V1 - GO WITH RESTRICTIONS**

## 24. Menor correção necessária

- nao aplicavel
- nenhum P0/P1 restante comprovado nesta auditoria
- as pendencias sao de consolidacao/P2-P3 e nao bloqueiam a primeira publicacao
