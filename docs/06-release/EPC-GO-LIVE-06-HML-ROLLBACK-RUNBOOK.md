# EPC-GO-LIVE-06 - HML Rollback Runbook

**Document ID:** EPC-GO-LIVE-06-HML-ROLLBACK-RUNBOOK
**Version:** 1.0
**Status:** ACTIVE
**Owner:** Release Manager
**Classification:** Operational Release Guide
**Approval Status:** PENDING
**Approved By:** PENDING
**Created Date:** 2026-07-11
**Last Updated Date:** 2026-07-11
**Supersedes:** None
**Authority Level:** Subordinate Operational Guide

---

> Este documento descreve apenas rollback operacional de HML.
>
> Ele nao altera arquitetura, nao altera runtime e nao substitui o plano de rollback do DCA/PCCD/ADRs. Se o rollback exigir mudanca estrutural, a decisao deve voltar para governanca.

## 1. Objetivo

Padronizar um rollback reproduzivel para HML, preservando o comportamento conhecido e reduzindo improviso operacional.
O rollback da primeira release imutavel continua dependente da imagem exata preservada, sem rebuild e sem `latest`.

## 2. Gatilhos de Rollback

- falha em `health`;
- falha em `live`;
- `ready` interno indisponivel;
- smoke checklist com falha bloqueante;
- regressao no login, dashboard, Master Catalog ou Commercial Coverage;
- suspeita de exposicao indevida de segredo ou configuracao incorreta.

## 3. Fluxo Esperado

### 3.1 Captura do estado atual

1. Registrar commit e branch atuais.
2. Registrar diff do que sera revertido.
3. Confirmar que o trabalho local esta salvo.

### 3.2 Retorno ao commit seguro

1. Executar `git checkout <commit-ou-tag-conhecida-como-segura>`.
2. Nao usar `reset --hard` como primeira opcao.
3. Manter rastreabilidade do ponto de retorno.

### 3.3 Reaplicacao da stack HML

```bash
FINQZ_BACKEND_IMAGE=<IMAGEM_DE_ROLLBACK_IMUTAVEL> docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.hml.yml up -d --no-deps --no-build api
```

### 3.4 Validacao do edge

1. Validar `GET /health`.
2. Validar `GET /live`.
3. Validar `GET /ready` apenas de forma interna ou restrita.

### 3.5 Smoke apos rollback

1. Executar o smoke checklist oficial.
2. Confirmar login.
3. Confirmar dashboard.
4. Confirmar Master Catalog.
5. Confirmar Commercial Coverage.
6. Confirmar Shadow Read.

### 3.6 Encerramento

1. Registrar o commit restaurado.
2. Registrar o motivo do rollback.
3. Registrar o horario de fechamento.
4. Comunicar que a stack voltou ao estado seguro.

## 4. Critérios de Sucesso

- stack HML voltou a responder;
- rollback usou a imagem exata e imutavel;
- `health` e `live` responderam;
- `ready` interno voltou a responder;
- smoke passou;
- nenhum segredo foi exposto;
- nenhum arquivo fora do escopo foi alterado durante o rollback.

## 5. Critérios de Falha

- commit seguro nao encontrado;
- stack nao sobe apos o retorno;
- `health` ou `live` continuam falhando;
- `ready` interno continua falhando;
- smoke continua falhando;
- rollback exige nova mudanca estrutural.

## 6. Referências

- [EPC-GO-LIVE-04-HML-DEPLOY-RUNBOOK](./EPC-GO-LIVE-04-HML-DEPLOY-RUNBOOK.md)
- [EPC-GO-LIVE-05-HML-SMOKE-CHECKLIST](./EPC-GO-LIVE-05-HML-SMOKE-CHECKLIST.md)
- [EPC-GO-LIVE-02-DEPLOY-RUNBOOK](./EPC-GO-LIVE-02-DEPLOY-RUNBOOK.md)
- [EPC-GO-LIVE-03-STAGING-DEPLOY-PLAYBOOK](./EPC-GO-LIVE-03-STAGING-DEPLOY-PLAYBOOK.md)
- [DCA mestre](../00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md)
- [PCCD](../00-master/PCCD-FINQZ-PRO-ENTERPRISE.md)
