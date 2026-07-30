# ARCH-017 - Workspace Ownership Matrix

Status: Proposed
Date: 2026-06-11
Owner: Architecture
Type: Architectural Contract
Project: FINQZ PRO

---

## 1. Objetivo

Definir o ownership oficial dos centers do **Opportunity Workspace** do FINQZ PRO, explicitando responsabilidades, autoridade de escrita, consumidores de leitura, fonte de verdade, anti-patterns e regras de governanca.

Este documento existe para evitar ambiguidade entre superficie de interface, dominio, eventos e persistencia.

Ele complementa o contrato do `ARCH-016` e deve ser lido em conjunto com:

- `ADR-007` - Lead, Customer, Simulation and Opportunity Model
- `ADR-008` - Revenue Distribution Engine
- `ADR-009` - Operation Persistence and Financial Execution Aggregate
- `ARCH-004` - Entities Model
- `ARCH-005` - Relationships
- `ARCH-008` - Operational Events
- `ARCH-009` - RBAC

---

## 2. Principios

### 2.1 Um owner por responsabilidade

Cada center possui um dominio owner primario. A interface pode compor dados de varios dominios, mas a responsabilidade canonica deve ser unica.

### 2.2 Write authority e read consumers sao coisas diferentes

O dominio que escreve nem sempre e o mesmo que consome. O contrato deve deixar essa diferenca explicita.

### 2.3 Workspace nao cria verdade paralela

O Opportunity Workspace e uma superficie operacional. Ele nao cria uma nova fonte de verdade concorrente com Customer, Opportunity, Operation ou Commission.

### 2.4 Multi-tenant e RBAC sao obrigatorios

Toda leitura e escrita devem respeitar tenant, partner scope e permissao.

### 2.5 Auditoria e transversal

Toda acao relevante deve poder ser rastreada por tenant, ator, entidade e evento.

### 2.6 AI Copilot e assistivo, nao soberano

O Copilot pode ler contexto autorizado e sugerir acoes, mas nao assume ownership de dominio.

---

## 3. Owner Domain

### Definicao

`Owner Domain` e o dominio primario responsavel pela regra de negocio, lifecycle e fonte de verdade de cada center.

### Critério

O owner domain e o primeiro responsavel por:

- modelar o estado canonico;
- validar transicoes;
- publicar eventos de dominio;
- sustentar auditoria;
- definir a origem da verdade exibida no center.

---

## 4. Write Authority

### Definicao

`Write Authority` e o conjunto de dominios, servicos ou fluxos autorizados a alterar o estado canonico de um center.

### Regra

- todo write deve passar pelo dominio owner ou por um fluxo formalmente delegado;
- a escrita da interface nao e autoridade de verdade;
- escrita assistida por IA exige confirmacao humana em etapas criticas;
- writes devem gerar evento ou audit log quando relevante.

---

## 5. Read Consumers

### Definicao

`Read Consumers` sao os consumidores que podem ler o estado canonico do center para exibicao, analise, orquestracao ou auditoria.

### Regra

- leitura pode ser mais ampla que escrita;
- leitura sempre respeita tenant e RBAC;
- leitura pode ser agregada, mas nao pode alterar o significado canonico do dado;
- centros do workspace podem compartilhar dados, mas nao ownership.

---

## 6. Source of Truth

### Definicao

`Source of Truth` e o ponto canonico que define o estado valido de cada center.

### Regra

- cada center deve apontar para uma fonte primaria clara;
- fontes derivadas devem ser identificaveis como read model, projection ou resumo;
- o workspace nao deve duplicar campos canonicos sem justificativa de performance ou UX;
- quando existir coexistencia, o documento deve explicitar qual lado e canonico.

---

## 7. Anti-Patterns

### Padroes proibidos

- tratar `Opportunity` como bucket de tudo;
- tratar `Operation` como tela resumida de Opportunity;
- tratar `Commission` como origem do ciclo financeiro;
- tratar `AI Copilot` como ator de negocio;
- duplicar estado canonico em varios centers sem fonte primaria;
- permitir que uma aba escreva dados de outra sem ownership formal;
- usar `Timeline` como substituto de auditoria;
- usar `Documents` como repositório sem owner e sem escopo;
- usar `Settlement` como atalho para esconder pendencias financeiras;
- usar `Executive Summary` como fonte de verdade operacional.

---

## 8. Governance Rules

### Regras obrigatorias

1. Todo center deve ter owner domain definido.
2. Todo write deve ter autoridade clara.
3. Toda leitura sensivel deve respeitar RBAC.
4. Todo dado operacional deve ser tenant-scoped.
5. Todo acesso por partner deve respeitar descendencia e visibilidade.
6. Toda transicao relevante deve emitir evento ou audit log.
7. Toda fonte derivada deve informar origem canonica.
8. Nenhum center pode ser introduzido sem definir responsabilidades de escrita e leitura.
9. Qualquer excecao temporaria de coexistencia deve ser documentada.
10. O workspace nao pode substituir contratos de dominio definidos pelos ADRs.

---

## 9. Multi-tenant

### Regra

Todo center do Opportunity Workspace e inerentemente multi-tenant.

### Consequencias

- `tenantId` deve acompanhar os dados expostos e alterados;
- nenhum center pode consultar estado fora do tenant atual;
- agregacoes entre tenants sao proibidas fora de contexto administrativo formal;
- caches, summaries e projections devem ser segregados por tenant;
- importacoes e eventos devem manter contexto de origem.

### Partner scope

Quando aplicavel, o `partnerId` ou sua hierarquia deve limitar visibilidade e alteracoes.

---

## 10. Auditoria

### Regra

Toda atividade relevante do Opportunity Workspace deve ser auditavel.

### Deve registrar

- tenantId;
- actorId;
- actorType;
- center;
- entityType;
- entityId;
- action;
- before/after quando aplicavel;
- timestamp;
- correlationId ou traceId.

### Princípios

- audit log nao substitui event log;
- event log nao substitui audit log;
- timeline do workspace nao substitui auditoria oficial;
- acoes automatizadas devem ser distinguiveis de acoes humanas.

---

## 11. Matrix Oficial

### 11.1 Executive Summary

| Campo | Definicao |
|---|---|
| Center | Executive Summary |
| Owner Domain | Opportunity |
| Write Authority | Opportunity, Customer, Operation em leitura consolidada; escrita apenas por fluxos de origem |
| Read Consumers | Sales, Operations, Finance, Compliance, Leadership, AI Copilot |
| Source of Truth | Projecoes derivadas de Opportunity, Customer, Simulation, Operation, Commission e Settlement |
| Anti-Patterns | Usar como fonte primaria, editar dados canonicos direto no resumo, esconder inconsistencias |
| Governance Rules | Apenas leitura agregada; qualquer acao deve redirecionar ao center de origem |
| Multi-tenant | Segregacao obrigatoria por tenant |
| Auditoria | Deve registrar acesso quando houver informacao sensivel ou exportacao |

### 11.2 Timeline

| Campo | Definicao |
|---|---|
| Center | Timeline |
| Owner Domain | Audit / Opportunity |
| Write Authority | Todos os dominios de origem que emitem eventos validos |
| Read Consumers | Sales, Operations, Finance, Compliance, Leadership, AI Copilot |
| Source of Truth | Event stream e audit trail correlacionados |
| Anti-Patterns | Editar timeline manualmente, usar timeline como fonte canonica de estado |
| Governance Rules | Apenas eventos e registros auditaveis compoem a linha do tempo |
| Multi-tenant | Um timeline por tenant e por contexto autorizado |
| Auditoria | Cada item relevante deve ter origem, ator e correlação |

### 11.3 Activities

| Campo | Definicao |
|---|---|
| Center | Activities |
| Owner Domain | Opportunity |
| Write Authority | Opportunity, Simulation, Proposal, Operation, Commission, Settlement, AI Copilot com confirmacao |
| Read Consumers | Sales, Operations, Finance, Customer Success, Compliance, Leadership |
| Source of Truth | Eventos operacionais e interacoes registradas no contexto da opportunity |
| Anti-Patterns | Misturar tarefa, evento, comentario e auditoria como a mesma coisa |
| Governance Rules | Atividade deve ser classificavel, temporal e associada a um dono |
| Multi-tenant | Filtragem obrigatoria por tenant e partner scope |
| Auditoria | Atividades relevantes devem ser auditaveis e imutaveis |

### 11.4 Documents

| Campo | Definicao |
|---|---|
| Center | Documents |
| Owner Domain | Documents / Compliance, com ownership contextual do dominio pai |
| Write Authority | Dominios de origem do documento e fluxos documentais autorizados |
| Read Consumers | Sales, Operations, Finance, Compliance, Support, Leadership |
| Source of Truth | Repositorio documental oficial associado ao contexto de negocio |
| Anti-Patterns | Documento sem owner, sem tenant, sem categoria ou sem politicas de acesso |
| Governance Rules | Todo documento deve ter classificacao, owner, escopo e retencao |
| Multi-tenant | Segregacao estrita por tenant e visibilidade por partner quando aplicavel |
| Auditoria | Download, upload, exclusao e visualizacao sensivel devem ser rastreados |

### 11.5 Simulation

| Campo | Definicao |
|---|---|
| Center | Simulation |
| Owner Domain | Simulation |
| Write Authority | Simulation engine, fluxos de calculo e usuario autorizado |
| Read Consumers | Sales, Customer, Opportunity, Proposal, AI Copilot |
| Source of Truth | Resultado canonico da simulacao e seus parametros de entrada |
| Anti-Patterns | Tratar simulacao como opportunity, customer ou operation |
| Governance Rules | Simulacao pode existir sem opportunity e sem customer |
| Multi-tenant | Toda simulacao deve carregar tenantId e contexto de origem |
| Auditoria | Cada simulacao relevante deve ser rastreavel por autor, entrada e resultado |

### 11.6 Proposal

| Campo | Definicao |
|---|---|
| Center | Proposal |
| Owner Domain | Proposal / Operation boundary |
| Write Authority | Proposal flow, provider integration, usuario autorizado e aprovacao interna |
| Read Consumers | Sales, Operations, Finance, Compliance, Leadership |
| Source of Truth | Snapshot de negociacao com provider e condicoes aplicadas |
| Anti-Patterns | Tratar proposal como operation, ou operation como proposal |
| Governance Rules | Toda proposta deve referenciar opportunity e provider quando aplicavel |
| Multi-tenant | Visibilidade e escrita restritas ao tenant e partner scope |
| Auditoria | Solicitacao, resposta, aprovacao e rejeicao devem ser auditaveis |

### 11.7 Operation

| Campo | Definicao |
|---|---|
| Center | Operation |
| Owner Domain | Operation |
| Write Authority | Operation lifecycle, provider integration e fluxos autorizados |
| Read Consumers | Sales, Operations, Finance, Compliance, Leadership, AI Copilot |
| Source of Truth | Agregado financeiro de execucao |
| Anti-Patterns | Usar opportunity como proxy operacional, ou operation sem lifecycle proprio |
| Governance Rules | Operation e a origem canonica para commission e settlement |
| Multi-tenant | Toda operation deve ser tenant-scoped e partner-aware quando aplicavel |
| Auditoria | Criacao, transicao de estado, falha e conclusao devem ser auditaveis |

### 11.8 Commission

| Campo | Definicao |
|---|---|
| Center | Commission |
| Owner Domain | Revenue Distribution Engine |
| Write Authority | Motor de distribuicao, regras de repasse e workflows financeiros autorizados |
| Read Consumers | Finance, Operations, Compliance, Leadership, Partners autorizados |
| Source of Truth | Resultado financeiro derivado de Operation |
| Anti-Patterns | Tratar commission como origem do negocio ou como substituto de operation |
| Governance Rules | Commission deve nascer de operation elegivel e validada |
| Multi-tenant | Isolamento estrito por tenant e regras de partner scope |
| Auditoria | Calculo, liberacao, pagamento e ajustes devem ser auditaveis |

### 11.9 Settlement

| Campo | Definicao |
|---|---|
| Center | Settlement / Payment |
| Owner Domain | Finance / Settlement |
| Write Authority | Fluxos financeiros autorizados, conciliacao e integracoes de pagamento |
| Read Consumers | Finance, Operations, Compliance, Leadership |
| Source of Truth | Estado de liquidacao e pagamento associado a commission e operation |
| Anti-Patterns | Usar settlement para esconder pendencias, ou como substituto de commission |
| Governance Rules | Settlement depende de elegibilidade, aprovacao e rastreabilidade |
| Multi-tenant | Toda operacao financeira deve ser segregada por tenant |
| Auditoria | Pagamento, conciliacao, cancelamento e falha devem ser auditaveis |

### 11.10 AI Copilot

| Campo | Definicao |
|---|---|
| Center | AI Copilot |
| Owner Domain | AI Assistance / Workspace Experience |
| Write Authority | Nao possui autoridade soberana; escreve apenas via acao humana confirmada |
| Read Consumers | Usuarios autorizados em contexto do workspace |
| Source of Truth | Nao e fonte de verdade; depende dos dominios canonicos |
| Anti-Patterns | IA escrevendo estado critico sem confirmacao, ou inferindo fatos como verdade oficial |
| Governance Rules | Sugestoes devem ser contextuais, rastreaveis e respeitar RBAC |
| Multi-tenant | Contexto estritamente limitado ao tenant ativo |
| Auditoria | Sugestoes, acessos a contexto e acoes confirmadas devem ser rastreaveis |

---

## 12. Regras Especificas por Center

### Executive Summary

- apenas leitura consolidada;
- nao pode corrigir dados de origem;
- deve apontar inconsistencias para centers proprietarios.

### Timeline

- deve refletir eventos e mudancas auditaveis;
- nao pode ser editada manualmente como dado canonico.

### Activities

- deve ser o espaco de acompanhamento operacional;
- nao pode substituir auditoria nem task management oficial, se existir.

### Documents

- deve respeitar classificacao, retenção e escopo;
- nao pode ser um dump de arquivos sem governanca.

### Simulation

- pode ser independente;
- nao deve herdar responsabilidades de opportunity ou operation.

### Proposal

- deve permanecer como negociacao/validacao;
- nao pode se tornar o estado final financeiro.

### Operation

- deve ser a linha canonica de execucao;
- nao deve absorver comissao ou settlement como conceitos secundarios sem contrato.

### Commission

- deve derivar de operation;
- nao deve ser editada como fonte primaria de negocio.

### Settlement

- deve refletir liquidacao real;
- nao pode mascarar pendencias de comissao ou operation.

### AI Copilot

- deve apoiar, nunca governar;
- deve ser transparente sobre o que sabe, o que sugere e o que nao pode afirmar.

---

## 13. Conclusao

O Opportunity Workspace so permanece enterprise se cada center respeitar seu owner domain, sua autoridade de escrita e sua fonte de verdade.

Este matrix documenta a divisao oficial de responsabilidades para impedir que o workspace se torne um novo monolito de interface ou uma segunda camada de verdade paralela.

---

## Referencias Oficiais

- `ADR-007` - Lead, Customer, Simulation and Opportunity Model
- `ADR-008` - Revenue Distribution Engine
- `ADR-009` - Operation Persistence and Financial Execution Aggregate
- `ARCH-004` - Entities Model
- `ARCH-005` - Relationships
- `ARCH-008` - Operational Events
- `ARCH-009` - RBAC
- `ARCH-016` - Opportunity Workspace Blueprint
