# ARCH-059 - Commercial Structure UX & Navigation Architecture

Status: PROPOSED

## 1. Contexto

A evolucao arquitetural da fase H-13 consolidou as fronteiras corretas entre os dominios do FINQZ PRO.

O fluxo de aprovacoes estabelece o seguinte encadeamento conceitual:

- H-13A: consolidacao do problema operacional da Estrutura Comercial;
- H-13B: definicao da necessidade de uma camada de elegibilidade/cobertura;
- H-13E: aprovacao da arquitetura da cobertura operacional;
- ADR-MCAT-004: validacao da taxonomia oficial do Master Catalog.

As decisoes consolidadas definem que:

- `Product -> Subproduct -> Modality` e a taxonomia oficial;
- `Segment` e uma dimensao paralela;
- Master Catalog responde ao que existe;
- Commercial Structure Coverage responde onde pode vender;
- Commercial Tables respondem como vende;
- Provider Engine responde quem executa;
- Intelligent Simulator responde quanto libera, quanto ganha e qual melhor oferta.

O problema central da UX atual e que a Estrutura Comercial ainda pode ser percebida como uma arvore de catalogo, quando sua funcao oficial e representar cobertura operacional.

## 2. Principio Central

A Estrutura Comercial e o **Mapa Oficial de Cobertura Comercial**.

Ela nao e:

- catalogo;
- tabela comercial;
- provider;
- simulador.

Sua missao e responder uma unica pergunta operacional:

- `POSSO VENDER?`

## 3. Ponto de Entrada Oficial

O ponto de entrada oficial da Estrutura Comercial e `Segmento / Convenio`.

Exemplos:

- INSS
- FGTS
- CLT
- Servidor Publico
- Forcas Armadas
- Prefeituras
- Governos

A motivacao e simples:

- e assim que a operacao pensa;
- e assim que a cobertura precisa ser consultada;
- e assim que a navegacao deve ser organizada.

## 4. Jornada Oficial do Usuario

Fluxo operacional recomendado:

```txt
Segmento
↓
Produto Elegivel
↓
Subproduto Elegivel
↓
Modalidade Elegivel
```

Pergunta respondida:

- `Posso vender?`

Essa jornada nao deve ser confundida com precificacao, comissao, taxa ou simulacao financeira.

## 5. Visao Segmento

Ao clicar em um segmento, a interface deve apresentar a cobertura operacional daquele contexto.

Exemplo conceitual:

```txt
INSS
  ✓ Consignado
    ✓ Empréstimo Consignado
      ✓ Novo
      ✓ Refin
      ✓ Portabilidade
  ✓ Cartao RMC
  ⚠ Cartao Beneficio
```

Comportamento esperado:

- itens ativos aparecem como elegiveis;
- itens suspensos aparecem como bloqueados naquele contexto;
- itens inativos aparecem como nao disponiveis;
- o usuario deve enxergar cobertura e bloqueio, nao apenas estrutura.

## 6. Visao Produto

Ao clicar em um produto, a interface deve mostrar a cobertura reversa:

Exemplo:

```txt
Cartao Beneficio

Ativo:
✓ Prefeitura SP
✓ Governo MG

Suspenso:
⚠ INSS
```

Comportamento esperado:

- o produto mostra em quais segmentos existe cobertura;
- o produto mostra onde esta suspenso ou inativo;
- a visao deve permitir localizar rapidamente o impacto operacional de uma mudanca.

## 7. Visao Modalidade

Ao clicar em uma modalidade, a interface deve mostrar cobertura por segmento.

Exemplo:

```txt
Portabilidade

Disponivel:
✓ INSS
✓ Servidor Publico

Nao elegivel:
✗ FGTS
```

Comportamento esperado:

- a modalidade precisa ser rastreavel por segmento;
- o usuario deve enxergar disponibilidade, suspensao e inatividade;
- a visao deve evitar qualquer inferencia manual no frontend.

## 8. Busca Global

A busca global e obrigatoria.

Ela deve permitir localizar:

- `Segmento`
- `Produto`
- `Subproduto`
- `Modalidade`

O resultado da busca deve retornar a cobertura operacional associada ao termo encontrado.

Regra de UX:

- busca por nome deve encontrar o item;
- busca por codigo deve encontrar o item;
- busca por termo operacional deve revelar o contexto de cobertura;
- o resultado precisa indicar se o item esta ativo, suspenso ou inativo.

## 9. Estados Operacionais

Os estados visuais oficiais da Estrutura Comercial devem ser:

- `ACTIVE`
- `SUSPENDED`
- `INACTIVE`

Representacao visual esperada:

- `🟢 Ativo`
- `🟡 Suspenso`
- `🔴 Inativo`

Esses estados devem comunicar cobertura operacional, nao status de precificacao.

## 10. Informacoes Permitidas

A Estrutura Comercial pode exibir:

- status;
- motivo;
- vigencia;
- ultima atualizacao;
- cobertura.

Esses dados sao suficientes para responder a pergunta operacional.

## 11. Informacoes Proibidas

A Estrutura Comercial nao deve exibir como conteudo principal de cobertura:

- taxa;
- coeficiente;
- comissao;
- banco;
- provider;
- tabela comercial.

Esses dados pertencem a outros dominios ou a outra camada de navegacao.

## 12. Relacao com Coverage Matrix

A Estrutura Comercial consome a Coverage Matrix.

Ela:

- nao define regras;
- nao e source of truth;
- nao substitui a camada de cobertura;
- nao deve inferir a regra sozinha.

Se houver divergencia, a Estrutura Comercial deve refletir a Coverage Matrix, nao contrari-la.

## 13. Relacao com Tabelas Comerciais

A fronteira oficial e:

- Estrutura Comercial responde `Posso vender?`
- Tabelas Comerciais respondem `Em quais condicoes vendo?`

Isso significa que a Estrutura Comercial:

- valida cobertura;
- navega o contexto operacional;
- nao resolve precificacao;
- nao resolve comissao;
- nao resolve coeficiente.

## 14. Relacao com Simulador

A Estrutura Comercial e a porta de entrada da cobertura.

O Simulador e a camada de calculo.

Regra:

- Estrutura Comercial valida se ha cobertura;
- Simulador calcula quanto libera e quanto ganha.

O Simulador nao deve ser usado como substituto da navegacao de cobertura.

## 15. Personas

### Parceiro

Objetivo principal:

- entender rapidamente o que pode vender em um segmento.

### Supervisor

Objetivo principal:

- auditar cobertura, bloqueios e vigencias.

### BKO

Objetivo principal:

- localizar inconsistencias operacionais e restricoes.

### Gestor Comercial

Objetivo principal:

- enxergar cobertura por segmento e impacto comercial.

### Produtos

Objetivo principal:

- governar cobertura, disponibilidade e excecoes.

### Operacoes

Objetivo principal:

- executar e validar o fluxo com menor ambiguidade possivel.

## 16. Riscos de UX

- transformar a Estrutura Comercial em catalogo;
- esconder cobertura dentro de tabelas;
- exibir preco, taxa ou comissao como conteudo principal da navegacao;
- misturar provider com cobertura;
- permitir que o frontend infira regra;
- perder clareza sobre o que esta ativo, suspenso ou inativo;
- criar uma arvore bonita que nao responde a pergunta operacional.

## 17. Nao Objetivos

Esta fase nao:

- substitui o Master Catalog;
- substitui Tabelas Comerciais;
- substitui Provider Engine;
- substitui o Simulador;
- cria regra no frontend;
- altera a modelagem de dados;
- altera runtime;
- altera telas existentes;
- altera store;
- altera schema;
- altera backend.

## 18. Final Verdict

GO

## 19. Decisao Final

A Estrutura Comercial passa oficialmente a representar a navegacao e a visualizacao da cobertura operacional do FINQZ PRO, mantendo-se separada do catalogo canonico, das tabelas comerciais, do provider e da simulacao financeira.
