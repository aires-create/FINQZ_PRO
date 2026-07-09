# EPC-W2-D Architecture Hardening & Release Readiness Foundation

Base oficial:
- [docs/03-audits/EPC-W2-AUDIT.md](../03-audits/EPC-W2-AUDIT.md)
- [docs/04-plans/EPC-W2-B-EXECUTION-PLAN.md](EPC-W2-B-EXECUTION-PLAN.md)
- [docs/04-plans/EPC-W2-C-P0-IMPLEMENTATION.md](EPC-W2-C-P0-IMPLEMENTATION.md)
- Documento Mestre do FINQZ PRO Enterprise

## 1. Resumo Executivo

O FINQZ PRO ja apresenta uma base forte para enterprise release:
- frontend build e testes verdes;
- backend build e testes verdes;
- Prisma, RBAC, auditoria e tenant scope consistentes no backend oficial;
- contrato oficial em `/api/v1/*` disponivel para os principais dominios.

O principal trabalho restante para publicacao segura nao e funcional, e sim de hardening arquitetural:
- eliminar risco de runtime paralela;
- reduzir superficies legacy ainda consumidas;
- separar definitivamente fonte oficial de dominio e compatibilidade;
- preparar fundamentos de release readiness.

Conclusao executiva:
- o produto esta em condicao de evolucao controlada;
- ainda nao esta em condicao de desligar o legado ou declarar cleanup completo;
- a proxima fase deve focar em corte progressivo, sem quebrar contratos ja validados.

Veredito preliminar para `EPC-RELEASE-READINESS`:
- **GO WITH RESTRICTIONS**

Condicao:
- apenas se nenhum P0 permanecer aberto apos a validacao dos consumidores e contratos.

---

## 2. Status Atual

### Situacao validada
- Frontend build: OK
- Frontend tests: OK
- Backend build: OK
- Backend tests: OK
- Quarentena P0 aplicada em wrappers legacy e runtime legacy documentada.

### Estado arquitetural observado
- backend oficial e o caminho principal;
- `backend/server` permanece como runtime legacy/quarentenada;
- wrappers de API legacy continuam presentes;
- repositories em memoria ainda existem;
- store do frontend ainda carrega dominio indevido;
- simulacao/ranking/proposta ainda precisa de consolidacao definitiva no backend.

---

## 3. Matriz P0 / P1 / P2

### P0 - Critico

#### P0.1 Legacy runtime `backend/server`
**Decisao recomendada**
- manter quarentenado;
- bloquear novos consumidores;
- remover apenas depois de prova de ausencia de dependencia.

**Motivo**
- ainda ha referencias historicas e possiveis fluxos externos dependentes;
- a remocao prematura quebraria compatibilidade.

**Arquivos impactados**
- `backend/server/package.json`
- `backend/server/src/index.ts`
- `backend/server/src/defs/index.ts`

**Critério de pronto**
- nenhum consumo novo;
- runtime documentada como legacy congelado;
- superficie oficial Fastify declarada como unica ativa.

#### P0.2 APIs duplicadas de oportunidades e partners
**Decisao recomendada**
- consolidar contratos oficiais em `/api/v1/*`;
- marcar wrappers legacy como deprecated/quarentenados;
- migrar consumidores seguros.

**Arquivos impactados**
- `src/api/modules/opportunities.api.ts`
- `src/api/modules/oportunidades.api.ts`
- `src/api/modules/partners.api.ts`
- `src/api/modules/parceiros.api.ts`
- `src/api/client.ts`
- `src/api/modules/index.ts`
- `src/pages/SdrIaHub.tsx`

**Critério de pronto**
- consumidores conhecidos migrados;
- nenhum consumidor novo usando wrappers legacy.

#### P0.3 Simulacao / ranking / proposta
**Decisao recomendada**
- backend oficial deve ser owner unico;
- frontend deve consumir resultado, nao calcular regra comercial como fonte primaria.

**Arquivos impactados**
- `src/pages/Simulador.tsx`
- `src/data/simulatorRepository.ts`
- `src/data/commercialRepository.ts`
- `backend/src/modules/simulation/*`
- `backend/src/modules/edp/*`
- `backend/src/modules/proposals/*`

**Critério de pronto**
- ranking e recomendacao sem duplicidade de regra;
- fonte oficial claramente definida.

---

### P1 - Alto

#### P1.1 Store frontend
**Decisao recomendada**
- reduzir o store a UI/session state e preferências;
- migrar dominio para backend ou read models oficiais.

**Arquivos impactados**
- `src/store/index.ts`
- `src/auth/AuthProvider.tsx`
- `src/layouts/MainLayout.tsx`
- paginas que dependem do store para dominio

**Critério de pronto**
- nenhum dominio operacional critico depende do store.

#### P1.2 Repositories em memoria
**Decisao recomendada**
- manter apenas como fallback/transicao temporaria;
- nao tratar como fonte oficial de dominio.

**Arquivos impactados**
- `src/data/commercialRepository.ts`
- `src/data/simulatorRepository.ts`
- `src/pages/Simulador.tsx`
- `src/pages/TabelasComerciais.tsx`

**Critério de pronto**
- fluxo produtivo depende do backend oficial e nao de memoria local.

---

### P2 - Medio

#### P2.1 Monolitos de workspace
**Decisao recomendada**
- nao refatorar tudo agora;
- decompor progressivamente em adapter, view model, hooks e components.

**Arquivos impactados**
- `src/pages/Oportunidades.tsx`
- `src/pages/Simulador.tsx`
- `src/pages/TabelasComerciais.tsx`

**Critério de pronto**
- componentes menores sem quebra de comportamento;
- menor risco de regressao visual/funcional.

#### P2.2 Hub e placeholder surfaces
**Decisao recomendada**
- manter como preview ate implementacao real.

**Arquivos impactados**
- `src/routes/hub.routes.tsx`
- `src/pages/Placeholders.tsx`

---

## 4. Decisoes Recomendadas

### Decisao 1 - Legacy runtime
- `backend/server` permanece quarentenado.
- Nao deve receber novos consumidores.

### Decisao 2 - API oficial
- contratos oficiais permanecem em `/api/v1/*`.
- wrappers legacy ficam deprecated ate o corte final.

### Decisao 3 - Fonte de simulacao
- backend oficial responde por simulation/ranking/proposal.
- frontend apenas orquestra a experiencia.

### Decisao 4 - Store
- store fica restrito a UI/session, preferencias e autenticacao.

### Decisao 5 - Release readiness
- publicar apenas depois de zerar P0 aberto e confirmar checklist operacional.

---

## 5. Arquivos Impactados

### Legacy runtime
- `backend/server/package.json`
- `backend/server/src/index.ts`
- `backend/server/src/defs/index.ts`

### APIs
- `src/api/modules/opportunities.api.ts`
- `src/api/modules/oportunidades.api.ts`
- `src/api/modules/partners.api.ts`
- `src/api/modules/parceiros.api.ts`
- `src/api/modules/index.ts`
- `src/api/client.ts`
- `src/pages/SdrIaHub.tsx`

### Repositories / store
- `src/data/commercialRepository.ts`
- `src/data/simulatorRepository.ts`
- `src/store/index.ts`

### Workspaces
- `src/pages/Oportunidades.tsx`
- `src/pages/Simulador.tsx`
- `src/pages/TabelasComerciais.tsx`

### Backend oficial de apoio
- `backend/src/core/http/fastify.ts`
- `backend/src/modules/simulation/*`
- `backend/src/modules/edp/*`
- `backend/src/modules/proposals/*`
- `backend/prisma/schema.prisma`

---

## 6. Mapa de Consumidores Legacy

### Consumidores conhecidos de `src/api/modules/oportunidades.api.ts`
- `src/api/client.ts`
- `src/pages/SdrIaHub.tsx`

### Consumidores conhecidos de `src/api/modules/parceiros.api.ts`
- `src/api/client.ts`

### Consumo de repositories em memoria
- `src/pages/Simulador.tsx`
- `src/pages/TabelasComerciais.tsx`

### Consumo de store com dominio
- `src/pages/Clientes.tsx`
- `src/pages/Conversas.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/ContaCorrente.tsx`
- `src/pages/Configuracoes.tsx`
- `src/pages/Automacoes.tsx`
- `src/pages/Financeiro.tsx`
- `src/pages/Usuarios.tsx`
- `src/pages/EstruturaComercial.tsx`
- `src/pages/Relatorios.tsx`
- `src/pages/Audiencias.tsx`
- `src/pages/admin/Geral.tsx`
- `src/pages/SdrIaHub.tsx`
- `src/layouts/MainLayout.tsx`
- `src/auth/AuthProvider.tsx`
- `src/hooks/useTenantFilter.ts`
- `src/config/automacaoPosAssinatura.ts`

### Runtime legacy
- `backend/server/*`

---

## 7. Plano de Depreciacao

### Fase 1
- bloquear novos imports legacy;
- registrar os wrappers como deprecated;
- manter runtime legacy quarentenada.

### Fase 2
- migrar consumidores conhecidos para contratos oficiais;
- reduzir dependencias diretas de memoria local;
- restringir o store a UI/session.

### Fase 3
- consolidar simulacao/ranking/proposta no backend oficial;
- formalizar contrato HTTP/EDP se necessario.

### Fase 4
- avaliar corte definitivo de runtime legacy e wrappers antigos apenas apos zero consumer confirmado.

---

## 8. Riscos Remanescentes

1. Consumidores fora do grep atual ainda podem existir.
2. `src/api/client.ts` ainda expõe compatibilidade com wrappers legacy.
3. `SdrIaHub` ainda usa o modulo legado de oportunidades.
4. `backend/server` ainda pode ser usado por documentacao antiga, scripts externos ou processos nao rastreados pelo source tree.
5. Simulacao e ranking ainda podem divergir se o frontend continuar calculando regra comercial localmente.
6. O store ainda carrega dominio operacional que pode mascarar inconsistencias de backend.

---

## 9. Criterios de Pronto

### P0 pronto quando
- runtime legacy quarenentenada;
- wrappers legacy marcados e sem novos consumers;
- contratos oficiais confirmados;
- build/testes verdes.

### P1 pronto quando
- store reduzido a UI/session;
- repositories em memoria sem papel operacional principal.

### P2 pronto quando
- workspaces monoliticos tiverem decomposicao incremental;
- hub placeholders estiverem documentados e isolados.

---

## 10. Checklist de Validacao

- confirmar build frontend;
- confirmar testes frontend;
- confirmar build backend;
- confirmar testes backend;
- confirmar consumidores legacy conhecidos;
- confirmar contratos oficiais em `/api/v1/*`;
- confirmar ausencia de novos imports legacy;
- confirmar que `backend/server` nao foi promovido a runtime ativa;
- confirmar que simulacao/ranking nao depende de fonte paralela para producao;
- confirmar que o store nao e owner operacional de dominio;
- confirmar checklist de release readiness.

---

## 11. Release Readiness Foundation

### Infra / ambiente
- `.env.production` definido e documentado;
- secrets externalizados e revisados;
- CORS restrito a origens conhecidas;
- rate limit ativo;
- headers de seguranca configurados;
- logs com correlation e contexto de tenant;
- health checks do frontend/backend.

### Dados / banco
- migrations Prisma aplicadas e revisadas;
- seed minimo validado em ambiente de teste;
- backup e estrategia de rollback definidos.

### Deploy / operacao
- CI/CD com build, test e smoke;
- Docker/VPS ou hosting equivalente validado;
- dominio e SSL prontos;
- observabilidade e alertas configurados.

### Go-live
- smoke tests do fluxo principal;
- plano de rollback documentado;
- janela de publicacao aprovada;
- responsavel de operacao definido.

---

## 12. Recomendacao para EPC-RELEASE-READINESS

Nao iniciar publicacao final enquanto houver P0 aberto.

Para avancar:
1. confirmar que os consumers legacy conhecidos foram migrados;
2. manter runtime legacy em quarentena;
3. validar que o owner da simulacao/proposta esta definido;
4. reduzir o store e repositories em memoria em fase futura;
5. manter contrato oficial como unica superficie nova.

---

## 13. Veredito Final

**GO WITH RESTRICTIONS**

Motivo:
- o sistema esta forte o suficiente para seguir em hardening;
- ainda existem superficies legacy que exigem migracao e monitoramento;
- a publicacao futura depende da eliminacao controlada dos riscos P0/P1 descritos acima.
