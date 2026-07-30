# PRP-FIX-06 - Frontend Runtime Ownership Sanitation Plan

**Base obrigatoria:**
- `docs/00-master/audits/PRP-FIX-06-FRONTEND-RUNTIME-OWNERSHIP-AUDIT.md`
- `docs/00-master/audits/PRP-SANITATION-PROGRAM.md`
- `docs/00-master/audits/PRP-AUD-01.5-BACKEND-READINESS-AUDIT.md`

**Objetivo:** definir o plano oficial de saneamento do frontend para remover ownership incorreto, fontes paralelas de verdade, mocks de runtime, clientes HTTP duplicados e legados de compatibilidade.

## 1. Resumo Executivo

O frontend do FINQZ EOS ainda opera com ownership misto entre apresentacao, estado local, persistencia em `localStorage`, clientes de compatibilidade e fallbacks legados. Isso viola o principio de Runtime Ownership e impede que a camada frontend seja tratada como uma superficie puramente consumidora de contratos canonicamente definidos.

O saneamento precisa ser incremental. O foco inicial deve ser Identity/Tenant, porque esses dominios contaminam autenticao, permissao, sessao e correlacao em varias telas. Em seguida, o programa deve reduzir a persistencia operacional de CRM, Pipeline, Opportunity e Commercial. Depois disso, deve colapsar a superficie HTTP, eliminar fallbacks de EdgeSpark e remover mocks/fallbacks que ainda participam do runtime.

Veredito do plano:

- o frontend e recuperavel;
- o frontend nao deve ser corrigido em um unico lote;
- a sequencia correta e por ownership, nao por pagina;
- o lote 1 e obrigatorio para destravar os demais.

## 2. Classificacao dos Riscos

### P0

- `localStorage` como fonte de verdade para Identity e Tenant.
- Persistencia operacional de dominio em store, adapters e repositories frontend.
- EdgeSpark fallback ainda ativo.
- Estado de decisao/IA e simulacao dependentes de mocks ou fallback de runtime.
- Qualquer fluxo que gere sessao, token, usuario, tenant, permissao, pipeline, oportunidade ou tabela comercial sem backend canonicamente ownershipado.

### P1

- Clientes HTTP duplicados e superficie de compatibilidade redundante.
- Mocks e seeds participando do runtime produtivo.
- Fetch direto para servicos externos sem ownership formal.
- Logica de negocio em paginas e hooks.
- Repositorios frontend com CRUD e persistencia local de entidades de negocio.

### P2

- Persistencia de preferencias de UI que misturam estado tecnico com estado de dominio.
- Menus e rotas legadas mantidos por compatibilidade.
- Fallbacks condicionais em configuracoes de ambiente.
- Adapters que fazem normalizacao e persistencia ao mesmo tempo.

### P3

- Alias legados, nomes antigos, warnings e adaptadores transitorios.
- Campos derivados apenas para compatibilidade visual.

## 3. Lista Priorizada dos 88 Usos de localStorage

### 3.1 Prioridade 1 - Identidade, Sessao e Tenant

| Prioridade | Arquivo | Ocorrencias | Motivo |
| --- | --- | ---: | --- |
| 1 | `src/auth/session.ts` | 3 | Tokens, usuario e snapshot de sessao sao ownership critico |
| 2 | `src/auth/AuthProvider.tsx` | 8 | Provider paralelo controla login, logout e usuario |
| 3 | `src/utils/auth.ts` | 9 | Sessao, tenant e validacao misturados com storage |
| 4 | `src/hooks/useApiErrorHandler.tsx` | 3 | Limpeza de tokens e usuario por erro de auth |
| 5 | `src/main.tsx` | 1 | Bootstrap de UI baseado em storage persistido |

### 3.2 Prioridade 2 - CRM, Pipeline e Runtime de Dominio

| Prioridade | Arquivo | Ocorrencias | Motivo |
| --- | --- | ---: | --- |
| 6 | `src/store/index.ts` | 5 | Estado persistido mistura UI com dados de negocio |
| 7 | `src/api/adapters.ts` | 5 | Adapter local com CRUD e persistencia de entidades |
| 8 | `src/data/catalogRepository.ts` | 7 | Configuracao de pipeline em storage com fallback |
| 9 | `src/data/commercialRepository.ts` | 19 | Maior concentracao de persistencia de dominio no frontend |
| 10 | `src/data/simulatorRepository.ts` | 13 | Simulacoes, propostas e oportunidades persistidas localmente |
| 11 | `src/pages/Campanhas.tsx` | 2 | Persistencia de campanhas em runtime de pagina |
| 12 | `src/pages/TabelasComerciais.tsx` | 1 | Fallback local de tabelas comerciais |
| 13 | `src/pages/Simulador.tsx` | 4 | Proposta gerada e salva localmente |
| 14 | `src/layouts/MainLayout.tsx` | 4 | Estado de menu persistido no browser |
| 15 | `src/utils/idGenerator.ts` | 4 | Identificadores baseados em storage local |

### 3.3 Observacao de cobertura

- Total de ocorrencias mapeadas: `88`
- Total de arquivos com `localStorage`/`sessionStorage`: `15`
- `sessionStorage`: `0`

## 4. Lista das 15 Fontes Paralelas de Verdade

1. `src/api/adapters.ts`
2. `src/auth/session.ts`
3. `src/hooks/useApiErrorHandler.tsx`
4. `src/main.tsx`
5. `src/auth/AuthProvider.tsx`
6. `src/layouts/MainLayout.tsx`
7. `src/utils/idGenerator.ts`
8. `src/pages/Campanhas.tsx`
9. `src/utils/auth.ts`
10. `src/store/index.ts`
11. `src/pages/TabelasComerciais.tsx`
12. `src/pages/Simulador.tsx`
13. `src/data/catalogRepository.ts`
14. `src/data/commercialRepository.ts`
15. `src/data/simulatorRepository.ts`

Essas superficies sao consideradas paralelas porque armazenam, normalizam ou reconstroem dados operacionais fora dos contratos oficiais do backend.

## 5. Lista dos 30 Arquivos com Mocks / Fallbacks

1. `src/App.tsx`
2. `src/config/environment.ts`
3. `src/api/finqzClient.ts`
4. `src/auth/guards.tsx`
5. `src/auth/finqzAuth.ts`
6. `src/auth/AuthProvider.tsx`
7. `src/api/modules/base.ts`
8. `src/auth/permissions.ts`
9. `src/hooks/useLeadQualification.ts`
10. `src/api/adapters.ts`
11. `src/api/dataService.ts`
12. `src/data/commercialRepository.ts`
13. `src/data/catalogRepository.ts`
14. `src/pages/Clientes.tsx`
15. `src/pages/Eventos.tsx`
16. `src/pages/Dashboard.tsx`
17. `src/pages/Conversas.tsx`
18. `src/test/admin-pipelines-stage-edit.test.tsx`
19. `src/test/admin-pipelines-stage-archive.test.tsx`
20. `src/test/admin-pipelines-stage-visibility.test.tsx`
21. `src/test/admin-pipelines-read.test.tsx`
22. `src/store/index.ts`
23. `src/test/oportunidades-kanban-hardening.test.ts`
24. `src/test/pipeline.test.ts`
25. `src/test/admin-pipelines-stage-reorder.test.tsx`
26. `src/test/pipelines.api.test.ts`
27. `src/pages/SdrIaHub.tsx`
28. `src/pages/Oportunidades.tsx`
29. `src/pages/admin/pipelines.adapter.ts`
30. `src/pages/admin/Pipelines.tsx`

Observacao:

- o plano trata arquivos com mocks, seeds, fallback de runtime, fallback de API ou compatibilidade legada;
- arquivos de teste sao mantidos apenas como referencia de cobertura e nao devem virar runtime production debt.

## 6. Lista dos 22 Modulos de APIs Legadas

1. `src/api/modules/base.ts`
2. `src/api/modules/index.ts`
3. `src/api/modules/auth.api.ts`
4. `src/api/modules/usuarios.api.ts`
5. `src/api/modules/roles.api.ts`
6. `src/api/modules/permissions.api.ts`
7. `src/api/modules/clientes.api.ts`
8. `src/api/modules/parceiros.api.ts`
9. `src/api/modules/partners.api.ts`
10. `src/api/modules/oportunidades.api.ts`
11. `src/api/modules/opportunities.api.ts`
12. `src/api/modules/pipelines.api.ts`
13. `src/api/modules/financeiro.api.ts`
14. `src/api/modules/automacoes.api.ts`
15. `src/api/modules/dashboard.api.ts`
16. `src/api/modules/commercial.api.ts`
17. `src/api/modules/master-catalog.api.ts`
18. `src/api/modules/integrations.api.ts`
19. `src/api/modules/provider-operations.api.ts`
20. `src/api/modules/partner-acquisition.api.ts`
21. `src/api/modules/auditoria.api.ts`
22. `src/api/modules/alertas.api.ts`

Diretriz:

- a API module surface deve ser consolidada por ownership oficial;
- modulos duplicados, aliases e compatibilidade devem ser eliminados por lote.

## 7. Lista dos 25 Call Sites Diretos de fetch

### 7.1 Por arquivo

| Arquivo | Call sites |
| --- | ---: |
| `src/api/integrations.ts` | 10 |
| `src/data/catalogRepository.ts` | 6 |
| `src/api/http.ts` | 2 |
| `src/data/cepService.ts` | 2 |
| `src/pages/Configuracoes.tsx` | 2 |
| `src/api/finqzClient.ts` | 1 |
| `src/hooks/useLeadQualification.ts` | 1 |
| `src/pages/Oportunidades.tsx` | 1 |
| **Total** | **25** |

### 7.2 Diretriz

- todos os `fetch` diretos devem ser absorvidos por clients oficiais ou integracao claramente ownershipada;
- `fetch` direto em pagina/hook/service so e aceitavel quando a integracao estiver formalmente designada como runtime externo do frontend;
- `fetch` para AI, CEP e integracoes deve ser encapsulado e versionado.

## 8. Ordem Recomendadade Correcao por Lote

### Lote 1 - Identity / Tenant Frontend Ownership

Escopo:

- `src/auth/session.ts`
- `src/auth/AuthProvider.tsx`
- `src/utils/auth.ts`
- `src/hooks/useApiErrorHandler.tsx`
- `src/main.tsx`
- `src/auth/finqzAuth.ts`

Objetivo:

- remover ownership paralelo de sessao;
- impedir uso de `localStorage` como fonte de verdade para usuario, token e tenant;
- consolidar auth em um unico fluxo canonicamente alinhado ao backend.

### Lote 2 - CRM / Pipeline / Opportunity State Ownership

Escopo:

- `src/store/index.ts`
- `src/api/adapters.ts`
- `src/data/catalogRepository.ts`
- `src/data/simulatorRepository.ts`
- `src/pages/Oportunidades.tsx`
- `src/pages/Simulador.tsx`
- `src/pages/Campanhas.tsx`
- `src/pages/Conversas.tsx`

Objetivo:

- eliminar persistencia operacional local;
- retirar datasets de negocio do frontend;
- manter apenas UI state e preferencias nao operacionais.

### Lote 3 - Commercial / Decision Platform Hardening

Escopo:

- `src/data/commercialRepository.ts`
- `src/pages/TabelasComerciais.tsx`
- `src/pages/SdrIaHub.tsx`
- `src/hooks/useLeadQualification.ts`
- `src/components/ui/SdrPanel.tsx`

Objetivo:

- remover mocks e fallback de runtime;
- reduzir a camada de decisao/IA a consumo de contrato;
- eliminar armazenamentos e calculos locais de dominio.

### Lote 4 - API Client Surface Collapse

Escopo:

- `src/api/client.ts`
- `src/api/dataService.ts`
- `src/api/modules/*`
- `src/api/finqzClient.ts`
- `src/api/http.ts`

Objetivo:

- unificar a superficie HTTP;
- remover client duplicado e aliases legados;
- definir ownership unico por dominio.

### Lote 5 - External Integrations / Legacy Cleanup

Escopo:

- `src/data/cepService.ts`
- `src/api/integrations.ts`
- `src/pages/Configuracoes.tsx`
- `src/layouts/MainLayout.tsx`
- `src/config/environment.ts`

Objetivo:

- encapsular integracoes externas;
- remover paths legados;
- extinguir flags e fallbacks que ainda atuam como runtime alternativo.

### Lote 6 - Frontend Re-Audit

Escopo:

- auditoria completa do frontend apos os lotes 1 a 5.

Objetivo:

- recontar fontes paralelas;
- validar reducao de `localStorage`;
- verificar colapso do EdgeSpark fallback;
- validar que o frontend passou a operar apenas como consumidor de contratos canônicos.

## 9. Critérios de Aceite por Lote

### Lote 1

- nenhum token/usuario/tenant persistido como verdade operacional em frontend;
- auth provider paralelo eliminado ou tornado puramente adaptador;
- login/logout sem dependencia de storage paralelo.

### Lote 2

- nenhuma entidade operacional persistida no browser;
- store contendo apenas estado de UI ou cache estritamente nao operacional;
- Opportunity, Pipeline e CRM sem CRUD local.

### Lote 3

- `SdrIaHub` sem mock de runtime;
- `useLeadQualification` sem fetch direto opaco;
- `commercialRepository` sem persistencia de dominio no browser.

### Lote 4

- um unico padrao de client HTTP por dominio;
- `api/client.ts`, `dataService.ts` e `finqzClient.ts` sem duplicacao funcional;
- `api/modules/index.ts` sem export surface ambigua.

### Lote 5

- EdgeSpark completamente fora do runtime de producao;
- integracoes externas encapsuladas;
- menus, aliases e flags legadas reduzidos ao minimo.

### Lote 6

- auditoria apontando reducao material de todos os indicadores de risco;
- readiness score com ganho significativo;
- sem nova fonte paralela de verdade descoberta.

## 10. Testes Obrigatorios por Lote

### Lote 1

- teste de login/logout e restauracao de sessao;
- teste de limpeza de tokens e usuario;
- teste de isolamento de tenant e permissao;
- teste de ausencia de fallback legadO em producao.

### Lote 2

- teste de store sem persistencia de entidades operacionais;
- teste de pipeline/opportunity sem CRUD local;
- teste de compatibilidade visual das telas de CRM.

### Lote 3

- teste de carregamento de tabelas e simulacao somente por contrato oficial;
- teste de ausencia de mocks em runtime produtivo;
- teste de qualificacao sem dependencia direta de fetch opaco.

### Lote 4

- teste de client unico por dominio;
- teste de exports publicos consistentes;
- teste de roteamento de requests e headers padronizados.

### Lote 5

- teste de integracoes externas encapsuladas;
- teste de EdgeSpark desativado;
- teste de menus e flags legadas em modo de compatibilidade controlada.

### Lote 6

- teste de regressao global do frontend;
- teste estrutural de ausencia de fontes paralelas remanescentes;
- teste de cobertura dos dominos afetados.

## 11. Riscos de Regressao

1. Quebra de login/logout ao remover o fallback legado.
2. Quebra de fluxo de tenant se o usuario persistido localmente deixar de existir sem substituicao adequada.
3. Perda de disponibilidade aparente em telas que hoje dependem de fallback local.
4. Queda de experiencia em telas de simulacao e tabelas se contratos oficiais ainda nao cobrirem todos os cenarios.
5. Quebra de compatibilidade em menus/rotas legadas.
6. Regressoes de UX se preferencias de UI forem confundidas com persistencia operacional.

Mitigacao:

- migracao incremental;
- teste estrutural por lote;
- rollout por dominio;
- preservacao temporaria apenas de preferencias de UI nao operacionais;
- rejeicao de qualquer novo runtime paralelo.

## 12. Estrategia para Substituir localStorage por Backend / Store Canonic

1. Definir o backend como fonte de verdade para sessao, tenant e dados operacionais.
2. Limitar o store frontend a estado transitivo de UI.
3. Migrar persistencia de dominio para contratos canônicos do backend.
4. Retirar adapters que gravam dados operacionais localmente.
5. Substituir leitura direta de `localStorage` por hydration explicita a partir de contratos oficiais.
6. Manter apenas armazenamento de preferencias visuais e UX se nao houver impacto em dominio.

## 13. Estrategia para Colapsar EdgeSpark / Fallbacks

1. Desligar fallback por flag.
2. Eliminar dependencia do `EdgeSparkClient` do caminho de producao.
3. Manter auth via cliente oficial e refresh nativo.
4. Remover caminhos de execucao que aceitam apenas fallback por `try/catch`.
5. Criar testes que provem que o caminho legacy nao e utilizado em producao.

## 14. Estrategia para Unificar Clients HTTP

1. Definir um cliente HTTP base canonical.
2. Fazer `api/client.ts`, `api/dataService.ts`, `api/modules/*` e `finqzClient.ts` convergirem para um unico conjunto de primitives.
3. Remover duplicacao de prefixo, headers e tratamento de erro.
4. Validar que cada dominio possua um contrato publico unico.
5. Encerrar a superficie de compatibilidade onde ela nao for necessaria.

## 15. Estrategia para Remover Mocks de Runtime

1. Remover seeds de runtime de paginas e repositories.
2. Manter mocks apenas em testes e fixtures controladas.
3. Transformar fallback de runtime em erro explicito quando o contrato oficial nao existir.
4. Documentar cada excecao temporaria com prazo e ownership.
5. Validar que nenhuma tela de producao dependa de mock para renderizar informacao operacional.

## 16. Roadmap Oficial do PRP-FIX-06

### Fase 1

- Lote 1
- Lote 2

### Fase 2

- Lote 3
- Lote 4

### Fase 3

- Lote 5

### Fase 4

- Lote 6

## 17. Riscos por Dominio

| Dominio | Risco principal | Prioridade |
| --- | --- | --- |
| Identity | sessao e token em storage local | P0 |
| Tenant | tenant derivado de estado paralelo | P0 |
| CRM | dados operacionais persistidos no browser | P1 |
| Pipeline | configuracao local e fallback de stages | P1 |
| Opportunity | CRUD local e simulacao com storage | P1 |
| Commercial | tabelas/conditions/providers locais | P1 |
| Decision Platform | mocks, fallback e fetch direto | P0 |
| Integrations | fetch direto sem ownership | P1 |
| Presentation | menu e preferencias persistidas | P2 |

## 18. Veredito Tecnico

**GO WITH RESTRICTIONS**

Motivo:

- o plano e executavel;
- a ordem dos lotes esta correta;
- os riscos sao conhecidos e mitigaveis;
- porem o frontend ainda possui excesso de ownership paralelo para receber correcao sem restricoes.

## 19. P0, P1, P2 e P3 Encontrados

### P0

- `src/auth/session.ts`
- `src/auth/AuthProvider.tsx`
- `src/utils/auth.ts`
- `src/api/finqzClient.ts`
- `src/data/commercialRepository.ts`
- `src/data/simulatorRepository.ts`
- `src/store/index.ts`
- `src/pages/SdrIaHub.tsx`
- `src/hooks/useLeadQualification.ts`

### P1

- `src/api/client.ts`
- `src/api/dataService.ts`
- `src/api/modules/index.ts`
- `src/api/modules/*.ts`
- `src/pages/Oportunidades.tsx`
- `src/pages/Simulador.tsx`
- `src/pages/TabelasComerciais.tsx`
- `src/pages/Campanhas.tsx`
- `src/pages/Conversas.tsx`
- `src/data/cepService.ts`
- `src/api/integrations.ts`

### P2

- `src/main.tsx`
- `src/layouts/MainLayout.tsx`
- `src/config/environment.ts`
- `src/api/adapters.ts`
- `src/pages/Eventos.tsx`
- `src/pages/Dashboard.tsx`

### P3

- aliases legados em menus, rotas e permissao;
- warnings de compatibilidade transitoria;
- campos e labels mantidos somente para migração.

## 20. Lote Prioritario

**Lote 1 - Identity / Tenant Frontend Ownership**

Razao:

- corrige a base da autenticacao;
- reduz o maior vetor de risco sistico;
- destrava toda a cadeia de permissao, header, session e correlation.

## 21. Roadmap de Execucao

1. Validar Lote 1 com testes de auth e tenant.
2. Remover persistencia operacional do CRM e Pipeline no Lote 2.
3. Saneamento do Commercial e Decision Platform no Lote 3.
4. Colapsar clients HTTP e exports legados no Lote 4.
5. Encerrar integracoes e fallbacks legados no Lote 5.
6. Reauditar todo o frontend no Lote 6.

## 22. Critérios de Encerramento do Plano

O PRP-FIX-06 so pode ser considerado concluido quando:

- `localStorage` nao for fonte operacional de verdade;
- EdgeSpark fallback estiver desativado;
- o frontend possuir um client HTTP canonicamente unificado;
- mocks/fallbacks nao participarem do runtime produtivo;
- os dominios Identity, Tenant, CRM, Pipeline, Opportunity e Commercial estiverem ownershipados pelo backend;
- a reauditoria final mostrar reducao material de risco e sem novas fontes paralelas de verdade.
