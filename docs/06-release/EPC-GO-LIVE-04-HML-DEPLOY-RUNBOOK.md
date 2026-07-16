# EPC-GO-LIVE-04 - HML Deploy Runbook

**Document ID:** EPC-GO-LIVE-04-HML-DEPLOY-RUNBOOK
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

> Este documento e um guia operacional subordinado.
>
> Ele nao substitui o DCA, o PCCD, as ADRs, as politicas de governanca, o runtime oficial ou qualquer documento canônico de arquitetura e release.
>
> Segredos nunca devem ser versionados. `backend/docker-compose.hml.yml` e o override oficial de HML; `.env.production` ou materializacao equivalente permanecem fora do Git.

## 1. Objetivo

Padronizar o deploy HML do FINQZ PRO Enterprise com um fluxo reproduzivel, auditavel e minimo, usando uma imagem backend imutavel previamente validada e transportada por canal seguro aprovado.

## 2. Escopo

- preparar o ambiente HML;
- validar branch e commit;
- validar a imagem backend imutavel;
- subir a stack HML sem build;
- validar `health`, `live` e `ready`;
- executar smoke tests;
- orientar rollback controlado.

## 3. Fora do Escopo

- alteracao de runtime;
- alteracao de backend funcional;
- alteracao de frontend;
- alteracao de Prisma;
- alteracao de seed;
- alteracao de Nginx;
- alteracao de Dockerfile;
- alteracao de CI;
- alteracao de VPS;
- versionamento de segredos.

## 4. Base Operacional

- Branch oficial: `homologation/bootstrap-vps`
- Compose base: `backend/docker-compose.yml`
- Override HML: `backend/docker-compose.hml.yml`
- Env file de execucao: `.env.production` ou materializacao equivalente fora do Git
- Imagem backend: `FINQZ_BACKEND_IMAGE` com tag imutavel ou digest
- Transporte: `docker save` -> SHA-256 do TAR -> transferencia segura -> `docker load`
- Portal de release: `docs/06-release/README.md`

## 5. Variaveis Canonicas

| Variavel | Valor canonico | Observacao |
| --- | --- | --- |
| `APP_ENV` | `homologation` | Perfil de HML. |
| `NODE_ENV` | `production` | O runtime permanece em modo de producao. |
| `LOG_LEVEL` | `info` ou valor mais restritivo | Pode ser ajustado por operacao, sem virar segredo. |
| URLs | valores do ambiente HML | Nao versionar URLs sensiveis. |
| Volumes | volumes locais do compose + mounts da stack | Sem alterar a topologia do compose base. |
| Segredos | fora do Git | Sempre materializados externamente. |

## 6. Comando Oficial

Executar a partir da pasta `backend/`:

```bash
FINQZ_BACKEND_IMAGE=<IMAGEM_IMUTAVEL> docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.hml.yml up -d --no-deps --no-build api
```

## 7. Pre-Check

1. Confirmar branch oficial.
2. Confirmar commit esperado.
3. Confirmar `git diff --check`.
4. Confirmar que `.env.production` nao esta versionado.
5. Confirmar disponibilidade do env file seguro.
6. Confirmar existencia do override HML.
7. Confirmar que o compose base permanece genérico.
8. Confirmar que `FINQZ_BACKEND_IMAGE` esta definido e aponta para uma imagem imutavel.

## 8. Fluxo Oficial

### 8.1 Git

- validar branch;
- validar commit;
- validar worktree;
- registrar qualquer drift preexistente.

### 8.2 Imagem

- confirmar a imagem backend previamente validada;
- nao reconstruir a imagem durante o deploy;
- nao alterar o source nesta fase.

### 8.3 Deploy

- aplicar o compose base com o override HML;
- manter `APP_ENV=homologation`;
- manter `NODE_ENV=production`;
- subir somente o `api` com `--no-deps --no-build`;
- nao recriar PostgreSQL, Redis, Nginx ou frontend.

### 8.4 Health e Live

- validar `GET /health`;
- validar `GET /live`;
- confirmar HTTP 200;
- confirmar que nenhum dos dois acessa banco ou Redis.

### 8.5 Ready

- validar `GET /ready` apenas de forma interna ou restrita;
- confirmar banco e Redis antes de liberar trafego;
- nao expor `ready` publicamente.

### 8.6 Smoke

- executar o smoke checklist oficial;
- registrar evidencias;
- bloquear liberacao se houver falha P0/P1.

## 9. Critérios de Aprovação

- compose HML sobe com sucesso;
- a variavel `FINQZ_BACKEND_IMAGE` foi fornecida;
- o `api` sobe sem `build:` no override HML;
- `health` e `live` respondem;
- `ready` responde apenas internamente;
- smoke checklist concluido;
- nenhum segredo foi versionado;
- nenhum arquivo fora do escopo foi alterado.

## 10. Critérios de Parada

- branch divergente;
- commit divergente;
- env file ausente ou inseguro;
- imagem imutavel ausente ou invalida;
- `health` ou `live` falhou;
- `ready` falhou internamente;
- smoke falhou;
- qualquer suspeita de exposed secret.

## 11. Rollback

Se qualquer gate falhar, o rollback segue o runbook oficial de rollback HML e volta para o ultimo commit/artefato conhecido como seguro.

## 12. Referências

- [EPC-GO-LIVE-05-HML-SMOKE-CHECKLIST](./EPC-GO-LIVE-05-HML-SMOKE-CHECKLIST.md)
- [EPC-GO-LIVE-06-HML-ROLLBACK-RUNBOOK](./EPC-GO-LIVE-06-HML-ROLLBACK-RUNBOOK.md)
- [EPC-GO-LIVE-02-DEPLOY-RUNBOOK](./EPC-GO-LIVE-02-DEPLOY-RUNBOOK.md)
- [EPC-GO-LIVE-03-STAGING-DEPLOY-PLAYBOOK](./EPC-GO-LIVE-03-STAGING-DEPLOY-PLAYBOOK.md)
- [DCA mestre](../00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md)
- [PCCD](../00-master/PCCD-FINQZ-PRO-ENTERPRISE.md)
