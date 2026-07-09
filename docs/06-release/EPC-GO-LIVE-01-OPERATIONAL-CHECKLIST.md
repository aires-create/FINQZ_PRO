# EPC-GO-LIVE-01 - Operational Checklist

Base documental:

- [EPC-RELEASE-READINESS-AUDIT](./EPC-RELEASE-READINESS-AUDIT.md)
- Documento Mestre FINQZ PRO Enterprise

Objetivo:

Transformar a auditoria de Release Readiness em um checklist operacional executavel, para que qualquer engenheiro consiga conduzir o Go-Live com seguranca, repetibilidade e rastreabilidade.

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

- [EPC-RELEASE-READINESS-AUDIT](./EPC-RELEASE-READINESS-AUDIT.md)
- [EPC-GO-LIVE-02-DEPLOY-RUNBOOK](./EPC-GO-LIVE-02-DEPLOY-RUNBOOK.md)
- [EPC-GO-LIVE-03-STAGING-DEPLOY-PLAYBOOK](./EPC-GO-LIVE-03-STAGING-DEPLOY-PLAYBOOK.md)
- [EPC-GO-LIVE-03A-AUDIT-TRAIL-STANDARD](./EPC-GO-LIVE-03A-AUDIT-TRAIL-STANDARD.md)
- [EPC-GO-LIVE-03B-STAGING-EVIDENCE-TEMPLATE](./EPC-GO-LIVE-03B-STAGING-EVIDENCE-TEMPLATE.md)

Veredito esperado:

- **READY FOR PRODUCTION CHECKLIST**

---

## 1. Infraestrutura

Checklist:

- [ ] VPS provisionada
- [ ] Docker instalado e validado
- [ ] Docker Compose instalado e validado
- [ ] Nginx configurado
- [ ] SSL/TLS ativo
- [ ] Firewall configurado
- [ ] DNS apontando corretamente
- [ ] Reverse Proxy operante
- [ ] Portas liberadas e validadas
- [ ] Timezone configurado
- [ ] Sincronizacao NTP ativa

Evidencias esperadas:

- inventario da VPS;
- saida de `docker --version` e `docker compose version`;
- resposta de `curl` para health endpoints via edge;
- registro de DNS e certificado.

---

## 2. Ambiente

Checklist:

- [ ] `backend/.env.production` criado ou substituido por runbook operacional equivalente
- [ ] Variaveis do frontend configuradas
- [ ] JWT configurado com secrets fortes e distintos
- [ ] `DATABASE_URL` configurada
- [ ] Secrets provisionados com seguranca
- [ ] API Keys configuradas
- [ ] SMTP configurado, se aplicavel
- [ ] Storage configurado, se aplicavel
- [ ] Integracoes configuradas
- [ ] Validacao de variaveis obrigatorias executada

Variaveis criticas a validar:

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGIN`
- `REDIS_URL`
- `PORT`
- `HOST`
- `NODE_ENV`
- `APP_ENV`
- chaves de integracao externas

---

## 3. Banco

Checklist:

- [ ] Backup realizado antes do deploy
- [ ] Restore testado em ambiente seguro
- [ ] `prisma migrate deploy` executado
- [ ] `prisma generate` executado
- [ ] Seed inicial validado
- [ ] Tenant inicial criado e conferido
- [ ] Usuario administrador criado e autenticavel

Evidencias esperadas:

- log de migration;
- registro de seed;
- credenciais iniciais armazenadas fora do repositorio;
- confirmacao de conexao com Postgres/Supabase.

---

## 4. Backend

Checklist:

- [ ] Fastify oficial em execucao
- [ ] Health endpoint operante
- [ ] Readiness endpoint operante
- [ ] Metrics endpoint operante
- [ ] CORS configurado
- [ ] Rate Limit ativo
- [ ] Security Headers ativos
- [ ] Logs estruturados ativos
- [ ] Request Correlation ativo
- [ ] RBAC ativo
- [ ] Tenant Isolation ativo

Validacoes minimas:

- [ ] `GET /health`
- [ ] `GET /ready`
- [ ] `GET /metrics`
- [ ] autenticacao em rotas protegidas
- [ ] bloqueio cross-tenant

---

## 5. Frontend

Checklist:

- [ ] Build frontend executado
- [ ] Bundle publicado e validado
- [ ] API URL apontando para a superficie correta
- [ ] Login funcional
- [ ] Sessao funcional
- [ ] Rotas protegidas funcionando
- [ ] Error Boundary validado

Validacoes minimas:

- [ ] login carrega sem erro
- [ ] refresh de sessao funciona
- [ ] rotas autenticadas bloqueiam acesso anonimo
- [ ] frontend consome o backend oficial

---

## 6. Deploy

Checklist:

- [ ] Build frontend concluido
- [ ] Build backend concluido
- [ ] Docker build concluido
- [ ] Docker image publicada
- [ ] Deploy executado
- [ ] Restart concluido
- [ ] Smoke tests executados

Ordem sugerida:

1. validar artefatos
2. buildar imagens
3. publicar imagem
4. aplicar migration/seed, se necessario
5. fazer deploy
6. validar health/readiness
7. rodar smoke tests

---

## 7. Smoke Tests

Checklist:

- [ ] Login
- [ ] Logout
- [ ] Refresh Token
- [ ] Usuarios
- [ ] Clientes
- [ ] Parceiros
- [ ] Oportunidades
- [ ] Pipelines
- [ ] Master Catalog
- [ ] Simulacao
- [ ] RBAC
- [ ] Tenant
- [ ] Auditoria
- [ ] Health

Critério minimo:

- cada item acima deve retornar sucesso sem erro de contrato, permissao ou infraestrutura.

---

## 8. Rollback

Checklist:

- [ ] Backup disponivel
- [ ] Banco reversivel ou snapshot validado
- [ ] Docker image anterior disponivel
- [ ] Release anterior identificada
- [ ] Tempo maximo de rollback definido
- [ ] Critério de rollback aprovado

Critérios sugeridos para rollback:

- falha em login;
- falha em health/readiness;
- falha em migration;
- indisponibilidade de rotas criticas;
- erro sistemico em RBAC ou tenant isolation;
- erro de deploy com impacto operacional.

---

## 9. Critérios GO LIVE

### Matriz P0 / P1 / P2

| Severidade | Condicao | Status esperado |
| --- | --- | --- |
| P0 | Banco indisponivel, health fail, auth fail, tenant breach, deploy quebrado | NO GO |
| P1 | TLS ausente, rollback nao confirmado, env incompleta, smoke incompleto | GO WITH RESTRICTIONS |
| P2 | Avisos nao bloqueantes, melhorias operacionais, ajustes de observabilidade | GO WITH RESTRICTIONS |

### Decisao final

| Estado | Significado |
| --- | --- |
| GO | Todos os checks criticos aprovados, sem pendencias P0/P1 |
| GO WITH RESTRICTIONS | Base pronta, mas com pendencias operacionais controladas |
| NO GO | Existe bloqueio P0 ou risco de indisponibilidade / perda de controle |

---

## 10. Ata de Go Live

Preencher no momento da publicacao:

- Data: `________________________`
- Versao: `________________________`
- Responsavel: `________________________`
- Checklist aprovado: `________________________`
- Observacoes: `________________________`
- Pendencias: `________________________`
- Rollback executado (Sim/Nao): `________________________`
- Resultado final: `________________________`

Campos adicionais recomendados:

- janela de deploy;
- ambiente;
- links para logs;
- links para evidencias de smoke tests;
- aprovacao de negocio / arquitetura / infra.

---

## Resultado Esperado

Quando todos os itens criticos estiverem marcados e os controles operacionais estiverem documentados, o FINQZ PRO Enterprise fica pronto para a publicacao com governanca.

### Veredito final

- **READY FOR PRODUCTION CHECKLIST**
