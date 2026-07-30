# EPC-W2-H - Legacy Removal Execution Checklist

## Resumo Executivo

Este checklist traduz o plano EPC-W2-G em uma sequencia executavel para remover o legado quarentenado com risco controlado. A decisao central permanece a mesma:

- remover primeiro os clientes legacy de Opportunity e Partners;
- ajustar o barrel `src/api/modules/index.ts` para manter apenas exports oficiais;
- deixar `backend/server/*` por ultimo, somente apos confirmar que nao existe dependencia externa, de deploy ou de VPS.

Os validadores tecnicos continuam verdes no momento desta preparacao:

- frontend build: OK
- frontend tests: OK
- backend build: OK
- backend tests: OK

## Checklist Pre-Corte

### 1. Confirmacoes de escopo

- [ ] Confirmar que `src/api/modules/oportunidades.api.ts` nao possui consumidores produtivos internos.
- [ ] Confirmar que `src/api/modules/parceiros.api.ts` nao possui consumidores produtivos internos.
- [ ] Confirmar que `src/api/modules/index.ts` e o unico barrel que precisa permanecer.
- [ ] Confirmar que `backend/server/*` nao esta em runtime oficial.
- [ ] Confirmar que nao existe dependencia de `backend/server` em VPS, scripts manuais, deploy, CI/CD ou docs operacionais ativos.

### 2. Preparacao de branch e commit

- [ ] Abrir branch dedicada para o corte.
- [ ] Planejar commits pequenos e rastreaveis.
- [ ] Separar o corte das APIs legacy do corte de `backend/server`.

### 3. Comunicacao previa

- [ ] Avisar frontend e backend sobre a janela de corte.
- [ ] Avisar DevOps/infra sobre a possibilidade de remover `backend/server`.
- [ ] Informar QA sobre a ordem de validacao.

## Checklist de Execucao

### Fase A - Remover APIs legacy primeiro

- [ ] Remover qualquer reexport legacy de `src/api/modules/index.ts`.
- [ ] Manter apenas exports oficiais no barrel.
- [ ] Remover `src/api/modules/oportunidades.api.ts`.
- [ ] Remover `src/api/modules/parceiros.api.ts`.
- [ ] Garantir que os consumidores oficiais continuem apontando para `opportunities.api.ts` e `partners.api.ts`.

### Fase B - Validar imediatamente apos o corte das APIs

- [ ] Rodar `npm run build`.
- [ ] Rodar `npm test`.
- [ ] Validar imports restantes com busca textual por `oportunidades.api` e `parceiros.api`.
- [ ] Confirmar que nenhum import produtivo voltou a apontar para os arquivos removidos.

### Fase C - Cortar `backend/server` por ultimo

- [ ] Confirmar ausencia de deploy externo.
- [ ] Confirmar ausencia de scripts VPS.
- [ ] Confirmar ausencia de uso em CI/CD.
- [ ] Confirmar que o runtime oficial nao depende de `backend/server`.
- [ ] Remover `backend/server/*` somente se todas as confirmacoes acima forem positivas.

## Checklist Pos-Corte

- [ ] Reexecutar `npm run build`.
- [ ] Reexecutar `npm test`.
- [ ] Reexecutar `cd backend && npm run build`.
- [ ] Reexecutar `cd backend && npm test`.
- [ ] Validar smoke tests dos fluxos:
  - [ ] Opportunity
  - [ ] Partners
  - [ ] SDR IA
  - [ ] jornada comercial
- [ ] Confirmar que `src/api/modules/index.ts` nao expõe mais simbolos legacy.
- [ ] Confirmar que `backend/server` nao aparece em docs operacionais ativas, scripts ou pipelines.

## Comandos de Validacao

Executar nesta ordem:

1. `npm run build`
2. `npm test`
3. `cd backend && npm run build`
4. `cd backend && npm test`

Validacoes complementares recomendadas:

- busca textual por `oportunidades.api`
- busca textual por `parceiros.api`
- busca textual por `backend/server`
- smoke test dos fluxos afetados

## Plano de Rollback

### Rollback do corte das APIs legacy

- reverter o commit que removeu `src/api/modules/oportunidades.api.ts`;
- reverter o commit que removeu `src/api/modules/parceiros.api.ts`;
- restaurar o barrel somente se necessario;
- manter os consumidores oficiais migados anteriormente.

### Rollback do corte de `backend/server`

- restaurar a pasta legacy a partir do ultimo commit aprovado;
- interromper qualquer deploy que ainda tente usar o runtime legado;
- registrar o consumidor externo que motivou a restauracao.

### Regra operacional de rollback

- rollback sempre em commit unico e rastreavel;
- nao reintroduzir legacy sem identificar o consumidor que quebrou.

## Riscos

- consumidor externo invisivel fora do source tree;
- docs antigas ou runbooks ainda instruindo o uso de `backend/server`;
- barrel legacy mascarando uso indireto;
- ambiente VPS/deploy antigo ainda apontando para o runtime legado;
- regressao por corte fora de ordem.

## Criterio de Pronto

O corte pode seguir para a execucao final quando:

- nao existem consumidores produtivos internos para as APIs legacy;
- `src/api/modules/index.ts` foi limpo dos reexports legacy;
- `backend/server` nao e usado em runtime oficial, CI/CD, deploy ou VPS;
- build e testes continuam verdes em frontend e backend;
- rollback esta pronto e documentado;
- a comunicacao com time tecnico e operacoes foi feita.

## Veredito Final

**GO WITH RESTRICTIONS**

O checklist esta completo e a execucao pode avancar para o EPC-W2-I desde que a remocao de `backend/server` permaneça por ultimo e somente apos a confirmacao final de ausencia de consumidores externos/deploy.
