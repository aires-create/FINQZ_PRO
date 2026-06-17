# ARCH-060 — Commercial Tables Architecture

Status: APPROVED
Fase: H-14B
Data: Junho/2026
Owner: FINQZ PRO Enterprise Architecture

---

# 1. Objetivo

Definir a arquitetura oficial do domínio Commercial Tables, incluindo:

* Ownership
* Lifecycle
* Versionamento
* Vigência
* Relação com Coverage
* Relação com Provider Engine
* Relação com Intelligent Simulator
* Relação com Commission Engine

Este documento estabelece as fronteiras definitivas do domínio Commercial Tables antes de qualquer evolução de runtime.

---

# 2. Propósito do Domínio

Commercial Tables respondem exclusivamente à pergunta:

> "Em quais condições vendo?"

Commercial Tables representam bundles operacionais de condições comerciais disponíveis para execução por um provider específico.

Commercial Tables NÃO respondem:

* O que existe?
* Posso vender?
* Quem executa?
* Quanto libera?
* Como ocorre o rateio?
* Como ocorre o pagamento?

Cada uma dessas responsabilidades pertence a outro domínio.

---

# 3. Definição Oficial

Commercial Table é definida como:

> Provider-Backed Commercial Condition Bundle, Tenant-Scoped, Lifecycle-Managed, Auditable and Versionable.

Uma Commercial Table representa um agrupador operacional de condições comerciais associadas a um provider, produto, subproduto e modalidade.

---

# 4. Posicionamento Arquitetural

## Master Catalog

Responsável por:

> O que existe?

Ownership:

* Product
* Subproduct
* Modality
* Segment

Commercial Tables apenas referenciam o catálogo.

---

## Commercial Structure Coverage

Responsável por:

> Posso vender?

Ownership:

* Cobertura comercial
* Elegibilidade operacional
* Disponibilidade por segmento

Commercial Tables não definem elegibilidade.

---

## Provider Engine

Responsável por:

> Quem executa?

Ownership:

* Providers
* Traduções operacionais
* Integrações externas

Commercial Tables não são donas do Provider.

---

## Intelligent Simulator

Responsável por:

> Quanto libera?
> Quanto ganho?
> Qual melhor oferta?

Commercial Tables fornecem insumos.

Não executam simulação.

---

## Commission Engine

Responsável por:

> Como ocorre o rateio?

Commercial Tables não calculam distribuição hierárquica.

---

## Settlement Engine

Responsável por:

> Como ocorre o pagamento?

Commercial Tables não executam liquidação.

---

# 5. Aggregate Oficial

Estrutura oficial:

CommercialTable
└── CommercialCondition

---

# 6. Commercial Table

Commercial Table representa o Header Operacional.

Ownership:

* code
* name
* provider snapshot
* product reference
* subproduct reference
* modality reference
* lifecycle
* vigência
* agrupamento de condições

A tabela existe para organizar e governar condições comerciais.

---

# 7. Commercial Condition

Commercial Condition representa a linha executável de precificação.

Ownership:

* prazo
* taxa
* CET
* coeficiente
* comissão base
* limites financeiros
* limites operacionais
* regras específicas de campanha

Uma tabela pode possuir múltiplas condições.

---

# 8. Ownership Oficial

## Commercial Table

Possui:

* code
* name
* provider snapshot
* startDate
* endDate
* lifecycle
* version
* campaign context

---

## Commercial Condition

Possui:

* term
* monthlyRate
* cetRate
* coefficient
* commission
* minAmount
* maxAmount
* minAge
* maxAge
* cashback
* bonus

---

## Não pertencem ao domínio

Não pertencem às Commercial Tables:

* Product Ownership
* Subproduct Ownership
* Modality Ownership
* Segment Ownership
* Eligibility
* Coverage
* Provider Ownership
* Opportunity Lifecycle
* Final Simulation Result
* Commission Split
* Commission Payment

---

# 9. Lifecycle Oficial

Lifecycle de negócio:

DRAFT

ACTIVE

SUSPENDED

EXPIRED

ARCHIVED

---

Lifecycle técnico:

DELETED

Implementado exclusivamente via soft delete.

---

# 10. Semântica dos Estados

## DRAFT

Tabela em construção.

Não pode ser utilizada.

---

## ACTIVE

Tabela operacional válida.

Pode ser utilizada pelo simulador.

Pode ser utilizada em oportunidades.

---

## SUSPENDED

Tabela temporariamente bloqueada.

Histórico preservado.

Não pode ser utilizada.

Pode retornar para ACTIVE.

---

## EXPIRED

Vigência encerrada.

Não pode ser utilizada.

Permanece disponível para auditoria.

---

## ARCHIVED

Tabela descontinuada.

Mantida apenas para histórico.

---

## DELETED

Estado técnico.

Nunca representa estado comercial.

---

# 11. Vigência

Toda Commercial Table deve possuir:

startDate

endDate

A vigência define disponibilidade operacional.

ACTIVE sem vigência válida não pode ser utilizada.

---

# 12. Versionamento

Commercial Tables são versionáveis.

Objetivos:

* Preservar histórico
* Reproduzir simulações antigas
* Evitar reescrita retroativa

Estrutura conceitual futura:

versionNumber

validFrom

validTo

---

# 13. Regras de Versionamento

Alterações estruturais devem gerar nova versão:

* taxa
* coeficiente
* comissão
* limites
* campanhas

Histórico anterior permanece imutável.

Nenhuma alteração futura pode modificar o significado histórico de uma simulação já realizada.

---

# 14. Relação com Coverage

Coverage é pré-requisito operacional.

Fluxo:

Coverage
↓
Commercial Table
↓
Simulator

Regras:

* tabela ativa sem cobertura válida não pode ser utilizada
* cobertura suspensa bloqueia utilização operacional
* cobertura não pertence à Commercial Table

---

# 15. Relação com Provider Engine

Provider é obrigatório.

Commercial Table é provider-backed.

Provider fornece:

* execução operacional
* tradução externa
* identidade operacional

Provider não define:

* catálogo
* elegibilidade
* taxonomia FINQZ

---

# 16. Relação com Intelligent Simulator

Simulator consome:

* Coverage
* Commercial Tables
* Provider Context

Commercial Tables fornecem:

* taxa
* prazo
* coeficiente
* comissão
* limites

Simulator calcula:

* valor liberado
* ranking
* oferta ideal
* probabilidade de aprovação

---

# 17. Relação com Commission Engine

Commercial Tables podem armazenar:

* comissão base
* comissão bruta
* parâmetros comerciais

Não armazenam:

* split hierárquico
* rateio final
* pagamento

Essas responsabilidades pertencem ao Commission Engine.

---

# 18. Relação com Settlement Engine

Settlement Engine é responsável por:

* pagamento
* liquidação
* repasse financeiro

Commercial Tables não executam pagamentos.

---

# 19. Anti-Patterns Proibidos

É proibido utilizar Commercial Tables como:

* Catálogo Mestre
* Coverage Matrix
* Eligibility Engine
* Provider Registry
* Simulator
* Commission Engine
* Settlement Engine

Também é proibido:

* regras críticas em frontend
* localStorage como fonte de verdade
* provider como taxonomia canônica
* reescrita retroativa de histórico

---

# 20. Princípios Obrigatórios

Commercial Tables devem seguir:

* Backend First
* Tenant Scoped
* RBAC Driven
* Auditável
* Versionável
* Lifecycle Managed
* Single Source of Truth
* Contracts Before Runtime
* Architecture Before Implementation
* No Legacy

---

# 21. Veredito Arquitetural

Commercial Tables são oficialmente definidas como:

> Provider-Backed Commercial Condition Bundles responsáveis por responder "Em quais condições vendo?", consumindo catálogo e cobertura, fornecendo insumos para simulação e comissão, sem assumir ownership de catálogo, elegibilidade, provider, simulador ou pagamento.

ARCH-060 aprovado como arquitetura oficial do domínio Commercial Tables.
