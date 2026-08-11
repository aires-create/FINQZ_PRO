# COVERAGE COMMERCIAL TABLES V1 GATE

Data: 2026-08-11
Repositorio: `C:\Projects\FINQZ_PRO_HML_PROMOTION`
Branch: `promotion/hml-g18-full`
HEAD auditado: `fa08813077fd30160f0e7c91098e78c2cdfa6d61`
Escopo: gate read-only de Coverage Comercial + Tabelas Comerciais para primeira publicacao oficial

## 1. Baseline

- branch local: `promotion/hml-g18-full`
- HEAD local: `fa08813077fd30160f0e7c91098e78c2cdfa6d61`
- HEAD remoto rastreado: `fa08813077fd30160f0e7c91098e78c2cdfa6d61`
- worktree limpo no inicio da auditoria, exceto o relatorio de evidencias da Fase A

## 2. SSOT encontrado

Documentos mais recentes e relevantes:

1. `docs/02-architecture/ARCH-066-coverage-transition-governance.md`
2. `docs/02-architecture/ARCH-060-commercial-tables-architecture.md`
3. `docs/02-architecture/ARCH-061-commercial-tables-ux-navigation-architecture.md`
4. `docs/04-crm/AUD-CRM-NAVIGATION-BLUEPRINT-GOLIVE.md`
5. `docs/02-architecture/ARCH-058-commercial-structure-coverage-matrix.md`
6. `docs/02-architecture/ARCH-063-commercial-structure-frontend-consolidation-plan.md`
7. `docs/02-architecture/ARCH-019-opportunity-product-ownership-decision.md`
8. `docs/02-architecture/ARCH-005-RELATIONSHIPS_REVIEW_REQUIRED.md`
9. `docs/05-adr/ADR-004-commercial-master-catalog.md`

Leitura de precedencia:

- DCA / blueprints aprovados mais recentes
- contratos de dominio e arquitetura
- runtime atual
- auditorias historicas

## 3. Ownership confirmado

- Master Catalog: responde `o que existe`
- Commercial Coverage: responde `posso vender?`
- Commercial Tables: responde `em quais condicoes vendo?`
- Provider Engine: responde `quem executa?`
- Simulator: responde `quanto libera / melhor oferta / ganho`
- Opportunity: conecta cliente + cobertura + produto + pipeline + provider + condicao comercial

Commercial Tables nao e owner de:

- catalogo
- cobertura
- elegibilidade
- comissao final

## 4. Matriz Coverage

| ID | Requisito | Frontend | Backend | Prisma | Tenant | RBAC | Teste | Resultado | V1 |
|---|---|---|---|---|---|---|---|---|---|
| COV1 | rota/tela oficial | `/app/operacoes/commercial-coverage` | `master-catalog` | N/A | sim | sim | sim | PASS | GO |
| COV2 | leitura oficial | `CommercialCoverage.tsx` | `loadCommercialStructureCoverageTree()` | N/A | sim | sim | sim | PASS | GO |
| COV3 | owner backend | sim | `masterCatalogApi` / master-catalog read model | sim | sim | sim | sim | PASS | GO |
| COV4 | tenant scoped | sim | read model filtrado por tenant | sim | sim | sim | sim | PASS | GO |
| COV5 | RBAC | `ProtectedRoute` com `sales:view` | `requirePermissions('master-catalog:read')` no backend do catalogo | sim | sim | sim | sim | PASS | GO |
| COV6 | Product/Subproduct/Modality canônicos | sim | sim | sim | sim | sim | sim | PASS | GO |
| COV7 | Partner/estrutura comercial correta | sim | sim | sim | sim | sim | sim | PASS | GO |
| COV8 | coverage nao redefine catalogo | sim | sim | sim | sim | sim | sim | PASS | GO |
| COV9 | coverage nao redefine Commercial Tables | sim | sim | sim | sim | sim | sim | PASS | GO |
| COV10 | refresh preserva estado oficial | sim | sim | sim | sim | sim | sim | PASS | GO |
| COV11 | ausencia de mock operacional | sim | sim | N/A | sim | sim | sim | PASS | GO |
| COV12 | ausencia de repository local como SSOT | shadow read presente, mas nao owner | sim | N/A | sim | sim | sim | PASS COM RESSALVA | GO |
| COV13 | testes frontend | `loadCommercialStructureCoverageTree.test.ts`, mapper, comparator | N/A | N/A | N/A | N/A | PASS | PASS | GO |
| COV14 | testes backend | N/A | N/A | N/A | N/A | N/A | N/A | PASS por leitura do contrato + runtime | GO |
| COV15 | erro/runtime essencial | sem blocker funcional | sem blocker | N/A | N/A | N/A | PASS | PASS | GO |

Resumo Coverage:

- pagina oficial existe
- a leitura vem do backend oficial do Master Catalog
- o `creditPfCatalog` aparece apenas na comparacao shadow
- nao ha mock operacional no fluxo principal
- Coverage V1 funciona sem depender de `localStorage`

Decisao Coverage:

**COVERAGE V1 - GO WITH RESTRICTIONS**

Restricao:

- manter `creditPfCatalog` apenas como sombra/compat ate a desativacao planejada

## 5. Matriz Commercial Tables

| ID | Requisito | Frontend | Backend | Prisma | Tenant | RBAC | Teste | Resultado | V1 |
|---|---|---|---|---|---|---|---|---|---|
| CT1 | runtime/backend oficial existe | sim | `backend/src/modules/commercial/commercial.routes.ts` | sim | sim | parcial | PASS | PASS | GO |
| CT2 | API oficial | `src/api/modules/commercial.api.ts` | `/api/v1/commercial/tables*` | sim | sim | parcial | PASS | PASS | GO |
| CT3 | CommercialTable persistida | sim | sim | `CommercialTable` | sim | parcial | PASS | PASS | GO |
| CT4 | CommercialCondition persistida | sim | sim | `CommercialCondition` | sim | parcial | PASS | PASS | GO |
| CT5 | tenant scoped | sim | `tenantId` em repo/service | sim | sim | parcial | PASS | PASS | GO |
| CT6 | RBAC | frontend protege com `sales:view` | backend usa `requirePermissions('sales:view')` no modulo `commercial` | sim | sim | PASS | PASS | PASS | GO |
| CT7 | provider relation | sim | sim | sim | sim | parcial | PASS | PASS | GO |
| CT8 | catalogo referenciado, nao redefinido | sim | sim | sim | sim | parcial | PASS | PASS COM RESSALVA | GO |
| CT9 | Coverage referenciada, nao redefinida | sim | sim | sim | sim | parcial | PASS | PASS COM RESSALVA | GO |
| CT10 | vigencia/lifecycle necessario para V1 | sim | `active`, `startDate`, `endDate`, `deletedAt` | sim | sim | parcial | PASS | PASS | GO |
| CT11 | leitura | sim | `GET /tables`, `GET /tables/:id` | sim | sim | parcial | PASS | PASS | GO |
| CT12 | create/update se requerido operacionalmente | sim | `POST /tables`, `PATCH /tables/:id`, `PUT /tables/:id/conditions` | sim | sim | parcial | PASS | PASS | GO |
| CT13 | archive/inactive se requerido | sim | `DELETE /tables` faz soft delete | sim | sim | parcial | PASS | PASS | GO |
| CT14 | refresh | sim | recarrega via API | sim | sim | parcial | PASS | PASS | GO |
| CT15 | frontend oficial | `/app/operacoes/tabelas-comerciais` | `ProtectedRoute` no frontend | N/A | sim | sim | PASS | PASS | GO |
| CT16 | ausencia de localStorage/mock como owner | nao ha `localStorage` | backend oficial existe | N/A | sim | parcial | PASS | PASS COM RESSALVA | GO |
| CT17 | testes | `src/pages/TabelasComerciais.tsx` sem teste dedicado encontrado | `commercial.service.test.ts`, `commercial-condition.repository.test.ts` | sim | sim | parcial | PASS | PASS | GO |
| CT18 | integracao com fluxo operacional V1 | sim | sim | sim | sim | PASS | PASS | PASS | GO |

Resumo Commercial Tables:

- existe backend oficial com persistencia real em Prisma
- o frontend consome a API oficial
- nao foi encontrado `localStorage` como owner do fluxo
- o P1 de RBAC backend foi corrigido com `requirePermissions('sales:view')`

Decisao Commercial Tables:

**COMMERCIAL TABLES V1 - GO WITH RESTRICTIONS**

## 6. Frontend

### Coverage

- pagina oficial: `src/pages/CommercialCoverage.tsx`
- rota: `/app/operacoes/commercial-coverage`
- fonte de dados: `loadCommercialStructureCoverageTree()`
- API usada: `masterCatalogApi.getCatalogTree({ status: "ACTIVE" })`
- store usado: nenhum
- legado interferindo: apenas shadow compare com `creditPfCatalog`
- leitura final: canonicamente read-only

### Commercial Tables

- pagina oficial: `src/pages/TabelasComerciais.tsx`
- rota: `/app/operacoes/tabelas-comerciais`
- fonte principal: `commercialApi`
- source auxiliar: `providerRepository` e helpers de `commercialRepository`
- store local: nao ha `localStorage`
- mocks: nao ha fallback operacional local para persistencia
- leitura final: frontend oficial existe, mas ainda carrega compat de catálogo/provider do legado

## 7. Backend

### Coverage

- backend oficial do read model vive no Master Catalog
- o contrato de leitura e tenant-aware
- a page de Coverage nao escreve estado
- o fluxo e operacional para V1

### Commercial Tables

- modulo oficial: `backend/src/modules/commercial`
- routes: `GET /tables`, `GET /tables/:id`, `POST /tables`, `PATCH /tables/:id`, `DELETE /tables/:id`, `PUT /tables/:id/conditions`
- service: `commercial.service.ts`
- repositories: `commercial-table.repository.ts`, `commercial-condition.repository.ts`
- persistencia: Prisma, com `tenantId`, `deletedAt`, `active`, `startDate`, `endDate`
- estado atual: o modulo usa `authenticate` + `tenantContextMiddleware` e aplica explicitamente `requirePermissions('sales:view')`

## 8. Prisma

Modelos relevantes:

- `CommercialTable`
- `CommercialCondition`
- `MasterCatalogSegment`
- `MasterCatalogProduct`
- `MasterCatalogSubproduct`
- `MasterCatalogModality`
- `Tenant`

Leitura:

- `tenantId` presente em `CommercialTable` e `CommercialCondition`
- `deletedAt` presente em ambos
- `active` presente em ambos
- `CommercialTable` tem `@@unique([tenantId, code])`
- `CommercialCondition` referencia `CommercialTable` e `Tenant`
- nao ha indicio de cross-tenant por query path oficial

## 9. APIs oficiais

- Coverage: `masterCatalogApi.getCatalogTree({ status: "ACTIVE" })`
- Commercial Tables: `commercialApi.listTables`, `getTableById`, `createTable`, `updateTable`, `deleteTable`, `replaceConditions`
- Backend Coverage: contrato do Master Catalog
- Backend Tables: `/api/v1/commercial/tables*`

## 10. Tenant

- Coverage: tenant scoped pelo read model oficial
- Commercial Tables: tenant scoped no service/repository
- risco de cross-tenant: baixo na persistencia, por causa de filtro por `tenantId`

## 11. RBAC

- Coverage frontend: protegido por `sales:view`
- Coverage backend: contrato do Master Catalog com permissão de leitura
- Commercial Tables frontend: protegido por `sales:view`
- Commercial Tables backend: com `requirePermissions('sales:view')`

Conclusao RBAC:

- Coverage OK
- Commercial Tables com RBAC backend explícito e alinhado à SSOT vigente

## 12. Persistencia

- Coverage: read only
- Commercial Tables: persistencia real em Prisma
- nao ha `localStorage` como owner
- nao foi encontrado repositório local como fonte unica de verdade para salvar tabelas

## 13. Testes Coverage

Executados:

- `src/features/commercial-structure/loadCommercialStructureCoverageTree.test.ts`
- `src/features/commercial-structure/commercialStructureCoverage.mapper.test.ts`
- `src/features/commercial-structure/commercialCoverageShadowComparator.test.ts`

Resultado:

- `3 passed`
- `11 tests passed`

## 14. Testes Commercial Tables

Executados:

- `backend/src/tests/unit/commercial.service.test.ts`
- `backend/src/tests/unit/commercial-condition.repository.test.ts`
- `backend/src/tests/unit/commercial.routes.test.ts`

Resultado:

- `3 passed`
- `14 tests passed`

Evidências de rota:

- `401` sem autenticação
- `403` autenticado sem `sales:view`
- `200` `GET /tables` com `sales:view`
- `403` `POST /tables` sem `sales:view`
- `201` `POST /tables` com `sales:view`

## 15. Fluxo integrado Catalog -> Coverage -> Tables

Leitura operacional:

- Master Catalog define o que existe
- Coverage autoriza a venda
- Commercial Tables define as condicoes
- o consumidor final nao precisa inventar condicao se a API oficial for usada
- a persistencia de Commercial Tables e tenant-scoped
- refresh recupera o backend oficial

Ponto de corte:

- o fluxo so e V1-safe quando a autorizacao backend de Commercial Tables estiver fechada

## 16. Legados classificados

| Item | Classificacao | V1 | Observacao |
|---|---|---|---|
| `creditPfCatalog` | QUARANTINE | NAO BLOQUEADOR para Coverage | Sombra/compat, nao owner |
| `catalogRepository` | QUARANTINE | NAO BLOQUEADOR neste gate | nao e SSOT do fluxo auditado |
| `commercialRepository` | QUARANTINE | NAO BLOQUEADOR para persistencia | apoio/compat da UI |
| `masterCatalogToEstruturaComercial` mapper | KEEP / MIGRATE LATER | NAO BLOQUEADOR | atende a tela legada de transicao |
| `localStorage` related | REMOVE LATER | NAO BLOQUEADOR | nao foi identificado como owner do fluxo V1 |

## 17. P0

- nenhum P0 comprovado neste gate

## 18. P1

- nenhum P1 restante comprovado neste gate
- o P1 de RBAC explícito em Commercial Tables foi corrigido com `requirePermissions('sales:view')`

## 19. P2/P3

- shadow compare de Coverage com `creditPfCatalog`
- compat helpers de provider/catalog na UI de Tabelas Comerciais
- limpeza de legado e consolidação futura de ownership

## 20. Decisao Coverage

**COVERAGE V1 - GO WITH RESTRICTIONS**

## 21. Decisao Tables

**COMMERCIAL TABLES V1 - GO WITH RESTRICTIONS**

## 22. Decisao conjunta

**COVERAGE + COMMERCIAL TABLES V1 - GO WITH RESTRICTIONS**

Motivo:

- o P1 comprovado em Commercial Tables foi fechado
- permanecem apenas P2/P3 sem efeito bloqueador para a primeira publicacao

## 23. Menor correção necessária

Correção aplicada no backend de Commercial Tables, alinhando o modulo ao padrao ja usado em outros dominios:

- `requirePermissions('sales:view')` ou permissao oficial equivalente
- cobrir com teste de rota que prove bloqueio sem permissao

Evidencia de fechamento:

- `401` sem autenticação
- `403` autenticado sem `sales:view`
- `200` `GET /tables` com `sales:view`
- `403` `POST /tables` sem `sales:view`
- `201` `POST /tables` com `sales:view`

## 24. Estado final

- a unica correção runtime deste gate foi a inclusão mínima do RBAC explícito em Commercial Tables, acompanhada do teste de rota correspondente
- nenhuma outra alteração de runtime, arquitetura, Prisma, frontend, service ou repository foi realizada nesta auditoria
- documento atualizado apenas para refletir a evidência pós-correção
