# EPC-GO-LIVE-03A - Audit Trail & Evidence Standard

Base documental:

- [EPC-GO-LIVE-01-OPERATIONAL-CHECKLIST](./EPC-GO-LIVE-01-OPERATIONAL-CHECKLIST.md)
- [EPC-GO-LIVE-02-DEPLOY-RUNBOOK](./EPC-GO-LIVE-02-DEPLOY-RUNBOOK.md)
- [EPC-GO-LIVE-03-STAGING-DEPLOY-PLAYBOOK](./EPC-GO-LIVE-03-STAGING-DEPLOY-PLAYBOOK.md)

## 1. Objetivo

### Finalidade

Padronizar a coleta de evidencias e a trilha de auditoria durante a execucao do Go-Live, garantindo rastreabilidade completa, verificabilidade e comparabilidade entre releases.

### Escopo

- evidencias de infraestrutura;
- evidencias de ambiente;
- evidencias de banco;
- evidencias de build;
- evidencias de deploy;
- evidencias de smoke tests;
- checkpoints de aprovacao;
- ata final de execucao.

### Princípios de auditabilidade

- cada evento critico deve gerar uma evidencia identificavel;
- toda evidencia deve ser associada a uma fase e a uma atividade;
- qualquer aprovacao deve apontar para evidencias anexadas;
- qualquer rejeicao deve apontar para a falha correspondente;
- a trilha deve ser reprodutivel para releases futuras;
- o formato deve permanecer estavel entre versoes.

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
- [EPC-GO-LIVE-03B-STAGING-EVIDENCE-TEMPLATE](./EPC-GO-LIVE-03B-STAGING-EVIDENCE-TEMPLATE.md)
- [EPC-GO-LIVE-02-DEPLOY-RUNBOOK](./EPC-GO-LIVE-02-DEPLOY-RUNBOOK.md)
- [EPC-GO-LIVE-01-OPERATIONAL-CHECKLIST](./EPC-GO-LIVE-01-OPERATIONAL-CHECKLIST.md)
- [EPC-RELEASE-READINESS-AUDIT](./EPC-RELEASE-READINESS-AUDIT.md)

---

## 2. Padrão de Identificação das Evidências

### Convenção

- `EV-001`
- `EV-002`
- `EV-003`
- ...

### Estrutura de cada evidência

| Campo | Descrição |
| --- | --- |
| ID | Identificador unico da evidencia |
| Fase | Fase do playbook ou runbook associada |
| Atividade | Passo especifico executado |
| Responsável | Pessoa ou papel que executou/validou |
| Data/Hora | Timestamp da coleta |
| Comando executado | Comando, consulta ou procedimento aplicado |
| Resultado esperado | O que deveria acontecer |
| Resultado obtido | O que aconteceu de fato |
| Localização da evidência | Caminho, arquivo, log, print ou export |
| Status | `PASS`, `FAIL` ou `WAIVED` |

### Exemplo de registro

| ID | Fase | Atividade | Responsável | Data/Hora | Comando executado | Resultado esperado | Resultado obtido | Localização da evidência | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EV-001 | Fase 4 - Build | Build frontend | Frontend / DevOps | 2026-07-07 18:30 | `npm run build` | Build concluido sem erro | Build concluido com sucesso | `docs/07-evidence/release-v1.0.0/EV-001/logs/build-frontend.log` | PASS |

---

## 3. Checkpoints

### Convenção

- `CP-001`
- `CP-002`
- `CP-003`
- ...

### Estrutura por checkpoint

| Campo | Descrição |
| --- | --- |
| Fase | Fase do playbook |
| Pré-condições | Condições para iniciar o checkpoint |
| Validações | Verificações obrigatórias |
| Evidências obrigatórias | Arquivos/saídas que devem existir |
| Critérios de aprovação | Regras para aprovar |
| Critérios de rejeição | Regras para rejeitar |

### Exemplo de checkpoint

| Checkpoint | Fase | Pré-condições | Validações | Evidências obrigatórias | Critérios de aprovação | Critérios de rejeição |
| --- | --- | --- | --- | --- | --- | --- |
| CP-001 | Fase 0 - Pré-condições | Branch correta, rollback aprovado, backup aprovado | branch, commit, checklist, janela | logs, ata, documento aprovado | tudo validado e assinado | qualquer pré-condição ausente ou ambígua |

---

## 4. Evidências Obrigatórias

### Build e teste

- build frontend
- build backend
- testes frontend
- testes backend

### Banco

- migration
- seed
- restore testado

### Runtime e infraestrutura

- logs Docker
- health
- readiness
- metrics
- Nginx / reverse proxy
- SSL/TLS, se aplicavel

### Segurança e acesso

- login
- RBAC
- tenant isolation

### Smoke tests

- login
- logout
- refresh token
- usuários
- clientes
- parceiros
- oportunidades
- pipelines
- master catalog
- simulação
- auditoria

---

## 5. Convenção de Armazenamento

### Estrutura sugerida

```text
docs/07-evidence/
  release-v1.0.0/
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
    EV-003/
      logs/
      screenshots/
      exports/
```

### Regras

- cada evidencia deve ficar dentro da pasta do release correspondente;
- cada ID de evidencia deve ter sua propria pasta;
- logs devem ser armazenados em `logs/`;
- capturas visuais devem ir em `screenshots/`;
- exports, dumps ou relatórios devem ir em `exports/`;
- metadados de decisao e checkpoint devem ir em `metadata/`.

### Nomenclatura sugerida

- `EV-001-build-frontend.log`
- `EV-002-build-backend.log`
- `EV-003-tests-frontend.log`
- `EV-004-tests-backend.log`
- `EV-005-health-response.json`

---

## 6. Auditoria Operacional

### Tabela de acompanhamento

| Checkpoint | Evidência | Aprovado por | Data | Observações |
| --- | --- | --- | --- | --- |
| CP-001 | EV-001 | ____________________ | ____________________ | ____________________ |
| CP-002 | EV-002 | ____________________ | ____________________ | ____________________ |
| CP-003 | EV-003 | ____________________ | ____________________ | ____________________ |

### Regras

- cada checkpoint deve ter pelo menos uma evidencia associada;
- nenhuma aprovacao pode existir sem evidencia anexada;
- observacoes devem registrar riscos, desvios e restricoes;
- rejeicao deve apontar a evidencia da falha.

---

## 7. Critérios de Conformidade

### Classificação

| Nível | Significado | Efeito no Go-Live |
| --- | --- | --- |
| CRITICAL | Falha que compromete segurança, integridade, disponibilidade ou controle operacional | Bloqueia o Go-Live |
| HIGH | Falha relevante com impacto funcional ou de release | Bloqueia até correção ou aprovação formal de restrição |
| MEDIUM | Desvio importante, mas com mitigação conhecida | Pode gerar Go With Restrictions |
| LOW | Desvio leve ou informativo | Não bloqueia, mas deve ser registrado |

### Quando a evidência bloqueia o Go-Live

A evidencia bloqueia o Go-Live quando:

- um critério CRITICAL falha;
- um checkpoint obrigatorio fica sem evidencia;
- a evidencia contradiz o resultado esperado sem explicacao aceita;
- o resultado obtido mostra perda de dados, erro de segurança, indisponibilidade ou regressao funcional central;
- o rollback nao pode ser comprovado quando necessario.

---

## 8. Encerramento da Execução

### Modelo

#### Resumo executivo

- objetivo da execucao;
- fase final alcançada;
- estado geral;
- conclusao resumida.

#### Incidentes

- listar incidentes ocorridos;
- classificar severidade;
- registrar impacto e resolucao.

#### Desvios

- listar desvios aprovados;
- listar desvios rejeitados;
- apontar justificativa.

#### Rollback

- executado: sim / nao;
- motivo;
- momento;
- resultado.

#### Decisão final

- [ ] GO
- [ ] GO WITH RESTRICTIONS
- [ ] NO GO

---

## 9. Ata de Auditoria

### Campos

| Campo | Valor |
| --- | --- |
| Versão | ____________________ |
| Commit | ____________________ |
| Release | ____________________ |
| Ambiente | ____________________ |
| Data | ____________________ |
| Responsáveis | ____________________ |
| Evidências anexadas | ____________________ |
| Conclusão | ____________________ |

### Sugestão de anexos

- lista de evidencias com IDs;
- checksum ou hash do artefato, quando aplicavel;
- imagens/screen captures;
- logs do deploy;
- logs de health/readiness/metrics;
- ata de Go/No-Go;
- registro de rollback, se houver.

---

## Reuso em releases futuras

### Regras de continuidade

- o padrão `EV-###` e `CP-###` deve ser mantido em todas as releases;
- a numeração deve ser reiniciada por release, nunca compartilhada entre ciclos;
- o prefixo da pasta deve identificar a release exata;
- o modelo de ata deve permanecer estável para permitir comparabilidade.

### Veredito

- **READY FOR CONTROLLED STAGING EXECUTION**
