# H21 - Enterprise Decision Business Runtime Architecture

**Program:** FINQZ PRO Enterprise
**Platform:** Enterprise Decision Platform (EDP)
**Baseline inherited:** H19 + H20
**Status inicial da H21:** **PLANNED**

## 1. Objetivo da H21

A H21 tem como objetivo transformar o Enterprise Decision Runtime, já operacional e validado em H20, em um **Business Runtime** capaz de executar capacidades reais de decisão do FINQZ PRO com segurança arquitetural, previsibilidade transacional e preservação dos contratos já homologados.

A nova fase não reinicia a plataforma. Ela amplia o runtime existente com capacidades de negócio progressivas, mantendo a fundação operacional, a composição modular e as garantias de persistência já estabelecidas.

## 2. Premissas Herdadas da H19 e H20

A H21 parte das seguintes premissas consolidadas:

- H19 estabeleceu a fundação arquitetural homologada do EDP.
- H20 consolidou o Enterprise Decision Runtime operacional.
- A composição modular do EDP já existe e é a base de integração do módulo.
- O HTTP do EDP já adota a composição sem alterar contratos externos.
- `PrismaEdpUnitOfWork` é o boundary transacional oficial.
- Repository Registry, Event Store, Outbox, Audit Timeline, Correlation e Idempotency Safe Mode já estão presentes e validados.
- O runtime HTTP mantém isolamento funcional entre Command e Query.
- O frontend permanece fora do domínio de execução da lógica de negócio.

## 3. Restrições Permanentes

As seguintes restrições permanecem válidas durante toda a H21:

- não alterar contratos sem ADR;
- não alterar Event Catalog sem revisão;
- não alterar Prisma schema sem plano formal;
- não implementar regra de negócio no frontend;
- não transferir ownership do domínio para providers;
- não criar múltiplas fontes de verdade;
- não quebrar Idempotency Safe Mode;
- não acionar publisher assíncrono nesta primeira fase.

## 4. Arquitetura Alvo da H21

A arquitetura alvo da H21 é um **Business Runtime orientado a capacidades**, no qual o EDP deixa de ser apenas uma runtime foundation operacional e passa a executar fluxos de decisão reais, com persistência transacional, rastreabilidade e isolamento por capacidade.

Essa arquitetura deve manter:

- um runtime canônico de composição interna no módulo EDP;
- HTTP como porta de entrada estável para capacidades de negócio;
- use cases orquestrados sob `PrismaEdpUnitOfWork`;
- eventos, trilhas, correlações e idempotência persistidos na mesma transação;
- possibilidade de evolução em ondas sem quebrar o contrato já homologado.

## 5. Business Runtime Esperado

O Business Runtime esperado para a H21 é composto pelas seguintes capacidades:

- Decision Runtime
- Policy Evaluation
- Strategy Resolution
- Recommendation Engine
- Proposal Runtime
- Simulation Runtime
- Provider Execution Runtime

Essas capacidades devem ser introduzidas de forma incremental, cada uma com fronteiras claras de responsabilidade, persistência rastreável e independência da camada de apresentação.

## 6. Ordem Recomendada das Ondas

Para reduzir risco e preservar estabilidade, a H21 deve ser executada nesta ordem:

1. H21-A Decision Runtime
2. H21-B Recommendation Engine
3. H21-C Proposal Runtime
4. H21-D Simulation Runtime
5. H21-E Provider Execution Runtime

Essa ordem prioriza a capacidade decisória central antes das capacidades derivadas de recomendação, proposta, simulação e execução externa.

## 7. Detalhamento da H21-A

A H21-A é a primeira onda de negócio da nova macrofase e define o núcleo decisório do EDP.

### 7.1 Decision Engine

O Decision Engine é o núcleo de orquestração da decisão. Ele recebe um contexto de decisão, consulta política e estratégia aplicáveis e produz um resultado decisório rastreável.

### 7.2 Decision Context

O Decision Context é o conjunto mínimo de dados necessários para avaliar uma decisão. Ele deve carregar os elementos de entrada do caso de uso, o contexto do tenant, a origem, a correlação e os metadados necessários para auditoria.

### 7.3 Policy Evaluation

A Policy Evaluation é a etapa responsável por interpretar a política vigente, verificar compatibilidade com o contexto e produzir a base normativa da decisão.

### 7.4 Strategy Selection

A Strategy Selection define qual estratégia deve ser aplicada ao contexto, com base em critérios de elegibilidade, prioridade e consistência com a política avaliada.

### 7.5 Decision Result

O Decision Result é o artefato canônico da H21-A. Ele deve ser determinístico, auditável e persistível, servindo como base para etapas posteriores do runtime de negócio.

### 7.6 Eventos Esperados

Os eventos esperados para H21-A devem refletir o ciclo de decisão, sem introduzir duplicidade de fonte de verdade. A definição final dos eventos exige revisão de catálogo e alinhamento com os contratos canônicos.

### 7.7 Persistência Esperada

A persistência esperada para H21-A deve continuar obedecendo o modelo operacional da H20:

- Event Store para registrar o evento canônico produzido;
- Outbox para enfileirar a materialização operacional;
- Audit Timeline para trilha executiva;
- Correlation para rastreabilidade fim a fim;
- Idempotency Safe Mode para controle de duplicidade.

### 7.8 Auditoria Esperada

A auditoria da H21-A deve registrar:

- o contexto decisório;
- a política aplicada;
- a estratégia selecionada;
- o resultado produzido;
- os vínculos de correlação e causação;
- o identificador da execução.

## 8. Critérios de Aceite da H21-A

A H21-A só deve ser considerada aceita quando:

- o Decision Runtime estiver implementado sem violar a arquitetura modular do EDP;
- o fluxo de decisão estiver operando dentro do `PrismaEdpUnitOfWork`;
- a persistência operacional permanecer consistente com H20;
- o resultado da decisão for auditável e rastreável;
- Query continuar isolada do fluxo de escrita;
- Idempotency Safe Mode permanecer intacta;
- a definição de eventos e contratos tiver revisão formal;
- testes de unidade, integração e runtime estiverem verdes.

## 9. Riscos Técnicos

Os principais riscos técnicos da H21 são:

- expansão prematura de regra de negócio sem amadurecimento do modelo;
- acoplamento indevido entre decisão e providers;
- fragmentação de contratos por evolução sem ADR;
- aumento de complexidade sem segmentação clara por ondas;
- introdução de múltiplas fontes de verdade;
- quebra de Idempotency Safe Mode durante evolução de comportamento;
- pressão por ativar publisher assíncrono antes da maturidade do núcleo decisório.

## 10. Dependências

A H21 depende de:

- baseline arquitetural e operacional da H19/H20;
- composição modular já consolidada;
- contrato HTTP estável;
- persistência transacional validada;
- Event Store, Outbox, Audit Timeline, Correlation e Idempotency Safe Mode funcionando de forma consistente;
- governança para novas decisões de contrato e catálogo;
- plano formal para qualquer evolução de schema.

## 11. Arquivos Prováveis a Serem Criados ou Alterados Futuramente

Os arquivos abaixo são potenciais candidatos para fases futuras da H21, dependendo da implementação escolhida:

- `backend/src/modules/edp/application/*`
- `backend/src/modules/edp/composition/*`
- `backend/src/modules/edp/presentation/http/*`
- `backend/src/modules/edp/domain/*`
- `backend/src/modules/edp/infrastructure/prisma/*`
- `backend/src/tests/integration/*`
- `backend/src/tests/unit/*`
- `docs/03-decision-platform/*`

## 12. Arquivos Bloqueados Nesta Etapa Documental

Nesta etapa documental, permanecem bloqueados e sem alteração:

- código de produção
- testes
- contratos
- schema Prisma
- migrations
- frontend
- `buildFastifyApp()`

## 13. Plano de Validação

A validação da H21 deve ocorrer por camadas:

1. validação arquitetural da onda;
2. validação de contratos e catálogos;
3. testes unitários dos novos casos de uso;
4. testes de integração da persistência e do runtime;
5. validação HTTP end-to-end;
6. validação de rollback e idempotência;
7. validação de isolamento entre Command e Query;
8. validação de compatibilidade com o baseline H20.

## 14. Recomendação Oficial de Implementação Incremental

A recomendação oficial para a H21 é:

- manter a execução por ondas;
- começar pelo núcleo decisório com H21-A;
- evitar expansão simultânea de múltiplas capacidades;
- preservar o contrato HTTP já estabilizado;
- manter o runtime como única fonte operacional do domínio;
- introduzir cada nova capacidade com testes e validações de ponta a ponta antes da próxima onda.

## 15. Parecer Arquitetural Final

A H21 está arquiteturalmente posicionada para evoluir o EDP de runtime operacional para Business Runtime sem ruptura de base.

O caminho recomendado é incremental, governado por ADRs e orientado por capacidades. A fundação entregue em H19/H20 é suficiente para iniciar a H21 com segurança, desde que as restrições permanentes sejam respeitadas e que cada onda seja validada antes da próxima.

**Parecer final:** **GO para planejamento e início controlado da H21-A**
