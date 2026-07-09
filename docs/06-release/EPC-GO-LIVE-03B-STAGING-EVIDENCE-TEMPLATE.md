# EPC-GO-LIVE-03B - Staging Evidence Execution Template

Base oficial:

- [EPC-GO-LIVE-03-STAGING-DEPLOY-PLAYBOOK](./EPC-GO-LIVE-03-STAGING-DEPLOY-PLAYBOOK.md)
- [EPC-GO-LIVE-03A-AUDIT-TRAIL-STANDARD](./EPC-GO-LIVE-03A-AUDIT-TRAIL-STANDARD.md)

## 1. Identificação da Release

| Campo | Valor |
| --- | --- |
| Release | ____________________ |
| Versão | ____________________ |
| Ambiente | staging / homologacao |
| Commit | ____________________ |
| Branch | ____________________ |
| Data | ____________________ |
| Janela de execução | ____________________ |
| Responsável técnico | ____________________ |
| Responsável infraestrutura | ____________________ |
| Responsável banco | ____________________ |
| Responsável validação funcional | ____________________ |
| Responsável go/no-go | ____________________ |

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

- [EPC-GO-LIVE-03-STAGING-DEPLOY-PLAYBOOK](./EPC-GO-LIVE-03-STAGING-DEPLOY-PLAYBOOK.md)
- [EPC-GO-LIVE-03A-AUDIT-TRAIL-STANDARD](./EPC-GO-LIVE-03A-AUDIT-TRAIL-STANDARD.md)
- [EPC-GO-LIVE-02-DEPLOY-RUNBOOK](./EPC-GO-LIVE-02-DEPLOY-RUNBOOK.md)
- [EPC-GO-LIVE-01-OPERATIONAL-CHECKLIST](./EPC-GO-LIVE-01-OPERATIONAL-CHECKLIST.md)
- [EPC-RELEASE-READINESS-AUDIT](./EPC-RELEASE-READINESS-AUDIT.md)

---

## 2. Padrão de Evidências

### Estrutura de referência

- `EV-001` até `EV-020`
- `CP-001` até `CP-010`

### Campos obrigatórios por evidência

| Campo | Descrição |
| --- | --- |
| ID | Identificador da evidência |
| Fase | Fase do playbook correspondente |
| Atividade | Atividade executada |
| Comando executado | Comando, consulta ou ação aplicada |
| Resultado esperado | O que deveria acontecer |
| Resultado obtido | O que aconteceu de fato |
| Evidência coletada | Log, print, export, JSON, screenshot ou link |
| Status | `PASS`, `FAIL` ou `WAIVED` |
| Responsável | Nome ou papel responsável |
| Data/Hora | Timestamp da coleta |

---

## 3. Tabela EV-001 até EV-020

> Preencher uma linha por evidência durante a execução.

| ID | Fase | Atividade | Comando executado | Resultado esperado | Resultado obtido | Evidência coletada | Status | Responsável | Data/Hora |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EV-001 | Fase 0 - Pré-condições | Validar branch e commit | `git branch --show-current` / `git log -1 --oneline` | Branch e commit corretos | ____________________ | ____________________ | ____________________ | ____________________ | ____________________ |
| EV-002 | Fase 0 - Pré-condições | Checklist operacional aprovado | Leitura do checklist | Checklist aprovado | ____________________ | ____________________ | ____________________ | ____________________ | ____________________ |
| EV-003 | Fase 1 - Infraestrutura | Validar Docker e Compose | `docker --version` / `docker compose version` | Versões disponíveis | ____________________ | ____________________ | ____________________ | ____________________ | ____________________ |
| EV-004 | Fase 1 - Infraestrutura | Validar Nginx / DNS / TLS | `nginx -t` / `curl -I https://.../health` | Edge saudável e HTTPS válido | ____________________ | ____________________ | ____________________ | ____________________ | ____________________ |
| EV-005 | Fase 2 - Ambiente | Validar variáveis obrigatórias | Startup validation / leitura de env | Variáveis completas | ____________________ | ____________________ | ____________________ | ____________________ | ____________________ |
| EV-006 | Fase 2 - Ambiente | Validar secrets e URLs | Leitura controlada de config | Secrets fortes e URLs corretas | ____________________ | ____________________ | ____________________ | ____________________ | ____________________ |
| EV-007 | Fase 3 - Banco | Backup e restore | Processo de backup/restore | Backup e restore validados | ____________________ | ____________________ | ____________________ | ____________________ | ____________________ |
| EV-008 | Fase 3 - Banco | Prisma generate / migrate / seed | `cd backend && npm run db:generate` / `cd backend && npm run db:migrate:deploy` / `cd backend && npm run db:seed` | Schema aplicado e seed válido | ____________________ | ____________________ | ____________________ | ____________________ | ____________________ |
| EV-009 | Fase 4 - Build | Build frontend e testes frontend | `npm run build` / `npm test` | Build e testes aprovados | ____________________ | ____________________ | ____________________ | ____________________ | ____________________ |
| EV-010 | Fase 4 - Build | Build backend e testes backend | `cd backend && npm run build` / `cd backend && npm test` | Build e testes aprovados | ____________________ | ____________________ | ____________________ | ____________________ | ____________________ |
| EV-011 | Fase 4 - Build | Docker build | `docker build ...` | Imagem gerada | ____________________ | ____________________ | ____________________ | ____________________ | ____________________ |
| EV-012 | Fase 5 - Deploy | Subir stack | `docker compose up -d` | Serviços online | ____________________ | ____________________ | ____________________ | ____________________ | ____________________ |
| EV-013 | Fase 5 - Deploy | Validar logs do deploy | `docker compose logs -f api` | Sem erro crítico | ____________________ | ____________________ | ____________________ | ____________________ | ____________________ |
| EV-014 | Fase 5 - Deploy | Health / readiness / metrics | `curl .../health` / `curl .../ready` / `curl .../metrics` | Endpoints OK | ____________________ | ____________________ | ____________________ | ____________________ | ____________________ |
| EV-015 | Fase 6 - Smoke Tests | Login / sessão / refresh | Fluxo autenticado | Login e sessão funcionais | ____________________ | ____________________ | ____________________ | ____________________ | ____________________ |
| EV-016 | Fase 6 - Smoke Tests | RBAC / tenant isolation | Acesso autenticado e cross-tenant | Permissões e isolamento corretos | ____________________ | ____________________ | ____________________ | ____________________ | ____________________ |
| EV-017 | Fase 6 - Smoke Tests | CRM principal | Oportunidades / Parceiros / Pipelines | Fluxos funcionais | ____________________ | ____________________ | ____________________ | ____________________ | ____________________ |
| EV-018 | Fase 6 - Smoke Tests | Master Catalog / Simulação | Acesso às áreas e cálculo | Fluxos funcionais | ____________________ | ____________________ | ____________________ | ____________________ | ____________________ |
| EV-019 | Fase 7 - Go/No-Go | Revisão final e decisão | Ata de aprovação | Decisão registrada | ____________________ | ____________________ | ____________________ | ____________________ | ____________________ |
| EV-020 | Fase 8 - Pós Go-Live | Monitoramento e estabilidade | Observabilidade / revisão operacional | Estabilidade confirmada | ____________________ | ____________________ | ____________________ | ____________________ | ____________________ |

---

## 4. Tabela CP-001 até CP-010

> Preencher um checkpoint por fase e por decisão de continuidade.

| CP | Fase | Pré-condições | Validações | Evidências obrigatórias | Critérios de aprovação | Critérios de rejeição | Decisão por fase | Responsável | Data/Hora |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CP-001 | Fase 0 - Pré-condições | Branch, commit, checklist, janela, rollback, backup | Revisão documental | EV-001, EV-002 | Tudo aprovado e assinado | Qualquer pré-condição ausente | ____________________ | ____________________ | ____________________ |
| CP-002 | Fase 1 - Infraestrutura | VPS e edge prontos | Docker, Compose, Nginx, DNS, TLS | EV-003, EV-004 | Infra saudável | Falha de host, porta, DNS ou TLS | ____________________ | ____________________ | ____________________ |
| CP-003 | Fase 2 - Ambiente | Variáveis e secrets preparados | Env validation | EV-005, EV-006 | Variáveis completas e seguras | Env ausente/insegura | ____________________ | ____________________ | ____________________ |
| CP-004 | Fase 3 - Banco | Backup e restore validados | Prisma / seed / tenant | EV-007, EV-008 | Banco consistente | Falha de migration/restore/seed | ____________________ | ____________________ | ____________________ |
| CP-005 | Fase 4 - Build | Código e imagem candidatos | Build/testes/Docker | EV-009, EV-010, EV-011 | Build e testes verdes | Qualquer falha de build/teste | ____________________ | ____________________ | ____________________ |
| CP-006 | Fase 5 - Deploy | Artefatos aprovados | Stack, logs, health, readiness, metrics | EV-012, EV-013, EV-014 | Serviços saudáveis | 5xx, health fail, readiness fail | ____________________ | ____________________ | ____________________ |
| CP-007 | Fase 6 - Smoke Tests | Runtime disponível | Login, sessão, RBAC, tenant | EV-015, EV-016 | Fluxos críticos OK | Login, RBAC ou tenant falhou | ____________________ | ____________________ | ____________________ |
| CP-008 | Fase 6 - Smoke Tests | CRM e operações principais | Oportunidades, parceiros, pipelines | EV-017 | Fluxos principais OK | Falha em CRM principal | ____________________ | ____________________ | ____________________ |
| CP-009 | Fase 6 - Smoke Tests | Áreas complementares | Master Catalog, simulação | EV-018 | Fluxos complementares OK | Falha em catálogo/simulação | ____________________ | ____________________ | ____________________ |
| CP-010 | Fase 7/8 | Go/No-Go e estabilidade | Decisão final e monitoramento | EV-019, EV-020 | Ata assinada e estabilidade confirmada | Incidente sem tratamento / rollback pendente | ____________________ | ____________________ | ____________________ |

---

## 5. Campos de Execução

### Comando executado

`________________________________________`

### Resultado esperado

`________________________________________`

### Resultado obtido

`________________________________________`

### Evidência coletada

`________________________________________`

### Status

- [ ] PASS
- [ ] FAIL
- [ ] WAIVED

### Responsável

`________________________________________`

### Data/Hora

`________________________________________`

---

## 6. Decisão por Fase

| Fase | Decisão | Responsável | Data/Hora | Observações |
| --- | --- | --- | --- | --- |
| Fase 0 | ____________________ | ____________________ | ____________________ | ____________________ |
| Fase 1 | ____________________ | ____________________ | ____________________ | ____________________ |
| Fase 2 | ____________________ | ____________________ | ____________________ | ____________________ |
| Fase 3 | ____________________ | ____________________ | ____________________ | ____________________ |
| Fase 4 | ____________________ | ____________________ | ____________________ | ____________________ |
| Fase 5 | ____________________ | ____________________ | ____________________ | ____________________ |
| Fase 6 | ____________________ | ____________________ | ____________________ | ____________________ |
| Fase 7 | ____________________ | ____________________ | ____________________ | ____________________ |
| Fase 8 | ____________________ | ____________________ | ____________________ | ____________________ |

---

## 7. Ata Final de Homologação

### Resumo executivo

`______________________________________________________________`

### Incidentes

`______________________________________________________________`

### Desvios

`______________________________________________________________`

### Rollback

- Executado: □ Sim □ Não
- Motivo: `__________________________________________________`
- Resultado: `______________________________________________`

### Decisão final

- [ ] GO
- [ ] GO WITH RESTRICTIONS
- [ ] NO GO

### Assinaturas

| Papel | Nome | Assinatura | Data/Hora |
| --- | --- | --- | --- |
| Responsável técnico | ____________________ | ____________________ | ____________________ |
| Responsável infraestrutura | ____________________ | ____________________ | ____________________ |
| Responsável banco | ____________________ | ____________________ | ____________________ |
| Responsável validação funcional | ____________________ | ____________________ | ____________________ |
| Responsável go/no-go | ____________________ | ____________________ | ____________________ |

---

## 8. Convenção de Armazenamento

Recomendação para anexos:

```text
docs/07-evidence/
  release-vX.Y.Z/
    metadata/
    checkpoints/
    EV-001/
      logs/
      screenshots/
      exports/
    EV-002/
      logs/
      screenshots/
      exports/
```

### Regras

- manter um diretório por release;
- manter um diretório por evidência;
- anexar logs, prints e exports em pastas separadas;
- referenciar os caminhos no campo `Evidência coletada`;
- nunca reaproveitar IDs entre releases.

---

## 9. Veredito

Este template foi preparado para ser usado diretamente na execução do staging deploy.

### Veredito final

- **READY FOR STAGING EXECUTION PACKAGE**
