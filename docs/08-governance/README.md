# FINQZ PRO Enterprise - Documentation Governance Portal

## Visão geral

Este portal é a porta de entrada oficial da governança documental do FINQZ PRO Enterprise.

Ele organiza a documentação em uma estrutura navegável, auditável e sustentável, com uma regra central:

- cada tema deve ter um documento canônico;
- documentos auxiliares devem ter papel explícito;
- histórico deve permanecer rastreável;
- duplicidades futuras devem ser evitadas por governança, não por improviso.

## Objetivo

- centralizar a navegação documental;
- indicar a ordem oficial de leitura;
- explicar o ciclo de vida dos documentos;
- definir ownership por domínio;
- padronizar nomenclatura e mudança;
- manter rastreabilidade entre arquitetura, auditorias, planos, ADRs, release e infraestrutura.

## Como navegar

1. Comece pelo Documento Mestre.
2. Leia o índice documental para localizar o tema.
3. Verifique o ciclo de vida e o owner do domínio.
4. Use a política de mudança antes de criar ou substituir um documento.
5. Consulte o hub executivo para entender o estado atual da governança.

## Ordem oficial de leitura

1. `docs/00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md`
2. `docs/00-master/PCCD-FINQZ-PRO-ENTERPRISE.md`
3. `docs/08-governance/DOC-GOV-01-COMANDO-MESTRE-CONTINUIDADE-TECNICA.md`
4. `docs/08-governance/EPC-DOC-03-DOCUMENTATION-GOVERNANCE-HUB.md`
5. `docs/08-governance/DOCUMENT-MAP.md`
6. `docs/08-governance/DOCUMENT-LIFECYCLE.md`
7. `docs/08-governance/DOCUMENT-OWNERSHIP.md`
8. `docs/08-governance/DOCUMENT-NAMING-STANDARD.md`
9. `docs/08-governance/DOCUMENT-CHANGE-POLICY.md`
10. `docs/08-governance/EPC-DOC-01-DOCUMENTATION-CONSISTENCY-AUDIT.md`
11. `docs/08-governance/EPC-DOC-02-DOCUMENTATION-CONSOLIDATION-PLAN.md`
12. `docs/06-release/README.md`
13. `docs/07-infrastructure/EPC-INFRA-01-INFRASTRUCTURE-READINESS-AUDIT.md`

## Mapa textual da documentação

```text
00-master
  ├─ DCA / PCCD / EOS architecture
  └─ master audits annex

02-architecture
  ├─ domain foundation
  ├─ workspace / opportunity
  ├─ operation domain
  ├─ master catalog / commercial catalog
  ├─ pipeline / stage / ownership
  └─ partner acquisition

03-audits
  ├─ CRM / workspace / simulator audits
  ├─ W2 consolidation chain
  └─ W3 hub consolidation

04-plans
  ├─ EPC-W2 legacy quarantine chain
  ├─ backend/server removal chain
  └─ release readiness / hardening plans

05-adr
  ├─ commercial source of truth
  ├─ simulation source of truth
  ├─ master catalog
  └─ operation persistence

06-release
  ├─ readiness audit
  ├─ operational checklist
  ├─ runbook
  ├─ playbook
  ├─ audit trail standard
  ├─ evidence template
  └─ governance baseline

07-infrastructure
  ├─ readiness audit
  ├─ gap plan
  └─ provisioning checklist

08-governance
  ├─ consistency audit
  ├─ consolidation plan
  ├─ DOC-GOV operational continuity guide
  ├─ map
  ├─ lifecycle
  ├─ ownership
  ├─ naming standard
  ├─ change policy
  └─ governance hub
```

## Responsáveis

| Domínio | Responsável principal | Objetivo |
| --- | --- | --- |
| Master | Architecture / Program | Verdade oficial do programa |
| Architecture | Enterprise Architecture | Contratos, blueprints e boundaries |
| Audits | Architecture / QA / Governance | Evidência e diagnóstico |
| Plans | Architecture / Delivery | Execução controlada |
| ADR | Architecture Board | Decisão oficial |
| Release | Release Management | Go-live e operação de release |
| Infrastructure | Infrastructure / DevOps / SRE | Readiness e provisionamento |
| Governance | Documentation Governance | Índice, padrão e mudança |
