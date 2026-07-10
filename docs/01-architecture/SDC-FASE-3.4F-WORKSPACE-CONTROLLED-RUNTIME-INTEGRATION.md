# SDC FASE 3.4F - Workspace Controlled Runtime Integration

## Objetivo
Integrar o Opportunity Workspace ao runtime oficial de simulação em modo shadow, sem substituir o resultado legado, sem alterar Proposal, PDF, FIPE, backend de negócio ou regras financeiras.

## Arquitetura
- O Workspace permanece como orquestrador visual e de interação.
- O resultado oficial exibido ao usuário continua sendo o legado.
- O runtime oficial é chamado em paralelo, somente para observabilidade, comparação e preparação da migração.
- A integração frontend fica isolada em `src/features/simulation-runtime/`.

## Fluxo Runtime
1. O usuário preenche o simulador no Workspace.
2. O Workspace calcula o resultado legado e mantém o comportamento atual.
3. Um snapshot canônico é montado por mapper puro.
4. O hook `useSimulationRuntimeShadow` chama a API oficial em shadow mode.
5. A resposta é normalizada e comparada com o resultado legado.
6. Telemetria sanitizada registra divergências e falhas sem payload sensível.

## DTOs
DTOs frontend canônicos:
- `SimulationRuntimeRequestBody`
- `SimulationRuntimeResponseData`
- `SimulationRuntimeLegacyResult`
- `SimulationRuntimeWorkspaceInput`
- `SimulationRuntimeComparison`

## Contracts
Contratos separados por responsabilidade:
- `contracts/simulation-runtime.contract.ts`
- `comparison/simulation-runtime.comparison.types.ts`
- `config/simulation-runtime.flags.ts`

## Repository
Nesta fase não há repository novo para persistência. O runtime shadow consome apenas a API oficial de simulação.

## Services
Serviços e adaptadores frontend:
- `api/simulation-runtime.api.ts`
- `mappers/workspace-to-simulation-runtime.mapper.ts`
- `mappers/simulation-runtime-response.mapper.ts`
- `comparison/simulation-runtime.comparator.ts`
- `telemetry/simulation-runtime.telemetry.ts`

## Read Models
Read models usados para análise:
- resposta canônica do runtime
- resultado legado do Workspace
- comparação entre ambos

## Compatibilidade
- `VITE_SIMULATION_RUNTIME_SHADOW_ENABLED` controla a execução shadow.
- `VITE_SIMULATION_RUNTIME_PRIMARY_ENABLED` permanece desabilitado por padrão.
- `VITE_SIMULATION_RUNTIME_FALLBACK_ENABLED` permanece habilitado.
- O fluxo atual não substitui a UI visível.

## Plano de Migração
1. Validar o shadow mode no Workspace.
2. Medir divergências entre legado e runtime.
3. Ajustar contratos e mapeamentos sem alterar regras financeiras.
4. Somente após estabilidade migrar para leitura primária.

## Critério de Saída
- Runtime shadow ativo e estável.
- Comparação sem regressões críticas.
- Proposal e PDF continuam intactos.
- Nenhuma alteração visual ou funcional para o usuário final.

