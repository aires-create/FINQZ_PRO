# ARCH-056 — Pipeline Domain Architecture

Status: APPROVED WITH RESTRICTIONS

## 1. Objetivo

Definir o domínio Pipeline como domínio operacional separado do Master Catalog.

## 2. Decisão Principal

Pipeline não pertence ao Master Catalog.

Master Catalog é owner de Product, Subproduct, Modality e Segment.

Pipeline Domain é owner de Pipeline, Stage, ordenação de etapas, configurações operacionais e fluxo Kanban.

## 3. Contrato Opportunity

Opportunity deve referenciar explicitamente:

- productId
- subproductId
- modalityId
- pipelineId
- stageId

Product, Subproduct e Modality pertencem ao Master Catalog.

Pipeline e Stage pertencem ao Pipeline Domain.

## 4. Regra Proibida

É proibido derivar pipelineId implicitamente a partir de productId, subproductId ou modalityId.

Não pode existir Product -> Pipeline como verdade de domínio.

## 5. Regra Permitida

Pipeline pode ser selecionado explicitamente pelo usuário ou resolvido por regra operacional explícita do backend.

Essa regra deverá ser auditável, tenant-scoped e documentada.

## 6. Frontend

Frontend não é owner de Pipeline.

Frontend não pode manter heurísticas locais Product -> Pipeline.

Frontend apenas consome Pipeline e Stage a partir de contrato oficial.

## 7. Legado Identificado

Os seguintes artefatos são transicionais e não canônicos:

- LEGACY_PIPELINE_IDS_BY_CATALOG
- mapBackendPipelineNameToSemanticId
- getPipelineByProductId
- pipeline_id com fallback em selectedProductId
- pipeline settings em localStorage
- pipelineId, pipelineCode e pipelineName dentro de creditPfCatalog

## 8. Veredito

NO-GO para considerar Pipeline desacoplado enquanto qualquer fluxo runtime derivar pipelineId de productId.

GO para planejar uma migração em ondas após validação deste documento.

Nenhuma implementação é autorizada por este documento.
