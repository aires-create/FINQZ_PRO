# H20-A1 - EDP Composition Public API

## Purpose
Definir exclusivamente a API publica da camada `src/modules/edp/composition`, sem implementar codigo e sem alterar a arquitetura existente.

Esta especificacao existe para:
- evitar uma segunda raiz de aplicacao;
- manter `buildFastifyApp()` como root global;
- separar claramente contratos publicos de dependencias internas;
- preparar a futura composicao do EDP sem reabrir decisoes arquiteturais.

---

## 1. Public Architectural Contract
### Veredito da API
**GO WITH RESTRICTIONS**

### Regra central
A camada de composicao do EDP deve expor apenas a superficie necessaria para montar o runtime do modulo, e nao deve vazar:
- Prisma client;
- detalhes de transaction management;
- detalhes de registry interno;
- dependencias de infra nao observaveis pelo modulo consumidor.

---

## 2. Scope of the Public API
### Permitted
- criar factories de composicao do EDP;
- expor interfaces de runtime de comando e consulta;
- expor interfaces de dependencias de composicao;
- expor uma forma unica de montagem do modulo EDP;
- expor contratos de shutdown ou dispose apenas se houver recurso real a liberar.

### Forbidden
- expor `PrismaClient` diretamente;
- expor `TransactionClient` diretamente;
- expor `buildFastifyApp()` como parte da composicao;
- criar segunda raiz de aplicacao;
- mesclar responsabilidades de HTTP, dominio e persistencia na mesma interface;
- alterar contratos H19-C3, Event Catalog, schema ou migrations.

---

## 3. Public Surface
A API publica recomendada para `src/modules/edp/composition` deve ser pequena e intencional.

### 3.1 Exported Factories
#### `createEdpComposition(...)`
Factory principal do modulo.

Responsabilidade:
- receber dependencias de infra ja prontas;
- montar o runtime do EDP;
- retornar objetos prontos para uso por routes, controllers ou handlers.

#### `createEdpCommandRuntime(...)`
Factory do runtime de comando.

Responsabilidade:
- encapsular o caminho transacional unico;
- coordenar handlers de comando;
- operar com registry Prisma, Event Store, Outbox, Audit Timeline, Idempotency e Correlation.

#### `createEdpQueryRuntime(...)`
Factory do runtime de query.

Responsabilidade:
- executar consultas read-only;
- preservar o principio de ausencia de efeito colateral.

### 3.2 Exported Types
#### `EdpComposition`
Contrato agregado que representa a composicao ja pronta.

#### `EdpCompositionDependencies`
Contrato de dependencias de entrada permitidas.

#### `EdpCompositionRuntime`
Contrato de runtime resultante da composicao.

#### `EdpCommandRuntime`
Contrato publico para execucao de comandos.

#### `EdpQueryRuntime`
Contrato publico para execucao de queries.

#### `EdpCompositionOptions`
Contrato de configuracao opcional do wiring do modulo.

#### `EdpCompositionResult`
Contrato de saida da factory principal.

---

## 4. Recommended Public Interfaces
As interfaces abaixo definem a superficie publica pretendida. Elas sao especificacoes de forma, nao implementacao.

```ts
export interface EdpCompositionOptions {
  readonly uowStrategy?: 'unit-of-work';
  readonly commandMode?: 'prisma';
  readonly queryMode?: 'read-only';
}

export interface EdpCompositionDependencies {
  readonly commandHandlers: unknown;
  readonly queryHandlers: unknown;
  readonly repositories: unknown;
  readonly eventStore: unknown;
  readonly outbox: unknown;
  readonly auditTimeline: unknown;
  readonly idempotency: unknown;
  readonly correlation: unknown;
}

export interface EdpCommandRuntime {
  execute(commandName: string, payload: Record<string, unknown>): Promise<unknown>;
}

export interface EdpQueryRuntime {
  execute(queryName: string, payload: Record<string, unknown>): Promise<unknown>;
}

export interface EdpCompositionRuntime {
  readonly commands: EdpCommandRuntime;
  readonly queries: EdpQueryRuntime;
}

export interface EdpCompositionResult {
  readonly runtime: EdpCompositionRuntime;
}

export interface EdpComposition {
  readonly runtime: EdpCompositionRuntime;
}
```

### Observacao
Os tipos acima delimitam a intenccao arquitetural. A implementacao pode especializar tipos mais fortes depois, mas a superficie publica deve permanecer pequena e previsivel.

---

## 5. Public Responsibilities
### `createEdpComposition`
Deve ser o unico ponto de montagem do modulo EDP.

Deve:
- receber dependencias ja resolvidas;
- criar runtimes de comando e query;
- manter internals encapsulados;
- devolver um objeto de composicao consumivel pelo modulo EDP.

### `createEdpCommandRuntime`
Deve:
- representar o caminho de escrita do EDP;
- usar apenas um mecanismo transacional ativo;
- coordenar persistencia governada.

### `createEdpQueryRuntime`
Deve:
- representar o caminho de leitura do EDP;
- nao abrir transacoes de escrita;
- nao gravar estados persistentes por padrao.

---

## 6. Exposed Dependencies
As dependencias que a API publica pode aceitar como entrada sao apenas dependencias de alto nivel, ja resolvidas pelo consumidor:

- registry de repositorios;
- unit of work principal;
- runtime de comandos;
- runtime de queries;
- event store;
- outbox;
- audit timeline;
- idempotency;
- correlation;
- opcionalmente, factories para testes.

### Regra
A API publica pode aceitar dependencias abstratas ou interfaces. Ela nao deve exigir classes concretas de Prisma como contrato primario.

---

## 7. Internal Dependencies
Dependencias internas da composicao, que nao devem ser expostas como API publica:

- `PrismaClient`;
- `Prisma.TransactionClient`;
- `PrismaEdpUnitOfWork`;
- `PrismaEdpTransactionBoundary` no caminho ativo da H20-A1;
- `createPrismaEdpRepositoryRegistry(...)`;
- details of `edpEventPublisher`;
- mappers Prisma internos;
- factories de event store, outbox, audit, idempotency e correlation.

### Regra
Esses detalhes podem existir dentro da composicao, mas nao devem ser o contrato publico principal.

---

## 8. Boundary With Existing Architecture
### `buildFastifyApp()`
Permanece como raiz global da aplicacao.

### `edpRoutes()`
Pode consumir a composicao publica, mas nao deve configurar infra diretamente.

### `edp.controller.ts`
Pode usar o runtime resultante da composicao, mas nao deve saber como o runtime foi montado.

### `runtime-foundation.ts`
Pode continuar existindo como camada de envelope ou executor canonico, mas nao deve virar um segundo composition root.

---

## 9. Proposed Module Shape
Estrutura publica recomendada:

- `src/modules/edp/composition/index.ts`
- `src/modules/edp/composition/edp.composition.ts`

Opcionalmente, se a organizacao precisar de separacao maior:

- `src/modules/edp/composition/edp.command-runtime.ts`
- `src/modules/edp/composition/edp.query-runtime.ts`
- `src/modules/edp/composition/edp.dependencies.ts`

### Regra
Esses arquivos devem permanecer internos ao modulo e nao competir com a raiz global.

---

## 10. Public API Principles
- pequena;
- previsivel;
- testavel;
- sem acoplamento ao Fastify;
- sem acoplamento direto ao Prisma client;
- sem mistura de write path e read path;
- sem duplicacao de boundary transacional;
- sem vazamento de detalhes de infraestrutura.

---

## 11. Recommended Export Policy
### Exportar
- factories de composicao;
- interfaces de runtime;
- tipos de entrada e saida da composicao;
- helpers de wiring quando nao vazarem infra concreta.

### Nao exportar
- repositories concretos;
- adapters concretos;
- client Prisma;
- transaction objects;
- internals de middleware;
- publishers ou mappers concretos se houver risco de acoplamento externo.

---

## 12. Acceptance Criteria for the Public API
A API publica da composicao do EDP sera considerada adequada quando:
- houver um unico ponto de montagem do modulo;
- o consumidor externo conseguir montar o runtime sem conhecer internals Prisma;
- o command runtime e o query runtime estiverem separados;
- o contrato publico nao expuser duas abstracoes transacionais concorrentes;
- nao existir dependência direta de `buildFastifyApp()` para montar a composicao;
- o desenho for compativel com a arquitetura H20-A1 ja aprovada.

---

## 13. Files Intended for the Next Step
Se a H20-A2 avancar, os arquivos mais provaveis sao:
- `backend/src/modules/edp/composition/index.ts`
- `backend/src/modules/edp/composition/edp.composition.ts`

Opcionalmente:
- `backend/src/modules/edp/composition/edp.dependencies.ts`
- `backend/src/modules/edp/composition/edp.command-runtime.ts`
- `backend/src/modules/edp/composition/edp.query-runtime.ts`

---

## 14. Final Recommendation
A API publica da composicao do EDP deve ser tratada como uma interface pequena de montagem de runtime, com dependencias abstratas e internals encapsulados.

Isso preserva:
- a raiz global existente;
- os contratos H19-C3;
- o Event Catalog;
- o schema e migrations;
- a separacao entre arquitetura e implementacao.

