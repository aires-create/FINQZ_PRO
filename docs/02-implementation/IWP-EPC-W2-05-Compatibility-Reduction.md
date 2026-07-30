# IWP-EPC-W2-05 - Compatibility Reduction

## 1. Objetivo

Reduzir a superficie de compatibilidade do EPC-W2 sem quebrar consumidores remanescentes, removendo ruido historico onde houver evidencia segura de consolidacao.

## 2. Escopo permitido

- `api/client.ts`.
- Facades e adaptadores com consumidor ativo.
- Labels e sinais de compatibilidade residuais.
- Alias tecnicos e redirecionamentos nao funcionais.

## 3. Escopo proibido

- Backend.
- APIs canonicas.
- Contratos.
- RBAC.
- Banco.
- Prisma.
- Servicos.
- Regras de negocio.
- Testes.
- Remocao prematura de compatibilidade ainda usada.

## 4. Arquivos candidatos

- [src/api/client.ts](/C:/Projects/FINQZ_PRO/src/api/client.ts)
- [src/api/http.ts](/C:/Projects/FINQZ_PRO/src/api/http.ts)
- [src/routes/crm.routes.tsx](/C:/Projects/FINQZ_PRO/src/routes/crm.routes.tsx)
- [src/routes/operacoes.routes.tsx](/C:/Projects/FINQZ_PRO/src/routes/operacoes.routes.tsx)
- [src/routes/admin.routes.tsx](/C:/Projects/FINQZ_PRO/src/routes/admin.routes.tsx)
- [src/routes/hub.routes.tsx](/C:/Projects/FINQZ_PRO/src/routes/hub.routes.tsx)
- [src/store/index.ts](/C:/Projects/FINQZ_PRO/src/store/index.ts)

## 5. Ordem de execucao

1. Mapear compat layers com consumidor real.
2. Separar o que e apenas transicao do que ainda e necessario.
3. Reduzir ruído sem eliminar caminhos de retorno.
4. Manter bookmarks e acesso legado enquanto necessario.

## 6. Checklist de implementacao

- [ ] Compat layers sao inventariadas.
- [ ] Nenhum alias necessario e removido cedo demais.
- [ ] Facades legadas deixam de ser promovidas como runtime canonico.
- [ ] A navegacao continua previsivel.
- [ ] O frontend nao passa a ser owner de negocio.

## 7. Checklist de validacao

- [ ] Nenhum consumidor principal quebra.
- [ ] Build passa.
- [ ] Testes passam.
- [ ] Links antigos continuam acessiveis por redirect.
- [ ] A manutencao do legado fica transparente.

## 8. Critérios de rollback

- Reverter qualquer remoção que afete consumidor ativo.
- Restaurar alias ou facade se necessario.
- Manter o DCA e o PRP como referencia de retorno.

## 9. Riscos

- Quebra de bookmark ou integracao secundária.
- Remocao de layer ainda util por dependencia nao mapeada.
- Acoplamento historico oculto em consumers antigos.

## 10. Veredito

**PARTIAL**
