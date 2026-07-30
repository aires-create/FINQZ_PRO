# PIPELINE-ADMIN-WAVE-4H - Empty Pipeline UX Fix Audit

## Executive Verdict
**MIGRATE**

O problema não está no backend nem no carregamento oficial do pipeline. O erro está na regra de UI que usa `isPipelineValid` como condição única para distinguir:
- pipeline inexistente
- pipeline existente sem etapas

Hoje os dois casos caem na mesma renderização genérica: **"Nenhum pipeline encontrado"**.

## 1. Onde nasce `isPipelineValid`?

### Evidência
- `src/pages/Oportunidades.tsx:2276`

### Leitura
`isPipelineValid` nasce como uma constante derivada no corpo do componente:

```ts
const isPipelineValid = currentPipelineConfig && etapasAtivas.length > 0;
```

Ela depende de:
- `currentPipelineConfig`
- `etapasAtivas.length > 0`

## 2. Quais condições ele avalia?

### Evidência
- `src/pages/Oportunidades.tsx:2144-2151`
- `src/pages/Oportunidades.tsx:2276`

### Leitura
As condições são:
- existe um pipeline selecionado que virou `currentPipelineConfig`
- existem etapas operacionais em `etapasAtivas`

Se qualquer uma falhar, `isPipelineValid` fica falso.

## 3. Onde a mensagem "Nenhum pipeline encontrado" é renderizada?

### Evidência
- `src/pages/Oportunidades.tsx:3446-3451`

### Leitura
A mensagem é renderizada no retorno condicional:

```ts
if (!isPipelineValid) {
  return (
    ...
    {selectedProductId
      ? "Pipeline não encontrado para este produto. Selecione outro produto ou configure o pipeline."
      : "Nenhum pipeline encontrado"}
```

Ou seja:
- sem `selectedProductId`, a UI mostra **"Nenhum pipeline encontrado"**
- com `selectedProductId`, mostra **"Pipeline não encontrado para este produto..."**

## 4. É possível distinguir pipeline inexistente e pipeline sem etapas sem alterar backend?

### Resposta
**Sim.**

A distinção já existe em runtime suficiente no frontend:
- `selectedOfficialPipeline` indica se há pipeline oficial selecionado/encontrado
- `etapasAtivas.length` indica se há etapas operacionais derivadas

Basta separar os estados de:
- **pipeline selecionado existente**
- **pipeline operacional pronto**

Sem tocar no backend, a tela já consegue exibir mensagens diferentes.

## 5. Qual a menor alteração segura?

### Proposta
A menor alteração segura é:
- substituir a checagem única `isPipelineValid`
- introduzir um estado derivado intermediário, por exemplo:
  - `hasSelectedPipeline`
  - `hasOperationalStages`

Fluxo desejado:
- se não existir pipeline selecionado, manter o estado atual de ausência
- se existir pipeline selecionado mas `etapasAtivas.length === 0`, renderizar empty state específico
- se existir pipeline e etapas, manter o fluxo atual

## 6. Quais componentes serão alterados?

### Resposta
Provavelmente somente:
- `src/pages/Oportunidades.tsx`

Não há evidência de que outro componente precise mudar para corrigir essa UX específica.

## 7. Há risco de regressão para pipelines válidos?

### Resposta
**Baixo**, se a mudança ficar restrita à distinção entre:
- pipeline inexistente
- pipeline existente sem etapas

Pipelines válidos continuarão passando por `currentPipelineConfig && etapasAtivas.length > 0`.

## 8. Há risco de quebrar Oportunidades?

### Resposta
**Médio a baixo**, porque `Oportunidades.tsx` é uma tela grande e sensível a estados derivados.

Os cuidados mínimos são:
- não alterar payload de criação/edição
- não alterar `selectedPipelineId`
- não alterar `syncPipelineSelection()`
- não alterar o Kanban

## 9. Há risco de quebrar Kanban?

### Resposta
**Baixo**, desde que a mudança fique só no gate de renderização inicial/empty state.

O Kanban depende mais de:
- `etapasAtivas`
- `etapasPosSimulacao`
- `etapasNovaOportunidade`

Se essas estruturas não forem alteradas, o Kanban deve permanecer estável.

## 10. Classificação

- `isPipelineValid`: **QUARANTINE**
- mensagem genérica "Nenhum pipeline encontrado": **QUARANTINE**
- distinção entre pipeline inexistente e pipeline sem etapas: **MIGRATE**
- ajuste mínimo em `Oportunidades.tsx`: **MIGRATE**

## Risco Remanescente

Se a mudança for implementada sem separar claramente os dois casos, a UX pode continuar ambígua e o problema operacional seguirá invisível.

## Próxima Ação Recomendada

Implementar uma distinção explícita em `Oportunidades.tsx` entre:
- pipeline ausente
- pipeline existente sem etapas

Sem tocar no backend e sem alterar o fluxo operacional do Kanban.
