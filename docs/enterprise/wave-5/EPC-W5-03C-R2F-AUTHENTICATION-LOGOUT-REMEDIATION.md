# EPC-W5-03C-R2F - Authentication Logout Remediation

## Veredito
PASS_WITH_FINDINGS

## Causa raiz confirmada
O logout anterior removia apenas parte do estado de sessão. O fluxo de UI permanecia com `AuthProvider.user` e estado de navegação/guard vivos, enquanto o HTTP client ainda podia continuar usando token em memória até o reload. Isso permitia que a SPA continuasse em rotas protegidas após o logout.

## Fluxo corrigido
1. `finqzAuth.signOut()` tenta o `POST /api/v1/auth/logout`.
2. A limpeza local idempotente roda em `finally`, mesmo se a chamada falhar.
3. Tokens de access e refresh são removidos.
4. `user`, `isAuthenticated`, `userPermissions` e caches protegidos do store são limpos.
5. O `AuthProvider` escuta `AUTH_LOGOUT_EVENT`, faz `setUser(null)` e navega para `/login` com `replace`.
6. `AuthProvider.logout()` apenas aguarda `finqzAuth.signOut()`.
7. O guard passa a reagir imediatamente ao estado não autenticado.
8. O client HTTP deixa de anexar `Authorization` depois da limpeza.

## Autoridade única de navegação
- Logout manual chega ao mesmo fluxo central porque `AuthProvider.logout()` apenas executa `finqzAuth.signOut()`, e o `AUTH_LOGOUT_EVENT` centraliza `setUser(null)` + `navigate("/login", { replace: true })`.
- Falha de rede no logout também termina no mesmo listener porque `clearLocalAuthState()` roda em `finally`.
- Refresh inválido termina no mesmo listener porque a invalidação da sessão dispara `auth:error`, que aciona o fluxo de logout.
- `auth:error` também converge para o mesmo fluxo porque o handler global chama `logout()`, que por sua vez cai no mesmo `AUTH_LOGOUT_EVENT`.

## Arquivos alterados
- `src/auth/logout.ts`
- `src/auth/finqzAuth.ts`
- `src/auth/AuthProvider.tsx`
- `src/auth/guards.tsx`
- `src/layouts/MainLayout.tsx`
- `src/hooks/useApiErrorHandler.tsx`
- `src/api/http.ts`
- `src/App.tsx`
- `src/auth/finqzAuth.test.ts`
- `src/auth/logout-flow.test.tsx`
- `src/api/http.test.ts`

## Tenant
- O tenant atual não existe em um slice separado do store.
- A evidência no código é que o tenant fica apenas dentro de `user.tenant_id` e `user.tenantName` em `src/store/index.ts`.
- Como `clearLocalAuthState()` limpa `user`, o tenant é removido junto com a sessão.

## Testes executados
- `npm run test -- --run src/auth/finqzAuth.test.ts src/auth/logout-flow.test.tsx src/api/http.test.ts`
- `npm run test -- --run src/auth src/api`
- `npx tsc -p tsconfig.json --noEmit`
- `npm run build`

## Resultados
- Logout com sucesso limpa a sessão local.
- Falha de rede no logout também limpa localmente.
- Logout é idempotente.
- Refresh 400 limpa a sessão local, remove tokens e emite `auth:error` uma única vez.
- 400 em rota comum não encerra a sessão global.
- Rotas protegidas redirecionam para `/login`.
- Requests novas após logout não enviam `Authorization`.
- Erro de refresh 401 continua limpando sessão e disparando redirecionamento sem loop.
- Login válido continua funcionando.
- Sessão autenticada continua funcionando.

## Riscos residuais
- A revogação server-side do access token continua fora do escopo desta rodada.
- Caches externos fora do store frontend não foram alterados porque não foram identificados no runtime atual.

## Gates
- R2F-G01: PASS
- R2F-G02: STATIC_AND_TEST_CONFIRMED
- R2F-G03: STATIC_AND_TEST_CONFIRMED
- R2F-G04: STATIC_AND_TEST_CONFIRMED_WITH_RESIDUAL_RISK
- R2F-G05: STATIC_AND_TEST_CONFIRMED
- R2F-G06: STATIC_AND_TEST_CONFIRMED
- R2F-G07: STATIC_AND_TEST_CONFIRMED
- R2F-G08: REGRESSION_TEST_CONFIRMED
- R2F-G09: PASS
- R2F-G10: PENDING_HML_REVALIDATION

## Plano de revalidação HML
1. Validar login, navegação protegida e logout no ambiente HML.
2. Confirmar que `POST /api/v1/auth/logout` responde 200.
3. Confirmar que requests subsequentes não incluem `Authorization`.
4. Confirmar que um refresh 400/401 leva a `/login` sem loop.
5. Confirmar que reload pós-logout ainda cai no login por ausência de sessão.
