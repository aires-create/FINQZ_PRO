# EVENT-CATALOG v1

## Status
Canonical

## Purpose
Este catalogo congela os eventos canonicos do Enterprise Decision Platform.

## Governance

- Todo evento aqui listado e oficialmente reconhecido.
- Qualquer mudanca de nome, payload, dominio ou semantica exige revisao de arquitetura.
- Eventos futuros devem preservar compatibilidade conceitual e correlacao.
- Eventos nao podem ser redefinidos por frontend, provider ou IA.

## Canonical Event Envelope

Cada evento deve, conceitualmente, conter:

- Name
- Version
- Description
- Owning Domain
- Trigger
- Conceptual Payload
- CorrelationId
- CausationId
- TenantId
- AggregateId
- AggregateType
- IdempotencyKey
- Consumers
- Observability
- Retention
- Future Compatibility

## Event Families

### simulation.*

#### simulation.created
- Version: 1
- Description: simulacao criada a partir de uma entrada valida.
- Domain: Simulation
- Trigger: requisicao de simulacao recebida.
- Payload conceitual: contexto, tenant, produto, origem, parametros iniciais.
- Consumers: Ranking, Proposal Center, Audit Center, Analytics.

#### simulation.input.updated
- Version: 1
- Description: entrada de simulacao atualizada antes do calculo.
- Domain: Simulation
- Trigger: alteracao validada do input canonico da simulacao.
- Aggregate: Simulation Aggregate
- CorrelationId: preserva a cadeia da simulacao original.
- CausationId: command de update ou evento anterior que motivou a mudanca.
- TenantId: obrigatorio, sempre tenant scoped.
- Payload conceitual: campo alterado, valor anterior, valor novo, motivo, versao do input.
- Consumers: Simulation, Decision Core, Audit Center, Ranking.
- Retention: longa, compativel com trilha de decisao.
- Observability: auditoria de mudanca, conflito de concorrencia, reprocessamento.
- Future Compatibility: compativel com simulation.created e simulation.calculated sem quebra semantica.

#### simulation.calculated
- Version: 1
- Description: simulacao concluida com resultado calculado.
- Domain: Simulation
- Trigger: simulacao executada com sucesso.
- Payload conceitual: cenarios, valores, taxas, scores, justificativa resumida.
- Consumers: Ranking, Proposal Center, Decision Core, Analytics, IA.

#### simulation.calculation.requested
- Version: 1
- Description: requisicao de calculo canonico de simulacao.
- Domain: Simulation
- Trigger: comando de calculo aceito e encaminhamento para execucao.
- Aggregate: Simulation Aggregate
- CorrelationId: liga a solicitacao ao caso original.
- CausationId: create/update input ou comando de calculo anterior.
- TenantId: obrigatorio, sempre tenant scoped.
- Payload conceitual: simulationId, input snapshot, policyVersion, strategyVersion, execution request.
- Consumers: Simulation, Provider Operations, Decision Core, Audit Center, Observability.
- Retention: longa, para rastreabilidade operacional e auditoria.
- Observability: latencia de execucao, fila, retry, disponibilidade de provider.
- Future Compatibility: compativel com simulation.calculated e com replays idempotentes.

#### simulation.offer.generated
- Version: 1
- Description: oferta gerada a partir da simulacao.
- Domain: Simulation
- Trigger: derivacao de oferta canonica.
- Payload conceitual: offerId, scenarioId, score, constraints, explanation.
- Consumers: Ranking, Proposal Center, Decision Core.

#### simulation.offer.selected
- Version: 1
- Description: oferta selecionada como melhor alternativa.
- Domain: Ranking
- Trigger: ranking finalizado.
- Payload conceitual: selectedOffer, rankedList, rationale, policyVersion, strategyVersion.
- Consumers: Proposal Center, Decision Core, Audit Center.

### proposal.*

#### proposal.generated
- Version: 1
- Description: proposta canonica gerada.
- Domain: Proposal Center
- Trigger: decisao compativel com geracao de proposta.
- Payload conceitual: proposalId, version, snapshot, validity, consent context.
- Consumers: CRM, Oportunidades, Analytics, Audit Center.

#### proposal.sent
- Version: 1
- Description: proposta compartilhada por canal seguro.
- Domain: Proposal Center
- Trigger: envio de proposta.
- Payload conceitual: link seguro, canal, expiry, recipient, version.
- Consumers: Audit Center, CRM, Analytics.

#### proposal.accepted
- Version: 1
- Description: proposta aceita.
- Domain: Proposal Center
- Trigger: aceite valido e verificado.
- Payload conceitual: acceptance metadata, identity binding, timestamp, proposal version.
- Consumers: Opportunity, Operation, Audit Center, Analytics.

#### proposal.rejected
- Version: 1
- Description: proposta rejeitada.
- Domain: Proposal Center
- Trigger: recusa registrada.
- Payload conceitual: rejection reason, proposal version, identity, timestamp.
- Consumers: Decision Core, Analytics, Audit Center.

#### proposal.revoked
- Version: 1
- Description: proposta revogada.
- Domain: Proposal Center
- Trigger: revogacao por negocio ou expirada por governanca.
- Payload conceitual: revocation reason, issuer, version, timestamp.
- Consumers: CRM, Opportunity, Audit Center, Analytics.

#### proposal.expired
- Version: 1
- Description: proposta expirada.
- Domain: Proposal Center
- Trigger: fim da janela de validade.
- Payload conceitual: expiredAt, proposal version, validity window.
- Consumers: CRM, Opportunity, Audit Center, Analytics.

### decision.*

#### decision.recommended
- Version: 1
- Description: decisao recomendada pelo EDP.
- Domain: Decision Core
- Trigger: ranking e policy convergindo para uma recomendacao.
- Payload conceitual: recommendation, explanation, scores, policy version, strategy version.
- Consumers: Proposal Center, CRM, Analytics, IA.

#### decision.overridden
- Version: 1
- Description: decisao recomendada foi sobrescrita por humano autorizado.
- Domain: Decision Core
- Trigger: override manual formal.
- Payload conceitual: original recommendation, override reason, actor, approval context.
- Consumers: Audit Center, Analytics, Governance.

### provider.*

#### provider.attempted
- Version: 1
- Description: tentativa de consulta a provider.
- Domain: Provider Operations
- Trigger: chamada iniciada.
- Payload conceitual: providerId, capability, timeout, retry policy, tenant.
- Consumers: Audit Center, Observability, Analytics.

#### provider.succeeded
- Version: 1
- Description: provider respondeu com sucesso.
- Domain: Provider Operations
- Trigger: resposta valida recebida.
- Payload conceitual: latency, status, capability, normalized result.
- Consumers: Simulation, Ranking, Audit Center, Observability.

#### provider.failed
- Version: 1
- Description: provider falhou ou excedeu timeout.
- Domain: Provider Operations
- Trigger: erro, timeout ou violation.
- Payload conceitual: error class, timeout, fallback reason, provider version.
- Consumers: Simulation, Ranking, Audit Center, Observability.

### operation.*

#### operation_candidate.created
- Version: 1
- Description: candidato a operacao criado apos aceite.
- Domain: Operations
- Trigger: proposta aceita e materializavel.
- Payload conceitual: opportunityId, proposalId, candidate status, tenant.
- Consumers: Operations, CRM, Audit Center, Analytics.

### policy.*

#### policy.version.created
- Version: 1
- Description: nova versao de policy criada.
- Domain: Decision Policy
- Trigger: policy versionada.
- Payload conceitual: policyId, version, effective window, tenant.
- Consumers: Governance, Decision Core, Ranking, Audit Center.

#### policy.version.approved
- Version: 1
- Description: policy aprovada.
- Domain: Decision Policy
- Trigger: aprovacao formal concluida.
- Payload conceitual: approver, approval notes, version, tenant.
- Consumers: Decision Core, Ranking, Proposal Center, Audit Center.

#### policy.version.activated
- Version: 1
- Description: policy ativada.
- Domain: Decision Policy
- Trigger: effective date alcançada ou publicacao controlada.
- Payload conceitual: active version, tenant, window.
- Consumers: Decision Core, Ranking, Proposal Center, Analytics.

#### policy.version.rollbacked
- Version: 1
- Description: policy reativada para versao anterior.
- Domain: Decision Policy
- Trigger: rollback formal.
- Payload conceitual: fromVersion, toVersion, reason, actor, tenant.
- Consumers: Decision Core, Audit Center, Analytics.

### strategy.*

#### strategy.version.created
- Version: 1
- Description: nova estrategia criada.
- Domain: Decision Strategy
- Trigger: estrategia executiva criada.
- Payload conceitual: strategyId, version, objectives, tenant.
- Consumers: Decision Core, Ranking, Proposal Center, Audit Center.

#### strategy.version.approved
- Version: 1
- Description: estrategia aprovada.
- Domain: Decision Strategy
- Trigger: aprovacao executiva.
- Payload conceitual: approver, notes, effective window.
- Consumers: Decision Core, Ranking, Governance.

#### strategy.version.activated
- Version: 1
- Description: estrategia ativada.
- Domain: Decision Strategy
- Trigger: inicio de vigencia.
- Payload conceitual: active version, tenant, objectives.
- Consumers: Decision Core, Ranking, Proposal Center.

#### strategy.version.rollbacked
- Version: 1
- Description: estrategia revertida para versao anterior aprovada.
- Domain: Decision Strategy
- Trigger: rollback formal e auditado.
- Aggregate: Decision Strategy Aggregate
- CorrelationId: preserva a cadeia da estrategia.
- CausationId: comando de rollback ou aprovacao previa que motivou a reversao.
- TenantId: obrigatorio, sempre tenant scoped.
- Payload conceitual: fromVersion, toVersion, reason, actor, approval context, tenant.
- Consumers: Decision Core, Ranking, Proposal Center, Audit Center.
- Retention: longa, para governanca e reproduzibilidade.
- Observability: auditoria de rollback, drift de estrategia, impacto em ranking.
- Future Compatibility: compativel com strategy.version.created, approved e activated.

### workflow.*

#### workflow.started
- Version: 1
- Description: fluxo iniciado.
- Domain: Workflow
- Trigger: caso de decisao aberto.
- Payload conceitual: workflow type, owner, tenant, aggregate.
- Consumers: Audit Center, Analytics, Decision Core.

#### workflow.completed
- Version: 1
- Description: fluxo concluido.
- Domain: Workflow
- Trigger: transicoes encerradas.
- Payload conceitual: final state, timestamps, outcome.
- Consumers: Audit Center, Analytics, Governance.

### audit.*

#### audit.event.recorded
- Version: 1
- Description: trilha de auditoria registrada.
- Domain: Audit Center
- Trigger: qualquer evento ou acao relevante para rastreabilidade.
- Aggregate: Audit Timeline Aggregate
- CorrelationId: conecta o registro ao fluxo de origem.
- CausationId: referencia o evento ou comando que originou o registro.
- TenantId: obrigatorio, sempre tenant scoped.
- Payload conceitual: actor, action, target, version, trace, security context.
- Consumers: Audit Center, Governance, Analytics, Compliance.
- Retention: muito longa, compativel com compliance e defesa da decisao.
- Observability: cobertura de auditoria, busca por correlacao, integridade da timeline.
- Future Compatibility: compativel com trilhas historicas e replays auditaveis.

### analytics.*

#### analytics.kpi.updated
- Version: 1
- Description: KPI operacional atualizado.
- Domain: Analytics
- Trigger: evento relevante consolidado.
- Payload conceitual: metric name, value, scope, period.
- Consumers: BI, Governance, Decision Support.

## Retention Guidance

- Eventos de decisao e proposal devem ter retencao longa.
- Eventos tecnicos de tentativa podem ter retencao menor, desde que preservem auditoria.
- Eventos de estrategia e policy exigem retencao compativel com auditoria e governanca.

## Future Compatibility

- Novos eventos podem ser adicionados por familia.
- Eventos existentes nao podem perder semantica sem revisao.
- Mudancas quebradoras exigem nova Architecture Review.
