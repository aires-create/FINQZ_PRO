# EPC-INFRA-03 - Provisioning Execution Checklist

## 1. Objetivo

Transformar o plano de gaps de infraestrutura em um checklist operacional de provisionamento controlado para staging, com comandos, ordem de execução, validações, evidências e critérios de parada.

Este documento não executa provisionamento real. Ele padroniza a execução para que a preparação da VPS e do edge seja repetível, auditável e segura.

## 2. Escopo

Inclui:

- auditoria inicial da VPS;
- segurança base;
- Docker;
- Nginx;
- HTTPS/TLS;
- ambiente;
- banco;
- aplicação;
- smoke tests;
- evidências EV/CP;
- critérios de parada;
- rollback.

## 3. Premissas

- A VPS de staging já existe ou será provisionada fora deste documento.
- O domínio ou subdomínio de staging já foi definido.
- Há acesso SSH com usuário administrativo.
- Os segredos obrigatórios já foram aprovados pelo responsável de segurança.
- O commit/branch da release já foi identificado.
- Um plano de rollback está disponível antes de qualquer mudança.

## 4. Responsáveis

| Papel | Responsabilidade |
| --- | --- |
| Infraestrutura | Validar VPS, firewall, SSH, NTP, Docker, Nginx, DNS e TLS. |
| Banco | Validar PostgreSQL/Supabase, backup, restore, Prisma migrate deploy e seed. |
| Backend | Validar runtime Fastify, health/readiness/metrics e variáveis do backend. |
| Frontend | Validar build, API URL pública e smoke tests de interface. |
| Segurança | Validar SSH, secrets, firewall, TLS e hardening base. |
| Go/No-Go | Aprovar cada fase e a liberação para a próxima etapa. |

## 5. Entradas

- acesso SSH à VPS;
- usuário com sudo;
- domínio/subdomínio definido;
- DNS apontável;
- `DATABASE_URL` disponível;
- secrets definidos;
- branch/commit de release identificado;
- rollback planejado;
- checklist de release aprovado;
- imagem/código de referência para staging.

## 6. Saídas

- VPS validada;
- edge Nginx validado;
- HTTPS/TLS validado;
- ambiente materializado;
- banco preparado;
- aplicação construída;
- smoke tests aprovados;
- evidências registradas;
- decisão final de staging.

## 7. Fluxo

1. Validar a VPS e a base de segurança.
2. Validar Docker e Nginx.
3. Validar DNS e HTTPS/TLS.
4. Validar variáveis de ambiente.
5. Validar banco, backup e migration.
6. Construir e subir a aplicação.
7. Executar health, readiness e metrics.
8. Executar smoke tests.
9. Registrar evidências EV/CP.
10. Aprovar ou interromper.

## 8. Checklist por fase

### 8.1 Pré-condições

| Item | Checklist | Critério de aprovação |
| --- | --- | --- |
| SSH | Acesso SSH funciona com usuário autorizado | Conecta sem erro e com chave válida |
| sudo | Usuário possui sudo | `sudo -l` retorna permissões esperadas |
| Domínio | Domínio/subdomínio definido | FQDN registrado e aprovado |
| DNS | DNS apontável | Registro A/CNAME configurado ou pronto |
| Secrets | Secrets definidos | Variáveis críticas aprovadas e prontas |
| DATABASE_URL | Disponível | URL válida e compatível com PostgreSQL |
| Branch/commit | Release identificada | Commit hash e branch registrados |
| Rollback | Planejado | Estratégia de rollback documentada |

### 8.2 Auditoria inicial da VPS

#### Comandos sugeridos

```bash
uname -a
cat /etc/os-release
lscpu
free -h
df -h
swapon --show
timedatectl
ss -tulpn
whoami
sudo -l
```

#### Checklist

- Sistema operacional identificado.
- CPU, memória, disco e swap validados.
- Timezone confirmado.
- NTP sincronizado.
- Portas abertas mapeadas.
- Usuário atual e privilégios sudo confirmados.

#### Critério de parada

- SSH instável.
- Usuário sem sudo quando requerido.
- Host inacessível.
- Time sync ou timezone inconsistentes.

### 8.3 Segurança base

#### Checklist

- SSH configurado e acessível.
- UFW ou firewall equivalente ativo.
- Fail2ban instalado ou validado quando aplicável.
- Usuário `deploy` existente quando a estratégia exigir conta não-root.
- Autenticação por chave SSH priorizada.
- Senha desabilitada se o padrão de hardening exigir.

#### Comandos sugeridos

```bash
sudo ufw status verbose
sudo systemctl status ssh
sudo systemctl status fail2ban
sudo journalctl -u fail2ban --no-pager -n 50
```

#### Critério de parada

- Firewall bloqueando o acesso necessário.
- SSH instável ou inseguro.
- Fail2ban indisponível quando exigido pela política.

### 8.4 Docker

#### Checklist

- Docker instalado.
- Docker Compose instalado.
- Versão validada.
- Permissões válidas para o usuário de operação.
- Networks existentes e corretas.
- Volumes disponíveis e persistentes.

#### Comandos sugeridos

```bash
docker --version
docker compose version
docker info
docker network ls
docker volume ls
```

#### Critério de parada

- Docker indisponível.
- Docker Compose incompatível.
- Network/volume ausente ou corrompido.

### 8.5 Nginx

#### Checklist

- Nginx instalado.
- Configuração válida.
- Reverse proxy para frontend e backend ativo.
- Headers configurados.
- Compressão validada quando aplicável.
- Reload seguro sem quebrar o serviço.

#### Comandos sugeridos

```bash
nginx -v
sudo nginx -t
sudo systemctl reload nginx
sudo journalctl -u nginx --no-pager -n 50
```

#### Critério de parada

- Configuração inválida.
- Proxy sem rota funcional.
- Reload inseguro ou falho.

### 8.6 HTTPS / TLS

#### Checklist

- Domínio resolvendo para a VPS.
- Certbot ou provedor equivalente disponível.
- Let’s Encrypt emitido com sucesso.
- Renovação automática validada.
- Redirect HTTP -> HTTPS ativo.
- HSTS habilitado apenas quando apropriado.

#### Comandos sugeridos

```bash
curl -I http://<dominio>/health
curl -I https://<dominio>/health
sudo certbot certificates
sudo systemctl list-timers | findstr certbot
```

#### Critério de parada

- Certificado inválido.
- Renovação ausente.
- HTTPS sem redirecionamento seguro quando exigido.

### 8.7 Ambiente

#### Checklist

- `backend/.env.production` preparado.
- Variáveis obrigatórias presentes.
- JWT secrets válidos.
- `DATABASE_URL` definida.
- URLs públicas corretas.
- Integrações externas validadas quando ativadas.
- SMTP/storage/API keys configuradas apenas se aplicáveis.

#### Variáveis críticas

- `NODE_ENV`
- `APP_ENV`
- `PORT`
- `HOST`
- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGIN`

#### Critério de parada

- Variável obrigatória ausente.
- Secret inseguro.
- `CORS_ORIGIN` incorreta para staging/prod.

### 8.8 Banco

#### Checklist

- Conexão PostgreSQL/Supabase validada.
- Backup executado antes do deploy.
- Restore testado quando aplicável.
- Prisma generate executado.
- Prisma migrate deploy executado.
- Seed inicial validado quando necessário.
- Tenant inicial e usuário admin confirmados.

#### Comandos sugeridos

```bash
cd backend
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
```

#### Critério de parada

- Migration falhou.
- Backup não disponível.
- Restore não testado.
- Conexão com banco instável.

### 8.9 Aplicação

#### Checklist

- Frontend build executado.
- Backend build executado.
- Docker Compose build executado.
- Docker Compose up executado.
- Logs sem erro crítico.
- Health positivo.
- Readiness positivo.
- Metrics acessível.

#### Comandos sugeridos

```bash
npm run build
npm test
cd backend && npm run build
cd backend && npm run test
docker compose build
docker compose up -d
docker compose logs -f
```

#### Critério de parada

- Build falhou.
- Testes falharam.
- Container não sobe.
- Health/readiness falharam.

### 8.10 Smoke tests staging

#### Checklist

- Login.
- Sessão.
- Refresh token.
- Usuários.
- Parceiros.
- Oportunidades.
- Pipelines.
- Master catalog.
- Simulação.
- RBAC.
- Tenant isolation.
- Auditoria.

#### Comandos sugeridos

```bash
curl -f http://<host>/health
curl -f http://<host>/ready
curl -f http://<host>/metrics
```

#### Critério de parada

- Login falhou.
- Sessão falhou.
- RBAC falhou.
- Tenant isolation falhou.
- Qualquer smoke crítico falhou.

## 9. Evidências

### EV / CP mapping

| EV ID | Fase | Evidência |
| --- | --- | --- |
| EV-001 | Aplicação | Build frontend |
| EV-002 | Aplicação | Testes frontend |
| EV-003 | Aplicação | Build backend |
| EV-004 | Aplicação | Testes backend |
| EV-005 | Docker | Docker build / compose validation |
| EV-006 | Nginx | Config test / reload validation |
| EV-007 | HTTPS | TLS / Let’s Encrypt / redirect evidence |
| EV-008 | Banco | Prisma migrate deploy / backup evidence |
| EV-009 | Backend | Health / readiness / metrics evidence |
| EV-010 | Smoke tests | Login / RBAC / tenant / domain smoke evidence |

### CP mapping

| CP ID | Checkpoint | Approval required |
| --- | --- | --- |
| CP-001 | Pré-condições | Go/No-Go |
| CP-002 | VPS audit | Go/No-Go |
| CP-003 | Segurança base | Go/No-Go |
| CP-004 | Docker | Go/No-Go |
| CP-005 | Nginx | Go/No-Go |
| CP-006 | HTTPS/TLS | Go/No-Go |
| CP-007 | Ambiente | Go/No-Go |
| CP-008 | Banco | Go/No-Go |
| CP-009 | Aplicação | Go/No-Go |
| CP-010 | Smoke tests | Go/No-Go |

## 10. Critérios de aprovação

- Cada fase deve produzir evidência associada ao EV correspondente.
- Não avançar se o item crítico da fase falhar.
- Aprovação exige responsável nomeado, horário e observação registrada.

## 11. Critérios de parada

Parar imediatamente se ocorrer qualquer um dos eventos abaixo:

- SSH instável;
- firewall bloqueando acesso operacional;
- Docker indisponível;
- Nginx inválido;
- TLS falhou;
- migration falhou;
- health ou readiness falhou;
- login falhou;
- RBAC falhou;
- tenant isolation falhou;
- rollback indisponível.

## 12. Rollback

### Rollback de código

1. Reverter para commit/branch anterior validado.
2. Confirmar build e smoke test da versão anterior.

### Rollback de imagem

1. Retornar para a imagem anterior aprovada.
2. Reexecutar `docker compose up -d`.
3. Validar health e readiness.

### Rollback de banco

1. Parar escrita.
2. Restaurar backup validado.
3. Rodar verificação de consistência.
4. Confirmar tenant e RBAC.

### Rollback de Nginx

1. Reverter configuração.
2. Validar `nginx -t`.
3. Reload seguro.

### Rollback de DNS

1. Reverter apontamento se necessário.
2. Confirmar propagação.
3. Validar retorno ao endpoint anterior.

## 13. Comandos sugeridos

### Branch e commit

```bash
git branch --show-current
git rev-parse HEAD
git status --short
```

### Build e testes

```bash
npm run build
npm test
cd backend && npm run build
cd backend && npm run test
```

### Prisma

```bash
cd backend
npm run db:generate
npm run db:migrate:deploy
```

### Docker Compose

```bash
docker compose build
docker compose up -d
docker compose ps
docker compose logs -f
```

### Health e portas

```bash
curl -f http://127.0.0.1:4000/health
curl -f http://127.0.0.1:4000/ready
curl -f http://127.0.0.1:4000/metrics
ss -tulpn
```

### Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo journalctl -u nginx --no-pager -n 50
```

## 14. Veredito final

**READY FOR CONTROLLED STAGING PROVISIONING**

This checklist is ready to be used for the controlled staging provisioning phase, with all critical gaps mapped and ordered for execution.

