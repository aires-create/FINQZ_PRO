# EPC-W2-C P0 Implementation - Legacy Quarantine

Base:
- [docs/03-audits/EPC-W2-AUDIT.md](../03-audits/EPC-W2-AUDIT.md)
- [docs/04-plans/EPC-W2-B-EXECUTION-PLAN.md](EPC-W2-B-EXECUTION-PLAN.md)

## Objetivo

Executar apenas os itens P0 do EPC-W2 com foco em quarentena tecnica do legado, sem remover arquivos, sem criar novas APIs e sem alterar comportamento funcional.

## Status da Execucao

Implementado nesta etapa:
- marcação documental e tecnica de quarentena para runtime legacy;
- marcação documental e tecnica de quarentena para wrappers legacy de API;
- confirmação de consumidores conhecidos;
- preservação do contrato oficial em `/api/v1/*`;
- preservação de build e testes.

Nao implementado nesta etapa:
- remocao de arquivos;
- refatoracao de telas;
- mudanca de banco;
- mudanca de regras de negocio;
- migracao P1/P2;
- criacao de novas APIs.

---

## 1. Quarentena do `backend/server`

### Decisao
- `backend/server` permanece no repositorio como runtime legacy/quarentenada.
- Nao deve receber novos consumidores.
- Nao deve ser tratada como runtime principal do produto.

### Arquivos impactados
- `backend/server/package.json`
- `backend/server/src/index.ts`
- `backend/server/src/defs/index.ts`

### Evidencias de legacy
- runtime EdgeSpark ainda existe em `backend/server/src/index.ts`;
- definicoes de schema continuam em `backend/server/src/defs/index.ts`;
- `package.json` ainda identifica a runtime como template legado.

### Risco remanescente
- consumidores fora do grep atual podem ainda depender da runtime legacy.

---

## 2. APIs duplicadas protegidas

### Contrato oficial
- `src/api/modules/opportunities.api.ts`
- `src/api/modules/partners.api.ts`

### Wrappers legacy quarentenados
- `src/api/modules/oportunidades.api.ts`
- `src/api/modules/parceiros.api.ts`

### Marcações aplicadas
- os wrappers legacy foram marcados como `LEGACY / QUARANTINED`;
- a indicacao explicitamente orienta novos consumidores para `/api/v1/*`.

### Regra de governance
- nao adicionar novos imports de `oportunidades.api.ts` ou `parceiros.api.ts`.

---

## 3. Consumidores encontrados

### Oportunidades legacy
- `src/api/client.ts`
  - importa `oportunidadesApi` de `./modules/oportunidades.api`
- `src/pages/SdrIaHub.tsx`
  - importa `oportunidadesApi` de `../api/modules/oportunidades.api`

### Partners official
- `src/api/client.ts`
  - importa `partnersApi` de `./modules/partners.api`

### Observacao
- `src/pages/Oportunidades.tsx` usa `opportunitiesApi` oficial.

---

## 4. Escopo de quarentena aplicado

### Marcacao sem impacto funcional
- `src/api/modules/oportunidades.api.ts`
- `src/api/modules/parceiros.api.ts`
- `backend/server/src/index.ts`
- `backend/server/src/defs/index.ts`
- `backend/server/package.json`

### O que foi preservado
- rotas existentes;
- contratos existentes;
- comportamento de telas;
- build;
- testes.

---

## 5. Riscos remanescentes

1. Consumidores fora do grep podem existir.
2. `src/api/client.ts` ainda referencia wrappers legados.
3. `SdrIaHub` ainda depende do modulo legado de oportunidades.
4. `backend/server` ainda pode ser usado por processos externos, scripts ou documentacao historica.
5. O backend oficial e o legacy continuam coexistindo ate a remocao futura.

---

## 6. Validacoes executadas

### Frontend
- `npm run build` - OK
- `npm test` - OK

### Backend
- `cd backend && npm run build` - OK
- `cd backend && npm run test` - OK

---

## 7. Critério de pronto

P0 esta pronto quando:
- a quarentena do legado esta documentada e marcada no codigo;
- os consumidores conhecidos estao mapeados;
- o contrato oficial permanece em `/api/v1/*`;
- build e testes seguem verdes;
- nao ha remocao prematura de legado.

---

## 8. Veredito

**GO WITH RESTRICTIONS**

Motivo:
- a quarentena foi iniciada com baixo risco;
- ainda existem consumidores legados conhecidos;
- a remocao do legado continua bloqueada ate concluir migracao e validacao adicional.
