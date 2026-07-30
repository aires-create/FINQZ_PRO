# ARCH-024 - Operation Orchestration Layer

Status: Proposed
Date: 2026-06-11
Owner: Architecture
Type: Architectural Contract
Project: FINQZ PRO

---

## 1. Objetivo

Definir a camada de orquestração de `Operation` para a fase `IMPL-04B`, estabelecendo a estratégia arquitetural de execução de handlers, fronteiras transacionais, idempotência, publicação de eventos, auditoria e correlação.

Este documento não implementa handlers reais, não cria rotas, não altera schema, não introduz serviços funcionais e não substitui a camada de aplicação descrita em `ARCH-023`.

O foco é formalizar como a camada de aplicação de `Operation` deve ser executada de forma consistente, auditável, multitenant e aderente às fronteiras já aprovadas.

---

## 2. Escopo permitido

A camada de orquestração pode definir apenas contratos conceituais e regras de coordenação.

Escopo permitido:

- estratégia de command handlers;
- estratégia de query handlers;
- fronteiras transacionais;
- estratégia de idempotência;
- estratégia de publicação de eventos;
- estratégia de auditoria;
- estratégia de correlação;
- compatibilização entre `ARCH-023` e `ARCH-021`;
- coordenação de estados de `Operation` sem implementar comportamento funcional;
- preparação para integração futura com `Commission`, `Settlement` e `Provider Engine`.

---

## 3. Escopo proibido

Escopo proibido nesta fase:

- implementação de handlers reais;
- criação de endpoints;
- criação de CRUD;
- criação de frontend;
- criação de `Settlement`;
- criação de `Provider` persistido;
- criação de `Commission V2`;
- alteração de schema Prisma;
- criação de migration;
- criação de rotas paralelas;
- escrita paralela operacional;
- shadow writes;
- duplicação de serviços, DTOs, repositories ou contratos já existentes;
- alteração de `Commission`;
- alteração do contrato de `Operation` já publicado em `ARCH-021` e `ARCH-023`.

---

## 4. Relação com documentos anteriores

`ARCH-024` depende e deve ser lido em conjunto com:

- `ADR-008` - Revenue Distribution Engine
- `ADR-009` - Operation Persistence and Financial Execution Aggregate
- `ARCH-019` - Workspace State Machine
- `ARCH-020` - Operation Materialization Blueprint
- `ARCH-021` - Operation Persistence Contract
- `ARCH-023` - Operation Application Layer
- `RFC-001` - Proposal Canonicalization

### Papel de cada referência

- `ADR-008` mantém `Commission` como domínio posterior e separado.
- `ADR-009` define `Operation` como raiz financeira e de execução.
- `ARCH-019` garante que o lifecycle global do workspace não seja confundido com a orquestração interna de `Operation`.
- `ARCH-020` define o blueprint de materialização e a semântica de execução.
- `ARCH-021` define persistência, relações e índices do aggregate.
- `ARCH-023` define commands, queries, DTOs, events e read models da camada de aplicação.
- `RFC-001` preserva `BankProposal` como proposta persistida canônica na coexistência.

### Regra

`ARCH-024` não compete com `ARCH-023`; ele detalha a forma de execução da camada de aplicação, não sua superfície de contrato.

---

## 5. Command Handler Strategy

A estratégia de command handler define como intenções de aplicação devem ser processadas.

### Princípios

- um command handler deve lidar com uma única intenção de negócio;
- o handler deve ser determinístico em relação ao estado atual;
- o handler deve validar tenant, RBAC e consistência antes de mutar qualquer estado;
- o handler deve preservar rastreabilidade da transação e da decisão;
- o handler não deve depender de leitura fora do contexto autorizado;
- o handler deve operar sobre `Operation` como aggregate central, sem reintroduzir `Opportunity` como proxy de execução.

### Diretrizes conceituais

- comandos de abertura criam a operação;
- comandos de transição respeitam lifecycle oficial;
- comandos de falha, cancelamento e rejeição devem permanecer auditáveis;
- comandos de aprovação e execução devem respeitar a sequência oficial;
- comandos não devem acionar fluxos paralelos fora do contrato da aplicação.

### Regra

Cada command handler deve representar uma decisão única e rastreável da aplicação.

---

## 6. Query Handler Strategy

A estratégia de query handler define como leituras da superfície de `Operation` devem ser atendidas.

### Princípios

- query handler não altera estado;
- query handler não publica comando derivado;
- query handler não executa regra de negócio mutável;
- query handler respeita isolamento multi-tenant;
- query handler preserva RBAC na seleção e na forma de exposição;
- query handler pode montar visões compostas, desde que não se torne source of truth.

### Diretrizes conceituais

- consultas por id, número, oportunidade, bank proposal e status devem ser diretas;
- timelines e visões financeiras devem ser derivadas de dados autorizados;
- listagens devem ser pagináveis e filtráveis por tenant;
- queries sensíveis podem exigir visibilidade restrita por papel.

### Regra

Query handler é read-only e não pode operar como mutator disfarçado.

---

## 7. Transaction Boundaries

A camada de orquestração deve respeitar fronteiras transacionais explícitas.

### Regras

- a unidade transacional deve ser pequena o suficiente para preservar consistência e recuperação;
- mutações de `Operation` devem acontecer dentro de fronteira transacional única por caso de uso;
- leitura usada para decidir mutação deve ser compatível com o estado do aggregate no mesmo tenant;
- publicação de evento e persistência devem ser coordenadas para evitar divergência;
- não deve haver transação que misture `Operation` com `Settlement` ou `Provider` persistido nesta fase;
- `Commission` não deve ser escrita como efeito lateral obrigatório desta fase.

### Diretriz

Se um caso de uso exigir mais de um agregado persistente, a fronteira transacional deve ser revisada antes da implementação.

---

## 8. Idempotency Strategy

A camada de orquestração deve ser idempotente em comandos críticos.

### Objetivos

- evitar duplicidade de criação;
- evitar transições repetidas;
- evitar execução duplicada em retry de rede ou retry de consumidor;
- preservar coerência em cenários de reprocessamento.

### Diretrizes conceituais

- comandos críticos devem carregar chave de correlação ou chave de deduplicação;
- repetição do mesmo comando não deve criar duas operações equivalentes;
- transições já aplicadas devem ser reconhecidas e tratadas de forma segura;
- a idempotência deve existir sem expor detalhe técnico ao domínio.

### Regra

Idempotência protege o negócio contra repetição, não substitui validação de estado.

---

## 9. Event Publication Strategy

A publicação de eventos deve ser parte explícita da orquestração de `Operation`.

### Princípios

- eventos devem representar transições reais;
- eventos devem ser publicados somente após decisão válida da aplicação;
- eventos devem carregar tenant e correlação;
- eventos não devem redefinir a verdade do agregado;
- eventos não devem ser usados como atalho para evitar persistência segura.

### Diretrizes

- eventos de operação devem refletir comandos efetivamente aceitos;
- publicação deve manter compatibilidade com o catálogo de `ARCH-008`;
- eventos de `Commission`, `Settlement` e provider podem ser previstos, mas não implementados fora do escopo;
- a ordem dos eventos deve refletir a ordem da mutação validada.

### Regra

Evento é consequência de uma decisão válida, não substituto de decisão.

---

## 10. Audit Strategy

A estratégia de auditoria deve assegurar rastreabilidade de ponta a ponta.

### Requisitos

- toda mutação relevante deve deixar rastro auditável;
- a auditoria deve registrar autoria, tenant, ação e resultado;
- transições críticas devem registrar antes e depois;
- falhas, rejeições, cancelamentos e reversões devem ser auditáveis;
- auditoria deve ser correlacionável com comando e evento;
- auditoria não deve criar verdade concorrente.

### Diretriz

O objetivo da auditoria é reconstrução confiável da decisão, não duplicação do domínio.

---

## 11. Correlation Strategy

A correlação é o mecanismo que liga comando, evento, auditoria e leitura observável.

### Requisitos

- cada operação de aplicação deve carregar um identificador de correlação quando disponível;
- o mesmo correlation id deve atravessar command, persistence, event e audit trail;
- correlação deve ser preservada em retry e reprocessamento;
- correlação deve funcionar sem misturar tenants;
- correlação não substitui idempotência, apenas a complementa.

### Diretriz

Sem correlação consistente, a operação fica difícil de rastrear, depurar e auditar.

---

## 12. Relationship to ARCH-023

`ARCH-023` define a superfície da camada de aplicação de `Operation`.

`ARCH-024` define como essa camada deve ser coordenada por handlers, transações, eventos, auditoria e correlação.

### Regra

- `ARCH-023` responde o que existe;
- `ARCH-024` responde como isso é orchestrado;
- nenhum dos dois autoriza implementação funcional nesta fase.

---

## 13. Multi-tenant Rules

### Regras

- toda decisão orquestrada deve ser tenant-scoped;
- command handlers devem validar tenant antes da mutação;
- query handlers devem restringir leitura ao tenant autorizado;
- audit trail e eventos devem carregar tenant de origem;
- retry e idempotência devem respeitar separação entre tenants.

### Regra

Não existe orquestração válida fora do tenant correto.

---

## 14. RBAC Rules

### Regras

- command handlers críticos exigem autorização explícita;
- queries sensíveis podem ser segmentadas por permissão;
- ações de aprovação, execução e encerramento devem respeitar perfil;
- compliance e auditoria podem ler mais do que mutar;
- a camada de orquestração não deve contornar governança por conveniência operacional.

### Regra

RBAC deve proteger a decisão e a transição, não apenas a interface.

---

## 15. Audit Trail Rules

### Regras

- cada comando aceito deve gerar trilha auditável;
- cada transição de estado deve ser explicável;
- rejeições e falhas devem ser registradas;
- correlação entre audit trail e evento deve ser possível;
- o audit trail não deve ser silencioso para casos críticos.

### Regra

Se o evento aconteceu e a auditoria não consegue explicar, a orquestração está incompleta.

---

## 16. Dependências permitidas

Dependências permitidas nesta camada:

- `ARCH-023` como contrato de aplicação;
- `ARCH-021` como contrato de persistência;
- `ADR-009` como definição de agregado;
- `ARCH-019` como referência de lifecycle global;
- `RFC-001` para leitura de proposta canônica;
- `OperationRepository` conceitual;
- `OperationCommands` e `OperationQueries`;
- `OperationDTOs`, `OperationEvents` e `OperationReadModels`;
- `Tenant`;
- `User`;
- `Opportunity`;
- `BankProposal`;
- mecanismos de auditoria;
- mecanismos de correlação;
- contratos de RBAC;
- catálogos de eventos operacionais.

---

## 17. Dependências proibidas

Dependências proibidas:

- `Settlement` persistido;
- `Payment`;
- `Provider` persistido;
- `Commission V2`;
- `Commission.operationId` como implementação nesta fase;
- frontend;
- endpoints novos;
- CRUD genérico;
- schema Prisma;
- migration;
- write path paralelo;
- shadow write;
- duplicação de contracts, services, DTOs ou repositories já previstos;
- qualquer implementação concreta de handler.

---

## 18. Relação com Opportunity

`Opportunity` continua sendo a raiz operacional e comercial.

### Regras

- orquestração de `Operation` não deve reescrever o lifecycle de `Opportunity`;
- `Opportunity` pode originar comandos de operação, mas não deve ser usada como executor financeiro;
- handlers não devem transformar `Opportunity` em source of truth da execução;
- read models podem agregar contexto da oportunidade, mas a decisão de operação pertence à camada de operação.

### Regra

`Opportunity` inicia o contexto. `Operation` governa a execução financeira.

---

## 19. Relação com BankProposal

`BankProposal` continua sendo a proposta persistida canônica.

### Regras

- `Operation` pode consumir `BankProposal` como referência de proposta;
- handlers podem validar compatibilidade entre operação e proposta;
- `BankProposal` não deve ser substituída por novo model concorrente;
- a orquestração não deve criar um fluxo paralelo de proposta.

### Regra

Proposal é origem de negociação, não motor de execução.

---

## 20. Relação futura com Commission

`Commission` é dependência futura da linha de execução financeira.

### Regras

- a orquestração pode prever marco de comissão, mas não deve materializar nova versão do domínio;
- não criar `Commission V2`;
- não introduzir `operationId` em `Commission` nesta fase;
- a evolução futura deve preservar rastreabilidade entre `Operation` e `Commission`.

### Regra

Comissão futura deve nascer da operação executada, não da orquestração isolada.

---

## 21. Relação futura com Settlement

`Settlement` permanece fora da materialização atual.

### Regras

- a orquestração pode antecipar pontos de integração;
- não deve existir persistência ou execução real de settlement nesta fase;
- não deve haver dependência forte da camada de orquestração em settlement;
- qualquer contrato futuro deve ser documentado em fase própria.

### Regra

Settlement é destino futuro do fluxo, não requisito desta fase.

---

## 22. Relação futura com Provider Engine

`Provider Engine` continua sendo integração externa e não persistência central.

### Regras

- a orquestração pode carregar contexto de provider por contrato;
- a camada não deve persistir provider;
- a camada não deve chamar provider diretamente fora de contrato documentado;
- provider não pode virar fonte de verdade da operação.

### Regra

Provider é dependência externa da execução, não origem do agregado.

---

## 23. Critérios de aceite

A fase de orquestração só pode ser considerada pronta quando:

- `ARCH-023` estiver aprovado como camada de aplicação;
- o desenho de command handlers e query handlers estiver documentado;
- transaction boundaries estiverem explícitas;
- idempotency strategy estiver definida;
- event publication strategy estiver definida;
- audit strategy e correlation strategy estiverem fechadas;
- as dependências permitidas e proibidas estiverem sem ambiguidade;
- nenhuma implementação funcional tiver sido criada por engano;
- não houver duplicidade com documentos já existentes.

---

## 24. Próxima fase recomendada

Após validação deste documento, a próxima fase recomendada é:

`IMPL-04C - Operation Handler Mapping and Execution Contracts`

### Objetivo da próxima fase

- detalhar o mapeamento conceitual entre commands, queries e handlers;
- definir a ordem esperada de processamento;
- validar envelopes de correlação e idempotência;
- preparar a especificação de contratos de observabilidade.

### Regra

Nenhuma fase posterior deve avançar para implementação enquanto o contrato de orquestração não estiver revisado e aprovado.
