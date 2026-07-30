# SDC-FASE-2-SSOT-01 - Single Source of Truth do Domínio de Simulacao

## Objetivo
Consolidar e documentar a Fonte Unica de Verdade do dominio de simulacao do FINQZ PRO Enterprise, sem mover codigo, sem alterar contratos, sem mudar comportamento e sem quebrar compatibilidade.

Esta fase define:

- quem e dono do estado;
- onde o estado nasce;
- onde o estado pode ser alterado;
- quem persiste;
- quem calcula;
- quem apenas consome.

## Estado Atual

O dominio ainda esta distribuido entre:

- Workspace frontend;
- Simulador standalone;
- catalogos comerciais;
- motores financeiros backend;
- agregados EDP;
- persistencia de oportunidades, propostas, operacoes e auditoria;
- contratos de integracao e runtime de providers.

Os docs oficiais ja definem a direcao arquitetural:

- `ADR-003` confirma que o motor financeiro interno e a referencia oficial de calculo.
- `ADR-007` confirma que `Opportunity` e a unidade operacional central e `Simulation` e entidade independente de calculo.
- `ARCH-016` define o `Opportunity Workspace` como superficie operacional oficial.

## Inventario de Estados

### Estados React

- `src/pages/Oportunidades.tsx`
  - estado da oportunidade selecionada
  - estado de abas
  - estado do simulador do Workspace
  - estado de resultado calculado
  - estado de proposta/preview relacionado

- `src/pages/Simulador.tsx`
  - `customerData`
  - `creditData`
  - `energyData`
  - `simulationResult`
  - `selectedCreditOffer`
  - `selectedEnergyOffer`
  - `proposalAccepted`
  - `generatedProposalId`
  - `showProposalPreview`

### useState / useReducer / Context / Store

- O frontend auditado usa principalmente `useState` e `useMemo`.
- Nao foi identificado `useReducer` ou `Context` como fonte principal de simulacao no escopo auditado.
- Nao foi identificado store global dedicado ao dominio de simulacao na superficie analisada.

### Repositories

- `src/data/simulatorRepository.ts`
- `src/data/commercialRepository.ts`
- `src/data/creditPfCatalog.ts`
- `src/data/catalogRepository.ts`
- `backend/src/modules/opportunities/repositories/opportunities.repository.ts`
- `backend/src/modules/master-catalog/repositories/master-catalog.prisma.repository.ts`
- `backend/src/modules/audit/repositories/audit.repository.ts`
- `backend/src/modules/operation/repositories/operation.prisma.repository.ts`
- `backend/src/modules/edp/infrastructure/prisma/repositories.ts`

### DTOs / Snapshots / Serializados

- `backend/src/modules/edp/contracts/persistence.ts`
- `backend/src/modules/edp/contracts/events.ts`
- `backend/src/modules/edp/contracts/commands.ts`
- `backend/src/modules/integrations/domain/contracts/financial-proposal/*`
- `src/features/proposals/proposalPdf.ts`
- `src/data/simulatorRepository.ts`

## Fluxo Oficial

```text
Cliente
↓
Opportunity
↓
Opportunity Workspace
↓
Simulation State
↓
Simulation Engine
↓
Simulation Result
↓
Proposal
↓
Proposal Snapshot
↓
PDF
↓
Persistence
↓
Audit Timeline
```

### Leitura oficial

- O Workspace e a camada de orquestracao visivel.
- O Simulation Engine e o dono do calculo.
- O Simulation Result e derivado do engine.
- A Proposal e derivada do Simulation Result.
- O PDF e somente serializacao e renderizacao documental.
- A persistencia e backend.
- A auditoria e backend.

## Fonte Unica de Verdade

### Definicao recomendada para a FASE 2

| Objeto | Fonte Unica de Verdade recomendada |
| --- | --- |
| Simulation State | Backend EDP Simulation Aggregate + Workspace como copia de trabalho transitoria |
| Simulation Result | Resultado derivado do Simulation Engine interno, persistido como snapshot de simulacao |
| Proposal | Backend EDP Proposal Aggregate |
| Proposal Snapshot | Payload do Proposal Aggregate |
| Opportunity Snapshot | Backend Opportunities read model / aggregate materializado |
| Persistence | Repositorios backend + EDP repositories |
| Audit Timeline | Backend audit repository / EDP audit timeline |
| PDF | `src/features/proposals/proposalPdf.ts` como serializer, consumindo snapshot pronto |
| Workspace | `src/pages/Oportunidades.tsx` como orquestrador de UI e consumidor de snapshots |
| Engine | `backend/src/modules/simulation/*` e `backend/src/modules/edp/application/use-cases.ts` |

### Conclusao SSOT

O estado oficial nao deve nascer no renderer visual. O renderer visual pode editar, hidratar e apresentar, mas a verdade canonica precisa ficar nos agregados backend e nos snapshots assinados por esse fluxo.

## Ownership Matrix

| Objeto | Owner | Origem | Consumidores | Persistencia | Status | Categoria |
| --- | --- | --- | --- | --- | --- | --- |
| Simulation State | EDP Simulation Aggregate | Workspace/UX input + backend command | Workspace, engine, proposal generation | Persistido no backend / memoria transitiva no frontend | Fragmentado | UNKNOWN OWNER |
| Simulation Result | Simulation Engine interno | Input de simulacao | Workspace, Proposal, PDF, operation materialization | Snapshot/aggregate payload | Ativo | OFFICIAL SOURCE |
| Proposal | EDP Proposal Aggregate | Simulation Result aprovado | PDF, operation, audit, UI | Persistido no backend | Ativo | OFFICIAL SOURCE |
| Proposal Snapshot | Proposal Aggregate payload | GenerateProposal / accept flow | PDF, preview, audit | Persistido no backend | Ativo | DERIVED STATE |
| Opportunity Snapshot | Opportunities module / read model | Intake, create, update, materialize | Workspace, operations, audit, UI | Persistido no backend | Ativo | OFFICIAL SOURCE |
| Persistence | backend repositories + EDP repos | Aggregate state e DTOs | Todas as superficies oficiais | Banco / event store / memoria local em suporte | Ativo | OFFICIAL SOURCE |
| Audit Timeline | backend audit repository / EDP timeline | eventos e actions | Auditoria, compliance, observability | Persistido no backend | Ativo | OFFICIAL SOURCE |
| PDF | proposalPdf serializer | Snapshot pronto | Usuario final, download/open | Blob efemero | Ativo | DERIVED STATE |
| Workspace | `src/pages/Oportunidades.tsx` | Opportunity selection e state hydration | Usuario, simulador, proposta, PDF | React state transitório | Ativo | TRANSIENT |
| Engine | simulation domain services | Requests e contratos | Workspace, EDP, proposal generation | Stateless / deterministic | Ativo | OFFICIAL SOURCE |

## Simulation State

### Origem
- `src/pages/Oportunidades.tsx` e `src/pages/Simulador.tsx` criam e mantem estados locais.
- `backend/src/modules/edp/application/use-cases.ts` possui os comandos `CreateSimulation`, `UpdateSimulationInput` e `CalculateSimulation`.
- `backend/src/modules/edp/domain/aggregates.ts` define `SimulationState`.

### Owner atual
- Oficialmente, o dono canonico deve ser o backend EDP Simulation Aggregate.
- No runtime visual, o Workspace usa uma copia transitiva em React.

### Responsavel por alteracao
- Frontend: interacao do usuario e hydration.
- Backend: comandos EDP e engine interna.

### Consumidores
- Workspace
- Proposal generation
- PDF
- Audit trail

### Persistencia
- `backend/src/modules/edp/infrastructure/prisma/repositories.ts`
- `backend/src/modules/edp/infrastructure/in-memory/memory-repositories.ts`

### Versao
- Via event/aggregate versioning do EDP.

### Ciclo de vida
`draft -> input_updated -> requesting_calculation -> calculating -> calculated -> failed -> archived`

### Dependencias
- Engine financeira
- Commands EDP
- Snapshot de oportunidade/proposta

### Duplicacoes
- Estado local do Workspace
- Estado local do Simulador standalone
- Aggregate de simulacao backend

### Conflitos possiveis
- Workspace sobrescrever resultado calculado com fallback visual.
- Snapshot de simulação divergir do estado renderizado.

## Simulation Result

### Origem
- `backend/src/modules/simulation/domain/services/pmt-formula.service.ts`
- `backend/src/modules/simulation/application/strategies/credit-simulation.strategy.ts`
- `src/pages/Oportunidades.tsx` no fluxo atual ainda calcula em algumas rotas do renderer

### Owner
- Engine financeira interna.

### Consumidores
- Workspace
- Proposal
- PDF
- Opportunity follow-up

### Persistencia
- Deve viver como snapshot derivado da simulacao validada.

### Classificacao
- `OFFICIAL SOURCE` no engine.
- `DERIVED STATE` no frontend.

## Proposal

### Origem
- `backend/src/modules/edp/application/use-cases.ts` com `GenerateProposalUseCase`
- fluxo de accept/reject proposal

### Owner
- EDP Proposal Aggregate.

### Consumidores
- PDF
- UI de preview
- operation materialization
- audit

### Persistencia
- backend EDP proposal repository.

### Ciclo de vida
`draft -> generated -> versioned -> sent -> viewed -> accepted/rejected/revoked/expired -> superseded -> archived`

### Classificacao
- `OFFICIAL SOURCE`

## Proposal Snapshot

### Origem
- `GenerateProposalUseCase`
- snapshot do result set de simulacao

### Owner
- Proposal Aggregate.

### Consumidores
- `src/features/proposals/proposalPdf.ts`
- preview da proposta
- auditoria

### Classificacao
- `DERIVED STATE`

## Opportunity Snapshot

### Origem
- `backend/src/modules/opportunities/services/opportunities.service.ts`
- `backend/src/modules/opportunities/repositories/opportunities.repository.ts`
- `backend/src/modules/edp/application/use-cases.ts` em `MaterializeOpportunityUseCase`

### Owner
- Opportunities module no backend, com materializacao via EDP quando aplicavel.

### Consumidores
- Workspace
- operation
- audit

### Classificacao
- `OFFICIAL SOURCE`

## Persistence

### Owner
- Backend repositories e infraestrutura EDP.

### Fontes
- `backend/src/modules/edp/infrastructure/prisma/repositories.ts`
- `backend/src/modules/opportunities/repositories/opportunities.repository.ts`
- `backend/src/modules/master-catalog/repositories/master-catalog.prisma.repository.ts`
- `backend/src/modules/operation/repositories/operation.prisma.repository.ts`
- `backend/src/modules/audit/repositories/audit.repository.ts`

### Classificacao
- `OFFICIAL SOURCE`

## Audit Timeline

### Owner
- Backend audit repository e timeline EDP.

### Origem
- eventos, actions e registros resilientes.

### Consumidores
- auditoria, compliance, observability.

### Classificacao
- `OFFICIAL SOURCE`

## PDF

### Owner
- `src/features/proposals/proposalPdf.ts` como serializer.

### Origem
- Proposal Snapshot pronto.

### Consumidores
- usuario final
- download
- abertura do PDF

### Classificacao
- `DERIVED STATE`

### Regra
- PDF nunca calcula.

## Workspace

### Owner
- `src/pages/Oportunidades.tsx`

### Origem
- hydration de opportunity + catalogos + estado de simulacao.

### Consumidores
- Usuario
- Proposal
- PDF

### Classificacao
- `TRANSIENT`

### Regra
- Workspace orquestra, nao deve ser a fonte oficial do calculo.

## Engine

### Owner
- `backend/src/modules/simulation/*`

### Origem
- contratos e requests de simulacao

### Consumidores
- Workspace
- EDP
- Proposal
- PDFs derivados

### Classificacao
- `OFFICIAL SOURCE`

## Estados Duplicados

- Estado local do Workspace
- Estado local do Simulador standalone
- Snapshot persistido no backend
- Proposal preview
- Proposal PDF payload
- Catalogo comercial e master-catalog

## Estados Transitórios

- React local state
- preview modal
- blob do PDF
- selections de produto/subproduto
- loading states

## Estados Derivados

- Simulation Result
- Proposal Snapshot
- PDF blob
- result cards do Workspace
- ranking de ofertas

## Estados Persistidos

- Opportunity aggregate/read model
- Simulation aggregate
- Proposal aggregate
- Operation aggregate
- Audit timeline
- Event store
- Outbox
- Idempotency
- Correlation

## Violações Encontradas

1. O Workspace ainda possui regra financeira local para parte do fluxo.
2. Existem dois ambientes de simulacao visivel: Workspace e Simulador standalone.
3. O frontend guarda copia de simulacao em memoria, sem persistencia canonica.
4. O catalogo comercial e o master catalogo backend coexistem.
5. `backend/src/modules/proposals/routes.ts` permanece como placeholder e pode confundir ownership.
6. O snapshot de proposta e reconstruido em mais de um ponto visual.
7. Pode haver sobrescrita de estado por fallbacks de produto/pipeline ou hydration tardia.

## Riscos

- divergencia entre tela e agregado backend;
- proposta/PDF mostrando dado obsoleto;
- snapshot concorrente;
- hydration sobrescrevendo estado valido;
- duplicidade de calculo em frente/back;
- interpretacao ambigua entre compatibilidade e oficialidade.

## Plano de Migracao

1. Congelar a definicao de ownership por objeto.
2. Garantir que o engine backend seja a unica fonte de calculo.
3. Fazer o Workspace consumir apenas snapshots oficiais.
4. Consolidar Proposal e Proposal Snapshot como derivacoes do resultado oficial.
5. Centralizar persistencia canonica no backend EDP/opportunities.
6. Manter PDF como serializer puro.
7. Tratar superficies compatibilidade apenas como adaptadores.

## Recomendações FASE 3

- remover duplicacao de leitura de simulacao na UI;
- eliminar caminhos concorrentes de renderer;
- expor contratos claros de snapshot;
- mapear o DTO canonico por dominio;
- criar trilha de reconciliacao entre aggregate e UI;
- estabilizar o pipeline de persistencia e auditoria.

## Critério de Encerramento

A FASE 2 so pode ser encerrada quando:

- a ownership matrix estiver aprovada;
- o fluxo oficial estiver documentado;
- o Simulation Engine for a fonte unica de calculo;
- Proposal e PDF estiverem lendo apenas snapshot oficial;
- o Workspace nao calcular regra financeira por conta propria;
- a persistencia canonica estiver identificada;
- a auditoria estiver integrada ao fluxo oficial;
- `npm run build` e `npm test` frontend/backend estiverem verdes.

## Status Final

Status: concluido com restricoes.

### Veredito
GO WITH RESTRICTIONS

### Justificativa
- A fonte unica de verdade foi mapeada e documentada.
- Ainda existem superficies transitorias e compatibilidade em paralelo.
- A FASE 3 deve tratar a desativacao controlada desses paralelos, sem quebra de contrato.
