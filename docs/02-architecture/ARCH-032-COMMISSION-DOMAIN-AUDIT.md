# ARCH-032 - Commission Domain Audit

## 1. Objetivo

Registrar a auditoria arquitetural do dominio `Commission` atual no FINQZ PRO, com foco em identificar o estado real do modulo existente, suas limitacoes e a decisao correta para evolucao futura.

O objetivo deste documento nao e implementar `Commission V2`, nem adaptar o runtime existente. O objetivo e classificar corretamente o que foi encontrado e evitar que o modulo atual seja tratado como base oficial para a proxima geracao do dominio.

## 2. Escopo

Este documento cobre apenas a auditoria conceitual do modulo `commissions` existente.

Inclui:

- classificacao do modulo atual;
- evidencias encontradas no codigo;
- riscos arquiteturais;
- relacao com `ADR-008`;
- relacao com `Operation`;
- relacao com `Settlement`;
- decisao arquitetural consolidada;
- proxima fase recomendada.

Nao inclui:

- qualquer implementacao de runtime;
- qualquer alteracao de schema;
- qualquer migration;
- qualquer endpoint novo;
- qualquer service, handler ou repository novo;
- qualquer adaptacao de Express para Fastify;
- qualquer criacao de `Commission V2`;
- qualquer alteracao de `Settlement` ou `Payment`.

## 3. Evidencias encontradas

Foi identificado no repositrio `backend/src/modules/commissions/routes.ts` um modulo baseado em `Express Router` com respostas placeholder.

### Evidencias objetivas

- existe `Router` importado de `express`;
- o `GET /api/v1/commissions` retorna mensagem de prontidao e `data: []`;
- o `GET /api/v1/commissions/:id` retorna mensagem de prontidao e um objeto com `id`;
- o `POST /api/v1/commissions` retorna mensagem de prontidao e `id: 'new-commission-id'`;
- a resposta de listagem e propositalmente vazia;
- nao ha indicio, neste arquivo, de integracao com stack oficial `Fastify` ou de contrato arquitetural consolidado de `Commission`.

### Leitura arquitetural

O modulo atual e um esqueleto de rota, nao um dominio estabilizado.

## 4. Classificacao do modulo atual

O modulo `backend/src/modules/commissions` deve ser classificado como:

```text
legado / placeholder
```

### Motivos da classificacao

- usa `Express Router`, enquanto a stack oficial do FINQZ PRO e `Fastify`;
- expõe respostas artificiais de prontidao;
- nao demonstra contrato de dominio consolidado;
- nao evidencia fonte de verdade, lifecycle, RBAC backend-driven ou auditabilidade robusta;
- nao deve ser interpretado como base oficial para evolucao de `Commission V2`.

### Regra

O fato de existir uma pasta, uma rota ou uma resposta placeholder nao significa que o dominio de `Commission` esteja arquiteturalmente aprovado.

## 5. Riscos arquiteturais

Manter o modulo atual como se fosse base oficial cria riscos relevantes.

### Riscos principais

- perpetuar uma superficie Express fora da stack oficial;
- confundir placeholder com contrato de negocio;
- consolidar resposta fake como se fosse fonte de verdade;
- criar dependencia de uma estrutura que nao reflete Fastify, Prisma e RBAC backend-driven;
- atrasar o desenho correto de `Commission V2`;
- misturar evolucao do dominio com adaptacao tecnica improvisada;
- dificultar auditabilidade e consistencia futura com `Operation` e `Settlement`.

### Risco estrutural

O maior risco e tratar o modulo atual como ponto de partida tecnico, quando ele ainda nao oferece contrato de dominio confiavel.

## 6. Relacao com ADR-008

`ADR-008 - Revenue Distribution Engine` continua sendo a referencia arquitetural para a evolucao futura do dominio de comissionamento.

### Leitura oficial

- `ADR-008` define a direcao conceitual de distribuicao financeira;
- `Commission` e um componente do ecossistema de distribuicao, nao um atalho isolado;
- qualquer evolucao futura deve continuar coerente com a separacao entre origem financeira, distribuicao e liquidacao;
- `Commission V2` deve ser desenhada em blueprint proprio antes de qualquer implementacao.

### Regra

O modulo atual nao substitui `ADR-008` e nao pode ser usado como evidência de que a estrategia de comissionamento ja esta fechada.

## 7. Relacao com Operation

`Operation` permanece como a raiz financeira e de execucao que antecede o dominio de `Commission`.

### Regras oficiais

- `Commission` continua sendo derivada de `Operation` elegivel e validada;
- `Operation` nao deve ser substituida por `Commission`;
- `Commission` nao deve virar origem da execucao financeira;
- o contrato de `Commission` deve continuar rastreavel ao contexto de `Operation`.

### Leitura arquitetural

O caminho correto de evolucao continua sendo:

```text
Operation -> Commission
```

e nao o inverso.

## 8. Relacao com Settlement

`Commission` e `Settlement` continuam separados.

### Regras oficiais

- `Commission` nao e `Settlement`;
- `Settlement` nao deve ser usado para mascarar lacunas do modulo atual de `Commission`;
- `Commission` deve continuar sendo a base financeira anterior a liquidacao;
- `Settlement` representa uma camada posterior e distinta;
- a evolucao de `Commission` nao deve acoplar indevidamente pagamento ou liquidacao.

### Leitura arquitetural

Mesmo que o modulo atual esteja vazio ou placeholder, a separacao entre comissao e liquidacao deve ser preservada.

## 9. Decisao arquitetural

### Decisao oficial

O modulo `commissions` atual deve ser classificado como legado / placeholder e nao deve ser utilizado como base para `Commission V2`.

### Consequencias

- nao adaptar Express para Fastify agora;
- nao reaproveitar o placeholder como contrato oficial;
- nao criar endpoint novo neste escopo;
- nao iniciar runtime novo baseado nesse modulo;
- nao misturar a auditoria do legado com a definicao do futuro dominio.

### Regra de ouro

Se a necessidade e evolucao oficial de `Commission`, o caminho correto e desenhar um blueprint proprio para `Commission V2` antes de implementar qualquer runtime.

## 10. Proxima fase recomendada

### Fase sugerida

`Commission V2 Blueprint`

### Objetivo da fase

Definir, em documento proprio:

- bounded context de `Commission V2`;
- source of truth;
- relacao com `Operation`;
- relacao com `Settlement`;
- estrategia de leitura e escrita;
- RBAC;
- auditoria;
- contratos de integracao com o motor de distribuicao.

### Regra

Nao deve haver implementacao enquanto o blueprint de `Commission V2` nao estiver formalmente aprovado.
