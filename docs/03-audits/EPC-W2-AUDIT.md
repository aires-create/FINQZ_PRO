# EPC-W2 Legacy Quarantine & Single Source of Truth Audit

## 1. Resumo Executivo

O FINQZ PRO possui uma base arquitetural forte no backend oficial, com multi-tenancy, RBAC, auditoria, Prisma e modulos de dominio bem separados. O problema principal nao esta no core oficial, e sim na convivencia com camadas paralelas e legadas no frontend e no runtime `backend/server`.

Pontos mais criticos:
- runtime paralela `backend/server` ainda existe com identidade EdgeSpark;
- ha duplicidade de APIs para `opportunities/partners`;
- simulador e ranking ainda possuem logica relevante no frontend;
- `src/store/index.ts` guarda estado de dominio que deveria estar no backend ou em read models oficiais;
- repositories em memoria ainda se comportam como fonte operacional local para comercial e simulador.

Conclusao executiva:
- o sistema esta funcional e validavel;
- a aderencia ao Documento Mestre e boa no backend oficial;
- a aderencia cai onde existe compatibilidade legada e duplicidade de fonte;
- nao e seguro remover tudo de uma vez sem fase de quarentena.

Veredito do plano de EPC-W2:
- **GO WITH RESTRICTIONS**

Adesao estimada ao Documento Mestre:
- **72%**

Justificativa:
- alta aderencia em backend oficial, tenant, RBAC, Prisma e auditabilidade;
- aderencia media no frontend;
- aderencia baixa em No Legacy e No Duplicate Source por causa de modules paralelos, runtime antiga e estado de dominio no cliente.

---

## 2. Pontos Fortes

### Backend oficial
- Fastify oficial com plugins de seguranca, rate limit, correlation e registro modular.
- Rotas oficiais registradas no bootstrap principal.
- Contexto de tenant e permissao presentes nos modulos oficiais.

### Prisma e dominio
- Entidades centrais previstas no Documento Mestre estao modeladas:
  - Tenant
  - Partner
  - Customer
  - Pipeline
  - Opportunity
  - CommercialTable
  - CommercialCondition
  - AuditLog
  - SecurityEventLog
  - EDP/event store

### Auditabilidade
- existe trilha de auditoria e modelo de eventos em varias camadas.
- ha bases para outbox, correlation e event store.

### Cobertura funcional
- campanhas, conversas, SDR IA, audiencias e comercial estao presentes no repo.
- build e testes passam no frontend e no backend.

---

## 3. Divergencias Encontradas

### 3.1 Runtime legacy paralela
- Localizacao: [backend/server/package.json](../../backend/server/package.json) e [backend/server/src/index.ts](../../backend/server/src/index.ts)
- Motivo: runtime separada baseada em EdgeSpark continua ativa no codigo.
- Impacto: risco de drift arquitetural, rotas duplicadas, ownership dividido e manutencao em duas superfices.
- Recomendacao: quarentenar, congelar e planejar desativacao progressiva.

### 3.2 APIs duplicadas de oportunidades
- Localizacao:
  - [src/api/modules/opportunities.api.ts](../../src/api/modules/opportunities.api.ts)
  - [src/api/modules/oportunidades.api.ts](../../src/api/modules/oportunidades.api.ts)
  - [src/api/modules/index.ts](../../src/api/modules/index.ts)
  - [src/api/client.ts](../../src/api/client.ts)
  - [src/pages/SdrIaHub.tsx](../../src/pages/SdrIaHub.tsx)
- Motivo: dois contratos para a mesma entidade, com paths e formatos diferentes.
- Impacto: consumidores podem chamar endpoints diferentes para o mesmo dominio.
- Recomendacao: padronizar em `opportunities.api.ts` e migrar consumidores do legacy.

### 3.3 APIs duplicadas de partners/parceiros
- Localizacao:
  - [src/api/modules/partners.api.ts](../../src/api/modules/partners.api.ts)
  - [src/api/modules/parceiros.api.ts](../../src/api/modules/parceiros.api.ts)
  - [src/api/modules/index.ts](../../src/api/modules/index.ts)
  - [src/api/client.ts](../../src/api/client.ts)
- Motivo: mesma entidade exposta em dois contratos, um oficial e um legado.
- Impacto: superficie duplicada e risco de inconsistencias.
- Recomendacao: escolher uma superficie oficial e migrar os consumidores.

### 3.4 Repositories em memoria como fonte paralela
- Localizacao:
  - [src/data/commercialRepository.ts](../../src/data/commercialRepository.ts)
  - [src/data/simulatorRepository.ts](../../src/data/simulatorRepository.ts)
  - [src/pages/Simulador.tsx](../../src/pages/Simulador.tsx)
  - [src/pages/TabelasComerciais.tsx](../../src/pages/TabelasComerciais.tsx)
- Motivo: o frontend mantem repositores em memoria para dados comerciais e simulacao.
- Impacto: SSOT quebrado; logica operacional existe fora do backend.
- Recomendacao: manter apenas como adaptacao/transicao; migrar ownership para backend ou read model oficial.

### 3.5 Store com dominio indevido
- Localizacao: [src/store/index.ts](../../src/store/index.ts)
- Motivo: o store armazena clientes, produtos, estrutura comercial, parceiros, usuarios, pipelines e oportunidadesKanban.
- Impacto: o estado do dominio fica no cliente e compete com backend.
- Recomendacao: reduzir o store para UI/session state, mantendo apenas preferencia visual e autenticacao.

### 3.6 Simulacao/ranking duplicados
- Localizacao:
  - [src/pages/Simulador.tsx](../../src/pages/Simulador.tsx)
  - [backend/src/modules/simulation/domain/services/provider-ranking-engine.service.ts](../../backend/src/modules/simulation/domain/services/provider-ranking-engine.service.ts)
  - [backend/src/modules/simulation/application/simulate-operation.use-case.ts](../../backend/src/modules/simulation/application/simulate-operation.use-case.ts)
  - [backend/src/modules/edp/contracts/events.ts](../../backend/src/modules/edp/contracts/events.ts)
- Motivo: o frontend calcula, ranqueia, aceita e cria oportunidade localmente; o backend tambem possui dominio oficial de simulation/ranking/proposal.
- Impacto: risco alto de divergencia entre telas, proposta e backend.
- Recomendacao: escolher um owner unico para ranking/recommendation e expor via backend oficial.

### 3.7 Hub parcialmente implementado
- Localizacao:
  - [src/routes/hub.routes.tsx](../../src/routes/hub.routes.tsx)
  - [src/pages/Placeholders.tsx](../../src/pages/Placeholders.tsx)
- Motivo: rotas do HUB existem, mas algumas paginas ainda sao placeholders.
- Impacto: UX incompleta e possivel interpretacao equivocada de go-live.
- Recomendacao: tratar como preview/placeholder ate a implementacao oficial.

---

## 4. Nao Conformidades

### No Legacy
- runtime `backend/server` ainda presente.
- modulos legacy de API ainda exportados.
- tela SDR IA ainda usa modulo legado de oportunidades.

### No Duplicate Source
- duplicate API modules.
- duplicate partner modules.
- duplicate ranking/simulacao.
- state of domain no store.
- repositories em memoria com papel operacional.

### Backend First
- parte da simulacao e da pipeline operacional ainda e processada no frontend.

### Contract First
- coexistencia de rotas `/api/v1/*` com contratos legados `/api/*` e `/api/oportunidades`.

---

## 5. Debito Tecnico

- `src/pages/Oportunidades.tsx` e `src/pages/Simulador.tsx` concentram muitas responsabilidades.
- `src/store/index.ts` e `src/api/client.ts` mantem compatibilidade ampla demais.
- `backend/server/src/index.ts` e seus auxiliares representam uma stack paralela.
- `src/pages/TabelasComerciais.tsx` mistura API oficial com providers do repository local.
- a capa de compatibilidade impede eliminacao rapida do legado.

---

## 6. Codigo Legado Remanescente

- [backend/server/package.json](../../backend/server/package.json)
- [backend/server/src/index.ts](../../backend/server/src/index.ts)
- [backend/server/src/defs/index.ts](../../backend/server/src/defs/index.ts)
- [src/api/modules/oportunidades.api.ts](../../src/api/modules/oportunidades.api.ts)
- [src/api/modules/parceiros.api.ts](../../src/api/modules/parceiros.api.ts)
- [src/data/commercialRepository.ts](../../src/data/commercialRepository.ts)
- [src/data/simulatorRepository.ts](../../src/data/simulatorRepository.ts)
- [src/store/index.ts](../../src/store/index.ts)
- [src/routes/hub.routes.tsx](../../src/routes/hub.routes.tsx)
- [src/pages/Placeholders.tsx](../../src/pages/Placeholders.tsx)

---

## 7. Redundancias

1. `opportunities.api.ts` vs `oportunidades.api.ts`
2. `partners.api.ts` vs `parceiros.api.ts`
3. `commercialRepository.ts` vs dados oficiais do backend comercial
4. `simulatorRepository.ts` vs backend `simulation` + `edp`
5. `store` como UI state e como dominio
6. `backend/server` vs backend Fastify oficial

---

## 8. Melhorias Recomendadas

- criar uma politica formal de deprecacao de modulos legacy;
- migrar consumidores para contratos oficiais `/api/v1/*`;
- tornar o frontend um consumidor, nao uma origem de dominio;
- mover ownership de ranking/simulacao para backend oficial;
- isolar `backend/server` em quarentena documental e operacional;
- manter o store apenas para UI/session e preferencias;
- documentar placeholders do HUB como nao-produtivos ate o go-live da feature.

---

## 9. Priorizacao

### P0 - critico
- remover dependencia funcional do runtime `backend/server`;
- padronizar chamadas de oportunidades e partners em API oficial;
- definir owner unico para simulation/ranking/proposal.

### P1 - alto
- reduzir o `src/store/index.ts` para estado de UI/session;
- eliminar uso operacional de repositories em memoria;
- migrar `SdrIaHub` e demais consumidores para contratos oficiais.

### P2 - medio
- formalizar o HUB como preview ate completar implementacao;
- padronizar `src/api/client.ts` para nao expor legacy por padrao;
- reduzir monolitismo de `Oportunidades.tsx`.

### P3 - melhoria
- limpar compatibilidades residuais;
- organizar melhor a doc de deprecacao;
- otimizar tooling como Browserslist.

---

## 10. Riscos

- drift entre frontend e backend nas regras de simulacao;
- inconsistencias em oportunidade/proposta dependendo da tela;
- quebra de contratos ao remover legado sem mapear consumidores;
- confusao de ownership entre UI, repository em memoria e backend;
- manutencao mais cara e testes menos confiaveis.

---

## 11. Impactos

### Produto
- possivel comportamento diferente entre paginas para a mesma entidade.

### Engenharia
- maior custo de manutencao e menor previsibilidade.

### Governanca
- SSOT fica fragilizado, dificultando auditoria e evolucao segura.

### Performance
- frontend carrega logica e dados que deveriam estar no backend.

---

## 12. Plano de Correcao

### Fase 0 - Freeze
- manter contratos oficiais estaveis;
- evitar novas dependencias sobre modulos legacy;
- registrar consumidores atuais.

### Fase 1 - Migracao de consumo
- migrar consumidores de `oportunidades.api.ts` e `parceiros.api.ts` legados para os modulos oficiais;
- atualizar `src/api/client.ts` para usar apenas os contratos oficiais.

### Fase 2 - Quarentena de dominio no frontend
- restringir o store a UI/session state;
- remover dependencia operacional de repositories em memoria.

### Fase 3 - Consolidacao de simulacao/ranking
- escolher um owner unico no backend oficial para ranking, recomendacao e proposta;
- expor a superficie publica oficial para o frontend.

### Fase 4 - Legacy shutdown
- isolar ou remover `backend/server`;
- desativar exports legacy depois de validar que nenhum consumidor depende deles.

### Fase 5 - Limpeza final
- remover wrappers duplicados;
- reduzir compatibilidade residual;
- fechar gaps de documentacao.

---

## 13. Arquivos Envolvidos

### Backend oficial
- [backend/src/core/http/fastify.ts](../../backend/src/core/http/fastify.ts)
- [backend/prisma/schema.prisma](../../backend/prisma/schema.prisma)
- [backend/src/modules/commercial/commercial.routes.ts](../../backend/src/modules/commercial/commercial.routes.ts)
- [backend/src/modules/pipelines/routes.ts](../../backend/src/modules/pipelines/routes.ts)
- [backend/src/modules/edp/contracts/events.ts](../../backend/src/modules/edp/contracts/events.ts)
- [backend/src/modules/simulation/application/simulate-operation.use-case.ts](../../backend/src/modules/simulation/application/simulate-operation.use-case.ts)
- [backend/src/modules/simulation/domain/services/provider-ranking-engine.service.ts](../../backend/src/modules/simulation/domain/services/provider-ranking-engine.service.ts)

### Frontend
- [src/api/client.ts](../../src/api/client.ts)
- [src/api/modules/index.ts](../../src/api/modules/index.ts)
- [src/api/modules/opportunities.api.ts](../../src/api/modules/opportunities.api.ts)
- [src/api/modules/oportunidades.api.ts](../../src/api/modules/oportunidades.api.ts)
- [src/api/modules/partners.api.ts](../../src/api/modules/partners.api.ts)
- [src/api/modules/parceiros.api.ts](../../src/api/modules/parceiros.api.ts)
- [src/data/commercialRepository.ts](../../src/data/commercialRepository.ts)
- [src/data/simulatorRepository.ts](../../src/data/simulatorRepository.ts)
- [src/pages/Simulador.tsx](../../src/pages/Simulador.tsx)
- [src/pages/TabelasComerciais.tsx](../../src/pages/TabelasComerciais.tsx)
- [src/pages/SdrIaHub.tsx](../../src/pages/SdrIaHub.tsx)
- [src/pages/Oportunidades.tsx](../../src/pages/Oportunidades.tsx)
- [src/store/index.ts](../../src/store/index.ts)
- [src/routes/hub.routes.tsx](../../src/routes/hub.routes.tsx)

### Legacy runtime
- [backend/server/package.json](../../backend/server/package.json)
- [backend/server/src/index.ts](../../backend/server/src/index.ts)
- [backend/server/src/defs/index.ts](../../backend/server/src/defs/index.ts)

---

## 14. Dependencias

- decisao de produto sobre quais telas ainda podem depender de compatibility layer;
- decisao de arquitetura sobre um owner unico do motor comercial;
- coordenacao com backend para expor o contrato oficial da simulacao/recommendation;
- janela de migracao para consumers legacy;
- estrategia de quarentena para `backend/server`.

---

## 15. Lista de Imports Legacy

### Consumers identificados
- [src/api/client.ts](../../src/api/client.ts)
  - importa `oportunidadesApi` de `./modules/oportunidades.api`
  - importa `partnersApi` de `./modules/partners.api`

- [src/pages/SdrIaHub.tsx](../../src/pages/SdrIaHub.tsx)
  - importa `oportunidadesApi` de `../api/modules/oportunidades.api`

- [src/pages/Simulador.tsx](../../src/pages/Simulador.tsx)
  - importa `simulatorRepository`
  - importa `commercialRepository`

- [src/pages/TabelasComerciais.tsx](../../src/pages/TabelasComerciais.tsx)
  - importa `commercialRepository`

- [src/pages/Oportunidades.tsx](../../src/pages/Oportunidades.tsx)
  - importa `partnersApi` oficial
  - usa backend oficial em varios fluxos, mas ainda convive com runtime de observabilidade local do kanban

### Modulos legacy a tratar
- `src/api/modules/oportunidades.api.ts`
- `src/api/modules/parceiros.api.ts`
- `src/data/commercialRepository.ts`
- `src/data/simulatorRepository.ts`
- `backend/server/*`

---

## 16. Checklist de Validacao

Executado:
- `npm run build` no frontend: OK
- `npm test` no frontend: OK
- `npm run build` no backend: OK
- `npm run test` no backend: OK

Validacoes adicionais recomendadas antes de remover legado:
- confirmar que nenhum consumidor novo usa os modulos legacy;
- confirmar que o backend oficial cobre todos os fluxos migrados;
- confirmar que o ranking de simulacao nao depende do frontend;
- confirmar que o store nao e usado como dominio operacional fora de UI/session.

---

## 17. Veredito Final

**GO WITH RESTRICTIONS**

Motivo:
- a plataforma esta pronta para uma migracao gradual;
- nao esta pronta para desligar o legado de uma vez;
- a quarentena deve preceder qualquer remocao definitiva.
