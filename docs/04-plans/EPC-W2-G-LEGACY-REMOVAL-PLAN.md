# EPC-W2-G - Legacy Removal Plan

## Resumo Executivo

A sequencia de audios EPC-W2 confirmou que o FINQZ PRO ja nao depende produtivamente dos modulos legacy de Opportunity e Partners no fluxo interno principal. Os imports ativos migraram para os modulos oficiais, o build e os testes continuam verdes, e `backend/server` nao aparece nos scripts oficiais de runtime, build, CI/CD ou release.

Mesmo assim, ainda existe risco residual por tres motivos:

1. o barrel `src/api/modules/index.ts` continua reexportando modulos legacy;
2. a documentacao historica ainda cita `backend/server` e as APIs antigas;
3. consumidores externos fora do repositorio nao podem ser descartados apenas com grep local.

Conclusao: o corte definitivo e viavel, mas deve ser executado em ondas e com rollback preparado. O plano abaixo trata o legado como removivel, mas preserva a ordem mais segura de corte.

## Arquivos Candidatos a Remocao

| Arquivo / Area | Status Atual | Risco | Recomendacao |
|---|---|---:|---|
| `src/api/modules/oportunidades.api.ts` | legacy/quarentena | Medio | remover apos retirar qualquer dependência indireta do barrel |
| `src/api/modules/parceiros.api.ts` | legacy/quarentena | Medio | remover apos retirar qualquer dependência indireta do barrel |
| `src/api/modules/index.ts` | barrel de compatibilidade | Baixo/medio | manter o barrel, mas remover os reexports legacy |
| `backend/server/*` | runtime legacy/quarentenado | Medio/alto | remover somente apos validar ausencia de consumidores externos/deploy |

## Decisao Recomendada por Arquivo

### 1) `src/api/modules/oportunidades.api.ts`

**Decisao recomendada:** remover.

**Justificativa:**

- nao existem consumidores produtivos internos conhecidos;
- o contrato oficial ja vive em `src/api/modules/opportunities.api.ts`;
- manter o arquivo sem consumidores apenas prolonga a superficie legacy.

**Estratégia:**

- primeiro retirar qualquer reexport legacy do barrel;
- depois eliminar o arquivo legacy;
- se uma dependencia externa inesperada surgir, usar rollback do commit e nao um stub permanente.

### 2) `src/api/modules/parceiros.api.ts`

**Decisao recomendada:** remover.

**Justificativa:**

- nao existem consumidores produtivos internos conhecidos;
- o contrato oficial ja vive em `src/api/modules/partners.api.ts`;
- o barrel atual ainda permite compatibilidade desnecessaria.

**Estratégia:**

- remover reexports legacy do barrel;
- apagar o arquivo legacy;
- bloquear qualquer novo import antigo por lint/review.

### 3) `src/api/modules/index.ts`

**Decisao recomendada:** manter o arquivo, remover os reexports legacy.

**Justificativa:**

- o barrel ainda serve como ponto de entrada legitimo para modulos oficiais;
- apagar o barrel agora forca uma migração mais ampla do que o necessario;
- o risco real esta nos reexports antigos, nao no barrel em si.

**Estratégia:**

- preservar exports oficiais;
- remover apenas:
  - `export * from './oportunidades.api';`
  - `export * from './parceiros.api';`
- manter o restante do barrel sem alterar comportamento dos consumidores oficiais.

### 4) `backend/server/*`

**Decisao recomendada:** remover em ultimo lugar, apos confirmacao final de ausencia de consumidores externos/deploy.

**Justificativa:**

- nao aparece em scripts oficiais de runtime/build/CI/CD/release;
- ainda pode existir uso externo fora do source tree;
- o impacto de remoção e maior que o das APIs legacy do frontend.

**Estratégia:**

- primeiro garantir que nao existe dependencia em:
  - VPS;
  - scripts manuais;
  - docs operacionais antigos;
  - pipelines externos;
  - runners auxiliares.
- depois remover o runtime legacy inteiro em um unico corte;
- se houver necessidade de rastreabilidade, mover apenas a documentacao historica para `docs/archive`, nao o runtime.

## Riscos

1. **Consumidor externo invisivel**
   - algum script, integracao ou deploy manual pode ainda importar os nomes legacy.

2. **Dependencia indireta via barrel**
   - `src/api/modules/index.ts` ainda expõe reexports legacy e pode mascarar uso indireto.

3. **Risco documental**
   - a existencia de docs antigas citando `backend/server` pode induzir reuso indevido.

4. **Risco operacional em VPS/deploy**
   - um ambiente fora do repositorio pode continuar usando o runtime legacy sem aparecer na busca local.

## Validacoes Antes do Corte

1. Confirmar que nao existem imports produtivos de:
   - `src/api/modules/oportunidades.api.ts`
   - `src/api/modules/parceiros.api.ts`
2. Confirmar que nenhum consumidor usa `backend/server` como runtime oficial.
3. Confirmar que o barrel `src/api/modules/index.ts` pode perder os reexports legacy sem quebrar importadores oficiais.
4. Revisar docs operacionais, runbooks e instrucoes de deploy.
5. Checar docker, VPS, CI/CD e scripts de inicio.
6. Separar rollback de front e backend em commits pequenos.

## Validacoes Depois do Corte

1. `npm run build`
2. `npm test`
3. `cd backend && npm run build`
4. `cd backend && npm test`
5. Smoke tests dos fluxos:
   - Opportunity
   - Parceiros
   - SDR IA
   - jornada comercial
6. Validar que nenhum import legado voltou por caminho indireto.
7. Revalidar que `backend/server` nao aparece em:
   - scripts;
   - CI/CD;
   - release;
   - docker/deploy;
   - README e docs operacionais.

## Plano de Rollback

### Rollback do corte das APIs legacy

- reverter o commit que removeu os reexports legacy e os arquivos `oportunidades.api.ts` / `parceiros.api.ts`;
- restaurar apenas os arquivos removidos;
- manter a migracao de consumidores oficiais feita anteriormente.

### Rollback do corte de `backend/server`

- restaurar a pasta legacy a partir do ultimo commit aprovado;
- revalidar build/testes frontend e backend;
- interromper qualquer deploy que ainda aponte para o runtime legado ate identificar a dependencia faltante.

### Regra de rollback

- rollback deve ser feito por commit unico e rastreavel;
- nunca reintroduzir legado sem registrar o consumidor que motivou o retorno.

## Checklist de Comunicacao

1. Avisar que o corte remove compatibilidade legacy antiga.
2. Informar a ordem de corte:
   - barrel legacy;
   - APIs legacy;
   - `backend/server`.
3. Notificar frontend, backend e DevOps antes da janela de corte.
4. Registrar o que muda para QA e para o time de release.
5. Documentar qualquer consumidor externo encontrado antes do merge final.

## Criterio de Pronto

O corte e considerado pronto quando:

- nenhum consumidor produtivo interno usa os modulos legacy;
- o barrel nao reexporta mais os simbolos legacy;
- `backend/server` nao aparece em runtime oficial, CI/CD, deploy ou scripts;
- build e testes continuam verdes em frontend e backend;
- rollback esta documentado e testado.

## Veredito Final

**GO WITH RESTRICTIONS**

Motivo: o risco interno esta controlado, mas ainda ha dependencia de confirmacao externa e de alinhamento do barrel de compatibilidade. O corte e seguro como proxima fase, desde que seja executado na ordem proposta e sem pular a etapa de validacao de deploy/externos.
