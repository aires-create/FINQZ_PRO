# Commercial Governance Plan

## MVP
- Estruturar o modulo por dominios funcionais sem expor rotas.
- Definir contratos internos (DTOs/schemas) e servicos por contexto.
- Preparar pontos de integracao com RBAC, tenant context e auditoria.
- Isolar regras de negocio para evitar impacto em fluxos legados.

## Entidades futuras
- CommercialRequest
- CommercialPolicy
- ApprovalMatrix
- ApprovalDecision
- SpreadCalculation
- Campaign
- AcceleratorRule
- Agreement
- BonusGrant
- NotificationDispatch
- GovernanceAuditLog

## Regras de aprovacao
- Alçada por faixa de valor financeiro.
- Alçada por risco/segmento do parceiro.
- Escalonamento automatico por excecoes de politica.
- Regras condicionadas por tenant e perfil RBAC.

## Regras de spread
- Parametrizacao por produto, canal e campanha.
- Limites minimos/maximos por politica comercial.
- Simulacao antes da submissao para aprovacao.
- Rastreabilidade de versao de regra aplicada.

## Campanhas e aceleradores
- Campanhas com vigencia e segmentacao por parceiro.
- Aceleradores condicionais por meta, volume ou mix.
- Priorizacao de regras em conflito (campanha vs politica base).

## Notificacoes
- Eventos para areas comercial, risco, financeiro e compliance.
- Canais futuros: in-app, email e integracoes externas.
- Controle de estado de entrega e reenvio.

## Auditoria
- Registro de cada transicao de status da solicitacao.
- Log de decisoes, usuario responsavel e justificativa.
- Vinculo entre regra aplicada, resultado e timestamp.
- Trilha completa para compliance e investigacao.

## Integracao com financeiro
- Gatilhos para provisionamento e liquidacao de bonificacoes.
- Exportacao de acordos aprovados para rotinas financeiras.
- Conciliacao futura entre calculado, aprovado e pago.

## Cuidados anti-legado
- Nao duplicar regras ja existentes em modulos atuais.
- Nao criar rotas paralelas fora do padrao arquitetural.
- Nao acoplar logica nova a fluxos antigos sem contrato explicito.
- Evoluir por interfaces/modulos para facilitar rollback e governanca.
