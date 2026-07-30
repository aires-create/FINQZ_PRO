# IWP-EPC-W1-04 - Routes

## 1. Objetivo

Organizar a leitura de rotas frontend para que o menu consolidado aponte para caminhos canônicos e os aliases permaneçam apenas como compatibilidade invisível.

## 2. Escopo permitido

- Reorganização de rotas frontend.
- Redirecionamentos técnicos.
- Consolidação de aliases.
- Alinhamento entre route groups e menu groups.

## 3. Escopo proibido

- Backend.
- APIs.
- Contratos.
- RBAC.
- Banco.
- Prisma.
- Servicos.
- Regras de negocio.
- Testes.

## 4. Arquivos candidatos

- [src/routes/crm.routes.tsx](/C:/Projects/FINQZ_PRO/src/routes/crm.routes.tsx)
- [src/routes/operacoes.routes.tsx](/C:/Projects/FINQZ_PRO/src/routes/operacoes.routes.tsx)
- [src/routes/admin.routes.tsx](/C:/Projects/FINQZ_PRO/src/routes/admin.routes.tsx)
- [src/routes/hub.routes.tsx](/C:/Projects/FINQZ_PRO/src/routes/hub.routes.tsx)
- [src/routes/integrations.routes.tsx](/C:/Projects/FINQZ_PRO/src/routes/integrations.routes.tsx)

## 5. Ordem de execução

1. Mapear rotas canônicas e aliases existentes.
2. Definir quais aliases permanecem como redirect.
3. Consolidar rotas por dominio.
4. Validar consistencia com sidebar e breadcrumbs.
5. Documentar rotas REMOVE e FUTURE.

## 6. Checklist de implementação

- [ ] Rotas canônicas estao consistentes com o menu final.
- [ ] Rotas legadas continuam funcionando via redirect.
- [ ] Não ha rotas exibidas sem correspondente de menu.
- [ ] Não ha menu sem rota coerente.
- [ ] Rotas FUTURE nao parecem prontas para uso primario.

## 7. Checklist de validação

- [ ] Rota principal de cada dominio abre corretamente.
- [ ] Redirecionamento legado cai na rota canonica.
- [ ] Nenhuma rota canônica foi removida por engano.
- [ ] A navegacao profunda segue o contexto esperado.

## 8. Critérios de rollback

- Restaurar a tabela de aliases anterior.
- Reexpor rotas legadas se necessário para estabilidade.
- Não mexer em backend ou contratos.

## 9. Riscos

- Alias removido pode afetar links salvos.
- Redirecionamentos excessivos podem confundir se o menu não estiver coeso.
- Algumas páginas podem parecer “perdidas” se o breadcrumb não acompanhar.

## 10. Veredito final

**PARTIAL**
