# FINQZ PRO CI/CD

Este documento descreve a estrutura de CI/CD enterprise criada para o FINQZ PRO.
Os workflows foram desenhados para validar frontend, backend, Prisma e Docker sem alterar Dockerfile, nginx, metricas, auth ou o compose de runtime.

## Workflows

### CI

Arquivo: `.github/workflows/ci.yml`

Badges prontos para README:

```md
[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)
```

Gatilhos:

- `pull_request` para `main`, `master`, `develop` e `staging`.
- `push` para `main`, `master`, `develop` e `staging`.
- `workflow_dispatch` para execucao manual.

Jobs:

- `Frontend / Vite`: instala dependencias com `npm ci`, executa o contrato de lint frontend quando `scripts.lint` existir, roda testes Vitest e valida `npm run build`.
- `Backend / TypeScript + Prisma`: instala dependencias do backend, gera Prisma Client, valida `prisma validate`, roda typecheck, lint, build e testes Vitest.
- `Docker / Compose config`: valida o modelo final do `backend/docker-compose.yml` com variaveis CI explicitas.
- `Docker / Backend image`: valida o build do Dockerfile do backend usando BuildKit e cache GitHub Actions.
- `CI / Required`: job agregador para branch protection e badge-ready status.

Fail-fast:

- Nenhum gate usa `continue-on-error`.
- Jobs possuem `timeout-minutes`.
- `docker-build` depende de backend e compose validos, evitando build inutil quando a base falha.
- `concurrency.cancel-in-progress` cancela execucoes antigas da mesma ref.
- `CI / Required` falha se qualquer gate falhar, cancelar ou for pulado.

Cache:

- Frontend usa cache npm com chave baseada em `package-lock.json`.
- Backend usa cache npm com chave baseada em `backend/package-lock.json`.
- Docker usa cache BuildKit `type=gha` com `cache-from` e `cache-to`.

### Release

Arquivo: `.github/workflows/release.yml`

Badge pronto para README:

```md
[![Release](https://github.com/OWNER/REPO/actions/workflows/release.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/release.yml)
```

Gatilhos:

- Tags `v*.*.*`.
- Execucao manual com escolha de `staging` ou `production`.

Jobs:

- `Release / Preflight`: gera artefatos frontend e backend depois de validar Prisma e build.
- `Release / Docker image`: valida a imagem Docker de release sem publicar em registry.
- `Release / Draft GitHub Release`: cria GitHub Release em draft quando uma tag `v*.*.*` e publicada ou quando a execucao manual habilita `publish_github_release`.

O workflow esta pronto para evoluir para staging/prod com ambientes protegidos, aprovadores, secrets de registry e push de imagem. A publicacao externa foi intencionalmente deixada desligada ate existirem as credenciais e politicas de deploy definitivas.

## Branch Protection

Use `CI / Required` como status obrigatorio principal.
Quando a organizacao quiser granularidade adicional, tambem pode marcar os jobs abaixo como obrigatorios:

- `Frontend / Vite`
- `Backend / TypeScript + Prisma`
- `Docker / Compose config`
- `Docker / Backend image`

## Variaveis de CI

Os workflows usam valores efemeros e nao sensiveis apenas para validacao de CI. Secrets reais de staging/prod nao devem ser adicionados ao YAML; eles devem ficar em GitHub Environments protegidos.

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `REDIS_URL`
- `CORS_ORIGIN`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`

O release preflight nao injeta secrets de auth/JWT nem Redis de runtime; ele usa somente `DATABASE_URL` efemero para validacoes Prisma/build. O CI possui dois Redis URLs nomeados por contexto: host do runner (`redis://localhost:6379`) e rede do Compose (`redis://redis:6379`).

## Validacoes Locais

Comandos usados como base dos gates:

```bash
npm run build
cd backend
npx prisma validate
docker compose config
```

Para validar o backend localmente:

```bash
cd backend
npm run typecheck
npm run lint
npm run build
npm test
```

## Proximas Expansoes

- Adicionar `scripts.lint` no frontend quando a pilha ESLint frontend for formalizada.
- Adicionar testes backend conforme os modulos ganharem cobertura automatizada.
- Habilitar push de imagem para registry privado depois de definir registry, tags imutaveis e politica de retencao.
- Criar jobs de deploy para `staging` e `production` usando GitHub Environments, aprovacao manual e secrets segregados.
