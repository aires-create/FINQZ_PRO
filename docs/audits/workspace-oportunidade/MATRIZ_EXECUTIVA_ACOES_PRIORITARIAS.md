# Matriz Executiva de Acoes Prioritarias - Workspace da Oportunidade

## Resumo executivo

Esta matriz consolida a auditoria aprovada como diagnostico tecnico oficial da fase atual da Workspace da Oportunidade.

Leitura executiva:

- O backend oficial de oportunidades existe e esta registrado no bootstrap.
- A tela principal segue funcional no fluxo principal, mas ainda opera em estado hibrido.
- A documentacao atual contem divergencias e nao pode ser usada isoladamente como SSOT.
- O risco mais sensivel para a fase atual nao e mais o erro `normalizeOpportunityWorkspace is not defined`, e sim a consolidacao entre contrato canonico, compatibilidade legada, persistencia local e cobertura de testes reais de interacao.

## SSOT adotado

Ordem de precedencia para qualquer decisao tecnica desta fase:

1. Macroarquitetura: `docs/00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md`
2. Contrato funcional e de dominio da workspace:
   - `docs/audits/workspace-oportunidade/contracts-source-of-truth/MATRIZ_FONTE_VERDADE_WORKSPACE.md`
   - `docs/audits/workspace-oportunidade/phase-a/CONTRATO_CANONICO_WORKSPACE.md`
   - `docs/audits/workspace-oportunidade/contracts-source-of-truth/RASTREAMENTO_PONTA_A_PONTA_WORKSPACE.md`
3. Implementacao atual:
   - frontend
   - backend
   - Prisma
   - testes existentes

Em qualquer divergencia entre documento e codigo, a regra desta fase e registrar o conflito e propor consolidacao documental, sem assumir que o comportamento atual e contrato definitivo.

## Matriz executiva de acoes prioritarias

| ID | Area / funcionalidade | Situacao atual | Evidencia no codigo ou documento | Fonte de verdade aplicavel | Divergencia identificada | Acao recomendada | Impacto no frontend | Impacto no backend | Impacto no Prisma ou banco | Impacto em RBAC | Impacto em tenant | Testes necessarios | Dependencias | Risco | Prioridade | Complexidade estimada | Bloco de implementacao sugerido | Criterio objetivo de aceite | Estrategia de rollback |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| DOC-01 | Consolidacao documental / SSOT | Documentacao espalhada e parcialmente divergente | `AUDITORIA_WORKSPACE_OPORTUNIDADE.md`, `AUDITORIA_CONTRATOS_FONTE_VERDADE.md`, `MATRIZ_FONTE_VERDADE_WORKSPACE.md`, `CONTRATO_CANONICO_WORKSPACE.md` | Hierarquia SSOT aprovada pelo usuario | Alguns docs afirmam que tags, anexos, historico e simulador estao plenamente persistidos, enquanto outros os tratam como local/hibrido | Marcar documentos canonicos, atualizar os divergentes e classificar o restante como historico | Nenhum direto | Nenhum direto | Nenhum direto | Nenhum direto | Nenhum direto | Revisao documental e conferencias de links | Nenhuma | Medio | P2 | Baixa | Bloco A - Consolidacao documental | Todos os docs apontam para a mesma hierarquia SSOT e cessam afirmacoes conflitantes | Reverter apenas os docs atualizados |
| DOC-02 | Nomenclatura padrao | Ruido entre `oportunidades`, `opportunities`, `/api/oportunidades` e `/api/v1/opportunities` | `src/api/client.ts`, `src/api/modules/opportunities.api.ts`, docs com nomenclaturas antigas | Contrato oficial de backend + contrato de compatibilidade | Termos diferentes estao sendo usados para a mesma familia de rotas e wrappers | Padronizar nomenclatura por camada e registrar aliases como legados | Nenhum direto | Nenhum direto | Nenhum direto | Nenhum direto | Nenhum direto | Auditoria de texto e mapeamento de nomes | DOC-01 | Baixo a medio | P2 | Baixa | Bloco A - Consolidacao documental | Lista final de nomes oficiais e legados validada e documentada | Reverter somente a documentacao nominal |
| DOC-03 | Classificacao documental | Existe mistura de docs atuais, historicas e de transicao | `REGISTRO_EVIDENCIAS_*`, `PLANO_EXECUCAO_*`, `RELATORIO_IMPLEMENTACAO_FASE_A.md` | SSOT aprovada + evidencia de codigos/testes | Falta rotulo consistente para o que e canonico, transicional e historico | Criar mapa documental com tags: canonico, historico, transicional, redundante | Nenhum direto | Nenhum direto | Nenhum direto | Nenhum direto | Nenhum direto | Revisao editorial | DOC-01 | Baixo | P3 | Baixa | Bloco A - Consolidacao documental | Cada documento possui classificacao explicita | Reverter apenas o catalogo documental |
| UI-01 | Abertura do card e modal fullscreen | Fluxo principal funcional, mas e o ponto mais sensivel da experiencia | `src/pages/Oportunidades.tsx`, `handleOpenLead`, `showFullscreenModal`, `src/test/oportunidades-kanban-hardening.test.ts` | `normalizeOpportunityWorkspace` e contrato canônico da workspace | Ainda faltam testes reais de interacao cobrindo clique, abertura do modal e preservacao de eventos internos | Consolidar regressao de abertura com teste de UI real | Ajustes pequenos no componente e nos testes de interacao | Nenhum ou minimo | Nenhum | Nenhum | Nenhum | Clique no corpo do card, modal fullscreen, stopPropagation, canais rapidos | UI-03, TEST-02 | Alto | P1 | Media | Bloco B - Regressao funcional do card | Clique abre o modal correto sem ReferenceError e sem abrir indevidamente por interacoes internas | Reverter o teste e o ajuste minimo do componente |
| UI-02 | Cabecalho e dados da oportunidade | O cabeçalho ainda combina dados persistidos, derivados e fallback cru | `src/pages/Oportunidades.tsx`, `phase-a/CONTRATO_CANONICO_WORKSPACE.md` | Contrato canonico da workspace | `stageLabel` deveria ser o label resolvido, mas ha areas ainda renderizando `etapa_id` ou `etapa` de forma direta | Normalizar exibicao do cabecalho e separar id operacional de label | Padronizacao de leitura do view model | Nenhum direto | Nenhum direto | Nenhum direto | Nenhum direto | Testes unitarios do normalizador e snapshot funcional do cabeçalho | UI-01, ARCH-01 | Medio | P2 | Media | Bloco C - Canonizacao visual da workspace | Cabecalho mostra label canonico e nao expõe id operacional cru | Reverter somente a renderizacao do cabecalho |
| UI-03 | Sincronizacao com card da Pipeline | O card da pipeline alimenta o modal, mas a amarra entre dados brutos, compat e view model precisa permanecer estabilizada | `handleOpenLead`, `normalizeOpportunityWorkspace`, `src/components/pipeline/workspaceOpportunity.ts` | View model canônico + rastreamento ponta a ponta | O objeto vindo do card pode ser de API, store ou compat; a tela precisa tratar todos de forma consistente | Manter normalizador como ponto unico de entrada do modal | Menor acoplamento entre card e modal | Nenhum direto | Nenhum direto | Nenhum direto | Nenhum direto | Testes de origem variada: API, Zustand, compat adapter, card da pipeline | UI-01, ARCH-02 | Medio | P1 | Media | Bloco B - Regressao funcional do card | Mesma oportunidade abre corretamente vindo de API, store, compat ou pipeline | Reverter a amarracao do fluxo de abertura |
| FUN-01 | Tarefas e anotacoes | Ainda parecem area hibrida ou local, sem consolidacao oficial comprovada | `src/pages/Oportunidades.tsx`, matrizes de funcionalidade, audit de workspace | `MATRIZ_FONTE_VERDADE_WORKSPACE.md` e `CONTRATO_CANONICO_WORKSPACE.md` | Nao ha prova suficiente de persistencia enterprise completa para esse pacote funcional | Definir contrato oficial para tarefas e anotacoes antes de ampliar UI | Pode exigir trocar arrays locais por dados consumidos do contrato oficial | Pode exigir novos endpoints ou reaproveitamento de activity/timeline | Pode exigir tabela/relacao ou reaproveitamento de `Activity` | Possivel permissao de leitura/escrita | Tenant deve ser aplicado no contrato oficial | Testes unitarios e de integracao sobre persistencia e leitura | ARCH-03, SEC-01 | Alto | P2 | Media | Bloco D - Consolidacao de tarefas e anotacoes | Leitura e escrita passam a usar contrato oficial, com persistencia comprovada | Reverter para a UI atual apenas como compatibilidade |
| FUN-02 | Simulador, memoria de calculo e aplicacao do resultado | O simulador existe, mas ainda e descrito como local-first ou parcialmente desconectado | `src/pages/Oportunidades.tsx`, `src/pages/Simulador.tsx`, `src/data/simulatorRepository.ts`, docs de matriz | Contrato canonico da workspace + evidencia do simulador standalone | A memoria de calculo e a aplicacao do resultado precisam de contrato claro e de persistencia comprovada | Vincular simulacao ao produto/subproduto correto e definir o destino do resultado | Impacta selecao de campos e aplicacao no modal | Pode exigir endpoints ou adapters de persistencia | Pode exigir gravacao em banco ou event store | Permissoes de criacao/edicao de proposta ou oportunidade | Tenant precisa ser preservado em toda simulacao | Unitarios para calculo, integracao para persistencia, UI para aplicacao do resultado | ARCH-03, SEC-01 | Alto | P2 | Alta | Bloco E - Consolidacao do simulador | Resultado calculado e aplicado sem ambiguidade e com persistencia auditavel | Reverter o fluxo do simulador para o estado atual |
| FUN-03 | Geração de PDF | Ha mencao recorrente, mas nao existe prova suficiente de fluxo oficial fechado nesta auditoria | Plano de execucao e docs de fase | SSOT funcional + contratos de proposta/comercial | PDF nao esta consolidado como fluxo oficial da workspace | Definir pipeline de geracao, armazenamento e auditoria do PDF | Pode exigir botao/acao e estados de salvamento | Pode exigir endpoint oficial ou servico de documentos | Pode exigir storage ou registro em tabela de documentos | Possiveis permissos de leitura e emissao | Tenant obrigatorio no artefato gerado | Testes de geracao, persistencia e acesso | FUN-02, SEC-01, ARCH-03 | Medio | P2 | Media | Bloco F - Proposta/PDF | PDF gerado, persistido e rastreavel por oportunidade | Remover o gatilho novo e manter o estado atual |
| FUN-04 | Tags | O catalogo e tratado como local ou hibrido nas matrizes atuais | `src/config/tags.ts`, `src/pages/Oportunidades.tsx`, docs de matriz | SSOT de dominio + evidencia local | Nao ha prova conclusiva de catalogo persistido por tenant | Definir origem oficial do catalogo e padronizar leitura/escrita | Troca de fonte local por catalogo oficial ou compat | Pode exigir endpoint de catalogo ou reuse de backend existente | Pode exigir tabela/catalogo por tenant | RBAC de edicao pode ser necessario | Tenant obrigatorio se catalogo for multi-tenant | Unitarios de catalogo, integracao de leitura, UI de selecao | ARCH-03, SEC-01 | Medio | P2 | Media | Bloco G - Tags | Tags deixam de depender de array fixo local | Reverter para catalogo local temporario |
| FUN-05 | Anexos | Area ainda sem prova de persistencia enterprise | `src/pages/Oportunidades.tsx`, matrizes de funcionalidade | SSOT funcional + evidencia atual | Anexos estao descritos como UI/local ou nao comprovados | Definir backend, storage e auditoria antes de expandir | Impacta upload, exclusao e visualizacao | Pode exigir endpoint de documentos e auditoria | Pode exigir tabela/objeto de documentos | Permissoes de upload/leitura | Tenant obrigatorio para storage e leitura | Integracao de upload, leitura e exclusao com UI | ARCH-03, SEC-01 | Alto | P2 | Alta | Bloco H - Anexos | Anexo uploadado aparece, persiste e e rastreavel | Reverter o fluxo de anexos para o estado atual |
| FUN-06 | Historico | Historia aparece como timeline local/hibrida e nao como event store consolidado | `src/pages/Oportunidades.tsx`, `backend/src/modules/crm/routes.ts`, docs de matriz | CRM timeline + audit/activity | Nao existe prova de event store dedicado para a workspace inteira | Reusar timeline/audit oficial onde existir e definir faltantes | Ajuste na fonte de dados do painel de historico | Pode exigir endpoint de timeline ou reuse de CRM | Pode exigir relacao em `Activity` ou audit log | RBAC de leitura de historico | Tenant deve ser preservado em leitura de timeline | Integracao da timeline, unitarios de formatacao, UI | ARCH-03, SEC-01 | Medio | P2 | Media | Bloco I - Historico | Historico vem de fonte comprovada e nao de lista literal | Reverter a leitura do historico atual |
| FUN-07 | Acoes rapidas | WhatsApp, telefone e e-mail estao como UI pura | `src/pages/Oportunidades.tsx` | UI pura, sem dependencia de backend | Sem persistencia ou evento de uso comprovado | Manter o comportamento visual, e opcionalmente registrar evento apos consolidacao | Baixo impacto | Baixo impacto | Nenhum direto | Nenhum ou minimo | Tenant apenas se houver auditoria posterior | UI e regressao de stopPropagation | UI-01 | Baixo | P3 | Baixa | Bloco B ou J | Acoes continuam abrindo o canal correto sem disparar modal | Reverter a regressao visual sem mexer na navegacao |
| ARCH-01 | Persistencia e Zustand | Estado persistido continua sendo parte real do fluxo | `src/store/index.ts`, docs de auditoria e matriz | SSOT funcional + implementacao atual | Estado local pode mascarar ausencia de backend pleno | Delimitar claramente o que e cache, o que e snapshot e o que e fonte oficial | Ajuste de hidratação e merge do estado | Pode exigir contrato de sincronizacao | Pode afetar tabelas por fluxo de persistencia | Possivel impacto indireto por campos sensiveis | Tenant deve ser preservado na hidratação | Testes de reidratação, merge e logout/login | UI-03, ARCH-03 | Medio | P2 | Media | Bloco K - Estado e sincronizacao | Reidratação nao corrompe etapa, id ou dados canônicos | Voltar ao comportamento atual do store |
| ARCH-02 | Camada de compatibilidade | A compatibilidade legada ainda existe e precisa ser tratada como tal | `src/api/client.ts`, `src/api/modules/opportunities.api.ts`, docs de compatibilidade | Backend oficial + compat layer | A camada compat nao pode ser confundida com SSOT definitivo | Manter compat enquanto houver dependencias e documentar limites | Mantem rotas e adapters consumidos pela UI | Pode manter alias enquanto houver migracao | Nao exige alteracao imediata se nao houver troca de contrato | RBAC deve permanecer consistente no contrato oficial | Tenant precisa ser garantido no adapter | Testes de compat e contrato | ARCH-03 | Medio | P2 | Media | Bloco L - Compatibilidade legada | Compat continua operando, mas documentada como transicional | Reverter a mudanca apenas no adapter/documentacao |
| ARCH-03 | Frontend, backend, endpoints e modelos Prisma | Existe backend oficial de oportunidade, CRM e modelos Prisma, mas a workspace usa uma composicao de contratos | `backend/src/core/http/fastify.ts`, `backend/src/modules/opportunities/routes.ts`, `backend/src/modules/crm/routes.ts`, `backend/prisma/schema.prisma` | Backend oficial + Prisma + contrato funcional da workspace | Parte do fluxo usa `opportunities`, parte usa CRM, parte usa compat | Consolidar mapa entre endpoints oficiais, adapters e uso da tela | Pode exigir ajuste de consumo no frontend | Pode exigir clarificacao de endpoints usados pela tela | `Pipeline`, `Stage`, `Opportunity`, `Activity`, `BankProposal`, `Commission` devem ficar alinhados com o uso real | RBAC oficial ja existe, mas precisa ser validado por fluxo | Tenant deve cobrir toda leitura e escrita | Integracao de contrato, rotas e permissao | SEC-01, UI-03 | Alto | P1 | Alta | Bloco M - Alinhamento de contrato | Fluxo da tela bate com endpoints oficiais e modelos Prisma sem ambiguidade | Reverter apenas o consumo que tiver sido consolidado |
| SEC-01 | RBAC e isolamento por tenant | RBAC e tenant existem no backend, mas precisam ser reafirmados em cada fluxo da workspace | `backend/src/modules/opportunities/routes.ts`, `backend/src/modules/crm/routes.ts`, docs de permissao | Backend oficial + RBAC enterprise | Um fluxo hibrido aumenta o risco de permissao ou tenant inconsistentes | Validar cada operacao da workspace com permissao e tenant corretos | Pode exigir mensagens de acesso negado e bloqueios visuais | Possiveis ajustes de guardas e rotas | Pode exigir revisao de campos por tenant no banco | RBAC diretamente afetado | Tenant diretamente afetado | Integracao com usuarios de perfis distintos e tenant distinto | ARCH-03, FUN-01, FUN-02 | Alto | P1 | Alta | Bloco N - Seguranca e isolamento | Nenhuma operacao cruza tenant e nenhuma acao roda sem permissao correta | Reverter qualquer ajuste de consumo sem tocar nos guards oficiais |
| TEST-01 | Cobertura unitaria | Ha cobertura boa para helpers, mas ainda nao para a regressao funcional completa | `src/test/workspaceOpportunity.test.ts`, `src/test/oportunidades-kanban-hardening.test.ts` | Helper oficial + contrato canonico | O teste atual protege o normalizador, mas nao a experiencia real de abertura do card | Ampliar unitarios para cobrir derivacao, merge, compat e fallback | Aumento de confianca no contrato de leitura | Nenhum direto | Nenhum direto | Nenhum direto | Nenhum direto | Normalizador, merge, persistencia e contratos de origem | ARCH-01, ARCH-02 | Medio | P2 | Media | Bloco O - Cobertura de helpers | Helpers ficam protegidos contra regressao de contrato | Remover os testes novos mantendo os existentes |
| TEST-02 | Testes de integracao e interacao real da UI | Ainda falta cobertura real de clique e comportamento do modal | `src/test/oportunidades-kanban-hardening.test.ts` e ausencia de teste de UI real observado na auditoria | SSOT funcional da workspace + fluxo do card | Sem teste real, a regressao pode reaparecer em runtime | Criar teste de interacao cobrindo abertura do card e eventos internos | Validacao de DOM, eventos e modal | Nenhum direto | Nenhum direto | Nenhum direto | Nenhum direto | Clique no corpo do card, modal fullscreen, stopPropagation, telefone, WhatsApp, e-mail, menus, cards em diferentes etapas, dados incompletos, card de API, card do Zustand, card do adaptador de compatibilidade | UI-01, UI-03 | Alto | P1 | Alta | Bloco B - Regressao funcional do card | O card abre corretamente em todas as origens validas sem abrir indevidamente por interacoes internas | Reverter o teste novo e manter o fluxo anterior |

## Proposta de blocos de implementacao

### Bloco A - Consolidacao documental

Objetivo: alinhar SSOT, nomenclatura e classificacao documental.

Escopo:

- DOC-01
- DOC-02
- DOC-03

### Bloco B - Regressao funcional do card

Objetivo: blindar a abertura do card e o modal fullscreen com testes reais.

Escopo:

- UI-01
- UI-03
- TEST-02

**Registro de fechamento do Bloco B**

- **Status:** CONCLUÍDO
- **Branch:** promotion/hml-g18-full
- **Commit:** 3710a21b1d36bb916e5cf86b56945df4739cb9b6
- **Validação:** 146 testes aprovados (suite completa), build aprovado, `arch:check` aprovado, `git diff --check` sem erros
- **Risco residual:** seletores de modal dependentes de classe CSS; cobertura adicional necessária para menus/exclusão


### Bloco C - Canonizacao visual da workspace

Objetivo: padronizar o cabecalho e separar identidade operacional de label de exibição.

Escopo:

- UI-02
- TEST-01

### Bloco D - Consolidacao de tarefas e anotacoes

Objetivo: sair do estado local ou implicito para contrato oficial.

Escopo:

- FUN-01
- SEC-01 quando houver escrita

### Bloco E - Consolidacao do simulador

Objetivo: ligar memoria de calculo, resultado e aplicacao ao contrato correto.

Escopo:

- FUN-02
- ARCH-03

### Bloco F - Proposta/PDF

Objetivo: definir pipeline oficial de geracao, armazenamento e auditoria.

Escopo:

- FUN-03
- ARCH-03

### Bloco G - Tags

Objetivo: sair de catalogo local fixo para origem oficial ou compat claramente documentada.

Escopo:

- FUN-04
- ARCH-02

### Bloco H - Anexos

Objetivo: definir storage e auditabilidade.

Escopo:

- FUN-05
- SEC-01

### Bloco I - Historico

Objetivo: usar timeline/audit oficial ou explicitar o fallback.

Escopo:

- FUN-06
- ARCH-03

### Bloco J - Acoes rapidas

Objetivo: manter UX e registrar evento apenas se houver contrato para isso.

Escopo:

- FUN-07

### Bloco K - Estado e sincronizacao

Objetivo: explicitar o papel do Zustand e impedir divergencia silenciosa.

Escopo:

- ARCH-01

### Bloco L - Compatibilidade legada

Objetivo: manter o que for necessario sem confundir compat com SSOT.

Escopo:

- ARCH-02

### Bloco M - Alinhamento de contrato

Objetivo: harmonizar frontend, backend, endpoints e Prisma.

Escopo:

- ARCH-03

### Bloco N - Seguranca e isolamento

Objetivo: validar RBAC e tenant em todos os fluxos da workspace.

Escopo:

- SEC-01

### Bloco O - Cobertura de helpers

Objetivo: proteger o contrato canônico com unitarios.

Escopo:

- TEST-01

## Ordem recomendada de execucao

1. Bloco A - Consolidacao documental
2. Bloco B - Regressao funcional do card
3. Bloco N - Seguranca e isolamento
4. Bloco K - Estado e sincronizacao
5. Bloco C - Canonizacao visual da workspace
6. Bloco O - Cobertura de helpers
7. Bloco M - Alinhamento de contrato
8. Bloco D - Consolidacao de tarefas e anotacoes
9. Bloco E - Consolidacao do simulador
10. Bloco F - Proposta/PDF
11. Bloco G - Tags
12. Bloco H - Anexos
13. Bloco I - Historico
14. Bloco J - Acoes rapidas
15. Bloco L - Compatibilidade legada

## Riscos de regressao

- Quebrar o fluxo principal de abertura do card ao mexer em selecao, normalizacao ou modal.
- Introduzir divergencia entre card da pipeline, modal fullscreen e store persistido.
- Perder compatibilidade com origem antiga da oportunidade ao consolidar contratos.
- Expor label ou identificador operacional incorreto no cabecalho.
- Criar regressao de RBAC ou tenant ao mover leitura/escrita para contrato oficial.
- Aumentar a superficie de erro se simulador, tags, anexos ou historico forem conectados sem contrato fechado.

## Dependencias entre blocos

- Bloco B depende da estabilidade atual do card e do normalizador.
- Bloco N deve acompanhar qualquer bloco que introduza escrita oficial.
- Bloco K depende de definicao clara entre snapshot local e fonte oficial.
- Bloco M depende de consenso sobre rotas oficiais, compat e modelos Prisma.
- Blocos D, E, F, G, H e I dependem de Bloco M e do alinhamento de seguranca.

## Documentacao que precisa ser consolidada

Manter como canonicos:

- `docs/00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md`
- `docs/audits/workspace-oportunidade/contracts-source-of-truth/MATRIZ_FONTE_VERDADE_WORKSPACE.md`
- `docs/audits/workspace-oportunidade/phase-a/CONTRATO_CANONICO_WORKSPACE.md`
- `docs/audits/workspace-oportunidade/contracts-source-of-truth/RASTREAMENTO_PONTA_A_PONTA_WORKSPACE.md`

Atualizar:

- `docs/audits/workspace-oportunidade/AUDITORIA_WORKSPACE_OPORTUNIDADE.md`
- `docs/audits/workspace-oportunidade/contracts-source-of-truth/AUDITORIA_CONTRATOS_FONTE_VERDADE.md`
- `docs/audits/workspace-oportunidade/PLANO_EXECUCAO_WORKSPACE_OPORTUNIDADE.md`
- `docs/audits/workspace-oportunidade/MATRIZ_FUNCIONAL_WORKSPACE_OPORTUNIDADE.md`

Marcar como historicos ou transicionais:

- documentos de evidencia de fases anteriores que dependem de premissas ja superadas
- arquivos que repetem a mesma analise sem acrescentar nova evidencia

Afirmações comprovadamente desatualizadas:

- que nao existe backend oficial de oportunidade
- que `/api/oportunidades` e o unico eixo de verdade da workspace
- que a causa raiz atual seja ausencia de `normalizeOpportunityWorkspace` no runtime
- que tags, anexos, historico e simulador estao conclusos como backend enterprise unico

Nomenclaturas a padronizar:

- `opportunities` como nome do modulo/endpoint oficial em contraste com alias legados
- `oportunidades` apenas como nome da experiencia de negocio e da UI
- `stageId` como identificador operacional
- `stageLabel` como label de apresentacao
- `id` como identidade canonica
- `displayId` como identidade visual segura

## Recomendacao objetiva do primeiro bloco

Implementar primeiro o **Bloco B - Regressao funcional do card**.

Motivo:

- protege o fluxo principal da workspace;
- evita que a regressao de abertura volte a ocorrer;
- valida o contrato canonico da abertura com testes reais;
- reduz o risco de qualquer consolidacao posterior nos demais blocos.
