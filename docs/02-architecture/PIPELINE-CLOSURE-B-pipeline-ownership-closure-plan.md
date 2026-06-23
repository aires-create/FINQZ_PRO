# PIPELINE-CLOSURE-B - Pipeline Ownership Closure Plan

Status: APPROVED WITH RESTRICTIONS  
Type: Architecture Decision / Ownership Closure Plan  
Scope: Pipeline / Stage / Frontend Runtime Boundaries / Migration Governance  
Date: 2026-06-23

---

## 1. Executive Verdict

`NO-GO` para fechamento runtime completo neste momento.

Motivos confirmados pela auditoria `PIPELINE-CLOSURE-A`:

- o backend moderno de Pipeline e Stage existe e e `KEEP`;
- o frontend ainda opera em modo híbrido, com fallback e heuristicas legadas;
- `src/pages/admin/Pipelines.tsx` ainda usa `localStorage` via `catalogRepository`;
- `src/pages/Oportunidades.tsx` ainda usa `store`, `ETAPAS_PIPELINE` e mapeamentos legados;
- `src/store/index.ts` ainda carrega Pipeline como estado operacional;
- `src/config/pipelines.ts` ainda preserva mapeamentos e compatibilidade semantica legada.

Conclusao arquitetural:

- o ownership oficial e backend-owned;
- o runtime frontend ainda nao esta fechado;
- `localStorage`, `store` e `catalogRepository` nao podem ser tratados como source of truth de Pipeline.

---

## 2. Ownership Oficial de Pipeline

Ownership oficial:

- [`backend/src/modules/pipelines/**`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L90)
- [`backend/prisma/schema.prisma`](C:/Projects/FINQZ_PRO/backend/prisma/schema.prisma#L463)

Responsabilidades do owner oficial:

- ler pipelines ativos por tenant;
- criar, atualizar, desativar e remover logicamente pipeline;
- manter consistencia entre pipeline e stages;
- aplicar tenant scope e RBAC;
- servir como fonte canonica para clientes modernos.

Contrato oficial de leitura/escrita:

- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L90)
- [`backend/src/modules/pipelines/service.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/service.ts#L75)
- [`backend/src/modules/pipelines/repository.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/repository.ts#L96)
- [`backend/src/modules/pipelines/presentation/http/pipeline.http.contract.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/presentation/http/pipeline.http.contract.ts#L12)

---

## 3. Ownership Oficial de Stage

Ownership oficial:

- [`backend/src/modules/pipelines/**`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L336)
- [`backend/prisma/schema.prisma`](C:/Projects/FINQZ_PRO/backend/prisma/schema.prisma#L485)

Responsabilidades do owner oficial:

- stage pertence a pipeline;
- stage herda tenant scope;
- stage e governada pelo mesmo modulo oficial de Pipeline;
- stage nao e entidade operacional independente do frontend.

Contrato oficial de stage:

- `createStage`, `updateStage`, `deactivateStage` e `reorderStages`
- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L336)
- [`backend/src/modules/pipelines/service.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/service.ts#L130)
- [`backend/src/modules/pipelines/repository.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/repository.ts#L193)

---

## 4. Fontes Oficiais

### Backend

- [`backend/src/modules/pipelines/routes.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L90)
- [`backend/src/modules/pipelines/service.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/service.ts#L75)
- [`backend/src/modules/pipelines/repository.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/repository.ts#L96)
- [`backend/src/modules/pipelines/validators/pipeline.http.schema.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/validators/pipeline.http.schema.ts#L1)
- [`backend/src/modules/pipelines/validators/pipeline.validator.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/validators/pipeline.validator.ts#L1)
- [`backend/src/modules/pipelines/presentation/http/pipeline.http.contract.ts`](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/presentation/http/pipeline.http.contract.ts#L1)
- [`backend/prisma/schema.prisma`](C:/Projects/FINQZ_PRO/backend/prisma/schema.prisma#L463)

### Frontend oficial

- [`src/api/modules/pipelines.api.ts`](C:/Projects/FINQZ_PRO/src/api/modules/pipelines.api.ts#L8)

---

## 5. Fontes Paralelas

As fontes abaixo ainda existem e afetam o runtime, mas nao sao source of truth oficial:

- [`src/pages/Oportunidades.tsx`](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L599)
- [`src/pages/admin/Pipelines.tsx`](C:/Projects/FINQZ_PRO/src/pages/admin/Pipelines.tsx#L20)
- [`src/data/catalogRepository.ts`](C:/Projects/FINQZ_PRO/src/data/catalogRepository.ts#L300)
- [`src/store/index.ts`](C:/Projects/FINQZ_PRO/src/store/index.ts#L834)
- [`src/config/pipelines.ts`](C:/Projects/FINQZ_PRO/src/config/pipelines.ts#L104)
- [`src/api/modules/index.ts`](C:/Projects/FINQZ_PRO/src/api/modules/index.ts#L8)

Essas fontes precisam ser tratadas como transitivas ou legadas ate que o fluxo oficial seja o unico caminho de leitura e escrita.

---

## 6. Classificacao

### KEEP

- `backend/src/modules/pipelines/**`
- `backend/prisma/schema.prisma` para `Pipeline` e `Stage`
- `src/api/modules/pipelines.api.ts`

### MIGRATE

- `src/pages/Oportunidades.tsx`

### QUARANTINE

- `src/pages/admin/Pipelines.tsx`
- `src/data/catalogRepository.ts`
- `src/store/index.ts`
- `src/config/pipelines.ts`
- `src/api/modules/index.ts`

### REMOVE LATER

- fallback e heuristicas legadas de `src/config/pipelines.ts`
- residuos de pipeline operacional em `src/store/index.ts`
- persistencia de pipeline em `localStorage` via `catalogRepository`
- barrel misto que continue promovendo surface legada acima da oficial

---

## 7. Plano de Ondas

### Wave 1 - Congelar a API oficial como unica referencia

Objetivo:

- consolidar `src/api/modules/pipelines.api.ts` como leitura oficial no frontend;
- impedir novos consumidores do legado para Pipeline;
- manter a API oficial como ponto de integracao preferencial.

Resultado esperado:

- a rota oficial e a unica referencia de leitura;
- nenhum novo fluxo deve nascer em `catalogRepository` ou `store`.

### Wave 2 - Migrar `Oportunidades.tsx` para leitura oficial sem fallback

Objetivo:

- remover fallback para `ETAPAS_PIPELINE`;
- remover heuristicas semanticas legadas para determinar pipeline e etapas;
- usar apenas dados oficiais do backend para leitura.

Resultado esperado:

- `Oportunidades.tsx` deixa de depender de heuristica de produto e de etapas locais;
- o componente passa a ser consumidor direto do contrato oficial.

### Wave 3 - Migrar `admin/Pipelines.tsx` para backend oficial

Objetivo:

- substituir `localStorage` como mecanismo operacional de Pipeline;
- fazer a tela administrativa usar backend oficial para leitura e escrita;
- manter apenas compatibilidade temporaria enquanto houver transicao.

Resultado esperado:

- `admin/Pipelines.tsx` deixa de ser uma fonte paralela;
- `catalogRepository` deixa de ser dono de Pipeline.

### Wave 4 - Remover `store` como fonte operacional

Objetivo:

- retirar `pipelines`, `currentPipelineId` e estados correlatos do fluxo operacional;
- limitar `store` a estado estritamente de UI, se ainda necessario.

Resultado esperado:

- `src/store/index.ts` nao e mais origem de verdade para Pipeline;
- nenhuma tela depende de estado global para definir ownership de Pipeline.

### Wave 5 - Remover `config/pipelines.ts` e `catalogRepository` do dominio Pipeline

Objetivo:

- eliminar heuristicas e persistencias do dominio Pipeline;
- manter apenas contratos oficiais e mapeamentos explicitamente justificados;
- limpar residuos legados sem quebrar consumidores ja migrados.

Resultado esperado:

- Pipeline fica completamente governado por backend moderno e contrato oficial;
- `config/pipelines.ts` e `catalogRepository` saem do caminho operacional.

---

## 8. Escopo Permitido e Proibido por Onda

### Wave 1

Permitido:

- consolidar uso da API oficial;
- ajustar consumers para leitura canonica;
- documentar isolamento do legado.

Proibido:

- alterar `store`;
- alterar `catalogRepository`;
- alterar `localStorage`;
- reintroduzir dependencias do fluxo legado como caminho preferencial.

### Wave 2

Permitido:

- migrar leitura de `Oportunidades.tsx` para contrato oficial;
- reduzir fallback visivel de etapas e pipelines.

Proibido:

- manter heuristica de produto como decision maker;
- manter `ETAPAS_PIPELINE` como fonte operacional;
- criar nova fonte paralela.

### Wave 3

Permitido:

- migrar `admin/Pipelines.tsx` para backend oficial;
- isolar a persistencia local como transitoria apenas se ainda houver necessidade controlada.

Proibido:

- continuar tratando `localStorage` como ownership;
- criar sincronia paralela entre backend e `catalogRepository` como source of truth.

### Wave 4

Permitido:

- reduzir `store` para estado de UI;
- eliminar mutacoes operacionais de pipeline do estado global.

Proibido:

- usar `store` como cache autoritativo de pipeline;
- perpetuar `currentPipelineId` como ownership.

### Wave 5

Permitido:

- remover heuristicas e reexports legados depois da migracao completa.

Proibido:

- remover suporte antes de todos os consumers oficiais estarem migrados;
- quebrar telas ou fluxos que ainda dependam de compatibilidade transitoria.

---

## 9. Critrios de GO / NO-GO

### GO para avancar de onda

- contrato oficial presente e usado pelo consumer alvo;
- ausencia de regressao funcional no fluxo migrado;
- sem dependencia operacional nova de `store`, `localStorage` ou `catalogRepository`;
- evidencia de que o consumidor nao precisa mais do fallback legado;
- teste ou validacao documental confirmando a troca de fonte.

### NO-GO

- consumer ainda precisa de `ETAPAS_PIPELINE`, heuristica de produto ou pipeline default local;
- a tela continua gravando Pipeline em `localStorage`;
- o fluxo depende de `store` como ownership;
- o backend oficial nao cobre o caso de uso real;
- a remoção criaria regressao no fluxo ainda nao migrado.

---

## 10. Riscos de HML / Produção

### HML

- divergencia entre o que a tela mostra e o que o backend realmente possui;
- usuarios podem validar um fluxo local que nao existe no backend;
- persistencia local pode mascarar problemas de tenant scope.

### Produção

- `localStorage` pode sobrescrever a percepcao operacional do Pipeline no navegador;
- `store` pode manter ids antigos e provocar selecao incorreta de pipeline;
- fallback legado pode reintroduzir etapas que nao existem mais no backend;
- consumidor misto pode gerar inconsistencias de permissao, tenant e visualizacao.

---

## 11. Decisao Explicita

`localStorage`, `store` e `catalogRepository` nao devem ser usados como source of truth de Pipeline.

Decisao final:

- o owner oficial de Pipeline e o backend moderno;
- o owner oficial de Stage e o backend moderno;
- o frontend deve migrar para leitura e escrita oficiais;
- o legado permanece em quarentena ate a migracao concluir;
- nenhuma remocao de legado deve ocorrer antes do fechamento do consumo em `Oportunidades.tsx` e `admin/Pipelines.tsx`.

---

## 12. Proxima Acao Recomendada

Iniciar a `Wave 2` com foco em `src/pages/Oportunidades.tsx`, reduzindo fallback e heuristicas ate que a pagina consuma apenas dados oficiais.

Depois disso:

1. migrar `admin/Pipelines.tsx`;
2. remover Pipeline operacional do `store`;
3. eliminar o dominio Pipeline de `catalogRepository` e `config/pipelines.ts`.
