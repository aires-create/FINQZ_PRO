# EPC-PRODUCT-03 - UAT Test Case Pack

## 1. Objetivo

Transformar os cenários end-to-end do produto FINQZ PRO Enterprise em casos de teste executáveis para homologação funcional em Staging, com foco em continuidade operacional, clareza de jornada e validação objetiva por perfil.

Este pacote é a base operacional de UAT para a primeira homologação funcional do produto.

---

## 2. Premissas

- a execução ocorrerá em Staging;
- os testes não alteram arquitetura, banco ou regras de negócio;
- os resultados devem ser coletados com evidências;
- cada teste deve ter status claro e criticidade definida;
- o objetivo é validar o produto, não corrigir bugs durante a execução.

---

## 3. Padrão do Caso de Teste

Cada caso de teste utiliza a seguinte estrutura:

- ID do teste
- Perfil responsável
- Objetivo
- Pré-condições
- Dados necessários
- Passo a passo
- Resultado esperado
- Evidência obrigatória
- Status: `PASS / FAIL / BLOCKED / WAIVED`
- Severidade: `P0 / P1 / P2`
- Observações

---

## 4. Casos de Teste por Perfil

### 4.1 Administrador

#### UAT-ADM-001 - Login administrativo e sessão

- **Perfil responsável:** Administrador
- **Objetivo:** validar login, sessão e refresh token
- **Pré-condições:** usuário admin existente e ativo
- **Dados necessários:** credenciais válidas, tenant ativo
- **Passo a passo:**
  1. acessar a tela de login
  2. autenticar com credenciais administrativas
  3. validar carregamento da sessão
  4. executar refresh token
- **Resultado esperado:** login realizado, sessão persistida e refresh aceito
- **Evidência obrigatória:** print da sessão, resposta de refresh, logs de autenticação
- **Status:** `BLOCKED`
- **Severidade:** `P0`
- **Observações:** base para toda a UAT

#### UAT-ADM-002 - Gestão de usuários e RBAC

- **Perfil responsável:** Administrador
- **Objetivo:** criar, editar e validar permissões de usuários
- **Pré-condições:** admin autenticado e tenant válido
- **Dados necessários:** nome, e-mail, role, permissões
- **Passo a passo:**
  1. abrir gestão de usuários
  2. criar usuário
  3. atribuir role
  4. alterar permissões
  5. validar acesso por perfil
- **Resultado esperado:** usuário criado e restrito conforme RBAC
- **Evidência obrigatória:** prints, logs de alteração, tentativa de acesso negado/permitido
- **Status:** `BLOCKED`
- **Severidade:** `P0`
- **Observações:** valida isolamento de capacidade funcional

#### UAT-ADM-003 - Administração de pipelines

- **Perfil responsável:** Administrador
- **Objetivo:** validar CRUD, ordenação, arquivamento e visibilidade de pipeline
- **Pré-condições:** admin com permissão de pipeline
- **Dados necessários:** nome do pipeline, estágios, regra de visibilidade
- **Passo a passo:**
  1. abrir administração de pipelines
  2. criar ou editar pipeline
  3. reordenar etapas
  4. arquivar etapa
  5. salvar e reabrir
- **Resultado esperado:** pipeline consistente e persistido
- **Evidência obrigatória:** prints antes/depois, confirmação de persistência
- **Status:** `BLOCKED`
- **Severidade:** `P0`
- **Observações:** impacto direto no funil comercial

#### UAT-ADM-004 - Configuração de integrações e auditoria

- **Perfil responsável:** Administrador
- **Objetivo:** validar acesso às integrações, auditoria e consoles operacionais
- **Pré-condições:** admin autenticado
- **Dados necessários:** credenciais de integração, tenant e parâmetros
- **Passo a passo:**
  1. abrir integrações
  2. revisar saúde/configuração
  3. abrir auditoria
  4. confirmar eventos e logs
- **Resultado esperado:** visão administrativa coerente e auditável
- **Evidência obrigatória:** prints dos painéis e eventos
- **Status:** `BLOCKED`
- **Severidade:** `P1`
- **Observações:** valida governança operacional

---

### 4.2 Gerente Comercial B2B

#### UAT-B2B-001 - Pipeline comercial e oportunidade

- **Perfil responsável:** Gerente Comercial B2B
- **Objetivo:** validar leitura do funil, abertura de oportunidade e próximo passo
- **Pré-condições:** oportunidades disponíveis
- **Dados necessários:** cliente, pipeline, etapa, responsável
- **Passo a passo:**
  1. abrir dashboard comercial
  2. acessar pipeline
  3. abrir oportunidade
  4. revisar timeline, tarefas e status
- **Resultado esperado:** leitura clara da oportunidade e da próxima ação
- **Evidência obrigatória:** print do workspace e da timeline
- **Status:** `BLOCKED`
- **Severidade:** `P0`
- **Observações:** fluxo central do produto

#### UAT-B2B-002 - Simulação e proposta

- **Perfil responsável:** Gerente Comercial B2B
- **Objetivo:** validar simulação, geração de proposta e leitura de resultado
- **Pré-condições:** oportunidade com dados suficientes
- **Dados necessários:** produto, valores, condições, dados do cliente
- **Passo a passo:**
  1. abrir simulador dentro da oportunidade
  2. preencher campos
  3. calcular
  4. revisar resultado
  5. gerar proposta
- **Resultado esperado:** resultado compreensível e proposta gerada
- **Evidência obrigatória:** print do resultado e da proposta
- **Status:** `BLOCKED`
- **Severidade:** `P0`
- **Observações:** alta criticidade comercial

#### UAT-B2B-003 - Gestão de follow-up e movimentação de etapa

- **Perfil responsável:** Gerente Comercial B2B
- **Objetivo:** validar follow-up, tarefas e mudança de estágio
- **Pré-condições:** oportunidade ativa
- **Dados necessários:** ação, data, responsável, etapa destino
- **Passo a passo:**
  1. registrar tarefa/follow-up
  2. revisar histórico
  3. mover oportunidade de etapa
- **Resultado esperado:** histórico atualizado e estágio alterado
- **Evidência obrigatória:** timeline, tarefa criada e novo estágio
- **Status:** `BLOCKED`
- **Severidade:** `P1`
- **Observações:** garante continuidade operacional

---

### 4.3 Gerente Comercial B2C

#### UAT-B2C-001 - Acompanhamento de funil e KPIs

- **Perfil responsável:** Gerente Comercial B2C
- **Objetivo:** validar dashboard, KPIs e leitura do funil
- **Pré-condições:** tenant com dados de produção
- **Dados necessários:** período, filtros, indicadores
- **Passo a passo:**
  1. abrir dashboard
  2. aplicar filtros
  3. revisar KPIs
  4. comparar produção e funil
- **Resultado esperado:** visão executiva consistente
- **Evidência obrigatória:** print do dashboard com filtros aplicados
- **Status:** `BLOCKED`
- **Severidade:** `P1`
- **Observações:** foco em leitura e decisão

#### UAT-B2C-002 - Oportunidade e conversão

- **Perfil responsável:** Gerente Comercial B2C
- **Objetivo:** validar conversão e status operacional da oportunidade
- **Pré-condições:** oportunidade ativa
- **Dados necessários:** cliente, produto, etapa, valores
- **Passo a passo:**
  1. abrir oportunidade
  2. revisar status e timeline
  3. verificar consistência de dados
- **Resultado esperado:** oportunidade legível e conversível
- **Evidência obrigatória:** print da oportunidade
- **Status:** `BLOCKED`
- **Severidade:** `P1`
- **Observações:** jornada simplificada

---

### 4.4 SDR

#### UAT-SDR-001 - Captura e qualificação de lead

- **Perfil responsável:** SDR
- **Objetivo:** validar cadastro, qualificação e encaminhamento
- **Pré-condições:** leads disponíveis
- **Dados necessários:** nome, contato, origem, interesse
- **Passo a passo:**
  1. acessar CRM/leads
  2. abrir lead
  3. qualificar
  4. registrar observação
  5. criar ou atualizar oportunidade
- **Resultado esperado:** lead qualificado e rastreável
- **Evidência obrigatória:** print do lead e da oportunidade gerada
- **Status:** `BLOCKED`
- **Severidade:** `P0`
- **Observações:** entrada do funil

#### UAT-SDR-002 - Hub de comunicação e follow-up

- **Perfil responsável:** SDR
- **Objetivo:** validar campanhas, conversas e follow-up
- **Pré-condições:** canais e contatos disponíveis
- **Dados necessários:** contato, campanha, mensagem, agendamento
- **Passo a passo:**
  1. acessar hub de comunicação
  2. revisar conversas/campanhas
  3. registrar follow-up
- **Resultado esperado:** interação registrada e visível
- **Evidência obrigatória:** prints e histórico
- **Status:** `BLOCKED`
- **Severidade:** `P1`
- **Observações:** importante para operação de escala

---

### 4.5 Parceiro Comercial

#### UAT-PAR-001 - Login e carteira do parceiro

- **Perfil responsável:** Parceiro Comercial
- **Objetivo:** validar login parceiro, carteira e visibilidade de dados
- **Pré-condições:** parceiro cadastrado e ativo
- **Dados necessários:** credenciais e carteira vinculada
- **Passo a passo:**
  1. login como parceiro
  2. abrir dashboard parceiro
  3. consultar carteira
  4. validar oportunidades vinculadas
- **Resultado esperado:** visibilidade correta da carteira
- **Evidência obrigatória:** print do dashboard e carteira
- **Status:** `BLOCKED`
- **Severidade:** `P0`
- **Observações:** isolamento por perfil é crítico

#### UAT-PAR-002 - Aquisição e histórico

- **Perfil responsável:** Parceiro Comercial
- **Objetivo:** validar aquisição, histórico e acompanhamento
- **Pré-condições:** leads/prospects atribuídos
- **Dados necessários:** carteira, prospect, status e histórico
- **Passo a passo:**
  1. acessar aquisição
  2. abrir prospect
  3. revisar histórico
  4. acompanhar evolução
- **Resultado esperado:** visão e rastreabilidade da aquisição
- **Evidência obrigatória:** prints e histórico
- **Status:** `BLOCKED`
- **Severidade:** `P1`
- **Observações:** ajuda no modelo de canal

---

### 4.6 Backoffice

#### UAT-BO-001 - Validação operacional e documentos

- **Perfil responsável:** Backoffice
- **Objetivo:** validar documentos, timeline e suporte operacional
- **Pré-condições:** oportunidade com dados e documentos
- **Dados necessários:** anexos, observações e status
- **Passo a passo:**
  1. abrir oportunidade
  2. revisar documentos
  3. validar timeline
  4. registrar observação
- **Resultado esperado:** operação rastreável e sem lacunas
- **Evidência obrigatória:** prints e histórico atualizado
- **Status:** `BLOCKED`
- **Severidade:** `P1`
- **Observações:** essencial para qualidade de entrega

#### UAT-BO-002 - Operação e auditoria

- **Perfil responsável:** Backoffice
- **Objetivo:** validar operação registrada e auditável
- **Pré-condições:** operação existente
- **Dados necessários:** operação, eventos e status
- **Passo a passo:**
  1. abrir operação
  2. conferir status
  3. verificar auditoria
- **Resultado esperado:** operação e auditoria alinhadas
- **Evidência obrigatória:** print da operação e auditoria
- **Status:** `BLOCKED`
- **Severidade:** `P1`
- **Observações:** garante rastreio

---

### 4.7 Operador Financeiro

#### UAT-FIN-001 - Conta corrente e financeiro

- **Perfil responsável:** Operador Financeiro
- **Objetivo:** validar consulta e leitura de movimentos financeiros
- **Pré-condições:** dados financeiros disponíveis
- **Dados necessários:** movimentações, status e período
- **Passo a passo:**
  1. acessar financeiro
  2. revisar movimentos
  3. consultar conta corrente
  4. validar status
- **Resultado esperado:** leitura financeira correta
- **Evidência obrigatória:** prints e registros
- **Status:** `BLOCKED`
- **Severidade:** `P1`
- **Observações:** suporta conferência operacional

#### UAT-FIN-002 - Relatórios e auditoria financeira

- **Perfil responsável:** Operador Financeiro
- **Objetivo:** validar relatórios e rastreio de eventos
- **Pré-condições:** operações registradas
- **Dados necessários:** período, operação, evento
- **Passo a passo:**
  1. abrir relatórios
  2. localizar operação
  3. cruzar com auditoria
- **Resultado esperado:** consistência entre relatório e trilha
- **Evidência obrigatória:** prints e exportação, se aplicável
- **Status:** `BLOCKED`
- **Severidade:** `P1`
- **Observações:** importante para confiança financeira

---

## 5. Cobertura Obrigatória por Fluxo

| Fluxo | Casos de teste relacionados | Status esperado | Criticidade | Evidência | Critério GO/NO GO |
|---|---|---|---|---|---|
| Login / sessão / refresh token | UAT-ADM-001, UAT-PAR-001 | PASS | P0 | print + logs | GO apenas se aprovado |
| Gestão de usuários | UAT-ADM-002 | PASS | P0 | print + logs | GO apenas se aprovado |
| RBAC | UAT-ADM-002, UAT-PAR-001 | PASS | P0 | acesso permitido/negado | GO apenas se aprovado |
| Tenant isolation | UAT-ADM-002, UAT-PAR-001 | PASS | P0 | segregação por tenant | GO apenas se aprovado |
| CRM clientes/leads | UAT-SDR-001, UAT-BO-001 | PASS | P0 | print + histórico | GO se sem ruptura |
| Parceiros | UAT-PAR-001, UAT-PAR-002 | PASS | P1 | carteira/histórico | GO with restrictions permitido |
| Pipelines | UAT-ADM-003, UAT-B2B-001 | PASS | P0 | print + persistência | GO apenas se aprovado |
| Oportunidades | UAT-B2B-001, UAT-B2C-002, UAT-SDR-001 | PASS | P0 | workspace/timeline | GO apenas se aprovado |
| Simulação | UAT-B2B-002 | PASS | P0 | resultado + proposta | GO apenas se aprovado |
| Proposta | UAT-B2B-002 | PASS | P0 | proposta gerada | GO apenas se aprovado |
| Operações | UAT-BO-002, UAT-FIN-001 | PASS | P1 | operação + auditoria | GO with restrictions possível |
| Auditoria | UAT-ADM-004, UAT-BO-002, UAT-FIN-002 | PASS | P1 | logs/timeline | GO with restrictions possível |
| Relatórios | UAT-B2C-001, UAT-FIN-002 | PASS | P1 | export/prints | GO with restrictions possível |
| Master Catalog | UAT-ADM-004 | PASS | P0 | prints/config | GO apenas se aprovado |
| Integrações/providers | UAT-ADM-004 | PASS | P1 | status/diagnostics | GO with restrictions possível |
| Hub de comunicação | UAT-SDR-002 | PASS | P1 | prints/histórico | GO with restrictions possível |
| Financeiro / Conta Corrente | UAT-FIN-001, UAT-FIN-002 | PASS | P1 | prints + relatório | GO with restrictions possível |
| Dashboards / KPIs | UAT-B2C-001 | PASS | P1 | prints + filtros | GO with restrictions possível |

---

## 6. Critérios de Decisão

### GO

Conceder `GO` somente se:

- todos os casos `P0` estiverem `PASS`;
- não houver bloqueadores em login, sessão, RBAC, tenant isolation, pipeline, oportunidades, simulação ou proposta;
- o fluxo principal ponta a ponta estiver concluído sem falhas críticas.

### GO WITH RESTRICTIONS

Conceder `GO WITH RESTRICTIONS` se:

- todos os casos `P0` estiverem `PASS`;
- houver falhas controladas em `P1` ou `P2` sem bloquear a operação principal;
- os riscos remanescentes estiverem documentados e aceitos.

### NO GO

Conceder `NO GO` se:

- qualquer caso `P0` estiver `FAIL` ou `BLOCKED`;
- houver falha em login, sessão, refresh, RBAC, tenant isolation, pipeline, oportunidade, simulação ou proposta;
- o fluxo ponta a ponta estiver quebrado.

---

## 7. Execução em Staging

### Ordem recomendada

1. Login / sessão / refresh token
2. Gestão de usuários e RBAC
3. Tenant isolation
4. Master Catalog
5. Pipelines
6. CRM clientes/leads
7. Oportunidades
8. Simulação
9. Proposta
10. Parceiros
11. Hub de comunicação
12. Operações
13. Financeiro / Conta Corrente
14. Auditoria
15. Relatórios
16. Dashboards / KPIs
17. Integrações/providers

### Responsáveis sugeridos

| Área | Responsável |
|---|---|
| Execução funcional | QA Lead |
| Perfis administrativos | Product Manager |
| Fluxos comerciais | Product Owner / Comercial |
| Fluxos financeiros | Operação Financeira |
| Aprovação final | Release Manager / Stakeholders |

### Evidências obrigatórias

- prints de telas;
- logs de sistema;
- status de acesso;
- respostas de endpoints críticos quando aplicável;
- registro do tempo de execução;
- observações de UX e bloqueios.

### Bloqueadores

- falha no login;
- falha na sessão/refresh;
- RBAC inconsistente;
- tenant isolation quebrado;
- simulação ou proposta indisponível;
- oportunidade sem fluxo funcional;
- pipeline não persistente;
- auditoria ausente em operação crítica.

---

## 8. Veredito

**Veredito esperado:** `READY FOR STAGING UAT EXECUTION`

### Interpretação

O FINQZ PRO Enterprise já possui massa funcional suficiente para iniciar a UAT em Staging, desde que a execução siga a ordem crítica de validação e trate os casos `P0` como bloqueadores absolutos.
