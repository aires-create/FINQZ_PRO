# PRP-FIX-06 - Frontend Runtime Ownership Audit

**Status:** Concluida
**Veredito:** NO GO
**Frontend Readiness Score:** 39/100

## 1. Executive Summary

O frontend do FINQZ EOS ainda opera como um conjunto de superficies paralelas de verdade, e nao como uma camada de apresentacao rigidamente subordinada aos Runtime Domains oficiais.

O problema central nao e apenas UI. O frontend ainda concentra:

- persistencia operacional em `localStorage`;
- estados canonicamente relevantes em stores e repositories locais;
- mocks, seeds e fallbacks no caminho de execucao;
- clientes HTTP duplicados e compatibilidade legada;
- fallback EdgeSpark ainda ativo;
- logica de negocio e logica de decisao distribuida em paginas, hooks e adapters;
- integracoes diretas externas fora de um ownership formal de Runtime.

Isso cria uma fronteira fraca entre a plataforma oficial e a experiencia do usuario, principalmente em Identity, Tenant, CRM, Pipeline, Opportunity, Commercial e Decision Platform.

Conclusao executiva:

- o frontend esta funcional;
- o frontend ainda nao esta governado;
- o frontend ainda nao possui ownership runtime consistente;
- o frontend nao esta pronto para ser considerado uma camada totalmente aderente ao EOS.

## 2. Frontend Runtime Map

| Runtime / Dominio | Principais superficies | Situacao |
| --- | --- | --- |
| Identity | `src/auth/session.ts`, `src/auth/AuthProvider.tsx`, `src/auth/finqzAuth.ts`, `src/utils/auth.ts`, `src/hooks/useApiErrorHandler.tsx` | Fronteira quebrada por localStorage, fallback legado e logica de sessao duplicada |
| Tenant | `src/utils/auth.ts`, `src/store/index.ts`, `src/layouts/MainLayout.tsx` | Tenant scope nao esta isolado; chave de tenant e persistencia local coexistem com estado de UI |
| CRM | `src/store/index.ts`, `src/api/client.ts`, `src/api/dataService.ts`, `src/api/modules/*.ts`, `src/pages/Campanhas.tsx` | Mistura de dados canonicos, mocks e fallback local |
| Pipeline | `src/store/index.ts`, `src/data/catalogRepository.ts`, `src/pages/TabelasComerciais.tsx`, `src/data/simulatorRepository.ts` | Ownership parcial no frontend com persistencia local de configuracao |
| Opportunity | `src/pages/Oportunidades.tsx`, `src/data/simulatorRepository.ts`, `src/api/modules/oportunidades.api.ts`, `src/api/modules/opportunities.api.ts` | Frontend ainda calcula, normaliza e persiste parte do fluxo |
| Commercial | `src/pages/TabelasComerciais.tsx`, `src/data/commercialRepository.ts`, `src/api/modules/commercial.api.ts` | Ownership misto entre API, localStorage e fallback legada |
| Decision Platform | `src/pages/SdrIaHub.tsx`, `src/hooks/useLeadQualification.ts`, `src/api/finqzClient.ts` | Camada cognitiva ainda usa mocks, fallback e acesso direto a servicos externos |
| Admin / Observability | `src/pages/Eventos.tsx`, `src/hooks/useApiErrorHandler.tsx` | Boa estruturacao visual, mas depende de fallback e limpeza local de sessao |
| Integrations / Providers | `src/api/integrations.ts`, `src/data/cepService.ts` | Chamadas diretas externas fora de ownership runtime formal |

## 3. Ownership Map

- Identity deve ser owned por uma fonte nativa de sessao e auth, nao por `localStorage` disperso.
- Tenant deve ser owned por runtime backend e apenas refletido no frontend.
- CRM deve ser consumido como contrato, nao como dataset local persistido.
- Pipeline deve ser lido como configuracao canonicamente provisionada, nao como estado mutavel local.
- Opportunity deve ser exibida e operada por contrato oficial, nao por repositorio de demo.
- Commercial deve ser tratado como dominio canonicamente servido, nao como repository frontend.
- Decision Platform deve expor apenas feedback visual e chamadas oficiais; nao deve carregar motor paralelo, mock de qualificacao ou fallback de IA.
- Integrations e Providers devem permanecer fora de ownership local do frontend.

## 4. Runtime Violations

### 4.1 Violacoes P0

- `localStorage` como fonte operacional de identidade e sessao em `src/auth/session.ts:34-143`, `src/auth/AuthProvider.tsx:51-219`, `src/utils/auth.ts:45-120`.
- Persistencia operacional de dominio em `src/store/index.ts:9-101` e `src/store/index.ts:927-950`.
- Fallback EdgeSpark ainda ativo em `src/api/finqzClient.ts:1-170`.
- Estruturas de decisao/IA com estado e dados mockados em `src/pages/SdrIaHub.tsx:200-535` e fetch direto em `src/hooks/useLeadQualification.ts:75-108`.

### 4.2 Violacoes P1

- Repositores frontend com persistencia local de dominio em `src/data/commercialRepository.ts:1-676`, `src/data/simulatorRepository.ts:1-368`, `src/data/catalogRepository.ts:1-473`.
- Cliente compatibilidade legado em `src/api/client.ts:1-208` e `src/api/dataService.ts:1-277`.
- Mapa de menus e permissao com fallback legado em `src/layouts/MainLayout.tsx:55-357`.
- Acesso direto a APIs externas em `src/data/cepService.ts:55-137`, `src/pages/Configuracoes.tsx:386-1290`, `src/api/integrations.ts:297-701`.

### 4.3 Violacoes P2

- Seeds, mocks e fallbacks na camada de pagina em `src/pages/Campanhas.tsx:40-160`, `src/pages/Audiencias.tsx:110-347`, `src/pages/Conversas.tsx:73-275`, `src/pages/TabelasComerciais.tsx:230-360`, `src/pages/Simulador.tsx:212-323`, `src/pages/Eventos.tsx:195-259`.
- Persistencia de UI no bootstrap em `src/main.tsx:7-35`.
- Adapter local com armazenamento paralelo em `src/api/adapters.ts:19-199`.

### 4.4 Violacoes P3

- Duplicidade de contratos e aliases legados em `src/api/modules/index.ts:1-23`.
- Regras de permissao e rotas legadas ainda misturadas em `src/layouts/MainLayout.tsx:55-194`.
- Fallbacks sem ownership formal em `src/config/environment.ts:8-37, 76-193, 274-281`.

## 5. LocalStorage Inventory

### 5.1 Quantitativo

- Ocorrencias de `localStorage` no frontend: 88
- Arquivos com `localStorage` ou `sessionStorage`: 15
- Ocorrencias de `sessionStorage`: 0

### 5.2 Inventario Critico

| Arquivo | Uso | Avaliacao |
| --- | --- | --- |
| `src/auth/session.ts` | Tokens, usuario e snapshot de sessao | Critico, auth state paralelo |
| `src/auth/AuthProvider.tsx` | Usuario fallback e persistencia de login | Critico, ownership duplicado |
| `src/utils/auth.ts` | Sessao, tenant, token e normalizacao | Critico, mistura validacao + storage |
| `src/store/index.ts` | Persistencia do store e dados iniciais | Critico, mistura UI + dominio |
| `src/main.tsx` | Bootstrap do tema por estado salvo | Moderado, depende de UI state local |
| `src/layouts/MainLayout.tsx` | Estado do menu lateral | Moderado, persistencia de UX |
| `src/hooks/useApiErrorHandler.tsx` | Limpeza de sessao por erro | Moderado, acoplado a auth local |
| `src/api/adapters.ts` | Adapter de entidades com storage | Critico, fonte paralela de dados |
| `src/data/commercialRepository.ts` | Providers, tables, conditions | Critico, ownership de dominio no frontend |
| `src/data/simulatorRepository.ts` | Simulacoes, propostas, oportunidades | Critico, fluxo de negocio local |
| `src/data/catalogRepository.ts` | Settings de pipeline em storage | Alto, configuracao canonica paralela |
| `src/pages/Campanhas.tsx` | Campanhas persistidas localmente | Alto, dados operacionais locais |
| `src/pages/Simulador.tsx` | Propostas salvas localmente | Alto, artefato de negocio local |
| `src/pages/TabelasComerciais.tsx` | Fallback local de dados comerciais | Alto, copia local de dominio |
| `src/pages/Oportunidades.tsx` | Uso de fallback e integraacao direta | Alto, logica de negocio na pagina |

## 6. SessionStorage Inventory

- Nao foram encontrados usos de `sessionStorage`.
- Risco residual: baixo.
- Observacao: a ausencia de `sessionStorage` nao compensa o uso extensivo de `localStorage` como armazenamento operacional.

## 7. Mock Inventory

### 7.1 Quantitativo

- Arquivos com `mock`, `fixture`, `fake` ou `fallback`: 30
- Arquivos com seeds e mocks criticos de runtime: 8

### 7.2 Inventario Critico

| Arquivo | Tipo | Risco |
| --- | --- | --- |
| `src/store/index.ts` | Initial mock data | Alto, dados operacionais embutidos |
| `src/api/dataService.ts` | Fallback mock/real switch | Alto, fonte paralela de verdade |
| `src/api/adapters.ts` | Default datasets e storage fallback | Alto, CRUD local |
| `src/data/commercialRepository.ts` | Mocks iniciais + local persistence | Critico |
| `src/data/simulatorRepository.ts` | Simulacao demo + storage local | Critico |
| `src/pages/Campanhas.tsx` | `initialCampanhasSeed` + clientes mock | Alto |
| `src/pages/Audiencias.tsx` | `mockContacts` e fluxos condicionais | Alto |
| `src/pages/SdrIaHub.tsx` | `mockTemplates`, `mockMetrics`, `mockAnalyses` | Critico |
| `src/pages/TabelasComerciais.tsx` | fallback local de tabelas/condicoes | Critico |
| `src/pages/Simulador.tsx` | proposta gerada e armazenada localmente | Alto |

## 8. Legacy Inventory

### 8.1 Conteudo Legado

| Arquivo | Sinal de legado | Impacto |
| --- | --- | --- |
| `src/api/client.ts` | client de compatibilidade | Duplica superfice canonica |
| `src/api/dataService.ts` | modo mock/real por flag | Mistura runtime e fallback |
| `src/api/adapters.ts` | adapter para localStorage | Persiste dominio em frontend |
| `src/api/finqzClient.ts` | EdgeSpark fallback | Mantem stack paralelo |
| `src/api/modules/index.ts` | exportacao ampla por modulo | Facilita colisao e duplicacao |
| `src/auth/AuthProvider.tsx` | provider paralelo/legado | Ownership duplicado de auth |
| `src/layouts/MainLayout.tsx` | roteamento e permissao legadas | Acoplamento de navegacao |
| `src/config/environment.ts` | flags de fallback e legacy auth | Shadow config no frontend |

### 8.2 Quantitativos Legados

- Modulos de API sob `src/api/modules`: 22
- Call sites diretos de `fetch` no frontend: 25
- Arquivos com fallback/legacy relevante: 13

## 9. API Client Inventory

| Cliente / Adaptador | Papel | Observacao |
| --- | --- | --- |
| `src/api/http.ts` | fundacao HTTP | Pode permanecer como base tecnica |
| `src/api/client.ts` | cliente compatibilidade | Deve ser reduzido ou absorvido |
| `src/api/dataService.ts` | facade com mock/real | Nao deve continuar como fonte paralela |
| `src/api/adapters.ts` | storage adapter | Deve sair da fronteira operacional |
| `src/api/finqzClient.ts` | auth/API bridge com EdgeSpark fallback | Risco alto |
| `src/api/modules/*.ts` | clientes por dominio | Devem ser consolidados por ownership oficial |
| `src/api/integrations.ts` | integracoes externas diretas | Deve ficar sob contratos explicitos |
| `src/data/cepService.ts` | ViaCEP direto | Integracao externa sem ownership runtime formal |
| `src/hooks/useLeadQualification.ts` | AI fetch direto | Violacao da governanca cognitiva |

## 10. State Management Inventory

| Arquivo | Estado | Avaliacao |
| --- | --- | --- |
| `src/store/index.ts` | theme, auth, lists, pipeline, opportunity, finance | Store monolitico e com dados de dominio |
| `src/auth/AuthProvider.tsx` | user, loading, login state | Duplicado em relacao ao store e session helpers |
| `src/auth/session.ts` | tokens, user snapshot, auth snapshot | Fonte de verdade local paralela |
| `src/utils/auth.ts` | tenant/session/validation helpers | Mistura validacao, limpeza e persistencia |
| `src/main.tsx` | inicializacao de tema | Bootstrap de UI amarrado a storage |
| `src/layouts/MainLayout.tsx` | expanded groups de menu | Estado local de UX aceitavel, mas persistido indevidamente |

## 11. Runtime Dependency Graph

```text
UI Pages / Components
  -> api/client.ts / api/dataService.ts / api/modules/*
  -> auth/AuthProvider.tsx / auth/finqzAuth.ts / auth/session.ts
  -> data/* repositories
  -> store/index.ts

api/modules/*
  -> http.ts
  -> finqzClient.ts

finqzClient.ts
  -> http.ts
  -> auth/session.ts
  -> EdgeSpark fallback

Pages with business logic
  -> localStorage
  -> mock seeds
  -> direct fetch
  -> data repositories

Decision Platform pages
  -> mock metrics / templates
  -> direct AI fetch
  -> runtime flags
```

## 12. Architecture Debt Board

| Debt | Severity | Domain | Evidence | Action recommended |
| --- | --- | --- | --- | --- |
| Auth/session owned by frontend storage | P0 | Identity / Tenant | `src/auth/session.ts`, `src/auth/AuthProvider.tsx`, `src/utils/auth.ts` | Migrar ownership para backend e contrato unico |
| Operacional data persisted locally | P0 | CRM / Pipeline / Opportunity / Commercial | `src/store/index.ts`, `src/data/*`, `src/pages/*.tsx` | Remover storage operacional do frontend |
| EdgeSpark fallback ativo | P0 | Identity / API | `src/api/finqzClient.ts` | Encerrar fallback e manter somente client oficial |
| Page-level business logic | P1 | Opportunity / Commercial / Decision | `src/pages/Oportunidades.tsx`, `src/pages/Simulador.tsx`, `src/pages/TabelasComerciais.tsx`, `src/pages/SdrIaHub.tsx` | Extrair para contratos e runtime oficial |
| Legacy API surface duplication | P1 | Platform / Integration | `src/api/client.ts`, `src/api/dataService.ts`, `src/api/modules/index.ts` | Consolidar cliente unico por dominio |
| Mock data in runtime paths | P1 | CRM / Decision / Hub | `src/pages/Campanhas.tsx`, `src/pages/Audiencias.tsx`, `src/pages/SdrIaHub.tsx` | Mover mocks para testes e fixtures controladas |
| Direct external fetches | P1 | Integrations / Cognitive | `src/data/cepService.ts`, `src/hooks/useLeadQualification.ts`, `src/pages/Configuracoes.tsx` | Introduzir ownership formal e contratos claros |
| UI persistence in bootstrap | P2 | Presentation | `src/main.tsx`, `src/layouts/MainLayout.tsx` | Limitar persistencia a preferencias de UI nao operacionais |

## 13. Risk Classification

| Severity | Risks |
| --- | --- |
| P0 | Sessao e identidade paralelas; data operacional persistida em frontend; EdgeSpark fallback; AI/Decision flow com armazenamento e fetch direto |
| P1 | Duplicidade de API clients; business logic em paginas; repositorios locais com CRUD; integracoes diretas externas |
| P2 | Seeds e mocks em runtime; persistencia de UI; menus e rotas legadas; fallback configs |
| P3 | Labels legados, aliases antigos, console warnings e compatibilidade temporaria |

## 14. Frontend Readiness Score

**Score:** 39/100

### Leitura do score

- Architecture ownership: 12/25
- API coherence: 8/20
- Storage discipline: 4/20
- Legacy isolation: 7/20
- Runtime alignment with EOS: 8/15

Interpretacao:

- o frontend entrega valor funcional;
- o frontend ainda carrega ownership indevido de runtime;
- a plataforma nao esta pronta para consolidacao como camada exclusivamente apresentacional.

## 15. Recommendations

1. Remover a dependencia de `localStorage` como fonte de verdade para Identity, Tenant, Opportunity, Commercial e Pipeline.
2. Consolidar toda comunicacao HTTP em um unico padrao canonicamente versionado por Runtime Domain.
3. Encerrar EdgeSpark fallback e o auth fallback legado.
4. Mover mocks, seeds e fixtures para testes e ambientes controlados, nao para runtime produtivo.
5. Isolar o Decision Platform frontend para apenas consumir contratos, nunca decidir, qualificar ou simular por conta propria.
6. Introduzir regras de lint e teste estrutural para proibir storage operacional e `fetch` direto fora de ownership explicitado.
7. Reclassificar `src/api/modules/*` como clientes oficiais por dominio ou eliminar duplicacao por consolidacao.

## 16. Sanitation Roadmap

### Lot 1 - Identity / Tenant Frontend Ownership

- remover sessao paralela e fallback legado;
- concentrar identidade em contrato oficial;
- impedir persistencia manual de usuario e token no frontend.

### Lot 2 - CRM / Pipeline / Opportunity State

- retirar datasets operacionais de `store/index.ts`, `api/adapters.ts`, `simulatorRepository.ts` e paginas;
- eliminar persistencia local de entidades de negocio;
- manter apenas preferencias de UI.

### Lot 3 - Commercial / Decision Platform Hardening

- remover fallback local de tabelas, condicoes, simulacao e qualificacao;
- reduzir mocks de `SdrIaHub` e pagina de tabelas;
- alinhar o frontend aos contratos oficiais de Runtime.

### Lot 4 - API Surface Collapse

- consolidar `api/client.ts`, `api/dataService.ts`, `api/modules/*` e `finqzClient.ts`;
- eliminar compatibilidade redundante;
- padronizar headers, prefixos e retry em uma base unica.

### Lot 5 - External Integrations / Legacy Cleanup

- encapsular ViaCEP, AI fetch e integracoes diretas em ownership formal;
- remover aliases e rotas legadas de menu e permissao;
- finalizar a limpeza de fallback e mock fora de testes.

## 17. Next Suggested Lots

1. Identity / Tenant.
2. CRM / Pipeline / Opportunity.
3. Commercial / Decision Platform.
4. API client consolidation.
5. External integrations and legacy cleanup.

## 18. Final Verdict

**NO GO**

Motivo:

- a fronteira de ownership do frontend ainda nao esta saneada;
- ha persistencia operacional local e duplicidade de fontes de verdade;
- ha superficie legada suficiente para causar divergencia de comportamento entre runtime, mock e fallback;
- o frontend ainda nao esta pronto para ser tratado como camada estritamente apresentacional dentro do FINQZ EOS.

## 19. Final Figures

- Fontes paralelas de verdade mapeadas: 15
- APIs legadas / compatibilidade identificadas: 22 modulos + 25 call sites diretos de `fetch`
- Arquivos com mocks/fallbacks: 30
- Usos de `localStorage`: 88
- Usos de `sessionStorage`: 0
- Dominios afetados: Identity, Tenant, CRM, Pipeline, Opportunity, Commercial, Decision Platform, Admin, Integrations, Provider, Communication
