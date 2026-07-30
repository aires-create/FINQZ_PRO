# ARCH-066 — Commercial Structure Runtime Readiness Review

Status: APPROVED

Fase: H-14I

Data: Junho/2026

Owner: FINQZ PRO Enterprise Architecture

---

# 1. Objetivo

Avaliar a prontidão técnica (Runtime Readiness) da implementação dos contratos definidos em ARCH-065 — Commercial Structure Canonical Contracts.

Este documento não autoriza implementação.

Seu objetivo é identificar:

* impactos
* riscos
* dependências
* legados
* ordem segura de execução

antes de qualquer alteração em runtime.

---

# 2. Escopo da Auditoria

Arquivos auditados:

Frontend:

* src/pages/EstruturaComercial.tsx
* src/store/index.ts
* src/types/index.ts
* src/features/master-catalog/masterCatalogToEstruturaComercial.mapper.ts
* src/features/master-catalog/loadEstruturaComercialFromMasterCatalog.ts
* src/data/catalogRepository.ts
* src/data/creditPfCatalog.ts

Referências arquiteturais:

* ARCH-058
* ARCH-059
* ARCH-060
* ARCH-061
* ARCH-062
* ARCH-063
* ARCH-064
* ARCH-065

---

# 3. Executive Summary

ARCH-065 representa a direção arquitetural correta.

Entretanto:

o frontend atual continua acoplado ao modelo legado de Estrutura Comercial.

Foi identificado que:

* a tela utiliza contratos híbridos
* a store ainda atua como fonte funcional
* o mapper converte Modality em tabela_plano_campanha
* existem tipos duplicados
* creditPfCatalog permanece como seed operacional
* catalogRepository continua atuando como adapter legado

Implementar ARCH-065 diretamente neste momento geraria quebra controlada de múltiplos pontos da aplicação.

---

# 4. Veredito da Auditoria

## Implementação Imediata

NO-GO

---

## Direção Arquitetural

GO

ARCH-065 permanece aprovado e correto.

O bloqueio é exclusivamente de readiness técnica.

---

# 5. Impactos Identificados

## 5.1 EstruturaComercial.tsx

Problemas encontrados:

* depende de vertical
* depende de fornecedor_originador
* depende de tabela_plano_campanha
* depende de condicao_comercial

O modelo atual não corresponde ao contrato canônico.

A tela foi construída para uma árvore híbrida.

ARCH-065 exige:

* SEGMENT
* PRODUCT
* SUBPRODUCT
* MODALITY

como únicos nós canônicos.

---

## 5.2 Store

Problemas encontrados:

* estruturaComercial inicializada por catálogo legado
* CRUD local
* duplicação de ownership
* fonte funcional paralela

Métodos afetados:

* addEstruturaComercial
* updateEstruturaComercial
* deleteEstruturaComercial
* duplicateEstruturaComercial
* importEstruturaComercial
* exportEstruturaComercial

---

## 5.3 Tipos

Problemas encontrados:

* duplicidade de EstruturaComercial
* duplicidade de EstruturaComercialNivel
* coexistência de modelos incompatíveis

Risco:

introduzir contratos canônicos sobre tipos duplicados.

---

## 5.4 Mapper

Problema crítico identificado:

Modality está sendo convertida para:

tabela_plano_campanha

Este comportamento conflita diretamente com ARCH-065.

---

## 5.5 catalogRepository

Classificação:

LEGACY TRANSITIONAL ADAPTER

Problemas:

* mistura catálogo
* mistura configurações
* reexporta creditPfCatalog

Não deve ser tratado como source of truth.

---

## 5.6 creditPfCatalog

Classificação:

LEGACY FUNCTIONAL SEED

Problemas:

* providers
* pipelineId
* pipelineCode
* automationEvents

Mistura múltiplos domínios.

Não representa a arquitetura atual.

---

# 6. Componentes Reaproveitáveis

## Reaproveitamento Permitido

loadEstruturaComercialFromMasterCatalog

Uso:

camada de orquestração.

---

## Shell Visual

Podem ser reaproveitados:

* layout
* cards
* filtros
* modais
* navegação

Apenas UX.

Não reaproveitar lógica de domínio.

---

## Ordenação

A estratégia de:

displayOrder + name

permanece válida.

---

# 7. Componentes Classificados como Legado

## creditPfCatalog

Status:

LEGACY

Destino:

quarentena futura.

---

## catalogRepository

Status:

LEGACY TRANSITIONAL

Destino:

remoção gradual.

---

## migrateProdutosToEstruturaComercial

Status:

LEGACY MIGRATION

Destino:

remoção após consolidação.

---

## fornecedor_originador

Status:

LEGACY NODE

---

## tabela_plano_campanha

Status:

LEGACY NODE

---

## condicao_comercial

Status:

LEGACY NODE

---

# 8. Estratégia Oficial de Implementação

A implementação deverá ocorrer em waves controladas.

---

## Wave 1

Canonical Contracts Foundation

Objetivo:

introduzir contratos oficiais do ARCH-065.

Escopo:

* tipos
* interfaces
* contratos

Sem alterar UI.

---

## Wave 2

Coverage Mapper Foundation

Objetivo:

substituir mapper legado.

Escopo:

Master Catalog → Coverage View Model

---

## Wave 3

Coverage Read-Only UI

Objetivo:

converter Estrutura Comercial para consumo read-only.

Escopo:

* Segment
* Product
* Subproduct
* Modality

Sem CRUD.

---

## Wave 4

Store Decoupling

Objetivo:

remover store como fonte funcional.

Store passa a representar apenas estado visual.

---

## Wave 5

Legacy Quarantine

Objetivo:

isolar:

* catalogRepository
* creditPfCatalog

fora da trilha principal.

---

## Wave 6

Coverage Runtime

Pré-requisito:

backend coverage estável.

Objetivo:

consumo oficial de Coverage.

---

# 9. Dependências

Wave 6 depende de:

* contratos coverage backend
* API coverage oficial
* validação tenant-scoped
* validação RBAC

---

# 10. Critérios de Go-Live

A implementação somente poderá iniciar após:

* contratos estabilizados
* tipos consolidados
* mapper substituído
* store desacoplada
* legados isolados

---

# 11. Veredito Final

Implementação imediata:

NO-GO

Readiness documental:

APPROVED

Direção arquitetural:

APPROVED

ARCH-065 permanece válido.

A implementação deverá seguir obrigatoriamente as Waves 1–6 definidas neste documento.

---

# 12. Próxima Fase

PHASE H-14J

Commercial Structure Implementation Planning

Objetivo:

planejar a execução controlada das Waves definidas em ARCH-066 antes de qualquer alteração em runtime.
