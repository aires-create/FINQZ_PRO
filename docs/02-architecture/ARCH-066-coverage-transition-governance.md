# ARCH-066 — Coverage Transition Governance

## Status

APPROVED

## Context

Após a conclusão do Master Catalog e da implantação do Commercial Coverage como read model canônico, o FINQZ PRO passou a conviver temporariamente com duas experiências relacionadas à estrutura comercial:

* Commercial Coverage
* Estrutura Comercial

A auditoria H-14L foi executada para determinar ownership, governança, classificação e plano de transição.

---

## Decisão Arquitetural

Commercial Coverage passa a ser a experiência oficial e canônica para visualização da cobertura comercial.

Estrutura Comercial permanece disponível apenas como tela de transição controlada até a conclusão do plano de desativação.

---

## Classificação Oficial

| Componente                     | Classificação |
| ------------------------------ | ------------- |
| CommercialCoverage             | KEEP          |
| CommercialCoverageTree         | KEEP          |
| Coverage Loader                | KEEP          |
| Coverage Mapper                | KEEP          |
| Coverage Contracts             | KEEP          |
| EstruturaComercial             | QUARANTINE    |
| useAppStore (fluxo legado)     | QUARANTINE    |
| catalogRepository              | QUARANTINE    |
| commercialRepository           | REMOVE LATER  |
| creditPfCatalog                | REMOVE LATER  |
| src/types/index.ts (duplicado) | BLOCKER       |

---

## Ownership

### Commercial Coverage

Responsável por responder:

> "Posso vender?"

Características:

* Read Only
* Tenant Scoped
* Backend Driven
* Consome Master Catalog
* Não possui CRUD
* Não possui store local
* Não possui Provider Engine
* Não possui Pipeline
* Não possui Opportunity

Fluxo oficial:

Master Catalog
→ Coverage Loader
→ Coverage Mapper
→ Commercial Coverage
→ Commercial Coverage Tree

---

## Estrutura Comercial

Classificação:

QUARANTINE

Restrições:

* Não expandir funcionalidades
* Não criar novas dependências
* Não promover a fonte de verdade
* Não utilizar para novos fluxos

Objetivo:

Manter compatibilidade transitória até migração completa dos consumidores remanescentes.

---

## Governança de Navegação

Decisão oficial:

Coverage Comercial permanece visível como experiência principal.

Estrutura Comercial deverá evoluir para área de legado/admin durante futura fase de migração.

Objetivo:

Eliminar ambiguidade de navegação.

---

## Governança RBAC

Estado atual:

* sales:view
* estrutura_comercial:view

Direção futura:

* coverage:read

Princípios:

* Backend Driven
* Sem permissões hardcoded
* Sem lógica de autorização no frontend

---

## NO-GO

É proibido:

* Transformar Coverage em CRUD
* Conectar Coverage ao useAppStore
* Conectar Coverage ao Zustand
* Conectar Coverage ao creditPfCatalog
* Conectar Coverage ao catalogRepository
* Conectar Coverage ao commercialRepository
* Misturar Coverage com Pipeline
* Misturar Coverage com Opportunity
* Misturar Coverage com Provider Engine
* Criar fontes paralelas de verdade

---

## Plano de Desativação Controlada

Fase futura:

1. Mapear consumidores restantes da Estrutura Comercial
2. Mapear dependências do store legado
3. Migrar consumidores para Coverage
4. Desativar catalogRepository
5. Desativar commercialRepository
6. Remover creditPfCatalog
7. Remover Estrutura Comercial

---

## Veredito

GO WITH RESTRICTIONS

Commercial Coverage é a experiência canônica oficial.

Estrutura Comercial permanece em transição controlada até a conclusão da migração arquitetural.
