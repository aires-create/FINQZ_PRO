# IWP-EPC-W1-03 - Breadcrumbs

## 1. Objetivo

Padronizar breadcrumbs e titulos de contexto para refletir a rota canonica final e reduzir resquícios de nomenclaturas legadas.

## 2. Escopo permitido

- Ajustar breadcrumbs visuais.
- Ajustar titulos da pagina.
- Consolidar nomes de workspace.
- Corrigir labels que apontam para rotas equivalentes.

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

- [src/components/layout/PageHeader.tsx](/C:/Projects/FINQZ_PRO/src/components/layout/PageHeader.tsx)
- [src/layouts/MainLayout.tsx](/C:/Projects/FINQZ_PRO/src/layouts/MainLayout.tsx)
- [src/routes/crm.routes.tsx](/C:/Projects/FINQZ_PRO/src/routes/crm.routes.tsx)
- [src/routes/operacoes.routes.tsx](/C:/Projects/FINQZ_PRO/src/routes/operacoes.routes.tsx)
- [src/routes/admin.routes.tsx](/C:/Projects/FINQZ_PRO/src/routes/admin.routes.tsx)
- [src/routes/hub.routes.tsx](/C:/Projects/FINQZ_PRO/src/routes/hub.routes.tsx)

## 5. Ordem de execução

1. Mapear breadcrumbs atuais por rota.
2. Definir rotas canônicas para os blocos principais.
3. Padronizar labels de breadcrumb.
4. Remover ambiguidades entre alias e rota canonica.
5. Validar em desktop e mobile.

## 6. Checklist de implementação

- [ ] Breadcrumbs seguem a rota canonica.
- [ ] Nomes legados foram removidos do contexto visível.
- [ ] Pipeline e Oportunidades nao geram leitura duplicada.
- [ ] Aquisição de Parceiros aparece no contexto CRM.
- [ ] HUB e Operacoes nao se confundem no topo da pagina.

## 7. Checklist de validação

- [ ] Breadcrumb reflete o menu final.
- [ ] Breadcrumb funciona em paginas profundas.
- [ ] Breadcrumb não contradiz o nome do grupo de menu.
- [ ] Breadcrumb continua legível em responsividade reduzida.

## 8. Critérios de rollback

- Reverter a configuração de breadcrumbs sem alterar rotas.
- Manter os títulos originais caso a leitura fique confusa.
- Preservar a navegacao principal.

## 9. Riscos

- Títulos mais canonicos podem parecer menos familiares no curto prazo.
- Breadcrumbs profundos podem denunciar aliases remanescentes.
- Ajustes de contexto podem exigir refinamento visual.

## 10. Veredito final

**READY**
