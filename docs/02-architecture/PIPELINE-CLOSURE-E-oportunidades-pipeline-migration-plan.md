# PIPELINE-CLOSURE-E - Oportunidades Pipeline Migration Plan

Status: APPROVED WITH RESTRICTIONS  
Type: Architecture Decision / Migration Plan  
Scope: Oportunidades Runtime / Pipeline Legacy Reduction / Frontend Migration Boundaries  
Date: 2026-06-23

---

## 1. Executive Verdict

`GO WITH RESTRICTIONS` para planejamento e preparacao da migracao.

`NO-GO` para alterar runtime agora.

Motivos confirmados:

- `src/pages/Oportunidades.tsx` e o consumidor runtime dominante do legado de Pipeline;
- a pagina ainda depende de `catalogRepository`, `currentPipelineId`, `pipelines` do store, `ETAPAS_PIPELINE`, `getPipelineStages()` e `mapearProdutoLegadoParaPipeline()`;
- a API oficial e o backend oficial ja existem e devem ser preservados como `KEEP`;
- a migracao precisa ser feita em ondas pequenas, com adapter temporario e sem alterar store, catalogRepository ou config neste momento.

---

## 2. Matriz de Dependencias

| Dependencia legada | Trechos de `Oportunidades.tsx` que dependem | Papel atual | Classificacao |
|---|---|---|---|
| `catalogRepository` | import em [`src/pages/Oportunidades.tsx`](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L18); uso de `getPipelineStages()` em linha 361; uso de `getPipelineStageColor()` em linha 2073 | Resolve stages e cores a partir de configuracao local | `QUARANTINE` |
| `currentPipelineId` | uso em linhas 600, 694-701, 759-789, 1562, 2042, 2502, 2856, 3097, 3111, 3117, 3134, 3142, 3153, 5771 | Define pipeline corrente, fallback e selecao de formulario | `QUARANTINE` |
| `pipelines` do store | uso em linhas 598, 619, 3110 | Mantem lista operacional de pipelines ainda consumida pela pagina | `QUARANTINE` |
| `ETAPAS_PIPELINE` | definicao em linha 396; uso em 2079, 2231, 2399, 2432, 3482, 3618 | Fallback de etapas quando a resolucao oficial nao cobre o caminho | `QUARANTINE` / `REMOVE LATER` |
| `getPipelineStages()` | uso em linha 361 | Le stages por pipeline a partir do `catalogRepository` | `QUARANTINE` |
| `mapearProdutoLegadoParaPipeline()` | uso em linha 2277 | Heuristica de compatibilidade para produto legado -> pipeline | `QUARANTINE` / `REMOVE LATER` |

Dependencias oficiais ja presentes e que devem ser mantidas:

- [`src/api/modules/pipelines.api.ts`](C:/Projects/FINQZ_PRO/src/api/modules/pipelines.api.ts#L8)
- [`backend/src/modules/pipelines/**`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L90)
- [`backend/prisma/schema.prisma`](C:/Projects/FINQZ_PRO/backend/prisma/schema.prisma#L463)

---

## 3. Quais Trechos Dependem de Cada Legado

### `catalogRepository`

Trechos afetados:

- import de `getPipelineStages` e `getPipelineStageColor`
- resolucao de stages em `getPipelineStages(pipelineId)`
- colorizacao de stage em `getPipelineStageColor(currentPipelineConfig.id, stageName, index)`

Impacto:

- sem `catalogRepository`, a pagina perde resolucao local de etapas e cores;
- a UI de oportunidade fica sem fallback operacional para stages.

### `currentPipelineId`

Trechos afetados:

- carregamento da pipeline corrente via store;
- selecao de pipeline valida no startup;
- default do form de oportunidade;
- troca de pipeline ao editar/excluir;
- rotas que dependem do pipeline atual.

Impacto:

- sem `currentPipelineId`, a pagina perde contexto operacional de pipeline;
- varios fluxos de formulario e selecao ficam sem referencia;
- remocao prematura quebra a navegacao funcional da pagina.

### `pipelines` do store

Trechos afetados:

- lista operacional em memoria;
- selecao de pipeline ativa;
- adicao/edicao/exclusao local;
- escolhas derivadas do pipeline corrente.

Impacto:

- sem `pipelines`, a pagina perde a lista que ainda usa para transicao;
- a experiencia atual pode ficar sem dados para montar a navegacao e a selecao.

### `ETAPAS_PIPELINE`

Trechos afetados:

- fallback de etapas;
- simulacao de fluxo;
- renderizacao de listas e loops de etapas.

Impacto:

- sem `ETAPAS_PIPELINE`, qualquer caminho sem stages oficiais resolvidos fica sem seguranca;
- a tela pode deixar de renderizar corretamente em cenarios incompletos.

### `getPipelineStages()`

Trechos afetados:

- resolucao das etapas no topo da pagina.

Impacto:

- sem essa funcao, o caminho atual de stage cai diretamente no fallback ou quebra;
- a migracao precisa de um resolver oficial antes de remover.

### `mapearProdutoLegadoParaPipeline()`

Trechos afetados:

- heuristica que ancora oportunidade legada em pipeline semantico.

Impacto:

- sem o mapper, oportunidades antigas podem deixar de cair no pipeline esperado;
- a compatibilidade com dados legados fica comprometida.

---

## 4. Qual Dependencia Pode Ser Removida Primeiro

A primeira candidata segura a remocao e `mapearProdutoLegadoParaPipeline()`, mas somente depois de introduzirmos um adapter temporario que explicite a relacao entre a oportunidade e a pipeline oficial.

Por que ela vem primeiro:

- e a dependencia mais localizada;
- possui um unico uso runtime principal em `Oportunidades.tsx`;
- e uma heuristica de compatibilidade, nao o eixo central de selecao da pagina.

Restricao:

- nao pode ser removida antes que o consumer tenha um substituto oficial para resolver a pipeline sem depender de produto legado.

---

## 5. Qual Dependencia Nao Pode Ser Removida Ainda

Nao pode ser removido ainda:

- `currentPipelineId`
- `pipelines` do store

Motivo:

- essas duas dependencias ainda sustentam a selecao funcional, os defaults da pagina e a navegacao operacional de `Oportunidades.tsx`.

Em termos práticos:

- primeiro precisamos reduzir a dependencia da heuristica e do fallback de stages;
- depois podemos cortar o estado operacional do store.

---

## 6. Ordem Segura de Migracao

### Wave 1 - Introduzir adapter temporario e isolar a leitura oficial

Objetivo:

- manter o runtime igual;
- criar uma ponte clara entre o payload oficial de Pipeline e a estrutura esperada por `Oportunidades.tsx`;
- reduzir o uso de heuristica direta no corpo da pagina.

Escopo permitido:

- criar adapter/mapper temporario em camada local do consumer;
- usar a API oficial como fonte de leitura;
- preservar fallback enquanto houver consumer dependente.

Escopo proibido:

- alterar `store`;
- alterar `catalogRepository`;
- alterar `config/pipelines.ts`;
- alterar backend;
- remover `ETAPAS_PIPELINE` ainda.

### Wave 2 - Remover `mapearProdutoLegadoParaPipeline()`

Objetivo:

- retirar a heuristica de produto legado da pagina;
- manter apenas o resolver oficial/adaptado.

### Wave 3 - Remover `getPipelineStages()` e `ETAPAS_PIPELINE`

Objetivo:

- substituir fallback por stages oficiais;
- eliminar a dependencia do `catalogRepository` para o fluxo de oportunidade.

### Wave 4 - Remover `currentPipelineId` e `pipelines` como estado operacional

Objetivo:

- reduzir o store a estado estritamente de UI, se ainda necessario;
- eliminar ownership operacional de Pipeline no frontend global.

### Wave 5 - Remover `catalogRepository` e reduzir `config/pipelines.ts`

Objetivo:

- eliminar persistencia local de Pipeline;
- remover heuristicas e compatibilidade legada restantes.

---

## 7. Precisa de Adapter / Mapper Temporario?

Sim.

O primeiro passo seguro e um adapter temporario para normalizar o retorno oficial de Pipeline e Stage para a forma que `Oportunidades.tsx` consegue consumir sem depender de `catalogRepository` ou do mapper legado.

Esse adapter deve:

- ler do contrato oficial;
- montar a estrutura esperada pela pagina;
- nao virar nova source of truth;
- nao escrever em store, `localStorage` ou `catalogRepository`.

---

## 8. Precisa Alterar Backend?

Para a primeira wave, nao necessariamente.

Se o contrato atual de `src/api/modules/pipelines.api.ts` e do backend oficial ja entregar os campos que `Oportunidades.tsx` precisa para leitura, a primeira wave pode ser frontend-only.

Caso exista gap entre:

- payload oficial de pipeline/stage
- e o shape que a pagina realmente precisa

entao a decisao de alterar backend fica como `UNKNOWN / NEEDS DECISION` e deve ser tratada separadamente, sem misturar com a migracao inicial.

---

## 9. Testes Que Devem Proteger a Migracao

### Backend / contrato

- manter verdes os testes de contrato de Pipeline;
- manter verdes os testes de rotas de Pipeline.

### Frontend / pagina

- testar que `Oportunidades.tsx` carrega pipeline oficial sem depender de `ETAPAS_PIPELINE` quando stages oficiais existem;
- testar que a pagina nao regride para fallback legado quando a API oficial retorna com sucesso;
- testar selecao de pipeline corrente com dados oficiais;
- testar renderizacao de stages e cores com contrato oficial.

### Regressao de compatibilidade

- testar o comportamento com pipeline oficial vazio;
- testar que o estado de loading/empty permanece correto;
- testar que a remocao de heuristica nao quebra os fluxos ainda migrados.

### Cobertura sugerida

- teste unitario para o resolver/adaptador temporario;
- teste de componente para `Oportunidades.tsx`;
- teste de contrato para `pipelinesApi.getAll()`.

---

## 10. Critérios de GO / NO-GO Para a Primeira Wave

### GO

- existe adapter temporario claro entre API oficial e a pagina;
- a leitura oficial de pipeline funciona sem alterar runtime externo;
- o fluxo migrado nao depende de `catalogRepository` para montar o caminho principal;
- a pagina continua funcional com loading e empty state adequados;
- testes de contrato e de pagina permanecem verdes.

### NO-GO

- a pagina ainda precisa de `mapearProdutoLegadoParaPipeline()` para funcionar;
- a remocao de `currentPipelineId` ou `pipelines` do store e tentada antes da adapterizacao;
- o fluxo depende de `ETAPAS_PIPELINE` como unica seguranca;
- o backend precisaria mudar para cobrir um gap que ainda nao foi confirmado;
- a troca de fonte cria regressao visual ou funcional.

---

## 11. Classificacao

### KEEP

- [`src/api/modules/pipelines.api.ts`](C:/Projects/FINQZ_PRO/src/api/modules/pipelines.api.ts#L8)
- [`backend/src/modules/pipelines/**`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L90)
- [`backend/prisma/schema.prisma`](C:/Projects/FINQZ_PRO/backend/prisma/schema.prisma#L463)

### MIGRATE

- [`src/pages/Oportunidades.tsx`](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L18)

### QUARANTINE

- [`src/data/catalogRepository.ts`](C:/Projects/FINQZ_PRO/src/data/catalogRepository.ts#L300)
- [`src/store/index.ts`](C:/Projects/FINQZ_PRO/src/store/index.ts#L834)
- [`src/config/pipelines.ts`](C:/Projects/FINQZ_PRO/src/config/pipelines.ts#L76)

### REMOVE LATER

- `ETAPAS_PIPELINE`
- `getPipelineStages()`
- `mapearProdutoLegadoParaPipeline()`
- `currentPipelineId` como ownership operacional
- `pipelines` do store como estado operacional
- persistencia de Pipeline em `localStorage`

---

## 12. Escopo Permitido e Proibido

### Permitido na primeira wave

- criar adapter local temporario;
- ler a API oficial;
- adicionar testes de protecao;
- preservar fallback enquanto a migracao nao fechar.

### Proibido na primeira wave

- alterar `Oportunidades.tsx` para depender do legacy novamente;
- alterar `store`;
- alterar `catalogRepository`;
- alterar `config/pipelines.ts`;
- alterar backend;
- remover fallback antes de substituir a leitura.

---

## 13. Decisao Explicita

`Oportunidades.tsx` e o ultimo grande consumidor legado que deve ser migrado antes da retirada dos sustentadores de Pipeline.

Nao remover:

- `catalogRepository`
- `currentPipelineId`
- `pipelines` do store
- `ETAPAS_PIPELINE`
- `getPipelineStages()`
- `mapearProdutoLegadoParaPipeline()`

antes que `Oportunidades.tsx` esteja consumindo a leitura oficial com adapter temporario e sem depender do caminho legado para o fluxo principal.

---

## 14. Proxima Implementacao Segura

Implementar a `Wave 1` com um adapter temporario para leitura oficial de Pipeline em `Oportunidades.tsx`, acompanhado de testes de pagina e contrato, sem alterar runtime externo nem tocar em `store`, `catalogRepository` ou `config/pipelines.ts`.

