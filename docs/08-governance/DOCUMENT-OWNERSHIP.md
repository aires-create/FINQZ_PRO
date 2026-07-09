# Document Ownership

## Princípio

Cada domínio documental precisa de um owner explícito. O owner responde por:

- escopo;
- atualização;
- coerência;
- referência cruzada;
- decisão de supersession;
- arquivamento.

## Owners por domínio

| Domínio | Owner principal | Backup | Responsabilidade |
| --- | --- | --- | --- |
| Master | Program / Chief Architecture | Governance Lead | Verdade oficial do programa |
| Architecture | Enterprise Architect | Domain Architect | Contratos, blueprints e boundaries |
| Audits | Architecture / QA | Product / SRE | Evidência, gap analysis e recheck |
| Plans | Delivery Architect | Release Manager | Sequência de execução |
| ADR | Architecture Board | Program Sponsor | Decisões aceitas e seus efeitos |
| Release | Release Manager | DevOps Lead | Readiness, go-live e evidências |
| Infrastructure | Infrastructure Architect | SRE / Security Engineer | VPS, Docker, Nginx, TLS, backup, rollback |
| Governance | Documentation Governance Lead | Technical Writer | Índice, nomenclatura, lifecycle e change policy |

## Regras

- todo documento novo deve ter owner;
- documentos sem owner são considerados incompletos;
- o owner define se um documento vira ACTIVE, HISTORICAL, DEPRECATED ou ARCHIVED;
- sem owner não há supersession nem arquivamento formal.

