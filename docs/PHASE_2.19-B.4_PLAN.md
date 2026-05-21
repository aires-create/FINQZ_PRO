# FASE 2.19-B.4 — Consolidação Enterprise Comercial

## Objetivo
Consolidar API/PostgreSQL como fonte oficial das tabelas comerciais.

## Não fazer ainda
- Integração NOVA
- Ranking IA
- RBAC avançado
- Billing
- Feature flags
- Refatoração visual ampla

## Escopo
- Simulador ler dados comerciais reais
- localStorage apenas legado controlado
- melhorar erros HTTP
- loading states
- retry leve em GET
- importação CSV com feedback
- logs operacionais frontend

## Riscos
- Simulador ainda depende de repository local
- fallback pode exibir dado antigo
- importação pode aplicar parcial