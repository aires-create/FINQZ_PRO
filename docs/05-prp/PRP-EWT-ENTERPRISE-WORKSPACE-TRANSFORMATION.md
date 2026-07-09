# PRP-EWT-ENTERPRISE-WORKSPACE-TRANSFORMATION

## 1. Objetivo

Transformar a experiencia operacional do CRM Enterprise do FINQZ PRO em um modelo de trabalho centrado em workspace, produtividade e clareza, reduzindo drasticamente cliques, troca de contexto, carga cognitiva e superficies concorrentes.

Este PRP nao trata de implementacao tecnica. Ele define a direcao de transformacao da experiencia para que o produto opere como um ambiente enterprise vivo, orientado a acao e com narrativa clara por etapa do fluxo comercial.

Base obrigatoria:

- [EUX-ENTERPRISE-DESIGN-PRINCIPLES.md](/C:/Projects/FINQZ_PRO/docs/01-architecture/EUX-ENTERPRISE-DESIGN-PRINCIPLES.md)
- [OWB-OPPORTUNITY-WORKSPACE-BLUEPRINT.md](/C:/Projects/FINQZ_PRO/docs/01-architecture/OWB-OPPORTUNITY-WORKSPACE-BLUEPRINT.md)
- [AUD-EPC-W2-5-CRM-ENTERPRISE-UX-PRODUCTIVITY.md](/C:/Projects/FINQZ_PRO/docs/03-audits/AUD-EPC-W2-5-CRM-ENTERPRISE-UX-PRODUCTIVITY.md)

---

## 2. Escopo

Este PRP cobre a transformacao de experiencia para:

- vendedor de alta performance;
- gerente comercial;
- operador de backoffice;
- Opportunity como centro operacional;
- simulador contextual;
- timeline, tarefas, SLA, WhatsApp, documentos e propostas em fluxo unico;
- jornada ideal do Lead ao Contrato.

O foco e criar uma experiencia comercial enterprise coerente, previsivel e produtiva.

---

## 3. Escopo Proibido

Nao entra neste PRP:

- alterar frontend;
- alterar backend;
- alterar banco;
- alterar Prisma;
- alterar APIs;
- alterar contratos;
- alterar integrações;
- criar arquitetura paralela;
- introduzir nova camada tecnica;
- propor gambiarra;
- descrever implementacao de codigo.

---

## 4. Premissas Estruturantes

Este PRP herda as seguintes premissas:

- o FINQZ PRO deve priorizar workspaces, nao paginas isoladas;
- a Opportunity deve ser o centro do fluxo comercial;
- o sistema deve reduzir decisoes desnecessarias do usuario;
- o usuario deve executar ações criticas com menos cliques;
- informacoes devem aparecer conforme contexto e etapa;
- o Simulador deve ser ferramenta da Opportunity, nao tela concorrente;
- formularios devem ser progressivos, curtos e orientados a acao;
- Historico deve funcionar como timeline operacional e auditoria visual;
- acoes rapidas devem permitir execucao sem troca de contexto;
- nenhuma superficie pode competir com a Opportunity.

---

## 5. Perfis de Uso

### 5.1 Vendedor de alta performance

Como trabalha:

- quer ver status em segundos;
- quer agir imediatamente;
- quer simular, propor e seguir adiante sem perder ritmo;
- quer registrar follow-up sem navegar;
- quer que o sistema prepare o maximo de contexto possivel para ele.

O que ele precisa da Opportunity:

- leitura imediata de etapa, valor, risco e proxima acao;
- quick actions visiveis;
- simulador curto;
- proposta em um fluxo direto;
- follow-up sem friccao.

### 5.2 Gerente comercial

Como trabalha:

- quer acompanhar pipeline, conversao e risco;
- quer entender progresso por etapa;
- quer identificar gargalos, atrasos e oportunidades;
- quer priorizar contas e orientar a equipe.

O que ele precisa da Opportunity:

- status sintetico e confiavel;
- SLA acionavel;
- timeline legivel;
- visao de atividade por etapa;
- consistencia de leitura entre oportunidades.

### 5.3 Operador de backoffice

Como trabalha:

- quer completar pendencias;
- quer validar documentos;
- quer acompanhar proposta, aceite e contratos;
- quer reduzir erros de coleta e retrabalho.

O que ele precisa da Opportunity:

- checklist claro de pendencias;
- anexos e documentos organizados por contexto;
- status contratual visivel;
- historico operacional confiavel;
- menos ruido comercial e mais foco em conclusao.

---

## 6. Como cada perfil utiliza a Opportunity

### Vendedor

Usa a Opportunity para:

- entender rapidamente a situacao;
- executar contato;
- simular;
- gerar proposta;
- registrar follow-up;
- mover etapa;
- manter o fluxo andando.

### Gerente

Usa a Opportunity para:

- supervisionar a qualidade do funil;
- identificar oportunidades paradas;
- orientar proximas acoes;
- revisar contexto de negocacao;
- validar SLA e ritmo de execucao.

### Backoffice

Usa a Opportunity para:

- validar documentacao;
- acompanhar pendencias;
- monitorar transicao para contrato;
- registrar conclucoes;
- manter rastreabilidade.

---

## 7. Jornada ideal do Lead ao Contrato

### 7.1 Jornada oficial

```text
Lead -> Qualificacao -> Diagnostico -> Simulacao -> Proposta -> Negociacao -> Documentacao -> Contrato
```

### 7.2 Leitura operacional da jornada

1. O Lead entra com informacao suficiente para triagem.
2. A Qualificacao confirma fit e prioridade.
3. O Diagnostico coleta o que realmente importa.
4. A Simulacao transforma contexto em cenario acionavel.
5. A Proposta nasce do resultado da simulacao ou do contexto atual.
6. A Negociacao registra ajustes e resposta comercial.
7. A Documentacao encerra pendencias e lacunas.
8. O Contrato formaliza o fechamento e a rastreabilidade.

### 7.3 Regra de continuidade

O usuario nunca deve sentir que saiu da Opportunity para continuar o mesmo fluxo.

---

## 8. Quais decisões o sistema deve tomar automaticamente

O sistema deve assumir automaticamente tudo aquilo que puder ser inferido com seguranca e sem perda de controle humano.

### Decisoes automaticas esperadas

- preencher dados ja conhecidos do cliente;
- sugerir a proxima melhor acao;
- calcular SLA a partir de tempo e etapa;
- manter status sincronizado com a fase da Opportunity;
- exibir dados relevantes por contexto;
- sugerir campos defaults no simulador;
- mostrar documentos e tarefas mais provaveis naquele momento;
- manter historico e timeline atualizados sem acao manual adicional;
- preservar informacao fixa como identidade da oportunidade;
- esconder informacao irrelevante ate o momento certo.

### Regra central

Se o sistema ja sabe, o usuario nao deve repetir.

---

## 9. Quais ações devem desaparecer

As acoes abaixo devem desaparecer da experiencia principal ou deixar de existir como padrao de uso frequente:

- navegar entre varias telas para completar uma tarefa simples;
- abrir tabs desnecessarias para chegar a uma acao primaria;
- reescrever informacao que o sistema ja possui;
- consultar historico completo para encontrar a acao de agora;
- usar formulários longos para ajustes pequenos;
- trocar de contexto apenas para anexar, propor ou registrar follow-up;
- depender de memorizacao para descobrir o proximo passo.

O objetivo nao e remover capacidade.
O objetivo e remover friccao.

---

## 10. Quais informações devem aparecer automaticamente

Informacoes que devem surgir sem friccao:

- cliente;
- oportunidade;
- valor;
- etapa;
- owner;
- SLA;
- proxima acao;
- ultima interacao;
- risco atual;
- pendencias relevantes;
- status da proposta;
- status da documentacao;
- documentos recentes;
- tarefas abertas;
- timeline resumida.

### Regra de aparicao

Informacao automatica deve ser:

- relevante para a etapa;
- sintetica;
- confiavel;
- acionavel.

---

## 11. Quais componentes devem mudar conforme a etapa

O workspace deve se adaptar ao fluxo comercial.

### Componentes que mudam por etapa

- header sintetico;
- destaque da acao primaria;
- conteudo central;
- quick actions prioritarias;
- informacao lateral;
- densidade do simulador;
- status de SLA;
- exibiçao de tarefas e pendencias;
- checklist de documentacao;
- foco da timeline.

### Exemplo de comportamento

- em Qualificacao, o foco e validar contexto;
- em Simulacao, o foco e calcular;
- em Proposta, o foco e gerar e enviar;
- em Negociacao, o foco e acompanhar ajustes;
- em Documentacao, o foco e fechar pendencias;
- em Contrato, o foco e formalizar.

---

## 12. Como reduzir drasticamente a quantidade de cliques

### Diretrizes

1. A acao primaria deve estar sempre visivel.
2. O sistema deve preencher o que puder por inferencia.
3. O usuario nao deve cruzar varias telas para um fluxo simples.
4. O simulador deve nascer dentro da Opportunity.
5. Quick actions devem eliminar navegacao intermediaria.
6. Formularios devem ser curtos e progressivos.
7. Proposta e follow-up devem ser one-flow, nao multi-surface.

### Resultado esperado

- menos abertura de modal desnecessario;
- menos trocas de aba;
- menos ida e volta entre visualizacao e edicao;
- menos cliques para contato, simulacao e proposta.

---

## 13. Como reduzir a carga cognitiva

### Estrategia

- mostrar primeiro o que importa;
- esconder o que e avancado;
- remover redundancia visual;
- consolidar informacao repetida;
- evitar competir por atencao no mesmo layout;
- deixar cada etapa com foco claro;
- usar linguagem simples e orientada a tarefa.

### Regra cognitiva

O usuario nao deve precisar interpretar a tela antes de agir.

---

## 14. Como eliminar troca de contexto

### O principio

O trabalho deve acontecer no mesmo lugar onde a oportunidade vive.

### Como isso se traduz

- simulacao dentro da Opportunity;
- proposta dentro da Opportunity;
- follow-up dentro da Opportunity;
- documentos dentro da Opportunity;
- timeline dentro da Opportunity;
- SLA dentro da Opportunity;
- quick actions dentro da Opportunity.

### O que precisa deixar de acontecer

- sair da Opportunity para completar uma etapa natural do fluxo comercial;
- usar outra tela para registrar o que pertence ao contexto atual;
- depender de ida e volta para concluir um passo simples.

---

## 15. Como transformar a Opportunity em um Workspace vivo

A Opportunity deve funcionar como um ambiente que responde ao estado real da venda.

### O workspace vivo deve:

- mudar com a etapa;
- destacar o proximo passo;
- reordenar informacao por relevancia;
- adaptar quick actions;
- trazer a timeline correta;
- manter o simulador contextual;
- exibir pendencias e riscos no momento certo;
- suportar o trabalho do vendedor, do gerente e do backoffice.

### Workspace vivo nao e:

- pagina estatica;
- lista de campos;
- painel de dados solto;
- dashboard duplicado;
- tela concorrente de outras capacidades.

---

## 16. Como integrar o Simulador como ferramenta contextual

### Papel do Simulador

O simulador existe para acelerar decisao comercial dentro da Opportunity.

### Regras

- o simulador nunca sera uma tela principal;
- o simulador deve herdar contexto da oportunidade;
- o simulador deve mostrar apenas o necessario para calcular;
- o simulador deve oferecer resultado resumido e acao seguinte;
- o simulador deve reduzir o tempo ate a proposta;
- o simulador deve esconder complexidade avancada ate ser necessaria.

### Resultado esperado

- menos tempo para simular;
- menos erro de preenchimento;
- mais conversao de simulacao em proposta;
- menos fragmentacao de experiencia.

---

## 17. Como transformar Timeline, Tarefas, SLA, WhatsApp, Documentos e Propostas em um único fluxo operacional

### 17.1 Timeline

Deve funcionar como memoria operacional e auditoria visual.

### 17.2 Tarefas

Devem representar proxima acao, nao inventario passivo.

### 17.3 SLA

Deve ser sinal de risco e prioridade, nao apenas indicador decorativo.

### 17.4 WhatsApp

Deve ser atalho de contato, nao quebra de contexto.

### 17.5 Documentos

Devem ser anexados e lidos dentro do fluxo da oportunidade.

### 17.6 Propostas

Devem nascer da simulacao e manter rastreabilidade do que foi enviado.

### 17.7 Fluxo unico

O objetivo e que todas essas capacidades componham uma unica narrativa operacional:

```text
Entender -> Simular -> Propor -> Contatar -> Registrar -> Documentar -> Avancar
```

---

## 18. Princípios de Produtividade Enterprise

### 18.1 One Screen Philosophy

O usuario deve concluir o maximo possivel sem trocar de tela.

### 18.2 Context First

O contexto da oportunidade vem antes da estrutura da pagina.

### 18.3 Zero Waste Click

Todo clique sem valor operacional deve ser eliminado.

### 18.4 Progressive Disclosure

A complexidade deve ser revelada sob demanda.

### 18.5 Smart Defaults

O sistema deve partir do que e mais provavel e mais util.

### 18.6 Contextual Automation

O sistema deve automatizar o que depende apenas de contexto.

### 18.7 Single Source of Truth

Cada informacao deve ter uma origem clara e unica.

### 18.8 Action Before Navigation

Acao vem antes de deslocamento entre paginas.

### 18.9 Information on Demand

Informacao detalhada deve aparecer quando for realmente necessaria.

### 18.10 Cognitive Load Reduction

O produto deve reduzir a necessidade de interpretar para poder agir.

---

## 19. Métricas Oficiais de UX

As metricas abaixo definem o sucesso da transformacao.

### 19.1 Cliques por operação

Medir quantos cliques o usuario precisa para:

- simular;
- gerar proposta;
- registrar follow-up;
- anexar documento;
- mover etapa;
- atualizar oportunidade.

### 19.2 Tempo para gerar proposta

Tempo entre a intencao e a entrega da proposta.

### 19.3 Tempo para registrar follow-up

Tempo entre perceber a necessidade e registrar a interacao.

### 19.4 Tempo para localizar informação

Tempo para encontrar valor, etapa, owner, SLA, pendencia ou historico util.

### 19.5 Mudanças de contexto

Numero de saltos entre telas, modais e areas distintas.

### 19.6 Ações concluídas sem trocar de tela

Percentual de tarefas finalizadas dentro do mesmo workspace.

### 19.7 Uso das Quick Actions

Percentual de operacoes executadas pelas acoes rapidas.

### 19.8 Eficiência por etapa do Pipeline

Tempo, cliques e taxa de conclusao em cada etapa da Opportunity.

### 19.9 Leitura executiva das metricas

Se a experiencia for boa, estes indicadores devem cair em friccao e subir em conclusao.

---

## 20. Regras Absolutas

1. Nenhuma tela pode competir com a Opportunity.
2. O Simulador nunca sera uma tela principal.
3. O usuario nunca deve preencher informacao que o sistema ja conhece.
4. Toda acao repetitiva deve ser candidata a automacao.
5. O sistema deve sempre indicar a proxima melhor acao.
6. O Workspace deve mudar conforme a etapa da Opportunity.
7. O usuario nunca deve se perder no fluxo.
8. Informacao relevante deve aparecer no momento certo.
9. Redundancia visual e tab sprawl sao sinais de falha de experiencia.
10. A produtividade comercial e uma responsabilidade de produto, nao um detalhe de interface.

---

## 21. Mudanças estratégicas propostas

### 21.1 Mudar o modelo mental do produto

Sair de "pagina com recursos" para "workspace de acao".

### 21.2 Tornar a Opportunity o cockpit do fluxo comercial

O usuario deve pensar em Opportunity como ambiente de trabalho principal.

### 21.3 Reduzir superfície e aumentar contexto

Menos telas independentes, mais contexto vivo.

### 21.4 Transformar simulacao em etapa contextual

O simulador deve acelerar decisao, nao disputar atencao.

### 21.5 Consolidar timeline, tarefas e documentos

Esses elementos devem fazer parte de uma narrativa unica de operacao.

### 21.6 Reorganizar o desenho para produtividade real

Quick actions, defaults inteligentes e progressividade devem virar regra.

---

## 22. Critérios para iniciar a implementação

Antes de qualquer implementacao, deve existir consenso sobre:

1. a Opportunity e o centro do fluxo;
2. o simulador e contextual, nunca concorrente;
3. o workspace e a unidade de trabalho;
4. cliques e contexto sao metricas de produto;
5. telas e blocos devem obedecer a etapa;
6. a experiencia deve ser validada por perfil de usuario;
7. o escopo nao pode criar nova arquitetura paralela.

---

## 23. Ganhos esperados de produtividade

- reducao drástica de cliques;
- menor tempo para entender a oportunidade;
- menor tempo para simular e propor;
- menor tempo para registrar follow-up;
- menor mudanca de contexto;
- menor carga cognitiva;
- mais uso de quick actions;
- mais completude por fluxo;
- mais previsibilidade operacional;
- maior adoção do workspace pela equipe comercial.

---

## 24. Riscos

| Risco | Impacto | Leitura |
| --- | --- | --- |
| Manter telas concorrentes ao workspace | alto | quebra o centro operacional |
| Inflar o simulador | alto | aumenta tempo e friccao |
| Exibir informacao demais ao mesmo tempo | alto | eleva carga cognitiva |
| Nao automatizar o que o sistema ja sabe | medio/alto | aumenta erro e retrabalho |
| Nao medir cliques e tempo | alto | impede provar ganho |
| Criar nova arquitetura paralela | critico | contradiz a direcao enterprise |

---

## 25. Veredito final

**GO WITH RESTRICTIONS**

O FINQZ PRO tem base suficiente para transformar a experiencia do CRM Enterprise em um workspace vivo, contextual e produtivo.

As restricoes existem porque a transformacao precisa respeitar o contrato arquitetural atual:

- sem arquitetura paralela;
- sem competir com a Opportunity;
- sem simular fora do contexto;
- sem aumentar complexidade visual;
- sem criar friccao desnecessaria.

---

## Resumo Executivo

Este PRP define a transformacao completa da experiencia operacional do CRM Enterprise do FINQZ PRO.

Ele posiciona a Opportunity como centro de trabalho, estabelece principios de produtividade enterprise, define metricas oficiais de UX, proibe anti-patterns de friccao e orienta a jornada do Lead ao Contrato.

---

## Visão do Enterprise Workspace

O Enterprise Workspace deve ser o ambiente principal de operacao comercial:

- centrado na Opportunity;
- adaptativo por etapa;
- rapido de ler;
- rapido de agir;
- reduzido em cliques;
- forte em contexto;
- claro em prioridade.

---

## Ganhos esperados de produtividade

- menos cliques;
- menos troca de contexto;
- menos ruido visual;
- menos retrabalho;
- menos duvida sobre proxima acao;
- mais velocidade comercial;
- mais previsibilidade;
- mais uso do workspace como ambiente vivo.

---

## Riscos

- resistir a reduzir superfcie por medo de "perder informacao";
- criar telas novas para resolver problemas de hierarquia;
- manter o simulador grande demais;
- permitir que a interface continue pedindo ao usuario o que o sistema ja sabe;
- nao medir a evolucao por cliques, tempo e conclusao.

---

## Critérios para iniciar a implementação

1. A Opportunity foi assumida como centro absoluto.
2. O simulador foi assumido como ferramenta contextual.
3. Os perfis de uso foram validados com produto e operacao.
4. As metricas de UX foram aceitas como criterio de sucesso.
5. O escopo foi mantido sem arquitetura paralela.

