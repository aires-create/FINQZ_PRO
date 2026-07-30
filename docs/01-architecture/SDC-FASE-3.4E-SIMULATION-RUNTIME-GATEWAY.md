# SDC FASE 3.4E - Simulation Runtime Gateway

## Objetivo

Formalizar a camada HTTP oficial do runtime de simulação no backend do FINQZ PRO, mantendo o motor de simulação, Proposal, PDF e FIPE intactos.

Esta fase cria apenas a fronteira de entrada do runtime e o contrato canônico para a execução da simulação, com validação de auth, tenant, RBAC e rastreabilidade.

## Arquitetura

### Superfície oficial

- Base: `backend/src/modules/simulation/presentation/http`
- Rota: `POST /api/v1/simulations/runtime`
- Guardas: `authenticate`, `tenantContextMiddleware`, `requirePermissions('simulation:execute')`
- Controller oficial: `SimulationRuntimeController`
- Runtime oficial: `simulationApplicationRuntime`

### Responsabilidade

- O HTTP gateway recebe a requisição canônica.
- O controller hidrata `tenant`, `requestId` e `correlationId` a partir do contexto autenticado.
- O runtime de aplicação continua responsável por resolver produto, subproduto, subfluxo, ACL, engine legada e snapshot.
- O gateway apenas monta e entrega o payload oficial de saída.

## Fluxo Runtime

1. A requisição entra em `POST /api/v1/simulations/runtime`.
2. `authenticate` valida o token.
3. `tenantContextMiddleware` confirma o contexto multi-tenant.
4. `requirePermissions('simulation:execute')` aplica RBAC.
5. `SimulationRuntimeController` valida o payload de entrada.
6. O controller monta `SimulationRequest` com tenant do contexto.
7. `simulationApplicationRuntime.execute(...)` processa a simulação.
8. O mapper converte o resultado para o payload HTTP canônico.
9. O response retorna somente campos oficiais e sem vazamento de `legacyInput` ou `legacyResult`.

## DTOs

### Request body

O body HTTP aceita o snapshot canônico de simulação, sem depender de tenant enviado pelo cliente.

Campos centrais:

- `product`
- `subproduct`
- `customer`
- `participants`
- `guarantees`
- `vehicle`
- `property`
- `income`
- `agreement`
- `provider`
- `commercializadora`
- `bank`
- `corban`
- `channel`
- `pipeline`
- `opportunity`
- `commercial`
- `parameters`
- `metadata`
- `versioning`
- `execution`

### Response body

O response oficial expõe:

- `executionId`
- `correlationId`
- `tenant`
- `product`
- `subproduct`
- `status`
- `decision`
- `result`
- `proposals`
- `ranking`
- `warnings`
- `rejectionReasons`
- `snapshotReference`
- `auditReference`
- `engineVersion`
- `catalogVersion`
- `policyVersion`
- `strategyVersion`
- `executionTimestamp`
- `compatibilityMode`

## Contracts

### Arquivos criados

- `backend/src/modules/simulation/presentation/http/simulation-runtime.http.contract.ts`
- `backend/src/modules/simulation/presentation/http/simulation-runtime.http.schema.ts`
- `backend/src/modules/simulation/presentation/http/simulation-runtime.http.mapper.ts`
- `backend/src/modules/simulation/presentation/http/simulation-runtime.error-mapper.ts`
- `backend/src/modules/simulation/presentation/http/simulation-runtime.controller.ts`
- `backend/src/modules/simulation/presentation/http/simulation-runtime.routes.ts`
- `backend/src/modules/simulation/presentation/http/index.ts`

### Permissão oficial

- `simulation:execute`

O catálogo de permissões foi atualizado para suportar a superfície oficial sem alterar o motor de simulação.

## Repository

Nesta fase nao foi criado repository de persistencia para runtime.

Motivos:

- a simulacao continua em modo de execucao;
- nao ha persistencia adicional;
- nao ha alteracao de contrato com bancos de dados;
- idempotencia permanece preparada apenas no contrato HTTP.

## Services

### Runtime de aplicacao

- `SimulationApplicationRuntime`

### Pipeline interna

- resolve o produto canonicamente;
- resolve o subfluxo;
- aplica ACL;
- executa a engine legada;
- cria snapshot e execution envelope;
- retorna o resultado canônico.

## Read Models

O payload HTTP exposto pelo gateway e um read model de execucao.

Ele nao expõe:

- `legacyInput`
- `legacyResult`
- internals de bridge
- stacks ou erros internos

## Compatibilidade

Compatibilidade preservada:

- motor de simulacao existente;
- Proposal;
- PDF;
- FIPE;
- motor legada;
- contratos internos de dominio.

Nao houve migracao de regra financeira nesta fase.

## Plano de migracao

1. Publicar a gateway HTTP oficial.
2. Consumidores do workspace passam a chamar `POST /api/v1/simulations/runtime`.
3. Manter o runtime interno atual como fonte de execucao.
4. Evoluir idempotencia e telemetria sem alterar regra financeira.
5. Em fase posterior, consolidar read models e contratos de transporte.

## Critério de saida

Esta fase pode ser considerada concluida quando:

- a rota oficial estiver publicada;
- auth, RBAC e tenant isolation estiverem ativos;
- o response canônico nao expuser estruturas legadas;
- build e testes estiverem verdes;
- o contrato HTTP estiver documentado e testado.

## Status final

Status: implementado e validado.

Build backend: ok.
Testes backend: ok.
