# SDC FASE 3.2A - Simulation Contract Adoption Audit

Status: Auditoria concluida
Date: 2026-07-09
Owner: Enterprise Architecture / Principal Engineering
Scope: FINQZ PRO Enterprise - Simulation Contract Adoption

---

## 1. Objetivo

Auditar a aderencia real dos modulos atuais aos contratos oficiais criados na FASE 3.2 do Simulation Engine, sem implementar adaptacoes, sem migrar calculos e sem alterar comportamento.

O resultado desta auditoria e o backlog tecnico e arquitetural para a FASE 3.3.

---

## 2. Escopo

### 2.1 Back-end analisado

- `backend/src/modules/simulation`
- `backend/src/modules/master-catalog`
- `backend/src/modules/opportunities`
- `backend/src/modules/edp`
- `backend/src/modules/proposals`
- `backend/src/modules/integrations`
- `backend/src/modules/commercial`
- `backend/src/modules/commercial-governance`
- `backend/src/modules/operation`

### 2.2 Front-end analisado

- `src/pages/Oportunidades.tsx`
- `src/pages/Simulador.tsx`
- `src/data/simulatorRepository.ts`
- `src/data/creditPfCatalog.ts`
- `src/data/commercialRepository.ts`
- `src/data/catalogRepository.ts`
- `src/features/proposals`
- `src/features/vehicle-intelligence`
- `src/routes`

### 2.3 Documentacao analisada

- `docs/01-architecture`
- `docs/03-audits`
- `docs/04-plans`
- `docs/08-governance`
- `docs/09-product`

---

## 3. Contratos Oficiais Avaliados

Os contratos oficiais da FASE 3.2 avaliados nesta auditoria foram:

- `SimulationRequest`
- `SimulationContext`
- `SimulationParticipant`
- `SimulationAsset`
- `SimulationCollateral`
- `SimulationCommercialContext`
- `SimulationProviderContext`
- `SimulationExecutionContext`
- `SimulationMetadata`
- `SimulationResult`
- `SimulationProposal`
- `SimulationRanking`
- `SimulationDecision`
- `SimulationAudit`
- `SimulationSnapshotReference`
- `SimulationVersioning`
- `CatalogVersion`
- `PolicyVersion`
- `StrategyVersion`
- `ExecutionId`
- `CorrelationId`
- `RequestHash`

Observacao importante:

- O repositorio atual usa `SimulationVersioning` no contrato canonicamente novo.
- O conceito pedido como `SimulationVersion` aparece como value object de versao e como campo interno de versionamento, nao como tipo isolado exposto para consumo de negocio.

---

## 4. Metodologia

Foi executada auditoria de leitura, com os seguintes criterios:

1. Localizar contratos oficiais da FASE 3.2.
2. Localizar contratos legados do dominio de simulacao.
3. Identificar quem consome contratos novos e quem ainda usa DTOs proprios.
4. Identificar calculos fora do engine oficial.
5. Identificar catalogos locais, Proposal/PDF e persistencia de snapshot.
6. Classificar cada modulo como:
   - `FULLY ADHERENT`
   - `PARTIALLY ADHERENT`
   - `NOT ADHERENT`
   - `LEGACY COMPATIBILITY`
   - `UNKNOWN`
7. Classificar a acao necessaria:
   - `NO ACTION`
   - `ADAPTER REQUIRED`
   - `ANTI-CORRUPTION LAYER REQUIRED`
   - `CONTRACT MAPPING REQUIRED`
   - `READ-ONLY COMPATIBILITY`
   - `MIGRATION REQUIRED`
   - `BLOCKER`

---

## 5. Visao Geral de Aderencia

### Conclusao executiva

Nao existe ainda um consumidor de producao totalmente aderente ao `SimulationRequest` e ao `SimulationResult` canonicos da FASE 3.2.

O que existe hoje e:

- uma camada contratual oficial nova em `backend/src/modules/simulation/contracts`
- um motor legado em `backend/src/modules/simulation/domain/contracts` e `backend/src/modules/simulation/application`
- um workspace frontend que ainda calcula e renderiza estado proprio
- um simulador standalone que monta simuleacao, proposta e PDF com tipos locais
- um catalogo mestre runtime ja bem estruturado no backend, mas ainda nao consumido de ponta a ponta pela simulacao
- camadas de auditoria e identificacao de execucao (`EDP`, `Operation`) que ja estao alinhadas aos conceitos de `correlationId`, `requestHash` e `executionId`, porem sem adaptacao oficial para simulacao canonica

### Resposta direta as perguntas da auditoria

1. Nenhum modulo de producao consome `SimulationRequest` canonico hoje.
2. Varios modulos ainda usam DTOs proprios e contratos legados.
3. O `SimulationResult` canonico ainda nao e a saida de producao do fluxo principal.
4. Sim, existem calculos fora do engine canonico, principalmente no workspace e no simulador standalone.
5. Proposal e PDF continuam reconstruindo a operacao fora de um snapshot oficial canonico.
6. PDF nao usa `ProposalSnapshot` oficial porque esse snapshot ainda nao existe como contrato de dominio.
7. Snapshot ainda nao e persistido por um fluxo canonico de simulacao.
8. O catalogo local ainda e usado em partes do frontend, mesmo com o Master Catalog Runtime existente.
9. Sim, varios adapters serao necessarios.
10. Sim, a area de workspace, simulador standalone e PDF precisam de anti-corruption layers.
11. Os modulos mais prontos para migracao sao os de leitura e audicao de metadados, nao os de simulacao de negocio.
12. Os bloqueadores da FASE 3.3 sao os contratos legados de simulacao, o estado local do frontend e a ausencia de snapshot canonico de proposta.

---

## 6. Evidencias Principais

### 6.1 Contrato canonico novo

- `backend/src/modules/simulation/contracts/simulation.contract.ts:157-292`
- `backend/src/modules/simulation/contracts/simulation.factory.ts:20-46`
- `backend/src/modules/simulation/dto/simulation.dto.ts:16-262`

### 6.2 Motor legado ainda ativo

- `backend/src/modules/simulation/domain/contracts/simulation.contract.ts:29-46`
- `backend/src/modules/simulation/domain/contracts/simulation-strategy.contract.ts:7-12`
- `backend/src/modules/simulation/application/simulate-operation.use-case.ts:10-25`
- `backend/src/modules/simulation/application/strategies/credit-simulation.strategy.ts:12-39`

### 6.3 Workspace legado do frontend

- `src/pages/Oportunidades.tsx:1791-2140`
- `src/pages/Oportunidades.tsx:5543-6065`
- `src/pages/Simulador.tsx:12-40`
- `src/pages/Simulador.tsx:257-360`
- `src/pages/Simulador.tsx:718-720`
- `src/pages/Simulador.tsx:1051-1194`

### 6.4 Catalogo local ainda ativo

- `src/data/catalogRepository.ts:5-24`
- `src/data/catalogRepository.ts:582-607`
- `src/data/creditPfCatalog.ts:50-110`
- `src/data/commercialRepository.ts:185-185`
- `src/data/commercialRepository.ts:582-607`

### 6.5 Master Catalog Runtime

- `backend/src/modules/master-catalog/dto/master-catalog.dto.ts:34-75`
- `backend/src/modules/master-catalog/application/master-catalog.runtime.ts:36-150`

### 6.6 EDP e Operation

- `backend/src/modules/edp/contracts/persistence.ts:37-124`
- `backend/src/modules/edp/domain/factories.ts:74-137`
- `backend/src/modules/edp/application/use-cases.ts:56-212`
- `backend/src/modules/operation/contracts/operation.contracts.ts:4-31`
- `backend/src/modules/operation/presentation/http/operation.controller.ts:77-145`

### 6.7 Proposal / PDF / Integractions

- `src/features/proposals/proposalPdf.ts:2-3`
- `src/features/proposals/proposalPdf.ts:241-242`
- `src/features/proposals/proposalPdf.ts:718-720`
- `backend/src/modules/proposals/routes.ts:1-54`
- `backend/src/modules/integrations/domain/contracts/financial-proposal/financial-proposal.contract.ts:1-16`
- `backend/src/modules/integrations/domain/contracts/integration-proposal.contract.ts:1-24`

---

## 7. Matriz de Aderencia por Modulo

| Modo | Responsabilidade atual | Contrato esperado | Aderencia | Problema encontrado | Acao recomendada | Prioridade | Risco | Bloqueia FASE 3.3? | Observacoes |
|---|---|---|---|---|---|---|---|---|---|
| `backend/src/modules/simulation/contracts` | Camada canonica de contratos da simulacao | `SimulationRequest`, `SimulationResult`, `SimulationProposal`, `SimulationRanking`, `SimulationDecision`, `SimulationAudit` | `FULLY ADHERENT` | Nenhum problema estrutural; a camada existe e esta tipada | `NO ACTION` | `P0` | Baixo | Nao | E a base oficial criada na FASE 3.2 |
| `backend/src/modules/simulation/domain/contracts` + `application` | Motor legado de simulacao | Mesmo conjunto de contratos canonicos | `NOT ADHERENT` | Usa `requestedAmount`, `term`, `monthlyRate`, `installmentAmount`, `totalAmount`, `coefficient` | `CONTRACT MAPPING REQUIRED` | `P0` | Alto | Sim | Ainda nao consome `SimulationRequest` canonico |
| `backend/src/modules/master-catalog` | Runtime canonico de catalogo de leitura | `CatalogVersion`, `Product`, `Subproduct`, `Modality` canonicos para leitura | `PARTIALLY ADHERENT` | Runtime bem estruturado, mas nao e o fluxo de simulacao | `READ-ONLY COMPATIBILITY` | `P1` | Medio | Nao | Servira como fonte canonica para produtos e subprodutos |
| `backend/src/modules/opportunities` | Persistencia e orquestracao de oportunidades | Contexto de simulacao com `SimulationSnapshotReference` e contrato de produto/subproduto | `PARTIALLY ADHERENT` | Valida hierarquia por IDs, nao por contrato canonico de simulacao | `CONTRACT MAPPING REQUIRED` | `P1` | Alto | Sim | Sustenta o workspace, mas ainda nao fala a lingua da FASE 3.2 |
| `backend/src/modules/edp` | Auditoria, envelope, correlacao, request hash | `ExecutionId`, `CorrelationId`, `RequestHash`, `PolicyVersion`, `StrategyVersion` | `PARTIALLY ADHERENT` | Sem adaptador oficial para SimulationAudit/SimulationExecutionContext | `ADAPTER REQUIRED` | `P2` | Medio | Nao | Muito util para a FASE 3.3 |
| `backend/src/modules/operation` | Ciclo de vida de operacoes e auditabilidade | `CorrelationId`, `RequestId`, `ExecutionContext` | `PARTIALLY ADHERENT` | Possui rastreio, mas nao snapshot de simulacao | `READ-ONLY COMPATIBILITY` | `P2` | Baixo | Nao | Bom candidato para receber referencia de simulacao, nao o objeto bruto |
| `backend/src/modules/integrations` | Propostas financeiras e execucao de provedores | `SimulationProposal` e mapeamento para provedores | `LEGACY COMPATIBILITY` | Mantem `FinancialProposal` e `IntegrationProposal` proprios | `ANTI-CORRUPTION LAYER REQUIRED` | `P2` | Medio | Sim para Proposal/PDF | Precisa de adaptador entre contrato canonico e provedores |
| `backend/src/modules/commercial-governance` | Fluxo de requests comerciais | Referencias de audit e workflow | `PARTIALLY ADHERENT` | Nao produz nem consome contratos de simulacao | `READ-ONLY COMPATIBILITY` | `P3` | Baixo | Nao | Pode receber referencias de auditoria, nao regra financeira |
| `backend/src/modules/proposals` | API stub de propostas | `ProposalSnapshot` oficial | `NOT ADHERENT` | So entrega placeholder JSON | `MIGRATION REQUIRED` | `P2` | Alto | Sim | E um ponto claro de bloqueio para Proposal oficial |
| `src/pages/Oportunidades.tsx` | Workspace oficial com simulacao embutida | `SimulationRequest`, `SimulationResult`, `SimulationSnapshotReference` | `NOT ADHERENT` | Usa `simuladorResultado` e estado local legado | `ANTI-CORRUPTION LAYER REQUIRED` | `P0` | Alto | Sim | E o renderer que ainda domina a experiencia do usuario |
| `src/pages/Simulador.tsx` | Simulador standalone | `SimulationRequest`, `SimulationResult`, `SimulationProposal` | `NOT ADHERENT` | Usa `simulatorRepository`, `commercialRepository` e PDF local | `MIGRATION REQUIRED` | `P2` | Alto | Sim para o fluxo de PDF | Permanece como superficie de compatibilidade |
| `src/data/simulatorRepository.ts` | Estado efemero do simulador | `SimulationResult` e `SimulationProposal` canonicos | `NOT ADHERENT` | Possui tipos e estado proprios em memoria | `MIGRATION REQUIRED` | `P0` | Alto | Sim | Uma das principais fontes de divergencia |
| `src/data/creditPfCatalog.ts`, `catalogRepository.ts`, `commercialRepository.ts` | Catalogos e regras locais | Catalogo canonico do Master Catalog Runtime | `LEGACY COMPATIBILITY` | Mantem fonte local de produtos/subprodutos e tabelas | `ADAPTER REQUIRED` | `P1` | Medio | Sim para catalogo | Ainda nao e leitura canonica de runtime |
| `src/features/proposals/proposalPdf.ts` | Geracao de PDF por texto livre | `ProposalSnapshot` oficial | `NOT ADHERENT` | Monta PDF a partir de linhas soltas e nao de snapshot canonico | `ANTI-CORRUPTION LAYER REQUIRED` | `P2` | Alto | Sim | Nao deve calcular, apenas renderizar snapshot oficial |
| `src/features/vehicle-intelligence` | Inteligencia de veiculo / FIPE | Campos de veiculo para simular garantias | `LEGACY COMPATIBILITY` | Nao participa da camada contratual oficial ainda | `READ-ONLY COMPATIBILITY` | `P3` | Baixo | Nao | Deve ser consumida via adapter quando a simulacao de garantia entrar |

---

## 8. Modulos Fully Adherent

### 8.1 Producoes plenamente aderentes

- `backend/src/modules/simulation/contracts`

### 8.2 Testes plenamente aderentes

- `backend/src/tests/unit/simulation/simulation.contracts.test.ts`

### 8.3 Observacao

No codigo de producao atual, nao foi encontrado consumidor oficial que ja opere com `SimulationRequest` e `SimulationResult` canonicos como saida final do fluxo de negocio.

---

## 9. Modulos Partially Adherent

- `backend/src/modules/master-catalog`
- `backend/src/modules/edp`
- `backend/src/modules/operation`
- `backend/src/modules/integrations`
- `backend/src/modules/commercial-governance`
- `backend/src/modules/opportunities`

Esses modulos possuem partes alinhadas aos principios SDC, mas ainda nao constituem o fluxo canonicalizado de simulacao de ponta a ponta.

---

## 10. Modulos Not Adherent

- `backend/src/modules/simulation/domain/contracts`
- `backend/src/modules/simulation/application`
- `src/pages/Oportunidades.tsx`
- `src/pages/Simulador.tsx`
- `src/data/simulatorRepository.ts`
- `src/features/proposals/proposalPdf.ts`
- `backend/src/modules/proposals/routes.ts`

---

## 11. Legacy Compatibility

Os seguintes componentes operam como compatibilidade legada e nao como contrato oficial:

- `src/data/creditPfCatalog.ts`
- `src/data/catalogRepository.ts`
- `src/data/commercialRepository.ts`
- `src/data/simulatorRepository.ts`
- `src/pages/Simulador.tsx`
- `src/pages/Oportunidades.tsx`
- `src/features/proposals/proposalPdf.ts`
- `backend/src/modules/simulation/domain/contracts`
- `backend/src/modules/simulation/application`
- `backend/src/modules/proposals/routes.ts`
- `backend/src/modules/integrations/domain/contracts/financial-proposal/*`
- `backend/src/modules/integrations/domain/contracts/integration-proposal.contract.ts`

---

## 12. DTOs Proprios Encontrados

### 12.1 Legado de simulacao

- `backend/src/modules/simulation/domain/contracts/simulation.contract.ts`
- `src/data/simulatorRepository.ts`
- `src/pages/Oportunidades.tsx`
- `src/pages/Simulador.tsx`

### 12.2 Integracoes financeiras

- `backend/src/modules/integrations/domain/contracts/financial-proposal/financial-proposal.contract.ts`
- `backend/src/modules/integrations/domain/contracts/integration-proposal.contract.ts`
- `backend/src/modules/integrations/domain/contracts/financial-execution.contract.ts`
- `backend/src/modules/integrations/providers/handmais/handmais.types.ts`

### 12.3 Operacao e auditoria

- `backend/src/modules/operation/dto/operation.dto.ts`
- `backend/src/modules/operation/contracts/operation.contracts.ts`
- `backend/src/modules/edp/contracts/persistence.ts`
- `backend/src/modules/edp/contracts/envelopes.ts`

### 12.4 Catalogo e leitura

- `backend/src/modules/master-catalog/dto/master-catalog.dto.ts`
- `src/api/modules/master-catalog.api.ts`

---

## 13. Calculos Fora do Engine

### 13.1 Calculos encontrados fora do contrato canonico

- `src/data/simulatorRepository.ts` calcula ofertas de credito e energia no frontend legacy.
- `src/pages/Oportunidades.tsx` calcula `valorBruto`, `valorLiberado`, `parcela`, `custoTotal`, `cetEstimado`, `comprometimento`.
- `src/pages/Simulador.tsx` usa `simulationEngine.simulateCredit` e ainda monta a proposta e o PDF a partir de estado local.

### 13.2 Calculos que permanecem no engine legado

- `backend/src/modules/simulation/application/simulate-operation.use-case.ts`
- `backend/src/modules/simulation/application/strategies/credit-simulation.strategy.ts`
- `backend/src/modules/simulation/domain/services/pmt-formula.service.ts`
- `backend/src/modules/simulation/domain/services/cet-formula.service.ts`
- `backend/src/modules/simulation/domain/services/margin-engine.service.ts`
- `backend/src/modules/simulation/domain/services/expected-operational-value.service.ts`
- `backend/src/modules/simulation/domain/services/provider-ranking-engine.service.ts`
- `backend/src/modules/simulation/domain/services/portability-engine.service.ts`
- `backend/src/modules/simulation/domain/services/refinancing-engine.service.ts`
- `backend/src/modules/simulation/domain/services/bank-coefficient-engine.service.ts`

Conclusao:

O calculo nao precisa ser reescrito agora, mas precisa deixar de ser consumido por DTO e estado legados quando a FASE 3.3 comecar.

---

## 14. Catalogos Locais vs Master Catalog Runtime

### 14.1 Catalogo local ainda ativo

- `src/data/creditPfCatalog.ts` possui `Empréstimo com Garantia`, `Auto Equity` e `Home Equity`.
- `src/data/catalogRepository.ts` ainda declara explicitamente que retorna `creditPfCatalog` local.
- `src/data/commercialRepository.ts` ancora tabelas e condicoes comerciais no catalogo local.

### 14.2 Runtime canonico ja disponivel

- `backend/src/modules/master-catalog/application/master-catalog.runtime.ts`
- `backend/src/modules/master-catalog/dto/master-catalog.dto.ts`
- `src/api/modules/master-catalog.api.ts`

### 14.3 Diagnostico

O runtime canonico do catalogo existe, mas o frontend ainda mistura:

- catalogo canonico via API em `src/pages/Oportunidades.tsx`
- catalogo local via repositorios em `src/pages/Simulador.tsx`
- catalogo local como fallback em `src/data/commercialRepository.ts`

Isso gera compatibilidade, mas nao ainda uma fonte unica de verdade operacional para a simulacao.

---

## 15. Proposal e PDF

### 15.1 Estado atual

- O backend possui apenas uma rota stub de proposals em `backend/src/modules/proposals/routes.ts`.
- O frontend gera PDF com `src/features/proposals/proposalPdf.ts` a partir de `headerLines` e `bodyLines`.
- O simulador standalone monta a proposta diretamente em `src/pages/Simulador.tsx`.

### 15.2 Problema arquitetural

Nao existe ainda um `ProposalSnapshot` oficial que seja:

- produzido pelo Simulation Engine
- persistido como artefato canonico
- consumido pelo Proposal/PDF sem recalculo

### 15.3 Contratos proximos

As integracoes ja possuem contratos proximos, porem diferentes:

- `backend/src/modules/integrations/domain/contracts/financial-proposal/financial-proposal.contract.ts`
- `backend/src/modules/integrations/domain/contracts/integration-proposal.contract.ts`

### 15.4 Conclusao

Proposal e PDF ainda sao consumidores de compatibilidade e nao consumidores oficiais de snapshot canonico.

---

## 16. Persistencia e Snapshots

### 16.1 Persistencia de simulacao hoje

- `src/data/simulatorRepository.ts` guarda `simulationState` e `proposalState` em memoria.
- Nao ha persistencia canonica de snapshot de simulacao no backend.

### 16.2 Persistencia de oportunidade

- `backend/src/modules/opportunities/repositories/opportunities.repository.ts` persiste a oportunidade e suas relacoes.
- `backend/src/modules/opportunities/services/opportunities.service.ts` valida hierarquia de produto/subproduto/modalidade.

### 16.3 Persistencia de auditoria e correlacao

- `backend/src/modules/edp/contracts/persistence.ts` ja trabalha com `correlationId`, `requestHash` e registros de snapshot operacional.
- `backend/src/modules/operation` preserva rastreio e auditable lifecycle.

### 16.4 Conclusao

Existe persistencia operacional e auditavel, mas nao existe ainda um snapshot canonico de simulacao/proposta com ciclo de vida completo.

---

## 17. Auditoria e Versionamento

### 17.1 O que ja existe

- `ExecutionId`
- `CorrelationId`
- `RequestHash`
- `PolicyVersion`
- `StrategyVersion`
- `CatalogVersion`

### 17.2 Onde isso ja aparece

- `backend/src/modules/edp/contracts/persistence.ts`
- `backend/src/modules/edp/domain/factories.ts`
- `backend/src/modules/edp/application/use-cases.ts`
- `backend/src/modules/operation/contracts/operation.contracts.ts`
- `backend/src/modules/operation/domain/operation-audit.contract.ts`
- `backend/src/modules/simulation/contracts/simulation.contract.ts`

### 17.3 Gap

O gap nao e a ausencia de auditoria, e sim a ausencia de adaptacao oficial entre:

- auditoria de execucao da plataforma
- auditoria de simulacao canonica
- snapshot de proposta

---

## 18. Loan With Collateral

### 18.1 Produto identificado

- `Empréstimo com Garantia`

### 18.2 Evidencia de catalogo

- `src/data/creditPfCatalog.ts:96-110`

### 18.3 Estrutura atual

O catalogo local ja representa:

- `Home Equity`
- `Auto Equity`
- `collateralType: REAL_ESTATE`
- `collateralType: VEHICLE`

### 18.4 Aderencia ao contract canonico

O contrato canonico da FASE 3.2 comporta este produto, desde que os mapeamentos usem:

- `SimulationProductContext`
- `SimulationSubproductContext`
- `SimulationAsset`
- `SimulationCollateral`
- `SimulationParameters`
- `SimulationIncomeContext`

### 18.5 Necessidade de adapter

Sim. O workspace e o motor precisam de adapter para converter:

- campos de UI legada
- catalogo local
- resultados locais

em um `SimulationRequest` canonico.

---

## 19. Auto Equity

### 19.1 Onde aparece hoje

- `src/data/creditPfCatalog.ts:109-110`
- `src/pages/Oportunidades.tsx:1740, 1752-1758, 1867-1925, 5543-6065`
- `src/pages/Simulador.tsx:338, 365, 472, 489`

### 19.2 Como e representado hoje

No frontend atual, Auto Equity aparece como:

- produto/subproduto de catalogo local
- campos de formulario proprios
- calculo local de `valorVeiculo`, `saldoDevedor`, `percentualFinanciavel`, `rendaMensal`

### 19.3 O que cabe no `SimulationRequest`

Cabe, mas exige adapter de mapeamento:

- `product`
- `subproduct`
- `vehicle`
- `guarantees`
- `income`
- `parameters`

### 19.4 O que e opcional

Para garantir extensibilidade sem quebrar outros produtos, o contrato deve manter como opcionais:

- `vehicle`
- `property`
- `guarantees`
- `provider`
- `commercializadora`
- `bank`
- `corban`
- `channel`
- `pipeline`
- `opportunity`
- `commercial`
- `income`
- `parameters`
- `execution`
- `versioning`

### 19.5 Ponto arquitetural

Auto Equity ainda nao esta trafegando por uma trilha canonica de request/result/snapshot. Ele existe no catalogo e no formulario, mas nao no contrato oficial de ponta a ponta.

---

## 20. Home Equity

### 20.1 Onde aparece hoje

- `src/data/creditPfCatalog.ts:109`

### 20.2 Como e representado hoje

Como subproduto do mesmo produto:

- `Empréstimo com Garantia`

### 20.3 O que exige

- colateral imobiliario
- dados de propriedade / bem
- possivelmente avaliacao, registro e garantia

### 20.4 Aderencia ao contract canonico

Cabe no `SimulationRequest` canonico usando:

- `property`
- `guarantees`
- `parameters`
- `income`

### 20.5 Necessidade de adapter

Sim, e o adapter deve ser separado do adapter de Auto Equity porque a natureza do colateral e diferente.

---

## 21. Adapters Necessarios

1. Adapter de `Oportunidades.tsx` legado para `SimulationRequest` canonico.
2. Adapter de `simulatorRepository.ts` para `SimulationResult` canonico.
3. Adapter de `Simulador.tsx` para leitura de `SimulationRequest`, `SimulationResult` e `SimulationProposal`.
4. Adapter do `Master Catalog Runtime` para listas de produto/subproduto/modalidade no frontend.
5. Adapter de `ProposalSnapshot` para `proposalPdf.ts`.
6. Adapter de `EDP` para `SimulationAudit`.
7. Adapter de `Operation` para referencia auditavel de execucao.
8. Adapter de `integrations` para `SimulationProposal` e `FinancialProposal`.

---

## 22. Anti-Corruption Layers Necessarias

1. ACL entre workspace legacy e contrato canonico de simulacao.
2. ACL entre simulador standalone e `simulatorRepository`.
3. ACL entre simulacao e Proposal/PDF.
4. ACL entre simulacao e integracoes financeiras.
5. ACL entre catalogo local e Master Catalog Runtime.

Sem essas camadas, a migracao vai continuar misturando estado de tela, contrato legado e saida canonica.

---

## 23. Bloqueadores da FASE 3.3

1. Motor legado de simulacao ainda e fonte de verdade operacional em varios fluxos.
2. `src/pages/Oportunidades.tsx` ainda renderiza e calcula por `simuladorResultado`.
3. `src/data/simulatorRepository.ts` ainda possui estado proprio e tipos proprios.
4. `src/pages/Simulador.tsx` ainda monta proposta e PDF fora de snapshot canonico.
5. `backend/src/modules/proposals/routes.ts` e apenas um stub.
6. Nao existe `ProposalSnapshot` oficial no backend.
7. O catalogo local continua presente no frontend.
8. A persistencia de simulacao ainda nao e canonica.

---

## 24. Backlog Tecnico da FASE 3.3

### P0 - obrigatorio antes do primeiro adapter

- Definir a fronteira oficial entre contrato canonico e legado de simulacao.
- Criar mapeadores puros entre `SimulationRequest` / `SimulationResult` e os formatos legados.
- Criar snapshot canonico de simulacao como artefato de leitura.
- Definir o envelope de auditabilidade da simulacao com `executionId`, `correlationId`, `requestHash`, `catalogVersion`, `policyVersion`, `strategyVersion`.
- Congelar o uso de `simulatorRepository` como fonte de verdade de negocio.

### P1 - necessario para Loan With Collateral

- Adapter de `Empréstimo com Garantia` para `SimulationRequest`.
- Adapter de `Auto Equity` com `vehicle`, `guarantees`, `parameters` e `income`.
- Adapter de `Home Equity` com `property`, `guarantees`, `parameters` e `income`.
- Mapeamento de catalogo local para Master Catalog Runtime.

### P2 - necessario para Proposal/PDF

- Criar `ProposalSnapshot` oficial.
- Fazer `proposalPdf.ts` consumir snapshot e nao linhas livres de UI.
- Fazer o fluxo de proposta usar o mesmo `SimulationResult` canonico da simulacao.
- Alinhar integracoes financeiras a `SimulationProposal` e `SimulationDecision`.

### P3 - necessario para produtos futuros

- Expandir o contrato com metadados opcionais por tipo de colateral.
- Formalizar adapters para novos produtos e subprodutos.
- Migrate legacy compatibility out of UI when the canonical path is established.

---

## 25. Riscos

1. Risco de dupla fonte de verdade entre engine legado e contrato canonico.
2. Risco de divergencia entre o valor mostrado na tela e o valor persistido.
3. Risco de PDF/proposta refletir um resumo diferente do resultado da simulacao.
4. Risco de catalogo local continuar divergindo do runtime canonico.
5. Risco de adapters serem criados sem snapshot oficial, apenas copiando estado legado.

---

## 26. Recomendacoes

1. Tratar `backend/src/modules/simulation/contracts` como unica superficie canonica nova.
2. Criar ACLs antes de tentar migrar qualquer produto de garantia real.
3. Manter `simulatorRepository`, `proposalPdf.ts` e `backend/src/modules/proposals/routes.ts` como compatibilidade apenas ate existir substituto validado.
4. Priorizar Auto Equity e Home Equity com adapter, nao com rewrite do engine.
5. Fazer o Master Catalog Runtime alimentar os selects do workspace antes de qualquer nova mudanca estrutural.

---

## 27. Criterio de Encerramento

A FASE 3.3 so pode ser iniciada com risco aceitavel quando:

1. O workspace conseguir emitir `SimulationRequest` canonico.
2. O motor devolver `SimulationResult` canonico sem reconciliacao manual.
3. A proposta for gerada a partir de `ProposalSnapshot` oficial.
4. O PDF consumir somente snapshot canonico.
5. A auditoria receber `executionId`, `correlationId`, `requestHash`, `catalogVersion`, `policyVersion` e `strategyVersion`.
6. O catalogo mestre runtime substituir as leituras locais criticas do fluxo.

---

## 28. Status Final

**NO GO**

Motivo:

- A camada contratual oficial existe e esta valida.
- Mas os modulos de negocio e a UI ainda operam majoritariamente em caminhos legados.
- A migracao do primeiro produto precisa de adapters e anti-corruption layers antes de qualquer corte.
