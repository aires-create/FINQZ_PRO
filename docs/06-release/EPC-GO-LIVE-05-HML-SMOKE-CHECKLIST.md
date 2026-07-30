# EPC-GO-LIVE-05 - HML Smoke Checklist

**Document ID:** EPC-GO-LIVE-05-HML-SMOKE-CHECKLIST
**Version:** 1.0
**Status:** ACTIVE
**Owner:** Release Manager
**Classification:** Operational Checklist
**Approval Status:** PENDING
**Approved By:** PENDING
**Created Date:** 2026-07-11
**Last Updated Date:** 2026-07-11
**Supersedes:** None
**Authority Level:** Subordinate Operational Guide

---

> Este checklist e subordinado ao DCA, ao PCCD, as ADRs e aos runbooks oficiais de release.
>
> Ele documenta apenas verificacoes operacionais de HML. Nao define nova arquitetura, nao altera runtime e nao versiona segredos.

## 1. Objetivo

Definir o smoke checklist oficial para HML, cobrindo edge, API, banco, Redis, Docker, Nginx, login, dashboard, Master Catalog, Commercial Coverage e Shadow Read.

## 2. Regra de Uso

- executar apos o deploy HML;
- registrar evidencias para cada item;
- tratar `ready` como validacao interna;
- nao expor `ready` publicamente;
- nao seguir para rollback ou liberacao se houver falha bloqueante.

## 3. Checklist Oficial

| Area | Verificacao | Evidencia esperada | Critério de sucesso | Observacoes |
| --- | --- | --- | --- | --- |
| Health | `GET /health` | HTTP 200 e payload com `success: true` | Probe publico responde sem acessar banco ou Redis | Pode ser validado via Nginx. |
| Live | `GET /live` | HTTP 200 e payload com `status: live` | Probe publico responde sem acessar banco ou Redis | Pode ser validado via Nginx. |
| Login | `POST /api/v1/auth/login` | Sessao/token emitido com credenciais validas | Autenticacao HML funcional | Pode ser via UI ou API. |
| Dashboard | `/app/dashboard` | Pagina carrega apos login | Dashboard renderiza e respeita permissao | Fluxo autenticado. |
| Master Catalog | `GET /api/v1/master-catalog/tree` | Resposta com arvore canônica | Catalogo oficial responde | Requer autenticacao e tenant. |
| Commercial Coverage | `/app/operacoes/commercial-coverage` | Tela de cobertura comercial renderizada | Coverage tree carrega sem erro | Fluxo de UI validado. |
| Shadow Read | Fluxo de simulacao com shadow mode | Comparacao e evidencias emitidas | Shadow runtime executa sem alterar o resultado legado | Usar o fluxo oficial do produto. |
| API | `GET /api/v1/master-catalog/tree` ou equivalente oficial | Resposta HTTP 200 | API responde via edge sem regressao | Escolher um endpoint oficial autenticado. |
| Redis | Container/servico Redis | `PING` ou health do container | Redis saudavel | Evidencia do compose ou do host. |
| Postgres | Container/servico Postgres | `pg_isready` ou health do container | Banco saudavel | Evidencia do compose ou do host. |
| Docker | Stack HML | `docker compose ps` sem falhas | Containers api, nginx, postgres e redis saudaveis | Sem restart loop. |
| Nginx | Edge HML | Probes publicos chegam ao backend | Proxy e rotas de edge estao corretos | Sem alterar TLS nesta wave. |
| Readiness interna | `GET /ready` interno | HTTP 200 e estado de banco/Redis | Readiness valido apenas internamente | Nao publicar ao publico. |

## 4. Critérios de Aprovação

- todos os itens obrigatorios passam;
- nenhum item P0/P1 permanece aberto;
- `/ready` foi validado apenas de forma interna;
- evidencias foram registradas;
- nao ha indicio de exposicao indevida de segredo.

## 5. Critérios de Falha

- `/health` ou `/live` fora do ar;
- login invalido;
- dashboard nao carrega;
- Master Catalog nao responde;
- Commercial Coverage nao renderiza;
- shadow read nao produz evidencia;
- Redis ou Postgres indisponiveis;
- Docker ou Nginx com falha;
- `/ready` publico.

## 6. Evidências

Registrar para cada linha:

- data/hora;
- responsavel;
- comando ou fluxo executado;
- resultado observado;
- link ou captura da evidencia.

## 7. Referências

- [EPC-GO-LIVE-04-HML-DEPLOY-RUNBOOK](./EPC-GO-LIVE-04-HML-DEPLOY-RUNBOOK.md)
- [EPC-GO-LIVE-06-HML-ROLLBACK-RUNBOOK](./EPC-GO-LIVE-06-HML-ROLLBACK-RUNBOOK.md)
- [EPC-GO-LIVE-03-STAGING-DEPLOY-PLAYBOOK](./EPC-GO-LIVE-03-STAGING-DEPLOY-PLAYBOOK.md)
- [DCA mestre](../00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md)
- [PCCD](../00-master/PCCD-FINQZ-PRO-ENTERPRISE.md)
