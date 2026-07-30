# EPC-GO-LIVE-03 - Staging Deploy Playbook

Base documental:

- [EPC-RELEASE-READINESS-AUDIT](./EPC-RELEASE-READINESS-AUDIT.md)
- [EPC-GO-LIVE-01-OPERATIONAL-CHECKLIST](./EPC-GO-LIVE-01-OPERATIONAL-CHECKLIST.md)
- [EPC-GO-LIVE-02-DEPLOY-RUNBOOK](./EPC-GO-LIVE-02-DEPLOY-RUNBOOK.md)

## 1. Objetivo

### Escopo

Executar o deploy de homologacao (staging) do FINQZ PRO Enterprise de forma controlada, com checkpoints de aprovacao, evidencias obrigatorias, criterios de continuidade e gatilhos claros de interrupcao.

### Ambiente alvo

- homologacao / staging
- backend oficial em `backend/src`
- superficie oficial em `/api/v1/*`
- frontend buildado via Vite
- infraestrutura com Docker, Nginx, Postgres e Redis conforme o ambiente preparado

### Premissas

- o checklist operacional foi aprovado;
- o runbook sequencial foi aprovado;
- build e testes do frontend e backend ja passaram;
- a janela de staging esta aprovada;
- rollback esta definido e disponivel;
- evidencias devem ser registradas a cada fase.

### Critérios de sucesso

- todas as fases executadas com checkpoints aprovados;
- evidencias coletadas e anexadas;
- smoke tests validos;
- sem incidentes P0/P1 sem tratamento;
- decisao final registrada para a homologacao.

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

- [EPC-GO-LIVE-02-DEPLOY-RUNBOOK](./EPC-GO-LIVE-02-DEPLOY-RUNBOOK.md)
- [EPC-GO-LIVE-01-OPERATIONAL-CHECKLIST](./EPC-GO-LIVE-01-OPERATIONAL-CHECKLIST.md)
- [EPC-GO-LIVE-03A-AUDIT-TRAIL-STANDARD](./EPC-GO-LIVE-03A-AUDIT-TRAIL-STANDARD.md)
- [EPC-GO-LIVE-03B-STAGING-EVIDENCE-TEMPLATE](./EPC-GO-LIVE-03B-STAGING-EVIDENCE-TEMPLATE.md)
- [EPC-RELEASE-READINESS-AUDIT](./EPC-RELEASE-READINESS-AUDIT.md)

---

## 2. Checklist por Fase

### Fase 0 - Pré-condições

| ID | Descrição | Responsável | Comando(s) | Resultado esperado | Evidência a coletar | Critério de aprovação | Pode avançar? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F0-01 | Validar branch e commit atual | DevOps / Arquiteto | `git branch --show-current`<br>`git log -1 --oneline` | Branch correta e commit identificado | Saída do terminal | Branch e commit conferem com a release aprovada | Não |
| F0-02 | Confirmar checklist EPC-GO-LIVE-01 aprovado | Responsável Produto / Arquiteto | Leitura do documento aprovado | Checklist concluído | Link do checklist e status | Checklist completo e sem pendências P0 | Não |
| F0-03 | Confirmar janela de deploy | DevOps / Infra | Validacao manual do cronograma | Janela confirmada | Registro da janela | Janela aprovada por todos os responsáveis | Não |
| F0-04 | Confirmar rollback aprovado | DevOps / Banco / Arquiteto | Leitura do plano de rollback | Rollback disponível | Documento de rollback | Plano assinado e revisado | Não |
| F0-05 | Confirmar backup aprovado | Banco / Infra | Verificação do backup recente | Backup válido | Log/print do backup | Backup restaurável e recente | Sim |

Checkpoint de aprovação:

- [ ] Aprovado
- [ ] Reprovado
- Observações: ____________________
- Responsável: ____________________
- Data/Hora: ____________________

---

### Fase 1 - Infraestrutura

| ID | Descrição | Responsável | Comando(s) | Resultado esperado | Evidência a coletar | Critério de aprovação | Pode avançar? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F1-01 | Validar VPS | Infra | Acesso e inventory do host | Host acessível | Print / log de acesso | VPS responde e está saudável | Não |
| F1-02 | Validar Docker | Infra | `docker --version` | Docker instalado | Saída do comando | Versão correta e serviço ativo | Não |
| F1-03 | Validar Docker Compose | Infra | `docker compose version` | Compose instalado | Saída do comando | Compose disponível | Não |
| F1-04 | Validar Nginx | Infra | `nginx -t` / health via proxy | Configuração válida | Saída do comando | Sintaxe e proxy OK | Não |
| F1-05 | Validar domínio e DNS | Infra | `nslookup` / `dig` | DNS aponta corretamente | Saída do comando | Resolve para o edge correto | Não |
| F1-06 | Validar SSL/TLS | Infra | `curl -I https://dominio/health` | HTTPS responde | Cabeçalhos e certificado | Certificado válido e sem erro | Não |
| F1-07 | Validar firewall | Infra | Checagem de portas | Portas liberadas conforme plano | Saída do host | Apenas portas esperadas expostas | Não |
| F1-08 | Validar timezone/NTP | Infra | Checagem do sistema | Hora sincronizada | Saída do host | NTP ativo e timezone correto | Sim |

Checkpoint de aprovação:

- [ ] Aprovado
- [ ] Reprovado
- Observações: ____________________
- Responsável: ____________________
- Data/Hora: ____________________

---

### Fase 2 - Ambiente

| ID | Descrição | Responsável | Comando(s) | Resultado esperado | Evidência a coletar | Critério de aprovação | Pode avançar? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F2-01 | Validar `backend/.env.production` ou runbook equivalente | Arquiteto / Infra | Leitura da configuração | Ambiente pronto | Documento/arquivo de env | Variáveis essenciais definidas | Não |
| F2-02 | Validar variáveis frontend | Frontend / DevOps | Leitura das variáveis públicas | API URL correta | Print / arquivo | Frontend aponta para backend oficial | Não |
| F2-03 | Validar `DATABASE_URL` | Banco | Leitura de secret/config | Banco correto | Registro da variável | URL válida e segura | Não |
| F2-04 | Validar JWT secrets | Segurança / DevOps | Leitura de secret/config | Secrets fortes e distintos | Registro controlado | Secrets válidos e diferentes | Não |
| F2-05 | Validar integrações | Responsável técnico | Leitura de config | Integrações corretas | Evidência de config | Integrações aprovadas ou desativadas | Não |
| F2-06 | Validar variáveis obrigatórias | DevOps / Backend | Startup validation | Nenhuma variável ausente | Saída do runtime | Env validation sem erro | Sim |

Checkpoint de aprovação:

- [ ] Aprovado
- [ ] Reprovado
- Observações: ____________________
- Responsável: ____________________
- Data/Hora: ____________________

---

### Fase 3 - Banco

| ID | Descrição | Responsável | Comando(s) | Resultado esperado | Evidência a coletar | Critério de aprovação | Pode avançar? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F3-01 | Validar backup | Banco | Processo de backup aprovado | Backup disponível | Log/artefato | Backup recente e íntegro | Não |
| F3-02 | Testar restore | Banco | Restore em ambiente seguro | Restore funciona | Log de restore | Restore validado com sucesso | Não |
| F3-03 | Gerar Prisma Client | Banco / Backend | `cd backend && npm run db:generate` | Prisma gerado | Saída do comando | Prisma sem erro | Não |
| F3-04 | Aplicar migration | Banco | `cd backend && npm run db:migrate:deploy` | Migration aplicada | Log da migration | Sem erro e schema consistente | Não |
| F3-05 | Validar seed inicial | Banco / Produto | `cd backend && npm run db:seed` | Seed executado | Log do seed | Seed válido para staging | Não |
| F3-06 | Validar tenant inicial | Banco / Infra | Query/checação manual | Tenant base presente | Print/resultado | Tenant disponível e isolado | Não |
| F3-07 | Validar usuário administrador | Banco / Segurança | Fluxo de validação | Admin autenticável | Evidência de login | Admin com permissões corretas | Sim |

Checkpoint de aprovação:

- [ ] Aprovado
- [ ] Reprovado
- Observações: ____________________
- Responsável: ____________________
- Data/Hora: ____________________

---

### Fase 4 - Build

| ID | Descrição | Responsável | Comando(s) | Resultado esperado | Evidência a coletar | Critério de aprovação | Pode avançar? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F4-01 | Build frontend | Frontend / DevOps | `npm run build` | Build concluído | Saída do comando | Sem erro de build | Não |
| F4-02 | Testes frontend | Frontend / QA | `npm test` | Testes aprovados | Saída do comando | Suite verde | Não |
| F4-03 | Build backend | Backend / DevOps | `cd backend && npm run build` | Build backend concluído | Saída do comando | Sem erro de build | Não |
| F4-04 | Testes backend | Backend / QA | `cd backend && npm test` | Testes aprovados | Saída do comando | Suite verde | Não |
| F4-05 | Docker build | DevOps / Infra | `docker build ...` | Imagem gerada | Log da build | Imagem pronta | Não |
| F4-06 | Tag/versionamento | Arquiteto / DevOps | `git tag` / processo de release | Versão registrada | Hash/tag | Versão candidata aprovada | Sim |

Checkpoint de aprovação:

- [ ] Aprovado
- [ ] Reprovado
- Observações: ____________________
- Responsável: ____________________
- Data/Hora: ____________________

---

### Fase 5 - Deploy

| ID | Descrição | Responsável | Comando(s) | Resultado esperado | Evidência a coletar | Critério de aprovação | Pode avançar? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F5-01 | Pull da imagem/código | DevOps | `docker compose pull` ou equivalente | Artefato correto | Log do pull | Artefato esperado obtido | Não |
| F5-02 | Subir stack | DevOps / Infra | `docker compose up -d` | Serviços sobem | Log do compose | Containers saudáveis | Não |
| F5-03 | Restart controlado | Infra | `docker compose restart` | Serviços reiniciados | Log do restart | Sem queda de serviço | Não |
| F5-04 | Checar logs | DevOps | `docker compose logs -f api` | Sem erro crítico | Captura de logs | Logs livres de falha P0 | Não |
| F5-05 | Checar health | DevOps / SRE | `curl .../health` | Health OK | Saída do comando | HTTP 200 e payload OK | Não |
| F5-06 | Checar readiness | DevOps / SRE | `curl .../ready` | Readiness OK | Saída do comando | HTTP 200 e payload OK | Não |
| F5-07 | Checar metrics | DevOps / SRE | `curl .../metrics` | Metrics expostas | Saída do comando | Métricas disponíveis | Sim |

Checkpoint de aprovação:

- [ ] Aprovado
- [ ] Reprovado
- Observações: ____________________
- Responsável: ____________________
- Data/Hora: ____________________

---

### Fase 6 - Smoke Tests

| ID | Descrição | Responsável | Comando(s) | Resultado esperado | Evidência a coletar | Critério de aprovação | Pode avançar? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F6-01 | Login | Validação funcional | Navegação manual/API | Autenticado com sucesso | Print/log | Login funciona | Não |
| F6-02 | Sessão | Validação funcional | Navegação pós-login | Sessão preservada | Print/log | Sessão válida | Não |
| F6-03 | Refresh token | Backend / QA | Chamada autenticada | Refresh OK | Log da resposta | Token renovado | Não |
| F6-04 | Usuários | Validação funcional | Acesso às rotas | Lista/CRUD conforme esperado | Print/log | Fluxo funcional | Não |
| F6-05 | Clientes | Validação funcional | Acesso às rotas | Lista/CRUD conforme esperado | Print/log | Fluxo funcional | Não |
| F6-06 | Parceiros | Validação funcional | Acesso às rotas | Lista/CRUD conforme esperado | Print/log | Fluxo funcional | Não |
| F6-07 | Oportunidades | Validação funcional | Acesso às rotas | Fluxo operacional funcional | Print/log | Fluxo funcional | Não |
| F6-08 | Pipelines | Validação funcional | Acesso às rotas | Pipeline funcional | Print/log | Fluxo funcional | Não |
| F6-09 | Master Catalog | Validação funcional | Acesso às rotas | Catálogo funcional | Print/log | Fluxo funcional | Não |
| F6-10 | Simulação | Validação funcional | Fluxo da tela | Simulação funcional | Print/log | Fluxo funcional | Não |
| F6-11 | RBAC | Segurança | Tentativa de acesso indevido | Acesso negado | Log/print | Permissões corretas | Não |
| F6-12 | Tenant | Segurança | Tentativa cross-tenant | Acesso negado | Log/print | Isolamento preservado | Não |
| F6-13 | Auditoria | Backend / SRE | Ação rastreável | Evento gerado | Log/evento | Auditoria gravada | Não |
| F6-14 | Health | SRE | `curl .../health` | Health OK | Saída do comando | 200 OK | Sim |

Checkpoint de aprovação:

- [ ] Aprovado
- [ ] Reprovado
- Observações: ____________________
- Responsável: ____________________
- Data/Hora: ____________________

---

### Fase 7 - Go/No-Go

| ID | Descrição | Responsável | Comando(s) | Resultado esperado | Evidência a coletar | Critério de aprovação | Pode avançar? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F7-01 | Revisar critérios P0 | Arquiteto / SRE | Revisão final | Sem bloqueio P0 | Ata consolidada | P0 zerado | Não |
| F7-02 | Revisar critérios P1 | Produto / Infra | Revisão final | Pendencias controladas | Ata consolidada | P1 aceito com restrições ou zerado | Não |
| F7-03 | Revisar critérios P2 | Equipe | Revisão final | Melhorias registradas | Ata consolidada | Risco aceito | Não |
| F7-04 | Aprovar decisão | Responsável Go/No-Go | Assinatura | GO, GO WITH RESTRICTIONS ou NO GO | Ata assinada | Decisão registrada | Sim |

Checkpoint de aprovação:

- [ ] Aprovado
- [ ] Reprovado
- Observações: ____________________
- Responsável: ____________________
- Data/Hora: ____________________

---

### Fase 8 - Pós Go-Live

| ID | Descrição | Responsável | Comando(s) | Resultado esperado | Evidência a coletar | Critério de aprovação | Pode avançar? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F8-01 | Monitorar 2h | SRE / Infra | Observabilidade | Sem degradação | Logs/prints | Sem incidentes P0 | Não |
| F8-02 | Monitorar 24h | SRE / Infra | Observabilidade | Estabilidade mantida | Logs/prints | Sem incidentes recorrentes | Não |
| F8-03 | Monitorar 72h | SRE / Infra | Observabilidade | Estado consolidado | Logs/prints | Operação estável | Não |
| F8-04 | Plano de incidentes | SRE / Produto | Processo de incidentes | Resposta pronta | Documento/registro | Plano aplicável | Não |
| F8-05 | Checklist de estabilização | SRE / Produto | Revisão operacional | Ambiente estabilizado | Ata final | Sem pendencias abertas | Sim |

Checkpoint de aprovação:

- [ ] Aprovado
- [ ] Reprovado
- Observações: ____________________
- Responsável: ____________________
- Data/Hora: ____________________

---

## 3. Checkpoints de Aprovação

Ao final de cada fase, registrar:

- [ ] Aprovado
- [ ] Reprovado
- Observações: ____________________
- Responsável: ____________________
- Data/Hora: ____________________

Uso:

- preencher imediatamente após encerrar a fase;
- nunca avançar para a próxima fase sem checkpoint assinado;
- manter os registros junto das evidências.

---

## 4. Critérios de Interrupção

Interromper imediatamente a execução se ocorrer qualquer um dos itens abaixo:

- build falhou;
- migration falhou;
- health check falhou;
- login falhou;
- RBAC falhou;
- tenant isolation falhou;
- erro HTTP 5xx recorrente;
- smoke test crítico falhou.

### Ações obrigatórias após interrupção

1. Parar a fase em andamento.
2. Registrar a evidência da falha.
3. Acionar o responsável técnico e o responsável de go/no-go.
4. Avaliar rollback.
5. Registrar a decisão de continuidade ou bloqueio.

---

## 5. Evidências Obrigatórias

Os seguintes artefatos devem ser anexados ao pacote de homologação:

- logs de build;
- logs de teste;
- saída dos comandos executados;
- versão implantada;
- commit hash;
- screenshots quando aplicavel;
- logs de health/readiness/metrics;
- evidências de login, RBAC e tenant isolation;
- log de migration e seed;
- ata de Go/No-Go;
- registro de rollback, se houver.

---

## 6. Plano de Rollback Operacional

### Quando executar

Executar rollback quando ocorrer qualquer critério de interrupção sem solução imediata e segura dentro da janela do deploy.

### Quem autoriza

- responsável go/no-go;
- responsável técnico;
- responsável infraestrutura, quando o problema for de edge/runtime;
- responsável banco, quando o problema envolver migration/dados.

### Sequência

1. Bloquear novas conexões/rotas, se necessário.
2. Reverter a imagem para a versão anterior.
3. Reverter o código para o commit anterior, se necessário.
4. Reverter o banco somente com estratégia aprovada.
5. Restaurar backup, se aplicável.
6. Reverter DNS/proxy se o problema estiver no edge.
7. Validar health/readiness após rollback.
8. Validar login, RBAC e tenant isolation.

### Validação após rollback

- health OK;
- readiness OK;
- rotas críticas acessíveis;
- login funcional;
- sem 5xx recorrente;
- evidência de retorno ao estado seguro.

---

## 7. Encerramento

### Tabela final

| Fase concluída | Pendências | Riscos aceitos | Decisão |
| --- | --- | --- | --- |
| ____________________ | ____________________ | ____________________ | □ GO  □ GO WITH RESTRICTIONS  □ NO GO |

### Observações finais

- registrar o status de cada checkpoint;
- consolidar as evidências em um único pacote;
- manter a ata assinada por todos os papéis relevantes.

---

## 8. Aprovação Final

| Campo | Valor |
| --- | --- |
| Arquiteto | ____________________ |
| DevOps | ____________________ |
| Responsável Infraestrutura | ____________________ |
| Responsável Produto | ____________________ |
| Data | ____________________ |
| Versão | ____________________ |
| Commit | ____________________ |

---

## Veredito

Este playbook foi estruturado para suportar homologação com checkpoints formais, critérios de continuidade e evidências obrigatórias.

### Veredito final

- **READY FOR STAGING EXECUTION**
