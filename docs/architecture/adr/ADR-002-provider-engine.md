# ADR-002 — Provider Engine para Integrações Externas

## Status
Accepted

## Context
O FINQZ PRO precisa integrar múltiplos fornecedores externos, incluindo NOVA PROMOTORA / Storm, webhooks, SMTP, WhatsApp, Zapier e storage.

Cada fornecedor pode ter autenticação, payload, regras e disponibilidade diferentes.

## Decision
Criar uma Integration Layer backend com Provider Engine.

Cada provider externo deve possuir:
- client
- mapper
- service
- types

O frontend nunca deve consumir APIs externas diretamente.

## Consequences

### Positivas
- desacoplamento entre FINQZ e fornecedores
- suporte multi-provider
- maior segurança
- melhor auditabilidade
- facilidade para retry e observabilidade
- menor risco de vendor lock-in

### Negativas
- mais código backend
- necessidade de padronização de contratos
- necessidade futura de monitoramento por provider

## Related
- ADR-001 — Commercial API as Source of Truth
- FASE 2.20 — Integração NOVA PROMOTORA