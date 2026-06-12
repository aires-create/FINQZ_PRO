# ARCH-027 - Operation Numbering Strategy

Status: Proposed
Date: 2026-06-12
Owner: Architecture
Type: Architectural Contract
Project: FINQZ PRO

---

## 1. Objetivo

Definir a estrategia oficial de numeracao de `Operation` antes de habilitar criacao bem-sucedida no fluxo real.

Este documento resolve a ambiguidade entre:

- o schema atual, que ja possui `operationNumber`, `year`, `sequence` e `tenantId`;
- o contrato de persistencia, que ja exige unicidade por tenant;
- a camada HTTP, que nao deve depender de `operationNumber` vindo do frontend;
- a necessidade de isolamento multi-tenant e prevencao de duplicidade em concorrencia.

---

## 2. Problema

Hoje existe uma tensao entre contrato e runtime:

- `operationNumber` ja e tratado como identidade de negocio;
- `year` e `sequence` ja existem como suportes de unicidade;
- o repository de `Operation` exige `operationNumber` na persistencia;
- a camada HTTP nao deve confiar no frontend para gerar esse valor;
- ainda nao existe estrategia oficial de geracao automatica.

Sem uma regra oficial, a criacao de `Operation` fica exposta a:

- colisao de numeros em concorrencia;
- duplicidade por retry;
- inconsistencias por tenant;
- confusao entre ano calendario e ano fiscal;
- dependencia indevida do cliente para gerar identidade de negocio.

---

## 3. Status

### Estado atual

`OperationNumber` ainda nao tem geracao automatica implementada.

### Estado desejado

O backend deve gerar `operationNumber` de forma deterministica, tenant-scoped, anual e idempotente.

---

## 4. Auditoria do schema atual

O schema Prisma atual de `Operation` possui:

- `tenantId`
- `operationNumber`
- `year`
- `sequence`

E define:

- `@@unique([tenantId, operationNumber])`
- `@@unique([tenantId, year, sequence])`
- `@@index([tenantId])`
- `@@index([tenantId, status])`
- `@@index([opportunityId])`
- `@@index([bankProposalId])`
- `@@index([createdById])`
- `@@index([deletedAt])`

### Leitura arquitetural

- `tenantId` e a fronteira de isolamento.
- `operationNumber` e a identidade de negocio legivel.
- `year` e a unidade de particionamento da sequencia.
- `sequence` e o contador monotonicamente crescente dentro do tenant e do ano.

---

## 5. Auditoria do runtime atual

### Repository

O repository atual exige `operationNumber` ao persistir `Operation` e grava `year` e `sequence` junto com o tenant.

### Service

O service apenas repassa o comando para o repository e nao gera o numero.

### Controller

O controller HTTP nao deve exigir `operationNumber` do frontend como fonte de verdade.

### Validator

A validacao atual de entrada nao fecha a estrategia de geracao, apenas valida shape.

### Conclusao da auditoria

O runtime atual esta em estado de transicao: o contrato de persistencia ja conhece a numeracao, mas a geracao oficial ainda nao foi formalizada.

---

## 6. Decisao arquitetural

### Decisao

`operationNumber` deve ser gerado pelo backend, nunca pelo frontend.

### Responsavel

A geracao deve acontecer na camada de aplicacao/orquestracao de `Operation`, antes da persistencia.

### Justificativa

- o backend tem o tenant autentico;
- o backend consegue aplicar idempotencia e concorrencia corretamente;
- o backend e o unico ponto capaz de garantir unicidade por tenant;
- o frontend nao deve conhecer nem controlar a sequencia oficial.

---

## 7. Formato recomendado do operationNumber

Formato recomendado:

```text
OP-{YYYY}-{SEQUENCE}
```

Exemplo:

```text
OP-2026-000001
```

### Regras do formato

- prefixo fixo `OP`;
- ano calendario de 4 digitos;
- sequencia com padding fixo para ordenacao lexicografica;
- sem tenantId embutido no texto;
- sem correlacao com ids tecnicos;
- imutavel apos criacao.

### Motivo

O numero precisa ser legivel para negocio e suporte, mas sem vazar identificadores tecnicos ou criar dependencia visual de tenant.

---

## 8. Escopo da sequencia

A sequencia deve ser:

- por tenant;
- por ano;
- monotonicamente crescente;
- reiniciada a cada novo ano;
- unica no contexto do tenant.

### Regra

O mesmo numero de sequencia pode existir em tenants diferentes, desde que a unicidade do banco continue protegida por `tenantId`.

---

## 9. Regra por tenant

`tenantId` e o limite absoluto de isolamento da numeracao.

### Regras

- cada tenant possui sua propria sequencia anual;
- uma sequencia nunca pode cruzar tenants;
- a validacao de unicidade deve sempre considerar o tenant;
- qualquer mecanismo de cache, lock ou contador deve ser particionado por tenant.

### Consequencia

Um tenant nunca pode inferir ou competir com a numeracao de outro tenant.

---

## 10. Regra por ano

A sequencia deve ser recalculada por ano calendario.

### Regras

- o valor de `year` deve refletir o ano da numeracao;
- o contador reinicia quando o ano muda;
- o mesmo tenant pode ter sequencias diferentes em anos diferentes;
- `year` e parte da chave de unicidade operacional.

### Ano fiscal

Por padrao, o sistema deve usar ano calendario, nao ano fiscal.

Se futuramente existir necessidade de ano fiscal, isso deve ser formalizado em novo contrato, porque altera a semantica da sequencia e do numero exibido.

---

## 11. Papel de year e sequence

### `year`

Representa o ano de referencia da numeracao oficial.

### `sequence`

Representa o contador monotonicamente crescente dentro do escopo `tenantId + year`.

### Relacao entre eles

Os dois campos servem como base estrutural para gerar `operationNumber` e para garantir unicidade concorrente.

### Regra

`operationNumber` e o identificador de negocio;
`year` e `sequence` sao os suportes de geracao e unicidade.

---

## 12. Garantia de unicidade

A unicidade deve ser garantida em duas camadas:

1. contrato de aplicacao;
2. constraint do banco.

### Regras

- o backend deve impedir reutilizacao do mesmo numero no tenant;
- o banco deve continuar protegendo `tenantId + operationNumber`;
- o banco deve continuar protegendo `tenantId + year + sequence`;
- qualquer conflito deve ser tratado como colisao de numeracao e nao como erro generico.

---

## 13. Estrategia de concorrencia

A geracao de `operationNumber` deve ser segura sob concorrencia.

### Estrategia recomendada

Usar uma transacao no backend com isolamento suficiente para:

- ler o ultimo numero usado no tenant e ano;
- calcular a proxima sequencia;
- reservar o numero;
- persistir a operacao dentro da mesma unidade consistente.

### Requisito arquitetural

Se a estrategia baseada em leitura do ultimo valor nao for suficiente para concorrencia real, o backend deve evoluir para um mecanismo dedicado de reserva de numeracao por tenant e ano, sem expor essa complexidade ao frontend.

### Regra

Concorrencia e responsabilidade do backend, nunca do cliente.

---

## 14. Estrategia de idempotencia

`operationNumber` nao deve ser a chave primaria de idempotencia.

### Regras

- `Idempotency-Key` e a chave preferencial para repeticao de comando;
- `correlationId` e rastreio, nao dedupe;
- retries com a mesma idempotency key devem retornar o mesmo resultado ou um conflito previsivel;
- retries sem idempotency key continuam sujeitos a validacao de unicidade;
- idempotencia deve ocorrer antes da reserva final da sequencia.

### Consequencia

A numeracao nao deve avançar duas vezes para o mesmo comando idempotente.

---

## 15. Responsabilidade da geracao

### Backend

O backend deve:

- identificar tenant autenticado;
- calcular o ano;
- reservar a sequencia;
- compor `operationNumber`;
- persistir `year` e `sequence`;
- tratar conflitos como colisao de numeracao.

### Frontend

O frontend nao deve:

- gerar `operationNumber`;
- calcular `sequence`;
- calcular `year`;
- tentar corrigir colisao;
- assumir contrato de persistencia.

---

## 16. O que o frontend NAO deve enviar

O frontend nao deve enviar como fonte de verdade:

- `operationNumber`;
- `year`;
- `sequence`;
- qualquer numero manual de negocio para substituir a geracao oficial.

### Regra

O frontend pode no maximo exibir o numero depois da criacao, mas nao decidir sua forma.

---

## 17. O que o backend deve gerar

O backend deve gerar:

- `operationNumber`;
- `year`;
- `sequence`.

### Regra

Esses campos devem nascer coerentes entre si e ser persistidos juntos.

---

## 18. Como o repository deve persistir

O repository deve persistir a operacao ja numerada.

### Regras

- `operationNumber` entra como campo obrigatorio de persistencia;
- `year` e `sequence` entram como campos obrigatorios de persistencia;
- o repository nao deve inventar a sequencia sozinho;
- o repository deve apenas validar e gravar;
- a unicidade final continua protegida pelo banco.

### Regra

Repository e ultima barreira de persistencia, nao orquestrador de numeracao.

---

## 19. Como o service deve orquestrar

O service deve ser a camada que orquestra a geracao.

### Responsabilidades

- receber o comando de criacao;
- validar tenant e contexto;
- acionar a politica de numeracao;
- receber `operationNumber`, `year` e `sequence`;
- chamar o repository;
- tratar conflito de numeracao e idempotencia.

### Regra

Se a numeracao falhar, a falha deve acontecer antes do repository persistir estado inconsistente.

---

## 20. Relacao com correlationId

`correlationId` e um identificador de rastreio, nao de numeracao.

### Regras

- correlationId deve ser salvo quando presente;
- correlationId deve ajudar debug, auditoria e observabilidade;
- correlationId nao deve definir `operationNumber`;
- correlationId nao deve substituir idempotency key;
- correlationId pode ajudar a reconhecer retries, mas nao e chave de reserva.

### Regra

Correlation e trilha. Numeracao e identidade de negocio.

---

## 21. Relacao com audit trail futuro

A geracao de `operationNumber` deve ser auditavel.

### Regras

- auditoria deve registrar a reserva e a criacao;
- auditoria deve registrar tenant, actor e correlationId;
- eventuais conflitos devem ser auditaveis;
- o numero gerado deve aparecer na trilha de criacao.

### Regra

O audit trail futuro deve permitir reconstruir por que aquele numero foi emitido para aquele tenant e ano.

---

## 22. Proibicoes explicitas

Esta estrategia proibe:

- gerar `operationNumber` no frontend;
- gerar `operationNumber` no banco sem contrato da aplicacao;
- usar `correlationId` como numero de negocio;
- usar `tenantId` como sufixo visivel no numero;
- depender de valor manual vindo do body para criacao real;
- permitir mutacao posterior de `operationNumber`;
- misturar ano fiscal com ano calendario sem novo contrato;
- remover a unicidade por `tenantId + operationNumber`;
- remover a unicidade por `tenantId + year + sequence`.

---

## 23. Critérios de aceite

Esta estrategia fica aprovada quando:

- o formato do numero estiver fixado;
- a sequencia por tenant e ano estiver definida;
- a concorrencia estiver contemplada;
- a idempotencia estiver separada da numeracao;
- o frontend estiver explicitamente impedido de gerar o numero;
- o repository persistir apenas o numero ja gerado;
- nao houver duplicidade com `ARCH-021`, `ARCH-022`, `ARCH-023`, `ARCH-024` ou `ARCH-025`.

---

## 24. Proxima fase recomendada

Depois desta aprovacao, a proxima fase recomendada e:

`IMPL-07B - Operation Number Generation Implementation`

### Objetivo da proxima fase

- implementar a geracao no backend;
- integrar idempotencia;
- manter tenant isolation;
- preservar a estrategia por ano e sequencia;
- validar conflitos de concorrencia com testes.

---

## 25. Conclusao

`Operation` nao deve depender de numero manual do frontend.

A estrategia oficial recomendada e:

- backend gera;
- tenant isola;
- ano particiona;
- sequence incrementa;
- `operationNumber` identifica negocio;
- `correlationId` rastreia;
- `Idempotency-Key` deduplica.

Essa decisao fecha a fronteira arquitetural para que a geracao automatica possa ser implementada depois com segurança.

