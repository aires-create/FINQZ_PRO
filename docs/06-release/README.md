# Release Operations - FINQZ PRO Enterprise

## Objetivo da Pasta

Centralizar a documentação oficial de Release Operations do FINQZ PRO Enterprise, cobrindo readiness, checklist operacional, runbook sequencial, playbook de staging, trilha de auditoria, template de evidências e padronizacao oficial de HML.

## Sequência Oficial de Execução

```text
EPC-RELEASE-READINESS-AUDIT
  → EPC-GO-LIVE-01-OPERATIONAL-CHECKLIST
  → EPC-GO-LIVE-02-DEPLOY-RUNBOOK
  → EPC-GO-LIVE-03-STAGING-DEPLOY-PLAYBOOK
  → EPC-GO-LIVE-03A-AUDIT-TRAIL-STANDARD
  → EPC-GO-LIVE-03B-STAGING-EVIDENCE-TEMPLATE
  → EPC-GO-LIVE-04-HML-DEPLOY-RUNBOOK
  → EPC-GO-LIVE-05-HML-SMOKE-CHECKLIST
  → EPC-GO-LIVE-06-HML-ROLLBACK-RUNBOOK
```

## Diagrama Textual do Fluxo

```text
Auditoria de readiness
  ↓
Checklist operacional
  ↓
Runbook sequencial
  ↓
Playbook de staging
  ↓
Padrão de trilha de evidências
  ↓
Template de execução de evidências
  ↓
HML deployment standardization
```

## Documentos Oficiais

### 1. EPC-RELEASE-READINESS-AUDIT

- função: auditar prontidão de produção;
- saída esperada: `GO WITH RESTRICTIONS` ou `NO GO`;
- uso: base de decisão para Go-Live.

### 2. EPC-GO-LIVE-01-OPERATIONAL-CHECKLIST

- função: checklist operacional executável;
- saída esperada: `READY FOR PRODUCTION CHECKLIST`;
- uso: pré-requisito do runbook.

### 3. EPC-GO-LIVE-02-DEPLOY-RUNBOOK

- função: execução sequencial do deploy;
- saída esperada: `READY FOR STAGING DEPLOY SIMULATION`;
- uso: guia de ordem e dependências.

### 4. EPC-GO-LIVE-03-STAGING-DEPLOY-PLAYBOOK

- função: playbook de homologação com checkpoints;
- saída esperada: `READY FOR STAGING EXECUTION`;
- uso: execução controlada em staging.

### 5. EPC-GO-LIVE-03A-AUDIT-TRAIL-STANDARD

- função: padrão de evidências e checkpoint;
- saída esperada: `READY FOR CONTROLLED STAGING EXECUTION`;
- uso: governança e rastreabilidade.

### 6. EPC-GO-LIVE-03B-STAGING-EVIDENCE-TEMPLATE

- função: template preenchível de evidências;
- saída esperada: `READY FOR STAGING EXECUTION PACKAGE`;
- uso: coleta operacional durante a execução.

### 7. EPC-GO-LIVE-04-HML-DEPLOY-RUNBOOK

- função: runbook oficial de deploy HML com override Compose;
- saída esperada: `READY FOR HML EXECUTION`;
- uso: padronizacao de deploy com `--env-file .env.production`.

### 8. EPC-GO-LIVE-05-HML-SMOKE-CHECKLIST

- função: checklist de smoke para HML;
- saída esperada: `READY FOR HML SMOKE VALIDATION`;
- uso: validacao de `health`, `live`, login, dashboard e fluxos principais.

### 9. EPC-GO-LIVE-06-HML-ROLLBACK-RUNBOOK

- função: rollback operacional reproduzivel para HML;
- saída esperada: `READY FOR HML ROLLBACK`;
- uso: retorno ao commit seguro e revalidacao da stack.

## HML Standard Oficial

### Comando oficial

Executar a partir da pasta `backend/`:

```bash
docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.hml.yml up -d --build
```

### Variáveis canônicas

- `APP_ENV=homologation`
- `NODE_ENV=production`
- `LOG_LEVEL=info` ou mais restritivo
- URLs e segredos fora do Git

### Regras

- `backend/docker-compose.yml` permanece genérico;
- `backend/docker-compose.hml.yml` concentra apenas overrides de HML;
- `ready` nao e exposto publicamente;
- `health` e `live` podem ser expostos publicamente;
- `smoke` e `rollback` sao obrigatorios antes de qualquer expansao de trafego.

## Ordem Obrigatória de Leitura

1. [EPC-RELEASE-READINESS-AUDIT](./EPC-RELEASE-READINESS-AUDIT.md)
2. [EPC-GO-LIVE-01-OPERATIONAL-CHECKLIST](./EPC-GO-LIVE-01-OPERATIONAL-CHECKLIST.md)
3. [EPC-GO-LIVE-02-DEPLOY-RUNBOOK](./EPC-GO-LIVE-02-DEPLOY-RUNBOOK.md)
4. [EPC-GO-LIVE-03-STAGING-DEPLOY-PLAYBOOK](./EPC-GO-LIVE-03-STAGING-DEPLOY-PLAYBOOK.md)
5. [EPC-GO-LIVE-03A-AUDIT-TRAIL-STANDARD](./EPC-GO-LIVE-03A-AUDIT-TRAIL-STANDARD.md)
6. [EPC-GO-LIVE-03B-STAGING-EVIDENCE-TEMPLATE](./EPC-GO-LIVE-03B-STAGING-EVIDENCE-TEMPLATE.md)
7. [EPC-GO-LIVE-03C-STANDARDIZATION-REPORT](./EPC-GO-LIVE-03C-STANDARDIZATION-REPORT.md)
8. [EPC-GO-LIVE-04-HML-DEPLOY-RUNBOOK](./EPC-GO-LIVE-04-HML-DEPLOY-RUNBOOK.md)
9. [EPC-GO-LIVE-05-HML-SMOKE-CHECKLIST](./EPC-GO-LIVE-05-HML-SMOKE-CHECKLIST.md)
10. [EPC-GO-LIVE-06-HML-ROLLBACK-RUNBOOK](./EPC-GO-LIVE-06-HML-ROLLBACK-RUNBOOK.md)

## Responsáveis

| Papel | Responsabilidade |
| --- | --- |
| Arquiteto Enterprise | Conformidade arquitetural, sequência e decisão técnica. |
| DevOps Lead | Infraestrutura, deploy, rollback e evidências operacionais. |
| SRE | Health, readiness, observabilidade e estabilidade. |
| Responsável Banco | Prisma, migrations, backup, restore e seed. |
| Responsável Produto | Go/No-Go funcional e validação de smoke tests. |

## Convenções Oficiais

- Decisão: `GO`, `GO WITH RESTRICTIONS`, `NO GO`
- Status de evidência: `PASS`, `FAIL`, `WAIVED`
- IDs de evidência: `EV-001...`
- IDs de checkpoint: `CP-001...`
- Severidade: `P0`, `P1`, `P2`

## Referências

- [EPC-RELEASE-READINESS-AUDIT](./EPC-RELEASE-READINESS-AUDIT.md)
- [EPC-GO-LIVE-01-OPERATIONAL-CHECKLIST](./EPC-GO-LIVE-01-OPERATIONAL-CHECKLIST.md)
- [EPC-GO-LIVE-02-DEPLOY-RUNBOOK](./EPC-GO-LIVE-02-DEPLOY-RUNBOOK.md)
- [EPC-GO-LIVE-03-STAGING-DEPLOY-PLAYBOOK](./EPC-GO-LIVE-03-STAGING-DEPLOY-PLAYBOOK.md)
- [EPC-GO-LIVE-03A-AUDIT-TRAIL-STANDARD](./EPC-GO-LIVE-03A-AUDIT-TRAIL-STANDARD.md)
- [EPC-GO-LIVE-03B-STAGING-EVIDENCE-TEMPLATE](./EPC-GO-LIVE-03B-STAGING-EVIDENCE-TEMPLATE.md)
- [EPC-GO-LIVE-03C-STANDARDIZATION-REPORT](./EPC-GO-LIVE-03C-STANDARDIZATION-REPORT.md)
