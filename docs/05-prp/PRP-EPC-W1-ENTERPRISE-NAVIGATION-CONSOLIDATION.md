# PRP-EPC-W1 - Enterprise Navigation Consolidation

## 1. Objetivo da Sprint

Consolidar a navegação enterprise do FINQZ PRO no frontend estrutural, removendo redundancias visuais e organizacionais sem alterar backend, APIs, contratos, RBAC, banco, Prisma, serviços, integrações, regras de negocio ou testes.

Base obrigatoria:

- [DCA-FINQZ-PRO-ENTERPRISE-v2.md](/C:/Projects/FINQZ_PRO/docs/00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md)
- [AUD-CRM-ENTERPRISE-GOLIVE-READINESS.md](/C:/Projects/FINQZ_PRO/docs/04-crm/AUD-CRM-ENTERPRISE-GOLIVE-READINESS.md)
- [AUD-DOCS-NAVIGATION-CAPABILITY-READINESS.md](/C:/Projects/FINQZ_PRO/docs/04-crm/AUD-DOCS-NAVIGATION-CAPABILITY-READINESS.md)
- [AUD-CRM-NAVIGATION-BLUEPRINT-GOLIVE.md](/C:/Projects/FINQZ_PRO/docs/04-crm/AUD-CRM-NAVIGATION-BLUEPRINT-GOLIVE.md)

## 2. Justificativa Arquitetural

O DCA Mestre continua sendo a unica fonte oficial de arquitetura. As auditorias mostram que o problema atual nao e de runtime de negocio no core, mas de experiencia de navegacao:

- menu com aliases legados;
- agrupamento funcional desalinhado com capability ownership;
- superfícies FUTURE e LEGACY expostas como se fossem blocos maduros;
- duplicidade de rotas de conveniencia;
- breadcrumbs e labels que ainda refletem transicao.

O PRP-W1 existe para aproximar a UX estrutural do mapa oficial sem introduzir arquitetura paralela.

## 3. Impacto Esperado

- Menos confusao entre CRM, Operacoes, HUB e Administracao.
- Navegacao mais previsivel e alinhada ao DCA.
- Reducao de ruido visual causado por aliases e rotas redundantes.
- Melhor leitura de ownership por capability.
- Menor risco de interpretar legado como capacidade canonica.

## 4. Escopo

Mudancas permitidas nesta sprint:

- Frontend estrutural.
- Navegacao.
- Organizacao visual.
- Experiencia do usuario.
- Titulo, labels, ordem, agrupamento, breadcrumbs e hierarquia do menu.

## 5. Fora do Escopo

Nao alterar:

- Backend.
- APIs.
- Contratos.
- RBAC.
- Banco.
- Prisma.
- Servicos.
- Integracoes.
- Regras de negocio.
- Testes.

## 6. Lista Detalhada das Mudancas

### 6.1 Menus duplicados

| Alteracao | Classificacao | Motivo |
|---|---|---|
| Remover a exposicao simultanea de rotas equivalentes como `/app/clientes` e `/app/crm/clientes` | LEGACY REMOVAL | Alias nao agrega capacidade nova e duplica a jornada |
| Remover a duplicidade entre `/app/oportunidades`, `/app/crm/oportunidades` e `/app/crm/pipeline` | REORGANIZAÇÃO | Mesma capacidade, labels diferentes |
| Remover aliases de Operacoes como `/app/parceiros`, `/app/estrutura-comercial`, `/app/roteiros-operacionais`, `/app/financeiro`, `/app/conta-corrente`, `/app/relatorios` quando a rota canonica equivalente existir | LEGACY REMOVAL | Rotas historicas mantidas por compatibilidade |
| Remover aliases de Administração como `/app/auditoria`, `/app/usuarios`, `/app/configuracoes` | LEGACY REMOVAL | Exposicao duplicada da mesma area |
| Remover aliases do HUB como `/app/campanhas`, `/app/conversas`, `/app/hub/conversas`, `/app/hub/automacao` | LEGACY REMOVAL | Superficie duplicada ou transitoria |

### 6.2 Aliases

| Alteracao | Classificacao | Motivo |
|---|---|---|
| Manter apenas redirecionamentos invisiveis, sem itens duplicados na sidebar | UX | Preserva compatibilidade sem poluir navegacao |
| Consolidar breadcrumbs para refletirem a rota canonica final | UX | Evita que a UI herde nomes antigos |
| Unificar rotulos de pipeline e oportunidade no contexto do CRM | REORGANIZAÇÃO | Mesma area, leitura mais clara |

### 6.3 Itens fora do capability correto

| Alteracao | Classificacao | Motivo |
|---|---|---|
| Trazer Aquisição de Parceiros para o bloco CRM | REORGANIZAÇÃO | AUD-CRM-NAVIGATION-BLUEPRINT-GOLIVE aponta CRM como casa natural |
| Manter Coverage Comercial e Tabelas Comerciais em Operacoes | READY | Alinhamento com ARCH-059 e ARCH-061 |
| Separar SDR IA do restante do HUB transicional | REORGANIZAÇÃO | Evita leitura de runtime paralelo como capacidade principal |
| Manter Usuarios, Roles, Permissions, Audit e Tenant em Administracao | READY | Ownership ja esta consolidado |

### 6.4 Ordem ideal dos modulos

Ordem oficial recomendada:

1. Dashboard
2. CRM
3. Operacoes
4. FINQZ HUB
5. Administracao

### 6.5 Agrupamentos

Agrupar:

- CRM: Clientes, Pipeline, Parceiros, Aquisição de Parceiros, Simulador.
- Operacoes: Coverage Comercial, Tabelas Comerciais, Financeiro, Conta Corrente, Relatorios, Roteiros Operacionais.
- FINQZ HUB: WhatsApp, Campanhas, SDR IA, Disparos, Higienizacao, E-mail Marketing.
- Administracao: Usuarios, Permissoes/Funcoes, Tenant/Organizations/Memberships, Auditoria, Eventos, Geral, Integracoes, Provider Operations, Automacoes, Notificacoes, Seguranca, Bancos & Providers.

### 6.6 Breadcrumbs

Padronizar breadcrumbs para:

- refletirem a rota canonica;
- evitarem labels legadas;
- distinguirem `Pipeline` de `Oportunidades` quando a pagina for a mesma area funcional;
- manterem `Aquisição de Parceiros` no contexto CRM e nao em Operacoes.

### 6.7 Sidebar

Aplicar:

- reduzir itens legados;
- deixar blocos por dominio mais coesos;
- esconder ou rebaixar itens FUTURE;
- manter apenas o minimo necessario para compatibilidade.

### 6.8 MainLayout

Aplicar:

- reordenacao dos grupos;
- limpeza de labels e titulos;
- remocao de entradas duplicadas;
- simplificacao de rotas canonicas exibidas;
- padronizacao de icones por dominio.

### 6.9 Icones

Alinhar os icones para refletir o dominio:

- CRM: Users / Target / TrendingUp / Handshake / Calculator.
- Operacoes: Layers / Table2 / Wallet / PiggyBank / BarChart3.
- HUB: Phone / Send / Rocket / Bot / Database / Mail.
- Administracao: UserCog / Lock / Shield / Activity / Key / Settings.

### 6.10 Nomenclaturas

Padronizar:

- `Pipeline` como workspace de oportunidade.
- `Parceiros` como identidade comercial oficial.
- `Aquisição de Parceiros` como esteira de prospeccao e onboarding.
- `Permissões/Funções` como bloco RBAC.
- `Tenant / Organizations / Memberships` como bloco de governanca de acesso.

### 6.11 Rotas redundantes

| Rota atual | Menu final | Justificativa |
|---|---|---|
| `/app/clientes` | remover da exposicao | Alias legado de CRM |
| `/app/oportunidades` | consolidar em Pipeline | Mesma capacidade, leitura unica |
| `/app/parceiros` | remover da exposicao | Alias legado de Operacoes |
| `/app/estrutura-comercial` | remover da exposicao | Alias legado de coverage |
| `/app/roteiros-operacionais` | remover da exposicao | Alias legado |
| `/app/financeiro` | remover da exposicao | Alias legado |
| `/app/conta-corrente` | remover da exposicao | Alias legado |
| `/app/relatorios` | remover da exposicao | Alias legado |
| `/app/auditoria` | remover da exposicao | Alias legado |
| `/app/usuarios` | remover da exposicao | Alias legado |
| `/app/campanhas` | remover da exposicao | Alias legado |
| `/app/conversas` | remover da exposicao | Alias legado |
| `/app/hub/conversas` | remover da exposicao | Alias legado |
| `/app/hub/automacao` | remover da exposicao | Alias legado |

### 6.12 Itens LEGACY

Classificacao LEGACY:

- `src/api/client.ts`
- `src/data/catalogRepository.ts`
- `src/data/commercialRepository.ts`
- `src/pages/SdrIaHub.tsx`
- aliases antigos no `MainLayout`
- rotas de compatibilidade listadas acima

### 6.13 Itens REMOVE

Classificacao REMOVE:

- itens de menu duplicados que nao sao mais necessarios para navegacao humana;
- aliases que possam permanecer apenas como redirect tecnico invisivel;
- qualquer label de menu que repita a mesma capacidade sem oferecer contexto diferente.

### 6.14 Itens FUTURE

Classificacao FUTURE:

- Disparos.
- Higienizacao.
- E-mail Marketing.
- expansoes adicionais do HUB que ainda nao sao canal canonico concluido.

## 7. Arquivos Envolvidos

Arquivos com mudanca esperada:

- [src/layouts/MainLayout.tsx](/C:/Projects/FINQZ_PRO/src/layouts/MainLayout.tsx)
- [src/routes/crm.routes.tsx](/C:/Projects/FINQZ_PRO/src/routes/crm.routes.tsx)
- [src/routes/operacoes.routes.tsx](/C:/Projects/FINQZ_PRO/src/routes/operacoes.routes.tsx)
- [src/routes/admin.routes.tsx](/C:/Projects/FINQZ_PRO/src/routes/admin.routes.tsx)
- [src/routes/hub.routes.tsx](/C:/Projects/FINQZ_PRO/src/routes/hub.routes.tsx)
- [src/components/layout/PageHeader.tsx](/C:/Projects/FINQZ_PRO/src/components/layout/PageHeader.tsx)

Arquivos de referencia, sem alteracao nesta sprint:

- [src/api/client.ts](/C:/Projects/FINQZ_PRO/src/api/client.ts)
- [src/data/catalogRepository.ts](/C:/Projects/FINQZ_PRO/src/data/catalogRepository.ts)
- [src/data/commercialRepository.ts](/C:/Projects/FINQZ_PRO/src/data/commercialRepository.ts)
- [src/pages/Simulador.tsx](/C:/Projects/FINQZ_PRO/src/pages/Simulador.tsx)
- [src/pages/SdrIaHub.tsx](/C:/Projects/FINQZ_PRO/src/pages/SdrIaHub.tsx)

## 8. Critérios de Aceite

- Menu principal segue a ordem oficial: Dashboard, CRM, Operacoes, FINQZ HUB, Administracao.
- Nao ha rotas legadas expostas como itens primarios de menu.
- `Aquisição de Parceiros` aparece no CRM.
- `Parceiros` fica consolidado no contexto CRM / identidade comercial.
- `Coverage Comercial` e `Tabelas Comerciais` permanecem em Operacoes.
- `Usuarios`, `Permissoes/Funcoes`, `Tenant`, `Auditoria` e correlatos permanecem em Administracao.
- `SDR IA` nao aparece como capacidade principal de runtime legado.
- Breadcrumbs, titulos e icons refletem o mapa oficial.

## 9. Plano de Rollback

Rollback seguro:

1. Reverter apenas o `MainLayout` e as rotas frontend alteradas nesta sprint.
2. Restaurar aliases removidos caso exista regressao de navegacao.
3. Manter intactos backend, APIs, RBAC, banco e contratos.
4. Reaplicar a ordem antiga temporariamente se o filtro de permissao quebrar visibilidade.

## 10. Checklist de Validacao

- Sidebar abre e fecha normalmente.
- Menu exibido respeita a ordem oficial.
- Rotas canonicas continuam acessiveis.
- Rotas legadas continuam redirecionando quando necessario.
- Nenhuma pagina perdeu acesso por erro de label ou icone.
- O workspace de CRM continua acessivel em desktop e mobile.
- `Aquisição de Parceiros` aparece no lugar correto.
- Itens FUTURE nao competem com itens READY.

## 11. Riscos

| Risco | Tipo | Mitigacao |
|---|---|---|
| Remocao de alias quebra bookmark de usuario | UX | Manter redirect invisivel por um ciclo |
| Reordenacao do menu altera habito operacional | UX | Liberar em uma sprint de consolidacao controlada |
| Separacao visual do HUB evidencia que parte do runtime ainda e legado | LEGACY | Marcar claramente como transitorio |
| Tabelas/Financeiro parecerem menos proeminentes | UX | Manter status e nomenclatura consistentes |

## 12. Dependencias

Dependencias documentais:

- DCA Mestre.
- AUD-CRM-ENTERPRISE-GOLIVE-READINESS.
- AUD-DOCS-NAVIGATION-CAPABILITY-READINESS.
- AUD-CRM-NAVIGATION-BLUEPRINT-GOLIVE.

Dependencias tecnicas:

- Nenhuma dependencia nova de backend.
- Nenhuma dependencia nova de API.
- Nenhuma dependencia nova de RBAC.

## 13. Estimativa de Implementacao

Estimativa para a sprint EPC-W1:

- 1 a 2 dias para reorganizacao visual do menu e breadcrumbs.
- 1 dia para limpeza de aliases visuais e labels.
- 1 dia para ajuste fino de icones e agrupamentos.
- 0.5 dia para validacao manual e correcao de regressoes de navegacao.

Total estimado: 3.5 a 4.5 dias uteis.

## 14. Ordem Recomendada de Execucao

1. Consolidar a arvore de dominios no `MainLayout`.
2. Ajustar labels e titulos canonicos.
3. Reordenar os grupos da sidebar.
4. Remover itens duplicados da exposicao primaria.
5. Padronizar breadcrumbs e current page config.
6. Validar itens FUTURE e LEGACY para nao competirem com READY.
7. Revisar mobile / desktop responsividade da navegacao.

## 15. Plano de Testes

Sem alterar testes, o plano de validacao deve ser manual e estrutural:

- abrir cada grupo da sidebar;
- acessar cada rota canonica;
- verificar redirects de rotas legadas;
- verificar breadcrumbs;
- verificar permissaes de visibilidade;
- verificar ordem dos blocos em desktop e mobile;
- verificar que o menu nao expõe superficies FUTURE como se fossem READY.

## 16. Validação Final

### Tabela Menu Atual -> Menu Final

| Menu Atual | Menu Final | Justificativa |
|---|---|---|
| Dashboard | Dashboard | Mantido sem alteracao |
| CRM > Clientes | CRM > Clientes | Mantido como READY |
| CRM > Pipeline | CRM > Pipeline | Mantido como workspace principal de oportunidade |
| CRM > Simulador | CRM > Simulador | Mantido, mas com leitura PARTIAL |
| Operacoes > Parceiros | CRM > Parceiros | Ajuste de ownership e clareza |
| Operacoes > Coverage Comercial | Operacoes > Coverage Comercial | Mantido como capability oficial |
| Operacoes > Tabelas Comerciais | Operacoes > Tabelas Comerciais | Mantido como capability oficial |
| Operacoes > Roteiros Operacionais | remover da exposicao primaria | LEGACY removal |
| Operacoes > Financeiro | Operacoes > Financeiro | Mantido, mas com nomenclatura canonica |
| Operacoes > Conta Corrente | Operacoes > Conta Corrente | Mantido, mas com leitura de transicao |
| Operacoes > Relatorios | Operacoes > Relatorios | Mantido, mas sem redundancia |
| FINQZ HUB > WhatsApp | FINQZ HUB > WhatsApp | Mantido |
| FINQZ HUB > Campanhas | FINQZ HUB > Campanhas | Mantido, com status PARTIAL/FUTURE |
| FINQZ HUB > SDR IA | FINQZ HUB > SDR IA | Mantido, mas sinalizado como LEGACY/FUTURE |
| FINQZ HUB > Disparos | FINQZ HUB > Disparos | FUTURE |
| FINQZ HUB > Higienizacao | FINQZ HUB > Higienizacao | FUTURE |
| FINQZ HUB > E-mail Marketing | FINQZ HUB > E-mail Marketing | FUTURE |
| Administracao > Usuarios | Administracao > Usuarios | Mantido |
| Administracao > Permissoes/Funcoes | Administracao > Permissoes/Funcoes | Mantido |
| Administracao > Auditoria | Administracao > Auditoria | Mantido |
| Administracao > Eventos | Administracao > Eventos | Mantido |
| Administracao > Geral | Administracao > Geral | Mantido |
| Administracao > Integracoes | Administracao > Integracoes | Mantido |
| Administracao > Provider Operations | Administracao > Provider Operations | Mantido |
| Administracao > Automacoes | Administracao > Automacoes | Mantido |
| Administracao > Notificacoes | Administracao > Notificacoes | Mantido |
| Administracao > Seguranca | Administracao > Seguranca | Mantido |
| Administracao > Bancos & Providers | Administracao > Bancos & Providers | Mantido |

### Tabela Capability -> Menus -> Rotas -> Frontend -> Backend -> RBAC -> Status

| Capability | Menus | Rotas | Frontend | Backend | RBAC | Status |
|---|---|---|---|---|---|---|
| Customer Management | CRM > Clientes | `/app/crm/clientes` | `src/pages/Clientes.tsx` | `backend/src/modules/crm/routes.ts` | `customer:read` | READY |
| Opportunity / Pipeline | CRM > Pipeline | `/app/crm/pipeline`, `/app/crm/oportunidades` | `src/pages/Oportunidades.tsx` | `backend/src/modules/opportunities/routes.ts` | `opportunity:read`, `sales:view` | READY |
| Partner Identity | CRM > Parceiros | `/app/operacoes/parceiros` e alias | `src/pages/Parceiros.tsx` | `backend/src/modules/partners/presentation/http/partner.routes.ts` | `partner:read` | PARTIAL |
| Partner Acquisition | CRM > Aquisição de Parceiros | `/app/operacoes/partner-acquisition/*` | `src/pages/PartnerAcquisitionLeads.tsx`, `src/pages/PartnerAcquisitionLeadDetails.tsx`, `src/pages/PartnerAcquisitionProspects.tsx`, `src/pages/PartnerAcquisitionProspectDetails.tsx` | `backend/src/modules/partner-acquisition/http/partner-acquisition.routes.ts` | `partner_acquisition:*`, `partner_prospect:*` | READY |
| Commercial Coverage | Operacoes > Coverage Comercial | `/app/operacoes/commercial-coverage`, `/app/operacoes/estrutura-comercial` | `src/pages/CommercialCoverage.tsx` | `backend/src/modules/commercial/routes.ts` e governanca relacionada | `sales:view` | READY |
| Commercial Tables | Operacoes > Tabelas Comerciais | `/app/operacoes/tabelas-comerciais` | `src/pages/TabelasComerciais.tsx` | `backend/src/modules/commercial/routes.ts` | `sales:view` | PARTIAL |
| Simulator | CRM > Simulador | `/app/crm/simulador` | `src/pages/Simulador.tsx` | sem backend canonico consolidado no recorte | `simulador:view` | PARTIAL |
| Financeiro | Operacoes > Financeiro | `/app/operacoes/financeiro` | `src/pages/Financeiro.tsx` | modulo financeiro existente, bootstrap oficial a confirmar | `finance:view` | PARTIAL |
| Conta Corrente | Operacoes > Conta Corrente | `/app/operacoes/conta-corrente` | `src/pages/ContaCorrente.tsx` | superficie operacional parcial | `finance:view` | PARTIAL |
| Relatorios | Operacoes > Relatorios | `/app/operacoes/relatorios` | `src/pages/Relatorios.tsx` | superficie operacional parcial | `report:view` | PARTIAL |
| WhatsApp / Conversas | FINQZ HUB > WhatsApp | `/app/hub/whatsapp` | `src/pages/Conversas.tsx` | superficie de transicao | `conversas:view` | PARTIAL |
| Campanhas | FINQZ HUB > Campanhas | `/app/hub/campanhas` | `src/pages/Campanhas.tsx` | superficie de transicao | `campanhas:view` | PARTIAL |
| SDR IA | FINQZ HUB > SDR IA | `/api/sdr/*` legado e `SdrIaHub` | `src/pages/SdrIaHub.tsx` | `backend/src/index.ts` legado | `sdr_ia:view` | LEGACY |
| Users | Administracao > Usuarios | `/app/admin/usuarios` | `src/pages/Usuarios.tsx` | `backend/src/modules/users/routes.ts` | `system_users:manage` | READY |
| Roles / Permissions | Administracao > Permissoes/Funcoes | `/app/admin/permissoes` | `src/pages/admin/Permissoes.tsx` | `backend/src/modules/roles/roles.fastify.routes.ts`, `backend/src/modules/permissions/permissions.fastify.routes.ts` | `system_roles:manage` | READY |
| Audit | Administracao > Auditoria | `/app/admin/auditoria` | `src/pages/Auditoria.tsx` | `backend/src/modules/audit/routes.ts` | `audit:view` | READY |
| Tenant / Membership | Administracao > Tenant / Organizations / Memberships | rotas administrativas correspondentes | admin views | `backend/src/modules/organization/*`, `backend/src/modules/memberships/*` | tenant scoped | READY |
| Core Platform | Nao-menu / infra | `/health`, `/ready`, `/metrics` | nenhum | `backend/src/core/http/fastify.ts` | infra | READY |

### Classificacao final dos modulos

| Modulo | Status |
|---|---|
| Dashboard | READY |
| CRM Clientes | READY |
| Pipeline | READY |
| Parceiros | PARTIAL |
| Aquisição de Parceiros | READY |
| Simulador | PARTIAL |
| Coverage Comercial | READY |
| Tabelas Comerciais | PARTIAL |
| Financeiro | PARTIAL |
| Conta Corrente | PARTIAL |
| Relatorios | PARTIAL |
| FINQZ HUB | PARTIAL |
| SDR IA | LEGACY |
| Administracao RBAC/Tenant | READY |
| Integracoes | PARTIAL |
| Automações | PARTIAL |
| Notificacoes | PARTIAL |
| Segurança | PARTIAL |
| Bancos & Providers | PARTIAL |

## Veredito para inicio da implementacao

**GO WITH RESTRICTIONS**

Motivo:

- a consolidacao eviabiliza-se sem tocar em backend, contratos ou regras de negocio;
- ha trabalho real de frontend estrutural a fazer;
- existem itens LEGACY/FUTURE que precisam ser rebaixados ou removidos da exposicao primaria;
- o menu final pode entrar em producao com redirecionamentos de compatibilidade.
