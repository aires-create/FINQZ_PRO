# V1 FINAL HML RUNTIME SMOKE / DOC CLOSURE

Data: 2026-08-12
Repositorio: `C:\Projects\FINQZ_PRO_HML_PROMOTION`
Branch local: `promotion/hml-g18-full`
SHA final exato: `72218a6ce4e4301b50bf693b32986fd32e830684`
Escopo: fechamento documental do final HML runtime smoke

## 1. Executive Verdict

**PASS WITH RESTRICTIONS**

O smoke final consolidou as correcoes criticas de runtime, RBAC, navegacao e empacotamento frontend. Nao restam bloqueios P0/P1 para a decisao documental, mas continuam valendo restricoes de cobertura e de alcance descritas abaixo.

## 2. Previous Verdict

**FAIL**

Motivos historicos preservados:

- login HML nao estava operacional
- runtime de simulacao/evidence devolvia `500` com erro de serializacao
- HML fingerprint/commit/container evidence estava incompleto
- Commercial Tables ainda dependia da reconciliacao RBAC final

## 3. Final Proposed Verdict

**PASS WITH RESTRICTIONS**

Justificativa:

- login e sessao autenticada foram validados no smoke final
- o erro `FST_ERR_FAILED_ERROR_SERIALIZATION` foi resolvido e o runtime passou a devolver `401` limpo quando apropriado
- `sales:view` foi materializado como contrato canonico para Commercial Coverage / Commercial Tables
- `SALES_VIEW` foi preservado como legado/transicao
- a navegacao de Coverage foi exposta no menu de Operacoes sem alterar Estrutura Comercial ou Tabelas Comerciais
- o drift entre artifact frontend e nginx foi corrigido

## 4. P0 remaining

Nenhum P0 aberto foi mantido neste fechamento documental.

## 5. P1 remaining

Nenhum P1 bloqueador permanece para a decisao documental final.

Restricoes ainda vigentes:

- exaustive CRUD coverage gap
- cross-tenant adversarial gap
- exhaustive persistence/refresh gap
- navigation has multiple configuration sources
- Estrutura Comercial remains transitional/quarantined

## 6. P1 resolved

Resolvidos no smoke final:

- valid HML login/session
- Simulation Runtime/Evidence serialization `500`
- HML fingerprint evidence gap
- Commercial Tables `sales:view` reconciliation
- Commercial Coverage navigation exposure
- frontend/Nginx artifact drift

## 7. P2/P3 remaining

Permanecem apenas restricoes de cobertura e de alcance de smoke:

- CRUD completo nao reexecutado em todos os fluxos
- adversarial cross-tenant nao executado
- validacao profunda de persistencia/refresh nao reexecutada integralmente no encerramento

## 8. Final Runtime Evidence Matrix

| Area | Initial state | Remediation | Final evidence | Status | Severity |
|---|---|---|---|---|---|
| HML fingerprint | gap de evidencia | reconciliacao documental do fingerprint HML | fingerprint confirmado no final smoke | PASS | P2 |
| Login/Auth | login falho / sessao indisponivel | login valido e sessao autenticada | login/session validos no smoke final | PASS | P1 |
| Tenant context | nao comprovado | validacao com sessao autenticada | tenant context validado na sessao | PASS COM RESTRICOES | P2 |
| RBAC | Commercial Tables sem reconciliacao final | `sales:view` materializado e legado preservado | `sales:view` habilitou Commercial Tables | PASS | P1 |
| CRM | leitura autenticada nao comprovada | validacao com auth | leitura autenticada observada | PASS COM RESTRICOES | P2 |
| Pipeline | leitura autenticada nao comprovada | validacao com auth | leitura autenticada observada | PASS COM RESTRICOES | P2 |
| Opportunity | leitura autenticada nao comprovada | validacao com auth | leitura autenticada observada | PASS COM RESTRICOES | P2 |
| Master Catalog | leitura autenticada nao comprovada | validacao com auth | leitura autenticada observada | PASS COM RESTRICOES | P2 |
| Coverage | navegacao incompleta | exposicao no menu de Operacoes | visible in Operacoes menu, `/app/operacoes/commercial-coverage`, `tree?status=ACTIVE = HTTP 200`, `6 Segmentos`, `5 Produtos`, `5 Subprodutos`, `10 Modalidades` | PASS | P1 |
| Commercial Tables | sem 2xx autenticado | login fresco com RBAC reconciliado | `200` apos login fresco com `sales:view` | PASS | P1 |
| Simulation Runtime | `500` historico por serializacao | alinhamento do contrato global de erro / serializer | chamadas sem auth passaram a `401` limpo | PASS WITH RESTRICOES | P1 |
| Simulation Evidence | `500` historico por serializacao | alinhamento do contrato global de erro / serializer | chamadas sem auth passaram a `401` limpo | PASS WITH RESTRICOES | P1 |
| Partner Acquisition | nao consolidado no fecho anterior | smoke final de leitura | `200` observado | PASS | P2 |
| Partners | nao consolidado no fecho anterior | smoke final de leitura | `200` observado | PASS | P2 |
| Frontend artifact alignment | drift entre host e nginx | recreate somente do nginx | `HOST=assets/index-BLObncGE.js`, `NGINX=assets/index-BLObncGE.js`, `PUBLIC=assets/index-BLObncGE.js` | PASS | P1 |
| Nginx | artifact desalinhado | recreate somente do nginx | `HOME=200`, `LOGIN=200`, `HEALTH=200`, `API=healthy`, `NGINX=healthy` | PASS | P1 |
| API health | baseline incompleto | validacao final de endpoints publicos | `/health`, `/login`, `/` `200` | PASS | P1 |

## 9. Simulation Resolution

O runtime de simulacao que antes produzia `500` com `FST_ERR_FAILED_ERROR_SERIALIZATION` foi estabilizado.

Resultado final:

- erro de serializacao resolvido por alinhamento do contrato global de erro / serializer
- chamadas sem auth passaram a terminar como `401` limpo
- o comportamento esperado para negacao de acesso ficou consistente com o gateway de autenticacao
- o incidente historico permanece documentado como `500` antes da correcao final

## 10. RBAC / Commercial Tables Resolution

Consolidacao final:

- `sales:view` e o contrato canonico para Commercial Coverage / Commercial Tables
- `SALES_VIEW` permaneceu preservado como compatibilidade legado/transicao
- `ROLE_ADMIN_SISTEMA` nao foi inflado artificialmente
- `ROLE_CEO` permaneceu autorizado conforme a evidencia documentada
- Commercial Tables passou a responder `200` no smoke final apos login fresco

## 11. Coverage Navigation Resolution

Resolvido:

- Commercial Coverage ja funcionava por URL direta e runtime
- a remediacao de navegacao foi aplicada no commit `72218a6ce4e4301b50bf693b32986fd32e830684`
- a mudanca afetou somente `src/layouts/MainLayout.tsx`
- Coverage passou a aparecer no menu de Operacoes
- a rota visivel e `/app/operacoes/commercial-coverage`
- o endpoint de arvore `tree?status=ACTIVE` retornou `200`
- o conteudo final observado inclui `6 Segmentos`, `5 Produtos`, `5 Subprodutos` e `10 Modalidades`

Preservado:

- Estrutura Comercial nao foi removida
- Tabelas Comerciais nao foi removida
- a transicao continua visivel e controlada

## 12. Frontend Artifact / Nginx Resolution

Foi identificado drift entre o artifact do host `dist` e o bundle servido pelo container Nginx.

Antes do Nginx recreate:

- `HOST=assets/index-BLObncGE.js`
- `NGINX=assets/index-jbTbSzIG.js`
- `PUBLIC=assets/index-jbTbSzIG.js`

Bind mount:

- `/opt/finqz/FINQZ_PRO/dist -> /usr/share/nginx/html`

Root cause:

- `dist` directory was replaced by rename/move while the running Nginx container retained the bind mount to the previous directory inode.

Remediation:

- recreate ONLY nginx using `/opt/finqz/FINQZ_PRO/backend/docker-compose.yml`

Final:

- `HOST=assets/index-BLObncGE.js`
- `NGINX=assets/index-BLObncGE.js`
- `PUBLIC=assets/index-BLObncGE.js`
- `HOME=200`
- `LOGIN=200`
- `HEALTH=200`
- `API=healthy`
- `NGINX=healthy`

## 13. Git / HML Alignment

Document-writing phase:

- no code change
- no backend change
- no DB mutation
- no HML mutation
- no deploy

Pre-commit review phase:

- git add WAS executed only for `docs/audits/golive/V1_FINAL_HML_RUNTIME_SMOKE.md`
- no git commit
- no git push

## 14. Remaining Restrictions

Mesmo com o fechamento positivo, continuam valendo:

- exhaustive CRUD coverage gap
- cross-tenant adversarial gap
- exhaustive persistence/refresh gap
- navigation has multiple configuration sources
- Estrutura Comercial remains transitional/quarantined
- esta e uma conclusao documental de smoke, nao uma certificacao absoluta de todos os caminhos possiveis

## 15. Documentation conflicts found

Nenhum conflito documental novo foi introduzido neste fechamento.

Leitura final:

- os failures historicos foram mantidos por rastreabilidade
- as resolucoes finais ficaram coerentes com a SSOT arquitetural e com o runtime observado
- as restricoes remanescentes sao de cobertura, nao de contradicao

## 16. Target file modified

Arquivo alvo unico desta wave documental:

- `docs/audits/golive/V1_FINAL_HML_RUNTIME_SMOKE.md`

## 17. Other files modified

Nenhum outro arquivo foi modificado nesta wave.

## 18. `git diff --check` result

A ser verificado pelo comando final.

## 19. `git diff --stat`

A ser verificado pelo comando final.

## 20. `git status --short`

A ser verificado pelo comando final.

## 21. Explicit confirmation

Confirmacao explicita:

- nenhum codigo foi alterado nesta wave documental
- nenhum backend foi alterado nesta wave documental
- nenhuma escrita em DB foi executada
- nenhum HML foi alterado
- nenhum deploy foi executado
- nenhum `git commit` ou `git push` foi executado

## 22. Recommendation

**PASS WITH RESTRICTIONS**

Observacao:

- o resultado e positivo, mas permanece com restricoes explicitadas no item 14
