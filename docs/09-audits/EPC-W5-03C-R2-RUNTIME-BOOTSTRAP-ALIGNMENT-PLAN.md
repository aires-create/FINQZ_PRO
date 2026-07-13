# EPC-W5-03C-R2 — Runtime Bootstrap Alignment Plan

## 1. Metadados

- `planId`: `EPC-W5-03C-R2`
- `subtitle`: `Official Startup Launch-Path and Environment Resolution Review`
- `status`: `DRAFT_FOR_REVIEW`
- `verdict`: `APPROVED_WITH_RESTRICTIONS`
- `branch`: `homologation/bootstrap-vps`
- `head`: `1fdac11d10d3fc5106eb952a260fc7e318e5dcab`
- `sourceOfTruth`: `EPC-W5-03C-R1`
- `currentOwner`: `Runtime / Bootstrap / Environment Resolution`

## 2. Objetivo

Definir um plano oficial, seguro e reversivel para eliminar a dependencia implicita do `cwd` na inicializacao local do backend, preservando:

- desenvolvimento local;
- execucao pela raiz;
- execucao pelo diretorio `backend/`;
- testes;
- Docker;
- homologacao;
- producao;
- compatibilidade;
- rollback;
- governanca;
- seguranca.

## 3. Escopo

Este documento cobre apenas:

- leitura e comparacao tecnica;
- desenho de estrategia;
- matriz de comando oficial;
- politica de precedencia de ambiente;
- impacto em Docker, testes e Prisma;
- rollback futuro;
- classificacao ADR / EPC / Runbook.

## 4. Fora de escopo

- nenhuma correção foi implementada;
- nenhum `.env` foi alterado;
- nenhum script foi alterado;
- nenhum `package.json` foi alterado;
- nenhum Dockerfile foi alterado;
- nenhum Prisma schema foi alterado;
- nenhum bootstrap foi alterado;
- nenhum teste foi executado;
- nenhum build foi executado.

## 5. Baseline

- branch esperada: `homologation/bootstrap-vps`
- HEAD esperado: `1fdac11`
- commit esperado: `docs(audit): add W5-03C-R1 runtime readiness diagnosis`
- working tree preexistente preservado:
  - `.env.example`
  - `docs/01-architecture/SDC-FASE-3.4H-F-LOCAL-ACTIVATION-READINESS.md`
  - `scripts/sdc-3.4h-f-local-readiness.mjs`

## 6. Decisoes vigentes

- `ROOT_CAUSE_STATUS`: `CONFIRMED`
- causa primaria: `cwd-dependent environment resolution during local backend startup`
- `Gate A`: `PASS_BY_TEST_AND_STATIC_EVIDENCE`
- `Gate B`: `PASS_BY_TEST_NOT_LIVE_VALIDATED`
- `Gate C`: `FAIL_NO_LIVE_EVIDENCE`
- `Gate D`: `NOT_APPLICABLE`
- `Gate E`: `NOT_APPLICABLE`
- `Gate F`: `FAIL_NO_LIVE_EVIDENCE`
- `Gate G`: `FAIL_NO_LIVE_EVIDENCE`
- `Gate H`: `PASS_BY_DOCUMENTATION_AND_TEST`
- primeiro corte funcional: `DEFERRED_PENDING_GATES`

## 7. Documentos consultados

- `docs/09-audits/EPC-W5-03C-R1-LOCAL-RUNTIME-READINESS-DIAGNOSIS.md`
- `docs/09-audits/evidence/EPC-W5-03C-R1-LOCAL-RUNTIME-READINESS-DIAGNOSIS.json`
- `docs/09-audits/evidence/EPC-W5-03C-R1-RUNTIME-VS-TESTS.mmd`
- `docs/09-audits/EPC-W5-03C-OBSERVABILITY-BASELINE.md`
- `docs/09-audits/evidence/EPC-W5-03C-OBSERVABILITY-BASELINE.json`
- `docs/09-audits/EPC-W5-03A-SPEC-MASTER-CATALOG-OBSERVABILITY.md`
- `docs/09-audits/evidence/EPC-W5-03A-SPEC-MASTER-CATALOG-OBSERVABILITY.json`
- `docs/09-audits/evidence/EPC-W5-03A-OBSERVABILITY-ARCHITECTURE.mmd`
- `docs/00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md`
- `docs/00-master/PCCD-FINQZ-PRO-ENTERPRISE.md`
- `docs/03-decision-platform/DCA-ENTERPRISE-DECISION-PLATFORM-v1.md`
- `docs/03-runtime/RUN-001-RUNTIME_GOVERNANCE.md`
- `docs/05-adr/ADR-004-commercial-master-catalog.md`
- `docs/05-adr/ADR-010-loan-with-collateral-canonical-taxonomy.md`
- `docs/01-architecture/SDC-FASE-3.4H-F-LOCAL-ACTIVATION-READINESS.md`
- `scripts/sdc-3.4h-f-local-readiness.mjs`

## 8. Arquivos analisados

- `backend/src/config/env.ts`
- `backend/src/config/env/env.ts`
- `backend/src/config/env/env.schema.ts`
- `backend/src/config/env/env.validation.ts`
- `backend/src/config/env/env.transform.ts`
- `backend/src/server.ts`
- `backend/src/server.fastify.ts`
- `backend/src/app.ts`
- `backend/src/core/http/fastify.ts`
- `backend/src/database/prisma.ts`
- `backend/src/core/prisma/client.ts`
- `backend/src/shared/logger.ts`
- `backend/vitest.config.ts`
- `backend/src/tests/setup.ts`
- `backend/prisma/schema.prisma`
- `backend/prisma/seed.ts`
- `backend/package.json`
- `package.json`
- `backend/Dockerfile`
- `backend/docker-compose.yml`
- `backend/docker-compose.hml.yml`
- `backend/docs/environment-variables.md`
- `backend/docs/staging-smoke-checklist.md`

## 9. Estado atual

- o `backend` e um subprojeto separado do frontend raiz;
- `backend/src/server.ts` e o bootstrap operacional atual;
- `backend/src/server.fastify.ts` existe como bootstrap alvo recomendado;
- `backend/src/config/env/env.ts` usa `dotenv.config()` sem caminho explicito;
- `backend/src/database/prisma.ts` chama `PrismaClient` e executa readiness antes do `listen`;
- a suíte de testes injeta `process.env` em `setupFiles`;
- Docker injeta variaveis explicitamente via compose;
- o bloqueio R1 continua sendo deterministico por `cwd`.

## 10. Causa raiz confirmada

- `ROOT_CAUSE_STATUS: CONFIRMED`
- `Primary cause`: `cwd-dependent environment resolution during local backend startup`
- a raiz do repositório não resolve o conjunto obrigatório de variáveis do backend;
- o diretório `backend/` resolve o arquivo local esperado e o Prisma conecta;
- os testes carregam ambiente antes do Prisma;
- a evidência antiga de TLS permanece `STALE_OR_NOT_REPRODUCED`.

## 11. Requisitos

- carregamento determinístico;
- precedência explícita de variáveis;
- produção nunca dependente de arquivo local;
- variáveis já injetadas têm prioridade;
- zero duplicidade de loader;
- zero dependency on import order;
- zero fallback silencioso para arquivo errado;
- erro claro quando ambiente não existir;
- compatibilidade com Windows e Linux;
- compatibilidade com Docker, Vitest e Prisma CLI;
- rollback simples;
- documentação obrigatória.

## 12. Restricoes

- nao implementar nesta etapa;
- nao alterar `.env` ou qualquer `.env.*`;
- nao alterar `package.json`, lockfile, `tsconfig` ou Vitest config;
- nao alterar Docker ou compose;
- nao alterar Prisma schema, client, seed ou migrations;
- nao alterar runtime funcional;
- nao alterar frontend;
- nao acessar VPS;
- nao executar deploy.

## 13. Principios

- backend first;
- tenant scoped;
- contracts before runtime;
- environment by policy, not by accidente;
- explicit beats implicit;
- fail fast before side effects;
- production ignores local files;
- local dev may use an explicit local file only when authorized;
- command wrappers should be deterministic;
- no secrets in docs, logs or fallback paths.

## 14. CWD oficial

- `backend/` deve ser o diretório oficial direto do backend;
- a raiz pode ser suportada apenas por wrapper explícito;
- a execucao direta pela raiz sem wrapper nao deve ser considerada contrato oficial;
- o `cwd` nao deve ser inferido de forma implicita pela inicializacao.

## 15. Politica de ambiente

Politica proposta:

1. `process.env` ja existente tem prioridade.
2. Ambiente injetado por Docker, CI, HML ou producao tem prioridade sobre arquivo local.
3. Um arquivo local explicito so pode ser carregado em desenvolvimento local autorizado.
4. Defaults nao sensiveis podem existir apenas quando definidos pela validacao.
5. Falha deve ocorrer antes de qualquer efeito colateral.

Regras complementares:

- `override` deve permanecer `false`;
- producao deve ignorar completamente arquivos locais;
- `backend/.env` e o unico arquivo local oficial, se e somente se o modo local o autorizar;
- `backend/.env.example` e apenas template;
- `root .env` deve ser ignorado pelo backend;
- `src/.env` deve ser proibido;
- `.env.local` e `.env.test` nao devem ser carregados automaticamente.

## 16. Politica de precedencia

Ordem oficial recomendada:

1. `process.env` existente;
2. ambiente do runtime externo;
3. `backend/.env` apenas em local autorizado;
4. defaults nao sensiveis;
5. validacao fail-fast.

## 17. Arquivos permitidos

- `backend/.env` como arquivo local oficial de desenvolvimento;
- `backend/.env.example` como template;
- variaveis injetadas por Docker, CI, HML e producao;
- variaveis explicitamente exportadas no terminal antes do start.

## 18. Arquivos proibidos

- `./.env` do repositorio raiz para o backend;
- `src/.env`;
- qualquer carregamento automatico de `.env.local` ou `.env.test`;
- qualquer arquivo local carregado em producao;
- qualquer fallback silencioso para caminho errado.

## 19. Comandos oficiais

| Contexto | Comando oficial | CWD | Fonte de ambiente |
|---|---|---|---|
| Local pela raiz | `npm --prefix backend run dev` | raiz | wrapper explicito para `backend/` |
| Local pelo backend | `npm run dev` | `backend/` | backend local autorizado |
| Teste | `npm run test` | `backend/` | `setupFiles` do Vitest |
| Build | `npm run build` | `backend/` | sem dotenv local |
| Start compilado | `node dist/server.js` | `backend/` | env injetado / wrapper de producao |
| Prisma validate | `npx prisma validate` | `backend/` | env injetado / local autorizado |
| Prisma generate | `npm run db:generate` | `backend/` | env injetado / local autorizado |
| Seed | `npm run db:seed` | `backend/` | env injetado / local autorizado |
| Docker | `docker compose up --build` | `backend/` | compose `environment` |
| Homologacao | `docker compose -f docker-compose.yml -f docker-compose.hml.yml up --build` | `backend/` | compose + env-file externo |
| Producao | `node dist/server.js` | container / host operacional | env injetado externamente |

## 20. Local pela raiz

- usar `npm --prefix backend run dev`;
- nao depender de `cwd` implícito;
- nao usar root `npm run dev` para o backend, porque o root e o frontend;
- se o wrapper falhar, o erro deve ser de ambiente, nao de descoberta de arquivo errado.

## 21. Local pelo backend

- usar `npm run dev` em `backend/`;
- o bootstrap deve carregar somente o ambiente autorizado;
- o backend deve falhar se o arquivo local oficial nao existir ou nao for autorizado;
- o caminho deve ser deterministico e cross-platform.

## 22. Testes

- o loader futuro deve respeitar `process.env` ja preenchido;
- `backend/.env` nao deve vazar para `NODE_ENV=test`;
- `setupFiles` deve continuar sendo a fonte do ambiente dos testes;
- a ordem de import deve permanecer deterministica.

## 23. Build

- `npm run build` em `backend/`;
- o build nao deve depender de `dotenv` local para compilar;
- o build deve produzir `dist/` que se comporta igual ao source no contrato de ambiente.

## 24. Start compilado

- `node dist/server.js` dentro de `backend/` e o start compilado oficial;
- wrapper root apenas delega para o backend;
- producao nunca deve depender de arquivo local;
- falha de ambiente deve ocorrer antes de qualquer efeito colateral.

## 25. Prisma CLI

- Prisma CLI deve ser executado em `backend/`;
- `validate` e `generate` devem receber ambiente por injeção externa ou pelo caminho local autorizado;
- o fluxo nao deve usar root `.env`;
- o fluxo nao deve introduzir loader duplicado.

## 26. Seed

- `npm run db:seed` em `backend/`;
- o seed deve usar o mesmo contrato de ambiente do backend;
- o seed nao deve inferir variaveis de arquivo errado;
- a execucao deve falhar cedo se o ambiente nao estiver pronto.

## 27. Docker

- compose ja injeta `NODE_ENV`, `PORT`, `HOST`, `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`;
- Docker nao deve carregar arquivo local;
- `backend/.env` local nao deve vazar para container;
- a futura correção local nao deve quebrar build, healthcheck ou readiness.

## 28. Homologacao

- HML deve continuar baseada em env injetado e compose override;
- `backend/.env` local nao deve participar do deploy;
- o plano futuro deve preservar rollback operacional por ambiente;
- a execução deve ser compatível com `docker compose -f docker-compose.yml -f docker-compose.hml.yml up --build`.

## 29. Producao

- producao deve usar somente `process.env`/injeção externa;
- nenhum arquivo local pode ser lido em producao;
- o container deve continuar executando `node dist/server.js`;
- qualquer erro de env deve ser fail-fast.

## 30. Alternativa A1

- `BACKEND_CWD_ONLY`
- classificacao: `NOT_RECOMMENDED`
- simplicidade: alta
- risco operacional: medio/alto
- problema principal: nao preserva bem a experiencia pela raiz sem wrapper

## 31. Alternativa A2

- `ROOT_WRAPPER` via `npm --prefix backend`
- classificacao: `ACCEPTABLE`
- simplicidade: alta
- compatibilidade: boa
- risco: baixo
- observacao: wrapper operacional resolve a raiz sem misturar o root frontend com scripts de backend

## 32. Alternativa A3

- `EXPLICIT_ENV_PATH`
- classificacao: `CONDITIONAL`
- simplicidade: media
- risco: medio
- observacao: bom para eliminar dependencia de cwd, mas precisa ser rigidamente limitado a local autorizado

## 33. Alternativa A4

- `PROJECT_ROOT_DISCOVERY`
- classificacao: `ACCEPTABLE`
- simplicidade: media/alta
- risco: baixo/m medio
- observacao: robusto em ESM se resolver via `import.meta.url` e raiz do backend

## 34. Alternativa A5

- `ENV_INJECTION_ONLY`
- classificacao: `ACCEPTABLE`
- simplicidade: alta em producao
- risco local: alto para onboarding
- observacao: ideal para producao, Docker, CI e HML; insuficiente sozinho para a experiencia local

## 35. Alternativa A6

- `CONTROLLED_HYBRID`
- classificacao: `RECOMMENDED`
- descricao: producao/test/HML usam injeção externa; desenvolvimento local pode carregar `backend/.env` explicitamente; wrapper root e opcional; nunca sobrescrever `process.env`
- vantagem: menor diff seguro com cobertura de todos os ambientes

## 36. Comparacao de alternativas

| Alternativa | Classificacao | Força | Fraqueza | Uso recomendado |
|---|---|---|---|---|
| A1 | `NOT_RECOMMENDED` | simples | quebra raiz | nao |
| A2 | `ACCEPTABLE` | ergonomia | ainda precisa contrato de loader | sim, como wrapper operacional |
| A3 | `CONDITIONAL` | elimina cwd | risco de arquivo errado | sim, apenas com gating local |
| A4 | `ACCEPTABLE` | robusta | mais complexa que A2 | sim, se usar `import.meta.url` |
| A5 | `ACCEPTABLE` | ideal para prod | fraca para onboarding local | sim, em prod/Docker/CI |
| A6 | `RECOMMENDED` | balanceada | exige disciplina de contrato | sim, como estrategia principal |

## 37. Estrategia selecionada

- estrategia: `CONTROLLED_HYBRID`
- foco: loader deterministico + precedencia explicita + producao sem arquivos locais
- o backend oficial continua ancorado em `backend/`
- a raiz continua suportada apenas por wrapper explicito

## 38. Justificativa

- menor diff seguro entre as alternativas avaliadas;
- preserva local, testes, Docker, HML e producao sem misturar responsabilidades;
- evita que root `.env` ou `src/.env` virem fallback silencioso;
- reduz risco de regressao em Prisma CLI e em build compilado;
- permite rollback simples por ambiente.

## 39. Impacto em Docker

- risco estimado: `LOW_RISK`;
- o compose atual ja injeta ambiente explicitamente;
- o futuro loader nao deve acionar em container quando `process.env` ja vier preenchido;
- condicao para GO: nenhuma leitura de arquivo local dentro do container.

## 40. Impacto nos testes

- risco estimado: `NO_IMPACT` a `LOW_RISK`;
- `setupFiles` continua sendo a fonte do ambiente de teste;
- o loader futuro deve respeitar `process.env` ja preenchido e nao tocar em `backend/.env`;
- condicao para GO: nenhum vazamento de arquivo local para `NODE_ENV=test`.

## 41. Impacto no Prisma

- risco estimado: `LOW_RISK`;
- Prisma CLI e runtime devem compartilhar a mesma politica de precedencia;
- comandos devem ser executados em `backend/`;
- condicao para GO: `validate`, `generate`, `seed` e runtime seguem o mesmo contrato.

## 42. Seguranca

- allowlist de ambiente: `process.env`, Docker/CI/HML/producao, `backend/.env` local autorizado;
- denylist: root `.env`, `src/.env`, carregamento automatico de `.env.local` e `.env.test`, override implicito;
- nenhuma variavel sensivel em log ou documento;
- nenhum path pessoal permanente;
- nenhum fallback silencioso;
- nenhuma geracao artificial de IDs;
- nenhuma surpresa entre Prisma CLI e runtime.

## 43. Compatibilidade Windows/Linux

- preferir caminho resolvido por `import.meta.url` ou marcador de projeto;
- evitar `__dirname` em fluxo ESM;
- nao depender de separadores de path específicos da plataforma;
- comandos documentados devem funcionar em Windows PowerShell e shells Linux equivalentes.

## 44. Compatibilidade com dist

- o build compilado deve continuar apontando para o mesmo contrato de ambiente;
- o resolver precisa funcionar tanto em `src/` quanto em `dist/`;
- nao depender de path da maquina;
- nao depender de estrutura transiente de execução.

## 45. Compatibilidade com monorepo

- o repositorio tem frontend na raiz e backend em subprojeto;
- o backend nao deve herdar automaticamente o `.env` do frontend;
- wrappers devem deixar claro o alvo `backend/`;
- nenhuma mudanca de monorepo e necessaria nesta fase.

## 46. Plano de implementacao futura

Plano minimo seguro:

1. aprovar este plano;
2. centralizar o bootstrap de ambiente em um contrato unico;
3. tornar a resolucao do `backend/.env` deterministica apenas em local autorizado;
4. alinhar testes e Prisma CLI;
5. validar Docker e start compilado;
6. coletar baseline live;
7. reavaliar Gates C, F e G.

## 47. Microfases

- `R2-A`: aprovar o plano;
- `R2-B`: centralizar o contrato de bootstrap de ambiente;
- `R2-C`: introduzir resolucao deterministica do ambiente local;
- `R2-D`: alinhar testes e Prisma CLI;
- `R2-E`: validar Docker e start compilado;
- `R2-F`: coletar baseline live;
- `R2-G`: reavaliar Gates C, F e G;
- `R2-H`: consolidar a decisao final.

## 48. Arquivos provaveis

| Arquivo | Classificacao | Observacao |
|---|---|---|
| `backend/src/config/env.ts` | `REQUIRED` | fachada oficial do contrato de ambiente |
| `backend/src/config/env/env.ts` | `REQUIRED` | implementacao do loader deterministico |
| `backend/src/server.ts` | `REQUIRED` | bootstrap operacional atual |
| `backend/src/server.fastify.ts` | `LIKELY` | bootstrap alvo recomendado |
| `backend/src/app.ts` | `LIKELY` | wrapper compativel |
| `backend/package.json` | `LIKELY` | scripts backend |
| `package.json` | `POSSIBLE` | wrapper raiz opcional |
| `backend/Dockerfile` | `POSSIBLE` | ajustar apenas se necessario |
| `backend/docker-compose.yml` | `POSSIBLE` | manter injeção explicita |
| `backend/src/tests/setup.ts` | `LIKELY` | preservacao de isolamento de testes |
| `backend/docs/environment-variables.md` | `LIKELY` | politica documentada |
| `backend/docs/staging-smoke-checklist.md` | `POSSIBLE` | runbook de checagem |

## 49. Testes futuros

- unidade para precedencia deterministica;
- unidade para `override=false`;
- unidade para ausencia de arquivo local;
- unidade para producao sem dotenv local;
- unidade para preservacao de `process.env`;
- unidade para resolucao Windows;
- unidade para resolucao Linux;
- unidade para build/dist;
- integracao para start pela raiz;
- integracao para start pelo backend;
- integracao para Prisma connect e `SELECT 1`;
- integracao para readiness;
- integracao para Docker;
- seguranca para nao carregar root `.env` ou `src/.env`.

## 50. Rollback

### Nivel 1 - Command rollback

- gatilho: wrapper raiz ou comando local novo falha;
- owner: runtime lead;
- comando: voltar a execucao oficial via `backend/`;
- impacto: baixo;
- validacao: start local e Prisma passam;
- tempo maximo: imediato;
- risco: baixo.

### Nivel 2 - Code rollback

- gatilho: loader deterministico introduz regressao;
- owner: runtime engineering;
- comando: reverter o ajuste de loader/wrapper;
- impacto: medio;
- validacao: startup e testes regressam ao baseline;
- tempo maximo: uma janela curta de hotfix;
- risco: medio.

### Nivel 3 - Operational rollback

- gatilho: divergencia entre root, backend e Docker nao resolvida;
- owner: arquitetura + operacao;
- comando: restringir oficialmente a execucao ao caminho aprovado;
- impacto: alto para ergonomia, baixo para seguranca;
- validacao: runbook e comunicacao operacional;
- tempo maximo: no mesmo ciclo de release;
- risco: baixo/medio.

## 51. ADR/EPC/Runbook

| Decisao | Classificacao |
|---|---|
| cwd oficial | `ADR_REQUIRED` |
| politica de precedencia | `ADR_REQUIRED` |
| loader deterministico | `ADR_REQUIRED` |
| wrapper root-level | `RUNBOOK_SUFFICIENT` |
| politica de `.env` em producao | `ADR_UPDATE_REQUIRED` |
| multiplos arquivos `.env` | `ADR_REQUIRED` |
| alteracao de scripts npm | `ADR_UPDATE_REQUIRED` |
| alteracao de Docker | `ADR_UPDATE_REQUIRED` |
| alteracao de CI | `ADR_UPDATE_REQUIRED` |
| alteracao de Prisma CLI | `RUNBOOK_SUFFICIENT` |
| convencao de monorepo | `ADR_REQUIRED` |

## 52. Go/No-Go Matrix

| Dimensao | Estado atual | Plano proposto | Risco | Condicao para GO |
|---|---|---|---|---|
| cwd | `NOT_READY` | `READY_WITH_RESTRICTIONS` | medio | loader deterministico + wrapper claro |
| env loader | `NOT_READY` | `READY_WITH_RESTRICTIONS` | alto | unica fonte e zero override |
| precedencia | `UNKNOWN` | `READY_WITH_RESTRICTIONS` | medio | `process.env` primeiro |
| root start | `NOT_READY` | `READY_WITH_RESTRICTIONS` | medio | wrapper root documentado |
| backend start | `READY_WITH_RESTRICTIONS` | `READY` | baixo | start consistente em `backend/` |
| tests | `READY_WITH_RESTRICTIONS` | `READY` | baixo | `setupFiles` preservado |
| Prisma runtime | `READY_WITH_RESTRICTIONS` | `READY` | baixo | mesma politica de env |
| Prisma CLI | `NOT_READY` | `READY_WITH_RESTRICTIONS` | medio | rodar em `backend/` |
| Docker | `READY` | `READY` | baixo | env injetado continua |
| HML | `READY_WITH_RESTRICTIONS` | `READY_WITH_RESTRICTIONS` | medio | compose override e env-file |
| producao | `READY_WITH_RESTRICTIONS` | `READY` | baixo | ignorar arquivos locais |
| seguranca | `READY_WITH_RESTRICTIONS` | `READY` | baixo | denylist e fail-fast |
| rollback | `READY` | `READY` | baixo | tres niveis documentados |
| documentacao | `READY_WITH_RESTRICTIONS` | `READY` | baixo | fontes e runbooks alinhados |
| onboarding | `NOT_READY` | `READY_WITH_RESTRICTIONS` | medio | comando root documentado |
| observability baseline | `READY_WITH_RESTRICTIONS` | `READY` | baixo | R1 consolidada |
| Gate C | `NOT_READY` | `READY_WITH_RESTRICTIONS` | alto | baseline live futura |
| Gate F | `NOT_READY` | `READY_WITH_RESTRICTIONS` | alto | baseline live futura |
| Gate G | `NOT_READY` | `READY_WITH_RESTRICTIONS` | alto | baseline live futura |

## 53. Riscos

- `BLOCKER`: a dependencia implicita do `cwd` pode continuar bloqueando o bootstrap local;
- `CRITICAL`: carregar arquivo local em producao por engano;
- `CRITICAL`: introduzir fallback silencioso para arquivo errado;
- `HIGH`: divergencia entre runtime, Prisma CLI e testes;
- `HIGH`: duplicidade de loader por import order;
- `HIGH`: wrapper raiz conflitar com o frontend da raiz;
- `MEDIUM`: onboarding mais verboso com `npm --prefix backend`;
- `LOW`: aumento de documentação de comando.

## 54. Gaps

- baseline live dos endpoints ainda nao existe;
- a solucao nao foi implementada;
- a politica final sobre `.env.local` e `.env.test` precisa de fechamento documental se houver excecao;
- a promocao de `server.fastify.ts` como bootstrap oficial ainda nao foi executada;
- a compatibilidade root wrapper versus backend-only precisa de aprovacao humana;
- a coleta operacional depois do ajuste ainda precisara de revalidaçao.

## 55. Decisoes em aberto

- manter somente wrapper CLI na raiz ou criar script npm de backend;
- tornar `server.fastify.ts` bootstrap oficial ou manter `server.ts` com loader alinhado;
- permitir ou nao `backend/.env.local` como excecao futura;
- usar `import.meta.url` puro ou marcador de projeto adicional;
- definir politica final para Prisma CLI via wrapper ou doc operacional;
- decidir se o root wrapper entra apenas no runbook ou tambem em `package.json`;
- decidir se uma ADR curta adicional e necessaria para a politica final de ambiente.

## 56. Proxima etapa

- `R2-A — Approve Bootstrap Alignment Plan`
- objetivo: validar este plano com arquitetura e operacao antes de qualquer implementacao.

## 57. Criterios de entrada

- baseline confirmada em `1fdac11`;
- causa raiz R1 aceita como `CONFIRMED`;
- documentos consultados e consistentes;
- nenhum bloqueio novo identificado;
- nenhuma mudanca funcional autorizada ainda.

## 58. Criterios de saida

- estrategia principal escolhida;
- politica de precedencia aprovada;
- comando oficial documentado para raiz e backend;
- impacto em Docker, testes e Prisma validado documentalmente;
- rollback em tres niveis documentado;
- classificacao ADR/EPC/Runbook fechada.

## 59. Criterio de abortar

- se a estrategia exigir sobrescrever `process.env`;
- se a estrategia carregar arquivo local em producao;
- se a estrategia depender de fallback silencioso;
- se a estrategia introduzir duplicidade de loader;
- se a estrategia quebrar Docker ou testes;
- se a estrategia depender de path especifico da maquina;
- se a estrategia exigir alterar Prisma schema ou migrations.

## 60. Recomendacao final

- estrategia: `CONTROLLED_HYBRID`
- justificativa: menor diff seguro com compatibilidade total de ambientes
- menor diff: centralizar contrato de ambiente + loader deterministico + wrappers documentados
- impacto: baixo a medio, principalmente operacional
- riscos: duplicate loader, wrapper raiz e politica de `.env` se nao forem disciplinados
- compatibilidade: Windows, Linux, dist, Docker, Vitest e Prisma CLI
- proxima microfase: `R2-A`
- criterio de abortar: qualquer leitura silenciosa de arquivo local em producao
- rollback: tres niveis, com preferencia por command rollback imediato

## 61. Veredito

`APPROVED_WITH_RESTRICTIONS`

## 62. Arquivos criados

- `docs/09-audits/EPC-W5-03C-R2-RUNTIME-BOOTSTRAP-ALIGNMENT-PLAN.md`
- `docs/09-audits/evidence/EPC-W5-03C-R2-RUNTIME-BOOTSTRAP-ALIGNMENT-PLAN.json`
- `docs/09-audits/evidence/EPC-W5-03C-R2-BOOTSTRAP-OPTIONS.mmd`

## 63. Comandos executados

Somente leitura e diagnóstico documental foram usados nesta etapa:

- `git status --short --branch`
- `git rev-parse HEAD`
- `git rev-parse --abbrev-ref HEAD`
- `git rev-parse --abbrev-ref --symbolic-full-name "@{u}"`
- `git log -1 --oneline`
- `Get-Content`
- `Get-ChildItem`
- `Get-FileHash`
- `rg`
- `Select-String`

## 64. Evidencias de validacao

- JSON parse: previsto no fechamento final da entrega;
- contagens: alinhadas ao summary do JSON;
- referencias internas: alinhadas aos documentos consultados;
- Markdown: 64 secoes presentes;
- Mermaid: flowchart TD dedicado ao bootstrap;
- diff check: previsto no fechamento final da entrega;
- status: previsto no fechamento final da entrega;
- nenhum segredo foi registrado;
- nenhum arquivo funcional foi alterado.

