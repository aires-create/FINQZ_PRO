# Commercial Governance Domain Map

## 1. Objetivo do modulo
Definir e proteger as fronteiras arquiteturais do modulo `commercial-governance` como orquestrador de governanca comercial, garantindo evolucao segura sem duplicar responsabilidades de `commercial`, `commissions` ou `integrations`.

## 2. Bounded Context
`commercial-governance` e um bounded context de orquestracao de decisao comercial.

Escopo do contexto:
- Receber e governar solicitacoes comerciais.
- Aplicar politicas e fluxo de aprovacao por alçada.
- Coordenar campanhas, bonus, acordos, notificacoes e trilha de auditoria.
- Governar spread no fluxo decisorio, sem assumir calculos financeiros que pertencem a outros dominios.

Fora do contexto:
- CRUD e regras operacionais de tabelas/condicoes comerciais.
- Calculo financeiro e contabil da comissao.
- Engine de providers e contratos de integracao de providers.

## 3. Responsabilidades por dominio
- `commercial` (Source of Truth):
  - Commercial Tables
  - Commercial Conditions
  - Commercial Rules
  - Regras operacionais de tabelas comerciais
- `commissions` (Source of Truth):
  - Commission Calculation
  - Commission Ledger
  - Commission Payments
  - Regras financeiras de comissao
- `commercial-governance` (Orchestrator):
  - Commercial Requests
  - Approval Workflows
  - Approval Levels / Alçadas
  - Commercial Policies
  - Campaigns
  - Bonuses
  - Agreements
  - Notifications
  - Audit Trail
  - Spread Governance

## 4. Entidades e donos oficiais
- CommercialTable -> dono: `commercial`
- CommercialCondition -> dono: `commercial`
- CommercialRule -> dono: `commercial`
- CommissionCalculation -> dono: `commissions`
- CommissionLedger -> dono: `commissions`
- CommissionPayment -> dono: `commissions`
- CommercialRequest -> dono: `commercial-governance`
- ApprovalWorkflow -> dono: `commercial-governance`
- ApprovalLevel (Alçada) -> dono: `commercial-governance`
- CommercialPolicy -> dono: `commercial-governance`
- Campaign -> dono: `commercial-governance`
- Bonus -> dono: `commercial-governance`
- Agreement -> dono: `commercial-governance`
- NotificationEvent -> dono: `commercial-governance`
- GovernanceAuditEvent -> dono: `commercial-governance`
- SpreadDecisionContext -> dono: `commercial-governance`

## 5. O que o modulo pode fazer
- Orquestrar o fluxo ponta a ponta de solicitacoes comerciais.
- Invocar leitura de tabelas/condicoes do modulo `commercial` para decisao.
- Consumir resultados oficiais de comissao do modulo `commissions` quando necessario.
- Definir alçada, aprovar/rejeitar e registrar justificativas.
- Gerar eventos de notificacao e auditoria.
- Aplicar regras de politicas, campanhas e bonus no contexto de governanca.
- Integrar-se com financeiro por contratos aprovados pela arquitetura.

## 6. O que o modulo nao pode fazer
- Nao criar CRUD paralelo de tabelas comerciais.
- Nao duplicar condicoes comerciais.
- Nao recalcular comissao.
- Nao duplicar regra de comissao.
- Nao criar provider engine paralelo.
- Nao criar contrato paralelo sem decisao arquitetural.
- Nao criar rota sem `RBAC` + `Tenant Context`.

## 7. Regras anti-drift
- Toda capacidade nova deve declarar dono de dominio antes da implementacao.
- E proibido duplicar entidades ja oficiais de `commercial` e `commissions`.
- Leitura e composicao devem reutilizar contratos e servicos existentes.
- Qualquer excecao de fronteira exige decisao arquitetural registrada.
- Rotas futuras so podem nascer com `authenticate` + `tenantContextMiddleware` + guardas RBAC apropriadas.
- Mudancas que cruzem dominios devem ser revisadas com foco em nao paralelismo.

## 8. Integracoes permitidas
- Com `commercial`:
  - Consulta de Commercial Tables e Commercial Conditions oficiais.
- Com `commissions`:
  - Consumo de resultado oficial de calculo e estado financeiro de comissao.
- Com `integrations`:
  - Uso de contratos e Provider Engine existentes quando houver dependencia externa.
  - Proibido replicar runtime/engine de provider no modulo de governanca.
- Com `rbac` e contexto tenant:
  - Uso obrigatorio de guardas e contexto multi-tenant em qualquer API futura.
- Com `audit`:
  - Emissao e persistencia de trilha de auditoria conforme padrao institucional.

## 9. Criterios para futura implementacao
- Confirmar fronteira e dono oficial de cada entidade antes de codar.
- Nao abrir rota enquanto contratos internos e regras de autorizacao nao estiverem definidos.
- Nenhum endpoint sem isolamento por tenant e autorizacao RBAC.
- Nenhuma regra de comissao fora de `commissions`.
- Nenhuma regra operacional de tabela fora de `commercial`.
- Nenhuma duplicacao de provider/contrato de integracao.
- Registrar decisoes arquiteturais quando houver trade-off de fronteira.

## 10. Conclusao arquitetural
`commercial-governance` permanece como modulo legitimo e necessario, com papel estritamente orquestrador. A classificacao atual e **APROVADO COM AJUSTES**, condicionada ao cumprimento continuo das fronteiras deste domain map para prevenir drift, duplicidade e solucoes paralelas.
