# Commercial Governance Workflow & Approval Architecture

## Objetivo
Definir a arquitetura oficial de workflows do Commercial Governance & Incentives Engine, cobrindo fluxos, estados, aprovacoes, alçadas, integracoes e pontos de auditoria, sem implementacao fisica nesta etapa.

## Estados Canonicos
- Draft
- Submitted
- UnderReview
- Approved
- Rejected
- Cancelled
- Executed
- Closed

## WF-01 - Solicitacao de Condicao Comercial Especial
### Objetivo
Orquestrar solicitacoes excepcionais de condicao comercial com validacao, aprovacao por alçada e rastreabilidade completa.

### Atores
- Parceiro
- Comercial
- Compliance
- Admin

### Fluxo
Parceiro -> Solicitacao -> Validacao -> Aprovacao por Alçada -> Aplicacao Comercial -> Auditoria -> Encerramento

### Estados
- Draft
- Submitted
- UnderReview
- Approved ou Rejected
- Executed
- Closed

### Regras
- Solicitacao deve conter justificativa de negocio.
- Validacao deve verificar aderencia a politica comercial vigente.
- Aprovacao depende da alçada definida por governanca.
- Reprovacao exige motivo obrigatorio.
- Aplicacao comercial apenas referencia estruturas oficiais de `commercial`.

### Dependencias
- `commercial` (consulta de tabelas/condicoes oficiais)
- `audit` (trilha obrigatoria)
- `rbac` + tenant context

### Eventos de Auditoria
- Criacao de solicitacao
- Submissao para analise
- Inicio de revisao
- Aprovacao
- Reprovacao
- Aplicacao comercial
- Encerramento

## WF-02 - Solicitacao de Bonus
### Objetivo
Governar solicitacao e aprovacao de bonus comercial com validacao de politica e execucao financeira por modulo oficial.

### Atores
- Gestor
- Comercial
- Financeiro
- Compliance
- Admin

### Fluxo
Gestor -> Solicitacao -> Validacao Politica -> Aprovacao -> Execucao Financeira -> Auditoria -> Encerramento

### Estados
- Draft
- Submitted
- UnderReview
- Approved ou Rejected
- Executed
- Closed

### Regras
- Bonus deve estar vinculado a politica/campanha valida.
- Aprovacao segue alçada de governanca.
- Execucao financeira nao pode ser implementada dentro de `commercial-governance`.
- Resultado financeiro deve ser consumido de modulo oficial.

### Dependencias
- `commissions` (regras e efeitos financeiros de comissao/bonus, quando aplicavel)
- `integrations` (execucao de integracao financeira, quando houver)
- `audit` (eventos obrigatorios)
- `rbac` + tenant context

### Eventos de Auditoria
- Criacao da solicitacao de bonus
- Validacao de politica
- Aprovacao
- Reprovacao
- Disparo de execucao financeira
- Confirmacao de execucao
- Encerramento

## WF-03 - Campanha Comercial
### Objetivo
Estabelecer ciclo governado para campanhas comerciais, desde criacao ate encerramento.

### Atores
- Comercial
- Gestor
- Compliance
- Admin

### Fluxo
Criacao -> Aprovacao -> Ativacao -> Monitoramento -> Encerramento

### Estados
- Draft
- Submitted
- UnderReview
- Approved
- Executed
- Closed
- Cancelled

### Regras
- Campanha exige escopo, vigencia e politica associada.
- Ativacao somente apos aprovacao formal.
- Monitoramento deve registrar mudancas de estado relevantes.
- Encerramento deve preservar historico para auditoria.

### Dependencias
- `commercial` (referencia a politicas/condicoes aplicaveis quando necessario)
- `audit`
- `rbac` + tenant context

### Eventos de Auditoria
- Criacao da campanha
- Aprovacao
- Ativacao
- Ajustes de monitoramento relevantes
- Cancelamento (se houver)
- Encerramento

## WF-04 - Acordo Comercial
### Objetivo
Orquestrar o ciclo de vida de acordos comerciais com governanca de aprovacao e formalizacao.

### Atores
- Comercial
- Gestor
- Financeiro
- Compliance
- CEO
- Admin

### Fluxo
Solicitacao -> Negociacao -> Aprovacao -> Formalizacao -> Auditoria

### Estados
- Draft
- Submitted
- UnderReview
- Approved ou Rejected
- Executed
- Closed

### Regras
- Negociacao deve manter historico de alteracoes e justificativas.
- Aprovacao respeita matriz de alçadas.
- Formalizacao depende de aprovacao concluida.
- Qualquer excecao deve ser registrada com trilha de decisao.

### Dependencias
- `commercial` (referencias comerciais oficiais)
- `integrations` (quando formalizacao exigir integracao externa)
- `audit`
- `rbac` + tenant context

### Eventos de Auditoria
- Criacao da solicitacao
- Alteracoes na negociacao
- Aprovacao
- Reprovacao
- Formalizacao
- Encerramento

## WF-05 - Escalada de Alçada
### Objetivo
Garantir tratamento governado de casos que excedam limite de aprovacao do nivel atual.

### Atores
- Comercial
- Gestor
- Diretor
- CEO
- Compliance
- Admin

### Fluxo
Solicitacao -> Limite Excedido -> Escalada -> Nova Aprovacao -> Decisao

### Estados
- Submitted
- UnderReview
- Escalated
- Approved ou Rejected
- Closed

### Regras
- Escalada obrigatoria quando criterio de alçada nao for atendido no nivel atual.
- Nova aprovacao deve ocorrer em nivel superior.
- Toda escalada exige justificativa.
- Decisao final deve manter rastreabilidade da cadeia de aprovacao.

### Dependencias
- `rbac` (papeis e permissoes)
- tenant context
- `audit`

### Eventos de Auditoria
- Deteccao de limite excedido
- Escalada disparada
- Reatribuicao de aprovador
- Decisao final
- Encerramento

## Matriz de Alcadas
| Nivel | Papel | Pode Aprovar |
| ----- | ----- | ------------ |
| N1 | Supervisor | Demandas de baixa criticidade dentro da propria competencia |
| N2 | Gerente | Demandas de media criticidade e excecoes controladas |
| N3 | Diretor | Demandas de alta criticidade e excecoes relevantes |
| N4 | CEO | Casos estrategicos, excepcionais ou de alto impacto |

## Matriz de Auditoria
| Evento | Obrigatorio Auditar? |
| ------ | -------------------- |
| Criacao | Sim |
| Aprovacao | Sim |
| Reprovacao | Sim |
| Cancelamento | Sim |
| Execucao | Sim |
| Escalada | Sim |

## Matriz de Integracoes
| Workflow | Commercial | Commissions | Provider Engine | Audit |
| -------- | ---------- | ----------- | --------------- | ----- |
| WF-01 Solicitacao de Condicao Especial | Consulta/referencia de tabelas e condicoes oficiais | Nao obrigatorio por padrao | Nao obrigatorio por padrao | Obrigatorio |
| WF-02 Solicitacao de Bonus | Referencia de contexto comercial | Referencia de regras e efeitos financeiros oficiais | Opcional para execucao financeira externa | Obrigatorio |
| WF-03 Campanha Comercial | Referencia de contexto comercial e politicas | Nao obrigatorio por padrao | Nao obrigatorio por padrao | Obrigatorio |
| WF-04 Acordo Comercial | Referencia comercial oficial | Opcional quando houver impacto em comissao | Opcional quando houver formalizacao externa | Obrigatorio |
| WF-05 Escalada de Alçada | Nao obrigatorio por padrao | Nao obrigatorio por padrao | Nao obrigatorio por padrao | Obrigatorio |

## Regras Anti-Drift
- Nao duplicar `commercial`.
- Nao duplicar `commissions`.
- Nao criar Provider Engine paralelo.
- Nao criar Audit Engine paralelo.
- Nao criar workflow fora do modulo `commercial-governance`.
- Nao criar aprovacao sem RBAC.
- Nao criar aprovacao sem Tenant Context.

## Conclusao
Classificacao arquitetural: **APROVADO COM AJUSTES**.

Motivo:
- A arquitetura de workflow e coerente com o papel orquestrador do modulo.
- A aprovacao definitiva para implementacao depende de manter rigorosamente as fronteiras de dominio e as regras anti-drift descritas neste documento.
