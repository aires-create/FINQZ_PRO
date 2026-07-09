# EPC-W2-I - Legacy Removal Execution

## Resumo Executivo

> Atualizacao: esta execucao foi sucedida pelo corte de `backend/server` em EPC-W2-L. O runtime unico oficial agora e o backend Fastify em `backend/src`, com superficie oficial em `/api/v1/*`.

A execucao controlada do corte legacy foi concluida para as APIs antigas de Opportunity e Partners:

- `src/api/modules/oportunidades.api.ts` foi removido;
- `src/api/modules/parceiros.api.ts` foi removido;
- `src/api/modules/index.ts` foi limpo para manter apenas exports oficiais.

O resultado tecnico confirma:

- zero imports produtivos de `oportunidades.api` e `parceiros.api` no source tree principal;
- barrel limpo, sem reexports legacy;
- build e testes verdes no frontend e no backend;
- `backend/server` permanece quarentenado e nao foi removido nesta fase.

## Arquivos Removidos

- `src/api/modules/oportunidades.api.ts`
- `src/api/modules/parceiros.api.ts`

## Arquivos Alterados

- `src/api/modules/index.ts`

## Comandos Usados para Localizar Referencias

Busca de imports e superficies legacy:

- `rg -n "oportunidades\\.api|parceiros\\.api" src`
- `rg -n "oportunidades\\.api|parceiros\\.api" src backend`
- `rg -n "backend/server|oportunidades\\.api|parceiros\\.api" package.json backend/package.json package-lock.json`
- `rg -n "backend/server|oportunidades\\.api|parceiros\\.api" README.md .env.example`
- `rg -n "backend/server|oportunidades\\.api|parceiros\\.api" .github\\workflows scripts`
- `rg -n "backend/server|oportunidades\\.api|parceiros\\.api" vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json`

## Resultado da Busca por Imports Legacy

### Resultado em `src`

- nenhum import produtivo remanescente de `oportunidades.api` foi encontrado;
- nenhum import produtivo remanescente de `parceiros.api` foi encontrado.

### Resultado em `backend`

- nenhuma referencia produtiva nova foi encontrada no runtime oficial;
- `backend/server` segue presente apenas como area legacy/quarentenada.

### Resultado no barrel

- `src/api/modules/index.ts` nao reexporta mais `oportunidades.api`;
- `src/api/modules/index.ts` nao reexporta mais `parceiros.api`;
- o barrel manteve apenas exports oficiais.

## Validacoes Executadas

### Frontend

- `npm run build` - OK
- `npm test` - OK

### Backend

- `cd backend && npm run build` - OK
- `cd backend && npm test` - OK

### Resultado observado

- frontend: 17 suites, 69 testes, todos aprovados;
- backend: 107 suites, 749 testes, todos aprovados.

## Riscos Remanescentes

1. Consumidor externo fora do repositório ainda pode usar nomes legacy antigos.
2. Documentacao historica pode continuar sugerindo runtime ou imports antigos.
3. `backend/server` permanece como superficie quarentenada e ainda pode ser referenciada por processos externos nao rastreados.
4. O corte definitivo de `backend/server` exige confirmacao adicional de deploy/VPS/CI-CD fora do source tree.

## Rollback

### Rollback dos arquivos legacy removidos

- restaurar `src/api/modules/oportunidades.api.ts` e `src/api/modules/parceiros.api.ts` a partir do ultimo commit aprovado;
- se necessario, reintroduzir temporariamente o barrel legacy apenas ate identificar o consumidor quebrado;
- manter os consumers oficiais ja migrados em `opportunities.api.ts` e `partners.api.ts`.

### Rollback do barrel

- restaurar `src/api/modules/index.ts` a partir do commit imediatamente anterior ao corte;
- revalidar build/testes antes de qualquer novo merge.

### Regra de rollback

- todo rollback deve ser rastreavel por commit unico;
- rollback so deve reintroduzir o minimo necessario para restabelecer o fluxo quebrado.

## Decisao sobre `backend/server`

`backend/server` nao foi removido nesta fase.

Motivo:

- a base de evidencias local confirma ausencia de uso no runtime oficial e nas superficies de CI/CD verificadas;
- ainda assim, o risco de consumidor externo/deploy fora do source tree nao foi eliminado de forma absoluta.

Decisao recomendada:

- manter quarentenado por mais uma fase;
- remover apenas depois da confirmacao final de ausencia de uso em VPS, scripts externos e deploy legado.

## Criterio de Pronto

O EPC-W2-I e considerado pronto porque:

- os arquivos legacy de Opportunity e Partners foram removidos;
- o barrel foi limpo;
- zero imports produtivos legacy foram encontrados;
- build e testes ficaram verdes;
- o runtime legado `backend/server` continua isolado para corte posterior.

## Veredito Final

**GO WITH RESTRICTIONS**

O corte controlado foi concluido com sucesso para as APIs legacy do frontend. O proximo passo continua sendo o corte de `backend/server`, mas somente apos a verificacao final de ausencia de consumidores externos e de deploy.
