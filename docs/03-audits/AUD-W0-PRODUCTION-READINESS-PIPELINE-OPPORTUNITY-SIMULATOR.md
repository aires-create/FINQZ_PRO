# AUD-W0-PRODUCTION-READINESS-PIPELINE-OPPORTUNITY-SIMULATOR

## 1. Resumo Executivo

Esta auditoria avalia se o FINQZ PRO ja pode entrar em producao com o Pipeline/Kanban atual, a Opportunity apos o clique no card e o Simulador funcionando de forma operacional, simples e confiavel.

Conclusao executiva:

- O Kanban atual esta funcional e pode seguir para producao sem redesenho.
- O maior risco nao esta no card do Pipeline em si, mas no que acontece depois do clique.
- A tela da Opportunity ainda esta densa demais para um Go-Live limpo, embora seja operacionalmente utilizavel.
- O Simulador funciona como capacidade de negocio, mas ainda pede simplificacao de fluxo, reducao de ambiguidade e maior clareza de acao.
- Nao ha indicacao, neste recorte, para redesenhar o Kanban agora.

Leitura final:

- Pipeline: pronto com restricoes.
- Opportunity pos-clique: pronto com restricoes.
- Simulador: pronto com restricoes.
- Go-Live pleno e simples ainda depende de ajuste de UX e de consolidacao operacional.

Veredito executivo:

**GO WITH RESTRICTIONS**

---

## 2. Veredito de Produção

**GO WITH RESTRICTIONS**

O FINQZ PRO pode ir para producao com o Kanban atual, desde que o Go-Live seja entendido como:

- operacao real;
- simplicidade aceitavel;
- estabilidade funcional;
- fluxo pos-clique enxuto o suficiente;
- Simulador utilizavel sem ambiguidade critica.

O que nao deve ser feito antes do Go-Live:

- redesenhar o Kanban;
- criar nova arquitetura de decisao;
- transformar o Simulador em projeto paralelo;
- expandir densidade visual da Opportunity.

---

## 3. Escopo Analisado

### 3.1 Documentos de referencia

- [DCA-vNEXT-FINQZ-PRO-ENTERPRISE.md](/C:/Projects/FINQZ_PRO/docs/02-architecture/DCA-vNEXT-FINQZ-PRO-ENTERPRISE.md)
- [EUX-ENTERPRISE-DESIGN-PRINCIPLES.md](/C:/Projects/FINQZ_PRO/docs/01-architecture/EUX-ENTERPRISE-DESIGN-PRINCIPLES.md)
- [OWB-OPPORTUNITY-WORKSPACE-BLUEPRINT.md](/C:/Projects/FINQZ_PRO/docs/01-architecture/OWB-OPPORTUNITY-WORKSPACE-BLUEPRINT.md)
- [PRP-EWT-ENTERPRISE-WORKSPACE-TRANSFORMATION.md](/C:/Projects/FINQZ_PRO/docs/05-prp/PRP-EWT-ENTERPRISE-WORKSPACE-TRANSFORMATION.md)
- [AUD-EPC-W2-5-CRM-ENTERPRISE-UX-PRODUCTIVITY.md](/C:/Projects/FINQZ_PRO/docs/03-audits/AUD-EPC-W2-5-CRM-ENTERPRISE-UX-PRODUCTIVITY.md)
- [AUD-EWT-CROSS-CRM-SIMULATOR-UX-DECISION-ENGINE.md](/C:/Projects/FINQZ_PRO/docs/03-audits/AUD-EWT-CROSS-CRM-SIMULATOR-UX-DECISION-ENGINE.md)
- [PRP-EPC-W2-CRM-CONSOLIDATION.md](/C:/Projects/FINQZ_PRO/docs/05-prp/PRP-EPC-W2-CRM-CONSOLIDATION.md)
- [AUD-EPC-W2-CRM-CONSOLIDATION.md](/C:/Projects/FINQZ_PRO/docs/03-audits/AUD-EPC-W2-CRM-CONSOLIDATION.md)

### 3.2 Código e surfaces analisados

- [`src/components/pipeline/KanbanColumn.tsx`](/C:/Projects/FINQZ_PRO/src/components/pipeline/KanbanColumn.tsx)
- [`src/components/pipeline/pipelineUtils.ts`](/C:/Projects/FINQZ_PRO/src/components/pipeline/pipelineUtils.ts)
- [`src/pages/Oportunidades.tsx`](/C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx)
- [`src/pages/Simulador.tsx`](/C:/Projects/FINQZ_PRO/src/pages/Simulador.tsx)

### 3.3 Recorte funcional

- Pipeline / Kanban.
- Clique no card da oportunidade.
- Tela pós-clique da Opportunity.
- Opportunity Workspace.
- Formulário de edição.
- Tarefas, anotações, tags, anexos, histórico/timeline.
- Painel lateral de resumo.
- SLA.
- Ações rápidas.
- Simulador dentro da oportunidade.
- Geração de proposta.
- Fluxo de aceite/recusa da simulação.

---

## 4. O Que Já Está Bom Para Produção

### 4.1 Pipeline/Kanban

- O Kanban está funcional.
- A interação principal de abrir oportunidade por card já existe.
- A camada de drag/drop e stage handling não exige redesenho imediato para Go-Live.
- A leitura arquitetural já considera o Pipeline como backbone comercial suficiente.

### 4.2 Opportunity como centro

- A Opportunity já é tratada como centro do fluxo comercial.
- O workspace pós-clique já concentra contexto, resumo, ações e simulador.
- O produto não precisa criar uma segunda tela principal para operar.

### 4.3 Simulador como capacidade operacional

- O Simulador já calcula, aceita e gera proposta em fluxo comercial.
- O sistema já possui a lógica básica para trabalhar oferta e resultado.
- A direção correta não é criar um novo motor agora, e sim simplificar a operação atual.

### 4.4 Quick actions e contexto

- A interface já expõe WhatsApp, ligar, e-mail e edição.
- O modelo de ação rápida está presente e é compatível com produção com restrições.

### 4.5 Stack de base

- Os documentos de arquitetura já sustentam uma visão enterprise consistente.
- Não há indicação documental de bloqueio estrutural do Kanban em si.

---

## 5. O Que Bloqueia Produção

### 5.1 Leitura objetiva

Não foi identificado um bloqueador P0 duro do tipo “impossível colocar em produção” no Kanban atual.

O bloqueio real é de qualidade operacional:

- a Opportunity pós-clique ainda está pesada;
- o Simulador ainda exige leitura demais;
- a experiência precisa de simplificação antes de ser considerada simples e confiável de verdade.

### 5.2 Bloqueio funcional condicionado

Se o Go-Live exigir experiência comercial limpa e sem confusão, então estes pontos viram bloqueadores práticos:

- excesso de abas no pós-clique;
- competição entre resumo, timeline, quick actions e simulador;
- formulário de edição mais amplo do que o necessário;
- diferença insuficientemente clara entre calcular, aceitar e gerar proposta.

### 5.3 Leitura final

O que bloqueia a produção não é o Kanban. O que bloqueia é a experiência pós-clique ainda não estar suficientemente enxuta para uso real de alta confiança.

---

## 6. O Que Precisa Ser Simplificado no Pós-Clique do Card

### 6.1 Reduzir leitura inicial

Após clicar no card, o usuário precisa ver imediatamente:

- nome da oportunidade;
- cliente;
- valor;
- etapa;
- responsável;
- SLA;
- próxima ação.

### 6.2 Reduzir competição visual

Os seguintes blocos competem demais entre si:

- resumo lateral;
- timeline;
- tarefas;
- notas;
- tags;
- anexos;
- simulador;
- quick actions;
- formulário de edição.

### 6.3 Simplificar navegação interna

O usuário não deveria precisar “caçar” a ação correta em múltiplas abas para:

- simular;
- aceitar simulação;
- gerar proposta;
- enviar proposta;
- registrar follow-up;
- anexar documento;
- mover etapa;
- editar dado principal.

### 6.4 Tornar o pós-clique um workspace

O pós-clique deve parecer um espaço de trabalho com:

- ação principal evidente;
- contexto fixo;
- informações secundárias recolhidas;
- progressão por etapa;
- menos ruído e menos distração.

---

## 7. Diagnóstico do Opportunity Workspace Atual

### 7.1 Leitura geral

O Opportunity Workspace é funcional, mas ainda denso.

### 7.2 Sinais de densidade

- Há muitas superfícies dentro da mesma experiência.
- O usuário encontra contexto, mas precisa filtrar o que é prioritário.
- O workspace entrega informação e ação ao mesmo tempo, porém não hierarquiza o suficiente.

### 7.3 O que funciona

- Cabeçalho contextual.
- Resumo rápido.
- Ações rápidas.
- Simulador embutido.
- Histórico operacional.

### 7.4 O que fricciona

- excesso de blocos simultâneos;
- leitura fragmentada;
- tabs demais para um fluxo que deveria ser direto;
- dependência do usuário para descobrir o próximo passo.

### 7.5 Leitura de produção

O workspace pode entrar em produção, mas não está ainda no ponto ideal de simplicidade para uma Release 1.0 sem restrições.

---

## 8. Diagnóstico do Formulário de Edição

### 8.1 Situação atual

O formulário de edição existe e permite ajuste de dados da oportunidade, mas ainda carrega mais contexto do que deveria para uma rotina de produção simples.

### 8.2 O que precisa ficar visível

- título da oportunidade;
- pipeline;
- etapa;
- valor;
- responsável;
- observações operacionais.

### 8.3 O que deveria ser somente leitura

Campos que pertencem ao Cliente não devem ser tratados como edição da Opportunity:

- nome do cliente;
- telefone principal;
- e-mail principal;
- identidade cadastral base;
- dados mestre do cliente.

### 8.4 O que pode ser adiado

- campos auxiliares;
- campos de baixa frequência;
- detalhes de apoio que não mudam a venda agora.

### 8.5 Leitura de produção

O formulário não bloqueia produção, mas precisa ser enxugado para evitar ruído e erro humano.

---

## 9. Diagnóstico do Simulador

### 9.1 Estado funcional

O Simulador existe como fluxo operacional e já permite calcular, aceitar e gerar proposta.

### 9.2 O que funciona

- cálculo de simulação;
- escolha de tipo de simulação;
- result preview;
- aceite da simulação;
- geração de proposta.

### 9.3 O que fricciona

- muitos campos por tipo;
- risco de o usuário não entender rapidamente o que fazer depois do cálculo;
- fluxo de aceite/recusa pode ficar visualmente confuso;
- a transição entre resultado e ação não é suficientemente “óbvia”.

### 9.4 Risco de produção

O risco principal não é falta de cálculo, e sim falta de simplicidade operacional.

### 9.5 Leitura de produção

O Simulador pode ir para produção com restrições, mas precisa de refinamento para não virar uma etapa pesada demais para a rotina comercial.

---

## 10. Diagnóstico da Geração de Proposta

### 10.1 Situação atual

A geração de proposta existe como consequência do fluxo de simulação ou do contexto da oportunidade.

### 10.2 O que está bom

- a proposta já faz parte do fluxo;
- existe ligação entre simulação e proposta;
- a proposta não está solta do contexto da Opportunity.

### 10.3 O que precisa melhorar

- deixar claro quando o usuário está aceitando, rejeitando ou convertendo em proposta;
- tornar a ação final mais evidente;
- reduzir o risco de “clicar e não entender o que aconteceu”.

### 10.4 Leitura de produção

A proposta é boa o suficiente para operar, mas ainda não está idealmente clara para Go-Live sem restrições.

---

## 11. Mapa de Cliques das Ações Críticas

Estimativas baseadas no estado atual do workspace e do simulador.

| Ação | Cliques / passos estimados | Leitura |
| --- | ---: | --- |
| Entender a oportunidade | 1 a 2 | Card abre a Opportunity, mas o volume visual ainda exige escaneamento. |
| Simular | 4 a 8 | Abrir, localizar simulador, escolher tipo, preencher campos e calcular. |
| Aceitar simulação | 1 a 2 após cálculo | A ação existe, mas precisa estar mais clara. |
| Gerar proposta | 4 a 6 | Simulação + seleção + ação final. |
| Enviar proposta | 5 a 7 | Depende da clareza do próximo passo. |
| Registrar follow-up | 2 a 4 | Ainda depende de local e contexto. |
| Anexar documento | 2 a 4 | Pode ficar mais direto. |
| Mudar etapa | 1 a 3 | A ação precisa continuar rápida e inequívoca. |
| Editar dados principais | 3 a 5 | Abrir, editar, revisar e salvar. |

### Leitura

O maior custo atual não é só número de cliques. É o tempo de interpretação entre um clique e outro.

---

## 12. Riscos Comerciais

- O vendedor pode demorar mais do que o desejado para agir.
- A oportunidade pode parecer mais complexa do que precisa ser.
- O fluxo de proposta pode ser visto como pesado.
- O usuário pode continuar decidindo manualmente demais.
- Uma experiência confusa pode reduzir adoção real em produção.

---

## 13. Riscos Técnicos

- O Simulador ainda é percebido como capacidade em consolidação.
- Existe risco de coexistência de surfaces que confundem o fluxo.
- A persistência e a clareza do estado pós-simulação precisam continuar consistentes.
- A produção não deve depender de interpretabilidade frágil da interface.

---

## 14. Riscos de UX

- carga cognitiva alta;
- blocos concorrentes na mesma tela;
- excesso de abas;
- informação repetida em vários lugares;
- falta de hierarquia explícita;
- risco de o vendedor se perder na tela;
- risco de confundir aceite, recusa e proposta.

---

## 15. Lista P0

### P0 confirmados

Nenhum bloqueador P0 estrutural confirmado no recorte auditado.

### P0 condicionais

- Se a equipe entender “produção” como operação simples e sem ambiguidade, o pós-clique atual ainda não está no nível ideal.
- Se o simulador ficar sem clareza de ação final, isso vira bloqueio prático para a experiência comercial.

---

## 16. Lista P1

- Simplificar o pós-clique da Opportunity.
- Reduzir fricção visual entre resumo, timeline, quick actions e simulador.
- Enxugar o formulário de edição.
- Deixar explícito o fluxo aceite/recusa da simulação.
- Destacar melhor a ação “gerar proposta”.
- Reforçar quais campos são somente leitura porque pertencem ao Cliente.

---

## 17. Lista P2

- Melhorias de produtividade pós-Go-Live.
- Ajustes finos de densidade visual.
- Refinamento da narrativa de follow-up.
- Redução adicional de cliques em ações recorrentes.
- Melhorias de contextualização por etapa.
- Harmonização editorial de labels e microcopy.

---

## 18. Lista P3

- Commercial Recommendation Engine.
- Decision Engine.
- Knowledge Graph para recomendação comercial.
- Ranking comercial multicritério avançado.
- Evolução enterprise do simulador para recomendação inteligente.
- Aprimoramentos estratégicos de explicabilidade e ranking.

---

## 19. Recomendações Objetivas para Release 1.0

1. Manter o Kanban atual como está.
2. Não redesenhar o Pipeline agora.
3. Simplificar a Opportunity pós-clique.
4. Reduzir o volume visual da tela de detalhe.
5. Tornar o Simulador mais direto para calcular, aceitar e gerar proposta.
6. Enxugar o formulário de edição para produção.
7. Garantir quick actions claras e imediatas.
8. Deixar leitura de SLA e status mais evidente.
9. Preservar a Opportunity como centro operacional.

---

## 20. Itens Explicitamente Adiados para Release 1.1+

- redesenho de Kanban;
- Commercial Recommendation Engine;
- Decision Engine;
- Knowledge Graph;
- ranking comercial inteligente;
- expansão futura do fluxo enterprise de recomendação;
- refinamentos estratégicos que aumentem complexidade antes de estabilizar produção.

---

## 21. Ordem Recomendada de Execução

1. Validar que o Kanban atual entra em produção.
2. Simplificar o pós-clique da Opportunity.
3. Ajustar a clareza do Simulador.
4. Enxugar o formulário de edição.
5. Consolidar quick actions e mensagens de ação.
6. Colocar em produção com restrições.
7. Planejar P2 e P3 somente depois da estabilização.

---

## 22. Critérios Mínimos para Go-Live

1. O Kanban atual precisa operar sem redesign.
2. A Opportunity precisa abrir com contexto claro.
3. O Simulador precisa estar compreensível em ação e resultado.
4. A geração de proposta precisa ser inequívoca.
5. O usuário precisa conseguir registrar follow-up e anexar sem se perder.
6. O formulário de edição precisa ser curto o suficiente para uso real.
7. A tela pós-clique precisa parecer um workspace, não um labirinto.

---

## 23. Veredito Final

**GO WITH RESTRICTIONS**

### Resposta objetiva ao resumo solicitado

- Podemos ir para produção com o Kanban atual? **Sim, com restrições.**
- O que precisa ser corrigido obrigatoriamente no pós-clique? **Clareza, hierarquia, quick actions, redução de abas e simplificação do simulador.**
- Quais ajustes mínimos do Simulador são necessários? **Clareza do fluxo, resultado mais legível, aceite/recusa inequívocos e geração de proposta sem ambiguidade.**
- Quais melhorias devem ficar para depois? **Decision Engine, CRE, Knowledge Graph e ranking avançado.**
- Qual a próxima ação recomendada? **Fechar a simplificação do pós-clique e estabilizar o simulador para produção.**

