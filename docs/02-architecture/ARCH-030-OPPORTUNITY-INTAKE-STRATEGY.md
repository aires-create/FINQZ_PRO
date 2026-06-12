# ARCH-030 - Opportunity Intake Strategy

## 1. Objetivo

Formalizar a estrategia arquitetural de `Opportunity Intake` do FINQZ PRO como canal de entrada comercial, preservando a regra central de que `Customer` continua sendo a fonte unica de verdade cadastral.

Este documento define como o intake deve operar para:

- localizar `Customer` existente quando possivel;
- criar `Customer` quando inexistente e permitido;
- criar `Opportunity` a partir do contexto de entrada;
- manter separacao clara entre captura comercial e verdade cadastral;
- evitar que o intake se torne uma fonte paralela de cadastro.

## 2. Escopo

Este documento cobre apenas a estrategia conceitual de intake comercial.

Inclui:

- relacao entre intake, Customer e Opportunity;
- fluxo operacional de entrada;
- fluxo de criacao;
- fluxo de vinculacao;
- regras de deduplicacao;
- responsabilidades do dominio;
- fluxo futuro `Lead -> Intake -> Customer -> Opportunity`;
- decisao arquitetural consolidada.

Nao inclui:

- alteracao de schema;
- criacao de migration;
- implementacao de runtime;
- endpoint;
- service;
- handler;
- repository;
- controller;
- alteracao de frontend.

## 3. Relacao com Customer

`Customer` permanece como a fonte unica de verdade cadastral do FINQZ PRO.

### Regras oficiais

- `Opportunity Intake` pode localizar `Customer` existente;
- `Opportunity Intake` pode criar `Customer` quando inexistente;
- `Opportunity Intake` nao pode editar `Customer` existente;
- `Opportunity Intake` nao pode excluir `Customer`;
- `Opportunity Intake` nao pode redefinir atributos canonicos de cadastro;
- `Opportunity Intake` nao pode se tornar fonte de verdade do cadastro.

### Interpretacao arquitetural

O intake e um canal de captura e resolucao de contexto comercial, nao um dominio cadastral soberano.

Se um `Customer` ja existir, o intake apenas o referencia.

Se um `Customer` nao existir, o intake pode disparar a criacao de um novo `Customer` conforme as regras oficiais de cadastro, mas nao pode manter uma segunda versao concorrente do mesmo cadastro.

## 4. Relacao com Opportunity

`Opportunity` continua sendo a unidade operacional comercial derivada do contexto de negocio.

### Regras oficiais

- `Opportunity Intake` pode criar `Opportunity`;
- `Opportunity Intake` pode associar a oportunidade a um `Customer` localizado ou criado;
- `Opportunity Intake` nao substitui o lifecycle de `Opportunity`;
- `Opportunity Intake` nao define, por si so, a verdade final da oportunidade;
- `Opportunity Intake` serve como ponto de entrada para materializacao comercial.

### Leitura arquitetural

`Opportunity` e o resultado operacional que nasce do intake. O intake nao compete com `Opportunity`; ele alimenta sua criacao.

## 5. Fluxo operacional

O fluxo operacional de `Opportunity Intake` deve seguir a logica de entrada, resolucao e materializacao.

### Etapas canonicas

1. Receber dados do canal de entrada comercial.
2. Normalizar identificadores e chaves de busca.
3. Procurar `Customer` existente por criterios aprovados.
4. Resolver se o contexto pertence a um `Customer` existente ou se exige criacao.
5. Criar `Customer` quando nao houver correspondencia e o fluxo permitir.
6. Criar `Opportunity` vinculada ao `Customer` resolvido.
7. Registrar os elementos de origem comercial de forma rastreavel.

### Regra

O intake pode compor uma sequencia de resolucao, mas nao pode assumir propriedade cadastral plena.

## 6. Fluxo de criacao

O fluxo de criacao ocorre quando o intake identifica que nao existe `Customer` elegivel para o contexto recebido.

### Regras

- a criacao de `Customer` deve ser derivada de um intake valido;
- a criacao de `Customer` nao deve inventar um registro paralelo sem governanca;
- a criacao de `Opportunity` pode acontecer no mesmo fluxo conceitual;
- a criacao da oportunidade deve manter rastreabilidade para a origem do intake;
- o intake nao pode criar `Customer` para depois sobrescrever manualmente dados canonicos sem contrato formal.

### Leitura arquitetural

O intake e um ponto de nascimento possivel do cadastro e da oportunidade, mas nunca a fonte primaria definitiva do cadastro.

## 7. Fluxo de vinculacao

O fluxo de vinculacao ocorre quando o intake encontra um `Customer` ja existente.

### Regras

- o `Customer` existente deve ser tratado como canonico;
- o intake deve vincular a nova `Opportunity` ao `Customer` existente;
- o intake pode acumular contexto adicional do canal, mas nao deve reescrever o cadastro;
- qualquer divergencia entre entrada e cadastro existente deve ser tratada como evento de resolucao, nao como edicao silenciosa.

### Leitura arquitetural

Vincular nao e editar. O intake resolve o encaixe entre entrada comercial e identidade cadastral oficial.

## 8. Regras de deduplicacao

Deduplicacao e a estrategia de evitar duplicidade de `Customer` e de reduzir risco de duplicidade de `Opportunity` criada a partir do mesmo intake.

### Criterios conceituais de deduplicacao

- documento fiscal normalizado quando aplicavel;
- email normalizado quando disponivel;
- telefone quando for criterio auxiliar e permitido;
- combinacao de chaves cadastrais validas para o dominio;
- contexto de tenant e escopo de visibilidade.

### Regras oficiais

- deduplicacao deve favorecer o `Customer` canonico;
- deduplicacao nao pode apagar registros canonicos existentes;
- deduplicacao nao pode fundir identidades sem contrato formal;
- deduplicacao nao pode ser baseada apenas em heuristica opaca quando houver ambiguidade relevante;
- se houver conflito entre candidatos, o fluxo deve pedir resolucao autorizada.

### Consequencia

O intake pode resolver candidato, mas nao deve assumir que toda similaridade implica igualdade cadastral.

## 9. Responsabilidades do dominio

### 9.1 Customer

Responsabilidades de `Customer`:

- manter a identidade cadastral oficial;
- servir como registro principal de pessoa fisica ou juridica;
- preservar unicidade e coerencia cadastral;
- aceitar criacao formal quando o intake nao encontrar correspondente.

### 9.2 Opportunity

Responsabilidades de `Opportunity`:

- representar a oportunidade comercial;
- ser criada a partir do contexto de intake;
- manter seu lifecycle proprio;
- referenciar o `Customer` canonico.

### 9.3 Opportunity Intake

Responsabilidades do intake:

- receber a entrada comercial;
- localizar ou viabilizar a criacao do `Customer`;
- criar `Opportunity`;
- manter rastreabilidade da origem;
- respeitar as fronteiras de ownership;
- nao editar nem excluir `Customer` existente.

### 9.4 Limite estrutural

O intake e um canal de orquestracao comercial, nao um dominio cadastral.

## 10. Fluxo futuro Lead -> Intake -> Customer -> Opportunity

O fluxo futuro pode ser entendido como uma cadeia de amadurecimento comercial.

### Sequencia conceitual

```text
Lead -> Opportunity Intake -> Customer -> Opportunity
```

### Leitura funcional

- `Lead` representa sinal ou prospeccao inicial;
- `Opportunity Intake` representa canal de entrada comercial e resolucao;
- `Customer` representa a identidade oficial consolidada;
- `Opportunity` representa a materializacao comercial operavel.

### Regra de evolucao

Se o fluxo futuro usar `Lead`, ele deve continuar respeitando:

- `Customer` como source of truth cadastral;
- `Opportunity` como unidade operacional comercial;
- `Intake` como canal de entrada, e nao como cadastro soberano.

### Consequencia arquitetural

O intake pode receber contexto vindo de Lead ou de outros canais, mas a escrita final de cadastro deve sempre obedecer a governanca de `Customer`.

## 11. Decisao arquitetural consolidada

### Decisao oficial

`Opportunity Intake` e um canal de entrada comercial que pode localizar `Customer` existente, criar `Customer` quando inexistente e criar `Opportunity`, mas nao pode editar ou excluir `Customer` existente nem assumir a fonte de verdade do cadastro.

### Implicacao pratica

- `Customer` continua sendo a verdade cadastral;
- `Opportunity` continua sendo a verdade comercial operacional;
- `Opportunity Intake` e a porta de entrada que conecta os dois sem competir com eles;
- qualquer enriquecimento adicional deve ser tratado como derivacao governada, nao como cadastro paralelo.

### Regra de ouro

Se uma regra do intake conflitar com a fonte unica de verdade cadastral, a fonte unica de verdade prevalece.
