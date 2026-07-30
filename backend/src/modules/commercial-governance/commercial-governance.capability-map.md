# Commercial Governance Capability Map

## 1. Objetivo
Mapear as capacidades oficiais do Commercial Governance & Incentives Engine, definindo fronteiras claras entre os modulos `commercial-governance`, `commercial`, `commissions`, `integrations` (provider engine) e `audit/logging`.

## 2. Principio Arquitetural
`commercial-governance` e um modulo orquestrador. Ele coordena fluxo decisorio, politicas, aprovacoes, notificacoes e auditoria, sem assumir ownership de dominios que ja possuem source of truth oficial.

## 3. Capability Map Oficial
| Capability | Dono Oficial | Commercial Governance pode executar? | Observacao |
| ---------- | ------------ | ------------------------------------ | ---------- |
| Solicitar condicao comercial especial | commercial-governance | Sim | Capability nativa de entrada/orquestracao de request |
| Aprovar condicao comercial especial | commercial-governance | Sim | Dentro de workflow de aprovacao e alçada |
| Reprovar condicao comercial especial | commercial-governance | Sim | Decisao de governanca com justificativa e trilha |
| Consultar tabela comercial | commercial | Sim (referenciar) | Somente leitura/consulta via contrato do modulo commercial |
| Criar tabela comercial | commercial | Nao | Proibido CRUD paralelo |
| Editar condicao comercial | commercial | Nao | Alteracao de condicao pertence ao dominio commercial |
| Calcular comissao | commissions | Nao | Reuso de resultado oficial do modulo commissions |
| Gerar ledger de comissao | commissions | Nao | Ledger financeiro e source of truth de commissions |
| Registrar pagamento de comissao | commissions | Nao | Persistencia financeira pertence a commissions |
| Criar campanha comercial | commercial-governance | Sim | Desde que ligada a politicas e fluxo de governanca |
| Criar bonus comercial | commercial-governance | Sim | Governanca de incentivo, sem recalculo financeiro paralelo |
| Aprovar bonus | commercial-governance | Sim | Aprovacao por alçada/politica |
| Registrar acordo comercial | commercial-governance | Sim | Registro de acordo no fluxo orquestrado |
| Enviar notificacao de aprovacao | commercial-governance | Sim | Orquestracao de eventos de notificacao |
| Registrar trilha de auditoria | audit/logging | Sim (acionar) | Governanca aciona o mecanismo oficial de auditoria |
| Consultar provider externo | integrations/provider engine | Sim (referenciar) | Somente via Provider Engine e contratos existentes |
| Criar provider externo | integrations/provider engine | Nao | Proibido engine/provedor paralelo |
| Executar integracao financeira | integrations/provider engine | Sim (orquestrar) | Sempre por contrato oficial de integracoes |
| Calcular spread | commercial-governance | Sim | Calculo de spread de governanca, sem invadir comissao |
| Validar politica comercial | commercial-governance | Sim | Validacao de politicas e compliance comercial |
| Escalar aprovacao por alçada | commercial-governance | Sim | Regra central do workflow de aprovacao |

## 4. Capacidades Permitidas no Commercial Governance
- Orquestrar solicitacoes comerciais especiais.
- Orquestrar aprovacoes, reprovacoes e escalonamento por alçada.
- Aplicar politicas comerciais no fluxo de decisao.
- Criar e governar campanhas e bonus no contexto de aprovacao.
- Registrar acordos no contexto do fluxo governado.
- Acionar notificacoes e rastrear estado do processo.
- Acionar auditoria oficial para trilha de compliance.
- Referenciar tabelas e condicoes oficiais de `commercial`.
- Referenciar calculos e estados oficiais de `commissions`.
- Referenciar providers e integracoes oficiais de `integrations`.

## 5. Capacidades Proibidas no Commercial Governance
- Duplicar CRUD de `commercial`.
- Duplicar calculo, ledger ou pagamento de `commissions`.
- Criar provider engine paralelo.
- Criar audit engine paralelo.
- Criar rotas sem RBAC.
- Criar rotas sem tenant context.
- Criar contratos paralelos sem ADR.

## 6. Dependencias entre modulos
- `commercial-governance` -> `commercial`:
  - Consulta de tabelas e condicoes comerciais oficiais.
- `commercial-governance` -> `commissions`:
  - Consumo de calculo e estado financeiro de comissao oficiais.
- `commercial-governance` -> `integrations`:
  - Consumo de provider engine/contratos oficiais para integracoes externas.
- `commercial-governance` -> `audit/logging`:
  - Emissao de eventos de trilha de auditoria por mecanismo institucional.
- `commercial-governance` -> `rbac` + tenant context:
  - Requisito obrigatorio para qualquer rota futura.

## 7. Regras de execucao futura
- Toda nova capability deve declarar dono oficial antes da implementacao.
- Se a capability ja tiver source of truth, `commercial-governance` apenas orquestra.
- Qualquer excecao de fronteira exige ADR aprovado.
- Nao implementar engine paralela para provider, auditoria ou comissao.

## 8. Criterios para abrir futuras rotas
- Passar por validacao arquitetural de fronteira de dominio.
- Incluir obrigatoriamente `authenticate` + `tenantContextMiddleware`.
- Incluir guarda RBAC adequada (`requireRoles` e/ou `requirePermissions`).
- Nao expor endpoints que dupliquem CRUD de `commercial` ou `commissions`.
- Definir contrato de entrada/saida alinhado com dominios oficiais.

## 9. Criterios para criar services/repositories
- Criar service/repository somente para entidades cujo dono oficial e `commercial-governance`.
- Proibir repositorios de entidades cujo dono seja `commercial` ou `commissions`.
- Priorizar integracao por contratos existentes em vez de persistencia paralela.
- Exigir justificativa arquitetural para novos contratos entre modulos.

## 10. Conclusao tecnica
O capability map confirma `commercial-governance` como modulo orquestrador legitimo, com escopo centrado em governanca de decisao comercial. A evolucao futura deve preservar ownership oficial dos dominios `commercial`, `commissions`, `integrations` e `audit/logging`, evitando duplicidade, drift e rotas paralelas.
