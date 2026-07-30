# PIPELINE-ADMIN-WAVE-4G - Empty Pipeline Operational Audit

## Executive Verdict
**QUARANTINE**

O comportamento atual trata um **Pipeline oficial válido com `0` stages** como se fosse ausência de pipeline operacional. Isso gera a mensagem genérica **"Nenhum pipeline encontrado"** em vez de um estado vazio específico para pipeline existente sem etapas.

## 1. Onde o CRM/Pipeline carrega pipelines oficiais?

### Evidência
- `src/pages/Oportunidades.tsx:661-718`
- `src/pages/Oportunidades.tsx:707-711`

### Leitura
O carregamento oficial acontece via `pipelinesApi.getAll()` dentro do `useEffect` de `loadOfficialPipelines()`. O retorno é normalizado por `normalizeOfficialPipelinesForRead()` e armazenado em `officialPipelines`.

### Classificação
**KEEP**

## 2. Onde resolve `selectedPipeline`?

### Evidência
- `src/pages/Oportunidades.tsx:802-809`
- `src/pages/Oportunidades.tsx:833-842`
- `src/pages/Oportunidades.tsx:2073-2074`

### Leitura
O pipeline selecionado é resolvido em duas etapas:
- `selectedPipelineId` escolhe entre `localPipelineSelectionId` e `currentPipelineId`, e só aceita IDs presentes em `officialPipelines`.
- `selectedOfficialPipeline` localiza o objeto oficial correspondente em `officialPipelines`.

### Classificação
**KEEP**

## 3. Onde resolve stages?

### Evidência
- `src/pages/Oportunidades.tsx:2050-2067`
- `src/pages/Oportunidades.tsx:2076`
- `src/pages/Oportunidades.tsx:2146-2149`
- `src/pages/Oportunidades.tsx:399-406`
- `src/data/catalogRepository.ts:425-432`

### Leitura
Existem dois caminhos distintos:
- **Caminho operacional oficial**: `resolveOfficialStagesForSelectedPipeline()` converte `selectedOfficialPipeline.stages` em stages usados pela tela.
- **Caminho legado auxiliar**: `getEtapasAtivas()` chama `getPipelineStages()` do `catalogRepository`, mas não há consumidor runtime direto desse helper no trecho auditado.

### Classificação
**KEEP** para o caminho oficial.
**QUARANTINE** para o helper legado `getPipelineStages()` como fonte paralela.

## 4. Existe validação que exige `stages.length > 0`?

### Evidência
- `src/pages/Oportunidades.tsx:2276`
- `src/pages/Oportunidades.tsx:3446-3451`

### Leitura
Sim. A tela define:

```ts
const isPipelineValid = currentPipelineConfig && etapasAtivas.length > 0;
```

Se o pipeline existir, mas `etapasAtivas` for vazio, a condição falha e a página entra no estado genérico de erro/ausência.

### Classificação
**QUARANTINE**

## 5. Existe filtro que remove pipelines sem etapas?

### Evidência
- `src/pages/Oportunidades.tsx:802-809`
- `src/pages/Oportunidades.tsx:2146-2149`

### Leitura
Não há um filtro explícito do tipo `stages.length > 0` no carregamento oficial. O pipeline sem etapas continua existindo em `officialPipelines` e continua podendo ser selecionado.

O efeito prático de "sumir" acontece depois, quando `isPipelineValid` reprova o estado operacional.

### Classificação
**KEEP** para o carregamento.
**QUARANTINE** para o efeito colateral operacional.

## 6. Onde nasce a mensagem "Nenhum pipeline encontrado"?

### Evidência
- `src/pages/Oportunidades.tsx:3446-3451`

### Leitura
A mensagem nasce no bloco:

```ts
if (!isPipelineValid) {
  return (
    ...
    {selectedProductId
      ? "Pipeline não encontrado para este produto. Selecione outro produto ou configure o pipeline."
      : "Nenhum pipeline encontrado"}
```

### Classificação
**QUARANTINE**

## 7. A mensagem significa:

### Diagnóstico
- **Pipeline inexistente?** Sim, pode significar isso.
- **Pipeline sem etapas?** Sim, também pode significar isso.
- **Erro de carregamento?** Não diretamente. Erro de carregamento tem outro caminho, com `apiReadError`/fallback.

### Leitura
A mensagem é **ambígua**. Ela não diferencia:
- pipeline não localizado em `officialPipelines`
- pipeline encontrado, mas sem stages
- pipeline operacional inválido por outra regra derivada

### Classificação
**QUARANTINE**

## 8. O comportamento atual é intencional ou efeito colateral?

### Leitura
É um **efeito colateral** da regra:

- pipeline só é considerado válido se `etapasAtivas.length > 0`
- pipeline sem etapas cai no mesmo fluxo visual de "não encontrado"

Isso não parece ser um contrato de produto explícito; é uma decisão operacional de implementação.

### Classificação
**QUARANTINE**

## 9. Qual deveria ser a UX correta para Pipeline existente + 0 stages?

### Proposta
A UX correta deveria distinguir claramente:

- **Pipeline inexistente**: erro/ausência real
- **Pipeline existente sem stages**: estado vazio operacional específico

Recomendação de comportamento:
- manter o pipeline selecionado visível
- mostrar estado neutro do tipo **"Pipeline encontrado, mas ainda sem etapas configuradas"**
- não reutilizar a mensagem genérica de inexistência
- evitar que o fluxo pareça quebrado quando o problema é apenas configuração incompleta

### Classificação
**MIGRATE**

## 10. Quais consumidores seriam impactados por mudar esse comportamento?

### Consumidores diretos
- `src/pages/Oportunidades.tsx` inteiro, principalmente:
  - seletor de pipeline
  - cálculo de `isPipelineValid`
  - renderização inicial da página
  - composição de `etapasAtivas`
- `src/data/catalogRepository.ts` se o fluxo legado de etapas for removido futuramente

### Consumidores indiretos
- qualquer fluxo que dependa de `selectedPipelineId`
- criação/visualização de oportunidade vinculada a pipeline
- filtros e cards que usam `currentPipelineConfig.etapas`

### Classificação
**MIGRATE** para a UX.
**QUARANTINE** para o comportamento atual.

## 11. Classificação final

- Carregamento oficial de pipelines: **KEEP**
- Resolução de pipeline selecionado: **KEEP**
- Resolução oficial de stages: **KEEP**
- Regra `stages.length > 0` como validade operacional: **QUARANTINE**
- Mensagem genérica "Nenhum pipeline encontrado": **QUARANTINE**
- Helper legado `getPipelineStages()`: **QUARANTINE**
- UX desejada para pipeline sem stages: **MIGRATE**

## Risco Remanescente

Enquanto `isPipelineValid` exigir `etapasAtivas.length > 0`, qualquer Pipeline oficial recém-criado e ainda sem stages continuará sendo tratado como inexistente do ponto de vista operacional.

## Próxima Ação Recomendada

Separar:
- **estado de pipeline selecionado**
- **estado de pipeline operacionalmente pronto**

Assim, pipeline existente sem stages deixa de cair no mesmo estado de "não encontrado".
