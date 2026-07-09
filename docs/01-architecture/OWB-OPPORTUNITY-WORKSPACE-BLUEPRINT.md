# OWB-OPPORTUNITY-WORKSPACE-BLUEPRINT

Status: Proposed
Date: 2026-07-07
Owner: Architecture
Type: Architectural Blueprint
Project: FINQZ PRO

---

## 1. Visão do Workspace

O **Opportunity Workspace** e a superficie operacional oficial do FINQZ PRO para conduzir o ciclo comercial com foco em produtividade, clareza e reduzida friccao.

Ele existe para permitir que o usuario:

- entenda o contexto da oportunidade rapidamente;
- execute a proxima acao sem trocar de superficie;
- simule, proponha, registre e avance o fluxo em menos passos;
- mantenha rastreabilidade operacional e auditabilidade visual;
- trabalhe com o minimo de decodificacao cognitiva.

### Posicionamento arquitetural

O workspace nao e uma pagina de detalhes.
O workspace e o centro de comando da Opportunity.

### Regra-mestra

Se uma informacao nao ajuda a decidir ou agir agora, ela nao deve competir com a acao principal.

---

## 2. Objetivos do usuário por etapa

Cada etapa do fluxo comercial deve responder a uma intencao primaria do usuario.

| Etapa | Objetivo do usuario | O que o workspace deve entregar |
| --- | --- | --- |
| Lead | identificar potencial e urgencia | resumo rapido, origem, owner, proxima acao |
| Qualificacao | validar aderencia e prioridade | criterios, flags, risco, follow-up |
| Diagnostico | entender necessidade e contexto | dados relevantes, observacoes, sinais de viabilidade |
| Simulacao | testar cenarios e precificar | simulador contextual, resultado, recomendacao |
| Proposta | materializar condicoes | geracao rapida de proposta, versao, envio |
| Negociacao | ajustar e reduzir atrito | comparacao, historico de mudanças, respostas, tarefas |
| Documentacao | reunir evidencias e pendencias | checklist, anexos, completude |
| Contrato | formalizar aceites e vigencia | status contratual, pendencias finais, audit trail |
| Pos-venda | acompanhar consolidacao e continuidade | timeline, follow-up, ocorrencias, proximos passos |

---

## 3. Jornada completa da Opportunity

### Jornada oficial

```text
Lead -> Qualificacao -> Diagnostico -> Simulacao -> Proposta -> Negociacao -> Documentacao -> Contrato -> Pos-venda
```

### Leitura da jornada

1. O lead entra no workspace com contexto minimo suficiente.
2. O usuario qualifica a oportunidade sem navegar por superficies concorrentes.
3. O diagnostico consolida os dados que realmente sustentam a decisao.
4. A simulacao acontece dentro da oportunidade, em modo contextual.
5. A proposta nasce do resultado da simulacao ou do estado corrente da oportunidade.
6. A negociacao registra ajustes, respostas e pendencias no mesmo centro.
7. A documentacao coleta os itens faltantes sem dispersar o usuario.
8. O contrato finaliza o ciclo comercial com rastreabilidade.
9. O pos-venda mantem a timeline operacional viva e acionavel.

### Regra de continuidade

O usuario nunca deve sentir que saiu da Opportunity para concluir uma tarefa essencial do ciclo comercial.

---

## 4. Estados da Opportunity

### 4.1 Estados canonicos

```text
Lead -> Qualificacao -> Diagnostico -> Simulacao -> Proposta -> Negociacao -> Documentacao -> Contrato -> Pos-venda
```

### 4.2 Leitura por estado

#### Lead

- entrada inicial;
- contexto ainda leve;
- acao dominante: entender e priorizar.

#### Qualificacao

- validacao de fit;
- acao dominante: confirmar se vale avancar.

#### Diagnostico

- coleta do contexto real;
- acao dominante: registrar sinais e necessidade.

#### Simulacao

- calculo e comparacao;
- acao dominante: testar cenario util.

#### Proposta

- materializacao comercial;
- acao dominante: gerar e enviar proposta.

#### Negociacao

- refinamento do caminho;
- acao dominante: ajustar e registrar respostas.

#### Documentacao

- fechamento de lacunas;
- acao dominante: completar evidencias e pendencias.

#### Contrato

- formalizacao;
- acao dominante: concluir aceite e validade.

#### Pos-venda

- acompanhamento;
- acao dominante: manter relacao e auditoria viva.

### 4.3 Regra de transicao

Transicoes devem ser explicitas, auditaveis e coerentes com o estado atual.

O workspace nao deve pular estados de forma silenciosa quando isso comprometer rastreabilidade.

---

## 5. Layout lógico do Workspace

O Opportunity Workspace deve ser organizado em quatro zonas logicas:

### 5.1 Header

Responsabilidades:

- identificar a oportunidade;
- exibir cliente, valor, etapa, owner e SLA;
- mostrar status atual e proxima acao;
- manter acoes rapidas primarias visiveis;
- servir como ancora de orientacao do usuario.

Nao deve:

- repetir informacoes em excesso;
- competir com o centro da operacao;
- virar painel analitico genérico.

### 5.2 Coluna esquerda

Responsabilidades:

- contexto comercial essencial;
- dados fixos da oportunidade;
- sinais de prioridade;
- resumo de qualificacao e diagnostico;
- estado atual e pendencias centrais.

Nao deve:

- conter tudo o que existe sobre a conta;
- repetir a timeline completa;
- acumular configuracoes secundarias.

### 5.3 Centro

Responsabilidades:

- acao primaria da etapa;
- simulacao contextual;
- proposta e negociacao;
- formulacao do proximo passo;
- execucao do fluxo principal.

Nao deve:

- virar area de consulta passiva;
- competir com a lateral por prioridade;
- exigir troca de tela para completar o fluxo critico.

### 5.4 Coluna direita

Responsabilidades:

- resumo operacional expandido;
- timeline resumida;
- tarefas, notas e anexos recentes;
- auditoria visual;
- apoio rapido de contexto.

Nao deve:

- replicar o header;
- competir com a acao principal;
- ocupar a mesma hierarquia do centro.

### 5.5 Regra de hierarquia

O centro e a acao.
A lateral e o suporte.
O header e a orientacao.
A esquerda e o contexto fixo.

---

## 6. Motor contextual

O motor contextual e a regra de aparicao e desaparecimento de informacao por etapa.

### 6.1 Principio

O workspace deve exibir apenas o que e relevante para o estado atual da Opportunity, mantendo o restante disponivel sob demanda.

### 6.2 O que aparece e desaparece

| Etapa | Aparece | Desaparece ou fica oculto |
| --- | --- | --- |
| Lead | origem, owner, score, proxima acao | simulacao avancada, contrato, historico extenso |
| Qualificacao | criterios, riscos, follow-up | detalhes de proposta e anexos pesados |
| Diagnostico | observacoes, necessidades, sinais de fit | parametros tecnicos nao usados ainda |
| Simulacao | campos essenciais, resultado, recomendacao | metadados secundarios e audit detalhado |
| Proposta | versao, envio, comparativo | campos de preparação ja consolidados |
| Negociacao | respostas, alteracoes, tarefas | blocos de leitura passiva desnecessarios |
| Documentacao | checklist, pendencias, anexos | simulador completo, se ja resolvido |
| Contrato | aceite, assinatura, vigencia | blocos de negociacao ja encerrados |
| Pos-venda | timeline, ocorrencias, follow-up | formulacoes de entrada de funil inicial |

### 6.3 Regra de disclosure

Informacao deve ser progressiva:

- primeiro o essencial;
- depois o complementar;
- por ultimo o historico e o detalhe avancado.

---

## 7. Fluxos críticos

### 7.1 Simular

Fluxo recomendado:

1. abrir oportunidade;
2. carregar simulador contextual;
3. preencher apenas campos essenciais;
4. calcular;
5. revisar resultado;
6. salvar contexto;
7. avancar para proposta ou ajuste.

### 7.2 Gerar proposta

Fluxo recomendado:

1. usar resultado da simulacao ou contexto atual;
2. gerar proposta sem sair do workspace;
3. exibir versao e status;
4. registrar envio;
5. manter historico da decisao.

### 7.3 Registrar follow-up

Fluxo recomendado:

1. acionar quick action;
2. registrar nota, tarefa ou compromisso;
3. vincular data e proxima acao;
4. atualizar SLA e timeline automaticamente.

### 7.4 Anexar documentos

Fluxo recomendado:

1. iniciar upload no contexto da oportunidade;
2. classificar o documento automaticamente quando possivel;
3. vincular ao estado atual;
4. refletir pendencias de documentacao.

### 7.5 Mover etapa

Fluxo recomendado:

1. entender estado atual;
2. validar se a transicao e permitida;
3. mover etapa com rastreabilidade;
4. atualizar motor contextual;
5. registrar evento na timeline.

---

## 8. Regras para ações rápidas

1. Acoes rapidas devem ser visiveis no primeiro nivel de leitura.
2. Acoes rapidas devem refletir o trabalho real do vendedor.
3. Acoes rapidas devem permitir execucao sem troca de contexto.
4. Acoes rapidas devem ser poucas, claras e frequentes.
5. Acoes rapidas nao devem duplicar funcoes com nomes diferentes.
6. Acoes rapidas devem priorizar contato, follow-up, edicao, proposta, anexos e movimentacao.
7. Acoes de baixa frequencia nao devem ocupar a mesma posicao das acoes criticas.

---

## 9. Regras para Timeline e auditoria operacional

1. Timeline deve funcionar como memoria operacional da oportunidade.
2. Timeline deve registrar eventos, decisoes e interacoes humanas.
3. Timeline deve ser cronologica, legivel e acionavel.
4. Timeline deve diferenciar atividade automatica de atividade manual.
5. Auditoria visual deve permitir entender o que aconteceu sem ler logs brutos.
6. Tarefas, notas e movimentos de etapa devem alimentar a timeline.
7. A timeline completa deve existir sem competir com a acao principal.
8. O que e historico nao deve virar poluicao visual.

---

## 10. Integração do Simulador como ferramenta contextual

### 10.1 Papel

O simulador e uma ferramenta da Opportunity, nao um destino independente.

### 10.2 Regras

1. O simulador deve herdar contexto da oportunidade.
2. O simulador deve mostrar o minimo necessario para calcular.
3. O simulador deve esconder campos avancados ate serem necessarios.
4. O simulador deve deixar o resultado imediatamente util.
5. O simulador deve reduzir o caminho ate a proposta.
6. O simulador nao deve exigir repeticao de informacoes ja conhecidas.
7. O simulador deve favorecer previsibilidade, nao surpresa.

### 10.3 Saidas esperadas

- resultado calculado;
- recomendacao de proximo passo;
- base para proposta;
- registro auditavel.

---

## 11. KPIs de produtividade e UX

### 11.1 KPIs primarios

- tempo para abrir e entender uma oportunidade;
- tempo para simular;
- tempo para gerar proposta;
- tempo para registrar follow-up;
- tempo para mover etapa;
- numero de cliques por acao critica;
- taxa de conclusao de simulacao;
- taxa de conversao de simulacao para proposta;
- taxa de uso de acoes rapidas;
- taxa de abandono do workspace.

### 11.2 KPIs de clareza

- quantas informacoes precisam ser lidas para localizar a acao principal;
- quantas superficies competem por atencao;
- quantas informacoes aparecem repetidas;
- quantos campos sao preenchidos manualmente sem necessidade.

### 11.3 KPI de adoção

- percentual de usuarios que concluem o fluxo sem sair do workspace.

---

## 12. Mapa cognitivo do usuário

### 12.1 Perguntas mentais do vendedor

1. O que e esta oportunidade?
2. Qual o status real?
3. O que importa agora?
4. Qual a proxima acao?
5. Preciso simular?
6. Preciso propor?
7. Falta documento?
8. Existe risco ou SLA?
9. O que mudou desde a ultima interacao?

### 12.2 Resposta do workspace

O workspace deve responder essas perguntas sem exigir exploracao excessiva.

### 12.3 Modelo mental alvo

O usuario nao deve pensar em "navegar".
O usuario deve pensar em "decidir e executar".

---

## 13. Anti-patterns proibidos

1. Criar nova arquitetura paralela.
2. Transformar workspace em dashboard genérico.
3. Resolver friccao com mais abas.
4. Repetir a mesma informacao em varios lugares sem hierarquia.
5. Manter simulador como tela concorrente da Opportunity.
6. Exibir historico completo como se fosse acao principal.
7. Inflar formulario de edicao com campos de baixa frequencia.
8. Ocultar a acao critica dentro de menus.
9. Forcar troca de contexto para tarefas simples.
10. Tratar SLA como elemento decorativo.

---

## 14. Critérios de aceite do Workspace

O Opportunity Workspace so e considerado aderente quando:

1. a Opportunity for claramente o centro da experiencia;
2. a acao primaria for imediatamente identificavel;
3. o usuario conseguir simular sem sair do contexto;
4. o usuario conseguir registrar follow-up rapidamente;
5. o usuario conseguir gerar proposta com poucos passos;
6. a timeline for legivel e operacional;
7. o resumo lateral nao duplicar o header de forma redundante;
8. o formulario de edicao for curto e progressivo;
9. as acoes rapidas forem suficientes para o trabalho real;
10. o layout reduzir a carga cognitiva em vez de aumenta-la.

---

## 15. Recomendações para implementação no EPC-W2.5

### 15.1 Direcao de produto

- tratar o Opportunity Workspace como o padrao canônico do fluxo comercial;
- fazer o simulador viver dentro da Opportunity;
- reduzir tabs e concentrar acao no centro;
- padronizar a leitura de estados e etapas;
- transformar tarefas, notas e historico em timeline operacional.

### 15.2 Direcao de UX

- priorizar progressive disclosure;
- manter o que e fixo sempre visivel;
- esconder o que e avancado ate o momento certo;
- consolidar informacoes redundantes;
- diminuir cliques nas acoes criticas.

### 15.3 Direcao de governanca

- todo PRP e IWP do EPC-W2.5 deve referenciar este blueprint;
- qualquer desvio de UX deve justificar impacto em produtividade;
- nenhuma proposta deve criar um segundo centro operacional fora da Opportunity.

### 15.4 Direcao de entrega

- evolucao incremental, sem ruptura arquitetural;
- validacao por fluxo real do vendedor;
- foco em produtividade e clareza, nao em densidade de features.

---

## Resumo executivo

O Opportunity Workspace e o centro operacional do FINQZ PRO para vender, simular, propor, negociar e acompanhar oportunidades com o minimo de friccao.

Este blueprint formaliza:

- a jornada completa da Opportunity;
- os estados canonicos do fluxo;
- o layout logico do workspace;
- o motor contextual por etapa;
- os fluxos criticos;
- as regras de quick actions;
- os criterios de aceite;
- os anti-patterns proibidos.

---

## Visão do Opportunity Workspace

O Opportunity Workspace deve ser um cockpit enterprise:

- claro;
- contextual;
- rapido;
- auditavel;
- orientado a acao;
- centrado na Opportunity.

Ele nao deve ser uma pagina de consulta. Ele deve ser o ambiente de trabalho principal do fluxo comercial.

---

## Principais ganhos esperados para produtividade

- menos cliques por acao critica;
- menos troca de contexto;
- menos sobrecarga cognitiva;
- simulacao mais rapida;
- proposta mais rapida;
- follow-up mais rapido;
- melhor leitura de status e SLA;
- maior adoção do workspace pela equipe comercial.

---

## Veredito arquitetural

**GO WITH RESTRICTIONS**

O Opportunity Workspace tem base suficiente para ser consolidado como centro oficial do fluxo comercial do FINQZ PRO, desde que a experiencia seja tratada como workspace enterprise e nao como conjunto de telas isoladas.

As restricoes sao claras:

- nao aumentar superfícies sem necessidade;
- nao criar arquitetura paralela;
- nao deixar o simulador competir com a Opportunity;
- nao inflar formulários e historico;
- nao abrir mao da hierarquia visual e da reducao de cliques.

