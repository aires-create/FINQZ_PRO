# EPC-PRODUCT-02 - End-to-End Business Scenarios

## 1. Objetivo

Estruturar a validação funcional do FINQZ PRO Enterprise com base em cenários reais de negócio, cobrindo jornadas completas por perfil e fluxos ponta a ponta relevantes para a homologação em Staging.

Este documento complementa a auditoria de prontidão do produto e transforma a fotografia funcional em um plano de validação operacional, priorizado por valor de negócio, continuidade operacional e impacto na experiência do usuário.

---

## 2. Premissas

- a arquitetura, a infraestrutura e a documentação não fazem parte desta validação;
- a validação aqui é exclusivamente funcional e orientada a negócio;
- os cenários devem ser executados em Staging com dados reais ou representativos;
- a evidência deve incluir comportamento observado, resultado esperado e sinais de negócio;
- a prioridade é a continuidade operacional ponta a ponta.

---

## 3. Jornadas por Perfil

### 3.1 Administrador

| Campo | Descrição |
|---|---|
| Objetivo | Administrar acesso, configurações, auditoria, integrações e governança do produto |
| Pré-condições | Usuário com perfil administrativo e permissões de gestão |
| Sequência de passos | Entrar no sistema > acessar administração > revisar usuários, permissões, integrações, pipelines, auditoria e segurança > ajustar configurações necessárias |
| Módulos envolvidos | Usuários, RBAC, Auditoria, Integrações, Pipelines, Configurações, Segurança, Eventos |
| Dados necessários | Tenant ativo, roles, permissões, integrações habilitadas, logs de atividade |
| Resultado esperado | Administração consistente, rastreável e sem exposição indevida de dados entre tenants |
| Evidências a coletar | Prints de telas-chave, logs de mudança, resultados de filtros, comportamento de permissões |
| Critérios de sucesso | Acesso controlado, mudanças persistidas, auditoria visível, sem quebra de navegação |

Status sugerido da jornada: `READY`

---

### 3.2 Gerente Comercial B2B

| Campo | Descrição |
|---|---|
| Objetivo | Gerir carteira, pipeline, oportunidades, simulações, propostas e acompanhamento comercial |
| Pré-condições | Usuário com acesso ao CRM e às operações comerciais |
| Sequência de passos | Abrir dashboard > selecionar oportunidades > analisar pipeline > abrir oportunidade > simular > gerar proposta > registrar follow-up > mover estágio |
| Módulos envolvidos | Dashboard, CRM, Oportunidades, Pipeline, Simulação, Proposta, Tarefas, Timeline, Relatórios |
| Dados necessários | Lead/cliente, dados de produto, condições comerciais, responsável, SLA, histórico |
| Resultado esperado | Execução comercial fluida do lead até a proposta com baixa fricção |
| Evidências a coletar | Tempo de execução, cliques por operação, prints do workspace, status de tarefa |
| Critérios de sucesso | Jornada concluída sem troca desnecessária de contexto e sem ambiguidade comercial |

Status sugerido da jornada: `PARTIAL`

---

### 3.3 Gerente Comercial B2C

| Campo | Descrição |
|---|---|
| Objetivo | Operar oportunidades de volume, monitorar performance e manter qualidade de conversão |
| Pré-condições | Perfil com acesso à visão comercial e às oportunidades aplicáveis |
| Sequência de passos | Revisar dashboard > filtrar oportunidades > avaliar etapas > acompanhar pendências > apoiar fechamento |
| Módulos envolvidos | Dashboard, Oportunidades, Pipeline, Relatórios, Auditoria |
| Dados necessários | Funil segmentado, indicadores, status operacional, pendências |
| Resultado esperado | Acompanhamento claro da carteira com visão consolidada de produção |
| Evidências a coletar | KPIs, status por etapa, uso de filtros, rastreio de mudanças |
| Critérios de sucesso | Visão de performance e acompanhamento de funil sem ruído operacional |

Status sugerido da jornada: `PARTIAL`

---

### 3.4 SDR

| Campo | Descrição |
|---|---|
| Objetivo | Qualificar leads, iniciar relacionamento, registrar contatos e encaminhar oportunidades |
| Pré-condições | Leads disponíveis e pipeline configurado |
| Sequência de passos | Receber lead > pesquisar dados > registrar contato > classificar interesse > criar/atualizar oportunidade > agendar follow-up |
| Módulos envolvidos | SDR IA, CRM, Oportunidades, Tarefas, Anotações, Conversas, Campanhas |
| Dados necessários | Leads, histórico de contato, tags, origem, produto de interesse |
| Resultado esperado | Qualificação objetiva e encaminhamento rápido para o fluxo comercial |
| Evidências a coletar | Conversões, registros de follow-up, tempo até atualização, status da oportunidade |
| Critérios de sucesso | Redução de cliques, clareza da próxima ação e preservação do histórico |

Status sugerido da jornada: `PARTIAL`

---

### 3.5 Parceiro Comercial

| Campo | Descrição |
|---|---|
| Objetivo | Operar sua carteira, acompanhar aquisição, consultar oportunidades e interagir com o hub |
| Pré-condições | Perfil de parceiro ativo, carteira e permissões próprias |
| Sequência de passos | Login de parceiro > visualizar dashboard > acessar carteira > acompanhar leads/prospects > consultar histórico > agir sobre pendências |
| Módulos envolvidos | Dashboard Parceiro, Parceiros, Partner Acquisition, Oportunidades, Conversas, Relatórios |
| Dados necessários | Carteira, oportunidades atribuídas, status de aquisição, contatos e histórico |
| Resultado esperado | Visão clara da carteira e execução segura do fluxo do parceiro |
| Evidências a coletar | Acesso por perfil, exibição correta da carteira, ações registradas |
| Critérios de sucesso | Isolamento de dados por tenant e clareza da operação do parceiro |

Status sugerido da jornada: `READY`

---

### 3.6 Backoffice

| Campo | Descrição |
|---|---|
| Objetivo | Validar, organizar e suportar etapas operacionais, documentação e execução interna |
| Pré-condições | Perfil com acesso operacional e capacidade de leitura/escrita conforme o processo |
| Sequência de passos | Consultar oportunidade > validar dados > acompanhar documentação > registrar suporte > atualizar status |
| Módulos envolvidos | Oportunidades, Documentos, Timeline, Operações, Auditoria, Relatórios |
| Dados necessários | Documentos, status de etapa, pendências, observações |
| Resultado esperado | Operação organizada com histórico auditável e sem perda de rastreio |
| Evidências a coletar | Atualizações na timeline, registros de documento, status operacional |
| Critérios de sucesso | Execução consistente, auditável e sem retrabalho desnecessário |

Status sugerido da jornada: `PARTIAL`

---

### 3.7 Operador Financeiro

| Campo | Descrição |
|---|---|
| Objetivo | Acompanhar o ciclo financeiro, validar operações, consultar movimentos e agir com rastreabilidade |
| Pré-condições | Perfil com acesso a financeiro e conta corrente |
| Sequência de passos | Acessar financeiro > consultar movimentações > validar dados > revisar status > registrar ação |
| Módulos envolvidos | Financeiro, Conta Corrente, Operações, Auditoria, Relatórios |
| Dados necessários | Movimentos, status de operação, dados da transação, evidências |
| Resultado esperado | Conciliação e acompanhamento financeiro coerente e rastreável |
| Evidências a coletar | Listagens, filtros, mudanças de status, trilha de auditoria |
| Critérios de sucesso | Visão operacional confiável com leitura clara de status e histórico |

Status sugerido da jornada: `PARTIAL`

---

## 4. Fluxos End-to-End Obrigatórios

### 4.1 Lead -> Cliente -> Oportunidade -> Simulação -> Proposta -> Operação -> Auditoria -> Relatórios

| Campo | Conteúdo |
|---|---|
| Objetivo | Validar a cadeia principal de geração e conversão de receita |
| Módulos envolvidos | CRM, Oportunidades, Simulação, Proposta, Operações, Auditoria, Relatórios |
| Dados necessários | Lead qualificado, cliente cadastrado, produto, condições, permissões, histórico e SLA |
| Resultado esperado | Fluxo ponta a ponta executado sem bloqueios funcionais |
| Evidências | screenshots de cada etapa, logs de atualização, histórico, proposta gerada, operação registrada |
| Critérios de sucesso | Nenhuma ruptura entre os estágios e visibilidade clara da próxima ação |
| Classificação | `PARTIAL` |

### 4.2 Cadastro e gestão de Parceiros

| Campo | Conteúdo |
|---|---|
| Objetivo | Garantir o ciclo de cadastro, consulta, carteira e acompanhamento do parceiro |
| Módulos envolvidos | Parceiros, Partner Acquisition, Dashboard Parceiro, Relatórios |
| Resultado esperado | Parceiro ativo, consultável e com carteira visível |
| Classificação | `READY` |

### 4.3 Administração de Pipelines

| Campo | Conteúdo |
|---|---|
| Objetivo | Criar, organizar, reordenar, arquivar e visibilizar etapas comerciais |
| Módulos envolvidos | Pipelines, Oportunidades, Administração |
| Resultado esperado | Pipeline coerente com o processo comercial e com visibilidade correta |
| Classificação | `READY` |

### 4.4 Gestão de Usuários e RBAC

| Campo | Conteúdo |
|---|---|
| Objetivo | Criar usuários, atribuir papéis, controlar permissões e validar sessão |
| Módulos envolvidos | Usuários, RBAC, Auth, Auditoria |
| Resultado esperado | Acesso controlado por tenant e permissão, com sessão e refresh válidos |
| Classificação | `READY` |

### 4.5 Configuração do Master Catalog

| Campo | Conteúdo |
|---|---|
| Objetivo | Validar produtos, tabelas, condições e providers como referência oficial |
| Módulos envolvidos | Master Catalog, Integrations, Simulação, Oportunidades |
| Resultado esperado | Catálogo consistente, versionado e utilizável pela operação |
| Classificação | `READY` |

### 4.6 Operações Financeiras

| Campo | Conteúdo |
|---|---|
| Objetivo | Validar acompanhamento, movimento e status financeiro com auditabilidade |
| Módulos envolvidos | Financeiro, Conta Corrente, Operações, Auditoria |
| Resultado esperado | Fluxo financeiro legível e rastreável |
| Classificação | `PARTIAL` |

### 4.7 Hub de Comunicação

| Campo | Conteúdo |
|---|---|
| Objetivo | Validar campanhas, conversas, SDR IA, higienização, disparos e e-mail marketing |
| Módulos envolvidos | Campanhas, Conversas, Audiências, SDR IA, Disparos, Higienização, E-mail Marketing |
| Resultado esperado | Operação multicanal navegável e com resposta funcional |
| Classificação | `PARTIAL` |

### 4.8 Integrações com providers

| Campo | Conteúdo |
|---|---|
| Objetivo | Validar health, diagnostics, retry, timeout e capabilities dos provedores |
| Módulos envolvidos | Integrações, Provider Operations Console, Master Catalog, EDP |
| Resultado esperado | Provedores observáveis e operáveis com comportamento previsível |
| Classificação | `PARTIAL` |

### 4.9 Dashboards e KPIs

| Campo | Conteúdo |
|---|---|
| Objetivo | Confirmar que os indicadores executivos refletem produção, funil e riscos |
| Módulos envolvidos | Dashboard, Relatórios, Auditoria, Operações |
| Resultado esperado | KPIs confiáveis e úteis para decisão |
| Classificação | `PARTIAL` |

---

## 5. Matriz de Priorização

### P0

| Item | Motivo |
|---|---|
| Fluxo Lead -> Cliente -> Oportunidade -> Simulação -> Proposta -> Operação -> Auditoria -> Relatórios | É a espinha dorsal do negócio |
| Gestão de Usuários e RBAC | Segurança e continuidade operacional |
| Administração de Pipelines | Controla o funil e a operação comercial |
| Master Catalog | Base de oferta e condição comercial |

### P1

| Item | Motivo |
|---|---|
| Cadastro e gestão de Parceiros | Canal de aquisição e carteira |
| Operações Financeiras | Continuidade pós-conversão |
| Integrações com providers | Dependência de execução e diagnóstico |
| Dashboards e KPIs | Leitura executiva e controle |

### P2

| Item | Motivo |
|---|---|
| Hub de Comunicação | Amplia escala operacional |
| Otimizações finas de UX | Melhora produtividade e consistência |
| Ajustes de performance percebida | Eleva qualidade de experiência |

---

## 6. Quick Wins

| Quick Win | Impacto | Observação |
|---|---|---|
| Padronizar estados vazios e carregamento | Alto | Gera confiança e previsibilidade |
| Garantir CTA principal por jornada | Alto | Reduz cliques e ambiguidade |
| Melhorar microcopy de status e próximos passos | Médio | Aumenta clareza operacional |
| Harmonizar feedback visual entre módulos | Médio | Melhora a sensação de produto único |

---

## 7. UX Debt

| Débito | Módulos mais afetados | Efeito esperado |
|---|---|---|
| Densidade alta em workspaces críticos | Oportunidades, Simulação, Operações | Exige mais tempo de leitura |
| Competição entre ações e informações | Dashboard, Hub, Admin | Reduz foco na próxima ação |
| Variedade de padrões de feedback | Múltiplos módulos | Exige curva de aprendizado maior |
| Dependência de telas longas para tarefas críticas | CRM, Operações | Aumenta o custo cognitivo |

---

## 8. Business Risk

| Risco | Onde afeta | Impacto |
|---|---|---|
| Fluxo comercial não validado com dados reais | Lead -> Proposta | Pode gerar perda de conversão |
| Simulação com interpretação ambígua | Simulação / Oportunidades | Pode reduzir confiança comercial |
| Permissões inconsistentes em cenários reais | Usuários / RBAC | Pode bloquear ou expor operações |
| Integrações com providers sem leitura clara de saúde | Integrações / Master Catalog | Pode afetar estabilidade operacional |
| KPIs sem alinhamento com a execução | Dashboard / Relatórios | Pode afetar decisão executiva |

---

## 9. Critérios para Validação em Staging

Para cada cenário, a validação em Staging deve registrar:

- usuário/perfil usado;
- pré-condições de dados;
- sequência executada;
- módulo acessado em cada etapa;
- evidência visual;
- resultado esperado;
- resultado obtido;
- tempo total para concluir a jornada;
- falhas, desvios e ambiguidades observados.

Critérios mínimos:

1. o usuário consegue concluir a jornada sem ajuda externa;
2. o sistema mantém histórico e auditoria;
3. a próxima ação é compreensível;
4. a navegação não quebra o contexto;
5. permissões e tenant são respeitados;
6. o resultado final é rastreável.

---

## 10. Roadmap de Execução

### PRODUCT-W1 - Fluxos Críticos

- Lead -> Cliente -> Oportunidade -> Simulação -> Proposta -> Operação -> Auditoria -> Relatórios;
- Gestão de usuários e RBAC;
- Administração de pipelines;
- Master Catalog;
- validação de segurança e sessão.

### PRODUCT-W2 - Fluxos Administrativos

- Parceiros;
- Operações financeiras;
- Integrações com providers;
- dashboards e KPIs;
- auditoria e eventos;
- suporte a administração enterprise.

### PRODUCT-W3 - Otimizações de UX e Performance

- padronização de estados vazios, loading e erro;
- redução de densidade em workspaces críticos;
- consistência de labels, badges e ações;
- percepção de performance;
- refinamento da jornada do SDR, do gerente comercial e do backoffice.

---

## 11. Veredito

**Veredito esperado:** `READY FOR STAGING FUNCTIONAL VALIDATION`

### Interpretação

O produto já possui massa funcional suficiente para iniciar a validação em Staging com cenários reais de negócio. O foco agora é provar continuidade operacional, clareza de jornada e consistência entre perfis, sem alterar arquitetura ou corrigir bugs nesta fase.

