# CommercialRequest Hardening Specification

## Objetivo
Congelar as definicoes obrigatorias de hardening para liberar a implementacao da entidade `CommercialRequest` no MVP 1:
1. State Machine
2. Read Contracts
3. Request Number Pattern
4. Audit Contract

## 1. State Machine Oficial

### Estados oficiais
- Draft
- Submitted
- Approved
- Rejected
- Closed

### Tabela de transicoes permitidas
| Estado Atual | Proximo Estado Permitido |
| ------------ | ------------------------ |
| Draft | Submitted |
| Submitted | Approved |
| Submitted | Rejected |
| Approved | Closed |
| Rejected | Closed |
| Closed | Nenhum |

### Transicoes validas (resumo)
- Draft -> Submitted
- Submitted -> Approved
- Submitted -> Rejected
- Approved -> Closed
- Rejected -> Closed

### Transicoes proibidas
- Closed -> qualquer estado
- Approved -> Draft
- Rejected -> Draft
- Draft -> Approved
- Draft -> Rejected
- Submitted -> Draft
- Approved -> Rejected
- Rejected -> Approved

### Regra de integridade
- Toda mudanca de estado deve registrar evento de auditoria correspondente.
- Nao e permitido salto de estado fora da tabela oficial.

## 2. Read Contracts

### 2.1 GetCommercialRequestById
- Objetivo:
  - Recuperar uma solicitacao especifica para consulta operacional, governanca e compliance.
- RBAC:
  - Pode ler: Partner, Commercial, Manager, Director, CEO, Admin, Compliance.
- Tenant scope obrigatorio:
  - Sempre filtrar por `tenantId` do contexto autenticado.
  - E proibido consultar por `id` sem validacao de tenant.
- Auditoria necessaria:
  - Nao obrigatoria por default para leitura simples.
  - Recomendado auditar leituras de perfis sensiveis (Compliance, Admin, Diretor, CEO) via politica de seguranca.

### 2.2 ListCommercialRequests
- Objetivo:
  - Listar solicitacoes do tenant com filtros de status, periodo e solicitante.
- RBAC:
  - Pode ler: Partner, Commercial, Manager, Director, CEO, Admin, Compliance.
  - Restricao recomendada para Partner: visao limitada as solicitacoes vinculadas ao proprio usuario ou escopo permitido.
- Tenant scope obrigatorio:
  - Sempre restringir resultados ao `tenantId` autenticado.
  - Proibido qualquer consulta cross-tenant.
- Auditoria necessaria:
  - Nao obrigatoria para listagem padrao.
  - Obrigatoria quando houver exportacao, bulk read sensivel ou acao administrativa extraordinaria.

## 3. Request Number Pattern

### Padrao oficial
- Formato: `CR-{TENANT}-{YYYY}-{SEQUENCE}`
- Exemplo: `CR-FINQZ-2026-000001`

### Regras de formato
- Prefixo fixo: `CR`
- `TENANT`: codigo normalizado do tenant (alfanumerico, uppercase, sem espacos)
- `YYYY`: ano de criacao da solicitacao
- `SEQUENCE`: sequencial numerico com zero-padding de 6 digitos

### Unicidade
- Deve ser unico por `tenant` + `ano` + `sequencial`.
- Recomendacao: constraint logica e persistencia atomica para evitar colisao.

### Tenant scope
- A sequencia e isolada por tenant.
- Nao compartilhar contador entre tenants.

### Concorrencia
- Em concorrencia, a geracao deve ser atomica (sem duplicate issue).
- Em caso de colisao, repetir geracao com retry controlado e idempotente.

### Reprocessamento
- Reprocessamento nao deve gerar novo `requestNumber` para a mesma solicitacao.
- Retries da mesma operacao devem preservar o mesmo identificador de negocio.

## 4. Audit Contract

### Eventos obrigatorios
- CommercialRequestCreated
- CommercialRequestSubmitted
- CommercialRequestApproved
- CommercialRequestRejected
- CommercialRequestClosed

### Especificacao por evento

#### CommercialRequestCreated
- Quando ocorre:
  - Na criacao inicial da solicitacao em estado Draft.
- Quem executa:
  - Ator autorizado (Partner, Commercial, Manager, Director, CEO, Admin).
- Informacoes minimas auditadas:
  - tenantId, commercialRequestId, requestNumber, actorUserId, actorRole, timestamp, estadoAnterior (null), estadoNovo (Draft), motivo/justificativa (quando aplicavel), correlationId.

#### CommercialRequestSubmitted
- Quando ocorre:
  - Na transicao Draft -> Submitted.
- Quem executa:
  - Ator autorizado a submeter.
- Informacoes minimas auditadas:
  - tenantId, commercialRequestId, requestNumber, actorUserId, actorRole, timestamp, estadoAnterior (Draft), estadoNovo (Submitted), motivo/justificativa, correlationId.

#### CommercialRequestApproved
- Quando ocorre:
  - Na transicao Submitted -> Approved.
- Quem executa:
  - Aprovador autorizado (Manager, Director, CEO, Admin).
- Informacoes minimas auditadas:
  - tenantId, commercialRequestId, requestNumber, actorUserId, actorRole, timestamp, estadoAnterior (Submitted), estadoNovo (Approved), approvalDecision, approvalNotes, correlationId.

#### CommercialRequestRejected
- Quando ocorre:
  - Na transicao Submitted -> Rejected.
- Quem executa:
  - Aprovador autorizado (Manager, Director, CEO, Admin).
- Informacoes minimas auditadas:
  - tenantId, commercialRequestId, requestNumber, actorUserId, actorRole, timestamp, estadoAnterior (Submitted), estadoNovo (Rejected), rejectionReason obrigatoria, rejectionNotes, correlationId.

#### CommercialRequestClosed
- Quando ocorre:
  - Na transicao Approved -> Closed ou Rejected -> Closed.
- Quem executa:
  - Sistema ou ator administrativo autorizado, conforme regra operacional.
- Informacoes minimas auditadas:
  - tenantId, commercialRequestId, requestNumber, actorUserId (ou `system`), actorRole, timestamp, estadoAnterior (Approved/Rejected), estadoNovo (Closed), closeReason, correlationId.

## 5. Implementation Gates

Classificacao final:
**READY FOR IMPLEMENTATION**

Justificativa tecnica:
- State machine oficial definida com transicoes permitidas e proibidas.
- Read contracts minimos definidos com RBAC e tenant scope explicito.
- Padrao de request number congelado com regras de unicidade e concorrencia.
- Audit contract fechado com eventos obrigatorios e payload minimo.
- Com este hardening, os bloqueios principais de prontidao identificados no review anterior ficam tratados para inicio controlado da implementacao.
