# ARCH-055 — Catalog Consumption Architecture

Status: APPROVED WITH RESTRICTIONS

## 1. Objetivo

Definir como os domínios do FINQZ PRO Enterprise consomem o Master Catalog.

## 2. Decisão Oficial

Master Catalog é a única fonte canônica de Product, Subproduct, Modality e Segment.

Domínios consumidores podem referenciar o catálogo, mas não podem defini-lo.

## 3. Ownership

- Master Catalog: owner de Product, Subproduct, Modality e Segment.
- Opportunity: consumer.
- Commercial Table: consumer.
- Eligibility Engine: consumer de referência, owner de regras mutáveis.
- Provider Engine: translator.
- Simulation: consumer.
- Marketplace: consumer (assumido por alinhamento arquitetural; contrato explícito ainda não documentado).

## 4. Regras Obrigatórias

- Opportunity não define catálogo.
- Commercial Table não define catálogo.
- Eligibility não entra no catálogo.
- Provider Taxonomy nunca vira verdade interna.
- Segment é dimensão paralela, não pai de Product.
- PF e PJ coexistem no mesmo catálogo.
- Frontend nunca é source of truth.

## 5. Anti-Patterns Proibidos

- creditPfCatalog como verdade final.
- catalogRepository como catálogo oficial.
- commercialRepository como fonte operacional definitiva.
- heurística Product -> Pipeline.
- taxonomia de provider como catálogo FINQZ.
- Eligibility dentro do Master Catalog.
- Segment como pai de Product.

## 6. Risco Residual

Marketplace ainda não possui contrato explícito documentado.
Caso passe a ter taxonomia própria, deverá ser criada ADR específica.

## 7. Veredito

GO com restrições.

Nenhuma implementação está autorizada por este documento.
