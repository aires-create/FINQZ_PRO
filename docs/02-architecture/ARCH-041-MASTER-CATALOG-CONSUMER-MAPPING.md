# ARCH-041 - Master Catalog Consumer Mapping

## 1. Contexto
O contrato oficial do Master Catalog foi consolidado em `ARCH-039` e o desenho backend em `ARCH-040`.

Mesmo com essa definição, o frontend e as camadas transitórias ainda consomem Product, Subproduct e Modality por caminhos diferentes:

- `creditPfCatalog.ts` ainda é a fonte funcional direta em partes da UI;
- `catalogRepository.ts` funciona como adapter e reexport de helpers;
- `commercialRepository.ts` ainda alimenta seletores e fallbacks locais;
- `EstruturaComercial.tsx`, `TabelasComerciais.tsx`, `Simulador.tsx` e `Oportunidades.tsx` dependem do catálogo em runtime;
- `store/index.ts` ainda carrega estrutura comercial derivada do catálogo.

Este documento mapeia quem consome o quê e quais campos ainda são obrigatórios, transitórios ou legados.

## 2. Escopo
Arquivos analisados:

- `src/data/creditPfCatalog.ts`
- `src/data/catalogRepository.ts`
- `src/data/commercialRepository.ts`
- `src/pages/EstruturaComercial.tsx`
- `src/pages/TabelasComerciais.tsx`
- `src/pages/Simulador.tsx`
- `src/pages/Oportunidades.tsx`
- `src/store/index.ts`

### Critérios
- `Obrigatório`: sem o campo o consumidor quebra ou perde a função principal.
- `Legado`: existe hoje, mas não pertence ao contrato canônico final.
- `Pode migrar?`: indica se o consumo pode sair do legado/transição sem alterar o contrato canônico.

## 3. Consumidores Mapeados
### Consumer Matrix
| Consumer | Campo | Obrigatório? | Legado? | Pode migrar? | Criticidade |
|---|---|---:|---:|---:|---|
| `creditPfCatalog.ts` | `Product.id`, `Product.code`, `Product.name`, `Product.active`, `Product.subproducts` | Sim | Não | Sim | HIGH |
| `catalogRepository.ts` | `Product.id`, `Product.code`, `Product.name`, `Product.active`, `Product.subproducts` | Sim | Não | Sim | HIGH |
| `commercialRepository.ts` | `Product.id`, `Product.code`, `Product.name` | Sim | Não | Sim | HIGH |
| `EstruturaComercial.tsx` | `Product.id`, `Product.code`, `Product.name`, `Product.active`, `Product.subproducts` | Sim | Não | Sim | CRITICAL |
| `TabelasComerciais.tsx` | `Product.id`, `Product.code`, `Product.name` | Sim | Não | Sim | HIGH |
| `Simulador.tsx` | `Product.id`, `Product.code`, `Product.name` | Sim | Não | Sim | HIGH |
| `Oportunidades.tsx` | `Product.id`, `Product.code`, `Product.name`, `Product.active`, `Product.subproducts`, `Product.pipelineId`, `Product.pipelineCode`, `Product.pipelineName` | Parcial | Sim | Parcial | CRITICAL |
| `store/index.ts` | `Product.id`, `Product.code`, `Product.name`, `Product.active`, `Product.subproducts` | Sim | Não | Sim | MEDIUM |

| Consumer | Campo | Obrigatório? | Legado? | Pode migrar? | Criticidade |
|---|---|---:|---:|---:|---|
| `creditPfCatalog.ts` | `Subproduct.id`, `Subproduct.code`, `Subproduct.name`, `Subproduct.active`, `Subproduct.modalities`, `Subproduct.rules` | Sim para metade; rules não | `rules` sim | Sim | HIGH |
| `catalogRepository.ts` | `Subproduct.id`, `Subproduct.code`, `Subproduct.name`, `Subproduct.active`, `Subproduct.modalities` | Sim | Não | Sim | HIGH |
| `commercialRepository.ts` | `Subproduct.id`, `Subproduct.code`, `Subproduct.name`, `Subproduct.modalities` | Sim | Não | Sim | HIGH |
| `EstruturaComercial.tsx` | `Subproduct.id`, `Subproduct.code`, `Subproduct.name`, `Subproduct.active`, `Subproduct.modalities` | Sim | Não | Sim | CRITICAL |
| `TabelasComerciais.tsx` | `Subproduct.id`, `Subproduct.code`, `Subproduct.name`, `Subproduct.modalities` | Sim | Não | Sim | HIGH |
| `Simulador.tsx` | `Subproduct.id`, `Subproduct.code`, `Subproduct.name`, `Subproduct.modalities` | Sim | Não | Sim | HIGH |
| `Oportunidades.tsx` | `Subproduct.id`, `Subproduct.code`, `Subproduct.name`, `Subproduct.active`, `Subproduct.modalities`, `Subproduct.rules` | Parcial | `rules` sim | Parcial | CRITICAL |
| `store/index.ts` | `Subproduct.id`, `Subproduct.code`, `Subproduct.name`, `Subproduct.active`, `Subproduct.modalities` | Sim | Não | Sim | MEDIUM |

| Consumer | Campo | Obrigatório? | Legado? | Pode migrar? | Criticidade |
|---|---|---:|---:|---:|---|
| `creditPfCatalog.ts` | `Modality[]` como `string[]` | Sim | Não | Sim | HIGH |
| `catalogRepository.ts` | `Modality.code`, `Modality.label` via helper | Sim | `label` como derivado | Sim | HIGH |
| `commercialRepository.ts` | `Modality.value`, `Modality.label` | Sim | `label` derivado | Sim | HIGH |
| `EstruturaComercial.tsx` | `Modality` como código string e label derivada | Sim | Sim, label hard-coded | Sim | CRITICAL |
| `TabelasComerciais.tsx` | `Modality.value`, `Modality.label` | Sim | Sim, label derivado | Sim | HIGH |
| `Simulador.tsx` | `Modality.value`, `Modality.label` | Sim | Sim, label derivado | Sim | HIGH |
| `Oportunidades.tsx` | `Modality` como código string e label derivada | Sim | Sim, label derivado | Parcial | CRITICAL |
| `store/index.ts` | `Modality` como código string e label derivada | Sim | Sim | Sim | MEDIUM |

## 4. Product Consumption Matrix
### Product
| Consumer | Campos utilizados | Dependência |
|---|---|---|
| `creditPfCatalog.ts` | `id`, `code`, `name`, `active`, `subproducts`, `pipelineId`, `pipelineCode`, `pipelineName`, `version`, `groupCode`, `groupName`, `providers`, `automationEvents` | estrutural e legado |
| `catalogRepository.ts` | `id`, `code`, `name`, `active`, `subproducts`, `pipelineId`, `pipelineCode`, `pipelineName` | estrutural + transitório |
| `commercialRepository.ts` | `id`, `code`, `name`, `active`, `subproducts` | estrutural |
| `EstruturaComercial.tsx` | `id`, `code`, `name`, `active`, `subproducts` | runtime principal |
| `TabelasComerciais.tsx` | `id`, `code`, `name` | runtime principal |
| `Simulador.tsx` | `id`, `code`, `name` | runtime principal |
| `Oportunidades.tsx` | `id`, `code`, `name`, `active`, `subproducts`, `pipelineId`, `pipelineCode`, `pipelineName` | runtime crítica |
| `store/index.ts` | `id`, `code`, `name`, `active`, `subproducts` | estado derivado |

### Campos mínimos realmente necessários hoje
- `id`
- `code`
- `name`
- `active`
- `subproducts`

### Campos ainda transitórios
- `pipelineId`
- `pipelineCode`
- `pipelineName`

### Campos legados ou não utilizados
- `groupCode`
- `groupName`
- `version` no item
- `providers`
- `automationEvents`

## 5. Subproduct Consumption Matrix
### Subproduct
| Consumer | Campos utilizados | Dependência |
|---|---|---|
| `creditPfCatalog.ts` | `id`, `code`, `name`, `active`, `modalities`, `rules` | estrutural e legado |
| `catalogRepository.ts` | `id`, `code`, `name`, `active`, `modalities` | estrutural |
| `commercialRepository.ts` | `id`, `code`, `name`, `modalities` | estrutural |
| `EstruturaComercial.tsx` | `id`, `code`, `name`, `active`, `modalities` | runtime principal |
| `TabelasComerciais.tsx` | `id`, `code`, `name`, `modalities` | runtime principal |
| `Simulador.tsx` | `id`, `code`, `name`, `modalities` | runtime principal |
| `Oportunidades.tsx` | `id`, `code`, `name`, `active`, `modalities`, `rules` | runtime crítica |
| `store/index.ts` | `id`, `code`, `name`, `active`, `modalities` | estado derivado |

### Campos mínimos realmente necessários hoje
- `id`
- `code`
- `name`
- `active`
- `modalities`

### Campos candidatos à remoção futura
- `rules`

### Dependências legadas
- qualquer uso de `rules` como fonte de decisão de negócio pública

## 6. Modality Consumption Matrix
### Modality
| Consumer | Campos utilizados | Dependência |
|---|---|---|
| `creditPfCatalog.ts` | códigos `NOVO`, `REFINANCIAMENTO`, `PORTABILIDADE`, `TRANSFERENCIA_COTA` | base de contrato |
| `catalogRepository.ts` | `code` e label derivada | helper transitório |
| `commercialRepository.ts` | `value`, `label` | helper transitório |
| `EstruturaComercial.tsx` | código string e label amigável | runtime principal |
| `TabelasComerciais.tsx` | `value`, `label` | runtime principal |
| `Simulador.tsx` | `value`, `label` | runtime principal |
| `Oportunidades.tsx` | código string e label amigável | runtime crítica |
| `store/index.ts` | código string e label amigável | estado derivado |

### Campos mínimos realmente necessários hoje
- `code`
- `name` no contrato futuro

### Campos candidatos à remoção futura
- label hard-coded no frontend
- arrays de string sem entidade formal

### Dependências legadas
- qualquer tradução local fixa de label

## 7. Dependency Analysis
### creditPfCatalog.ts
- **consumidores diretos:** `catalogRepository.ts`, `commercialRepository.ts`, `EstruturaComercial.tsx`, `store/index.ts`
- **consumidores indiretos:** `Oportunidades.tsx`, `Simulador.tsx`, `TabelasComerciais.tsx`
- **uso atual:** estrutural, ainda crítico
- **legado:** `groupCode`, `groupName`, `version`, `providers`, `automationEvents`, `rules`

### catalogRepository.ts
- **consumidores:** `Oportunidades.tsx`, `EstruturaComercial.tsx`, `src/pages/admin/Pipelines.tsx`
- **uso atual:** adapter e pipeline settings transitório
- **legado:** mistura catálogo com settings de pipeline
- **migração:** alta prioridade, mas não deve quebrar os consumers

### commercialRepository.ts
- **consumidores:** `Simulador.tsx`, `TabelasComerciais.tsx`, `src/data/simulatorRepository.ts`
- **uso atual:** fallback operacional e compatibilidade local
- **legado:** storage local de providers/tables/conditions
- **migração:** possível, mas depende do backend operacional e do catálogo mestre

### EstruturaComercial.tsx
- **dependência:** alta
- **tipo:** consumer read-only com sync local
- **risco:** muito alto se o contrato mudar sem envelope estável

### TabelasComerciais.tsx
- **dependência:** alta
- **tipo:** consumer híbrido backend + fallback local
- **risco:** alto por depender de commercialRepository e de catálogos auxiliares

### Simulador.tsx
- **dependência:** alta
- **tipo:** consumer operacional de seleção e cálculo
- **risco:** alto, mas menor que Oportunidades

### Oportunidades.tsx
- **dependência:** crítica
- **tipo:** consumer híbrido de catálogo + pipeline + stage mapping
- **risco:** crítico, por acoplamento funcional e transitório

### store/index.ts
- **dependência:** média
- **tipo:** estado derivado e estrutural
- **risco:** médio, porque a maior parte do catálogo é gerada e não owner

## 8. Critical Consumers
### CRITICAL
- `Oportunidades.tsx`
- `EstruturaComercial.tsx`

### HIGH
- `TabelasComerciais.tsx`
- `Simulador.tsx`
- `catalogRepository.ts`
- `commercialRepository.ts`

### MEDIUM
- `store/index.ts`
- `creditPfCatalog.ts` como base transitória interna

### LOW
- nenhum consumer relevante para Product/Subproduct/Modality no escopo analisado

## 9. Migration Impact
### Campos mínimos para manter estabilidade
- `Product.id`
- `Product.code`
- `Product.name`
- `Product.active`
- `Product.subproducts`
- `Subproduct.id`
- `Subproduct.code`
- `Subproduct.name`
- `Subproduct.active`
- `Subproduct.modalities`
- `Modality.code`
- `Modality.name`

### Campos que podem sair sem quebrar o contrato canônico
- `groupCode`
- `groupName`
- `providers`
- `automationEvents`
- `rules`
- `pipelineId`
- `pipelineCode`
- `pipelineName`
- labels hard-coded de modalidade

### Ordem de impacto migratório
1. `EstruturaComercial.tsx`
2. `TabelasComerciais.tsx`
3. `Simulador.tsx`
4. `Oportunidades.tsx`

### Justificativa
- primeiro saem os consumers mais read-only;
- depois os que já dialogam com backend operacional;
- por último o consumer mais acoplado a pipeline e seleção comercial.

## 10. Gap Analysis
### Lacunas entre ARCH-039 e os consumidores atuais
1. `ARCH-039` remove `pipelineId`, `pipelineCode` e `pipelineName` do contrato canônico, mas `Oportunidades.tsx` ainda depende deles.
2. `ARCH-039` remove `rules`, mas `creditPfCatalog.ts` ainda carrega as regras e parte da modelagem atual as preserva.
3. `ARCH-039` assume `Modality` como entidade formal, enquanto os consumidores atuais ainda tratam modalidade como código string com label derivada.
4. `catalogRepository.ts` ainda mistura catálogo e settings de pipeline.
5. `commercialRepository.ts` ainda depende de `localStorage`, o que amplia a distância para o contrato mestre backend.

### Campos não utilizados
- `groupCode`
- `groupName`
- `providers`
- `automationEvents`
- `rules` no consumo público

### Candidatos à remoção futura
- `pipelineId`
- `pipelineCode`
- `pipelineName`
- labels hard-coded de modalidade
- campos de agrupamento legado

## 11. Recomendações
1. Tratar `Product`, `Subproduct` e `Modality` como contrato backend canônico.
2. Manter somente os campos mínimos requeridos pelos consumers atuais.
3. Separar a transição de pipeline do contrato mestre.
4. Eliminar dependências de `rules` do contrato público.
5. Migrar consumidores em ordem de menor acoplamento para maior acoplamento.
6. Preservar compatibilidade transitória até o backend entregar o envelope oficial.

## 12. Decisão Arquitetural
### GO
- para implementar o contrato canônico mínimo de `Product`, `Subproduct` e `Modality` no backend.

### NO-GO
- para carregar `pipelineId`, `pipelineCode` e `pipelineName` como núcleo do contrato mestre.
- para manter `rules` como parte do read model público.

### Diretriz final
O contrato mínimo deve ser guiado pelo uso real atual, mas o destino arquitetural deve seguir `ARCH-039` e `ARCH-040`.

## 13. Non-Goals
Este documento não:

- implementa backend;
- altera frontend;
- altera backend;
- cria Prisma;
- cria migration;
- cria endpoint;
- cria DTO real;
- cria service real;
- remove `creditPfCatalog` imediatamente;
- altera Pipeline;
- altera CommercialTable;
- altera CommercialCondition.
