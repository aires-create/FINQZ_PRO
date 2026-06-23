# H15-E - Opportunity Legacy Deactivation Matrix

Status: PROPOSED FOR CONTROLLED DEACTIVATION  
Type: Architecture Decision / Deactivation Matrix  
Scope: Opportunity Legacy / SDR IA / API Surface / Backend Legacy Boundary  
Date: 2026-06-23

---

## 1. Contexto

A auditoria `H15-D` confirmou que a dependencia legada de `Opportunity` nao esta difusa no sistema inteiro. Ela esta concentrada em um caminho operacional especifico:

- `src/pages/SdrIaHub.tsx`
- `src/api/dataService.ts`
- `src/api/client.ts`
- `backend/server/src/index.ts`

Ao mesmo tempo, a superficie oficial ja existe e e a referencia preferencial:

- `src/api/modules/opportunities.api.ts`
- `src/api/modules/pipelines.api.ts`
- `backend/src/modules/opportunities/**`
- `backend/src/modules/pipelines/**`

O objetivo desta fase nao e remover nada, e sim transformar a observacao da auditoria em um plano seguro de desativacao controlada, com ondas pequenas, rollback claro e fronteiras de risco definidas.

Decisao-base assumida para esta matriz:

- o backend moderno e `KEEP`;
- o legado de opportunity e `QUARANTINE`;
- a migracao do frontend e obrigatoria antes de qualquer corte do backend legado;
- `SdrIaHub` e o primeiro consumidor que precisa sair do caminho legado.

Nao ha alteracao de runtime neste documento.

---

## 2. Matriz de Dependencias

### 2.1 Cadeia legada ativa

| Camada | Arquivo | Papel | Classificacao |
|---|---|---|---|
| Frontend consumidor | [`src/pages/SdrIaHub.tsx`](/C:/Projects/FINQZ_PRO/src/pages/SdrIaHub.tsx#L1013) | Cria oportunidade via `dataService` | `MIGRATE` |
| Servico intermediario | [`src/api/dataService.ts`](/C:/Projects/FINQZ_PRO/src/api/dataService.ts#L103) | Encaminha `oportunidades.create` para o client legado | `QUARANTINE` |
| Client legado | [`src/api/client.ts`](/C:/Projects/FINQZ_PRO/src/api/client.ts#L122) | Expõe `/api/oportunidades*` | `QUARANTINE` |
| Backend legado | [`backend/server/src/index.ts`](/C:/Projects/FINQZ_PRO/backend/server/src/index.ts#L1982) | Atende `/api/oportunidades*` | `QUARANTINE` |

### 2.2 Superficie oficial

| Camada | Arquivo | Papel | Classificacao |
|---|---|---|---|
| Frontend oficial | [`src/api/modules/opportunities.api.ts`](/C:/Projects/FINQZ_PRO/src/api/modules/opportunities.api.ts#L148) | CRUD oficial de opportunity | `KEEP` |
| Frontend oficial | [`src/api/modules/pipelines.api.ts`](/C:/Projects/FINQZ_PRO/src/api/modules/pipelines.api.ts#L8) | Leitura oficial de pipeline | `KEEP` |
| Backend oficial | [`backend/src/modules/opportunities/**`](/C:/Projects/FINQZ_PRO/backend/src/modules/opportunities/routes.ts#L142) | Contrato moderno de opportunity | `KEEP` |
| Backend oficial | [`backend/src/modules/pipelines/**`](/C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L91) | Contrato moderno de pipeline | `KEEP` |

### 2.3 Superficie legada adicional

| Arquivo | Papel | Classificacao |
|---|---|---|
| [`src/api/modules/oportunidades.api.ts`](/C:/Projects/FINQZ_PRO/src/api/modules/oportunidades.api.ts#L36) | API antiga de opportunity em PT-BR | `QUARANTINE` |
| [`src/api/modules/index.ts`](/C:/Projects/FINQZ_PRO/src/api/modules/index.ts#L8) | Barrel que ainda reexporta modulo legado | `QUARANTINE` |
| [`backend/server/src/local-server.ts`](/C:/Projects/FINQZ_PRO/backend/server/src/local-server.ts#L2) | Boot do backend legado em ambiente local | `QUARANTINE` |

---

## 3. Ordem Segura de Corte

### Onda 1 - Migrar o consumidor direto

Objetivo:

- remover `SdrIaHub` da rota legada;
- fazer a criacao de opportunity usar a API oficial;
- reduzir o grafo para que `dataService` deixe de ser o unico ponto vivo da escrita legada.

Resultado esperado:

- `SdrIaHub` nao depende mais de `dataService.oportunidades.create`;
- a cadeia legada deixa de ser obrigatoria para uso do SDR IA.

### Onda 2 - Remover a ponte de compatibilidade do frontend

Objetivo:

- isolar `src/api/dataService.ts` como legado sem consumidor de opportunity;
- preparar a retirada do uso de `/api/oportunidades` via client legado;
- manter apenas o que ainda for necessário para outras areas nao relacionadas a opportunity.

Resultado esperado:

- o caminho `SdrIaHub -> dataService -> api/client` deixa de existir para opportunity;
- a dependencia legada passa a ser somente residual ou historica.

### Onda 3 - Desativar a superficie legacy client-side

Objetivo:

- remover o consumo funcional de `src/api/client.ts` para oportunidade;
- impedir que `src/api/modules/oportunidades.api.ts` continue sendo tratado como superficie util.

Resultado esperado:

- nenhuma tela de opportunity usa mais `/api/oportunidades*`;
- o client legado vira somente passivo de compatibilidade.

### Onda 4 - Cortar o backend legado por dominio

Objetivo:

- apos a migracao completa do consumidor, desativar as rotas legadas de oportunidade no backend monolito;
- manter apenas o backend moderno e os contratos oficiais.

Resultado esperado:

- `backend/server/src/index.ts` nao precisa mais servir `/api/oportunidades*` para nenhuma tela migrada.

### Onda 5 - Remocao final de restos de compatibilidade

Objetivo:

- remover reexports e referencias historicas;
- consolidar o modulo oficial como unica via suportada.

Resultado esperado:

- a superficie legada deixa de ser enderecavel por import, embora isso so deva ocorrer depois de todos os consumidores terem sido migrados.

---

## 4. Arquivos que Podem Ser Alterados em Cada Onda

### Onda 1

Podem ser alterados:

- [`src/pages/SdrIaHub.tsx`](/C:/Projects/FINQZ_PRO/src/pages/SdrIaHub.tsx#L1013)
- [`src/api/modules/opportunities.api.ts`](/C:/Projects/FINQZ_PRO/src/api/modules/opportunities.api.ts#L148)

Nao podem ser alterados:

- [`src/api/dataService.ts`](/C:/Projects/FINQZ_PRO/src/api/dataService.ts#L103)
- [`src/api/client.ts`](/C:/Projects/FINQZ_PRO/src/api/client.ts#L122)
- [`backend/server/src/index.ts`](/C:/Projects/FINQZ_PRO/backend/server/src/index.ts#L1982)

### Onda 2

Podem ser alterados:

- [`src/api/dataService.ts`](/C:/Projects/FINQZ_PRO/src/api/dataService.ts#L103)
- [`src/api/modules/index.ts`](/C:/Projects/FINQZ_PRO/src/api/modules/index.ts#L8)

Nao podem ser alterados:

- [`src/api/client.ts`](/C:/Projects/FINQZ_PRO/src/api/client.ts#L122)
- [`backend/server/src/index.ts`](/C:/Projects/FINQZ_PRO/backend/server/src/index.ts#L1982)

### Onda 3

Podem ser alterados:

- [`src/api/client.ts`](/C:/Projects/FINQZ_PRO/src/api/client.ts#L122)
- [`src/api/modules/oportunidades.api.ts`](/C:/Projects/FINQZ_PRO/src/api/modules/oportunidades.api.ts#L36)

Nao podem ser alterados:

- [`backend/server/src/index.ts`](/C:/Projects/FINQZ_PRO/backend/server/src/index.ts#L1982)
- [`backend/src/modules/opportunities/**`](/C:/Projects/FINQZ_PRO/backend/src/modules/opportunities/routes.ts#L142)

### Onda 4

Podem ser alterados:

- [`backend/server/src/index.ts`](/C:/Projects/FINQZ_PRO/backend/server/src/index.ts#L1982)
- boot local legado relacionado ao server, se necessario

Nao podem ser alterados:

- [`backend/src/modules/opportunities/**`](/C:/Projects/FINQZ_PRO/backend/src/modules/opportunities/routes.ts#L142)
- [`backend/src/modules/pipelines/**`](/C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L91)
- [`src/api/modules/opportunities.api.ts`](/C:/Projects/FINQZ_PRO/src/api/modules/opportunities.api.ts#L148)

### Onda 5

Podem ser alterados:

- [`src/api/modules/index.ts`](/C:/Projects/FINQZ_PRO/src/api/modules/index.ts#L8)
- sobras de compatibilidade sem consumo ativo

Nao podem ser alterados:

- contratos oficiais
- backend moderno
- telas ainda nao migradas em outras areas do sistema

---

## 5. Arquivos Proibidos em Cada Onda

### Proibicoes gerais

Em nenhuma onda desta matriz e permitido:

- alterar `src/api/modules/opportunities.api.ts` para voltar a depender do legado;
- reintroduzir `SdrIaHub` no fluxo de `dataService.oportunidades.create`;
- alterar backend moderno para copiar comportamento do backend legado;
- remover endpoints do backend legado antes da migracao do consumidor;
- criar fonte paralela de dados para opportunity;
- usar `localStorage` como fallback de dominio.

### Proibicoes especificas

#### Onda 1

- nao alterar `src/api/client.ts`;
- nao alterar `backend/server/src/index.ts`;
- nao cortar compatibilidade enquanto a criacao estiver migrada apenas parcialmente.

#### Onda 2

- nao remover o backend legado;
- nao desativar `dataService` para outras areas ainda dependentes;
- nao assumir que barrel cleanup equivale a runtime cleanup.

#### Onda 3

- nao quebrar consumidores fora de opportunity;
- nao remover `api/client` inteiro se ainda houver usos gerais fora da matriz.

#### Onda 4

- nao remover backend legado sem evidenciar que `SdrIaHub` e eventuais consumidores remanescentes ja sairam.

#### Onda 5

- nao promover `index.ts` a unico passo de corte se ainda existirem imports historicos nao auditados.

---

## 6. Critérios de GO / NO-GO

### GO para a proxima onda

Somente se todos os itens abaixo forem verdadeiros:

- o consumidor da onda atual nao depende mais do caminho legado;
- os testes de typecheck e de build passam;
- o contrato oficial usado na onda permanece funcional;
- nao existe consumo runtime ativo do caminho que sera cortado;
- rollback tecnico ainda e possivel sem perda de dados.

### NO-GO

Se qualquer um dos itens abaixo ocorrer:

- ainda existe tela ou fluxo dependente do backend legado;
- a migração gerou duplicidade entre API oficial e client legado;
- existe regressao funcional em criação, edicao ou leitura;
- os consumidores indiretos nao foram classificados;
- a validacao da onda nao fecha no ambiente de homologacao.

---

## 7. Plano de Rollback

Rollback deve ser sempre por onda, nunca por edit fragmentado.

### Rollback da Onda 1

- restaurar o uso do caminho anterior em `SdrIaHub`;
- validar que a criacao legada continua operando como estava;
- nao alterar backend.

### Rollback da Onda 2

- restaurar o repasse de `dataService` para o client legado;
- preservar o contrato funcional enquanto a migracao falhar.

### Rollback da Onda 3

- reabilitar temporariamente o client legado apenas se nao houver alternativa operacional;
- registrar a causa do retorno como bloqueador de corte.

### Rollback da Onda 4

- reativar as rotas legadas apenas se a migracao do consumidor nao estiver completa;
- isso e permitido somente como medida de contingencia temporaria.

### Rollback da Onda 5

- reintroduzir reexport ou alias somente se um consumer nao mapeado quebrar;
- isso exige reauditoria do grafo.

---

## 8. Validacoes Obrigatorias por Onda

### Validacoes tecnicas basicas

- `npx tsc --noEmit`
- build do frontend quando a onda tocar o frontend
- testes de integracao ou unitarios quando a onda tocar contratos

### Onda 1

- verificar que `SdrIaHub` nao chama mais `dataService.oportunidades.create`;
- verificar que a criacao usa somente API oficial;
- confirmar que nao houve duplicidade de gravação.

### Onda 2

- verificar que `dataService.ts` nao carrega mais opportunity por caminho legado;
- verificar que `src/api/modules/index.ts` nao promove mais surface legado como preferencial.

### Onda 3

- verificar que nao existe import funcional de `src/api/modules/oportunidades.api.ts`;
- verificar que `src/api/client.ts` nao e necessário para opportunity.

### Onda 4

- verificar que o backend moderno responde a todos os casos de uso vigentes;
- verificar que nao existe consumidor produtivo do backend legado.

### Onda 5

- verificar a ausencia de imports residuais;
- verificar que o barrel nao reintroduz o legado por conveniencia.

---

## 9. Risco de HML / Producao

### HML

Risco moderado:

- pode existir divergencia entre comportamento legado e contrato oficial;
- o fluxo do `SdrIaHub` costuma ser um caminho de criacao de oportunidade, entao qualquer quebra aparece cedo;
- se a migracao for parcial, HML pode mascarar duplicidade de chamadas.

Mitigacao:

- validar cada onda com build e typecheck;
- testar criacao, edicao e resposta do fluxo;
- evitar consolidar duas fontes de verdade durante a mesma janela.

### Producao

Risco alto se o backend legado for cortado antes do consumidor:

- criacao de oportunidade pode falhar no fluxo do SDR IA;
- o problema pode aparecer como erro de negocio, nao apenas erro de rede;
- o impacto e direto em receita e em captura de lead.

Mitigacao:

- nao remover backend legado antes da migracao completa de `SdrIaHub`;
- nao fazer corte simultaneo de frontend e backend;
- manter rollback da onda imediatamente disponivel.

---

## 10. Decisao Final

Decisao obrigatoria desta fase:

- **nao remover backend legado antes de migrar `SdrIaHub`**.

Implicacao pratica:

- `backend/server/src/index.ts` permanece em quarentena ate que o fluxo `SdrIaHub -> API oficial` esteja comprovadamente ativo em producao ou homologacao equivalente;
- qualquer corte do backend legado antes disso e considerado `NO-GO`.

---

## 11. Classificacao Final

| Arquivo | Classificacao |
|---|---|
| [`src/api/modules/opportunities.api.ts`](/C:/Projects/FINQZ_PRO/src/api/modules/opportunities.api.ts#L148) | `KEEP` |
| [`src/api/modules/pipelines.api.ts`](/C:/Projects/FINQZ_PRO/src/api/modules/pipelines.api.ts#L8) | `KEEP` |
| [`backend/src/modules/opportunities/**`](/C:/Projects/FINQZ_PRO/backend/src/modules/opportunities/routes.ts#L142) | `KEEP` |
| [`backend/src/modules/pipelines/**`](/C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L91) | `KEEP` |
| [`src/pages/SdrIaHub.tsx`](/C:/Projects/FINQZ_PRO/src/pages/SdrIaHub.tsx#L1013) | `MIGRATE` |
| [`src/api/dataService.ts`](/C:/Projects/FINQZ_PRO/src/api/dataService.ts#L103) | `QUARANTINE` |
| [`src/api/client.ts`](/C:/Projects/FINQZ_PRO/src/api/client.ts#L122) | `QUARANTINE` |
| [`backend/server/src/index.ts`](/C:/Projects/FINQZ_PRO/backend/server/src/index.ts#L1982) | `QUARANTINE` |
| [`src/api/modules/oportunidades.api.ts`](/C:/Projects/FINQZ_PRO/src/api/modules/oportunidades.api.ts#L36) | `REMOVE LATER` |
| [`src/api/modules/index.ts`](/C:/Projects/FINQZ_PRO/src/api/modules/index.ts#L8) | `QUARANTINE` |

---

## 12. Nenhuma Alteracao Runtime

Este documento nao altera:

- frontend;
- backend;
- dataService;
- api/client;
- backend/server;
- store;
- localStorage;
- endpoints;
- contratos de API.

Esta fase existe apenas para documentar a matriz de desativacao segura do legado de Opportunity.

