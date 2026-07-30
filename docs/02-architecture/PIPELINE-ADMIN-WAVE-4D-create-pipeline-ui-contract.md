# PIPELINE-ADMIN-WAVE-4D - Create Pipeline UI Contract

Status: PLANEJADO
Type: Architecture Contract / UI Minimum Surface
Scope: Admin / Pipelines / Create UI
Date: 2026-06-23

---

## 1. Executive Verdict

`GO` para definir o contrato minimo da UI de Create Pipeline.

A implementacao futura so deve ocorrer depois que a tela tiver:

- gatilho de criacao;
- formulario ou modal de criacao;
- validacao minima de campo;
- fluxo de submit;
- refresh oficial via `getAll() + adapter`.

---

## 2. Quais campos a UI deve mostrar

A UI deve mostrar apenas os campos que existem no contrato oficial de create:

- `name`
- `description` opcional
- `isDefault` opcional

### Classificacao

- `name`: `KEEP`
- `description`: `KEEP`
- `isDefault`: `KEEP`
- `pipelineCode`: `REMOVE LATER`
- `stageColors`: `REMOVE LATER`
- `stages`: `REMOVE LATER` para a primeira wave de create

---

## 3. Quais campos sao obrigatorios

- `name`

### Classificacao

- `name`: `KEEP`
- demais campos: `OPTIONAL`

---

## 4. Quais campos sao opcionais

- `description`
- `isDefault`

### Classificacao

- `description`: `KEEP`
- `isDefault`: `KEEP`

---

## 5. Validacoes Frontend Minimas

A UI deve validar, no minimo:

- `name` nao pode ser vazio;
- `name` deve ser trimmed;
- `name` deve ter comprimento util;
- `description`, se preenchido, deve ser trimmed;
- `isDefault` deve ser booleano quando presente.

### Classificacao

- validacao de required: `KEEP`
- trim: `KEEP`
- validacao de formato complexo: `REMOVE LATER` se nao existir contrato oficial

---

## 6. Estado Local Minimo

A UI precisa apenas de:

- estado do form;
- estado de submit/loading;
- estado de erro;
- flag de sucesso/feedback temporario, se necessario;
- estado para abertura/fechamento do modal.

### Classificacao

- form state: `KEEP`
- submitting: `KEEP`
- error state: `KEEP`
- success feedback: `KEEP` opcional
- estado global legado: `REMOVE LATER`

---

## 7. Modal, Inline Form ou Drawer

**Decisao:** usar **modal**.

### Motivo

- reduz impacto visual na lista read-only;
- nao exige navegar para outra tela;
- preserva o contexto atual da administração;
- e o menor caminho para uma primeira escrita controlada.

### Classificacao

- modal: `KEEP`
- inline form: `REMOVE LATER`
- drawer: `REMOVE LATER`

---

## 8. Tratamento de Loading / Submitting

- desabilitar o botao de submit durante envio;
- mostrar loading no botao ou no modal;
- impedir duplo submit;
- manter o modal aberto ate a resposta final;
- evitar alteracao otimista da lista.

### Classificacao

- loading/submitting: `KEEP`
- optimistic update: `REMOVE LATER`

---

## 9. Tratamento de Erro de Validacao

- exibir mensagem clara no form;
- manter campos preenchidos;
- nao fechar o modal;
- nao chamar refresh da lista se a validacao falhar antes do submit oficial.

### Classificacao

- erro de validacao inline: `KEEP`
- fechar modal em erro: `REMOVE LATER`

---

## 10. Tratamento de Erro de Permissao

- exibir erro de acesso negado;
- nao criar pipeline;
- nao alterar a lista;
- fechar o fluxo de submit;
- permitir retorno seguro ao estado inicial.

### Classificacao

- erro de permissao visivel: `KEEP`
- retry silencioso: `REMOVE LATER`

---

## 11. Tratamento de Sucesso

Ao salvar com sucesso:

1. fechar o modal;
2. limpar o estado do form;
3. refazer a leitura oficial;
4. remapear com o adapter;
5. renderizar a lista atualizada.

### Classificacao

- fechamento do modal: `KEEP`
- reset do form: `KEEP`
- refresh via `getAll() + adapter`: `KEEP`
- update local manual da lista: `REMOVE LATER`

---

## 12. Como Recarregar a Lista Apos Sucesso

A estrategia mais segura e:

`pipelinesApi.getAll() -> pipelines.adapter.ts -> setPipelines(...)`

### Motivo

- evita drift;
- preserva consistencia com o backend oficial;
- nao depende de estruturas legadas.

### Classificacao

- `getAll() + adapter`: `KEEP`
- update local manual: `REMOVE LATER`

---

## 13. O que e Proibido Enviar no Payload

- `pipelineCode`
- `stageColors`
- `stages`
- qualquer campo legacy de `PipelineSettings`
- qualquer campo vindo de `catalogRepository`
- qualquer estado de `store`

### Classificacao

- proibido: `KEEP` como proibicao
- legado no payload: `REMOVE LATER`

---

## 14. Criterios de Aceite para Implementar

A futura implementacao so deve ser aceita se:

- houver modal de create;
- houver form com `name` obrigatorio;
- houver submit bloqueado durante loading;
- houver tratamento de erro sem fechar o modal;
- houver sucesso com refresh oficial;
- nenhum campo proibido for enviado no payload;
- a tela continuar sem `catalogRepository`, `localStorage` ou `store`;
- `pipelineCode` e `stageColors` permanecem fora do contrato;
- passar em `npx tsc --noEmit`.

---

## 15. Matriz de Classificacao

| Item | Classificacao | Observacao |
|---|---|---|
| `name` | `KEEP` | obrigatorio |
| `description` | `KEEP` | opcional |
| `isDefault` | `KEEP` | opcional |
| modal | `KEEP` | menor superficie de UI |
| loading/submitting | `KEEP` | obrigatorio |
| erro de validacao | `KEEP` | obrigatorio |
| erro de permissao | `KEEP` | obrigatorio |
| sucesso com refresh | `KEEP` | obrigatorio |
| `pipelineCode` no payload | `REMOVE LATER` | proibido |
| `stageColors` no payload | `REMOVE LATER` | proibido |
| `stages` no payload | `REMOVE LATER` | fora da primeira wave |
| update local manual | `REMOVE LATER` | usar refresh oficial |

---

## 16. Decisao Final

O contrato minimo da UI de Create Pipeline e pequeno por design:

- mostrar `name`, `description` e `isDefault`;
- validar `name`;
- submeter via client oficial;
- fechar modal;
- recarregar via `getAll() + adapter`.

Nada de `pipelineCode`, `stageColors`, `store`, `catalogRepository` ou `localStorage`.
