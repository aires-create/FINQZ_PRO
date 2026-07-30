# EPC-W5-03 — Master Catalog Migration Cut Plan

## 1. Metadados
- status: `COMPLETE`
- veredito: `GO WITH RESTRICTIONS`
- data: `2026-07-12`
- branch: `homologation/bootstrap-vps`
- head: `62afd00fa3bf9b5bfeca03d73caf1e9781577e18`
- upstream: `origin/homologation/bootstrap-vps`
- baseline esperado: branch `homologation/bootstrap-vps`, commit-base `62afd00`
- natureza: auditoria, planejamento técnico, classificação de consumidores, gates, rollback e ordem segura de migração

## 2. Objetivo
Transformar o inventário W5-01 e o grafo W5-02 em um plano de corte seguro, sem qualquer implementação. O foco e a transicao reversivel de consumidores, a retirada gradual de compatibilidades e a definicao objetiva de gates, metricas, rollback e criterios de saida.

## 3. Baseline
- branch atual: `homologation/bootstrap-vps`
- head atual: `62afd00fa3bf9b5bfeca03d73caf1e9781577e18`
- upstream atual: `origin/homologation/bootstrap-vps`
- estado local preexistente preservado: `.env.example`, `docs/01-architecture/SDC-FASE-3.4H-F-LOCAL-ACTIVATION-READINESS.md`, `scripts/sdc-3.4h-f-local-readiness.mjs`
- nao houve alteracao em branch, merge, rebase, pull, deploy, banco, migrations, feature flags ou codigo de producao

## 4. Documentos consultados
- [EPC-W5-01-MASTER-CATALOG-INVENTORY.md](/C:/Projects/FINQZ_PRO/docs/09-audits/EPC-W5-01-MASTER-CATALOG-INVENTORY.md)
- [EPC-W5-01-MASTER-CATALOG-INVENTORY.json](/C:/Projects/FINQZ_PRO/docs/09-audits/evidence/EPC-W5-01-MASTER-CATALOG-INVENTORY.json)
- [EPC-W5-02-MASTER-CATALOG-DEPENDENCY-GRAPH.md](/C:/Projects/FINQZ_PRO/docs/09-audits/EPC-W5-02-MASTER-CATALOG-DEPENDENCY-GRAPH.md)
- [EPC-W5-02-MASTER-CATALOG-DEPENDENCY-GRAPH.json](/C:/Projects/FINQZ_PRO/docs/09-audits/evidence/EPC-W5-02-MASTER-CATALOG-DEPENDENCY-GRAPH.json)
- [EPC-W5-02-MASTER-CATALOG-DEPENDENCY-GRAPH.mmd](/C:/Projects/FINQZ_PRO/docs/09-audits/evidence/EPC-W5-02-MASTER-CATALOG-DEPENDENCY-GRAPH.mmd)
- [DCA-FINQZ-PRO-ENTERPRISE-v2.md](/C:/Projects/FINQZ_PRO/docs/00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md)
- [PCCD-FINQZ-PRO-ENTERPRISE.md](/C:/Projects/FINQZ_PRO/docs/00-master/PCCD-FINQZ-PRO-ENTERPRISE.md)
- [RUN-001-RUNTIME_GOVERNANCE.md](/C:/Projects/FINQZ_PRO/docs/03-runtime/RUN-001-RUNTIME_GOVERNANCE.md)
- [ADR-004-commercial-master-catalog.md](/C:/Projects/FINQZ_PRO/docs/05-adr/ADR-004-commercial-master-catalog.md)
- [ADR-010-loan-with-collateral-canonical-taxonomy.md](/C:/Projects/FINQZ_PRO/docs/05-adr/ADR-010-loan-with-collateral-canonical-taxonomy.md)
- [ARCH-041-MASTER-CATALOG-CONSUMER-MAPPING.md](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-041-MASTER-CATALOG-CONSUMER-MAPPING.md)
- [ARCH-042-MASTER-CATALOG-API-CONTRACT-DESIGN.md](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-042-MASTER-CATALOG-API-CONTRACT-DESIGN.md)
- [ARCH-043-MASTER-CATALOG-PERSISTENCE-STRATEGY.md](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-043-MASTER-CATALOG-PERSISTENCE-STRATEGY.md)
- [ARCH-044-MASTER-CATALOG-ROLLOUT-MIGRATION-STRATEGY.md](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-044-MASTER-CATALOG-ROLLOUT-MIGRATION-STRATEGY.md)
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

## 5. Restricoes e premissas
- nenhuma migracao foi executada
- nenhum codigo de producao foi alterado
- nenhum arquivo `.env` foi alterado
- nenhum contrato HTTP, DTO, repository, service, runtime, seed ou migration foi alterado
- nenhum deploy, commit, push, pull, merge, rebase, reset, restore ou clean foi executado
- as alteracoes locais preexistentes foram preservadas integralmente e nao entraram na entrega
- `docs/00-master/FINQZ-PRO-ENTERPRISE-CONTEXT-SSOT.md` continua ausente e permanece como gap documental

## 6. Revalidacao da W5-01
O inventario W5-01 continua consistente com o codigo observado neste workspace.
- a implementacao oficial continua em `backend/src/modules/master-catalog/**`
- `backend/src/core/http/fastify.ts` segue registrando `masterCatalogRoutes`
- `backend/prisma/schema.prisma` segue definindo `MasterCatalogSegment`, `MasterCatalogProduct`, `MasterCatalogSubproduct` e `MasterCatalogModality`
- `backend/prisma/seed.ts` segue persistindo `MASTER_CATALOG_INITIAL_TREE`
- os consumidores canonicos continuam sendo `Oportunidades`, `Estrutura Comercial`, `Commercial Coverage` e `loan-with-collateral`
- `creditPfCatalog`, `catalogRepository`, `commercialRepository`, `simulatorRepository` e `store/index.ts` seguem como compatibilidade ou legado

## 7. Revalidacao da W5-02
O grafo W5-02 continua valido para o plano de corte.
- `nodeCount`: `36`
- `edgeCount`: `45`
- classes de dependencia: `bootstrap`, `canonical-core`, `canonical-contract`, `persistence`, `consumer`, `adapter`, `shadow-read`, `compatibility`, `legacy`
- cadeia canonica confirmada: bootstrap -> routes -> controller -> runtime -> service -> repository -> Prisma
- a sombra de `Commercial Coverage` continua comparando `Master Catalog` com `creditPfCatalog`
- o adapter `loan-with-collateral` continua com aliases e fallback de compatibilidade

## 8. Metodologia
1. Revalidei baseline, W5-01 e W5-02 no codigo.
2. Classifiquei cada consumidor por posicao no grafo e por dependencia atual.
3. Separei fontes canonicas, shadow reads, compatibilidades e legados.
4. Defini gates, metricas, criterios de rollback e criterios de aposentadoria.
5. Ordenei a migracao por menor risco, menor acoplamento e facilidade de rollback.

## 9. Estado atual
- `Master Catalog` canonico: pronto e consolidado como owner oficial
- `Oportunidades` e `Estrutura Comercial`: ja usam a API canonica, com pouco residuo tecnico
- `Commercial Coverage`: ainda em shadow read com comparacao contra `creditPfCatalog`
- `Tabelas Comerciais`: ainda depende de `commercialRepository` para seletores e estrutura local
- `Simulador`: ainda depende de `simulatorRepository` e `commercialRepository`
- `Simulation Runtime`: e infraestrutura de observabilidade, com flags para shadow/evidence/fallback
- `loan-with-collateral`: parcialmente migrado, mas ainda com aliases e fallback
- `Products`: infraestrutura compartilhada de adaptadores
- `frontend store` e `frontend repositories locais`: ainda mantem verdade paralela

## 10. Classificacao dos consumidores

| Consumidor | Classe | Estado de migracao | Papel no grafo | Risco |
| --- | --- | --- | --- | --- |
| Oportunidades | `LEAF` | `READY_FOR_PRIMARY` | consumidor canonico de leitura | `LOW` |
| Estrutura Comercial | `LEAF` | `READY_FOR_PRIMARY` | consumidor canonico + bootstrap | `LOW` |
| Commercial Coverage | `SHADOW_ONLY` | `SHADOW_ACTIVE` | comparacao/paridade | `HIGH` |
| Tabelas Comerciais | `INTERMEDIATE` | `PRIMARY_WITH_FALLBACK` | consumidor intermediario de seletores | `HIGH` |
| Simulador | `CENTRAL` | `BLOCKED` | consome repos locais e runtime | `HIGH` |
| Simulation Runtime | `SHARED_INFRASTRUCTURE` | `NOT_APPLICABLE` | observabilidade e evidence | `MEDIUM` |
| loan-with-collateral | `COMPATIBILITY_LAYER` | `PRIMARY_WITH_FALLBACK` | adapter canonico parcial | `HIGH` |
| Products | `SHARED_INFRASTRUCTURE` | `NOT_APPLICABLE` | registry de adapters | `LOW` |
| frontend store | `LEGACY_SOURCE` | `READY_FOR_LEGACY_REMOVAL` | gera estrutura local paralela | `HIGH` |
| frontend repositories locais | `PARALLEL_SOURCE` | `BLOCKED` | apoio local para UI/simulador | `HIGH` |

## 11. Dependency Severity Matrix

| ID | Dependencia | Consumidores | Papel | Severidade | Risco do corte | Pode cortar agora? | Pre-requisitos | Rollback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D-01 | `masterCatalogRoutes` | `Oportunidades`, `Estrutura Comercial`, `Commercial Coverage` | surface HTTP canonica | `BLOCKER` | `MINIMAL` | `N/A` | nenhum, e a surface oficial | revert do router apenas em incidente |
| D-02 | `masterCatalogPrismaRepository` | runtime oficial | leitura canonica persistida | `BLOCKER` | `MINIMAL` | `N/A` | nenhum, e o ponto unico oficial | revert do commit que altere o repository |
| D-03 | `seed oficial` | bootstrap inicial | escrita canonica idempotente | `BLOCKER` | `MINIMAL` | `N/A` | nenhum, e a fonte canonica da tree | revert do seed runner |
| D-04 | `creditPfCatalog` | compatibilidade e shadow | fonte paralela | `CRITICAL` | `EXTREME` | `NO` | zero consumers funcionais, paridade e periodo estavel | reativar shadow e paths locais |
| D-05 | `catalogRepository` | frontend local | compatibilidade local | `HIGH` | `HIGH` | `NO` | nenhum consumer de runtime e substituicao canonica | restaurar adaptador local |
| D-06 | `commercialRepository` | Tabelas e Simulador | compatibilidade e estado em memoria | `HIGH` | `HIGH` | `NO` | seletores e simulacao independentes do estado local | restaurar repository e estado em memoria |
| D-07 | `simulatorRepository` | Simulador | compatibilidade local | `HIGH` | `HIGH` | `NO` | Simulation Runtime como fonte oficial | restaurar repository e fluxo legado |
| D-08 | `store/index.ts` | store e selectors | legado derivado de fonte paralela | `HIGH` | `MODERATE` | `NO` | selectors/hooks migrados | restaurar derivacao local |
| D-09 | `commercialCoverageShadowComparator` | Commercial Coverage | shadow read e comparacao | `MEDIUM` | `LOW` | `NO` | paridade estavel e divergencias aceitas formalmente | reativar comparacao shadow |
| D-10 | `loadCommercialStructureCoverageTree` | Commercial Coverage | entrada do shadow read | `HIGH` | `MODERATE` | `NO` | shadow ativo e observabilidade pronta | restaurar fluxo shadow |
| D-11 | `loan-with-collateral metadata` | adapter e registry de produtos | catalogo de produto e aliases | `MEDIUM` | `MODERATE` | `NO` | aliases sem uso real e request fields canonicos | restaurar aliases e metadata atual |
| D-12 | `loan-with-collateral adapter` | simulacao de credito | compatibilidade e normalizacao | `CRITICAL` | `HIGH` | `NO` | ids e nomes canonicos, fallback zero, testes negativos aprovados | restaurar fallback de compatibilidade |

## 12. Consumidores folha
- `Oportunidades`
- `Estrutura Comercial`
- `Commercial Coverage`
- `Tabelas Comerciais`

## 13. Consumidores centrais
- `Simulador`
- `loan-with-collateral`
- `frontend repositories locais`
- `frontend store`
- `Simulation Runtime` como infraestrutura compartilhada de observabilidade

## 14. Camadas de compatibilidade
- `src/data/catalogRepository.ts`
- `src/data/commercialRepository.ts`
- `src/data/simulatorRepository.ts`
- `src/store/index.ts`
- `src/features/commercial-structure/commercialCoverageShadowComparator.ts`
- `backend/src/modules/simulation/products/loan-with-collateral/loan-with-collateral.adapter.ts`

## 15. Fontes paralelas
- `src/data/creditPfCatalog.ts`
- `src/data/catalogRepository.ts`
- `src/data/commercialRepository.ts`
- `src/data/simulatorRepository.ts`
- `src/store/index.ts`
- `src/features/commercial-structure/commercialCoverageShadowComparator.ts`
- `backend/src/modules/simulation/products/loan-with-collateral/loan-with-collateral.metadata.ts`

## 16. Métricas de paridade
- total de segmentos, produtos, subprodutos e modalidades
- IDs ausentes e IDs extras
- diferenças de label
- diferenças de código
- diferenças de status
- diferenças de ordenacao
- relacoes pai-filho divergentes
- duplicidades
- registros sem mapeamento
- divergencias por tenant
- percentual de requests usando fonte canonica
- percentual de fallback
- numero de divergencias por execucao
- numero de consumers por fonte
- numero de imports legados restantes

## 17. Gates de migracao

| Gate | Evidencia obrigatoria | Comando de validacao | Condicao de aprovacao | Condicao de reprovacao | Responsavel | Rollback |
| --- | --- | --- | --- | --- | --- | --- |
| GATE 0 - BASELINE | branch, head, status, build e testes conhecidos | `git status --short --branch`; `git rev-parse HEAD`; `npm run build`; `npm run test` | baseline identificado, build/testes verdes, rollback definido | branch/HEAD divergentes ou build/teste falho | arquiteto/owner do corte | nao iniciar corte |
| GATE 1 - CONTRATO | contrato, schema e mapeamento canonico | `rg -n "masterCatalogApi|getCatalogTree|masterCatalogRoutes"` | contrato identificado e nenhum campo critico sem origem | campo critico sem mapeamento ou contrato inconsistente | owner do dominio | restaurar contrato anterior |
| GATE 2 - PARIDADE | comparacao de tree, ordenacao, IDs e relacoes | `npm run test -- commercialCoverageShadowComparator` | mesma populacao, mesma ordenacao e divergencia formalmente aceitavel | IDs, labels, status ou relacoes divergentes | owner de dados/comercial | manter shadow e nao promover |
| GATE 3 - SHADOW | shadow ativo, logs e metrics | `rg -n "shadowEnabled|evidenceEnabled|fallbackUsed"` | shadow sem impacto visual e divergencias classificadas | falta de logs/telemetria ou impacto visual | owner de observabilidade | reativar shadow anterior |
| GATE 4 - PRIMARY | fonte canonica como primária | `npm run test -- master-catalog` | primary ativo com smoke aprovado | regressao funcional ou mismatch de tenant | owner do consumidor | desativar primary e reativar fallback |
| GATE 5 - FALLBACK REMOVAL | zero fallback real ou limite formal | `rg -n "fallback|empty tree|creditPfCatalog|commercialRepository|simulatorRepository"` | periodo estavel e sem regressao | fallback ainda necessario ou divergente | owner do consumidor | restaurar fallback |
| GATE 6 - LEGACY REMOVAL | zero consumers, zero imports, zero runtime reads | `rg -n "creditPfCatalog|catalogRepository|commercialRepository|simulatorRepository|store/index.ts"` | busca global sem referencias funcionais | qualquer import ou runtime read ainda existente | owner de plataforma | revert do commit isolado |
| GATE 7 - CLOSURE | evidencias, ADR/EPC e aposentadoria formal | `git status --short --branch` + evidence pack | arquivo de encerramento e evidencias completos | docs/evidence incompletos | arquiteto enterprise | reabrir com issue de auditoria |

## 18. Estratégia de Shadow Read
- manter `Commercial Coverage` em shadow ate a paridade do `creditPfCatalog` com o Master Catalog ser formalmente medida
- usar logs estruturados, divergencias classificadas e evidencia de execucao
- nao usar shadow read para escrita nem para decisao de negocio
- desligar apenas depois de periodo estavel, divergencia zero ou divergencias aceitas formalmente, e primary validado

## 19. Estratégia de Primary
- `Oportunidades` e `Estrutura Comercial` sao os consumidores mais proximos de primary definitivo
- `Commercial Coverage` so pode migrar para primary depois de Gate 2 e Gate 4
- `loan-with-collateral` so pode ficar primary sem fallback depois de IDs canonicos, aliases removidos e testes de compatibilidade aprovados

## 20. Estratégia de Fallback
- fallback configuracional deve permanecer apenas onde ha risco operacional comprovado
- `Oportunidades` pode manter fallback de erro curto ate o monitoramento ficar estavel
- `Commercial Coverage` nao deve usar fallback para substituir shadow; shadow nao e fallback
- `loan-with-collateral` deve perder fallback em tres etapas: observacao, desativacao e remocao

## 21. Estratégia de Feature Flags
- flags reutilizaveis: `VITE_SIMULATION_RUNTIME_SHADOW_ENABLED`, `VITE_SIMULATION_RUNTIME_PRIMARY_ENABLED`, `VITE_SIMULATION_RUNTIME_FALLBACK_ENABLED`, `VITE_SIMULATION_RUNTIME_EVIDENCE_ENABLED`, `VITE_REMOTE_EVIDENCE_ENABLED`
- flags inadequadas para corte do Master Catalog: nenhuma dessas controla diretamente Oportunidades, Estrutura Comercial, Commercial Coverage ou repositories locais
- lacuna: nao existe familia de flags dedicada ao Master Catalog
- proposta somente se um corte futuro precisar de guarda temporaria: `VITE_MASTER_CATALOG_<CONSUMER>_SHADOW_ENABLED`, `VITE_MASTER_CATALOG_<CONSUMER>_PRIMARY_ENABLED`, `VITE_MASTER_CATALOG_<CONSUMER>_FALLBACK_ENABLED`
- decisao atual: nao criar novas flags nesta execucao

## 22. Plano de corte — Oportunidades
- classificacao: `LEAF`
- estado: `READY_FOR_PRIMARY`
- fluxo atual: `masterCatalogApi.getCatalogTree({ status: "ACTIVE" })`
- fonte atual: API canonica do Master Catalog
- fonte alvo: mesma API canonica, com observabilidade e corte de fallback apenas quando seguro
- dependencias: `masterCatalogApi`, `masterCatalogRoutes`, `masterCatalogRuntime`
- risco: `LOW`
- observabilidade: taxa de sucesso do fetch, erro de rede, tempo de resposta, pagina vazia
- metrica de paridade: `100%` de requests na API canonica
- tolerancia: zero regressao funcional e zero divergencia de tree
- testes: unidade do client e smoke da pagina
- feature flag: nenhuma nova
- rollback: desabilitar a mudanca de release ou reativar o comportamento atual com tree vazia
- criterio de sucesso: tree canonica carregada sem regressao visual ou funcional
- criterio de falha: erro sistemico no carregamento ou regressao de selecao
- criterio de saida: periodo estavel e sem fallback nao intencional
- sequencia: `W5-03B`

## 23. Plano de corte — Estrutura Comercial
- classificacao: `LEAF`
- estado: `READY_FOR_PRIMARY`
- fluxo atual: bootstrap e sync a partir do Master Catalog canonico
- fonte atual: API canonica + mapper local
- fonte alvo: API canonica + mapper canonico estabilizado
- dependencias: `loadEstruturaComercialFromMasterCatalog`, `masterCatalogToEstruturaComercial.mapper`, `Estrutura Comercial`
- risco: `LOW`
- observabilidade: contagem de nos, ordenacao, erros de sync e drift de estrutura
- metrica de paridade: mesma quantidade e mesma ordenacao de segmentos/produtos/subprodutos/modalidades
- tolerancia: divergencia zero em IDs, labels e ordem
- testes: mapper, bootstrap e smoke de persistencia da tela
- feature flag: nenhuma nova
- rollback: retornar ao mapper anterior e ao fluxo de bootstrap anterior
- criterio de sucesso: estrutura derivada 1:1 da tree canonica
- criterio de falha: drift de ordenacao ou estrutura incompleta
- criterio de saida: periodo estavel com sync repetivel
- sequencia: `W5-03C`

## 24. Plano de corte — Commercial Coverage
- classificacao: `SHADOW_ONLY`
- estado: `SHADOW_ACTIVE`
- fluxo atual: carrega Master Catalog e compara contra `creditPfCatalog`
- fonte atual: Master Catalog + shadow local
- fonte alvo: Master Catalog como unica referencia, shadow desligado apos paridade
- dependencias: `loadCommercialStructureCoverageTree`, `commercialCoverageShadowComparator`, `creditPfCatalog`
- risco: `HIGH`
- observabilidade: logs estruturados, classificacao de divergencias, contagem por execucao
- metrica de paridade: divergencias por execucao iguais a zero ou aceitas formalmente
- tolerancia: zero para IDs/relacoes; labels apenas com aprovacao formal
- testes: comparator, carga shadow, regressao de pagina
- feature flag: nenhuma nova; usar apenas disciplina de shadow/evidence
- rollback: manter o shadow read ativo e reabrir o comparator se necessario
- criterio de sucesso: paridade sustentada por periodo minimo definido
- criterio de falha: qualquer divergencia funcional nao aceita
- criterio de saida: desligar shadow somente apos Gate 2, Gate 3 e Gate 4
- sequencia: `W5-03D`

## 25. Plano de corte — Tabelas Comerciais
- classificacao: `INTERMEDIATE`
- estado: `PRIMARY_WITH_FALLBACK`
- fluxo atual: `commercialApi.listTables` + seletores locais do `commercialRepository`
- fonte atual: backend comercial + repositorio local para selecao de produtos/subprodutos/modalidades
- fonte alvo: seletores e mapeamentos canonicos, mantendo apenas o backend comercial como fonte de tabelas
- dependencias: `commercialApi`, `commercialRepository`, `creditPfCatalog`
- risco: `HIGH`
- observabilidade: numero de tabelas, seletores usados, falhas de lookup e uso de fallback
- metrica de paridade: mesma populacao e mesmos IDs de selecao
- tolerancia: zero perda de tabela e zero regressao de filtro
- testes: seletores, filtros e listagem de tabelas
- feature flag: nenhuma nova
- rollback: restaurar seletores locais e fluxo atual do repository
- criterio de sucesso: seletores deixam de depender de catalogo local
- criterio de falha: tabela invalida, filtro quebrado ou lookup vazio
- criterio de saida: removido o acoplamento funcional com `creditPfCatalog`
- sequencia: `W5-03E`

## 26. Plano de corte — Simulador
- classificacao: `CENTRAL`
- estado: `BLOCKED`
- fluxo atual: `simulatorRepository` + `commercialRepository` + engine local
- fonte atual: estado local e repositorios de compatibilidade
- fonte alvo: runtime canonico e dados canonicos de catalogo
- dependencias: `simulatorRepository`, `commercialRepository`, `simulationEngine`, `searchCities`, `creditPfCatalog`
- risco: `HIGH`
- observabilidade: taxa de uso do repository local, erro de oferta e comparacao de resultado
- metrica de paridade: mesma oferta para mesma entrada e mesma selecao de produto/subproduto/modalidade
- tolerancia: divergencia zero em ofertas deterministicas
- testes: simulacao, seletores, integracao de fluxo e smoke
- feature flag: flags de simulation runtime existentes para observabilidade e fallback
- rollback: restaurar path local de repository e manter fallback ligado
- criterio de sucesso: runtime canonico produz mesma saida com fallback controlado
- criterio de falha: divergencia de oferta ou regressao de conversao
- criterio de saida: `simulatorRepository` sem uso funcional e com observabilidade residual
- sequencia: `W5-03F`

## 27. Plano de corte — Simulation Runtime
- classificacao: `SHARED_INFRASTRUCTURE`
- estado: `NOT_APPLICABLE`
- fluxo atual: shadow, primary, fallback e evidence do runtime de simulacao
- fonte atual: flags de runtime e evidence hooks
- fonte alvo: mesma infraestrutura, com mais observabilidade se necessario
- dependencias: `VITE_SIMULATION_RUNTIME_SHADOW_ENABLED`, `VITE_SIMULATION_RUNTIME_PRIMARY_ENABLED`, `VITE_SIMULATION_RUNTIME_FALLBACK_ENABLED`, `VITE_SIMULATION_RUNTIME_EVIDENCE_ENABLED`, `VITE_REMOTE_EVIDENCE_ENABLED`
- risco: `MEDIUM`
- observabilidade: telemetria, evidence e status de shadow execution
- metrica de paridade: percentual de requests com evidence e com fallback
- tolerancia: fallback apenas dentro do limite formal
- testes: feature tests e evidence tests
- feature flag: as flags existentes
- rollback: desligar primary ou evidence e voltar para o estado atual de flags
- criterio de sucesso: runtime continua estável e auditável durante cortes dos consumidores
- criterio de falha: perda de evidence ou quebra do shadow
- criterio de saida: nenhuma dependência de corte pendente no runtime
- sequencia: `W5-03A` e suporte transversal

## 28. Plano de corte — loan-with-collateral
- classificacao: `COMPATIBILITY_LAYER`
- estado: `PRIMARY_WITH_FALLBACK`
- fluxo atual: runtime canonico resolve produto/subproduto, depois ainda ha aliases e fallback de request fields
- fonte atual: `masterCatalogRuntime` + compatibilidade local
- fonte alvo: IDs e nomes canonicos sem aliases ativos
- dependencias: `masterCatalogRuntime`, `loan-with-collateral.metadata.ts`, `loan-with-collateral.adapter.ts`, subflows `HOME_EQUITY` e `AUTO_EQUITY`
- risco: `CRITICAL`
- observabilidade: hit rate de alias, miss de lookup, fallback usado e origem do subflow
- metrica de paridade: lookup canonico 100% e fallback 0%
- tolerancia: zero para aliases em runtime e zero fallback operacional
- testes: negativos de compatibilidade, validação de subflow e smoke da simulacao
- feature flag: `loan-with-collateral`
- rollback: reativar aliases e fallback de request fields
- criterio de sucesso: runtime canonico resolve todo caso suportado sem fallback
- criterio de falha: qualquer request que precise de alias para funcionar
- criterio de saida: aliases sem uso real e fallback removido
- sequencia: `W5-03G`

## 29. Plano de corte — Products
- classificacao: `SHARED_INFRASTRUCTURE`
- estado: `NOT_APPLICABLE`
- fluxo atual: registry de adapters de simulacao
- fonte atual: `LoanWithCollateralAdapter`
- fonte alvo: mesma infraestrutura, sem dependencias de catalogo local
- dependencias: `backend/src/modules/simulation/products/index.ts`, `simulationProductRegistry`
- risco: `LOW`
- observabilidade: taxa de resolucao de adapter e subflow
- metrica de paridade: 100% de resolucao pelo registry canonico
- tolerancia: nenhuma quebra no registro de produtos
- testes: registry e resolucao de adapter
- feature flag: nenhuma nova
- rollback: restaurar o registry atual
- criterio de sucesso: Products continua sendo infraestrutura, nao fonte paralela
- criterio de falha: registry perde resolucao de adapter
- criterio de saida: nenhuma dependencia de catalogo local exposta por Products
- sequencia: transversal, sem corte proprio

## 30. Plano de corte — frontend repositories locais
- classificacao: `PARALLEL_SOURCE`
- estado: `BLOCKED`
- fluxo atual: `catalogRepository`, `commercialRepository` e `simulatorRepository`
- fonte atual: `creditPfCatalog` + estado local em memoria
- fonte alvo: clientes canonicos e backend oficial
- dependencias: `creditPfCatalog`, `commercialRepository`, `simulatorRepository`
- risco: `HIGH`
- observabilidade: contagem de imports, consumo por pagina e uso de estado local
- metrica de paridade: numero de imports legados restantes igual a zero
- tolerancia: zero consumers funcionais
- testes: migracao de consumers, cobertura de helpers e smoke
- feature flag: nenhuma nova
- rollback: restaurar o repository local e manter compatibilidade
- criterio de sucesso: nenhuma pagina/fluxo depende das fontes locais
- criterio de falha: qualquer import runtime ou uso funcional de fonte paralela
- criterio de saida: repositories removidos ou congelados
- sequencia: `W5-03H`

## 31. Plano de corte — frontend store
- classificacao: `LEGACY_SOURCE`
- estado: `READY_FOR_LEGACY_REMOVAL`
- fluxo atual: `src/store/index.ts` deriva `EstruturaComercial` de `creditPfCatalog`
- fonte atual: `creditPfCatalog`
- fonte alvo: estrutura canonica derivada de API oficial ou desacoplamento total
- dependencias: store selectors, hooks e estruturas derivadas
- risco: `HIGH`
- observabilidade: uso de selectors, imports legados e origem do estado
- metrica de paridade: zero consumidores do store como fonte paralela de catalogo
- tolerancia: zero
- testes: selectors e componentes que dependem do store
- feature flag: nenhuma nova
- rollback: restaurar a derivacao local atual
- criterio de sucesso: nenhum dominio usa o store como SSOT do catalogo
- criterio de falha: qualquer selector ainda depende de `creditPfCatalog`
- criterio de saida: `store/index.ts` pode ser removido ou congelado
- sequencia: `W5-03I`

## 32. Matriz comparativa dos candidatos

| Consumer | Leaf/Central | Criticidade | Cobertura | Observabilidade | Rollback | Risco | Recomendacao |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Oportunidades | Leaf | P1 | Alta | Alta | Simples | `LOW` | **Sim, primeiro candidato** |
| Estrutura Comercial | Leaf | P1 | Alta | Alta | Simples | `LOW` | Segundo candidato |
| Commercial Coverage | Shadow only | P1 | Media | Alta | Simples | `HIGH` | Apos paridade |
| Tabelas Comerciais | Intermediate | P1 | Media | Media | Media | `HIGH` | Depois da harmonizacao dos repos locais |
| Simulador | Central | P1 | Alta | Media | Media | `HIGH` | Depois da compatibilidade local |
| loan-with-collateral | Central/compat | P0 | Alta | Media | Media | `CRITICAL` | Ultima etapa funcional |

## 33. Primeiro candidato recomendado
**FIRST_MIGRATION_CANDIDATE = Oportunidades**

Por que e o primeiro:
- e um consumidor folha
- ja usa a API canonica do Master Catalog
- nao depende de `creditPfCatalog`, `commercialRepository` ou `simulatorRepository`
- possui o menor blast radius entre os consumidores relevantes
- o rollback e simples: voltar a release anterior ou manter a pagina com tree vazia em erro, como ja existe

Por que os demais nao sao os primeiros:
- `Estrutura Comercial` agrega bootstrap e sync, com maior acoplamento funcional
- `Commercial Coverage` depende de paridade formal antes de qualquer desligamento
- `Tabelas Comerciais` ainda usa seletores locais e repository de compatibilidade
- `Simulador` depende de estado local e de repository paralelo
- `loan-with-collateral` e a maior superficie de compatibilidade e nao deve ser o primeiro corte

Microfase inicial:
- `W5-03B`

Gate que bloqueia o inicio:
- `GATE 0 - BASELINE`

Condicao que autoriza a execucao:
- baseline confirmado, build/testes verdes, gates de contrato/paridade definidos e rollback documentado

## 34. Ordem segura de migracao
1. Observabilidade e baseline transversal
2. Oportunidades
3. Estrutura Comercial
4. Commercial Coverage com shadow ate paridade
5. Tabelas Comerciais
6. Simulador
7. loan-with-collateral
8. frontend repositories locais
9. frontend store
10. creditPfCatalog e encerramento

## 35. Microfases recomendadas

| Microfase | Objetivo | Consumer | Risco | Gates | Observabilidade | Rollback | Criterio de saida | Commit sugerido |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| W5-03A | Prerrequisitos de observabilidade | Simulation Runtime | `MEDIUM` | G0, G3 | telemetry, evidence, logs | desativar evidence/primary | metrics basicas prontas | `docs(audit): prepare W5-03A observability baseline` |
| W5-03B | Primeiro corte folha | Oportunidades | `LOW` | G0, G1, G4 | sucesso de fetch e erro de pagina | release revert | fetch canonico estabilizado | `feat(master-catalog): cutover oportunidades` |
| W5-03C | Bootstrap canonico | Estrutura Comercial | `LOW` | G0, G1, G4 | counts e ordenacao | rollback do sync | tree derivada 1:1 | `feat(master-catalog): cutover estrutura-comercial` |
| W5-03D | Shadow/paridade | Commercial Coverage | `HIGH` | G0, G1, G2, G3 | divergencias por execucao | reativar shadow | divergencias estaveis | `docs(audit): parity gate commercial coverage` |
| W5-03E | Reduzir seletores locais | Tabelas Comerciais | `HIGH` | G0, G1, G4 | lookup e tabela counts | restaurar seletor local | seletores canonicos prontos | `feat(master-catalog): cutover tabelas-comerciais` |
| W5-03F | Consolidar simulacao | Simulador | `HIGH` | G0, G1, G4, G5 | offers, ranking e fallback | reativar repository local | runtime canonico consistente | `feat(master-catalog): cutover simulador` |
| W5-03G | Remover fallback de compat | loan-with-collateral | `CRITICAL` | G0, G1, G2, G4, G5 | alias hits e lookup miss | reativar aliases | fallback zero | `feat(master-catalog): harden loan-with-collateral` |
| W5-03H | Retirar repos locais | frontend repositories | `HIGH` | G0, G5, G6 | import count zero | revert isolado | zero imports/runtime reads | `feat(master-catalog): retire local repositories` |
| W5-03I | Encerramento legado | frontend store e creditPfCatalog | `HIGH` | G0, G6, G7 | import count zero | revert isolado | zero consumers residuais | `feat(master-catalog): retire legacy catalog sources` |

## 36. Rollback por consumidor

| Consumidor | Nivel 1 configuracao | Nivel 2 aplicacao | Nivel 3 incidente | Gatilho | Tempo maximo de decisao | Evidencia pos rollback |
| --- | --- | --- | --- | --- | --- | --- |
| Oportunidades | manter a pagina atual | revert de release | congelar rollout | erro sistemico de fetch ou regressao visual | minutos | log de fetch e pagina normalizada |
| Estrutura Comercial | manter sync atual | revert do commit do mapper | abrir incidente e congelar cortes | drift de tree ou problema de persistencia | minutos | snapshot da estrutura e diff de ordenacao |
| Commercial Coverage | manter shadow ativo | nao promover para primary | preservar evidencias e bloquear proximos cortes | qualquer divergencia nao aceita | imediato | comparacao e logs de divergencia |
| Tabelas Comerciais | reativar seletor local | revert da mudanca de mapa | preservar lookup local | falta de tabela ou filtro quebrado | minutos | lista de tabelas e seletores restaurados |
| Simulador | reativar fallback local | revert do commit de integracao | preservar operacao atual | oferta divergente ou erro deterministico | minutos | oferta reproduzivel com repository local |
| Simulation Runtime | desligar primary/evidence | rollback da configuracao | preservar evidence anterior | perda de telemetria | minutos | metricas e fila de evidence intactas |
| loan-with-collateral | reativar aliases | revert do adapter | congelar rollout e incidentar | lookup sem fallback ou subflow invalido | minutos | alias hit rate e resultado antigo |
| Products | manter registry atual | revert do registry | congelar mudancas de adapter | resolucao de adapter quebrada | minutos | lista de adapters recarregada |
| frontend store | manter derivacao atual | revert do store | preservar consumo legado | selector sem substituto | minutos | store voltou a derivar estrutura |
| frontend repositories locais | reativar repositories locais | revert do commit isolado | bloquear cortes subsequentes | algum consumer ainda depende deles | minutos | import count e runtime read retomados |

## 37. Critérios de aposentadoria
- fonte paralela ou compatibilidade so pode ser aposentada depois de zero consumers funcionais, zero imports runtime e periodo estavel
- se houver fallback ou shadow, ele deve ter paridade comprovada antes da aposentadoria
- testes e documentacao devem ser migrados ou removidos em commit isolado

## 38. Critérios para remover `creditPfCatalog`
- zero consumers funcionais
- zero imports de runtime
- paridade comprovada contra o Master Catalog
- fallback zero
- periodo estavel cumprido
- testes migrados
- aprovacao formal de fechamento

## 39. Critérios para remover repositories locais
- nenhuma rota ou componente dependente
- substituicao completa por cliente canonico ou backend oficial
- contratos e testes atualizados
- nenhum import runtime restante

## 40. Critérios para remover fallback do `loan-with-collateral`
- aliases sem uso real
- request fields canonicos como unica fonte
- fallback igual a zero
- testes negativos e de compatibilidade aprovados
- estabilidade operacional por periodo minimo

## 41. Critérios para desligar Shadow Read
- paridade atingida
- periodo estavel cumprido
- divergencias zeradas ou aceitas formalmente
- primary validado
- plano de retirada aprovado

## 42. Decisoes que exigem ADR
- nova familia de feature flags
- alteracao do contrato publico do Master Catalog
- mudanca da taxonomia canonica
- remocao de compatibilidade contratual
- mudanca na estrategia de tenant ou ownership do catalogo
- alteracao permanente do rollback
- mudanca do modelo de persistencia

Atualizacao de ADR existente:
- `ADR-010` para remocao do fallback de `loan-with-collateral`

EPC suficiente:
- sequenciamento das microfases e criterios de corte

Runbook suficiente:
- procedimentos de rollback e observabilidade

## 43. Riscos

### BLOCKER
- ausencia de SSOT documental oficial em `docs/00-master/FINQZ-PRO-ENTERPRISE-CONTEXT-SSOT.md`
- falta de gate formal de paridade por consumer

### CRITICAL
- `creditPfCatalog` permanece como fonte paralela de taxonomia
- `loan-with-collateral` ainda aceita alias e fallback de request fields

### HIGH
- `commercialRepository` e `simulatorRepository` ainda sustentam fluxos funcionais
- `Commercial Coverage` ainda depende de shadow read
- `frontend store` ainda deriva estrutura de fonte local

### MEDIUM
- flags existentes cobrem observabilidade da simulacao, nao o corte do catalogo
- nao existe metrico dedicado de divergencia persistida do Master Catalog

### LOW
- `Oportunidades` ainda faz fallback para tree vazia em erro

## 44. Gaps de evidencia
- `docs/00-master/FINQZ-PRO-ENTERPRISE-CONTEXT-SSOT.md` continua ausente
- nao foi encontrado flag dedicado para Master Catalog
- nao foi encontrado contador oficial de divergencias do Master Catalog
- nao foi encontrada evidencia de aposentadoria completa de `creditPfCatalog` e dos repos locais
- nao existe gate automatizado de saida para o shadow read

## 45. Critérios de entrada da execução
- baseline validado
- W5-01 e W5-02 revalidados
- gates documentados
- rollback por consumidor documentado
- paridade e observabilidade definidas
- nenhum arquivo de producao alterado

## 46. Critérios de saída da execução
- consumidores prioritarios cortados em ordem segura
- repositorios locais e shadow read retirados quando elegiveis
- `creditPfCatalog` aposentado apenas com evidencia completa
- ADRs e EPCs atualizados
- zero regressao operacional conhecida

## 47. Recomendação para próxima fase
Executar apenas a fase de preparo da operacao seguinte, com foco em observabilidade e comprovacao de paridade. A fase de implementação so deve iniciar depois da aprovacao humana deste plano e dos gates basicos.

## 48. Conclusão
O plano mais seguro e incremental. O Master Catalog ja e o owner canonico; o restante do trabalho e fechar consumidores folha primeiro, derrubar shadow quando a paridade estiver provada e retirar compatibilidades apenas depois de tres camadas de protecao: contrato, observabilidade e rollback.

## 49. Veredito
`GO WITH RESTRICTIONS`

## 50. Arquivos criados
- [EPC-W5-03-MASTER-CATALOG-MIGRATION-CUT-PLAN.md](/C:/Projects/FINQZ_PRO/docs/09-audits/EPC-W5-03-MASTER-CATALOG-MIGRATION-CUT-PLAN.md)
- [EPC-W5-03-MASTER-CATALOG-MIGRATION-CUT-PLAN.json](/C:/Projects/FINQZ_PRO/docs/09-audits/evidence/EPC-W5-03-MASTER-CATALOG-MIGRATION-CUT-PLAN.json)
- [EPC-W5-03-MASTER-CATALOG-MIGRATION-SEQUENCE.mmd](/C:/Projects/FINQZ_PRO/docs/09-audits/evidence/EPC-W5-03-MASTER-CATALOG-MIGRATION-SEQUENCE.mmd)

## 51. Comandos executados
- `git status --short --branch`
- `git rev-parse HEAD`
- `git rev-parse --abbrev-ref HEAD`
- `git rev-parse --abbrev-ref --symbolic-full-name '@{u}'`
- `Get-Content -LiteralPath 'docs/09-audits/EPC-W5-01-MASTER-CATALOG-INVENTORY.md'`
- `Get-Content -LiteralPath 'docs/09-audits/evidence/EPC-W5-02-MASTER-CATALOG-DEPENDENCY-GRAPH.json'`
- `Get-Content -LiteralPath 'docs/09-audits/evidence/EPC-W5-02-MASTER-CATALOG-DEPENDENCY-GRAPH.mmd'`
- `rg -n "master-catalog|creditPfCatalog|loan-with-collateral|simulation-runtime" ...`
- `git diff --check`

## 52. Evidências de validação
- JSON parse do artefato planejado deve passar sem referencias quebradas
- IDs internos devem ser unicos
- os `summary` devem bater com o tamanho real das listas
- cada gate possui condicao de aprovacao e reprovacao
- cada cut plan possui rollback
- cada fonte paralela possui criterio de aposentadoria
- o Mermaid deve manter baseline, observability, shadow, parity gate, primary, fallback, fallback removal, legacy removal e closure
- nenhum arquivo fora dos tres autorizados deve ser criado nesta execucao
