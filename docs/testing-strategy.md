# FINQZ PRO Testing Strategy

Este documento descreve a infraestrutura de testes enterprise do backend FINQZ PRO.
A fase 2.8 padroniza Vitest como runner unico do backend e prepara a base para testes unitarios, integracao, E2E e contract testing.

## Stack

- Runner: Vitest.
- Ambiente: Node.
- Coverage: V8 via `@vitest/coverage-v8`.
- API integration: Fastify `app.inject()`.
- Prisma: cliente real preservado; testes que dependem de banco devem usar ambiente isolado e banco dedicado.

## Estrutura

```text
backend/
  vitest.config.ts
  src/tests/
    setup.ts
    unit/
    integration/
```

`src/tests/setup.ts` configura variaveis efemeras para `NODE_ENV=test`, banco de teste, Redis local, JWT secrets de teste, CORS e log isolado. Isso evita dependencia de `.env` local e impede que testes usem configuracao de runtime por acidente.

## Scripts

```bash
npm run test
npm run test:unit
npm run test:integration
npm run test:coverage
```

## Politica de Isolamento

- Testes unitarios ficam em `src/tests/unit`.
- Testes de integracao ficam em `src/tests/integration`.
- O build TypeScript exclui `src/tests`, mantendo o artefato `dist` livre de codigo de teste.
- Testes de integracao HTTP devem usar `createApp()` e `app.inject()`, fechando a instancia Fastify ao final de cada caso.
- Testes que precisarem de Prisma devem usar banco dedicado, migrations controladas e limpeza transacional ou truncation por suite.
- Mocks devem ser usados apenas em fronteiras explicitas e reutilizaveis; nao criar mocks ad hoc para esconder dependencia real.

## Coverage

O coverage usa provider V8 e gera:

- `text`
- `json-summary`
- `html`

Os relatorios ficam em `backend/coverage`, ja ignorado pelo Git.

## E2E Futuro

A automacao E2E deve nascer separada da camada backend unit/integration, preferencialmente em um workspace dedicado, por exemplo:

```text
tests/e2e/
tests/contracts/
```

Diretrizes:

- E2E deve subir ambiente controlado de staging/local com dados sem seed sensivel.
- Contract testing deve versionar contratos de API e validar compatibilidade entre frontend e backend.
- Deploy gates devem depender primeiro de unit/integration, depois contract, depois E2E smoke.
- Nunca usar credenciais reais em fixtures ou snapshots.

## CI/CD

O workflow de CI executa `npm test` no backend. Os scripts especificos (`test:unit`, `test:integration`, `test:coverage`) estao prontos para serem promovidos a jobs separados conforme a suite crescer.
