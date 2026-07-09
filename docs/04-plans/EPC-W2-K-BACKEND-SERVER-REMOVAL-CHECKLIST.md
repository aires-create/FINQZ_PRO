# EPC-W2-K - Backend Server Removal Checklist

## Resumo Executivo

> Atualizacao: o corte descrito neste checklist foi executado em EPC-W2-L. `backend/server` foi removido e o runtime unico oficial agora e o backend Fastify em `backend/src`, com superficie oficial em `/api/v1/*`.

Este checklist prepara a execucao controlada do corte definitivo de `backend/server/*`.

As evidencias coletadas ate aqui apontam que:

- o runtime oficial do FINQZ PRO e o backend Fastify moderno em `backend/src`;
- as rotas oficiais seguem o padrao `/api/v1/*`;
- `backend/server` nao aparece em scripts oficiais de start/build, nem em workflows de CI/CD ou release;
- as referencias restantes a `backend/server` sao documentais ou estao confinadas a area legacy/quarentenada.

Conclusao operacional:

- o corte pode entrar na fila de execucao;
- ainda assim, a remocao fisica de `backend/server/*` deve ocorrer somente apos confirmacao final de ausencia de dependencias externas de deploy, VPS e runbooks operacionais ativos.

## Referencias Encontradas

| Referencia | Localizacao | Classificacao | Observacao |
|---|---|---:|---|
| `backend/server/package.json` | `backend/server/package.json` | quarentena | runtime legacy congelado |
| `backend/server/src/index.ts` | `backend/server/src/index.ts` | quarentena | entrada principal do runtime legacy |
| `backend/server/src/defs/index.ts` | `backend/server/src/defs/index.ts` | quarentena | definicoes do runtime legacy |
| `backend/src/server.ts` | `backend/src/server.ts` | produtiva | bootstrap oficial do backend moderno |
| `backend/src/core/http/fastify.ts` | `backend/src/core/http/fastify.ts` | produtiva | registra as rotas oficiais em `/api/v1/*` |
| `backend/src/modules/*` | `backend/src/modules/*` | produtiva | dominio oficial |
| `package.json` | `package.json` | falso positivo | nenhum script oficial aponta para `backend/server` |
| `backend/package.json` | `backend/package.json` | produtiva | usa `src/server.ts` / `dist/server.js` |
| `package-lock.json` | `package-lock.json` | falso positivo | sem uso produtivo de `backend/server` encontrado |
| `.github/workflows/ci.yml` | `.github/workflows/ci.yml` | deploy / falso positivo | CI oficial nao referencia `backend/server` |
| `.github/workflows/release.yml` | `.github/workflows/release.yml` | deploy / falso positivo | release oficial nao referencia `backend/server` |
| `README.md` | `README.md` | falso positivo | sem instrucao operacional para `backend/server` |
| `.env.example` | `.env.example` | falso positivo | sem referencia util encontrada |
| `vite.config.ts` | `vite.config.ts` | falso positivo | sem referencia util encontrada |
| `tsconfig.json` | `tsconfig.json` | falso positivo | sem referencia util encontrada |
| `tsconfig.app.json` | `tsconfig.app.json` | falso positivo | sem referencia util encontrada |
| `tsconfig.node.json` | `tsconfig.node.json` | falso positivo | sem referencia util encontrada |
| `scripts/arch-check.mjs` | `scripts/arch-check.mjs` | falso positivo | governance check sem dependencia de `backend/server` |
| `docs/00-master/*` | docs | documentacao historica | citacoes de `backend/server` como legado |
| `docs/02-architecture/*` | docs | documentacao historica | planos antigos de descomissionamento |
| `docs/03-audits/*` | docs | documentacao ativa / historica | auditorias atuais ainda monitoram o legacy |
| `docs/04-plans/*` | docs | documentacao ativa | plano atual de corte e checklist de execucao |
| `docs/05-adr/*` | docs | documentacao historica / ativa | classificacao formal do legacy congelado |
| `src/**/*` fora de `backend/server/**` | `src/**` | falso positivo | nenhum consumidor produtivo interno encontrado |
| `backend/**/*` fora de `backend/server/**` | `backend/**` | falso positivo | nenhum consumidor produtivo interno encontrado |

## Classificacao de Risco

### Baixo

- `package.json`
- `backend/package.json`
- `package-lock.json`
- `README.md`
- `.env.example`
- `vite.config.ts`
- `tsconfig*.json`
- `scripts/arch-check.mjs`

Motivo:

- nao expuseram dependencia produtiva de `backend/server`.

### Medio

- documentacao ativa e historica em `docs/00-master`, `docs/02-architecture`, `docs/03-audits`, `docs/04-plans`, `docs/05-adr`.

Motivo:

- podem induzir reuso indevido se nao forem mantidas alinhadas com a desativacao do legacy.

### Medio/Alto

- `backend/server/package.json`
- `backend/server/src/index.ts`
- `backend/server/src/defs/index.ts`

Motivo:

- ainda podem ser tocados por processos externos, scripts manuais, VPS ou deploy fora do source tree.

## Checklist Pre-Corte

- [ ] Confirmar branch limpa e alinhada com o commit de remocao planejado.
- [ ] Confirmar ausencia de consumidores produtivos internos de `backend/server`.
- [ ] Confirmar que `backend/server` nao participa do runtime oficial.
- [ ] Confirmar que nao ha dependencias de `backend/server` em CI/CD, workflows, Docker, VPS, scripts ou docs operacionais ativas.
- [ ] Confirmar que o rollback esta pronto e rastreavel.
- [ ] Informar Frontend, Backend, QA e DevOps sobre a janela de corte.

## Checklist de Execucao

### Fase 1 - Remocao fisica

- [ ] Remover `backend/server/package.json`.
- [ ] Remover `backend/server/src/index.ts`.
- [ ] Remover `backend/server/src/defs/index.ts`.
- [ ] Remover a pasta `backend/server/*`.

### Fase 2 - Busca imediata de referencias remanescentes

- [ ] Rodar busca textual por `backend/server`.
- [ ] Rodar busca textual por `backend/server/src`.
- [ ] Rodar busca textual por `backend/server/package`.
- [ ] Rodar busca em:
  - [ ] `package.json`
  - [ ] `backend/package.json`
  - [ ] `package-lock.json`
  - [ ] `.github/workflows`
  - [ ] `scripts`
  - [ ] `README.md`
  - [ ] `.env.example`
  - [ ] `vite.config.ts`
  - [ ] `tsconfig*.json`
  - [ ] `docs/`

### Fase 3 - Ajustes documentais, se necessario

- [ ] Atualizar docs operacionais ativas caso algum passo ainda cite `backend/server`.
- [ ] Registrar que o runtime oficial permanece em `backend/src`.
- [ ] Evitar criar qualquer novo alias para o runtime legado.

### Fase 4 - Validacao pos-corte

- [ ] Rodar `npm run build`.
- [ ] Rodar `npm test`.
- [ ] Rodar `cd backend && npm run build`.
- [ ] Rodar `cd backend && npm test`.
- [ ] Executar smoke tests dos fluxos oficiais.

## Comandos de Busca

Executar nesta ordem:

1. `rg -n "backend/server" package.json backend/package.json package-lock.json`
2. `rg -n "backend/server" README.md .env.example vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json`
3. `rg -n "backend/server" .github/workflows scripts docs`
4. `rg -n "backend/server" src backend --glob '!backend/server/**'`
5. `rg -n "backend/server/src|backend/server/package" .`

## Comandos de Validacao

Executar nesta ordem:

1. `npm run build`
2. `npm test`
3. `cd backend && npm run build`
4. `cd backend && npm test`

Validacoes complementares:

- busca textual por `backend/server`
- smoke test das rotas `/api/v1/*`
- checagem de CI/CD e deploy

## Rollback

### Se a remocao quebrar algum fluxo

- restaurar `backend/server/*` a partir do ultimo commit aprovado;
- reter a remocao ate identificar o consumidor ou o pipeline que dependia do legado;
- documentar o motivo do rollback.

### Regra de rollback

- rollback por commit unico;
- nunca reintroduzir o legacy sem diagnostico claro da dependencia.

## Riscos Externos

1. VPS ou deploy manual fora do repositório ainda pode apontar para `backend/server`.
2. Runbooks operacionais antigos podem continuar instruindo a inicializacao do runtime legacy.
3. Jobs, scripts locais ou automacoes antigas nao aparecerao necessariamente nas buscas do source tree.
4. Documentacao historica pode ser confundida com documentacao operacional ativa.

## Criterio de Pronto

O checklist fica apto para execucao quando:

- a branch estiver limpa;
- nao existirem consumidores produtivos internos;
- nao houver uso em build/start/deploy/CI/CD;
- o rollout e rollback estiverem documentados;
- o runtime oficial continuar provado em `backend/src`.

## Veredito Final

**GO**

O corte de `backend/server` pode seguir para a proxima etapa de execucao controlada, desde que o checklist acima seja cumprido integralmente e que a remocao ocorra com rollback pronto e comunicacao previa aos times envolvidos.
