# ARCH-063 — Commercial Structure Frontend Consolidation Plan

Status: PROPOSED
Fase: H-14F
Data: Junho/2026
Owner: FINQZ PRO Enterprise Architecture

---

# 1. Objetivo

Definir o plano oficial de consolidação do frontend da Estrutura Comercial, corrigindo os blockers identificados no ARCH-062 antes de qualquer implementação.

Este documento define o estado alvo, a estratégia de migração e os limites de segurança para futura consolidação.

---

# 2. Contexto

A auditoria ARCH-062 identificou que o frontend da Estrutura Comercial ainda está híbrido.

Convivem:

* creditPfCatalog
* catalogRepository
* useAppStore
* tipos duplicados
* mapper transitório
* níveis legados
* Master Catalog real via API

Portanto, a consolidação deve ser planejada antes de qualquer alteração em runtime.

---

# 3. Estado Atual

A tela EstruturaComercial.tsx ainda mistura:

* catálogo
* cobertura
* fornecedor
* tabela comercial
* condição comercial
* comissão
* integração
* automação

Essa mistura conflita com a arquitetura oficial do FINQZ PRO Enterprise.

---

# 4. Estado Alvo

A Estrutura Comercial deve representar exclusivamente Commercial Structure Coverage.

Ela responde:

> Posso vender?

A tela deve ser baseada em:

* Segment
* Product
* Subproduct
* Modality
* Coverage Status
* Vigência
* Motivo
* Observações operacionais

---

# 5. Separação Oficial de Domínios

## Master Catalog

Responsável por:

* Segment
* Product
* Subproduct
* Modality

Responde:

> O que existe?

---

## Commercial Structure Coverage

Responsável por:

* cobertura operacional
* elegibilidade comercial
* status de disponibilidade
* vigência
* motivo de suspensão ou bloqueio

Responde:

> Posso vender?

---

## Provider Engine

Responsável por:

* provider
* banco
* promotora
* originador
* executor operacional
* tradução externa

Responde:

> Quem executa?

---

## Commercial Tables

Responsável por:

* tabela comercial
* plano
* campanha
* condição comercial
* taxa
* coeficiente
* comissão base

Responde:

> Em quais condições vendo?

---

# 6. Decisão Arquitetural

A tela Estrutura Comercial não deve mais representar:

* fornecedor_originador
* tabela_plano_campanha
* condicao_comercial

Esses níveis devem sair do modelo canônico da tela.

Eles poderão existir apenas como compatibilidade transitória durante migração controlada.

---

# 7. Modelo Canônico da Tela

Modelo alvo:

Segment
↓
Product
↓
Subproduct
↓
Modality
↓
Coverage Status

Status possíveis:

* ACTIVE
* SUSPENDED
* INACTIVE

Campos operacionais:

* tenantId
* segmentId
* productId
* subproductId
* modalityId
* status
* startDate
* endDate
* reason
* notes

---

# 8. Fonte de Verdade

Fonte oficial:

Backend / API oficial

Enquanto o runtime de Coverage não existir, a tela pode consumir Master Catalog read-only como base visual.

Porém o frontend não deve inferir regras comerciais definitivas.

---

# 9. Store

O useAppStore não deve ser fonte canônica da Estrutura Comercial.

Destino futuro:

* remover ownership do domínio
* manter apenas estado visual temporário, se necessário
* não persistir regra comercial na store
* não gerar cobertura operacional a partir de seed local

---

# 10. creditPfCatalog

Classificação:

QUARANTINE CANDIDATE

Motivo:

creditPfCatalog mistura:

* catálogo
* provider
* pipeline
* automação
* dados operacionais

Não pode ser fonte canônica.

Uso futuro permitido:

* referência histórica
* apoio temporário de migração
* comparação controlada

Uso proibido:

* source of truth
* seed automático de Estrutura Comercial
* base de Coverage
* base de Simulator

---

# 11. catalogRepository

Classificação:

LEGACY TRANSITIONAL ADAPTER

Destino futuro:

* remover da Estrutura Comercial
* impedir uso como fonte de catálogo oficial
* substituir por masterCatalogApi e futuro coverageApi

---

# 12. Mapper

O mapper atual deve ser redesenhado.

Regra obrigatória:

Modality não pode ser convertido em tabela_plano_campanha.

Mapper alvo:

MasterCatalogTree
↓
CommercialStructureCoverageViewModel

Conversão correta:

Segment → Segment node
Product → Product node
Subproduct → Subproduct node
Modality → Modality node

Coverage Status deve ser camada própria.

---

# 13. Tipos

A duplicidade em src/types/index.ts deve ser resolvida em fase futura controlada.

Plano alvo:

* separar tipos canônicos por domínio
* evitar tipos globais conflitantes
* criar contratos específicos para Commercial Structure
* manter compatibilidade temporária onde necessário

Tipos sugeridos futuramente:

* CommercialStructureSegmentView
* CommercialStructureProductView
* CommercialStructureSubproductView
* CommercialStructureModalityView
* CommercialCoverageStatus
* CommercialCoverageViewModel

---

# 14. UX Alvo

A tela deve ser segment-first.

Visões sugeridas:

## Visão por Segmento

Segmento
↓
Produtos disponíveis
↓
Subprodutos disponíveis
↓
Modalidades disponíveis
↓
Status de cobertura

## Visão por Produto

Produto
↓
Segmentos elegíveis
↓
Subprodutos
↓
Modalidades
↓
Status

A visão principal deve ser Segment-first.

---

# 15. Ações Permitidas na UX

Ações futuras permitidas:

* visualizar cobertura
* filtrar por segmento
* filtrar por produto
* filtrar por status
* visualizar motivo de suspensão
* sincronizar base visual com Master Catalog

Ações não permitidas nesta tela:

* criar provider
* criar tabela comercial
* editar taxa
* editar coeficiente
* editar comissão
* editar condição comercial
* executar simulação

---

# 16. Estratégia de Migração

A migração deve ocorrer em ondas.

## Wave 1 — Contratos e Tipos

Definir view models canônicos sem remover os antigos.

## Wave 2 — Mapper

Criar mapper correto Master Catalog → Coverage View Model.

## Wave 3 — Tela Read-Only

Adaptar Estrutura Comercial para consumir o view model correto.

## Wave 4 — Remoção Controlada de Legado

Remover dependências de creditPfCatalog e catalogRepository somente após validação.

## Wave 5 — Coverage Runtime

Criar API/runtime específico de Coverage, se aprovado.

---

# 17. Restrições

É proibido:

* remover tipos duplicados sem auditoria de impacto
* alterar store sem plano de rollback
* substituir a tela inteira em uma única alteração
* criar coverage fake no frontend
* usar localStorage como verdade
* promover Modality para Commercial Table
* misturar Provider dentro da Estrutura Comercial
* avançar para Simulator antes da consolidação

---

# 18. Critérios de Aceite Futuros

A consolidação será considerada aprovada quando:

* Modality não virar tabela
* Provider não aparecer como nó de Estrutura Comercial
* Commercial Table não aparecer como nó de Estrutura Comercial
* Condition não aparecer como nó de Estrutura Comercial
* creditPfCatalog não for fonte da tela
* catalogRepository não for fonte da tela
* store não for fonte canônica
* Master Catalog for a única fonte de taxonomia
* Coverage for representado como camada própria

---

# 19. Veredito

A consolidação frontend da Estrutura Comercial é viável, mas deve ocorrer em ondas controladas.

Status:

GO COM RESTRIÇÕES

Implementação direta:

NO-GO

Próxima fase recomendada:

H-14G — Commercial Structure Frontend Contracts Readiness

ARCH-063 aprovado como plano oficial de consolidação frontend da Estrutura Comercial.
