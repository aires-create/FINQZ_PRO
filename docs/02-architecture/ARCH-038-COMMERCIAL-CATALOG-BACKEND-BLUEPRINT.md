# ARCH-038 - Commercial Catalog Backend Blueprint

## 1. Contexto
O FINQZ PRO está consolidando a fronteira entre catálogo comercial e domínio operacional.

A auditoria H-03C mostrou que:
- `creditPfCatalog` ainda é a base funcional atual para Product, Subproduct e Modality.
- não existe Catálogo Mestre Backend para substituir esse legado.
- `CommercialTable` e `CommercialCondition` não são, por desenho, o catálogo mestre.

A fase H-03D consolidou o contrato mínimo desejado:
- `Product -> Subproduct -> Modality`
- separado de `Pipeline`
- separado de `CommercialTable`
- separado de `CommercialCondition`
- `Backend First`
- `Tenant Scoped`
- `Versionado`
- `Read Only`

Este blueprint formaliza a direção arquitetural do Catálogo Comercial Backend como owner oficial do catálogo mestre.

## 2. Problema Atual
Hoje o domínio comercial possui uma duplicidade estrutural:

- o frontend ainda consome `creditPfCatalog` diretamente ou por adapters transitórios;
- o backend já possui tabela comercial e conditions, mas não possui catálogo mestre oficial;
- `Pipeline` já é domínio backend, mas ainda há heurísticas e dependências transitórias no frontend;
- `CommercialTable` armazena `productId`, `subproductId` e `modality`, mas isso é apenas parametrização operacional, não catálogo mestre.

Resultado:
- o mesmo conceito de Product/Subproduct/Modality existe de forma implícita em múltiplos lugares;
- o frontend continua dono de fato do catálogo funcional;
- não existe contrato único, versionado e tenant-scoped para leitura;
- a migração segura fica bloqueada.

## 3. Estado Atual (AS-IS)
### Frontend
- `creditPfCatalog` é a fonte funcional de products e subproducts.
- `catalogRepository` reexporta helpers do catálogo e ainda guarda pipeline settings.
- `Oportunidades` usa o catálogo para seleção de product, subproduct e modality.
- `EstruturaComercial` monta a hierarquia diretamente do catálogo local.
- `Simulador` depende de helpers do catálogo para navegar o funil comercial.
- `TabelasComerciais` usa catálogo local e fallback transitório para operar.

### Backend
- `Pipeline` existe como domínio operacional persistido.
- `CommercialTable` e `CommercialCondition` existem como domínio comercial operacional.
- não existe tabela Prisma própria para catálogo mestre.
- não existe contrato backend próprio para Product/Subproduct/Modality.
- não existe endpoint oficial de catálogo mestre.

## 4. Estado Futuro (TO-BE)
O estado futuro desejado é:

- backend como fonte única de verdade do Catálogo Comercial;
- leitura read-only para o catálogo mestre;
- contrato estável e versionado;
- tenant scope obrigatório;
- separação clara entre catálogo mestre e domínios operacionais;
- frontend como consumidor e renderizador;
- `creditPfCatalog` apenas como legado transitório durante a migração.

No TO-BE:
- `Product`, `Subproduct` e `Modality` passam a ser entidades conceituais oficiais do backend;
- `CommercialTable` continua sendo domínio operacional de condições;
- `Pipeline` continua sendo domínio operacional de funil;
- nenhuma dessas entidades substitui a outra.

## 5. Objetivos Arquiteturais
1. Definir um catálogo mestre backend oficial para Product, Subproduct e Modality.
2. Eliminar dependência funcional do frontend em catálogo local no longo prazo.
3. Manter compatibilidade durante a transição.
4. Garantir leitura read-only no início da adoção.
5. Manter versionamento para evitar drift entre frontend e backend.
6. Garantir escopo por tenant.
7. Evitar mistura de catálogo mestre com Pipeline ou CommercialTable.
8. Preservar estabilidade para Opportunity, Simulador e Estrutura Comercial.

## 6. Catálogo Mestre
O Catálogo Mestre é a estrutura oficial que descreve o universo comercial disponível para uso no produto.

Ele contém três níveis:

- `Product`
- `Subproduct`
- `Modality`

### Product
É a unidade superior do catálogo comercial.
Exemplos conceituais:
- Consignado
- Crédito Pessoal CDC
- Empréstimo com Garantia
- Financiamento
- Cartão
- Antecipação
- Energia
- Seguros
- Consórcio

### Subproduct
É a segmentação interna de um product.
Exemplos conceituais:
- INSS
- Federal
- Home Equity
- CDC Digital
- Veículo Novo
- Prestamista
- Imobiliário

### Modality
É a forma de contratação permitida para um subproduct.
Exemplos conceituais:
- Novo
- Refinanciamento
- Portabilidade
- Transferência de Cota

## 7. Ownership Matrix
| Domínio | Owner Atual | Owner Futuro | Observação |
|---|---|---|---|
| Product | `creditPfCatalog` / frontend | Backend | Catálogo mestre oficial |
| Subproduct | `creditPfCatalog` / frontend | Backend | Parte do catálogo mestre |
| Modality | `creditPfCatalog` / frontend | Backend | Parte do catálogo mestre |
| Pipeline | Backend | Backend | Domínio separado |
| CommercialTable | Backend | Backend | Domínio operacional |
| CommercialCondition | Backend | Backend | Domínio operacional |
| Opportunity | Backend / Frontend consumer | Backend / Frontend consumer | Consumidor do catálogo |
| Simulador | Frontend consumer | Frontend consumer | Não é owner |
| EstruturaComercial | Frontend consumer | Frontend consumer | Não é owner |

## Decisão de Ownership
Product -> Backend
Subproduct -> Backend
Modality -> Backend

Pipeline -> Backend (domínio separado)

CommercialTable -> Backend (domínio operacional)
CommercialCondition -> Backend (domínio operacional)

Opportunity -> Consumer
Simulador -> Consumer
EstruturaComercial -> Consumer

Ownership Transitório:
Híbrido Controlado

Ownership Final:
Backend First

## 8. Product Contract
### Contrato conceitual
```ts
Product {
  id: string;
  code: string;
  name: string;
  active: boolean;
  order?: number;
  version?: number;
  updatedAt?: string;
}
```

### Leitura arquitetural
- `id`: identificador estável.
- `code`: identificador funcional para integração.
- `name`: nome de exibição.
- `active`: controle de disponibilidade.
- `order`: ordenação previsível.
- `version`: controle de compatibilidade.
- `updatedAt`: suporte a cache e auditoria.

### O que não entra no núcleo do Product
- `pipelineId`
- `pipelineCode`
- `pipelineName`
- `providers`
- `automationEvents`
- `groupCode`
- `groupName`

Esses campos são acoplamentos de legado ou projeções adjacentes, não identidade do product.

## 9. Subproduct Contract
### Contrato conceitual
```ts
Subproduct {
  id: string;
  productId: string;
  code: string;
  name: string;
  active: boolean;
  order?: number;
  version?: number;
  updatedAt?: string;
}
```

### Leitura arquitetural
- `id`: identificador estável.
- `productId`: relação obrigatória com o product pai.
- `code`: identificador funcional.
- `name`: nome de exibição.
- `active`: controle de disponibilidade.
- `order`: ordenação previsível dentro do product.
- `version`: compatibilidade e evolução.
- `updatedAt`: suporte a cache.

### O que não entra no núcleo do Subproduct
- `modalities: string[]` como fonte primária
- blocos de `rules` no contrato mínimo
- dados de pipeline
- dados de provider
- dados de condição comercial

## 10. Modality Contract
### Contrato conceitual
```ts
Modality {
  id: string;
  subproductId: string;
  code: string;
  label: string;
  active: boolean;
  order?: number;
  version?: number;
  updatedAt?: string;
}
```

### Leitura arquitetural
- `id`: identificador estável.
- `subproductId`: relação obrigatória com o subproduct pai.
- `code`: identificador funcional.
- `label`: rótulo amigável.
- `active`: controle de disponibilidade.
- `order`: ordenação previsível.
- `version`: compatibilidade.
- `updatedAt`: suporte a cache.

### O que não entra no núcleo da Modality
- label hard-coded apenas no frontend
- arrays soltos de strings sem entidade formal
- vínculos diretos com pipeline
- regras operacionais de condição comercial

## 11. Relacionamentos
A hierarquia oficial é:

```text
Product
→ Subproduct
→ Modality
```

### Regras obrigatórias
- um `Product` pode ter vários `Subproducts`;
- um `Subproduct` pertence a um único `Product`;
- um `Subproduct` pode ter várias `Modalities`;
- uma `Modality` pertence a um único `Subproduct`;
- o relacionamento precisa ser estável e navegável por `id` e por `code`;
- `Pipeline` não faz parte dessa hierarquia.

## 12. Versionamento
Versionamento é necessário.

### Por quê
- o frontend precisa saber quando o catálogo mudou;
- a leitura read-only precisa suportar cache;
- a migração será gradual;
- diferentes consumidores podem atualizar em ritmos distintos.

### Estratégia conceitual
- versionamento no catálogo como envelope;
- possibilidade de `version` por item, se necessário;
- `updatedAt` para comparação de freshness;
- compatibilidade retroativa durante a transição.

### Regra
Versionamento não deve ser usado para criar duplicidade de entidades. Ele serve para leitura e compatibilidade.

## 13. Tenant Scope
Tenant scope é necessário.

### Motivos
- o FINQZ PRO é multi-tenant;
- catálogos podem precisar de variações futuras;
- o contrato deve evitar acoplamento a uma lista global irrevogável;
- o backend já opera com contexto tenant em outros domínios.

### Diretriz
- toda resposta do catálogo deve ser resolvida dentro do tenant corrente;
- fallback global só pode existir se for explicitamente definido como base comum;
- qualquer customização por tenant deve ser explicitada no contrato.

### Regra
Ausência de tenant scope no catálogo futuro aumenta o risco de drift arquitetural e limita evoluções posteriores.

## 14. Read Models
O catálogo mestre deve ser exposto inicialmente como read model.

### Características
- somente leitura;
- sem CRUD no primeiro momento;
- sem side effects;
- sem dependência de CommercialTable;
- sem acoplamento a Pipeline.

### Read models sugeridos
- `ProductListItem`
- `ProductDetail`
- `SubproductListItem`
- `SubproductDetail`
- `ModalityListItem`

### Benefícios
- simplifica adoção;
- reduz risco de migração;
- permite cache agressivo;
- evita que o catálogo vire domínio transacional prematuro.

## 15. Endpoints Conceituais
Somente conceituais.

### Catálogo
- `GET /api/v1/commercial/catalog`
- `GET /api/v1/commercial/catalog/version`

### Product
- `GET /api/v1/commercial/catalog/products`
- `GET /api/v1/commercial/catalog/products/:productId`

### Subproduct
- `GET /api/v1/commercial/catalog/products/:productId/subproducts`
- `GET /api/v1/commercial/catalog/products/:productId/subproducts/:subproductId`

### Modality
- `GET /api/v1/commercial/catalog/products/:productId/subproducts/:subproductId/modalities`

### Requisitos conceituais
- somente leitura;
- tenant scoped;
- versionado;
- ordenação estável;
- payload enxuto;
- contratos previsíveis;
- sem CRUD no início.

## 16. Cache Strategy
### Frontend
- cache em memória para sessão atual;
- revalidação por `version` ou `updatedAt`;
- fallback transitório para `creditPfCatalog` apenas enquanto o backend não cobrir todos os consumidores;
- evitar persistência local como fonte oficial;
- tratar cache como otimização, não como contrato.

### Backend
- cache de leitura permitido;
- invalidar por versão ou timestamp;
- read-through cache aceitável;
- respostas devem permanecer idempotentes e determinísticas;
- o cache não pode mudar o significado do contrato.

## 17. Integração com Opportunity
Opportunity é consumidora do catálogo.

### Regra
- Opportunity usa Product, Subproduct e Modality como referência comercial;
- Opportunity não é owner do catálogo;
- Opportunity não deve calcular sua taxonomia via heurística local;
- Opportunity deve receber IDs e codes estáveis do backend.

### Consequência
- a criação e edição de oportunidades passam a depender de contrato canônico;
- o frontend continua responsável pela UX, mas não pela verdade do catálogo.

## 18. Integração com CommercialTable
CommercialTable é domínio operacional, não catálogo mestre.

### Regra
- `CommercialTable` pode referenciar `productId`, `subproductId` e `modality`;
- isso não transforma `CommercialTable` em catálogo mestre;
- `CommercialTable` continua sendo tabela de parametrização comercial;
- o catálogo mestre pode ser usado para validar integridade das tabelas.

### Leitura arquitetural
- `CommercialTable` consome o catálogo;
- `CommercialTable` não define o catálogo.

## 19. Integração com Pipeline
### Product ≠ Pipeline
Essa separação deve ser explícita e permanente.

### Regra
- `Product` não é `Pipeline`;
- `Subproduct` não é `Stage`;
- `Modality` não é etapa do funil;
- `Pipeline` continua sendo domínio operacional de jornada;
- qualquer relação entre product e pipeline deve ser tratada como integração, não como identidade do catálogo.

### Consequência
- heurísticas `Product -> Pipeline` não podem ser o contrato final;
- o catálogo mestre deve sobreviver mesmo que pipelines mudem;
- a existência de pipeline não define a taxonomia comercial.

## 20. Migration Strategy
### Fase 1 - Contrato
- definir o contrato mínimo de Product/Subproduct/Modality;
- fechar o envelope versionado;
- fechar tenant scope;
- fechar política read-only.

### Fase 2 - Backend
- introduzir o catálogo mestre backend;
- expor read models oficiais;
- garantir consistência e ordenação;
- manter compatibilidade com consumidores legados.

### Fase 3 - Migração consumidores
- migrar `EstruturaComercial`;
- migrar `Oportunidades`;
- migrar `Simulador`;
- migrar `TabelasComerciais`;
- reduzir gradualmente dependência de `catalogRepository` e `creditPfCatalog`.

### Fase 4 - Desativação `creditPfCatalog`
- congelar expansão do catálogo local;
- retirar o uso operacional como fonte de verdade;
- preservar somente fallback transitório quando necessário;
- validar paridade com o backend.

### Fase 5 - Cleanup
- remover adapters obsoletos;
- remover heurísticas antigas;
- consolidar testes;
- formalizar o backend como fonte única do catálogo.

## 21. Riscos
- remoção prematura de `creditPfCatalog` quebra seleções e navegação;
- versionamento insuficiente pode gerar drift entre frontend e backend;
- tenant scope ausente pode criar catálogo global rígido demais;
- misturar catálogo mestre com `CommercialTable` pode reintroduzir acoplamento indevido;
- misturar catálogo mestre com `Pipeline` compromete a fronteira arquitetural;
- read model sem contrato estável vira apenas outro adapter local;
- migration sem compatibilidade pode causar regressão em `Oportunidades`, `Simulador` e `EstruturaComercial`.

## 22. Decisão Arquitetural Final
**Backend é o owner oficial do Catálogo Comercial Mestre.**

### Decisão
- `Product`, `Subproduct` e `Modality` pertencem ao backend.
- O catálogo mestre deve ser `read-only` no início.
- O contrato deve ser `tenant scoped` e `versionado`.
- `Pipeline` continua separado.
- `CommercialTable` continua separado.
- `CommercialCondition` continua separado.
- `creditPfCatalog` deixa de ser fonte oficial e passa a ser compatibilidade transitória.

### Conclusão
A arquitetura alvo é:
- backend-first
- catálogo mestre oficial
- contratos read-only
- consumidores frontend desacoplados
- sem duplicidade de ownership

## 23. Non-Goals
Este blueprint **NÃO**:
- cria tabelas Prisma;
- autoriza migrations;
- define CRUD;
- remove `creditPfCatalog` imediatamente;
- altera `Pipeline`;
- altera `Opportunity Intake`;
- altera `Commission V2`;
- altera `Settlement`;
- altera `RBAC`;
- altera `Provider Engine`.

Qualquer implementação decorrente deste blueprint deverá passar por auditoria específica e aprovação arquitetural posterior.
