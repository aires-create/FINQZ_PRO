# ARCH-067 — Commercial Structure Implementation Plan

Status: APPROVED

Fase: H-14J

Data: Junho/2026

Owner: FINQZ PRO Enterprise Architecture

---

# 1. Objetivo

Definir o plano oficial de implementação da nova Commercial Structure baseada nos contratos canônicos aprovados em ARCH-065.

Este documento não executa alterações.

Seu objetivo é transformar as conclusões do ARCH-066 em um plano controlado, previsível e auditável.

---

# 2. Contexto

As seguintes fases foram concluídas:

* ARCH-060 Commercial Tables Architecture
* ARCH-061 Commercial Tables UX & Navigation
* ARCH-062 Commercial Structure Frontend Alignment Audit
* ARCH-063 Commercial Structure Frontend Consolidation Plan
* ARCH-064 ADR-004 Supersession Resolution
* ARCH-065 Commercial Structure Canonical Contracts
* ARCH-066 Commercial Structure Runtime Readiness Review

Resultado consolidado:

A arquitetura foi aprovada.

A implementação direta foi classificada como NO-GO.

Foi aprovada uma execução controlada em Waves.

---

# 3. Objetivo da Transformação

Migrar a Estrutura Comercial atual de:

* árvore híbrida
* catálogo legado
* ownership duplicado
* store funcional
* mapper transitório

para:

* Coverage View Model
* Master Catalog Consumer
* UI Read-Only
* Contratos Canônicos
* Runtime Backend Driven

---

# 4. Estado Atual

## Fonte Principal

Master Catalog

---

## Fonte Transitória

loadEstruturaComercialFromMasterCatalog

---

## Legados Identificados

* creditPfCatalog
* catalogRepository
* migrateProdutosToEstruturaComercial
* EstruturaComercial legado
* EstruturaComercialNivel legado

---

# 5. Estratégia de Execução

A implementação será realizada em seis waves independentes.

Nenhuma wave poderá iniciar sem validação da anterior.

---

# 6. Wave 1 — Canonical Contracts Foundation

Status:

PLANNED

Objetivo:

Introduzir contratos canônicos aprovados em ARCH-065.

---

## Escopo

Criar contratos oficiais:

* CoverageNodeType
* CommercialCoverageStatus
* CommercialStructureSegmentView
* CommercialStructureProductView
* CommercialStructureSubproductView
* CommercialStructureModalityView
* CommercialCoverageViewModel

---

## Restrições

Proibido:

* alterar UI
* alterar mapper
* alterar store
* alterar runtime

---

## Critério de Aceite

Contratos disponíveis.

Nenhuma mudança funcional.

---

# 7. Wave 2 — Coverage Mapper Foundation

Status:

PLANNED

Objetivo:

Construir a camada oficial:

Master Catalog

↓

Coverage View Model

---

## Escopo

Substituir a lógica atual de:

masterCatalogToEstruturaComercial.mapper.ts

---

## Regras

Proibido:

* converter Modality em tabela_plano_campanha
* introduzir Provider
* introduzir Commercial Table
* introduzir Commercial Condition

---

## Critério de Aceite

Mapper produz apenas:

* Segment
* Product
* Subproduct
* Modality

---

# 8. Wave 3 — Coverage Read-Only UI

Status:

PLANNED

Objetivo:

Transformar Estrutura Comercial em consumidor visual de Coverage.

---

## Escopo

Permitir visualização de:

* Segment
* Product
* Subproduct
* Modality

---

## Remover

Da árvore principal:

* fornecedor_originador
* tabela_plano_campanha
* condicao_comercial

---

## Critério de Aceite

Tela opera em modo read-only.

Sem CRUD.

---

# 9. Wave 4 — Store Decoupling

Status:

PLANNED

Objetivo:

Eliminar ownership funcional da store.

---

## Métodos Candidatos

* addEstruturaComercial
* updateEstruturaComercial
* deleteEstruturaComercial
* duplicateEstruturaComercial

---

## Resultado Esperado

Store utilizada apenas para:

* estado visual
* filtros
* expansão de árvore
* seleção

---

# 10. Wave 5 — Legacy Quarantine

Status:

PLANNED

Objetivo:

Isolar legados.

---

## Componentes

creditPfCatalog

Status:

LEGACY

---

catalogRepository

Status:

LEGACY TRANSITIONAL

---

migrateProdutosToEstruturaComercial

Status:

LEGACY MIGRATION

---

## Resultado Esperado

Nenhum legado participa da trilha principal.

---

# 11. Wave 6 — Coverage Runtime

Status:

BLOCKED

Pré-requisitos:

* backend coverage
* contratos coverage
* RBAC
* tenant context
* APIs oficiais

---

## Objetivo

Substituir definitivamente fontes locais.

---

## Resultado Esperado

Coverage consumido exclusivamente via backend.

---

# 12. Riscos

## Alto

Tipos duplicados.

---

## Alto

Mapper legado.

---

## Alto

Store funcional.

---

## Médio

creditPfCatalog.

---

## Médio

catalogRepository.

---

# 13. Dependências

Wave 2 depende da Wave 1.

Wave 3 depende da Wave 2.

Wave 4 depende da Wave 3.

Wave 5 depende da Wave 4.

Wave 6 depende do backend.

---

# 14. Critérios de Go-Live

A nova Commercial Structure será considerada consolidada quando:

* contratos canônicos estiverem ativos
* mapper coverage estiver ativo
* UI read-only estiver ativa
* store estiver desacoplada
* legados estiverem isolados
* backend coverage estiver operacional

---

# 15. Veredito Final

Implementação autorizada somente através das Waves definidas neste documento.

Qualquer implementação direta fora desta sequência será considerada divergência arquitetural.

ARCH-067 aprovado como plano oficial de implementação da Commercial Structure.

---

# 16. Próxima Fase

PHASE H-14K

Wave 1 — Canonical Contracts Foundation

Primeira implementação autorizada da nova Commercial Structure.
