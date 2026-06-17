# ARCH-062 — Commercial Structure Frontend Alignment Audit

Status: APPROVED WITH RESTRICTIONS
Fase: H-14E
Data: Junho/2026
Owner: FINQZ PRO Enterprise Architecture

---

# 1. Objetivo

Registrar a auditoria oficial do frontend da Estrutura Comercial, identificando legados, conflitos de contrato, fontes paralelas de verdade e blockers antes de qualquer implementação.

Esta fase não autoriza refatoração, remoção de arquivos, alteração de tipos, alteração de store ou mudança de runtime.

---

# 2. Escopo Auditado

Arquivos principais:

* src/pages/EstruturaComercial.tsx
* src/types/index.ts
* src/store/index.ts
* src/features/master-catalog/loadEstruturaComercialFromMasterCatalog.ts
* src/features/master-catalog/masterCatalogToEstruturaComercial.mapper.ts
* src/data/catalogRepository.ts
* src/data/creditPfCatalog.ts
* src/api/modules/master-catalog.api.ts

---

# 3. Estado Atual

A Estrutura Comercial no frontend está em estado híbrido.

Convivem duas arquiteturas:

## Arquitetura Legada

creditPfCatalog
↓
catalogRepository
↓
store/index.ts
↓
EstruturaComercial.tsx

## Arquitetura Alvo

Master Catalog
↓
masterCatalogApi
↓
loadEstruturaComercialFromMasterCatalog
↓
mapper
↓
EstruturaComercial.tsx

---

# 4. Veredito Geral

Status:

GO COM RESTRIÇÕES

Implementação:

NO-GO

Motivo:

Existe ponte válida com o Master Catalog, mas o frontend ainda mantém dependências legadas, tipos duplicados, mapper transitório e responsabilidades misturadas.

---

# 5. Blockers

## BLOCKER 1 — Tipos Duplicados

O arquivo src/types/index.ts possui duplicidade de:

* EstruturaComercialNivel
* FornecedorTipo
* HistoricoItem
* EstruturaComercial

Isso representa conflito de contrato e impede tratar o frontend como canônico.

---

## BLOCKER 2 — Mapper Incorreto

O mapper atual converte:

Modality
↓
tabela_plano_campanha

Isso viola a arquitetura oficial.

Modality pertence ao Master Catalog.

Commercial Table pertence ao domínio Commercial Tables.

---

## BLOCKER 3 — Store como Fonte de Verdade

A tela EstruturaComercial.tsx ainda depende de useAppStore para:

* setEstruturaComercial
* addEstruturaComercial
* updateEstruturaComercial
* deleteEstruturaComercial
* duplicateEstruturaComercial
* importEstruturaComercial
* exportEstruturaComercial

Isso conflita com Backend First e Single Source of Truth.

---

## BLOCKER 4 — creditPfCatalog Vivo

creditPfCatalog ainda aparece como fonte ou seed transicional.

Este arquivo mistura conceitos de catálogo, provider, pipeline e automações.

Não pode ser fonte canônica da Estrutura Comercial.

---

# 6. Conflitos Arquiteturais

A tela atual ainda usa níveis antigos:

* vertical
* produto
* subproduto
* fornecedor_originador
* tabela_plano_campanha
* condicao_comercial

A arquitetura oficial exige separação entre:

## Master Catalog

* Segment
* Product
* Subproduct
* Modality

## Commercial Structure Coverage

* cobertura
* elegibilidade operacional
* status
* vigência
* motivo

## Commercial Tables

* provider
* tabela
* condições
* taxa
* coeficiente
* comissão base

## Provider Engine

* executor
* tradutor operacional
* integração externa

---

# 7. Ativos Reaproveitáveis

Podem ser reaproveitados:

* masterCatalogApi
* loadEstruturaComercialFromMasterCatalog
* parte da ordenação do mapper
* shell visual da página
* cards, filtros e estrutura visual
* separação visual entre Segmentos Comerciais e Produtos Comerciais

---

# 8. Candidatos a Legado ou Quarentena

Devem ser tratados como transição ou quarentena futura:

* creditPfCatalog
* catalogRepository
* buildEstruturaComercialFromCatalog
* migrateProdutosToEstruturaComercial
* segunda definição de EstruturaComercial em src/types/index.ts
* níveis fornecedor_originador, tabela_plano_campanha e condicao_comercial dentro da tela de Estrutura Comercial
* mapper que converte Modality em tabela_plano_campanha

---

# 9. Arquitetura Alvo

A Estrutura Comercial deve ser orientada por Coverage.

Ela deve responder:

> Posso vender?

A tela deve ser segment-first.

Fluxo conceitual:

Segment
↓
Product
↓
Subproduct
↓
Modality
↓
Coverage Status

Commercial Structure não deve possuir:

* provider
* tabela comercial
* condição comercial
* comissão
* simulação
* pipeline

---

# 10. Plano Seguro Futuro

Nenhuma ação de runtime está autorizada por este documento.

Plano futuro recomendado:

1. Separar tipos canônicos de Commercial Structure.
2. Remover duplicidade de tipos após auditoria de impacto.
3. Redesenhar mapper Master Catalog → Coverage View Model.
4. Remover Modality → tabela_plano_campanha.
5. Isolar provider/table/condition fora da tela de Estrutura Comercial.
6. Reduzir dependência da store como fonte de verdade.
7. Manter Master Catalog como leitura canônica.
8. Preparar Coverage Runtime em fase própria.

---

# 11. Anti-Patterns Proibidos

É proibido:

* usar creditPfCatalog como fonte canônica
* usar catalogRepository como fonte oficial
* tratar Modality como Commercial Table
* misturar Provider dentro da Estrutura Comercial
* misturar Commercial Condition dentro da Estrutura Comercial
* fazer refatoração ampla sem plano
* remover tipos duplicados sem auditoria de impacto
* avançar para Simulator antes de consolidar Coverage e Tables

---

# 12. Veredito Final

A Estrutura Comercial Frontend pode seguir para planejamento de consolidação, mas não está pronta para implementação direta.

Resultado:

GO COM RESTRIÇÕES

Próxima fase recomendada:

H-14F — Commercial Structure Frontend Consolidation Plan

ARCH-062 aprovado como auditoria oficial de alinhamento frontend da Estrutura Comercial.
