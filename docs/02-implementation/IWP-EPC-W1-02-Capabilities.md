# IWP-EPC-W1-02 - Capabilities

## 1. Objetivo

Consolidar a leitura de capacidades no frontend para que o menu represente corretamente CRM, Operacoes, FINQZ HUB, Administracao e Core Platform.

## 2. Escopo permitido

- Ajustar rotulagem de capacidades no frontend.
- Reorganizar a leitura visual de capability ownership.
- Marcar capacidades READY, PARTIAL, LEGACY, REMOVE e FUTURE em documentação de execução.
- Preparar a interface para refletir o capability map oficial.

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

- [docs/05-prp/PRP-EPC-W1-ENTERPRISE-NAVIGATION-CONSOLIDATION.md](/C:/Projects/FINQZ_PRO/docs/05-prp/PRP-EPC-W1-ENTERPRISE-NAVIGATION-CONSOLIDATION.md)
- [src/auth/permissions.ts](/C:/Projects/FINQZ_PRO/src/auth/permissions.ts)
- [src/auth/permissionMatcher.ts](/C:/Projects/FINQZ_PRO/src/auth/permissionMatcher.ts)
- [src/api/modules/index.ts](/C:/Projects/FINQZ_PRO/src/api/modules/index.ts)
- [src/api/client.ts](/C:/Projects/FINQZ_PRO/src/api/client.ts)

## 5. Ordem de execução

1. Fixar o capability map de referência para o frontend.
2. Validar labels de menus por dominio.
3. Identificar capacidades com ownership parcial.
4. Sinalizar LEGACY e FUTURE na documentacao de execução.
5. Sincronizar a leitura com breadcrumbs e rotas.

## 6. Checklist de implementação

- [ ] Cada menu principal aponta para a capability correta.
- [ ] Capacidades PARTIAL estao claramente identificadas.
- [ ] Capacidades LEGACY nao parecem canônicas.
- [ ] Capacidades FUTURE nao estao tratadas como prontas.
- [ ] O mapa de permissions continua coerente com as rotas.

## 7. Checklist de validação

- [ ] O usuário reconhece o bloco funcional pela navegação.
- [ ] As capabilities críticas continuam acessíveis.
- [ ] Não há inversão de ownership entre CRM e Operacoes.
- [ ] FINQZ HUB aparece apenas nas capacidades realmente previstas.

## 8. Critérios de rollback

- Reverter apenas a apresentação de capability labels e agrupamentos.
- Manter as permissões e módulos intactos.
- Restaurar a leitura anterior se houver ruído de navegação.

## 9. Riscos

- O capability map pode expor excesso de granularidade ao usuário final.
- Pode haver leitura ambígua entre PARTIAL e FUTURE.
- A reclassificação visual pode exigir ajuste fino de nomenclatura.

## 10. Veredito final

**READY**

