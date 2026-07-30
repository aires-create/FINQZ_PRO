# IWP-EPC-W1-01 - Menu

## 1. Objetivo

Executar a consolidação da estrutura de menu enterprise do FINQZ PRO para aproximar a experiencia visual do mapa oficial definido pelo DCA e pelo PRP EPC-W1.

## 2. Escopo permitido

- Reordenar grupos da sidebar.
- Ajustar labels visuais.
- Remover duplicidade de itens exibidos.
- Reclassificar visualmente itens LEGACY, REMOVE e FUTURE.
- Ajustar icones e titulos do menu.
- Manter redirecionamentos tecnicos invisiveis quando necessarios.

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

- [src/layouts/MainLayout.tsx](/C:/Projects/FINQZ_PRO/src/layouts/MainLayout.tsx)
- [src/components/layout/PageHeader.tsx](/C:/Projects/FINQZ_PRO/src/components/layout/PageHeader.tsx)
- [src/routes/crm.routes.tsx](/C:/Projects/FINQZ_PRO/src/routes/crm.routes.tsx)
- [src/routes/operacoes.routes.tsx](/C:/Projects/FINQZ_PRO/src/routes/operacoes.routes.tsx)
- [src/routes/admin.routes.tsx](/C:/Projects/FINQZ_PRO/src/routes/admin.routes.tsx)
- [src/routes/hub.routes.tsx](/C:/Projects/FINQZ_PRO/src/routes/hub.routes.tsx)

## 5. Ordem de execução

1. Consolidar a ordem dos blocos principais.
2. Remover itens duplicados da navegação primaria.
3. Reclassificar itens FUTURE e LEGACY.
4. Ajustar labels e icones.
5. Validar responsividade da sidebar.

## 6. Checklist de implementação

- [ ] Sidebar segue a ordem Dashboard, CRM, Operacoes, FINQZ HUB, Administracao.
- [ ] Itens duplicados nao aparecem como blocos primarios.
- [ ] Aquisição de Parceiros aparece no bloco CRM.
- [ ] Item LEGACY nao compete visualmente com capacidade READY.
- [ ] Labels e icones estao alinhados ao dominio correto.
- [ ] Breadcrumbs e titulo da pagina nao geram leitura divergente.

## 7. Checklist de validação

- [ ] A navegação principal carrega sem erro.
- [ ] Os itens canônicos continuam visiveis.
- [ ] Rotas legadas continuam acessiveis via redirect tecnico.
- [ ] O menu mobile segue a mesma hierarquia do desktop.
- [ ] Nenhum bloco desapareceu por erro de permissao ou label.

## 8. Critérios de rollback

- Reverter apenas `MainLayout` e `PageHeader`.
- Restaurar o menu anterior se houver regressao visual ou de navegação.
- Preservar rotas e contratos existentes.

## 9. Riscos

- Alias removido pode afetar bookmark de usuario.
- Reordenação pode gerar estranhamento operacional inicial.
- Itens FUTURE podem parecer “sumidos” se não forem reclassificados com clareza.

## 10. Veredito final

**READY**
