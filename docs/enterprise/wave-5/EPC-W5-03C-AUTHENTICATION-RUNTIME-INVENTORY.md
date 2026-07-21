# EPC-W5-03C Authentication Runtime Inventory

**Projeto:** FINQZ PRO Enterprise
**Ambiente:** HML
**Modo:** READ_ONLY_DISCOVERY
**STATIC_SOURCE:** `C:\Projects\FINQZ_PRO`
**STATIC_BRANCH:** `homologation/bootstrap-vps`
**STATIC_COMMIT:** `2d843dd5f29133a462622e4e24c15e9890896785`
**RUNTIME_SOURCE:** `HML brief and prior validation context; not re-executed in this pass`
**RUNTIME_BRANCH:** `homologation/bootstrap-vps`
**RUNTIME_COMMIT:** `not revalidated in this pass`
**Data UTC:** `2026-07-21`

## Resumo Executivo

O código atual mostra uma autenticação híbrida com foco em sessão token-only no frontend:

- `accessToken` e `refreshToken` vivem apenas na camada de sessão do frontend;
- o usuário autenticado, roles, permissions e `tenant_id` vivem no `user` do store;
- o logout local foi centralizado em `src/auth/logout.ts` e é idempotente;
- `AuthProvider` escuta `auth:logout` como autoridade única de navegação para `/login`;
- o cliente HTTP injeta `Authorization: Bearer <token>` apenas quando o access token existe;
- `refreshSessionTokens()` invalida a sessão local em `400/401/403` e emite `auth:error`;
- `ProtectedRoute` faz o bloqueio visual imediato quando `user` fica `null`.

O inventário abaixo está baseado no código local atual e não em uma nova execução HML.

## Arquitetura De Autenticação Encontrada

### Bootstrapping

- `AuthProvider` inicializa sessão via `finqzAuth.getSession()`, normaliza admin sistema e sincroniza o store global. [src/auth/AuthProvider.tsx:44-78]
- `AuthProvider` registra listener de `AUTH_LOGOUT_EVENT` e navega para `/login` com `replace: true` quando o logout local é disparado. [src/auth/AuthProvider.tsx:81-93]
- `clearLocalAuthState()` limpa sessão, zera o estado protegido do store e emite `auth:logout`. [src/auth/logout.ts:7-37]
- `finqzAuth.signOut()` chama o logout nativo e garante limpeza local no `finally`. [src/auth/finqzAuth.ts:233-248]

### Contrato De Sessão E Tokens

- `src/auth/session.ts` mantém somente tokens no frontend; `getCurrentUser()` e `setSessionUser()` são no-op compatíveis. [src/auth/session.ts:1-112]
- `storeSessionTokens()` grava `accessToken` e `refreshToken`; `clearSession()` remove ambos e limpa o estado em memória. [src/auth/session.ts:96-112]
- `buildRequestHeaders()` injeta `Authorization: Bearer <token>` somente quando `getAccessToken()` retorna valor. [src/api/http.ts:201-221]

### Refresh, Logout E Erros De Auth

- `refreshSessionTokens()` usa `/api/v1/auth/refresh` com `credentials: "include"`. [src/api/http.ts:282-322]
- Falhas de refresh em `400`, `401` ou `403` invalidam a sessão local. [src/api/http.ts:278-306]
- `apiRequest()` tenta refresh apenas para endpoints fora de auth control e evita loop com `skipAuthRefresh`. [src/api/http.ts:249-416]
- `handleAuthError()` e `invalidateLocalSession()` limpam sessão e disparam `auth:error` apenas na trilha de auth. [src/api/http.ts:227-276]

### Guards, Rotas E UI

- `ProtectedRoute` redireciona para `/login` com `replace` quando `user` é nulo. [src/auth/guards.tsx:70-99]
- `PublicRoute` redireciona usuário autenticado para `/app/dashboard`. [src/auth/guards.tsx:110-124]
- `useApiErrorHandler()` escuta `auth:error` e encaminha o fluxo de logout via `useAuth().logout()`. [src/hooks/useApiErrorHandler.tsx:24-104]
- O botão de saída do layout chama somente `logout()`. [src/layouts/MainLayout.tsx:430-447]

### Tenant E Permissões

- O tenant não existe como slice separado no store; ele é carregado dentro de `user.tenant_id`. [src/store/index.ts:211-235, 382-438]
- O `userPermissions` é um estado separado para cache/compatibilidade de permissões. [src/store/index.ts:330-337, 803-814]
- `useTenantFilter()` lê `user` diretamente do store para aplicar isolamento multi-tenant. [src/hooks/useTenantFilter.ts:1-35]
- `userMapper` materializa `tenant_id` e `tenantName` a partir do contrato backend. [src/auth/userMapper.ts:1-126]

### Backend Referenciado Para Inventário

- O backend mantém o contrato de auth com login, refresh, profile, logout e logout-all. [backend/src/modules/auth/auth.routes.ts:7-55]
- O refresh token é persistido no backend e rotacionado conforme contrato do serviço. [backend/src/modules/auth/service.ts:180-442]
- O middleware de auth continua exigindo `Authorization` Bearer para rotas protegidas. [backend/src/core/http/middleware.ts:188-245]

## Endpoints Confirmados

| Operação | Método | Rota | Observação |
|---|---:|---|---|
| Login | `POST` | `/api/v1/auth/login` | Retorna tokens e usuário. |
| Refresh | `POST` | `/api/v1/auth/refresh` | Aceita refresh token com cookie ativo. |
| Sessão atual | `GET` | `/api/v1/auth/profile` | Usado como sessão canônica do frontend. |
| Logout | `POST` | `/api/v1/auth/logout` | Dispara limpeza local em `finally`. |
| Logout all | `POST` | `/api/v1/auth/logout-all` | Mantido no backend para revogação ampliada. |

## Findings E Classificação

- `SOURCE_REVISION_MISMATCH`: `RESOLVED`.
- `HML_ENVIRONMENT_IDENTITY_MISMATCH`: `OPEN`, `HIGH`, `CONFLICT`.
- `NGINX_CONTAINER_HEALTHCHECK_UNHEALTHY`: `OPEN`, `MEDIUM`, `CONFLICT`.
- `CSRF_EXPLICIT_MIDDLEWARE_NOT_FOUND`: `OPEN`, `LOW`, `INFERRED`.
- `AUTH-F-02` refresh token persistido e rotacionado no backend: `CONFIRMED`.
- `TENANT_STATE_EMBEDDED_IN_USER`: `CONFIRMED`.

## Gaps E Riscos

- Esta revisão não reexecutou o HML; os pontos runtime continuam dependentes de validação externa.
- Não foi feita prova live do login/logout/refresh nesta rodada.
- A ausência de middleware CSRF explícito continua sendo um risco residual a ser observado quando cookies de auth forem exercitados.
- O tenant está embarcado em `user`; não há tenant slice separado para limpeza adicional.

## Comandos Executados

- `git rev-parse HEAD`
- `rg` em arquivos de auth, store, tenant, guard, HTTP e layout
- `Get-Content` nos arquivos principais de auth e sessão
