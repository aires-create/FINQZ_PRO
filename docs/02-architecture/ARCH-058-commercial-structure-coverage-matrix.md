# ARCH-058 - Commercial Structure Coverage Matrix

Status: PROPOSED

## 1. Contexto

O FINQZ PRO consolidou o Master Catalog como dominio canonico para descrever a oferta comercial oficial.

As decisoes arquiteturais aprovadas estabelecem que:

- `Product -> Subproduct -> Modality` e a hierarquia oficial do Master Catalog;
- `Segment` e uma dimensao paralela, nao um pai fisico de `Product`;
- o catalogo mestre descreve o que existe;
- a Estrutura Comercial deve descrever onde e como a operacao comercial enxerga cobertura;
- as Tabelas Comerciais devem descrever condicoes, taxas, prazos, comissoes e coeficientes;
- o Simulador Inteligente futuro devera responder quanto libera e quanto ganha.

O ponto critico desta fase e explicitar a camada operacional de cobertura comercial sem corromper o Master Catalog.

Hoje a tela de Estrutura Comercial consegue exibir a estrutura catalogada, mas nao representa com clareza a cobertura operacional real por segmento.

Em termos praticos, a operacao precisa conseguir responder perguntas como:

- o que INSS pode vender?
- o que FGTS pode vender?
- onde Cartao Beneficio esta ativo, suspenso ou inativo?
- onde Portabilidade esta permitida?
- como desfazer o vinculo operacional de um subproduto sem afetar o catalogo global?

Esse documento define a arquitetura conceitual da `Commercial Structure Coverage Matrix` como camada operacional separada.

## 2. Problema

O modelo atual mostra o que existe, mas nao mostra de forma suficiente o que pode ser vendido em cada contexto operacional.

Isso cria uma lacuna entre:

- catalogo canonico;
- tabela comercial;
- provider;
- decisao de elegibilidade;
- experiencia operacional da Estrutura Comercial.

Exemplo critico:

- `Cartao Beneficio` pode estar suspenso para `INSS`;
- isso nao significa que `Cartao Beneficio` esteja inativo globalmente;
- o mesmo item pode continuar ativo para outro segmento, como Prefeitura ou Servidor Publico.

Sem uma camada operacional de cobertura:

- o catalogo acaba sendo usado como se fosse regra de negocio;
- a tabela comercial vira proxy de elegibilidade;
- o provider passa a parecer source of truth;
- o frontend pode ser pressionado a inferir regras;
- o bloqueio de um segmento pode contaminar o catalogo global.

## 3. Decisao

Criar o conceito de `Commercial Structure Coverage Matrix` como camada operacional de Estrutura Comercial.

Essa matriz representa a cobertura por contexto entre:

- `Segment`
- `Product`
- `Subproduct`
- `Modality`

com estados operacionais que indicam se o item esta disponivel, bloqueado ou fora de cobertura.

Essa camada:

- nao e Master Catalog;
- nao e Tabelas Comerciais;
- nao e Provider Engine;
- nao e Simulador.

Ela existe para responder a pergunta operacional:

- `Posso vender?`

## 4. Nao Objetivos

Esta arquitetura nao:

- altera o Master Catalog;
- cria `Product.segmentId`;
- transforma `Segment` em pai fisico de `Product`;
- coloca regra de cobertura em Tabelas Comerciais;
- coloca regra de cobertura no frontend;
- mistura provider com catalogo canonico;
- altera schema;
- cria migration;
- cria API;
- cria seed;
- altera backend runtime.

## 5. Responsabilidades por Dominio

### 5.1 Master Catalog

Responsavel por responder:

- o que existe;
- qual e a estrutura oficial da oferta;
- qual e a hierarquia canonica.

### 5.2 Estrutura Comercial / Coverage Matrix

Responsavel por responder:

- onde pode vender;
- o que esta ativo, suspenso ou inativo por contexto;
- qual cobertura operacional existe entre segmento e oferta.

### 5.3 Tabelas Comerciais

Responsavel por responder:

- com quais condicoes se vende;
- quais taxas aplicar;
- quais prazos, comissoes e coeficientes usar;
- como operacionalizar uma oferta ja elegivel.

### 5.4 Provider Engine

Responsavel por responder:

- como executar no banco ou no provider;
- como traduzir taxonomias externas;
- como aplicar restricoes ou traducao operacional.

### 5.5 Simulador Inteligente

Responsavel por responder:

- quanto libera;
- quanto ganha;
- qual e a melhor oferta.

## 6. Modelo Conceitual

A entidade conceitual base desta arquitetura e o `Coverage Link`.

Campos conceituais:

- `tenantId`
- `segmentId`
- `productId`
- `subproductId` opcional
- `modalityId` opcional
- `status`
- `validFrom` opcional
- `validTo` opcional
- `reason` opcional
- `priority` opcional
- `source` opcional
- `audit metadata` futuro

Esse link nao representa catalogo. Ele representa cobertura operacional.

## 7. Granularidade

A cobertura deve permitir os seguintes niveis:

1. `Segment + Product`
2. `Segment + Product + Subproduct`
3. `Segment + Product + Subproduct + Modality`

Essa granularidade e necessaria para que a operacao consiga:

- liberar um produto inteiro para um segmento;
- bloquear apenas um subproduto;
- bloquear apenas uma modalidade;
- preservar o catalogo global intacto.

## 8. Precedencia

A regra conceitual de precedencia deve seguir estes principios:

- filho herda status do pai;
- bloqueio em nivel superior bloqueia descendentes;
- `child active` nao sobrescreve `parent suspended` ou `parent inactive` sem override explicito futuro;
- a regra mais especifica so vence se os ancestrais nao estiverem bloqueados.

Isso evita estados contraditorios como:

- produto bloqueado, mas modalidade ativa;
- subproduto suspenso, mas um filho tentando operar como ativo;
- cobertura conflitante entre niveis da mesma arvore.

## 9. Status Operacional

Os estados operacionais devem ser entendidos assim:

### ACTIVE

Cobertura disponivel para operacao naquele contexto.

### SUSPENDED

Cobertura temporariamente bloqueada por decisao operacional ou comercial, normalmente com motivo e possibilidade de retorno.

### INACTIVE

Cobertura nao disponivel de forma operacional no momento, sem indicar necessariamente uma suspensao temporaria.

### NON_ELIGIBLE

Resultado computado quando nao existe cobertura efetiva para aquele contexto.

### ARCHIVED / deletedAt

Lifecycle tecnico do registro, nao um status de negocio.

## 10. UX Esperada

### Ao clicar em INSS

A interface deve mostrar:

- produtos vinculados ao segmento;
- subprodutos vinculados ao produto;
- modalidades vinculadas ao subproduto;
- status de cada item;
- motivo do status, quando existir;
- vigencia, quando existir.

### Ao clicar em Cartao Beneficio

A interface deve mostrar:

- todos os segmentos onde o item existe;
- o status em cada segmento;
- o motivo da cobertura ou bloqueio;
- a vigencia aplicavel por contexto.

### Ao clicar em Portabilidade

A interface deve mostrar:

- cobertura por segmento;
- em quais contextos esta ativa;
- em quais esta suspensa;
- em quais esta inativa;
- quem aplica a restricao, se houver overlay futuro.

Essa UX representa cobertura operacional, nao apenas uma arvore catalogada.

## 11. Relacao com Tabelas Comerciais

As Tabelas Comerciais:

- consomem a Coverage Matrix;
- nao definem elegibilidade canonica;
- nao devem autorizar venda se o vinculo estiver suspenso;
- nao podem virar catalogo paralelo.

Se uma tabela estiver ativa, mas a cobertura do contexto estiver suspensa, a cobertura deve vencer para a pergunta `Posso vender?`.

As tabelas continuam sendo a camada de:

- condicoes;
- precificacao;
- prazo;
- comissao;
- coeficiente.

## 12. Relacao com Provider Engine

O Provider Engine:

- pode restringir execucao;
- pode traduzir taxonomias externas;
- pode aplicar overlay operacional;
- nao e dono da cobertura canonica.

Provider-specific constraints devem ser tratados como overlay futuro, nao como verdade primitiva da cobertura.

Isso evita que provider vire source of truth do negocio.

## 13. Relacao com Opportunity e Simulation

### Opportunity

Deve consultar a cobertura antes de permitir criacao ou avancar com oferta.

### Simulation

Deve validar cobertura antes de simular.

### Regra

Nenhum dos dois deve inferir regra sozinho no frontend.

Se a cobertura nao existir ou estiver bloqueada, o fluxo deve receber essa resposta da camada apropriada, nao deduzi-la por heuristica visual.

## 14. Riscos

- duplicar o catalogo;
- transformar `Segment` em pai fisico;
- colocar regra em Tabelas Comerciais;
- deixar provider virar catalogo;
- hardcode no frontend;
- perder tenant scope;
- inativar item global indevidamente;
- perder auditabilidade;
- criar contradicao entre arvore visual e regra operacional.

## 15. Impacto Futuro

A implementacao futura desta arquitetura devera exigir:

- migration;
- repository;
- service;
- read API;
- seed inicial;
- UI de cobertura;
- audit log.

Esta fase, contudo, nao autoriza nenhuma implementacao.

## 16. Final Verdict

GO WITH RESTRICTIONS

## 17. Decisao Final

O FINQZ PRO deve tratar `Commercial Structure Coverage Matrix` como a camada operacional que responde a pergunta `Posso vender?`, mantendo o Master Catalog como fonte canonica do que existe e mantendo Tabelas Comerciais, Provider Engine e Simulador em seus respectivos papeis.
