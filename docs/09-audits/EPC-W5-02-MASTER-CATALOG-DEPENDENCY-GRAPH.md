# EPC-W5-02 - Master Catalog Dependency Graph

## 1. Metadados
- status: `COMPLETE`
- verdict: `GO WITH RESTRICTIONS`
- data: `2026-07-12`
- branch: `homologation/bootstrap-vps`
- head: `5b0d1186aeaccc9d3290c8b2f75b30243bfbdfed`
- upstream: `origin/homologation/bootstrap-vps`
- escopo: grafo de dependencias do Master Catalog, com foco em cadeia canonica, consumidores, bypasses e risco de migracao
- natureza: leitura, classificacao tecnica, evidencias e documentacao; sem alteracao de producao

## 2. Objetivo
Representar, com rastreabilidade, a cadeia oficial do Master Catalog, seus consumidores diretos e indiretos, os acessos diretos ao Prisma, os desvios de compatibilidade ainda existentes e as implicacoes de migracao. Nenhuma migracao, deploy, commit, push, seed operacional ou alteracao funcional foi executada.

## 3. Baseline validado
- branch atual: `homologation/bootstrap-vps`
- head atual: `5b0d1186aeaccc9d3290c8b2f75b30243bfbdfed`
- upstream: `origin/homologation/bootstrap-vps`
- status local preexistente preservado: `.env.example`, `docs/01-architecture/SDC-FASE-3.4H-F-LOCAL-ACTIVATION-READINESS.md`, `scripts/sdc-3.4h-f-local-readiness.mjs`
- nenhum desses itens foi alterado por este audit

## 4. Documentos e evidencias consultados
- [EPC-W5-01-MASTER-CATALOG-INVENTORY.md](/C:/Projects/FINQZ_PRO/docs/09-audits/EPC-W5-01-MASTER-CATALOG-INVENTORY.md)
- [EPC-W5-01-MASTER-CATALOG-INVENTORY.json](/C:/Projects/FINQZ_PRO/docs/09-audits/evidence/EPC-W5-01-MASTER-CATALOG-INVENTORY.json)
- [DCA-FINQZ-PRO-ENTERPRISE-v2.md](/C:/Projects/FINQZ_PRO/docs/00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md)
- [PCCD-FINQZ-PRO-ENTERPRISE.md](/C:/Projects/FINQZ_PRO/docs/00-master/PCCD-FINQZ-PRO-ENTERPRISE.md)
- [RUN-001-RUNTIME_GOVERNANCE.md](/C:/Projects/FINQZ_PRO/docs/03-runtime/RUN-001-RUNTIME_GOVERNANCE.md)
- [ADR-004-commercial-master-catalog.md](/C:/Projects/FINQZ_PRO/docs/05-adr/ADR-004-commercial-master-catalog.md)
- [ADR-010-loan-with-collateral-canonical-taxonomy.md](/C:/Projects/FINQZ_PRO/docs/05-adr/ADR-010-loan-with-collateral-canonical-taxonomy.md)
- [ARCH-046-master-catalog-persistence-blueprint.md](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-046-master-catalog-persistence-blueprint.md)
- [ARCH-047-master-catalog-repository-contract-design.md](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-047-master-catalog-repository-contract-design.md)
- [ARCH-048-master-catalog-api-read-contract-blueprint.md](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-048-master-catalog-api-read-contract-blueprint.md)
- [ARCH-049-master-catalog-application-service-blueprint.md](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-049-master-catalog-application-service-blueprint.md)
- [ARCH-050-master-catalog-end-to-end-read-flow-blueprint.md](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-050-master-catalog-end-to-end-read-flow-blueprint.md)
- [ARCH-051-master-catalog-runtime-readiness-checklist.md](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-051-master-catalog-runtime-readiness-checklist.md)
- [ARCH-052-master-catalog-architecture-consolidation-review.md](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-052-master-catalog-architecture-consolidation-review.md)
- [ARCH-053-master-catalog-runtime-gap-assessment.md](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-053-master-catalog-runtime-gap-assessment.md)
- [ARCH-054-master-catalog-runtime-entry-review.md](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-054-master-catalog-runtime-entry-review.md)
- [ARCH-055-catalog-consumption-architecture.md](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-055-catalog-consumption-architecture.md)

## 5. Revalidacao do W5-01
O inventario W5-01 continua consistente com o codigo atual observado neste workspace:
- a implementacao oficial permanece em `backend/src/modules/master-catalog/**`
- o bootstrap HTTP continua registrando `masterCatalogRoutes` em `/api/v1/master-catalog`
- o repository oficial continua sendo o unico ponto direto de leitura/escrita ao Prisma para o catalogo mestre
- a seed oficial continua sendo derivada de `MASTER_CATALOG_INITIAL_TREE`
- os consumidores canonicos continuam sendo `Oportunidades`, `Estrutura Comercial`, `Commercial Coverage` e o adapter `loan-with-collateral`
- as fontes locais `creditPfCatalog`, `catalogRepository`, `commercialRepository`, `simulatorRepository` e `store/index.ts` continuam existindo como compatibilidade ou legado

## 6. Grafico resumido

### 6.1 Contagem
- nos: `36`
- arestas: `45`
- classes de dependencia:
  - `bootstrap`
  - `canonical-core`
  - `canonical-contract`
  - `persistence`
  - `consumer`
  - `adapter`
  - `shadow-read`
  - `compatibility`
  - `legacy`

### 6.2 Leitura executiva
- a cadeia canonica e linear: bootstrap HTTP -> routes -> controller -> runtime -> service -> repository -> Prisma
- a cadeia de persistencia e unica e tenant-scoped
- a cadeia de seed e unica e idempotente
- os consumidores frontend ja usam o cliente canonico, mas ainda convivem com mapeadores de conversao
- a cobertura comercial ainda executa shadow read contra `creditPfCatalog`
- `loan-with-collateral` ainda possui fallback de compatibilidade via aliases e campos de request
- `catalogRepository`, `commercialRepository`, `simulatorRepository` e `store/index.ts` ainda formam a camada de compatibilidade local

## 7. Cadeia canonica
1. `backend/src/core/http/fastify.ts` registra `masterCatalogRoutes`
2. `backend/src/modules/master-catalog/presentation/http/master-catalog.routes.ts` expoe somente leitura com `master-catalog:read`
3. `backend/src/modules/master-catalog/presentation/http/master-catalog.controller.ts` valida query/params e delega ao runtime
4. `backend/src/modules/master-catalog/application/master-catalog.runtime.ts` formata a saida em DTO
5. `backend/src/modules/master-catalog/services/master-catalog.service.ts` aplica tenant context e acessa o repository
6. `backend/src/modules/master-catalog/repositories/master-catalog.prisma.repository.ts` consulta `MasterCatalogSegment`, `MasterCatalogProduct`, `MasterCatalogSubproduct` e `MasterCatalogModality`
7. `backend/prisma/schema.prisma` define a persistencia tenant-scoped e os indices de leitura
8. `backend/prisma/seed.ts` persiste a tree oficial a partir de `MASTER_CATALOG_INITIAL_TREE`
9. `backend/src/modules/master-catalog/domain/master-catalog.seed.ts` e a fonte canonica da arvore inicial

## 8. Consumidores canonicos
- `src/api/modules/master-catalog.api.ts` e o cliente read-only do catalogo mestre
- `src/pages/Oportunidades.tsx` faz fetch do tree oficial e trata erro com tree vazia
- `src/features/master-catalog/loadEstruturaComercialFromMasterCatalog.ts` carrega o tree oficial
- `src/features/master-catalog/masterCatalogToEstruturaComercial.mapper.ts` converte o tree canonico para `EstruturaComercial`
- `src/pages/EstruturaComercial.tsx` usa o bootstrap canonico para sincronizacao
- `backend/src/modules/commercial-structure/domain/commercial-structure.mapper.ts` consome `MasterCatalogTreeReadModel`

## 9. Shadow read e compatibilidade
- `src/features/commercial-structure/loadCommercialStructureCoverageTree.ts` consulta o catalogo mestre e compara contra `creditPfCatalog`
- `src/features/commercial-structure/commercialStructureCoverage.mapper.ts` mapeia o tree canonico para a cobertura comercial
- `src/features/commercial-structure/commercialCoverageShadowComparator.ts` declara `creditPfCatalog` como shadow source
- `src/pages/CommercialCoverage.tsx` aciona a carga shadow
- `backend/src/modules/simulation/products/loan-with-collateral/loan-with-collateral.adapter.ts` ainda usa aliases e fallback para request fields depois da resolucao canonica
- `backend/src/modules/simulation/products/loan-with-collateral/loan-with-collateral.metadata.ts` registra o produto canonicamente, mas mantem aliases de compatibilidade e `featureFlags: ['loan-with-collateral']`

## 10. Compatibilidade legada
- `src/data/creditPfCatalog.ts` continua sendo a fonte local mais rica de taxonomia PF
- `src/data/catalogRepository.ts` continua retornando catalogo local
- `src/data/commercialRepository.ts` continua como fonte local de apoio para UI comercial e simulador
- `src/data/simulatorRepository.ts` continua ancorado em `commercialRepository`
- `src/store/index.ts` continua derivando `EstruturaComercial` de `creditPfCatalog`
- `src/pages/TabelasComerciais.tsx` e `src/pages/Simulador.tsx` ainda consomem as camadas locais de compatibilidade

## 11. Acessos diretos ao Prisma
- `backend/src/modules/master-catalog/repositories/master-catalog.prisma.repository.ts`
  - leitura e filtragem tenant-scoped
  - uso de `deletedAt = null`
  - ordenacao por `displayOrder` e `name`
  - acesso as tabelas `masterCatalogSegment`, `masterCatalogProduct`, `masterCatalogSubproduct` e `masterCatalogModality`
- `backend/prisma/seed.ts`
  - upserts idempotentes por tenant e code
  - escrita inicial da arvore oficial do catalogo

## 12. Bypasses e desvios
- bypass intencional e observado: `creditPfCatalog` como shadow source no fluxo de cobertura comercial
- bypass intencional e observado: `catalogRepository`, `commercialRepository`, `simulatorRepository` e `store/index.ts` preservam fontes locais
- bypass parcial e observado: `loan-with-collateral.adapter.ts` ainda aceita alias e request fields se o lookup canonico nao resolver completamente
- bypass de resiliencia e observado: `Oportunidades` cai para tree vazia em caso de erro, sem leitura alternativa local

## 13. Ciclos, couplings e pontos unicos de falha

### 13.1 Ciclos
- nenhum ciclo arquitetural relevante foi identificado entre o Master Catalog canonico e seus consumidores
- existe apenas a cadeia top-down esperada de dependencia

### 13.2 Couplings fortes
- `tenantId` e obrigatorio em controller, service e repository
- `master-catalog:read` e obrigatorio na surface publica
- `status=ACTIVE` e o filtro recorrente nos consumidores canonicos
- `displayOrder` + `name` formam a regra de ordenacao canonica
- `creditPfCatalog` continua acoplado ao shadow comparator e a varias camadas legadas
- `loan-with-collateral` continua acoplado a aliases de subflow e fallback de request
- `commercialRepository` continua acoplado a estado em memoria

### 13.3 Pontos unicos de falha
- `master_catalog_prisma_repository` e o unico ponto oficial de leitura canonica persistida
- `backend/prisma/seed.ts` e o unico runner de bootstrap da arvore oficial
- `MASTER_CATALOG_INITIAL_TREE` e a unica fonte canonica da tree inicial
- `masterCatalogRoutes` e a unica surface HTTP canonica
- `creditPfCatalog` continua sendo um ponto unico de falha da compatibilidade local

## 14. Ordem de migracao recomendada
1. Consolidar todos os consumidores de leitura em `src/api/modules/master-catalog.api.ts` e remover duplicacao de mapeamento onde possivel
2. Fechar a divergencia de `Commercial Coverage`, mantendo shadow read ate a paridade ser comprovada
3. Migrar `Estrutura Comercial` e seu mapper para depender apenas do contrato canonico
4. Reduzir o fallback do adapter `loan-with-collateral` para um caminho estritamente canonico
5. Tratar `catalogRepository`, `commercialRepository`, `simulatorRepository` e `store/index.ts` como compatibilidade limitada ou aposentacao futura
6. Planejar o apagamento ou congelamento de `creditPfCatalog` depois do fechamento de paridade

## 15. Decisoes ADR
- `ADR-004-commercial-master-catalog.md`: estabelece o Master Catalog como SSOT da taxonomia comercial
- `ADR-010-loan-with-collateral-canonical-taxonomy.md`: aceita a taxonomia canonica para o produto `loan-with-collateral`, ainda com compatibilidade temporaria

## 16. Lacunas de evidencia
- nao existe `docs/00-master/FINQZ-PRO-ENTERPRISE-CONTEXT-SSOT.md`
- nao foi encontrado flag dedicado para Master Catalog, apenas flags de simulacao e evidence
- nao foi encontrado contador ou metrico especifico para divergencia de Master Catalog
- nao foi encontrada evidencia de retirada completa de `creditPfCatalog`, `catalogRepository`, `commercialRepository`, `simulatorRepository` e `store/index.ts`
- nao ha evidencia de um gate automatico de paridade para aposentar o shadow read

## 17. Recomendacao para W5-03
W5-03 deve ser um plano de corte por consumidor, com criterio de paridade e criterio de saida. A ordem mais segura e:
1. Oportunidades
2. Estrutura Comercial
3. Commercial Coverage
4. commercial-structure backend mapper
5. loan-with-collateral adapter
6. compatibilidade legada (`catalogRepository`, `commercialRepository`, `simulatorRepository`, `store/index.ts`, `creditPfCatalog`)

## 18. Artefatos criados
- [EPC-W5-02-MASTER-CATALOG-DEPENDENCY-GRAPH.md](/C:/Projects/FINQZ_PRO/docs/09-audits/EPC-W5-02-MASTER-CATALOG-DEPENDENCY-GRAPH.md)
- [EPC-W5-02-MASTER-CATALOG-DEPENDENCY-GRAPH.json](/C:/Projects/FINQZ_PRO/docs/09-audits/evidence/EPC-W5-02-MASTER-CATALOG-DEPENDENCY-GRAPH.json)
- [EPC-W5-02-MASTER-CATALOG-DEPENDENCY-GRAPH.mmd](/C:/Projects/FINQZ_PRO/docs/09-audits/evidence/EPC-W5-02-MASTER-CATALOG-DEPENDENCY-GRAPH.mmd)

## 19. Validacoes
- JSON parse validado com sucesso
- `git diff --check` executado sem novos problemas gerados por este audit
- nenhum deploy, commit, push, migration, seed operacional ou alteracao funcional foi executado
- nenhum arquivo fora do escopo de `docs/09-audits` foi modificado
