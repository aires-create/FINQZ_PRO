# H20-A1 - Enterprise Decision Runtime Composition Architecture

## 1. Veredito Arquitetural
**GO WITH RESTRICTIONS**

H20-A1 pode seguir com seguranca como camada de composicao modular fina do EDP, desde que:
- nao seja criada uma segunda raiz de aplicacao;
- `buildFastifyApp()` permanece como root global;
- a composicao do EDP seja local ao modulo;
- `PrismaEdpUnitOfWork` e `PrismaEdpTransactionBoundary` nao sejam usados juntos no mesmo fluxo;
- nao haja alteracao em contratos H19-C3, Event Catalog, Prisma schema, migrations, frontend ou regras de negocio.

---

## 2. Objetivo da H20-A1
Formalizar, antes da implementacao, a arquitetura alvo da composicao modular do EDP para conectar:
- runtime HTTP;
- command runtime;
- query runtime;
- repository registry Prisma;
- unit of work ou transaction boundary, com uso exclusivo de um unico caminho transacional;
- Event Store;
- Outbox;
- Audit Timeline;
- Idempotency;
- Correlation.

O objetivo nao e adicionar funcionalidade nova, mas preparar o wiring correto para que a H20-A2 possa implementar a integracao sem quebra de contrato, sem duplicar root e sem introduzir segunda fonte de verdade.

---

## 3. Escopo Permitido
H20-A1 permite apenas desenho arquitetural e preparacao documental da composicao:
- definir a composicao modular do EDP em `src/modules/edp/composition`;
- definir o contrato de wiring entre controller, handlers, runtime e persistencia;
- definir a decisao de uso de `UnitOfWork` versus `TransactionBoundary`;
- explicitar a conexao com o registry Prisma ja existente;
- explicitar o papel de Event Store, Outbox, Audit Timeline, Idempotency e Correlation;
- definir criterios de aceite para a futura implementacao.

---

## 4. Escopo Proibido
H20-A1 nao pode:
- implementar codigo de runtime;
- alterar contratos H19-C3;
- alterar Event Catalog;
- alterar Prisma schema;
- alterar migrations;
- alterar frontend;
- alterar `buildFastifyApp()` como raiz global;
- criar segunda raiz de aplicacao;
- criar regra de negocio;
- criar calculo financeiro;
- integrar providers reais;
- usar `PrismaEdpUnitOfWork` e `PrismaEdpTransactionBoundary` juntos no mesmo fluxo;
- criar segunda fonte de verdade para eventos, outbox, idempotencia ou audit.

---

## 5. Arquitetura Alvo
A arquitetura alvo do EDP para H20-A1 e modular, fina e de responsabilidade unica:

- `buildFastifyApp()` continua sendo o root global da aplicacao.
- `edpRoutes()` continua sendo o ponto de registro do modulo EDP em `/api/v1/edp`.
- O modulo EDP passa a ter uma composicao local em `src/modules/edp/composition`.
- A composicao local instancia dependencias Prisma e as injeta nos handlers ou use cases.
- O runtime de comando passa a operar sobre uma cadeia explicita de dependencias.
- O runtime de query permanece read-only e sem efeito colateral.
- O fluxo transacional do comando usa apenas uma abstracao principal.

### Forma desejada
`HTTP -> Middleware -> Controller -> Handler -> Composition -> UoW/Boundary -> Prisma Registry -> Persistencia`

### Principio de desenho
A composicao nao cria uma nova aplicacao. Ela apenas organiza o wiring interno do modulo EDP.

---

## 6. Fluxo Operacional Command Runtime
Fluxo alvo para comandos:

1. Request entra em `/api/v1/edp/commands/:commandName`.
2. Middleware do EDP construi correlation, causation, idempotency, security e audit context.
3. Controller valida o envelope e resolve o command handler.
4. Handler delega para a composicao do runtime.
5. Composicao injeta o caminho transacional unico.
6. Dentro da transacao, o runtime:
   - resolve o registry Prisma;
   - carrega ou persiste agregados;
   - registra eventos no Event Store;
   - enfileira registros no Outbox quando aplicavel;
   - persiste Audit Timeline;
   - persiste Idempotency e Correlation;
   - persiste versoes de Policy e Strategy quando o comando for desse dominio.
7. A saida e um envelope canonico de resposta.

### Regra essencial
O command runtime nao deve continuar limitado a `edpEventPublisher.publish()` como ultimo passo isolado. A publicacao canonica continua possivel como conceito, mas o runtime composito precisa anexar a persistencia governada ao mesmo fluxo.

---

## 7. Fluxo Operacional Query Runtime
Fluxo alvo para queries:

1. Request entra em `/api/v1/edp/queries/:queryName`.
2. Middleware do EDP estabelece contexto de request.
3. Controller valida o envelope e resolve o query handler.
4. Handler executa um caminho read-only.
5. A composicao de query nao deve abrir caminho de escrita por padrao.
6. O resultado retorna em envelope canonico.

### Regra essencial
Query runtime nao deve:
- gravar Event Store;
- gravar Outbox;
- gravar Audit Timeline;
- gravar Idempotency;
- iniciar transacao de escrita sem necessidade comprovada.

Se futuramente houver read models persistidos, eles devem entrar como dependencias de consulta e nao como mecanismo de escrita.

---

## 8. Decisao sobre UnitOfWork versus TransactionBoundary
### Decisao
Para H20-A1, o caminho principal deve usar **`PrismaEdpUnitOfWork`** como abstracao de composicao para runtime de comando.

### Justificativa
- `use-cases.ts` ja foi modelado com `EdpUnitOfWork`.
- a semantica de unit of work e mais alinhada com orquestracao de persistencia e agregados.
- evita duplicacao de desenho com `TransactionBoundary` no mesmo fluxo.

### Regra operacional
- `PrismaEdpUnitOfWork` e a opcao principal do command runtime.
- `PrismaEdpTransactionBoundary` deve ficar fora do caminho ativo de H20-A1.
- Se algum ponto futuro exigir boundary de transacao em camada inferior, isso deve ser uma decisao posterior e separada, nunca acoplada ao mesmo fluxo.

### Resultado esperado
Um unico caminho transacional, um unico owner da composicao de escrita e ausencia de sobreposicao entre abstractions.

---

## 9. Papel do Repository Registry Prisma
O registry Prisma e a fonte de wiring para persistencia do EDP.

### Funcao
- expor os adapters concretos de persistencia;
- mapear o dominio para Prisma sem espalhar client no controller;
- manter a composicao coesa e testavel.

### Registry relevante
`createPrismaEdpRepositoryRegistry(prisma)` ja disponibiliza:
- `decisionRepository`
- `simulationRepository`
- `decisionPolicyRepository`
- `decisionStrategyRepository`
- `proposalRepository`
- `recommendationRepository`
- `providerCapabilityRepository`
- `providerExecutionRepository`
- `operationCandidateRepository`
- `auditTimelineRepository`
- `eventStoreRepository`
- `outboxRepository`
- `idempotencyRepository`
- `correlationRepository`

### Regra
O registry deve ser consumido pela composicao do modulo, nao diretamente pelo controller.

---

## 10. Papel do Event Store
O Event Store e a trilha persistida oficial dos eventos canonicos do EDP.

### Papel na arquitetura
- registrar eventos em nivel de persistencia;
- preservar correlacao e causalidade;
- manter rastreabilidade do ciclo de vida do comando;
- servir como base auditavel do runtime.

### Regra
Event Store nao e substituto de Event Catalog. O catalogo descreve o contrato canonico; o Event Store persiste a ocorrencia real.

---

## 11. Papel do Outbox
O Outbox e a camada de entrega assíncrona segura.

### Papel na arquitetura
- desacoplar persistencia de escrita da publicacao de side effects;
- garantir reprocessamento controlado;
- suportar estados `PENDING`, `PROCESSING`, `PROCESSED` e `FAILED`.

### Regra
Outbox deve ser tratado como mecanismo de entrega, nao como dominio.

---

## 12. Papel do Audit Timeline
Audit Timeline e a trilha oficial de auditoria do EDP.

### Papel na arquitetura
- registrar eventos auditaveis do runtime;
- manter rastreio por tenant, aggregate, correlation, actor e action;
- suportar analise posterior de compliance e governanca.

### Regra
Audit Timeline deve ser persistido como consequencia de comportamento do runtime, nao como efeito colateral disperso em controller ou middleware.

---

## 13. Papel de Idempotency e Correlation
### Idempotency
Idempotency deve:
- impedir duplicacao de comando;
- preservar replay safety;
- registrar a chave de idempotencia com estado e snapshot de resposta quando necessario.

### Correlation
Correlation deve:
- conectar request, comando, evento e auditoria;
- ser estabelecida no pipeline HTTP;
- ser propagada para a composicao do runtime.

### Regra
Idempotency e Correlation sao responsabilidades de infraestrutura de execucao, nao de regra de negocio.

---

## 14. Estrategia de Composicao Modular em `src/modules/edp/composition`
### Intencao
Criar uma composicao modular local ao EDP para substituir wiring disperso por uma raiz de composicao do modulo.

### Diretriz
A composicao deve reunir:
- instanciacao de `PrismaEdpUnitOfWork`;
- instanciacao do registry Prisma;
- injeccao dos adapters de persistencia;
- montagem dos use cases ou executores do runtime;
- exposicao de uma unica API de montagem para os handlers HTTP.

### Estrutura sugerida
- `src/modules/edp/composition/index.ts`
- `src/modules/edp/composition/edp.composition.ts`

### Regra estrutural
O modulo de composicao deve ser local ao EDP, sem invadir `buildFastifyApp()` como segunda raiz e sem misturar boot global com wiring de dominio.

---

## 15. Arquivos que Poderao Ser Criados
Na H20-A2, os arquivos mais provaveis sao:
- `backend/src/modules/edp/composition/index.ts`
- `backend/src/modules/edp/composition/edp.composition.ts`

Opcionalmente, se a separacao de factory for necessaria:
- `backend/src/modules/edp/composition/edp.dependencies.ts`
- `backend/src/modules/edp/composition/edp.runtime.ts`

---

## 16. Arquivos que Poderao Ser Alterados
Na implementacao subsequente, os arquivos mais provaveis de alteracao sao:
- `backend/src/modules/edp/presentation/http/edp.routes.ts`
- `backend/src/modules/edp/presentation/http/edp.controller.ts`
- `backend/src/modules/edp/application/runtime-foundation.ts`
- `backend/src/modules/edp/application/command-handlers.ts`
- `backend/src/modules/edp/application/query-handlers.ts`
- `backend/src/modules/edp/application/use-cases.ts`
- `backend/src/modules/edp/application/unit-of-work.ts` somente se houver ajuste de contrato ou factory
- `backend/src/modules/edp/infrastructure/prisma/repositories.ts` somente se houver nova exposicao de factory, sem alterar schema

`buildFastifyApp()` nao deve ser alterado para hospedar a composicao do EDP, salvo se houver necessidade minima de registro de uma nova factory ja encapsulada no modulo.

---

## 17. Arquivos Bloqueados
Arquivos que nao devem ser alterados nesta etapa:
- `backend/src/core/http/fastify.ts`
- `backend/src/app.ts`
- `backend/src/server.fastify.ts`
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/**`
- `backend/src/modules/edp/contracts/**`
- `backend/src/modules/edp/domain/event-publisher.ts`
- `backend/src/modules/edp/tests/**` salvo testes novos da futura implementacao
- `docs/03-decision-platform/DCA-ENTERPRISE-DECISION-PLATFORM-v1.md`
- `docs/03-decision-platform/adrs/**`
- `docs/03-decision-platform/events/EVENT-CATALOG-v1.md`
- `docs/03-decision-platform/contracts/H19-C3-ENTERPRISE-DECISION-CANONICAL-CONTRACTS.md`
- `frontend/**`

---

## 18. Riscos e Mitigacao
### Risco 1: duplicacao de root arquitetural
Mitigacao:
- manter `buildFastifyApp()` como unica raiz global;
- criar composicao apenas dentro do modulo EDP.

### Risco 2: uso duplo de abstractions transacionais
Mitigacao:
- adotar um unico caminho ativo com `PrismaEdpUnitOfWork`;
- manter `TransactionBoundary` fora do fluxo da H20-A1.

### Risco 3: regressao de contrato
Mitigacao:
- nao tocar em H19-C3 contracts;
- nao tocar em Event Catalog;
- nao tocar em schema ou migrations.

### Risco 4: nova segunda fonte de verdade
Mitigacao:
- toda escrita de persistencia deve passar por repositorios Prisma e pelos contratos ja existentes;
- nenhum estado paralelo deve ser criado no controller.

### Risco 5: mistura de responsabilidades
Mitigacao:
- controller apenas valida e roteia;
- composition apenas monta dependencias;
- runtime apenas orquestra;
- dominio nao deve virar infra.

---

## 19. Critrios de Aceite
H20-A1 estara aprovado quando:
- existir desenho formal da composicao modular do EDP;
- a composicao local for reconhecida como o unico wiring do modulo;
- o uso de `PrismaEdpUnitOfWork` for decidido como caminho principal;
- `PrismaEdpTransactionBoundary` ficar fora do mesmo fluxo;
- o papel de registry Prisma, Event Store, Outbox, Audit Timeline, Idempotency e Correlation estiver explicitado;
- nao houver alteracao de contratos, Event Catalog, schema, migrations, frontend ou root global;
- a proxima etapa H20-A2 puder ser implementada sem reabrir decisao arquitetural.

---

## 20. Plano de Implementacao H20-A2
### Fase 1
Criar a composicao modular do EDP e expor factories claras para runtime de comando e consulta.

### Fase 2
Conectar o command runtime ao caminho transacional unico com registry Prisma.

### Fase 3
Conectar Event Store, Outbox, Audit Timeline, Idempotency e Correlation ao fluxo de escrita.

### Fase 4
Manter query runtime read-only e sem efeito colateral.

### Fase 5
Executar validacao tecnica com build, testes EDP e verificacao de nao regressao.

### Resultado esperado
H20-A2 deve entregar wiring concreto sem mudar a arquitetura definida neste documento.
