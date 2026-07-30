# ADR-003 — FINQZ PRO Simulation Engine as Source of Truth

## Status

Accepted

## Context

O FINQZ PRO possui integração com providers externos financeiros, incluindo SOS BOLSO.

Durante a fase de descoberta operacional da integração, foi identificado que:

- providers externos podem apresentar coeficientes inconsistentes;
- regras de cálculo variam entre bancos;
- algumas plataformas não executam cálculo oficial;
- coeficientes podem estar desatualizados;
- a origem externa não deve governar a lógica financeira interna do FINQZ PRO.

O FINQZ PRO precisa evoluir para uma plataforma financeira inteligente com:

- simulação própria;
- cálculo próprio;
- comparação entre bancos;
- motor comercial interno;
- inteligência operacional;
- automação financeira;
- pós-venda baseado em IA.

## Decision

O FINQZ PRO define oficialmente que:

- cálculos financeiros serão executados internamente;
- providers externos não serão considerados fonte oficial de cálculo;
- coeficientes externos serão tratados apenas como referência operacional;
- simulações serão governadas pelo Simulation Engine interno;
- regras comerciais continuarão centralizadas na Commercial API;
- integrações externas serão isoladas via Provider Engine.

## Consequences

### Positivas

- independência de providers externos;
- maior confiabilidade operacional;
- capacidade de auditoria;
- versionamento de cálculo;
- comparador multi-banco;
- flexibilidade para IA financeira;
- preparação para autocontratação;
- preparação para APIs bancárias oficiais futuras.

### Negativas

- aumento de complexidade interna;
- necessidade de manter regras financeiras próprias;
- necessidade futura de atualização de coeficientes e taxas.

## Future Direction

O FINQZ PRO deverá evoluir futuramente para:

- Simulation Engine;
- Coefficient Engine;
- Multi-bank Integration Layer;
- Proposal Decision Engine;
- AI Financial Assistant;
- Pós-venda Inteligente;
- Self-Service Contracting;
- Banking Middleware Platform.

## Related ADRs

- ADR-001 — Commercial API as Source of Truth
- ADR-002 — Provider Engine for External Integrations
