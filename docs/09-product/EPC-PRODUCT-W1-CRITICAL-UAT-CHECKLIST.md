# EPC-PRODUCT-W1 - Critical UAT Checklist

**Veredito esperado:** `READY FOR PRODUCT-W1 STAGING EXECUTION`

**Objetivo**

Criar um checklist operacional para execucao dos cenarios criticos P0 do FINQZ PRO Enterprise em Staging, com foco em continuidade operacional, seguranca de acesso, isolamento por tenant e validacao ponta a ponta dos fluxos essenciais.

**Base oficial utilizada**

- `docs/09-product/EPC-PRODUCT-01-PRODUCT-READINESS-AUDIT.md`
- `docs/09-product/EPC-PRODUCT-02-END-TO-END-BUSINESS-SCENARIOS.md`
- `docs/09-product/EPC-PRODUCT-03-UAT-TEST-CASE-PACK.md`

**Regras deste checklist**

- Selecionar apenas cenarios P0 ou cenarios criticos derivados diretamente dos fluxos P0 oficiais.
- Nao alterar codigo.
- Nao corrigir bugs.
- Nao executar testes reais nesta fase.
- Status padrao de emissao: `WAIVED` ate a execucao em Staging.
- Durante a UAT, cada caso deve ser atualizado para `PASS`, `FAIL`, `BLOCKED` ou `WAIVED`.

---

## 1. Ordem de execucao

| Ordem | ID do teste | Fluxo | Perfil responsavel | Base oficial | Status inicial |
|---|---|---|---|---|---|
| 01 | `UAT-HLTH-001` | Health / readiness | QA Lead | Derivado de `EPC-PRODUCT-01` e `EPC-PRODUCT-02` | `WAIVED` |
| 02 | `UAT-ADM-001` | Login / sessao / refresh token | Administrador | `EPC-PRODUCT-03 / UAT-ADM-001` | `WAIVED` |
| 03 | `UAT-ADM-002` | RBAC / tenant isolation | Administrador | `EPC-PRODUCT-03 / UAT-ADM-002` | `WAIVED` |
| 04 | `UAT-SDR-001` | CRM basico | SDR | `EPC-PRODUCT-03 / UAT-SDR-001` | `WAIVED` |
| 05 | `UAT-PAR-001` | Parceiros basico | Parceiro Comercial | `EPC-PRODUCT-03 / UAT-PAR-001` | `WAIVED` |
| 06 | `UAT-ADM-003` | Pipeline basico | Administrador | `EPC-PRODUCT-03 / UAT-ADM-003` | `WAIVED` |
| 07 | `UAT-B2B-001` | Oportunidade basica | Gerente Comercial B2B | `EPC-PRODUCT-03 / UAT-B2B-001` | `WAIVED` |
| 08 | `UAT-B2B-002` | Simulacao critica | Gerente Comercial B2B | `EPC-PRODUCT-03 / UAT-B2B-002` | `WAIVED` |
| 09 | `UAT-B2B-003` | Proposta | Gerente Comercial B2B | Derivado de `EPC-PRODUCT-02` e `UAT-B2B-002` | `WAIVED` |
| 10 | `UAT-OPS-001` | Operacao | Backoffice | Derivado de `EPC-PRODUCT-01` e `EPC-PRODUCT-02` | `WAIVED` |
| 11 | `UAT-AUD-001` | Auditoria | Administrador | Derivado de `EPC-PRODUCT-01` e `EPC-PRODUCT-02` | `WAIVED` |

---

## 2. Casos P0 - Fichas de execucao

### 2.1 UAT-HLTH-001 - Health / readiness

| Campo | Descricao |
|---|---|
| ID do teste | `UAT-HLTH-001` |
| Perfil responsavel | QA Lead |
| Objetivo | Validar se o ambiente de Staging esta apto para a execucao da UAT P0, sem degradacao visivel de frontend, backend, autenticacao ou navegacao base. |
| Pre-condicoes | Ambiente Staging disponivel; build correta publicada; acesso aos pontos de validacao de saude e readiness; tenant de teste preparado. |
| Dados necessarios | URL de Staging; credenciais de teste; tenant valido; endpoints ou telas de health/readiness; hora de inicio. |
| Passo a passo | 1. Abrir Staging. 2. Validar disponibilidade da aplicacao. 3. Confirmar status de health/readiness. 4. Checar se o ambiente responde sem erro de carregamento. 5. Registrar qualquer alerta de infraestrutura observavel. |
| Resultado esperado | Ambiente online, saude basica consistente, aplicacao acessivel e apta para seguir com login e fluxos P0. |
| Evidencia obrigatoria | Screenshot do status de readiness ou health; timestamp; URL/ambiente; qualquer alerta visivel. |
| Criterio de aceite | Staging acessivel, sem erro bloqueador, sem indisponibilidade e com readiness positivo para iniciar a bateria P0. |
| Status | `WAIVED` |

### 2.2 UAT-ADM-001 - Login / sessao / refresh token

| Campo | Descricao |
|---|---|
| ID do teste | `UAT-ADM-001` |
| Perfil responsavel | Administrador |
| Objetivo | Validar autenticacao, estabelecimento da sessao e renovacao via refresh token. |
| Pre-condicoes | Usuario administrador ativo; tenant ativo; acesso ao login em Staging. |
| Dados necessarios | Credenciais validas; tenant correto; janela de navegador limpa; tokens de sessao gerados pelo sistema. |
| Passo a passo | 1. Abrir tela de login. 2. Autenticar com credenciais administrativas. 3. Confirmar entrada no sistema. 4. Validar persistencia da sessao. 5. Executar refresh token. 6. Confirmar que a sessao permanece valida. |
| Resultado esperado | Login aceito, sessao criada, refresh aceito e usuario mantido autenticado sem quebra de contexto. |
| Evidencia obrigatoria | Screenshot do login concluido; evidencia do refresh; logs ou resposta observavel de autenticacao. |
| Criterio de aceite | Acesso realizado com sucesso, sessao persistida e refresh token funcionando sem erro. |
| Status | `WAIVED` |

### 2.3 UAT-ADM-002 - RBAC / tenant isolation

| Campo | Descricao |
|---|---|
| ID do teste | `UAT-ADM-002` |
| Perfil responsavel | Administrador |
| Objetivo | Validar permissao por papel e isolamento de dados por tenant, com acesso permitido apenas ao escopo correto. |
| Pre-condicoes | Pelo menos 2 usuarios ou perfis distintos; 2 tenants ou 2 escopos de teste; permissoes previamente definidas. |
| Dados necessarios | Usuario admin; usuario restrito; tenant A; tenant B; role/permissao distinta; recurso sensivel para teste de acesso. |
| Passo a passo | 1. Entrar como admin. 2. Acessar area restrita. 3. Validar permissao esperada. 4. Alternar para usuario restrito. 5. Tentar acessar o mesmo recurso. 6. Confirmar negacao quando aplicavel. 7. Confirmar que dados de outro tenant nao aparecem. |
| Resultado esperado | RBAC aplicado corretamente, acesso negado quando necessario e nenhuma exposicao cruzada entre tenants. |
| Evidencia obrigatoria | Screenshot de acesso permitido e negado; prova de segregacao entre tenants; logs de autorizacao, se disponiveis. |
| Criterio de aceite | Sem vazamento de dados, sem bypass de permissao e sem inconsistencias de escopo entre tenants. |
| Status | `WAIVED` |

### 2.4 UAT-SDR-001 - CRM basico

| Campo | Descricao |
|---|---|
| ID do teste | `UAT-SDR-001` |
| Perfil responsavel | SDR |
| Objetivo | Validar o fluxo basico de CRM para lead/cliente, incluindo consulta, qualificacao e encaminhamento. |
| Pre-condicoes | Leads ou clientes de teste disponiveis; usuario com acesso ao CRM. |
| Dados necessarios | Nome, contato, origem, tag, historico minimo, dados de qualificacao. |
| Passo a passo | 1. Abrir CRM. 2. Localizar lead ou cliente. 3. Abrir registro. 4. Validar dados principais. 5. Registrar qualificacao ou observacao. 6. Confirmar persistencia do historico. |
| Resultado esperado | Registro encontrado, dados legiveis, interacao salva e historico preservado. |
| Evidencia obrigatoria | Screenshot do registro CRM; historico atualizado; prova de persistencia da alteracao. |
| Criterio de aceite | O CRM basico permite leitura e atualizacao sem erro, com rastreabilidade minima mantida. |
| Status | `WAIVED` |

### 2.5 UAT-PAR-001 - Parceiros basico

| Campo | Descricao |
|---|---|
| ID do teste | `UAT-PAR-001` |
| Perfil responsavel | Parceiro Comercial |
| Objetivo | Validar login de parceiro, visibilidade da carteira e isolamento do conteudo atribuido ao parceiro. |
| Pre-condicoes | Parceiro cadastrado e ativo; carteira atribuida; permissao de parceiro habilitada. |
| Dados necessarios | Credenciais do parceiro; carteira; oportunidade ou prospect vinculado; tenant correto. |
| Passo a passo | 1. Fazer login como parceiro. 2. Abrir dashboard do parceiro. 3. Consultar carteira. 4. Validar oportunidades atribuidas. 5. Confirmar que nao ha dados fora do escopo. |
| Resultado esperado | Parceiro visualiza apenas sua carteira e seus dados, sem acesso indevido ao restante do tenant. |
| Evidencia obrigatoria | Screenshot do dashboard e da carteira; prova de segregacao de visibilidade. |
| Criterio de aceite | Carteira correta, acesso restrito e ausencia de vazamento de dados entre perfis ou tenants. |
| Status | `WAIVED` |

### 2.6 UAT-ADM-003 - Pipeline basico

| Campo | Descricao |
|---|---|
| ID do teste | `UAT-ADM-003` |
| Perfil responsavel | Administrador |
| Objetivo | Validar criacao, leitura, reorganizacao basica e persistencia do pipeline comercial. |
| Pre-condicoes | Admin autenticado; permissao de gestao de pipeline; pipeline de teste configurado. |
| Dados necessarios | Nome do pipeline; etapas; ordem das etapas; regra de visibilidade; identificador do tenant. |
| Passo a passo | 1. Abrir administracao de pipeline. 2. Localizar pipeline de teste. 3. Verificar ordem das etapas. 4. Ajustar, se necessario. 5. Salvar. 6. Reabrir. 7. Confirmar persistencia. |
| Resultado esperado | Pipeline consistente, visivel e salvo sem perda de configuracao. |
| Evidencia obrigatoria | Screenshot antes e depois; confirmacao de persistencia; eventual log de alteracao. |
| Criterio de aceite | Pipeline continua funcional e reflete exatamente a configuracao salva. |
| Status | `WAIVED` |

### 2.7 UAT-B2B-001 - Oportunidade basica

| Campo | Descricao |
|---|---|
| ID do teste | `UAT-B2B-001` |
| Perfil responsavel | Gerente Comercial B2B |
| Objetivo | Validar leitura do workspace de oportunidade, timeline, tarefas e proximo passo. |
| Pre-condicoes | Pelo menos uma oportunidade ativa; pipeline e cliente vinculados; permissao comercial ativa. |
| Dados necessarios | Cliente, etapa, responsavel, historico minimo, tarefas ou observacoes. |
| Passo a passo | 1. Abrir o workspace de oportunidades. 2. Localizar a oportunidade. 3. Revisar timeline. 4. Revisar status e tarefa atual. 5. Confirmar proximo passo. |
| Resultado esperado | Oportunidade legivel, contexto comercial preservado e proxima acao clara. |
| Evidencia obrigatoria | Screenshot do workspace e da timeline; evidencia de status e tarefa. |
| Criterio de aceite | A oportunidade abre sem ruptura e a leitura operacional e suficiente para agir. |
| Status | `WAIVED` |

### 2.8 UAT-B2B-002 - Simulacao critica

| Campo | Descricao |
|---|---|
| ID do teste | `UAT-B2B-002` |
| Perfil responsavel | Gerente Comercial B2B |
| Objetivo | Validar a simulacao critica, o calculo de resultado e a compreensao comercial da saida. |
| Pre-condicoes | Oportunidade valida; dados de produto e condicoes disponiveis; permissao para simular. |
| Dados necessarios | Produto, valores, prazo, taxa, condicao comercial, dados do cliente, parametros de simulacao. |
| Passo a passo | 1. Abrir a simulacao dentro da oportunidade. 2. Preencher os campos obrigatorios. 3. Executar o calculo. 4. Revisar o resultado. 5. Validar se a saida e compreensivel para decisao comercial. |
| Resultado esperado | Simulacao calculada com sucesso, resultado claro e utilizavel para a etapa seguinte. |
| Evidencia obrigatoria | Screenshot do formulario e do resultado; valores calculados; indicador do status final. |
| Criterio de aceite | Simulacao executa sem erro, entrega resultado confiavel e permite continuidade para proposta. |
| Status | `WAIVED` |

### 2.9 UAT-B2B-003 - Proposta

| Campo | Descricao |
|---|---|
| ID do teste | `UAT-B2B-003` |
| Perfil responsavel | Gerente Comercial B2B |
| Objetivo | Validar a geracao de proposta a partir da simulacao e a integridade da proposta criada. |
| Pre-condicoes | Simulacao concluida; permissao para gerar proposta; oportunidade apta para avancar. |
| Dados necessarios | Resultado da simulacao; dados do cliente; condicoes aprovadas; modelo de proposta. |
| Passo a passo | 1. Abrir o resultado da simulacao. 2. Acionar geracao de proposta. 3. Confirmar dados copiados corretamente. 4. Revisar a proposta gerada. 5. Validar disponibilidade para continuidade operacional. |
| Resultado esperado | Proposta gerada com dados coerentes, sem perda de informacao e com proximo passo evidente. |
| Evidencia obrigatoria | Screenshot da proposta; comprovante de geracao; dados principais da proposta. |
| Criterio de aceite | A proposta nasce da simulacao sem inconsistencias e fica pronta para o fluxo operacional. |
| Status | `WAIVED` |

### 2.10 UAT-OPS-001 - Operacao

| Campo | Descricao |
|---|---|
| ID do teste | `UAT-OPS-001` |
| Perfil responsavel | Backoffice |
| Objetivo | Validar o registro operacional apos a proposta, com continuidade de fluxo e rastreabilidade. |
| Pre-condicoes | Proposta criada; permissao operacional habilitada; registro apto para seguimento. |
| Dados necessarios | Numero da proposta; status da operacao; observacoes; documentacao ou etapas associadas. |
| Passo a passo | 1. Abrir a operacao vinculada. 2. Conferir os dados herdados da proposta. 3. Registrar ou validar a acao operacional. 4. Confirmar persistencia da atualizacao. |
| Resultado esperado | Operacao visivel, atualizada e rastreavel, com continuidade entre proposta e operacao. |
| Evidencia obrigatoria | Screenshot da operacao; historico da alteracao; status operacional visivel. |
| Criterio de aceite | Operacao criada ou atualizada sem ruptura, com trilha valida e sem perda de contexto. |
| Status | `WAIVED` |

### 2.11 UAT-AUD-001 - Auditoria

| Campo | Descricao |
|---|---|
| ID do teste | `UAT-AUD-001` |
| Perfil responsavel | Administrador |
| Objetivo | Validar a trilha de auditoria para login, mudancas de acesso e eventos operacionais criticos. |
| Pre-condicoes | Existencia de eventos gerados nos testes anteriores; acesso ao modulo de auditoria. |
| Dados necessarios | Usuario, tenant, faixa de tempo, eventos esperados, filtros de busca. |
| Passo a passo | 1. Abrir auditoria. 2. Filtrar pelos eventos executados. 3. Localizar entradas relevantes. 4. Confirmar rastreabilidade. 5. Validar correspondencia entre acao e log. |
| Resultado esperado | Eventos auditaveis, filtraveis e coerentes com as acoes executadas ao longo da bateria P0. |
| Evidencia obrigatoria | Screenshot dos eventos; filtro utilizado; correspondencia entre acao e registro. |
| Criterio de aceite | A trilha de auditoria confirma o historico dos eventos criticos sem lacunas ou inconsistencias. |
| Status | `WAIVED` |

---

## 3. Matriz GO / NO GO

| Condicao | Decisao | Regra operacional |
|---|---|---|
| Todos os P0 acima concluidos com `PASS`, evidencias completas e sem violacao de tenant, seguranca ou continuidade | `GO` | Liberar a passagem para a etapa seguinte do programa W1. |
| Qualquer P0 com `FAIL` ou `BLOCKED`, ou ausencia de evidencias obrigatorias, ou quebra em login, sessao, refresh, RBAC, tenant isolation, CRM, parceiros, pipeline, oportunidade, simulacao, proposta, operacao, auditoria, ou health/readiness | `NO GO` | Interromper a execucao e registrar bloqueio formal. |

---

## 4. Criterios de bloqueio

Bloquear a execucao imediatamente se ocorrer qualquer um dos itens abaixo:

- falha de login ou autenticacao;
- sessao nao persistida;
- refresh token rejeitado ou inconsistente;
- bypass de RBAC ou permissao indevida;
- vazamento de dados entre tenants;
- indisponibilidade do CRM basico;
- indisponibilidade de parceiros basico;
- pipeline nao persistir ou nao carregar corretamente;
- oportunidade nao abrir ou nao apresentar contexto minimo;
- simulacao falhar, retornar resultado incoerente ou impedir continuidade;
- proposta nao puder ser gerada a partir da simulacao;
- operacao nao registrar ou perder rastreabilidade;
- auditoria nao refletir os eventos gerados;
- health / readiness indicar ambiente inapropriado para a UAT.

---

## 5. Lista de evidencias

Capturar e arquivar, no minimo, os seguintes artefatos:

1. Screenshot do health / readiness de Staging.
2. Screenshot do login concluido.
3. Evidencia do refresh token.
4. Evidencia de acesso permitido e negado para RBAC.
5. Evidencia de isolamento entre tenants.
6. Screenshot do CRM com registro consultado e atualizado.
7. Screenshot da carteira do parceiro.
8. Screenshot do pipeline antes e depois da validacao.
9. Screenshot do workspace da oportunidade e da timeline.
10. Screenshot da simulacao com valores e resultado.
11. Screenshot da proposta gerada.
12. Screenshot da operacao atualizada.
13. Screenshot da auditoria com os eventos correlatos.

**Convencao sugerida de nome de arquivo**

- `W1-01-HLTH-001.png`
- `W1-02-ADM-001-login.png`
- `W1-03-ADM-002-rbac.png`
- `W1-04-SDR-001-crm.png`
- `W1-05-PAR-001-parceiros.png`
- `W1-06-ADM-003-pipeline.png`
- `W1-07-B2B-001-oportunidade.png`
- `W1-08-B2B-002-simulacao.png`
- `W1-09-B2B-003-proposta.png`
- `W1-10-OPS-001-operacao.png`
- `W1-11-AUD-001-auditoria.png`

---

## 6. Ata de execucao

**Modelo de ata para preenchimento durante a UAT**

| Campo | Conteudo |
|---|---|
| Data | `dd/mm/aaaa` |
| Hora de inicio | `hh:mm` |
| Hora de fim | `hh:mm` |
| Ambiente | `Staging` |
| Build / release | `preencher` |
| Tenant usado | `preencher` |
| Executores | `QA Lead`, `Administrador`, `SDR`, `Parceiro Comercial`, `Gerente Comercial B2B`, `Backoffice` |
| Resumo da execucao | `preencher` |
| Principais achados | `preencher` |
| Bloqueios encontrados | `preencher` |
| Decisao final | `GO` ou `NO GO` |
| Aprovador final | `Release Manager` |

---

## 7. Responsaveis sugeridos

| Papel | Responsabilidade na execucao |
|---|---|
| Release Manager | Decisao final de GO / NO GO e consolidacao da ata. |
| QA Lead | Orquestracao da ordem de execucao, captura de evidencias e rastreio de bloqueios. |
| Product Architect | Valida coerencia funcional com a tese do produto e a leitura de ponta a ponta. |
| Administrador | Executa login, sessao, refresh, RBAC, tenant isolation, pipeline e auditoria. |
| SDR | Executa o fluxo de CRM basico. |
| Parceiro Comercial | Executa o fluxo de parceiros basico. |
| Gerente Comercial B2B | Executa oportunidade, simulacao e proposta. |
| Backoffice | Executa o fluxo de operacao. |

---

## 8. Veredito operacional

**READY FOR PRODUCT-W1 STAGING EXECUTION**

Este checklist esta pronto para ser usado como roteiro operacional da UAT P0 em Staging, sem alteracao de codigo, sem correcao de bugs e sem execucao real nesta etapa de preparo.
