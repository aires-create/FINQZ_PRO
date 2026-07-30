# FINQZ PRO Backend Environment Variables

## Objetivo

Documentar as variaveis de ambiente obrigatorias do backend e as regras de governanca aplicadas no startup.

O backend valida envs com Zod em `src/config/env.ts` e falha rapidamente antes de iniciar se a configuracao estiver ausente ou insegura.

## Obrigatorias

| Variavel | Descricao |
| --- | --- |
| `NODE_ENV` | Ambiente da aplicacao: `development`, `test` ou `production`. |
| `PORT` | Porta HTTP do backend. Obrigatoria em production. |
| `HOST` | Host de bind do backend. Obrigatoria em production. |
| `DATABASE_URL` | URL PostgreSQL usada pelo Prisma. |
| `REDIS_URL` | URL Redis usada pela aplicacao. |
| `JWT_SECRET` | Secret para access tokens. |
| `JWT_REFRESH_SECRET` | Secret para refresh tokens. |
| `CORS_ORIGIN` | Lista de origins permitidas, separadas por virgula. |

## Regras de Validacao

* `NODE_ENV` deve ser `development`, `test` ou `production`.
* `PORT` deve ser um inteiro entre `1` e `65535`.
* `DATABASE_URL` deve ser uma URL `postgresql://` ou `postgres://`.
* `REDIS_URL` deve ser uma URL `redis://` ou `rediss://`.
* `CORS_ORIGIN` deve conter origins `http://` ou `https://`.
* `CORS_ORIGIN=*` nao e permitido em production.
* `JWT_SECRET` e `JWT_REFRESH_SECRET` sao obrigatorios.
* Em production, JWT secrets devem ter pelo menos 32 caracteres.
* Em production, JWT secrets default, development, example ou change-me sao bloqueados.
* Em production, `JWT_REFRESH_SECRET` deve ser diferente de `JWT_SECRET`.

## Defaults

Defaults existem apenas para reduzir atrito em desenvolvimento:

| Variavel | Default development |
| --- | --- |
| `NODE_ENV` | `development` |
| `PORT` | `4000` |
| `HOST` | `0.0.0.0` |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `BCRYPT_ROUNDS` | `10` |
| `LOG_LEVEL` | `info` |
| `LOG_FILE` | `logs/app.log` |
| `SWAGGER_PATH` | `/api-docs` |

Em production, variaveis criticas devem ser declaradas explicitamente pelo ambiente.

## Docker Compose

O Compose atual injeta:

```yaml
NODE_ENV: production
PORT: 4000
HOST: 0.0.0.0
DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public
REDIS_URL: ${REDIS_URL}
JWT_SECRET: ${JWT_SECRET}
JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
CORS_ORIGIN: ${CORS_ORIGIN}
```

Importante:

* `localhost` e usado para Node/Prisma rodando fora do Docker.
* `postgres` e `redis` sao nomes de servico dentro da Docker network.
* Nao use secrets do `.env.example` em production.
* Nao versionar `.env` com valores reais.

## Falhas Seguras

Mensagens de erro mostram apenas nomes de variaveis e regras quebradas.
Valores e secrets nunca sao impressos pela camada de validacao.
