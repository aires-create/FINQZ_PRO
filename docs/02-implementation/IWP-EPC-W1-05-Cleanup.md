# IWP-EPC-W1-05 - Cleanup

## 1. Objetivo

Remover o ruido de compatibilidade visual e de navegação que ainda faz superfícies LEGACY parecerem parte do menu canonico.

## 2. Escopo permitido

- Limpeza de aliases.
- Remoção de entradas redundantes da sidebar.
- Reclassificação visual de itens LEGACY e REMOVE.
- Ajuste de labels historicos.
- Higienização da leitura de navegação.

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
- [src/api/client.ts](/C:/Projects/FINQZ_PRO/src/api/client.ts)
- [src/data/catalogRepository.ts](/C:/Projects/FINQZ_PRO/src/data/catalogRepository.ts)
- [src/data/commercialRepository.ts](/C:/Projects/FINQZ_PRO/src/data/commercialRepository.ts)
- [src/pages/SdrIaHub.tsx](/C:/Projects/FINQZ_PRO/src/pages/SdrIaHub.tsx)
- [src/pages/Simulador.tsx](/C:/Projects/FINQZ_PRO/src/pages/Simulador.tsx)

## 5. Ordem de execução

1. Identificar redundancias visuais.
2. Classificar o que e LEGACY, REMOVE ou FUTURE.
3. Remover da exposicao primaria o que nao e canonical.
4. Preservar compatibilidade invisivel.
5. Validar impacto na experiencia.

## 6. Checklist de implementação

- [ ] Nenhum alias aparece como item principal sem necessidade.
- [ ] LEGACY foi reduzido à compatibilidade minima.
- [ ] REMOVE está explicitamente tratado.
- [ ] FUTURE está sinalizado como futuro.
- [ ] A navegação ficou menos poluída sem quebrar caminhos existentes.

## 7. Checklist de validação

- [ ] O menu ficou mais limpo.
- [ ] Os links legados continuam funcionando quando necessário.
- [ ] O usuário não vê dois caminhos para a mesma capacidade.
- [ ] O layout continua responsivo e legível.

## 8. Critérios de rollback

- Reativar itens removidos se houver regressão operacional.
- Reexibir aliases temporariamente.
- Preservar a estabilidade da interface.

## 9. Riscos

- A limpeza pode ser percebida como perda de atalhos.
- O time pode depender de algum alias invisível ainda não mapeado.
- A remoção visual pode expor dependência de documentação desatualizada.

## 10. Veredito final

**READY**
