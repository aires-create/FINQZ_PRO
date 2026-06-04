# Integrações — Domínio Arquitetural

## Objetivo
Centralizar integrações externas do FINQZ PRO.

## Providers suportados
- SOS BOLSO / Sos Bolso
- Webhooks
- SMTP
- Zapier
- WhatsApp Business
- Amazon S3

## Regras arquiteturais
- Nenhuma integração externa deve ser chamada diretamente pelo frontend.
- Toda integração externa deve passar pela API backend do FINQZ PRO.
- Cada provider deve ter adapter próprio.
- Payload externo nunca define o domínio FINQZ.
- Todo provider deve ser multi-tenant.
- Credenciais nunca devem ir para o frontend.
- Credenciais nunca devem ser commitadas no Git.

## Fluxo oficial
Frontend
→ FINQZ API
→ Integration Layer
→ Provider Adapter
→ External API

## Estrutura futura
backend/src/integrations/
  providers/

## Benefícios
- desacoplamento
- multi-provider
- segurança
- auditabilidade
- retry/recovery
- observabilidade
- troca futura de fornecedor
