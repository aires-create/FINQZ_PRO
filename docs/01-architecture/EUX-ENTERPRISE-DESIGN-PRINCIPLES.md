# EUX-ENTERPRISE-DESIGN-PRINCIPLES

Status: Proposed
Date: 2026-07-07
Owner: Architecture
Type: Architectural Contract
Project: FINQZ PRO

---

## 1. Objetivo

Definir os principios oficiais de experiencia enterprise do FINQZ PRO para orientar UX, produtividade, clareza, reducao de cliques, eficiencia operacional e desenho de workspaces.

Este documento estabelece autoridade de referencia para:

- telas enterprise;
- workspaces operacionais;
- formularios;
- acoes rapidas;
- simulacao contextual;
- timeline operacional;
- padronizacao visual;
- tomada de decisao assistida.

O objetivo nao e apenas “deixar bonito”. O objetivo e tornar o sistema mais rapido, mais legivel e mais previsivel para o usuario que opera o negocio.

---

## 2. Contexto

O FINQZ PRO possui capacidade comercial real, mas a experiencia operacional ainda carrega sinais de sobrecarga visual, excesso de superficies e tab sprawl em areas criticas.

A auditoria de produtividade do CRM mostrou que:

- o Opportunity Workspace concentra informacao demais;
- o simulador dentro da oportunidade pode virar experiencia concorrente se crescer demais;
- tarefas, anotacoes, tags, anexos e historico precisam de hierarquia melhor;
- a informacao util precisa aparecer por contexto e etapa, nao por acumulacao indiscriminada;
- o vendedor precisa executar com menos cliques e menos trocas de tela.

Este documento formaliza a direcao enterprise para impedir que o produto se torne um conjunto de paginas isoladas sem centro operacional.

---

## 3. Problema Atual

O problema atual nao e ausencia de funcionalidade. O problema e excesso de superficie para uma mesma decisao.

Sintomas observados:

- muitas abas para tarefas que deveriam estar inline;
- informacao repetida em header, sidebar, cards e detalhes;
- simulador grande demais para um fluxo de decisao curto;
- formulario de edicao com baixa densidade de valor;
- historico, notas e tarefas sem uma unificacao operacional clara;
- acoes rapidas presentes, mas nao dominando o fluxo;
- SLA visivel, mas nem sempre acionavel;
- o usuario precisa pensar demais antes de agir.

Leitura central:

- o sistema mostra muita coisa;
- o usuario precisa descobrir o que importa;
- isso reduz produtividade e aumenta friccao.

---

## 4. Princípios Enterprise UX

### 4.1 Workspace acima de pagina

O FINQZ PRO deve priorizar workspaces, nao paginas isoladas.

### 4.2 Opportunity como centro

A Opportunity deve ser o centro do fluxo comercial.

### 4.3 Acao antes de decoracao

Toda tela enterprise deve privilegiar execucao sobre exibicao.

### 4.4 Menos decisao desnecessaria

O sistema deve reduzir decisoes desnecessarias do usuario.

### 4.5 Contexto por etapa

Informacoes devem aparecer conforme contexto e etapa.

### 4.6 Automacao antes de preenchimento manual

O sistema deve inferir, completar e sugerir sempre que a informacao ja puder ser derivada.

### 4.7 Hierarquia rigorosa

Nem toda informacao merece o mesmo peso visual. O que e critico precisa aparecer primeiro.

### 4.8 Progressividade

O usuario deve ver o suficiente para agir agora, e o restante apenas quando precisar.

### 4.9 Baixa friccao

Cada acao critica deve demandar o menor numero possivel de passos.

### 4.10 Consistencia operacional

O mesmo tipo de dado deve sempre aparecer no mesmo nivel de importancia e no mesmo padrao visual.

---

## 5. Regras de Design para Telas

1. Cada tela deve ter uma acao primaria claramente dominante.
2. Cada tela deve responder rapidamente: onde estou, o que importa e o que faco agora.
3. Informacao secundaria nao pode competir com a acao principal.
4. Redundancia visual deve ser evitada.
5. O uso de tabs deve ser restrito a contextos de real separacao funcional.
6. O layout deve suportar leitura escaneavel em ambiente de alta rotatividade.
7. Elementos de apoio nao devem virar protagonistas visuais.
8. O usuario nao deve precisar abrir varias areas para concluir uma sequencia comercial simples.

---

## 6. Regras de Design para Workspaces

1. Workspace e o centro de operacao, nao a soma de widgets.
2. Workspace deve ter identidade funcional clara por dominio.
3. Workspace deve concentrar contexto, acao e rastreabilidade.
4. Workspace deve reduzir troca de contexto.
5. Workspace deve manter elementos fixos no topo quando eles definem a operacao.
6. Workspace deve expor acao rapida sem exigir busca em menus ou abas.
7. Workspace deve separar o que e fixo, o que e automatico e o que e expansivel.
8. Workspace deve ser desenhado para fluxo real do usuario, nao para inventario completo de dados.

---

## 7. Regras de Redução de Cliques

1. Acoes criticas devem exigir o menor numero de passos possivel.
2. Acoes repetidas devem ter acesso direto.
3. Acoes de alta frequencia devem estar acima da dobra.
4. Acoes que dependem de contexto devem herdar contexto automaticamente.
5. Acoes sequenciais devem ser encadeadas no mesmo workspace.
6. Confirmacoes devem existir apenas quando o risco justificar.
7. O sistema nao deve exigir que o usuario reabra a mesma informacao em pontos distintos do fluxo.
8. Se uma acao pode ser derivada de outra, o sistema deve propor a derivacao em vez de pedir reentrada manual.

---

## 8. Regras de Automação Contextual

1. O sistema deve completar automaticamente o que puder ser inferido com seguranca.
2. SLA deve ser calculado a partir da ultima interacao e do estado da oportunidade.
3. Status e etapa devem manter relacao canonica e previsivel.
4. O proximo passo deve ser sugerido com base no contexto da oportunidade.
5. Defaults devem refletir o estado real do fluxo, nao preferencias genericas.
6. Informacoes do cliente devem ser puxadas do CRM Cliente sempre que possivel.
7. O usuario deve validar o que e sensivel, nao repetir o que o sistema ja sabe.

---

## 9. Regras de Hierarquia Visual

1. O topo deve conter identidade, status, valor, etapa e proxima acao.
2. O que e decisivo deve ser fixo ou imediatamente visivel.
3. O que e auxiliar deve viver em segundo plano.
4. O que e raro deve ficar oculto ate ser solicitado.
5. O que e repetitivo deve ser consolidado em um unico lugar.
6. O layout deve deixar claro o que e leitura, o que e acao e o que e auditoria.
7. Nao deve haver mais de um centro visual competindo pela mesma decisao.

---

## 10. Regras de Formulário Enterprise

1. Formularios devem ser progressivos, curtos e orientados a acao.
2. Formularios devem pedir apenas o que precisa ser editado naquele momento.
3. Campos de contexto permanente nao devem ser reeditados toda vez.
4. Campos derivados nao devem ser manualmente capturados se puderem ser calculados.
5. Campos avancados devem ficar sob expansao.
6. Formularios devem respeitar a diferenca entre dado de identidade, dado operacional e dado circunstancial.
7. Formularios devem reduzir erro por excesso de opcoes visiveis.

---

## 11. Regras de Ações Rápidas

1. Acoes rapidas devem permitir execucao sem troca de contexto.
2. Acoes rapidas devem ser poucas, claras e frequentes.
3. Acoes rapidas devem refletir o trabalho real do usuario.
4. Acoes rapidas nao devem ser duplicadas em varias superficies com significados diferentes.
5. Acoes rapidas devem ocupar posicao privilegiada no workspace.
6. Acoes rapidas devem suportar contato, follow-up, edicao, movimentacao e proposta.

---

## 12. Regras para Opportunity Workspace

1. A Opportunity deve ser o centro do fluxo comercial.
2. O workspace deve permitir entender, agir e registrar sem sair de contexto.
3. O workspace deve separar contexto fixo, acao primaria e apoio secundario.
4. O workspace nao deve transformar tarefas de rotina em navegacao por tabs.
5. O workspace deve priorizar o proximo passo do vendedor.
6. O workspace deve manter SLA e risco visiveis, mas nao esmagar a acao principal.
7. O workspace deve suportar proposta, follow-up, edicao e movimentacao com o minimo de friccao.

### O que o Opportunity Workspace deve mostrar primeiro

- cliente;
- oportunidade;
- valor;
- etapa;
- owner;
- SLA;
- proxima acao;
- acoes rapidas.

### O que deve ficar secundario

- timeline completa;
- anexos completos;
- tags detalhadas;
- historico expandido;
- configuracoes avancadas.

---

## 13. Regras para Simulador dentro da Opportunity

1. O simulador deve ser ferramenta da Opportunity, nao uma tela concorrente.
2. O simulador deve ser contextual, curto e acionavel.
3. O simulador deve expor primeiro o minimo necessario para calcular.
4. O simulador deve esconder parametros avancados ate serem necessários.
5. O simulador deve deixar resultado e proxima acao no mesmo contexto.
6. O simulador deve reduzir o tempo entre intencao e proposta.
7. O simulador deve evitar reentrada manual de dados já conhecidos pela oportunidade.

### Regras de comportamento

- usar defaults automaticos quando possivel;
- priorizar campos essenciais;
- mostrar resultado resumido acima da dobra;
- permitir geracao de proposta sem sair do fluxo;
- manter a opcao de ajustes avancados, mas nao como caminho principal.

---

## 14. Regras para Timeline, Tarefas e Histórico

1. Historico deve funcionar como timeline operacional e auditoria visual.
2. Tarefas devem ser tratadas como proxima acao, nao como arquivo passivo.
3. Anotacoes devem ser rapidas de registrar e claras de localizar.
4. Timeline deve mostrar o que muda a decisao, nao apenas o que aconteceu.
5. Historico completo deve ficar em uma camada de consulta, nao de competicao visual.
6. Tarefas, anotacoes e eventos precisam de leitura cronologica e acao clara.
7. O usuario deve conseguir entender o estado operacional sem ler toda a historia.

---

## 15. Regras de Responsividade

1. O layout deve funcionar em desktop e em resolucoes menores sem perda de hierarquia.
2. Em telas menores, prioridade deve permanecer na acao principal.
3. A lateral pode colapsar, mas a acao critica nao pode desaparecer.
4. Tabs extensas devem virar seccoes progressivas em telas compactas.
5. O simulador deve adaptar sua densidade sem virar um formulario quebrado.
6. O usuario deve continuar executando trabalho real em telas reduzidas.

---

## 16. Regras de Acessibilidade

1. Labels devem ser claros e descritivos.
2. Estados de foco devem ser visiveis.
3. Contraste deve suportar leitura rapida.
4. Acoes criticas devem ser identificaveis por texto, nao apenas por icone.
5. Interacoes devem ter feedback imediato.
6. O design enterprise deve ser acessivel mesmo em ambiente interno.
7. Informacao importante nao deve depender apenas de cor.

---

## 17. Critérios de Aceite UX

Uma tela enterprise somente atende ao padrao FINQZ PRO se:

1. o usuario entende o estado da oportunidade em poucos segundos;
2. a acao primaria esta evidente sem busca;
3. acoes criticas exigem menos cliques do que antes;
4. informacoes repetidas foram consolidadas;
5. campos desnecessarios foram escondidos;
6. o simulador pode ser executado sem virar pagina paralela;
7. o historico funciona como apoio operacional;
8. o workspace reduz troca de contexto;
9. o fluxo de follow-up fica rapido;
10. o layout nao cria competicao visual entre blocos equivalentes.

---

## 18. Anti-patterns Proibidos

1. Criar nova arquitetura paralela para resolver UX.
2. Transformar o workspace em um painel de inventario de dados.
3. Resolver complexidade adicionando mais abas.
4. Exibir a mesma informacao em multiplas superficies sem hierarquia.
5. Manter simulador como tela concorrente da Opportunity.
6. Fazer formulario longo para edicao de campos de baixa frequencia.
7. Exigir que o usuario descubra o proximo passo sozinho quando o sistema pode sugerir.
8. Tratar SLA como informacao decorativa.
9. Ocultar a acao primaria em menus ou areas secundarias.
10. Fazer o vendedor saltar entre contextos para completar uma sequencia simples.

---

## 19. Como Aplicar nos Próximos PRPs e IWPs

### Para PRPs

- todo PRP que tocar CRM deve explicitar impacto em produtividade;
- toda alteracao de workspace deve mapear acao primaria, informacao fixa e informacao secundaria;
- todo PRP de simulador deve justificar porque a experiencia continua contextual dentro da Opportunity;
- todo PRP de formulario deve provar reducao de friccao.

### Para IWPs

- IWP deve nascer com leitura de fluxo real do usuario;
- IWP deve listar acoes criticas e seus cliques estimados;
- IWP deve declarar o que ficou automatico, fixo ou oculto;
- IWP deve evitar replicar blocos sem necessidade;
- IWP deve respeitar os principios deste documento como contrato de UX.

### Regra de governanca

Se um PRP ou IWP contradizer este documento, a decisao deve ser tratada como desvio arquitetural e nao como preferencia visual.

---

## 20. Veredito Arquitetural

**GO WITH RESTRICTIONS**

O FINQZ PRO tem base suficiente para evoluir como experiencia enterprise, mas precisa consolidar sua UX em torno de workspaces, hierarquia e reducao de friccao.

Nao ha indicacao para reescrever o produto nem para criar uma nova arquitetura paralela.

A direcao correta e:

- manter Opportunity como centro;
- reduzir cliques;
- automatizar o que for inferivel;
- esconder o que for avancado;
- priorizar contexto;
- transformar o simulador em ferramenta da oportunidade;
- tratar historico como timeline operacional;
- tornar acoes rapidas verdadeiramente executaveis.

---

## Resumo Executivo

Este documento define a autoridade maxima de UX enterprise do FINQZ PRO.

Ele existe para garantir que:

- o produto favoreca workspaces, nao paginas soltas;
- o usuario encontre o que importa sem ruido;
- a experiencia comercial seja orientada a acao;
- a produtividade aumente sem gambiarra e sem arquitetura paralela.

---

## Princípios Definidos

- Workspace acima de pagina.
- Opportunity como centro do fluxo.
- Acao antes de decoracao.
- Menos decisao desnecessaria.
- Contexto por etapa.
- Automacao antes de preenchimento manual.
- Hierarquia rigorosa.
- Progressividade.
- Baixa friccao.
- Consistencia operacional.

---

## Principais Anti-patterns Proibidos

- criar nova arquitetura paralela;
- aumentar tabs para esconder friccao;
- duplicar informacao sem hierarquia;
- manter simulador como tela concorrente;
- inflar formularios de edicao;
- tratar SLA como enfeite;
- forcar troca de contexto para acoes simples.

---

## Impacto Esperado na Produtividade

- menos tempo para entender a oportunidade;
- menos tempo para simular;
- menos tempo para gerar proposta;
- menos tempo para registrar follow-up;
- menos erro por excesso de informacao;
- maior velocidade de operacao;
- maior consistencia entre etapas do fluxo comercial.

---

## Próximos Passos Recomendados para o EPC-W2.5

1. Aplicar estes principios como baseline oficial de UX em todo PRP e IWP do CRM.
2. Rever o Opportunity Workspace com foco em consolidacao visual e acao primaria.
3. Redesenhar o simulador como ferramenta contextual da Opportunity.
4. Reduzir superficie e complexidade do formulario de edicao.
5. Consolidar timeline, tarefas e historico em uma narrativa operacional unica.
6. Medir clique, tempo e friccao nas acoes criticas antes de qualquer expansao funcional.

