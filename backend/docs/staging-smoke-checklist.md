# FINQZ PRO Backend - Staging Smoke Checklist

Checklist operacional para validar o backend FINQZ PRO em staging ou producao antes de liberar uso real.

## 1. Pre-requisitos

- [ ] Docker ativo na maquina ou ambiente de execucao.
- [ ] PostgreSQL ativo e acessivel pela API.
- [ ] Redis ativo e acessivel pela API.
- [ ] Envs obrigatorias configuradas:
  - [ ] `DATABASE_URL`
  - [ ] `JWT_SECRET`
  - [ ] `REDIS_URL`
  - [ ] `CORS_ORIGIN`
- [ ] Migrations aplicadas no banco alvo.
- [ ] Imagem Docker da API buildada.

## 2. Build Checks

Executar a partir da raiz do backend.

- [ ] `npm run typecheck`
- [ ] `npx prisma validate`
- [ ] `npm run build`
- [ ] `docker build -t finqz-pro-api:local .`
- [ ] `docker compose config`

Resultado esperado:

- [ ] TypeScript sem erros.
- [ ] Prisma schema valido.
- [ ] Build gera `dist/`.
- [ ] Dockerfile builda a imagem local.
- [ ] Compose renderiza configuracao valida.

## 3. Runtime Checks

- [ ] Container da API sobe com `NODE_ENV=production`.
- [ ] API escuta em `0.0.0.0:4000`.
- [ ] `GET /health` retorna `success: true`.
- [ ] `GET /ready` retorna `database: connected`.
- [ ] `GET /ready` retorna HTTP 200 quando PostgreSQL esta disponivel.
- [ ] Encerramento com `SIGTERM` ou `SIGINT` fecha HTTP server e conexao com banco.

## 4. Auth Checks

- [ ] Login admin executado com credenciais validas.
- [ ] JWT emitido no login.
- [ ] `accessToken` presente na resposta.
- [ ] Rota protegida aceita token valido.
- [ ] Rota protegida sem token retorna HTTP 401.
- [ ] Token invalido ou expirado retorna HTTP 401.

## 5. Audit Checks

- [ ] `GET /api/v1/audit/logs` responde com token valido.
- [ ] `GET /api/v1/audit/stats` responde com token valido.
- [ ] Filtros por data funcionam.
- [ ] Tenant isolation preservado nos resultados.
- [ ] Campos operacionais aparecem corretamente:
  - [ ] `description`
  - [ ] `category`
  - [ ] `severity`
  - [ ] `icon`

## 6. Security Checks

- [ ] Security headers presentes nas respostas HTTP.
- [ ] `CORS_ORIGIN` em producao nao usa wildcard.
- [ ] Rate limit ativo em rotas `/api/v1/*`.
- [ ] `/health` fora do rate limit.
- [ ] `/ready` fora do rate limit.
- [ ] Secrets nao aparecem nos logs:
  - [ ] senha
  - [ ] token
  - [ ] authorization header
  - [ ] cookies
  - [ ] JWT secrets

## 7. Docker Checks

- [ ] API expoe somente a porta `4000`.
- [ ] PostgreSQL fica interno no compose, sem porta publicada no host.
- [ ] Redis fica interno no compose, sem porta publicada no host.
- [ ] `.dockerignore` presente no backend.
- [ ] `.dockerignore` nao envia `.env`, `node_modules`, `dist`, `logs` ou `uploads`.
- [ ] `.gitignore` protege `.env` e artefatos locais.
- [ ] Compose usa network interna para comunicacao entre API, PostgreSQL e Redis.

## 8. Go/No-Go

### Aprovado

Liberar staging/producao somente se todos os criterios abaixo forem verdadeiros:

- [ ] Build checks passaram.
- [ ] Container sobe em `NODE_ENV=production`.
- [ ] `/health` retorna sucesso.
- [ ] `/ready` confirma banco conectado.
- [ ] Login admin emite JWT valido.
- [ ] Rotas protegidas aceitam token valido.
- [ ] Rotas protegidas rejeitam ausencia de token com HTTP 401.
- [ ] Audit logs e stats respondem com tenant isolation.
- [ ] CORS esta restrito a origens esperadas.
- [ ] Rate limit esta ativo nas rotas de API.
- [ ] Secrets nao aparecem nos logs.
- [ ] PostgreSQL e Redis nao estao expostos externamente no compose.

### Bloqueado

Bloquear release se qualquer item abaixo ocorrer:

- [ ] TypeScript falha.
- [ ] Prisma schema invalido.
- [ ] Build da API falha.
- [ ] Imagem Docker nao builda.
- [ ] Container nao inicia em `NODE_ENV=production`.
- [ ] Env obrigatoria ausente.
- [ ] Migration pendente ou banco fora de sincronia.
- [ ] `/health` falha.
- [ ] `/ready` nao conecta ao banco.
- [ ] Login admin falha sem causa conhecida.
- [ ] Rota protegida aceita request sem token.
- [ ] Dados de outro tenant aparecem na resposta.
- [ ] CORS usa wildcard em producao.
- [ ] Secrets, tokens, cookies ou senhas aparecem nos logs.
- [ ] PostgreSQL ou Redis expostos no host sem necessidade operacional aprovada.
