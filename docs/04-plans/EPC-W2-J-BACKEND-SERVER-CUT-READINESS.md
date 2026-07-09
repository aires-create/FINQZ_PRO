# EPC-W2-J - Backend Server Cut Readiness

## Resumo Executivo

> Atualizacao: este documento foi superado pela execucao do corte em EPC-W2-L. `backend/server` foi removido e o runtime unico oficial passou a ser o backend Fastify em `backend/src`, com superfice oficial em `/api/v1/*`.

A auditoria confirma que o runtime oficial do FINQZ PRO hoje esta no backend Fastify moderno em `backend/src`, com rotas em `/api/v1/*`, e nao em `backend/server`.

O que foi verificado localmente:

- `package.json` raiz nao referencia `backend/server`;
- `backend/package.json` executa `src/server.ts` e `dist/server.js`, nao `backend/server`;
- `package-lock.json`, `vite.config.ts`, `tsconfig*.json`, `README.md` e `.env.example` nao expuseram uso produtivo de `backend/server`;
- workflows de CI/release nao apontam para `backend/server`;
- buscas em `src` e `backend` fora de `backend/server/**` nao encontraram consumidores produtivos internos.

O risco remanescente nao esta no runtime oficial, mas sim em:

- documentacao historica que ainda cita `backend/server`;
- processos externos/deploy/VPS fora do source tree;
- referencias legadas dentro da propria area quarentenada.

Conclusao: `backend/server` esta pronto para a proxima fase de corte, mas ainda nao deve ser removido sem um checkpoint final de deploy/VPS e sem um plano de rollback operacional claro.

## Referencias Encontradas

| Referencia | Localizacao | Classificacao | Observacao |
|---|---|---:|---|
| `backend/server/package.json` | `backend/server/package.json` | quarentena | marcador de runtime legado/quarentenado |
| `backend/server/src/index.ts` | `backend/server/src/index.ts` | quarentena | runtime legado congelado |
| `backend/server/src/defs/index.ts` | `backend/server/src/defs/index.ts` | quarentena | defs do runtime legado |
| `backend/package.json` | `backend/package.json` | produtiva | usa `src/server.ts`, `dist/server.js` e `start:prod` no backend oficial |
| `backend/src/core/http/fastify.ts` | `backend/src/core/http/fastify.ts` | produtiva | registra as rotas oficiais em `/api/v1/*` |
| `backend/src/modules/*` | `backend/src/modules/*` | produtiva | rotas oficiais do backend moderno |
| `src/**/*` fora de `backend/server/**` | `src/**` | falso positivo | nenhuma referencia produtiva nova a `backend/server` encontrada |
| `backend/**/*` fora de `backend/server/**` | `backend/**` | falso positivo | nenhuma referencia produtiva nova a `backend/server` encontrada |
| `package.json` | `package.json` | falso positivo | sem runtime legacy em scripts oficiais |
| `package-lock.json` | `package-lock.json` | falso positivo | sem superficie util de `backend/server` encontrada |
| `README.md` | `README.md` | falso positivo | sem referencia util encontrada |
| `.env.example` | `.env.example` | falso positivo | sem referencia util encontrada |
| `vite.config.ts` | `vite.config.ts` | falso positivo | sem referencia util encontrada |
| `tsconfig.json` | `tsconfig.json` | falso positivo | sem referencia util encontrada |
| `tsconfig.app.json` | `tsconfig.app.json` | falso positivo | sem referencia util encontrada |
| `tsconfig.node.json` | `tsconfig.node.json` | falso positivo | sem referencia util encontrada |
| `.github/workflows/ci.yml` | `.github/workflows/ci.yml` | falso positivo | CI oficial nao aponta para `backend/server` |
| `.github/workflows/release.yml` | `.github/workflows/release.yml` | falso positivo | release oficial nao aponta para `backend/server` |
| `scripts/arch-check.mjs` | `scripts/arch-check.mjs` | falso positivo | governance check sem dependência de `backend/server` |
| `docs/00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md` | docs | documentacao historica | cita `backend/server` como legado |
| `docs/00-master/audits/PRP-AUD-02-PRODUCTION-READINESS-FINAL-AUDIT.md` | docs | documentacao historica | referencia `backend/server/src/index.ts` como superficie de risco |
| `docs/02-architecture/*` | docs | documentacao historica | varios planos ainda citam `backend/server` para decommission future |
| `docs/03-audits/*` | docs | documentacao historica / ativa | auditorias e planos de quarentena ainda citam o runtime legado |
| `docs/04-plans/*` | docs | documentacao ativa | planejamento atual ainda monitora o corte de `backend/server` |
| `docs/05-adr/ADR-005-legacy-youware-backend-classification.md` | docs | documentacao historica / ativa | classifica `backend/server` como legado congelado |

## Classificacao de Risco

### Baixo

- `package.json`, `backend/package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig*.json`, `README.md`, `.env.example`.
- nao foram encontrados usos produtivos de `backend/server` nessas superficies.

### Medio

- `docs/04-plans/*`, `docs/03-audits/*`, `docs/02-architecture/*`, `docs/05-adr/*`.
- sao referencias documentais legitimas, mas podem induzir reuso indevido se nao forem mantidas coerentes com a quarentena.

### Medio/Alto

- `backend/server/package.json`, `backend/server/src/index.ts`, `backend/server/src/defs/index.ts`.
- continuam existindo como runtime legacy e podem ser usados por processo externo nao rastreado.

## Decisao Recomendada

**Manter backend/server quarentenado por mais uma fase.**

Motivos:

- nao ha dependencia produtiva interna encontrada;
- nao ha uso em build/start/deploy/CI/CD oficial encontrado;
- ainda falta confirmacao externa absoluta de VPS, runbooks e automacoes fora do repositorio;
- o risco residual e operacional, nao arquitetural.

## Checklist Antes do Corte

1. Confirmar ausencia de scripts externos apontando para `backend/server`.
2. Confirmar ausencia de jobs de VPS/cron/deploy usando `backend/server`.
3. Confirmar ausencia de rotas do legacy em ambientes publicados.
4. Confirmar que a documentacao operacional ativa nao manda subir `backend/server`.
5. Confirmar que nenhum consumidor fora do repositorio depende do legado.
6. Preparar rollback rastreavel para o runtime legacy inteiro.

## Checklist Pos-Corte

1. `npm run build`
2. `npm test`
3. `cd backend && npm run build`
4. `cd backend && npm test`
5. Smoke test dos fluxos:
   - auth
   - opportunity
   - partners
   - commercial
   - integrations
6. Validar que:
   - `backend/server` nao aparece em scripts;
   - `backend/server` nao aparece em CI/CD;
   - `backend/server` nao aparece em docs operacionais ativas;
   - `backend/server` nao aparece em Docker/VPS usados em producao.

## Rollback

### Se o corte de `backend/server` falhar

- restaurar a pasta legacy a partir do ultimo commit aprovado;
- reativar somente o minimo necessario para estabilizar o ambiente;
- registrar o consumidor que quebrou a remocao.

### Regra de rollback

- rollback por commit unico e rastreavel;
- nao reintroduzir o runtime legacy sem evidenciar a dependencia que o exigiu.

## Riscos Externos

1. Deploy manual ou VPS antigo ainda pode apontar para `backend/server`.
2. Runbooks ou documentos operacionais fora do repositório podem continuar instruindo o uso do runtime legado.
3. Algum processo auxiliar externo pode depender do envelope ou comportamento antigo.
4. Referencias historicas podem ser confundidas com runtime ativo se nao houver comunicacao clara.

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

O runtime `backend/server` esta pronto para o corte na proxima etapa, mas a remocao ainda deve aguardar a confirmacao final de ausencia de dependencias externas, de deploy e de VPS. A arquitetura oficial ja nao depende dele; o risco agora e de operacao externa, nao de runtime principal.
