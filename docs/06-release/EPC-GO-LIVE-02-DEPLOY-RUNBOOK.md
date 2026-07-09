# EPC-GO-LIVE-02 - Deploy Runbook Sequencial

Base oficial:

- [EPC-RELEASE-READINESS-AUDIT](./EPC-RELEASE-READINESS-AUDIT.md)
- [EPC-GO-LIVE-01-OPERATIONAL-CHECKLIST](./EPC-GO-LIVE-01-OPERATIONAL-CHECKLIST.md)

## 1. Resumo Executivo

### Objetivo do runbook

Executar o Go-Live do FINQZ PRO Enterprise de forma sequencial, controlada e auditavel, reduzindo ambiguidade na operacao e deixando claros os pontos de parada, rollback e validacao final.

### Escopo

- infraestrutura;
- ambiente;
- banco;
- build;
- deploy;
- smoke tests;
- decisao Go/No-Go;
- estabilizacao pos go-live.

### Premissas

- o checklist [EPC-GO-LIVE-01-OPERATIONAL-CHECKLIST](./EPC-GO-LIVE-01-OPERATIONAL-CHECKLIST.md) esta aprovado;
- o runtime oficial unico e `backend/src`;
- a superficie oficial do backend e `/api/v1/*`;
- frontend e backend passaram em build e testes;
- existe plano de rollback aprovado.

### Restricoes

- nao alterar codigo nesta etapa;
- nao alterar banco nesta etapa;
- nao alterar infraestrutura nesta etapa;
- nao executar deploy real nesta etapa;
- nao avançar para producao sem smoke e Go/No-Go aprovados.

### Critério de sucesso

- todas as fases executadas na ordem;
- pontos de parada observados;
- smoke tests validados;
- ata preenchida;
- decisao final registrada;
- ambiente apto para simulacao de staging e posterior producao.

## Estrutura Padronizada

- Objetivo
- Escopo
- Premissas
- Responsáveis
- Entradas
- Saídas
- Fluxo
- Checklists
- Evidências
- Critérios de aprovação
- Critérios de parada
- Rollback
- Encerramento
- Referências

## Documentos Relacionados

- [EPC-GO-LIVE-01-OPERATIONAL-CHECKLIST](./EPC-GO-LIVE-01-OPERATIONAL-CHECKLIST.md)
- [EPC-GO-LIVE-03-STAGING-DEPLOY-PLAYBOOK](./EPC-GO-LIVE-03-STAGING-DEPLOY-PLAYBOOK.md)
- [EPC-GO-LIVE-03A-AUDIT-TRAIL-STANDARD](./EPC-GO-LIVE-03A-AUDIT-TRAIL-STANDARD.md)
- [EPC-GO-LIVE-03B-STAGING-EVIDENCE-TEMPLATE](./EPC-GO-LIVE-03B-STAGING-EVIDENCE-TEMPLATE.md)
- [EPC-RELEASE-READINESS-AUDIT](./EPC-RELEASE-READINESS-AUDIT.md)

---

## 2. Papéis e Responsáveis

| Papel | Responsabilidade |
| --- | --- |
| Responsável técnico | Validar build, deploy, logs, runtime e critério técnico de aceite. |
| Responsável infraestrutura | Validar VPS, Docker, Nginx, DNS, SSL/TLS, firewall e runtime de edge. |
| Responsável banco | Validar backup, restore, Prisma migrations, seed e conexao. |
| Responsável validação funcional | Validar login, sessão, rotas principais, CRM e smoke tests. |
| Responsável go/no-go | Aprovar ou bloquear a publicacao com base nos sinais tecnicos e funcionais. |

---

## 3. Ordem Sequencial de Execução

## Fase 0 - Pré-condições

### Objetivo

Garantir que o deploy inicia somente com a base certa e sem pendencias escondidas.

### Dependências

- branch correta;
- ultimo commit identificado;
- checklist EPC-GO-LIVE-01 aprovado;
- janela de deploy definida;
- rollback aprovado;
- backup aprovado.

### Ação

1. Confirmar branch e commit.
2. Confirmar aprovação do checklist operacional.
3. Confirmar janela de deploy.
4. Confirmar backup e rollback.
5. Confirmar aprovacoes dos responsaveis.

### Critério de parada

- se qualquer pre-condicao falhar, a execucao nao avanca.

---

## Fase 1 - Infraestrutura

### Objetivo

Garantir que o ambiente fisico/virtual e o edge estejam operacionais.

### Itens

- VPS;
- Docker;
- Docker Compose;
- Nginx;
- dominio;
- DNS;
- SSL/TLS;
- firewall;
- timezone;
- NTP.

### Sequencia

1. Validar acesso da VPS.
2. Validar Docker e Docker Compose.
3. Validar Nginx e reverse proxy.
4. Validar DNS do dominio.
5. Validar certificado SSL/TLS.
6. Validar firewall e portas.
7. Validar timezone e sincronizacao NTP.

### Critério de parada

- qualquer falha de rede, edge, certificado, porta ou sincronismo interrompe a execucao.

---

## Fase 2 - Ambiente

### Objetivo

Garantir que as variaveis e segredos estao prontos para execucao controlada.

### Itens

- `backend/.env.production`;
- variaveis frontend;
- secrets;
- `DATABASE_URL`;
- JWT;
- integracoes;
- validacao de variaveis obrigatorias.

### Sequencia

1. Conferir `backend/.env.production` ou runbook equivalente.
2. Conferir variaveis do frontend.
3. Conferir `DATABASE_URL` e `DIRECT_URL`.
4. Conferir `JWT_SECRET` e `JWT_REFRESH_SECRET`.
5. Conferir integracoes externas.
6. Validar variaveis obrigatorias via runtime.

### Critério de parada

- variavel critica ausente, invalida ou insegura bloqueia a execucao.

---

## Fase 3 - Banco

### Objetivo

Garantir que o banco esteja consistente e que a migracao seja reversivel.

### Itens

- backup;
- teste de restore;
- `prisma generate`;
- `prisma migrate deploy`;
- seed inicial;
- tenant inicial;
- usuário administrador.

### Sequencia

1. Confirmar backup recente.
2. Confirmar restore em ambiente controlado.
3. Executar `prisma generate`.
4. Executar `prisma migrate deploy`.
5. Executar seed inicial, se aplicavel.
6. Validar tenant inicial.
7. Validar usuario administrador.

### Critério de parada

- falha de migration, seed ou restore interrompe o deploy.

---

## Fase 4 - Build

### Objetivo

Validar que o artefato candidato ao deploy e consistente.

### Itens

- `npm run build`;
- `npm test`;
- `cd backend && npm run build`;
- `cd backend && npm test`;
- Docker build;
- versionamento/tag.

### Sequencia

1. Rodar build frontend.
2. Rodar testes frontend.
3. Rodar build backend.
4. Rodar testes backend.
5. Executar Docker build.
6. Registrar tag/versao.

### Critério de parada

- qualquer falha de build, teste ou imagem invalida a janela.

---

## Fase 5 - Deploy

### Objetivo

Subir o novo artefato com o menor risco possivel.

### Itens

- pull da imagem/código;
- `docker compose up`;
- restart controlado;
- logs;
- health;
- readiness;
- metrics.

### Sequencia

1. Publicar/obter a imagem correta.
2. Subir o ambiente via Docker Compose.
3. Executar restart controlado, se necessário.
4. Checar logs em tempo real.
5. Validar `/health`.
6. Validar `/ready`.
7. Validar `/metrics`.

### Critério de parada

- falha em health, readiness, metrics ou erro 5xx critico deve parar a liberacao.

---

## Fase 6 - Smoke Tests

### Objetivo

Validar o comportamento essencial do produto pos-deploy.

### Itens

- login;
- sessão;
- refresh token;
- usuários;
- clientes;
- parceiros;
- oportunidades;
- pipelines;
- master catalog;
- simulação;
- RBAC;
- tenant;
- auditoria;
- health.

### Sequencia

1. Validar login.
2. Validar sessão.
3. Validar refresh token.
4. Validar telas e rotas principais.
5. Validar permissões e escopo de tenant.
6. Validar auditoria e health.

### Critério de parada

- falha em login, tenant, RBAC ou qualquer fluxo central interrompe o Go-Live.

---

## Fase 7 - Go/No-Go

### Objetivo

Tomar a decisão final com base em risco e evidencias.

### Critérios

| Severidade | Condição | Decisão |
| --- | --- | --- |
| P0 | migration falhou, login falhou, tenant isolation falhou, RBAC falhou, 5xx critico, health/readiness failing, rollback ausente | NO GO |
| P1 | TLS ausente, backup nao validado, smoke incompleto, env critica ausente | GO WITH RESTRICTIONS |
| P2 | melhorias nao bloqueantes, warnings tecnicos, refinamentos de monitoramento | GO WITH RESTRICTIONS |

### Saída esperada

- decisao registrada;
- ata assinada;
- responsavel de Go/No-Go identificado.

---

## Fase 8 - Pós Go-Live

### Objetivo

Estabilizar a operacao apos a liberacao.

### Janelas de monitoramento

- 2 horas;
- 24 horas;
- 72 horas.

### Itens de monitoramento

- health;
- readiness;
- logs de erro;
- latencia;
- auth;
- RBAC;
- tenant isolation;
- banco;
- Redis;
- volume de 5xx.

### Plano de incidentes

1. Identificar incidente.
2. Classificar severidade.
3. Acionar responsavel.
4. Avaliar rollback.
5. Registrar causa e resolucao.

### Checklist de estabilizacao

- [ ] sem erro sistemico de login;
- [ ] sem falha de health/readiness;
- [ ] sem bloqueio de tenant ou RBAC;
- [ ] sem 5xx persistente;
- [ ] sem degradacao grave de performance;
- [ ] sem backlog de incidentes abertos.

---

## 4. Critérios de Parada

Parar imediatamente a execucao se ocorrer:

- falha em migration;
- falha em login;
- falha em tenant isolation;
- falha em RBAC;
- erro 5xx critico;
- health/readiness failing;
- ausencia de rollback aprovado.

Regra operacional:

- se um criterio de parada ocorrer em qualquer fase, interromper a execucao e voltar para analise.

---

## 5. Rollback

### Objetivo

Restaurar o ambiente para o ultimo estado seguro validado.

### Passo a passo

1. Interromper o trafego novo.
2. Reverter a imagem para a versao anterior.
3. Reverter o codigo para o commit anterior, se necessario.
4. Reverter a migration somente se houver estrategia segura e aprovada.
5. Restaurar backup do banco, se houver necessidade.
6. Reverter DNS/proxy, se o problema for de edge.
7. Confirmar health/readiness do ambiente anterior.
8. Confirmar retorno dos fluxos criticos.

### Observações de banco

- rollback de banco deve ser feito somente com plano aprovado;
- em caso de migracao irreversivel, a estrategia prioriza restore de backup e re-publicacao da versao anterior.

---

## 6. Comandos Sugeridos

### Validar branch e commit

```bash
git branch --show-current
git log -1 --oneline
```

### Validar build e testes

```bash
npm run build
npm test
cd backend && npm run build
cd backend && npm test
```

### Gerar Prisma e aplicar migration

```bash
cd backend && npm run db:generate
cd backend && npm run db:migrate:deploy
```

### Subir Docker Compose

```bash
cd backend && docker compose up -d
```

### Checar logs

```bash
cd backend && docker compose logs -f api
```

### Checar health

```bash
curl http://127.0.0.1:4000/health
curl http://127.0.0.1:4000/ready
curl http://127.0.0.1:4000/metrics
```

### Checar portas

```bash
netstat -ano | findstr :4000
netstat -ano | findstr :80
netstat -ano | findstr :443
```

### Reiniciar serviços

```bash
cd backend && docker compose restart api nginx
```

### Tag/versao

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

---

## 7. Ata de Execução

Preencher ao final da execucao:

| Campo | Valor |
| --- | --- |
| Data | ____________________ |
| Versão | ____________________ |
| Commit | ____________________ |
| Responsável | ____________________ |
| Horário início | ____________________ |
| Horário fim | ____________________ |
| Status | ____________________ |
| Incidentes | ____________________ |
| Rollback executado | Sim / Não |
| Decisão final | ____________________ |

Campos complementares recomendados:

- ambiente;
- janela de deploy;
- links de logs;
- links de evidencias de smoke;
- aprovacao de go/no-go.

---

## 8. Veredito Final

O runbook foi definido para permitir uma simulacao de staging controlada antes da publicacao real.

### Veredito

- **READY FOR STAGING DEPLOY SIMULATION**
