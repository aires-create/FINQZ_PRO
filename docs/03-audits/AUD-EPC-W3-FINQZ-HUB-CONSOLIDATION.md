# AUD-EPC-W3-FINQZ-HUB-CONSOLIDATION

## 1. Executive Summary

Esta auditoria avalia exclusivamente o dominio FINQZ HUB no estado atual do repositorio, com foco em:

- WhatsApp
- SDR IA
- Higienizacao
- Campanhas
- Disparos
- E-mail Marketing
- Audiencias
- Mailing
- Integracoes relacionadas ao HUB

Conclusao executiva:

- O HUB existe como superficie de navegacao e experiencia, mas nao esta consolidado como dominio canonico unico.
- Ha uma separacao clara entre paginas reais, placeholders e runtime legado.
- O backend oficial Fastify registra integracoes em um modelo de catalogo/runtime de providers, mas nao expande um dominio HUB completo para campanhas, disparos, mailing e higienizacao.
- O SDR IA esta dividido entre um painel front-end rico, um painel de conversa acoplado ao WhatsApp e um runtime legado separado em `backend/src/index.ts`.
- Campanhas e Audiencias usam chamadas diretas a endpoints de compatibilidade/legado no front-end, sem aparecerem como dominio canonico unificado no bootstrap oficial analisado.
- Parte relevante do escopo ainda e placeholder, portanto o HUB nao esta pronto para consolidacao como uma vertical enterprise fechada.

Veredito final:

**BLOCKED**

Motivo principal:

- O HUB ainda mistura runtime oficial, runtime legado, placeholders e aliases de navegacao para capacidades que ainda nao foram canonicalizadas.
- O dominio nao apresenta fronteira arquitetural suficiente para consolidacao sem antes fechar ownership, contratos e pontos de entrada.

## 2. Escopo e Evidencias

### 2.1 Superficie de UX e navegacao

- `src/layouts/MainLayout.tsx`
- `src/routes/hub.routes.tsx`
- `src/routes/integrations.routes.tsx`

### 2.2 Superficie de experiencia do HUB

- `src/pages/Conversas.tsx`
- `src/components/ui/SdrPanel.tsx`
- `src/pages/Campanhas.tsx`
- `src/pages/Audiencias.tsx`
- `src/pages/SdrIaHub.tsx`
- `src/pages/Placeholders.tsx`

### 2.3 Runtime e integracoes

- `backend/src/core/http/fastify.ts`
- `backend/src/modules/integrations/integrations.module.ts`
- `backend/src/modules/integrations/presentation/http/integrations.routes.ts`
- `backend/src/modules/integrations/application/provider-catalog.ts`
- `backend/src/modules/integrations/provider-runtime-registry.ts`
- `backend/src/index.ts`

### 2.4 Observacao de persistencia

- Nao foram encontrados modelos `sdr*`, `campaign*`, `audience*`, `conversation*` ou equivalentes no `backend/prisma/schema.prisma` durante esta auditoria.

## 3. Mapa Arquitetural do FINQZ HUB

### 3.1 Camada de navegacao

O HUB aparece no menu principal como grupo proprio:

- `src/layouts/MainLayout.tsx` define o grupo `FINQZ HUB` e suas permissoes.
- `src/routes/hub.routes.tsx` faz o roteamento canonico de `hub/*`.

Capacidades expostas no menu:

- WhatsApp
- SDR IA
- Higienizacao
- Campanhas
- Disparos
- E-mail Marketing

### 3.2 Camada de experiencia

Estado real por capacidade:

| Capacidade | Estado | Leitura arquitetural |
| --- | --- | --- |
| WhatsApp | PARTIAL | Tela funcional de conversa, com fila, mensagens e acoplamento ao SdrPanel. |
| SDR IA | LEGACY/PARTIAL | Painel rico, mas dependente de endpoints legados e de composicao local. |
| Higienizacao | FUTURE | Apenas placeholder de experiencia. |
| Campanhas | PARTIAL/LEGACY | Tela funcional com chamadas diretas a `/api/campanhas`. |
| Disparos | FUTURE | Apenas placeholder. |
| E-mail Marketing | FUTURE | Apenas placeholder. |
| Audiencias | PARTIAL | Tela funcional com chamadas diretas a `/api/audiences`. |
| Mailing | FUTURE | Sem runtime canonico proprio; hoje e apenas intencao de menu. |
| Integracoes relacionadas | PARTIAL | Catalogo e console existem, mas focados em providers e nao em HUB messaging end-to-end. |

### 3.3 Camada de runtime

O backend oficial hoje concentra-se em:

- bootstrap Fastify em `backend/src/core/http/fastify.ts`
- registro de `integrationsRoutes` em `/api/v1/integrations`
- providers runtime para `sos-bolso`, `handmais` e `bluepay`

O que isso significa:

- O backend oficial tem uma arquitetura madura de providers.
- O HUB de mensageria/engajamento nao aparece como dominio runtime canônico equivalente.
- Capacidades como WhatsApp Business e bulk messaging estao apenas no catalogo planejado, nao no runtime efetivo.

### 3.4 Camada legacy

`backend/src/index.ts` e um runtime separado de estilo Hono/EdgeSpark que implementa parte do SDR IA:

- analise de mensagem
- decisao de SDR
- criacao de oportunidade
- handoff para humano
- configuracao de SDR

Essa superficie nao aparece como entrypoint do bootstrap Fastify oficial observado nesta auditoria.

## 4. Grafo de Dependencias

```mermaid
graph TD
  MainLayout[src/layouts/MainLayout.tsx] --> HubRoutes[src/routes/hub.routes.tsx]
  MainLayout --> IntegrationsRoutesFrontend[src/routes/integrations.routes.tsx]

  HubRoutes --> CampanhasPage[src/pages/Campanhas.tsx]
  HubRoutes --> ConversasPage[src/pages/Conversas.tsx]
  HubRoutes --> AudienciasPage[src/pages/Audiencias.tsx]
  HubRoutes --> SdrIaHubPage[src/pages/SdrIaHub.tsx]
  HubRoutes --> PlaceholderPages[src/pages/Placeholders.tsx]

  ConversasPage --> SdrPanel[src/components/ui/SdrPanel.tsx]
  SdrPanel --> LegacySdrApi[/api/sdr/analyze / escalate / opportunity/]
  ConversasPage --> ConversationsApi[/api/conversations/*]
  CampanhasPage --> CampaignApi[/api/campanhas/*]
  AudienciasPage --> AudiencesApi[/api/audiences/*]
  SdrIaHubPage --> SdrApi[/api/sdr/*]
  SdrIaHubPage --> OpportunitiesApi[src/api/modules/oportunidades.api.ts]

  IntegrationsRoutesFrontend --> FinqzClient[src/api/finqzClient.ts]
  FinqzClient --> BackendIntegrations[/api/v1/integrations/providers/capabilities]

  BackendFastify[backend/src/core/http/fastify.ts] --> BackendIntegrationsRoutes[backend/src/modules/integrations/presentation/http/integrations.routes.ts]
  BackendIntegrationsRoutes --> ProviderCatalog[backend/src/modules/integrations/application/provider-catalog.ts]
  BackendIntegrationsRoutes --> ProviderEngine[backend/src/modules/integrations/application/provider-engine.ts]
  ProviderCatalog --> RuntimeProviders[backend/src/modules/integrations/provider-runtime-registry.ts]
  RuntimeProviders --> SosBolso[backend/src/modules/integrations/providers/sos-bolso]
  RuntimeProviders --> Handmais[backend/src/modules/integrations/providers/handmais]
  RuntimeProviders --> Bluepay[backend/src/modules/integrations/providers/bluepay]

  LegacySdrApi --> LegacyBackend[backend/src/index.ts]

  BackendFastify -. nao registra .-> LegacyBackend
```

### Leitura do grafo

- A experiencia do HUB e montada no front-end, mas depende de multiplas superfices HTTP com maturidades diferentes.
- O WhatsApp e o ponto mais acoplado ao SDR IA.
- O SDR IA tem duas fontes de verdade: o painel rico em `src/pages/SdrIaHub.tsx` e o runtime legado em `backend/src/index.ts`.
- Integracoes de backend estao maduras para providers, mas ainda nao equivalem a um dominio HUB de engajamento completo.

## 5. Duplicidades Encontradas

| Achado | Evidencia | Leitura |
| --- | --- | --- |
| Duplicidade de nomenclatura WhatsApp vs Conversas | `src/routes/hub.routes.tsx`, `src/components/ui/SdrPanel.tsx`, `src/pages/Conversas.tsx` | A UI fala em WhatsApp, mas a permissao e a rota usam `conversas` em partes do fluxo. |
| Duplicidade de permissao por rota | `src/layouts/MainLayout.tsx`, `src/routes/hub.routes.tsx` | O menu usa um vocabulario, enquanto `ProtectedRoute` usa outro para a mesma capacidade. |
| Duplicidade de runtime de SDR IA | `src/pages/SdrIaHub.tsx`, `src/components/ui/SdrPanel.tsx`, `backend/src/index.ts` | O mesmo dominio e servido por painel local e por runtime legacy separado. |
| Duplicidade de consumo de APIs de campanha e audiencia | `src/pages/Campanhas.tsx`, `src/pages/Audiencias.tsx` | O front usa endpoints diretos de compatibilidade, sem um dominio unificado visivel no backend oficial auditado. |
| Duplicidade entre catalogo e runtime de integracoes | `backend/src/modules/integrations/application/provider-catalog.ts`, `backend/src/modules/integrations/provider-runtime-registry.ts` | O catalogo inclui capacidades planejadas, mas o runtime registra apenas providers financeiros atuais. |
| Duplicidade de UX entre HUB e Admin para integracoes/automacoes | `src/routes/integrations.routes.tsx`, `src/pages/admin/Integracoes.tsx`, `src/pages/admin/ProviderOperationsConsole.tsx` | Existem duas superficies para ler a mesma familia de integracoes: catalogo administrativo e console operacional. |
| Duplicidade de intencao entre placeholders e pages reais | `src/pages/Placeholders.tsx`, `src/pages/SdrIaHub.tsx`, `src/pages/Campanhas.tsx`, `src/pages/Audiencias.tsx` | O menu promete a mesma capacidade em dois estados diferentes: placeholder e implementacao parcial. |

## 6. Riscos

| Risco | Severidade | Impacto | Status |
| --- | --- | --- | --- |
| HUB sem owner canonico unico | P1 | Facilita divergencia de contrato entre UI, runtime e governance. | Aberto |
| SDR IA com split de runtime | P1 | Pode gerar comportamento diferente entre o painel rico e o runtime legacy. | Aberto |
| Campanhas e Audiencias usando endpoints diretos | P2 | Aumenta risco de fragilidade contratual e acoplamento ao legado. | Aberto |
| Placeholders ainda expostos no menu enterprise | P2 | Passa sensacao de capacidade pronta quando ainda nao existe runtime canonico. | Aberto |
| Catalogo de integracoes mais amplo que o runtime | P2 | Pode confundir capacidade anunciada com capacidade realmente operacional. | Aberto |
| Vocabulario de permissao inconsistente | P2 | Dificulta RBAC, auditoria e manutencao evolutiva. | Aberto |
| Ausencia de persistencia HUB canonica no schema auditado | P1 | Impede consolidacao de estados operacionais do dominio em um unico backend. | Aberto |

## 7. Oportunidades de Consolidacao

- Consolidar WhatsApp e Conversas em uma unica linguagem de produto e permissao.
- Reduzir o SDR IA para uma unica superficie canônica, eliminando o split entre painel rico e runtime legado.
- Converter Campanhas e Audiencias em dominios backend formais, com contratos versionados.
- Tratar Disparos, Higienizacao, E-mail Marketing e Mailing como capacidades planejadas ate existir runtime real.
- Separar claramente catalogo de integracoes de runtime operacional de integracoes.
- Reclassificar o menu do HUB para refletir o que e entrega real e o que e roadmap.

## 8. Recomendacoes

### 8.1 Recomendacoes prioritarias

1. Definir owner canonico do HUB por capacidade antes de expandir a UX.
2. Unificar nomenclatura de permissoes, rotas e paginas.
3. Remover a ambiguidade entre `conversas`, `whatsapp` e `sdr_ia` no desenho do menu.
4. Formalizar contratos backend para campanhas e audiencias, se a intencao for manter essas superficies como runtime.
5. Manter placeholders apenas como roadmap visual, nao como falsa completude operacional.

### 8.2 Recomendacoes de consolidacao tecnica

1. Encerrar a dependencia operacional do `backend/src/index.ts` para SDR IA.
2. Rebaixar endpoints diretos de compatibilidade para uma camada de transicao com prazo de retirada.
3. Segregar catalogo de providers planejados do runtime efetivamente carregado.
4. Revisar o uso de permissao `hub:view` versus permissoes especificas por capacidade.
5. Formalizar auditoria e persistencia do dominio HUB antes de promover novas features de automacao.

## 9. Veredito Final

**BLOCKED**

### Justificativa

- O FINQZ HUB ainda nao se comporta como um dominio enterprise consolidado e unico.
- Ha fragmentacao entre runtime oficial, runtime legado, pages locais e placeholders.
- O escopo auditado ainda depende de superficies transicionais e de nomenclatura inconsistente.
- A consolidacao exigiria fechamento de ownership, contratos e persistencia antes de ampliar o dominio.

### Condicao para reavaliacao

Reavaliar o EPC-W3 quando houver:

- uma unica fonte de verdade para SDR IA;
- contratos backend formais para campanhas e audiencias;
- definicao clara do que pertence ao HUB e do que pertence ao Core Platform;
- runtime operacional ou descomissionamento formal para disparos, higienizacao, mailing e e-mail marketing.
