# EPC-W2-E Legacy Consumer Migration

Base oficial:
- [docs/04-plans/EPC-W2-D-ARCHITECTURE-HARDENING.md](EPC-W2-D-ARCHITECTURE-HARDENING.md)

## Objetivo

Migrar os consumidores legados conhecidos para os módulos oficiais, sem remover legacy ainda e sem alterar regras de negocio.

## Arquivos alterados

- [src/api/client.ts](../../src/api/client.ts)
- [src/pages/SdrIaHub.tsx](../../src/pages/SdrIaHub.tsx)

## Consumidores migrados

### 1. `src/api/client.ts`
- antes: `./modules/oportunidades.api`
- depois: `./modules/opportunities.api`
- `partnersApi` permaneceu oficial em `./modules/partners.api`

### 2. `src/pages/SdrIaHub.tsx`
- antes: `../api/modules/oportunidades.api`
- depois: `../api/modules/opportunities.api`

## Confirmacoes oficiais

- `src/pages/Oportunidades.tsx` ja usa `opportunitiesApi` oficial.
- `src/pages/Parceiros.tsx` ja usa `partnersApi` oficial.

## Consumidores legacy remanescentes

### Encontrados no source tree produtivo
- nenhum import produtivo novo de `oportunidades.api` legacy foi encontrado apos a migracao.
- nenhum import produtivo novo de `parceiros.api` legacy foi encontrado apos a migracao.

### Remanescentes legados ainda existentes, mas sem consumer produtivo novo
- `src/api/modules/oportunidades.api.ts`
- `src/api/modules/parceiros.api.ts`
- `backend/server/*`

## Riscos

1. `backend/server` continua presente como runtime legacy/quarentenada.
2. Wrappers legacy continuam no repositório ate a fase de corte definitivo.
3. Consumidores fora do source tree auditado podem existir em processos externos, documentacao ou scripts antigos.
4. O contrato legado ainda pode ser referenciado por superficies nao produtivas ou ambientes de compatibilidade.

## Validacoes executadas

- `npm run build` no frontend: OK
- `npm test` no frontend: OK
- `cd backend && npm run build`: OK
- `cd backend && npm run test`: OK

## Criterio de pronto

Considera-se esta etapa pronta quando:
- os consumidores legados conhecidos foram migrados;
- os imports produtivos legacy zeraram no `src`;
- build e testes seguem verdes;
- legacy ainda nao foi removido, apenas isolado.

## Veredito final

**GO WITH RESTRICTIONS**

Motivo:
- a migracao dos consumidores conhecidos foi concluida com sucesso;
- o legado permanece no repositório por estrategia de quarentena;
- a proxima fase so deve remover wrappers legacy apos verificacao final de ausencia de consumidores externos.
