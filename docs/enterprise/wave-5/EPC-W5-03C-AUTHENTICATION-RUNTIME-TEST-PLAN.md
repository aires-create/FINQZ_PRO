# EPC-W5-03C Authentication Runtime Test Plan

**Projeto:** FINQZ PRO Enterprise
**Ambiente:** HML
**Modo:** READ_ONLY_DISCOVERY
**STATIC_SOURCE:** `C:\Projects\FINQZ_PRO`
**STATIC_BRANCH:** `homologation/bootstrap-vps`
**STATIC_COMMIT:** `2d843dd5f29133a462622e4e24c15e9890896785`
**Data UTC:** `2026-07-21`

## Objetivo

Definir o plano de validação para autenticação, sessão, logout e redirecionamento, sem alterar código de produto e sem executar credenciais não autorizadas.

## Pré-Requisitos

- Frontend e backend acessíveis em HML.
- Credencial autorizada, se houver validação live.
- Nenhum proxy local interferindo no fluxo de auth.

## Gating

### 03C-G01 Authentication Inventory

Critério:
- `STATIC_CONFIRMED` se o inventário do fluxo de auth, sessão, store, guard e HTTP estiver reconciliado com o código.

Status atual:
- `STATIC_CONFIRMED`.

### 03C-G02 Endpoint Contract

Critério:
- `STATIC_CONFIRMED` se login, refresh, profile, logout e logout-all estiverem alinhados ao frontend.

Status atual:
- `STATIC_CONFIRMED`.

### 03C-G03 Valid Login

Critério:
- `STATIC_AND_TEST_CONFIRMED` se o login persistir `accessToken`/`refreshToken` e hidratar o usuário corretamente.

Status atual:
- `STATIC_AND_TEST_CONFIRMED`.

### 03C-G04 Invalid Login

Critério:
- `STATIC_CONFIRMED_RUNTIME_PENDING` se a trilha de erro existir, mas a prova live ainda não tiver sido executada.

Status atual:
- `STATIC_CONFIRMED_RUNTIME_PENDING`.

### 03C-G05 Authenticated Session

Critério:
- `STATIC_AND_TEST_CONFIRMED` se a sessão canônica vier de `/api/v1/auth/profile` e continuar funcional após hidratação.

Status atual:
- `STATIC_AND_TEST_CONFIRMED`.

### 03C-G06 Refresh

Critério:
- `STATIC_AND_TEST_CONFIRMED` se refresh `400/401/403` invalidar a sessão local, emitir `auth:error` uma vez e não gerar loop.

Status atual:
- `STATIC_AND_TEST_CONFIRMED`.

### 03C-G07 Expiration And Revocation

Critério:
- `STATIC_CONFIRMED_RUNTIME_PENDING` se a revogação backend estiver implementada, mas a prova live continuar pendente.

Status atual:
- `STATIC_CONFIRMED_RUNTIME_PENDING`.

### 03C-G08 Logout

Critério:
- `STATIC_AND_TEST_CONFIRMED` se logout local limpar token, store, cache protegido e redirecionar para `/login` com `replace`.

Status atual:
- `STATIC_AND_TEST_CONFIRMED`.

### 03C-G09 Cookies And Security Headers

Critério:
- `STATIC_CONFIRMED_RUNTIME_PENDING` se cookies `HttpOnly` e `SameSite=strict` estiverem presentes no contrato backend.

Status atual:
- `STATIC_CONFIRMED_RUNTIME_PENDING`.

### 03C-G10 CORS And Reverse Proxy

Critério:
- `PARTIALLY_CONFIRMED` se a política de CORS e o proxy estiverem documentados, mas a prova live não tiver sido reexecutada.

Status atual:
- `PARTIALLY_CONFIRMED`.

### 03C-G11 Rate Limiting

Critério:
- `STATIC_CONFIRMED_RUNTIME_PENDING` se o rate limit existir no bootstrap e depender de Redis.

Status atual:
- `STATIC_CONFIRMED_RUNTIME_PENDING`.

### 03C-G12 Company/Tenant Context

Critério:
- `STATIC_CONFIRMED_RUNTIME_PENDING` se tenant estiver embarcado no `user` do store e a filtragem multi-tenant existir no frontend.

Status atual:
- `STATIC_CONFIRMED_RUNTIME_PENDING`.

### 03C-G13 Persistence And Redis

Critério:
- `STATIC_CONFIRMED_RUNTIME_PENDING` se o refresh token persistir no backend e Redis sustentar rate limit/readiness.

Status atual:
- `STATIC_CONFIRMED_RUNTIME_PENDING`.

### 03C-G14 Observability

Critério:
- `PARTIALLY_CONFIRMED` se request correlation, error handling e logs existirem, mas a saúde operacional completa não tiver sido revalidada.

Status atual:
- `PARTIALLY_CONFIRMED`.

### 03C-G15 Regression

Critério:
- `STATIC_AND_TEST_CONFIRMED` se logout, auth:error, refresh 400 e rotas protegidas tiverem cobertura automatizada coerente.

Status atual:
- `STATIC_AND_TEST_CONFIRMED`.

## Plano De Execução Runtime

1. Confirmar disponibilidade de `https://api-hml.finqz.com.br/health`.
2. Confirmar disponibilidade de `https://hml.finqz.com.br/`.
3. Executar login apenas com credencial HML oficialmente autorizada, se houver.
4. Executar login inválido e confirmar resposta limpa.
5. Consultar `profile` e validar hidratação da sessão.
6. Executar refresh válido e logout.
7. Confirmar que `refresh 400` invalida a sessão local e que uma rota comum com `400` não encerra a sessão global.
8. Confirmar logs sem segredos.

## Matriz Final Dos 15 Gates

| Gate | Status Final |
|---|---|
| `03C-G01` | `STATIC_CONFIRMED` |
| `03C-G02` | `STATIC_CONFIRMED` |
| `03C-G03` | `STATIC_AND_TEST_CONFIRMED` |
| `03C-G04` | `STATIC_CONFIRMED_RUNTIME_PENDING` |
| `03C-G05` | `STATIC_AND_TEST_CONFIRMED` |
| `03C-G06` | `STATIC_AND_TEST_CONFIRMED` |
| `03C-G07` | `STATIC_CONFIRMED_RUNTIME_PENDING` |
| `03C-G08` | `STATIC_AND_TEST_CONFIRMED` |
| `03C-G09` | `STATIC_CONFIRMED_RUNTIME_PENDING` |
| `03C-G10` | `PARTIALLY_CONFIRMED` |
| `03C-G11` | `STATIC_CONFIRMED_RUNTIME_PENDING` |
| `03C-G12` | `STATIC_CONFIRMED_RUNTIME_PENDING` |
| `03C-G13` | `STATIC_CONFIRMED_RUNTIME_PENDING` |
| `03C-G14` | `PARTIALLY_CONFIRMED` |
| `03C-G15` | `STATIC_AND_TEST_CONFIRMED` |

## Comandos Seguros

- `curl -i -k https://api-hml.finqz.com.br/health`
- `curl -i -k https://api-hml.finqz.com.br/api/v1/auth/login`
- `curl -i -k https://api-hml.finqz.com.br/api/v1/auth/refresh`
- `curl -i -k https://api-hml.finqz.com.br/api/v1/auth/profile`
- `curl -i -k -X OPTIONS https://api-hml.finqz.com.br/api/v1/auth/login`

## Critérios Objetivos

- `STATIC_CONFIRMED`: evidência estática suficiente para o contrato.
- `STATIC_AND_TEST_CONFIRMED`: contrato e cobertura local coerentes com o código revisado.
- `STATIC_CONFIRMED_RUNTIME_PENDING`: a parte estática está confirmada, mas falta execução live.
- `PARTIALLY_CONFIRMED`: há confirmação parcial, porém falta prova live ou operacional.
- `FAIL`: erro funcional confirmado com evidência.
- `BLOCKED`: credencial autorizada indisponível ou acesso runtime indisponível.
