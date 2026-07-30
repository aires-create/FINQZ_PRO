# EPC-W2-F - Legacy Cut Readiness & External Consumer Check

## Resumo Executivo

A auditoria confirma que os consumidores produtivos internos dos modulos legacy de Opportunity e Partners foram removidos ou nao foram encontrados no source tree produtivo. Os imports ativos em `src` agora apontam para os modulos oficiais, e o runtime oficial de CI/CD e build nao depende de `backend/server`.

O risco restante nao e interno ao aplicativo principal, e sim externo/indireto:

- referencias documentais ainda citam `backend/server` e os modulos legacy;
- `src/api/modules/index.ts` ainda reexporta os modulos legacy por compatibilidade;
- nao foi possivel provar ausencia absoluta de consumidores externos fora do repositorio.

Conclusao: o legado esta pronto para uma fase de corte, mas ainda pede restricoes e um ultimo checkpoint antes da remocao definitiva.

## Matriz de Referencias Encontradas

| Alvo | Localizacao | Classificacao | Observacao |
|---|---|---:|---|
| `src/api/modules/oportunidades.api.ts` | `src/api/modules/oportunidades.api.ts` | legacy/quarentena | arquivo legado mantido sem consumidores produtivos diretos encontrados |
| `src/api/modules/parceiros.api.ts` | `src/api/modules/parceiros.api.ts` | legacy/quarentena | arquivo legado mantido sem consumidores produtivos diretos encontrados |
| `backend/server/package.json` | `backend/server/package.json` | legacy/quarentena | descricao indica runtime legacy / quarantined |
| `backend/server/src/index.ts` | `backend/server/src/index.ts` | legacy/quarentena | runtime legado congelado, sem evidencia de uso em CI/CD oficial |
| `backend/server/src/defs/index.ts` | `backend/server/src/defs/index.ts` | legacy/quarentena | schema/defs do runtime legado |
| `src/api/modules/index.ts` | `src/api/modules/index.ts` | legacy/quarentena | reexporta modulos legacy por compatibilidade; nao e consumidor produtivo, mas e superficie de exposicao |
| `src/api/client.ts` | `src/api/client.ts` | produtiva | ja migrou para `opportunities.api` e `partners.api` oficiais |
| `src/pages/SdrIaHub.tsx` | `src/pages/SdrIaHub.tsx` | produtiva | ja migrou para `opportunities.api` oficial |
| `src/pages/Oportunidades.tsx` | `src/pages/Oportunidades.tsx` | produtiva | usa `opportunitiesApi` oficial |
| `src/pages/Parceiros.tsx` | `src/pages/Parceiros.tsx` | produtiva | usa `partnersApi` oficial |
| `package.json` | `package.json` | falso positivo | sem referencia para `backend/server` ou imports legacy |
| `backend/package.json` | `backend/package.json` | falso positivo | scripts oficiais apontam para `backend/src`, nao para `backend/server` |
| `package-lock.json` | `package-lock.json` | falso positivo | nenhuma referencia util encontrada |
| `vite.config.ts` | `vite.config.ts` | falso positivo | nenhuma referencia util encontrada |
| `tsconfig.json` | `tsconfig.json` | falso positivo | nenhuma referencia util encontrada |
| `tsconfig.app.json` | `tsconfig.app.json` | falso positivo | nenhuma referencia util encontrada |
| `tsconfig.node.json` | `tsconfig.node.json` | falso positivo | nenhuma referencia util encontrada |
| `README.md` | `README.md` | falso positivo | nenhuma referencia util encontrada |
| `.env.example` | `.env.example` | falso positivo | nenhuma referencia util encontrada |
| `.github/workflows/ci.yml` | `.github/workflows/ci.yml` | falso positivo | workflow oficial nao referencia `backend/server` |
| `.github/workflows/release.yml` | `.github/workflows/release.yml` | falso positivo | workflow oficial nao referencia `backend/server` |
| `scripts/arch-check.mjs` | `scripts/arch-check.mjs` | falso positivo | governance check sem dependencia de `backend/server` |

## Consumidores Internos Remanescentes

### Nao encontrados como consumidores produtivos

Nao foram encontrados imports produtivos ativos para:

- `src/api/modules/oportunidades.api.ts`
- `src/api/modules/parceiros.api.ts`
- `backend/server/*`

### Exposicao indireta ainda existente

- `src/api/modules/index.ts` continua exportando os modulos legacy para compatibilidade.
- Isso nao constitui consumo produtivo, mas ainda pode permitir uso acidental por consumidores futuros ou externos.

## Possiveis Consumidores Externos

Mesmo sem consumidores internos produtivos, ainda existem vetores externos possiveis:

1. Documentacao historica e playbooks antigos que ainda mencionam `backend/server`.
2. Scripts fora do repositorio ou automacoes manuais nao rastreadas no source tree.
3. Qualquer integracao externa que ainda importe os nomes legacy reexportados pelo barrel `src/api/modules/index.ts`.
4. Ambientes de operacao antigos que possam ignorar o pipeline oficial de `backend/`.

## Risco de Remocao

### Baixo para o runtime oficial

- CI/CD oficial nao aponta para `backend/server`.
- `package.json` raiz nao expoe script de producao para `backend/server`.
- `backend/package.json` e os workflows oficiais usam o backend moderno em `backend/src`.

### Medio para compatibilidade externa

- A existencia do barrel `src/api/modules/index.ts` com reexports legacy preserva compatibilidade, mas tambem aumenta o risco de dependencia invisivel.
- Remover os arquivos legacy agora pode quebrar consumidores fora do repositorio que ainda dependam de nomes antigos.

## Recomendacao

**Manter quarentenado por mais uma fase**, com preparacao para corte definitivo.

Motivos:

- zero consumidores produtivos internos encontrados;
- zero dependencia de runtime oficial em `backend/server`;
- ainda existe risco de consumidor externo invisivel;
- o barrel `src/api/modules/index.ts` ainda expoe os modulos legacy por compatibilidade.

## Checklist Antes do Corte Definitivo

1. Confirmar ausencia de scripts externos ou jobs de deploy apontando para `backend/server`.
2. Confirmar que nao existe uso em VPS, containers, pipelines fora do repositorio ou runbooks operacionais antigos.
3. Remover ou substituir as reexports legacy do `src/api/modules/index.ts` se a estrategia for corte definitivo sem alias de compatibilidade.
4. Revalidar que nenhum import produtivo utiliza os nomes legacy `oportunidadesApi` e `parceirosApi`.
5. Executar smoke test dos fluxos:
   - Opportunity
   - Parceiros
   - SDR IA
   - pipeline comercial
6. Reexecutar:
   - `npm run build`
   - `npm test`
   - `cd backend && npm run build`
   - `cd backend && npm test`
7. Registrar plano de rollback caso algum consumidor externo apareca apos o corte.

## Validacoes Executadas

- `npm run build` - OK
- `npm test` - OK
- `cd backend && npm run build` - OK
- `cd backend && npm test` - OK

Resultados observados:

- frontend: 17 suites, 69 testes, todos aprovados;
- backend: 107 suites, 749 testes, todos aprovados.

## Veredito Final

**GO WITH RESTRICTIONS**

O corte definitivo do legado e plausivel na proxima fase, desde que o time trate o barrel de compatibilidade e confirme a ausencia de consumidores externos/deploy fora do repositório. Sem essa confirmacao adicional, a remocao ainda carrega risco operacional evitavel.
