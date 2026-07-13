# EPC-W5-03C-R3-R2 - Local Redis Runbook

## Contexto

- Repository: `FINQZ_PRO`
- Branch: `homologation/bootstrap-vps`
- HEAD verificado nesta fase: `9904a0f`
- Objetivo: documentar e padronizar o mecanismo local oficial para Redis, sem alterar runtime, bootstrap, Redis client, Dockerfiles, compose, `.env` ou scripts.

## Classificacao operacional

**A politica operacional observada e: Redis e requerido para o caminho completo de prontidao (`GET /ready`), mas o backend pode subir e responder sem Redis.**

Na pratica:

- `GET /health` permanece `200`
- `GET /live` permanece `200`
- `GET /ready` retorna `503 not_ready` quando Redis esta indisponivel

## Caminho oficial para iniciar Redis local

### Evidencia oficial encontrada

- `backend/docker-compose.yml` declara um servico `redis`
- `backend/docker-compose.hml.yml` orienta aplicacao em conjunto com `backend/docker-compose.yml`
- `backend/docs/staging-smoke-checklist.md` exige Docker ativo, Redis ativo e `docker compose config`
- `backend/docs/environment-variables.md` descreve `redis` como nome de servico na Docker network
- `docs/00-master/PCCD-FINQZ-PRO-ENTERPRISE.md` afirma Redis como parte da infraestrutura operacional validada

### Mecanismo oficial local

O caminho oficial local mais fiel ao compose existente e:

```bash
cd backend
docker compose up -d redis
```

Observacao:

- o comando acima e a forma minima e reproduzivel de subir somente o Redis definido no compose
- o stack completo pode ser subido com `docker compose up --build`, mas isso inclui outros servicos
- nao encontrei um runbook separado com um comando mais especifico do que o compose do backend

## Mapa de compose

### Servico redis

- imagem: `redis:7-alpine`
- container_name: `finqz-pro-redis`
- command: `redis-server --appendonly yes`
- porta: `6379:6379`
- volume: `redis_data:/data`
- restart: `unless-stopped`
- healthcheck: `redis-cli ping`
- network: `finqz_pro_network`
- aliases: nao encontrei alias explicitado
- hostname: nao encontrei hostname explicitado

### Relacionamento com a API

- `api` depende de `postgres` e `redis` com `condition: service_healthy`
- `REDIS_URL` da API e injetado como `redis://redis:6379`
- `DATABASE_URL` e injetado apontando para `postgres`

## Como o backend descobre Redis

### Variaveis e resolucao

- `REDIS_URL`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_TLS`
- `REDIS_PASSWORD`
- `REDIS_DB`

### Contrato observado no runtime

- `backend/src/config/app.ts` materializa `config.redis`
- `backend/src/core/redis/redis.client.ts` usa `ioredis`
- o cliente usa `lazyConnect: true`
- o cliente usa `enableOfflineQueue: false`
- o cliente usa `maxRetriesPerRequest: 1`
- o cliente define `connectTimeout: 500`
- o cliente define `commandTimeout: 500`
- o cliente aplica retry limitado

## Procedimento oficial proposto

### Pre-requisitos

- Docker Desktop ou Docker Engine ativo
- Docker Compose disponivel
- porta `6379` livre no host, se a porta for publicada
- variaveis obrigatorias do backend ja resolvidas pelo ambiente

### Comandos

```bash
cd backend
docker compose up -d redis
docker compose ps
docker compose logs redis
docker compose restart redis
docker compose down
```

### Validacao esperada

- o container `finqz-pro-redis` sobe
- o healthcheck do Redis passa
- a API consegue resolver `redis` como hostname interno no compose
- `GET /ready` pode atingir HTTP `200` somente se a API e o Redis estiverem operacionais

## Validacoes executadas

- `docker compose config`: executado com sucesso e o compose foi renderizado
- `docker compose ps`: falhou por indisponibilidade do Docker Engine
- `docker ps`: falhou por indisponibilidade do Docker Engine

## Estado do Docker neste ambiente

- Docker Engine indisponivel
- Docker Desktop nao estava ativo
- Redis service nao pode ser iniciado neste ambiente
- a validacao local depende apenas do operador ter Docker ativo

## GAP analysis

### O que existe

- servico Redis definido no compose
- healthcheck Redis definido
- referencia documental para staging e environment variables
- contrato de readiness que exige Redis

### O que falta

- runbook oficial curto com comando redis-only explicitamente escrito em um documento unico
- confirmacao operacional em ambiente com Docker ativo nesta maquina
- evidencias de `docker compose ps` e `docker ps` com Engine funcionando

### O que esta operacional

- a definicao do servico Redis no compose
- o contrato de descoberta da API via `REDIS_URL` e hostname interno `redis`
- o caminho de readiness que condiciona `ready` a Redis

### O que depende do operador

- manter Docker Desktop/Engine ativo
- liberar porta `6379` quando houver publicacao
- iniciar o compose localmente

## Riscos

- **BLOCKER**: sem Docker Engine, o Redis local nao inicia
- **CRITICAL**: sem Redis, o backend fica em `503 not_ready`
- **HIGH**: sem runbook unico, o onboarding local fica sujeito a interpretacao do operador

## Proximo passo unico

**PREPARE_LOCAL_REDIS_RUNBOOK**

## Arquivos base usados nesta analise

- `backend/docker-compose.yml`
- `backend/docker-compose.hml.yml`
- `backend/docs/environment-variables.md`
- `backend/docs/staging-smoke-checklist.md`
- `docs/00-master/PCCD-FINQZ-PRO-ENTERPRISE.md`

