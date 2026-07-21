# EPC-W5-03C Authentication Findings

## Summary

O stack de autenticação do frontend está coerente com o código atual: sessão token-only, logout idempotente, tratamento de refresh com invalidação local e navegação centralizada no listener `AUTH_LOGOUT_EVENT`.

## Findings

### SOURCE_REVISION_MISMATCH

- **Classification:** `RESOLVED`
- **Severity:** `HIGH`
- **Status:** `RESOLVED`
- **Finding:** A documentação anterior apontava commits de referência diferentes do workspace atual.
- **Why it matters:** A revisão precisa apontar para o código que está realmente no repositório.
- **Evidence:** `STATIC_COMMIT=2d843dd5f29133a462622e4e24c15e9890896785`
- **Disposition:** Resolvido nesta revisão documental.

### HML_ENVIRONMENT_IDENTITY_MISMATCH

- **Classification:** `CONFLICT`
- **Severity:** `HIGH`
- **Status:** `OPEN`
- **Finding:** A identidade operacional do HML não foi reexecutada nesta passagem.
- **Why it matters:** A confirmação live continua sendo dependente do ambiente.
- **Evidence:** `Runtime not revalidated in this pass`

### NGINX_CONTAINER_HEALTHCHECK_UNHEALTHY

- **Classification:** `CONFLICT`
- **Severity:** `MEDIUM`
- **Status:** `OPEN`
- **Finding:** O healthcheck interno do Nginx permanece fora do escopo desta revisão documental.
- **Why it matters:** É um risco operacional separado da validade do contrato de auth.
- **Evidence:** `Runtime not revalidated in this pass`

### CSRF_EXPLICIT_MIDDLEWARE_NOT_FOUND

- **Classification:** `INFERRED`
- **Severity:** `LOW`
- **Status:** `OPEN`
- **Finding:** Não foi localizado middleware CSRF explícito; o fluxo atual depende de `SameSite=strict` e de Bearer token para acesso.
- **Why it matters:** O fluxo cookie-assisted de refresh/logout continua merecendo atenção.
- **Evidence:** [backend/src/modules/auth/controller.ts](C:/Projects/FINQZ_PRO/backend/src/modules/auth/controller.ts), [backend/src/modules/auth/jwt.plugin.ts](C:/Projects/FINQZ_PRO/backend/src/modules/auth/jwt.plugin.ts)

### AUTH-F-02

- **Classification:** `CONFIRMED`
- **Severity:** `MEDIUM`
- **Status:** `CONFIRMED`
- **Finding:** Refresh tokens continuam persistidos e rotacionados no backend.
- **Why it matters:** O modelo continua híbrido, não stateless-only.
- **Evidence:** [backend/src/modules/auth/service.ts](C:/Projects/FINQZ_PRO/backend/src/modules/auth/service.ts), [backend/prisma/schema.prisma](C:/Projects/FINQZ_PRO/backend/prisma/schema.prisma)

### TENANT_STATE_EMBEDDED_IN_USER

- **Classification:** `CONFIRMED`
- **Severity:** `LOW`
- **Status:** `CONFIRMED`
- **Finding:** O tenant atual não é um slice separado; ele é carregado como `user.tenant_id` e consumido diretamente pelos filtros.
- **Why it matters:** A limpeza de logout precisa zerar `user` e os caches de permissões, não um store de tenant independente.
- **Evidence:** [src/store/index.ts](C:/Projects/FINQZ_PRO/src/store/index.ts), [src/auth/userMapper.ts](C:/Projects/FINQZ_PRO/src/auth/userMapper.ts), [src/hooks/useTenantFilter.ts](C:/Projects/FINQZ_PRO/src/hooks/useTenantFilter.ts)

## Gates Already Evaluable

- `03C-G01 Authentication Inventory`
- `03C-G02 Endpoint Contract`
- `03C-G03 Valid Login`
- `03C-G05 Authenticated Session`
- `03C-G06 Refresh`
- `03C-G08 Logout`
- `03C-G15 Regression`

## Gates Still Pending Runtime

- `03C-G04 Invalid Login`
- `03C-G07 Expiration And Revocation`
- `03C-G09 Cookies And Security Headers`
- `03C-G10 CORS And Reverse Proxy`
- `03C-G11 Rate Limiting`
- `03C-G12 Company/Tenant Context`
- `03C-G13 Persistence And Redis`
- `03C-G14 Observability`

## Runtime Risks

- A prova live em HML continua fora desta rodada de revisão documental.
- O fluxo de refresh usa cookie e Bearer juntos, então o risco de CSRF deve permanecer documentado até a próxima validação operacional.
- O tenant está dentro de `user`; qualquer limpeza local deve zerar o usuário e os caches derivados.

## Static Versus Runtime Evidence

- **Static evidence:** arquivos e linhas do repositório atual.
- **Runtime evidence:** não reexecutada nesta passagem.
