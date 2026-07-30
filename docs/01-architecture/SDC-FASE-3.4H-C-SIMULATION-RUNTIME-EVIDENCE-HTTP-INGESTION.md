# SDC FASE 3.4H-C - Simulation Runtime Evidence HTTP Ingestion and RBAC

## Contexto

A fase 3.4H-B consolidou a persistencia Prisma das evidencias de Simulation Runtime. Esta fase adiciona a camada HTTP autenticada para ingestao de evidencias sanitizadas, com RBAC e isolamento multi-tenant, sem integrar o frontend ainda.

## Objetivo

Disponibilizar um endpoint canônico para que o Shadow Runtime grave evidencias oficiais de execucao em modo sanitizado.

## Escopo

- Contrato HTTP dedicado
- Schema de validacao com Zod
- Mapper HTTP para o dominio
- Controller com injeção de dependencias
- Composicao com repository Prisma e use case
- Rota Fastify autenticada
- Nova permissao RBAC de escrita
- Testes unitarios
- Teste de integracao HTTP
- Documentacao da fase

## Endpoint

`POST /api/v1/simulations/runtime-evidence`

## Autenticacao e tenant isolation

O endpoint reutiliza:

- `authenticate`
- `tenantContextMiddleware`
- `requirePermissions('simulation:evidence:write')`

O tenant oficial vem de `request.currentTenant.tenantId`. O usuario autenticado vem de `request.currentUser.userId` quando disponivel, seguindo o padrao vigente do projeto.

Nao existe aceita de `tenantId` no body como fonte de autorizacao.

## Permissao RBAC

- Nome: `Write Simulation Evidence`
- Slug: `simulation:evidence:write`
- Descricao: `Persist sanitized simulation runtime evidence`
- Resource: `simulations`
- Action: `CREATE`

A permissao foi adicionada de forma consistente em:

- `backend/src/modules/permissions/service.ts`
- `backend/prisma/seed.ts`

Nenhuma role nova foi criada.

## Contrato sanitizado

O body aceita apenas dados sanitizados e contextuais:

- `evidenceId`
- `campaignId`
- `timestamp`
- `environment`
- `tenantIdHash`
- `opportunityIdHash`
- `requestId`
- `correlationId`
- `executionId`
- `productCode`
- `subproductCode`
- `legacyStatus`
- `canonicalStatus`
- `comparisonStatus`
- `divergenceCategory`
- `divergenceCount`
- `financialCriticalCount`
- `financialMinorCount`
- `structuralCount`
- `missingCanonicalFieldCount`
- `missingLegacyFieldCount`
- `mappingFailure`
- `runtimeFailure`
- `unsupportedScenario`
- `legacyDurationMs`
- `runtimeDurationMs`
- `fallbackUsed`
- `shadowMode`
- `comparatorVersion`
- `contractVersion`
- `catalogVersion`
- `engineVersion`
- `policyVersion`
- `strategyVersion`

Nao sao aceitos:

- tenant real
- `receivedAt`
- `receivedByUserId`
- payload bruto legado
- payload bruto canônico
- dados pessoais

## Idempotencia

Retries identicos sao tratados como replay e retornam `200` quando o registro existente e equivalente ao novo envio, exceto pelo carimbo temporal de recebimento.

## Conflito

Mudancas no payload sob a mesma identidade geram `409 CONFLICT`.

## Respostas HTTP

- `201` criacao inicial
- `200` replay identico
- `400` validacao ou erro de dominio
- `401` sem autenticacao
- `403` sem permissao ou sem tenant
- `409` conflito entre retries
- `500` falha inesperada

## Testes

Cobertura adicionada:

- schema valido
- rejeicao de campo extra
- rejeicao de `shadowMode=false`
- rejeicao de contadores negativos
- rejeicao de enum invalido
- mapper usa tenant do request
- mapper ignora tenant no body
- mapper usa usuario autenticado
- controller responde sucesso
- controller responde `409`
- controller responde `400`
- controller responde `403` sem tenant
- rota exige autenticacao
- rota exige `simulation:evidence:write`
- rota nao quebra `/runtime`
- integracao HTTP com persistencia real, isolamento por tenant e replay/conflicto

## Garantias

- Endpoint autenticado
- Isolamento multi-tenant
- Persistencia oficial via repository Prisma existente
- Corpo estrito e sanitizado
- Respostas sem expor hashes, tenant real ou `receivedByUserId`
- Registro de rota sob o prefixo existente `/api/v1/simulations`

## Limitacoes

- Frontend ainda nao integrado
- `PRIMARY_MODE` continua desativado
- O resultado legado continua oficial
- Nenhuma leitura de report foi criada
- Nenhum Event Store, Outbox ou Canary Mode foi introduzido

## Proximo passo

`SDC FASE 3.4H-D - Frontend Remote Evidence Store Wiring`
