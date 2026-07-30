# ARCH-042 - Master Catalog API Contract Design

## 1. Contexto
O FINQZ PRO consolidou, nos documentos anteriores, a fronteira arquitetural do Master Catalog:

- `ARCH-036` separou `Pipeline` como dominio backend independente.
- `ARCH-037` definiu `Product`, `Subproduct` e `Modality` como responsabilidade do backend.
- `ARCH-038` formalizou o backend blueprint do catalogo comercial.
- `ARCH-039` fechou o contrato oficial do catálogo mestre.
- `ARCH-040` desenhou o backend do Master Catalog.
- `ARCH-041` mapeou os consumidores reais do catálogo.

Este documento define o contrato oficial da API do Master Catalog sem antecipar implementacao.

## 2. Objetivos
O contrato da API deve ser:

- `Read Only`;
- `Tenant Scoped`;
- `Versionado`;
- `Cache Friendly`;
- `Backend First`.

### Intenção
A API deve servir como ponto único de leitura do catálogo mestre e reduzir divergências entre frontend e backend.

## 3. API Principles
### Single Source of Truth
O backend é a fonte oficial da verdade para Product, Subproduct e Modality.

### Backward Compatibility
O contrato deve preservar compatibilidade com consumidores existentes durante a transição.

### Forward Compatibility
O contrato deve permitir evolução sem quebrar consumidores antigos.

### Stable IDs
Os `id`s devem ser estáveis e previsíveis dentro do escopo do tenant.

### Stable Codes
Os `code`s devem permanecer estáveis para integrações e identificação funcional.

## 4. Resource Design
### Product
Recurso principal do catálogo.

### Subproduct
Recurso intermediário, sempre associado a um Product.

### Modality
Recurso final da hierarquia, sempre associado a um Subproduct.

### Envelope
Recurso de topo que carrega metadados de versão e leitura.

## 5. Response Contracts
Os payloads abaixo são conceituais.

### Catalog Envelope

~~~ts
{
  version: number;
  updatedAt: string;
  etag?: string;
  products: Product[];
}
~~~

### Product

~~~ts
{
  id: string;
  code: string;
  name: string;
  active: boolean;
  subproducts: Subproduct[];
}
~~~

### Subproduct

~~~ts
{
  id: string;
  code: string;
  name: string;
  active: boolean;
  modalities: Modality[];
}
~~~

### Modality

~~~ts
{
  code: string;
  name: string;
  active?: boolean;
  description?: string;
}
~~~

### Leitura arquitetural

- o envelope controla versão, cache e top-level payload;
- Product é a unidade superior do catálogo;
- Subproduct representa a subdivisão de um Product;
- Modality representa a forma de contratação permitida.
## 6. Endpoint Contracts
### GET /api/v1/commercial/catalog
#### Objetivo
Retornar o envelope completo do catálogo.

#### Payload
- envelope com `version`, `updatedAt`, `etag?` e `products`.

#### Cache
- altamente cacheável;
- ideal para revalidação condicional;
- pode usar `etag` ou `updatedAt` como referência.

#### Trade-offs
- maior payload;
- melhor simplicidade para consumidores que carregam a árvore completa.

### GET /api/v1/commercial/catalog/products
#### Objetivo
Retornar a lista de products.

#### Payload
- lista de products ou envelope reduzido com products.

#### Cache
- cacheável;
- útil para consumidores que precisam apenas da lista de products.

#### Trade-offs
- separa a navegação da árvore completa;
- pode duplicar parcialmente a leitura do endpoint raiz.

### GET /api/v1/commercial/catalog/products/:id
#### Objetivo
Retornar um product específico.

#### Payload
- product com subproducts.

#### Cache
- cacheável por product;
- bom candidato para `etag`.

#### Trade-offs
- melhora navegação pontual;
- exige estabilidade forte de `id`.

### GET /api/v1/commercial/catalog/products/:id/subproducts
#### Objetivo
Retornar os subproducts de um product.

#### Payload
- lista de subproducts do product.

#### Cache
- cacheável por product;
- pode ser revalidado separadamente.

#### Trade-offs
- reduz payload para consumidores parciais;
- aumenta número de chamadas se a UI montar a árvore por etapas.

### GET /api/v1/commercial/catalog/products/:id/subproducts/:id/modalities
#### Objetivo
Retornar as modalities de um subproduct.

#### Payload
- lista de modalities do subproduct.

#### Cache
- altamente cacheável;
- leitura muito estável.

#### Trade-offs
- muito granular;
- útil para consumidores de navegação progressiva.

## 7. Versioning Strategy
### version
Deve identificar o estado do catálogo no momento da leitura.

### etag
Deve suportar revalidação condicional quando disponível.

### updatedAt
Deve indicar a última atualização material do catálogo.

### Compatibilidade
- consumidores devem tolerar adição de campos;
- consumidores não devem depender de campos transitórios;
- versões futuras devem ser publicadas sem quebrar leituras antigas.

## 8. Error Contract Strategy
Os erros abaixo são conceituais.

### 404
Recurso não encontrado.

Uso:
- product inexistente;
- subproduct inexistente;
- modality inexistente.

### 400
Requisição inválida.

Uso:
- parâmetros ausentes;
- formatos inválidos;
- combinações inconsistentes.

### 401
Não autenticado.

Uso:
- tenant context ausente;
- sessão inválida;
- credencial ausente.

### 403
Proibido.

Uso:
- tenant sem permissão para o catálogo;
- acesso bloqueado por política.

### 500
Erro interno.

Uso:
- falha inesperada de backend;
- erro de leitura;
- problema de persistência ou cache.

## 9. Consumer Compatibility
### EstruturaComercial
- compatibilidade: alta;
- consome hierarquia de catálogo de forma direta;
- pode migrar bem para o envelope backend.

### TabelasComerciais
- compatibilidade: parcial;
- consome catálogo e fallback local;
- requer transição mais cuidadosa.

### Simulador
- compatibilidade: parcial;
- depende de catálogo e também de dados operacionais;
- precisa de integração com tabelas oficiais.

### Oportunidades
- compatibilidade: crítica;
- depende de catálogo e de pipeline;
- é o consumidor com maior acoplamento transitório.

### catalogRepository
- compatibilidade: parcial;
- hoje atua como adapter e compatibilidade local;
- deve ser substituído pelo contrato oficial.

### commercialRepository
- compatibilidade: parcial;
- hoje atua como fallback operacional e localStorage;
- não é o contrato oficial do catálogo.

## 10. Migration Considerations
### Compatibilidade
O contrato deve permitir convivência com consumidores antigos durante a migração.

### Fallback
Fallback local deve existir apenas como transição controlada, não como destino arquitetural.

### Rollback
O contrato precisa suportar retorno controlado para o estado anterior em caso de falha de adoção.

### Risco
Os principais riscos são:

- drift entre frontend e backend;
- leitura parcial de árvore;
- dependência residual de legado;
- quebra por mudança de shape.

## 11. Decisão Arquitetural Final
O contrato oficial da API do Master Catalog deve ser:

- backend owned;
- read only;
- versionado;
- tenant scoped;
- cache friendly;
- compatível com consumidores atuais durante a transição;
- baseado em `Product`, `Subproduct`, `Modality` e envelope de topo.

## 12. Non-Goals
Este documento não:

- cria Prisma;
- cria migration;
- cria CRUD;
- cria Pipeline;
- cria Commission;
- cria Settlement;
- cria RBAC;
- cria Provider Engine.
