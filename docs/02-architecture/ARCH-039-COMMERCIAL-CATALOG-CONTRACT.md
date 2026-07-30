# ARCH-039 - Commercial Catalog Contract

## 1. Contexto
O FINQZ PRO concluiu três definições arquiteturais que precisam agora virar contrato formal:

- `ARCH-036` definiu `Pipeline` como domínio backend separado.
- `ARCH-037` definiu `Product`, `Subproduct` e `Modality` como responsabilidade do backend.
- `ARCH-038` consolidou o blueprint do Catálogo Comercial Backend como leitura `read only`, `tenant scoped`, `versionado` e `backend first`.

A auditoria H05A confirmou que o estado atual ainda é híbrido:

- `creditPfCatalog` continua sendo a fonte funcional de fato para seleção comercial.
- `catalogRepository` ainda é uma camada adaptadora com reaproveitamento de catálogo local e settings transitórios.
- `commercialRepository` ainda sustenta fallback local e compatibilidade operacional.
- `Oportunidades`, `EstruturaComercial`, `Simulador` e `TabelasComerciais` dependem direta ou indiretamente dessa estrutura híbrida.

Este documento consolida o contrato oficial do Commercial Master Catalog para encerrar a ambiguidade entre legado e destino arquitetural.

## 2. Problema Atual
O cenário atual possui múltiplas fontes concorrentes para os mesmos conceitos:

- `creditPfCatalog` modela Product, Subproduct e Modality no frontend.
- `catalogRepository` mistura catálogo local, helpers de leitura e pipeline settings em `localStorage`.
- `commercialRepository` mantém providers, tables e conditions locais para operação transitória.
- há duplicidade semântica entre catálogo comercial e domínio de pipeline.
- o frontend ainda resolve relacionamentos críticos sem contrato backend oficial.

Os efeitos práticos são:

- duplicidade de dados;
- acoplamento indevido com pipeline;
- ausência de single source of truth;
- impossibilidade de remover o catálogo local sem regressão;
- dificuldade para versionar e controlar drift entre consumidores.

## 3. Objetivos
O contrato oficial deve cumprir os seguintes objetivos:

- `Backend First`;
- `Tenant Scoped`;
- `Read Only`;
- `Versionado`;
- `Single Source of Truth`.

O catálogo mestre deve ser consumido pelo frontend, não possuído por ele.

## 4. Product Contract
### Classificação
| Campo | Classificação |
|---|---|
| `id` | REQUIRED |
| `code` | REQUIRED |
| `name` | REQUIRED |
| `active` | REQUIRED |
| `subproducts` | REQUIRED |
| `version` | REMOVE |
| `groupCode` | REMOVE |
| `groupName` | REMOVE |
| `providers` | REMOVE |
| `pipelineId` | REMOVE |
| `pipelineCode` | REMOVE |
| `pipelineName` | REMOVE |
| `automationEvents` | REMOVE |

### Contrato final
```ts
Product {
  id: string;
  code: string;
  name: string;
  active: boolean;
  subproducts: Subproduct[];
}
```

### Leitura arquitetural
- `id`, `code` e `name` identificam e exibem o produto.
- `active` controla disponibilidade de leitura e seleção.
- `subproducts` é parte estrutural obrigatória do contrato.

### Conclusão
`Product` deve ser pequeno, estável e focado em identidade comercial. Campos de pipeline, automação e agrupamento legado não pertencem ao contrato mestre.

## 5. Subproduct Contract
### Classificação
| Campo | Classificação |
|---|---|
| `id` | REQUIRED |
| `code` | REQUIRED |
| `name` | REQUIRED |
| `active` | REQUIRED |
| `modalities` | REQUIRED |
| `rules` | REMOVE |

### Contrato final
```ts
Subproduct {
  id: string;
  code: string;
  name: string;
  active: boolean;
  modalities: Modality[];
}
```

### Leitura arquitetural
- `id`, `code` e `name` compõem a identidade do subproduto.
- `active` preserva controle de visibilidade.
- `modalities` representa a navegação permitida dentro do product.

### Conclusão
`Subproduct` é a camada intermediária da hierarquia oficial. O contrato público não deve expor regras operacionais embutidas.

## 6. Modality Contract
### Classificação
| Campo | Classificação |
|---|---|
| `code` | REQUIRED |
| `name` | REQUIRED |
| `active` | OPTIONAL |
| `description` | OPTIONAL |
| `id` técnico | REMOVE |
| `label` derivado | REMOVE |

### Contrato final
```ts
Modality {
  code: string;
  name: string;
  active?: boolean;
  description?: string;
}
```

### Leitura arquitetural
- `code` é o identificador funcional da modalidade.
- `name` é o rótulo canônico de apresentação.
- `active` e `description` são enriquecimentos opcionais.

### Conclusão
`Modality` deve ser canônica e simples. O frontend não deve depender de label hard-coded nem de arrays soltos de strings.

## 7. Envelope Contract
O catálogo mestre não deve ser exposto apenas como lista solta. Ele precisa de envelope para suporte a cache, versionamento e tenant scope.

### Envelope conceitual
```ts
CommercialCatalogEnvelope {
  tenantId?: string;
  version: number;
  updatedAt: string;
  etag?: string;
  products: Product[];
}
```

### Decisão
- `version` é obrigatória para controle de compatibilidade.
- `updatedAt` é obrigatória para cache e auditoria.
- `products` é a carga principal do envelope.
- `tenantId` deve ser resolvido no backend como escopo obrigatório.
- `etag` é desejável para revalidação condicional e pode coexistir com `version`.

### Conclusão
O envelope deve suportar `tenant scoped` e `versionado` sem carregar o contrato público com responsabilidade operacional extra.

## 8. Product ≠ Pipeline
Os campos abaixo são transitórios e não fazem parte do catálogo mestre:

- `pipelineId`
- `pipelineCode`
- `pipelineName`

### Razões
- `Pipeline` é domínio separado, com ownership backend próprio.
- o catálogo mestre descreve oferta comercial, não a estrutura do funil.
- pipeline é contexto operacional e de execução, não identidade do produto.
- manter esses campos no contrato mestre reintroduz acoplamento e ambiguidade.

### Decisão
Esses campos devem permanecer apenas em compatibilidades transitórias, adapters ou read models auxiliares, nunca no contrato canônico do catálogo.

## 9. Rules Analysis
O campo `Subproduct.rules` foi auditado e classificado como `REMOVE` do contrato público.

### Itens auditados
- `requiresMargin`
- `requiresCollateral`
- `requiresBureau`
- `requiresGuarantor`
- `requiresEligibilityCheck`
- `isRevolving`
- `isDigital`
- `isInsurance`
- `isConsortium`
- `collateralType`

### Decisão
Essas regras não devem compor o read model público do Master Catalog.

### Justificativa
- não há necessidade runtime comprovada no contrato público atual;
- regras operacionais pertencem a validações de domínio ou a um serviço backend próprio;
- misturar regras com catálogo visual amplia acoplamento e dificulta evolução;
- eventual elegibilidade futura deve nascer em domínio próprio backend.

## 10. Read Models
Os read models conceituais são:

- `GET /api/v1/commercial/catalog`
- `GET /api/v1/commercial/catalog/products`
- `GET /api/v1/commercial/catalog/products/:id`
- `GET /api/v1/commercial/catalog/products/:id/subproducts`
- `GET /api/v1/commercial/catalog/products/:id/subproducts/:id/modalities`

### Avaliação
- suficientes para navegação hierárquica read only;
- não excessivos para o contrato mínimo;
- a versão do catálogo deve vir no envelope raiz;
- `etag` pode ser suportado no envelope ou em header;
- não é necessário introduzir CRUD para o contrato mestre.

### Conclusão
O conjunto cobre o uso funcional esperado e preserva a simplicidade do contrato.

## 11. Compatibility Matrix
| Artefato | Classificação | Observação |
|---|---|---|
| `creditPfCatalog` | Parcialmente Compatível | contém a hierarquia, mas também traz legado e acoplamento com pipeline |
| `catalogRepository` | Parcialmente Compatível | funciona como adapter e carrega settings transitórios |
| `commercialRepository` | Parcialmente Compatível | reaproveita a hierarquia, mas depende de fallback local e storage operacional |

### Leitura arquitetural
Nenhum dos três artefatos é o contrato final. Todos são compatíveis apenas como transição controlada.

## 12. Migration Guidance
A ordem oficial de migração recomendada é:

1. `EstruturaComercial`
2. `TabelasComerciais`
3. `Simulador`
4. `Oportunidades`

### Justificativa
#### 1. EstruturaComercial
É o consumidor mais direto do catálogo e o melhor candidato para primeiro corte de dependência local.

#### 2. TabelasComerciais
Já opera próximo ao backend e pode migrar em seguida, reduzindo fallback local.

#### 3. Simulador
Depende da hierarquia comercial e de dados operacionais; deve migrar após o contrato estar estabilizado.

#### 4. Oportunidades
É o ponto mais acoplado a pipeline, seleção, etapas e payload operacional. Deve ser o último a migrar.

## 13. Decisão Arquitetural Final
O backend é o owner oficial de:

- `Product`
- `Subproduct`
- `Modality`

O frontend é consumidor.

### Implicações
- o catálogo mestre não deve residir como verdade primária no frontend;
- adapters transitórios podem existir apenas durante a migração;
- qualquer nova implementação de catálogo deve nascer backend-first;
- o frontend deve ser tratado como read client.

## 14. Non-Goals
Este blueprint não:

- cria Prisma;
- define CRUD;
- cria migration;
- altera Pipeline;
- altera Commission;
- altera Settlement;
- altera RBAC;
- altera Provider Engine.

### Conclusão
Qualquer implementação decorrente deste contrato deve passar por auditoria específica e aprovação arquitetural posterior.
