# SDC FASE 3.3 - Simulation Contract Bridge & Anti-Corruption Layer

## 1. Título
SDC FASE 3.3 - Simulation Contract Bridge & Anti-Corruption Layer

## 2. Objetivo
Estabelecer uma ponte canônica entre o contrato oficial de simulação e a superfície legada ainda mantida por compatibilidade, sem alterar regras financeiras, Proposal, PDF, FIPE, backend de persistência ou o comportamento atual do Workspace.

## 3. Escopo analisado
### Núcleo de simulação
- `backend/src/modules/simulation/contracts/simulation.contract.ts`
- `backend/src/modules/simulation/contracts/simulation.factory.ts`
- `backend/src/modules/simulation/contracts/index.ts`
- `backend/src/modules/simulation/dto/simulation.dto.ts`
- `backend/src/modules/simulation/types/simulation.types.ts`
- `backend/src/modules/simulation/value-objects/simulation-version.value-object.ts`
- `backend/src/modules/simulation/value-objects/simulation-snapshot-reference.value-object.ts`

### Camada de compatibilidade
- `backend/src/modules/simulation/acl/legacy-simulation.types.ts`
- `backend/src/modules/simulation/acl/simulation-bridge-context.ts`
- `backend/src/modules/simulation/acl/legacy-simulation-input-to-simulation-request.mapper.ts`
- `backend/src/modules/simulation/acl/simulation-request-to-legacy-simulation-input.mapper.ts`
- `backend/src/modules/simulation/acl/legacy-simulation-result-to-simulation-result.mapper.ts`
- `backend/src/modules/simulation/acl/simulation-result-to-legacy-simulation-result.mapper.ts`
- `backend/src/modules/simulation/acl/index.ts`

### Runtime canônico de execução
- `backend/src/modules/simulation/execution/request-hash.factory.ts`
- `backend/src/modules/simulation/execution/execution-id.factory.ts`
- `backend/src/modules/simulation/execution/correlation-id.factory.ts`
- `backend/src/modules/simulation/execution/simulation-execution-envelope.contract.ts`
- `backend/src/modules/simulation/execution/simulation-execution-envelope.factory.ts`
- `backend/src/modules/simulation/execution/index.ts`

### Snapshot canônico
- `backend/src/modules/simulation/snapshots/simulation-snapshot.contract.ts`
- `backend/src/modules/simulation/snapshots/simulation-snapshot.factory.ts`
- `backend/src/modules/simulation/snapshots/index.ts`

### Runtime legado ainda ativo por compatibilidade
- `backend/src/modules/simulation/domain/contracts/simulation.contract.ts`
- `backend/src/modules/simulation/domain/contracts/simulation-strategy.contract.ts`
- `backend/src/modules/simulation/application/simulate-operation.use-case.ts`
- `backend/src/modules/simulation/application/simulation-strategy.resolver.ts`
- `backend/src/modules/simulation/application/strategies/credit-simulation.strategy.ts`
- `backend/src/modules/simulation/domain/services/*.ts`

## 4. Princípios SDC aplicados
- Proposal nunca calcula.
- PDF nunca calcula.
- Workspace orquestra, não implementa regra financeira.
- Uma única fonte de verdade por responsabilidade.
- Um único motor de cálculo por domínio financeiro.
- Nenhum legado deve ser removido antes de substituto validado.

## 5. Inventário dos arquivos encontrados
### Ativos
- `backend/src/modules/simulation/contracts/simulation.contract.ts`
- `backend/src/modules/simulation/contracts/simulation.factory.ts`
- `backend/src/modules/simulation/contracts/index.ts`
- `backend/src/modules/simulation/dto/simulation.dto.ts`
- `backend/src/modules/simulation/types/simulation.types.ts`
- `backend/src/modules/simulation/value-objects/simulation-version.value-object.ts`
- `backend/src/modules/simulation/value-objects/simulation-snapshot-reference.value-object.ts`
- `backend/src/modules/simulation/snapshots/simulation-snapshot.contract.ts`
- `backend/src/modules/simulation/snapshots/simulation-snapshot.factory.ts`
- `backend/src/modules/simulation/execution/request-hash.factory.ts`
- `backend/src/modules/simulation/execution/execution-id.factory.ts`
- `backend/src/modules/simulation/execution/correlation-id.factory.ts`
- `backend/src/modules/simulation/execution/simulation-execution-envelope.contract.ts`
- `backend/src/modules/simulation/execution/simulation-execution-envelope.factory.ts`
- `backend/src/modules/simulation/index.ts`

### Compatibilidade
- `backend/src/modules/simulation/acl/legacy-simulation.types.ts`
- `backend/src/modules/simulation/acl/simulation-bridge-context.ts`
- `backend/src/modules/simulation/acl/legacy-simulation-input-to-simulation-request.mapper.ts`
- `backend/src/modules/simulation/acl/simulation-request-to-legacy-simulation-input.mapper.ts`
- `backend/src/modules/simulation/acl/legacy-simulation-result-to-simulation-result.mapper.ts`
- `backend/src/modules/simulation/acl/simulation-result-to-legacy-simulation-result.mapper.ts`
- `backend/src/modules/simulation/domain/contracts/simulation.contract.ts`
- `backend/src/modules/simulation/domain/contracts/simulation-strategy.contract.ts`
- `backend/src/modules/simulation/application/simulate-operation.use-case.ts`
- `backend/src/modules/simulation/application/simulation-strategy.resolver.ts`
- `backend/src/modules/simulation/application/strategies/credit-simulation.strategy.ts`
- `backend/src/modules/simulation/domain/services/bank-coefficient-engine.service.ts`
- `backend/src/modules/simulation/domain/services/cet-formula.service.ts`
- `backend/src/modules/simulation/domain/services/expected-operational-value.service.ts`
- `backend/src/modules/simulation/domain/services/margin-engine.service.ts`
- `backend/src/modules/simulation/domain/services/pmt-formula.service.ts`
- `backend/src/modules/simulation/domain/services/portability-engine.service.ts`
- `backend/src/modules/simulation/domain/services/provider-ranking-engine.service.ts`
- `backend/src/modules/simulation/domain/services/refinancing-engine.service.ts`

### Obsoleto
- Nenhum arquivo pôde ser comprovado como obsoleto nesta fase sem risco de quebra.

### Morto
- Nenhum arquivo pôde ser comprovado como morto nesta fase.

## 6. Mapa atual do domínio
O domínio passou a ter duas superfícies coexistentes:

1. **Superfície canônica**
   - `SimulationRequest`
   - `SimulationResult`
   - `SimulationSnapshot`
   - `SimulationExecutionEnvelope`
   - DTOs e value objects oficiais

2. **Superfície de compatibilidade**
   - `LegacySimulationInput`
   - `LegacySimulationResult`
   - mappers ACL de ida e volta
   - contrato legado de domínio ainda usado por simuladores antigos

## 7. Fluxo atual identificado
1. O Workspace/consumidor monta um `SimulationRequest` canônico.
2. A camada ACL converte para o formato legado quando necessário.
3. O runtime legível/calculável continua nas estratégias e serviços de domínio existentes.
4. O resultado calculado é convertido para `SimulationResult` canônico.
5. Snapshot, audit e execution envelope recebem esse resultado sem recalcular.
6. O payload legado pode ser regenerado para consumidores antigos.

## 8. Pontos de cálculo financeiro
### Pontos explícitos de cálculo
- `backend/src/modules/simulation/application/simulate-operation.use-case.ts`
- `backend/src/modules/simulation/application/strategies/credit-simulation.strategy.ts`
- `backend/src/modules/simulation/domain/services/pmt-formula.service.ts`
- `backend/src/modules/simulation/domain/services/cet-formula.service.ts`
- `backend/src/modules/simulation/domain/services/bank-coefficient-engine.service.ts`
- `backend/src/modules/simulation/domain/services/margin-engine.service.ts`
- `backend/src/modules/simulation/domain/services/portability-engine.service.ts`
- `backend/src/modules/simulation/domain/services/refinancing-engine.service.ts`
- `backend/src/modules/simulation/domain/services/expected-operational-value.service.ts`
- `backend/src/modules/simulation/domain/services/provider-ranking-engine.service.ts`

### Pontos que não calculam
- `backend/src/modules/simulation/dto/simulation.dto.ts`
- `backend/src/modules/simulation/snapshots/simulation-snapshot.factory.ts`
- `backend/src/modules/simulation/execution/simulation-execution-envelope.factory.ts`
- `backend/src/modules/simulation/acl/*.ts`

## 9. Pontos de montagem de Proposal
- `backend/src/modules/simulation/contracts/simulation.contract.ts`
  - campos `proposals`, `proposalReference`
- `backend/src/modules/simulation/dto/simulation.dto.ts`
  - preserva `proposals` e `proposalReference` sem calcular
- `backend/src/modules/edp`
  - domínio separado que recebe comando de geração/aceite/rejeição
- `backend/src/modules/proposals/routes.ts`
  - superfície HTTP de Proposal, separada do cálculo de simulação

## 10. Pontos de geração de PDF/documentos
- Nenhum gerador de PDF foi alterado nesta fase.
- O domínio de simulação apenas carrega `snapshot`, `proposalReference` e `auditReference`.
- A geração de PDF permanece fora da ponte e deve consumir somente o resultado já calculado.

## 11. Pontos de persistência
- Nenhum repositório de persistência do domínio de simulação foi migrado nesta fase.
- Persistência continua fora da ponte, em módulos de operação, EDP e integrações.
- O bridge não grava estado novo; apenas normaliza leitura e transporte de contrato.

## 12. Pontos de auditoria
- `backend/src/modules/simulation/execution/request-hash.factory.ts`
- `backend/src/modules/simulation/execution/simulation-execution-envelope.contract.ts`
- `backend/src/modules/simulation/execution/simulation-execution-envelope.factory.ts`
- `backend/src/modules/simulation/snapshots/simulation-snapshot.contract.ts`
- `backend/src/modules/simulation/snapshots/simulation-snapshot.factory.ts`
- `backend/src/modules/simulation/contracts/simulation.contract.ts`
  - `SimulationAudit`
  - `SimulationSnapshotReference`
  - `SimulationExecutionContext`

## 13. Dependências entre módulos
- `simulation` depende de `types` e `value-objects` para versionamento e enumeração.
- `simulation/acl` depende de `simulation/contracts` para construir a ponte canônica.
- `simulation/snapshots` e `simulation/execution` dependem de `simulation/contracts` e `simulation/acl`.
- `simulation/application` ainda depende do contrato legado do domínio.
- `edp` e `proposals` permanecem como consumidores adjacentes do resultado de simulação, mas não foram modificados.

## 14. Classificação dos arquivos
### Ativo
- `backend/src/modules/simulation/contracts/*`
- `backend/src/modules/simulation/dto/simulation.dto.ts`
- `backend/src/modules/simulation/types/simulation.types.ts`
- `backend/src/modules/simulation/value-objects/*`
- `backend/src/modules/simulation/snapshots/*`
- `backend/src/modules/simulation/execution/*`
- `backend/src/modules/simulation/index.ts`

### Compatibilidade
- `backend/src/modules/simulation/acl/*`
- `backend/src/modules/simulation/domain/contracts/simulation.contract.ts`
- `backend/src/modules/simulation/domain/contracts/simulation-strategy.contract.ts`
- `backend/src/modules/simulation/application/simulate-operation.use-case.ts`
- `backend/src/modules/simulation/application/simulation-strategy.resolver.ts`
- `backend/src/modules/simulation/application/strategies/credit-simulation.strategy.ts`
- `backend/src/modules/simulation/domain/services/*.ts`

### Obsoleto
- Nenhum arquivo comprovado.

### Morto
- Nenhum arquivo comprovado.

## 15. Violações arquiteturais identificadas
- Há coexistência de duas superfícies de contrato para simulação: canônica e legado.
- O runtime legado ainda contém cálculo real em paralelo ao contrato canônico.
- Existe risco de drift caso consumidores leiam o contrato legado fora da ACL.
- Esses pontos não foram removidos nesta fase por requisito explícito de compatibilidade.

## 16. Riscos técnicos
- Drift entre resultado canônico e resultado legado.
- Uso acidental do contrato legado por novos consumidores.
- Divergência de `exactOptionalPropertyTypes` entre mappers e tipos herdados.
- Evolução do catálogo ou do Workspace sem sincronização do bridge.
- Mistura indevida entre dados calculados e dados de apresentação.

## 17. Recomendações para FASE 2 — Fonte Única de Verdade
- Consolidar leitores novos apenas sobre `SimulationRequest` e `SimulationResult` canônicos.
- Manter ACL como camada única de compatibilidade.
- Criar regra de descontinuação gradual para o contrato legado após substituto validado.
- Centralizar o transporte de metadados de auditoria e versionamento no `SimulationExecutionEnvelope`.
- Impedir cálculo em Proposal, PDF e Workspace.

## 18. Critério de saída da FASE 1
- Inventário do domínio concluído.
- Superfícies canônica e legada identificadas.
- Dependências principais mapeadas.
- Pontos de cálculo, Proposal, PDF, persistência e auditoria catalogados.
- Riscos e violações conhecidos documentados.
- Nenhum arquivo removido sem substituto validado.

## 19. Status final da auditoria
**Concluída com restrições.**

O domínio de simulação está agora documentado com a superfície canônica, a camada de compatibilidade e os pontos de auditoria necessários para avançar para a FASE 2 de Fonte Única de Verdade sem quebra de contrato.
