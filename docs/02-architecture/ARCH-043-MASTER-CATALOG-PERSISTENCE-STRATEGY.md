# ARCH-043 - Master Catalog Persistence Strategy

## 1. Contexto
O FINQZ PRO concluiu, nos documentos anteriores, a separação conceitual entre catálogo comercial, pipeline e domínios operacionais.

Os referenciais que sustentam esta estratégia são:

- `ARCH-036` separou `Pipeline` como domínio backend independente.
- `ARCH-037` definiu `Product`, `Subproduct` e `Modality` como responsabilidade do backend.
- `ARCH-038` formalizou o backend blueprint do catálogo comercial.
- `ARCH-039` fechou o contrato oficial do catálogo mestre.
- `ARCH-040` desenhou o backend do Master Catalog.
- `ARCH-041` mapeou os consumidores reais do catálogo.
- `ARCH-042` definiu o contrato oficial da API do Master Catalog.

O problema arquitetural central é a persistência do catálogo:

- hoje o frontend ainda carrega `creditPfCatalog` como base funcional;
- há adapters locais em `catalogRepository` e `commercialRepository`;
- o backend ainda não é a única fonte persistida do catálogo mestre;
- a transição precisa preservar compatibilidade sem perpetuar legado.

Esta estratégia define como a persistência deve evoluir até o estado backend-first.

## 2. Objetivos
A estratégia de persistência deve garantir:

- `tenant scope`;
- versionamento;
- estabilidade de ids;
- estabilidade de codes;
- cacheability;
- auditabilidade.

### Intenção arquitetural
O catálogo mestre deve ser persistido de forma que permita leitura estável, evolução controlada e migração segura dos consumidores.

## 3. Persistência Requirements
### Tenant scope
Cada tenant deve enxergar apenas o catálogo aplicável ao seu contexto.

### Versionamento
A persistência precisa suportar evolução sem quebrar consumidores.

### Estabilidade de ids
Os identificadores devem permanecer estáveis dentro do escopo relevante.

### Estabilidade de codes
Os códigos funcionais devem permanecer estáveis para integrações e leitura humana.

### Cacheability
A persistência deve favorecer leitura frequente e revalidação eficiente.

### Auditabilidade
O estado persistido deve permitir rastrear a versão e o momento de atualização material.

## 4. Persistence Models
### Catálogo embutido
Modelo em que o catálogo é embutido como parte do backend ou do release.

#### Vantagens
- simplicidade inicial;
- menor necessidade de governança de escrita;
- fácil compatibilidade com o estado atual.

#### Desvantagens
- menor flexibilidade;
- dependência de deploy para mudança;
- risco de acoplamento com o ciclo de release.

#### Riscos
- pouca granularidade para evolução;
- dificuldade de suportar variações por tenant;
- manutenção de legado por tempo excessivo.

### Catálogo configurável
Modelo em que o catálogo é persistido e administrado como configuração.

#### Vantagens
- maior flexibilidade;
- atualização controlada;
- melhor separação entre código e dados.

#### Desvantagens
- maior complexidade operacional;
- necessidade de governança forte;
- risco de inconsistência se o contrato for mal controlado.

#### Riscos
- drift entre configuração e consumidores;
- mudanças indevidas em produção;
- necessidade de mecanismos de validação e auditoria.

### Catálogo híbrido
Modelo em que parte do catálogo é embutida e parte é configurável.

#### Vantagens
- facilita migração gradual;
- reduz risco de corte abrupto;
- preserva compatibilidade durante a transição.

#### Desvantagens
- aumenta complexidade;
- pode gerar dupla fonte de verdade;
- dificulta leitura do ownership.

#### Riscos
- divergência entre fontes;
- semântica ambígua para consumidores;
- persistência de legado disfarçada de compatibilidade.

## 5. Product Persistence
`Product` deve ser persistido como entidade canônica do catálogo.

### Requisitos conceituais
- `id` estável;
- `code` estável;
- `name` estável;
- `active` controlado;
- associação com subproducts;
- capacidade de versionar o estado do product.

### Leitura arquitetural
O product não deve depender de pipeline para sua identidade.

### Diretriz
A persistência de `Product` deve existir no backend, com leitura controlada e sem duplicidade funcional no frontend.

## 6. Subproduct Persistence
`Subproduct` deve ser persistido como parte estrutural do `Product`.

### Requisitos conceituais
- `id` estável;
- `code` estável;
- `name` estável;
- `active` controlado;
- vínculo obrigatório com o product pai;
- associação com modalities.

### Leitura arquitetural
O subproduct não deve carregar regras operacionais públicas como contrato principal.

### Diretriz
A persistência de `Subproduct` deve preservar a hierarquia e a navegabilidade do catálogo.

## 7. Modality Persistence
`Modality` deve ser persistida como recurso terminal da hierarquia.

### Requisitos conceituais
- `code` estável;
- `name` estável;
- `active` opcional ou controlado;
- vínculo obrigatório com o subproduct pai.

### Leitura arquitetural
A modalidade deve ser persistida de forma leve e previsível.

### Diretriz
A persistência de `Modality` deve privilegiar simplicidade, estabilidade e cacheabilidade.

## 8. Versioning Strategy
A persistência precisa suportar versionamento do catálogo.

### Diretrizes
- uma versão de envelope para o catálogo;
- possibilidade de versionamento por item, se necessário;
- `updatedAt` para indicar frescor do estado persistido;
- histórico de publicação apenas se a operação justificar.

### Objetivo
Evitar drift entre backend e consumidores, mantendo um ponto claro de comparação entre versões.

## 9. Tenant Strategy
O catálogo deve ser persistido com escopo por tenant, ou com escopo global resolvido por tenant context.

### Opção global
Um catálogo comum para todos os tenants.

#### Vantagens
- mais simples;
- menor custo operacional;
- mais fácil de cachear.

#### Riscos
- menor flexibilidade;
- variações por tenant ficam difíceis de representar.

### Opção por tenant
Um catálogo persistido por tenant.

#### Vantagens
- maior flexibilidade;
- personalização suportada por desenho;
- melhor aderência a cenários multi-tenant.

#### Riscos
- maior complexidade;
- maior custo de governança;
- maior risco de inconsistência.

### Diretriz
O modelo deve ser tenant scoped no comportamento, mesmo que a forma física evolua ao longo do tempo.

## 10. Read Model Strategy
A persistência deve ser orientada a leitura.

### Diretrizes
- leitura rápida;
- payload estável;
- navegação hierárquica simples;
- compatibilidade com consumers atuais;
- envelope versionado como referência.

### Leitura arquitetural
O modelo de persistência deve servir ao read model da API e não expor complexidade desnecessária para o frontend.

## 11. Compatibility Strategy
### `creditPfCatalog`
Compatibilidade transitória.

- ainda é base funcional em partes do frontend;
- não deve ser tratado como destino final;
- deve sobreviver apenas enquanto houver migração ativa.

### `catalogRepository`
Compatibilidade transitória e adaptadora.

- reexporta helpers do catálogo;
- mistura leitura de catálogo com settings de pipeline;
- não é fonte definitiva de persistência.

### `commercialRepository`
Compatibilidade transitória operacional.

- sustenta fallback local;
- depende de `localStorage` e de inicialização local;
- não é persistência mestre.

### Diretriz
Todos esses artefatos devem ser tratados como compatibilidade temporária, não como arquitetura final.

## 12. Migration Strategy
A migração da persistência deve ser progressiva.

### Fase 1
Formalizar o modelo backend como referência de persistência.

### Fase 2
Manter compatibilidade com `creditPfCatalog`, `catalogRepository` e `commercialRepository`.

### Fase 3
Migrar consumidores para o read model oficial.

### Fase 4
Reduzir dependência de legado e consolidar a persistência backend-first.

### Fase 5
Desativar as fontes transitórias quando a cobertura de consumo estiver estabilizada.

## 13. Riscos
### Tenant scope
- vazamento entre tenants;
- leitura incorreta de catálogos diferentes;
- cache inconsistente.

### Versionamento
- drift entre versões;
- consumidores antigos quebrando por mudança precoce;
- dificuldade de comparar estados persistidos.

### Compatibilidade
- legado sobrevivendo por tempo excessivo;
- coexistência de múltiplas fontes de verdade;
- regressão em consumidores críticos.

### Persistência híbrida
- dupla fonte de verdade;
- ambiguidades de ownership;
- dificuldade de limpeza futura.

## 14. Decisão Arquitetural Final
A estratégia oficial é:

- persistência backend-first para o catálogo mestre;
- `tenant scoped` como princípio de isolamento;
- versionamento obrigatório no envelope;
- `creditPfCatalog`, `catalogRepository` e `commercialRepository` apenas como compatibilidade transitória;
- catálogo híbrido apenas como estado de transição controlada, não como destino final.

## 15. Non-Goals
Este documento não:

- cria Prisma;
- cria migration;
- cria tabela;
- altera backend;
- altera frontend;
- cria DTO;
- cria endpoint.
