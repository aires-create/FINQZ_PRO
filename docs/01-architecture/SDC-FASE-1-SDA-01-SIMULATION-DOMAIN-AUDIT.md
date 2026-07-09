# SDC-FASE-1-SDA-01 - Simulation Domain Audit

## 1. Titulo
Auditoria SDA-01 do Dominio de Simulacao do FINQZ PRO.

## 2. Objetivo
Mapear a superficie real do dominio de simulacao, identificar origens de estado, pontos de calculo financeiro, montagem de proposta, geracao de PDF, persistencia e auditoria, e classificar os arquivos encontrados em:

- Ativo
- Compatibilidade
- Obsoleto
- Morto

Esta auditoria nao altera codigo fonte. Ela documenta o estado atual para suportar a FASE 2 - Fonte Unica de Verdade.

## 3. Escopo analisado

### Frontend
- `src/pages/Oportunidades.tsx`
- `src/pages/Simulador.tsx`
- `src/data/simulatorRepository.ts`
- `src/data/creditPfCatalog.ts`
- `src/data/commercialRepository.ts`
- `src/data/catalogRepository.ts`
- `src/features/proposals/proposalPdf.ts`
- `src/features/vehicle-intelligence/vehicleFipeProvider.ts`
- `src/components/pipeline/*`
- `src/routes/crm.routes.tsx`

### Backend
- `backend/src/modules/simulation/*`
- `backend/src/modules/edp/*`
- `backend/src/modules/opportunities/*`
- `backend/src/modules/master-catalog/*`
- `backend/src/modules/audit/*`
- `backend/src/modules/integrations/*`
- `backend/src/modules/operation/*`
- `backend/src/modules/commercial/*`
- `backend/src/modules/commercial-governance/requests/*`
- `backend/src/modules/proposals/routes.ts`

### Documentacao oficial revisada
- `docs/02-architecture/ARCH-016-OPPORTUNITY-WORKSPACE-BLUEPRINT.md`
- `docs/02-implementation/IWP-W0-02-SIMULATOR-RELEASE-1-STABILIZATION.md`
- `docs/03-audits/AUD-W0-PRODUCTION-READINESS-PIPELINE-OPPORTUNITY-SIMULATOR.md`
- `docs/06-release/README.md`
- `docs/08-governance/README.md`
- `docs/01-architecture/OWB-OPPORTUNITY-WORKSPACE-BLUEPRINT.md`
- `docs/01-architecture/EUX-ENTERPRISE-DESIGN-PRINCIPLES.md`
- `docs/05-adr/ADR-003-simulation-engine-source-of-truth.md`
- `docs/05-adr/ADR-007-lead-customer-simulation-opportunity-model.md`

## 4. Principios SDC aplicados

### Principio 1 - Proposal nunca calcula
Confirmado pelo fluxo atual: proposta e PDF consomem snapshot/resultados ja montados. O calculo nao deve nascer em proposal.

### Principio 2 - PDF nunca calcula
`src/features/proposals/proposalPdf.ts` apenas serializa e renderiza estrutura documental. Nao ha regra financeira nesse arquivo.

### Principio 3 - Workspace orquestra, nao implementa regra financeira
O Workspace oficial deve coordenar estado, selecao e exibicao. A auditoria encontrou, porem, calculo financeiro embutido no renderer do Workspace para alguns fluxos.

### Principio 4 - Uma unica fonte de verdade por responsabilidade
Hoje existem multiplas fontes para catalogo, simulacao, proposta e persistencia. O dominio ainda esta em fase de consolidacao.

### Principio 5 - Um unico motor de calculo por dominio financeiro
O dominio tem motores separados para creditos, ranking, CET, margem, portabilidade, refinanciamento e simulacao do Workspace. Ainda ha risco de divergencia entre frontend e backend.

### Principio 6 - Nenhum legado removido antes de substituto validado
O repositorio ainda contem rotas e use cases de compatibilidade/legado. Alguns permanecem sem consumidor runtime identificado.

## 5. Inventario dos arquivos encontrados

### 5.1 Frontend - superficie oficial

| Arquivo | Papel observado | Estado |
| --- | --- | --- |
| `src/pages/Oportunidades.tsx` | Workspace oficial do Opportunity | Ativo |
| `src/pages/Simulador.tsx` | Simulador standalone oficial | Ativo |
| `src/data/creditPfCatalog.ts` | Catalogo canonico de produtos PF | Ativo |
| `src/data/commercialRepository.ts` | Fonte canonica de apoio da UI comercial | Ativo |
| `src/data/simulatorRepository.ts` | Estado em memoria da simulacao e proposta do simulador | Ativo |
| `src/features/proposals/proposalPdf.ts` | Serializer/gerador de PDF | Ativo |
| `src/components/pipeline/*` | Kanban, seletor e utilitarios de pipeline | Ativo |
| `src/routes/crm.routes.tsx` | Roteamento oficial do CRM | Ativo |

### 5.2 Frontend - suporte e compatibilidade

| Arquivo | Evidencia | Estado |
| --- | --- | --- |
| `src/data/catalogRepository.ts` | Nenhum consumidor identificado na busca atual | Obsoleto |
| `src/features/vehicle-intelligence/vehicleFipeProvider.ts` | Cliente FIPE utilitario sem consumo identificado na superficie auditada | Compatibilidade |

### 5.3 Backend - dominio ativo

| Arquivo / modulo | Papel observado | Estado |
| --- | --- | --- |
| `backend/src/modules/simulation/*` | Motores de calculo financeiro, estrategia e contratos de simulacao | Ativo |
| `backend/src/modules/edp/*` | Comandos, eventos, aggregates e persistencia EDP para simulation/proposal/opportunity/audit | Ativo |
| `backend/src/modules/opportunities/*` | CRUD, intake, validacao e persistencia de oportunidades | Ativo |
| `backend/src/modules/master-catalog/*` | Catalogo mestre, tree, products, subproducts e modalities | Ativo |
| `backend/src/modules/audit/*` | Auditoria de logs e timeline | Ativo |
| `backend/src/modules/integrations/*` | Runtime de providers, proposals de providers e diagnostics | Ativo |
| `backend/src/modules/operation/*` | Orquestracao e persistencia operacional | Ativo |
| `backend/src/modules/commercial/*` | Tabelas e condicoes comerciais | Ativo |
| `backend/src/modules/commercial-governance/requests/*` | Fluxo de request comercial governado | Ativo |

### 5.4 Backend - compatibilidade / legado

| Arquivo | Evidencia | Estado |
| --- | --- | --- |
| `backend/src/modules/proposals/routes.ts` | Router Express de placeholder; nao foi encontrado registro runtime no bootstrap atual | Compatibilidade |
| `backend/src/modules/simulation/application/simulate-operation.use-case.ts` | Consumido apenas por teste unitario na busca atual | Compatibilidade |
| `backend/src/modules/integrations/application/financial-execution-runtime.ts` | Runtime de execucao para providers; nao calcula proposta final do Workspace | Compatibilidade |
| `backend/src/modules/integrations/domain/contracts/financial-proposal/*` | Contratos de leitura/mapeamento de proposta financeira de provider | Compatibilidade |

### 5.5 Arquivos sem prova suficiente para "morto"
Nenhum arquivo foi classificado como morto nesta auditoria, porque nao houve evidencia suficiente de inexistencia total de uso. Os candidatos sem consumo runtime identificado foram conservadoramente mantidos como obsoleto ou compatibilidade.

## 6. Mapa atual do dominio

### Visao de alto nivel

```text
Opportunity Workspace (src/pages/Oportunidades.tsx)
  -> catalogos comerciais / produtos / subprodutos
  -> estado da simulacao do Workspace
  -> result snapshot
  -> proposal preview
  -> proposalPdf serializer
  -> download/open PDF

Simulador standalone (src/pages/Simulador.tsx)
  -> commercialRepository catalog
  -> simulatorRepository
  -> simulationEngine
  -> proposal preview
  -> proposalPdf serializer

Backend domain
  -> master-catalog
  -> opportunities
  -> simulation (engines e strategies)
  -> edp (commands, events, aggregates, persistence)
  -> audit
  -> integrations
  -> operation
```

### Leitura arquitetural
- O Opportunity Workspace e a superficie oficial do fluxo comercial.
- O Simulation Center faz parte do Workspace oficial.
- O Simulador standalone continua existindo como superficie separada.
- Proposal e PDF sao consumidores de snapshot, nao motores de calculo.

## 7. Fluxo atual identificado

### Fluxo do Workspace
1. O usuario entra em `crm/pipeline`.
2. `src/routes/crm.routes.tsx` aponta para `src/pages/Oportunidades.tsx`.
3. `Oportunidades.tsx` carrega contexto da oportunidade, catalogo e estado de simulacao.
4. O renderer da aba Simulador exibe campos, calcula resultado e prepara snapshot para proposta/PDF.
5. A proposta e o PDF leem o snapshot da simulacao/proposta e nao devem recalcular.

### Fluxo do Simulador standalone
1. O usuario entra em `crm/simulador`.
2. `Simulador.tsx` carrega catologo comercial e estado local.
3. `simulationEngine` gera ofertas.
4. `simulatorRepository` persiste estado efemero em memoria.
5. `proposalPdf` monta a proposta a partir do resultado visivel.

### Fluxo backend
1. `master-catalog` fornece a arvore oficial de produtos, subprodutos e modalities.
2. `opportunities` persiste e valida oportunidade/cliente/pipeline.
3. `simulation` possui motores financeiros reais.
4. `edp` registra comandos, eventos, aggregates e persistencia.
5. `audit` registra logs e timeline.
6. `integrations` fornece runtime e leitores de proposta de provider.
7. `operation` materializa operacao e persistencia operacional.

## 8. Pontos de calculo financeiro

### 8.1 Frontend Workspace
- `src/pages/Oportunidades.tsx:1844-2108` contem o bloco de `calcularSimulacao` com ramos por tipo de simulacao.
- `src/pages/Oportunidades.tsx:1867-1939` implementa a logica de emprestimo com garantia.
- `src/pages/Oportunidades.tsx:1955-2007` implementa a logica de consignado.
- `src/pages/Oportunidades.tsx:2015-2069` e `src/pages/Oportunidades.tsx:2071-2108` tratam outros ramos financeiros.
- `src/pages/Oportunidades.tsx:5817-6065` renderiza o resultado visivel.

### 8.2 Frontend simulador standalone
- `src/pages/Simulador.tsx:225-281` faz a simulacao via `simulationEngine`.
- `src/pages/Simulador.tsx:1036-1193` renderiza o resultado final do passo 3.

### 8.3 Backend simulation domain
- `backend/src/modules/simulation/domain/services/pmt-formula.service.ts:15-48` implementa formula PRICE/PMT.
- `backend/src/modules/simulation/application/strategies/credit-simulation.strategy.ts:12-41` usa `PmtFormulaService` para credit sim.
- `backend/src/modules/simulation/application/simulate-operation.use-case.ts:10-33` contem um calculo simplificado de coeficiente e parcela.
- `backend/src/modules/simulation/domain/services/cet-formula.service.ts:30-54` calcula CET.
- `backend/src/modules/simulation/domain/services/margin-engine.service.ts:24-39` calcula margem.
- `backend/src/modules/simulation/domain/services/expected-operational-value.service.ts:53-94` calcula valor operacional esperado.
- `backend/src/modules/simulation/domain/services/portability-engine.service.ts` e `refinancing-engine.service.ts` tratam cenarios especificos.
- `backend/src/modules/simulation/domain/services/provider-ranking-engine.service.ts` calcula ranking de providers.

### 8.4 Conclusao sobre calculo indevido
O calculo financeiro ainda nao esta concentrado em uma unica camada. O Workspace faz parte da orquestracao oficial, mas ainda carrega regra financeira no proprio renderer. O backend possui motores reais, porem eles nao aparecem como unica fonte consumida pelo Workspace atual.

## 9. Pontos de montagem de Proposal

### Frontend
- `src/pages/Simulador.tsx:287-415` aceita simulacao, abre preview e monta o fluxo de PDF.
- `src/pages/Simulador.tsx:458-493` gera preview da proposta a partir do mesmo `simulationResult`.
- `src/features/proposals/proposalPdf.ts:718-741` serializa e abre o PDF.

### Backend
- `backend/src/modules/edp/application/use-cases.ts:252-304` expoe `GenerateProposalUseCase`, `AcceptProposalUseCase` e `RejectProposalUseCase`.
- `backend/src/modules/edp/contracts/commands.ts:72-110` define os comandos `GenerateProposal`, `SendProposal`, `RevokeProposal`, `AcceptProposal`, `RejectProposal` e `ExpireProposal`.
- `backend/src/modules/edp/contracts/events.ts:10-15` e `:53-58` modelam os eventos de proposta.
- `backend/src/modules/integrations/application/list-financial-provider-proposals.use-case.ts:10-30` monta leitura de propostas financeiras de providers.
- `backend/src/modules/proposals/routes.ts:12-68` e um router placeholder, sem calculo de negocio.

### Observacao arquitetural
Proposal na superficie oficial deve consumir snapshot calculado e nao recalcular regra financeira.

## 10. Pontos de geracao de PDF/documentos

### Frontend
- `src/features/proposals/proposalPdf.ts:1-741` e o unico gerador de PDF identificado na superficie auditada.
- O arquivo estrutura header, rows, checklist, paragraphs, signatures, footer e serializacao binaria.
- Nao ha calculo financeiro neste arquivo.

### Backend
- Nao foi identificado, no escopo auditado, um gerador de PDF documentado equivalente no backend.

### Ponto em aberto
- Se existir pipeline server-side de PDF fora do escopo, ele nao apareceu na busca atual e deve ser mapeado em auditoria complementar.

## 11. Pontos de persistencia

### Frontend
- `src/data/simulatorRepository.ts:176-277` mantem `simulationState` e `proposalState` em memoria.
- O proprio arquivo explicita estado efemero, sem persistencia local.
- A persistencia aqui e de curto prazo e depende do ciclo de vida da sessao/app.

### Backend
- `backend/src/modules/edp/infrastructure/prisma/repositories.ts:720-729` registra repositorios de `simulation`, `proposal`, `providerCapability`, `providerExecution`, `operationCandidate`, `auditTimeline`, `eventStore`, `outbox`, `idempotency`, `correlation` e `version`.
- `backend/src/modules/opportunities/repositories/opportunities.repository.ts:410-515` trata CRUD e soft delete de oportunidades.
- `backend/src/modules/master-catalog/repositories/master-catalog.prisma.repository.ts:138-343` persiste catalogo mestre.
- `backend/src/modules/operation/repositories/operation.prisma.repository.ts:57-314` persiste operacoes.
- `backend/src/modules/audit/repositories/audit.repository.ts:34-186` persiste logs de auditoria.
- `backend/src/modules/commercial-governance/requests/repositories/commercial-request.prisma.repository.ts` persiste requests comerciais.

### Leitura de risco
O frontend guarda simulacao em memoria; o backend guarda aggregates e eventos. Isso reforca a necessidade de uma snapshot oficial para evitar divergencia entre render, proposal e PDF.

## 12. Pontos de auditoria

### Frontend
- `src/data/simulatorRepository.ts:568-587` expoe `sendLeadToSimulator` e `emitAutomationEvent`, ambos como no-op de automacao.
- `src/pages/Oportunidades.tsx` e `src/pages/Simulador.tsx` mantem estado visivel da simulacao e do resultado.

### Backend
- `backend/src/modules/audit/services/audit.service.ts:46-65` registra logs de auditoria de forma resiliente.
- `backend/src/modules/audit/repositories/audit.repository.ts:34-186` lista, agrega e persiste audit logs.
- `backend/src/modules/edp/contracts/events.ts:30` inclui `audit.event.recorded` como evento oficial.
- `backend/src/modules/edp/infrastructure/prisma/repositories.ts:728` registra `AuditTimelineRepository`.

### Observacao
O audit trail oficial esta no backend; o frontend nao substitui esse papel.

## 13. Dependencias entre modulos

### Workspace e simulacao
- `Oportunidades.tsx` depende de catalogos, pipeline UI, estado da simulacao e serializer de PDF.
- `Simulador.tsx` depende de `commercialRepository`, `simulationEngine`, `simulatorRepository` e `proposalPdf`.
- `creditPfCatalog.ts` alimenta `commercialRepository`, que por sua vez alimenta `Simulador.tsx` e outras telas comerciais.

### Backend core
- `master-catalog` fornece a arvore oficial de produtos, subprodutos e modalities para `opportunities`, `commercial` e possivelmente integracoes.
- `opportunities` valida entidade, tenant, produto, subproduto, modality, pipeline e stage.
- `simulation` fornece motores financeiros e ranking.
- `edp` centraliza eventos, comandos, aggregates e persistencia.
- `audit` recebe registros e estatisticas.
- `operation` consome oportunidade/proposta para materializacao operacional.

### Integrations
- `provider-runtime-registry.ts` monta providers runtime.
- `financial-execution-runtime.ts` valida escopo e idempotencia de execucao financeira.
- `financial-proposal/*` define contratos de leitura de propostas financeiras de provider.

### PDF e proposta
- `proposalPdf.ts` depende apenas do snapshot montado pelo fluxo de tela.
- `backend/src/modules/proposals/routes.ts` nao aparece como dependencia oficial do Workspace; e um placeholder legado.

## 14. Classificacao dos arquivos

### 14.1 Ativo
- `src/pages/Oportunidades.tsx`
- `src/pages/Simulador.tsx`
- `src/data/creditPfCatalog.ts`
- `src/data/commercialRepository.ts`
- `src/data/simulatorRepository.ts`
- `src/features/proposals/proposalPdf.ts`
- `src/components/pipeline/*`
- `src/routes/crm.routes.tsx`
- `backend/src/modules/simulation/*`
- `backend/src/modules/edp/*`
- `backend/src/modules/opportunities/*`
- `backend/src/modules/master-catalog/*`
- `backend/src/modules/audit/*`
- `backend/src/modules/integrations/*`
- `backend/src/modules/operation/*`
- `backend/src/modules/commercial/*`
- `backend/src/modules/commercial-governance/requests/*`

### 14.2 Compatibilidade
- `src/features/vehicle-intelligence/vehicleFipeProvider.ts`
- `backend/src/modules/integrations/application/financial-execution-runtime.ts`
- `backend/src/modules/integrations/domain/contracts/financial-proposal/*`
- `backend/src/modules/simulation/application/simulate-operation.use-case.ts`
- `backend/src/modules/proposals/routes.ts`

### 14.3 Obsoleto
- `src/data/catalogRepository.ts`

### 14.4 Morto
- Nenhum arquivo foi classificado como morto nesta fase.

## 15. Violacoes arquiteturais identificadas

1. O Workspace ainda concentra regra financeira em `Oportunidades.tsx` em vez de ser somente orquestrador.
2. Existem multiplas superfices de simulacao com modelos diferentes entre frontend e backend.
3. Ha coexistencia de renderer oficial e caminhos legados no Workspace, com risco de leitura da fonte errada.
4. `src/data/catalogRepository.ts` representa uma superficie duplicada de catalogo sem consumo identificado.
5. `backend/src/modules/proposals/routes.ts` e um placeholder de proposta que pode ser confundido com superficie oficial.
6. O estado do simulador em frontend e efemero, o que aumenta risco de divergencia se nao houver snapshot canonico.
7. O dominio financeiro possui varios motores e formulas, mas ainda nao foi demonstrada uma fonte unica explicitamente consumida pelo Workspace para Auto Equity.

## 16. Riscos tecnicos

- Divergencia entre calculo do Workspace, simulador standalone e motores backend.
- Falsa impressao de oficialidade em rotas placeholder de proposta.
- Perda de estado de simulacao por uso de memoria local no frontend.
- Desalinhamento entre catalogo PF, comercialRepository e master-catalog backend.
- Regressao por manter caminho legado ativo ao lado do renderer oficial.
- Risco de future drift entre provider runtime e snapshot oficial de proposta.

## 17. Recomendacoes para FASE 2 - Fonte Unica de Verdade

1. Definir um snapshot canonico de simulacao/proposta para o Workspace.
2. Fazer o Workspace consumir apenas estado derivado, nunca reimplementar regra financeira duplicada.
3. Consolidar catalogo oficial em `master-catalog` e usar adaptadores apenas onde for necessario.
4. Manter `proposalPdf.ts` como serializer puro, sem calculos.
5. Tratar `backend/src/modules/proposals/routes.ts` como compatibilidade ate existir substituto oficial validado.
6. Isolar ou remover superficies sem consumo runtime confirmado somente apos substituto validado.
7. Garantir que audit, event store e persistence backend sejam a trilha oficial de rastreabilidade.

## 18. Criterio de saida da FASE 1

FASE 1 pode ser encerrada quando:
- a superficie oficial foi mapeada;
- os arquivos do dominio foram inventariados;
- os pontos de calculo, proposta, PDF, persistencia e auditoria foram identificados;
- as violacoes arquiteturais foram registradas;
- nao houve remocao prematura de legado;
- `npm run build` e `npm test` do frontend e backend passaram;
- o documento de auditoria foi criado e armazenado no local oficial.

## 19. Status final da auditoria

Status: concluida com restricoes.

### Conclusao executiva
- A superficie oficial do Opportunity Workspace esta confirmada.
- O dominio de simulacao tem motores reais no backend, mas o Workspace ainda mantem calculo e renderer em sua propria camada.
- Proposal e PDF estao, na pratica, como consumidores de snapshot, nao como calculadores.
- Existem superficies de compatibilidade e alguns arquivos sem consumo runtime identificado.
- Nao foi classificado nenhum arquivo como morto sem evidencia suficiente.

### Recomendacao final
GO para encerrar a FASE 1 como auditoria documental.

### Condicao da FASE 2
NO-GO para consolidacao definitiva da fonte unica de verdade ate que o snapshot canonico do Workspace e a desativacao dos caminhos legados estejam alinhados com um substituto validado.
