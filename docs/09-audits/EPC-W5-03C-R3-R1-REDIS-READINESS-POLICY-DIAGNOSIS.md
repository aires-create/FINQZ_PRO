# EPC-W5-03C-R3-R1 - Redis Readiness Policy Diagnosis

## Context

- Branch: `homologation/bootstrap-vps`
- Head verificado: `852c10d2651aae5e27f24da251476f5fd700c1c9`
- Escopo desta auditoria: diagnostico de politica de Redis no readiness, sem alteracao de runtime, bootstrap, Prisma, Docker, `.env` ou scripts de build/test.

## Verdict

**Classificacao operacional: Redis e requerido para `GET /ready` atingir `ready`, mas nao e requerido para `GET /health` nem para `GET /live`.**

O backend sobe e responde, porem a condicao de readiness fica `not_ready` quando o ping ao Redis falha. Isso significa que Redis nao e um requisito para iniciar o processo HTTP, mas e um requisito para o estado operacional completo reportado por readiness.

## Evidencia estatica

### 1. Readiness consulta Redis explicitamente

- `backend/src/core/http/fastify.ts`
  - `GET /ready` executa `testDatabaseConnection()`
  - em seguida executa `const redisClient = await connectRedis(); await redisClient.ping();`
  - o estado final usa `database === 'connected' && redis === 'connected'`
  - resposta final alterna entre `200 ready` e `503 not_ready`

### 2. Cliente Redis centralizado

- `backend/src/core/redis/redis.client.ts`
  - usa `ioredis`
  - configura `lazyConnect: true`, `enableOfflineQueue: false`
  - aplica `maxRetriesPerRequest: 1`
  - define `connectTimeout: 500`
  - define `commandTimeout: 500`
  - usa `retryStrategy` com limite de 10 tentativas
  - registra eventos `ready`, `reconnecting`, `error` e `end`

### 3. Redis e componente do rate limit distribuido

- `backend/src/core/http/plugins/rate-limit.plugin.ts`
  - registra `redis: getRedisClient()`
  - usa namespace `finqz:rate-limit:`
  - exclui `/health` e `/ready` do rate limit

### 4. Redis e configuracao de ambiente

- `backend/src/config/app.ts`
  - mapeia `env.redis*` para `config.redis`
- `backend/src/config/env/env.schema.ts`
  - valida `REDIS_URL`

### 5. Compose local e de infraestrutura

- `backend/docker-compose.yml`
  - declara servico `redis`
  - publica `REDIS_URL: redis://redis:6379`
  - define healthcheck com `redis-cli ping`

### 6. Documento mestre confirma a intencao arquitetural

- `docs/00-master/PCCD-FINQZ-PRO-ENTERPRISE.md`
  - afirma Redis como parte da infraestrutura operacional validada
  - registra Redis como integrado ao readiness

## Evidencia operacional

Evidencia ja observada na execucao local:

- o backend chegou a escutar em `http://localhost:3001`
- `GET /health` retornou `200` com `status: ok`
- `GET /live` retornou `200` com `status: live`
- `GET /ready` retornou `503` com `status: not_ready`
- a resposta de readiness indicou `database: connected` e `redis: disconnected`
- nao havia processo escutando em `6379`
- Docker Desktop / engine nao estava disponivel no ambiente observado

## Politica por ambiente

### development

- Redis pode ser provido pelo ambiente local ou compose
- o runtime nao foi encontrado com fallback em memoria
- readiness exige conectividade com Redis para retornar `ready`

### test

- esta auditoria nao alterou o bootstrap de testes
- a politica observada no runtime nao adiciona excecao especial para testes em `GET /ready`
- quando Redis nao esta disponivel, o contrato de readiness falha com `redis: disconnected`

### homologation

- usa `process.env` e configuracao externa injetada
- nao ha leitura automatica de `.env` local dentro do runtime do Redis
- readiness permanece estrito para Redis

### production

- usa `process.env` e configuracao externa injetada
- Redis faz parte do caminho de readiness e do rate limit distribuido

## Fluxo de dependencia

1. `process.env` alimenta `backend/src/config/env/*`
2. `backend/src/config/app.ts` materializa `config.redis`
3. `backend/src/core/redis/redis.client.ts` cria o cliente Redis
4. `backend/src/core/http/fastify.ts` usa `connectRedis()` em `/ready`
5. `backend/src/core/http/plugins/rate-limit.plugin.ts` usa o mesmo cliente para rate limit distribuido

## Impacto por modulo

### Master Catalog

- sem dependencia direta de Redis encontrada no codigo inspecionado
- impacto observado e apenas indireto via estado global de readiness

### Auth

- nao foi encontrada dependencia direta de Redis no caminho principal inspecionado
- o modulo de auth continua dependente de infraestrutura de identidade e persistencia, mas nao de Redis como requisito expresso no trecho analisado

### Rate limit

- dependencia direta e forte
- o plugin de rate limit usa Redis como backend distribuido

### Cache

- nao foi localizado backend de cache separado
- o termo "cache" aparece em telemetria e em nomes de campos, nao como fallback de Redis

## Hipoteses R-H1 a R-H12

- R-H1: `/ready` depende de Redis. **Confirmada**
- R-H2: `/health` depende de Redis. **Rejeitada**
- R-H3: `/live` depende de Redis. **Rejeitada**
- R-H4: rate limit distribuido depende de Redis. **Confirmada**
- R-H5: o cliente Redis e singleton com retries limitados. **Confirmada**
- R-H6: existe fallback em memoria para Redis. **Rejeitada**
- R-H7: `docker-compose.yml` inclui Redis. **Confirmada**
- R-H8: Redis e tratado como componente operacional do runtime. **Confirmada**
- R-H9: Master Catalog tem dependencia direta de Redis. **Nao evidenciada**
- R-H10: Auth tem dependencia direta de Redis no caminho principal. **Nao evidenciada**
- R-H11: o bootstrap de testes altera a politica de Redis no runtime. **Rejeitada**
- R-H12: a falha de readiness por Redis e esperada na ausencia do servico. **Confirmada**

## Riscos

- **BLOCKER**: o ambiente pode ser considerado indisponivel mesmo com API e banco operando, se Redis nao estiver acessivel.
- **CRITICAL**: rate limit distribuido perde backend operacional caso Redis caia, reduzindo protecao de burst.
- **HIGH**: sem Redis, o contrato de readiness impede Go/No-Go automatizado em staging ou VPS.

## Lacunas

- nao foi validado se algum fluxo de auth secundario ou de revogacao usa Redis em outro modulo nao inspecionado aqui
- nao foi executada alteracao de codigo para tornar readiness tolerante a Redis ausente
- nao foi observado mecanismo de fallback oficial para Redis em ambiente sem Docker

## Gate impactado

- **Go/No-Go de release**: bloqueado se Redis nao estiver disponivel onde o readiness e exigido
- **Staging smoke**: o checklist documentado ja trata Redis como pre-requisito operacional
- **Rate limit**: dependente de Redis para protecao distribuida

## Justificativa

O conjunto de evidencias mostra uma decisao arquitetural consistente: Redis nao e necessario para o processo HTTP iniciar, mas e necessario para o estado de prontidao operacional completo. Isso evita falso positivo de saude: a API pode responder, porem ainda nao estar pronta para uso real.

## Proxima acao unica sugerida

Verificar se a politica oficial de HML/VPS deve permanecer estrita em Redis no `GET /ready` ou se deve existir uma excecao formal para ambientes sem Redis, sem alterar agora o runtime.

## Arquivos relacionados

- `backend/src/core/http/fastify.ts`
- `backend/src/core/redis/redis.client.ts`
- `backend/src/core/http/plugins/rate-limit.plugin.ts`
- `backend/src/config/app.ts`
- `backend/src/config/env/env.schema.ts`
- `backend/docker-compose.yml`
- `backend/docs/staging-smoke-checklist.md`
- `docs/00-master/PCCD-FINQZ-PRO-ENTERPRISE.md`

