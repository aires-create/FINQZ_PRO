# ARCH-040 - Master Catalog Backend Design

## 1. Contexto
O FINQZ PRO consolidou, ao longo das arquiteturas anteriores, a separação entre catálogo comercial e domínios operacionais.

Os documentos de referencia estabelecem a base para este desenho:

- `ARCH-036` definiu `Pipeline` como domínio backend separado.
- `ARCH-037` definiu `Product`, `Subproduct` e `Modality` como responsabilidade do backend.
- `ARCH-038` formalizou o backend blueprint do catálogo comercial.
- `ARCH-039` fechou o contrato oficial do Commercial Master Catalog.

O motivo central para o catálogo mestre existir no backend é simples:

- o frontend ainda carrega legado e adapters transitórios;
- a leitura precisa ser estável, versionada e tenant scoped;
- o contrato precisa ser único para todos os consumidores;
- regras de ownership precisam sair do cliente visual;
- o domínio comercial não pode continuar dividido entre catálogo local, pipeline e tabelas operacionais.

Este documento descreve o desenho backend do Master Catalog sem propor implementação.

## 2. Objetivos
O desenho backend deve garantir:

- `Backend First`;
- `Read Only` na fase inicial;
- `Tenant Scoped`;
- `Versionado`;
- `Single Source of Truth`;
- sem dependencia de `Pipeline`;
- sem dependencia de `CommercialTable`.

### Intenção arquitetural
O backend deve publicar o catálogo mestre como leitura oficial, preservando o frontend como consumidor.

## 3. Dominios Envolvidos
### Product
`Product` representa a unidade superior do catálogo comercial.

Responsabilidade:
- descrever a oferta comercial em nível macro;
- agrupar subprodutos;
- expor leitura canonica para navegacao e selecao.

### Subproduct
`Subproduct` representa a subdivisão interna de um product.

Responsabilidade:
- organizar a navegação interna;
- relacionar modalidades permitidas;
- manter a hierarquia funcional do catalogo.

### Modality
`Modality` representa a forma de contratação permitida para um subproduct.

Responsabilidade:
- codificar a modalidade comercial;
- servir de base para selecao e exibicao;
- preservar estabilidade de contrato.

### CommercialTable
`CommercialTable` é domínio operacional.

Responsabilidade:
- armazenar parametrização comercial;
- referenciar o catálogo;
- não assumir papel de catálogo mestre.

### CommercialCondition
`CommercialCondition` é domínio operacional.

Responsabilidade:
- armazenar condições de negociação e cálculo;
- depender do catálogo como referência;
- não substituir Product, Subproduct ou Modality.

### Pipeline
`Pipeline` é domínio separado.

Responsabilidade:
- representar fluxo e etapa operacional;
- não ser parte do catálogo mestre;
- não definir identidade comercial do product.

### Opportunity
`Opportunity` é consumidor do catálogo.

Responsabilidade:
- consumir o catálogo para seleção e persistência de contexto;
- não definir o catálogo;
- não ser owner de Product/Subproduct/Modality.

### Fronteiras
As fronteiras devem permanecer assim:

- catálogo mestre descreve oferta comercial;
- pipeline descreve fluxo operacional;
- commercial table descreve operação comercial;
- opportunity consome os três contextos sem ser owner de nenhum deles.

## 4. Read Model Strategy
O backend deve expor read models hierárquicos e previsíveis.

### Catalog Envelope
Envelope de topo para leitura de catálogo.

### Product Read Model
Leitura resumida e canônica de cada produto.

### Subproduct Read Model
Leitura resumida de cada subproduto, sempre ligada ao product pai.

### Modality Read Model
Leitura mínima da modalidade, ligada ao subproduct pai.

### Diretrizes
- leitura sem mutação na fase inicial;
- payloads consistentes para UI e integrações;
- estrutura suficiente para navegação hierárquica;
- campos adicionais devem ser opcionais e justificados por necessidade real.

## 5. Contract Envelope
O envelope do catálogo deve carregar os metadados de controle.

### Conceito
```ts
CommercialCatalogEnvelope {
  version: number;
  updatedAt: string;
  products: Product[];
  etag?: string;
}
```

### Campos
- `version`: controle de compatibilidade entre backend e consumidores.
- `updatedAt`: suporte a cache, auditoria e comparação de frescor.
- `products`: carga principal do catálogo.
- `etag`: opcional, para revalidação condicional.

### Discutindo `etag`
`etag` é desejável porque:

- melhora cacheability;
- facilita revalidação condicional;
- reduz tráfego desnecessário.

Mas não é obrigatório para o contrato mínimo.

### Cacheability
O envelope deve ser desenhado para responder bem a cache de leitura:

- leitura frequente;
- escrita rara ou centralizada;
- alta repeticao de consultas identicas.

### Forward compatibility
O envelope deve permitir evolução sem quebrar consumidores:

- campos novos podem ser adicionados;
- campos antigos podem ser descontinuados de forma controlada;
- a versão deve permitir coordenação entre frontend e backend.

## 6. Tenant Scope Strategy
O catálogo precisa ser `tenant scoped`.

### Isolamento por tenant
Cada tenant deve enxergar apenas o catálogo aplicável ao seu contexto.

### Responsabilidade do tenant context
O tenant context deve ser resolvido na camada backend por:

- autenticação;
- autorização;
- contexto de requisição;
- regras de isolamento do domínio.

### Catálogo global vs catálogo por tenant
O desenho pode suportar dois cenarios:

#### Catalogo global
- um catálogo base comum para todos os tenants;
- menor complexidade operacional;
- mais simples para inicio.

#### Catalogo por tenant
- variações por tenant;
- maior flexibilidade;
- maior custo de governanca.

### Trade-offs
- global simplifica operação, mas reduz personalização;
- por tenant aumenta flexibilidade, mas amplia complexidade;
- o contrato deve ser capaz de suportar ambos sem mudar a semântica pública.

## 7. Cache Strategy
### Frontend cache
O frontend pode manter cache de leitura para:

- melhorar latência percebida;
- reduzir chamadas repetidas;
- proteger a UX contra flutuações transitórias.

### Backend cache
O backend pode cachear:

- envelope do catálogo;
- listas de products;
- leitura de subproducts e modalities.

### `etag`
`etag` pode ser usado como mecanismo de revalidação e invalidação leve.

### Cache invalidation
A invalidacao deve acontecer quando:

- houver troca de versao;
- houver alteração de payload;
- houver mudanca de tenant context;
- houver refresh administrativo do catálogo.

### Objetivos
- minimizar drift;
- evitar leitura stale indevida;
- preservar simplicidade do contrato read only.

## 8. Endpoint Design (Conceitual)
Os endpoints conceituais do catálogo são:

- `GET /api/v1/commercial/catalog`
- `GET /api/v1/commercial/catalog/products`
- `GET /api/v1/commercial/catalog/products/:id`
- `GET /api/v1/commercial/catalog/products/:id/subproducts`
- `GET /api/v1/commercial/catalog/products/:id/subproducts/:id/modalities`

### Leitura de desenho
- `GET /api/v1/commercial/catalog` deve retornar o envelope.
- `GET /api/v1/commercial/catalog/products` deve permitir leitura direta da lista de products.
- `GET /api/v1/commercial/catalog/products/:id` deve permitir leitura de um product especifico.
- `GET /api/v1/commercial/catalog/products/:id/subproducts` deve permitir explorar subproducts.
- `GET /api/v1/commercial/catalog/products/:id/subproducts/:id/modalities` deve retornar as modalidades permitidas.

### Avaliacao
O conjunto é suficiente para o desenho inicial read only.

Ele não exige CRUD, nem mutação, nem modelo de escrita nesta fase.

## 9. Integracao com Opportunity
`Opportunity` consome o catálogo, não o define.

### Product != Pipeline
`Product` e `Pipeline` são domínios diferentes.

- `Product` descreve a oferta comercial.
- `Pipeline` descreve o fluxo operacional.

### Consequencia arquitetural
- a oportunidade pode referenciar ambos;
- a oportunidade não pode fundir os domínios;
- a resolução de pipeline não deve ser mecanismo de definição do catálogo.

### Responsabilidade da Opportunity
- consumir o catálogo oficial;
- usar o catálogo para seleção e validação;
- preservar o contrato canonicamente definido pelo backend.

## 10. Integracao com CommercialTable
`CommercialTable` referencia o catálogo.

### Papel de CommercialTable
- armazenar configuração comercial operacional;
- referenciar product/subproduct/modality;
- servir como base para calculos e condicoes.

### Papel que não possui
- não é catálogo mestre;
- não é fonte de verdade de Product/Subproduct/Modality;
- não deve reescrever a hierarquia.

### Regra de fronteira
Se a informação define o universo comercial canonicamente, ela pertence ao catálogo mestre.
Se a informação parametriza operação comercial, ela pertence a CommercialTable ou CommercialCondition.

## 11. Evolucao Futura
O desenho precisa aceitar evolução sem aprovar implementação antecipada.

### CRUD futuro
Pode existir em fase posterior, se e somente se houver aprovação arquitetural específica.

### Eligibility Engine
Pode nascer depois como serviço de domínio próprio.

### Rules Engine
Pode ser necessário futuramente para validação comercial, elegibilidade e compliance.

### Versionamento avancado
Pode evoluir para:

- revisoes por item;
- snapshots;
- diff de catálogo;
- historico de publicacao.

### Posição arquitetural
Nada disso e aprovado como implementacao agora.

## 12. Riscos
### Tenant scope
- vazamento de catálogo entre tenants;
- comportamento inconsistente em multiplos contextos;
- dificuldade de cache correto.

### Cache
- leitura stale;
- invalidação incompleta;
- discrepância entre frontend e backend.

### Migracao
- consumidores ainda presos ao legado;
- quebra de compatibilidade por remodelagem precoce;
- migração parcial com comportamento divergente.

### Duplicidade
- coexistência prolongada de fonte local e backend;
- inconsistências entre adapters;
- drift sem controle.

### Compatibilidade
- payload novo pode não ser imediatamente suportado por consumidores legados;
- necessidade de transição controlada;
- risco de regressão em Opportunity, Simulador e Estrutura Comercial.

## 13. Decisao Arquitetural Final
O desenho formaliza que:

- `Backend` é o owner de `Product`, `Subproduct` e `Modality`;
- `Frontend` é consumidor;
- a fase inicial é `Read Only`;
- `tenant scope` é obrigatório;
- o catálogo mestre deve existir separado de `Pipeline` e `CommercialTable`;
- a implementação concreta viria apenas em fase posterior e sob aprovação específica.

## 14. Non-Goals
Este desenho não:

- cria Prisma;
- cria migration;
- cria CRUD;
- cria Pipeline;
- cria Commission;
- cria Settlement;
- cria RBAC;
- cria Provider Engine.

### Encerramento
O objetivo deste documento é consolidar a forma arquitetural do backend do Master Catalog sem antecipar implementação.
