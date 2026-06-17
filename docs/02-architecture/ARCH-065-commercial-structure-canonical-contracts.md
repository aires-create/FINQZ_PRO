# ARCH-065 — Commercial Structure Canonical Contracts

Status: APPROVED

Fase: H-14H

Data: Junho/2026

Owner: FINQZ PRO Enterprise Architecture

---

# 1. Objetivo

Definir os contratos canônicos oficiais da Commercial Structure Coverage.

Este documento consolida a separação definitiva entre:

Master Catalog
Commercial Structure Coverage
Commercial Tables
Provider Engine
Intelligent Simulator

e estabelece os contratos que deverão ser utilizados pelas futuras implementações.

# 2. Contexto

As auditorias:

ARCH-062
ARCH-063
ARCH-064

confirmaram a existência de modelos transitórios e legados no frontend.

Foi identificado que:

EstruturaComercial atual mistura múltiplos domínios.
Modality é convertida incorretamente para tabela_plano_campanha.
Provider aparece dentro da árvore.
Commercial Tables aparecem dentro da árvore.
Commercial Conditions aparecem dentro da árvore.

Esses comportamentos não representam a arquitetura oficial.

# 3. Ownership Oficial
Master Catalog

Owner oficial de:

Segment
Product
Subproduct
Modality

Responde:

"O que existe?"

Documentos:

ARCH-038
ARCH-055
ARCH-064
Commercial Structure Coverage

Consome Master Catalog.

Não é owner da taxonomia.

Responde:

"Posso vender?"

Documentos:

ARCH-057
ARCH-058
ARCH-059
Commercial Tables

Consome Master Catalog.

Não é owner da taxonomia.

Responde:

"Em quais condições vendo?"

Documentos:

ARCH-060
ARCH-061
Provider Engine

Consome Master Catalog.

Não é owner da taxonomia.

Responde:

"Quem executa?"

Intelligent Simulator

Consome:

Coverage
Commercial Tables
Provider Engine
Master Catalog

Não é owner de nenhum domínio.

Responde:

"O que devo ofertar?"

# 4. Taxonomia Canônica

A taxonomia oficial do FINQZ PRO permanece:

Segment

↓

Product

↓

Subproduct

↓

Modality

Observação:

Segment não é pai persistente de Product.

Segment é dimensão comercial independente.

# 5. Contratos Canônicos
CoverageNodeType

Valores permitidos:

SEGMENT
PRODUCT
SUBPRODUCT
MODALITY

Nenhum outro valor é considerado canônico.

CommercialCoverageStatus

Valores permitidos:

ACTIVE
SUSPENDED
INACTIVE
CommercialStructureSegmentView

Campos mínimos:

id
code
name
status
displayOrder
CommercialStructureProductView

Campos mínimos:

id
code
name
status
displayOrder
CommercialStructureSubproductView

Campos mínimos:

id
productId
code
name
status
displayOrder
CommercialStructureModalityView

Campos mínimos:

id
subproductId
code
name
status
displayOrder
CommercialCoverageViewModel

Representa a visão operacional da Commercial Structure.

Campos mínimos:

segmentId
productId
subproductId
modalityId
status
startDate
endDate
reason
notes

# 6. Regras Canônicas
Regra 1

Commercial Structure não é catálogo.

Regra 2

Commercial Structure não é owner de Product.

Regra 3

Commercial Structure não é owner de Subproduct.

Regra 4

Commercial Structure não é owner de Modality.

Regra 5

Coverage é camada operacional.

Coverage não é taxonomia.

# 7. Elementos Proibidos

Não pertencem à Commercial Structure canônica:

fornecedor_originador
tabela_plano_campanha
condicao_comercial

Esses elementos pertencem a outros domínios.

# 8. Provider

Provider não pertence à árvore da Commercial Structure.

Provider pertence ao domínio:

Provider Engine

# 9. Commercial Tables

Commercial Table não pertence à árvore da Commercial Structure.

Commercial Table pertence ao domínio:

Commercial Tables

# 10. Commercial Conditions

Commercial Condition não pertence à árvore da Commercial Structure.

Commercial Condition pertence ao domínio:

Commercial Tables

# 11. Regras de Migração

Classificações:

creditPfCatalog

Status:

LEGACY

Uso permitido:

histórico
migração controlada

Uso proibido:

source of truth
catalogRepository

Status:

LEGACY TRANSITIONAL

Uso permitido:

adaptação temporária

Uso proibido:

ownership
EstruturaComercial

Status:

TRANSITIONAL MODEL

Destino:

substituição gradual pelos contratos definidos neste documento.

# 12. Regras de Implementação Futuras

Toda implementação futura deve:

consumir Master Catalog
respeitar Coverage como camada operacional
separar Provider
separar Commercial Tables
separar Commercial Conditions

Nenhuma implementação futura poderá reintroduzir:

Provider dentro da árvore
Commercial Table dentro da árvore
Commercial Condition dentro da árvore

# 13. Critérios de Aceite

A consolidação será considerada concluída quando:

Modality deixar de ser convertida em tabela_plano_campanha
Provider deixar de aparecer na árvore
Commercial Tables deixarem de aparecer na árvore
Commercial Conditions deixarem de aparecer na árvore
Master Catalog for a única fonte taxonômica
Coverage for representado por contratos próprios

# 14. Veredito Final

Master Catalog responde:

"O que existe?"

Commercial Structure Coverage responde:

"Posso vender?"

Commercial Tables respondem:

"Em quais condições vendo?"

Provider Engine responde:

"Quem executa?"

Intelligent Simulator responde:

"O que devo ofertar?"

ARCH-065 aprovado como contrato canônico oficial da Commercial Structure Coverage.
