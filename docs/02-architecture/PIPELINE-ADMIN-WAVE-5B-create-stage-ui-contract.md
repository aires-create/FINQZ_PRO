# PIPELINE-ADMIN-WAVE-5B - Create Stage UI Contract

## Executive Verdict
**KEEP**

O backend, o client oficial e o adapter já suportam criação de Stage. Falta apenas definir o contrato mínimo da UI em `Admin/Pipelines` para habilitar a primeira escrita oficial de Stage com segurança.

## 1. Onde o botão “Adicionar etapa” deve aparecer?

### Resposta
O botão deve aparecer dentro de cada card de pipeline oficial, na mesma área onde as etapas já são renderizadas.

### Critério de UI
- visível apenas quando houver um pipeline selecionado/renderizado
- preferencialmente ao lado do título ou da área de etapas
- não deve depender de `catalogRepository`, `localStorage` ou store legado

### Classificação
**KEEP**

## 2. Quais campos a UI deve mostrar?

### Resposta
Campos mínimos:
- nome da etapa
- ordem inicial
- marcação `isWon`
- marcação `isLost`

### Observação
Esses campos refletem exatamente o payload oficial do backend.

## 3. Quais campos são obrigatórios?

### Resposta
Obrigatórios:
- `name`
- `order`
- `isWon`
- `isLost`

### Regra de negócio
- `name` não pode ser vazio após `trim`
- `order` deve ser inteiro `>= 1`
- `isWon` e `isLost` não podem ser `true` ao mesmo tempo

### Evidência
- `backend/src/modules/pipelines/validators/pipeline.http.schema.ts:49-63`

## 4. Como calcular `order` inicial?

### Resposta
A ordem inicial deve ser derivada das etapas existentes do pipeline:
- se houver etapas, usar `maior order + 1`
- se não houver etapas, usar `1`

### Justificativa
Isso preserva ordenação estável e evita colisão com etapas já existentes.

### Classificação
**MIGRATE**

## 5. Como tratar `isWon`?

### Resposta
`isWon` deve ser um toggle explícito, desativado por padrão.

Se `isWon = true`, a UI deve manter `isLost = false`.

### Classificação
**KEEP**

## 6. Como tratar `isLost`?

### Resposta
`isLost` deve ser um toggle explícito, desativado por padrão.

Se `isLost = true`, a UI deve manter `isWon = false`.

### Classificação
**KEEP**

## 7. Como validar conflito `isWon/isLost`?

### Resposta
Validação mínima na UI:
- impedir submissão quando ambos estiverem marcados
- exibir mensagem de erro local antes do envio

### Reforço no backend
O backend já valida esse conflito, então a UI deve apenas prevenir a condição e evitar roundtrip desnecessário.

### Classificação
**KEEP**

## 8. Como tratar loading/submitting?

### Resposta
Estado mínimo:
- `isOpen`
- `formData`
- `submitting`
- `error`

Durante submissão:
- desabilitar inputs
- desabilitar cancelamento se necessário
- mostrar feedback visual de envio

### Classificação
**KEEP**

## 9. Como tratar erro de validação?

### Resposta
Exibir mensagem local no modal/form, sem fechar a UI.

Exemplos:
- nome vazio
- ordem inválida
- conflito `isWon/isLost`

### Classificação
**KEEP**

## 10. Como tratar erro de permissão?

### Resposta
Exibir mensagem clara de acesso negado:
- "Você não tem permissão para criar etapa."

### Classificação
**KEEP**

## 11. Como tratar sucesso?

### Resposta
Após sucesso:
- fechar modal
- limpar formulário
- recarregar a lista via `pipelinesApi.getAll()`
- remapear com `mapOfficialPipelinesToAdminViewModels()`

### Motivo
Esse fluxo evita dependência de estado local desatualizado e garante alinhamento com o backend oficial.

### Classificação
**KEEP**

## 12. Como recarregar a lista após sucesso?

### Resposta
O caminho mais seguro é:
1. chamar `pipelinesApi.getAll()`
2. aplicar `mapOfficialPipelinesToAdminViewModels()`
3. re-renderizar a tela com o estado oficial atualizado

### Classificação
**KEEP**

## 13. O que é proibido enviar no payload?

### Resposta
Não enviar:
- `stageColors`
- `pipelineCode`
- `active`
- `isActive`
- qualquer dado derivado apenas de UI/legado

### Justificativa
O contrato oficial de `createStage` não aceita esses campos.

### Classificação
**KEEP**

## 14. Critérios de aceite

### Aceite funcional
- botão “Adicionar etapa” aparece por pipeline
- modal de criação abre e fecha corretamente
- payload enviado bate com o contrato oficial
- criação bem-sucedida recarrega a lista
- erro de validação aparece inline
- erro de permissão aparece claramente

### Aceite técnico
- sem uso de `catalogRepository`
- sem uso de `localStorage`
- sem uso de store legado como source of truth
- sem alterar backend
- sem alterar adapter
- sem alterar `pipelines.api.ts`

## Matriz de decisão

| Item | Estado | Classificação |
|---|---|---|
| Botão “Adicionar etapa” | Não implementado | MIGRATE |
| Campos do formulário | Definidos pelo contrato | KEEP |
| Ordenação inicial | Derivada do pipeline | MIGRATE |
| `isWon/isLost` | Toggling exclusivo | KEEP |
| Validação de conflito | Pré-submit na UI | KEEP |
| Post-success reload | `getAll()` + adapter | KEEP |
| Payload com campos de UI | Proibido | KEEP |

## Próxima ação recomendada

Implementar a primeira wave de create stage em `src/pages/admin/Pipelines.tsx`, restrita a:
- botão de abrir modal
- modal de criação
- submit com `pipelinesApi.createStage()`
- reload oficial após sucesso
