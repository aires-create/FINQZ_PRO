# PIPELINE-CLOSURE-D - Pipeline Legacy Dependency Matrix

Status: APPROVED WITH RESTRICTIONS
Type: Architecture Decision / Legacy Dependency Matrix
Scope: Pipeline / Legacy Runtime / Frontend Migration Boundaries
Date: 2026-06-23

---

## 1. Executive Verdict

`NO-GO` para remoção do legado de Pipeline neste momento.

Motivos confirmados pela auditoria `PIPELINE-CLOSURE-C`:

- o consumidor runtime dominante e `src/pages/Oportunidades.tsx`;
- o legado nao esta concentrado em um unico arquivo;
- `src/data/catalogRepository.ts` ainda sustenta leitura e persistencia de configuração de Pipeline;
- `src/store/index.ts` ainda sustenta estado operacional de Pipeline e `currentPipelineId`;
- `src/config/pipelines.ts` ainda sustenta heuristicas, fallback e compatibilidade semantica.

Conclusao arquitetural:

- o legado de Pipeline continua vivo por dependencia cruzada;
- remover qualquer um dos pontos centrais antes da migracao de `Oportunidades.tsx` pode quebrar o runtime;
- o caminho seguro e migrar primeiro o consumidor dominante, depois desmontar os sustentadores legados.

---

## 2. Mapa de Consumidores

### 2.1 Consumidor runtime dominante

- [`src/pages/Oportunidades.tsx`](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L18)

Uso direto:

- lê `pipelines` e `currentPipelineId` do store;
- chama `getPipelineStages()` e `getPipelineStageColor()` do `catalogRepository`;
- usa `ETAPAS_PIPELINE` como fallback;
- usa `mapearProdutoLegadoParaPipeline()` para compatibilidade;
- usa `getPipelineConfigById()`, `getPipelineById()`, `getPipelinesOrdenados()` e `getPipelineTipoLabel()` do config legado.

### 2.2 Sustentadores do legado

- [`src/data/catalogRepository.ts`](C:/Projects/FINQZ_PRO/src/data/catalogRepository.ts#L300)
- [`src/store/index.ts`](C:/Projects/FINQZ_PRO/src/store/index.ts#L834)
- [`src/config/pipelines.ts`](C:/Projects/FINQZ_PRO/src/config/pipelines.ts#L76)

### 2.3 Consumidores adjacentes

- [`src/pages/admin/Pipelines.tsx`](C:/Projects/FINQZ_PRO/src/pages/admin/Pipelines.tsx#L7)
- [`src/pages/admin/Automacoes.tsx`](C:/Projects/FINQZ_PRO/src/pages/admin/Automacoes.tsx#L5)
- [`src/pages/Configuracoes.tsx`](C:/Projects/FINQZ_PRO/src/pages/Configuracoes.tsx#L7)
- [`src/config/configAutomacoes.ts`](C:/Projects/FINQZ_PRO/src/config/configAutomacoes.ts#L4)
- [`src/test/pipeline.test.ts`](C:/Projects/FINQZ_PRO/src/test/pipeline.test.ts#L240)

Esses consumidores nao definem a verdade oficial, mas continuam dependentes do ecossistema legado de Pipeline.

---

## 3. O Que Quebra Se Remover `catalogRepository`

Se `src/data/catalogRepository.ts` for removido agora, quebra:

- a resolucao de stages por pipeline em `Oportunidades.tsx`;
- a obtencao de cor de stage por pipeline em `Oportunidades.tsx`;
- a tela `admin/Pipelines.tsx`, que carrega e salva configuracao local;
- o fallback de configuracao de pipeline que hoje vem do `localStorage`.

Efeito real:

- a pagina de oportunidades perde a trilha de compatibilidade de stages;
- a pagina administrativa perde a fonte de configuracao local;
- imports diretos quebram em build.

Classificacao:

- `catalogRepository.ts`: `QUARANTINE`

---

## 4. O Que Quebra Se Remover `currentPipelineId`

Se `currentPipelineId` for removido agora, quebra:

- a selecao da pipeline corrente em `Oportunidades.tsx`;
- o fallback do pipeline ativo para formulários e render;
- a troca de pipeline dentro da propria pagina;
- a compatibilidade com o estado global persistido.

Efeito real:

- a pagina perde a referencia de pipeline selecionado;
- o fluxo de oportunidade pode cair em pipeline vazio ou indevido;
- o `useAppStore` tipado fica inconsistente para os consumidores atuais.

Classificacao:

- `currentPipelineId` em `src/store/index.ts`: `QUARANTINE`

---

## 5. O Que Quebra Se Remover `pipelines` do Store

Se `pipelines` for removido do store agora, quebra:

- a leitura da lista operacional em `Oportunidades.tsx`;
- a adicao, atualizacao e exclusao local de pipelines ainda realizadas pela pagina;
- a selecao segura da pipeline corrente;
- os testes e simulacoes que assumem estado de pipeline no store.

Efeito real:

- `Oportunidades.tsx` perde o conjunto operacional que ainda usa para transicao;
- a pagina pode ficar sem dados para montar a experiencia atual;
- a remocao prematura cria regressao de runtime.

Classificacao:

- `src/store/index.ts`: `QUARANTINE`

---

## 6. O Que Quebra Se Remover `ETAPAS_PIPELINE`

Se `ETAPAS_PIPELINE` for removido agora, quebra:

- os fallbacks de etapas em `Oportunidades.tsx`;
- a simulacao e a renderizacao quando o pipeline oficial nao resolve etapas;
- os loops de UI que percorrem etapas ativas ou fallback.

Efeito real:

- a pagina de oportunidades pode ficar sem rota de seguranca para etapas;
- o usuario pode perder visualizacao em fluxos onde a configuracao oficial ainda nao chegou;
- a experiencia fica fragilizada enquanto a migracao nao termina.

Classificacao:

- `src/pages/Oportunidades.tsx` e `src/config/pipelines.ts`: `QUARANTINE` / `REMOVE LATER`

---

## 7. O Que Quebra Se Remover `getPipelineStages()`

Se `getPipelineStages()` for removido agora, quebra:

- a leitura de stages no fluxo de oportunidade;
- a resolucao visual de etapas e cores por pipeline;
- a compatibilidade com a configuracao de Pipeline hoje materializada em `catalogRepository`.

Efeito real:

- `Oportunidades.tsx` perde a ponte entre pipeline e stages durante a transicao;
- a UI fica sem resolver etapas por pipeline;
- o runtime precisa de substituicao oficial antes do corte.

Classificacao:

- `src/data/catalogRepository.ts`: `QUARANTINE`

---

## 8. O Que Quebra Se Remover `mapearProdutoLegadoParaPipeline()`

Se `mapearProdutoLegadoParaPipeline()` for removido agora, quebra:

- a compatibilidade de oportunidades legadas em `Oportunidades.tsx`;
- a heuristica que ancora produtos antigos em pipeline semantico;
- os testes que validam o comportamento de fallback.

Efeito real:

- oportunidades com produto legado podem deixar de cair no pipeline esperado;
- a pagina perde uma ponte de transicao ainda usada no runtime;
- a remocao so e segura depois que o consumer principal for migrado.

Classificacao:

- `src/config/pipelines.ts`: `QUARANTINE` / `REMOVE LATER`

---

## 9. Classificacao por Arquivo

### KEEP

- [`src/pages/Oportunidades.tsx`](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L18) como consumidor em migracao

### QUARANTINE

- [`src/data/catalogRepository.ts`](C:/Projects/FINQZ_PRO/src/data/catalogRepository.ts#L300)
- [`src/store/index.ts`](C:/Projects/FINQZ_PRO/src/store/index.ts#L834)
- [`src/config/pipelines.ts`](C:/Projects/FINQZ_PRO/src/config/pipelines.ts#L76)
- [`src/pages/admin/Pipelines.tsx`](C:/Projects/FINQZ_PRO/src/pages/admin/Pipelines.tsx#L7)
- [`src/pages/admin/Automacoes.tsx`](C:/Projects/FINQZ_PRO/src/pages/admin/Automacoes.tsx#L5)
- [`src/pages/Configuracoes.tsx`](C:/Projects/FINQZ_PRO/src/pages/Configuracoes.tsx#L7)
- [`src/config/configAutomacoes.ts`](C:/Projects/FINQZ_PRO/src/config/configAutomacoes.ts#L4)

### REMOVE LATER

- `ETAPAS_PIPELINE`
- `mapearProdutoLegadoParaPipeline()`
- fallback e heuristicas legadas de `src/config/pipelines.ts`
- persistencia de pipeline via `localStorage` em `catalogRepository`
- estado operacional de pipeline no `store`

---

## 10. Ordem Segura de Migracao

### Wave 1 - Migrar `Oportunidades.tsx`

Objetivo:

- remover dependencias de fallback e heuristica do consumidor dominante;
- fazer a pagina ler apenas o contrato oficial do backend.

### Wave 2 - Desmontar `catalogRepository` do dominio Pipeline

Objetivo:

- retirar leitura e persistencia de pipeline do `localStorage`;
- eliminar `getPipelineStages()` e `getPipelineStageColor()` como caminho operacional.

### Wave 3 - Remover `pipelines` e `currentPipelineId` do store operacional

Objetivo:

- manter o store apenas para estado de UI, se ainda necessario;
- eliminar ownership operacional de Pipeline no estado global.

### Wave 4 - Limpar `config/pipelines.ts`

Objetivo:

- retirar heuristicas e compatibilidade legada;
- manter apenas o que for explicitamente oficial e ainda consumido.

### Wave 5 - Cortar superficies residuais

Objetivo:

- remover reexports e telas transicionais que ainda preservam o legado sem necessidade;
- consolidar o runtime no contrato oficial.

---

## 11. Critérios de GO / NO-GO

### GO

- `Oportunidades.tsx` estiver consumindo contrato oficial sem fallback legada;
- nao houver dependencia runtime de `catalogRepository` para Pipeline;
- `store` nao expuser mais Pipeline como estado operacional;
- `ETAPAS_PIPELINE` e `mapearProdutoLegadoParaPipeline()` nao forem mais necessarios;
- validacao documental e de build confirmarem a troca de fonte.

### NO-GO

- `Oportunidades.tsx` ainda depender de `ETAPAS_PIPELINE`;
- `catalogRepository` ainda for necessário para stage ou cor de pipeline;
- `currentPipelineId` ainda for parte da selecao funcional;
- `pipelines` do store ainda forem usados como estado operacional;
- a remocao introduzir regressao em fluxo ativo.

---

## 12. Decisao Explicita

Nao remover legado de Pipeline antes de migrar `Oportunidades.tsx`.

Essa migracao e a condicao previa para qualquer corte seguro de:

- `src/data/catalogRepository.ts`
- `src/store/index.ts`
- `src/config/pipelines.ts`
- `ETAPAS_PIPELINE`
- `getPipelineStages()`
- `mapearProdutoLegadoParaPipeline()`

---

## 13. Proxima Acao Recomendada

Iniciar a migracao do consumidor dominante `src/pages/Oportunidades.tsx` para o contrato oficial, mantendo o legado em quarentena ate que a pagina nao precise mais de fallback ou heuristica local.
